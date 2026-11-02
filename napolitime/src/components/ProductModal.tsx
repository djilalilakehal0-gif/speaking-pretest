import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { allergenLabels, type Product } from '../data/menu'
import { useCart } from '../lib/cart'
import { useFavourites } from '../lib/favourites'
import { euro } from '../lib/format'
import { photo } from '../lib/img'
import { useDialog } from '../lib/useDialog'
import { CloseIcon, HeartToggle, MinusIcon, PlusIcon } from './icons/Icons'
import { TagBadge } from './ProductCard'

export function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return <AnimatePresence>{product && <ModalBody key={product.id} product={product} onClose={onClose} />}</AnimatePresence>
}

function ModalBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(true, onClose)
  const { add, setOpen } = useCart()
  const { isFav, toggle } = useFavourites()
  const [qty, setQty] = useState(1)
  const img = photo(product.image)
  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close details" className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} tabIndex={-1} />
      <motion.div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="pm-title"
        initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.55, ease }}
        className="relative grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-ink-2 shadow-2xl sm:grid-cols-2 sm:rounded-[2rem]"
      >
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:min-h-[520px]">
          <motion.img
            src={img.src} srcSet={img.srcSet} sizes="(min-width:640px) 450px, 100vw" alt={product.name}
            initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-ink-2/60" />
        </div>

        <div className="flex flex-col p-6 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">{product.tags?.map((t) => <TagBadge key={t} tag={t} />)}</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => toggle(product.id)} aria-pressed={isFav(product.id)}
                aria-label={isFav(product.id) ? 'Remove from favourites' : 'Add to favourites'}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream hover:border-tomato">
                <HeartToggle active={isFav(product.id)} />
              </button>
              <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream hover:border-gold hover:text-gold">
                <CloseIcon />
              </button>
            </div>
          </div>

          <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}>
            <motion.h2 id="pm-title" variants={{ h: { opacity: 0, y: 20 }, s: { opacity: 1, y: 0 } }} className="display mt-5 text-5xl text-cream">{product.name}</motion.h2>
            <motion.p variants={{ h: { opacity: 0, y: 20 }, s: { opacity: 1, y: 0 } }} className="display mt-2 text-3xl text-gold">{euro(product.price)}</motion.p>
            <motion.p variants={{ h: { opacity: 0, y: 20 }, s: { opacity: 1, y: 0 } }} className="mt-4 leading-relaxed text-cream/75">{product.description}</motion.p>
            {product.note && (
              <motion.p variants={{ h: { opacity: 0, y: 20 }, s: { opacity: 1, y: 0 } }} className="italian mt-3 text-lg text-cream/60">“{product.note}”</motion.p>
            )}
            <motion.div variants={{ h: { opacity: 0, y: 20 }, s: { opacity: 1, y: 0 } }} className="mt-6">
              <h3 className="eyebrow mb-3">Ingredients</h3>
              <ul className="flex flex-wrap gap-2">
                {product.ingredients.map((i) => <li key={i} className="rounded-full border border-cream/12 px-3 py-1.5 text-sm text-cream/80">{i}</li>)}
              </ul>
            </motion.div>
            <motion.div variants={{ h: { opacity: 0, y: 20 }, s: { opacity: 1, y: 0 } }} className="mt-5">
              <h3 className="eyebrow mb-3">Allergens</h3>
              <p className="text-sm text-cream/70">
                {product.allergens.length ? product.allergens.map((a) => allergenLabels[a]).join(' · ') : 'No declarable allergens.'}
              </p>
              <p className="mt-1 text-xs text-cream/40">Prepared in a kitchen that handles all 14 EU allergens. Ask us if you have an allergy.</p>
            </motion.div>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-auto sm:pt-8">
            <div className="flex h-12 items-center rounded-full border border-cream/15" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-12 w-12 items-center justify-center text-cream hover:text-gold" aria-label="Decrease quantity"><MinusIcon /></button>
              <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-12 w-12 items-center justify-center text-cream hover:text-gold" aria-label="Increase quantity"><PlusIcon /></button>
            </div>
            <button
              type="button" data-autofocus
              onClick={() => { add(product.id, qty); onClose(); setTimeout(() => setOpen(true), 250) }}
              className="btn btn-primary flex-1"
            >
              Add {qty > 1 ? `${qty} ` : ''}· {euro(product.price * qty)}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
