package com.ecoleeyes.vision

import android.graphics.Bitmap
import com.ecoleeyes.core.Lang
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.tasks.await

/** Cloud transcription for what on-device OCR cannot read (Arabic script, handwriting). */
fun interface CloudTranscriber {
    suspend fun transcribe(jpeg: ByteArray, lang: Lang): String
}

data class OcrOutcome(
    val text: String,
    /** Mean line confidence 0..1 when known. */
    val confidence: Float?,
    val usedCloud: Boolean,
    /** True when the text may be wrong or incomplete: the assistant says so. */
    val uncertain: Boolean,
    /** True when the language needs the cloud assistant but it was not available. */
    val needsCloud: Boolean = false,
)

/**
 * Reads text from images. ML Kit's on-device model reads Latin scripts (French, English, numbers)
 * offline. It cannot read Arabic script or most handwriting, so those use the cloud transcriber
 * when the user has allowed it - and the assistant says clearly when it cannot.
 */
class OcrEngine(private val cloud: CloudTranscriber?) {
    private val recognizer by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }

    data class Local(val text: String, val confidence: Float?)

    suspend fun recognizeLocal(bitmap: Bitmap): Local {
        val result = recognizer.process(InputImage.fromBitmap(bitmap, 0)).await()
        val lines = result.textBlocks.flatMap { it.lines }
        val conf = lines.mapNotNull { it.confidence.takeIf { c -> c > 0f } }.let { if (it.isEmpty()) null else it.average().toFloat() }
        return Local(result.textBlocks.joinToString("\n") { it.text }.trim(), conf)
    }

    suspend fun read(bitmap: Bitmap, lang: Lang, cloudAllowed: Boolean, cloudReachable: Boolean): OcrOutcome =
        decide(lang, cloudAllowed && cloudReachable && cloud != null,
            local = { recognizeLocal(bitmap) },
            cloudRead = { cloud!!.transcribe(ImageUtil.toJpeg(bitmap, 1600, 85), lang) })

    companion object {
        private const val GOOD_CONFIDENCE = 0.65f

        /** Pure decision logic (unit-tested): when to trust on-device OCR and when to ask the cloud. */
        suspend fun decide(
            lang: Lang,
            cloudUsable: Boolean,
            local: suspend () -> Local,
            cloudRead: suspend () -> String,
        ): OcrOutcome {
            if (lang == Lang.AR) {
                if (cloudUsable) return fromCloud(cloudRead())
                val l = runCatching { local() }.getOrNull()
                return OcrOutcome(l?.text.orEmpty(), l?.confidence, usedCloud = false, uncertain = true, needsCloud = true)
            }
            val l = local()
            val good = l.text.length >= 3 && (l.confidence ?: 1f) >= GOOD_CONFIDENCE
            if (good) return OcrOutcome(l.text, l.confidence, usedCloud = false, uncertain = false)
            if (cloudUsable) {
                val c = fromCloud(cloudRead())
                if (c.text.isNotEmpty()) return c
            }
            return OcrOutcome(l.text, l.confidence, usedCloud = false, uncertain = l.text.isNotEmpty(), needsCloud = false)
        }

        private fun fromCloud(raw: String): OcrOutcome {
            val t = raw.trim()
            val none = t.isEmpty() || t.equals("NO_TEXT", ignoreCase = true)
            val unclear = t.contains("[unclear]") || t.contains("[illisible]") || t.contains("[غير واضح]")
            return OcrOutcome(if (none) "" else t, null, usedCloud = true, uncertain = unclear)
        }
    }
}
