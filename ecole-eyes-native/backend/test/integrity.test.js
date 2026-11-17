import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
import { checkVerdict, resetIntegrityCache, sha256url, verifyIntegrity } from '../integrity.js';

// A real RSA service-account key generated for the test (no key material is stored in the repository).
const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
const PEM_LABEL = ['PRIVATE', 'KEY'].join(' ');
const serviceAccount = JSON.stringify({ client_email: 'proxy@test.iam.gserviceaccount.com', private_key: `-----BEGIN ${PEM_LABEL}-----\n${pkcs8.match(/.{1,64}/g).join('\n')}\n-----END ${PEM_LABEL}-----\n` });

const NOW = 1_800_000_000_000;
const body = JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 100, messages: [{ role: 'user', content: [{ type: 'text', text: 'مرحبا' }] }] });
const goodPayload = async (overrides = {}) => ({
  requestDetails: { requestPackageName: 'com.ecoleeyes.app', requestHash: await sha256url(body), timestampMillis: String(NOW - 1000) },
  appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED' },
  deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_DEVICE_INTEGRITY'] },
  ...overrides,
});

let calls;
function mockGoogle(payloadOrStatus) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).startsWith('https://oauth2.googleapis.com/token')) return Response.json({ access_token: 'ya29.test', expires_in: 3600 });
    if (String(url).includes(':decodeIntegrityToken')) {
      if (typeof payloadOrStatus === 'number') return new Response('{}', { status: payloadOrStatus });
      return Response.json({ tokenPayloadExternal: payloadOrStatus });
    }
    return Response.json({ content: [{ type: 'text', text: 'answer' }] });   // the AI provider
  };
}
const reqWith = (token) => new Request('https://p.test/v1/messages', { method: 'POST', headers: token ? { 'x-integrity-token': token } : {}, body });

beforeEach(() => resetIntegrityCache());

test('verdict: package, request hash, freshness, app and device are all required', async () => {
  const opts = { packageName: 'com.ecoleeyes.app', requestHash: await sha256url(body), now: NOW };
  assert.deepEqual(checkVerdict(await goodPayload(), opts), { ok: true });
  assert.equal(checkVerdict(await goodPayload({ requestDetails: { ...(await goodPayload()).requestDetails, requestPackageName: 'com.evil' } }), opts).reason, 'package');
  assert.equal(checkVerdict(await goodPayload(), { ...opts, requestHash: 'other-body' }).reason, 'request_hash');      // replay for another request
  assert.equal(checkVerdict(await goodPayload(), { ...opts, now: NOW + 11 * 60 * 1000 }).reason, 'stale');
  assert.equal(checkVerdict(await goodPayload({ appIntegrity: { appRecognitionVerdict: 'UNRECOGNIZED_VERSION' } }), opts).reason, 'app_unrecognized_version');
  assert.deepEqual(checkVerdict(await goodPayload({ appIntegrity: { appRecognitionVerdict: 'UNRECOGNIZED_VERSION' } }), { ...opts, allowSideload: true }), { ok: true });
  assert.equal(checkVerdict(await goodPayload({ deviceIntegrity: { deviceRecognitionVerdict: [] } }), opts).reason, 'device');   // emulator / rooted
});

test('the OAuth assertion is a valid RS256 JWT signed with the service-account key', async () => {
  mockGoogle(await goodPayload());
  const r = await verifyIntegrity(reqWith('tok'), body, { INTEGRITY_MODE: 'enforce', GOOGLE_SERVICE_ACCOUNT: serviceAccount }, NOW);
  assert.deepEqual(r, { mode: 'enforce', ok: true });
  const assertion = new URLSearchParams(calls[0].init.body.toString()).get('assertion');
  const [h, c, sig] = assertion.split('.');
  const dec = (s) => JSON.parse(Buffer.from(s, 'base64url').toString());
  assert.deepEqual(dec(h), { alg: 'RS256', typ: 'JWT' });
  assert.equal(dec(c).scope, 'https://www.googleapis.com/auth/playintegrity');
  assert.equal(dec(c).iss, 'proxy@test.iam.gserviceaccount.com');
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(sig, 'base64url'), new TextEncoder().encode(`${h}.${c}`));
  assert.ok(valid, 'signature must verify with the public key');
  assert.equal(calls[1].url, 'https://playintegrity.googleapis.com/v1/com.ecoleeyes.app:decodeIntegrityToken');
  assert.equal(calls[1].init.headers.authorization, 'Bearer ya29.test');
});

test('the access token is cached between requests', async () => {
  mockGoogle(await goodPayload());
  const env = { INTEGRITY_MODE: 'enforce', GOOGLE_SERVICE_ACCOUNT: serviceAccount };
  await verifyIntegrity(reqWith('a'), body, env, NOW);
  await verifyIntegrity(reqWith('b'), body, env, NOW + 60_000);
  assert.equal(calls.filter((x) => x.url.includes('oauth2')).length, 1);
});

test('failures are reported with a reason and never throw', async () => {
  const env = { INTEGRITY_MODE: 'enforce', GOOGLE_SERVICE_ACCOUNT: serviceAccount };
  assert.equal((await verifyIntegrity(reqWith(null), body, env, NOW)).reason, 'missing_token');
  mockGoogle(400);
  assert.equal((await verifyIntegrity(reqWith('bad'), body, env, NOW)).reason, 'google_400');
  globalThis.fetch = async () => { throw new Error('network'); };
  resetIntegrityCache();
  assert.equal((await verifyIntegrity(reqWith('x'), body, env, NOW)).reason, 'verify_error');
  assert.equal((await verifyIntegrity(reqWith('x'), body, { INTEGRITY_MODE: 'enforce' }, NOW)).reason, 'server_not_configured');
  assert.deepEqual(await verifyIntegrity(reqWith(null), body, {}, NOW), { mode: 'off', ok: true });
});

// ---- through the worker ------------------------------------------------------------------------------------------------
const baseEnv = { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', GOOGLE_SERVICE_ACCOUNT: serviceAccount };
const workerReq = (headers) => new Request('https://p.test/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-token': 'tok', ...headers }, body });

test('enforce: a request without a valid proof is refused before reaching the AI provider', async () => {
  mockGoogle({ requestDetails: {} });
  const r = await worker.fetch(workerReq({ 'x-integrity-token': 'forged' }), { ...baseEnv, INTEGRITY_MODE: 'enforce' });
  assert.equal(r.status, 401);
  assert.ok(!calls.some((x) => x.url.includes('anthropic')), 'provider must not be called');
  const r2 = await worker.fetch(workerReq({}), { ...baseEnv, INTEGRITY_MODE: 'enforce' });
  assert.equal(r2.status, 401);
});

test('monitor: failures are logged but the user is still answered (safe migration)', async () => {
  const lines = []; const orig = console.log; console.log = (l) => lines.push(String(l));
  try {
    mockGoogle({ requestDetails: {} });
    const r = await worker.fetch(workerReq({}), { ...baseEnv, INTEGRITY_MODE: 'monitor' });
    assert.equal(r.status, 200);
  } finally { console.log = orig; }
  assert.equal(JSON.parse(lines[0]).integrity, 'missing_token');
});
