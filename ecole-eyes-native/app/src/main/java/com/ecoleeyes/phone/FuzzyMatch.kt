package com.ecoleeyes.phone

import com.ecoleeyes.voice.TextNorm
import kotlin.math.min

/**
 * Matches a spoken name ("call ahmed", "open whatsapp") against contact names or app labels.
 * Speech recognition often mangles names, so this tolerates accents, Arabic spelling variants and small typos,
 * but refuses weak matches: calling the wrong person is worse than asking again.
 */
object FuzzyMatch {

    /** 0 = no match, 100 = exact. Scores below [MIN_SCORE] are not considered matches. */
    fun score(query: String, candidate: String): Int {
        val q = TextNorm.normalize(query)
        val c = TextNorm.normalize(candidate)
        if (q.isEmpty() || c.isEmpty()) return 0
        if (q == c) return 100
        val cWords = c.split(' ')
        val qWords = q.split(' ')
        if (c.startsWith("$q ") || cWords.first() == q) return 90
        if (cWords.contains(q)) return 85
        if (qWords.all { qw -> cWords.any { it == qw } }) return 80
        if (c.replace(" ", "") == q.replace(" ", "")) return 80            // "whats app" vs "whatsapp"
        if (q.length >= 3 && c.startsWith(q)) return 75
        // every spoken word close to some word of the name (1 edit per 4 letters)
        val close = qWords.all { qw -> cWords.any { cw -> qw.length >= 3 && levenshtein(qw, cw) <= maxOf(1, qw.length / 4) } }
        if (close) return 65
        if (q.length >= 4 && c.contains(q)) return 60
        return 0
    }

    const val MIN_SCORE = 60

    /** Best matches first; ties keep the input order. */
    fun <T> rank(query: String, items: List<T>, name: (T) -> String, limit: Int = 5): List<Pair<T, Int>> =
        items.map { it to score(query, name(it)) }
            .filter { it.second >= MIN_SCORE }
            .sortedByDescending { it.second }
            .take(limit)

    fun levenshtein(a: String, b: String): Int {
        if (a == b) return 0
        if (a.isEmpty()) return b.length
        if (b.isEmpty()) return a.length
        var prev = IntArray(b.length + 1) { it }
        var cur = IntArray(b.length + 1)
        for (i in 1..a.length) {
            cur[0] = i
            for (j in 1..b.length) {
                val cost = if (a[i - 1] == b[j - 1]) 0 else 1
                cur[j] = min(min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost)
            }
            val t = prev; prev = cur; cur = t
        }
        return prev[b.length]
    }

    /** Keeps only what can be dialled. Returns null if it does not look like a phone number. */
    fun phoneNumber(spoken: String): String? {
        val digits = spoken.filter { it.isDigit() || it == '+' }
        val asciiDigits = buildString { for (c in digits) append(if (c in '٠'..'٩') ('0' + (c - '٠')) else c) }
        return asciiDigits.takeIf { it.count(Char::isDigit) >= 2 && it.lastIndexOf('+') <= 0 }
    }
}
