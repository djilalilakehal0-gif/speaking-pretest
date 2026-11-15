package com.ecoleeyes.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TextNormSpeakerTest {
    @Test fun normalizes_latin_accents_and_punctuation() {
        assertEquals("ecole eyes", TextNorm.normalize("  École   EYES! "))
        assertEquals("qu est ce qu il y a", TextNorm.normalize("Qu'est-ce qu'il y a ?"))
        assertEquals("coeur", TextNorm.normalize("cœur"))
    }

    @Test fun normalizes_arabic() {
        assertEquals("الاعداد", TextNorm.normalize("الإِعْدَاد"))
        assertEquals("مدرسه", TextNorm.normalize("مدرسة"))
        assertEquals("3", TextNorm.normalize("٣"))
        assertEquals("الكاميرا", TextNorm.normalize("الكــاميرا"))
    }

    @Test fun splits_sentences() {
        assertEquals(listOf("Hello there.", "How are you?", "Fine!"), SentenceSplitter.split("Hello there. How are you? Fine!"))
        assertEquals(listOf("مرحبا بك.", "كيف حالك؟"), SentenceSplitter.split("مرحبا بك. كيف حالك؟"))
        assertEquals(listOf("one", "two"), SentenceSplitter.split("one\ntwo"))
        assertEquals(emptyList<String>(), SentenceSplitter.split("   "))
    }

    @Test fun long_text_without_punctuation_is_chunked_under_the_limit() {
        val long = (1..400).joinToString(" ") { "word$it" }
        val parts = SentenceSplitter.split(long)
        assertTrue(parts.size > 1)
        assertTrue(parts.all { it.length <= 330 })
        assertEquals(long, parts.joinToString(" "))
    }
}
