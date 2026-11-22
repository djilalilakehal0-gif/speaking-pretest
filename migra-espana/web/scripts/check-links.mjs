// Verifies every official URL before release. Usage: npm run check:links   (exit 1 on any failure)
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/lib/legal/sources.ts', import.meta.url), 'utf8');
const urls = [...new Set([...src.matchAll(/url: '(https:\/\/[^']+)'/g)].map((m) => m[1]))];
let bad = 0;
for (const u of urls) {
  try {
    const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'link-check' } });
    console.log(r.ok ? 'OK  ' : 'FAIL', r.status, u); if (!r.ok) bad++;
  } catch (e) { console.log('FAIL', e.message, u); bad++; }
}
process.exit(bad ? 1 : 0);
