package com.ecoleeyes.device

import com.ecoleeyes.voice.TextNorm
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DeviceParsingTest {
    private fun clock(s: String) = DeviceParsing.parseClock(TextNorm.normalize(s))
    private fun dur(s: String) = DeviceParsing.parseDuration(TextNorm.normalize(s))

    @Test fun clock_times_in_english() {
        assertEquals(ClockTime(7, 30), clock("set an alarm for 7:30"))
        assertEquals(ClockTime(19, 30), clock("set an alarm for 7:30 pm"))
        assertEquals(ClockTime(19, 30), clock("set an alarm for 7:30 p.m."))
        assertEquals(ClockTime(6, 0), clock("wake me up at 6 am"))
        assertEquals(ClockTime(6, 0), clock("wake me up at 6 o'clock"))
        assertEquals(ClockTime(0, 15), clock("alarm at 12:15 am"))
        assertEquals(ClockTime(12, 15), clock("alarm at 12:15 pm"))
        assertEquals(ClockTime(20, 0), clock("set an alarm for 8 in the evening"))
        assertEquals(ClockTime(7, 30), clock("set an alarm for half past 7"))
        assertEquals(ClockTime(0, 0), clock("set an alarm for midnight"))
        assertEquals(ClockTime(12, 0), clock("set an alarm for noon"))
    }

    @Test fun clock_times_in_french() {
        assertEquals(ClockTime(7, 30), clock("mets une alarme à 7h30"))
        assertEquals(ClockTime(7, 0), clock("réveille-moi à 7 heures"))
        assertEquals(ClockTime(7, 30), clock("réveille-moi à 7 heures 30"))
        assertEquals(ClockTime(19, 0), clock("règle une alarme à 19h"))
        assertEquals(ClockTime(19, 0), clock("une alarme à 7 heures du soir"))
        assertEquals(ClockTime(6, 30), clock("réveille-moi à 6 heures et demie"))
        assertEquals(ClockTime(12, 0), clock("une alarme à midi"))
    }

    @Test fun clock_times_in_arabic() {
        assertEquals(ClockTime(7, 0), clock("اضبط منبه على الساعة 7"))
        assertEquals(ClockTime(6, 30), clock("أيقظني الساعة 6 و 30"))
        assertEquals(ClockTime(6, 30), clock("أيقظني الساعة ٦ و ٣٠ صباحا"))
        assertEquals(ClockTime(21, 0), clock("ضع منبه الساعة 9 مساء"))
        assertEquals(ClockTime(7, 30), clock("اضبط المنبه على الساعة 7 والنصف"))
        assertEquals(ClockTime(5, 15), clock("اضبط المنبه على الساعة 5 وربع"))
    }

    @Test fun unclear_or_invalid_times_are_not_guessed() {
        assertNull(clock("set an alarm"))
        assertNull(clock("mets une alarme"))
        assertNull(clock("set an alarm for 25:00"))
        assertNull(clock("set an alarm for 7:75"))
    }

    @Test fun durations() {
        assertEquals(300, dur("set a timer for 5 minutes"))
        assertEquals(90, dur("timer 1 minute 30 seconds"))
        assertEquals(5400, dur("minuteur de 1 heure 30 minutes"))
        assertEquals(5400, dur("un minuteur d'une heure et demie".replace("une heure", "1 heure")))
        assertEquals(1800, dur("mets un minuteur d'une demi-heure"))
        assertEquals(600, dur("اضبط مؤقت 10 دقائق"))
        assertEquals(120, dur("مؤقت دقيقتين"))
        assertEquals(3600, dur("set a timer for an hour"))
        assertEquals(60, dur("set a timer for a minute"))
        assertEquals(45, dur("timer for 45 seconds"))
        assertNull(dur("set a timer"))
        assertNull(dur("set a timer for 0 minutes"))
    }

    @Test fun phone_numbers_are_extracted_from_speech() {
        assertEquals("0555123456", DeviceParsing.extractPhoneNumber("call 0555 12 34 56"))
        assertEquals("+33612345678", DeviceParsing.extractPhoneNumber("appelle le +33 6 12 34 56 78"))
        assertEquals("+213661234567", DeviceParsing.extractPhoneNumber("call plus 213 661 23 45 67"))
        assertEquals("0555123456", DeviceParsing.extractPhoneNumber("اتصل بالرقم ٠٥٥٥١٢٣٤٥٦"))
        assertEquals("0612345678", DeviceParsing.extractPhoneNumber("call 06-12-34-56-78"))
        assertNull(DeviceParsing.extractPhoneNumber("call mum"))
        assertNull(DeviceParsing.extractPhoneNumber("call 112"))   // too short to be sure; the AI/user is asked instead
    }

    @Test fun numbers_are_spoken_digit_by_digit() {
        assertEquals("0 5 5 5 1 2", DeviceParsing.spokenNumber("055512"))
        assertEquals("+ 3 3 6 1", DeviceParsing.spokenNumber("+3361"))
    }
}

class NameMatcherTest {
    private val apps = listOf("WhatsApp", "WhatsApp Business", "YouTube", "YouTube Music", "Maps", "Clock", "Gallery", "Phone", "Messages", "Calculator", "Chrome", "Google")
    private fun best(q: String) = NameMatcher.rank(apps, q, { it }).firstOrNull()?.first

    @Test fun matches_app_names_in_three_languages() {
        assertEquals("WhatsApp", best("whatsapp"))
        assertEquals("WhatsApp", best("WhatsApp"))
        assertEquals("WhatsApp", best("واتساب"))
        assertEquals("WhatsApp", best("الواتساب"))
        assertEquals("YouTube", best("youtube"))
        assertEquals("YouTube", best("يوتيوب"))
        assertEquals("YouTube Music", best("youtube music"))
        assertEquals("Maps", best("google maps"))
        assertEquals("Maps", best("خرائط جوجل"))
        assertEquals("Calculator", best("calculatrice"))
        assertEquals("Calculator", best("الآلة الحاسبة"))
        assertEquals("Clock", best("horloge"))
        assertEquals("Gallery", best("photos"))
        assertEquals("Phone", best("téléphone"))
        assertEquals("WhatsApp", best("l'application whatsapp"))
        assertEquals("WhatsApp", best("whatsap"))         // recognition typo
    }

    @Test fun unrelated_names_do_not_match() {
        assertNull(best("zorglub"))
        assertNull(best("the"))
        assertNull(best(""))
    }

    @Test fun contacts_with_accents_and_arabic() {
        val contacts = listOf("Hélène Martin", "Karim Benali", "أمي", "Mohamed Amine", "Dr Amina Saïdi")
        fun c(q: String) = NameMatcher.rank(contacts, q, { it }).firstOrNull()?.first
        assertEquals("Hélène Martin", c("helene"))
        assertEquals("Karim Benali", c("karim"))
        assertEquals("أمي", c("امي"))
        assertEquals("Dr Amina Saïdi", c("amina saidi"))
        assertTrue(NameMatcher.rank(contacts, "mohamed amine", { it }).first().second >= 0.97)
    }
}
