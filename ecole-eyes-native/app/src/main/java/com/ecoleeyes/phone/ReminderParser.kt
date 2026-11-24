package com.ecoleeyes.phone

import com.ecoleeyes.voice.TextNorm

/**
 * Understands relative reminders offline in three languages:
 *   "remind me in 10 minutes to take my medicine", "rappelle-moi dans 2 heures d'appeler maman",
 *   "ذكرني بعد 5 دقائق بإطفاء الفرن", "remind me to call Sara in half an hour".
 * Absolute times ("at 5 pm tomorrow") are left to the AI, which converts them to minutes with the set_reminder tool.
 */
object ReminderParser {
    data class Reminder(val minutes: Int, val text: String)

    private val trigger = Regex("^(?:please )?(?:remind me|set (?:a )?reminder|rappelle moi|rappelle toi|mets un rappel|fais moi penser|ذكرني|ذكرنى|نبهني|اضبط تذكير|ضع تذكير)(?: |$)")

    // number + unit, in any order of the sentence
    private val num = "(\\d{1,4}|one|two|three|four|five|ten|fifteen|twenty|thirty|un|une|deux|trois|quatre|cinq|dix|quinze|vingt|trente|واحده|واحد|دقيقه|ساعه|ساعتين|دقيقتين|خمس|عشر|ثلاث|اربع|عشرين|ثلاثين|خمسه|عشره|ثلاثه|اربعه)"
    private val unitMin = "(?:minutes?|mins?|دقايق|دقائق|دقيقه|دقيقتين)"
    private val unitHour = "(?:hours?|heures?|ساعات|ساعه|ساعتين)"
    private val rel = Regex("(?:in|dans|apres|after|بعد|خلال) $num ?($unitMin|$unitHour)")
    private val halfHour = Regex("(?:in|dans|بعد|خلال) (?:half an hour|a half hour|une demi heure|une demie heure|نصف ساعه)")
    private val anHour = Regex("(?:in|dans|بعد|خلال) (?:an hour|one hour|une heure|ساعه|ساعه واحده)(?: |$)")
    private val aMinute = Regex("(?:in|dans|بعد|خلال) (?:a minute|une minute|دقيقه)(?: |$)")
    private val twoUnits = Regex("(?:بعد|خلال) (ساعتين|دقيقتين)")

    private val words = mapOf(
        "one" to 1, "un" to 1, "une" to 1, "واحد" to 1, "واحده" to 1, "two" to 2, "deux" to 2, "three" to 3, "trois" to 3, "ثلاث" to 3, "ثلاثه" to 3,
        "four" to 4, "quatre" to 4, "اربع" to 4, "اربعه" to 4, "five" to 5, "cinq" to 5, "خمس" to 5, "خمسه" to 5, "ten" to 10, "dix" to 10, "عشر" to 10, "عشره" to 10,
        "fifteen" to 15, "quinze" to 15, "twenty" to 20, "vingt" to 20, "عشرين" to 20, "thirty" to 30, "trente" to 30, "ثلاثين" to 30,
    )

    fun isReminderRequest(raw: String): Boolean = trigger.containsMatchIn(TextNorm.normalize(raw))

    /** Returns null if this is not a reminder or has no relative time (then the AI should handle it). */
    fun parse(raw: String): Reminder? {
        val t = TextNorm.normalize(raw)
        if (!trigger.containsMatchIn(t)) return null
        var minutes: Int? = null
        var timeRange: IntRange? = null
        twoUnits.find(t)?.let { m -> minutes = if (m.groupValues[1] == "ساعتين") 120 else 2; timeRange = m.range }
        if (minutes == null) rel.find(t)?.let { m ->
            val n = m.groupValues[1].toIntOrNull() ?: words[m.groupValues[1]]
            if (n != null) {
                minutes = if (Regex(unitHour).matches(m.groupValues[2])) n * 60 else n
                timeRange = m.range
            }
        }
        if (minutes == null) halfHour.find(t)?.let { minutes = 30; timeRange = it.range }
        if (minutes == null) anHour.find(t)?.let { minutes = 60; timeRange = it.range }
        if (minutes == null) aMinute.find(t)?.let { minutes = 1; timeRange = it.range }
        val m = minutes ?: return null
        if (m !in 1..(7 * 24 * 60)) return null

        // What to be reminded of = the sentence minus the trigger and the time phrase.
        var rest = t
        timeRange?.let { r -> rest = rest.removeRange(r) }
        rest = trigger.replace(rest, "")
        rest = rest.trim()
            .removePrefix("to ").removePrefix("that ").removePrefix("about ")
            .removePrefix("de ").removePrefix("d ").removePrefix("que ")
            .removePrefix("ب").removePrefix("ان ")
            .trim()
        rest = rest.removeSuffix(" please").removeSuffix(" s il te plait").removeSuffix(" من فضلك").trim()
        return Reminder(m, rest)
    }
}
