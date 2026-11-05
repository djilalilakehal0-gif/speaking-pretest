import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Product } from '../data/menu'
import { useCart } from '../lib/cart'
import { useFavourites } from '../lib/favourites'
import { euro } from '../lib/format'
import { AddMorph, HeartToggle, StarIcon } from './icons/Icons'
import { LogoMark } from './Logo'

const base = import.meta.env.BASE_URL
export const menuImage = (name: string) => `${base}menu/${name}.webp`

/** Product photo, or a branded "photo à venir" visual when none is set yet. */
export function ProductImage({ product, className = '', eager = false }: { product: Product; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!product.image || failed)
    return (
      <div className={`flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_40%,rgba(229,9,20,.28),transparent_65%)] ${className}`}>
        <LogoMark size={64} />
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cream/45">Photo à venir</span>
      </div>
    )
  return (
    <img
      src={menuImage(product.image)} alt={product.name} loading={eager ? 'eager' : 'lazy'} decoding="async"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  )
}

export function PriceBadge({ price, large = false }: { price: number; large?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-tomato font-bold tabular-nums text-white shadow-[0_8px_24px_-8px_rgba(229,9,20,.9)] ${large ? 'px-5 py-2 text-xl' : 'px-3.5 py-1.5 text-sm'}`}>
      {euro(price)}
    </span>
  )
}

export function BestSellerBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink shadow-lg">
      <StarIcon size={12} /> Best seller
    </span>
  )
}

export function AddButton({ product, onChoose, className = '' }: { product: Product; onChoose?: () => void; className?: string }) {
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
      onClick={(e) => {
        e.stopPropagation()
        if (needsChoice) { onChoose?.(); return }
        add(product.id); setDone(true)
      }}
      whileTap={{ scale: 0.9 }}
      className={`inline-flex h-11 items-center gap-2 rounded-full pl-3 pr-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${done ? 'bg-white text-ink' : 'bg-tomato text-white hover:bg-[#ff1f2b]'} ${className}`}
      aria-label={needsChoice ? `Choisir pour ${product.name}` : `Ajouter ${product.name} au panier`}
    >
      <AddMorph done={done} />
      <span aria-live="polite">{done ? 'Ajouté' : needsChoice ? 'Choisir' : 'Ajouter'}</span>
    </motion.button>
  )
}

export function ProductCard({ product, onOpen, eager = false }: { product: Product; onOpen: (p: Product) => void; eager?: boolean }) {
  const { isFav, toggle } = useFavourites()
  const fav = isFav(product.id)
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] border bg-gradient-to-b from-ink-3 to-ink-2 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-tomato/60 hover:shadow-[0_30px_70px_-30px_rgba(229,9,20,.55)] ${product.bestSeller ? 'border-tomato/70' : 'border-white/[0.07]'}`}
    >
      <button type="button" onClick={() => onOpen(product)} className="relative block aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_60%,#2a0a0c_0%,#0d0d0d_70%)] text-left" aria-label={`Voir le détail : ${product.name}`}>
        <span className="pointer-events-none absolute inset-x-8 bottom-3 h-6 rounded-full bg-black/70 blur-xl" aria-hidden />
        <ProductImage product={product} eager={eager} className="relative h-full w-full p-3 transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.08]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-tomato/0 to-transparent transition-colors duration-500 group-hover:from-tomato/20" aria-hidden />
        {product.bestSeller && <span className="absolute left-3 top-3"><BestSellerBadge /></span>}
      </button>
      <button
        type="button" onClick={() => toggle(product.id)}
        className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-cream backdrop-blur transition-colors hover:bg-black"
        aria-pressed={fav} aria-label={fav ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
      >
        <HeartToggle active={fav} />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="display text-[1.55rem] leading-[1] text-cream">{product.name}</h3>
          <PriceBadge price={product.price} />
        </div>
        {product.description && <p className="text-sm leading-relaxed text-cream/60">{product.description}</p>}
        {product.options && <p className="text-xs text-cream/45">{product.options.join(' · ')}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <button type="button" onClick={() => onOpen(product)} className="text-xs font-semibold uppercase tracking-[0.14em] text-cream/45 underline-offset-4 hover:text-cream hover:underline">
            Détails
          </button>
          <AddButton product={product} onChoose={() => onOpen(product)} />
        </div>
      </div>
    </motion.article>
  )
}
