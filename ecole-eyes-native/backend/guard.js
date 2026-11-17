// Daily spending cap and alerts for the école eyes proxy (unit-tested in test/guard.test.js).
//
//   USAGE                  (KV binding, optional) counters; without it the daily cap and alert de-duplication are off
//   DAILY_REQUEST_LIMIT    (var) max AI requests per UTC day for the whole service (the spending cap)
//   DAILY_IP_LIMIT         (var) max AI requests per UTC day per IP
//   ALERT_WEBHOOK_URL      (secret) https webhook: Slack/Discord incoming webhook, or any endpoint accepting JSON
//
// KV is eventually consistent, so counts are approximate (a burst can overshoot by a few requests). That is fine for a
// budget guard; the provider's own monthly spending limit remains the hard stop.

export const day = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };

/**
 * Checks the daily caps. Returns { ok: true, commit } where commit() records the request, or { ok: false, scope }.
 * Only successful-looking requests should be committed (the caller decides).
 */
export async function checkQuota(env, ipHash, now = Date.now()) {
  const kv = env.USAGE;
  const total = num(env.DAILY_REQUEST_LIMIT);
  const perIp = num(env.DAILY_IP_LIMIT);
  if (!kv || (!total && !perIp)) return { ok: true, commit: async () => null };
  const d = day(now);
  const gKey = `g:${d}`;
  const iKey = `i:${d}:${ipHash}`;
  let g = 0, i = 0;
  try {
    [g, i] = (await Promise.all([total ? kv.get(gKey) : null, perIp ? kv.get(iKey) : null])).map((v) => Number(v) || 0);
  } catch {
    return { ok: true, commit: async () => null }; // a KV outage must not take the assistant down
  }
  if (total && g >= total) return { ok: false, scope: 'service' };
  if (perIp && i >= perIp) return { ok: false, scope: 'ip' };
  return {
    ok: true,
    commit: async () => {
      const opts = { expirationTtl: 60 * 60 * 48 };
      try { await Promise.all([total ? kv.put(gKey, String(g + 1), opts) : null, perIp ? kv.put(iKey, String(i + 1), opts) : null]); } catch { /* best effort */ }
      return total ? { used: g + 1, limit: total } : null;
    },
  };
}

/** Which budget threshold (if any) this request just crossed. */
export function crossedThreshold(used, limit) {
  if (!limit) return null;
  if (used === limit) return 100;
  if (used === Math.ceil(limit * 0.8)) return 80;
  return null;
}

const sentInIsolate = new Set();

/**
 * Sends an alert at most once per [kind] per UTC day (de-duplicated in KV when bound, otherwise per isolate).
 * The text never contains user content.
 */
export async function alert(env, kind, text, now = Date.now()) {
  const url = env.ALERT_WEBHOOK_URL;
  if (!url || !url.startsWith('https://')) return false;
  const key = `a:${day(now)}:${kind}`;
  try {
    if (env.USAGE) { if (await env.USAGE.get(key)) return false; await env.USAGE.put(key, '1', { expirationTtl: 60 * 60 * 48 }); }
    else { if (sentInIsolate.has(key)) return false; sentInIsolate.add(key); }
  } catch { /* still try to alert */ }
  const message = `[ÉCOLE EYES proxy] ${text}`;
  try {
    // "text" for Slack-style webhooks, "content" for Discord.
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: message, content: message }) });
    return r.ok;
  } catch {
    return false;
  }
}

export function resetAlertCache() { sentInIsolate.clear(); }
