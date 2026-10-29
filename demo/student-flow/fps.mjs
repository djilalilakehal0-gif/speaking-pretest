import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
import { fileURLToPath } from 'node:url';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://' + fileURLToPath(new URL('.', import.meta.url)) + 'index.html'); await p.waitForTimeout(500);
const r = await p.evaluate(() => new Promise(res => { let n = 0, d = 0; const t0 = performance.now(); const un = demo.onChange(() => n++); setTimeout(() => { un(); res({ renders: n, secs: (performance.now() - t0) / 1000 }); }, 3000); }));
console.log('renders/s', (r.renders / r.secs).toFixed(1), errs.join('|') || 'clean'); await b.close();
