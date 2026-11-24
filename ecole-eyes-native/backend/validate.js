// Pure request validation for the école eyes AI proxy (unit-tested in test/validate.test.js).

export const DEFAULT_MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'];
export const MAX_BODY_BYTES = 8 * 1024 * 1024;   // a 1280px JPEG photo is ~300 KB; scanned pages up to a few MB
export const MAX_TOKENS_CAP = 2000;
export const MAX_IMAGES = 8;                      // photos + scanned pages per request
export const MAX_SYSTEM_CHARS = 20000;
const TOOL_NAME = /^[a-zA-Z0-9_-]{1,64}$/;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_FIELDS = new Set(['model', 'max_tokens', 'system', 'messages', 'tools', 'temperature']);

/** Constant-time string comparison (avoids leaking the token through timing). */
export function safeEqual(a, b) {
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/**
 * Checks the JSON body the app sends and returns a cleaned copy to forward to the provider,
 * or { error, status }. Only whitelisted fields are forwarded; the model must be on the allow-list;
 * max_tokens is capped; streaming is not allowed.
 */
export function validateBody(raw, allowedModels = DEFAULT_MODELS) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'body must be a JSON object', status: 400 };
  if (raw.stream) return { error: 'streaming is not supported', status: 400 };
  if (typeof raw.model !== 'string' || !allowedModels.includes(raw.model)) return { error: 'model not allowed', status: 400 };
  if (!Array.isArray(raw.messages) || raw.messages.length === 0 || raw.messages.length > 60) return { error: 'messages must be a non-empty array (max 60)', status: 400 };
  if (raw.tools !== undefined && (!Array.isArray(raw.tools) || raw.tools.length > 30)) return { error: 'tools must be an array (max 30)', status: 400 };
  if (raw.system !== undefined && typeof raw.system !== 'string') return { error: 'system must be a string', status: 400 };
  if (raw.system !== undefined && raw.system.length > MAX_SYSTEM_CHARS) return { error: 'system too long', status: 400 };
  if (raw.temperature !== undefined && !(typeof raw.temperature === 'number' && raw.temperature >= 0 && raw.temperature <= 1)) return { error: 'temperature must be 0..1', status: 400 };

  // Tools: only the app's own client-side tools. Server tools (web search, code execution...) carry a "type"
  // and cost money per use, so anything that is not exactly {name, description, input_schema} is refused.
  let tools;
  if (raw.tools !== undefined) {
    tools = [];
    for (const t of raw.tools) {
      if (!t || typeof t !== 'object' || Array.isArray(t)) return { error: 'invalid tool', status: 400 };
      if (Object.keys(t).some((k) => !['name', 'description', 'input_schema'].includes(k))) return { error: 'only client tools are allowed', status: 400 };
      if (typeof t.name !== 'string' || !TOOL_NAME.test(t.name)) return { error: 'invalid tool name', status: 400 };
      if (t.description !== undefined && (typeof t.description !== 'string' || t.description.length > 2000)) return { error: 'invalid tool description', status: 400 };
      if (!t.input_schema || typeof t.input_schema !== 'object' || t.input_schema.type !== 'object') return { error: 'invalid tool schema', status: 400 };
      tools.push({ name: t.name, description: t.description, input_schema: t.input_schema });
    }
  }

  // Messages: rebuilt from known fields only; images must be inline base64 (the provider never fetches URLs for us).
  const images = { n: 0 };
  const messages = [];
  for (const m of raw.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return { error: 'invalid message role', status: 400 };
    if (typeof m.content === 'string') { messages.push({ role: m.role, content: m.content }); continue; }
    if (!Array.isArray(m.content) || m.content.length === 0 || m.content.length > 40) return { error: 'invalid message content', status: 400 };
    const blocks = [];
    for (const b of m.content) {
      const c = cleanBlock(b, m.role, images, true);
      if (c.error) return { error: c.error, status: 400 };
      blocks.push(c.block);
    }
    messages.push({ role: m.role, content: blocks });
  }
  if (images.n > MAX_IMAGES) return { error: `at most ${MAX_IMAGES} images per request`, status: 400 };

  const out = { model: raw.model, messages };
  if (raw.system !== undefined) out.system = raw.system;
  if (tools) out.tools = tools;
  if (raw.temperature !== undefined) out.temperature = raw.temperature;
  const mt = Number.isInteger(raw.max_tokens) ? raw.max_tokens : 700;
  out.max_tokens = Math.min(Math.max(mt, 1), MAX_TOKENS_CAP);
  return { body: out };
}

function cleanImage(b, images) {
  const s = b.source;
  if (!s || s.type !== 'base64' || !IMAGE_TYPES.has(s.media_type) || typeof s.data !== 'string' || !s.data) return { error: 'images must be inline base64 jpeg/png/webp/gif' };
  images.n++;
  return { block: { type: 'image', source: { type: 'base64', media_type: s.media_type, data: s.data } } };
}

function cleanBlock(b, role, images, topLevel) {
  if (!b || typeof b !== 'object') return { error: 'invalid content block' };
  switch (b.type) {
    case 'text':
      return typeof b.text === 'string' ? { block: { type: 'text', text: b.text } } : { error: 'invalid text block' };
    case 'image':
      return role === 'user' ? cleanImage(b, images) : { error: 'images only in user messages' };
    case 'tool_use':
      if (!topLevel || role !== 'assistant' || typeof b.id !== 'string' || typeof b.name !== 'string' || !TOOL_NAME.test(b.name)) return { error: 'invalid tool_use block' };
      return { block: { type: 'tool_use', id: b.id, name: b.name, input: b.input && typeof b.input === 'object' ? b.input : {} } };
    case 'tool_result': {
      if (!topLevel || role !== 'user' || typeof b.tool_use_id !== 'string') return { error: 'invalid tool_result block' };
      let content;
      if (typeof b.content === 'string' || b.content === undefined) content = b.content ?? '';
      else if (Array.isArray(b.content)) {
        content = [];
        for (const p of b.content) {
          if (p?.type !== 'text' && p?.type !== 'image') return { error: 'tool_result may contain only text and images' };
          const c = cleanBlock(p, 'user', images, false);
          if (c.error) return c;
          content.push(c.block);
        }
      } else return { error: 'invalid tool_result content' };
      const out = { type: 'tool_result', tool_use_id: b.tool_use_id, content };
      if (b.is_error === true) out.is_error = true;
      return { block: out };
    }
    default:
      return { error: `content type not allowed: ${String(b.type).slice(0, 40)}` };
  }
}
