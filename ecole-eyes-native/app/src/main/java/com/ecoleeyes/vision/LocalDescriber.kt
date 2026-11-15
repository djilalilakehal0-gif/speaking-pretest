package com.ecoleeyes.vision

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import kotlinx.coroutines.tasks.await

/**
 * On-device description of a photo: a short list of what ML Kit recognises (objects, scenes, colours of things).
 * It is rough and in English only, but it works with no internet and no backend. The assistant says so.
 */
class LocalDescriber {
    private val labeler by lazy { ImageLabeling.getClient(ImageLabelerOptions.Builder().setConfidenceThreshold(0.6f).build()) }

    suspend fun labels(bitmap: Bitmap, max: Int = 6): List<String> =
        labeler.process(InputImage.fromBitmap(bitmap, 0)).await()
            .sortedByDescending { it.confidence }.take(max).map { it.text.lowercase() }
}
