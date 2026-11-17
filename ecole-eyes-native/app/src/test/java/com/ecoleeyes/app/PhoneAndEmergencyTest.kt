package com.ecoleeyes.app

import android.Manifest
import android.app.Application
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.a11y.Feedback
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
import com.ecoleeyes.phone.SpokenNotification
import com.ecoleeyes.vision.CameraHub
import com.ecoleeyes.vision.LocalObject
import com.ecoleeyes.vision.LocalScene
import com.ecoleeyes.vision.NBox
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.Screen
import com.ecoleeyes.voice.VolumeControl
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
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

/** Emergency, phone control and on-device vision, end to end with fakes for the phone, camera and speech. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@OptIn(ExperimentalCoroutinesApi::class)
class PhoneAndEmergencyTest {
    private lateinit var ctx: Application
    private lateinit var db: AppDatabase
    private val speaker = RecordingSpeaker()
    private val listener = ScriptedListener()
    private val ai = ScriptedAi()
    private val phone = FakePhone()
    private val reminders = FakeReminders()
    private var online = true
    private var notifs = emptyList<SpokenNotification>()
    private val vision = FakeVision(LocalScene(listOf(LocalObject("Table", 0.9f, NBox(0.3f, 0.3f, 0.7f, 0.9f))), emptyList(), listOf(NBox(0.75f, 0.1f, 0.95f, 0.3f))))
    private lateinit var settings: SettingsStore
    private lateinit var l10n: L10n
    private lateinit var history: HistoryRepository

    @Before fun setUp() {
        ctx = ApplicationProvider.getApplicationContext()
        shadowOf(ctx).grantPermissions(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA, Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_CONTACTS, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.POST_NOTIFICATIONS)
        db = Room.inMemoryDatabaseBuilder(ctx, AppDatabase::class.java).allowMainThreadQueries()
            .setQueryExecutor(Runnable::run).setTransactionExecutor(Runnable::run).build()
        settings = SettingsStore(ctx)
        settings.update { it.copy(lang = Lang.EN, consent = Consent.GRANTED, backendUrl = "https://backend.test", appToken = "", onboardingDone = true,
            announceUploads = false, emergencyName = "", emergencyNumber = "", emergencyServices = "112") }
        l10n = L10n(ctx)
        history = HistoryRepository(db, NoopCipher)
    }

    @After fun tearDown() { db.close() }

    private fun controller(scope: TestScope, camera: CameraHub = SolidCamera(ctx, SolidCamera.RED)): AssistantController {
        val ocr = OcrEngine(null)
        return AssistantController(
            context = ctx, scope = scope, settings = settings, l10n = l10n, speaker = speaker, stt = listener, brain = AssistantBrain(ai),
            camera = camera, ocr = ocr, docs = DocIndex(ctx), history = history, feedback = Feedback(ctx),
            volume = VolumeControl(ctx), connectivity = Connectivity { online },
            loaderFactory = { env -> DocumentLoader(ctx, ocr, env) },
            vision = vision, phone = phone, reminders = reminders, notifications = { notifs },
        )
    }

    private fun runCtl(block: suspend TestScope.() -> Unit) = runTest {
        try { block() } finally { coroutineContext[kotlinx.coroutines.Job]!!.children.forEach { it.cancel() } }
    }

    private fun str(id: Int, vararg a: Any) = l10n.str(settings.value.lang, id, *a)
    private fun TestScope.say(c: AssistantController, text: String) { c.submitText(text); advanceUntilIdle() }

    // ---- emergency ------------------------------------------------------------------------------------------------------

    @Test fun emergency_with_a_contact_calls_only_after_a_spoken_yes() = runCtl {
        settings.update { it.copy(emergencyName = "Amina", emergencyNumber = "0666000111") }
        val c = controller(this)
        listener.hear("yes")
        say(c, "Emergency École Eyes")
        assertEquals(Screen.EMERGENCY, c.state.value.screen)
        assertEquals(str(R.string.say_emergency_intro), speaker.texts[0])
        assertTrue(speaker.texts.contains(str(R.string.say_emergency_ask_call, "Amina")))
        assertEquals(listOf("0666000111"), phone.calls)
        assertEquals(str(R.string.say_calling, "Amina"), speaker.texts.last())
    }

    @Test fun emergency_no_means_no_call_and_lists_the_options() = runCtl {
        settings.update { it.copy(emergencyName = "Amina", emergencyNumber = "0666000111") }
        val c = controller(this)
        listener.hear("no")
        say(c, "urgence")
        assertTrue(phone.calls.isEmpty() && phone.dials.isEmpty())
        assertEquals(str(R.string.say_emergency_options), speaker.texts.last())
    }

    @Test fun emergency_without_a_contact_only_dials_the_public_number() = runCtl {
        val c = controller(this)
        listener.hear("yes")
        say(c, "SOS")
        assertTrue(speaker.texts.contains(str(R.string.say_emergency_no_contact, "1 1 2")))
        assertEquals(listOf("112"), phone.dials)
        assertTrue("emergency numbers are never called directly", phone.calls.isEmpty())
        assertEquals(str(R.string.say_dialer_open, "1 1 2"), speaker.texts.last())
    }

    @Test fun emergency_in_arabic_is_spoken_in_arabic() = runCtl {
        settings.update { it.copy(lang = Lang.AR) }
        val c = controller(this)
        listener.hear("لا")
        say(c, "طوارئ")
        assertEquals(Lang.AR, speaker.said.first().second)
        assertEquals(l10n.str(Lang.AR, R.string.say_emergency_intro), speaker.texts.first())
        assertTrue(phone.dials.isEmpty())
    }

    @Test fun silence_after_the_question_never_triggers_a_call() = runCtl {
        settings.update { it.copy(emergencyName = "Amina", emergencyNumber = "0666000111") }
        val c = controller(this)
        listener.queue += com.ecoleeyes.voice.SttResult.Failed(com.ecoleeyes.voice.SttError.NO_SPEECH)
        say(c, "emergency")
        assertTrue(phone.calls.isEmpty())
    }

    @Test fun ai_can_start_the_emergency_flow_after_its_reply() = runCtl {
        val c = controller(this)
        ai.toolCall(Tools.EMERGENCY).reply("I'm here. Let's get you help.")
        listener.hear("no")
        say(c, "I fell down and I can't get up")
        assertTrue(speaker.texts.indexOf("I'm here. Let's get you help.") < speaker.texts.indexOf(str(R.string.say_emergency_intro)))
        assertEquals(Screen.EMERGENCY, c.state.value.screen)
    }

    @Test fun location_goes_into_an_sms_the_user_sends_after_confirming() = runCtl {
        settings.update { it.copy(emergencyName = "Amina", emergencyNumber = "0666000111") }
        val c = controller(this)
        listener.hear("oui")
        say(c, "share my location")
        val (to, body) = phone.sms.single()
        assertEquals("0666000111", to)
        assertTrue(body, body.contains("https://maps.google.com/?q=36.753800,3.058800"))
        assertEquals(str(R.string.say_location_sms_ready, "Amina"), speaker.texts.last())
    }

    @Test fun location_without_contact_is_spoken_not_sent() = runCtl {
        val c = controller(this)
        say(c, "share my location")
        assertTrue(phone.sms.isEmpty())
        assertEquals(str(R.string.say_location_no_contact, "36.75380", "3.05880"), speaker.texts.last())
    }

    @Test fun no_location_fix_is_explained() = runCtl {
        settings.update { it.copy(emergencyName = "Amina", emergencyNumber = "0666000111") }
        phone.location = null
        val c = controller(this)
        say(c, "send my location")
        assertEquals(str(R.string.say_location_none), speaker.texts.last())
    }

    @Test fun emergency_contact_can_be_chosen_by_voice() = runCtl {
        val c = controller(this)
        listener.hear("yes")
        say(c, "set Ahmed as my emergency contact")
        assertEquals("Ahmed Benali", settings.value.emergencyName)
        assertEquals("0555123456", settings.value.emergencyNumber)
    }

    // ---- calls ----------------------------------------------------------------------------------------------------------

    @Test fun calling_a_contact_by_name_confirms_first() = runCtl {
        val c = controller(this)
        listener.hear("yes")
        say(c, "call Ahmed")
        assertTrue(speaker.texts.contains(str(R.string.say_call_confirm, "Ahmed Benali")))
        assertEquals(listOf("0555123456"), phone.calls)
    }

    @Test fun saying_no_cancels_the_call() = runCtl {
        val c = controller(this)
        listener.hear("non")
        say(c, "appelle Amina")
        assertTrue(phone.calls.isEmpty())
        assertEquals(str(R.string.say_call_cancelled), speaker.texts.last())
    }

    @Test fun arabic_glued_preposition_still_finds_the_contact() = runCtl {
        val c = controller(this)
        listener.hear("نعم")
        say(c, "اتصل بأحمد")
        assertEquals(listOf("0777000222"), phone.calls)
    }

    @Test fun unknown_contact_is_reported() = runCtl {
        val c = controller(this)
        say(c, "call Zorro")
        assertTrue(phone.calls.isEmpty())
        assertEquals(str(R.string.say_contact_not_found, "zorro"), speaker.texts.last())
    }

    @Test fun a_spoken_number_is_read_back_digit_by_digit() = runCtl {
        val c = controller(this)
        listener.hear("yes")
        say(c, "call 0555 12 34 56")
        assertTrue(speaker.texts.contains(str(R.string.say_call_confirm, "0 5 5 5 1 2 3 4 5 6")))
        assertEquals(listOf("0555123456"), phone.calls)
    }

    @Test fun without_call_permission_the_dialer_is_opened_instead() = runCtl {
        shadowOf(ctx).denyPermissions(Manifest.permission.CALL_PHONE)
        val c = controller(this)
        val events = ArrayList<UiEvent>()
        val job = launch(Dispatchers.Unconfined) { c.events.collect { events += it } }
        listener.hear("yes")
        c.submitText("call Ahmed"); advanceUntilIdle()
        assertTrue(events.contains(UiEvent.RequestPermission(Manifest.permission.CALL_PHONE)))
        c.onPermissionResult(Manifest.permission.CALL_PHONE, false); advanceUntilIdle()
        assertTrue(phone.calls.isEmpty())
        assertEquals(listOf("0555123456"), phone.dials)
        job.cancel()
    }

    // ---- notes, reminders, apps, device ---------------------------------------------------------------------------------

    @Test fun notes_are_saved_read_back_and_deleted() = runCtl {
        val c = controller(this)
        say(c, "take a note buy bread and milk")
        assertEquals(str(R.string.say_note_saved, "buy bread and milk"), speaker.texts.last())
        listener.hear("Doctor on Tuesday")
        say(c, "take a note")
        assertEquals(listOf("Doctor on Tuesday", "buy bread and milk"), history.notes().map { it.text })
        say(c, "read my notes")
        assertEquals(str(R.string.say_notes_list, 2, "1. Doctor on Tuesday. 2. buy bread and milk."), speaker.texts.last())
        say(c, "clear my history")
        assertEquals("history does not delete notes", 2, history.notes().size)
        say(c, "delete my notes")
        assertTrue(history.notes().isEmpty())
    }

    @Test fun relative_reminders_are_scheduled_offline() = runCtl {
        online = false
        val c = controller(this)
        say(c, "remind me in 90 minutes to take my medicine")
        assertEquals(listOf(90 to "take my medicine"), reminders.scheduled)
        assertEquals(str(R.string.say_reminder_set, "1 hour and 30 minutes", "take my medicine"), speaker.texts.last())
        assertEquals("Reminder: take my medicine", c.reminderText("take my medicine"))
    }

    @Test fun absolute_reminders_go_through_the_ai_tool() = runCtl {
        val c = controller(this)
        ai.toolCall(Tools.SET_REMINDER, buildJsonObject { put("minutes", 45); put("text", "call the bank") }).reply("Done, I'll remind you at five.")
        say(c, "remind me at 5 pm to call the bank")
        assertEquals(listOf(45 to "call the bank"), reminders.scheduled)
        assertEquals("Done, I'll remind you at five.", speaker.texts.last())
    }

    @Test fun absolute_reminder_offline_asks_for_a_relative_time() = runCtl {
        online = false
        val c = controller(this)
        say(c, "remind me tomorrow at 9 to call the bank")
        assertTrue(reminders.scheduled.isEmpty())
        assertEquals(str(R.string.say_reminder_need_time), speaker.texts.last())
    }

    @Test fun apps_open_by_name() = runCtl {
        val c = controller(this)
        say(c, "open WhatsApp")
        assertEquals(listOf("com.whatsapp"), phone.launched)
        assertEquals(str(R.string.say_app_opening, "WhatsApp"), speaker.texts.last())
        online = false
        say(c, "open Snapchat")
        assertEquals(str(R.string.say_app_not_found, "snapchat"), speaker.texts.last())
    }

    @Test fun battery_and_date() = runCtl {
        val c = controller(this)
        say(c, "battery level")
        assertEquals(str(R.string.say_battery, 76), speaker.texts.last())
        phone.charging = true
        say(c, "batterie")
        assertEquals(str(R.string.say_battery_charging, 76), speaker.texts.last())
        say(c, "what is the date today")
        assertTrue(speaker.texts.last().startsWith("Today is "))
    }

    @Test fun notifications_need_access_then_are_read_without_being_stored() = runCtl {
        val c = controller(this)
        say(c, "read my notifications")
        assertEquals(1, phone.openedNotificationSettings)
        assertEquals(str(R.string.say_notif_access), speaker.texts.last())
        phone.notificationAccess = true
        notifs = listOf(SpokenNotification("k", "WhatsApp", "Sara", "See you at 6", 0L))
        say(c, "read my notifications")
        assertEquals(str(R.string.say_notif_list, 1, str(R.string.say_notif_item, "WhatsApp", "Sara: See you at 6")), speaker.texts.last())
        val stored = history.transcript.first().map { it.text }
        assertFalse("notification content must not be saved", stored.any { it.contains("See you at 6") })
    }

    // ---- on-device vision and offline honesty ---------------------------------------------------------------------------

    @Test fun offline_description_uses_the_on_device_models() = runCtl {
        online = false
        val c = controller(this)
        say(c, "describe what is in front of me")
        assertEquals(1, vision.analyzed)
        assertTrue(ai.requests.isEmpty())
        val said = speaker.texts.last()
        assertTrue(said, said.startsWith("Offline estimate") && said.contains("one person on your right") && said.contains("table"))
    }

    @Test fun online_description_still_uses_the_cloud_model() = runCtl {
        val c = controller(this)
        ai.reply("A wooden table with a laptop.")
        say(c, "describe what is in front of me")
        assertEquals(0, vision.analyzed)
        assertEquals("A wooden table with a laptop.", speaker.texts.last())
    }

    @Test fun cloud_refused_means_on_device_description_even_when_online() = runCtl {
        settings.update { it.copy(consent = Consent.DENIED) }
        val c = controller(this)
        say(c, "is there anyone in front of me")
        assertTrue(ai.requests.isEmpty())
        assertEquals("I can see one person on your right.", speaker.texts.last())
    }

    @Test fun colour_is_answered_on_the_phone_from_the_real_pixels() = runCtl {
        val c = controller(this)
        say(c, "what color is this")
        assertTrue(ai.requests.isEmpty())
        assertTrue(speaker.texts.last(), speaker.texts.last().startsWith("It appears to be red"))
        online = false
        say(c, "What colour is the chair?")          // free question, offline -> closest on-device answer
        assertTrue(speaker.texts.last().startsWith("It appears to be red"))
    }

    @Test fun banknotes_offline_are_refused_honestly() = runCtl {
        online = false
        val c = controller(this)
        say(c, "what banknote is this")
        assertEquals(str(R.string.say_currency_offline), speaker.texts.last())
    }

    @Test fun status_says_what_works_offline() = runCtl {
        online = false
        val c = controller(this)
        say(c, "what works offline")
        val t = speaker.texts.last()
        assertTrue(t.startsWith(str(R.string.say_status_offline)) && t.contains(str(R.string.say_offline_can)) && t.contains(str(R.string.say_online_needs)))
        online = true
        say(c, "are you online")
        assertTrue(speaker.texts.last().startsWith(str(R.string.say_status_online)))
    }

    @Test fun durations_are_spoken_in_each_language() = runCtl {
        val c = controller(this)
        assertEquals("1 minute", c.formatDuration(1))
        assertEquals("2 hours", c.formatDuration(120))
        settings.update { it.copy(lang = Lang.FR) }
        assertEquals("1 heure et 5 minutes", c.formatDuration(65))
        settings.update { it.copy(lang = Lang.AR) }
        assertEquals("ساعة واحدة و١٠ دقيقة", c.formatDuration(70))   // Arabic locale digits, read correctly by TTS
    }
}
