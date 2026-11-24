// Google Play Integrity verification for the école eyes proxy (unit-tested in test/integrity.test.js).
//
// The app sends `x-integrity-token`, bound to SHA-256 of the exact request body. The Worker decodes it with Google
// (service-account OAuth, RS256 JWT signed with WebCrypto) and checks package, request hash, freshness, app and device
// verdicts. Modes (INTEGRITY_MODE): "off" (default), "monitor" (verify + log, never block), "enforce" (block failures).
//
// Configuration:
//   INTEGRITY_MODE            off | monitor | enforce
//   GOOGLE_SERVICE_ACCOUNT    (secret) JSON key of a service account with the Play Integrity API enabled
//   PACKAGE_NAME              (var, optional) default com.ecoleeyes.app
//   INTEGRITY_ALLOW_SIDELOAD  (var, optional) "true" accepts UNRECOGNIZED_VERSION (APKs installed outside Play)

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/playintegrity';
const MAX_AGE_MS = 10 * 60 * 1000;

let cached = null; // { key, token, exp } per Worker isolate

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlText = (s) => b64url(new TextEncoder().encode(s));

export async function sha256url(text) {
  return b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

function pemToDer(pem) {
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0)).buffer;
}

/** OAuth access token for the service account, cached until 5 minutes before expiry. */
export async function accessToken(serviceAccountJson, now = Date.now()) {
  const sa = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
  if (cached && cached.key === sa.client_email && cached.exp - 300_000 > now) return cached.token;
  const iat = Math.floor(now / 1000);
  const header = b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64urlText(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  const data = await res.json();
  cached = { key: sa.client_email, token: data.access_token, exp: now + (data.expires_in || 3600) * 1000 };
  return cached.token;
}

export function resetIntegrityCache() { cached = null; }

/** Pure verdict check. Returns { ok: true } or { ok: false, reason }. */
export function checkVerdict(payload, { packageName, requestHash, now = Date.now(), allowSideload = false }) {
  const rd = payload?.requestDetails || {};
  if (rd.requestPackageName !== packageName) return { ok: false, reason: 'package' };
  if (rd.requestHash !== requestHash) return { ok: false, reason: 'request_hash' };
  const ts = Number(rd.timestampMillis);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > MAX_AGE_MS) return { ok: false, reason: 'stale' };
  const app = payload?.appIntegrity?.appRecognitionVerdict;
  if (!(app === 'PLAY_RECOGNIZED' || (allowSideload && app === 'UNRECOGNIZED_VERSION'))) return { ok: false, reason: `app_${String(app || 'missing').toLowerCase()}` };
  const device = payload?.deviceIntegrity?.deviceRecognitionVerdict || [];
  if (!device.includes('MEETS_DEVICE_INTEGRITY') && !device.includes('MEETS_STRONG_INTEGRITY')) return { ok: false, reason: 'device' };
  return { ok: true };
}

/**
 * Verifies the request's integrity token. Returns { mode, ok, reason } — the caller blocks only when
 * mode === 'enforce' && !ok. Never throws.
 */
export async function verifyIntegrity(request, bodyText, env, now = Date.now()) {
  const mode = (env.INTEGRITY_MODE || 'off').toLowerCase();
  if (mode !== 'monitor' && mode !== 'enforce') return { mode: 'off', ok: true };
  if (!env.GOOGLE_SERVICE_ACCOUNT) return { mode, ok: false, reason: 'server_not_configured' };
  const token = request.headers.get('x-integrity-token');
  if (!token) return { mode, ok: false, reason: 'missing_token' };
  if (token.length > 8000) return { mode, ok: false, reason: 'token_too_large' };
  const packageName = env.PACKAGE_NAME || 'com.ecoleeyes.app';
  try {
    const access = await accessToken(env.GOOGLE_SERVICE_ACCOUNT, now);
    const res = await fetch(`https://playintegrity.googleapis.com/v1/${encodeURIComponent(packageName)}:decodeIntegrityToken`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${access}` },
      body: JSON.stringify({ integrity_token: token }),
    });
    if (!res.ok) return { mode, ok: false, reason: `google_${res.status}` };
    const data = await res.json();
    const v = checkVerdict(data.tokenPayloadExternal, {
      packageName, requestHash: await sha256url(bodyText), now, allowSideload: env.INTEGRITY_ALLOW_SIDELOAD === 'true',
    });
    return { mode, ...v };
  } catch {
    return { mode, ok: false, reason: 'verify_error' };
  }
}
