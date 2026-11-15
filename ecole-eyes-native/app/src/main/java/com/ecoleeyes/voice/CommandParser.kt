package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang

/**
 * Fast, offline understanding of unambiguous commands in Arabic, French and English.
 * Natural / ambiguous requests are NOT guessed here: they fall through to [Command.Ask] so the
 * AI can understand them (and the offline fallback can say so honestly).
 */
object CommandParser {

    /** Patterns are folded the same way as the input (alef/yeh/teh-marbuta/hamza), so they can be written naturally. */
    private fun fold(p: String) = p
        .replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
        .replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
    private fun r(p: String) = Regex(fold(p))
    private fun any(vararg ps: String) = Regex(fold("^(?:" + ps.joinToString("|") + ")$"))

    private const val AL = "(?:ال)?"
    private const val PLEASE = "(?:please |s il vous plait |s il te plait |من فضلك |لو سمحت )?"
    private const val TAIL = "(?: please| s il vous plait| s il te plait| من فضلك| لو سمحت| now| maintenant| الان)?"

    // wake phrase: "hello école eyes", "bonjour école eyes", "مرحبا ايكول ايز" (several spellings)
    private val wake = r("^(?:(?:hello|hi|hey|ok|bonjour|salut|coucou|مرحبا|اهلا|السلام عليكم|يا) )?(?:ecole eyes|ecole ais|ecole|ekol eyes|ايكول ايز|ايكول ايس|اكول ايز|ايكول|اكول)(?: |$)")

    private val stop = any("stop", "stop it", "stop talking", "stop speaking", "be quiet", "quiet", "silence", "shut up", "enough", "cancel", "arrete", "arrete toi", "arrete de parler", "tais toi", "ca suffit", "assez", "annule", "توقف", "قف", "اسكت", "كفي", "كفى", "اصمت", "وقف", "توقف عن الكلام", "كفي كلام", "الغاء", "الغي")

    private val liveStop = r("(?:stop|end|turn off|disable|arrete|desactive|termine|اوقف|ايقاف|اغلق|الغ).*(?:continuous|live|description continue|description en direct|وصف مستمر|الوصف المستمر|الوصف)")
    private val liveStart = r("(?:stay with me|describe (?:what )?(?:changes|is changing)|keep describing|continuous (?:description|assist|assistance)|live (?:description|mode)|start (?:the )?live|reste avec moi|decris (?:moi )?(?:ce qui change|en continu)|description continue|description en direct|ابق معي|ابقي معي|وصف مستمر|الوصف المستمر|صف لي ما يتغير|صف ما يتغير)")

    private val help = any("help", "help me", "what can you do", "what do you do", "what are you able to do", "what can i say", "commands", "que sais tu faire", "que peux tu faire", "qu est ce que tu sais faire", "qu est ce que tu peux faire", "aide", "aide moi", "aidez moi", "ماذا تستطيع ان تفعل", "ماذا تستطيع", "ماذا يمكنك ان تفعل", "ماذا يمكنك", "ما الذي تستطيع فعله", "مساعده", "ساعدني")
    private val time = r("^(?:what(?: is| s|s)? (?:the )?time(?: is it)?(?: now)?|what time is it(?: now)?|tell me the time|do you have the time|quelle heure est il|il est quelle heure|quelle heure|donne moi l heure|l heure s il te plait|كم الساعه|كم الساعه الان|ما الوقت|كم الوقت|كم الوقت الان|اخبرني بالوقت|ما هي الساعه)" + TAIL + "$")

    private val volUp = r("(?:increase|raise|turn up|up the|louder|augmente|monte|plus fort|ارفع|زد|اعلي|اعلى|صوت اعلي|اعلا).*(?:volume|sound|son|الصوت|صوت)?|volume up|plus fort|louder|turn it up")
    private val volDown = r("(?:decrease|lower|reduce|turn down|quieter|baisse|diminue|moins fort|اخفض|قلل|خفض).*(?:volume|sound|son|الصوت|صوت)?|volume down|moins fort|quieter|turn it down")
    private val speedUp = any("(?:speak|talk|read|parle|lis|تكلم|اقرا|تحدث)? ?(?:faster|quicker|plus vite|اسرع|بسرعه اكبر)", "speed up", "faster", "plus vite", "اسرع", "increase (?:the )?speed", "augmente la vitesse")
    private val speedDown = any("(?:speak|talk|read|parle|lis|تكلم|اقرا|تحدث)? ?(?:slower|more slowly|plus lentement|plus doucement|ابطا|ابطا قليلا|بشكل ابطا|ببطء)", "slow down", "slower", "plus lentement", "ابطا", "decrease (?:the )?speed", "diminue la vitesse")

    private val langVerb = "(?:(?:please |s il te plait |s il vous plait )?(?:speak|talk|switch to|switch|change (?:the )?language to|change to|use|answer in|reply in|parle|parlez|parle moi|passe en|passe au|change la langue en|mets toi en|reponds en|تكلم|تحدث|بدل اللغه الي|بدل اللغه الى|غير اللغه الي|غير اللغه الى|حول الي|حول الى|اللغه)|in|en)"
    private val langEn = "(?:english|anglais|الانجليزيه|بالانجليزيه|الانكليزيه|بالانكليزيه|انجليزي|انكليزي)"
    private val langFr = "(?:french|francais|الفرنسيه|بالفرنسيه|فرنسي)"
    private val langAr = "(?:arabic|arabe|العربيه|بالعربيه|عربي|اللغه العربيه|باللغه العربيه)"
    private fun langRe(l: String) = r("^$langVerb ?(?:in |en |ب|باللغه |la langue )?$l$TAIL$|^(?:in |en )?$l$")

    private val clear = r("(?:clear|delete|erase|wipe|forget|efface|supprime|vide|oublie|امسح|احذف|امح|انسي).*(?:history|conversation|chat|memory|historique|memoire|سجل|السجل|المحادثه|الذاكره)")
    private val cloudOn = r("(?:allow|enable|turn on|activate|autorise|active|اسمح|فعل|شغل).*(?:cloud|cloud assistance|assistance cloud|السحابي|السحابيه)")
    private val cloudOff = r("(?:disable|turn off|stop using|deactivate|desactive|n autorise pas|ايقاف|عطل|امنع|لا تسمح).*(?:cloud|assistance cloud|السحابي|السحابيه)")

    // navigation
    private val closeCamera = r("^(?:close|stop|turn off|ferme|eteins|arrete|اغلق|اطفئ|اطفي|اغلاق) (?:the )?(?:camera|la camera|$AL" + "كاميرا)$")
    private val openCamera = r("^$PLEASE(?:open|start|launch|turn on|show|ouvre|ouvrir|ouvrez|lance|demarre|active|افتح|شغل|ابدا|فعل) (?:the |my |la |ma )?(?:smart |intelligent )?(?:camera|camera intelligente|$AL" + "كاميرا(?: الذكيه)?)$TAIL|^(?:camera|caméra|الكاميرا)$")
    private val openAssistant = r("^(?:open|start|launch|go to|ouvre|ouvrir|lance|va a|افتح|شغل|اذهب الي|اذهب الى) (?:the |my |l |la )?(?:ai |ia )?(?:assistant|conversation|chat|assistant ia|conversation ia|$AL" + "مساعد(?: الذكي)?|محادثه(?: الذكاء الاصطناعي)?)$TAIL")
    private val openDocs = r("^(?:open|show|go to|ouvre|montre|affiche|va a|افتح|اعرض|اذهب الي|اذهب الى|read) (?:me )?(?:my |the |mes |les |لي )?(?:documents|document reader|lecteur de documents|docs|documents|$AL" + "مستندات(?:ي)?|قارئ المستندات)$TAIL")
    private val openFiles = r("^(?:open|show|go to|ouvre|montre|affiche|va a|افتح|اعرض|اذهب الي|اذهب الى)(?: me)? (?:my |the |mes |les |لي )?(?:downloaded files|downloads|files|file search|fichiers|fichiers telecharges|telechargements|recherche de fichiers|ملفاتي|الملفات|$AL" + "ملفات(?:ي)?|التنزيلات|ملفاتي المحمله)$TAIL|^(?:show|montre|اعرض)(?: me| moi| لي)? (?:my |mes )?(?:files|fichiers|ملفاتي)$")
    private val openSettings = r("^(?:open |go to |show |ouvre |va aux |montre |افتح |اذهب الي |اذهب الى |اعرض )?(?:the |my |les |mes )?(?:settings|accessibility settings|parametres|reglages|$AL" + "اعدادات(?:ي)?|إعدادات سهوله الوصول|اعدادات سهوله الوصول)$TAIL")
    private val openPrivacy = r("(?:privacy|politique de confidentialite|confidentialite|الخصوصيه|سياسه الخصوصيه)")
    private val home = any("(?:go )?home", "go to (?:the )?home(?: screen)?", "main menu", "accueil", "retour a l accueil", "va a l accueil", "menu principal", "الرئيسيه", "الصفحه الرئيسيه", "ارجع الي الرئيسيه", "ارجع للرئيسيه", "اذهب الي الرئيسيه", "القائمه الرئيسيه")
    private val back = any("(?:go )?back", "go back", "return", "previous screen", "retour", "reviens", "reviens en arriere", "retourne", "ecran precedent", "ارجع", "رجوع", "للخلف", "عودة", "عوده", "الرجوع", "ارجع للخلف", "الشاشه السابقه")
    private val close = r("^(?:exit|quit|quitte|quitter|اخرج|انهي)$TAIL$|^(?:close|exit|quit|leave|shut down|ferme|fermer|quitte|quitter|اغلق|انهي|اخرج)(?: the| l| ال)? ?(?:app|application|ecole eyes|التطبيق|تطبيق)$TAIL$")
    private val repeatPara = r("(?:repeat|say again|replay|re read|reread|repete|relis|rejoue|اعد|كرر|اعيد).*(?:paragraph|paragraphe|الفقره)")
    private val repeatLast = any("repeat(?: that| it| please)?", "repeat (?:the )?(?:last )?(?:answer|response|thing)", "say (?:that )?again", "what did you say", "pardon", "repete(?: s il te plait)?", "repete (?:la )?(?:derniere )?reponse", "tu peux repeter", "peux tu repeter", "redis", "redis le", "اعد", "كرر", "اعد الاجابه", "اعد اخر اجابه", "كرر الاجابه", "كرر اخر اجابه", "ماذا قلت", "اعد ما قلت", "كرر ما قلت", "اعد الاخيره")

    // reader
    private val pause = r("^(?:pause|pause reading|pause the reading|hold on|wait|mets en pause|pause la lecture|attends|ايقاف مؤقت|توقف مؤقتا|وقف القراءه مؤقتا|الغي القراءه مؤقتا|انتظر)$|^pause ")
    private val resume = any("continue(?: reading)?", "resume(?: reading)?", "keep reading", "go on", "carry on", "proceed", "continue(?: la lecture)?", "reprends(?: la lecture)?", "poursuis", "vas y", "تابع", "تابع القراءه", "استمر", "واصل", "كمل", "اكمل", "استئناف", "كمل القراءه", "واصل القراءه")
    private val nextPage = r("(?:next page|go to (?:the )?next page|page suivante|aller a la page suivante|passe a la page suivante|الصفحه التاليه|الصفحه القادمه|الصفحه بعدها|انتقل الي الصفحه التاليه)")
    private val prevPage = r("(?:previous page|last page|go to (?:the )?previous page|page precedente|aller a la page precedente|retourne a la page precedente|الصفحه السابقه|الصفحه قبلها|ارجع الي الصفحه السابقه)")
    private val gotoPage = r("(?:go to |goto |aller a la |va a la |اذهب الي |اذهب الى |انتقل الي |انتقل الى )?(?:page|الصفحه) (\\d{1,5})$|^(?:go to |aller a |اذهب الي )(?:page |la page |الصفحه )(\\d{1,5})")
    private val nextPara = r("^(?:skip(?: ahead| this| paragraph)?|next paragraph|skip paragraph|paragraphe suivant|passe(?: ce paragraphe)?|saute(?: ce paragraphe)?|الفقره التاليه|تخطي|تخطى|تجاوز|تخط)$")
    private val readCurrent = any("read (?:it|that|this|the|this the)?(?: document| file| pdf)?(?: aloud| out loud| to me)?", "read (?:me )?(?:the |this )?(?:document|file|pdf|page)(?: aloud| out loud| to me)?", "read aloud", "start reading", "lis le", "lis la", "lis le document", "lis ce document", "lis moi le document", "lis le a voix haute", "lis a voix haute", "lis moi ca", "commence la lecture", "اقراه", "اقرا", "اقرا المستند", "اقرا هذا المستند", "اقرا الملف", "اقرا لي المستند", "اقرا لي", "اقرا بصوت عال", "ابدا القراءه", "اقرا الوثيقه")
    private val next = any("next", "the next one", "next one", "suivant", "le suivant", "suivante", "التالي", "الذي بعده", "التالى")

    // documents
    private val docNoun = "(?:documents?|files?|pdfs?|docs?|docx|word|word documents?|text files?|txt|rtf|images?|scans?|scanned documents?|fichiers?|pdf|fichier word|documents? word|ملفات|ملف|مستندات|مستند|وثيقه|وثائق)"
    private val readLatest = r("^(?:read|open|lis|lire|ouvre|اقرا|افتح)(?: me| moi| لي)? (?:the |my |mon |ma |le |la |ال)?(?:last|latest|most recent|newest|dernier|derniere|اخر|احدث)(?: downloaded| telecharge| telechargee| الذي حملته| الذي نزلته| المحمل| المنزل)? ?($docNoun)?(?: i downloaded| que j ai telecharge| que j ai telechargee)?$TAIL$|^(?:read|lis|اقرا) (?:the )?(?:last|dernier) (?:document|file) i downloaded$")
    private val openAnyRe = r("^(?:open|launch|start|show|ouvre|ouvrir|lance|montre|افتح|شغل|اعرض)(?: me| moi| لي)? (?:the |my |a |an |le |la |les |mon |ma |mes |ال)?(.+)$")
    private val readNamed = r("^(?:read|open|lis|lire|ouvre|اقرا|افتح)(?: me| moi| لي)? (?:the |my |a |le |la |mon |ma |ال)?(?:$docNoun )?(?:named|called|nomme|nommee|appele|appelee|باسم|اسمه|اسمها|المسمي|المسمى|بعنوان) (.+)$")
    private val findVerb = "(?:find|search(?: for)?|look for|locate|show me|list|trouve|trouver|cherche|chercher|recherche|montre moi|liste|ابحث عن|ابحث|جد|اوجد|دور علي|اعرض لي)"
    private val findDocs = r("^(?:$PLEASE)$findVerb (.+)$")

    // camera (only unambiguous forms; the rest goes to the AI)
    private val describe = any(
        "describe (?:what(?: is| s|s)? )?(?:in front of me|around me|here|everything(?: in front of me| around me)?|the (?:scene|room|surroundings|view))",
        "describe (?:the )?(?:scene|room|surroundings|view|everything)", "describe what you see", "what(?: is| s|s)? in front of me", "what(?: is| s|s)? around me",
        "what do you see", "what can you see", "what is happening around me", "explain what is happening around me", "tell me what(?: s|s| is) around me",
        "qu est ce qu il y a devant moi", "qu y a t il devant moi", "qu est ce qui est devant moi", "decris ce qu il y a devant moi", "decris ce qui est devant moi", "decris la scene", "decris la piece", "decris moi ce qu il y a devant moi", "decris", "que vois tu", "qu est ce que tu vois", "decris ce qui se passe autour de moi",
        "ماذا امامي", "ماذا يوجد امامي", "ما الذي امامي", "صف لي ما امامي", "صف ما امامي", "صف ما حولي", "صف لي ما حولي", "ماذا يوجد حولي", "ماذا ترى", "ماذا تري", "صف لي الغرفه", "صف الغرفه", "صف المشهد", "اشرح ما يحدث حولي", "اشرح لي ما يحدث حولي", "صف كل شيء امامي", "صف لي كل شيء امامي")
    private val readView = any(
        "read (?:the )?text(?: in front of me)?", "read (?:the )?(?:text|writing|sign|label|menu|letter|paper) (?:in front of me|here)", "read this(?: paper| sign| label| menu| letter)?", "read what(?: s|s| is) written", "what(?: s|s| is) written(?: here| on this paper| on this)?", "tell me what(?: s|s| is) written(?: on this paper| here| on this)?", "what does it say", "what does this say",
        "lis le texte", "lis le texte devant moi", "lis ce papier", "lis ceci", "qu est ce qui est ecrit", "qu est ce qui est ecrit ici", "dis moi ce qui est ecrit", "dis moi ce qui est ecrit sur ce papier", "que dit ce papier",
        "اقرا النص", "اقرا النص امامي", "اقرا لي النص", "اقرا هذا", "اقرا هذه الورقه", "ماذا مكتوب", "ماذا مكتوب هنا", "ماذا مكتوب على هذه الورقه", "ماذا مكتوب علي هذه الورقه", "اخبرني ماذا مكتوب", "اخبرني ماذا مكتوب على هذه الورقه", "اخبرني ماذا مكتوب علي هذه الورقه")

    private val yes = any("yes", "yeah", "yep", "sure", "ok", "okay", "i agree", "i do", "agreed", "of course", "yes please", "oui", "ouais", "d accord", "j accepte", "bien sur", "oui bien sur", "oui je suis d accord", "نعم", "ايوه", "اجل", "موافق", "اوافق", "حسنا", "طبعا", "بالطبع", "نعم اوافق")
    private val no = any("no", "nope", "no thanks", "i refuse", "i do not agree", "i don t agree", "refuse", "non", "non merci", "je refuse", "pas d accord", "لا", "لا شكرا", "ارفض", "لا اوافق", "غير موافق", "كلا")

    /** Strips the wake phrase. Returns the remainder, or "" if only the greeting was said. */
    fun stripWake(norm: String): String? {
        val m = wake.find(norm) ?: return null
        return norm.substring(m.range.last + 1).trim()
    }

    fun hasWakePhrase(raw: String): Boolean = stripWake(TextNorm.normalize(raw)) != null

    fun parse(raw: String): Command {
        var t = TextNorm.normalize(raw)
        if (t.isEmpty()) return Command.Ask(raw)
        stripWake(t)?.let { rest ->
            if (rest.isEmpty()) return Command.Greeting
            t = rest
        }
        // strip a leading "please"
        t = t.removePrefix("please ").removePrefix("s il te plait ").removePrefix("s il vous plait ").removePrefix("من فضلك ").removePrefix("لو سمحت ").trim()
        if (t.isEmpty()) return Command.Greeting

        fun yesNo(): Command? = when {
            yes.matches(t) -> Command.Yes
            no.matches(t) -> Command.No
            else -> null
        }

        // Order matters: most specific first.
        if (liveStop.containsMatchIn(t) && t.split(' ').size <= 6) return Command.LiveStop
        if (stop.matches(t)) return Command.Stop
        if (liveStart.containsMatchIn(t)) return Command.LiveStart
        if (clear.containsMatchIn(t)) return Command.ClearHistory
        if (cloudOff.containsMatchIn(t)) return Command.SetCloud(false)
        if (cloudOn.containsMatchIn(t)) return Command.SetCloud(true)
        for ((lang, re) in listOf(Lang.EN to langRe(langEn), Lang.FR to langRe(langFr), Lang.AR to langRe(langAr))) {
            if (re.matches(t)) return Command.SetLang(lang)
        }
        if (help.matches(t)) return Command.Help
        if (time.matches(t)) return Command.Time
        if (speedUp.matches(t)) return Command.SpeedUp
        if (speedDown.matches(t)) return Command.SpeedDown
        if (t.split(' ').size <= 6 && volUp.containsMatchIn(t) && (t.contains("volume") || t.contains("son") || t.contains("صوت") || t.contains("louder") || t.contains("plus fort") || t.contains("sound"))) return Command.VolumeUp
        if (t.split(' ').size <= 6 && volDown.containsMatchIn(t) && (t.contains("volume") || t.contains("son") || t.contains("صوت") || t.contains("quieter") || t.contains("moins fort") || t.contains("sound"))) return Command.VolumeDown

        if (closeCamera.matches(t)) return Command.Back
        if (openCamera.matches(t)) return Command.Open(Screen.CAMERA)
        if (openAssistant.matches(t)) return Command.Open(Screen.ASSISTANT)
        if (openFiles.matches(t)) return Command.Open(Screen.FILES)
        if (openDocs.matches(t)) return Command.Open(Screen.DOCUMENTS)
        if (openSettings.matches(t)) return Command.Open(Screen.SETTINGS)
        if (t.split(' ').size <= 5 && openPrivacy.containsMatchIn(t)) return Command.Open(Screen.PRIVACY)
        if (home.matches(t)) return Command.Open(Screen.HOME)
        if (back.matches(t)) return Command.Back
        if (close.matches(t)) return Command.Close

        if (repeatPara.containsMatchIn(t)) return Command.ReaderRepeatParagraph
        if (repeatLast.matches(t)) return Command.RepeatLast

        if (pause.containsMatchIn(t) && !t.contains("camera")) return Command.ReaderPause
        if (resume.matches(t)) return Command.ReaderResume
        gotoPage.find(t)?.let { m ->
            val n = (m.groupValues.drop(1).firstOrNull { it.isNotEmpty() })?.toIntOrNull()
            if (n != null && n > 0) return Command.ReaderGoToPage(n)
        }
        if (nextPage.containsMatchIn(t)) return Command.ReaderNextPage
        if (prevPage.containsMatchIn(t)) return Command.ReaderPrevPage
        if (nextPara.matches(t)) return Command.ReaderNextParagraph
        if (next.matches(t)) return Command.Next

        readLatest.find(t)?.let { m -> return Command.ReadLatest(docType(m.groupValues.getOrNull(1).orEmpty())) }
        readNamed.find(t)?.let { m ->
            val q = cleanQuery(m.groupValues[1])
            if (q.isNotEmpty()) return Command.ReadNamed(q)
        }
        if (readCurrent.matches(t)) return Command.ReadCurrent

        if (describe.matches(t)) return Command.Describe
        if (readView.matches(t)) return Command.ReadTextInView

        findDocs.find(t)?.let { m ->
            val body = m.groupValues[1]
            // Only a document search if a document word is present or it is an explicit "search" verb.
            val explicitSearch = t.startsWith("search") || t.startsWith("cherche") || t.startsWith("recherche") || t.startsWith("ابحث") || t.startsWith("look for")
            val hasNoun = Regex("(?:^| )$docNoun(?: |$)").containsMatchIn(body)
            if (hasNoun || (explicitSearch && !looksVisual(body))) {
                return Command.FindDocs(cleanQuery(body), docType(body))
            }
        }

        openAnyRe.find(t)?.let { m ->
            val q = cleanQuery(m.groupValues[1])
            if (q.isNotEmpty() && !looksVisual(q)) return Command.OpenAny(q)
        }

        yesNo()?.let { return it }
        return Command.Ask(raw.trim())
    }

    /**
     * Offline fallback for "find my electricity bill": a find/search verb not about something visible.
     * Used only when the AI is unreachable, so ambiguity never blocks a blind user completely.
     */
    fun looseFind(raw: String): Command.FindDocs? {
        val t = TextNorm.normalize(raw)
        val m = findDocs.find(t) ?: return null
        val body = m.groupValues[1]
        if (looksVisual(body)) return null
        return Command.FindDocs(cleanQuery(body), docType(body))
    }

    // Words that mean "look with the camera", not "search files".
    private fun looksVisual(body: String) = Regex("(?:door|chair|table|window|person|stairs|exit|porte|chaise|fenetre|personne|escalier|sortie|باب|كرسي|نافذه|شخص|درج|مخرج)").containsMatchIn(body)

    fun docType(s: String): DocType = when {
        Regex("\\bpdf").containsMatchIn(s) -> DocType.PDF
        Regex("\\b(?:docx?|word)\\b").containsMatchIn(s) -> DocType.WORD
        Regex("\\b(?:txt|text files?)\\b").containsMatchIn(s) -> DocType.TEXT
        Regex("\\brtf\\b").containsMatchIn(s) -> DocType.RTF
        Regex("\\b(?:images?|photos?|scans?|scanned|jpg|jpeg|png)\\b").containsMatchIn(s) -> DocType.IMAGE
        else -> DocType.ANY
    }

    private val fillers = setOf(
        "a", "an", "the", "my", "me", "all", "some", "any", "for", "named", "called", "name", "of", "to", "i", "downloaded",
        "document", "documents", "file", "files", "pdf", "pdfs", "doc", "docs", "docx", "word", "text", "txt", "rtf", "image", "images", "scan", "scans", "scanned",
        "le", "la", "les", "un", "une", "des", "mon", "ma", "mes", "nomme", "nommee", "appele", "appelee", "fichier", "fichiers", "de", "du", "d", "l",
        "ملف", "ملفات", "مستند", "مستندات", "وثيقه", "وثائق", "باسم", "اسمه", "اسمها", "عن", "لي", "ال", "المسمي", "المسمى", "بعنوان",
    )

    /** Keeps the meaningful words of a spoken file request ("my electricity bill" -> "electricity bill"). */
    fun cleanQuery(s: String): String =
        s.split(' ').filter { it.isNotBlank() && it !in fillers }.joinToString(" ").trim()
}
