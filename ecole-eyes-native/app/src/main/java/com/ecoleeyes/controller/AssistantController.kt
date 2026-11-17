package com.ecoleeyes.controller

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import androidx.annotation.PluralsRes
import androidx.annotation.StringRes
import androidx.core.content.ContextCompat
import com.ecoleeyes.a11y.Feedback
import com.ecoleeyes.ai.AiException
import com.ecoleeyes.ai.AssistantBrain
import com.ecoleeyes.ai.BrainContext
import com.ecoleeyes.ai.Prompt
import com.ecoleeyes.ai.ToolExecutor
import com.ecoleeyes.ai.ToolOutput
import com.ecoleeyes.ai.Tools
import com.ecoleeyes.ai.bool
import com.ecoleeyes.ai.int
import com.ecoleeyes.ai.str
import com.ecoleeyes.app.R
import com.ecoleeyes.core.AppSettings
import com.ecoleeyes.core.Connectivity
import com.ecoleeyes.core.Consent
import com.ecoleeyes.core.L10n
import com.ecoleeyes.core.Lang
import com.ecoleeyes.core.SettingsStore
import com.ecoleeyes.data.HistoryRepository
import com.ecoleeyes.docs.DocFile
import com.ecoleeyes.docs.DocIndex
import com.ecoleeyes.docs.DocNote
import com.ecoleeyes.docs.DocumentException
import com.ecoleeyes.docs.DocumentLoader
import com.ecoleeyes.docs.ReaderSession
import com.ecoleeyes.docs.ReaderState
import com.ecoleeyes.phone.AndroidPhone
import com.ecoleeyes.phone.Contact
import com.ecoleeyes.phone.FuzzyMatch
import com.ecoleeyes.phone.NotificationReader
import com.ecoleeyes.phone.Phone
import com.ecoleeyes.phone.ReminderParser
import com.ecoleeyes.phone.ReminderScheduler
import com.ecoleeyes.phone.SpokenNotification
import com.ecoleeyes.phone.WorkReminderScheduler
import com.ecoleeyes.vision.CameraException
import com.ecoleeyes.vision.LocalVision
import com.ecoleeyes.vision.MlKitVision
import com.ecoleeyes.vision.SceneComposer
import com.ecoleeyes.vision.CameraHub
import com.ecoleeyes.vision.ContinuousAssist
import com.ecoleeyes.vision.ImageQuality
import com.ecoleeyes.vision.ImageUtil
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.Command
import com.ecoleeyes.voice.CommandParser
import com.ecoleeyes.voice.DocType
import com.ecoleeyes.voice.Screen
import com.ecoleeyes.voice.SpeechListener
import com.ecoleeyes.voice.SpeechOutputException
import com.ecoleeyes.voice.SttError
import com.ecoleeyes.voice.SttResult
import com.ecoleeyes.voice.Speaker
import com.ecoleeyes.voice.VolumeControl
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The conductor: listen -> understand -> act -> speak. Everything the user can do by voice goes through here,
 * and every failure is turned into a spoken explanation (never a silent failure).
 */
class AssistantController(
    private val context: Context,
    private val scope: CoroutineScope,
    private val settings: SettingsStore,
    private val l10n: L10n,
    private val speaker: Speaker,
    private val stt: SpeechListener,
    private val brain: AssistantBrain,
    private val camera: CameraHub,
    private val ocr: OcrEngine,
    private val docs: DocIndex,
    private val history: HistoryRepository,
    private val feedback: Feedback,
    private val volume: VolumeControl,
    private val connectivity: Connectivity,
    private val loaderFactory: (com.ecoleeyes.docs.LoaderEnv) -> DocumentLoader,
    private val serviceControl: (Boolean) -> Unit = {},
    private val vision: LocalVision = MlKitVision(),
    private val phone: Phone = AndroidPhone(context),
    private val reminders: ReminderScheduler = WorkReminderScheduler(context),
    private val notifications: () -> List<SpokenNotification> = { NotificationReader.items.value },
) {
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()
    private val _events = MutableSharedFlow<UiEvent>(extraBufferCapacity = 8)
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()
    val transcript = history.transcript

    private val backStack = ArrayDeque<Screen>()
    private var interaction: Job? = null
    private var bargeJob: Job? = null
    private var handsFreeJob: Job? = null
    private var reader: ReaderSession? = null
    private var candidates: List<DocFile> = emptyList()
    private var candidateIdx = 0
    private var lastAnswer: String? = null
    private var thinking = false
    private var listening = false
    private val permissionWaiters = HashMap<String, CompletableDeferred<Boolean>>()
    private val deferred = ArrayList<suspend () -> Unit>()
    private var lastSlowNotice = 0L

    private val loader: DocumentLoader = loaderFactory(object : com.ecoleeyes.docs.LoaderEnv {
        override fun lang() = settings.value.lang
        override fun cloudUsable() = settings.value.cloudAllowed && settings.value.backendConfigured && connectivity.isOnline()
        override fun cloudAllowed() = settings.value.cloudAllowed
        override fun onSlowStep() {
            val now = System.currentTimeMillis()
            if (now - lastSlowNotice > 8000) { lastSlowNotice = now; quiet(s(R.string.say_scan_progress)) }
        }
    })

    private val live = ContinuousAssist<Bitmap>(
        scope = scope,
        hash = ImageUtil::averageHash,
        toJpeg = { ImageUtil.toJpeg(it, 1024, 70) },
        intervalMs = { settings.value.liveIntervalSec * 1000L },
        capture = { captureFrame(navigate = false) },
        describe = { jpeg, prev ->
            brain.oneShot(
                Prompt.liveSystem(settings.value.lang),
                if (prev == null) "Describe what matters in this first view." else "Your previous description was: \"$prev\". What has meaningfully changed?",
                jpeg, 200,
            )
        },
        isSpeaking = { speaker.speaking.value || thinking || listening },
        speak = { say(it) },
        onFailure = { e -> _state.update { it.copy(live = false) }; say(explain(e)) },
    )

    init {
        speaker.speaking.onEach { refreshPhase() }.launchIn(scope)
        settings.state.onEach { speaker.setRate(it.speechRate); speaker.setVolume(it.speechVolume) }.launchIn(scope)
        // Language changed (by voice or in Settings): the caption under the voice button was in the old language.
        settings.state.map { it.lang }.distinctUntilChanged().drop(1).onEach { _state.update { it.copy(lastSaid = "") } }.launchIn(scope)
    }

    private val lang: Lang get() = settings.value.lang
    private fun s(@StringRes id: Int, vararg a: Any) = l10n.str(lang, id, *a)
    private fun p(@PluralsRes id: Int, count: Int, vararg a: Any) = l10n.plural(lang, id, count, *a)

    // ------------------------------------------------------------------------------------------------------------------
    // State helpers
    // ------------------------------------------------------------------------------------------------------------------

    private fun refreshPhase() {
        val p = when {
            listening -> Phase.LISTENING
            thinking -> Phase.THINKING
            speaker.speaking.value -> Phase.SPEAKING
            else -> Phase.IDLE
        }
        _state.update { it.copy(phase = p) }
    }

    private fun refreshReader() {
        val r = reader
        _state.update { it.copy(reader = r?.let { rr -> ReaderUi(rr.file.spokenName, rr.pageNumber, rr.pageCount, rr.state.value) }) }
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Speaking
    // ------------------------------------------------------------------------------------------------------------------

    /** Speaks [text] and records it in the conversation. Returns when finished or interrupted. */
    suspend fun say(text: String, record: Boolean = true) {
        if (text.isBlank()) return
        _state.update { it.copy(lastSaid = text) }
        if (record) { lastAnswer = text; runCatching { history.add(false, text) } }   // saved before speaking, so a later "clear history" really clears it
        speakRaw(text)
    }

    /** Speaks without waiting (short notices like "sending a photo"). */
    private fun quiet(text: String) { scope.launch { speakRaw(text) } }

    private suspend fun speakRaw(text: String) {
        startBargeInListener()
        try {
            speaker.speak(text, lang)
        } catch (e: CancellationException) {
            throw e
        } catch (e: SpeechOutputException) {
            onSpeechFailure(e)
        } finally {
            bargeJob?.cancel()
        }
    }

    private suspend fun onSpeechFailure(e: SpeechOutputException) {
        feedback.cue(Feedback.Cue.ERROR)
        val msg = when (e.reason) {
            SpeechOutputException.Reason.VOICE_MISSING -> s(R.string.err_no_tts_voice, e.lang?.nativeName ?: lang.nativeName)
            else -> s(R.string.err_tts_failed)
        }
        _state.update { it.copy(lastSaid = msg) }
        // Try to explain in a language that surely has a voice.
        if (e.reason == SpeechOutputException.Reason.VOICE_MISSING && lang != Lang.EN) {
            runCatching { speaker.speak(l10n.str(Lang.EN, R.string.err_no_tts_voice, lang.nativeName), Lang.EN) }
        }
    }

    fun stopSpeaking() {
        speaker.stop()
        reader?.takeIf { it.state.value == ReaderState.READING }?.pause()
        refreshReader()
    }

    // Optional: lets the user interrupt by talking. Best with headphones, because the phone's own voice can be heard by the mic.
    private fun startBargeInListener() {
        if (!settings.value.bargeIn || listening || bargeJob?.isActive == true) return
        if (!hasPermission(Manifest.permission.RECORD_AUDIO)) return
        bargeJob = scope.launch {
            val r = stt.listen(lang, settings.value.preferOfflineStt, onSpeechStart = { speaker.stop(); reader?.pause() })
            if (r is SttResult.Heard) { interaction?.cancel(); interaction = scope.launch { handleUtterance(r.text) } }
        }
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Microphone loop
    // ------------------------------------------------------------------------------------------------------------------

    /** The big button: listen, or interrupt whatever is happening. */
    fun onMicTap() {
        feedback.cue(Feedback.Cue.TAP)
        when {
            listening -> { interaction?.cancel(); listening = false; refreshPhase(); return }
            thinking -> { interaction?.cancel(); thinking = false; refreshPhase(); return }
        }
        if (speaker.speaking.value) stopSpeaking()
        interaction?.cancel()
        interaction = scope.launch { listenOnce() }
    }

    private suspend fun listenOnce(): String? {
        if (!ensurePermission(Manifest.permission.RECORD_AUDIO, R.string.err_mic_why, R.string.err_mic_denied)) return null
        listening = true; refreshPhase()
        _state.update { it.copy(partial = "") }
        feedback.cue(Feedback.Cue.LISTEN_START)
        delay(180) // do not record our own beep
        val result = try {
            stt.listen(lang, settings.value.preferOfflineStt, onPartial = { p -> _state.update { it.copy(partial = p) } })
        } finally {
            listening = false; refreshPhase()
            _state.update { it.copy(partial = "") }
        }
        feedback.cue(Feedback.Cue.LISTEN_END)
        return when (result) {
            is SttResult.Heard -> { handleUtterance(result.text); result.text }
            is SttResult.Failed -> { say(sttMessage(result.error), record = false); null }
        }
    }

    private fun sttMessage(e: SttError): String = when (e) {
        SttError.NO_SPEECH -> s(R.string.err_no_speech)
        SttError.NETWORK -> s(R.string.err_stt_network)
        SttError.BUSY -> s(R.string.err_stt_busy)
        SttError.NO_PERMISSION -> s(R.string.err_mic_denied)
        SttError.UNAVAILABLE, SttError.LANGUAGE_UNSUPPORTED, SttError.OTHER -> s(R.string.err_mic_unavailable)
    }

    /** Typed text (search box or a helper) goes through exactly the same path as speech. */
    fun submitText(text: String) {
        if (text.isBlank()) return
        interaction?.cancel()
        interaction = scope.launch { handleUtterance(text) }
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Permissions
    // ------------------------------------------------------------------------------------------------------------------

    private fun hasPermission(p: String) = ContextCompat.checkSelfPermission(context, p) == PackageManager.PERMISSION_GRANTED

    /** Explains why aloud, asks, and explains again if refused. */
    private suspend fun ensurePermission(permission: String, @StringRes why: Int, @StringRes denied: Int): Boolean {
        if (hasPermission(permission)) return true
        say(s(why), record = false)
        val waiter = CompletableDeferred<Boolean>()
        permissionWaiters[permission] = waiter
        _events.emit(UiEvent.RequestPermission(permission))
        val granted = waiter.await()
        if (!granted) { feedback.cue(Feedback.Cue.ERROR); say(s(denied), record = false) }
        return granted
    }

    /**
     * Like [ensurePermission] for a group asked in one dialog; true if any is granted.
     * Location: Android 12+ ignores a request for precise location alone, and the user may choose "approximate".
     */
    private suspend fun ensureAnyPermission(permissions: List<String>, @StringRes why: Int, @StringRes denied: Int): Boolean {
        if (permissions.any { hasPermission(it) }) return true
        say(s(why), record = false)
        val waiter = CompletableDeferred<Boolean>()
        permissionWaiters[permissions.first()] = waiter
        _events.emit(UiEvent.RequestPermissions(permissions))
        val granted = waiter.await()
        if (!granted) { feedback.cue(Feedback.Cue.ERROR); say(s(denied), record = false) }
        return granted
    }

    fun onPermissionResult(permission: String, granted: Boolean) {
        permissionWaiters.remove(permission)?.complete(granted)
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Understanding and acting on what the user said
    // ------------------------------------------------------------------------------------------------------------------

    private var awaitingConsent = false

    suspend fun handleUtterance(text: String, fromHandsFree: Boolean = false) {
        val cmd = CommandParser.parse(text)
        if (cmd != Command.ClearHistory) runCatching { history.add(true, text) }
        try {
            run(cmd, text)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            thinking = false; refreshPhase()
            feedback.cue(Feedback.Cue.ERROR)
            say(explain(e), record = false)
        }
    }

    private suspend fun run(cmd: Command, original: String) {
        when (cmd) {
            Command.Stop -> {
                speaker.stop()
                val wasLive = live.active
                if (wasLive) { live.stop(); _state.update { it.copy(live = false) } }
                reader?.takeIf { it.state.value == ReaderState.READING }?.pause()
                refreshReader()
                feedback.cue(Feedback.Cue.SUCCESS)
                if (wasLive) say(s(R.string.say_live_off), record = false)
            }
            Command.Greeting -> say(s(R.string.say_hello))
            Command.Help -> say(s(R.string.say_help))
            Command.Time -> say(s(R.string.say_time, DateFormat.getTimeInstance(DateFormat.SHORT, lang.locale).format(Date())))
            Command.VolumeUp -> say(if (volume.change(true) == VolumeControl.Result.CHANGED) s(R.string.say_volume_up) else s(R.string.say_volume_max))
            Command.VolumeDown -> say(if (volume.change(false) == VolumeControl.Result.CHANGED) s(R.string.say_volume_down) else s(R.string.say_volume_min))
            Command.SpeedUp -> { settings.update { it.copy(speechRate = it.speechRate + 0.2f) }; say(s(R.string.say_speed_up)) }
            Command.SpeedDown -> { settings.update { it.copy(speechRate = it.speechRate - 0.2f) }; say(s(R.string.say_speed_down)) }
            is Command.SetLang -> setLanguage(cmd.lang)
            Command.ClearHistory -> clearHistory()
            Command.RepeatLast -> lastAnswer?.let { say(it, record = false) } ?: say(s(R.string.say_nothing_to_repeat), record = false)
            Command.Back -> goBack()
            Command.Close -> { say(s(R.string.say_closing), record = false); _events.emit(UiEvent.CloseApp) }
            is Command.Open -> openScreen(cmd.screen, announce = true)
            is Command.SetCloud -> setCloud(cmd.allowed)
            Command.Yes, Command.No -> {
                if (awaitingConsent) applyConsent(cmd == Command.Yes) else if (cmd == Command.Yes) say(s(R.string.say_hello), record = false) else say(s(R.string.say_not_understood), record = false)
            }
            Command.ReaderPause -> readerOrNone { it.pause(); refreshReader(); say(s(R.string.say_paused), record = false) }
            Command.ReaderResume -> readerOrNone { it.resume(); refreshReader() }
            Command.ReaderNextPage -> readerOrNone { if (!it.nextPage()) say(s(R.string.say_doc_end), record = false); refreshReader() }
            Command.ReaderPrevPage -> readerOrNone { if (!it.previousPage()) say(s(R.string.say_doc_start), record = false); refreshReader() }
            is Command.ReaderGoToPage -> readerOrNone { if (!it.goToPage(cmd.page)) say(s(R.string.say_doc_end), record = false); refreshReader() }
            Command.ReaderNextParagraph -> readerOrNone { it.skipParagraph() }
            Command.ReaderRepeatParagraph -> if (reader != null) { reader?.repeatParagraph() } else run(Command.RepeatLast, original)
            Command.Next -> if (candidates.isNotEmpty() && candidateIdx + 1 < candidates.size && reader?.state?.value != ReaderState.READING) {
                candidateIdx++; say(s(R.string.say_next_candidate, candidates[candidateIdx].spokenName))
            } else if (candidates.isNotEmpty() && reader == null) say(s(R.string.say_no_more_candidates), record = false)
            else readerOrNone { if (!it.nextPage()) say(s(R.string.say_doc_end), record = false); refreshReader() }
            Command.ReadCurrent -> {
                val r = reader
                if (candidates.isNotEmpty() && (r == null || r.file.id != candidates[candidateIdx].id)) readFile(candidates[candidateIdx])
                else if (r != null) { r.resume(); refreshReader() }
                else say(s(R.string.say_no_doc_open), record = false)
            }
            is Command.FindDocs -> findDocs(cmd.query, cmd.type)
            is Command.ReadLatest -> readLatest(cmd.type)
            is Command.ReadNamed -> readNamed(cmd.query)
            Command.ReadTextInView -> readTextInView()
            Command.LiveStart -> startLive()
            Command.LiveStop -> { live.stop(); _state.update { it.copy(live = false) }; say(s(R.string.say_live_off)) }
            Command.Describe -> if (cloudUsable()) askAi(original) else localDescribe(peopleOnly = false)
            Command.People -> if (cloudUsable()) askAi(original) else localDescribe(peopleOnly = true)
            Command.WhatColor -> whatColor()
            Command.Emergency -> emergency()
            Command.CallEmergencyContact -> callEmergencyContact()
            Command.CallEmergencyServices -> dialEmergencyServices()
            Command.ShareLocation -> shareLocation()
            is Command.SetEmergencyContact -> setEmergencyContact(cmd.name)
            is Command.Call -> callWho(cmd.who)
            is Command.OpenApp -> openApp(cmd.name, original)
            is Command.CreateNote -> createNote(cmd.text)
            Command.ReadNotes -> readNotes()
            Command.ClearNotes -> { history.clearNotes(); say(s(R.string.say_notes_cleared)) }
            is Command.Remind -> setReminder(cmd.minutes, cmd.text)
            Command.ReadNotifications -> readNotifications()
            Command.Battery -> battery()
            Command.Date -> say(s(R.string.say_date, DateFormat.getDateInstance(DateFormat.FULL, lang.locale).format(Date())))
            Command.Status -> status()
            is Command.Ask -> askAi(cmd.text)
        }
    }

    private suspend fun readerOrNone(block: suspend (ReaderSession) -> Unit) {
        val r = reader
        if (r == null) say(s(R.string.say_no_doc_open), record = false) else block(r)
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Settings-type commands
    // ------------------------------------------------------------------------------------------------------------------

    private suspend fun setLanguage(l: Lang) {
        settings.update { it.copy(lang = l) }
        say(l10n.str(l, when (l) { Lang.EN -> R.string.say_lang_en; Lang.FR -> R.string.say_lang_fr; Lang.AR -> R.string.say_lang_ar }))
    }

    private suspend fun setCloud(allowed: Boolean) {
        settings.update { it.copy(consent = if (allowed) Consent.GRANTED else Consent.DENIED) }
        say(if (allowed) s(R.string.say_cloud_enabled) else s(R.string.say_consent_no))
    }

    suspend fun clearHistory() {
        brain.memory.clear(); history.clearAll(); lastAnswer = null
        say(s(R.string.say_history_cleared), record = false)
    }

    /** Language tile on the home screen: EN -> FR -> AR -> EN, confirmed aloud in the new language. */
    fun cycleLanguage() {
        val next = Lang.entries[(lang.ordinal + 1) % Lang.entries.size]
        interaction?.cancel()
        interaction = scope.launch { setLanguage(next) }
    }

    /** Reads arbitrary on-screen text aloud (privacy policy button). */
    fun readAloud(text: String) {
        interaction?.cancel()
        interaction = scope.launch { say(text, record = false) }
    }

    fun clearHistoryNow() { scope.launch { clearHistory() } }

    // ------------------------------------------------------------------------------------------------------------------
    // Consent (first run and whenever cloud features are needed)
    // ------------------------------------------------------------------------------------------------------------------

    /** First launch: welcome, explain the cloud use, and ask yes/no aloud. */
    fun startOnboarding() {
        interaction?.cancel()
        interaction = scope.launch {
            say(s(R.string.say_welcome), record = false)
            settings.update { it.copy(onboardingDone = true) }
            if (settings.value.consent == Consent.UNKNOWN) askConsent()
        }
    }

    fun greetOnStart() {
        interaction?.cancel()
        interaction = scope.launch { say(s(R.string.say_hello), record = false) }
    }

    private suspend fun askConsent() {
        awaitingConsent = true
        try {
            say(s(R.string.say_consent), record = false)
            for (attempt in 0..1) {
                val heard = listenOnceRaw() ?: return
                when (CommandParser.parse(heard)) {
                    Command.Yes -> { applyConsent(true); return }
                    Command.No -> { applyConsent(false); return }
                    else -> if (attempt == 0) say(s(R.string.say_yes_prompt), record = false)
                }
            }
        } finally { awaitingConsent = false }
    }

    private suspend fun applyConsent(yes: Boolean) {
        awaitingConsent = false
        settings.update { it.copy(consent = if (yes) Consent.GRANTED else Consent.DENIED) }
        say(if (yes) s(R.string.say_consent_yes) else s(R.string.say_consent_no), record = false)
    }

    /** Listens once and returns the text WITHOUT running it as a command. */
    private suspend fun listenOnceRaw(): String? {
        if (!ensurePermission(Manifest.permission.RECORD_AUDIO, R.string.err_mic_why, R.string.err_mic_denied)) return null
        listening = true; refreshPhase()
        feedback.cue(Feedback.Cue.LISTEN_START); delay(180)
        val r = try { stt.listen(lang, settings.value.preferOfflineStt) } finally { listening = false; refreshPhase() }
        feedback.cue(Feedback.Cue.LISTEN_END)
        return when (r) {
            is SttResult.Heard -> r.text
            is SttResult.Failed -> { say(sttMessage(r.error), record = false); null }
        }
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------------------------------------------------------

    fun navigate(screen: Screen) {
        if (screen == _state.value.screen) return
        if (screen == Screen.HOME) backStack.clear() else backStack.addLast(_state.value.screen)
        _state.update { it.copy(screen = screen) }
    }

    private suspend fun openScreen(screen: Screen, announce: Boolean) {
        navigate(screen)
        if (!announce) return
        val msg = when (screen) {
            Screen.HOME -> R.string.say_home
            Screen.ASSISTANT -> R.string.say_opened_assistant
            Screen.CAMERA -> R.string.say_opened_camera
            Screen.DOCUMENTS -> R.string.say_opened_documents
            Screen.FILES -> R.string.say_opened_files
            Screen.EMERGENCY -> R.string.say_opened_emergency
            Screen.SETTINGS -> R.string.say_opened_settings
            Screen.PRIVACY -> R.string.say_opened_privacy
        }
        say(s(msg), record = false)
        if (screen == Screen.DOCUMENTS || screen == Screen.FILES) {
            if (!docs.hasAccess()) { say(s(R.string.say_no_folder), record = false); _events.emit(UiEvent.PickFolder) }
            else { docs.refresh(); updateResults("") }
        }
        if (screen == Screen.PRIVACY) say(l10n.str(lang, R.string.privacy_body), record = false)
    }

    private suspend fun goBack() {
        val prev = backStack.removeLastOrNull()
        if (prev == null) { say(s(R.string.say_no_back), record = false); return }
        _state.update { it.copy(screen = prev) }
        say(s(when (prev) {
            Screen.HOME -> R.string.say_home; Screen.ASSISTANT -> R.string.say_opened_assistant; Screen.CAMERA -> R.string.say_opened_camera
            Screen.DOCUMENTS -> R.string.say_opened_documents; Screen.FILES -> R.string.say_opened_files; Screen.SETTINGS -> R.string.say_opened_settings
            Screen.EMERGENCY -> R.string.say_opened_emergency
            Screen.PRIVACY -> R.string.say_opened_privacy
        }), record = false)
    }

    /** Back button / gesture. Returns false if already home (let the system leave the app). */
    fun onSystemBack(): Boolean {
        val prev = backStack.removeLastOrNull() ?: return false
        _state.update { it.copy(screen = prev) }
        return true
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Camera
    // ------------------------------------------------------------------------------------------------------------------

    private suspend fun captureFrame(navigate: Boolean = true): Bitmap {
        if (!ensurePermission(Manifest.permission.CAMERA, R.string.err_cam_why, R.string.err_cam_denied)) throw PermissionDenied()
        if (!camera.ready.value) {
            if (!navigate) throw CameraException(CameraException.Reason.NOT_READY)
            navigate(Screen.CAMERA)
            if (!camera.awaitReady(7000)) throw CameraException(CameraException.Reason.NOT_READY)
            delay(700) // let auto-exposure and focus settle
        }
        return camera.capture()
    }

    class PermissionDenied : Exception("permission denied")

    private suspend fun readTextInView() {
        val bmp = try { captureFrame() } catch (e: PermissionDenied) { return }
        if (ImageQuality.assess(bmp) == ImageQuality.Verdict.TOO_DARK) { feedback.cue(Feedback.Cue.ERROR); say(s(R.string.err_image_unclear)); return }
        thinking = true; refreshPhase()
        try {
            val cloudOk = settings.value.cloudAllowed && settings.value.backendConfigured && connectivity.isOnline()
            val outcome = ocr.read(bmp, lang, settings.value.cloudAllowed, cloudOk)
            thinking = false; refreshPhase()
            when {
                outcome.text.isBlank() && outcome.needsCloud -> say(s(R.string.say_ocr_cloud_needed))
                outcome.text.isBlank() -> say(s(R.string.say_ocr_nothing))
                else -> say(if (outcome.uncertain) outcome.text + ". " + s(R.string.say_ocr_uncertain) else outcome.text)
            }
        } finally { thinking = false; refreshPhase() }
    }

    fun describeNow() = submitText(l10n.str(lang, R.string.camera_describe))
    fun readTextNow() { interaction?.cancel(); interaction = scope.launch { try { readTextInView() } catch (e: Exception) { say(explain(e), record = false) } } }

    private suspend fun startLive() {
        if (!requireCloud()) return
        say(s(R.string.say_cam_safety), record = false)
        if (!captureReadyOrOpen()) return
        _state.update { it.copy(live = true) }
        live.start()
        say(s(R.string.say_live_on), record = false)
    }

    private suspend fun captureReadyOrOpen(): Boolean {
        if (!ensurePermission(Manifest.permission.CAMERA, R.string.err_cam_why, R.string.err_cam_denied)) return false
        if (!camera.ready.value) {
            navigate(Screen.CAMERA)
            if (!camera.awaitReady(7000)) { say(s(R.string.err_cam_unavailable), record = false); return false }
        }
        return true
    }

    fun toggleLive() {
        interaction?.cancel()
        interaction = scope.launch {
            if (live.active) run(Command.LiveStop, "") else run(Command.LiveStart, "")
        }
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Documents
    // ------------------------------------------------------------------------------------------------------------------

    private suspend fun ensureDocAccess(): Boolean {
        if (docs.hasAccess()) { if (docs.files.value.isEmpty()) docs.refresh(); return true }
        say(s(R.string.say_no_folder), record = false)
        _events.emit(UiEvent.PickFolder)
        return false
    }

    private fun updateResults(query: String, type: DocType = DocType.ANY) {
        _state.update { it.copy(searchQuery = query, results = docs.search(query, type, 25)) }
    }

    fun searchDocs(query: String) = updateResults(query)

    fun refreshDocs() { scope.launch { docs.refresh(); updateResults(_state.value.searchQuery) } }

    private suspend fun findDocs(query: String, type: DocType) {
        if (!ensureDocAccess()) return
        docs.refresh()
        val found = docs.search(query, type, 8)
        candidates = found; candidateIdx = 0
        _state.update { it.copy(searchQuery = query, results = found) }
        if (query.isEmpty() && found.isNotEmpty()) navigateIfNot(Screen.DOCUMENTS)
        when (found.size) {
            0 -> say(if (query.isEmpty()) s(R.string.say_no_documents) else s(R.string.say_found_none, query))
            1 -> say(s(R.string.say_found_one, found[0].spokenName))
            else -> say(p(R.plurals.say_found_many, found.size, found.size, found[0].spokenName))
        }
    }

    private fun navigateIfNot(screen: Screen) { if (_state.value.screen != Screen.FILES && _state.value.screen != screen) navigate(screen) }

    private suspend fun readLatest(type: DocType) {
        if (!ensureDocAccess()) return
        docs.refresh()
        val latest = docs.search("", type, 1).firstOrNull()
        if (latest == null) { say(s(R.string.say_no_documents)); return }
        candidates = listOf(latest); candidateIdx = 0
        say(s(R.string.say_latest_is, latest.spokenName), record = false)
        readFile(latest)
    }

    private suspend fun readNamed(query: String) {
        if (!ensureDocAccess()) return
        docs.refresh()
        val found = docs.search(query, DocType.ANY, 8)
        candidates = found; candidateIdx = 0
        if (found.isEmpty()) { say(s(R.string.say_found_none, query)); return }
        readFile(found.first())
    }

    /** Opens [file] and reads it from the saved position. */
    suspend fun readFile(file: DocFile, startPage: Int? = null, autoStart: Boolean = true) {
        say(s(R.string.say_doc_loading), record = false)
        thinking = true; refreshPhase()
        val loaded = try { loader.open(file) } finally { thinking = false; refreshPhase() }
        reader?.close()
        val saved = history.loadPosition(file.uri)
        val page = startPage?.minus(1) ?: saved?.page ?: 0
        val para = if (startPage != null) 0 else saved?.paragraph ?: 0
        val session = ReaderSession(
            file = file, pages = loaded.pages, scope = scope, speaker = speaker, lang = { lang },
            savePosition = { p, q -> runCatching { history.savePosition(file.uri, file.spokenName, p, q) }; refreshReader() },
            pageAnnouncement = { p, _ -> s(R.string.say_page_x, p) },
            endAnnouncement = { s(R.string.say_doc_end) },
            onError = { e -> say(explain(e), record = false); refreshReader() },
            startPage = page, startParagraph = para,
        )
        reader = session
        refreshReader()
        if (loaded.pages.notes.contains(DocNote.PARTIAL_FORMAT)) say(s(R.string.say_doc_partial), record = false)
        if (!autoStart) return
        if (saved != null && (page > 0 || para > 0) && startPage == null) say(s(R.string.say_reading_resume, page + 1), record = false)
        else say(p(R.plurals.say_reading_start, loaded.pages.count, file.spokenName, loaded.pages.count), record = false)
        session.start()
        refreshReader()
    }

    /** From the document list on screen. */
    fun readFileFromUi(file: DocFile) {
        interaction?.cancel()
        interaction = scope.launch {
            try { readFile(file) } catch (e: CancellationException) { throw e } catch (e: Exception) { say(explain(e), record = false) }
        }
    }

    fun onFolderPicked(uri: Uri?) {
        if (uri == null) return
        interaction?.cancel()
        interaction = scope.launch {
            if (!docs.addGrant(uri)) { say(s(R.string.say_folder_failed), record = false); return@launch }
            say(s(R.string.say_files_scanning), record = false)
            val all = docs.refresh()
            updateResults("")
            say(p(R.plurals.say_folder_added, all.size, all.size), record = false)
        }
    }

    fun removeGrant(uri: Uri) { docs.removeGrant(uri); updateResults(_state.value.searchQuery); quiet(s(R.string.say_remove_folder)) }

    fun readerPauseResume() { reader?.let { if (it.state.value == ReaderState.READING) it.pause() else it.resume(); refreshReader() } }
    fun readerNext() { reader?.nextPage(); refreshReader() }
    fun readerPrev() { reader?.previousPage(); refreshReader() }
    fun readerRepeat() { reader?.repeatParagraph() }

    // ------------------------------------------------------------------------------------------------------------------
    // AI
    // ------------------------------------------------------------------------------------------------------------------

    private suspend fun requireCloud(): Boolean {
        val st = settings.value
        if (st.cloudAllowed) return true
        if (st.consent == Consent.UNKNOWN) { askConsent(); return settings.value.cloudAllowed }
        say(s(R.string.say_cloud_off), record = false)
        return false
    }

    private fun brainContext(): BrainContext {
        val r = reader
        return BrainContext(
            lang = lang,
            screen = _state.value.screen.name.lowercase(),
            nowText = DateFormat.getDateTimeInstance(DateFormat.FULL, DateFormat.SHORT, Locale.ENGLISH).format(Date()),
            openDocument = r?.file?.spokenName,
            readingPosition = r?.let { "page ${it.pageNumber} of ${it.pageCount}, ${it.state.value.name.lowercase()}" },
            liveActive = live.active,
        )
    }

    private suspend fun askAi(text: String) {
        // Offline / no consent: do what can honestly be done on the phone alone.
        if (!settings.value.cloudAllowed || !connectivity.isOnline() || !settings.value.backendConfigured) {
            offlineFallback(text); return
        }
        thinking = true; refreshPhase()
        deferred.clear()
        val slow = scope.launch { delay(5000); say(s(R.string.say_working), record = false) }
        val reply = try {
            brain.respond(text, brainContext(), toolExecutor)
        } finally {
            slow.cancel(); thinking = false; refreshPhase()
        }
        say(reply.text)
        val todo = deferred.toList(); deferred.clear()
        todo.forEach { it() }
    }

    private fun cloudUsable(): Boolean = settings.value.let { it.cloudAllowed && it.backendConfigured } && connectivity.isOnline()

    private suspend fun offlineFallback(text: String) {
        CommandParser.looseFind(text)?.let { findDocs(it.query, it.type); return }
        if (settings.value.consent == Consent.UNKNOWN) {
            askConsent()   // speaks the outcome itself
            if (cloudUsable()) askAi(text)
            return
        }
        // Do what the phone can do alone, and say so.
        if (CommandParser.isCurrencyQuestion(text)) { say(s(R.string.say_currency_offline), record = false); return }
        when (CommandParser.looseVisual(text)) {
            Command.WhatColor -> { whatColor(); return }
            Command.People -> { localDescribe(peopleOnly = true); return }
            Command.Describe -> { localDescribe(peopleOnly = false); return }
            Command.ReadTextInView -> { readTextInView(); return }
            else -> {}
        }
        if (ReminderParser.isReminderRequest(text)) { say(s(R.string.say_reminder_need_time), record = false); return }
        val st = settings.value
        when {
            !st.cloudAllowed -> say(s(R.string.say_cloud_off), record = false)
            !st.backendConfigured -> say(s(R.string.err_not_configured), record = false)
            else -> say(s(R.string.err_offline), record = false)
        }
    }

    // Tools the AI may call. Each one checks permissions and tells the user what is happening.
    private val toolExecutor = ToolExecutor { name, input -> runTool(name, input) }

    private suspend fun runTool(name: String, input: JsonObject): ToolOutput = runToolInner(name, input)

    private suspend fun runToolInner(name: String, input: JsonObject): ToolOutput { return when (name) {
        Tools.CAPTURE_VIEW -> {
            val bmp = try { captureFrame() } catch (e: PermissionDenied) { return ToolOutput("The user denied camera permission.", isError = true) }
            catch (e: CameraException) { return ToolOutput("The camera could not take a photo.", isError = true) }
            if (ImageQuality.assess(bmp) == ImageQuality.Verdict.TOO_DARK) {
                return ToolOutput("The photo is almost completely black (too dark, or the camera is covered). Tell the user and suggest turning on a light or uncovering the camera.", isError = true)
            }
            if (settings.value.announceUploads) quiet(s(R.string.say_uploading_photo))
            val hint = if (input.bool("ocr") == true) runCatching { ocr.recognizeLocal(bmp).text }.getOrNull()?.takeIf { it.isNotBlank() } else null
            ToolOutput("Photo taken just now." + (hint?.let { " On-device text recognition (may contain errors): \"$it\"" } ?: ""), ImageUtil.toJpeg(bmp))
        }
        Tools.START_LIVE -> { deferred += { startLive() }; ToolOutput("Continuous description will start after your reply. Keep the reply to a few words.") }
        Tools.STOP_LIVE -> { live.stop(); _state.update { it.copy(live = false) }; ToolOutput("Continuous description stopped.") }
        Tools.SEARCH_DOCS -> {
            if (!docs.hasAccess()) { deferred += { ensureDocAccess() }; ToolOutput("No folder has been authorized yet. A folder picker will open for the user.", isError = true) }
            else {
                docs.refresh()
                val type = when (input.str("type")) { "pdf" -> DocType.PDF; "word" -> DocType.WORD; "text" -> DocType.TEXT; "rtf" -> DocType.RTF; "image" -> DocType.IMAGE; else -> DocType.ANY }
                val found = docs.search(input.str("query").orEmpty(), type, 8)
                candidates = found; candidateIdx = 0
                updateResults(input.str("query").orEmpty(), type)
                if (found.isEmpty()) ToolOutput("No matching documents among the authorized folders.")
                else ToolOutput(found.joinToString("\n") { "id=${it.id} | ${it.name} | ${it.type.name.lowercase()} | modified ${SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(it.modified))}" })
            }
        }
        Tools.OPEN_DOC -> {
            val f = input.str("id")?.let { docs.byId(it) }
            if (f == null) ToolOutput("Unknown document id.", isError = true)
            else try {
                readFile(f, autoStart = false)
                val r = reader!!
                ToolOutput("Opened \"${f.spokenName}\" (${r.pageCount} pages). Saved position: page ${r.pageNumber}.")
            } catch (e: DocumentException) { ToolOutput("Could not open: ${e.reason.name.lowercase()}.", isError = true) }
        }
        Tools.READ_DOC_ALOUD -> {
            val id = input.str("id"); val page = input.int("page")
            deferred += {
                val target = id?.let { docs.byId(it) }
                try {
                    if (target != null && reader?.file?.id != target.id) readFile(target, page)
                    else reader?.let { r -> if (page != null) r.goToPage(page) else r.resume(); refreshReader() } ?: say(s(R.string.say_no_doc_open), record = false)
                } catch (e: DocumentException) { say(explain(e), record = false) }
            }
            ToolOutput("Reading will start right after your reply is spoken. Keep the reply to a few words.")
        }
        Tools.GET_DOC_TEXT -> {
            val r = reader
            if (r == null) ToolOutput("No document is open. Search and open one first.", isError = true)
            else {
                if (settings.value.announceUploads) quiet(s(R.string.say_uploading_doc))
                val sb = StringBuilder()
                var p = (input.int("page") ?: 1) - 1
                val first = p
                while (p < r.pageCount && sb.length < 12000) { sb.append(r.textOfPage(p)).append("\n\n"); p++ }
                val trunc = p < r.pageCount
                ToolOutput("Document \"${r.file.spokenName}\", pages ${first + 1}-$p of ${r.pageCount}${if (trunc) " (truncated, more pages exist)" else ""}:\n" + sb.toString().take(12500))
            }
        }
        Tools.READER_CONTROL -> {
            val r = reader
            if (r == null) ToolOutput("No document is open.", isError = true)
            else {
                when (input.str("action")) {
                    "pause", "stop" -> r.pause()
                    "resume" -> r.resume()
                    "next_page" -> r.nextPage()
                    "previous_page" -> r.previousPage()
                    "go_to_page" -> r.goToPage(input.int("page") ?: 1)
                    "repeat_paragraph" -> r.repeatParagraph()
                    "skip_paragraph" -> r.skipParagraph()
                }
                refreshReader()
                ToolOutput("Done. Now at page ${r.pageNumber} of ${r.pageCount}.")
            }
        }
        Tools.NAVIGATE -> {
            when (input.str("screen")) {
                "back" -> if (!onSystemBack()) return ToolOutput("Already on the home screen.")
                "home" -> navigate(Screen.HOME)
                "assistant" -> navigate(Screen.ASSISTANT)
                "camera" -> navigate(Screen.CAMERA)
                "documents" -> deferred += { openScreen(Screen.DOCUMENTS, announce = false); if (!docs.hasAccess()) ensureDocAccess() }
                "files" -> deferred += { openScreen(Screen.FILES, announce = false); if (!docs.hasAccess()) ensureDocAccess() }
                "emergency" -> navigate(Screen.EMERGENCY)
                "settings" -> navigate(Screen.SETTINGS)
                "privacy" -> navigate(Screen.PRIVACY)
                else -> return ToolOutput("Unknown screen.", isError = true)
            }
            ToolOutput("Done.")
        }
        Tools.SET_LANGUAGE -> {
            val l = Lang.entries.firstOrNull { it.tag == input.str("language") }
            if (l == null) ToolOutput("Unsupported language.", isError = true)
            else { settings.update { it.copy(lang = l) }; ToolOutput("Language changed to ${l.nativeName}. Reply in that language now.") }
        }
        Tools.ADJUST_SPEECH -> {
            var msg = ""
            when (input.str("volume")) { "up" -> msg += "volume " + volume.change(true).name.lowercase() + ". "; "down" -> msg += "volume " + volume.change(false).name.lowercase() + ". " }
            when (input.str("speed")) {
                "faster" -> { settings.update { it.copy(speechRate = it.speechRate + 0.2f) }; msg += "speech faster." }
                "slower" -> { settings.update { it.copy(speechRate = it.speechRate - 0.2f) }; msg += "speech slower." }
            }
            ToolOutput(msg.ifBlank { "Nothing changed." })
        }
        Tools.CLEAR_HISTORY -> { deferred += { history.clearAll(); brain.memory.clear() }; ToolOutput("History will be cleared after your reply.") }
        Tools.CALL_CONTACT -> {
            val who = input.str("who").orEmpty()
            deferred += { callWho(who) }
            ToolOutput("The phone will ask the user to confirm, then call. Do not say the call is placed.")
        }
        Tools.CREATE_NOTE -> {
            val text = input.str("text").orEmpty().trim()
            if (text.isEmpty()) ToolOutput("Empty note.", isError = true) else { history.addNote(text); ToolOutput("Note saved.") }
        }
        Tools.READ_NOTES -> { deferred += { readNotes() }; ToolOutput("Notes will be read aloud after your reply. Keep the reply to a few words.") }
        Tools.SET_REMINDER -> {
            val m = input.int("minutes")
            if (m == null || m !in 1..(7 * 24 * 60)) ToolOutput("Minutes must be between 1 and 10080.", isError = true)
            else { scheduleReminder(m, input.str("text").orEmpty()); ToolOutput("Reminder scheduled in $m minutes (${formatDuration(m)}).") }
        }
        Tools.OPEN_APP -> {
            val name = input.str("name").orEmpty()
            val app = FuzzyMatch.rank(name, phone.installedApps(), { it.label }, 1).firstOrNull()?.first
            if (app == null) ToolOutput("No installed app matches \"$name\".", isError = true)
            else { deferred += { say(s(R.string.say_app_opening, app.label), record = false); phone.launch(app) }; ToolOutput("${app.label} will open after your reply. Keep the reply to a few words.") }
        }
        Tools.EMERGENCY -> { deferred += { emergency() }; ToolOutput("Emergency assistance starts after your reply. Reply with one short calm sentence.") }
        Tools.READ_NOTIFICATIONS -> { deferred += { readNotifications() }; ToolOutput("Notifications will be read aloud on the phone after your reply. Keep the reply to a few words.") }
        Tools.DEVICE_STATUS -> ToolOutput("Battery: ${phone.batteryPercent()?.let { "$it%" } ?: "unknown"}${if (phone.isCharging()) ", charging" else ""}. Online: ${connectivity.isOnline()}.")
        else -> ToolOutput("Unknown tool.", isError = true)
    } }

    // ------------------------------------------------------------------------------------------------------------------
    // Yes / no questions
    // ------------------------------------------------------------------------------------------------------------------

    /** Asks aloud and listens. true = yes, false = no / stop, null = no clear answer (treated as "no" by callers). */
    private suspend fun askYesNo(question: String): Boolean? {
        say(question, record = false)
        for (attempt in 0..1) {
            val heard = listenOnceRaw() ?: return null
            when (CommandParser.parse(heard)) {
                Command.Yes -> return true
                Command.No, Command.Stop -> return false
                else -> if (attempt == 0) say(s(R.string.say_yes_prompt), record = false)
            }
        }
        return null
    }

    // ------------------------------------------------------------------------------------------------------------------
    // On-device vision (works offline)
    // ------------------------------------------------------------------------------------------------------------------

    private suspend fun localDescribe(peopleOnly: Boolean) {
        val bmp = try { captureFrame() } catch (e: PermissionDenied) { return }
        thinking = true; refreshPhase()
        val scene = try { vision.analyze(bmp) } catch (e: CancellationException) { throw e } catch (e: Exception) { null } finally { thinking = false; refreshPhase() }
        if (scene == null) { feedback.cue(Feedback.Cue.ERROR); say(s(R.string.say_local_vision_failed), record = false); return }
        say(if (peopleOnly) SceneComposer.peopleAnswer(scene, lang) else SceneComposer.compose(scene, lang))
    }

    /** Colour of what the phone points at. Always on-device: instant, private, offline. */
    private suspend fun whatColor() {
        val bmp = try { captureFrame() } catch (e: PermissionDenied) { return }
        val result = try { vision.color(bmp) } catch (e: CancellationException) { throw e } catch (e: Exception) { null }
        if (result == null) { say(s(R.string.say_local_vision_failed), record = false); return }
        say(result.spoken(lang))
    }

    fun colorNow() { interaction?.cancel(); interaction = scope.launch { try { whatColor() } catch (e: CancellationException) { throw e } catch (e: Exception) { say(explain(e), record = false) } } }

    // ------------------------------------------------------------------------------------------------------------------
    // Emergency
    // ------------------------------------------------------------------------------------------------------------------

    /** Spoken guidance, then offers (never forces) a call. Nothing is ever placed or sent without a spoken "yes". */
    suspend fun emergency() {
        live.stop(); _state.update { it.copy(live = false) }
        reader?.pause()
        navigate(Screen.EMERGENCY)
        feedback.cue(Feedback.Cue.ERROR)
        say(s(R.string.say_emergency_intro))
        val st = settings.value
        if (st.hasEmergencyContact) {
            if (askYesNo(s(R.string.say_emergency_ask_call, contactLabel(st.emergencyName, st.emergencyNumber))) == true) {
                placeCall(contactLabel(st.emergencyName, st.emergencyNumber), st.emergencyNumber); return
            }
        } else if (askYesNo(s(R.string.say_emergency_no_contact, spokenDigits(st.emergencyServices))) == true) {
            dialEmergencyServices(); return
        }
        say(s(R.string.say_emergency_options), record = false)
    }

    private fun contactLabel(name: String, number: String) = name.ifBlank { spokenDigits(number) }

    /** "0555123456" -> "0 5 5 5 1 2 3 4 5 6" so TTS reads digits, not "five hundred and fifty-five million…". */
    private fun spokenDigits(number: String) = number.filter { it.isDigit() || it == '+' }.toList().joinToString(" ")

    private suspend fun callEmergencyContact() {
        val st = settings.value
        if (!st.hasEmergencyContact) { say(s(R.string.em_btn_contact_none)); return }
        val label = contactLabel(st.emergencyName, st.emergencyNumber)
        if (askYesNo(s(R.string.say_call_confirm, label)) == true) placeCall(label, st.emergencyNumber) else say(s(R.string.say_call_cancelled), record = false)
    }

    /** Emergency numbers are only dialled: Android requires the user to press call, which also prevents accidental calls. */
    private suspend fun dialEmergencyServices() {
        val num = settings.value.emergencyServices
        if (phone.dial(num)) say(s(R.string.say_dialer_open, spokenDigits(num))) else say(s(R.string.say_call_failed))
    }

    private suspend fun placeCall(label: String, number: String) {
        val direct = ensurePermission(Manifest.permission.CALL_PHONE, R.string.err_call_why, R.string.err_call_denied)
        if (direct) {
            say(s(R.string.say_calling, label), record = false)
            if (!phone.call(number)) say(s(R.string.say_call_failed))
        } else {
            if (phone.dial(number)) say(s(R.string.say_dialer_open, spokenDigits(number))) else say(s(R.string.say_call_failed))
        }
    }

    private suspend fun shareLocation() {
        if (!ensureAnyPermission(listOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), R.string.err_location_why, R.string.err_location_denied)) return
        say(s(R.string.say_location_finding), record = false)
        val p = phone.currentLocation()
        if (p == null) { say(s(R.string.say_location_none)); return }
        val st = settings.value
        if (!st.hasEmergencyContact) {
            say(s(R.string.say_location_no_contact, "%.5f".format(Locale.US, p.lat), "%.5f".format(Locale.US, p.lng)))
            return
        }
        val label = contactLabel(st.emergencyName, st.emergencyNumber)
        if (askYesNo(s(R.string.say_location_confirm, label)) != true) { say(s(R.string.say_call_cancelled), record = false); return }
        if (phone.composeSms(st.emergencyNumber, s(R.string.sms_location_body, p.mapsLink()))) say(s(R.string.say_location_sms_ready, label))
        else say(s(R.string.say_call_failed))
    }

    private suspend fun setEmergencyContact(spoken: String) {
        val number = FuzzyMatch.phoneNumber(spoken)?.takeIf { spoken.count { c -> c.isLetter() } == 0 }
        val chosen: Contact = if (number != null) Contact(spokenDigits(number), number) else {
            pickContact(spoken) ?: return
        }
        if (askYesNo(s(R.string.say_em_contact_ask, chosen.name)) == true) {
            settings.update { it.copy(emergencyName = chosen.name, emergencyNumber = chosen.number) }
            say(s(R.string.say_em_contact_set, chosen.name))
        } else say(s(R.string.say_call_cancelled), record = false)
    }

    fun openNotificationAccess() { quiet(s(R.string.say_notif_access)); phone.openNotificationAccessSettings() }
    fun clearNotesNow() { scope.launch { history.clearNotes(); say(s(R.string.say_notes_cleared), record = false) } }

    // Emergency screen buttons
    fun emergencyNow() { interaction?.cancel(); interaction = scope.launch { emergency() } }
    fun callEmergencyContactNow() { interaction?.cancel(); interaction = scope.launch { callEmergencyContact() } }
    fun dialEmergencyServicesNow() { interaction?.cancel(); interaction = scope.launch { dialEmergencyServices() } }
    fun shareLocationNow() { interaction?.cancel(); interaction = scope.launch { shareLocation() } }

    // ------------------------------------------------------------------------------------------------------------------
    // Phone control
    // ------------------------------------------------------------------------------------------------------------------

    /** Finds a contact by spoken name (asks for the contacts permission first). Says why when nothing is found. */
    private suspend fun pickContact(spoken: String): Contact? {
        if (!ensurePermission(Manifest.permission.READ_CONTACTS, R.string.err_contacts_why, R.string.err_contacts_denied)) return null
        var found = phone.findContacts(spoken)
        // Arabic: "اتصل باحمد" — the preposition is glued to the name.
        if (found.isEmpty() && spoken.startsWith("ب") && spoken.length > 2) found = phone.findContacts(spoken.drop(1))
        if (found.isEmpty()) { say(s(R.string.say_contact_not_found, spoken)); return null }
        return found.first()
    }

    private suspend fun callWho(spokenWho: String) {
        var who = spokenWho.trim()
        if (who.isEmpty()) {
            say(s(R.string.say_contact_who), record = false)
            who = listenOnceRaw()?.trim().orEmpty()
            if (who.isEmpty()) return
        }
        val number = FuzzyMatch.phoneNumber(who)?.takeIf { who.count { c -> c.isLetter() } == 0 }
        if (number != null) {
            if (askYesNo(s(R.string.say_call_confirm, spokenDigits(number))) == true) placeCall(spokenDigits(number), number)
            else say(s(R.string.say_call_cancelled), record = false)
            return
        }
        val c = pickContact(who) ?: return
        if (askYesNo(s(R.string.say_call_confirm, c.name)) == true) placeCall(c.name, c.number) else say(s(R.string.say_call_cancelled), record = false)
    }

    private suspend fun openApp(name: String, original: String) {
        val app = FuzzyMatch.rank(name, phone.installedApps(), { it.label }, 1).firstOrNull()?.first
        when {
            app != null -> { say(s(R.string.say_app_opening, app.label), record = false); if (!phone.launch(app)) say(s(R.string.say_app_not_found, name)) }
            cloudUsable() -> askAi(original)   // "open the door?" — maybe not an app at all
            else -> say(s(R.string.say_app_not_found, name))
        }
    }

    private suspend fun createNote(text: String) {
        var body = text.trim()
        if (body.isEmpty()) {
            say(s(R.string.say_note_what), record = false)
            body = listenOnceRaw()?.trim().orEmpty()
            if (body.isEmpty()) return
        }
        history.addNote(body)
        feedback.cue(Feedback.Cue.SUCCESS)
        say(s(R.string.say_note_saved, body))
    }

    private suspend fun readNotes() {
        val notes = history.notes()
        if (notes.isEmpty()) { say(s(R.string.say_notes_none)); return }
        val list = notes.take(10).mapIndexed { i, n -> "${i + 1}. ${n.text.trimEnd('.')}." }.joinToString(" ")
        say(p(R.plurals.say_notes_list, notes.size, notes.size, list))
    }

    private suspend fun setReminder(minutes: Int, text: String) {
        if (android.os.Build.VERSION.SDK_INT >= 33 && !hasPermission(Manifest.permission.POST_NOTIFICATIONS)) {
            ensurePermission(Manifest.permission.POST_NOTIFICATIONS, R.string.err_notif_why, R.string.err_notif_why)
        }
        scheduleReminder(minutes, text)
        feedback.cue(Feedback.Cue.SUCCESS)
        say(if (text.isBlank()) s(R.string.say_reminder_set_plain, formatDuration(minutes)) else s(R.string.say_reminder_set, formatDuration(minutes), text))
    }

    private fun scheduleReminder(minutes: Int, text: String) = reminders.schedule(minutes, text.trim())

    fun formatDuration(minutes: Int): String {
        val h = minutes / 60; val m = minutes % 60
        val hs = if (h == 0) null else p(R.plurals.duration_hours, h, h)
        val ms = if (m == 0) null else p(R.plurals.duration_minutes, m, m)
        return when {
            hs != null && ms != null -> s(R.string.duration_and, hs, ms)
            else -> hs ?: ms ?: p(R.plurals.duration_minutes, 1, 1)
        }
    }

    /** Called by the reminder worker when a reminder is due. */
    fun reminderText(text: String): String = if (text.isBlank()) s(R.string.reminder_text_empty) else s(R.string.reminder_text, text)

    /** Speaks something the user asked to be told later (reminders). Does not interrupt a conversation in progress. */
    fun announce(text: String) {
        scope.launch {
            while (listening || thinking) delay(500)
            say(text)
        }
    }

    private suspend fun readNotifications() {
        if (!phone.notificationAccessGranted()) {
            say(s(R.string.say_notif_access), record = false)
            phone.openNotificationAccessSettings()
            return
        }
        val items = notifications()
        if (items.isEmpty()) { say(s(R.string.say_notif_none)); return }
        val spoken = items.take(5).joinToString(" ") { n ->
            s(R.string.say_notif_item, n.app, listOf(n.title, n.text).filter { it.isNotBlank() }.joinToString(": ").trimEnd('.'))
        }
        // Not recorded in history: notification content stays out of storage.
        say(p(R.plurals.say_notif_list, items.size, items.size, spoken), record = false)
    }

    private suspend fun battery() {
        val pct = phone.batteryPercent()
        say(when {
            pct == null -> s(R.string.say_battery_unknown)
            phone.isCharging() -> s(R.string.say_battery_charging, pct)
            else -> s(R.string.say_battery, pct)
        })
    }

    /** Tells the user plainly which mode the app is in and what works without internet. */
    private suspend fun status() {
        val st = settings.value
        val online = connectivity.isOnline()
        val text = when {
            online && st.cloudAllowed && st.backendConfigured -> s(R.string.say_status_online) + " " + s(R.string.say_offline_can)
            !online -> s(R.string.say_status_offline) + " " + s(R.string.say_offline_can) + " " + s(R.string.say_online_needs)
            !st.cloudAllowed -> s(R.string.say_status_cloud_off) + " " + s(R.string.say_offline_can) + " " + s(R.string.say_online_needs)
            else -> s(R.string.say_status_no_backend) + " " + s(R.string.say_offline_can) + " " + s(R.string.say_online_needs)
        }
        say(text)
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Errors -> words
    // ------------------------------------------------------------------------------------------------------------------

    fun explain(e: Throwable): String = when (e) {
        is AiException.NotConfigured -> s(R.string.err_not_configured)
        is AiException.Offline -> s(R.string.err_offline)
        is AiException.Timeout -> s(R.string.err_timeout)
        is AiException.Unauthorized -> s(R.string.err_auth)
        is AiException.RateLimited -> s(R.string.err_rate)
        is AiException.Server -> s(R.string.err_server)
        is AiException -> s(R.string.err_ai_failed)
        is CameraException -> s(R.string.err_cam_unavailable)
        is DocumentException -> when (e.reason) {
            DocumentException.Reason.EMPTY -> s(R.string.say_doc_empty)
            else -> s(R.string.say_doc_unreadable)
        }
        is PermissionDenied -> s(R.string.err_perm_needed)
        else -> s(R.string.err_ai_failed)
    }

    // ------------------------------------------------------------------------------------------------------------------
    // Hands-free listening (user-controlled foreground service)
    // ------------------------------------------------------------------------------------------------------------------

    fun setHandsFree(on: Boolean) {
        if (on == (handsFreeJob?.isActive == true)) return
        if (!on) {
            handsFreeJob?.cancel(); handsFreeJob = null
            settings.update { it.copy(handsFree = false) }
            _state.update { it.copy(handsFreeActive = false) }
            serviceControl(false)
            quiet(s(R.string.say_listening_off))
            return
        }
        interaction?.cancel()
        interaction = scope.launch {
            if (!ensurePermission(Manifest.permission.RECORD_AUDIO, R.string.err_mic_why, R.string.err_mic_denied)) {
                settings.update { it.copy(handsFree = false) }; return@launch
            }
            if (android.os.Build.VERSION.SDK_INT >= 33 && !hasPermission(Manifest.permission.POST_NOTIFICATIONS)) {
                _events.emit(UiEvent.RequestPermission(Manifest.permission.POST_NOTIFICATIONS)) // optional: the service still runs without it
            }
            settings.update { it.copy(handsFree = true) }
            _state.update { it.copy(handsFreeActive = true) }
            serviceControl(true)
            say(s(R.string.say_listening_on), record = false)
            startHandsFreeLoop()
        }
    }

    private fun startHandsFreeLoop() {
        handsFreeJob?.cancel()
        handsFreeJob = scope.launch {
            var failures = 0
            while (true) {
                if (speaker.speaking.value || thinking || listening) { delay(500); continue }
                val r = stt.listen(lang, settings.value.preferOfflineStt)
                when (r) {
                    is SttResult.Heard -> {
                        failures = 0
                        val rest = CommandParser.stripWake(com.ecoleeyes.voice.TextNorm.normalize(r.text))
                        if (rest != null) {
                            feedback.cue(Feedback.Cue.LISTEN_START)
                            interaction?.cancel()
                            val job = scope.launch { handleUtterance(r.text) }
                            interaction = job
                            job.join()
                            if (rest.isEmpty()) listenFollowUp()
                        }
                    }
                    is SttResult.Failed -> when (r.error) {
                        SttError.NO_SPEECH -> delay(250)
                        SttError.BUSY -> delay(1000)
                        SttError.NO_PERMISSION, SttError.UNAVAILABLE, SttError.LANGUAGE_UNSUPPORTED -> { setHandsFree(false); say(sttMessage(r.error), record = false); return@launch }
                        else -> { failures++; delay(1500); if (failures >= 6) { setHandsFree(false); say(sttMessage(r.error), record = false); return@launch } }
                    }
                }
            }
        }
    }

    /** After only "Hello École Eyes": wait for the actual request. */
    private suspend fun listenFollowUp() {
        while (speaker.speaking.value) delay(200)
        val r = stt.listen(lang, settings.value.preferOfflineStt)
        if (r is SttResult.Heard) {
            interaction?.cancel()
            val job = scope.launch { handleUtterance(r.text) }
            interaction = job
            job.join()
        }
    }

    fun shutdown() {
        live.stop(); handsFreeJob?.cancel(); reader?.close(); speaker.shutdown()
    }
}
