package com.ecoleeyes.docs

import com.ecoleeyes.voice.DocType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PaginatorAndSearchTest {

    @Test fun pages_split_at_paragraph_boundaries() {
        val para = "x".repeat(800)
        val pages = Paginator.pages("$para\n\n$para\n\n$para\n\n$para")
        assertEquals(2, pages.size)
        assertTrue(pages.all { it.length <= 1900 })
    }

    @Test fun one_huge_paragraph_is_still_split() {
        val pages = Paginator.pages((1..2000).joinToString(" ") { "Word$it." })
        assertTrue(pages.size > 2)
    }

    @Test fun empty_text_has_no_pages() = assertEquals(0, Paginator.pages("  \n ").size)

    @Test fun pdf_style_hard_wrapped_lines_are_joined() {
        val page = "This is a long sentence that was wrapped by the PDF layout engine at the\nright margin of the page, and it keeps going over several lines until the\nparagraph finally ends here.\n\nSecond paragraph."
        assertEquals(listOf("This is a long sentence that was wrapped by the PDF layout engine at the right margin of the page, and it keeps going over several lines until the paragraph finally ends here.", "Second paragraph."), Paginator.paragraphs(page))
    }

    @Test fun one_line_per_paragraph_text_keeps_lines() {
        assertEquals(listOf("First item.", "Second item.", "Third item."), Paginator.paragraphs("First item.\nSecond item.\nThird item."))
    }

    @Test fun long_paragraphs_are_chopped_at_sentences() {
        val p = (1..40).joinToString(" ") { "This is sentence number $it." }
        val parts = Paginator.paragraphs(p)
        assertTrue(parts.size > 1)
        assertTrue(parts.all { it.length <= 640 })
        assertEquals(p, parts.joinToString(" "))
    }

    private fun f(name: String, type: DocType = DocType.PDF, modified: Long = 0) = DocFile(name, "content://x/$name", name, type, modified, 1, "Downloads")

    private val files = listOf(
        f("electricity_bill_march.pdf", modified = 5), f("Invoice-2024.pdf", modified = 9), f("contract.docx", DocType.WORD, 3),
        f("facture_électricité.pdf", modified = 7), f("notes.txt", DocType.TEXT, 8), f("photo_menu.jpg", DocType.IMAGE, 1), f("فاتورة_الكهرباء.pdf", modified = 6),
    )

    @Test fun search_finds_by_name_ignoring_case_and_extension() {
        assertEquals("Invoice-2024.pdf", DocSearch.rank(files, "invoice").first().name)
        assertEquals("contract.docx", DocSearch.rank(files, "CONTRACT").first().name)
        assertTrue(DocSearch.rank(files, "pdf").isEmpty())   // extension is not part of the spoken name
    }

    @Test fun search_ranks_more_matching_words_first() {
        assertEquals("electricity_bill_march.pdf", DocSearch.rank(files, "electricity bill").first().name)
    }

    @Test fun search_tolerates_small_speech_recognition_mistakes() {
        assertEquals("Invoice-2024.pdf", DocSearch.rank(files, "invoise").first().name)
        assertEquals("contract.docx", DocSearch.rank(files, "contrat").first().name)
    }

    @Test fun search_works_across_accents_and_arabic() {
        assertEquals("facture_électricité.pdf", DocSearch.rank(files, "facture electricite").first().name)
        assertEquals("فاتورة_الكهرباء.pdf", DocSearch.rank(files, "فاتورة").first().name)
    }

    @Test fun empty_query_lists_latest_first_with_type_filter() {
        assertEquals("Invoice-2024.pdf", DocSearch.rank(files, "").first().name)
        assertEquals(listOf("Invoice-2024.pdf", "facture_électricité.pdf", "فاتورة_الكهرباء.pdf", "electricity_bill_march.pdf"), DocSearch.rank(files, "", DocType.PDF).map { it.name })
        assertEquals(listOf("contract.docx"), DocSearch.rank(files, "", DocType.WORD).map { it.name })
    }

    @Test fun no_match_returns_nothing() = assertTrue(DocSearch.rank(files, "zebra").isEmpty())

    @Test fun limit_is_respected() = assertEquals(2, DocSearch.rank(files, "", limit = 2).size)

    @Test fun kinds_detect_supported_formats_only() {
        assertEquals(DocType.PDF, DocKinds.detect("a.PDF", null))
        assertEquals(DocType.WORD, DocKinds.detect("a.doc", null))
        assertEquals(DocType.WORD, DocKinds.detect("a.docx", null))
        assertEquals(DocType.TEXT, DocKinds.detect("a.txt", null))
        assertEquals(DocType.RTF, DocKinds.detect("a.rtf", null))
        assertEquals(DocType.IMAGE, DocKinds.detect("a.jpeg", null))
        assertEquals(DocType.IMAGE, DocKinds.detect("a.png", null))
        assertEquals(DocType.PDF, DocKinds.detect("noext", "application/pdf"))
        assertNull(DocKinds.detect("a.exe", "application/octet-stream"))
        assertNull(DocKinds.detect("a.zip", null))
    }

    @Test fun spoken_name_is_readable() = assertEquals("electricity bill march", f("electricity_bill_march.pdf").spokenName)
}
