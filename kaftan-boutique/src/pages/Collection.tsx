import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { PRODUCTS, STOCK_LABEL, type Product } from '../data/products'
import { useCart } from '../store/cart'

type Preset = 'all' | 'new' | 'best'

const TITLES: Record<Preset, { eyebrow: string; title: string; intro: string }> = {
  all: { eyebrow: 'Shop', title: 'The Collection', intro: 'Every kaftan in the boutique. Open any piece to inspect it in 3D.' },
  new: { eyebrow: 'Just arrived', title: 'New Arrivals', intro: 'The latest pieces in the boutique.' },
  best: { eyebrow: 'Most loved', title: 'Best Sellers', intro: 'The kaftans our clients come back for.' },
}

const uniq = <T,>(a: T[]) => [...new Set(a)]

export default function Collection({ preset = 'all' }: { preset?: Preset }) {
  const [params, setParams] = useSearchParams()
  const { wishlist } = useCart()
  const onlyWish = params.get('wishlist') === '1'
  const [color, setColor] = useState('')
  const [sleeve, setSleeve] = useState('')
  const [size, setSize] = useState('')
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured')

  const base = PRODUCTS.filter((p) => (preset === 'new' ? p.newArrival : preset === 'best' ? p.bestSeller : true))
  const list = useMemo(() => {
    let l: Product[] = base.filter(
      (p) =>
        (!color || p.colors.some((c) => c.name === color)) &&
        (!sleeve || p.sleeve === sleeve) &&
        (!size || (p.sizes.includes(size) && !p.soldOutSizes.includes(size))) &&
        (!inStock || p.stock === 'in-stock' || p.stock === 'low-stock') &&
        (!onlyWish || wishlist.includes(p.id)),
    )
    if (sort === 'price-asc') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price)
    if (sort === 'name') l = [...l].sort((a, b) => a.name.localeCompare(b.name))
    return l
  }, [base, color, sleeve, size, inStock, sort, onlyWish, wishlist])

  const t = onlyWish ? { eyebrow: 'Saved', title: 'Your wishlist', intro: 'Pieces you have saved.' } : TITLES[preset]
  const select = 'h-11 rounded-full border border-champagne/25 bg-cocoa-800 px-4 text-xs tracking-wider'
  const anyFilter = color || sleeve || size || inStock || onlyWish

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="mt-2 font-serif text-5xl md:text-6xl">{t.title}</h1>
      <p className="mt-3 max-w-xl text-beige-300">{t.intro}</p>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-y border-champagne/10 py-4" role="group" aria-label="Filters">
        <label className="sr-only" htmlFor="f-color">Colour</label>
        <select id="f-color" className={select} value={color} onChange={(e) => setColor(e.target.value)} data-testid="filter-color">
          <option value="">All colours</option>
          {uniq(PRODUCTS.flatMap((p) => p.colors.map((c) => c.name))).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-sleeve">Sleeve</label>
        <select id="f-sleeve" className={select} value={sleeve} onChange={(e) => setSleeve(e.target.value)}>
          <option value="">All sleeves</option>
          {uniq(PRODUCTS.map((p) => p.sleeve)).map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)} sleeves</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-size">Size</label>
        <select id="f-size" className={select} value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="">All sizes</option>
          {uniq(PRODUCTS.flatMap((p) => p.sizes)).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-champagne/25 px-4 text-xs tracking-wider">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-[#c9a15a]" />
          Ready to ship ({STOCK_LABEL['in-stock']} / {STOCK_LABEL['low-stock'].toLowerCase()})
        </label>
        {anyFilter && (
          <button
            type="button"
            className="text-[0.65rem] tracking-[0.2em] text-gold-soft uppercase"
            onClick={() => {
              setColor(''); setSleeve(''); setSize(''); setInStock(false)
              if (onlyWish) setParams({})
            }}
          >
            Clear filters
          </button>
        )}
        <div className="ml-auto">
          <label className="sr-only" htmlFor="f-sort">Sort</label>
          <select id="f-sort" className={select} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-xs text-beige-300" aria-live="polite" data-testid="result-count">
        {list.length} {list.length === 1 ? 'piece' : 'pieces'}
      </p>
      {list.length === 0 ? (
        <p className="py-24 text-center font-serif text-2xl text-beige-300">No kaftan matches these filters.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
