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
import com.ecoleeyes.vision.LocalObject
import com.ecoleeyes.vision.LocalScene
import com.ecoleeyes.vision.NBox
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.Screen
import com.ecoleeyes.voice.SttError
import com.ecoleeyes.voice.SttResult
import com.ecoleeyes.voice.VolumeControl
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
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
 * "Open the camera" -> the object in front is described at once, in detail, with no filler; the microphone stays
 * open so "describe this thing" works without touching the screen.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@OptIn(ExperimentalCoroutinesApi::class)
class CameraFlowTest {
    private lateinit var ctx: Application
    private lateinit var db: AppDatabase
    private val speaker = RecordingSpeaker()
    private val listener = ScriptedListener()
    private val ai = ScriptedAi()
    private var online = true
    private val vision = FakeVision(LocalScene(listOf(LocalObject("Cup", 0.9f, NBox(0.3f, 0.3f, 0.7f, 0.8f))), emptyList(), emptyList()))
    private lateinit var settings: SettingsStore
    private lateinit var l10n: L10n
    private lateinit var brain: AssistantBrain

    @Before fun setUp() {
        ctx = ApplicationProvider.getApplicationContext()
        shadowOf(ctx).grantPermissions(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA)
        db = Room.inMemoryDatabaseBuilder(ctx, AppDatabase::class.java).allowMainThreadQueries()
            .setQueryExecutor(Runnable::run).setTransactionExecutor(Runnable::run).build()
        settings = SettingsStore(ctx)
        settings.update { it.copy(lang = Lang.EN, consent = Consent.GRANTED, backendUrl = "https://backend.test", appToken = "", onboardingDone = true,
            announceUploads = false, autoDescribeCamera = true, cameraListening = true) }
        l10n = L10n(ctx)
        brain = AssistantBrain(ai)
    }

    @After fun tearDown() { db.close() }

    private fun controller(scope: TestScope): AssistantController {
        val ocr = OcrEngine(null)
        return AssistantController(
            context = ctx, scope = scope, settings = settings, l10n = l10n, speaker = speaker, stt = listener, brain = brain,
            camera = SolidCamera(ctx, SolidCamera.RED), ocr = ocr, docs = DocIndex(ctx), history = HistoryRepository(db, NoopCipher), feedback = Feedback(ctx),
            volume = VolumeControl(ctx), connectivity = Connectivity { online },
            loaderFactory = { env -> DocumentLoader(ctx, ocr, env) },
            vision = vision, phone = FakePhone(), reminders = FakeReminders(), notifications = { emptyList() },
        )
    }

    private fun runCtl(block: suspend TestScope.() -> Unit) = runTest {
        try { block() } finally { coroutineContext[kotlinx.coroutines.Job]!!.children.forEach { it.cancel() } }
    }

    private fun str(id: Int, vararg a: Any) = l10n.str(settings.value.lang, id, *a)
    private fun TestScope.say(c: AssistantController, text: String) { c.submitText(text); advanceUntilIdle() }
    private val silence get() = SttResult.Failed(SttError.NO_SPEECH)

    private val mug = "A white ceramic mug with a blue handle, about the size of your palm. The label says Café Nour, 250 ml."

    @Test fun opening_the_camera_describes_the_object_at_once_without_an_announcement() = runCtl {
        val c = controller(this)
        ai.reply(mug)
        say(c, "open the camera")
        assertEquals(Screen.CAMERA, c.state.value.screen)
        assertEquals(listOf(mug), speaker.texts)                       // nothing before or after the description
        val req = ai.requests.single()
        assertTrue("detailed, no-filler instructions", req.system.contains("START DIRECTLY") && req.system.contains("Never begin with"))
        val blocks = req.messages.single().jsonObject["content"]!!.jsonArray
        assertEquals("image", blocks[0].jsonObject["type"]!!.jsonPrimitive.content)
        assertTrue("the microphone re-opened by itself", listener.calls >= 1)
    }

    @Test fun describe_this_thing_works_without_pressing_anything_in_every_language() = runCtl {
        val c = controller(this)
        for ((lang, phrase) in listOf(Lang.EN to "describe this thing", Lang.FR to "décris cet objet", Lang.AR to "صف لي هذا الشيء", Lang.AR to "واش هذا")) {
            settings.update { it.copy(lang = lang) }
            speaker.said.clear(); ai.requests.clear()
            ai.reply("first look").reply("detailed answer")
            listener.hear(phrase)
            say(c, "go home"); say(c, "open the camera")
            assertEquals(phrase, 2, ai.requests.size)
            assertEquals(phrase, "detailed answer", speaker.texts.last())
            assertTrue(phrase, ai.requests.last().system.contains("the object in front of the camera"))
        }
    }

    @Test fun follow_up_questions_know_the_description() = runCtl {
        val c = controller(this)
        ai.reply(mug)
        say(c, "open the camera")
        assertEquals(2, brain.memory.size())   // description kept for "what colour is the handle?"
    }

    @Test fun two_silences_close_the_microphone_quietly() = runCtl {
        val c = controller(this)
        ai.reply(mug)
        listener.queue += silence; listener.queue += silence
        say(c, "open the camera")
        assertEquals(2, listener.calls)
        assertEquals(listOf(mug), speaker.texts)   // no "I did not hear you" chatter
        assertEquals(Screen.CAMERA, c.state.value.screen)
    }

    @Test fun stop_and_leaving_the_camera_end_listening() = runCtl {
        val c = controller(this)
        ai.reply(mug)
        listener.hear("stop")
        say(c, "open the camera")
        assertEquals(1, listener.calls)
        ai.reply(mug)
        listener.hear("go back")
        say(c, "open the camera")
        assertEquals(Screen.HOME, c.state.value.screen)
        assertEquals(2, listener.calls)
    }

    @Test fun offline_the_phone_describes_object_colour_and_says_it_is_an_estimate() = runCtl {
        online = false
        val c = controller(this)
        say(c, "open the camera")
        val t = speaker.texts.single()
        assertTrue(t, t.startsWith("It looks like a cup.") && t.contains("red") && t.contains("Offline estimate"))
        assertTrue(ai.requests.isEmpty())
    }

    @Test fun the_photo_notice_is_spoken_once_then_replaced_by_a_sound() = runCtl {
        settings.update { it.copy(announceUploads = true) }
        val c = controller(this)
        ai.reply("one").reply("two")
        listener.hear("what is this")
        say(c, "open the camera")
        assertEquals(1, speaker.texts.count { it == str(R.string.say_uploading_photo) })
        assertEquals("two", speaker.texts.last())
    }

    @Test fun both_behaviours_can_be_turned_off_in_settings() = runCtl {
        settings.update { it.copy(autoDescribeCamera = false, cameraListening = false) }
        val c = controller(this)
        say(c, "open the camera")
        assertEquals(listOf(str(R.string.say_camera_ready)), speaker.texts)
        assertEquals(0, listener.calls)
        assertTrue(ai.requests.isEmpty())
    }

    @Test fun the_camera_tile_behaves_like_the_voice_command() = runCtl {
        val c = controller(this)
        ai.reply(mug)
        c.openCameraFromUi(); advanceUntilIdle()
        assertEquals(Screen.CAMERA, c.state.value.screen)
        assertEquals(mug, speaker.texts.single())
        assertTrue(listener.calls >= 1)
    }

    @Test fun a_dark_picture_is_reported_instead_of_sent() = runCtl {
        val c = AssistantController(
            context = ctx, scope = this, settings = settings, l10n = l10n, speaker = speaker, stt = listener, brain = brain,
            camera = SolidCamera(ctx, android.graphics.Color.BLACK), ocr = OcrEngine(null), docs = DocIndex(ctx), history = HistoryRepository(db, NoopCipher),
            feedback = Feedback(ctx), volume = VolumeControl(ctx), connectivity = Connectivity { online },
            loaderFactory = { env -> DocumentLoader(ctx, OcrEngine(null), env) }, vision = vision, phone = FakePhone(), reminders = FakeReminders(), notifications = { emptyList() },
        )
        listener.queue += silence; listener.queue += silence
        say(c, "open the camera")
        assertTrue(ai.requests.isEmpty())
        assertEquals(str(R.string.err_image_unclear), speaker.texts.single())
        assertFalse(speaker.texts.any { it.contains("START") })
    }
}
