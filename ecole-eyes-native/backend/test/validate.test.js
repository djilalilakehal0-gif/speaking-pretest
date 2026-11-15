import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
import { safeEqual, validateBody, MAX_TOKENS_CAP } from '../validate.js';

const ok = { model: 'claude-sonnet-5-5', max_tokens: 300, system: 's', messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] };

test('safeEqual', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual('', ''), true);
});

test('valid body passes and unknown fields are dropped', () => {
  const r = validateBody({ ...ok, metadata: { user_id: 'x' }, stream: false, anything: 1 });
  assert.ok(r.body);
  assert.deepEqual(Object.keys(r.body).sort(), ['max_tokens', 'messages', 'model', 'system']);
});

test('max_tokens is capped and defaulted', () => {
  assert.equal(validateBody({ ...ok, max_tokens: 999999 }).body.max_tokens, MAX_TOKENS_CAP);
  assert.equal(validateBody({ ...ok, max_tokens: undefined }).body.max_tokens, 700);
  assert.equal(validateBody({ ...ok, max_tokens: -5 }).body.max_tokens, 1);
});

test('rejects bad input', () => {
  assert.ok(validateBody(null).error);
  assert.ok(validateBody([]).error);
  assert.ok(validateBody({ ...ok, model: 'gpt-4' }).error);
  assert.ok(validateBody({ ...ok, stream: true }).error);
  assert.ok(validateBody({ ...ok, messages: [] }).error);
  assert.ok(validateBody({ ...ok, messages: 'x' }).error);
  assert.ok(validateBody({ ...ok, system: 5 }).error);
  assert.ok(validateBody({ ...ok, tools: 'x' }).error);
  assert.ok(validateBody({ ...ok, messages: Array(61).fill(ok.messages[0]) }).error);
});

test('model allow-list can be overridden', () => {
  assert.ok(validateBody(ok, ['other']).error);
  assert.ok(validateBody({ ...ok, model: 'other' }, ['other']).body);
});

// ---- the worker itself, with a fake upstream ------------------------------------------------------------------------
const env = { ANTHROPIC_API_KEY: 'sk-secret', APP_TOKEN: 'tok' };
const req = (body, headers = {}, method = 'POST', path = '/v1/messages') =>
  new Request('https://p.test' + path, { method, headers: { 'content-type': 'application/json', ...headers }, body: method === 'POST' ? JSON.stringify(body) : undefined });

test('health check', async () => {
  const r = await worker.fetch(new Request('https://p.test/'), env);
  assert.equal(r.status, 200);
});

test('only POST /v1/messages is served', async () => {
  assert.equal((await worker.fetch(req(ok, {}, 'GET', '/v1/messages'), env)).status, 404);
  assert.equal((await worker.fetch(req(ok, { 'x-app-token': 'tok' }, 'POST', '/v1/other'), env)).status, 404);
});

test('missing or wrong app token is rejected before anything else', async () => {
  assert.equal((await worker.fetch(req(ok), env)).status, 401);
  assert.equal((await worker.fetch(req(ok, { 'x-app-token': 'nope' }), env)).status, 401);
});

test('misconfigured proxy fails closed', async () => {
  assert.equal((await worker.fetch(req(ok, { 'x-app-token': 'tok' }), { ANTHROPIC_API_KEY: 'k' })).status, 500);   // no APP_TOKEN
  assert.equal((await worker.fetch(req(ok, { 'x-app-token': 'tok' }), { APP_TOKEN: 'tok' })).status, 500);          // no API key
});

test('forwards a validated request with the secret key and returns the answer', async () => {
  const seen = [];
  globalThis.fetch = async (url, init) => { seen.push({ url, init }); return new Response('{"content":[{"type":"text","text":"hello"}]}', { status: 200, headers: { 'content-type': 'application/json' } }); };
  const r = await worker.fetch(req({ ...ok, metadata: { x: 1 } }, { 'x-app-token': 'tok', 'x-api-key': 'attacker' }), env);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).content[0].text, 'hello');
  assert.equal(seen[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen[0].init.headers['x-api-key'], 'sk-secret');                   // the proxy's key, not the caller's
  assert.equal(JSON.parse(seen[0].init.body).metadata, undefined);                 // non-whitelisted field stripped
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('provider errors and retry-after pass through so the app can react', async () => {
  globalThis.fetch = async () => new Response('{"type":"error","error":{"type":"rate_limit_error","message":"slow"}}', { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '3' } });
  const r = await worker.fetch(req(ok, { 'x-app-token': 'tok' }), env);
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '3');
});

test('unreachable provider becomes 502', async () => {
  globalThis.fetch = async () => { throw new Error('down'); };
  assert.equal((await worker.fetch(req(ok, { 'x-app-token': 'tok' }), env)).status, 502);
});

test('invalid JSON and oversized bodies are rejected without calling the provider', async () => {
  let called = false; globalThis.fetch = async () => { called = true; return new Response('{}'); };
  const bad = new Request('https://p.test/v1/messages', { method: 'POST', headers: { 'x-app-token': 'tok' }, body: '{not json' });
  assert.equal((await worker.fetch(bad, env)).status, 400);
  const big = new Request('https://p.test/v1/messages', { method: 'POST', headers: { 'x-app-token': 'tok', 'content-length': String(50 * 1024 * 1024) }, body: '{}' });
  assert.equal((await worker.fetch(big, env)).status, 413);
  assert.equal(called, false);
});

test('rate limiter is honoured', async () => {
  const limited = { ...env, RATE_LIMITER: { limit: async () => ({ success: false }) } };
  assert.equal((await worker.fetch(req(ok, { 'x-app-token': 'tok' }), limited)).status, 429);
});

test('token check can be disabled only explicitly (local testing)', async () => {
  globalThis.fetch = async () => new Response('{"content":[]}', { status: 200 });
  assert.equal((await worker.fetch(req(ok), { ...env, REQUIRE_APP_TOKEN: 'false' })).status, 200);
});
