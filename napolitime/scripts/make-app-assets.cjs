// Renders the Android icon + splash sources into assets/ (used by `npx capacitor-assets generate`).
// Run from napolitime/: node scripts/make-app-assets.cjs   (needs Playwright + Chromium)
const { chromium } = require('playwright')
const path = require('path')

const mark = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="22.5" fill="#101010" stroke="#F5B942" stroke-width="1.5"/>
  ${Array.from({ length: 12 }, (_, i) => `<line x1="24" y1="3.6" x2="24" y2="${i % 3 === 0 ? 6.4 : 5.2}" stroke="#F5B942" stroke-width="${i % 3 === 0 ? 1.4 : 0.8}" stroke-linecap="round" transform="rotate(${i * 30} 24 24)"/>`).join('')}
  <circle cx="24" cy="24" r="16.5" fill="#E8A33A"/><circle cx="24" cy="24" r="13.6" fill="#E63932"/>
  <circle cx="18.5" cy="27.5" r="2.6" fill="#FFF3DF"/><circle cx="28.5" cy="29" r="2.1" fill="#FFF3DF"/><circle cx="19.5" cy="19" r="1.8" fill="#FFF3DF"/>
  <path d="M27.5 22.5c1.4-.9 3-.6 3.6.3-1 .9-2.6 1-3.6-.3Z" fill="#4E8A3A"/>
  <path d="M24 24 L24 6.8 A17.2 17.2 0 0 1 38.9 15.4 Z" fill="#101010"/><path d="M24 24 L24 6.8" stroke="#F5B942" stroke-width="1"/>
  <circle cx="24" cy="24" r="1.7" fill="#F5B942"/>
</svg>`

const fontUrl = 'data:font/woff2;base64,' + require('fs').readFileSync(path.resolve('node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2')).toString('base64')
const page = (w, h, body, bg) => `<html><head><style>
@font-face{font-family:Anton;src:url(${fontUrl})}
html,body{margin:0;width:${w}px;height:${h}px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center}
.w{font-family:Anton;color:#FFF3DF;letter-spacing:.05em}.w span{color:#E63932}.t{font-family:Georgia,serif;font-style:italic;color:#F5B942}
</style></head><body>${body}</body></html>`

;(async () => {
  const b = await chromium.launch()
  const shot = async (file, w, h, html, transparent = false) => {
    const p = await b.newPage({ viewport: { width: w, height: h } })
    await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    await p.screenshot({ path: `assets/${file}`, omitBackground: transparent }); await p.close()
  }
  await shot('icon-only.png', 1024, 1024, page(1024, 1024, mark(860), '#101010'))
  await shot('icon-foreground.png', 1024, 1024, page(1024, 1024, mark(600), 'transparent'), true)
  await shot('icon-background.png', 1024, 1024, page(1024, 1024, '', '#101010'))
  const splash = page(2732, 2732, `${mark(560)}<div class="w" style="font-size:230px;margin-top:70px">NAPOLI<span>TIME</span></div><div class="t" style="font-size:96px;margin-top:10px">Taste the Moment.</div>`, '#101010')
  await shot('splash.png', 2732, 2732, splash)
  await shot('splash-dark.png', 2732, 2732, splash)
  await b.close()
  console.log('assets written')
})()
