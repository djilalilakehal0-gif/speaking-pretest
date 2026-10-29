// Rendu 60 fps image par image : node render-video.js [sortie.mp4]
// Requiert playwright et ffmpeg. Le défilement, les transitions CSS (600 ms) et le calque mg.js
// sont tous pilotés par l'horloge de la vidéo, pas par le temps réel.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const FPS = 60, W = 1920, H = 1080, DUR = 24.5;
const OUT = process.argv[2] || path.join(__dirname, 'trois-saveurs-60fps.mp4');
const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const sm = (t, a, b) => Math.min(Math.max((t - a) / (b - a), 0), 1);

(async () => {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  p.on('pageerror', e => console.error('pageerror', e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.waitForTimeout(1200);
  await p.addScriptTag({ path: path.join(__dirname, 'mg.js') });
  const { total, pizza, kebab } = await p.evaluate(() => ({
    total: document.documentElement.scrollHeight - innerHeight,
    pizza: document.getElementById('pizza').offsetTop,
    kebab: document.getElementById('kebab').offsetTop }));
  const y = t => {
    if (t < 5.5) return 0;
    if (t < 10.5) return pizza * ease(sm(t, 5.5, 10.5));
    if (t < 13.0) return pizza;
    if (t < 18.0) return pizza + (kebab - pizza) * ease(sm(t, 13.0, 18.0));
    return kebab + Math.min(total - kebab, 260) * ease(sm(t, 18.0, 21.0));
  };
  await p.evaluate(() => { window.__t0 = new Map(); });
  const frames = Math.round(DUR * FPS);
  for (let f = 0; f < frames; f++) {
    const t = f / FPS, py = y(t);
    await p.evaluate(async ([py, t, total]) => {
      scrollTo(0, py);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (const a of document.getAnimations()) {
        if (!window.__t0.has(a)) window.__t0.set(a, t);
        a.pause(); a.currentTime = Math.max(0, (t - window.__t0.get(a)) * 1000);
      }
      window.__mg(t, py / total);
    }, [py, t, total]);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 120 === 0) console.log('frame', f, '/', frames);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done');
})();
