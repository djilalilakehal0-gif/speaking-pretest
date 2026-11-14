// Speaking (text-to-speech) and listening (speech recognition).
// On the Android app the native plugins are used; in a browser the Web Speech API.

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const native = Capacitor.isNativePlatform();

// Remove Markdown and symbols that sound bad when spoken.
export function cleanForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_#`>|~]+/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Split text into sentences short enough for every TTS engine.
export function splitSentences(text, max = 220) {
  const parts = text.match(/[^.!?؟。\n…:;؛]+[.!?؟。\n…:;؛]*/g) || [text];
  const out = [];
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    while (p.length > max) {
      let cut = p.lastIndexOf(' ', max);
      if (cut < max / 2) cut = max;
      out.push(p.slice(0, cut));
      p = p.slice(cut).trim();
    }
    if (p) out.push(p);
  }
  return out;
}

// ---------- Speaking ----------

let webVoices = [];
if (!native && 'speechSynthesis' in window) {
  const load = () => (webVoices = speechSynthesis.getVoices());
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}

function pickWebVoice(locale) {
  const base = locale.slice(0, 2);
  const list = webVoices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
  return (
    list.find((v) => v.lang === locale && /google|natural|neural/i.test(v.name)) ||
    list.find((v) => v.lang === locale) ||
    list.find((v) => /google|natural|neural/i.test(v.name)) ||
    list[0] ||
    null
  );
}

function speakOne(text, locale, rate) {
  if (native) {
    return TextToSpeech.speak({ text, lang: locale, rate, pitch: 1, volume: 1, category: 'playback' }).catch(() => {});
  }
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate;
    const v = pickWebVoice(locale);
    if (v) u.voice = v;
    // Chrome sometimes never fires onend: resolve after a generous timeout as well.
    const guard = setTimeout(resolve, 2000 + text.length * 160 / rate);
    u.onend = u.onerror = () => { clearTimeout(guard); resolve(); };
    speechSynthesis.speak(u);
  });
}

// A queue of sentences, so streamed AI answers start speaking at the first sentence.
export class Speaker {
  constructor() {
    this.queue = [];
    this.running = false;
    this.generation = 0;
    this.rate = 1;
    this.onState = () => {};
    this._idleWaiters = [];
  }

  get busy() { return this.running || this.queue.length > 0; }

  enqueue(text, locale) {
    const clean = cleanForSpeech(text);
    if (!clean) return;
    for (const s of splitSentences(clean)) this.queue.push({ s, locale });
    this._run();
  }

  // Speak and wait until everything queued so far has been said.
  async say(text, locale) {
    this.enqueue(text, locale);
    await this.idle();
  }

  idle() {
    if (!this.busy) return Promise.resolve();
    return new Promise((r) => this._idleWaiters.push(r));
  }

  async _run() {
    if (this.running) return;
    this.running = true;
    this.onState(true);
    const gen = this.generation;
    while (this.queue.length && gen === this.generation) {
      const { s, locale } = this.queue.shift();
      await speakOne(s, locale, this.rate);
    }
    if (gen === this.generation) {
      this.running = false;
      this.onState(false);
      const w = this._idleWaiters.splice(0);
      w.forEach((r) => r());
    }
  }

  stop() {
    this.generation++;
    this.queue = [];
    this.running = false;
    if (native) TextToSpeech.stop().catch(() => {});
    else if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.onState(false);
    const w = this._idleWaiters.splice(0);
    w.forEach((r) => r());
  }
}

// ---------- Listening ----------

const WebRec = window.SpeechRecognition || window.webkitSpeechRecognition;

export async function recognitionAvailable() {
  if (native) {
    try { return (await SpeechRecognition.available()).available; } catch { return false; }
  }
  return !!WebRec;
}

export async function ensureMicPermission() {
  if (!native) return true;
  try {
    let p = await SpeechRecognition.checkPermissions();
    if (p.speechRecognition !== 'granted') p = await SpeechRecognition.requestPermissions();
    return p.speechRecognition === 'granted';
  } catch { return false; }
}

let webActive = null;

// Listen once. Resolves with the recognised text ('' if nothing was heard).
export function listen(locale, { onPartial } = {}) {
  if (native) {
    return SpeechRecognition.start({ language: locale, maxResults: 1, partialResults: false, popup: false })
      .then((r) => (r.matches && r.matches[0]) || '')
      .catch((e) => {
        const msg = String(e?.message || e);
        if (/permission/i.test(msg)) throw new Error('mic-denied');
        return '';
      });
  }
  if (!WebRec) return Promise.reject(new Error('no-recognition'));
  return new Promise((resolve, reject) => {
    const rec = new WebRec();
    webActive = rec;
    rec.lang = locale;
    rec.interimResults = !!onPartial;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    let finalText = '';
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onPartial?.(finalText + interim);
    };
    rec.onerror = (ev) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') reject(new Error('mic-denied'));
    };
    rec.onend = () => { webActive = null; resolve(finalText.trim()); };
    try { rec.start(); } catch (e) { reject(e); }
  });
}

export function stopListening() {
  if (native) SpeechRecognition.stop().catch(() => {});
  else if (webActive) try { webActive.stop(); } catch {}
}
