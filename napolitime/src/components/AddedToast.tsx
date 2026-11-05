import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { catalog, useCart } from '../lib/cart'
import { Lottie } from './Lottie'
import added from '../lottie/added.json'

/** "Added to cart" confirmation with a Lottie burst. Announced politely to screen readers. */
export function AddedToast() {
  const { pulse, lastAdded, setOpen, open } = useCart()
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!pulse) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2600)
    return () => clearTimeout(t)
  }, [pulse])
  const item = lastAdded ? catalog.get(lastAdded) : undefined
  const name = item ? `${item.name}${item.option ? ` (${item.option})` : ''}` : ''
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[65] flex justify-center px-4 sm:bottom-8">
      <AnimatePresence>
        {visible && !open && (
          <motion.div
            key={pulse}
            initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-ivory/10 bg-charcoal/95 py-2 pl-2 pr-3 shadow-2xl backdrop-blur"
          >
            {reduced ? <span className="ml-2 text-[#e8a0ad]">✓</span> : <Lottie data={added} size={44} play={pulse} />}
            <p className="text-sm"><span className="font-semibold">{name}</span> <span className="text-ivory/60">ajouté</span></p>
            <button type="button" onClick={() => setOpen(true)} className="ml-2 rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-noir hover:bg-ivory hover:text-noir">Panier</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
