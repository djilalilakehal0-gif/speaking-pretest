import { useState } from 'react'
import { productById, type Product } from '../data/menu'
import { euro } from '../lib/format'
import { ProductImage } from '../components/ProductCard'
import { ProductModal } from '../components/ProductModal'

/** The products people order most, from the menu board (Kebab is the declared best seller). */
const picks = ['kebab', 'double-cheese', 'tacos-3', 'tex-box-xl', 'milkshake-speculoos', 'royal-burger', 'menu-enfant', 'triple-x', 'wings', 'tarte-daim']
  .map((id) => productById.get(id)!)

/**
 * "Small frames, wide space": one row of tall frames running off both sides, scrolled by
 * drag, trackpad or thumb. Each frame opens the product, so the strip doubles as a shortcut.
 */
export function Favourites() {
  const [selected, setSelected] = useState<Product | null>(null)
  return (
    <section className="container-x pt-24 sm:pt-40" aria-labelledby="fav-title">
        <h2 id="fav-title" data-reveal className="text-[length:var(--step-lead)]">
          Les plus commandés, {picks.length} produits
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-[3vw] lg:gap-y-12">
          {picks.map((p) => (
            <li key={p.id} data-reveal>
              <button type="button" onClick={() => setSelected(p)} className="group block text-left" aria-label={`${p.name}, ${euro(p.price)} : voir le détail`}>
                <span className="flex aspect-[3/2] w-full items-center justify-center overflow-hidden bg-ink-2">
                  <ProductImage product={p} className="h-full w-full transition-transform duration-[250ms] group-hover:scale-110" />
                </span>
                <span className="mt-3 block text-[length:var(--step-body)] leading-tight">{p.name}</span>
                <span className="block text-[length:var(--step-small)] text-ash">{euro(p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
