/** Minimal fixed-window limiter. In production use a shared store (Upstash/Redis) — serverless instances do not share memory. */
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max = 20, windowMs = 60_000, now = Date.now()): boolean {
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
  if (h.n >= max) return false;
  h.n++;
  return true;
}
