package com.ecoleeyes.vision

import com.ecoleeyes.ai.AiException
import com.ecoleeyes.core.Lang
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class VisionTest {

    // ---- change detection ----------------------------------------------------------------------------------------------

    private fun gray(f: (Int) -> Int) = IntArray(64) { f(it) }

    @Test fun same_picture_is_not_a_change_but_a_different_one_is() {
        val d = ChangeDetector(6)
        val a = ChangeDetector.averageHash(gray { if (it < 32) 20 else 220 })
        val aNoisy = ChangeDetector.averageHash(gray { if (it < 32) 25 else 215 })
        val b = ChangeDetector.averageHash(gray { if (it % 2 == 0) 20 else 220 })
        assertTrue(d.changed(a))            // first frame always analysed
        assertFalse(d.changed(aNoisy))      // sensor noise: skip
        assertTrue(d.changed(b))            // genuinely different scene
        d.reset()
        assertTrue(d.changed(b))
    }

    @Test fun a_very_slow_drift_is_still_caught_because_comparison_is_to_the_last_analysed_frame() {
        val d = ChangeDetector(6)
        assertTrue(d.changed(0L))
        var caught = false
        var h = 0L
        for (bit in 0 until 20) { h = h or (1L shl bit); if (d.changed(h)) caught = true }
        assertTrue(caught)
    }

    // ---- OCR decision logic ---------------------------------------------------------------------------------------------

    private fun local(text: String, conf: Float?) = suspend { OcrEngine.Local(text, conf) }
    private val neverCloud: suspend () -> String = { error("cloud must not be called") }

    @Test fun confident_on_device_text_is_used_without_the_cloud() = runTest {
        val r = OcrEngine.decide(Lang.EN, cloudUsable = true, local = local("Total due: 45.20", 0.93f), cloudRead = neverCloud)
        assertEquals("Total due: 45.20", r.text); assertFalse(r.usedCloud); assertFalse(r.uncertain)
    }

    @Test fun low_confidence_falls_back_to_the_cloud_when_allowed() = runTest {
        val r = OcrEngine.decide(Lang.FR, true, local("xq7 ?!", 0.3f)) { "Menu du jour" }
        assertEquals("Menu du jour", r.text); assertTrue(r.usedCloud)
    }

    @Test fun low_confidence_offline_returns_text_but_says_it_is_uncertain() = runTest {
        val r = OcrEngine.decide(Lang.EN, false, local("Mlk 2.5l", 0.4f), neverCloud)
        assertEquals("Mlk 2.5l", r.text); assertTrue(r.uncertain); assertFalse(r.usedCloud)
    }

    @Test fun nothing_found_offline_is_empty_not_invented() = runTest {
        val r = OcrEngine.decide(Lang.EN, false, local("", null), neverCloud)
        assertEquals("", r.text); assertFalse(r.uncertain)
    }

    @Test fun arabic_always_uses_the_cloud_because_on_device_ocr_cannot_read_it() = runTest {
        val r = OcrEngine.decide(Lang.AR, true, local("garbage", 0.9f)) { "مرحبا بكم" }
        assertEquals("مرحبا بكم", r.text); assertTrue(r.usedCloud)
    }

    @Test fun arabic_without_the_cloud_says_the_cloud_is_needed() = runTest {
        val r = OcrEngine.decide(Lang.AR, false, local("", null), neverCloud)
        assertTrue(r.needsCloud); assertEquals("", r.text)
    }

    @Test fun cloud_no_text_and_unclear_markers_are_understood() = runTest {
        assertEquals("", OcrEngine.decide(Lang.AR, true, local("", null)) { "NO_TEXT" }.text)
        assertTrue(OcrEngine.decide(Lang.EN, true, local("", null)) { "Dear [unclear] regards" }.uncertain)
        assertTrue(OcrEngine.decide(Lang.FR, true, local("", null)) { "Cher [illisible]" }.uncertain)
    }

    // ---- continuous assistance ------------------------------------------------------------------------------------------

    private class Rig(scope: TestScope, frames: List<Long>, answers: List<String>, speaking: () -> Boolean = { false }) {
        val spoken = ArrayList<String>()
        val described = ArrayList<String?>()
        var failure: Throwable? = null
        var calls = 0
        val assist: ContinuousAssist<Long>
        init {
            var f = 0; var a = 0
            assist = ContinuousAssist(
                scope = scope, intervalMs = { 1000 },
                capture = { frames[minOf(f++, frames.lastIndex)] },
                describe = { _, prev -> calls++; described += prev; val x = answers[minOf(a++, answers.lastIndex)]; if (x == "THROW_OFFLINE") throw AiException.Offline() else x },
                isSpeaking = speaking,
                speak = { spoken += it },
                onFailure = { failure = it },
                hash = { it }, toJpeg = { byteArrayOf(0) },
            )
        }
    }

    @Test fun only_changes_are_spoken_and_unchanged_frames_never_reach_the_ai() = runTest {
        // frames: A, A, A, B (very different), B  -> AI called for the first A and for B only
        val rig = Rig(this, listOf(0L, 0L, 0L, -1L, -1L), listOf("There are stairs ahead.", "A person is on your left."))
        rig.assist.start()
        advanceTimeBy(5500); runCurrent()
        rig.assist.stop()
        assertEquals(2, rig.calls)
        assertEquals(listOf("There are stairs ahead.", "A person is on your left."), rig.spoken)
        assertEquals(listOf(null, "There are stairs ahead."), rig.described)   // the previous description is passed along
    }

    @Test fun no_change_answers_are_not_spoken() = runTest {
        val rig = Rig(this, listOf(0L, -1L, 0L), listOf("NO_CHANGE", "no_change.", "Door ahead."))
        rig.assist.start(); advanceTimeBy(3500); runCurrent(); rig.assist.stop()
        assertEquals(listOf("Door ahead."), rig.spoken)
    }

    @Test fun it_waits_while_the_assistant_is_talking() = runTest {
        var talking = true
        val rig = Rig(this, listOf(0L, -1L), listOf("Chair ahead."), speaking = { talking })
        rig.assist.start(); advanceTimeBy(3500); runCurrent()
        assertEquals(0, rig.calls)
        talking = false; advanceTimeBy(1500); runCurrent(); rig.assist.stop()
        assertTrue(rig.calls >= 1)
    }

    @Test fun going_offline_stops_the_loop_and_reports_it() = runTest {
        val rig = Rig(this, listOf(0L, -1L), listOf("THROW_OFFLINE"))
        rig.assist.start(); advanceTimeBy(3500); runCurrent()
        assertTrue(rig.failure is AiException.Offline)
        assertFalse(rig.assist.active)
    }

    @Test fun stop_ends_the_loop() = runTest {
        val rig = Rig(this, listOf(0L, -1L, 0L, -1L), listOf("A.", "B.", "C.", "D."))
        rig.assist.start(); advanceTimeBy(1500); runCurrent(); rig.assist.stop()
        val n = rig.calls
        advanceTimeBy(10000); runCurrent()
        assertEquals(n, rig.calls)
        assertFalse(rig.assist.active)
    }
}
