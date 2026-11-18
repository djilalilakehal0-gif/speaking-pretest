import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
import { fromOpenAI, toOpenAI } from '../providers.js';

// A realistic tool-calling exchange as the app sends it: question -> tool call -> photo result.
const conversation = {
  model: 'claude-sonnet-5-5',
  max_tokens: 400,
  system: 'You are ÉCOLE EYES.',
  tools: [{ name: 'capture_view', description: 'Take a photo', input_schema: { type: 'object', properties: { ocr: { type: 'boolean' } } } }],
  messages: [
    { role: 'user', content: [{ type: 'text', text: 'What is in front of me?' }] },
    { role: 'assistant', content: [{ type: 'text', text: 'Let me look.' }, { type: 'tool_use', id: 'tu_1', name: 'capture_view', input: { ocr: false } }] },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: [{ type: 'text', text: 'Photo taken.' }, { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } }] }] },
  ],
};

test('request translation keeps system, tools, tool calls, tool results and the photo', () => {
  const o = toOpenAI(conversation, 'gpt-vision');
  assert.equal(o.model, 'gpt-vision');
  assert.equal(o.max_tokens, 400);
  assert.deepEqual(o.messages[0], { role: 'system', content: 'You are ÉCOLE EYES.' });
  assert.deepEqual(o.messages[1], { role: 'user', content: 'What is in front of me?' });
  assert.equal(o.messages[2].role, 'assistant');
  assert.equal(o.messages[2].content, 'Let me look.');
  assert.deepEqual(o.messages[2].tool_calls[0], { id: 'tu_1', type: 'function', function: { name: 'capture_view', arguments: '{"ocr":false}' } });
  assert.deepEqual(o.messages[3], { role: 'tool', tool_call_id: 'tu_1', content: 'Photo taken.' });
  // the image follows as a user message, because tool messages are text-only
  assert.equal(o.messages[4].role, 'user');
  assert.equal(o.messages[4].content.find((p) => p.type === 'image_url').image_url.url, 'data:image/jpeg;base64,QUJD');
  assert.deepEqual(o.tools[0].function.parameters, conversation.tools[0].input_schema);
});

test('tool errors are marked so the model does not guess', () => {
  const o = toOpenAI({ ...conversation, messages: [{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', is_error: true, content: 'camera denied' }] }] }, 'm');
  assert.deepEqual(o.messages[1], { role: 'tool', tool_call_id: 'x', content: 'ERROR: camera denied' });
});

test('response translation: text, tool calls and stop reasons', () => {
  assert.deepEqual(fromOpenAI({ choices: [{ finish_reason: 'stop', message: { content: 'A table.' } }] }),
    { type: 'message', role: 'assistant', content: [{ type: 'text', text: 'A table.' }], stop_reason: 'end_turn' });
  const t = fromOpenAI({ choices: [{ finish_reason: 'tool_calls', message: { content: null, tool_calls: [{ id: 'c1', function: { name: 'capture_view', arguments: '{"ocr":true}' } }] } }] });
  assert.deepEqual(t.content, [{ type: 'tool_use', id: 'c1', name: 'capture_view', input: { ocr: true } }]);
  assert.equal(t.stop_reason, 'tool_use');
  assert.equal(fromOpenAI({ choices: [{ finish_reason: 'length', message: { content: 'cut' } }] }).stop_reason, 'max_tokens');
  assert.deepEqual(fromOpenAI({ choices: [{ message: { tool_calls: [{ id: 'c', function: { name: 'n', arguments: '{bad json' } }] } }] }).content[0].input, {});
  assert.equal(fromOpenAI({}).type, 'error');
});

// ---- through the worker ------------------------------------------------------------------------------------------------
const env = { PROVIDER: 'openai', OPENAI_API_KEY: 'sk-oai', OPENAI_MODEL: 'gpt-vision', OPENAI_BASE_URL: 'https://llm.example/v1/', APP_TOKEN: 'tok' };
const req = (body) => new Request('https://p.test/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-token': 'tok' }, body: JSON.stringify(body) });

test('openai provider: translated both ways, key added by the proxy', async () => {
  const seen = [];
  globalThis.fetch = async (url, init) => { seen.push({ url, init }); return Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'Hello.' } }] }); };
  const r = await worker.fetch(req(conversation), env);
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).content, [{ type: 'text', text: 'Hello.' }]);
  assert.equal(seen[0].url, 'https://llm.example/v1/chat/completions');
  assert.equal(seen[0].init.headers.authorization, 'Bearer sk-oai');
  assert.equal(JSON.parse(seen[0].init.body).model, 'gpt-vision');
});

test('openai provider errors keep their status for the app (auth, rate limit)', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'slow down' } }), { status: 429, headers: { 'retry-after': '7' } });
  const r = await worker.fetch(req(conversation), env);
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '7');
  assert.equal((await r.json()).error.type, 'rate_limit_error');
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  assert.equal((await (await worker.fetch(req(conversation), env)).json()).error.type, 'authentication_error');
});

test('openai provider misconfiguration fails closed', async () => {
  assert.equal((await worker.fetch(req(conversation), { ...env, OPENAI_MODEL: '' })).status, 500);
  assert.equal((await worker.fetch(req(conversation), { ...env, OPENAI_BASE_URL: 'http://insecure' })).status, 500);
  assert.equal((await worker.fetch(req(conversation), { ...env, PROVIDER: 'other' })).status, 500);
});
