package com.ecoleeyes.vision

import com.ecoleeyes.core.Lang
import kotlin.math.max
import kotlin.math.min

/**
 * On-device colour naming, fully offline. Looks at the centre of the picture (where the user points the phone),
 * groups pixels into named colours and returns the dominant one, plus a second one if it is clearly present.
 *
 * Lighting changes colours a lot, so the spoken answer always says "appears" (see [ColorResult.spoken]).
 */
object ColorNamer {

    enum class Shade { LIGHT, NORMAL, DARK }

    enum class Name { BLACK, WHITE, GRAY, RED, ORANGE, BROWN, YELLOW, GREEN, CYAN, BLUE, PURPLE, PINK, BEIGE }

    data class Named(val name: Name, val shade: Shade, val share: Float)

    data class ColorResult(val main: Named, val second: Named?, val tooDark: Boolean) {
        fun spoken(lang: Lang): String {
            if (tooDark) return when (lang) {
                Lang.EN -> "The picture is too dark to judge the colour. Try turning on a light."
                Lang.FR -> "L'image est trop sombre pour juger la couleur. Essayez d'allumer une lumière."
                Lang.AR -> "الصورة مظلمة جدًا لتحديد اللون. حاول تشغيل الضوء."
            }
            val a = phrase(main, lang)
            val b = second?.let { phrase(it, lang) }
            return when (lang) {
                Lang.EN -> "It appears to be $a" + (b?.let { ", with some $it" } ?: "") + ". Colours can look different depending on the light."
                Lang.FR -> "Cela semble être $a" + (b?.let { ", avec un peu de $it" } ?: "") + ". Les couleurs peuvent changer selon la lumière."
                Lang.AR -> "يبدو أن اللون $a" + (b?.let { "، مع بعض $it" } ?: "") + ". قد تختلف الألوان حسب الإضاءة."
            }
        }
    }

    /** [argb] are packed ARGB pixels of a [width] x [height] image. Only the central ~50% area is analysed. */
    fun analyze(argb: IntArray, width: Int, height: Int): ColorResult {
        require(argb.size >= width * height && width > 0 && height > 0)
        val x0 = width / 4; val x1 = width - width / 4
        val y0 = height / 4; val y1 = height - height / 4
        val step = max(1, min(x1 - x0, y1 - y0) / 64)   // ~4k samples max, fast on any phone
        val counts = HashMap<Pair<Name, Shade>, Int>()
        var total = 0
        var darkCount = 0
        val hsv = FloatArray(3)
        var y = y0
        while (y < y1) {
            var x = x0
            while (x < x1) {
                val p = argb[y * width + x]
                toHsv(p, hsv)
                if (hsv[2] < 0.08f) darkCount++
                val key = classify(hsv)
                counts[key] = (counts[key] ?: 0) + 1
                total++
                x += step
            }
            y += step
        }
        if (total == 0 || darkCount > total * 0.9) return ColorResult(Named(Name.BLACK, Shade.NORMAL, 1f), null, tooDark = true)
        // Merge shades per colour name to choose the winner, then keep its most common shade.
        val byName = counts.entries.groupBy { it.key.first }.mapValues { e -> e.value.sumOf { it.value } }
        val ranked = byName.entries.sortedByDescending { it.value }
        fun pick(n: Name): Named {
            val shade = counts.entries.filter { it.key.first == n }.maxBy { it.value }.key.second
            return Named(n, shade, byName.getValue(n).toFloat() / total)
        }
        val main = pick(ranked[0].key)
        val second = ranked.getOrNull(1)?.takeIf { it.value >= total * 0.22 }?.let { pick(it.key) }
        return ColorResult(main, second, tooDark = false)
    }

    fun toHsv(argb: Int, out: FloatArray) {
        val r = (argb shr 16 and 0xFF) / 255f
        val g = (argb shr 8 and 0xFF) / 255f
        val b = (argb and 0xFF) / 255f
        val mx = max(r, max(g, b)); val mn = min(r, min(g, b))
        val d = mx - mn
        var h = when {
            d == 0f -> 0f
            mx == r -> 60f * (((g - b) / d) % 6f)
            mx == g -> 60f * (((b - r) / d) + 2f)
            else -> 60f * (((r - g) / d) + 4f)
        }
        if (h < 0) h += 360f
        out[0] = h; out[1] = if (mx == 0f) 0f else d / mx; out[2] = mx
    }

    /** HSV -> named colour + shade. Thresholds tuned for phone photos (auto white balance, indoor light). */
    fun classify(hsv: FloatArray): Pair<Name, Shade> {
        val h = hsv[0]; val s = hsv[1]; val v = hsv[2]
        if (v < 0.18f) return Name.BLACK to Shade.NORMAL
        if (s < 0.15f) return when {
            v > 0.85f -> Name.WHITE to Shade.NORMAL
            v > 0.62f -> Name.GRAY to Shade.LIGHT
            v > 0.35f -> Name.GRAY to Shade.NORMAL
            else -> Name.GRAY to Shade.DARK
        }
        val shade = when { v < 0.45f -> Shade.DARK; v > 0.85f && s < 0.45f -> Shade.LIGHT; else -> Shade.NORMAL }
        val name = when {
            h < 15f || h >= 340f -> if (s < 0.5f && v > 0.7f) Name.PINK else Name.RED
            h < 45f -> when {
                v < 0.6f -> Name.BROWN
                s < 0.4f -> Name.BEIGE
                else -> Name.ORANGE
            }
            h < 70f -> if (v < 0.5f) Name.BROWN else if (s < 0.35f) Name.BEIGE else Name.YELLOW
            h < 165f -> Name.GREEN
            h < 195f -> Name.CYAN
            h < 260f -> Name.BLUE
            h < 295f -> Name.PURPLE
            else -> Name.PINK
        }
        // Brown and beige already carry their darkness; do not say "dark brown" for every brown.
        val finalShade = if (name == Name.BROWN && shade == Shade.DARK && v > 0.3f) Shade.NORMAL else shade
        return name to finalShade
    }

    fun phrase(n: Named, lang: Lang): String {
        val base = word(n.name, lang)
        if (n.shade == Shade.NORMAL || n.name == Name.BLACK || n.name == Name.WHITE) return base
        return when (lang) {
            Lang.EN -> (if (n.shade == Shade.DARK) "dark " else "light ") + base
            Lang.FR -> base + if (n.shade == Shade.DARK) " foncé" else " clair"
            Lang.AR -> base + if (n.shade == Shade.DARK) " داكن" else " فاتح"
        }
    }

    fun word(n: Name, lang: Lang): String = when (lang) {
        Lang.EN -> when (n) {
            Name.BLACK -> "black"; Name.WHITE -> "white"; Name.GRAY -> "grey"; Name.RED -> "red"; Name.ORANGE -> "orange"
            Name.BROWN -> "brown"; Name.YELLOW -> "yellow"; Name.GREEN -> "green"; Name.CYAN -> "turquoise"; Name.BLUE -> "blue"
            Name.PURPLE -> "purple"; Name.PINK -> "pink"; Name.BEIGE -> "beige"
        }
        Lang.FR -> when (n) {
            Name.BLACK -> "noir"; Name.WHITE -> "blanc"; Name.GRAY -> "gris"; Name.RED -> "rouge"; Name.ORANGE -> "orange"
            Name.BROWN -> "marron"; Name.YELLOW -> "jaune"; Name.GREEN -> "vert"; Name.CYAN -> "turquoise"; Name.BLUE -> "bleu"
            Name.PURPLE -> "violet"; Name.PINK -> "rose"; Name.BEIGE -> "beige"
        }
        Lang.AR -> when (n) {
            Name.BLACK -> "أسود"; Name.WHITE -> "أبيض"; Name.GRAY -> "رمادي"; Name.RED -> "أحمر"; Name.ORANGE -> "برتقالي"
            Name.BROWN -> "بني"; Name.YELLOW -> "أصفر"; Name.GREEN -> "أخضر"; Name.CYAN -> "فيروزي"; Name.BLUE -> "أزرق"
            Name.PURPLE -> "بنفسجي"; Name.PINK -> "وردي"; Name.BEIGE -> "بيج"
        }
    }
}
