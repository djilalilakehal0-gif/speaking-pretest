import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Product } from '../data/menu'
import { useCart } from '../lib/cart'
import { euro } from '../lib/format'
import { AddMorph, StarIcon } from './icons/Icons'
import { LogoMark } from './Logo'

const base = import.meta.env.BASE_URL
export const menuImage = (name: string) => `${base}menu/${name}.webp`

/** Product photo, or the badge with "Photo à venir" when none is set yet. */
export function ProductImage({ product, className = '', eager = false, small = false }: { product: Product; className?: string; eager?: boolean; small?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!product.image || failed)
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
        <LogoMark size={small ? 40 : 72} />
        {!small && <span className="text-[length:var(--step-small)] text-ash">Photo à venir</span>}
      </div>
    )
  return (
    <img
      src={menuImage(product.image)} alt={small ? '' : product.name} loading={eager ? 'eager' : 'lazy'} decoding="async"
      onError={() => setFailed(true)} className={`object-contain ${className}`}
    />
  )
}

export function PriceBadge({ price, large = false }: { price: number; large?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center bg-tomato ${large ? 'px-3' : 'px-2'} pt-[0.14em] font-[family-name:var(--font-display)] tabular-nums leading-none text-white text-[length:var(--step-lead)]`}>
      {euro(price)}
    </span>
  )
}

/** The brief asks for this exact wording on the Kebab. */
export function BestSellerBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap bg-white px-1.5 pt-[0.15em] font-[family-name:var(--font-display)] text-[length:var(--step-small)] leading-none text-ink">
      <StarIcon size={12} /> BEST SELLER
    </span>
  )
}

export function AddButton({ product, onChoose }: { product: Product; onChoose?: () => void }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1400)
    return () => clearTimeout(t)
  }, [done])
  const needsChoice = !!product.options?.length
  return (
    <motion.button
      type="button"
      onClick={() => { if (needsChoice) { onChoose?.(); return } add(product.id); setDone(true) }}
      whileTap={{ scale: 0.88 }}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center transition-colors ${done ? 'bg-white text-ink' : 'bg-ink-3 text-white hover:bg-white hover:text-ink'}`}
      aria-label={needsChoice ? `Choisir : ${product.name}` : done ? `${product.name} ajouté au panier` : `Ajouter ${product.name} au panier`}
    >
      <AddMorph done={done} />
    </motion.button>
  )
}

/** One line of the menu: photo, name, price, add. Pointing at it shows its photo large (desktop). */
export function ProductRow({ product, onOpen, onPreview, active = false, eager = false }: {
  product: Product; onOpen: (p: Product) => void; onPreview?: (p: Product) => void; active?: boolean; eager?: boolean
}) {
  const sub = product.description ?? product.options?.join(', ')
  return (
    <li
      onMouseEnter={() => onPreview?.(product)} onFocus={() => onPreview?.(product)}
      className={`group flex items-center gap-3 px-2 py-2.5 transition-colors sm:gap-4 ${active ? 'bg-ink-2' : 'hover:bg-ink-2'}`}
    >
      <button type="button" onClick={() => onOpen(product)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4" aria-label={`${product.name}, ${euro(product.price)} : voir le détail`}>
        <span className="flex h-14 w-[4.5rem] shrink-0 items-center justify-center overflow-hidden bg-black">
          <ProductImage product={product} eager={eager} small className="h-full w-full" />
        </span>
        <span className="min-w-0 flex-1">
          {product.bestSeller && <span className="mb-1 block"><BestSellerBadge /></span>}
          <span className="block text-[length:var(--step-body)] font-medium leading-tight">{product.name}</span>
          {sub && <span className="mt-0.5 block text-[length:var(--step-small)] leading-snug text-ash">{sub}</span>}
        </span>
      </button>
      <PriceBadge price={product.price} />
      <AddButton product={product} onChoose={() => onOpen(product)} />
    </li>
  )
}
