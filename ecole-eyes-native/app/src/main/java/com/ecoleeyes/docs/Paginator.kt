package com.ecoleeyes.docs

/** Turns raw document text into pages and speakable paragraphs. Pure and unit-tested. */
object Paginator {
    private const val PAGE_CHARS = 1800
    private const val MAX_PARAGRAPH = 600
    private val sentenceEnd = Regex("(?<=[.!?؟…])\\s+")
    private val endsSentence = Regex("[.!?؟:;…»”\")]$")

    /** Splits long text (txt/docx/rtf) into pages at paragraph boundaries. */
    fun pages(text: String): List<String> {
        val clean = text.replace("\r\n", "\n").replace('\r', '\n').trim()
        if (clean.isEmpty()) return emptyList()
        val paras = clean.split(Regex("\n\\s*\n"))
        val pages = ArrayList<String>()
        val cur = StringBuilder()
        for (p in paras) {
            if (cur.isNotEmpty() && cur.length + p.length > PAGE_CHARS) { pages += cur.toString().trim(); cur.setLength(0) }
            cur.append(p).append("\n\n")
            while (cur.length > PAGE_CHARS * 2) { // one enormous paragraph with no blank lines
                val cut = cur.lastIndexOf(". ", PAGE_CHARS).let { if (it < PAGE_CHARS / 2) PAGE_CHARS else it + 1 }
                pages += cur.substring(0, cut).trim(); cur.delete(0, cut)
            }
        }
        if (cur.isNotBlank()) pages += cur.toString().trim()
        return pages
    }

    /** Speakable paragraphs of one page: unwraps hard line breaks (PDF) and chops very long paragraphs. */
    fun paragraphs(pageText: String): List<String> {
        val out = ArrayList<String>()
        for (block in pageText.replace("\r", "").split(Regex("\n\\s*\n"))) {
            val lines = block.lines().map { it.trim() }.filter { it.isNotEmpty() }
            if (lines.isEmpty()) continue
            // Hard-wrapped text (typical of PDFs): long lines, most of which do not end a sentence.
            val body = lines.dropLast(1)
            val wrapped = body.isNotEmpty() && lines.map { it.length }.average() >= 35 && body.count { !endsSentence.containsMatchIn(it) } * 2 >= body.size
            val units = if (wrapped) listOf(lines.joinToString(" ")) else lines
            for (u in units) out += chop(u.replace(Regex("\\s+"), " "))
        }
        return out
    }

    private fun chop(p: String): List<String> {
        if (p.length <= MAX_PARAGRAPH) return listOf(p)
        val res = ArrayList<String>(); val cur = StringBuilder()
        for (s in sentenceEnd.split(p)) {
            if (cur.isNotEmpty() && cur.length + s.length > MAX_PARAGRAPH) { res += cur.toString().trim(); cur.setLength(0) }
            cur.append(s).append(' ')
        }
        if (cur.isNotBlank()) res += cur.toString().trim()
        return res
    }
}
