// Pure request validation for the école eyes AI proxy (unit-tested in test/validate.test.js).

export const DEFAULT_MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'];
export const MAX_BODY_BYTES = 8 * 1024 * 1024;   // a 1280px JPEG photo is ~300 KB; scanned pages up to a few MB
export const MAX_TOKENS_CAP = 2000;
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
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (ALLOWED_FIELDS.has(k)) out[k] = v;
  const mt = Number.isInteger(out.max_tokens) ? out.max_tokens : 700;
  out.max_tokens = Math.min(Math.max(mt, 1), MAX_TOKENS_CAP);
  return { body: out };
}
