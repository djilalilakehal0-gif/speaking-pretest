import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { categories, products, type Category, type Product } from '../data/menu'
import { ProductCard } from '../components/ProductCard'
import { ProductModal } from '../components/ProductModal'
import { SectionHeading } from '../components/Reveal'
import { BurgerIcon, HeartToggle, PizzaSliceIcon } from '../components/icons/Icons'
import { useFavourites } from '../lib/favourites'

type Filter = 'all' | Category | 'favourites'

export function Menu() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const { favs } = useFavourites()

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (filter === 'favourites' ? !favs.includes(p.id) : filter !== 'all' && p.category !== filter) return false
      if (!q) return true
      return [p.name, p.description, ...p.ingredients].some((s) => s.toLowerCase().includes(q))
    })
  }, [filter, query, favs])

  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.id === 'all' ? products.length : products.filter((p) => p.category === c.id).length])), [])

  return (
    <section id="menu" className="relative bg-ink py-24 sm:py-32" aria-labelledby="menu-heading">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div id="menu-heading"><SectionHeading eyebrow="Il menù" title="The menu." italic="Fresh from the oven & the grill" /></div>
          <div className="flex items-center gap-4 text-cream/50" aria-hidden>
            <PizzaSliceIcon size={44} draw live /><span className="display text-3xl text-cream/30">&</span><BurgerIcon size={44} draw live />
          </div>
        </div>

        <div className="sticky top-[4.5rem] z-30 -mx-4 mt-12 bg-ink/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-full sm:px-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <LayoutGroup id="menu-filters">
              <div role="tablist" aria-label="Menu categories" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
                {[...categories, { id: 'favourites' as const, label: 'Favourites' }].map((c) => {
                  const active = filter === c.id
                  return (
                    <button
                      key={c.id} type="button" role="tab" aria-selected={active} aria-controls="menu-grid"
                      onClick={() => setFilter(c.id)}
                      className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors sm:px-5 ${active ? 'text-white' : 'text-cream/60 hover:text-cream'}`}
                    >
                      {active && <motion.span layoutId="menu-pill" className="absolute inset-0 rounded-full bg-tomato" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                      <span className="relative flex items-center gap-1.5">
                        {c.id === 'favourites' && <HeartToggle active={favs.length > 0} size={14} />}
                        {c.label}
                        <span className={`text-[10px] ${active ? 'text-white/70' : 'text-cream/35'}`}>{c.id === 'favourites' ? favs.length : counts[c.id]}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
            <label className="relative block lg:w-72">
              <span className="sr-only">Search the menu</span>
              <input
                type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: burrata, spicy, cheddar…"
                className="input !min-h-11 !rounded-full !py-2 pl-10 text-sm"
              />
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
              </svg>
            </label>
          </div>
        </div>

        <motion.div id="menu-grid" role="tabpanel" layout className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => <ProductCard key={p.id} product={p} onOpen={setSelected} priority={i < 3} />)}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {list.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card-surface mt-6 flex flex-col items-center rounded-[2rem] px-6 py-16 text-center">
              <p className="display text-3xl">{filter === 'favourites' && !query ? 'No favourites yet' : 'Nothing matches'}</p>
              <p className="mt-2 max-w-sm text-sm text-cream/55">
                {filter === 'favourites' && !query ? 'Tap the heart on any dish to keep it here.' : `We couldn't find “${query}”. Try another ingredient.`}
              </p>
              <button type="button" onClick={() => { setQuery(''); setFilter('all') }} className="btn btn-ghost mt-6">Show full menu</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-10 text-center text-xs text-cream/40">Prices include VAT. Allergen information is on every dish — tap “Ingredients & allergens”.</p>
      </div>
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
