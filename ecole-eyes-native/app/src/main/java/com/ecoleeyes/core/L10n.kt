package com.ecoleeyes.core

import android.content.Context
import android.content.res.Configuration
import androidx.annotation.PluralsRes
import androidx.annotation.StringRes
import java.util.concurrent.ConcurrentHashMap

/**
 * Looks up string resources in a chosen assistant language, independent of the phone language.
 * Used for everything the assistant says aloud and for the UI.
 */
class L10n(private val base: Context) {
    private val cache = ConcurrentHashMap<Lang, Context>()

    fun context(lang: Lang): Context = cache.getOrPut(lang) {
        val cfg = Configuration(base.resources.configuration)
        cfg.setLocale(lang.locale)
        cfg.setLayoutDirection(lang.locale)
        base.createConfigurationContext(cfg)
    }

    fun str(lang: Lang, @StringRes id: Int, vararg args: Any): String =
        context(lang).getString(id, *args)

    /** Counted phrase with the language's grammar ("1 page" / "2 pages"; Arabic's six plural forms). */
    fun plural(lang: Lang, @PluralsRes id: Int, count: Int, vararg args: Any): String =
        context(lang).resources.getQuantityString(id, count, *args)
}
