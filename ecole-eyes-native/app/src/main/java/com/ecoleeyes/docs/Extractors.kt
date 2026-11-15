package com.ecoleeyes.docs

import org.xml.sax.Attributes
import org.xml.sax.InputSource
import org.xml.sax.helpers.DefaultHandler
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.Charset
import java.nio.charset.CodingErrorAction
import java.util.zip.ZipInputStream
import javax.xml.parsers.SAXParserFactory

/** Pure-JVM text extractors (unit-tested). Heavy formats (PDF, images) live in [DocumentLoader]. */
object Extractors {

    // ---- plain text -------------------------------------------------------------------------------------------------

    fun decodeText(bytes: ByteArray): String {
        if (bytes.size >= 3 && bytes[0] == 0xEF.toByte() && bytes[1] == 0xBB.toByte() && bytes[2] == 0xBF.toByte())
            return String(bytes, 3, bytes.size - 3, Charsets.UTF_8)
        if (bytes.size >= 2 && bytes[0] == 0xFF.toByte() && bytes[1] == 0xFE.toByte()) return String(bytes, 2, bytes.size - 2, Charsets.UTF_16LE)
        if (bytes.size >= 2 && bytes[0] == 0xFE.toByte() && bytes[1] == 0xFF.toByte()) return String(bytes, 2, bytes.size - 2, Charsets.UTF_16BE)
        val strict = Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).onUnmappableCharacter(CodingErrorAction.REPORT)
        return try {
            strict.decode(ByteBuffer.wrap(bytes)).toString()
        } catch (e: CharacterCodingException) {
            // Old Arabic text files are usually Windows-1256, Western ones Windows-1252.
            val arabicHeavy = bytes.count { (it.toInt() and 0xFF) in 0xC1..0xED } > bytes.size / 4
            String(bytes, Charset.forName(if (arabicHeavy) "windows-1256" else "windows-1252"))
        }
    }

    // ---- DOCX ----------------------------------------------------------------------------------------------------------

    class DocxException(msg: String) : Exception(msg)

    fun docxText(input: InputStream, maxUncompressed: Long = 60L * 1024 * 1024): String {
        ZipInputStream(input).use { zip ->
            var total = 0L
            while (true) {
                val entry = zip.nextEntry ?: break
                if (entry.name == "word/document.xml") {
                    val buf = java.io.ByteArrayOutputStream()
                    val chunk = ByteArray(8192)
                    while (true) {
                        val n = zip.read(chunk); if (n < 0) break
                        total += n
                        if (total > maxUncompressed) throw DocxException("too large")
                        buf.write(chunk, 0, n)
                    }
                    return parseWordXml(buf.toByteArray())
                }
            }
        }
        throw DocxException("no document.xml")
    }

    fun parseWordXml(xml: ByteArray): String {
        val factory = SAXParserFactory.newInstance()
        runCatching { factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) }
        runCatching { factory.setFeature("http://xml.org/sax/features/external-general-entities", false) }
        runCatching { factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false) }
        val sb = StringBuilder()
        var inText = false
        factory.newSAXParser().parse(InputSource(ByteArrayInputStream(xml)), object : DefaultHandler() {
            override fun startElement(uri: String?, localName: String?, qName: String, a: Attributes?) {
                when (qName) {
                    "w:t" -> inText = true
                    "w:tab" -> sb.append(' ')
                    "w:br", "w:cr" -> sb.append('\n')
                }
            }
            override fun endElement(uri: String?, localName: String?, qName: String) {
                when (qName) {
                    "w:t" -> inText = false
                    "w:p" -> sb.append('\n')
                    "w:tc" -> sb.append(' ')
                }
            }
            override fun characters(ch: CharArray, start: Int, length: Int) { if (inText) sb.append(ch, start, length) }
        })
        return sb.toString().replace(Regex("\n{3,}"), "\n\n").trim()
    }

    // ---- RTF -----------------------------------------------------------------------------------------------------------

    private val skipDestinations = setOf("fonttbl", "colortbl", "stylesheet", "info", "pict", "header", "footer", "headerl", "headerr", "footerl", "footerr", "themedata", "colorschememapping", "latentstyles", "datastore", "generator", "listtable", "listoverridetable", "rsidtbl", "fldinst", "objdata", "bkmkstart", "bkmkend")

    fun rtfText(raw: ByteArray): String {
        val s = String(raw, Charsets.ISO_8859_1)
        val cpMatch = Regex("\\\\ansicpg(\\d+)").find(s)
        val charset = runCatching { Charset.forName("windows-" + (cpMatch?.groupValues?.get(1) ?: "1252")) }.getOrDefault(Charset.forName("windows-1252"))
        val out = StringBuilder()
        val pendingBytes = java.io.ByteArrayOutputStream()
        fun flushBytes() { if (pendingBytes.size() > 0) { out.append(String(pendingBytes.toByteArray(), charset)); pendingBytes.reset() } }

        data class Group(var skip: Boolean, var uc: Int)
        val stack = ArrayDeque<Group>()
        var cur = Group(false, 1)
        var skipChars = 0
        var i = 0
        while (i < s.length) {
            val c = s[i]
            when (c) {
                '{' -> { stack.addLast(cur.copy()); i++ }
                '}' -> { flushBytes(); cur = if (stack.isEmpty()) Group(false, 1) else stack.removeLast(); i++ }
                '\\' -> {
                    i++
                    if (i >= s.length) break
                    val n = s[i]
                    when {
                        n == '\\' || n == '{' || n == '}' -> { if (!cur.skip) out.append(n); i++ }
                        n == '\'' -> {
                            val hex = s.substring(i + 1, minOf(i + 3, s.length))
                            i += 3
                            if (skipChars > 0) skipChars-- else if (!cur.skip) hex.toIntOrNull(16)?.let { pendingBytes.write(it) }
                        }
                        n == '*' -> { cur.skip = true; i++ }
                        n == '~' -> { if (!cur.skip) out.append(' '); i++ }
                        n == '-' || n == '_' -> { i++ }
                        n.isLetter() -> {
                            val start = i
                            while (i < s.length && s[i].isLetter()) i++
                            val word = s.substring(start, i)
                            var neg = false
                            if (i < s.length && s[i] == '-') { neg = true; i++ }
                            val ns = i
                            while (i < s.length && s[i].isDigit()) i++
                            val param = if (i > ns) s.substring(ns, i).toInt() * (if (neg) -1 else 1) else null
                            if (i < s.length && s[i] == ' ') i++
                            if (word in skipDestinations) cur.skip = true
                            if (!cur.skip) {
                                when (word) {
                                    "par", "line", "sect", "page" -> { flushBytes(); out.append('\n') }
                                    "tab" -> out.append(' ')
                                    "cell" -> out.append(' ')
                                    "row" -> out.append('\n')
                                    "emdash" -> out.append('—'); "endash" -> out.append('–')
                                    "lquote" -> out.append('‘'); "rquote" -> out.append('’')
                                    "ldblquote" -> out.append('“'); "rdblquote" -> out.append('”')
                                    "bullet" -> out.append('•')
                                    "uc" -> cur.uc = param ?: 1
                                    "u" -> {
                                        flushBytes()
                                        val code = (param ?: 0).let { if (it < 0) it + 65536 else it }
                                        out.append(code.toChar())
                                        skipChars = cur.uc
                                    }
                                }
                            }
                        }
                        else -> i++
                    }
                }
                '\r', '\n' -> i++
                else -> {
                    if (skipChars > 0) { skipChars--; i++ }
                    else {
                        if (!cur.skip) { flushBytes(); out.append(c) }
                        i++
                    }
                }
            }
        }
        flushBytes()
        return out.toString().replace(Regex("[ \t]+\n"), "\n").replace(Regex("\n{3,}"), "\n\n").trim()
    }

    // ---- legacy .doc (best effort) -----------------------------------------------------------------------------------

    /**
     * Word 97-2003 files are an OLE container. Without a full parser we recover readable runs of text
     * (UTF-16 and 8-bit). It finds most body text but can miss or reorder some, so the app warns the user.
     */
    fun legacyDocText(bytes: ByteArray): String {
        val runs = ArrayList<String>()
        val cur = StringBuilder()
        fun ok(ch: Int) = ch == 9 || ch == 10 || ch == 13 || ch in 32..126 || ch in 0xA0..0x24F || ch in 0x600..0x6FF || ch in 0x2010..0x2026
        var i = 0
        while (i + 1 < bytes.size) {
            val ch = (bytes[i].toInt() and 0xFF) or ((bytes[i + 1].toInt() and 0xFF) shl 8)
            if (ok(ch)) { cur.append(if (ch == 13) '\n' else ch.toChar()); i += 2 }
            else {
                if (cur.length >= 12 && cur.count { it.isLetter() } > cur.length / 2) runs += cur.toString()
                cur.setLength(0); i += 1
            }
        }
        if (cur.length >= 12) runs += cur.toString()
        var text = runs.joinToString("\n")
        if (text.length < 40) {
            // 8-bit compressed text pieces
            val sb = StringBuilder(); val line = StringBuilder()
            for (b in bytes) {
                val ch = b.toInt() and 0xFF
                if (ch in 32..126 || ch == 13 || ch == 10 || ch == 9) line.append(if (ch == 13) '\n' else ch.toChar())
                else { if (line.length >= 30 && line.count { it.isLetter() } > line.length / 2) sb.append(line).append('\n'); line.setLength(0) }
            }
            if (line.length >= 30) sb.append(line)
            text = sb.toString()
        }
        return text.replace(Regex("\n{3,}"), "\n\n").trim()
    }
}
