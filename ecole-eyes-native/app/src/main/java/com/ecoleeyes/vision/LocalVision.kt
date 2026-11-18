package com.ecoleeyes.vision

import android.graphics.Bitmap
import android.graphics.Rect
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

/** On-device scene understanding. Works with no network at all. */
interface LocalVision {
    suspend fun analyze(bmp: Bitmap): LocalScene
    suspend fun color(bmp: Bitmap): ColorNamer.ColorResult
}

/**
 * ML Kit implementation. All three models are *bundled* in the APK (not downloaded through Play services), so
 * they are available on first launch, offline, and on phones without Google services.
 *
 * Pipeline: object detector (boxes, up to 5) -> image labeler on each crop (specific names like "Chair") ->
 * labeler on the whole picture (context) -> face detector (people count and position; no recognition).
 * Frames are analysed only when the user asks, never continuously, to save battery.
 */
class MlKitVision : LocalVision {
    private val objects by lazy {
        ObjectDetection.getClient(
            ObjectDetectorOptions.Builder()
                .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
                .enableMultipleObjects()
                .enableClassification()
                .build(),
        )
    }
    private val labeler by lazy { ImageLabeling.getClient(ImageLabelerOptions.Builder().setConfidenceThreshold(0.55f).build()) }
    private val faces by lazy {
        FaceDetection.getClient(
            FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .setMinFaceSize(0.06f)
                .build(),
        )
    }

    override suspend fun analyze(bmp: Bitmap): LocalScene = withContext(Dispatchers.Default) {
        if (ImageQuality.assess(bmp) == ImageQuality.Verdict.TOO_DARK) return@withContext LocalScene(emptyList(), emptyList(), emptyList(), tooDark = true)
        val small = ImageUtil.scaleDown(bmp, 960)
        val w = small.width.toFloat(); val h = small.height.toFloat()
        val image = InputImage.fromBitmap(small, 0)
        fun norm(r: Rect) = NBox((r.left / w).coerceIn(0f, 1f), (r.top / h).coerceIn(0f, 1f), (r.right / w).coerceIn(0f, 1f), (r.bottom / h).coerceIn(0f, 1f))

        val detected = runCatching { objects.process(image).await() }.getOrDefault(emptyList())
        val found = detected.take(5).map { d ->
            val crop = crop(small, d.boundingBox)
            val cropLabels = crop?.let { c -> runCatching { labeler.process(InputImage.fromBitmap(c, 0)).await() }.getOrNull() }.orEmpty()
            // Prefer a specific crop label we can translate, then any crop label, then the detector's coarse class.
            val best = cropLabels.firstOrNull { LabelDictionary.knows(it.text) && it.confidence >= 0.6f } ?: cropLabels.firstOrNull { it.confidence >= 0.7f }
            val coarse = d.labels.maxByOrNull { it.confidence }
            when {
                best != null -> LocalObject(best.text, best.confidence, norm(d.boundingBox))
                coarse != null && coarse.confidence >= 0.5f -> LocalObject(coarse.text, coarse.confidence, norm(d.boundingBox))
                else -> LocalObject(null, 0f, norm(d.boundingBox))
            }
        }
        val labels = runCatching { labeler.process(image).await() }.getOrDefault(emptyList()).map { it.text to it.confidence }
        val faceBoxes = runCatching { faces.process(image).await() }.getOrDefault(emptyList()).map { norm(it.boundingBox) }
        LocalScene(found, labels, faceBoxes)
    }

    override suspend fun color(bmp: Bitmap): ColorNamer.ColorResult = withContext(Dispatchers.Default) {
        val small = ImageUtil.scaleDown(bmp, 160)
        val px = IntArray(small.width * small.height)
        small.getPixels(px, 0, small.width, 0, 0, small.width, small.height)
        ColorNamer.analyze(px, small.width, small.height)
    }

    private fun crop(src: Bitmap, r: Rect): Bitmap? {
        val l = r.left.coerceIn(0, src.width - 1); val t = r.top.coerceIn(0, src.height - 1)
        val cw = (r.right.coerceIn(0, src.width) - l); val ch = (r.bottom.coerceIn(0, src.height) - t)
        if (cw < 24 || ch < 24) return null
        return Bitmap.createBitmap(src, l, t, cw, ch)
    }
}
