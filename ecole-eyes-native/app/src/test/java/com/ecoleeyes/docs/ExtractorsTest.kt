package com.ecoleeyes.docs

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class ExtractorsTest {

    private fun docx(bodyXml: String, name: String = "word/document.xml"): ByteArray {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { z ->
            z.putNextEntry(ZipEntry("[Content_Types].xml")); z.write("<x/>".toByteArray()); z.closeEntry()
            z.putNextEntry(ZipEntry(name))
            z.write("""<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>$bodyXml</w:body></w:document>""".toByteArray())
            z.closeEntry()
        }
        return out.toByteArray()
    }

    @Test fun docx_paragraphs_runs_tabs_and_breaks() {
        val xml = """<w:p><w:r><w:t>Hello </w:t></w:r><w:r><w:t>world</w:t></w:r></w:p>
            <w:p><w:r><w:t>Line1</w:t><w:br/><w:t>Line2</w:t></w:r></w:p>
            <w:p><w:r><w:t>A</w:t><w:tab/><w:t>B</w:t></w:r></w:p>"""
        val text = Extractors.docxText(ByteArrayInputStream(docx(xml)))
        assertEquals("Hello world\nLine1\nLine2\nA B", text.lines().filter { it.isNotBlank() }.joinToString("\n") { it.trim() })
    }

    @Test fun docx_arabic_and_table() {
        val xml = """<w:p><w:r><w:t>مرحبا بالعالم</w:t></w:r></w:p>
            <w:tbl><w:tr><w:tc><w:p><w:r><w:t>خلية1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>خلية2</w:t></w:r></w:p></w:tc></w:tr></w:tbl>"""
        val text = Extractors.docxText(ByteArrayInputStream(docx(xml)))
        assertTrue(text.contains("مرحبا بالعالم"))
        assertTrue(text.contains("خلية1") && text.contains("خلية2"))
    }

    @Test fun docx_without_document_xml_is_rejected() {
        try { Extractors.docxText(ByteArrayInputStream(docx("<w:p/>", name = "other.xml"))); fail() } catch (e: Extractors.DocxException) { /* ok */ }
    }

    @Test fun docx_external_entities_are_not_expanded() {
        val evil = """<?xml version="1.0"?><!DOCTYPE d [<!ENTITY x SYSTEM "file:///etc/passwd">]><w:document xmlns:w="w"><w:body><w:p><w:r><w:t>&x;</w:t></w:r></w:p></w:body></w:document>"""
        val text = try { Extractors.parseWordXml(evil.toByteArray()) } catch (e: Exception) { "" }
        assertTrue(!text.contains("root:"))
    }

    @Test fun docx_zip_bomb_is_capped() {
        val big = "<w:p><w:r><w:t>" + "a".repeat(3000) + "</w:t></w:r></w:p>"
        try { Extractors.docxText(ByteArrayInputStream(docx(big)), maxUncompressed = 1000); fail() } catch (e: Extractors.DocxException) { /* ok */ }
    }

    @Test fun rtf_basic_text_and_paragraphs() {
        val rtf = """{\rtf1\ansi\deff0{\fonttbl{\f0 Times;}}{\colortbl;\red0\green0\blue0;}\f0\fs24 Hello \b world\b0.\par Second line\par}"""
        assertEquals("Hello world.\nSecond line", Extractors.rtfText(rtf.toByteArray(Charsets.ISO_8859_1)))
    }

    @Test fun rtf_escapes_and_unicode() {
        val rtf = "{\\rtf1\\ansi\\ansicpg1252 caf\\'e9 \\u1605?\\u1585?\\u1581?\\u1576?\\u1575? \\{ok\\} \\\\ end}"
        val t = Extractors.rtfText(rtf.toByteArray(Charsets.ISO_8859_1))
        assertTrue(t, t.contains("café"))
        assertTrue(t, t.contains("مرحبا"))
        assertTrue(t, t.contains("{ok}"))
        assertTrue(t, t.contains("\\"))
    }

    @Test fun rtf_arabic_code_page_1256() {
        // "سلام" in windows-1256 = D3 E1 C7 E3
        val rtf = "{\\rtf1\\ansi\\ansicpg1256 \\'d3\\'e1\\'c7\\'e3}"
        assertEquals("سلام", Extractors.rtfText(rtf.toByteArray(Charsets.ISO_8859_1)))
    }

    @Test fun rtf_skips_hidden_destinations() {
        val rtf = """{\rtf1{\info{\title Secret}}{\*\generator Foo;}{\pict\jpegblip ffd8ffe0}Visible}"""
        assertEquals("Visible", Extractors.rtfText(rtf.toByteArray(Charsets.ISO_8859_1)))
    }

    @Test fun text_decoding_handles_bom_and_legacy_charsets() {
        assertEquals("héllo", Extractors.decodeText(byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte()) + "héllo".toByteArray()))
        assertEquals("héllo", Extractors.decodeText("héllo".toByteArray()))
        assertEquals("héllo", Extractors.decodeText(byteArrayOf(0xFF.toByte(), 0xFE.toByte()) + "héllo".toByteArray(Charsets.UTF_16LE)))
        assertEquals("café", Extractors.decodeText("café".toByteArray(Charsets.ISO_8859_1)))
        assertEquals("السلام عليكم", Extractors.decodeText("السلام عليكم".toByteArray(charset("windows-1256"))))
    }

    @Test fun legacy_doc_best_effort_recovers_utf16_runs() {
        val junk = ByteArray(300) { 0 }
        val text = "This is the body of an old Word document.\r".toByteArray(Charsets.UTF_16LE)
        val out = Extractors.legacyDocText(junk + text + junk)
        assertTrue(out, out.contains("body of an old Word document"))
    }
}
