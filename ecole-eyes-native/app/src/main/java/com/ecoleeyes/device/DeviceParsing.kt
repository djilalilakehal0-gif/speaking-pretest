package com.ecoleeyes.device

import com.ecoleeyes.docs.DocSearch
import com.ecoleeyes.voice.TextNorm

/** A time of day on a 24-hour clock. */
data class ClockTime(val hour: Int, val minute: Int) {
    init { require(hour in 0..23 && minute in 0..59) }
}

/**
 * Pure helpers that turn spoken (already normalized, see [TextNorm]) requests into device-action parameters.
 * Everything here is offline and unit-tested; anything it cannot parse confidently returns null so the
 * request goes to the AI (or the user is asked again) instead of acting on a guess.
 */
object DeviceParsing {

    private val pmWords = Regex("(?:^| )(?:pm|p m|in the evening|at night|this evening|tonight|du soir|le soir|ce soir|de l apres midi|de l aprem|apres midi|مساء|مساءا|ليلا|بالليل|في المساء|بعد الظهر|العصر)(?: |$)")
    private val amWords = Regex("(?:^| )(?:am|a m|in the morning|du matin|le matin|ce matin|صباحا|الصباح|صباح|في الصباح|فجرا)(?: |$)")
    private val halfWords = Regex("(?:^| )(?:and a half|et demie|et demi|و النصف|والنصف|و نصف|ونصف)(?: |$)")
    private val quarterWords = Regex("(?:^| )(?:and a quarter|et quart|و الربع|والربع|و ربع|وربع)(?: |$)")
    private val halfPast = Regex("(?:^| )half past (\\d{1,2})(?: |$)")
    private val quarterPast = Regex("(?:^| )quarter past (\\d{1,2})(?: |$)")
    // "7 30", "7h30", "7 h 30", "7 heures 30", "19h", "الساعه 7 و 30"
    private val clock = Regex("(?:^| )(\\d{1,2})(?: ?(?:heures?|hours|o clock|oclock|h) ?| (?:و ?)?)?(\\d{2})?(?: |$)")

    /** "set an alarm for 7:30 pm" / "réveille-moi à 7h" / "اضبط منبه الساعة 6 صباحا" -> the time, or null. */
    fun parseClock(norm: String): ClockTime? {
        val t = " $norm "
        when {
            Regex("(?:^| )(?:midnight|minuit|منتصف الليل)(?: |$)").containsMatchIn(t) -> return ClockTime(0, 0)
            Regex("(?:^| )(?:noon|midday|midi|الظهر|الظهيره)(?: |$)").containsMatchIn(t) && !Regex("\\d").containsMatchIn(t) -> return ClockTime(12, 0)
        }
        var hour: Int
        var minute: Int
        val hp = halfPast.find(t)
        val qp = quarterPast.find(t)
        if (hp != null) { hour = hp.groupValues[1].toInt(); minute = 30 }
        else if (qp != null) { hour = qp.groupValues[1].toInt(); minute = 15 }
        else {
            val m = clock.find(t) ?: return null
            hour = m.groupValues[1].toIntOrNull() ?: return null
            minute = m.groupValues[2].toIntOrNull() ?: 0
            if (m.groupValues[2].isEmpty()) {
                if (halfWords.containsMatchIn(t)) minute = 30 else if (quarterWords.containsMatchIn(t)) minute = 15
            }
        }
        if (hour > 23 || minute > 59) return null
        if (pmWords.containsMatchIn(t) && hour in 1..11) hour += 12
        else if (amWords.containsMatchIn(t) && hour == 12) hour = 0
        return ClockTime(hour, minute)
    }

    private val durationPart = Regex("(\\d{1,4}) ?(seconds?|secs?|secondes?|ثانيه|ثواني|ثوان|minutes?|mins?|دقيقه|دقايق|دقائق|hours?|hrs?|heures?|ساعه|ساعات)(?: |$)")

    /** "a timer for 5 minutes", "minuteur de 1 heure 30 minutes", "مؤقت دقيقتين" -> seconds, or null. */
    fun parseDuration(norm: String): Int? {
        val t = "$norm "
        var total = 0
        for (m in durationPart.findAll(t)) {
            val n = m.groupValues[1].toInt()
            total += n * unitSeconds(m.groupValues[2])
        }
        if (total == 0) {
            total = when {
                Regex("(?:^| )(?:half an hour|half hour|une demi heure|demi heure|نصف ساعه)(?: |$)").containsMatchIn(t) -> 1800
                Regex("(?:^| )(?:quarter of an hour|un quart d heure|ربع ساعه)(?: |$)").containsMatchIn(t) -> 900
                Regex("(?:^| )(?:ساعتين|two hours)(?: |$)").containsMatchIn(t) -> 7200
                Regex("(?:^| )(?:دقيقتين|two minutes|deux minutes)(?: |$)").containsMatchIn(t) -> 120
                Regex("(?:^| )(?:an hour|one hour|une heure|ساعه واحده|ساعه)(?: |$)").containsMatchIn(t) -> 3600
                Regex("(?:^| )(?:a minute|one minute|une minute|دقيقه واحده|دقيقه)(?: |$)").containsMatchIn(t) -> 60
                else -> 0
            }
        } else if (halfWords.containsMatchIn(" $t") && Regex("(?:hour|heure|ساعه)").containsMatchIn(t)) {
            total += 1800
        }
        return total.takeIf { it in 1..(24 * 3600) }
    }

    private fun unitSeconds(u: String): Int = when {
        u.startsWith("sec") || u.startsWith("ثا") || u.startsWith("ثو") -> 1
        u.startsWith("min") || u.startsWith("دق") -> 60
        else -> 3600
    }

    private val phone = Regex("\\+?[0-9٠-٩](?:[0-9٠-٩ ().\\-]{4,22})[0-9٠-٩]")

    /** A dialable number spoken as digits ("call 0555 12 34 56", "appelle le +33 6 12..."), or null. */
    fun extractPhoneNumber(raw: String): String? {
        val m = phone.find(raw) ?: return null
        val plus = m.value.startsWith("+") || Regex("(?:plus|\\+) ?$").containsMatchIn(raw.substring(0, m.range.first).lowercase())
        val digits = buildString {
            for (c in m.value) when (c) {
                in '0'..'9' -> append(c)
                in '٠'..'٩' -> append('0' + (c - '٠'))
            }
        }
        if (digits.length !in 6..15) return null
        return (if (plus) "+" else "") + digits
    }

    /** Spoken form of a phone number, grouped in pairs so TTS reads digits, not "five hundred million". */
    fun spokenNumber(number: String): String {
        val plus = number.startsWith("+")
        val d = number.filter { it.isDigit() }
        return (if (plus) "+ " else "") + d.chunked(2).joinToString(" ") { it.toCharArray().joinToString(" ") }
    }
}

/** Ranks names (apps, contacts) against a spoken query. Tolerant of accents, Arabic folding and small recognition errors. */
object NameMatcher {
    /** Spoken names in Arabic/French that should match an app's usual (often English) label. */
    private val aliases: Map<String, String> = mapOf(
        "واتساب" to "whatsapp", "واتس اب" to "whatsapp", "الواتساب" to "whatsapp", "واتس" to "whatsapp",
        "يوتيوب" to "youtube", "اليوتيوب" to "youtube", "فيسبوك" to "facebook", "فيس بوك" to "facebook", "الفيسبوك" to "facebook",
        "ماسنجر" to "messenger", "انستغرام" to "instagram", "انستجرام" to "instagram", "انستقرام" to "instagram",
        "تيليجرام" to "telegram", "تلغرام" to "telegram", "تليجرام" to "telegram", "تيك توك" to "tiktok", "سناب شات" to "snapchat", "سناب" to "snapchat",
        "جيميل" to "gmail", "خرائط" to "maps", "الخرائط" to "maps", "خرائط جوجل" to "maps", "google maps" to "maps", "cartes" to "maps",
        "كروم" to "chrome", "جوجل" to "google", "قوقل" to "google", "سبوتيفاي" to "spotify", "يوتيوب ميوزك" to "youtube music",
        "الهاتف" to "phone", "هاتف" to "phone", "telephone" to "phone", "الرسائل" to "messages", "رسائل" to "messages",
        "جهات الاتصال" to "contacts", "الاسماء" to "contacts", "الاله الحاسبه" to "calculator", "الحاسبه" to "calculator", "calculatrice" to "calculator",
        "التقويم" to "calendar", "agenda" to "calendar", "calendrier" to "calendar", "الساعه" to "clock", "المنبه" to "clock", "horloge" to "clock", "reveil" to "clock",
        "المعرض" to "gallery", "الصور" to "photos", "galerie" to "gallery", "متجر بلاي" to "play store", "بلاي ستور" to "play store",
        "القران" to "quran", "المصحف" to "quran", "coran" to "quran", "البريد" to "mail", "courriel" to "mail", "meteo" to "weather", "الطقس" to "weather",
        "enregistreur" to "recorder", "المسجل" to "recorder", "talkback" to "talkback", "تولك باك" to "talkback",
    ).mapKeys { TextNorm.normalize(it.key) }   // keys folded exactly like the spoken query (ئ→ي, ة→ه, accents...)

    /** Extra words an app label may be known by (label "Clock" also answers to "alarm"). */
    private val labelSynonyms: Map<String, List<String>> = mapOf(
        "gallery" to listOf("photos"), "photos" to listOf("gallery"), "phone" to listOf("dialer", "telephone"),
        "messages" to listOf("sms", "messaging"), "clock" to listOf("alarm", "horloge"), "mail" to listOf("gmail", "email"),
    )

    fun canonical(query: String): String {
        val q = TextNorm.normalize(query)
        aliases[q]?.let { return it }
        // alias inside a longer phrase ("l application whatsapp" already Latin; "تطبيق واتساب")
        for ((k, v) in aliases.entries.sortedByDescending { it.key.length }) {
            if (Regex("(?:^| )${Regex.escape(k)}(?: |$)").containsMatchIn(q)) return q.replace(k, v)
        }
        return q
    }

    private val noise = setOf("app", "application", "appli", "lappli", "lapplication", "the", "my", "l", "la", "le", "mon", "ma", "تطبيق", "التطبيق", "برنامج")

    /** Best matches first; empty if nothing plausible. Score 0..1 is returned so callers can ask when it is ambiguous. */
    fun <T> rank(items: List<T>, query: String, name: (T) -> String, limit: Int = 5): List<Pair<T, Double>> {
        val tokens = canonical(query).split(' ').filter { it.isNotEmpty() && it !in noise }
        if (tokens.isEmpty()) return emptyList()
        val joined = tokens.joinToString(" ")
        return items.mapNotNull { item ->
            val label = TextNorm.normalize(name(item))
            val words = label.split(' ').filter { it.isNotEmpty() } + labelSynonyms[label].orEmpty()
            val score = when {
                label == joined -> 1.0
                label.replace(" ", "") == joined.replace(" ", "") -> 0.97
                else -> {
                    var sum = 0.0
                    for (t in tokens) sum += words.maxOfOrNull { wordScore(t, it) } ?: 0.0
                    val avg = sum / tokens.size
                    if (avg <= 0.0) 0.0 else avg * 0.9 * (if (words.size > tokens.size + 2) 0.9 else 1.0)
                }
            }
            if (score >= 0.45) item to score else null
        }.sortedByDescending { it.second }.take(limit)
    }

    private fun wordScore(t: String, w: String): Double = when {
        t == w -> 1.0
        w.startsWith(t) && t.length >= 3 -> 0.8
        t.startsWith(w) && w.length >= 4 -> 0.75
        t.length >= 4 && DocSearch.editDistance(t, w) <= (if (t.length >= 8) 2 else 1) -> 0.7
        else -> 0.0
    }
}
