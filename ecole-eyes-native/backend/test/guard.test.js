import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
import { alert, checkQuota, crossedThreshold, resetAlertCache } from '../guard.js';

/** In-memory stand-in for a Cloudflare KV namespace. */
class FakeKV {
  constructor() { this.m = new Map(); this.failing = false; }
  async get(k) { if (this.failing) throw new Error('kv down'); return this.m.get(k) ?? null; }
  async put(k, v) { if (this.failing) throw new Error('kv down'); this.m.set(k, v); }
}

const body = { model: 'claude-sonnet-5-5', max_tokens: 100, messages: [{ role: 'user', content: [{ type: 'text', text: 'my private question' }] }] };
const req = (ip = '198.51.100.7') => new Request('https://p.test/v1/messages', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-app-token': 'tok', 'cf-connecting-ip': ip }, body: JSON.stringify(body),
});

let hooks;
function mockNet(providerStatus = 200) {
  hooks = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://hooks.test/')) { hooks.push(JSON.parse(init.body)); return new Response('ok'); }
    return new Response(JSON.stringify(providerStatus === 200 ? { content: [{ type: 'text', text: 'answer' }] } : { error: { message: 'x' } }), { status: providerStatus });
  };
}

beforeEach(() => resetAlertCache());

test('daily service budget: requests stop at the limit and resume the next day', async () => {
  mockNet();
  const kv = new FakeKV();
  const env = { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', USAGE: kv, DAILY_REQUEST_LIMIT: '3' };
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await worker.fetch(req(`203.0.113.${i}`), env)).status);
  assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  const refused = await worker.fetch(req(), env);
  assert.equal((await refused.json()).error.message, 'Daily budget reached');
  assert.ok(Number(refused.headers.get('retry-after')) >= 60);
  const tomorrow = await checkQuota(env, 'x', Date.now() + 24 * 3600 * 1000);
  assert.equal(tomorrow.ok, true);
});

test('per-IP daily limit stops one abusive client without affecting others', async () => {
  mockNet();
  const env = { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', USAGE: new FakeKV(), DAILY_IP_LIMIT: '2' };
  const a = [];
  for (let i = 0; i < 3; i++) a.push((await worker.fetch(req('192.0.2.1'), env)).status);
  assert.deepEqual(a, [200, 200, 429]);
  assert.equal((await worker.fetch(req('192.0.2.2'), env)).status, 200);
});

test('failed provider calls do not consume the budget', async () => {
  mockNet(500);
  const kv = new FakeKV();
  const env = { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', USAGE: kv, DAILY_REQUEST_LIMIT: '1' };
  await worker.fetch(req(), env);
  mockNet(200);
  assert.equal((await worker.fetch(req(), env)).status, 200);
});

test('a KV outage never takes the assistant down', async () => {
  mockNet();
  const kv = new FakeKV(); kv.failing = true;
  const r = await worker.fetch(req(), { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', USAGE: kv, DAILY_REQUEST_LIMIT: '1' });
  assert.equal(r.status, 200);
});

test('budget alerts fire once at 80% and once at 100%, without user content', async () => {
  mockNet();
  const env = { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', USAGE: new FakeKV(), DAILY_REQUEST_LIMIT: '5', ALERT_WEBHOOK_URL: 'https://hooks.test/abc' };
  for (let i = 0; i < 8; i++) await worker.fetch(req(`203.0.113.${i}`), env);
  const texts = hooks.map((h) => h.text);
  assert.equal(texts.filter((t) => t.includes('80%')).length, 1);
  assert.equal(texts.filter((t) => t.includes('100%')).length, 1);
  assert.equal(texts.filter((t) => t.includes('refused until midnight')).length, 1);   // de-duplicated per day
  assert.ok(hooks.every((h) => h.content === h.text), 'Discord and Slack formats');
  assert.ok(!JSON.stringify(hooks).includes('private question'));
});

test('a rejected provider key or provider spending limit triggers an alert', async () => {
  mockNet(401);
  await worker.fetch(req(), { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', ALERT_WEBHOOK_URL: 'https://hooks.test/1' });
  assert.match(hooks[0].text, /rejected the API key \(HTTP 401\)/);
  mockNet(429);
  await worker.fetch(req(), { ANTHROPIC_API_KEY: 'k', APP_TOKEN: 'tok', ALERT_WEBHOOK_URL: 'https://hooks.test/1' });
  assert.match(hooks[0].text, /spending limit/);
});

test('alerts require an https webhook and are de-duplicated without KV too', async () => {
  mockNet();
  assert.equal(await alert({ ALERT_WEBHOOK_URL: 'http://insecure/x' }, 'k', 't'), false);
  assert.equal(await alert({ ALERT_WEBHOOK_URL: 'https://hooks.test/x' }, 'same', 't'), true);
  assert.equal(await alert({ ALERT_WEBHOOK_URL: 'https://hooks.test/x' }, 'same', 't'), false);
  assert.equal(hooks.length, 1);
});

test('thresholds', () => {
  assert.equal(crossedThreshold(80, 100), 80);
  assert.equal(crossedThreshold(100, 100), 100);
  assert.equal(crossedThreshold(81, 100), null);
  assert.equal(crossedThreshold(4, 5), 80);
  assert.equal(crossedThreshold(1, 0), null);
});
