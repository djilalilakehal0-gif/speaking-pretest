package com.ecoleeyes.vision

import com.ecoleeyes.core.Lang

/** A box in normalized image coordinates (0..1, origin top-left, image as the user faces it). */
data class NBox(val left: Float, val top: Float, val right: Float, val bottom: Float) {
    val centerX get() = (left + right) / 2f
    val area get() = ((right - left) * (bottom - top)).coerceIn(0f, 1f)
}

/** One thing found on the phone. [label] is an English ML Kit label (translated at speaking time). */
data class LocalObject(val label: String?, val confidence: Float, val box: NBox)

data class LocalScene(
    val objects: List<LocalObject>,
    /** Whole-picture labels ("Room", "Kitchen", "Food"...) with confidence. */
    val labels: List<Pair<String, Float>>,
    /** Detected faces (positions only; never identities). */
    val faces: List<NBox>,
    val tooDark: Boolean = false,
)

enum class Zone { LEFT, AHEAD, RIGHT }

/**
 * Turns an on-device [LocalScene] into a short spoken description, from the user's point of view.
 * Offline models are much less capable than the cloud model, so the wording is deliberately cautious
 * and always says that it is an on-device estimate.
 */
object SceneComposer {

    fun zoneOf(box: NBox): Zone = when {
        box.centerX < 0.36f -> Zone.LEFT
        box.centerX > 0.64f -> Zone.RIGHT
        else -> Zone.AHEAD
    }

    /** Large boxes are near the camera. Only a rough hint: no distance in metres is ever claimed. */
    fun isClose(box: NBox) = box.area > 0.30f

    // ML Kit labels that describe the picture, not an object you can bump into.
    private val sceneOnly = setOf("Room", "Interior design", "Building", "Sky", "Cool", "Fun", "Event", "Pattern", "Darkness", "Night", "Sitting", "Standing", "Smile", "Selfie", "Hand", "Beard", "Eyelash", "Ear", "Hair", "Skin", "Flesh", "Person", "Comics", "Monochrome", "Font", "Poster")

    fun compose(scene: LocalScene, lang: Lang): String {
        if (scene.tooDark) return when (lang) {
            Lang.EN -> "The picture is too dark. Turn on a light or uncover the camera, then ask again."
            Lang.FR -> "L'image est trop sombre. Allumez une lumière ou découvrez la caméra, puis redemandez."
            Lang.AR -> "الصورة مظلمة جدًا. شغّل الضوء أو أزل الغطاء عن الكاميرا ثم اسأل مرة أخرى."
        }
        val parts = ArrayList<String>()

        // People first: they matter most for orientation. Count and position only.
        if (scene.faces.isNotEmpty()) parts += people(scene.faces, lang)

        // Named objects grouped by zone, nearest first, max 2 per zone to keep it short.
        val named = scene.objects
            .filter { it.label != null && it.confidence >= 0.5f && it.label !in sceneOnly }
            .sortedByDescending { it.box.area }
        val byZone = named.groupBy { zoneOf(it.box) }
        for (z in listOf(Zone.AHEAD, Zone.LEFT, Zone.RIGHT)) {
            val items = byZone[z].orEmpty().distinctBy { it.label }.take(2)
            if (items.isEmpty()) continue
            val words = items.map { o -> LabelDictionary.translate(o.label!!, lang) + if (isClose(o.box)) closeWord(lang) else "" }
            parts += zonePhrase(z, joinAnd(words, lang), lang)
        }

        // Unnamed objects: only mention that something is there if nothing else was found ahead.
        val unnamedAhead = scene.objects.count { it.label == null && zoneOf(it.box) == Zone.AHEAD }
        if (byZone[Zone.AHEAD].isNullOrEmpty() && unnamedAhead > 0) parts += when (lang) {
            Lang.EN -> "There is an object ahead that I cannot name."
            Lang.FR -> "Il y a un objet devant vous que je ne sais pas nommer."
            Lang.AR -> "يوجد شيء أمامك لا أستطيع تحديده."
        }

        // General impression from whole-image labels not already said.
        val said = named.mapNotNull { it.label }.toSet()
        val general = scene.labels.filter { it.second >= 0.7f && it.first !in said && it.first !in sceneOnly }
            .map { it.first }.distinct().take(3)
        if (general.isNotEmpty()) {
            val words = joinAnd(general.map { LabelDictionary.translate(it, lang) }, lang)
            parts += when (lang) {
                Lang.EN -> "The picture also suggests: $words."
                Lang.FR -> "L'image évoque aussi : $words."
                Lang.AR -> "توحي الصورة أيضًا بـ: $words."
            }
        }

        if (parts.isEmpty()) return when (lang) {
            Lang.EN -> "On-device analysis could not recognize anything clearly. Try moving the phone slowly, or connect to the internet for a detailed description."
            Lang.FR -> "L'analyse sur le téléphone n'a rien reconnu clairement. Bougez lentement le téléphone, ou connectez-vous à internet pour une description détaillée."
            Lang.AR -> "لم يتعرف التحليل على الهاتف على أي شيء بوضوح. حرّك الهاتف ببطء، أو اتصل بالإنترنت للحصول على وصف مفصل."
        }
        val prefix = when (lang) {
            Lang.EN -> "Offline estimate: "
            Lang.FR -> "Estimation hors ligne : "
            Lang.AR -> "تقدير دون اتصال: "
        }
        val suffix = when (lang) {
            Lang.EN -> " This may be incomplete; keep using your cane or guide."
            Lang.FR -> " Cela peut être incomplet ; gardez votre canne ou votre guide."
            Lang.AR -> " قد يكون هذا ناقصًا؛ استمر في استخدام عصاك أو مرشدك."
        }
        return prefix + parts.joinToString(" ") + suffix
    }

    private fun people(faces: List<NBox>, lang: Lang): String {
        val zones = faces.map { zoneOf(it) }.distinct()
        val where = joinAnd(zones.map { zoneWord(it, lang) }, lang)
        val n = faces.size
        return when (lang) {
            Lang.EN -> if (n == 1) "I can see one person $where." else "I can see $n people, $where."
            Lang.FR -> if (n == 1) "Je vois une personne $where." else "Je vois $n personnes, $where."
            Lang.AR -> if (n == 1) "أرى شخصًا واحدًا $where." else if (n == 2) "أرى شخصين، $where." else "أرى $n أشخاص، $where."
        }
    }

    private fun zoneWord(z: Zone, lang: Lang) = when (lang) {
        Lang.EN -> when (z) { Zone.LEFT -> "on your left"; Zone.AHEAD -> "in front of you"; Zone.RIGHT -> "on your right" }
        Lang.FR -> when (z) { Zone.LEFT -> "à votre gauche"; Zone.AHEAD -> "devant vous"; Zone.RIGHT -> "à votre droite" }
        Lang.AR -> when (z) { Zone.LEFT -> "على يسارك"; Zone.AHEAD -> "أمامك"; Zone.RIGHT -> "على يمينك" }
    }

    private fun zonePhrase(z: Zone, what: String, lang: Lang) = when (lang) {
        Lang.EN -> "${zoneWord(z, lang).replaceFirstChar { it.uppercase() }}: $what."
        Lang.FR -> "${zoneWord(z, lang).replaceFirstChar { it.uppercase() }} : $what."
        Lang.AR -> "${zoneWord(z, lang)}: $what."
    }

    private fun closeWord(lang: Lang) = when (lang) { Lang.EN -> ", quite close"; Lang.FR -> ", assez proche"; Lang.AR -> "، قريب نسبيًا" }

    fun joinAnd(words: List<String>, lang: Lang): String {
        if (words.size <= 1) return words.firstOrNull().orEmpty()
        val and = when (lang) { Lang.EN -> " and "; Lang.FR -> " et "; Lang.AR -> " و" }
        val sep = if (lang == Lang.AR) "، " else ", "
        return words.dropLast(1).joinToString(sep) + and + words.last()
    }

    /**
     * Offline "describe this": the central / largest object, its colour and any printed text read on the phone.
     * Much less capable than the cloud model, and says so in one short sentence.
     */
    fun objectDetail(scene: LocalScene, color: ColorNamer.ColorResult?, text: String?, lang: Lang): String {
        if (scene.tooDark) return compose(scene, lang)
        val main = scene.objects
            .filter { it.label != null && it.confidence >= 0.5f && it.label !in sceneOnly }
            .minByOrNull { kotlin.math.abs(it.box.centerX - 0.5f) - it.box.area }   // central and big wins
        val name = main?.label?.let { LabelDictionary.translate(it, lang) }
            ?: scene.labels.firstOrNull { it.second >= 0.7f && it.first !in sceneOnly }?.first?.let { LabelDictionary.translate(it, lang) }
        val parts = ArrayList<String>()
        parts += when {
            name != null -> when (lang) { Lang.EN -> "It looks like a $name."; Lang.FR -> "On dirait : $name."; Lang.AR -> "يبدو أنه $name." }
            else -> when (lang) { Lang.EN -> "I cannot name the object on the phone alone."; Lang.FR -> "Je ne sais pas nommer l’objet sans internet."; Lang.AR -> "لا أستطيع تسمية هذا الشيء بدون إنترنت." }
        }
        if (color != null && !color.tooDark) {
            val c = ColorNamer.phrase(color.main, lang)
            parts += when (lang) { Lang.EN -> "Its main colour appears to be $c."; Lang.FR -> "Sa couleur principale semble être $c."; Lang.AR -> "لونه الغالب يبدو $c." }
        }
        val printed = text?.replace(Regex("\\s+"), " ")?.trim()?.take(300)
        if (!printed.isNullOrEmpty()) parts += when (lang) { Lang.EN -> "Printed on it: $printed."; Lang.FR -> "Texte écrit dessus : $printed."; Lang.AR -> "المكتوب عليه: $printed." }
        parts += when (lang) {
            Lang.EN -> "Offline estimate; connect to the internet for a full description."
            Lang.FR -> "Estimation hors ligne ; connectez-vous pour une description complète."
            Lang.AR -> "هذا تقدير دون إنترنت؛ اتصل بالإنترنت لوصف كامل."
        }
        return parts.joinToString(" ")
    }

    /** Offline answer to "is there someone in front of me?". */
    fun peopleAnswer(scene: LocalScene, lang: Lang): String {
        if (scene.tooDark) return compose(scene, lang)
        if (scene.faces.isEmpty()) return when (lang) {
            Lang.EN -> "I don't see a face in the picture. Someone could still be there facing away or out of view."
            Lang.FR -> "Je ne vois pas de visage sur l'image. Quelqu'un peut quand même être là, de dos ou hors du cadre."
            Lang.AR -> "لا أرى وجهًا في الصورة. قد يكون هناك شخص يدير ظهره أو خارج مجال الرؤية."
        }
        return people(scene.faces, lang)
    }
}
