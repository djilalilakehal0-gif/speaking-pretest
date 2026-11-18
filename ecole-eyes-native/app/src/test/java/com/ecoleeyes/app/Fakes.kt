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

/** Records every phone action instead of performing it. */
class FakeDevice : com.ecoleeyes.device.DeviceActions {
    var apps = listOf(
        com.ecoleeyes.device.InstalledApp("WhatsApp", "com.whatsapp"),
        com.ecoleeyes.device.InstalledApp("YouTube", "com.google.android.youtube"),
        com.ecoleeyes.device.InstalledApp("Maps", "com.google.android.apps.maps"),
        com.ecoleeyes.device.InstalledApp("Clock", "com.google.android.deskclock"),
    )
    var contacts = listOf(com.ecoleeyes.device.PhoneContact("Maman", "0555123456"), com.ecoleeyes.device.PhoneContact("Karim Benali", "+213661234567"))
    var notifAccess = false
    var notifications = emptyList<com.ecoleeyes.device.NotificationItem>()
    var battery: Int? = 76
    var charging = false
    var callOutcome = com.ecoleeyes.device.CallOutcome.CALLING
    var actionsWork = true
    val launched = ArrayList<String>()
    val alarms = ArrayList<com.ecoleeyes.device.ClockTime>()
    val timers = ArrayList<Int>()
    val calls = ArrayList<String>()
    val settingsOpened = ArrayList<com.ecoleeyes.device.SettingsKind>()
    var notifSettingsOpened = 0

    override fun launchableApps() = apps
    override fun launch(app: com.ecoleeyes.device.InstalledApp): Boolean { launched += app.packageName; return actionsWork }
    override fun setAlarm(time: com.ecoleeyes.device.ClockTime, label: String?): Boolean { alarms += time; return actionsWork }
    override fun setTimer(seconds: Int, label: String?): Boolean { timers += seconds; return actionsWork }
    override fun call(number: String): com.ecoleeyes.device.CallOutcome { calls += number; return callOutcome }
    override suspend fun contacts() = contacts
    override fun batteryPercent() = battery
    override fun isCharging() = charging
    override fun openSystemSettings(kind: com.ecoleeyes.device.SettingsKind): Boolean { settingsOpened += kind; return actionsWork }
    override fun notificationAccessGranted() = notifAccess
    override fun openNotificationAccessSettings(): Boolean { notifSettingsOpened++; return true }
    override fun recentNotifications() = notifications
}
