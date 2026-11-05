import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, products, type Category, type Product } from '../data/menu'
import { ProductCard } from '../components/ProductCard'
import { Reveal, SectionHeading } from '../components/Reveal'
import { scrollToId } from '../lib/smooth'

/** Highlights the category whose section is under the sticky bar. */
function useActiveCategory(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id.replace('cat-', ''))),
      { rootMargin: '-35% 0px -60% 0px' },
    )
    ids.forEach((id) => { const el = document.getElementById(`cat-${id}`); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [ids])
  return active
}

/** The full menu, printed-menu style on ivory: sticky category bar, search, product cards by category. */
export function Menu({ onOpen }: { onOpen: (p: Product) => void }) {
  const [query, setQuery] = useState('')
  const ids = useMemo(() => categories.map((c) => c.id), [])
  const active = useActiveCategory(ids)
  const bar = useRef<HTMLDivElement>(null)

  // Keep the active tab visible inside the horizontally scrolling bar.
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

  return (
    <section id="menu" className="relative bg-ivory pb-24 pt-24 text-noir sm:pb-36 sm:pt-36" aria-labelledby="menu-title">
      <div className="container-x">
        <div id="menu-title">
          <SectionHeading tone="light" align="center" eyebrow="Il menù · La carte · القائمة" title={'Notre _carte.'}
            intro="Burgers, sandwichs, tacos, tex-mex, desserts et boissons. Touchez un plat pour le découvrir, ajoutez-le au panier en un geste." />
        </div>
      </div>

      <div className="sticky top-[4.25rem] z-30 mt-14 border-y border-noir/[0.08] bg-ivory/90 backdrop-blur-xl">
        <div className="container-x flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <LayoutGroup id="cat-nav">
            <nav ref={bar} aria-label="Catégories du menu" className="no-scrollbar relative -mx-1 flex gap-1 overflow-x-auto px-1">
              {categories.map((c) => {
                const on = active === c.id
                const count = byCat.get(c.id)!.length
                return (
                  <button
                    key={c.id} type="button" data-cat={c.id} onClick={() => scrollToId(`cat-${c.id}`)} aria-current={on ? 'true' : undefined} disabled={!count}
                    className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 disabled:opacity-30 sm:px-5 ${on ? 'text-ivory' : 'text-noir/55 hover:text-noir'}`}
                  >
                    {on && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-burgundy" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                    <span className="relative">{c.label}</span>
                    <span className={`relative font-serif text-xs italic ${on ? 'text-gold' : 'text-noir/35'}`}>{count}</span>
                  </button>
                )
              })}
            </nav>
          </LayoutGroup>
          <label className="relative block lg:w-72">
            <span className="sr-only">Rechercher dans le menu</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher : kebab, nuggets, oreo…" className="input input-light !min-h-11 !rounded-full !py-2 pl-10 text-sm" />
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-noir/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
            </svg>
          </label>
        </div>
      </div>

      <div className="container-x">
        {categories.map((c, ci) => {
          const list = byCat.get(c.id)!
          if (!list.length) return null
          return (
            <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className="scroll-mt-40 pt-20 sm:pt-28">
              <Reveal y={20} className="mb-10 flex items-end justify-between gap-4 border-b border-noir/10 pb-6">
                <h3 id={`h-${c.id}`} className="flex items-baseline gap-4 sm:gap-6">
                  <span className="font-serif text-2xl italic text-burgundy sm:text-3xl">{String(ci + 1).padStart(2, '0')}</span>
                  <span className="display text-[clamp(2.6rem,6.5vw,4.8rem)] text-noir">{c.label}</span>
                </h3>
                <span className="pb-2 text-lg font-medium text-noir/35 sm:text-xl" lang="ar" dir="rtl">{c.labelAr}</span>
              </Reveal>
              <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                {list.map((p, i) => <ProductCard key={p.id} product={p} onOpen={onOpen} eager={ci === 0 && i < 4} index={i} />)}
              </div>
            </section>
          )
        })}

        <AnimatePresence>
          {total === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-16 flex flex-col items-center rounded-[2rem] border border-noir/10 bg-white px-6 py-16 text-center">
              <p className="display text-4xl">Aucun résultat</p>
              <p className="mt-3 max-w-sm text-sm text-noir/55">Rien ne correspond à « {query} ».</p>
              <button type="button" onClick={() => setQuery('')} className="btn btn-line-dark mt-7">Voir toute la carte</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-16 text-center font-serif text-sm italic text-noir/45">Prix TTC en euros · Photos non contractuelles</p>
      </div>
    </section>
  )
}
