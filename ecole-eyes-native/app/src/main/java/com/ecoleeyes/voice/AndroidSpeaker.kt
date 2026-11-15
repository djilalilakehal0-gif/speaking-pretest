package com.ecoleeyes.voice

import android.content.Context
import android.media.AudioAttributes
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.ecoleeyes.core.Lang
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.UUID
import java.util.concurrent.atomic.AtomicInteger

/** Android TextToSpeech implementation of [Speaker]. */
class AndroidSpeaker(private val context: Context) : Speaker {

    private val _speaking = MutableStateFlow(false)
    override val speaking: StateFlow<Boolean> = _speaking.asStateFlow()

    private val ready = CompletableDeferred<Boolean>()
    @Volatile private var rate = 1.0f
    @Volatile private var volume = 1.0f
    private val mutex = Mutex()
    private val pending = AtomicInteger(0)
    @Volatile private var current: CompletableDeferred<Boolean>? = null
    @Volatile private var failure: Boolean = false

    private val tts: TextToSpeech = TextToSpeech(context.applicationContext) { status ->
        ready.complete(status == TextToSpeech.SUCCESS)
    }.also {
        it.setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANT)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
        )
        it.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) = finished(utteranceId, ok = true)
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) = finished(utteranceId, ok = false)
            override fun onError(utteranceId: String?, errorCode: Int) = finished(utteranceId, ok = false)
            override fun onStop(utteranceId: String?, interrupted: Boolean) = finished(utteranceId, ok = null)
        })
    }

    private fun finished(id: String?, ok: Boolean?) {
        if (ok == false) failure = true
        if (id != null && id.endsWith(LAST_SUFFIX)) {
            current?.complete(ok != null)
        } else if (ok == null) {
            current?.complete(false)   // interrupted mid-text
        }
    }

    override fun setRate(rate: Float) { this.rate = rate.coerceIn(0.5f, 2.0f) }
    override fun setVolume(volume: Float) { this.volume = volume.coerceIn(0.1f, 1.0f) }

    override suspend fun hasVoice(lang: Lang): Boolean {
        if (!ready.await()) return false
        val r = tts.isLanguageAvailable(lang.locale)
        return r >= TextToSpeech.LANG_AVAILABLE
    }

    override suspend fun speak(text: String, lang: Lang): Boolean = mutex.withLock {
        if (!ready.await()) throw SpeechOutputException(SpeechOutputException.Reason.NO_ENGINE)
        val chunks = SentenceSplitter.split(text)
        if (chunks.isEmpty()) return true
        val r = tts.setLanguage(lang.locale)
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            throw SpeechOutputException(SpeechOutputException.Reason.VOICE_MISSING, lang)
        }
        tts.setSpeechRate(rate)
        val done = CompletableDeferred<Boolean>()
        current = done
        failure = false
        pending.set(chunks.size)
        _speaking.value = true
        val batch = UUID.randomUUID().toString()
        try {
            chunks.forEachIndexed { i, chunk ->
                val last = i == chunks.lastIndex
                val params = Bundle().apply { putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume) }
                val id = batch + "-" + i + if (last) LAST_SUFFIX else ""
                val res = tts.speak(chunk, if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD, params, id)
                if (res != TextToSpeech.SUCCESS) throw SpeechOutputException(SpeechOutputException.Reason.FAILED, lang)
            }
            val completed = done.await()
            if (failure) throw SpeechOutputException(SpeechOutputException.Reason.FAILED, lang)
            completed
        } finally {
            // Also runs on coroutine cancellation: never leave the engine talking after its owner is gone.
            withContext(NonCancellable + Dispatchers.Main.immediate) {
                if (!done.isCompleted) tts.stop()
            }
            current = null
            _speaking.value = false
        }
    }

    override fun stop() {
        tts.stop()
        current?.complete(false)
    }

    override fun shutdown() {
        tts.stop()
        tts.shutdown()
    }

    private companion object { const val LAST_SUFFIX = "-last" }
}
