// école eyes — main controller: voice loop, sections, commands.

import { LANGS, T } from './i18n.js';
import { Speaker, listen, stopListening, recognitionAvailable, ensureMicPermission, splitSentences } from './speech.js';
import { aiConfigured, aiSettings, chat, describeImage, translate, readPageImage, summarize, fetchArticle } from './ai.js';
import { openFile, docFromText, detectLang } from './docs.js';
import { startCamera, stopCamera, cameraOn, snapshot } from './camera.js';
import { parseCommand } from './commands.js';

const $ = (s) => document.querySelector(s);

function pref(key, def) {
  try { const v = localStorage.getItem(key); return v === null ? def : v; } catch { return def; }
}
function setPref(key, v) { try { localStorage.setItem(key, v); } catch {} }

const state = {
  lang: pref('ee.lang', 'ar'),        // interface + conversation language
  readLang: pref('ee.readLang', 'ar'), // language documents are read in
  section: 'chat',
  autoListen: pref('ee.auto', '1') === '1',
  phase: 'idle', // idle | listening | thinking | speaking
  abort: null,
  pickArmed: false,
  doc: null,
  docPage: 0,
  reading: false,
  readGen: 0,
  pageCache: new Map(), // `${page}|${lang}` -> promise of text to speak
  lastAnswer: '',
  live: null,
  liveLast: '',
};

const speaker = new Speaker();
speaker.rate = parseFloat(pref('ee.rate', '1')) || 1;
speaker.onState = (on) => { if (on) setPhase('speaking'); else if (state.phase === 'speaking') setPhase('idle'); };

const t = () => T[state.lang];
const loc = (l = state.lang) => LANGS[l].speech;

// ---------- UI ----------

function setPhase(p) {
  state.phase = p;
  const btn = $('#talk');
  btn.dataset.phase = p;
  const label = { idle: t().tapToSpeak, listening: t().listening, thinking: t().thinking, speaking: t().speaking }[p];
  $('#talk-label').textContent = label;
  btn.setAttribute('aria-label', label);
}

function status(msg) { $('#status').textContent = msg; }

function log(who, text) {
  const box = $('#log');
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  const b = document.createElement('b');
  b.textContent = who === 'user' ? t().you : t().app;
  const p = document.createElement('p');
  p.textContent = text;
  div.append(b, p);
  box.append(div);
  while (box.children.length > 40) box.firstChild.remove();
  box.scrollTop = box.scrollHeight;
  return p;
}

function applyLang() {
  const L = LANGS[state.lang];
  document.documentElement.lang = state.lang;
  document.documentElement.dir = L.dir;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t]; });
  document.querySelectorAll('[data-tp]').forEach((el) => { el.placeholder = t()[el.dataset.tp]; });
  document.querySelectorAll('[data-tl]').forEach((el) => { el.setAttribute('aria-label', t()[el.dataset.tl]); });
  document.querySelectorAll('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
  document.querySelectorAll('.read-lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rl === state.readLang)));
  setPhase(state.phase);
  status(t().idle);
}

function showSection(name, { announce = false } = {}) {
  state.section = name;
  document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.section === name)));
  document.querySelectorAll('.section').forEach((s) => (s.hidden = s.id !== 'sec-' + name));
  if (name !== 'camera') closeCamera(false);
  if (announce) say(t()[{ chat: 'tabChat', docs: 'tabDocs', camera: 'tabCamera' }[name]]);
}

// ---------- speaking helpers ----------

function say(text, lang = state.lang) {
  log('app', text);
  return speaker.say(text, loc(lang));
}

function stopAll() {
  state.abort?.abort();
  state.abort = null;
  speaker.stop();
  stopListening();
  state.reading = false;
  state.readGen++;
}

// Stream an AI answer into the log and the speaker, sentence by sentence.
async function speakStream(run, lang = state.lang) {
  const ctrl = new AbortController();
  state.abort = ctrl;
  setPhase('thinking');
  const p = log('app', '…');
  let buf = '';
  let shown = '';
  const flush = (all) => {
    const parts = splitSentences(buf, 400);
    const keep = all ? 0 : 1; // keep the last (maybe unfinished) sentence
    while (parts.length > keep) {
      const s = parts.shift();
      speaker.enqueue(s, loc(lang));
    }
    buf = parts.join(' ');
  };
  try {
    const full = await run(ctrl.signal, (piece) => {
      shown += piece;
      p.textContent = shown;
      buf += piece;
      if (/[.!?؟…\n:؛]\s*$/.test(buf) || buf.length > 260) flush(false);
    });
    flush(true);
    if (!shown) p.textContent = full || '';
    state.lastAnswer = full || shown;
    await speaker.idle();
    return full;
  } catch (e) {
    if (ctrl.signal.aborted) return '';
    console.error(e);
    p.textContent = '';
    await say(String(e?.message) === 'ai-missing' ? t().aiMissing : t().aiError);
    return '';
  } finally {
    if (state.abort === ctrl) state.abort = null;
    if (state.phase === 'thinking') setPhase('idle');
  }
}

// ---------- the big button ----------

async function onTalk() {
  // A pending "choose a file" request uses this tap (browsers need a real tap to open files).
  if (state.pickArmed) {
    state.pickArmed = false;
    $('#file').click();
    return;
  }
  if (state.phase === 'listening') { stopListening(); return; }
  if (state.phase === 'speaking' || state.phase === 'thinking' || state.reading || state.abort) stopAll();
  await listenOnce();
}

async function listenOnce() {
  if (!(await recognitionAvailable())) { await say(t().noRecognition); return; }
  if (!(await ensureMicPermission())) { await say(t().micDenied); return; }
  setPhase('listening');
  status(t().listening);
  navigator.vibrate?.(40);
  let text = '';
  try {
    text = await listen(loc(), { onPartial: (s) => status(s) });
  } catch (e) {
    setPhase('idle');
    await say(String(e?.message) === 'mic-denied' ? t().micDenied : t().noRecognition);
    return;
  }
  setPhase('idle');
  status(t().idle);
  if (!text) { await say(t().noSpeech); return; }
  log('user', text);
  await handle(text);
}

// ---------- understanding what was said ----------

async function handle(text) {
  const c = parseCommand(text);
  let keepListening = true;
  switch (c?.cmd) {
    case 'help': await say(t().help); break;
    case 'lang-ar': case 'lang-fr': case 'lang-en': {
      const l = c.cmd.slice(5);
      setLang(l);
      if (state.section === 'docs') setReadLang(l);
      await say(T[l].welcome.split(/[.!]/)[0] + '.');
      break;
    }
    case 'camera-open': await openCamera(); break;
    case 'camera-describe': await cameraLook('describe'); break;
    case 'camera-read': await cameraLook('read'); break;
    case 'camera-live': await toggleLive(true); keepListening = false; break;
    case 'camera-live-off': await toggleLive(false); break;
    case 'camera-close': closeCamera(true); showSection('chat'); break;
    case 'doc-open': await askForFile(); keepListening = false; break;
    case 'summarize': await summarizeDoc(); break;
    case 'next': await gotoPage(state.docPage + 1); keepListening = false; break;
    case 'prev': await gotoPage(state.docPage - 1); keepListening = false; break;
    case 'goto-page': await gotoPage(c.page - 1); keepListening = false; break;
    case 'resume': await resumeReading(); keepListening = false; break;
    case 'stop':
      if (state.doc) await say(t().paused);
      keepListening = false;
      break;
    case 'repeat': if (state.lastAnswer) await say(state.lastAnswer); break;
    case 'goto-chat': showSection('chat', { announce: true }); break;
    case 'goto-settings': openSettings(); keepListening = false; break;
    default: await ask(text);
  }
  if (keepListening && state.autoListen && state.phase === 'idle' && !state.reading && !state.live) {
    await listenOnce();
  }
}

async function ask(text) {
  // In the camera section, questions are about what the camera sees.
  if (state.section === 'camera' && cameraOn()) {
    const img = snapshot($('#video'));
    if (img) {
      await speakStream((signal, onText) => chat({ lang: state.lang, text, image: img, onText, signal }));
      return;
    }
  }
  let docContext = null;
  if (state.section === 'docs' && state.doc) {
    docContext = await state.doc.sample(40000);
  }
  await speakStream((signal, onText) => chat({ lang: state.lang, text, docContext, onText, signal }));
}

function setLang(l) {
  state.lang = l;
  setPref('ee.lang', l);
  applyLang();
}

function setReadLang(l) {
  state.readLang = l;
  setPref('ee.readLang', l);
  state.pageCache.clear();
  applyLang();
}

// ---------- camera ----------

async function openCamera() {
  showSection('camera');
  status(t().camOpening);
  log('app', t().camOpening);
  try {
    await startCamera($('#video'));
  } catch (e) {
    console.error(e);
    await say(t().camDenied);
    return;
  }
  $('#cam-placeholder').hidden = true;
  await cameraLook('describe');
}

function closeCamera(announce) {
  if (state.live) toggleLive(false, true);
  if (!cameraOn()) return;
  stopCamera($('#video'));
  $('#cam-placeholder').hidden = false;
  if (announce) say(t().camClosed);
}

async function cameraLook(mode) {
  if (!cameraOn()) {
    showSection('camera');
    try { await startCamera($('#video')); $('#cam-placeholder').hidden = true; }
    catch { await say(t().camDenied); return; }
  }
  const img = snapshot($('#video'));
  if (!img) { await say(t().camDenied); return; }
  navigator.vibrate?.([30, 60, 30]);
  status(t().camLooking);
  await speakStream((signal, onText) => describeImage({ lang: state.lang, image: img, mode, onText, signal }));
  status(t().idle);
}

async function toggleLive(on, silent = false) {
  const btn = $('#cam-live');
  if (!on) {
    if (state.live) clearTimeout(state.live);
    state.live = null;
    btn.setAttribute('aria-pressed', 'false');
    if (!silent) await say(t().camLiveOff);
    return;
  }
  if (!cameraOn()) await openCamera();
  if (!cameraOn()) return;
  btn.setAttribute('aria-pressed', 'true');
  state.liveLast = '';
  await say(t().camLiveOn);
  const tick = async () => {
    if (!state.live || !cameraOn()) return;
    if (state.phase === 'idle') {
      const img = snapshot($('#video'), 960);
      if (img) {
        try {
          const ctrl = new AbortController();
          state.abort = ctrl;
          const text = (await describeImage({ lang: state.lang, image: img, mode: 'live', previous: state.liveLast, signal: ctrl.signal })).trim();
          if (state.abort === ctrl) state.abort = null;
          if (state.live && text && !/^(نفس|same|pareil)\b/i.test(text)) {
            state.liveLast = text;
            await say(text);
          }
        } catch (e) { console.error(e); }
      }
    }
    if (state.live) state.live = setTimeout(tick, 2500);
  };
  state.live = setTimeout(tick, 300);
}

// ---------- documents ----------

async function askForFile() {
  showSection('docs');
  state.pickArmed = true;
  await say(t().pickFileNow);
}

async function loadFile(file) {
  stopAll();
  status(t().loadingDoc);
  try {
    state.doc = await openFile(file);
  } catch (e) {
    console.error(e);
    await say(t().docUnsupported);
    return;
  }
  await startDoc();
}

async function startDoc() {
  const d = state.doc;
  state.docPage = 0;
  state.pageCache.clear();
  $('#doc-info').hidden = false;
  $('#doc-name').textContent = d.name;
  updatePageLabel();
  if (!d.count) { await say(t().docEmpty); return; }
  await say(t().docLoaded(d.name, d.count));
  readFrom(0);
}

function updatePageLabel() {
  if (!state.doc) return;
  $('#doc-page').textContent = t().page(state.docPage + 1, state.doc.count);
}

// Text of a page, in the reading language (extracting, OCR and translating as needed).
function pageSpeech(i, lang) {
  const key = `${i}|${lang}`;
  if (state.pageCache.has(key)) return state.pageCache.get(key);
  const p = (async () => {
    const d = state.doc;
    let text = await d.rawPageText(i);
    if (d.pdf && text.replace(/\s/g, '').length < 25) {
      status(t().ocr);
      text = (await readPageImage({ lang, image: await d.pageImage(i) })).trim();
      d.pages[i] = text;
    }
    if (!text) return '';
    if (detectLang(text) !== lang) {
      status(t().translating);
      text = (await translate({ lang, text })).trim();
    }
    return text;
  })();
  p.catch(() => state.pageCache.delete(key));
  state.pageCache.set(key, p);
  return p;
}

async function readFrom(i) {
  const d = state.doc;
  if (!d) { await say(t().docNone); return; }
  stopAll();
  const gen = state.readGen;
  state.reading = true;
  const lang = state.readLang;
  for (let page = i; page < d.count; page++) {
    if (gen !== state.readGen) return;
    state.docPage = page;
    updatePageLabel();
    setPhase('thinking');
    let text;
    try { text = await pageSpeech(page, lang); }
    catch (e) {
      console.error(e);
      if (gen === state.readGen) { state.reading = false; setPhase('idle'); await say(String(e?.message) === 'ai-missing' ? t().aiMissing : t().aiError); }
      return;
    }
    if (gen !== state.readGen) return;
    if (page + 1 < d.count) pageSpeech(page + 1, lang).catch(() => {}); // prepare the next page while reading
    $('#doc-text').textContent = text;
    $('#doc-text').dir = LANGS[lang].dir;
    status(t().page(page + 1, d.count));
    speaker.enqueue(T[lang].page(page + 1, d.count) + '.', loc(lang));
    if (text) speaker.enqueue(text, loc(lang));
    await speaker.idle();
  }
  if (gen === state.readGen) {
    state.reading = false;
    await say(T[lang].docEnd, lang);
  }
}

async function resumeReading() {
  if (!state.doc) { await say(t().docNone); return; }
  showSection('docs');
  readFrom(state.docPage);
}

async function gotoPage(i) {
  if (!state.doc) { await say(t().docNone); return; }
  showSection('docs');
  readFrom(Math.max(0, Math.min(state.doc.count - 1, i)));
}

async function summarizeDoc() {
  if (!state.doc) { await say(t().docNone); return; }
  stopAll();
  const sample = await state.doc.sample(120000);
  await speakStream((signal, onText) => summarize({ lang: state.readLang, text: sample, onText, signal }), state.readLang);
}

async function openArticle(url) {
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  stopAll();
  await say(t().fetchingArticle);
  setPhase('thinking');
  try {
    const ctrl = new AbortController();
    state.abort = ctrl;
    const text = await fetchArticle({ lang: state.lang, url, signal: ctrl.signal });
    setPhase('idle');
    if (!text) { await say(t().docEmpty); return; }
    let host = url;
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch {}
    state.doc = docFromText(text.split('\n')[0].slice(0, 80) || host, text);
    await startDoc();
  } catch (e) {
    console.error(e);
    setPhase('idle');
    if (!state.abort?.signal.aborted) await say(String(e?.message) === 'ai-missing' ? t().aiMissing : t().aiError);
  }
}

// ---------- settings ----------

function openSettings() {
  $('#set-proxy').value = aiSettings.proxyUrl;
  $('#set-key').value = aiSettings.apiKey;
  $('#set-auto').checked = state.autoListen;
  $('#set-rate').value = String(speaker.rate);
  $('#settings').showModal();
}

function saveSettings(e) {
  e.preventDefault();
  aiSettings.proxyUrl = $('#set-proxy').value;
  aiSettings.apiKey = $('#set-key').value;
  state.autoListen = $('#set-auto').checked;
  setPref('ee.auto', state.autoListen ? '1' : '0');
  speaker.rate = parseFloat($('#set-rate').value) || 1;
  setPref('ee.rate', String(speaker.rate));
  $('#settings').close();
  say(t().saved);
}

// ---------- start ----------

function bind() {
  $('#talk').addEventListener('click', onTalk);
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
    stopAll();
    const s = b.dataset.section;
    if (s === 'camera') openCamera();
    else showSection(s, { announce: true });
  }));
  document.querySelectorAll('.lang-switch button').forEach((b) => b.addEventListener('click', () => {
    stopAll();
    setLang(b.dataset.lang);
    say(t().welcome.split(/[.!]/)[0] + '.');
  }));
  document.querySelectorAll('.read-lang button').forEach((b) => b.addEventListener('click', () => {
    setReadLang(b.dataset.rl);
    say(LANGS[b.dataset.rl].name, b.dataset.rl);
    if (state.reading) readFrom(state.docPage);
  }));
  $('#pick').addEventListener('click', () => { state.pickArmed = false; $('#file').click(); });
  $('#file').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) loadFile(f);
  });
  $('#article-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = $('#article-url').value.trim();
    if (url) openArticle(url);
  });
  $('#doc-play').addEventListener('click', () => (state.reading ? (stopAll(), say(t().paused)) : resumeReading()));
  $('#doc-prev').addEventListener('click', () => gotoPage(state.docPage - 1));
  $('#doc-next').addEventListener('click', () => gotoPage(state.docPage + 1));
  $('#doc-sum').addEventListener('click', summarizeDoc);
  $('#cam-describe').addEventListener('click', () => { stopAll(); cameraLook('describe'); });
  $('#cam-read').addEventListener('click', () => { stopAll(); cameraLook('read'); });
  $('#cam-live').addEventListener('click', () => { stopAll(); toggleLive(!state.live); });
  $('#open-settings').addEventListener('click', openSettings);
  $('#settings-form').addEventListener('submit', saveSettings);
  $('#settings-close').addEventListener('click', () => $('#settings').close());
  // Volume-key-free shortcut for keyboards and Bluetooth remotes: Space / Enter talks.
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, dialog, button')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onTalk(); }
  });
}

bind();
applyLang();
showSection('chat');
if (!aiConfigured()) status(t().aiMissing);

// Greet. Browsers may refuse to speak before the first tap; the Android app speaks at once.
setTimeout(() => {
  say(aiConfigured() ? t().welcome : t().welcome + ' ' + t().aiMissing);
}, 500);

if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor?.isNativePlatform?.()) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
