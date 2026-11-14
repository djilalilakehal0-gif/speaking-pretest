# école eyes — مساعد ذكي بالصوت للمكفوفين

تطبيق أندرويد (وموقع ويب) يتحدّث معه المكفوف بالصوت فقط، ويجيبه الذكاء الاصطناعي (Claude) فوراً بصوت مسموع.
يدعم ثلاث لغات: **العربية الفصحى، الفرنسية، الإنجليزية**.

## ماذا يفعل التطبيق؟

| الخانة | ما يحدث |
|---|---|
| **المحادثة** | يضغط المكفوف على الزر الأصفر الكبير (نصف الشاشة) ويتكلّم، فيجيبه الذكاء الاصطناعي بالصوت مباشرة، جملةً بجملة أثناء وصول الجواب. بعد الجواب يستمع التطبيق تلقائياً للسؤال التالي. |
| **المستندات** | PDF و Word (.docx) والملفات النصية والمقالات العلمية (من ملف أو من رابط). يقرأها بلغة القراءة المختارة: **العربية الفصحى** (افتراضياً) أو الفرنسية أو الإنجليزية. إذا كان المستند بلغة أخرى يُترجم صفحةً بصفحة قبل قراءته. الصفحات المصوّرة (Scan) يقرأ الذكاء الاصطناعي النص منها. يمكن التلخيص وطرح أسئلة عن المستند. |
| **الكاميرا** | عند قول «افتح الكاميرا» تُفتح الكاميرا الخلفية **مباشرة** ويصف التطبيق كل ما أمامها. ثم يستطيع المكفوف أن يسأل عمّا يراه («ما لون هذا القميص؟»)، أو يطلب قراءة النص، أو يشغّل **الوصف المستمر** الذي يخبره بكل تغيير وبالعوائق والأخطار. |

### الأوامر الصوتية (بأي لغة من الثلاث)

| العربية | Français | English |
|---|---|---|
| افتح الكاميرا / أغلق الكاميرا | ouvre la caméra / ferme la caméra | open the camera / close the camera |
| ماذا أمامي؟ | qu'est-ce qu'il y a devant moi ? | what is in front of me? |
| اقرأ النص | lis le texte | read the text |
| الوصف المستمر / أوقف الوصف المستمر | description continue / arrête la description | live description / stop live |
| اقرأ لي PDF / اقرأ لي ملف وورد | lis-moi un PDF | read me a PDF |
| توقف · تابع · أعد | stop · continue · répète | stop · continue · repeat |
| الصفحة التالية · السابقة · الصفحة 5 | page suivante · précédente · page 5 | next page · previous page · page 5 |
| لخّص المستند | résume le document | summarize the document |
| تكلّم بالفرنسية / بالإنجليزية | parle en arabe / en anglais | speak Arabic / French |
| مساعدة | aide | help |

أي جملة أخرى تُرسَل كسؤال إلى الذكاء الاصطناعي. بعد «اقرأ لي PDF» يكفي الضغط مرة على الزر الكبير لفتح قائمة الملفات (أندرويد يشترط لمسة لفتح الملفات).

## التجهيز (مرة واحدة)

### 1) خادم الذكاء الاصطناعي (يحمي المفتاح)

مفتاح Anthropic **لا يوضع داخل التطبيق** لأن المستودع عام. بدلاً من ذلك يوجد خادم صغير مجاني على Cloudflare في المجلد `worker/`:

```bash
cd ecole-eyes/worker
npx wrangler login
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY      # الصق مفتاح Anthropic
npx wrangler secret put APP_TOKEN              # اختياري: كلمة سر يرسلها التطبيق
```

يعطيك الأمر رابطاً مثل `https://ecole-eyes-proxy.<اسمك>.workers.dev`.

### 2) إعدادات GitHub

Settings → Secrets and variables → Actions:
- **Variables** → `ECOLE_EYES_PROXY_URL` ← رابط الخادم.
- **Secrets** → `ECOLE_EYES_APP_TOKEN` ← نفس قيمة `APP_TOKEN` (إن وضعتها).

### 3) البناء

- **أندرويد:** Actions ← **Build école eyes Android APK** ← Run workflow. يظهر الملف `EcoleEyes.apk` في Releases تحت الإصدار `ecole-eyes-1.N`.
- **الويب (آيفون وكمبيوتر):** يُنشر تلقائياً مع الموقع على
  `https://djilalilakehal0-gif.github.io/speaking-pretest/ecole-eyes/` (يحتاج Chrome أو Safari).

**بدون خادم:** يمكن لمرافق مبصر أن يفتح ⚙️ الإعدادات داخل التطبيق ويضع رابط خادم أو مفتاح Anthropic شخصي (يُحفظ في الهاتف فقط).

### على الهاتف

1. ثبّت `EcoleEyes.apk` واسمح بـ **الميكروفون** و**الكاميرا**.
2. للصوت العربي: الإعدادات ← إدارة عامة ← تحويل النص إلى كلام ← محرك Google ← ثبّت بيانات صوت **العربية** (وكذلك الفرنسية والإنجليزية).
3. يعمل مع TalkBack: كل الأزرار لها أسماء مقروءة، والزر الكبير يُفعَّل بالنقر المزدوج.

## للمطوّر

```bash
cd ecole-eyes
npm install
ECOLE_EYES_PROXY_URL=https://… npm run dev    # http://localhost:8080
npm run build                                 # يبني www/ (يستعمله Capacitor والموقع)
```

| الملف | الوظيفة |
|---|---|
| `src/main.js` | حلقة الصوت، الخانات الثلاث، تنفيذ الأوامر |
| `src/ai.js` | الاتصال بـ Claude (`claude-opus-5-5`، بث مباشر للجواب، وصف الصور، الترجمة، التلخيص، جلب المقالات) |
| `src/speech.js` | النطق والتعرّف على الكلام (إضافات أندرويد الأصلية، أو Web Speech في المتصفح) |
| `src/docs.js` | فتح PDF (pdf.js) و Word (mammoth) وتقسيمها إلى صفحات |
| `src/camera.js` | الكاميرا الخلفية والتقاط الصور |
| `src/commands.js` | فهم الأوامر الصوتية بالعربية والفرنسية والإنجليزية |
| `src/i18n.js` | نصوص الواجهة باللغات الثلاث |
| `worker/` | خادم Cloudflare الذي يضيف مفتاح API |

ملاحظات: يُطلب من Claude قيمة `fallbacks: "default"` (تحويل تلقائي لنموذج آخر إذا رُفض الطلب)، وجهد منخفض (`effort: low`) لسرعة الرد. الصور ترسل مرة واحدة ولا تُخزَّن.
