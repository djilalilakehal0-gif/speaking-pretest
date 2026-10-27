import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, UPLOAD_DIR } from './db.js';
import { CATEGORIES, CATEGORY_IDS } from './categories.js';
import {
  ensureAdmin, verifyPassword, hashPassword, createSession, destroySession, requireAdmin, rateLimit,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const SITE = 'نور اليقين';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY ? 1 : false);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "media-src 'self' https: blob:",
      "frame-src https://www.youtube-nocookie.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '));
  }
  next();
});
app.use(express.json({ limit: '50kb' }));

// ---------- uploads ----------
const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };
const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/webm': '.webm' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = IMAGE_TYPES[file.mimetype] || VIDEO_TYPES[file.mimetype] || '';
      cb(null, crypto.randomBytes(16).toString('hex') + ext);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024, files: 2, fields: 12 },
  fileFilter: (req, file, cb) => {
    const ok = file.fieldname === 'cover' ? IMAGE_TYPES[file.mimetype] : file.fieldname === 'video' ? VIDEO_TYPES[file.mimetype] : false;
    cb(ok ? null : new Error('نوع الملف غير مدعوم (صور: JPG/PNG/WebP/AVIF، فيديو: MP4/WebM).'), Boolean(ok));
  },
}).fields([{ name: 'cover', maxCount: 1 }, { name: 'video', maxCount: 1 }]);

const handleUpload = (req, res, next) => upload(req, res, (err) => {
  if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'حجم الملف أكبر من المسموح (500MB).' : err.message });
  next();
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

const removeUpload = (url) => {
  if (url && url.startsWith('/uploads/')) fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true }, () => {});
};
const discardFiles = (files) => Object.values(files || {}).flat().forEach((f) => fs.rm(f.path, { force: true }, () => {}));

// ---------- helpers ----------
const toVideo = (r) => ({
  id: r.id, title: r.title, description: r.description, category: r.category,
  videoUrl: r.video_url, coverUrl: r.cover_url, duration: r.duration, orientation: r.orientation,
  position: r.position, featured: Boolean(r.featured), views: r.views, likes: r.likes, createdAt: r.created_at,
});

function cleanUrl(v) {
  if (!v) return '';
  try {
    const u = new URL(String(v).trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch { return null; }
}

function parseVideoForm(req, existing) {
  const b = req.body;
  const title = String(b.title ?? existing?.title ?? '').trim();
  const description = String(b.description ?? existing?.description ?? '').trim();
  const category = String(b.category ?? existing?.category ?? '');
  const orientation = String(b.orientation ?? existing?.orientation ?? 'landscape');
  const duration = Math.max(0, Math.round(Number(b.duration ?? existing?.duration ?? 0)) || 0);
  if (!title || title.length > 200) return { error: 'العنوان مطلوب (حتى 200 حرف).' };
  if (description.length > 1000) return { error: 'الوصف طويل جداً (الحد 1000 حرف).' };
  if (!CATEGORY_IDS.includes(category)) return { error: 'التصنيف غير صالح.' };
  if (!['landscape', 'portrait'].includes(orientation)) return { error: 'اتجاه الفيديو غير صالح.' };

  let videoUrl = existing?.video_url || '';
  let coverUrl = existing?.cover_url || '';
  const files = req.files || {};
  if (files.video?.[0]) videoUrl = `/uploads/${files.video[0].filename}`;
  else if (b.video_url !== undefined && b.video_url !== '') {
    const u = cleanUrl(b.video_url);
    if (!u) return { error: 'رابط الفيديو غير صالح (يجب أن يبدأ بـ https://).' };
    videoUrl = u;
  }
  if (!videoUrl) return { error: 'أضف رابط الفيديو أو ارفع ملفاً.' };
  if (files.cover?.[0]) coverUrl = `/uploads/${files.cover[0].filename}`;
  else if (b.cover_url !== undefined && b.cover_url !== '') {
    const u = cleanUrl(b.cover_url);
    if (!u) return { error: 'رابط صورة الغلاف غير صالح.' };
    coverUrl = u;
  } else if (b.remove_cover === '1') coverUrl = '';
  return { value: { title, description, category, orientation, duration, videoUrl, coverUrl } };
}

const nextPosition = () => (db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM videos').get().p);

// ---------- public API ----------
app.get('/api/categories', (req, res) => res.json(CATEGORIES));

app.get('/api/videos', (req, res) => {
  res.json(db.prepare('SELECT * FROM videos ORDER BY position ASC, id DESC').all().map(toVideo));
});

app.get('/api/videos/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM videos WHERE id = ?').get(Number(req.params.id));
  if (!r) return res.status(404).json({ error: 'المقطع غير موجود.' });
  res.json(toVideo(r));
});

app.post('/api/videos/:id/view', rateLimit(30, 60_000), (req, res) => {
  const info = db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: info.changes > 0 });
});

app.post('/api/videos/:id/like', rateLimit(30, 60_000), (req, res) => {
  const id = Number(req.params.id);
  const sql = req.body?.liked === false
    ? 'UPDATE videos SET likes = MAX(likes - 1, 0) WHERE id = ?'
    : 'UPDATE videos SET likes = likes + 1 WHERE id = ?';
  db.prepare(sql).run(id);
  const r = db.prepare('SELECT likes FROM videos WHERE id = ?').get(id);
  if (!r) return res.status(404).json({ error: 'المقطع غير موجود.' });
  res.json({ likes: r.likes });
});

app.post('/api/contact', rateLimit(5, 10 * 60_000), (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const body = String(req.body?.body || '').trim();
  if (!name || name.length > 100) return res.status(400).json({ error: 'الاسم مطلوب.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return res.status(400).json({ error: 'البريد الإلكتروني غير صالح.' });
  if (body.length < 5 || body.length > 3000) return res.status(400).json({ error: 'الرسالة قصيرة جداً أو طويلة جداً.' });
  db.prepare('INSERT INTO messages (name, email, body, created_at) VALUES (?, ?, ?, ?)').run(name, email, body, Date.now());
  res.status(201).json({ ok: true });
});

// ---------- admin API ----------
app.post('/api/admin/login', rateLimit(8, 15 * 60_000), (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(String(username));
  if (!admin || !verifyPassword(String(password), admin.pass_hash)) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
  }
  createSession(admin.id, res);
  res.json({ username: admin.username });
});
app.post('/api/admin/logout', (req, res) => { destroySession(req, res); res.json({ ok: true }); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ username: req.admin.username }));

app.post('/api/admin/password', requireAdmin, rateLimit(8, 15 * 60_000), (req, res) => {
  const { current = '', next = '' } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!verifyPassword(String(current), admin.pass_hash)) return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  if (String(next).length < 10) return res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 10 أحرف.' });
  db.prepare('UPDATE admins SET pass_hash = ? WHERE id = ?').run(hashPassword(String(next)), admin.id);
  res.json({ ok: true });
});

app.post('/api/admin/videos', requireAdmin, handleUpload, (req, res) => {
  const { error, value } = parseVideoForm(req, null);
  if (error) { discardFiles(req.files); return res.status(400).json({ error }); }
  const info = db.prepare(
    `INSERT INTO videos (title, description, category, video_url, cover_url, duration, orientation, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(value.title, value.description, value.category, value.videoUrl, value.coverUrl, value.duration, value.orientation, nextPosition(), Date.now());
  res.status(201).json(toVideo(db.prepare('SELECT * FROM videos WHERE id = ?').get(Number(info.lastInsertRowid))));
});

app.put('/api/admin/videos/:id', requireAdmin, handleUpload, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  if (!existing) { discardFiles(req.files); return res.status(404).json({ error: 'المقطع غير موجود.' }); }
  const { error, value } = parseVideoForm(req, existing);
  if (error) { discardFiles(req.files); return res.status(400).json({ error }); }
  db.prepare(
    `UPDATE videos SET title=?, description=?, category=?, video_url=?, cover_url=?, duration=?, orientation=? WHERE id=?`,
  ).run(value.title, value.description, value.category, value.videoUrl, value.coverUrl, value.duration, value.orientation, id);
  if (existing.video_url !== value.videoUrl) removeUpload(existing.video_url);
  if (existing.cover_url !== value.coverUrl) removeUpload(existing.cover_url);
  res.json(toVideo(db.prepare('SELECT * FROM videos WHERE id = ?').get(id)));
});

app.delete('/api/admin/videos/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'المقطع غير موجود.' });
  db.prepare('DELETE FROM videos WHERE id = ?').run(id);
  removeUpload(existing.video_url);
  removeUpload(existing.cover_url);
  res.json({ ok: true });
});

app.post('/api/admin/videos/:id/feature', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(id)) return res.status(404).json({ error: 'المقطع غير موجود.' });
  const on = req.body?.featured !== false;
  db.exec('BEGIN');
  db.exec('UPDATE videos SET featured = 0');
  if (on) db.prepare('UPDATE videos SET featured = 1 WHERE id = ?').run(id);
  db.exec('COMMIT');
  res.json({ ok: true });
});

app.post('/api/admin/videos/reorder', requireAdmin, (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) return res.status(400).json({ error: 'قائمة الترتيب غير صالحة.' });
  const stmt = db.prepare('UPDATE videos SET position = ? WHERE id = ?');
  db.exec('BEGIN');
  ids.forEach((id, i) => stmt.run(i + 1, id));
  db.exec('COMMIT');
  res.json({ ok: true });
});

app.get('/api/admin/messages', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200').all());
});
app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'غير موجود.' }));

// ---------- static client + SEO for share links ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }));
  app.get('*', (req, res) => {
    let html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = req.path.match(/^\/v\/(\d+)$/);
    const v = m && db.prepare('SELECT title, description, cover_url FROM videos WHERE id = ?').get(Number(m[1]));
    if (v) {
      const origin = `${req.protocol}://${req.get('host')}`;
      const img = v.cover_url ? new URL(v.cover_url, origin).toString() : `${origin}/hero.jpg`;
      html = html
        .replace(/<title>.*?<\/title>/, `<title>${esc(v.title)} | ${SITE}</title>`)
        .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(v.title)}`)
        .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(v.description || '')}`)
        .replace(/(<meta property="og:image" content=")[^"]*/, `$1${esc(img)}`);
    }
    res.type('html').send(html);
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'حدث خطأ في الخادم.' });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureAdmin();
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`[whbo94] http://localhost:${port}`));
}
