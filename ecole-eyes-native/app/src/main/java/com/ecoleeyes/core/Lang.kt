package com.ecoleeyes.core

import java.util.Locale

/** Languages the assistant speaks, understands and shows in the UI. */
enum class Lang(val tag: String, val locale: Locale, val nativeName: String) {
    EN("en", Locale.ENGLISH, "English"),
    FR("fr", Locale.FRENCH, "Français"),
    AR("ar", Locale("ar"), "العربية");

    val isRtl: Boolean get() = this == AR

    companion object {
        fun fromTag(tag: String?): Lang = entries.firstOrNull { it.tag == tag } ?: default()

        /** Phone language if supported, otherwise English. */
        fun default(): Lang = when (Locale.getDefault().language) {
            "fr" -> FR
            "ar" -> AR
            else -> EN
        }
    }
}
