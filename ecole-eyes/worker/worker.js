// école eyes — AI proxy (Cloudflare Worker).
// The app sends its Claude requests here; the worker adds the secret API key and forwards
// them to Anthropic, so the key never ships inside the app.
//
// Secrets / variables (set in the Cloudflare dashboard or with wrangler):
//   ANTHROPIC_API_KEY  (secret, required)  the Anthropic API key
//   APP_TOKEN          (secret, optional)  if set, requests must send the same value in x-app-token
//   ALLOWED_ORIGINS    (var, optional)     comma-separated list of web origins allowed to call the proxy

const UPSTREAM = 'https://api.anthropic.com';
const FORWARD_HEADERS = ['content-type', 'anthropic-version', 'anthropic-beta', 'accept'];
const MAX_BODY = 20 * 1024 * 1024; // camera photos and scanned pages are sent as images

function cors(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  // The Android app's web view uses https://localhost.
  const ok = !allowed.length || allowed.includes(origin) || origin === 'https://localhost' || origin === 'capacitor://localhost';
  return {
    'access-control-allow-origin': ok ? origin || '*' : 'null',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': request.headers.get('access-control-request-headers') || '*',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = cors(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('école eyes proxy OK', { headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' } });
    }
    // Only the Messages API is forwarded.
    if (request.method !== 'POST' || url.pathname !== '/v1/messages') {
      return new Response('Not found', { status: 404, headers });
    }
    if (env.APP_TOKEN && request.headers.get('x-app-token') !== env.APP_TOKEN) {
      return new Response(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'bad app token' } }), { status: 401, headers: { ...headers, 'content-type': 'application/json' } });
    }
    if (!env.ANTHROPIC_API_KEY) {
      return new Response('ANTHROPIC_API_KEY is not set on the proxy', { status: 500, headers });
    }
    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_BODY) return new Response('Request too large', { status: 413, headers });

    const out = new Headers();
    for (const h of FORWARD_HEADERS) {
      const v = request.headers.get(h);
      if (v) out.set(h, v);
    }
    out.set('x-api-key', env.ANTHROPIC_API_KEY);

    const upstream = await fetch(UPSTREAM + '/v1/messages', { method: 'POST', headers: out, body: request.body });
    const resHeaders = new Headers(headers);
    for (const h of ['content-type', 'request-id', 'retry-after']) {
      const v = upstream.headers.get(h);
      if (v) resHeaders.set(h, v);
    }
    // Streams (server-sent events) pass straight through.
    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  },
};
