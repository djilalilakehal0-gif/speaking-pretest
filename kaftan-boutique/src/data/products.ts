/**
 * Product catalogue — the single place to edit the collection.
 *
 * ⚠️ DEMO CONTENT. Prices, stock, sizes, materials and copy below are editable placeholders,
 * clearly shown as "demo" in the interface, until the store owner supplies real data.
 * Garment colours, necklines and sleeves follow the seven reference captions (see REFERENCE-MAP.md).
 *
 * To add a product: add a GLB to public/models/, renders to public/images/products/, then an entry
 * here. `boutiqueSlot` sets its place in the boutique line (0 = front of the aisle).
 */

export type StockStatus = 'in-stock' | 'low-stock' | 'made-to-order' | 'sold-out'

export interface ProductColor {
  name: string
  hex: string
  /** true when this colour is the one modelled in 3D */
  modelled: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string
  /** Demo price in the store currency. Replace with real data. */
  price: number
  description: string
  material: string
  details: string[]
  sizes: string[]
  /** Sizes currently unavailable (demo). */
  soldOutSizes: string[]
  colors: ProductColor[]
  stock: StockStatus
  sleeve: 'bell' | 'wide' | 'straight' | 'fitted' | 'flared'
  neckline: 'round' | 'v-neck' | 'deep v-neck' | 'off-shoulder'
  newArrival: boolean
  bestSeller: boolean
  model: string
  images: { front: string; threeQuarter: string; back: string }
  /** Reference images (from the brief) this garment was modelled from. */
  references: string[]
  boutiqueSlot: number
}

export const STORE = {
  /** Placeholder brand name — replace with the real one. */
  brand: 'Maison Kaftan',
  currency: 'EUR',
  locale: 'en-IE',
  demo: true,
  contact: {
    email: 'hello@example.com',
    phone: '+00 000 000 000',
    address: 'Boutique address to be supplied by the store owner',
    hours: 'Opening hours to be supplied',
  },
}

const img = (slug: string) => ({
  front: `images/products/${slug}-front.webp`,
  threeQuarter: `images/products/${slug}-three-quarter.webp`,
  back: `images/products/${slug}-back.webp`,
})

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

export const PRODUCTS: Product[] = [
  {
    id: '01',
    slug: 'chocolate-kaftan',
    name: 'Chocolate Kaftan',
    tagline: 'Deep chocolate satin with a brushed-gold waist',
    price: 420,
    description:
      'A floor-length kaftan in deep chocolate satin. The A-line skirt falls in soft folds from a gold-belted waist; bell sleeves and a gold-edged round neckline frame the silhouette.',
    material: 'Satin (demo — fibre content to be confirmed)',
    details: ['Round neckline with gold edging', 'Bell sleeves with gold cuffs', 'Brushed-gold belt and medallion', 'Floor length, A-line'],
    sizes: SIZES,
    soldOutSizes: [],
    colors: [{ name: 'Chocolate', hex: '#4A2618', modelled: true }],
    stock: 'in-stock',
    sleeve: 'bell',
    neckline: 'round',
    newArrival: true,
    bestSeller: true,
    model: 'models/kaftan-model-01.glb',
    images: img('chocolate-kaftan'),
    references: ['Reference 01 — chocolate kaftan, front view'],
    boutiqueSlot: 0,
  },
  {
    id: '02',
    slug: 'dark-satin-kaftan',
    name: 'Dark Satin Kaftan',
    tagline: 'High-sheen espresso satin with wide, fluid sleeves',
    price: 480,
    description:
      'Our darkest satin, cut for movement. Wide sleeves fall from the shoulder, a self-fabric belt shapes the waist and a V-neckline lengthens the line. The high sheen catches every fold.',
    material: 'High-sheen satin (demo — fibre content to be confirmed)',
    details: ['V-neckline', 'Wide draped sleeves', 'Self-fabric belt', 'Floor length, generous flare'],
    sizes: SIZES,
    soldOutSizes: ['XS'],
    colors: [{ name: 'Espresso black', hex: '#24160F', modelled: true }],
    stock: 'low-stock',
    sleeve: 'wide',
    neckline: 'v-neck',
    newArrival: false,
    bestSeller: true,
    model: 'models/kaftan-model-02.glb',
    images: img('dark-satin-kaftan'),
    references: [
      'Reference 02 — dark satin kaftan, side view',
      'Reference 03 — dark satin kaftan, alternate pose',
      'Reference 05 — dark satin kaftan, alternate angle',
    ],
    boutiqueSlot: 1,
  },
  {
    id: '03',
    slug: 'burgundy-kaftan',
    name: 'Burgundy Kaftan',
    tagline: 'Burgundy with a gold-embroidered deep V and hem',
    price: 450,
    description:
      'A burgundy kaftan with a deep V-neckline traced in gold, matching gold cuffs and a gold-banded hem. Straight long sleeves and a belted waist keep the shape clean and formal.',
    material: 'Satin with metallic trim (demo — to be confirmed)',
    details: ['Deep V-neckline, gold band', 'Straight long sleeves, gold cuffs', 'Gold-banded hem', 'Brushed-gold belt'],
    sizes: SIZES,
    soldOutSizes: [],
    colors: [{ name: 'Burgundy', hex: '#6B1626', modelled: true }],
    stock: 'in-stock',
    sleeve: 'straight',
    neckline: 'deep v-neck',
    newArrival: true,
    bestSeller: false,
    model: 'models/kaftan-model-03.glb',
    images: img('burgundy-kaftan'),
    references: ['Reference 04 — burgundy kaftan, front view'],
    boutiqueSlot: 2,
  },
  {
    id: '04',
    slug: 'satin-cape-drape-kaftan',
    name: 'Satin Cape-Drape Kaftan',
    tagline: 'A cape that falls from the shoulders to the floor',
    price: 560,
    description:
      'A satin kaftan with a cape that falls from the shoulders and opens at the front. Under it, a fitted long-sleeved dress is belted in brushed gold.',
    material: 'Satin (demo — fibre content to be confirmed)',
    details: ['Shoulder-hung cape, open front', 'Fitted long sleeves', 'Round neckline with gold edging', 'Brushed-gold belt'],
    sizes: SIZES,
    soldOutSizes: ['XL'],
    colors: [{ name: 'Champagne', hex: '#C9AE86', modelled: true }],
    stock: 'made-to-order',
    sleeve: 'fitted',
    neckline: 'round',
    newArrival: true,
    bestSeller: false,
    model: 'models/kaftan-model-04.glb',
    images: img('satin-cape-drape-kaftan'),
    references: ['Reference 06 — satin cape-drape kaftan'],
    boutiqueSlot: 3,
  },
  {
    id: '05',
    slug: 'red-off-shoulder-kaftan',
    name: 'Red Off-Shoulder Kaftan',
    tagline: 'Off-shoulder red with a neck strap and an inner belt',
    price: 440,
    description:
      'An off-shoulder kaftan in red, finished with a soft fold along the neckline. A halter neck strap holds it in place, a slim inner belt marks the waist and flared sleeves begin below the shoulder.',
    material: 'Satin (demo — fibre content to be confirmed)',
    details: ['Off-shoulder neckline', 'Halter neck strap', 'Slim inner belt', 'Flared sleeves'],
    sizes: SIZES,
    soldOutSizes: [],
    colors: [{ name: 'Red', hex: '#A3161F', modelled: true }],
    stock: 'in-stock',
    sleeve: 'flared',
    neckline: 'off-shoulder',
    newArrival: false,
    bestSeller: true,
    model: 'models/kaftan-model-05.glb',
    images: img('red-off-shoulder-kaftan'),
    references: ['Reference 07 — red off-shoulder kaftan'],
    boutiqueSlot: 4,
  },
]

export const productById = (id: string | undefined) => PRODUCTS.find((p) => p.id === id || p.slug === id)

export const formatPrice = (value: number) =>
  new Intl.NumberFormat(STORE.locale, { style: 'currency', currency: STORE.currency }).format(value)

export const STOCK_LABEL: Record<StockStatus, string> = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'made-to-order': 'Made to order',
  'sold-out': 'Sold out',
}

/** Resolve a public asset path against Vite's base (works from any sub-path). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
