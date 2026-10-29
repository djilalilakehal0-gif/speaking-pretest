// Renders index.html frame-by-frame with Playwright and encodes an MP4 with ffmpeg.
//   node render.js [out.mp4] [audio.wav]      full render
//   node render.js --stills 0.2,2.8,5.5       write PNG stills to ./stills (for checking)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?capture');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.photosReady);
  const FPS = await page.evaluate(() => window.FPS), DUR = await page.evaluate(() => window.DUR);
  const shot = async t => { await page.evaluate(t => window.renderAt(t), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }); };

  if (args[0] === '--stills') {
    const dir = path.join(process.env.STILLS_DIR || path.join(__dirname, 'stills')); fs.mkdirSync(dir, { recursive: true });
    for (const t of args[1].split(',').map(Number)) fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.png`), await shot(t));
    await browser.close(); return;
  }

  const out = args[0] || path.join(__dirname, 'viralgrow-showreel.mp4'), audio = args[1];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    ...(audio ? ['-i', audio] : []), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    ...(audio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(DUR * FPS);
  for (let f = 0; f < total; f++) {
    const buf = await shot(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 30 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await browser.close(); console.log('wrote', out);
})();
