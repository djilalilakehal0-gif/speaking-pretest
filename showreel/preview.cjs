const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve(__dirname, 'reel.html')); await p.evaluate(() => window.ready);
  for (const f of process.argv.slice(3).map(Number)) { await p.evaluate((t) => window.draw(t), f / 30); await p.screenshot({ path: `${process.argv[2]}/p${f}.png` }); }
  await b.close();
})();
