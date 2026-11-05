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
        {!small && <span className="text-sm text-ash">Photo à venir</span>}
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
    <span className={`inline-flex shrink-0 items-center rounded-md bg-tomato font-bold tabular-nums text-white ${large ? 'px-4 py-1.5 text-2xl' : 'px-2.5 py-1 text-base'}`}>
      {euro(price)}
    </span>
  )
}

/** The brief asks for this exact wording on the Kebab. */
export function BestSellerBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-white px-2 py-0.5 text-xs font-bold text-ink">
      <StarIcon size={11} /> BEST SELLER
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
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${done ? 'bg-white text-ink' : 'border border-white/30 text-white hover:border-tomato hover:bg-tomato'}`}
      aria-label={needsChoice ? `Choisir : ${product.name}` : done ? `${product.name} ajouté au panier` : `Ajouter ${product.name} au panier`}
    >
      <AddMorph done={done} />
    </motion.button>
  )
}

/** One line of the menu board: photo, name, dotted leader, price, add. */
export function ProductRow({ product, onOpen, eager = false }: { product: Product; onOpen: (p: Product) => void; eager?: boolean }) {
  const sub = product.description ?? product.options?.join(', ')
  return (
    <li className={`group relative flex items-center gap-3 py-3 sm:gap-4 ${product.bestSeller ? '-mx-3 rounded-xl bg-tomato/[0.09] px-3 ring-1 ring-tomato/60' : ''}`}>
      <button type="button" onClick={() => onOpen(product)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left sm:gap-4" aria-label={`${product.name}, ${euro(product.price)} : voir le détail`}>
        <span className="flex h-[4.5rem] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black sm:h-20 sm:w-28">
          <ProductImage product={product} eager={eager} small className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
        </span>
        <span className="min-w-0 flex-1">
          {product.bestSeller && <span className="mb-1 block"><BestSellerBadge /></span>}
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-semibold leading-tight text-cream sm:text-xl">{product.name}</span>
            <span className="mb-1 hidden flex-1 border-b-2 border-dotted border-white/20 sm:block" aria-hidden />
          </span>
          {sub && <span className="mt-0.5 block text-sm leading-snug text-ash">{sub}</span>}
        </span>
      </button>
      <PriceBadge price={product.price} />
      <AddButton product={product} onChoose={() => onOpen(product)} />
    </li>
  )
}
