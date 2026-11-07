# Delivery report — Luxury 3D Kaftan Boutique

## How the brief was processed

The brief PDF was converted to Markdown with `markitdown` and only the converted text was used. The
seven reference photographs it lists under `/mnt/data/` **were not available** in the build environment,
so the garments were defined from the captions and file names in the brief (see
[`REFERENCE-MAP.md`](REFERENCE-MAP.md)). This is the main limitation of the delivery and is explained below.

## Complete

| Brief item | Where |
|---|---|
| Repository audit; new project added beside the existing ones without touching them | `kaftan-boutique/` (the repo holds independent sites: `www/`, `djilali/`, `napolitime/`, `portfolio/`) |
| Garment-reference map: 7 references → 5 distinct outfits (02, 03, 05 grouped as one) | `REFERENCE-MAP.md` |
| Model production plan, missing views, workflow choice | `REFERENCE-MAP.md` §4 |
| One GLB per distinct outfit, same scale / origin / floor contact / facing | `public/models/kaftan-model-01…05.glb` |
| Full 3D characters (body, hands, feet, head, hair) wearing 3D kaftans; front, sides and back modelled; no planes, cutouts or billboards | `scripts/generate_kaftans.py` |
| PBR satin (sheen, roughness, specular, weave normal map), brushed gold | GLB materials |
| Blender sources | `blender/*.blend` |
| Validation in Blender (bounds, height 1.746 m, floor contact, centring, triangles 62–81 k) and in the browser | `scripts/model-report.json`, `scripts/e2e.mjs` |
| Compression (Meshopt) and its record: 1.4–1.9 MB → 350–455 KB per model | `public/models/COMPRESSION.md` |
| Boutique environment: polished stone floor with reflections, plaster walls, arched niches with shelves, wood and brass shelving with folded textiles (instanced), brass garment rail, mirror, velvet ottoman, side table, pendant lights, warm spotlights, soft shadows | `src/components/three/BoutiqueRoom.tsx`, `SceneLighting.tsx` |
| Five models one behind another on a diagonal aisle, each with its own spotlight and brass floor marker, all visible from the default camera | `src/lib/layout.ts`, `ModelStage.tsx` |
| Independent per-model state; MOVE FORWARD / BACKWARD / RESET POSITION with wall and neighbour limits | `src/hooks/useModelControls.ts`, `ModelControls.tsx` |
| Rotation exactly 0–260°: drag, slider, ROTATE LEFT/RIGHT, RESET ROTATION, angle shown in degrees, state kept per product | same |
| Camera: zoom in/out, focus selected (hero framing), reset; orbit limits (no going under the floor or inside a model); touch drag + pinch | `three/CameraRig.tsx` |
| Product panel: name, price, description, material, sizes, colours, stock, photographs, live 3D, size/colour/quantity, wishlist, ADD TO CART | `ProductPanel.tsx`, `ProductPurchase.tsx` |
| Cart: edit size, quantity, remove, subtotal, checkout path | `CartDrawer.tsx`, `pages/Cart.tsx`, `pages/Checkout.tsx` |
| Pages: Home, Collection (filters + sort), New Arrivals, Best Sellers, Product, About, Contact, Cart, Checkout, 3D Boutique | `src/pages/` |
| Product data in one editable file | `src/data/products.ts` |
| Lazy loading (route splitting, lazy GLBs, loading states), GPU disposal, WebGL fallback, reduced motion, keyboard access | see README "Performance and accessibility" |
| README (setup, run, build, asset replacement, deployment) | `README.md` |

## Acceptance tests (brief §9)

`npm run build && npm run test:e2e` runs 30 checks in Chromium (desktop 1440 × 900 and iPhone 13
emulation, software WebGL). Results of the last run are listed at the end of this file.

| Brief test | Covered by |
|---|---|
| Every distinct outfit has a separate valid GLB that loads in the scene | 5 GLBs requested (HTTP 200) and parsed into the scene |
| Full 3D characters, front/side/rear modelled | geometry from the generator; rear verified at 180° in the renders and the scene |
| One-behind-another arrangement | default camera screenshot |
| Selecting/controlling one model never changes another | state of the 4 other models compared before and after rotate and move |
| Forward/backward work and respect boundaries | moves until disabled; neighbour gap never below 1.0 m |
| Rotation slider, drag, left/right, reset; stop at 260° | slider End key, long drag, button disabled at 260° |
| Camera zoom, focus, reset on desktop and touch | zoom/focus distances; two-finger pinch via touch events |
| Product details, size/colour, cart with demo data | add to cart (size required), quantity, size edit, subtotal, demo checkout |
| No severe clipping, floating feet, broken materials | floor contact in `model-report.json`; visual review of renders and screenshots |
| Usable on mobile | no horizontal scroll, 44 px controls, bottom-sheet panel |

## Demo-only (clearly labelled in the interface)

- Brand name "Maison Kaftan", all prices (tagged "Demo price"), stock levels, sold-out sizes, materials,
  New Arrival / Best Seller flags, product copy, About text, contact details.
- Checkout: records a local demo order; **no payment is taken and no card data is collected**.
- Contact form: shows a confirmation, sends nothing.
- Product photographs are studio renders of the 3D models, not photographs of real garments.

## External services / keys required

None are used now. To go live the store owner must supply:

- a payment provider (e.g. Stripe, PayPal, a local acquirer) with its keys and business rules;
- shipping zones and prices, taxes, return policy;
- an email / form service for the contact form and order notifications;
- real product data (prices, stock, sizes, materials, size guide) and brand details;
- optionally a CMS or admin backend (the data shape in `products.ts` is ready to be fed from one).

## Limitations (honest assessment)

1. **The garments are not reconstructed from the photographs.** The reference images were not available,
   so each kaftan follows only its caption (colour, outfit type, off-shoulder, neck strap, inner belt,
   cape). Necklines, sleeves, trims and every side and back view are assumptions, listed in
   `REFERENCE-MAP.md` §3. The brief's production rule applies: the result must not be presented as an
   accurate copy of the reference garments.
2. **The figures are stylised boutique mannequins, not photoreal people.** They are complete 3D bodies
   with hands (mitten fingers with a thumb, to avoid distorted fingers), feet, a head with simple facial
   features and hair, but they do not have the realism of a scanned or sculpted character.
3. **Fabric is shaped, not simulated.** Folds are procedural; there is no cloth simulation, so drape is
   cleaner and more regular than real satin.
4. **The product count depends on an assumption:** if the photographs show that "chocolate" and "dark
   satin" (or the cape-drape) are the same garment, products must be merged.
5. **"Hero" selection is a camera move.** Selecting a model flies the camera to a hero framing of that
   model instead of moving the model out of the line. Moving it would change its position on selection
   and conflict with the acceptance test that selecting one model must not change any model's position.
6. Blender's Draco module is missing from the pip `bpy` build, so compression is done afterwards with
   glTF-Transform (Meshopt), which three.js decodes without a CDN.
7. The tests run on software WebGL (SwiftShader) in a headless browser. They have not been run on real
   phones or GPUs.

## Next steps

1. Send the seven reference photographs (and back and side views of references 01, 04, 06, 07).
2. Confirm or correct the garment map and the product count.
3. Replace the procedural garments with multi-view reconstructions or hand-modelled Blender garments
   using the same file names, scale and origin. The website needs no changes for this.
4. Supply real catalogue data, brand assets and the payment/shipping set-up.
5. Decide on hosting (a ready-made GitHub Pages step is in the README).

## Last test run

```
PASS  every distinct outfit has its own GLB and it loads in the 3D scene (5 loaded)
PASS  selecting a model opens its product panel
PASS  ROTATE RIGHT turns the selected model (3 × 15° = 45°)
PASS  ROTATE LEFT turns it back (30°)
PASS  slider stops at the 260° limit
PASS  ROTATE RIGHT is disabled at 260°
PASS  slider sets an exact angle (180°, rear view)
PASS  turning model 2 changes no other model
PASS  RESET ROTATION returns to 0°
PASS  dragging on the selected model turns it (54°)
PASS  dragging far never passes 260° (no full spin)
PASS  MOVE FORWARD moves the model and stops at its boundary (-0.58 m, blocked by its neighbour)
PASS  moving model 2 changes no other model
PASS  RESET POSITION returns it to its spot
PASS  two neighbours can never pass through each other (gap 1.00 m, min 1.0 m)
PASS  ZOOM IN / ZOOM OUT change the camera distance (7.55 → 5.44 → 9.50 m)
PASS  FOCUS frames the selected model (3.53 m)
PASS  orbit controls never take the camera beneath the floor
PASS  keyboard: 5 selects model 5, → rotates it
PASS  no runtime errors in the boutique
PASS  ADD TO CART asks for a size first
PASS  cart count shows 2 items
PASS  quantity change updates the subtotal (3 × 450 = €1,350.00)
PASS  cart line size can be edited
PASS  checkout path completes with a clearly labelled demo order
PASS  collection filters work
PASS  mobile: no horizontal scroll
PASS  mobile: thumb controls work (tap rotate)
PASS  mobile: controls are thumb-sized (≥ 44 px)
PASS  mobile: pinch-to-zoom moves the camera closer (4.46 → 1.30 m)

30/30 passed
```
