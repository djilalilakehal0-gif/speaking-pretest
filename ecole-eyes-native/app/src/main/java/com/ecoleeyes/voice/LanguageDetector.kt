package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang

/**
 * Guesses which of the three supported languages a recognized utterance is in, so the assistant can answer in
 * the language the user actually spoke. Deliberately conservative: it returns null unless the evidence is clear
 * (short or mixed utterances such as "ok" or "WhatsApp" never flip the language).
 *
 * Android 14+ recognizers can also report the spoken language directly (see [SttResult.Heard.detectedLang]);
 * that signal wins when present. This text-based guess is the fallback for every other device.
 */
object LanguageDetector {
    private val en = setOf(
        "the", "is", "are", "what", "whats", "where", "who", "how", "can", "you", "me", "my", "i", "it", "this", "that", "please",
        "read", "open", "tell", "find", "call", "set", "show", "describe", "in", "of", "to", "for", "and", "front", "do", "does",
        "there", "here", "time", "stop", "with", "your", "an", "a", "on", "at", "help", "now", "next", "again", "see", "around",
    )
    private val fr = setOf(
        "le", "la", "les", "est", "que", "qu", "quoi", "ou", "qui", "comment", "tu", "vous", "moi", "mon", "ma", "mes", "je", "ce",
        "cette", "ca", "lis", "ouvre", "dis", "trouve", "appelle", "mets", "montre", "decris", "dans", "de", "du", "des", "pour",
        "et", "devant", "il", "y", "a", "ici", "heure", "arrete", "avec", "ton", "un", "une", "sur", "aide", "maintenant",
        "suivant", "encore", "vois", "autour", "s", "plait", "l", "d", "j", "c", "n", "pas", "ne", "lire", "quelle", "quel",
    )
    private val arabicChar = Regex("[\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF]")
    private val latinChar = Regex("[A-Za-zÀ-ÿ]")
    private val frenchMarks = Regex("[éèêëàâçùûôîïœ]")

    fun detect(raw: String): Lang? {
        val letters = raw.count { it.isLetter() }
        if (letters < 4) return null
        // Count words per script: one long brand name ("WhatsApp") must not outweigh a whole Arabic sentence.
        val tokens = raw.split(Regex("\\s+")).filter { it.isNotBlank() }
        val arabicWords = tokens.count { arabicChar.containsMatchIn(it) }
        val latinWords = tokens.count { latinChar.containsMatchIn(it) && !arabicChar.containsMatchIn(it) }
        if (arabicWords >= 2 && arabicWords >= latinWords * 2 && arabicChar.findAll(raw).count() >= 4) return Lang.AR
        if (latinWords < 2 || arabicWords * 2 >= latinWords) return null

        val words = TextNorm.normalize(raw).split(' ').filter { it.isNotEmpty() }
        if (words.size < 2) return null
        var e = 0.0
        var f = 0.0
        for (w in words) {
            val inE = w in en
            val inF = w in fr
            if (inE && !inF) e += 1.0
            if (inF && !inE) f += 1.0
        }
        if (frenchMarks.containsMatchIn(raw.lowercase())) f += 1.5
        if (Regex("\\b(?:qu|l|d|j|c|n|s)'").containsMatchIn(raw.lowercase())) f += 1.0
        return when {
            e >= 2 && e >= f * 2 -> Lang.EN
            f >= 2 && f >= e * 2 -> Lang.FR
            else -> null
        }
    }
}
