# VirtualFit: Spatial Try-On Arc (complete recreation prompt)

Build a single-screen, visionOS-style virtual try-on hero called **VirtualFit**.

- **Scene:** a softly blurred bright living room fills the screen. A man stands in the centre, cut off at mid-thigh, in front of a huge ghosted `FIT` word.
- **Garment arc:** frosted-glass garment cards curve around him in a 3D arc. They recede, shrink, tilt and blur toward the edges and bob gently. You can drag, flick, scroll, use the arrow keys or buttons, or click a card.
- **Try-on:** when the arc settles on a garment, a glowing horizontal scan line sweeps down the model with a faint scan-line grid and reveals him wearing that garment.
- **Controls:** a glass pill tab bar sits at the top, a glass tool rail on the left, and a glass buy card at the bottom (thumbnail, rolling name and price, size chips and colour dots).
- **Cursor:** a 58px glass cursor reads `TRY ON` over cards and `DRAG` over empty space.

Use plain HTML, CSS and vanilla JS in one file, with no libraries. Reproduce every value, string, timing, URL and SVG exactly. Where this prompt gives a value, do not substitute your own.

---

## 1. Page basics

- `<!doctype html>`, `<html lang="en">`, `<meta charset="utf-8">`, title `VirtualFit: Spatial Try-On`, viewport `width=device-width,initial-scale=1`.
- **Font:** Inter 400, 500, 600, 700, 800 and 900 from `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap`, with preconnects to `https://fonts.googleapis.com` and `https://fonts.gstatic.com` (crossorigin).
- **Reset:** `*{box-sizing:border-box;margin:0;padding:0}`. `html,body{height:100%}`.
- **`body`:** background `#e9e4dc`, colour `#fff`, `font-family:var(--sans)`, `overflow:hidden`, `-webkit-font-smoothing:antialiased`, `-moz-osx-font-smoothing:grayscale`, `user-select:none` (and `-webkit-user-select:none`).
- **Buttons:** `font:inherit; color:inherit; background:none; border:0; cursor:pointer`.
- On `@media (pointer:fine)`: `cursor:none` on `html`, `body` and `button`.
- **CSS variables on `:root`:**
  - `--ease:cubic-bezier(.2,.8,.2,1)`
  - `--sans:"Inter",system-ui,-apple-system,sans-serif`
  - `--MH:min(78vh,62vw)` (model height); inside `@media (max-width:767px)` it becomes `min(62vh,128vw)`
  - `--CW:200px` as a placeholder; JS overwrites it (section 4.6)
  - `--room`, `--model`, `--garm`: the three `url("…")` values in section 2

## 2. Assets (use these exact URLs)

| Variable | URL | What it is |
|---|---|---|
| `--room` | `https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261104_080623_c94c85a3-23d5-4a0c-afff-41be1b5b8191.png&w=2400&q=85` | Bright Scandinavian living room, 16:9. |
| `--model` | `https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261104_080717_e02cb856-b812-4c9b-9b86-8a741c7f65eb.png&w=2688&q=85` | Transparent sheet, 2688×1520: the same man five times side by side, head to mid-thigh, in a white crew tee, an oversized white sweatshirt, a white linen shirt, a heather-grey hoodie, and a white ringer tee with black trims. |
| `--garm` | `https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261104_080719_f5a4cca2-cf42-4957-ab3b-ddec34d2b71a.png&w=2048&q=85` | Transparent ghost-mannequin sheet, 2048×1360, 3×2 grid. Top row: white tee, white sweatshirt, white linen shirt. Bottom row: grey hoodie, ringer tee, navy tee (unused). |

**Crops:**
- **Model:** each figure is a 524×1360 window of the model sheet: `background-size:513% 111.76%`, `background-position-y:100%`, `no-repeat`; `background-position-x` comes from the item's `m`.
- **Garments:** each is a 640×640 box of the garment sheet: `background-size:320% 212.5%`, `no-repeat`; `background-position` comes from the item's `g`.

## 3. Data

```js
const ITEMS=[
  {n:"Basic T-shirt", p:45,  g:[1.14,3.06],  m:.37,   c:[["White","#f4f2ee"],["Ash","#c9c7c2"],["Charcoal","#3b3c3f"],["Navy","#27324d"]]},
  {n:"Basic Sweater", p:105, g:[49.7,1.39],  m:25.0,  c:[["White","#f6f4ef"],["Oat","#ddd3c2"],["Sage","#b9c2ae"],["Black","#1f1f21"]]},
  {n:"Linen Shirt",   p:95,  g:[98.2,3.33],  m:49.86, c:[["White","#f7f6f1"],["Sand","#d9ccb4"],["Sky","#bcd0e2"],["Olive","#717556"]]},
  {n:"Grey Hoodie",   p:110, g:[1.14,93.3],  m:74.77, c:[["Heather","#a9a9a8"],["Bone","#e6e1d6"],["Forest","#33463a"],["Black","#1f1f21"]]},
  {n:"Ringer Tee",    p:55,  g:[49.7,95.3],  m:99.35, c:[["White / Black","#f4f2ee"],["Cream / Navy","#efe6d3"],["Grey / Red","#c9c7c2"],["White / Green","#e9efe8"]]},
];
```

- `g` is the garment `background-position` (x%, y%). `m` is the model `background-position-x` (%).
- There are `N = 10` cards (card `i` shows `ITEMS[i % 5]`), so the arc loops seamlessly. `HALF = 5`.
- Helper: `mod(a,n) = ((a % n) + n) % n`.

## 4. Layers and styling (DOM order)

1. **`.room`** (`position:fixed; inset:-3%; z-index:0`): `var(--room) center/cover no-repeat`, `filter:blur(2.5px) saturate(1.05)`, `transform:scale(1.08)`, `will-change:transform`. Its `::after` (absolute, inset 0) is `radial-gradient(70% 60% at 50% 45%, rgba(255,252,246,.10), rgba(40,30,20,.16))`.
2. **`.ghost`** (`position:fixed; z-index:2; pointer-events:none; white-space:nowrap; aria-hidden="true"`): the word `FIT`, each letter in its own `<span>` with `display:inline-block`.
   - Position: `left:50%`, `top:calc(50% - var(--MH)*.42)`, `transform:translateX(-50%)` (JS overwrites it, see section 5).
   - Font: Inter 900, `font-size:calc(var(--MH)*.42)`, `line-height:.8`, `letter-spacing:-.04em`.
   - Colour `rgba(255,255,255,.3)`, `-webkit-text-stroke:1px rgba(255,255,255,.35)`, `text-shadow:0 1px 0 rgba(255,255,255,.35)`.
3. **Glass material `.glass`** (used by the tabs, rail, arrows, cards and buy card):
   - `background:linear-gradient(155deg, rgba(250,248,245,.30), rgba(150,144,136,.20) 48%, rgba(205,200,192,.24))`
   - `backdrop-filter:blur(22px) saturate(1.5)` (plus the `-webkit-` prefix)
   - `border:1px solid rgba(255,255,255,.5)`
   - `box-shadow:inset 0 1px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(255,255,255,.12), 0 20px 50px -24px rgba(40,30,20,.45)`
4. **Tabs `<nav class="tabs glass">`:**
   - Layout: `position:fixed; left:50%; top:4.2vh; transform:translateX(-50%); z-index:30; display:flex; gap:2px; padding:5px; border-radius:999px`.
   - Children, in order: a `<div class="pill">`, then buttons `Tops` (class `on`), `Bottoms`, `Outerwear`, `Shoes`, `Accessories`.
   - Buttons: `position:relative; z-index:1; height:38px; padding:0 22px; border-radius:999px; white-space:nowrap`, Inter 500 14px, colour `rgba(30,30,32,.72)`, `transition:color .4s var(--ease)`. The `.on` button is `#111`.
   - Pill: `position:absolute; left:0; top:5px; height:38px; border-radius:999px; z-index:0; background:rgba(255,255,255,.92); box-shadow:0 4px 14px -6px rgba(0,0,0,.3); transition:transform .6s var(--ease), width .6s var(--ease)`. JS sets `transform:translateX(<active.offsetLeft>px)` and `width:<active.offsetWidth>px`. On load, on resize and after `document.fonts.ready`, place it without the transition (set `transition:none`, apply, force a reflow, then clear the inline transition).
5. **Rail `<aside class="rail glass">`:**
   - Layout: `position:fixed; left:max(18px,1.8vw); top:50%; transform:translateY(-50%); z-index:30; display:flex; flex-direction:column; gap:10px; padding:8px; border-radius:999px`.
   - Four buttons, each `42px` round, `display:grid; place-items:center`, colour `rgba(30,30,32,.8)`, `transition:background .35s var(--ease), color .35s var(--ease)`; `:hover` background `rgba(255,255,255,.35)`. The first (`.on`) has background `rgba(255,255,255,.9)` and colour `#111`. Icons are 20×20 SVGs:
     - Wardrobe (`aria-label="Wardrobe"`, active):
       `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.6 3.2c.2-.1.5-.1.7.1.7.8 1.6 1.2 2.7 1.2s2-.4 2.7-1.2c.2-.2.5-.2.7-.1l5.3 2.6c.4.2.6.7.4 1.1l-1.5 3.6c-.2.4-.6.6-1 .5L17.5 10.6V20c0 .6-.4 1-1 1h-9c-.6 0-1-.4-1-1v-9.4l-1.6.4c-.4.1-.8-.1-1-.5L2.4 6.9c-.2-.4 0-.9.4-1.1z"/></svg>`
     - Cart (`aria-label="Cart"`):
       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.2 10.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/></svg>`
     - Calendar (`aria-label="Calendar"`):
       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`
     - Profile (`aria-label="Profile"`):
       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>`
6. **Stage `<main class="stage">`** (`position:fixed; inset:0; z-index:10; touch-action:pan-y`) holds `.arc` (`position:absolute; left:50%; top:50%; width:0; height:0`). The arc origin is exactly the screen centre.
   - Each card is `<div class="card glass" data-i="i">`: `position:absolute; left:calc(var(--CW)*-.5); top:calc(var(--CW)*-.71); width:var(--CW); height:calc(var(--CW)*1.42); border-radius:22px; overflow:hidden; will-change:transform,opacity`.
   - Inside each card, in order:
     - `.g` garment: `position:absolute; left:8%; right:8%; top:5%; height:66%`, garment crop for the item, `filter:drop-shadow(0 14px 14px rgba(40,30,20,.22))`.
     - `.nm` name: absolute, left/right 0, centred, `bottom:17%`, Inter 500 at `calc(var(--CW)*.068)`.
     - `.pr` price `$NN`: absolute, left/right 0, centred, `bottom:7%`, Inter 700 at `calc(var(--CW)*.095)`.
     - Name and price: white, `white-space:nowrap`, `text-shadow:0 1px 8px rgba(0,0,0,.18)`. `.g`, `.nm`, `.pr` and `.sheen` all have `pointer-events:none`.
     - `.sheen`: absolute, inset 0, `linear-gradient(105deg, transparent 40%, rgba(255,255,255,.5) 50%, transparent 60%)`, resting at `transform:translateX(-110%)`. On the card's `pointerenter` (mouse only, not under reduced motion) animate it `translateX(-110%)` → `translateX(110%)` over 1000ms with `--ease`.
   - `CW` (set by JS on `--CW` in px): `min(innerWidth*.148, innerHeight*.33)`, or `min(innerWidth*.30, 170)` when `innerWidth < 768`.
7. **Model `.model`** (`position:fixed; left:50%; bottom:0; height:var(--MH); aspect-ratio:524/1360; transform:translateX(-50%); z-index:50; pointer-events:none`). Children, in order:
   - `#mCur.fig`: the current outfit. `.fig` = absolute, inset 0, model crop. Starts at `opacity:0`.
   - `#mNext.fig`: the next outfit, `clip-path:inset(0 0 100% 0)`, `transform-origin:50% 100%`.
   - `.grid`: absolute, inset 0, `repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,.22) 5px 6px)`, `mix-blend-mode:screen`, `clip-path:inset(0 0 100% 0)`. It is masked to the figure's silhouette: `mask:var(--model) no-repeat; mask-size:513% 111.76%; mask-position-y:100%` (plus `-webkit-` versions); JS sets `mask-position-x` to the item's `m%` on every try-on.
   - `.scan`: `position:absolute; left:-14%; width:128%; top:0; height:2px; margin-top:-1px; opacity:0; transform:scaleX(.2)`, `background:linear-gradient(90deg, transparent, #fff 18%, #fff 82%, transparent)`, `box-shadow:0 0 18px 4px rgba(255,255,255,.75), 0 0 60px 10px rgba(190,225,255,.45)`. Its `::after`: absolute, `left:10%; right:10%; bottom:100%; height:calc(var(--MH)*.12); background:linear-gradient(to top, rgba(220,238,255,.32), transparent)`.
8. **Arrows:** two `<button class="arrow glass">`: `position:fixed; top:50%; transform:translateY(-50%); z-index:40; width:46px; height:46px; border-radius:50%; display:grid; place-items:center; color:#222; transition:transform .35s var(--ease)`; `:active` → `translateY(-50%) scale(.92)`. SVGs are 16×16, `viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`.
   - `.prev` (`aria-label="Previous"`) at `left:calc(max(18px,1.8vw) + 76px)`, path `M10 3 5 8l5 5`.
   - `.next` (`aria-label="Next"`) at `right:max(18px,1.8vw)`, path `m6 3 5 5-5 5`.
9. **Buy card `<section class="buy glass">`:**
   - Layout: `position:fixed; left:50%; bottom:4.6vh; transform:translateX(-50%); z-index:60; width:min(640px, calc(100vw - 32px)); display:flex; align-items:center; gap:22px; padding:12px 22px 12px 12px; border-radius:24px; color:#fff; text-shadow:0 1px 6px rgba(0,0,0,.18)`.
   - **Thumbnail `.thumb`:** `64px` square, `flex:none`, radius 14px, background `rgba(255,255,255,.3)`, `overflow:hidden`. Inner `.tg` is absolute with `inset:6px` and the garment crop.
   - **Info `.info`** (`flex:1; min-width:0`): name `.ln` in Inter 600 16px; price `.ln` in Inter 500 14px at `opacity:.9` with `margin-top:4px`.
   - **Rolling masks `.ln`:** `position:relative; display:block; height:1.15em; line-height:1.15em; overflow:hidden`. Each holds one `<span>` (`position:absolute; left:0; top:0; white-space:nowrap`).
   - **Size group:** label `Size` (`.lbl`: Inter 500 12px, `opacity:.85`, `margin-bottom:6px`), then a flex row (gap 6px) of buttons `S` `M` `L` `XL`: 30px round, background `rgba(255,255,255,.22)`, white, Inter 600 11px, no text-shadow, `transition:background .35s, color .35s, transform .2s` (all `--ease`). `.on` (`M` at start) is `#fff` with `#111` text. `:active` scales to .9.
   - **Colour group** (`width:150px; flex:none`): a `.lbl.ln` label reading `Color · <name>` (150px wide), then `.dots`: flex row, `gap:9px`, `padding:6px 0 6px 2px`, of 18px round buttons filled with the item's colours, `box-shadow:0 0 0 1px rgba(0,0,0,.08)`, `transition:box-shadow .35s var(--ease), transform .2s var(--ease)`; `:active` scales to .88. The `.on` dot has `box-shadow:0 0 0 2px rgba(255,255,255,.95), 0 0 0 4px rgba(0,0,0,.12)`. Each dot has `aria-label` set to the colour name.
10. **Cursor `.cur`** (last element in body; `position:fixed; left:0; top:0; width:58px; height:58px; z-index:100; pointer-events:none; opacity:0; transition:opacity .3s`; `.show` sets opacity 1; `display:none` under `@media not (pointer:fine)`):
    - `.ring`: absolute, inset 0, round, `border:1.5px solid rgba(255,255,255,.95)`, `background:rgba(255,255,255,.14)`, `backdrop-filter:blur(6px)`, `box-shadow:0 6px 20px -8px rgba(0,0,0,.35)`, `transition:transform .5s var(--ease), background .5s var(--ease)`.
    - `.dot`: 6px white circle at `left:26px; top:26px`, `transition:transform .4s var(--ease), opacity .4s var(--ease)`.
    - Labels `.t1` `TRY ON` (#111) and `.t2` `DRAG` (white, `text-shadow:0 1px 6px rgba(0,0,0,.25)`): absolute, inset 0, centred, Inter 700 10px, `letter-spacing:.12em; padding-left:.12em`, hidden at `opacity:0; transform:scale(.5)`, `transition:transform .45s var(--ease), opacity .45s var(--ease)`.
    - States (classes on `.cur`, at most one of `try`/`drag`/`btn`, plus `down`):
      - `down`: ring `scale(1.05)`.
      - `btn`: ring `scale(.6)`.
      - `drag`: ring `scale(1.2)`; dot hidden (`scale(0)`, opacity 0); `.t2` shown (`scale(1)`, opacity 1).
      - `try`: ring `scale(1.5)` with background `rgba(255,255,255,.92)`; dot hidden; `.t1` shown; `.t2` hidden.
    - The state is `drag` while a drag has moved 6px or more; otherwise from the element under the pointer: inside `.card` → `try`; inside a `button` → `btn`; inside `.stage` → `drag`; else none.
    - It follows the pointer each frame with `pos += (target − pos) × .22`, applied as `transform:translate(x − 29px, y − 29px)`. It only tracks `pointerType === "mouse"`; it appears on the first mouse move (snapping to the pointer) and hides when the pointer leaves the document. `pointerdown` anywhere adds `down`; `pointerup` removes it.

## 5. Arc maths (every animation frame)

**State:** `pos` (float), `target` (int, unbounded), `intro` (0 → 1), `shown = -1` (the item currently worn). When not dragging, `pos += (target − pos) × .11`.

**Card offset:** for card `i`, `u = mod(i − pos + 5, 10) − 5`. Let `a = |u|` and `sg = sign(u)`.

**Horizontal placement:**
- Table `XS = [0, .215, .345, .432, .49, .52] × innerWidth` (when `innerWidth < 768`: `[0, .36, .5, .56, .6, .62] × innerWidth`). Recompute on resize.
- `xAt(a)`: `i = min(floor(a), 4)`, `f = min(a − i, 1)`, return `XS[i] + (XS[i+1] − XS[i]) × f`.
- `x = sg × xAt(a) × ie`, where `ie` is the intro ease (below).

**Per-card values:**
- **Behind the model** (`a < 1`): `s = .55 + .45a`, `z = −260(1 − a)`, opacity `a`, `ry = −sg × 16a`, no blur.
- **Otherwise:** `s = 1 / (1 + .3(a − 1)^1.15)`, `z = −110(a − 1)`, opacity 1, `ry = −sg × (16 + 9 × min(2, a − 1))`, blur `max(0, a − 1.6) × 2.4` px.
- **Far edge** (`a > 3.4`): opacity `max(0, 1 − (a − 3.4)/.8)`.
- **Bob:** card `i` has `seed = i × 1.7 + .3`; `bob = sin(t × 1.1 + seed) × innerHeight × .006 × min(1, a)` where `t` is seconds since load. `y = bob − (1 − s) × innerHeight × .04`.
- **Pointer tilt:** `ry += sx × 10`. `sx`/`sy` are smoothed each frame toward `clientX/innerWidth − .5` and `clientY/innerHeight − .5` (updated on any `pointermove`) with `sx += (tx − sx) × .06`.

**Transform:** `translate(x px, y px) perspective(1300px) translateZ(z px) rotateY(ry deg) rotateX(−sy × 6 deg) scale(s × (.6 + .4ie))`. Each card carries its own perspective; there is no shared `preserve-3d` scene, which keeps the backdrop blur from flickering.

**Stacking and visibility:** `z-index` is 1 when `a < 1`, otherwise `round(100 − 10a)`. Card opacity is multiplied by `ie`. `filter` is `blur(<blur>px)` (2 decimals) when blur > .05, otherwise `none`. `visibility:hidden` when final opacity < .01.

**Intro:** `intro = min(1, intro + .012)` per frame, `ie = 1 − (1 − intro)³`.

**Parallax:**
- Room: `translate3d(−sx × 22px, −sy × 14px, 0) scale(1.08 − .03ie)`.
- Ghost word: `translate(calc(−50% − sx × 40px), −sy × 16px)`.
- Ghost letters rise in: letter `i` gets `translateY((1 − ie)(60 + 30i)px)`.

**Settle:** when not dragging and `|target − pos| < .02`, compute `k = mod(round(target), 5)`; if `k ≠ shown`, run try-on for item `k`. (On load this fires on the first frame for item 0.)

## 6. Try-on scan (950 ms, `cubic-bezier(.65,0,.35,1)`)

1. Set `shown = k`, update the buy card (section 7), cancel any running scan animations, set `#mNext` `background-position-x` to `m%`, and set the grid's `mask-position-x` to `m%`.
2. Run these Web Animations together:
   - **`#mNext` clip:** `inset(0 0 100% 0)` → `inset(0 0 0% 0)`, 950ms, scan easing, fill forwards.
   - **`.grid` clip:** `inset(0 0 100% 0)` → `inset(0 0 0 0)` at offset .5 → `inset(100% 0 0 0)`, 1092ms, scan easing, fill forwards.
   - **`.scan`:** `{top:0%, scaleX(.2), opacity 0}` → `{top:6%, scaleX(1), opacity 1}` at .08 → `{top:94%, scaleX(1), opacity 1}` at .92 → `{top:100%, scaleX(.2), opacity 0}`, 950ms, scan easing, fill forwards.
   - **`#mNext` settle:** `scale(1.012)` → `scale(1)`, 1250ms, `ease-out`.
3. When the clip animation finishes, set `#mCur` to the same figure with `opacity:1`, then cancel all four animations.

On load `#mCur` is hidden, so the first scan reveals the model from nothing.

## 7. Buy card updates

- **Roll** (name, `$price`, and `Color · <name>`): if the text is unchanged, do nothing. Remove any leftover spans except the last. If the mask was empty or reduced motion is on, just set the text. Otherwise append a new span; animate the old one `translateY(0)` → `translateY(−110%)` (fill forwards, remove it on finish) and the new one `translateY(110%)` → `translateY(0)`, both 620ms `cubic-bezier(.2,.8,.2,1)`.
- **Thumbnail:** set the new garment crop, then animate `.tg` from `translateY(70%) scale(.8)` to `none` over 650ms with `--ease`.
- **Colour dots:** rebuild from the item's colours with the first one `.on`, and roll the label to the first colour. Clicking a dot makes it the only `.on` dot and rolls the label to `Color · <name>`.
- **Size chips:** clicking one makes it the only `.on` chip.

## 8. Input

- **Drag:** primary-button `pointerdown` on the stage starts a drag: store `p0 = pos`, start x/y, `moved = 0`, `vel = 0`, the card under the pointer (if any), and call `setPointerCapture`. On `pointermove`: `dx = clientX − startX`; `moved = max(moved, hypot(dx, dy))`; `pos = p0 − dx / XS[1]`; velocity in px/ms smoothed as `vel = vel × .6 + (Δx / max(1, Δt)) × .4`.
- **Release** (`pointerup`/`pointercancel`): if the last move was more than 90ms ago, set `vel = 0`. If `moved < 6` and the drag started on a card `c`: `u = mod(c − pos + 5, 10) − 5`, `target = round(pos + u)` (that card comes to the centre). Otherwise `target = round(pos − vel × 3.2)`.
- **Wheel** (on `window`, `passive:false`, `preventDefault`): use `deltaX` if `|deltaX| > |deltaY|`, else `deltaY`; add it to an accumulator. When `|acc| > 60` and at least 260ms have passed since the last step, step by `sign(acc)` and reset the accumulator.
- **Keys and buttons:** `ArrowLeft` / prev button → `target = round(target) − 1`; `ArrowRight` / next button → `target = round(target) + 1`. Prevent default for the arrow keys.
- **Tabs:** clicking a tab that is not already active makes it `.on`, slides the pill to it, and adds 5 to `target`, so the arc does a full lap and lands back on the same garment. Clicking the active tab does nothing.

## 9. Phones (≤767px) and reduced motion

- **Phones** (`@media (max-width:767px)`):
  - Tabs: `max-width:calc(100vw − 24px); overflow-x:auto`, scrollbar hidden; buttons `height:32px; padding:0 13px; font-size:12px`; pill `height:32px`.
  - Rail: `left:10px; top:auto; bottom:calc(4.6vh + 150px); transform:none; padding:6px; gap:6px`; buttons 34px; icons 17px.
  - Arrows: `display:none`.
  - Buy card: `flex-wrap:wrap; gap:12px 16px; padding:12px`; `.info` is `flex:1 1 calc(100% − 80px)` (thumbnail and info on line one); the size and colour groups share line two (`flex:1 1 auto`, colour label 140px wide).
- **Reduced motion** (`prefers-reduced-motion: reduce`):
  - `pos` snaps straight to `target` (also on drag release) and `intro` starts at 1.
  - No bob and no sheen.
  - The scan is skipped: `#mCur` swaps to the new figure instantly.
  - The buy card text and thumbnail change without animation.
