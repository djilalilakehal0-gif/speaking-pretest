package com.ecoleeyes.voice

import java.text.Normalizer

/** Normalizes recognized speech so one set of patterns works for Arabic, French and English. */
object TextNorm {
    private val combining = Regex("\\p{M}+")
    private val nonWord = Regex("[^\\p{L}\\p{Nd}\\s]")
    private val spaces = Regex("\\s+")

    fun normalize(raw: String): String {
        var s = raw.lowercase().replace("œ", "oe").replace("æ", "ae")
        // Arabic-Indic digits to ASCII
        s = buildString { for (c in s) append(if (c in '٠'..'٩') ('0' + (c - '٠')) else if (c in '۰'..'۹') ('0' + (c - '۰')) else c) }
        s = Normalizer.normalize(s, Normalizer.Form.NFD)
        s = combining.replace(s, "")                   // Latin accents + Arabic tashkeel
        s = s.replace("ـ", "")                    // tatweel
        s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
            .replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
        s = nonWord.replace(s.replace('\'', ' ').replace('’', ' ').replace('-', ' '), " ")
        return spaces.replace(s, " ").trim()
    }
}
