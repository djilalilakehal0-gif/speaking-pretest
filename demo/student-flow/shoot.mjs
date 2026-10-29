import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
const out = process.argv[2];
const shots = JSON.parse(process.argv[3] || '[[0,1],[0,3],[1,2],[2,1],[2,4],[2,7],[3,1],[3,4],[3,7]]');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const logs = []; p.on('console', (m) => logs.push(m.text())); p.on('pageerror', (e) => logs.push('ERR ' + e.message));
await p.goto('file://' + dir + 'index.html'); await p.waitForTimeout(800);
await p.evaluate(() => demo.pause());
for (const [i, t] of shots) {
  await p.evaluate(([i, t]) => { const s = STUDENT_STEPS; demo.seek(s.slice(0, i).reduce((a, x) => a + x.dur, 0) + t); }, [i, t]);
  await p.waitForTimeout(200);
  await (await p.$('.hd-view')).screenshot({ path: `${out}/s${i}_${t}.png` });
}
console.log(logs.join('\n') || 'console clean'); await b.close();
