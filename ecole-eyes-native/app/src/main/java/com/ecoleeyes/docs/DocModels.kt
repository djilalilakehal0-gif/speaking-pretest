package com.ecoleeyes.docs

import com.ecoleeyes.voice.DocType
import com.ecoleeyes.voice.TextNorm

/** A file the user has authorized. [uri] is a content:// URI string. */
data class DocFile(
    val id: String,
    val uri: String,
    val name: String,
    val type: DocType,
    val modified: Long,
    val size: Long,
    val folder: String,
) {
    /** Name without extension, for speaking: "electricity_bill_march.pdf" -> "electricity bill march". */
    val spokenName: String get() = name.substringBeforeLast('.').replace('_', ' ').replace('-', ' ').replace(Regex("\\s+"), " ").trim()
}

object DocKinds {
    private val map = mapOf(
        "pdf" to DocType.PDF,
        "doc" to DocType.WORD, "docx" to DocType.WORD,
        "txt" to DocType.TEXT, "text" to DocType.TEXT,
        "rtf" to DocType.RTF,
        "jpg" to DocType.IMAGE, "jpeg" to DocType.IMAGE, "png" to DocType.IMAGE,
    )

    /** The supported kind of a file, or null if the app cannot read it. */
    fun detect(name: String, mime: String?): DocType? {
        map[name.substringAfterLast('.', "").lowercase()]?.let { return it }
        return when (mime?.lowercase()) {
            "application/pdf" -> DocType.PDF
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> DocType.WORD
            "text/plain" -> DocType.TEXT
            "application/rtf", "text/rtf" -> DocType.RTF
            "image/jpeg", "image/png" -> DocType.IMAGE
            else -> null
        }
    }

    fun isDocx(name: String) = name.lowercase().endsWith(".docx")
}

/** Ranks authorized files against a spoken request. Pure and tolerant of small recognition mistakes. */
object DocSearch {
    fun rank(files: List<DocFile>, query: String, type: DocType = DocType.ANY, limit: Int = 8): List<DocFile> {
        val pool = files.filter { type == DocType.ANY || it.type == type }
        val tokens = TextNorm.normalize(query).split(' ').filter { it.length >= 2 }
        if (tokens.isEmpty()) return pool.sortedByDescending { it.modified }.take(limit)

        data class Scored(val f: DocFile, val matched: Int, val score: Int)
        return pool.mapNotNull { f ->
            val words = TextNorm.normalize(f.spokenName).split(' ').filter { it.isNotEmpty() }
            var matched = 0
            var score = 0
            for (t in tokens) {
                val s = words.maxOfOrNull { wordScore(t, it) } ?: 0
                if (s > 0) { matched++; score += s }
            }
            if (matched == 0) null else Scored(f, matched, score)
        }.sortedWith(compareByDescending<Scored> { it.matched }.thenByDescending { it.score }.thenByDescending { it.f.modified })
            .take(limit).map { it.f }
    }

    private fun wordScore(token: String, word: String): Int = when {
        token == word -> 5
        word.startsWith(token) || token.startsWith(word) && word.length >= 4 -> 3
        word.contains(token) && token.length >= 3 -> 2
        token.length >= 5 && editDistance(token, word) <= (if (token.length >= 8) 2 else 1) -> 2
        else -> 0
    }

    fun editDistance(a: String, b: String): Int {
        if (kotlin.math.abs(a.length - b.length) > 2) return 99
        val dp = IntArray(b.length + 1) { it }
        for (i in 1..a.length) {
            var prev = dp[0]; dp[0] = i
            for (j in 1..b.length) {
                val tmp = dp[j]
                dp[j] = minOf(dp[j] + 1, dp[j - 1] + 1, prev + if (a[i - 1] == b[j - 1]) 0 else 1)
                prev = tmp
            }
        }
        return dp[b.length]
    }
}
