// Recognising spoken commands in Arabic, French and English.
// Anything that is not a command is sent to the AI as a question.

const RULES = [
  ['help', /(مساعدة|ساعدني كيف|ماذا (يمكنني|أستطيع) أن أقول|الأوامر|\baide\b|que puis-je dire|commandes|\bhelp\b|what can i say|commands)/i],
  ['lang-ar', /(تكلم|تحدث|اقرأ) ?(معي )?(بال)?عربي|^بالعربي(ة)?$|parle(z)? (en )?arabe|speak arabic|in arabic|arabic please/i],
  ['lang-fr', /(تكلم|تحدث|اقرأ) ?بالفرنسي(ة)?|بالفرنسية|parle(z)? (en )?français|en français|speak french|in french/i],
  ['lang-en', /(تكلم|تحدث|اقرأ) ?بالإنجليزي(ة)?|بالانجليزي(ة)?|بالإنكليزي(ة)?|parle(z)? (en )?anglais|en anglais|speak english|in english/i],
  ['camera-close', /(أغلق|اغلق|سكّر|سكر|أطفئ|اطفئ) ?(ال)?كاميرا|ferme(r|z)? (la )?caméra|close (the )?camera|turn off (the )?camera|camera off/i],
  ['camera-live-off', /(أوقف|اوقف) (ال)?وصف (ال)?مستمر|arrête (la )?description|stop (the )?live|live off/i],
  ['camera-live', /(ال)?وصف (ال)?مستمر|description continue|live (description|mode)/i],
  ['camera-read', /(اقرأ|اقرا|إقرأ) (لي )?(ال)?(نص|مكتوب|ورقة|لافتة|ما هو مكتوب)|ماذا (هو )?مكتوب|lis(-moi)? (le )?(texte|ce qui est écrit)|qu'est-ce qui est écrit|read (me )?(the )?(text|sign|label|what is written)|what does it say/i],
  ['camera-open', /(افتح|إفتح|شغل|شغّل) ?(لي )?(ال)?كاميرا|^(ال)?كاميرا$|ouvre(r|z)? (la )?caméra|^caméra$|open (the )?camera|turn on (the )?camera|^camera$/i],
  ['camera-describe', /(ماذا|ما الذي|شو|واش) (يوجد |هناك |كاين )?(أمامي|امامي|قدامي|قدّامي)|صف (لي )?(ما )?(أمامي|امامي|المكان|الصورة)|qu'est-ce qu'il y a devant moi|qu'y a-t-il devant moi|décris(-moi)? ce qu|what('s| is) in front of me|describe what/i],
  ['doc-open', /(اقرأ|اقرا|إقرأ|افتح|إفتح) (لي )?(ملف |مستند |وثيقة |كتاب |مقال )?(ال)?(pdf|بي دي اف|بي دي إف|بيدياف|ب د ف|وورد|word|ملف|مستند|وثيقة|كتاب|مقال)|lis(-moi)? (un |le |ce )?(pdf|word|document|fichier|livre|article)|ouvre (un |le )?(pdf|word|document|fichier)|read (me )?(a |the )?(pdf|word|document|file|book|article)|open (a |the )?(pdf|word|document|file)/i],
  ['summarize', /(لخص|لخّص|ملخص|تلخيص)|^résume|résumé|summari[sz]e|summary/i],
  ['next', /الصفحة (التالية|الموالية)|^(التالية|الموالية)$|صفحة تالية|page suivante|^suivante?$|next page|^next$/i],
  ['prev', /الصفحة (السابقة|الماضية)|^(السابقة)$|page précédente|^précédente$|previous page|^previous$|go back a page/i],
  ['repeat', /^(أعد|اعد|كرر|كرّر|عاود)( ذلك| مرة أخرى| من فضلك)?$|^répète|^encore une fois$|^repeat|^say (it|that) again/i],
  ['resume', /^(تابع|واصل|أكمل|اكمل|استمر|كمل|كمّل)( القراءة)?$|^(continue|continuez|reprends|reprendre)$|^(continue|resume|go on|keep reading)$/i],
  ['stop', /^(توقف|قف|اسكت|أسكت|كفى|بركا|ستوب|وقف)$|^(stop|arrête|arrête-toi|tais-toi|pause|silence)$|^(stop|pause|be quiet|quiet|enough)$/i],
  ['goto-chat', /^((افتح|اذهب إلى) )?(ال)?محادثة$|^(la )?conversation$|^chat$/i],
  ['goto-settings', /^((افتح|اذهب إلى) )?(ال)?(إعدادات|اعدادات)$|^(ouvre )?(les )?(réglages|paramètres)$|^(open )?settings$/i],
];

export function parseCommand(text) {
  const t = text.trim().replace(/[.!?؟،,]+$/g, '');
  if (t.length > 80) return null; // long sentences are questions, not commands
  // Page number: "الصفحة 5", "page 5"
  const m = t.match(/(?:الصفحة|صفحة|page)\s*(?:رقم\s*|numéro\s*|number\s*)?(\d+)/i);
  if (m) return { cmd: 'goto-page', page: parseInt(m[1], 10) };
  for (const [cmd, re] of RULES) if (re.test(t)) return { cmd };
  return null;
}
