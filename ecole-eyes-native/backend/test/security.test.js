import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
import { validateBody, MAX_IMAGES } from '../validate.js';

const base = { model: 'claude-sonnet-5-5', max_tokens: 300, system: 's', messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] };
const img = (extra = {}) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD', ...extra } });
const tool = { name: 'capture_view', description: 'Take a photo', input_schema: { type: 'object', properties: {} } };

test('paid server tools and unknown tool fields are refused', () => {
  assert.equal(validateBody({ ...base, tools: [{ type: 'web_search_20250305', name: 'web_search' }] }).status, 400);
  assert.equal(validateBody({ ...base, tools: [{ ...tool, type: 'custom' }] }).status, 400);
  assert.equal(validateBody({ ...base, tools: [{ ...tool, cache_control: { type: 'ephemeral' } }] }).status, 400);
  assert.equal(validateBody({ ...base, tools: [{ ...tool, name: 'bad name!' }] }).status, 400);
  assert.equal(validateBody({ ...base, tools: [{ name: 'x', input_schema: { type: 'string' } }] }).status, 400);
  assert.deepEqual(validateBody({ ...base, tools: [tool] }).body.tools, [tool]);
});

test('only text, base64 images, tool_use and tool_result are forwarded', () => {
  const bad = (content, role = 'user') => validateBody({ ...base, messages: [{ role, content }] }).status;
  assert.equal(bad([{ type: 'document', source: { type: 'url', url: 'https://x' } }]), 400);
  assert.equal(bad([img({ type: 'url', url: 'http://169.254.169.254/' })]), 400);   // no fetching URLs for anyone
  assert.equal(bad([img({ media_type: 'application/pdf' })]), 400);
  assert.equal(bad([img()], 'assistant'), 400);
  assert.equal(bad([{ type: 'tool_use', id: 'a', name: 'x', input: {} }], 'user'), 400);
  assert.equal(validateBody({ ...base, messages: [{ role: 'system', content: 'x' }] }).status, 400);
  assert.equal(bad([]), 400);
});

test('blocks are rebuilt: hidden extra fields never reach the provider', () => {
  const body = validateBody({ ...base, messages: [
    { role: 'user', content: [{ type: 'text', text: 'hi', cache_control: { type: 'ephemeral' }, citations: [1] }] },
    { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'capture_view', input: { ocr: true }, extra: 1 }] },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', is_error: false, content: [{ type: 'text', text: 'ok' }, img({ extra: 'x' })], extra: 2 }] },
  ] }).body;
  assert.deepEqual(body.messages[0].content[0], { type: 'text', text: 'hi' });
  assert.deepEqual(body.messages[1].content[0], { type: 'tool_use', id: 't1', name: 'capture_view', input: { ocr: true } });
  assert.deepEqual(body.messages[2].content[0], { type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: 'ok' }, img()] });
});

test('image count, system size and temperature are bounded', () => {
  const many = Array.from({ length: MAX_IMAGES + 1 }, () => img());
  assert.equal(validateBody({ ...base, messages: [{ role: 'user', content: many }] }).status, 400);
  assert.ok(validateBody({ ...base, messages: [{ role: 'user', content: many.slice(1) }] }).body);
  assert.equal(validateBody({ ...base, system: 'x'.repeat(20001) }).status, 400);
  assert.equal(validateBody({ ...base, temperature: 5 }).status, 400);
});

const env = { ANTHROPIC_API_KEY: 'sk-secret', APP_TOKEN: 'tok' };
const req = (body, ip = '203.0.113.9') => new Request('https://p.test/v1/messages', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-app-token': 'tok', 'cf-connecting-ip': ip }, body: JSON.stringify(body),
});

test('kill switch stops all AI spending without calling the provider', async () => {
  let called = 0;
  globalThis.fetch = async () => { called++; return Response.json({}); };
  const r = await worker.fetch(req(base), { ...env, DISABLED: 'true' });
  assert.equal(r.status, 503);
  assert.equal(called, 0);
});

test('logs contain status and a hashed IP, never the request content, key or IP', async () => {
  const lines = [];
  const orig = console.log;
  console.log = (l) => lines.push(String(l));
  try {
    globalThis.fetch = async () => Response.json({ content: [{ type: 'text', text: 'private answer' }] });
    await worker.fetch(req({ ...base, messages: [{ role: 'user', content: [{ type: 'text', text: 'my secret medical question' }] }] }), env);
  } finally { console.log = orig; }
  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.status, 200);
  assert.match(entry.ip, /^[0-9a-f]{8}$/);
  for (const forbidden of ['medical', 'private answer', 'sk-secret', 'tok', '203.0.113.9']) assert.ok(!lines[0].includes(forbidden), forbidden);
});
