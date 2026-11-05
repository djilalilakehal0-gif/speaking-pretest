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
            className="pointer-events-auto flex items-center gap-3 bg-white py-2 pl-2 pr-2 text-ink"
          >
            {reduced ? <span className="ml-2 text-tomato"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5 10 17.5 19 7" /></svg></span> : <Lottie data={added} size={44} play={pulse} />}
            <p className="text-[length:var(--step-body)]"><span className="font-medium">{name}</span> <span className="text-ink/70">ajouté</span></p>
            <button type="button" onClick={() => setOpen(true)} className="btn ml-2 !min-h-11 bg-ink !px-4 text-white hover:bg-tomato">Panier</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
