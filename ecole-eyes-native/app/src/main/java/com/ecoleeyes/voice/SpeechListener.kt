package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang

enum class SttError { NO_PERMISSION, NO_SPEECH, NETWORK, BUSY, UNAVAILABLE, LANGUAGE_UNSUPPORTED, OTHER }

sealed interface SttResult {
    data class Heard(val text: String, val alternatives: List<String> = emptyList()) : SttResult
    data class Failed(val error: SttError) : SttResult
}

/** Speech-to-text abstraction (one utterance at a time). */
interface SpeechListener {
    /**
     * Listens for one utterance. [onSpeechStart] fires when the user begins talking (used to pause
     * speech output), [onPartial] receives interim text. Cancelling the coroutine stops listening.
     */
    suspend fun listen(
        lang: Lang,
        preferOffline: Boolean,
        onSpeechStart: () -> Unit = {},
        onPartial: (String) -> Unit = {},
    ): SttResult

    fun isAvailable(): Boolean
}
