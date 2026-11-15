package com.ecoleeyes.app

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.core.Lang
import com.ecoleeyes.docs.DocFile
import com.ecoleeyes.docs.DocNote
import com.ecoleeyes.docs.DocumentException
import com.ecoleeyes.docs.DocumentLoader
import com.ecoleeyes.docs.LoaderEnv
import com.ecoleeyes.docs.Paginator
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.DocType
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.PDPageContentStream
import com.tom_roush.pdfbox.pdmodel.font.PDType1Font
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/** Opens real files (generated here) through the real loader: copy, parse, paginate, error mapping. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class DocumentLoaderTest {
    @get:Rule val tmp = TemporaryFolder()
    private val ctx: Application get() = ApplicationProvider.getApplicationContext()
    private var slow = 0

    private val env = object : LoaderEnv {
        override fun lang() = Lang.EN
        override fun cloudUsable() = false
        override fun cloudAllowed() = false
        override fun onSlowStep() { slow++ }
    }
    private lateinit var loader: DocumentLoader

    @Before fun setUp() {
        PDFBoxResourceLoader.init(ctx)
        loader = DocumentLoader(ctx, OcrEngine(null), env)
    }

    private fun file(f: File, type: DocType) = DocFile("id", android.net.Uri.fromFile(f).toString(), f.name, type, 0, f.length(), "")

    private fun pdf(vararg pageTexts: String, name: String = "a.pdf"): File {
        val f = tmp.newFile(name)
        PDDocument().use { doc ->
            for (t in pageTexts) {
                val page = PDPage(); doc.addPage(page)
                PDPageContentStream(doc, page).use { cs ->
                    cs.beginText(); cs.setFont(PDType1Font.HELVETICA, 12f); cs.newLineAtOffset(50f, 700f)
                    for ((i, line) in t.split("\n").withIndex()) { if (i > 0) cs.newLineAtOffset(0f, -16f); cs.showText(line) }
                    cs.endText()
                }
            }
            doc.save(f)
        }
        return f
    }

    @Test fun pdf_text_is_extracted_page_by_page() = runBlocking {
        val doc = loader.open(file(pdf("Invoice number 1042 total 45 euros\nPaid in full thanks", "Second page text about electricity", "Third page"), DocType.PDF))
        assertEquals(3, doc.pages.count)
        assertTrue(doc.pages.page(0).contains("Invoice number 1042"))
        assertTrue(doc.pages.page(1).contains("electricity"))
        assertEquals("", doc.pages.page(7))        // out of range is empty, not a crash
        assertEquals(0, slow)                      // real text: no slow OCR step
        doc.pages.close()
    }

    @Test fun reading_pdf_text_produces_speakable_paragraphs() = runBlocking {
        val doc = loader.open(file(pdf("Hello world. This is the first paragraph of the report."), DocType.PDF))
        assertEquals(listOf("Hello world. This is the first paragraph of the report."), Paginator.paragraphs(doc.pages.page(0)))
        doc.pages.close()
    }

    @Test fun pdf_temp_copy_is_deleted_on_close() = runBlocking {
        val before = ctx.cacheDir.listFiles()?.count { it.name.startsWith("ee_pdf_") } ?: 0
        val doc = loader.open(file(pdf("some text for the file"), DocType.PDF))
        assertEquals(before + 1, ctx.cacheDir.listFiles()!!.count { it.name.startsWith("ee_pdf_") })
        doc.pages.close()
        assertEquals(before, ctx.cacheDir.listFiles()!!.count { it.name.startsWith("ee_pdf_") })
    }

    @Test fun corrupt_pdf_is_reported_as_unreadable_and_leaves_no_temp_file() = runBlocking {
        val f = tmp.newFile("bad.pdf").apply { writeText("this is not a pdf at all") }
        val before = ctx.cacheDir.listFiles()?.count { it.name.startsWith("ee_pdf_") } ?: 0
        try { loader.open(file(f, DocType.PDF)); fail() } catch (e: DocumentException) { assertEquals(DocumentException.Reason.UNREADABLE, e.reason) }
        assertEquals(before, ctx.cacheDir.listFiles()!!.count { it.name.startsWith("ee_pdf_") })
    }

    @Test fun missing_file_is_unreadable() = runBlocking {
        try { loader.open(file(File(tmp.root, "gone.txt"), DocType.TEXT)); fail() } catch (e: DocumentException) { assertEquals(DocumentException.Reason.UNREADABLE, e.reason) }
    }

    @Test fun txt_is_paginated_and_decoded() = runBlocking {
        val f = tmp.newFile("n.txt").apply { writeText("Première ligne.\n\n" + "Mot ".repeat(1000) + "\n\nDernière ligne.") }
        val doc = loader.open(file(f, DocType.TEXT))
        assertTrue(doc.pages.count >= 2)
        assertTrue(doc.pages.page(0).startsWith("Première ligne."))
    }

    @Test fun empty_text_file_is_reported_as_empty() = runBlocking {
        try { loader.open(file(tmp.newFile("e.txt").apply { writeText("  \n ") }, DocType.TEXT)); fail() } catch (e: DocumentException) { assertEquals(DocumentException.Reason.EMPTY, e.reason) }
    }

    @Test fun docx_is_read() = runBlocking {
        val f = tmp.newFile("c.docx")
        ZipOutputStream(f.outputStream()).use { z ->
            z.putNextEntry(ZipEntry("word/document.xml"))
            z.write("""<w:document xmlns:w="w"><w:body><w:p><w:r><w:t>Contract between the parties</w:t></w:r></w:p><w:p><w:r><w:t>عقد بين الطرفين</w:t></w:r></w:p></w:body></w:document>""".toByteArray())
            z.closeEntry()
        }
        val doc = loader.open(file(f, DocType.WORD))
        val t = doc.pages.page(0)
        assertTrue(t.contains("Contract between the parties") && t.contains("عقد بين الطرفين"))
        assertTrue(doc.pages.notes.isEmpty())
    }

    @Test fun broken_docx_is_unreadable() = runBlocking {
        try { loader.open(file(tmp.newFile("b.docx").apply { writeText("PK not really") }, DocType.WORD)); fail() } catch (e: DocumentException) { assertEquals(DocumentException.Reason.UNREADABLE, e.reason) }
    }

    @Test fun legacy_doc_is_read_but_flagged_as_partial() = runBlocking {
        val f = tmp.newFile("old.doc")
        f.writeBytes(ByteArray(512) + "Quarterly results for the whole company were good.\r".toByteArray(Charsets.UTF_16LE) + ByteArray(512))
        val doc = loader.open(file(f, DocType.WORD))
        assertTrue(doc.pages.page(0).contains("Quarterly results"))
        assertTrue(DocNote.PARTIAL_FORMAT in doc.pages.notes)
    }

    @Test fun rtf_is_read() = runBlocking {
        val f = tmp.newFile("l.rtf").apply { writeText("{\\rtf1\\ansi Dear Sir,\\par Your bill is due.\\par}") }
        val t = loader.open(file(f, DocType.RTF)).pages.page(0)
        assertEquals("Dear Sir,\nYour bill is due.", t)
    }
}
