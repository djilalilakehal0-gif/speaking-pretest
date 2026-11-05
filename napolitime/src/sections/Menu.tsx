import { LayoutGroup, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, products, type Category, type Product } from '../data/menu'
import { ProductRow } from '../components/ProductCard'
import { ProductModal } from '../components/ProductModal'

/** Highlights the category whose panel is under the sticky bar. */
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

export function Menu() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const ids = useMemo(() => categories.map((c) => c.id), [])
  const active = useActiveCategory(ids)
  const bar = useRef<HTMLElement>(null)

  // Keep the active tab in view inside the horizontally scrolling bar (never scrolls the page).
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
    <section id="menu" className="relative border-t border-white/[0.08] bg-ink pb-24 pt-20 sm:pb-32 sm:pt-24" aria-labelledby="menu-title">
      <div className="container-x flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h2 id="menu-title" className="display text-[clamp(3.4rem,9vw,7rem)]">Le menu</h2>
        <p className="max-w-md pb-2 text-ash">Touchez un produit pour voir sa photo en grand. Le bouton + l’ajoute au panier.</p>
      </div>

      <div className="sticky top-[4.5rem] z-30 mt-10 border-y border-white/[0.08] bg-ink/95 backdrop-blur-lg">
        <div className="container-x flex flex-col gap-2 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <LayoutGroup id="cat-nav">
            <nav ref={bar} aria-label="Catégories du menu" className="no-scrollbar relative -mx-1 flex gap-1 overflow-x-auto px-1">
              {categories.map((c) => {
                const on = active === c.id
                const count = byCat.get(c.id)!.length
                return (
                  <button
                    key={c.id} type="button" data-cat={c.id} onClick={() => jump(c.id)} aria-current={on ? 'true' : undefined} disabled={!count}
                    className={`relative shrink-0 rounded-md px-3.5 py-2 text-base font-semibold transition-colors disabled:opacity-30 ${on ? 'text-white' : 'text-ash hover:text-white'}`}
                  >
                    {on && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-md bg-tomato" transition={{ type: 'spring', stiffness: 450, damping: 36 }} />}
                    <span className="relative">{c.label}</span>
                  </button>
                )
              })}
            </nav>
          </LayoutGroup>
          <label className="relative block lg:w-72">
            <span className="sr-only">Chercher un produit</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher : kebab, nuggets, oreo…" className="input !min-h-11 pl-10" />
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ash" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
            </svg>
          </label>
        </div>
      </div>

      <div className="container-x mt-10 grid items-start gap-6 lg:grid-cols-2">
        {categories.map((c, ci) => {
          const list = byCat.get(c.id)!
          if (!list.length) return null
          const wide = list.length >= 9
          return (
            <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className={`scroll-mt-36 rounded-2xl border border-tomato/45 bg-ink-2 shadow-[0_0_40px_-18px_rgba(229,9,20,.7)] ${wide ? 'lg:col-span-2' : ''}`}>
              <header className="flex items-baseline justify-between gap-4 border-b border-tomato/30 px-5 pb-3 pt-4 sm:px-7">
                <h3 id={`h-${c.id}`} className="display text-[2.6rem] sm:text-5xl">{c.label}</h3>
                <span className="text-lg text-ash" lang="ar" dir="rtl">{c.labelAr}</span>
              </header>
              <ul className={`divide-y divide-white/[0.06] px-5 py-2 sm:px-7 ${wide ? 'lg:grid lg:grid-cols-2 lg:gap-x-12 lg:divide-y-0 lg:[&>li]:border-b lg:[&>li]:border-white/[0.06]' : ''}`}>
                {list.map((p, i) => <ProductRow key={p.id} product={p} onOpen={setSelected} eager={ci === 0 && i < 4} />)}
              </ul>
            </section>
          )
        })}

        {total === 0 && (
          <div className="card-surface flex flex-col items-center rounded-2xl px-6 py-14 text-center lg:col-span-2">
            <p className="display text-4xl">Aucun produit trouvé</p>
            <p className="mt-2 max-w-sm text-ash">Rien ne correspond à « {query} ». Essayez un autre mot.</p>
            <button type="button" onClick={() => setQuery('')} className="btn btn-ghost mt-6">Afficher tout le menu</button>
          </div>
        )}
      </div>

      <p className="container-x mt-10 text-sm text-ash">Prix TTC en euros. Photos non contractuelles. Allergies : demandez la composition au comptoir.</p>
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
