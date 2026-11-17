package com.ecoleeyes.app

import android.Manifest
import android.app.Application
import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.a11y.Feedback
import com.ecoleeyes.ai.AiException
import com.ecoleeyes.ai.AssistantBrain
import com.ecoleeyes.ai.Tools
import com.ecoleeyes.controller.AssistantController
import com.ecoleeyes.controller.UiEvent
import com.ecoleeyes.core.Connectivity
import com.ecoleeyes.core.Consent
import com.ecoleeyes.core.L10n
import com.ecoleeyes.core.Lang
import com.ecoleeyes.core.NoopCipher
import com.ecoleeyes.core.SettingsStore
import com.ecoleeyes.data.AppDatabase
import com.ecoleeyes.data.HistoryRepository
import com.ecoleeyes.docs.DocIndex
import com.ecoleeyes.docs.DocumentLoader
import com.ecoleeyes.vision.CameraHub
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.Screen
import com.ecoleeyes.voice.SttError
import com.ecoleeyes.voice.SttResult
import com.ecoleeyes.voice.VolumeControl
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

/**
 * End-to-end tests of the assistant's behaviour with the Android framework simulated and speech, AI
 * and camera replaced by fakes: what the user says -> what the assistant does and says.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@OptIn(ExperimentalCoroutinesApi::class)
class ControllerTest {
    private lateinit var ctx: Application
    private lateinit var db: AppDatabase
    private val speaker = RecordingSpeaker()
    private val listener = ScriptedListener()
    private val ai = ScriptedAi()
    private var online = true
    private lateinit var settings: SettingsStore
    private lateinit var l10n: L10n
    private lateinit var history: HistoryRepository
    private lateinit var brain: AssistantBrain

    @Before fun setUp() {
        ctx = ApplicationProvider.getApplicationContext()
        shadowOf(ctx).grantPermissions(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA)
        db = Room.inMemoryDatabaseBuilder(ctx, AppDatabase::class.java).allowMainThreadQueries()
            .setQueryExecutor(Runnable::run).setTransactionExecutor(Runnable::run).build()
        settings = SettingsStore(ctx)
        settings.update { it.copy(lang = Lang.EN, consent = Consent.GRANTED, backendUrl = "https://backend.test", appToken = "", onboardingDone = true, announceUploads = false) }
        l10n = L10n(ctx)
        history = HistoryRepository(db, NoopCipher)
        brain = AssistantBrain(ai)
    }

    @After fun tearDown() { db.close() }

    private fun controller(scope: TestScope, camera: CameraHub = CameraHub(ctx)): AssistantController {
        val ocr = OcrEngine(null)
        return AssistantController(
            context = ctx, scope = scope, settings = settings, l10n = l10n, speaker = speaker, stt = listener, brain = brain,
            camera = camera, ocr = ocr, docs = DocIndex(ctx), history = history, feedback = Feedback(ctx),
            volume = VolumeControl(ctx), connectivity = Connectivity { online },
            loaderFactory = { env -> DocumentLoader(ctx, ocr, env) },
        )
    }

    /** runTest waits for child coroutines; the controller's long-lived collectors are cancelled when the test body ends. */
    private fun runCtl(block: suspend TestScope.() -> Unit) = runTest {
        try { block() } finally { coroutineContext[kotlinx.coroutines.Job]!!.children.forEach { it.cancel() } }
    }

    private fun str(lang: Lang, id: Int, vararg a: Any) = l10n.str(lang, id, *a)

    private fun TestScope.say(c: AssistantController, text: String) { c.submitText(text); advanceUntilIdle() }

    // ---- local commands: work offline, in every language ----------------------------------------------------------------

    @Test fun time_is_spoken_in_the_current_language() = runCtl {
        val c = controller(this)
        for (lang in Lang.entries) {
            settings.update { it.copy(lang = lang) }
            speaker.said.clear()
            say(c, when (lang) { Lang.EN -> "what time is it"; Lang.FR -> "quelle heure est-il"; Lang.AR -> "كم الساعة" })
            assertEquals(lang, speaker.said.single().second)
            assertTrue(speaker.texts.single(), speaker.texts.single().isNotBlank() && speaker.texts.single().contains(Regex("\\d|[٠-٩]")))
        }
    }

    @Test fun switching_language_by_voice_confirms_in_the_new_language() = runCtl {
        val c = controller(this)
        say(c, "parle français")
        assertEquals(Lang.FR, settings.value.lang)
        assertEquals(str(Lang.FR, R.string.say_lang_fr) to Lang.FR, speaker.said.last())
        say(c, "تكلم بالعربية")
        assertEquals(Lang.AR, settings.value.lang)
        assertEquals(Lang.AR, speaker.said.last().second)
        say(c, "speak English")
        assertEquals(Lang.EN, settings.value.lang)
        assertEquals(str(Lang.EN, R.string.say_lang_en), speaker.texts.last())
    }

    @Test fun open_camera_then_go_back() = runCtl {
        settings.update { it.copy(autoDescribeCamera = false) }
        val c = controller(this)
        say(c, "open the camera")
        assertEquals(Screen.CAMERA, c.state.value.screen)
        assertEquals(str(Lang.EN, R.string.say_camera_ready), speaker.texts.last())
        say(c, "go back")
        assertEquals(Screen.HOME, c.state.value.screen)
        say(c, "go back")
        assertEquals(str(Lang.EN, R.string.say_no_back), speaker.texts.last())
    }

    @Test fun every_screen_can_be_opened_by_voice() = runCtl {
        val c = controller(this)
        for ((phrase, screen) in listOf("open settings" to Screen.SETTINGS, "open AI assistant" to Screen.ASSISTANT, "go home" to Screen.HOME, "show me my files" to Screen.FILES, "open my documents" to Screen.DOCUMENTS)) {
            say(c, phrase)
            assertEquals(phrase, screen, c.state.value.screen)
        }
    }

    @Test fun opening_files_without_access_explains_and_opens_the_folder_picker() = runCtl {
        val c = controller(this)
        val events = ArrayList<UiEvent>()
        val job = launch(kotlinx.coroutines.Dispatchers.Unconfined) { c.events.collect { events += it } }
        say(c, "show me my files")
        assertTrue(speaker.texts.contains(str(Lang.EN, R.string.say_no_folder)))
        assertTrue(events.contains(UiEvent.PickFolder))
        job.cancel()
    }

    @Test fun reading_without_authorizing_any_folder_never_touches_files() = runCtl {
        val c = controller(this)
        say(c, "read my latest PDF")
        assertTrue(speaker.texts.contains(str(Lang.EN, R.string.say_no_folder)))
        say(c, "read the document")
        assertEquals(str(Lang.EN, R.string.say_no_doc_open), speaker.texts.last())
    }

    @Test fun repeat_last_answer_and_nothing_to_repeat() = runCtl {
        val c = controller(this)
        say(c, "repeat")
        assertEquals(str(Lang.EN, R.string.say_nothing_to_repeat), speaker.texts.last())
        say(c, "what time is it")
        val time = speaker.texts.last()
        say(c, "repeat the last answer")
        assertEquals(time, speaker.texts.last())
    }

    @Test fun stop_silences_the_speaker() = runCtl {
        val c = controller(this)
        val before = speaker.stops
        say(c, "stop")
        assertTrue(speaker.stops > before)
    }

    @Test fun clear_history_empties_the_stored_conversation_and_ai_memory() = runCtl {
        val c = controller(this)
        ai.reply("Paris.")
        say(c, "What is the capital of France?")
        advanceUntilIdle()
        assertEquals(2, history.transcript.first().size)
        assertEquals(2, brain.memory.size())
        say(c, "clear my history")
        assertEquals(0, history.transcript.first().size)
        assertEquals(0, brain.memory.size())
        assertEquals(str(Lang.EN, R.string.say_history_cleared), speaker.texts.last())
    }

    // ---- AI questions ---------------------------------------------------------------------------------------------------

    @Test fun general_question_goes_to_the_ai_and_the_answer_is_spoken_and_stored() = runCtl {
        val c = controller(this)
        ai.reply("The capital of France is Paris.")
        say(c, "What is the capital of France?")
        assertEquals("The capital of France is Paris.", speaker.texts.last())
        val lines = history.transcript.first()
        assertEquals(listOf(true, false), lines.map { it.fromUser })
        assertEquals("What is the capital of France?", ai.requests.single().messages.last()["content"]!!.jsonArray[0].jsonObject["text"]!!.jsonPrimitive.content)
    }

    @Test fun follow_up_questions_carry_the_conversation() = runCtl {
        val c = controller(this, SolidCamera(ctx, SolidCamera.RED))
        ai.reply("A laptop and a white cup on a desk.").reply("The cup is next to the laptop.")
        say(c, "What is in front of me?")          // detailed description from one photo
        say(c, "What is next to the laptop?")      // follow-up answered with that description in memory
        val second = ai.requests[1].messages
        assertEquals(3, second.size)    // previous question + previous answer + new question
        assertTrue(second[1]["content"]!!.jsonArray[0].jsonObject["text"]!!.jsonPrimitive.content.contains("white cup"))
    }

    @Test fun ai_failures_are_always_explained_aloud_in_the_users_language() = runCtl {
        val c = controller(this)
        val cases = listOf(
            AiException.Timeout() to R.string.err_timeout,
            AiException.Unauthorized() to R.string.err_auth,
            AiException.RateLimited(null) to R.string.err_rate,
            AiException.Server(503) to R.string.err_server,
            AiException.BadResponse("x") to R.string.err_ai_failed,
            AiException.Offline() to R.string.err_offline,
        )
        for (lang in Lang.entries) {
            settings.update { it.copy(lang = lang) }
            for ((ex, res) in cases) {
                ai.fail(ex)
                say(c, "tell me a joke please")   // unmatched -> AI
                assertEquals("${lang} ${ex}", str(lang, res) to lang, speaker.said.last())
            }
        }
    }

    @Test fun no_internet_is_explained_without_calling_the_ai() = runCtl {
        online = false
        val c = controller(this)
        say(c, "What is the capital of France?")
        assertEquals(str(Lang.EN, R.string.err_offline), speaker.texts.last())
        assertEquals(0, ai.requests.size)
    }

    @Test fun missing_backend_address_is_explained() = runCtl {
        settings.update { it.copy(backendUrl = "") }
        val c = controller(this)
        say(c, "What is the capital of France?")
        assertEquals(str(Lang.EN, R.string.err_not_configured), speaker.texts.last())
    }

    @Test fun offline_file_search_still_works_on_the_phone() = runCtl {
        online = false
        val c = controller(this)
        say(c, "find my electricity bill")
        // no folder is authorized yet, so it asks for one instead of failing silently
        assertTrue(speaker.texts.contains(str(Lang.EN, R.string.say_no_folder)))
    }

    // ---- consent --------------------------------------------------------------------------------------------------------

    @Test fun without_consent_nothing_is_sent_to_the_cloud() = runCtl {
        settings.update { it.copy(consent = Consent.DENIED) }
        val c = controller(this)
        say(c, "What is the capital of France?")
        assertEquals(str(Lang.EN, R.string.say_cloud_off), speaker.texts.last())
        assertEquals(0, ai.requests.size)
    }

    @Test fun first_use_asks_for_consent_aloud_and_a_yes_enables_the_cloud() = runCtl {
        settings.update { it.copy(consent = Consent.UNKNOWN) }
        listener.hear("yes")
        ai.reply("Paris.")
        val c = controller(this)
        say(c, "What is the capital of France?")
        assertTrue(speaker.texts.contains(str(Lang.EN, R.string.say_consent)))
        assertEquals(Consent.GRANTED, settings.value.consent)
        assertEquals("Paris.", speaker.texts.last())    // the original question is answered after consent
    }

    @Test fun a_no_keeps_the_cloud_off() = runCtl {
        settings.update { it.copy(consent = Consent.UNKNOWN) }
        listener.hear("non")
        val c = controller(this)
        say(c, "What is the capital of France?")
        assertEquals(Consent.DENIED, settings.value.consent)
        assertEquals(0, ai.requests.size)
        assertEquals(str(Lang.EN, R.string.say_consent_no), speaker.texts.last())
    }

    @Test fun onboarding_welcomes_then_asks_for_consent() = runCtl {
        settings.update { it.copy(consent = Consent.UNKNOWN, onboardingDone = false) }
        listener.hear("oui")
        val c = controller(this)
        c.startOnboarding(); advanceUntilIdle()
        assertEquals(str(Lang.EN, R.string.say_welcome), speaker.texts.first())
        assertTrue(speaker.texts.contains(str(Lang.EN, R.string.say_consent)))
        assertEquals(Consent.GRANTED, settings.value.consent)
        assertTrue(settings.value.onboardingDone)
    }

    // ---- microphone: permissions and failures ---------------------------------------------------------------------------

    @Test fun mic_tap_listens_and_executes_what_was_said() = runCtl {
        val c = controller(this)
        listener.hear("what time is it")
        c.onMicTap(); advanceUntilIdle()
        assertTrue(speaker.texts.single().isNotBlank())
        assertEquals(1, listener.calls)
    }

    @Test fun without_mic_permission_it_explains_asks_and_explains_a_refusal() = runCtl {
        shadowOf(ctx).denyPermissions(Manifest.permission.RECORD_AUDIO)
        val c = controller(this)
        val events = ArrayList<UiEvent>()
        val job = launch(kotlinx.coroutines.Dispatchers.Unconfined) { c.events.collect { events += it } }
        c.onMicTap(); advanceUntilIdle()
        assertEquals(str(Lang.EN, R.string.err_mic_why), speaker.texts.single())      // reason first, before the system dialog
        assertEquals(UiEvent.RequestPermission(Manifest.permission.RECORD_AUDIO), events.single())
        c.onPermissionResult(Manifest.permission.RECORD_AUDIO, false); advanceUntilIdle()
        assertEquals(str(Lang.EN, R.string.err_mic_denied), speaker.texts.last())
        assertEquals(0, listener.calls)
        job.cancel()
    }

    @Test fun speech_recognition_failures_are_spoken() = runCtl {
        val c = controller(this)
        val cases = mapOf(
            SttError.NO_SPEECH to R.string.err_no_speech, SttError.NETWORK to R.string.err_stt_network, SttError.BUSY to R.string.err_stt_busy,
            SttError.UNAVAILABLE to R.string.err_mic_unavailable, SttError.NO_PERMISSION to R.string.err_mic_denied,
        )
        for ((err, res) in cases) {
            listener.queue += SttResult.Failed(err)
            c.onMicTap(); advanceUntilIdle()
            assertEquals(err.name, str(Lang.EN, res), speaker.texts.last())
        }
    }

    // ---- camera / tools -------------------------------------------------------------------------------------------------

    @Test fun describing_with_a_camera_that_will_not_start_is_reported_not_faked() = runCtl {
        val c = controller(this)
        c.submitText("What is in front of me?")
        advanceTimeBy(10_000); advanceUntilIdle()
        assertEquals(Screen.CAMERA, c.state.value.screen)       // it opened the camera
        assertTrue("nothing is sent or invented without a photo", ai.requests.isEmpty())
        assertEquals(str(Lang.EN, R.string.err_cam_unavailable), speaker.texts.last())
    }

    @Test fun camera_permission_denied_is_explained() = runCtl {
        shadowOf(ctx).denyPermissions(Manifest.permission.CAMERA)
        val c = controller(this)
        ai.toolCall(Tools.CAPTURE_VIEW).reply("I need camera permission.")
        c.submitText("What is in front of me?"); advanceUntilIdle()
        assertEquals(str(Lang.EN, R.string.err_cam_why), speaker.texts.first())
        c.onPermissionResult(Manifest.permission.CAMERA, false); advanceUntilIdle()
        assertTrue(speaker.texts.contains(str(Lang.EN, R.string.err_cam_denied)))
    }

    @Test fun reading_text_with_arabic_but_no_cloud_says_what_is_missing() = runCtl {
        settings.update { it.copy(lang = Lang.AR, consent = Consent.DENIED) }
        val c = controller(this)
        c.readTextNow(); advanceTimeBy(10_000); advanceUntilIdle()
        // camera cannot start in a unit test -> must be explained, never silent
        assertEquals(str(Lang.AR, R.string.err_cam_unavailable) to Lang.AR, speaker.said.last())
    }

    @Test fun the_ai_cannot_run_unknown_tools() = runCtl {
        val c = controller(this)
        ai.toolCall("delete_all_files").reply("I cannot do that.")
        say(c, "please wipe my phone")
        val res = ai.requests[1].messages.last()["content"]!!.jsonArray[0].jsonObject
        assertEquals("true", res["is_error"]!!.jsonPrimitive.content)
        assertEquals("I cannot do that.", speaker.texts.last())
    }

    @Test fun the_ai_can_navigate_and_change_language_through_tools() = runCtl {
        val c = controller(this)
        ai.toolCall(Tools.NAVIGATE, buildJsonObject { put("screen", "settings") }).reply("Settings opened.")
        say(c, "take me to where I can change things")
        assertEquals(Screen.SETTINGS, c.state.value.screen)
        ai.toolCall(Tools.SET_LANGUAGE, buildJsonObject { put("language", "fr") }).reply("D'accord.")
        say(c, "je voudrais que tu parles dans ma langue")
        assertEquals(Lang.FR, settings.value.lang)
    }

    // ---- hands-free -----------------------------------------------------------------------------------------------------

    @Test fun hands_free_ignores_chatter_and_reacts_only_to_the_wake_phrase() = runCtl {
        var serviceOn = false
        val c = AssistantController(
            ctx, this, settings, l10n, speaker, listener, brain, CameraHub(ctx), OcrEngine(null), DocIndex(ctx), history, Feedback(ctx), VolumeControl(ctx),
            Connectivity { online }, { env -> DocumentLoader(ctx, OcrEngine(null), env) }, serviceControl = { serviceOn = it },
        )
        listener.hear("some people talking nearby").hear("Hello École Eyes what time is it")
        c.setHandsFree(true); runCurrent(); advanceUntilIdle()
        assertTrue(serviceOn)
        assertEquals(str(Lang.EN, R.string.say_listening_on), speaker.texts.first())
        // only the wake-phrase utterance produced an answer
        assertEquals(2, speaker.texts.size)
        assertTrue(speaker.texts[1].isNotBlank())
        c.setHandsFree(false); advanceUntilIdle()
        assertFalse(serviceOn)
        assertEquals(str(Lang.EN, R.string.say_listening_off), speaker.texts.last())
    }

    @Test fun hands_free_needs_the_microphone_permission_and_says_so() = runCtl {
        shadowOf(ctx).denyPermissions(Manifest.permission.RECORD_AUDIO)
        val c = controller(this)
        c.setHandsFree(true); advanceUntilIdle()
        assertEquals(str(Lang.EN, R.string.err_mic_why), speaker.texts.first())
        c.onPermissionResult(Manifest.permission.RECORD_AUDIO, false); advanceUntilIdle()
        assertFalse(settings.value.handsFree)
    }
}
