package com.ecoleeyes.voice

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.ecoleeyes.core.Lang
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume

/** [SpeechListener] backed by Android's SpeechRecognizer. Must be driven from any dispatcher; it hops to Main itself. */
class AndroidSpeechListener(private val context: Context) : SpeechListener {

    override fun isAvailable(): Boolean = SpeechRecognizer.isRecognitionAvailable(context)

    override suspend fun listen(
        lang: Lang,
        preferOffline: Boolean,
        onSpeechStart: () -> Unit,
        onPartial: (String) -> Unit,
    ): SttResult = withContext<SttResult>(Dispatchers.Main.immediate) {
        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            return@withContext SttResult.Failed(SttError.NO_PERMISSION)
        }
        if (!isAvailable()) return@withContext SttResult.Failed(SttError.UNAVAILABLE)

        suspendCancellableCoroutine<SttResult> { cont ->
            val recognizer = createRecognizer(preferOffline)
            if (recognizer == null) {
                cont.resume(SttResult.Failed(SttError.UNAVAILABLE)); return@suspendCancellableCoroutine
            }
            var finished = false
            fun finish(r: SttResult) {
                if (finished) return
                finished = true
                runCatching { recognizer.destroy() }
                if (cont.isActive) cont.resume(r)
            }
            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {}
                override fun onBeginningOfSpeech() = onSpeechStart()
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
                override fun onPartialResults(partialResults: Bundle?) {
                    partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let(onPartial)
                }
                override fun onResults(results: Bundle?) {
                    val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION).orEmpty()
                    val best = list.firstOrNull()?.trim().orEmpty()
                    finish(if (best.isEmpty()) SttResult.Failed(SttError.NO_SPEECH) else SttResult.Heard(best, list.drop(1)))
                }
                override fun onError(error: Int) = finish(SttResult.Failed(mapError(error)))
            })
            cont.invokeOnCancellation {
                finished = true
                // Cancellation can come from any thread; the recognizer must be touched on Main.
                android.os.Handler(android.os.Looper.getMainLooper()).post { runCatching { recognizer.cancel(); recognizer.destroy() } }
            }
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang.tag)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang.tag)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, preferOffline)
                putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
            }
            recognizer.startListening(intent)
        }
    }

    private fun createRecognizer(preferOffline: Boolean): SpeechRecognizer? = try {
        if (preferOffline && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
        ) SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
        else SpeechRecognizer.createSpeechRecognizer(context)
    } catch (e: Exception) { null }

    companion object {
        fun mapError(code: Int): SttError = when (code) {
            SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> SttError.NO_SPEECH
            SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT, SpeechRecognizer.ERROR_SERVER -> SttError.NETWORK
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> SttError.BUSY
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> SttError.NO_PERMISSION
            12, 13 -> SttError.LANGUAGE_UNSUPPORTED // ERROR_LANGUAGE_NOT_SUPPORTED / UNAVAILABLE (API 31)
            else -> SttError.OTHER
        }
    }
}
