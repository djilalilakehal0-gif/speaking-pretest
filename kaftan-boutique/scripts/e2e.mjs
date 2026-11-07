// Acceptance tests from the brief (section 9), run in a real Chromium with WebGL.
//   npm run build && npm run test:e2e        (screenshots go to $SHOTS or ./scripts/.build/shots)
// Uses the pre-installed Playwright (require('playwright')).
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium, devices } = require('playwright')
const SHOTS = process.env.SHOTS || new URL('./.build/shots/', import.meta.url).pathname
mkdirSync(SHOTS, { recursive: true })
const PORT = 4977
const BASE = `http://localhost:${PORT}/`

const server = spawn(new URL('../node_modules/.bin/vite', import.meta.url).pathname, ['preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => d.toString().includes(String(PORT)) && res())
  server.on('exit', () => rej(new Error('preview server exited')))
  setTimeout(() => rej(new Error('preview server timeout')), 30000)
})

let failures = 0
const results = []
// Software WebGL renders slowly: wait until the camera stops moving instead of a fixed delay.
const settle = async (p) => {
  // stable = the same distance over 3 rendered frames, at least 1.5 s after the command
  await p.waitForTimeout(1500)
  let last = -1
  let lastFrame = -1
  let stable = 0
  for (let i = 0; i < 200; i++) {
    const { distance, frames } = await p.evaluate(() => window.__kaftanCamera())
    if (frames !== lastFrame) {
      stable = Math.abs(distance - last) < 0.002 ? stable + 1 : 0
      if (stable >= 3) return distance
      last = distance
      lastFrame = frames
    }
    await p.waitForTimeout(150)
  }
  return last
}
const tapIfEnabled = async (p, sel) => {
  if (!(await p.isDisabled(sel))) await p.click(sel)
}
const check = (name, ok, info = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ` — ${info}` : ''}`)
  if (!ok) failures++
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  // ---------------------------------------------------------------- desktop boutique
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  ctx.setDefaultTimeout(120000)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const glbs = new Map()
  page.on('response', (r) => r.url().endsWith('.glb') && glbs.set(r.url().split('/').pop(), r.status()))

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__kaftanLoaded && window.__kaftanLoaded().length === 5, null, { timeout: 120000 })
  await page.waitForTimeout(2500)
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__kaftanState())))
  const loaded = await page.evaluate(() => window.__kaftanLoaded())
  check('every distinct outfit has its own GLB and it loads in the 3D scene', loaded.length === 5 && [...glbs.values()].every((s) => s === 200), `${loaded.length} loaded: ${[...glbs.keys()].join(', ')}`)
  await page.screenshot({ path: `${SHOTS}desktop-home.png` })

  // select model 2 via the accessible lineup
  await page.click('[data-testid="select-02"]')
  await page.waitForSelector('[data-testid="product-panel"]')
  check('selecting a model opens its product panel', (await page.textContent('[data-testid="panel-title"]')) === 'Dark Satin Kaftan')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}desktop-selected.png` })

  // rotation: buttons, slider, limit
  const before = await state()
  for (let i = 0; i < 3; i++) await page.click('button[aria-label="Rotate right"]')
  let s = await state()
  check('ROTATE RIGHT turns the selected model (3 × 15° = 45°)', s.models['02'].rotation === 45, `${s.models['02'].rotation}°`)
  await page.click('button[aria-label="Rotate left"]')
  s = await state()
  check('ROTATE LEFT turns it back (30°)', s.models['02'].rotation === 30)
  await page.focus('[data-testid="rotation-slider"]')
  await page.keyboard.press('End')
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
  s = await state()
  check('slider stops at the 260° limit', s.models['02'].rotation === 260 && (await page.textContent('[data-testid="angle-readout"]')) === '260°', `${s.models['02'].rotation}°`)
  check('ROTATE RIGHT is disabled at 260°', await page.isDisabled('button[aria-label="Rotate right"]'))
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="rotation-slider"]')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '180')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  check('slider sets an exact angle (180°, rear view)', (await state()).models['02'].rotation === 180)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${SHOTS}desktop-rear-180.png` })
  const others = (a, b, id) => Object.keys(a.models).filter((k) => k !== id).every((k) => a.models[k].rotation === b.models[k].rotation && a.models[k].offset === b.models[k].offset)
  check('turning model 2 changes no other model', others(before, await state(), '02'))
  await page.click('button[aria-label="Reset rotation"]')
  check('RESET ROTATION returns to 0°', (await state()).models['02'].rotation === 0)

  // drag rotation on the model (camera is in hero framing on the selected model)
  await page.click('button[aria-label="Focus selected model"]')
  await settle(page)
  const box = await page.locator('[data-testid="boutique-canvas"] canvas').boundingBox()
  const [px, py] = await page.evaluate(() => {
    const s = window.__kaftanState()
    // slot 1 world position (src/lib/layout.ts) at waist height
    const len = Math.hypot(3.6, -5.2), sp = len / 4, d = 1 * sp + s.models['02'].offset
    return window.__kaftanProject(-1.7 + (3.6 / len) * d, 1.0, 0.9 + (-5.2 / len) * d)
  })
  const cx = box.x + px
  const cy = box.y + py
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 120, cy, { steps: 12 })
  await page.mouse.up()
  s = await state()
  check('dragging on the selected model turns it', s.models['02'].rotation > 20 && s.models['02'].rotation <= 260, `${s.models['02'].rotation}°`)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 1400, cy, { steps: 20 })
  await page.mouse.up()
  s = await state()
  check('dragging far never passes 260° (no full spin)', s.models['02'].rotation === 260, `${s.models['02'].rotation}°`)
  await tapIfEnabled(page, 'button[aria-label="Reset rotation"]')

  // movement: forward / backward / bounds / reset
  const beforeMove = await state()
  let presses = 0
  while (!(await page.isDisabled('button[aria-label="Move forward"]')) && presses < 20) {
    await page.click('button[aria-label="Move forward"]')
    presses++
  }
  s = await state()
  check('MOVE FORWARD moves the model and stops at its boundary', s.models['02'].offset < 0 && s.models['02'].offset >= -0.7 - 1e-9 && presses < 20, `offset ${s.models['02'].offset.toFixed(2)} m after ${presses} presses`)
  check('moving model 2 changes no other model', others(beforeMove, s, '02'))
  await page.click('button[aria-label="Reset position"]')
  check('RESET POSITION returns it to its spot', (await state()).models['02'].offset === 0)

  // neighbours block each other (no walking through another model)
  await page.click('[data-testid="select-03"]')
  while (!(await page.isDisabled('button[aria-label="Move backward"]'))) await page.click('button[aria-label="Move backward"]')
  await page.click('[data-testid="select-04"]')
  while (!(await page.isDisabled('button[aria-label="Move forward"]'))) await page.click('button[aria-label="Move forward"]')
  s = await state()
  const spacing = Math.hypot(1.9 - -1.7, -4.3 - 0.9) / 4 // SLOT_SPACING from src/lib/layout.ts
  const gap = spacing + s.models['04'].offset - s.models['03'].offset
  check('two neighbours can never pass through each other', gap >= 0.999, `gap ${gap.toFixed(2)} m (min 1.0 m)`)
  await tapIfEnabled(page, 'button[aria-label="Reset position"]')
  await page.click('[data-testid="select-03"]')
  await tapIfEnabled(page, 'button[aria-label="Reset position"]')

  // camera
  await page.click('button[aria-label="Reset camera"]')
  const d0 = await settle(page)
  await page.click('button[aria-label="Zoom in"]')
  const d1 = await settle(page)
  await page.click('button[aria-label="Zoom out"]')
  await settle(page)
  await page.click('button[aria-label="Zoom out"]')
  const d2 = await settle(page)
  check('ZOOM IN / ZOOM OUT change the camera distance', d1 < d0 - 0.5 && d2 > d1 + 0.5, `${d0.toFixed(2)} → ${d1.toFixed(2)} → ${d2.toFixed(2)}`)
  await page.click('button[aria-label="Focus selected model"]')
  const df = await settle(page)
  check('FOCUS frames the selected model', Math.abs(df - 3.5) < 0.35, `distance ${df.toFixed(2)} m`)
  // orbit drag on empty space cannot go under the floor
  await page.click('button[aria-label="Reset camera"]')
  await settle(page)
  await page.mouse.move(box.x + 60, box.y + 120)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y - 600, { steps: 15 })
  await page.mouse.up()
  await page.waitForTimeout(600)
  const camY = (await page.evaluate(() => window.__kaftanCamera())).y
  check('orbit controls never take the camera beneath the floor', camY > 0.2, `camera y ${camY.toFixed(2)}`)
  await page.click('button[aria-label="Reset camera"]')

  // keyboard
  await page.focus('[data-testid="boutique-canvas"]')
  await page.keyboard.press('5')
  await page.keyboard.press('ArrowRight')
  s = await state()
  check('keyboard: 5 selects model 5, → rotates it', s.selectedId === '05' && s.models['05'].rotation === 15)
  await tapIfEnabled(page, 'button[aria-label="Reset rotation"]')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}desktop-model5.png` })
  check('no runtime errors in the boutique', errors.length === 0, errors.slice(0, 3).join(' | '))

  // ---------------------------------------------------------------- product page + cart
  await page.goto(`${BASE}#/product/burgundy-kaftan`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="product-viewer"] canvas')
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${SHOTS}desktop-product.png`, fullPage: false })
  await page.click('[data-testid="add-to-cart"]')
  check('ADD TO CART asks for a size first', (await page.textContent('[role="alert"]'))?.includes('size'))
  await page.click('label:has([data-testid="size-M"])')
  await page.click('button[aria-label="Increase quantity"]')
  await page.click('[data-testid="add-to-cart"]')
  await page.waitForSelector('[data-testid="cart-drawer"] [data-testid="cart-line"]')
  check('cart count shows 2 items', (await page.textContent('[data-testid="cart-count"]')) === '2')
  await page.click('[data-testid="cart-drawer"] [data-testid="line-inc"]')
  const sub = await page.textContent('[data-testid="cart-subtotal"]')
  check('quantity change updates the subtotal (3 × 450)', sub.replace(/\s/g, '').includes('1,350') || sub.includes('1350'), sub)
  await page.selectOption('[data-testid="cart-drawer"] [data-testid="line-size"]', 'L')
  check('cart line size can be edited', (await page.inputValue('[data-testid="cart-drawer"] [data-testid="line-size"]')) === 'L')
  await page.click('[data-testid="wishlist"]', { force: true }).catch(() => {})
  await page.click('[data-testid="checkout-link"]')
  await page.fill('input[aria-label="Email"]', 'demo@example.com')
  for (const f of ['First name', 'Last name', 'Address', 'City', 'Postcode', 'Country']) await page.fill(`input[aria-label="${f}"]`, 'Demo')
  await page.click('[data-testid="place-order"]')
  check('checkout path completes with a clearly labelled demo order', (await page.textContent('[data-testid="order-done"]')).includes('no payment was taken'))

  // collection filters
  await page.goto(`${BASE}#/collection`, { waitUntil: 'networkidle' })
  await page.selectOption('[data-testid="filter-color"]', 'Red')
  check('collection filters work', (await page.textContent('[data-testid="result-count"]')).startsWith('1 '))
  await page.screenshot({ path: `${SHOTS}desktop-collection.png` })
  await ctx.close()

  // ---------------------------------------------------------------- mobile
  const m = await browser.newContext({ ...devices['iPhone 13'] })
  m.setDefaultTimeout(120000)
  const mp = await m.newPage()
  await mp.goto(BASE, { waitUntil: 'networkidle' })
  await mp.waitForFunction(() => window.__kaftanLoaded && window.__kaftanLoaded().length === 5, null, { timeout: 120000 })
  await mp.waitForTimeout(2000)
  await mp.screenshot({ path: `${SHOTS}mobile-home.png` })
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  check('mobile: no horizontal scroll', !overflow)
  await mp.tap('[data-testid="select-01"]')
  await mp.waitForSelector('[data-testid="product-panel"]')
  await mp.tap('button[aria-label="Rotate right"]')
  const ms = await mp.evaluate(() => window.__kaftanState().models['01'].rotation)
  check('mobile: thumb controls work (tap rotate)', ms === 15)
  const btn = await mp.locator('button[aria-label="Rotate right"]').boundingBox()
  check('mobile: controls are thumb-sized (≥ 44 px)', btn.height >= 44, `${btn.height}px`)
  await mp.waitForTimeout(1500)
  await mp.screenshot({ path: `${SHOTS}mobile-selected.png` })
  // pinch-to-zoom with two touch points (CDP)
  const cdp = await m.newCDPSession(mp)
  const vb = mp.viewportSize()
  const y0 = 140 // above the bottom-sheet product panel
  await settle(mp)
  const touch = (type, dx) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x: vb.width / 2 - dx, y: y0, id: 1 }, { x: vb.width / 2 + dx, y: y0, id: 2 }],
    })
  const pd0 = (await mp.evaluate(() => window.__kaftanCamera())).distance
  await touch('touchStart', 30)
  for (let dx = 30; dx <= 140; dx += 10) await touch('touchMove', dx)
  await touch('touchEnd', 0)
  await mp.waitForTimeout(800)
  const pd1 = (await mp.evaluate(() => window.__kaftanCamera())).distance
  check('mobile: pinch-to-zoom moves the camera closer', pd1 < pd0 - 0.05, `${pd0.toFixed(2)} → ${pd1.toFixed(2)}`)
  await mp.goto(`${BASE}#/product/satin-cape-drape-kaftan`, { waitUntil: 'networkidle' })
  await mp.waitForTimeout(2500)
  await mp.screenshot({ path: `${SHOTS}mobile-product.png` })
  await m.close()
} finally {
  await browser.close()
  server.kill()
}
console.log(results.join('\n'))
console.log(`\n${results.length - failures}/${results.length} passed`)
process.exit(failures ? 1 : 0)
