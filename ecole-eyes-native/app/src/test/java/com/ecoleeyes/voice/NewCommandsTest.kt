package com.ecoleeyes.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Commands added for emergency, phone control and on-device vision, in Arabic, French and English. */
class NewCommandsTest {
    private fun p(s: String) = CommandParser.parse(s)

    private fun all(expected: Command, vararg phrases: String) {
        for (ph in phrases) assertEquals("\"$ph\"", expected, p(ph))
    }

    @Test fun emergency_in_three_languages_including_the_wake_phrase_form() {
        all(Command.Emergency, "Emergency", "Emergency École Eyes", "Hey École Eyes, emergency", "SOS", "This is an emergency",
            "Urgence", "Au secours !", "C'est une urgence", "طوارئ", "النجدة", "حالة طوارئ", "ايكول ايز طوارئ")
    }

    @Test fun emergency_calls() {
        all(Command.CallEmergencyServices, "call emergency services", "call an ambulance", "call the police", "appelle les urgences", "appelle les pompiers", "اتصل بالإسعاف", "اتصل بالشرطة")
        all(Command.CallEmergencyContact, "call my emergency contact", "appelle mon contact d'urgence")
        all(Command.ShareLocation, "share my location", "send my location", "partage ma position", "envoie ma localisation", "شارك موقعي", "ارسل موقعي")
        all(Command.Open(Screen.EMERGENCY), "open the emergency screen")
    }

    @Test fun choosing_an_emergency_contact_by_voice() {
        assertEquals(Command.SetEmergencyContact("ahmed"), p("set Ahmed as my emergency contact"))
        assertEquals(Command.SetEmergencyContact("amina"), p("change my emergency contact to Amina"))
        assertEquals(Command.SetEmergencyContact("maman"), p("mets maman comme contact d'urgence"))
        assertEquals(Command.SetEmergencyContact("احمد"), p("اجعل أحمد جهة اتصال الطوارئ"))
    }

    @Test fun calling_someone() {
        assertEquals(Command.Call("ahmed"), p("Call Ahmed"))
        assertEquals(Command.Call("mom"), p("call my mom"))
        assertEquals(Command.Call("karim saidi"), p("appelle Karim Saïdi"))
        assertEquals(Command.Call("باحمد"), p("اتصل بأحمد"))           // the controller retries without the glued ب
        assertEquals(Command.Call("0555 12 34 56"), p("call 0555 12 34 56"))
    }

    @Test fun notes() {
        assertEquals(Command.CreateNote("buy bread and milk"), p("Take a note buy bread and milk"))
        assertEquals(Command.CreateNote("the doctor is on Tuesday"), p("note that the doctor is on Tuesday"))
        assertEquals(Command.CreateNote("acheter du pain"), p("prends une note acheter du pain"))
        assertTrue(p("سجل ملاحظة موعد الطبيب يوم الثلاثاء") is Command.CreateNote)
        all(Command.CreateNote(""), "take a note", "nouvelle note", "سجل ملاحظة")
        all(Command.ReadNotes, "read my notes", "my notes", "lis mes notes", "اقرأ ملاحظاتي", "ملاحظاتي")
        all(Command.ClearNotes, "delete my notes", "supprime mes notes", "امسح ملاحظاتي")
    }

    @Test fun reminders() {
        assertEquals(Command.Remind(10, "take my medicine"), p("remind me in 10 minutes to take my medicine"))
        assertEquals(Command.Remind(5, "اطفاء الفرن"), p("ذكرني بعد 5 دقائق بإطفاء الفرن"))
        assertTrue(p("remind me tomorrow at 9 to call the bank") is Command.Ask)   // the AI converts absolute times
    }

    @Test fun device_information() {
        all(Command.Battery, "what is my battery level", "battery", "niveau de batterie", "كم البطارية")
        all(Command.Date, "what is the date today", "what day is it", "quelle est la date", "quel jour sommes-nous", "ما هو التاريخ", "ما تاريخ اليوم")
        all(Command.Status, "are you online", "what works offline", "mode hors ligne", "هل انت متصل", "ماذا يعمل بدون انترنت")
        all(Command.ReadNotifications, "read my notifications", "notifications", "lis mes notifications", "اقرأ الإشعارات")
    }

    @Test fun on_device_vision_questions() {
        all(Command.WhatColor, "what color is this", "what colour is it", "quelle couleur", "c'est quelle couleur", "ما لون هذا", "ما هو اللون")
        all(Command.People, "is there anyone in front of me", "is there someone here", "y a-t-il quelqu'un devant moi", "هل يوجد أحد أمامي")
    }

    @Test fun opening_other_apps() {
        assertEquals(Command.OpenApp("whatsapp"), p("open WhatsApp"))
        assertEquals(Command.OpenApp("google maps"), p("lance Google Maps"))
        assertEquals(Command.OpenApp("يوتيوب"), p("افتح يوتيوب"))
    }

    @Test fun existing_commands_are_not_hijacked() {
        assertEquals(Command.Help, p("help me"))                         // app help, not emergency
        assertEquals(Command.Open(Screen.CAMERA), p("open the camera"))
        assertEquals(Command.Open(Screen.SETTINGS), p("open settings"))
        assertEquals(Command.ReadLatest(DocType.PDF), p("open my latest pdf"))
        assertEquals(Command.Time, p("what time is it"))
        assertEquals(Command.ClearHistory, p("clear my history"))
        assertEquals(Command.Describe, p("describe what is in front of me"))
        assertEquals(Command.ReadTextInView, p("read the text"))
    }

    @Test fun offline_visual_fallbacks() {
        assertEquals(Command.WhatColor, CommandParser.looseVisual("What color is the chair?"))
        assertEquals(Command.People, CommandParser.looseVisual("Is anybody sitting on my left? any person?"))
        assertEquals(Command.Describe, CommandParser.looseVisual("ماذا يوجد أمامي على الطاولة"))
        assertTrue(CommandParser.isCurrencyQuestion("what banknote is this"))
        assertTrue(CommandParser.isCurrencyQuestion("c'est quel billet ?"))
        assertTrue(CommandParser.isCurrencyQuestion("كم هذه الورقة النقدية"))
    }
}
