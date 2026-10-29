import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url)); const out = process.argv[2];
const b = await chromium.launch();
for (const [w, rm] of [[390, false], [340, false], [1200, true]]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const p = await c.newPage(); const logs = []; p.on('pageerror', (e) => logs.push(e.message)); p.on('console', (m) => m.type() === 'error' && logs.push(m.text()));
  await p.goto('file://' + dir + 'index.html'); await p.waitForTimeout(900);
  const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  const r = await p.evaluate(() => { const v = document.querySelector('.hd-view').getBoundingClientRect(); return [v.width, v.height]; });
  console.log(w, rm ? 'reduced' : '', 'hscroll:', over, 'view', r.map(Math.round).join('x'), logs.join('|') || 'clean');
  if (rm) for (let i = 0; i < 4; i++) { await p.click(`.hd-steps li:nth-child(${i + 1}) button`); await p.waitForTimeout(250); await (await p.$('.hd-view')).screenshot({ path: `${out}/rm${i}.png` }); }
  else await p.screenshot({ path: `${out}/w${w}.png`, fullPage: true });
  await c.close();
}
await b.close();
