const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2], from = +process.argv[3], to = +process.argv[4], step = +(process.argv[5] || 1);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve(__dirname, 'reel.html'));
  await p.evaluate(() => window.ready);
  for (let f = from; f < to; f += step) {
    await p.evaluate((t) => window.draw(t), f / 30);
    await p.screenshot({ path: `${out}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 96 });
  }
  await b.close();
})();
