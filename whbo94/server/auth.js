import crypto from 'node:crypto';
import { db } from './db.js';

const SESSION_MS = 1000 * 60 * 60 * 12;
const COOKIE = 'whbo94_session';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

export function ensureAdmin() {
  if (db.prepare('SELECT 1 FROM admins LIMIT 1').get()) return;
  const username = process.env.ADMIN_USER || 'admin';
  let password = process.env.ADMIN_PASSWORD;
  const generated = !password;
  if (generated) password = crypto.randomBytes(9).toString('base64url');
  db.prepare('INSERT INTO admins (username, pass_hash) VALUES (?, ?)').run(username, hashPassword(password));
  console.log(`\n[whbo94] تم إنشاء حساب المسؤول: ${username}`);
  if (generated) console.log(`[whbo94] كلمة المرور (تظهر مرة واحدة فقط): ${password}\n`);
}

export function createSession(adminId, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)').run(
    sha(token), adminId, Date.now() + SESSION_MS,
  );
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}${secure}`);
}

function readToken(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

export function destroySession(req, res) {
  const t = readToken(req);
  if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function requireAdmin(req, res, next) {
  const t = readToken(req);
  const row = t && db.prepare(
    'SELECT a.id, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?',
  ).get(sha(t), Date.now());
  if (!row) return res.status(401).json({ error: 'غير مصرّح. سجّل الدخول أولاً.' });
  req.admin = row;
  next();
}

const hits = new Map();
export function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}|${req.ip}`;
    const now = Date.now();
    const rec = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (rec.length >= max) return res.status(429).json({ error: 'محاولات كثيرة، حاول لاحقاً.' });
    rec.push(now);
    hits.set(key, rec);
    next();
  };
}
