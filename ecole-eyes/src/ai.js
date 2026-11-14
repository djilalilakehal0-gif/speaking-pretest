// Everything that talks to Claude.
// The app reaches Claude either through the school's small proxy server (recommended:
// the API key stays on the server) or with a personal API key saved on the phone.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';
const BETAS = ['server-side-fallback-2026-07-01'];

/* global __PROXY_URL__, __APP_TOKEN__ */
const BUILT_IN_PROXY = typeof __PROXY_URL__ !== 'undefined' ? __PROXY_URL__ : '';
const BUILT_IN_TOKEN = typeof __APP_TOKEN__ !== 'undefined' ? __APP_TOKEN__ : '';

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key) || '';
    localStorage.setItem(key, value);
  } catch { return ''; }
}

export const aiSettings = {
  get proxyUrl() { return store('ee.proxy') || BUILT_IN_PROXY; },
  set proxyUrl(v) { store('ee.proxy', v.trim()); client = null; },
  get apiKey() { return store('ee.key'); },
  set apiKey(v) { store('ee.key', v.trim()); client = null; },
};

let client = null;

export function aiConfigured() {
  return !!(aiSettings.apiKey || aiSettings.proxyUrl);
}

function getClient() {
  if (client) return client;
  const key = aiSettings.apiKey;
  if (key) {
    client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2 });
  } else if (aiSettings.proxyUrl) {
    // The proxy adds the real key; the SDK still needs a placeholder value.
    client = new Anthropic({
      apiKey: 'proxy',
      baseURL: aiSettings.proxyUrl.replace(/\/+$/, ''),
      dangerouslyAllowBrowser: true,
      maxRetries: 2,
      defaultHeaders: BUILT_IN_TOKEN ? { 'x-app-token': BUILT_IN_TOKEN } : undefined,
    });
  } else {
    throw new Error('ai-missing');
  }
  return client;
}

const LANG_NAME = { ar: 'Modern Standard Arabic (العربية الفصحى)', fr: 'French', en: 'English' };

function systemPrompt(lang) {
  return `You are "école eyes", a warm, patient voice assistant for blind and visually impaired people, especially students.
Everything you write is read aloud by a text-to-speech voice, so:
- Never use Markdown, lists with symbols, tables, emojis, URLs or code. Write plain spoken sentences.
- Answer immediately and briefly (usually two to four sentences) unless the user asks for detail.
- Reply in ${LANG_NAME[lang]} unless the user clearly speaks another language; then reply in their language. When you reply in Arabic, always use correct Modern Standard Arabic (الفصحى), never dialect.
- Speak to the user directly and kindly. Do not mention that you are reading aloud.
- When describing what a camera sees, describe it for a blind person: the most important thing first, then position (left, right, in front, near, far) and anything useful or dangerous (steps, obstacles, cars, open doors, people). Read any visible text. If the image is dark or blurry, say so and suggest how to point the phone.`;
}

// Stream an answer. `onText` receives text pieces as they arrive. Returns the full text.
async function streamAnswer({ lang, messages, effort = 'low', maxTokens = 4000, onText, signal }) {
  const c = getClient();
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    betas: BETAS,
    fallbacks: 'default',
    system: systemPrompt(lang),
    output_config: { effort },
    messages,
  };
  const stream = c.beta.messages.stream(params, { signal });
  let full = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      full += event.delta.text;
      onText?.(event.delta.text);
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal' && !full) {
    const msg = { ar: 'عذراً، لا أستطيع المساعدة في هذا الطلب.', fr: "Désolé, je ne peux pas aider pour cette demande.", en: "Sorry, I can't help with that request." }[lang];
    onText?.(msg);
    return msg;
  }
  return full;
}

// ----- Conversation -----

const history = [];
const MAX_TURNS = 12;

export async function chat({ lang, text, image, docContext, onText, signal }) {
  const content = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } });
  let prompt = text;
  if (docContext) {
    prompt = `The user has this document open (excerpt):\n<document>\n${docContext}\n</document>\n\nUser: ${text}`;
  }
  content.push({ type: 'text', text: prompt });

  // Earlier turns are kept as plain text (images are not re-sent) to stay fast.
  const messages = [...history, { role: 'user', content }];
  const answer = await streamAnswer({ lang, messages, onText, signal });
  history.push({ role: 'user', content: (image ? '[camera photo] ' : '') + text });
  history.push({ role: 'assistant', content: answer || '…' });
  while (history.length > MAX_TURNS * 2) history.splice(0, 2);
  return answer;
}

// ----- Camera -----

const CAMERA_TASK = {
  describe: {
    ar: 'صِف لي ما يوجد أمامي الآن في هذه الصورة.',
    fr: "Décris-moi ce qu'il y a devant moi sur cette image.",
    en: 'Describe what is in front of me in this picture.',
  },
  read: {
    ar: 'اقرأ لي كل النص الظاهر في هذه الصورة كما هو، بلغته الأصلية. إن لم يوجد نص فقل ذلك.',
    fr: "Lis-moi tout le texte visible sur cette image, tel quel, dans sa langue d'origine. S'il n'y a pas de texte, dis-le.",
    en: 'Read me all the text visible in this picture exactly as written, in its original language. If there is no text, say so.',
  },
  live: {
    ar: 'هذه صورة جديدة من الكاميرا أثناء الوصف المستمر. قل في جملة واحدة قصيرة فقط ما هو مهم أو جديد أو خطر أمامي. إذا كان المشهد مثل السابق تماماً فاكتب كلمة: نفس',
    fr: "Nouvelle image pendant la description continue. Dis en une seule phrase courte ce qui est important, nouveau ou dangereux devant moi. Si la scène est identique à la précédente, écris seulement : pareil",
    en: 'New camera frame during live description. In one short sentence, say only what is important, new or dangerous in front of me. If the scene is the same as before, write only: same',
  },
};

export function describeImage({ lang, image, mode = 'describe', question, previous, onText, signal }) {
  let task = question || CAMERA_TASK[mode][lang];
  if (mode === 'live' && previous) task += `\n(Previous description: ${previous})`;
  return streamAnswer({
    lang,
    effort: 'low',
    maxTokens: mode === 'read' ? 8000 : 1500,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: task },
      ],
    }],
    onText,
    signal,
  });
}

// ----- Documents -----

export function translate({ lang, text, signal }) {
  const target = LANG_NAME[lang];
  return streamAnswer({
    lang,
    effort: 'low',
    maxTokens: 16000,
    messages: [{
      role: 'user',
      content: `Translate the following page into ${target}, faithfully and completely, keeping the meaning of scientific terms (you may give the original term once in parentheses). ${lang === 'ar' ? 'Use correct, clear فصحى with diacritics only where needed to avoid ambiguity. ' : ''}Write numbers, formulas and symbols in words so they can be read aloud. Output only the translation, no introduction.\n\n<page>\n${text}\n</page>`,
    }],
    signal,
  });
}

// Read the text from a page that is only a picture (scanned document).
export function readPageImage({ lang, image, signal }) {
  return streamAnswer({
    lang,
    effort: 'low',
    maxTokens: 16000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: 'This is a scanned page of a document. Transcribe all of its text in reading order, in its original language. Describe figures or tables briefly in one sentence each. Output only the page text.' },
      ],
    }],
    signal,
  });
}

export function summarize({ lang, text, onText, signal }) {
  return streamAnswer({
    lang,
    effort: 'medium',
    maxTokens: 6000,
    messages: [{
      role: 'user',
      content: `Summarize this document for a blind student who will listen to the summary. Start with its title and type (for a scientific article: the question studied, the method, the main results and the conclusion). Then the key ideas in clear spoken sentences. Keep it under 250 words.\n\n<document>\n${text}\n</document>`,
    }],
    onText,
    signal,
  });
}

// Fetch a scientific article from a link (Claude fetches the page itself with web fetch).
export async function fetchArticle({ lang, url, signal }) {
  const c = getClient();
  const messages = [{
    role: 'user',
    content: `Fetch this article: ${url}\nThen output only its title followed by the full main text of the article in its original language (abstract and all sections, in order), without menus, references list, ads or your own comments. Write formulas in words.`,
  }];
  // A server tool turn can pause; continue it a few times if needed.
  for (let i = 0; i < 4; i++) {
    const stream = c.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: BETAS,
      fallbacks: 'default',
      system: systemPrompt(lang),
      output_config: { effort: 'low' },
      tools: [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3 }],
      messages,
    }, { signal });
    const final = await stream.finalMessage();
    if (final.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: final.content });
      continue;
    }
    // Keep only the text written after the last fetch result (skip "I'll fetch it…").
    let lastTool = -1;
    final.content.forEach((b, idx) => { if (b.type === 'web_fetch_tool_result') lastTool = idx; });
    return final.content.slice(lastTool + 1).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  }
  return '';
}
