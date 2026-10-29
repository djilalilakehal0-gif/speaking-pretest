/* Student flow of the Speaking Pre-Test, drawn live. Every word is the app's own
   (www/index.html); every frame is draw(t). */
(function () {
  const { ease, typed, cue, held, glide } = HTMLDemo;
  const IMG = '../../www/img/logo.png';
  const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>';
  const NAME = 'Ahmed Ali', CODE = '9578';
  const Q1 = 'Describe your usual school day. Tell me what you do from the time you wake up until you return home.';

  const header = (label, k) => `<header class="top"><img src="${IMG}" alt="">
    <div><div class="t">Alfikr Almodi School</div><div class="s">Speaking Pre-Test</div></div>
    <div class="step">${label}</div>
    <div class="track"${k === null ? ' hidden' : ''}>${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < k ? 'done' : i === k ? 'now' : ''}"></i>`).join('')}</div></header>`;

  /* The phone, the caption and the 8× badge around the app. */
  const frame = (cap, hdr, inner) => `
    <div class="sf-bg"></div>
    <div class="sf-phone"><div class="pt">${hdr}<div class="app" data-scroll>${inner}</div></div></div>
    <div class="sf-cap" dir="rtl"><div class="sf-chip">${cap.chip}</div><h2>${cap.h}</h2><p>${cap.p}</p></div>
    <div class="sf-fast" data-fast>⏩ ×8</div>`;

  /* Stage coordinates (÷ --k) of a point inside an element. */
  function aimer($) {
    const stage = $('.sf-phone').parentElement;
    return (sel, fx = 0.55, fy = 0.6) => {
      const k = stage.getBoundingClientRect().width / 1200 || 1;
      const s = stage.getBoundingClientRect(), b = $(sel).getBoundingClientRect();
      return { x: (b.left - s.left + b.width * fx) / k, y: (b.top - s.top + b.height * fy) / k };
    };
  }
  const scrollTo = ($, y) => { $('[data-scroll]').style.transform = `translateY(${-y}px)`; };

  /* ---------- 1. name and code ---------- */
  const T1 = { SCROLL: [0.9, 1.9], NAME: [2.5, 3.5], CODE: [4.3, 5.0], GO: 6.2 };
  const s1 = {
    id: 'start', name: 'Name and code', dur: 7.6,
    html: frame(
      { chip: 'الطالب · 1', h: 'كتابة الاسم ورمز البدء', p: 'في الصفحة الرئيسية، يكتب الطالب اسمه، ثم يدخل رمز البدء المكوّن من أربعة أرقام الذي يعطيه إياه المعلم، ثم يضغط: ابدأ الاختبار.' },
      header('', null), `<main><div class="screen">${window.PT_WELCOME}
        <div class="card form lift">
          <p class="lbl">Hello, welcome. Tell me your name.</p><p class="ar mut">مرحباً بك. اكتب اسمك.</p>
          <input class="name" id="nm" placeholder="Student name / اسم الطالب" readonly>
          <p class="lbl">Start code from your teacher</p><p class="ar mut">انتظر حتى يسمح لك المعلم ويعطيك رمز البدء.</p>
          <input class="name" id="cd" placeholder="• • • •" readonly style="text-align:center;letter-spacing:10px;font-size:24px">
          <button class="btn accent" id="go">Start the test · ابدأ الاختبار</button>
        </div></div></main>`),
    draw(t, $) {
      $('.pt').classList.add('home');
      scrollTo($, 0);
      const app0 = $('[data-scroll]').getBoundingClientRect();
      const SC = ($('.form').getBoundingClientRect().top - app0.top) / (app0.width / 390 || 1) - 28;
      const nm = $('#nm'), cd = $('#cd'), go = $('#go');
      scrollTo($, SC); // measure the aims where the page rests
      const A = aimer($);
      const aName = A('#nm', 0.5, 0.5), aCode = A('#cd', 0.5, 0.5), aGo = A('#go', 0.5, 0.55);
      scrollTo($, SC * ease(t, ...T1.SCROLL));
      nm.value = typed(NAME, t, ...T1.NAME);
      cd.value = typed(CODE, t, ...T1.CODE);
      const focus = t >= 2.3 && t < T1.CODE[0] - 0.1 ? nm : t >= T1.CODE[0] - 0.1 && t < T1.GO ? cd : null;
      nm.classList.toggle('focus', focus === nm); cd.classList.toggle('focus', focus === cd);
      go.style.transform = held(t, T1.GO, 0.2) ? 'translateY(2px) scale(.985)' : '';
      return { cursor: { ...glide(t, [
        [0, 0, 640, 700], [1.9, 2.4, aName.x, aName.y], [3.7, 4.2, aCode.x, aCode.y], [5.2, 5.9, aGo.x, aGo.y],
      ], [2.4, 4.2, T1.GO]), hide: t > T1.GO + 0.9 } };
    },
  };

  /* ---------- 2. hello ---------- */
  const s2 = {
    id: 'hello', name: 'Welcome', dur: 5.2,
    html: frame(
      { chip: 'الطالب · 1', h: 'تعليمات قبل البدء', p: 'يقرأ الطالب التعليمات، ثم يضغط: متابعة. يطلب التطبيق السماح بالميكروفون مرة واحدة.' },
      header('Intro', -1), `<main><div class="screen"><div class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2>Hello, ${NAME} 👋</h2>
        <p>This is an evaluation of your speaking skills. It isn't graded, so don't worry. Listen carefully to each question. You will have time to prepare silently. When you hear <b>“Start speaking”</b>, the <b>microphone</b> 🎤 turns on by itself: answer for about one minute. Your answer is saved automatically.</p>
        <p class="ar">هذا تقييم لمهارة التحدث لديك، وليس عليه درجات فلا تقلق. استمع جيداً لكل سؤال، وسيكون لديك وقت للتحضير بصمت. عندما تسمع <b>«Start speaking»</b> يعمل <b>الميكروفون</b> 🎤 وحده، فأجب لمدة دقيقة تقريباً. تُحفظ إجابتك تلقائياً.</p>
      </div><button class="btn" id="nx">Continue · متابعة</button></div></main>`),
    draw(t, $) {
      const A = aimer($); const aNx = A('#nx', 0.5, 0.55);
      scrollTo($, 0);
      $('#nx').style.transform = held(t, 3.6, 0.2) ? 'translateY(2px) scale(.985)' : '';
      return { cursor: { ...glide(t, [[0, 0, 700, 640], [2.4, 3.2, aNx.x, aNx.y]], [3.6]), hide: t > 4.4 } };
    },
  };

  /* ---------- 3. a speaking question ---------- */
  const T3 = { LISTEN: 1.7, PREP: [1.7, 5.0], STOP: 5.0, REC: 5.8 };
  const s3 = {
    id: 'question', name: 'Speaking question', dur: 9,
    html: frame(
      { chip: 'الطالب · 4', h: 'أسئلة التحدّث الثلاثة', p: 'يستمع الطالب إلى السؤال، ثم يحضّر إجابته بصمت لمدة ثلاثين ثانية. وعندما يسمع: Start speaking، يعمل الميكروفون وحده فيتحدث لمدة دقيقة.' },
      header('Question 1/3', 0), `<main><div class="screen">
        <div class="card" style="display:flex;flex-direction:column;gap:10px"><span class="tag" style="align-self:flex-start">Question 1</span><p class="q">${Q1}</p></div>
        <div class="status" id="st"></div><div id="zone"></div></div></main>`),
    draw(t, $) {
      scrollTo($, 70 * ease(t, T3.REC, T3.REC + 0.8));
      const st = $('#st'), zone = $('#zone');
      const phase = t >= T3.REC ? 'rec' : t >= T3.STOP ? 'stop' : t >= T3.LISTEN ? 'prep' : 'listen';
      const html = {
        listen: ['🔊 Listen carefully… استمع جيداً', ''],
        prep: ['🤫 Prepare silently · حضّر إجابتك بصمت', 'ring'],
        stop: ['Stop. Get ready… توقف واستعد', ''],
        rec: ['🎤 Start speaking! · ابدأ التحدث', 'mic'],
      }[phase];
      if (st.dataset.p !== phase) {
        st.dataset.p = phase; st.innerHTML = html[0];
        zone.innerHTML = html[1] === 'ring'
          ? '<div class="ring"><svg width="150" height="150"><circle cx="75" cy="75" r="66" stroke="#dde2ea" stroke-width="12" fill="none"/><circle class="arc" cx="75" cy="75" r="66" stroke="#b8892a" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="414.7" stroke-dashoffset="0"/></svg><div class="num"></div></div>'
          : html[1] === 'mic'
            ? `<div class="micwrap"><button class="mic rec" aria-label="Record">${MIC}</button><div class="miclabel">Recording… <div class="ar mut" style="text-align:center">يتم التسجيل</div></div><div class="status rt"><span class="recdot"></span><span class="tm">0:00</span></div></div>`
            : '';
      }
      const p = ease(t, ...T3.PREP) ;
      if (phase === 'prep') {
        $('.ring .arc').style.strokeDashoffset = 414.7 * p;
        $('.ring .num').textContent = Math.max(1, Math.ceil(30 * (1 - p)));
      }
      if (phase === 'rec') {
        const sec = Math.floor((t - T3.REC) * 8);
        $('.tm').textContent = `0:${String(sec).padStart(2, '0')}`;
        $('.mic').style.setProperty('--lvl', 1 + 0.12 * Math.abs(Math.sin((t - T3.REC) * 9)));
      }
      $('[data-fast]').style.opacity = phase === 'prep' || phase === 'rec' ? 1 : 0;
      return {};
    },
  };

  /* ---------- 4. the end ---------- */
  const T4 = { SCROLL: [1.6, 2.6], CLICK: 4.6, SENT: 6.2 };
  const item = (n, s) => `<div class="item"><div class="h">Question ${n}<small>${s} s</small></div>
    <div class="sf-audio"><i></i><b></b><span>0:${s}</span></div><button class="btn small ghost" tabindex="-1">📤 Share</button></div>`;
  const s4 = {
    id: 'end', name: 'Done', dur: 8,
    html: frame(
      { chip: 'الطالب · 9', h: 'نهاية الاختبار', p: 'في النهاية، تظهر رسالة: أحسنت، وتُرسل الإجابات تلقائياً إلى المعلم. وإذا لم يكن هناك إنترنت، تُحفظ على الهاتف وتُرسل لاحقاً.' },
      header('Done', 6), `<main><div class="screen">
        <section class="donehero"><div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
          <h1>Well done, ${NAME}!</h1><p>That was all. Thank you for your participation.</p><p class="ar" style="text-align:center">انتهى الاختبار. شكراً لمشاركتك، أحسنت.</p></section>
        <div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px"><h2>Your saved answers</h2><span class="ar mut">إجاباتك المحفوظة</span></div>
          <div class="list">${item(1, 58)}${item(2, 55)}${item(3, 41)}</div></div>
        <button class="btn" id="shAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>Share all (WhatsApp…) · مشاركة الكل</button>
        <div class="sendst" id="sendst"></div>
        <button class="btn ghost">New student · طالب جديد</button></div></main>`),
    draw(t, $) {
      const app = $('[data-scroll]'); const SC = Math.max(0, app.scrollHeight - 700);
      scrollTo($, SC);
      const aSh = aimer($)('#shAll', 0.5, 0.55);
      const aSend = aimer($)('#sendst', 0.5, 0.5);
      scrollTo($, SC * ease(t, ...T4.SCROLL));
      const ok = t >= 0.5 ? 1 : 0;
      const sendst = $('#sendst');
      sendst.className = t >= T4.SENT ? 'sendst ok' : 'sendst';
      sendst.textContent = t < T4.CLICK + 0.3 ? '' : t >= T4.SENT ? '✓ Sent to the teacher · وصلت إجاباتك إلى المعلّم' : '📡 Sending your answers to the teacher… · جارٍ إرسال إجاباتك إلى المعلّم';
      sendst.style.display = t < T4.CLICK + 0.3 ? 'none' : '';
      $('.donehero .ok').style.transform = `scale(${0.6 + 0.4 * ease(t, 0, 0.7)})`;
      $('#shAll').style.transform = held(t, T4.CLICK, 0.2) ? 'translateY(2px) scale(.985)' : '';
      $('[data-fast]').style.opacity = 0;
      return { cursor: { ...glide(t, [[0, 0, 700, 600], [3.0, 3.9, aSh.x, aSh.y], [5.3, 5.9, aSend.x + 160, aSend.y + 20]], [T4.CLICK]), hide: t > 6.6 } };
    },
  };

  window.STUDENT_STEPS = [s1, s2, s3, s4];
})();
