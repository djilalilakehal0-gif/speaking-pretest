import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { categories, products, type Category, type Product } from '../data/menu'
import { PriceBadge, ProductImage, ProductRow } from '../components/ProductCard'
import { ProductModal } from '../components/ProductModal'

/** Highlights the category whose list is under the sticky bar. */
function useActiveCategory(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id.replace('cat-', ''))),
      { rootMargin: '-30% 0px -65% 0px' },
    )
    ids.forEach((id) => { const el = document.getElementById(`cat-${id}`); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [ids])
  return active
}

/**
 * The menu — "Statement, table pushed right". A two-line statement across the width, then the
 * whole carte as a table in the right-hand columns; on desktop the left columns hold a large
 * frame that shows the photo of whichever line is pointed at or focused.
 */
export function Menu() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [preview, setPreview] = useState<Product>(products[0])
  const ids = useMemo(() => categories.map((c) => c.id), [])
  const active = useActiveCategory(ids)
  const bar = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  // While scrolling, the large frame follows the category on screen; pointing at a line overrides it.
  useEffect(() => {
    const first = products.find((p) => p.category === active)
    if (first) setPreview(first)
  }, [active])

  useEffect(() => {
    const nav = bar.current
    const el = nav?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    if (nav && el && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: el.offsetLeft - nav.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const q = query.trim().toLowerCase()
  const byCat = useMemo(() => {
    const m = new Map<Category, Product[]>()
    for (const c of categories) m.set(c.id, products.filter((p) => p.category === c.id && (!q || `${p.name} ${p.options?.join(' ') ?? ''}`.toLowerCase().includes(q))))
    return m
  }, [q])
  const total = [...byCat.values()].reduce((s, l) => s + l.length, 0)

  const jump = (id: string) =>
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })

  return (
    <section id="menu" className="relative bg-ink pt-32 sm:pt-44" aria-labelledby="menu-title">
      <div className="container-x grid items-end gap-10 lg:grid-cols-12">
        <h2 id="menu-title" data-reveal className="display max-w-[16ch] text-[length:var(--step-head)] !leading-[0.95] lg:col-span-7 lg:indent-[3vw]">
          Toute la carte, du Cheese au Triple X
        </h2>
        <figure data-reveal className="max-w-[22rem] lg:col-span-3 lg:col-start-10 lg:max-w-none">
          <video
            autoPlay={!reduced} muted loop playsInline preload="metadata" width={384} height={480} aria-hidden
            poster={`${import.meta.env.BASE_URL}media/adanada-sis-kebap-poster.jpg`}
            className="aspect-[4/5] w-full bg-ink-2 object-cover"
          >
            <source src={`${import.meta.env.BASE_URL}media/adanada-sis-kebap.webm`} type="video/webm" />
          </video>
          <figcaption className="mt-3 text-[length:var(--step-small)] text-ash">Brochettes de kebab au bazar de Kazancılar, à Adana (Turquie).</figcaption>
        </figure>
      </div>

      <div className="sticky top-[4.5rem] z-30 mt-16 bg-ink">
        <div className="container-x flex flex-col gap-2 py-3 lg:flex-row lg:items-center lg:justify-between">
          <nav ref={bar} aria-label="Catégories de la carte" className="no-scrollbar flex overflow-x-auto">
            {categories.map((c) => {
              const on = active === c.id
              const count = byCat.get(c.id)!.length
              return (
                <button
                  key={c.id} type="button" data-cat={c.id} onClick={() => jump(c.id)} aria-current={on ? 'true' : undefined} disabled={!count}
                  className={`display shrink-0 px-2.5 pb-1 pt-2 text-[length:var(--step-lead)] transition-colors disabled:opacity-30 ${on ? 'bg-white text-ink' : 'text-cream/70 hover:text-cream'}`}
                >
                  {c.label}
                </button>
              )
            })}
          </nav>
          <label className="relative block lg:w-72">
            <span className="sr-only">Chercher un produit</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher : kebab, oreo…" className="input !min-h-11" />
          </label>
        </div>
      </div>

      <div className="container-x mt-12 grid gap-10 lg:grid-cols-12">
        {/* Desktop preview: the photo of the line being pointed at. */}
        <figure data-reveal className="sticky top-44 hidden self-start lg:col-span-5 lg:block" aria-live="polite">
          <div className="flex aspect-[4/3] items-center justify-center bg-ink-2">
            <ProductImage key={preview.id} product={preview} className="h-full w-full p-4" />
          </div>
          <figcaption className="mt-4 flex items-start justify-between gap-4">
            <span className="display text-[length:var(--step-lead)] !leading-none">{preview.name}</span>
            <PriceBadge price={preview.price} large />
          </figcaption>
        </figure>

        <div className="lg:col-span-6 lg:col-start-7">
          {categories.map((c, ci) => {
            const list = byCat.get(c.id)!
            if (!list.length) return null
            return (
              <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className={`scroll-mt-40 ${ci ? 'mt-16' : ''}`}>
                <div data-reveal className="mb-3 flex items-baseline justify-between gap-4 px-2">
                  <h3 id={`h-${c.id}`} className="display text-[length:var(--step-head)] !leading-[0.9]">{c.label}</h3>
                  <span className="text-[length:var(--step-body)] text-cream/75" lang="ar" dir="rtl">{c.labelAr}</span>
                </div>
                <ul data-reveal>
                  {list.map((p, i) => (
                    <ProductRow key={p.id} product={p} onOpen={setSelected} onPreview={setPreview} active={preview.id === p.id} eager={ci === 0 && i < 4} />
                  ))}
                </ul>
              </section>
            )
          })}

          {total === 0 && (
            <div className="bg-ink-2 px-6 py-12">
              <p className="display text-4xl">Aucun produit trouvé</p>
              <p className="mt-2">Rien ne correspond à « {query} ». Essayez un autre mot.</p>
              <button type="button" onClick={() => setQuery('')} className="btn btn-primary mt-6">Afficher toute la carte</button>
            </div>
          )}
          <p className="mt-12 max-w-[60ch] px-2 text-[length:var(--step-small)] text-ash">Prix TTC en euros. Photos non contractuelles. Allergies : demandez la composition au comptoir.</p>
        </div>
      </div>
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
