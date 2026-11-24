package com.ecoleeyes.app

import android.Manifest
import android.app.Application
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.a11y.Feedback
import com.ecoleeyes.ai.AssistantBrain
import com.ecoleeyes.controller.AssistantController
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
import com.ecoleeyes.vision.LocalScene
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.Screen
import com.ecoleeyes.voice.SttError
import com.ecoleeyes.voice.SttResult
import com.ecoleeyes.voice.VolumeControl
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
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

/** A blind user who never touches the screen: everything below is driven by the microphone only. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@OptIn(ExperimentalCoroutinesApi::class)
class VoiceOnlyTest {
    private lateinit var ctx: Application
    private lateinit var db: AppDatabase
    private val speaker = RecordingSpeaker()
    private val listener = ScriptedListener()
    private val ai = ScriptedAi()
    private val service = ArrayList<Boolean>()
    private lateinit var settings: SettingsStore
    private lateinit var l10n: L10n

    @Before fun setUp() {
        ctx = ApplicationProvider.getApplicationContext()
        shadowOf(ctx).grantPermissions(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA)
        db = Room.inMemoryDatabaseBuilder(ctx, AppDatabase::class.java).allowMainThreadQueries()
            .setQueryExecutor(Runnable::run).setTransactionExecutor(Runnable::run).build()
        settings = SettingsStore(ctx)
        settings.update { it.copy(lang = Lang.EN, consent = Consent.GRANTED, backendUrl = "https://backend.test", appToken = "", onboardingDone = true, announceUploads = false) }
        assertTrue("voice only is the default", settings.value.voiceOnly)
        l10n = L10n(ctx)
    }

    @After fun tearDown() { db.close() }

    private fun controller(scope: TestScope) = AssistantController(
        context = ctx, scope = scope, settings = settings, l10n = l10n, speaker = speaker, stt = listener, brain = AssistantBrain(ai),
        camera = SolidCamera(ctx, SolidCamera.RED), ocr = OcrEngine(null), docs = DocIndex(ctx), history = HistoryRepository(db, NoopCipher),
        feedback = Feedback(ctx), volume = VolumeControl(ctx), connectivity = Connectivity { true },
        loaderFactory = { env -> DocumentLoader(ctx, OcrEngine(null), env) }, serviceControl = { on -> service += on },
        vision = FakeVision(LocalScene(emptyList(), emptyList(), emptyList())), phone = FakePhone(), reminders = FakeReminders(), notifications = { emptyList() },
    )

    private fun runCtl(block: suspend TestScope.() -> Unit) = runTest {
        try { block() } finally { coroutineContext[kotlinx.coroutines.Job]!!.children.forEach { it.cancel() } }
    }

    private fun str(id: Int, vararg a: Any) = l10n.str(Lang.EN, id, *a)
    private val silence get() = SttResult.Failed(SttError.NO_SPEECH)
    private fun timeSaid() = speaker.texts.any { it.startsWith("It is ") || it.contains(Regex("\\d{1,2}:\\d{2}")) }

    @Test fun the_app_listens_right_after_greeting_and_after_every_answer() = runCtl {
        val c = controller(this)
        listener.hear("open settings").hear("go home").hear("what time is it")
        c.greetOnStart(); advanceUntilIdle()
        assertEquals(str(R.string.say_hello), speaker.texts.first())
        assertTrue(speaker.texts.contains(str(R.string.say_opened_settings)))
        assertEquals(Screen.HOME, c.state.value.screen)
        assertTrue("time answered by voice alone", timeSaid())
        assertEquals("then listening again", 4, listener.calls)
        assertEquals(listOf(true), service)            // microphone notification shown while listening
    }

    @Test fun first_run_explains_there_is_no_need_to_touch_and_then_listens() = runCtl {
        settings.update { it.copy(onboardingDone = false, consent = Consent.UNKNOWN) }
        val c = controller(this)
        listener.hear("yes").hear("what time is it")
        c.startOnboarding(); advanceUntilIdle()
        assertTrue(speaker.texts.first().contains("do not need to touch the screen"))
        assertEquals(Consent.GRANTED, settings.value.consent)
        assertTrue(timeSaid())
    }

    @Test fun after_a_pause_only_the_wake_phrase_is_answered() = runCtl {
        val c = controller(this)
        listener.queue += silence; listener.queue += silence           // user stops talking -> standby
        listener.hear("so I told my brother what time is it")           // room conversation: ignored
        listener.hear("hey école eyes what time is it")                  // addressed to the app
        c.greetOnStart(); advanceUntilIdle()
        assertTrue(ai.requests.isEmpty())
        assertEquals("one answer only, to the wake phrase", 1, speaker.texts.count { it.contains(Regex("\\d{1,2}:\\d{2}")) })
        assertTrue("still listening afterwards", listener.calls >= 5)
    }

    @Test fun the_wake_phrase_alone_opens_the_conversation_again() = runCtl {
        val c = controller(this)
        listener.queue += silence; listener.queue += silence
        listener.hear("hey école eyes")
        listener.hear("what time is it")                                 // no wake phrase needed now
        c.greetOnStart(); advanceUntilIdle()
        assertTrue(timeSaid())
    }

    @Test fun stop_silences_and_waits_for_the_wake_phrase() = runCtl {
        val c = controller(this)
        listener.hear("stop").hear("what time is it").hear("hey école eyes what time is it")
        c.greetOnStart(); advanceUntilIdle()
        assertEquals(1, speaker.texts.count { it.contains(Regex("\\d{1,2}:\\d{2}")) })
    }

    @Test fun the_notification_stop_turns_the_microphone_off() = runCtl {
        val c = controller(this)
        c.greetOnStart(); advanceUntilIdle()                             // now waiting on the microphone
        val callsBefore = listener.calls
        c.setHandsFree(false); advanceUntilIdle()
        assertEquals(false, service.last())
        assertFalse(c.state.value.handsFreeActive)
        listener.hear("what time is it"); advanceUntilIdle()
        assertEquals("nobody listens any more", callsBefore, listener.calls)
    }

    @Test fun a_missing_recognizer_is_explained_instead_of_looping() = runCtl {
        val c = controller(this)
        listener.queue += SttResult.Failed(SttError.UNAVAILABLE)
        c.greetOnStart(); advanceUntilIdle()
        assertEquals(str(R.string.err_mic_unavailable), speaker.texts.last())
        assertEquals(1, listener.calls)
        assertEquals(false, service.last())
    }

    @Test fun the_mode_can_be_switched_off() = runCtl {
        settings.update { it.copy(voiceOnly = false) }
        val c = controller(this)
        c.greetOnStart(); advanceUntilIdle()
        assertEquals(0, listener.calls)
        assertTrue(service.isEmpty())
    }

    @Test fun arabic_user_never_touches_the_screen() = runCtl {
        settings.update { it.copy(lang = Lang.AR) }
        val c = controller(this)
        ai.reply("كوب أبيض من السيراميك.")
        listener.hear("افتح الكاميرا").hear("كم الساعة")
        c.greetOnStart(); advanceUntilIdle()
        assertEquals(Screen.CAMERA, c.state.value.screen)
        assertTrue(speaker.texts.contains("كوب أبيض من السيراميك."))
        assertTrue(speaker.said.all { it.second == Lang.AR })
    }
}
