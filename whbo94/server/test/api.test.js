import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'w94-'));
process.env.ADMIN_PASSWORD = 'Test-Pass-12345';

const { app } = await import('../index.js');
const { ensureAdmin } = await import('../auth.js');
ensureAdmin();

let base, cookie;
const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
base = `http://localhost:${server.address().port}`;
test.after(() => server.close());

const call = (p, o = {}) => fetch(base + p, { ...o, headers: { ...(o.json ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body: o.json ? JSON.stringify(o.json) : o.body });

test('admin routes require login', async () => {
  assert.equal((await call('/api/admin/videos', { method: 'POST' })).status, 401);
});

test('login, create, edit, feature, delete', async () => {
  const bad = await call('/api/admin/login', { method: 'POST', json: { username: 'admin', password: 'x' } });
  assert.equal(bad.status, 401);
  const ok = await call('/api/admin/login', { method: 'POST', json: { username: 'admin', password: 'Test-Pass-12345' } });
  assert.equal(ok.status, 200);
  cookie = ok.headers.get('set-cookie').split(';')[0];

  const fd = new FormData();
  fd.set('title', 'مقطع'); fd.set('category', 'rizq'); fd.set('video_url', 'https://example.com/a.mp4');
  const created = await (await call('/api/admin/videos', { method: 'POST', body: fd })).json();
  assert.equal(created.category, 'rizq');

  const badFd = new FormData();
  badFd.set('title', 'x'); badFd.set('category', 'nope'); badFd.set('video_url', 'https://example.com/a.mp4');
  assert.equal((await call('/api/admin/videos', { method: 'POST', body: badFd })).status, 400);
  const jsFd = new FormData();
  jsFd.set('title', 'x'); jsFd.set('category', 'rizq'); jsFd.set('video_url', 'javascript:alert(1)');
  assert.equal((await call('/api/admin/videos', { method: 'POST', body: jsFd })).status, 400);

  const up = new FormData(); up.set('title', 'معدّل');
  assert.equal((await (await call(`/api/admin/videos/${created.id}`, { method: 'PUT', body: up })).json()).title, 'معدّل');

  await call(`/api/admin/videos/${created.id}/feature`, { method: 'POST', json: {} });
  const list = await (await call('/api/videos')).json();
  assert.equal(list[0].featured, true);

  const like = await (await call(`/api/videos/${created.id}/like`, { method: 'POST', json: {} })).json();
  assert.equal(like.likes, 1);
  const unlike = await (await call(`/api/videos/${created.id}/like`, { method: 'POST', json: { liked: false } })).json();
  assert.equal(unlike.likes, 0);

  assert.equal((await call(`/api/admin/videos/${created.id}`, { method: 'DELETE' })).status, 200);
  assert.deepEqual(await (await call('/api/videos')).json(), []);
});

test('contact form validates and stores', async () => {
  assert.equal((await call('/api/contact', { method: 'POST', json: { name: 'a', email: 'bad', body: 'hello there' } })).status, 400);
  assert.equal((await call('/api/contact', { method: 'POST', json: { name: 'a', email: 'a@b.co', body: 'hello there' } })).status, 201);
});

test('rejects non-media uploads', async () => {
  const fd = new FormData();
  fd.set('title', 't'); fd.set('category', 'rizq');
  fd.set('video', new Blob(['hi'], { type: 'text/plain' }), 'a.txt');
  assert.equal((await call('/api/admin/videos', { method: 'POST', body: fd })).status, 400);
});
