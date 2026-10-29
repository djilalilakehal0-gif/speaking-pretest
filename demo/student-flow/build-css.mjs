// Scopes the real app's stylesheet (www/index.html) under .pt so it can sit
// inside the demo stage. @font-face/@keyframes are hoisted; :root/html/body
// become the scope itself (native CSS nesting).
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../www/index.html', import.meta.url), 'utf8');
let css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const hoisted = [];
function pull(re) {
  let m;
  while ((m = re.exec(css))) {
    let i = css.indexOf('{', m.index), d = 0, j = i;
    for (; j < css.length; j++) { if (css[j] === '{') d++; else if (css[j] === '}' && --d === 0) break; }
    hoisted.push(css.slice(m.index, j + 1));
    css = css.slice(0, m.index) + css.slice(j + 1);
    re.lastIndex = m.index;
  }
}
pull(/@font-face/g);
pull(/@keyframes/g);
css = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/:root\s*\{/g, '&{')
  .replace(/html,body\s*\{/g, '&{')
  .replace(/(^|\})\s*body\s*\{/g, '$1&{')
  .replace(/body\.home/g, '&.home');
const fonts = hoisted.join('\n').replace(/url\(fonts\//g, 'url(../../www/fonts/');
fs.writeFileSync(new URL('./pt.css', import.meta.url), `${fonts}\n.pt{\n${css}\n}\n`);
console.log('pt.css', fs.statSync(new URL('./pt.css', import.meta.url)).size);

const wel = src.match(/<section class="welcome">[\s\S]*?<\/section>/)[0].replace(/src="img\//g, 'src="../../www/img/');
fs.writeFileSync(new URL('./markup.js', import.meta.url), `window.PT_WELCOME = ${JSON.stringify(wel)};\n`);
