package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CommandParserTest {
    private fun p(s: String) = CommandParser.parse(s)

    private fun assertAll(expected: Command, vararg phrases: String) {
        for (ph in phrases) assertEquals("\"$ph\"", expected, p(ph))
    }

    @Test fun stop_in_three_languages() = assertAll(Command.Stop,
        "Stop", "stop!", "Be quiet", "silence", "Arrête", "tais-toi", "Ça suffit", "توقف", "اسكت", "قف", "كفى")

    @Test fun greeting_wake_phrase() = assertAll(Command.Greeting,
        "Hello École Eyes", "hello ecole eyes.", "Bonjour École Eyes", "مرحبا ايكول ايز", "Hey ecole eyes")

    @Test fun help() = assertAll(Command.Help,
        "What can you do?", "what can you do", "Que sais-tu faire ?", "ماذا تستطيع أن تفعل؟", "help")

    @Test fun time() = assertAll(Command.Time,
        "What time is it?", "what's the time", "What is the time now", "Quelle heure est-il ?", "كم الساعة؟", "ما الوقت")

    @Test fun volume() {
        assertAll(Command.VolumeUp, "Increase the volume", "turn up the volume", "volume up", "louder", "Augmente le volume", "plus fort", "ارفع الصوت")
        assertAll(Command.VolumeDown, "decrease the volume", "Volume down", "lower the volume", "Baisse le volume", "moins fort", "اخفض الصوت")
    }

    @Test fun speed() {
        assertAll(Command.SpeedUp, "speak faster", "faster", "parle plus vite", "تكلم أسرع")
        assertAll(Command.SpeedDown, "speak slower", "slower", "parle plus lentement", "تكلم أبطأ")
    }

    @Test fun language_switching_by_voice() {
        assertAll(Command.SetLang(Lang.EN), "Speak English", "switch to English", "parle anglais", "en anglais", "تكلم بالإنجليزية", "تحدث بالانجليزية")
        assertAll(Command.SetLang(Lang.FR), "speak French", "Parle français", "passe en français", "en français", "تكلم بالفرنسية", "تحدث بالفرنسية")
        assertAll(Command.SetLang(Lang.AR), "speak Arabic", "parle arabe", "en arabe", "تكلم بالعربية", "تحدث بالعربية", "غير اللغة الى العربية")
    }

    @Test fun translation_is_not_a_language_switch() {
        assertTrue(p("translate this into French") is Command.Ask)
        assertTrue(p("traduis ceci en anglais") is Command.Ask)
    }

    @Test fun open_screens() {
        assertAll(Command.Open(Screen.CAMERA), "Open the camera", "open camera", "Ouvre la caméra", "افتح الكاميرا", "start the camera", "camera")
        assertAll(Command.Open(Screen.ASSISTANT), "Open AI assistant", "open the assistant", "افتح المساعد", "ouvre l'assistant")
        assertAll(Command.Open(Screen.DOCUMENTS), "Open my documents", "Read my documents", "ouvre mes documents", "افتح المستندات")
        assertAll(Command.Open(Screen.FILES), "Show me my files", "Open my downloaded files", "montre-moi mes fichiers", "افتح ملفاتي")
        assertAll(Command.Open(Screen.SETTINGS), "Open settings", "ouvre les paramètres", "افتح الإعدادات")
        assertAll(Command.Open(Screen.HOME), "Go home", "accueil", "الرئيسية")
    }

    @Test fun back_and_close() {
        assertAll(Command.Back, "Go back", "back", "retour", "ارجع", "close the camera", "ferme la caméra")
        assertAll(Command.Close, "Close the application", "close the app", "exit", "quitte l'application", "أغلق التطبيق")
    }

    @Test fun a_bare_close_does_not_quit_the_app() {
        assertTrue(p("close") is Command.Ask)
    }

    @Test fun repeat() {
        assertAll(Command.RepeatLast, "Repeat", "repeat the last answer", "say that again", "répète", "كرر", "اعد الاجابة")
        assertAll(Command.ReaderRepeatParagraph, "Repeat the last paragraph", "répète le dernier paragraphe", "اعد الفقرة")
    }

    @Test fun reader_controls() {
        assertAll(Command.ReaderPause, "Pause reading", "pause", "mets en pause", "إيقاف مؤقت")
        assertAll(Command.ReaderResume, "Continue", "resume reading", "keep reading", "continue la lecture", "تابع", "واصل")
        assertAll(Command.ReaderNextPage, "Go to the next page", "next page", "page suivante", "الصفحة التالية")
        assertAll(Command.ReaderPrevPage, "previous page", "page précédente", "الصفحة السابقة")
        assertAll(Command.ReaderNextParagraph, "skip", "next paragraph", "skip paragraph")
        assertEquals(Command.ReaderGoToPage(5), p("go to page 5"))
        assertEquals(Command.ReaderGoToPage(12), p("page 12"))
        assertEquals(Command.ReaderGoToPage(3), p("الصفحة ٣"))
    }

    @Test fun read_current_document() = assertAll(Command.ReadCurrent,
        "Read the document", "Read this document aloud", "read it", "lis le document", "اقرأ المستند", "Read the document aloud")

    @Test fun read_latest() {
        assertEquals(Command.ReadLatest(DocType.PDF), p("Read my latest PDF"))
        assertEquals(Command.ReadLatest(DocType.ANY), p("Read the last document I downloaded"))
        assertEquals(Command.ReadLatest(DocType.PDF), p("lis mon dernier PDF"))
        assertEquals(Command.ReadLatest(DocType.ANY), p("اقرأ آخر ملف"))
    }

    @Test fun read_named() {
        assertEquals(Command.ReadNamed("contract"), p("Read the file named contract"))
        assertEquals(Command.ReadNamed("facture"), p("lis le fichier nommé facture"))
    }

    @Test fun find_documents() {
        assertEquals(Command.FindDocs("invoice", DocType.ANY), p("Find a document named invoice"))
        assertEquals(Command.FindDocs("", DocType.PDF), p("Find my PDF documents"))
        assertEquals(Command.FindDocs("invoices", DocType.ANY), p("Search for invoices"))
        assertEquals(Command.FindDocs("contrat", DocType.ANY), p("cherche le fichier contrat"))
        assertEquals(Command.FindDocs("فاتوره", DocType.ANY), p("ابحث عن ملف فاتورة"))   // queries come back normalized
    }

    @Test fun find_something_visible_goes_to_the_camera_ai_not_file_search() {
        assertTrue(p("Find the door") is Command.Ask)
        assertTrue(p("Where is the chair?") is Command.Ask)
        assertTrue(p("trouve la porte") is Command.Ask)
    }

    @Test fun ambiguous_find_is_left_to_the_ai_but_has_offline_fallback() {
        assertTrue(p("Find my electricity bill") is Command.Ask)
        val loose = CommandParser.looseFind("Find my electricity bill")
        assertEquals("electricity bill", loose?.query)
        assertEquals(null, CommandParser.looseFind("find the door"))
    }

    @Test fun camera_commands() {
        assertAll(Command.Describe, "Describe what is in front of me", "What is in front of me?", "what's in front of me", "Describe the room",
            "Qu'est-ce qu'il y a devant moi ?", "ماذا أمامي؟", "صف لي ما أمامي", "Explain what is happening around me")
        assertAll(Command.ReadTextInView, "Read the text", "Tell me what is written on this paper", "what does it say", "lis le texte", "اقرأ النص", "ماذا مكتوب هنا")
    }

    @Test fun continuous_assist() {
        assertEquals(Command.LiveStart, p("Stay with me and describe what changes around me"))
        assertEquals(Command.LiveStart, p("continuous description"))
        assertEquals(Command.LiveStart, p("reste avec moi"))
        assertEquals(Command.LiveStart, p("الوصف المستمر"))
        assertEquals(Command.LiveStop, p("stop the continuous description"))
        assertEquals(Command.LiveStop, p("arrête la description continue"))
        assertEquals(Command.LiveStop, p("أوقف الوصف المستمر"))
    }

    @Test fun history_and_cloud() {
        assertAll(Command.ClearHistory, "clear my history", "delete my conversation history", "efface mon historique", "امسح سجلي")
        assertEquals(Command.SetCloud(true), p("allow cloud assistance"))
        assertEquals(Command.SetCloud(false), p("turn off cloud assistance"))
    }

    @Test fun yes_no() {
        assertAll(Command.Yes, "yes", "Yes please", "oui", "d'accord", "نعم", "موافق")
        assertAll(Command.No, "no", "non", "لا", "I refuse")
    }

    @Test fun wake_phrase_with_request_is_stripped() {
        assertEquals(Command.Open(Screen.CAMERA), p("Hello École Eyes open the camera"))
        assertEquals(Command.Time, p("bonjour école eyes quelle heure est-il"))
    }

    @Test fun natural_questions_go_to_the_ai() {
        for (q in listOf("What is the capital of France?", "What color is the chair?", "Is there an obstacle ahead?",
            "Translate good morning into Arabic", "ما هي عاصمة فرنسا", "Quelle est la capitale de l'Italie")) {
            val c = p(q)
            assertTrue("\"$q\" -> $c", c is Command.Ask)
            assertEquals(q, (c as Command.Ask).text)
        }
    }

    @Test fun empty_input_is_not_a_command() {
        assertTrue(p("   ") is Command.Ask)
    }

    @Test fun next_alone_is_context_dependent() = assertAll(Command.Next, "next", "suivant", "التالي")
}
