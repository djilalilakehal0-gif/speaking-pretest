package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang
import kotlinx.coroutines.flow.StateFlow

/** Thrown when speech output cannot work (no engine, missing voice data). */
class SpeechOutputException(val reason: Reason, val lang: Lang? = null, cause: Throwable? = null) : Exception(reason.name, cause) {
    enum class Reason { NO_ENGINE, VOICE_MISSING, FAILED }
}

/**
 * Speech output abstraction. [AndroidSpeaker] uses the phone's TextToSpeech engine; a premium
 * neural-voice provider (e.g. a cloud voice API) can implement the same interface.
 */
interface Speaker {
    val speaking: StateFlow<Boolean>

    /** Speaks sentence by sentence. Returns true if it finished, false if it was interrupted by [stop]. */
    suspend fun speak(text: String, lang: Lang): Boolean

    /** Silences immediately, including anything queued. */
    fun stop()

    fun setRate(rate: Float)
    fun setVolume(volume: Float)
    suspend fun hasVoice(lang: Lang): Boolean
    fun shutdown()
}

/** Splits text into sentence-sized chunks so playback starts quickly and can be interrupted between sentences. */
object SentenceSplitter {
    private const val MAX_CHUNK = 320
    private val boundary = Regex("(?<=[.!?؟…。])\\s+|\\n+")

    fun split(text: String): List<String> {
        val out = ArrayList<String>()
        for (part in boundary.split(text.trim())) {
            var s = part.trim()
            if (s.isEmpty()) continue
            while (s.length > MAX_CHUNK) {
                var cut = s.lastIndexOfAny(charArrayOf(',', ';', '،', ':', ' '), MAX_CHUNK)
                if (cut <= 0) cut = MAX_CHUNK
                out += s.substring(0, cut + if (cut < MAX_CHUNK) 1 else 0).trim()
                s = s.substring(cut + if (cut < MAX_CHUNK) 1 else 0).trim()
            }
            if (s.isNotEmpty()) out += s
        }
        return out
    }
}
