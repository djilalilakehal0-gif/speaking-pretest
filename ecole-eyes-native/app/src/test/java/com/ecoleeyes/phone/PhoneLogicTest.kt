package com.ecoleeyes.phone

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneLogicTest {

    private val contacts = listOf("Ahmed Benali", "Amina Haddad", "Maman", "Dr. Karim Saïdi", "أحمد بن علي", "Sarah", "Sara Lopez")

    private fun best(q: String) = FuzzyMatch.rank(q, contacts, { it }, 3).firstOrNull()?.first

    @Test fun spoken_names_find_the_right_contact() {
        assertEquals("Ahmed Benali", best("ahmed"))
        assertEquals("Ahmed Benali", best("Ahmed Benali"))
        assertEquals("Maman", best("maman"))
        assertEquals("Dr. Karim Saïdi", best("karim saidi"))       // accents and punctuation ignored
        assertEquals("أحمد بن علي", best("احمد"))                  // Arabic hamza variants
        assertEquals("Amina Haddad", best("amina hadad"))           // recognizer typo
    }

    @Test fun exact_match_beats_prefix_match() {
        assertEquals("Sarah", best("sarah"))
        assertEquals("Sara Lopez", best("sara lopez"))
    }

    @Test fun weak_matches_are_refused_rather_than_calling_the_wrong_person() {
        assertNull(best("bob"))
        assertNull(best("li"))
        assertTrue(FuzzyMatch.score("x", "Ahmed") < FuzzyMatch.MIN_SCORE)
    }

    @Test fun app_names_match_with_spaces_or_without() {
        val apps = listOf("WhatsApp", "Google Maps", "YouTube", "Phone", "Messages")
        assertEquals("WhatsApp", FuzzyMatch.rank("whats app", apps, { it }).first().first)
        assertEquals("Google Maps", FuzzyMatch.rank("maps", apps, { it }).first().first)
        assertEquals("YouTube", FuzzyMatch.rank("youtube", apps, { it }).first().first)
    }

    @Test fun spoken_phone_numbers_are_extracted() {
        assertEquals("0555123456", FuzzyMatch.phoneNumber("0555 12 34 56"))
        assertEquals("+213555123456", FuzzyMatch.phoneNumber("+213 555 123 456"))
        assertEquals("0555123456", FuzzyMatch.phoneNumber("٠٥٥٥١٢٣٤٥٦"))
        assertNull(FuzzyMatch.phoneNumber("ahmed"))
        assertNull(FuzzyMatch.phoneNumber("5"))
    }

    // ---- reminders ------------------------------------------------------------------------------------------------------

    private fun r(s: String) = ReminderParser.parse(s)

    @Test fun english_reminders() {
        assertEquals(ReminderParser.Reminder(10, "take my medicine"), r("Remind me in 10 minutes to take my medicine"))
        assertEquals(ReminderParser.Reminder(120, "call the bank"), r("remind me in 2 hours to call the bank"))
        assertEquals(ReminderParser.Reminder(30, "call sara"), r("remind me to call Sara in half an hour"))
        assertEquals(ReminderParser.Reminder(60, ""), r("remind me in an hour"))
        assertEquals(ReminderParser.Reminder(5, "check the oven"), r("set a reminder in five minutes to check the oven"))
    }

    @Test fun french_reminders() {
        assertEquals(ReminderParser.Reminder(15, "appeler maman"), r("Rappelle-moi dans 15 minutes d'appeler maman"))
        assertEquals(ReminderParser.Reminder(60, "sortir le linge"), r("rappelle moi dans une heure de sortir le linge"))
        assertEquals(ReminderParser.Reminder(30, "prendre le bus"), r("rappelle-moi dans une demi-heure de prendre le bus"))
    }

    @Test fun arabic_reminders() {
        assertEquals(ReminderParser.Reminder(5, "اطفاء الفرن"), r("ذكرني بعد 5 دقائق بإطفاء الفرن"))
        assertEquals(ReminderParser.Reminder(120, "الدواء"), r("ذكرني بعد ساعتين بالدواء"))
        assertEquals(ReminderParser.Reminder(30, "الصلاه"), r("ذكرني بعد نصف ساعة بالصلاة"))
    }

    @Test fun reminders_without_a_relative_time_are_left_to_the_ai() {
        assertNull(r("remind me at 5 pm to call mom"))
        assertTrue(ReminderParser.isReminderRequest("remind me at 5 pm to call mom"))
        assertNull(r("what time is it"))
        assertNull(r("remind me in 99999 minutes"))       // more than a week: refused
    }
}
