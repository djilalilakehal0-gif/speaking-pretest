package com.ecoleeyes.vision

import com.ecoleeyes.ai.AiException
import com.ecoleeyes.ai.Prompt
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * "Stay with me and describe what changes." Looks at the camera every few seconds, but only calls the
 * AI when the picture has really changed and the assistant is not already talking.
 */
class ContinuousAssist<F>(
    private val scope: CoroutineScope,
    private val intervalMs: () -> Long,
    private val capture: suspend () -> F,
    private val describe: suspend (jpeg: ByteArray, previous: String?) -> String,
    private val isSpeaking: () -> Boolean,
    private val speak: suspend (String) -> Unit,
    private val onFailure: suspend (Throwable) -> Unit,
    private val hash: (F) -> Long,
    private val toJpeg: (F) -> ByteArray,
    private val detector: ChangeDetector = ChangeDetector(),
) {
    private var job: Job? = null
    val active: Boolean get() = job?.isActive == true

    fun start() {
        if (active) return
        detector.reset()
        job = scope.launch {
            var previous: String? = null
            var failures = 0
            while (isActive) {
                delay(intervalMs())
                if (isSpeaking()) continue
                try {
                    val frame = capture()
                    if (!detector.changed(hash(frame))) continue
                    val answer = describe(toJpeg(frame), previous).trim()
                    failures = 0
                    if (answer.isEmpty() || answer.uppercase().contains(Prompt.NO_CHANGE)) continue
                    previous = answer
                    speak(answer)
                } catch (e: kotlinx.coroutines.CancellationException) {
                    throw e
                } catch (e: Exception) {
                    failures++
                    val fatal = e is AiException.Offline || e is AiException.Unauthorized || e is AiException.NotConfigured
                    if (fatal || failures >= 3) { onFailure(e); break }
                }
            }
        }
    }

    fun stop() { job?.cancel(); job = null }
}
