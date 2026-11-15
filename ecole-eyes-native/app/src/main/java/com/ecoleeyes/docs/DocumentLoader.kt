package com.ecoleeyes.docs

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import androidx.exifinterface.media.ExifInterface
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.ecoleeyes.core.Lang
import com.ecoleeyes.vision.ImageUtil
import com.ecoleeyes.vision.OcrEngine
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import com.ecoleeyes.voice.DocType
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

enum class DocNote { PARTIAL_FORMAT, SCANNED, UNCERTAIN, NEEDS_CLOUD }

class DocumentException(val reason: Reason, cause: Throwable? = null) : Exception(reason.name, cause) {
    enum class Reason { UNREADABLE, PROTECTED, EMPTY, TOO_LARGE }
}

/** A readable document split into pages. Pages are produced lazily so big or scanned files start quickly. */
interface DocPages {
    val count: Int
    val notes: Set<DocNote>
    suspend fun page(index: Int): String
    fun close() {}
}

class ListPages(private val pages: List<String>, override val notes: Set<DocNote> = emptySet()) : DocPages {
    override val count get() = pages.size
    override suspend fun page(index: Int) = pages.getOrElse(index) { "" }
}

data class LoadedDoc(val file: DocFile, val pages: DocPages)

/** Environment the loader needs at the moment a page is read (consent and connectivity can change). */
interface LoaderEnv {
    fun lang(): Lang
    fun cloudUsable(): Boolean
    fun cloudAllowed(): Boolean
    /** Called before a slow OCR step so the assistant can say "reading the scanned page". */
    fun onSlowStep()
}

class DocumentLoader(private val context: Context, private val ocr: OcrEngine, private val env: LoaderEnv) {

    private val pdfInit = AtomicBoolean(false)

    suspend fun open(file: DocFile): LoadedDoc = withContext(Dispatchers.IO) {
        val uri = Uri.parse(file.uri)
        val pages: DocPages = try {
            when (file.type) {
                DocType.PDF -> openPdf(uri)
                DocType.IMAGE -> openImage(uri)
                DocType.TEXT -> textPages(Extractors.decodeText(readBytes(uri)))
                DocType.RTF -> textPages(Extractors.rtfText(readBytes(uri)))
                DocType.WORD ->
                    if (DocKinds.isDocx(file.name)) textPages(context.contentResolver.openInputStream(uri)!!.use { Extractors.docxText(it) })
                    else textPages(Extractors.legacyDocText(readBytes(uri)), setOf(DocNote.PARTIAL_FORMAT))
                DocType.ANY -> throw DocumentException(DocumentException.Reason.UNREADABLE)
            }
        } catch (e: DocumentException) { throw e }
        catch (e: Extractors.DocxException) { throw DocumentException(DocumentException.Reason.UNREADABLE, e) }
        catch (e: OutOfMemoryError) { throw DocumentException(DocumentException.Reason.TOO_LARGE, e) }
        catch (e: Exception) { throw DocumentException(DocumentException.Reason.UNREADABLE, e) }
        LoadedDoc(file, pages)
    }

    private fun textPages(text: String, notes: Set<DocNote> = emptySet()): DocPages {
        val p = Paginator.pages(text)
        if (p.isEmpty()) throw DocumentException(DocumentException.Reason.EMPTY)
        return ListPages(p, notes)
    }

    private fun readBytes(uri: Uri): ByteArray {
        val stream = context.contentResolver.openInputStream(uri) ?: throw DocumentException(DocumentException.Reason.UNREADABLE)
        stream.use {
            val out = java.io.ByteArrayOutputStream()
            val buf = ByteArray(16 * 1024)
            var total = 0L
            while (true) {
                val n = it.read(buf); if (n < 0) break
                total += n
                if (total > MAX_BYTES) throw DocumentException(DocumentException.Reason.TOO_LARGE)
                out.write(buf, 0, n)
            }
            return out.toByteArray()
        }
    }

    private suspend fun openImage(uri: Uri): DocPages {
        val bmp = decodeImage(uri) ?: throw DocumentException(DocumentException.Reason.UNREADABLE)
        env.onSlowStep()
        val r = ocr.read(bmp, env.lang(), env.cloudAllowed(), env.cloudUsable())
        val notes = buildSet {
            add(DocNote.SCANNED); if (r.uncertain) add(DocNote.UNCERTAIN); if (r.needsCloud) add(DocNote.NEEDS_CLOUD)
        }
        if (r.text.isBlank()) throw DocumentException(DocumentException.Reason.EMPTY)
        return ListPages(Paginator.pages(r.text), notes)
    }

    private fun decodeImage(uri: Uri): Bitmap? {
        val cr = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 2400) sample *= 2
        val bmp = cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) } ?: return null
        val degrees = try {
            cr.openInputStream(uri)?.use {
                when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270
                    else -> 0
                }
            } ?: 0
        } catch (e: Exception) { 0 }
        return ImageUtil.rotate(bmp, degrees)
    }

    private fun openPdf(uri: Uri): DocPages {
        if (pdfInit.compareAndSet(false, true)) PDFBoxResourceLoader.init(context.applicationContext)
        val tmp = File.createTempFile("ee_pdf_", ".pdf", context.cacheDir)
        try {
            context.contentResolver.openInputStream(uri)!!.use { i -> tmp.outputStream().use { o -> copyLimited(i, o) } }
            val doc = try {
                PDDocument.load(tmp)
            } catch (e: com.tom_roush.pdfbox.pdmodel.encryption.InvalidPasswordException) {
                throw DocumentException(DocumentException.Reason.PROTECTED, e)
            }
            if (doc.isEncrypted) { doc.close(); throw DocumentException(DocumentException.Reason.PROTECTED) }
            if (doc.numberOfPages == 0) { doc.close(); throw DocumentException(DocumentException.Reason.EMPTY) }
            return PdfPages(context, doc, tmp, ocr, env)
        } catch (e: Throwable) {
            tmp.delete(); throw e
        }
    }

    private fun copyLimited(i: java.io.InputStream, o: java.io.OutputStream) {
        val buf = ByteArray(32 * 1024); var total = 0L
        while (true) {
            val n = i.read(buf); if (n < 0) break
            total += n
            if (total > MAX_PDF_BYTES) throw DocumentException(DocumentException.Reason.TOO_LARGE)
            o.write(buf, 0, n)
        }
    }

    private companion object {
        const val MAX_BYTES = 40L * 1024 * 1024
        const val MAX_PDF_BYTES = 120L * 1024 * 1024
    }
}

/** PDF pages: embedded text when present, OCR of the rendered page for scans (and Arabic via the cloud). */
private class PdfPages(
    private val context: Context,
    private val doc: PDDocument,
    private val file: File,
    private val ocr: OcrEngine,
    private val env: LoaderEnv,
) : DocPages {
    private val lock = Mutex()
    private val _notes = java.util.concurrent.ConcurrentHashMap.newKeySet<DocNote>()
    override val notes: Set<DocNote> get() = _notes
    override val count: Int = doc.numberOfPages
    private var renderer: PdfRenderer? = null
    private var pfd: ParcelFileDescriptor? = null

    override suspend fun page(index: Int): String = lock.withLock {
        withContext(Dispatchers.IO) {
            if (index !in 0 until count) return@withContext ""
            val stripper = PDFTextStripper().apply { startPage = index + 1; endPage = index + 1 }
            val raw = runCatching { stripper.getText(doc) }.getOrDefault("")
            val text = java.text.Normalizer.normalize(raw, java.text.Normalizer.Form.NFKC).trim()
            val arabic = text.count { it in '؀'..'ۿ' }
            val letters = text.count { it.isLetter() }
            val arabicHeavy = letters > 0 && arabic * 5 > letters
            when {
                text.length >= 20 && !(arabicHeavy && env.cloudUsable()) -> {
                    if (arabicHeavy) _notes += DocNote.UNCERTAIN   // embedded Arabic text can come out in the wrong order
                    text
                }
                else -> {
                    _notes += DocNote.SCANNED
                    env.onSlowStep()
                    val bmp = render(index)
                    val r = ocr.read(bmp, env.lang(), env.cloudAllowed(), env.cloudUsable())
                    bmp.recycle()
                    if (r.uncertain) _notes += DocNote.UNCERTAIN
                    if (r.needsCloud) _notes += DocNote.NEEDS_CLOUD
                    r.text.ifBlank { text }
                }
            }
        }
    }

    private fun render(index: Int): Bitmap {
        val r = renderer ?: PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).also { pfd = it }).also { renderer = it }
        r.openPage(index).use { page ->
            val scale = 1700f / maxOf(page.width, page.height)
            val bmp = Bitmap.createBitmap((page.width * scale).toInt().coerceAtLeast(1), (page.height * scale).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
            Canvas(bmp).drawColor(Color.WHITE)
            page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            return bmp
        }
    }

    override fun close() {
        runCatching { renderer?.close() }; runCatching { pfd?.close() }; runCatching { doc.close() }; file.delete()
    }
}
