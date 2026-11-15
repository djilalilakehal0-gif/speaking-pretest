package com.ecoleeyes.docs

import com.ecoleeyes.core.Lang
import com.ecoleeyes.voice.SpeechOutputException
import com.ecoleeyes.voice.Speaker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class ReaderState { IDLE, READING, PAUSED, FINISHED }

/**
 * Reads a document aloud paragraph by paragraph. Position (page + paragraph) is remembered and saved
 * after each paragraph so "continue" resumes exactly where reading stopped, even after the app is closed.
 */
class ReaderSession(
    val file: DocFile,
    val pages: DocPages,
    private val scope: CoroutineScope,
    private val speaker: Speaker,
    private val lang: () -> Lang,
    private val savePosition: suspend (page: Int, paragraph: Int) -> Unit,
    private val pageAnnouncement: (page: Int, total: Int) -> String,
    private val endAnnouncement: () -> String,
    private val onError: suspend (Throwable) -> Unit,
    startPage: Int = 0,
    startParagraph: Int = 0,
) {
    private val _state = MutableStateFlow(ReaderState.IDLE)
    val state: StateFlow<ReaderState> = _state.asStateFlow()
    private val _position = MutableStateFlow(startPage.coerceIn(0, (pages.count - 1).coerceAtLeast(0)) to startParagraph)
    /** (page, paragraph), both 0-based. */
    val position: StateFlow<Pair<Int, Int>> = _position.asStateFlow()

    val pageNumber: Int get() = _position.value.first + 1
    val pageCount: Int get() = pages.count
    private var job: Job? = null
    private var announcePage = true
    private val cache = LinkedHashMap<Int, List<String>>()

    private suspend fun paragraphsOf(page: Int): List<String> {
        cache[page]?.let { return it }
        val p = Paginator.paragraphs(pages.page(page))
        cache[page] = p
        if (cache.size > 4) cache.remove(cache.keys.first())
        return p
    }

    /** Starts (or restarts) reading from the current position. */
    fun start() {
        job?.cancel()
        speaker.stop()
        _state.value = ReaderState.READING
        job = scope.launch {
            try {
                while (true) {
                    val (page, startPara) = _position.value
                    if (page >= pages.count) { finish(); return@launch }
                    val paras = paragraphsOf(page)
                    if (announcePage && pages.count > 1 && startPara == 0) {
                        if (!speaker.speak(pageAnnouncement(page + 1, pages.count), lang())) { _state.value = ReaderState.PAUSED; return@launch }
                    }
                    announcePage = true
                    var para = startPara
                    while (para < paras.size) {
                        _position.value = page to para
                        if (!speaker.speak(paras[para], lang())) { _state.value = ReaderState.PAUSED; savePosition(page, para); return@launch }
                        para++
                        _position.value = page to para
                        savePosition(page, para)
                    }
                    if (page + 1 >= pages.count) { finish(); return@launch }
                    _position.value = page + 1 to 0
                    savePosition(page + 1, 0)
                }
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Throwable) {
                _state.value = ReaderState.PAUSED
                onError(e)
            }
        }
    }

    private suspend fun finish() {
        _state.value = ReaderState.FINISHED
        _position.value = (pages.count - 1).coerceAtLeast(0) to 0
        savePosition(0, 0)
        runCatching { speaker.speak(endAnnouncement(), lang()) }
    }

    fun pause() {
        if (_state.value != ReaderState.READING) return
        job?.cancel(); speaker.stop(); _state.value = ReaderState.PAUSED
    }

    fun resume() {
        if (_state.value == ReaderState.READING) return
        if (_state.value == ReaderState.FINISHED) _position.value = 0 to 0 else announcePage = false
        start()
    }

    fun stop() { job?.cancel(); speaker.stop(); _state.value = ReaderState.PAUSED }

    /** Returns false if already at the last page. */
    fun nextPage(): Boolean {
        val p = _position.value.first
        if (p + 1 >= pages.count) return false
        _position.value = p + 1 to 0; start(); return true
    }

    /** Returns false if already at the first page. */
    fun previousPage(): Boolean {
        val p = _position.value.first
        if (p <= 0) return false
        _position.value = p - 1 to 0; start(); return true
    }

    /** Returns false if [page] (1-based) does not exist. */
    fun goToPage(page: Int): Boolean {
        if (page < 1 || page > pages.count) return false
        _position.value = page - 1 to 0; start(); return true
    }

    /** Re-reads the paragraph that was just read (or the one being read). */
    fun repeatParagraph() {
        val (p, para) = _position.value
        val target = if (_state.value == ReaderState.READING) para else maxOf(0, para - 1)
        _position.value = p to target
        announcePage = false
        start()
    }

    fun skipParagraph() {
        val (p, para) = _position.value
        _position.value = p to para + 1
        announcePage = false
        start()
    }

    /** Text of the page being read, for the AI to summarize. */
    suspend fun textOfPage(page: Int): String = pages.page(page.coerceIn(0, pages.count - 1))

    fun close() { job?.cancel(); speaker.stop(); pages.close() }
}
