# Garment reference map and model production plan

## 1. Where the references came from

The brief lists seven reference images under `/mnt/data/…`. **Those files were not available in the
build environment** (`/mnt/data` does not exist here), and the brief was supplied as a PDF that was
converted to text with `markitdown`. Only the text was used, as instructed, so the garments were mapped
from the **captions** in section 12 of the brief and from the file names in section 11.

| # | Caption in the brief | File name in the brief |
|---|---|---|
| 01 | chocolate kaftan, front view | `file_00000000b4f481f4ba2594e5da6d9e89.png` |
| 02 | dark satin kaftan, side view | `file_00000000d25c81f4ae115dd3aa078692.png` |
| 03 | dark satin kaftan, alternate pose | `file_000000003d4c81f484dd560c393f861d.png` |
| 04 | burgundy kaftan, front view | `file_00000000ef6c81f4b5c23240c9460de8.png` |
| 05 | dark satin kaftan, alternate angle | `file_000000004b5082438e820bfacef387dc.png` |
| 06 | satin cape-drape kaftan | `satin-cape-drape-kaftanshopaleena-2986153.jpg` |
| 07 | red off-shoulder kaftan | `red-off-shoulder-kaftan-with-neck-strap-and-inner-beltshopaleena-247167.png` |

The order of the file names in section 11 is assumed to match the reference numbers in section 12.

## 2. Which references show the same outfit

| Outfit | References | GLB |
|---|---|---|
| Chocolate kaftan | 01 | `public/models/kaftan-model-01.glb` |
| Dark satin kaftan | 02, 03, 05 (side, alternate pose, alternate angle) | `public/models/kaftan-model-02.glb` |
| Burgundy kaftan | 04 | `public/models/kaftan-model-03.glb` |
| Satin cape-drape kaftan | 06 | `public/models/kaftan-model-04.glb` |
| Red off-shoulder kaftan | 07 | `public/models/kaftan-model-05.glb` |

**5 distinct outfits → 5 GLB files.** References 02, 03 and 05 share the caption "dark satin kaftan" and
are described as alternate views of it, so they are grouped as one product and not duplicated.

## 3. Assumptions (to check against the real photographs)

Because the photographs themselves could not be inspected, everything below is an assumption made from
the captions. Please confirm or correct it, ideally by sending the seven images to the session:

| Outfit | Stated in the caption | Assumed (not in the caption) |
|---|---|---|
| Chocolate | colour: chocolate; front view only | round neckline, bell sleeves, gold belt and gold edging, A-line floor length; side and back invented |
| Dark satin | dark satin, 3 views | espresso-black colour, V-neckline, wide sleeves, self-fabric belt |
| Burgundy | colour: burgundy; front view only | deep V with gold band, straight sleeves, gold cuffs and hem, gold belt; side and back invented |
| Cape-drape | satin, cape drape | champagne colour, open-front shoulder cape, fitted sleeves, gold belt |
| Red off-shoulder | red, off-shoulder, **neck strap** and **inner belt** (from the file name) | flared sleeves starting below the shoulder, thin gold-tone inner belt |

**Risks to the possible duplicates:** "chocolate kaftan" (01) and "dark satin kaftan" (02/03/05) could be
the same garment photographed in different light, and the cape-drape kaftan (06) could also be dark satin.
If the photographs show that, the product count drops and the extra GLBs should be removed from
`src/data/products.ts`.

## 4. Model production plan

| Step | What was done | Status |
|---|---|---|
| Workflow | Procedural modelling in Blender (bpy 5.2, `scripts/generate_kaftans.py`). An image-to-3D service was not used: no reference image was available to feed it, and the brief forbids claiming accuracy that the workflow cannot deliver. | done |
| Body | One shared female figure, 1.75 m: skin-modifier skeleton (torso, bust, arms, hands with thumbs, legs, heels, toes) + subdivision, separate head with tapered jaw, nose, ears, lips, brows and closed-eye lash lines; bun or long hair; gold sandals. Small pose variation per model (contrapposto side). | done |
| Garments | Revolved and swept surfaces with 4 mm thickness: A-line skirt with folds that grow towards the hem, waist, bust and shoulder shaping, five necklines, five sleeve types, cape, off-shoulder fold, neck strap, belts, gold trims. Front, sides and back are all modelled. | done |
| Materials | PBR satin (sheen, controlled roughness and specular) with a tiling satin-weave normal map, brushed gold (metal), skin, hair. | done |
| Export | One GLB per outfit, origin between the feet on the floor, Y-up, facing +Z, same scale; `.blend` source saved in `blender/`; Meshopt compression with glTF-Transform. | done |
| Validation | `scripts/model-report.json` (bounds, height, floor contact, centring, triangle counts per part) + browser acceptance tests (`scripts/e2e.mjs`). | done |

### Missing views / details

- Back and side of the chocolate (01) and burgundy (04) kaftans: front views only.
- Back of the cape-drape (06) and red off-shoulder (07) kaftans: one view each.
- Exact fabric, embroidery and trim patterns for every garment.
- Real faces and hairstyles of the models (the figures are stylised boutique mannequins; see REPORT.md).

To get closer to the photographs: send the seven images, plus back and side photographs of 01, 04, 06 and
07. A multi-view reconstruction (or hand modelling of the garments in Blender over the same body) can then
replace the procedural garments one by one without changing the website (same file names, scale and
origin).
