// Renders the Android icon + splash sources into assets/ (used by `npx capacitor-assets generate`).
// Run from napolitime/: node scripts/make-app-assets.cjs   (needs Playwright + Chromium)
const { chromium } = require('playwright')
const path = require('path')

// Official badge, produced by scripts/make-logo.py (transparent outside the circle).
const logoData = 'data:image/png;base64,' + require('fs').readFileSync(path.resolve('assets/source/logo.png')).toString('base64')
const mark = (size) => `<img src="${logoData}" width="${size}" height="${size}" style="display:block">`

const fontUrl = 'data:font/woff2;base64,' + require('fs').readFileSync(path.resolve('node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2')).toString('base64')
const page = (w, h, body, bg) => `<html><head><style>
@font-face{font-family:Anton;src:url(${fontUrl})}
html,body{margin:0;width:${w}px;height:${h}px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center}
.w{font-family:Anton;color:#FFF3DF;letter-spacing:.05em}.w span{color:#F5B942}.t{font-family:Georgia,serif;font-style:italic;color:#F5B942}
</style></head><body>${body}</body></html>`

;(async () => {
  const b = await chromium.launch()
  const shot = async (file, w, h, html, transparent = false) => {
    const p = await b.newPage({ viewport: { width: w, height: h } })
    await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    await p.screenshot({ path: `assets/${file}`, omitBackground: transparent }); await p.close()
  }
  await shot('icon-only.png', 1024, 1024, page(1024, 1024, mark(940), '#101010'))
  await shot('icon-foreground.png', 1024, 1024, page(1024, 1024, mark(640), 'transparent'), true)
  await shot('icon-background.png', 1024, 1024, page(1024, 1024, '', '#101010'))
  const splash = page(2732, 2732, `${mark(900)}<div class="t" style="font-size:96px;margin-top:60px">Taste the Moment.</div>`, '#101010')
  await shot('splash.png', 2732, 2732, splash)
  await shot('splash-dark.png', 2732, 2732, splash)
  await b.close()
  console.log('assets written')
})()
