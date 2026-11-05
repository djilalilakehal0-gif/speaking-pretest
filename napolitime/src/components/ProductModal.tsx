import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { categories, type Product } from '../data/menu'
import { lineId, useCart } from '../lib/cart'
import { euro } from '../lib/format'
import { useDialog } from '../lib/useDialog'
import { CloseIcon, MinusIcon, PlusIcon } from './icons/Icons'
import { BestSellerBadge, FavButton, Price, ProductImage } from './ProductCard'
import { ease, Ornament } from './Reveal'

export function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return <AnimatePresence>{product && <ModalBody key={product.id} product={product} onClose={onClose} />}</AnimatePresence>
}

function ModalBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(true, onClose)
  const { add, setOpen } = useCart()
  const [qty, setQty] = useState(1)
  const [option, setOption] = useState(product.options?.[0])
  const cat = categories.find((c) => c.id === product.category)!

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.15 } }}>
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-noir/80 backdrop-blur-md" onClick={onClose} tabIndex={-1} />
      <motion.div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="pm-title" data-lenis-prevent
        initial={{ y: 80, opacity: 0, clipPath: 'inset(8% 4% 0% 4% round 2rem)' }}
        animate={{ y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 2rem)' }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative grid max-h-[92dvh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-t-[2rem] border border-gold/15 bg-noir-2 shadow-2xl sm:grid-cols-[1.1fr_1fr] sm:rounded-[2rem]"
      >
        <div className="plate flex aspect-[4/3] items-center justify-center sm:aspect-auto sm:min-h-[500px]">
          <motion.div initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease, delay: 0.1 }} className="h-full w-full">
            <ProductImage product={product} eager className="h-full w-full p-6" />
          </motion.div>
          {product.bestSeller && <span className="absolute left-5 top-5 z-[2]"><BestSellerBadge /></span>}
        </div>

        <div className="flex flex-col p-6 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow">{cat.label} <span className="ml-1 normal-case tracking-normal text-ivory/40" lang="ar" dir="rtl">{cat.labelAr}</span></p>
            <div className="flex gap-2">
              <FavButton product={product} className="!bg-transparent border border-ivory/15 hover:border-gold" />
              <button type="button" onClick={onClose} aria-label="Fermer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory transition-colors hover:border-gold hover:text-gold">
                <CloseIcon size={18} />
              </button>
            </div>
          </div>

          <motion.h2 id="pm-title" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease, delay: 0.15 }}
            className="display mt-6 text-[clamp(2.6rem,6vw,4rem)] text-ivory">{product.name}</motion.h2>
          <Ornament className="mt-4" />
          <Price price={product.price} className="mt-4 block text-3xl text-gold" />
          {product.description && <p className="mt-5 leading-relaxed text-ivory/70">{product.description}</p>}

          {product.options && (
            <fieldset className="mt-7">
              <legend className="eyebrow mb-3">Votre choix</legend>
              <div className="flex flex-wrap gap-2">
                {product.options.map((o) => (
                  <label key={o} className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${option === o ? 'border-gold bg-gold text-noir' : 'border-ivory/15 text-ivory/80 hover:border-ivory/40'}`}>
                    <input type="radio" name="opt" value={o} checked={option === o} onChange={() => setOption(o)} className="sr-only" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <p className="mt-6 text-xs leading-relaxed text-ivory/40">Allergies ou intolérances ? Demandez-nous la composition avant de commander.</p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-auto sm:pt-8">
            <div className="flex h-[3.25rem] items-center rounded-full border border-ivory/15" role="group" aria-label="Quantité">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-12 w-12 items-center justify-center text-ivory hover:text-gold" aria-label="Diminuer la quantité"><MinusIcon size={16} /></button>
              <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-12 w-12 items-center justify-center text-ivory hover:text-gold" aria-label="Augmenter la quantité"><PlusIcon size={16} /></button>
            </div>
            <button
              type="button" data-autofocus
              onClick={() => { add(lineId(product.id, option), qty); onClose(); setTimeout(() => setOpen(true), 300) }}
              className="btn btn-gold flex-1"
            >
              Ajouter · {euro(product.price * qty)}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
