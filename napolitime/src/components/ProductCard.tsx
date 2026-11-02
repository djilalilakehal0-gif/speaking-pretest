import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Product } from '../data/menu'
import { useCart } from '../lib/cart'
import { useFavourites } from '../lib/favourites'
import { euro } from '../lib/format'
import { photo } from '../lib/img'
import { AddMorph, FlameIcon, HeartToggle, LeafIcon, StarIcon } from './icons/Icons'

export function TagBadge({ tag }: { tag: NonNullable<Product['tags']>[number] }) {
  const map = {
    bestseller: { label: 'Best seller', cls: 'bg-gold text-ink', icon: <StarIcon size={12} /> },
    spicy: { label: 'Spicy', cls: 'bg-tomato text-white', icon: <FlameIcon size={12} live /> },
    vegetarian: { label: 'Veggie', cls: 'bg-cream text-ink', icon: <LeafIcon size={12} /> },
    new: { label: 'New', cls: 'bg-white text-ink', icon: null },
    signature: { label: 'Signature', cls: 'bg-ink text-gold border border-gold/50', icon: null },
  }[tag]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${map.cls}`}>
      {map.icon}{map.label}
    </span>
  )
}

export function AddButton({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1400)
    return () => clearTimeout(t)
  }, [done])
  return (
    <motion.button
      type="button"
      onClick={(e) => { e.stopPropagation(); add(id); setDone(true) }}
      whileTap={{ scale: 0.9 }}
      className={`inline-flex h-11 items-center gap-2 rounded-full pl-3 pr-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${done ? 'bg-gold text-ink' : 'bg-tomato text-white hover:bg-[#f0463f]'} ${className}`}
      aria-label={`Add ${name} to cart`}
    >
      <AddMorph done={done} />
      <span aria-live="polite">{done ? 'Added' : 'Add'}</span>
    </motion.button>
  )
}

export function ProductCard({ product, onOpen, priority = false }: { product: Product; onOpen: (p: Product) => void; priority?: boolean }) {
  const { isFav, toggle } = useFavourites()
  const img = photo(product.image)
  const fav = isFav(product.id)
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="group card-surface relative flex flex-col overflow-hidden rounded-[1.75rem]"
    >
      <button
        type="button" onClick={() => onOpen(product)}
        className="relative block aspect-[4/3] overflow-hidden text-left"
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={img.src} srcSet={img.srcSet} sizes="(min-width:1280px) 400px, (min-width:640px) 50vw, 100vw"
          alt={product.name} loading={priority ? 'eager' : 'lazy'} decoding="async"
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.08]"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          {product.tags?.slice(0, 2).map((t) => <TagBadge key={t} tag={t} />)}
        </span>
        <span className="absolute bottom-4 left-4 translate-y-2 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View details
        </span>
      </button>
      <button
        type="button" onClick={() => toggle(product.id)}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-cream backdrop-blur transition-colors hover:bg-ink"
        aria-pressed={fav} aria-label={fav ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
      >
        <HeartToggle active={fav} />
      </button>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="display text-[1.7rem] text-cream">{product.name}</h3>
          <p className="display shrink-0 pt-1 text-xl text-gold">{euro(product.price)}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream/60">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <button type="button" onClick={() => onOpen(product)} className="text-xs font-semibold uppercase tracking-[0.14em] text-cream/50 underline-offset-4 hover:text-cream hover:underline">
            Ingredients & allergens
          </button>
          <AddButton id={product.id} name={product.name} />
        </div>
      </div>
    </motion.article>
  )
}
