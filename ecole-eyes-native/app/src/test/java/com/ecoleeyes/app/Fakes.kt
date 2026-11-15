package com.ecoleeyes.app

import com.ecoleeyes.ai.AiClient
import com.ecoleeyes.ai.AiException
import com.ecoleeyes.ai.AiRequest
import com.ecoleeyes.ai.AiResponse
import com.ecoleeyes.ai.Blocks
import com.ecoleeyes.core.Lang
import com.ecoleeyes.voice.SpeechListener
import com.ecoleeyes.voice.Speaker
import com.ecoleeyes.voice.SttResult
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** Speaks instantly and remembers everything said, in which language. */
class RecordingSpeaker : Speaker {
    val said = ArrayList<Pair<String, Lang>>()
    var stops = 0
    override val speaking: StateFlow<Boolean> = MutableStateFlow(false)
    override suspend fun speak(text: String, lang: Lang): Boolean { said += text to lang; return true }
    override fun stop() { stops++ }
    override fun setRate(rate: Float) {}
    override fun setVolume(volume: Float) {}
    override suspend fun hasVoice(lang: Lang) = true
    override fun shutdown() {}
    val texts get() = said.map { it.first }
}

/** Returns queued results one by one; when the queue is empty it waits (like a silent microphone). */
class ScriptedListener : SpeechListener {
    val queue = ArrayDeque<SttResult>()
    var calls = 0
    override suspend fun listen(lang: Lang, preferOffline: Boolean, onSpeechStart: () -> Unit, onPartial: (String) -> Unit): SttResult {
        calls++
        return queue.removeFirstOrNull() ?: awaitCancellation()
    }
    override fun isAvailable() = true
    fun hear(text: String) = apply { queue += SttResult.Heard(text) }
}

class ScriptedAi(private val responses: MutableList<() -> AiResponse> = ArrayList()) : AiClient {
    val requests = ArrayList<AiRequest>()
    fun reply(text: String) = apply { responses += { AiResponse(listOf(Blocks.text(text)), "end_turn") } }
    fun fail(e: AiException) = apply { responses += { throw e } }
    fun toolCall(name: String, input: JsonObject = buildJsonObject {}) = apply {
        responses += { AiResponse(listOf(buildJsonObject { put("type", "tool_use"); put("id", "tu_1"); put("name", name); put("input", input) }), "tool_use") }
    }
    override suspend fun complete(request: AiRequest): AiResponse { requests += request; return responses.removeFirst().invoke() }
}
