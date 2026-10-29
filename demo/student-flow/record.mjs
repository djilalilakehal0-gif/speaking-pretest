// Renders the demo to an MP4 frame by frame: seek to each frame's time, screenshot
// the window, encode with ffmpeg. Usage: node record.mjs out.mp4 [fps]
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const [out = 'student-flow.mp4', fps = '60'] = process.argv.slice(2);
const dir = fileURLToPath(new URL('.', import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
await p.goto('file://' + dir + 'index.html'); await p.waitForTimeout(1000);
await p.addStyleTag({ content: '.wrap{width:1200px!important;padding:0!important}h1.page,p.sub,.hd-steps{display:none!important}*{transition:none!important}' });
await p.evaluate(() => demo.pause()); await p.waitForTimeout(300);
const total = await p.evaluate(() => demo.state().total);
const n = Math.round(total * fps);
const view = await p.$('.hd-win');
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', fps, '-i', '-', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', fps, '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let i = 0; i < n; i++) {
  await p.evaluate((s) => demo.seek(s), i / fps);
  const buf = await view.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 300 === 0) console.log(i, '/', n);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('done', n, 'frames');
