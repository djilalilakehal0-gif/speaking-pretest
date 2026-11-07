# Maison Kaftan — Luxury 3D Kaftan Boutique

An online store for luxury kaftans built around a 3D boutique. Five 3D fashion figures, one per kaftan,
stand one behind another along a diagonal aisle. Each one can be selected, moved forward and back, and
turned between 0° and 260° on its own. A product panel, a collection with filters, product pages, a cart
and a demo checkout complete the store.

> **Demo content.** Brand name, prices, stock, sizes, materials, contact details and copy are editable
> sample data, labelled "demo" in the interface. No payment provider is connected.

- [`REFERENCE-MAP.md`](REFERENCE-MAP.md): which reference images belong to which outfit, the assumptions, and the model production plan
- [`REPORT.md`](REPORT.md): what is complete, what is demo-only, what is needed from the store owner, known limitations
- [`public/models/COMPRESSION.md`](public/models/COMPRESSION.md): compression settings and file sizes
- [`scripts/model-report.json`](scripts/model-report.json): validation of each GLB (bounds, floor contact, triangles)

## Stack

React 19 + TypeScript · Vite 6 · Three.js + React Three Fiber + Drei · GSAP · Tailwind CSS 4 ·
Blender 5.2 (bpy) for the 3D models · glTF-Transform (Meshopt) for compression · Playwright for tests.

## Run

```bash
cd kaftan-boutique
npm install
npm run dev          # http://localhost:5970
npm run build        # type-check + production build in dist/
npm run preview      # serve dist/
npm run test:e2e     # acceptance tests in Chromium (run after npm run build)
```

The build uses a relative base (`./`) and hash routes (`#/collection`), so `dist/` works from any
sub-folder or static host without server rewrites.

## Pages

| Route | Page |
|---|---|
| `#/` | Home: the 3D boutique full-screen, brand intro, SHOP COLLECTION, the collection |
| `#/boutique` | The 3D boutique on its own |
| `#/collection` | All kaftans, filters (colour, sleeve, size, ready to ship), sorting; `?wishlist=1` shows the wishlist |
| `#/new-arrivals`, `#/best-sellers` | Curated collections |
| `#/product/<slug>` | Live 3D viewer, studio photographs (front, ¾, back), size, colour, quantity, wishlist, ADD TO CART |
| `#/about`, `#/contact` | Brand story and contact (placeholders) |
| `#/cart`, `#/checkout` | Cart with editable lines and a demo checkout |

## 3D boutique controls

| Control | Pointer / touch | Buttons | Keyboard (scene focused) |
|---|---|---|---|
| Select a model | click / tap it | lineup chips at the bottom | `1`–`5` |
| Move forward / back | — | MOVE FORWARD, MOVE BACKWARD, RESET POSITION | `↑` `↓` |
| Rotate 0–260° | drag on the selected model | slider, ROTATE LEFT/RIGHT (15°), RESET ROTATION | `←` `→` |
| Camera | drag empty space to orbit, wheel / pinch to zoom | ZOOM IN, ZOOM OUT, FOCUS, RESET CAMERA | `Esc` deselects and resets |

Each model keeps its own position and angle (saved for the browser session). Controls write only the
selected model's state; a neighbour can block a move (models never pass through each other), but it is
never pushed. Movement stays within ±0.7 m of the model's spot and at least 1 m from its neighbours. The
orbit camera cannot go below the floor or inside a model.

## Project structure

```
kaftan-boutique/
  public/
    models/              kaftan-model-01…05.glb (Meshopt) + COMPRESSION.md
    images/products/     studio renders (front, three-quarter, back) used as product photography
    textures/            satin-weave normal map (embedded in each GLB)
  blender/               kaftan-model-01…05.blend — Blender sources (not deployed)
  scripts/
    generate_kaftans.py  Blender generator: builds, validates and exports every model + renders
    compress-models.mjs  glTF-Transform Meshopt compression + compression record
    e2e.mjs              acceptance tests (Playwright)
    model-report.json    per-model validation output
  src/
    components/          BoutiqueScene, ModelStage, ModelControls, ProductPanel, ProductCard,
                         CartDrawer, Navigation, ModelViewer, Lineup, three/ (room, lights, camera)
    data/products.ts     the catalogue and store settings — edit this file to change products
    hooks/useModelControls.ts   independent per-model state (position, rotation, selection)
    lib/layout.ts        aisle geometry, movement and rotation limits, default camera
    pages/               Home, Boutique, Collection, Product, About, Contact, Cart, Checkout
    store/cart.tsx       cart + wishlist (localStorage)
```

## Editing the catalogue

All product data lives in [`src/data/products.ts`](src/data/products.ts): name, price, description,
material, sizes, sold-out sizes, colours, stock status, New Arrival / Best Seller flags, the GLB, the
photographs and the position in the aisle (`boutiqueSlot`). `STORE` holds the brand name, currency,
locale and contact details. When real data arrives, replace the values and set `STORE.demo` to `false`,
then remove the `demo` tags from `ProductPurchase.tsx`.

## Replacing or adding a 3D model

A GLB must follow the same conventions so it drops straight into the boutique:

- metres, real scale (about 1.7–1.8 m tall), Y-up, facing +Z;
- origin on the floor, centred between the feet; nothing below y = 0;
- a full 3D character (front, sides and back), PBR materials, textures embedded;
- under ~100 k triangles and ~1 MB after compression.

Steps:

1. Put the file at `public/models/kaftan-model-0N.glb` (replace an existing one, or add a new number).
2. `npm run models:compress` (Meshopt; skip it if the file is already compressed).
3. Add or update the product in `src/data/products.ts` (`model`, `images`, `boutiqueSlot`). For a sixth
   model, the aisle spacing adapts automatically (`src/lib/layout.ts`); check that `SLOT_SPACING` stays
   above `MIN_GAP`.
4. Product photographs: drop `<slug>-front.webp`, `<slug>-three-quarter.webp` and `<slug>-back.webp` into
   `public/images/products/` (900 × 1200 recommended).

### Regenerating the procedural models

```bash
python3 -m venv .venv && .venv/bin/pip install bpy pillow numpy   # Blender 5.2 as a Python module
npm run models                                    # build + validate + render + compress (≈ 8 min on CPU)
.venv/bin/python scripts/generate_kaftans.py --no-render --only 03 && npm run models:compress
```

Garment shapes, colours and trims are set in the `OUTFITS` list at the top of the script. Each run also
writes the `.blend` sources and `scripts/model-report.json`.

## Deployment

`npm run build` produces a static site in `dist/` (about 2 MB of models, loaded lazily). Host it on any
static host (GitHub Pages, Cloudflare Pages, Netlify, S3). To publish it with the repository's existing
GitHub Pages workflow, add a step like the NAPOLITIME one in `.github/workflows/pages.yml`:

```yaml
      - name: Build and add the kaftan boutique
        run: |
          cd kaftan-boutique
          npm ci
          npm run build
          cd "$GITHUB_WORKSPACE"
          mkdir -p _site/kaftan-boutique
          cp -r kaftan-boutique/dist/. _site/kaftan-boutique/
```

The site would then be served at `https://<user>.github.io/speaking-pretest/kaftan-boutique/`. This step
is not added yet so that nothing is published without the owner's decision.

## Performance and accessibility

- Three.js code and every GLB load only on the 3D pages (route-level code splitting, `React.lazy`).
- Models are shared between views (one GPU copy) and disposed one minute after leaving the 3D pages.
- One shadow-casting light; per-model spotlights without shadows; instanced shelf textiles; floor
  reflections on desktop only; lower pixel ratio and shadow resolution on touch devices.
- No WebGL → studio photographs instead of the scene. `prefers-reduced-motion` → no camera flights or
  glides. All shopping actions and all model controls work from the keyboard, with labelled buttons.
