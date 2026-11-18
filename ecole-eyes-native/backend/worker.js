// école eyes — AI proxy (Cloudflare Worker).
//
// The Android app sends its requests here; the worker checks them, adds the secret provider key and
// forwards them to the Anthropic Messages API. The key never ships inside the app.
//
// Secrets / variables (Cloudflare dashboard or `wrangler secret put`):
//   PROVIDER           (var, optional)     "anthropic" (default) or "openai" (any OpenAI-compatible Chat Completions API)
//   ANTHROPIC_API_KEY  (secret)            required when PROVIDER=anthropic
//   OPENAI_API_KEY     (secret)            required when PROVIDER=openai
//   OPENAI_BASE_URL    (var, optional)     e.g. https://api.openai.com/v1 (default), https://api.mistral.ai/v1, https://openrouter.ai/api/v1
//   OPENAI_MODEL       (var)               model used upstream when PROVIDER=openai (must support images + tools)
//   APP_TOKEN          (secret, required*) shared token the app sends in x-app-token
//                       (*set REQUIRE_APP_TOKEN=false only for local testing)
//   ALLOWED_MODELS     (var, optional)     comma-separated model allow-list
//   RATE_LIMITER       (binding)           Cloudflare rate-limit binding (on by default in wrangler.toml)
//   DISABLED           (var, optional)     "true" = refuse every AI request (503): an instant spending kill switch
//
//   INTEGRITY_MODE, GOOGLE_SERVICE_ACCOUNT, ...   Google Play Integrity, see integrity.js
//   USAGE, DAILY_REQUEST_LIMIT, DAILY_IP_LIMIT, ALERT_WEBHOOK_URL   daily spending cap and alerts, see guard.js
//
// Logging: one JSON line per request (status, duration, provider, error type, hashed IP prefix). Never the body:
// it contains the user's questions, photos and documents.

import { DEFAULT_MODELS, MAX_BODY_BYTES, safeEqual, validateBody } from './validate.js';
import { errorFromOpenAI, fromOpenAI, toOpenAI } from './providers.js';
import { verifyIntegrity } from './integrity.js';
import { alert, checkQuota, crossedThreshold } from './guard.js';

const UPSTREAM = 'https://api.anthropic.com/v1/messages';
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });
const err = (status, type, message, extra) => json({ type: 'error', error: { type, message } }, status, extra);

export default {
  async fetch(request, env, ctx) {
    const started = Date.now();
    const meta = { ipHash: await ipHashOf(request) };
    const res = await handle(request, env, meta);
    if (new URL(request.url).pathname === '/v1/messages') {
      logLine(request, env, res, started, meta);
      const after = afterRequest(env, res, meta);
      if (ctx?.waitUntil) ctx.waitUntil(after); else await after;   // counting and alerts never delay the answer
    }
    return res;
  },
};

async function ipHashOf(request) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(request.headers.get('cf-connecting-ip') || ''));
    return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return 'unknown'; }
}

function logLine(request, env, res, started, meta) {
  try {
    console.log(JSON.stringify({
      evt: 'ai_request', status: res.status, ms: Date.now() - started, provider: (env.PROVIDER || 'anthropic').toLowerCase(),
      ip: meta.ipHash.slice(0, 8), country: request.cf?.country,
      integrity: meta.integrity && meta.integrity.mode !== 'off' ? (meta.integrity.ok ? 'ok' : meta.integrity.reason) : undefined,
      quota: meta.quotaBlocked, upstream: meta.upstreamStatus,
    }));
  } catch { /* logging must never break a request */ }
}

/** Counts the request against the daily budget and sends alerts. Never throws. */
async function afterRequest(env, res, meta) {
  try {
    if (meta.commit && res.status < 400) {
      const u = await meta.commit();
      const t = u && crossedThreshold(u.used, u.limit);
      if (t) await alert(env, `budget_${t}`, `Daily AI budget ${t}% used (${u.used} of ${u.limit} requests). Raise DAILY_REQUEST_LIMIT or set DISABLED=true to stop spending.`);
    }
    if (meta.quotaBlocked === 'service') await alert(env, 'budget_blocked', 'Daily AI budget reached: requests are being refused until midnight UTC.');
    if (meta.upstreamStatus === 401 || meta.upstreamStatus === 403) await alert(env, 'provider_auth', `The AI provider rejected the API key (HTTP ${meta.upstreamStatus}). Check or rotate the key.`);
    if (meta.upstreamStatus === 429) await alert(env, 'provider_limit', 'The AI provider is rate-limiting or the account spending limit was reached (HTTP 429).');
    if (meta.integrity?.reason === 'server_not_configured') await alert(env, 'integrity_config', 'INTEGRITY_MODE is on but GOOGLE_SERVICE_ACCOUNT is not set.');
  } catch { /* best effort */ }
}

function secondsUntilUtcMidnight(now = Date.now()) {
  const d = new Date(now); d.setUTCHours(24, 0, 0, 0);
  return String(Math.max(60, Math.ceil((d.getTime() - now) / 1000)));
}

async function handle(request, env, meta) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('école eyes proxy OK', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (request.method !== 'POST' || url.pathname !== '/v1/messages') return err(404, 'not_found', 'Not found');

    if (env.DISABLED === 'true') return err(503, 'overloaded_error', 'Service temporarily disabled', { 'retry-after': '3600' });

    // 1. Who is calling?
    if (env.REQUIRE_APP_TOKEN !== 'false') {
      if (!env.APP_TOKEN) return err(500, 'server_misconfigured', 'APP_TOKEN is not set on the proxy');
      if (!safeEqual(request.headers.get('x-app-token') || '', env.APP_TOKEN)) return err(401, 'authentication_error', 'bad app token');
    }

    // 2. Not too often.
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return err(429, 'rate_limit_error', 'Too many requests', { 'retry-after': '10' });
    }

    // 2b. Daily spending cap.
    const quota = await checkQuota(env, meta.ipHash);
    if (!quota.ok) {
      meta.quotaBlocked = quota.scope;
      return err(429, 'rate_limit_error', quota.scope === 'service' ? 'Daily budget reached' : 'Daily limit reached for this connection', { 'retry-after': secondsUntilUtcMidnight() });
    }
    meta.commit = quota.commit;

    const provider = (env.PROVIDER || 'anthropic').toLowerCase();
    if (provider !== 'anthropic' && provider !== 'openai') return err(500, 'server_misconfigured', 'PROVIDER must be anthropic or openai');
    if (provider === 'anthropic' && !env.ANTHROPIC_API_KEY) return err(500, 'server_misconfigured', 'ANTHROPIC_API_KEY is not set on the proxy');
    if (provider === 'openai' && (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)) return err(500, 'server_misconfigured', 'OPENAI_API_KEY and OPENAI_MODEL must be set on the proxy');

    // 3. Not too big, and well-formed.
    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_BODY_BYTES) return err(413, 'request_too_large', 'Request too large');
    let raw, text;
    try {
      text = await request.text();
      if (text.length > MAX_BODY_BYTES) return err(413, 'request_too_large', 'Request too large');
      raw = JSON.parse(text);
    } catch {
      return err(400, 'invalid_request_error', 'Invalid JSON');
    }
    const allowed = env.ALLOWED_MODELS ? env.ALLOWED_MODELS.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_MODELS;
    const v = validateBody(raw, allowed);
    if (v.error) return err(v.status, 'invalid_request_error', v.error);

    // 3b. Genuine app on a genuine device (Google Play Integrity), when enabled.
    meta.integrity = await verifyIntegrity(request, text, env);
    if (meta.integrity.mode === 'enforce' && !meta.integrity.ok) return err(401, 'authentication_error', 'app integrity check failed');

    // 4. Forward. Nothing is logged or stored: bodies contain the user's questions and photos.
    if (provider === 'openai') return forwardOpenAI(v.body, env, meta);
    let upstream;
    try {
      upstream = await fetch(UPSTREAM, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': env.ANTHROPIC_API_KEY },
        body: JSON.stringify(v.body),
      });
    } catch {
      return err(502, 'api_error', 'Upstream unreachable');
    }
    meta.upstreamStatus = upstream.status;
    const headers = { 'content-type': upstream.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' };
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) headers['retry-after'] = retryAfter;
    return new Response(upstream.body, { status: upstream.status, headers });
}

async function forwardOpenAI(body, env, meta = {}) {
  const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  if (!base.startsWith('https://')) return err(500, 'server_misconfigured', 'OPENAI_BASE_URL must be https');
  let upstream;
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify(toOpenAI(body, env.OPENAI_MODEL)),
    });
  } catch {
    return err(502, 'api_error', 'Upstream unreachable');
  }
  meta.upstreamStatus = upstream.status;
  let data = null;
  try { data = await upstream.json(); } catch { data = null; }
  const extra = upstream.headers.get('retry-after') ? { 'retry-after': upstream.headers.get('retry-after') } : {};
  if (!upstream.ok) return json(errorFromOpenAI(upstream.status, data), upstream.status, extra);
  const out = fromOpenAI(data);
  return json(out, out.type === 'error' ? 502 : 200, extra);
}
