package com.ecoleeyes.vision

import android.graphics.Bitmap

/** Cheap on-device check so the assistant can say "too dark" instead of sending (or guessing from) a black photo. */
object ImageQuality {
    enum class Verdict { OK, TOO_DARK }

    /** [luma] holds luminance values 0..255 of a small thumbnail. */
    fun assess(luma: IntArray): Verdict {
        if (luma.isEmpty()) return Verdict.OK
        val sorted = luma.sorted()
        val mean = luma.average()
        val p95 = sorted[(sorted.size * 95 / 100).coerceAtMost(sorted.lastIndex)]
        return if (mean < 22 && p95 < 50) Verdict.TOO_DARK else Verdict.OK
    }

    fun assess(bitmap: Bitmap): Verdict {
        val small = Bitmap.createScaledBitmap(bitmap, 32, 32, true)
        val px = IntArray(32 * 32)
        small.getPixels(px, 0, 32, 0, 0, 32, 32)
        small.recycle()
        return assess(IntArray(px.size) { i ->
            val p = px[i]
            ((p shr 16 and 0xFF) * 299 + (p shr 8 and 0xFF) * 587 + (p and 0xFF) * 114) / 1000
        })
    }
}
