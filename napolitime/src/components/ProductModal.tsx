import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { categories, type Product } from '../data/menu'
import { lineId, useCart } from '../lib/cart'
import { useFavourites } from '../lib/favourites'
import { euro } from '../lib/format'
import { useDialog } from '../lib/useDialog'
import { CloseIcon, HeartToggle, MinusIcon, PlusIcon } from './icons/Icons'
import { BestSellerBadge, PriceBadge, ProductImage } from './ProductCard'

export function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return <AnimatePresence>{product && <ModalBody key={product.id} product={product} onClose={onClose} />}</AnimatePresence>
}

function ModalBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(true, onClose)
  const { add, setOpen } = useCart()
  const { isFav, toggle } = useFavourites()
  const [qty, setQty] = useState(1)
  const [option, setOption] = useState(product.options?.[0])
  const ease = [0.16, 1, 0.3, 1] as const
  const cat = categories.find((c) => c.id === product.category)!

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} tabIndex={-1} />
      <motion.div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="pm-title"
        initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease }}
        className="relative grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] border border-white/[0.08] bg-ink-2 shadow-2xl sm:grid-cols-2 sm:rounded-[2rem]"
      >
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_55%,#3a0a0e_0%,#0b0b0b_70%)] sm:aspect-auto sm:min-h-[460px]">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease }} className="h-full w-full">
            <ProductImage product={product} eager className="h-full w-full p-6" />
          </motion.div>
          {product.bestSeller && <span className="absolute left-5 top-5"><BestSellerBadge /></span>}
        </div>

        <div className="flex flex-col p-6 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow">{cat.label} <span className="ml-1 normal-case tracking-normal text-cream/40" lang="ar" dir="rtl">{cat.labelAr}</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={() => toggle(product.id)} aria-pressed={isFav(product.id)}
                aria-label={isFav(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-cream hover:border-tomato">
                <HeartToggle active={isFav(product.id)} />
              </button>
              <button type="button" onClick={onClose} aria-label="Fermer" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-cream hover:border-tomato hover:text-tomato">
                <CloseIcon />
              </button>
            </div>
          </div>

          <h2 id="pm-title" className="display mt-4 text-5xl text-cream">{product.name}</h2>
          <div className="mt-4"><PriceBadge price={product.price} large /></div>
          {product.description && <p className="mt-5 leading-relaxed text-cream/75">{product.description}</p>}

          {product.options && (
            <fieldset className="mt-6">
              <legend className="eyebrow mb-3">Votre choix</legend>
              <div className="flex flex-wrap gap-2">
                {product.options.map((o) => (
                  <label key={o} className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white ${option === o ? 'border-tomato bg-tomato text-white' : 'border-white/15 text-cream/80 hover:border-white/40'}`}>
                    <input type="radio" name="opt" value={o} checked={option === o} onChange={() => setOption(o)} className="sr-only" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <p className="mt-6 text-xs leading-relaxed text-cream/40">Allergies ou intolérances ? Demandez-nous la composition avant de commander.</p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-auto sm:pt-8">
            <div className="flex h-12 items-center rounded-full border border-white/15" role="group" aria-label="Quantité">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-12 w-12 items-center justify-center text-cream hover:text-tomato" aria-label="Diminuer la quantité"><MinusIcon /></button>
              <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-12 w-12 items-center justify-center text-cream hover:text-tomato" aria-label="Augmenter la quantité"><PlusIcon /></button>
            </div>
            <button
              type="button" data-autofocus
              onClick={() => { add(lineId(product.id, option), qty); onClose(); setTimeout(() => setOpen(true), 250) }}
              className="btn btn-primary flex-1"
            >
              Ajouter · {euro(product.price * qty)}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
