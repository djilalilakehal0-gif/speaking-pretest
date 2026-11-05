import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Product } from '../data/menu'
import { useCart } from '../lib/cart'
import { useFavourites } from '../lib/favourites'
import { euro } from '../lib/format'
import { AddMorph, HeartToggle, StarIcon } from './icons/Icons'
import { LogoMark } from './Logo'
import { ease } from './Reveal'

const base = import.meta.env.BASE_URL
export const menuImage = (name: string) => `${base}menu/${name}.webp`

/** Product photo, or a branded "photo à venir" visual when none is set yet. */
export function ProductImage({ product, className = '', eager = false }: { product: Product; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (!product.image || failed)
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <LogoMark size={60} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/70">Photo à venir</span>
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

/** Price set in the serif, like a printed Italian menu. */
export function Price({ price, className = '' }: { price: number; className?: string }) {
  return <span className={`font-serif font-semibold [font-variant-numeric:lining-nums_tabular-nums] ${className}`}>{euro(price)}</span>
}

export function BestSellerBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-noir shadow-lg">
      <StarIcon size={11} /> Best seller
    </span>
  )
}

export function AddButton({ product, onChoose, tone = 'light', className = '' }: { product: Product; onChoose?: () => void; tone?: 'light' | 'dark'; className?: string }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1400)
    return () => clearTimeout(t)
  }, [done])
  const needsChoice = !!product.options?.length
  const idle = tone === 'light' ? 'bg-burgundy text-ivory hover:bg-noir' : 'bg-gold text-noir hover:bg-ivory'
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (needsChoice) { onChoose?.(); return }
        add(product.id); setDone(true)
      }}
      whileTap={{ scale: 0.92 }}
      className={`inline-flex h-11 items-center gap-2 rounded-full pl-3.5 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${done ? 'bg-ok text-noir' : idle} ${className}`}
      aria-label={needsChoice ? `Choisir pour ${product.name}` : `Ajouter ${product.name} au panier`}
    >
      <AddMorph done={done} size={16} />
      <span aria-live="polite">{done ? 'Ajouté' : needsChoice ? 'Choisir' : 'Ajouter'}</span>
    </motion.button>
  )
}

export function FavButton({ product, className = '' }: { product: Product; className?: string }) {
  const { isFav, toggle } = useFavourites()
  const fav = isFav(product.id)
  return (
    <button
      type="button" onClick={(e) => { e.stopPropagation(); toggle(product.id) }}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-noir/60 text-ivory backdrop-blur transition-colors hover:bg-noir ${className}`}
      aria-pressed={fav} aria-label={fav ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
    >
      <HeartToggle active={fav} size={18} />
    </button>
  )
}

/** Menu card on the ivory menu: dark photo plate, serif name, dotted leader to the price. */
export function ProductCard({ product, onOpen, eager = false, index = 0 }: { product: Product; onOpen: (p: Product) => void; eager?: boolean; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease, delay: (index % 4) * 0.07 }}
      className="group relative flex flex-col rounded-[1.25rem] bg-white p-2.5 shadow-[0_1px_0_rgba(17,17,17,.06),0_20px_50px_-35px_rgba(74,10,23,.45)] transition-[box-shadow,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1.5 hover:shadow-[0_1px_0_rgba(17,17,17,.06),0_40px_80px_-40px_rgba(74,10,23,.6)]"
    >
      <button type="button" onClick={() => onOpen(product)} className="plate block aspect-[16/10] rounded-[0.9rem] text-left sm:aspect-[16/11]" aria-label={`Voir le détail : ${product.name}`}>
        <ProductImage product={product} eager={eager} className="h-full w-full p-2 transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.07]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gold/0 via-gold/0 to-gold/0 transition-colors duration-700 group-hover:to-gold/10" aria-hidden />
        {product.bestSeller && <span className="absolute left-3 top-3 z-[2]"><BestSellerBadge /></span>}
      </button>
      <FavButton product={product} className="absolute right-5 top-5 z-[2]" />

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-4">
        <div className="flex items-baseline gap-2">
          <h4 className="display text-[1.7rem] leading-[1.05] text-noir">{product.name}</h4>
          <span className="mb-1.5 min-w-4 flex-1 border-b border-dotted border-noir/25" aria-hidden />
          <Price price={product.price} className="text-[1.35rem] text-burgundy" />
        </div>
        {product.description && <p className="mt-2 text-sm leading-relaxed text-noir/60">{product.description}</p>}
        {product.options && <p className="mt-2 text-xs italic text-noir/50">{product.options.join(' · ')}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <button type="button" onClick={() => onOpen(product)} className="link-u text-[11px] font-semibold uppercase tracking-[0.2em] text-noir/50 hover:text-noir">
            Détails
          </button>
          <AddButton product={product} onChoose={() => onOpen(product)} />
        </div>
      </div>
    </motion.article>
  )
}
