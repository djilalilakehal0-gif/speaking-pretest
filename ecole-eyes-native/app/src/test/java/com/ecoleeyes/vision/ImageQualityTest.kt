package com.ecoleeyes.vision

import org.junit.Assert.assertEquals
import org.junit.Test

class ImageQualityTest {
    @Test fun black_and_near_black_photos_are_too_dark() {
        assertEquals(ImageQuality.Verdict.TOO_DARK, ImageQuality.assess(IntArray(1024) { 0 }))
        assertEquals(ImageQuality.Verdict.TOO_DARK, ImageQuality.assess(IntArray(1024) { 12 }))
    }

    @Test fun a_dim_room_with_a_lit_object_is_not_rejected() {
        // mostly dark but with a bright region (a lamp, a screen): a model can still describe it
        assertEquals(ImageQuality.Verdict.OK, ImageQuality.assess(IntArray(1024) { if (it < 200) 200 else 10 }))
    }

    @Test fun normal_photos_pass() {
        assertEquals(ImageQuality.Verdict.OK, ImageQuality.assess(IntArray(1024) { 90 + it % 60 }))
        assertEquals(ImageQuality.Verdict.OK, ImageQuality.assess(IntArray(0)))
    }
}
