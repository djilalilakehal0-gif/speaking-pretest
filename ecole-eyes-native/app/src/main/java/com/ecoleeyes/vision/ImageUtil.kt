package com.ecoleeyes.vision

import android.graphics.Bitmap
import android.graphics.Matrix
import java.io.ByteArrayOutputStream

object ImageUtil {
    /** Shrinks the photo (privacy + bandwidth) and encodes it as JPEG. */
    fun toJpeg(src: Bitmap, maxSide: Int = 1280, quality: Int = 80): ByteArray {
        val scale = maxSide.toFloat() / maxOf(src.width, src.height)
        val bmp = if (scale < 1f) Bitmap.createScaledBitmap(src, (src.width * scale).toInt(), (src.height * scale).toInt(), true) else src
        val out = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.JPEG, quality, out)
        if (bmp !== src) bmp.recycle()
        return out.toByteArray()
    }

    /** Returns [src] itself if already small enough, otherwise a scaled copy whose longest side is [maxSide]. */
    fun scaleDown(src: Bitmap, maxSide: Int): Bitmap {
        val scale = maxSide.toFloat() / maxOf(src.width, src.height)
        if (scale >= 1f) return src
        return Bitmap.createScaledBitmap(src, maxOf(1, (src.width * scale).toInt()), maxOf(1, (src.height * scale).toInt()), true)
    }

    fun rotate(src: Bitmap, degrees: Int): Bitmap {
        if (degrees == 0) return src
        val m = Matrix().apply { postRotate(degrees.toFloat()) }
        return Bitmap.createBitmap(src, 0, 0, src.width, src.height, m, true)
    }

    /** 64-bit perceptual "average hash" of a bitmap, used to skip frames that have not really changed. */
    fun averageHash(src: Bitmap): Long {
        val small = Bitmap.createScaledBitmap(src, 8, 8, true)
        val px = IntArray(64)
        small.getPixels(px, 0, 8, 0, 0, 8, 8)
        small.recycle()
        return ChangeDetector.averageHash(IntArray(64) { i ->
            val p = px[i]
            ((p shr 16 and 0xFF) * 299 + (p shr 8 and 0xFF) * 587 + (p and 0xFF) * 114) / 1000
        })
    }
}

/** Decides whether a new frame differs enough from the last analysed one to be worth sending to the AI. */
class ChangeDetector(private val maxDistance: Int = 6) {
    private var last: Long? = null

    /** True (and remembers [hash]) if it differs from the last analysed frame. */
    fun changed(hash: Long): Boolean {
        val l = last
        if (l == null || java.lang.Long.bitCount(l xor hash) > maxDistance) { last = hash; return true }
        return false
    }

    fun reset() { last = null }

    companion object {
        /** [gray] holds 64 luminance values (8x8). */
        fun averageHash(gray: IntArray): Long {
            require(gray.size == 64)
            val mean = gray.average()
            var h = 0L
            for (i in 0 until 64) if (gray[i] > mean) h = h or (1L shl i)
            return h
        }
    }
}
