package com.ecoleeyes.docs

import com.ecoleeyes.core.Lang
import com.ecoleeyes.voice.DocType
import com.ecoleeyes.voice.Speaker
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeoutOrNull
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ReaderSessionTest {

    private class FakeSpeaker : Speaker {
        val spoken = ArrayList<String>()
        override val speaking: StateFlow<Boolean> = MutableStateFlow(false)
        private var interrupt = CompletableDeferred<Unit>()
        override suspend fun speak(text: String, lang: Lang): Boolean {
            spoken += text
            interrupt = CompletableDeferred()
            // each utterance "takes" 100 ms of virtual time unless stop() is called
            return withTimeoutOrNull(100) { interrupt.await() } == null
        }
        override fun stop() { interrupt.complete(Unit) }
        override fun setRate(rate: Float) {}
        override fun setVolume(volume: Float) {}
        override suspend fun hasVoice(lang: Lang) = true
        override fun shutdown() {}
    }

    private val file = DocFile("id1", "content://doc/1", "report.pdf", DocType.PDF, 0, 0, "")
    private val pages = listOf("Para 1a.\n\nPara 1b.", "Para 2a.\n\nPara 2b.", "Para 3a.")

    private fun session(scope: TestScope, speaker: FakeSpeaker, saved: MutableList<Pair<Int, Int>> = ArrayList(), errors: MutableList<Throwable> = ArrayList(), startPage: Int = 0, startPara: Int = 0, p: List<String> = pages) =
        ReaderSession(
            file, ListPages(p), scope, speaker, { Lang.EN },
            savePosition = { pg, pa -> saved += pg to pa },
            pageAnnouncement = { n, t -> "Page $n of $t." }, endAnnouncement = { "The end." },
            onError = { errors += it }, startPage = startPage, startParagraph = startPara,
        )

    @Test fun reads_everything_in_order_announces_pages_and_the_end() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp)
        s.start(); advanceUntilIdle()
        assertEquals(listOf("Page 1 of 3.", "Para 1a.", "Para 1b.", "Page 2 of 3.", "Para 2a.", "Para 2b.", "Page 3 of 3.", "Para 3a.", "The end."), sp.spoken)
        assertEquals(ReaderState.FINISHED, s.state.value)
    }

    @Test fun position_is_saved_after_every_paragraph_and_reset_at_the_end() = runTest {
        val saved = ArrayList<Pair<Int, Int>>()
        val s = session(this, FakeSpeaker(), saved); s.start(); advanceUntilIdle()
        assertEquals(listOf(0 to 1, 0 to 2, 1 to 0, 1 to 1, 1 to 2, 2 to 0, 2 to 1, 0 to 0), saved)
    }

    @Test fun pause_keeps_the_place_and_resume_repeats_the_interrupted_paragraph() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp)
        s.start(); testScheduler.advanceTimeBy(150); testScheduler.runCurrent()  // announcement done, "Para 1a." in progress
        assertEquals("Para 1a.", sp.spoken.last())
        s.pause(); advanceUntilIdle()
        assertEquals(ReaderState.PAUSED, s.state.value)
        assertEquals(0 to 0, s.position.value)
        sp.spoken.clear()
        s.resume(); advanceUntilIdle()
        assertEquals("Para 1a.", sp.spoken.first())   // nothing is skipped
        assertEquals(ReaderState.FINISHED, s.state.value)
    }

    @Test fun resumes_from_a_saved_position() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp, startPage = 1, startPara = 1)
        s.start(); advanceUntilIdle()
        assertEquals(listOf("Para 2b.", "Page 3 of 3.", "Para 3a.", "The end."), sp.spoken)
    }

    @Test fun next_and_previous_page() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp)
        s.start(); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertTrue(s.nextPage()); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertEquals(1, s.position.value.first)
        assertTrue(s.previousPage()); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertEquals(0, s.position.value.first)
        assertFalse(s.previousPage())            // already on the first page
        s.stop(); advanceUntilIdle()
    }

    @Test fun cannot_go_past_the_last_page_or_to_a_missing_page() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp, startPage = 2)
        s.start(); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertFalse(s.nextPage())
        assertFalse(s.goToPage(0)); assertFalse(s.goToPage(4))
        assertTrue(s.goToPage(2)); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertEquals(1, s.position.value.first)
        s.stop(); advanceUntilIdle()
    }

    @Test fun repeat_paragraph_rereads_the_one_just_read() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp)
        s.start(); testScheduler.advanceTimeBy(250); testScheduler.runCurrent()   // announcement + Para 1a done, Para 1b in progress
        sp.spoken.clear()
        s.repeatParagraph(); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertEquals("Para 1b.", sp.spoken.first())    // while reading: repeats the current paragraph
        s.pause(); advanceUntilIdle()
        sp.spoken.clear()
        s.repeatParagraph(); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        assertEquals("Para 1a.", sp.spoken.first())    // when paused: re-reads the last one heard
        s.stop(); advanceUntilIdle()
    }

    @Test fun skip_paragraph_moves_on() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp, p = listOf("One.\n\nTwo.\n\nThree."))
        s.start(); testScheduler.advanceTimeBy(50); testScheduler.runCurrent()
        s.skipParagraph(); advanceUntilIdle()
        assertEquals(listOf("One.", "Two.", "Three.", "The end."), sp.spoken.filter { it != "x" })
        assertEquals(ReaderState.FINISHED, s.state.value)
    }

    @Test fun errors_while_reading_are_reported_and_leave_the_reader_paused() = runTest {
        val errors = ArrayList<Throwable>()
        val bad = object : DocPages {
            override val count = 1; override val notes = emptySet<DocNote>()
            override suspend fun page(index: Int): String = throw IllegalStateException("ocr failed")
        }
        val s = ReaderSession(file, bad, this, FakeSpeaker(), { Lang.EN }, { _, _ -> }, { _, _ -> "" }, { "" }, { errors += it })
        s.start(); advanceUntilIdle()
        assertEquals(1, errors.size)
        assertEquals(ReaderState.PAUSED, s.state.value)
    }

    @Test fun single_page_documents_do_not_announce_page_numbers() = runTest {
        val sp = FakeSpeaker(); val s = session(this, sp, p = listOf("Only page."))
        s.start(); advanceUntilIdle()
        assertEquals(listOf("Only page.", "The end."), sp.spoken)
    }
}
