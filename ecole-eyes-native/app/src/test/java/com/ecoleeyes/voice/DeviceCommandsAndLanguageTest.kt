package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang
import com.ecoleeyes.device.ClockTime
import com.ecoleeyes.device.SettingsKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DeviceCommandParserTest {
    private fun p(s: String) = CommandParser.parse(s)

    @Test fun date_and_battery() {
        for (s in listOf("what's the date", "what day is it today", "quelle date sommes-nous", "on est quel jour", "quel jour sommes-nous aujourd'hui", "ما التاريخ", "ما هو تاريخ اليوم"))
            assertEquals(s, Command.Date, p(s))
        for (s in listOf("battery level", "how much battery do I have", "niveau de batterie", "il reste combien de batterie", "كم البطارية", "مستوى البطارية"))
            assertEquals(s, Command.Battery, p(s))
        // the time question is still the time
        assertEquals(Command.Time, p("what time is it"))
    }

    @Test fun alarms_and_timers() {
        assertEquals(Command.SetAlarm(ClockTime(7, 30)), p("set an alarm for 7:30"))
        assertEquals(Command.SetAlarm(ClockTime(6, 0)), p("wake me up at 6 am"))
        assertEquals(Command.SetAlarm(ClockTime(7, 30)), p("Mets une alarme à 7h30"))
        assertEquals(Command.SetAlarm(ClockTime(7, 0)), p("réveille-moi à 7 heures"))
        assertEquals(Command.SetAlarm(ClockTime(7, 0)), p("اضبط منبه على الساعة 7"))
        assertEquals(Command.SetAlarm(null), p("set an alarm"))
        assertEquals(Command.SetAlarm(null), p("ضع منبه"))
        assertEquals(Command.SetTimer(300), p("set a timer for 5 minutes"))
        assertEquals(Command.SetTimer(600), p("lance un minuteur de 10 minutes"))
        assertEquals(Command.SetTimer(120), p("شغل مؤقت دقيقتين"))
        assertEquals(Command.SetTimer(null), p("start a timer"))
        assertEquals(Command.SetTimer(1200), p("remind me in 20 minutes"))
    }

    @Test fun calls() {
        assertEquals(Command.Call("mum"), p("call mum"))
        assertEquals(Command.Call("karim benali"), p("Call Karim Benali"))
        assertEquals(Command.Call("maman"), p("appelle maman"))
        assertEquals(Command.Call("0555123456"), p("call 0555 12 34 56"))
        assertEquals(Command.Call("+33612345678"), p("appelle le +33 6 12 34 56 78"))
        assertEquals(Command.Call("بامي"), p("اتصل بأمي"))
        assertEquals(Command.Call("كريم"), p("اتصل على كريم"))
    }

    @Test fun notifications_and_system_settings() {
        for (s in listOf("read my notifications", "do I have notifications", "lis mes notifications", "اقرأ الإشعارات", "هل لدي إشعارات"))
            assertEquals(s, Command.ReadNotifications, p(s))
        assertEquals(Command.OpenSystemSettings(SettingsKind.WIFI), p("open wifi settings"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.WIFI), p("turn on the wi-fi"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.WIFI), p("active le wifi"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.BLUETOOTH), p("شغل البلوتوث"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.GENERAL), p("open the phone settings"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.GENERAL), p("ouvre les paramètres du téléphone"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.GENERAL), p("افتح إعدادات الهاتف"))
        assertEquals(Command.OpenSystemSettings(SettingsKind.ACCESSIBILITY), p("open talkback settings"))
        // the app's own settings stay the app's own
        assertEquals(Command.Open(Screen.SETTINGS), p("open settings"))
        assertEquals(Command.Open(Screen.SETTINGS), p("ouvre les paramètres"))
    }

    @Test fun open_other_apps_without_breaking_app_navigation() {
        assertEquals(Command.OpenApp("whatsapp"), p("open WhatsApp"))
        assertEquals(Command.OpenApp("whatsapp"), p("ouvre l'application WhatsApp"))
        assertEquals(Command.OpenApp("youtube"), p("lance YouTube"))
        assertEquals(Command.OpenApp("الواتساب"), p("افتح الواتساب"))
        assertEquals(Command.OpenApp("google maps"), p("please open google maps"))
        // unchanged behaviour
        assertEquals(Command.Open(Screen.CAMERA), p("open the camera"))
        assertEquals(Command.Open(Screen.DOCUMENTS), p("open my documents"))
        assertEquals(Command.Open(Screen.ASSISTANT), p("open the assistant"))
        assertEquals(Command.ReadCurrent, p("start reading"))
        assertTrue(p("open the latest pdf") is Command.ReadLatest)
        assertTrue(p("open the document named budget") is Command.ReadNamed)
        assertTrue(p("open it") !is Command.OpenApp)
    }
}

class LanguageDetectorTest {
    @Test fun clear_utterances_are_detected() {
        assertEquals(Lang.AR, LanguageDetector.detect("ماذا يوجد أمامي"))
        assertEquals(Lang.AR, LanguageDetector.detect("اقرأ لي هذا النص من فضلك"))
        assertEquals(Lang.FR, LanguageDetector.detect("qu'est-ce qu'il y a devant moi"))
        assertEquals(Lang.FR, LanguageDetector.detect("lis le texte s'il te plaît"))
        assertEquals(Lang.FR, LanguageDetector.detect("quelle heure est-il"))
        assertEquals(Lang.FR, LanguageDetector.detect("décris la pièce"))
        assertEquals(Lang.EN, LanguageDetector.detect("what is in front of me"))
        assertEquals(Lang.EN, LanguageDetector.detect("read this text please"))
        assertEquals(Lang.EN, LanguageDetector.detect("tell me the time"))
    }

    @Test fun short_or_ambiguous_utterances_never_switch() {
        for (s in listOf("ok", "WhatsApp", "stop", "oui", "non", "YouTube Music", "Karim", "12 34", "taxi", "", "  "))
            assertNull(s, LanguageDetector.detect(s))
    }

    @Test fun mixed_script_follows_the_majority() {
        assertEquals(Lang.AR, LanguageDetector.detect("افتح تطبيق WhatsApp من فضلك"))
        assertNull(LanguageDetector.detect("open واتساب"))
    }
}
