import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LogoMark, Wordmark } from './Logo'
import { lockScroll } from '../lib/smooth'

/** Branded intro: the badge's gold ring sweeps while the wordmark assembles, then a two-layer curtain lifts. */
export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()
  const [show, setShow] = useState(true)

  useEffect(() => {
    const min = reduced ? 300 : 1900
    const start = performance.now()
    let t: number
    const finish = () => {
      const wait = Math.max(0, min - (performance.now() - start))
      t = window.setTimeout(() => setShow(false), wait)
    }
    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
    const failSafe = window.setTimeout(() => setShow(false), 4000)
    return () => { window.clearTimeout(t); window.clearTimeout(failSafe); window.removeEventListener('load', finish) }
  }, [reduced])

  useEffect(() => {
    if (!show) return
    lockScroll(true)
    return () => lockScroll(false)
  }, [show])

  const curtain = { duration: reduced ? 0.2 : 1, ease: [0.76, 0, 0.24, 1] as const }
  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div key="loader" className="fixed inset-0 z-[100]" exit={{ opacity: reduced ? 0 : 1, transition: { duration: reduced ? 0.2 : 1.2 } }}>
          {/* burgundy under-layer lifts a beat after the black one */}
          <motion.div className="absolute inset-0 bg-burgundy" exit={reduced ? undefined : { clipPath: 'inset(0 0 100% 0)', transition: { ...curtain, delay: 0.15 } }} initial={{ clipPath: 'inset(0 0 0% 0)' }} />
          <motion.div
            role="status" aria-live="polite" aria-label="Chargement de NAPOLITIME"
            className="absolute inset-0 flex flex-col items-center justify-center bg-noir"
            initial={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={reduced ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)' }}
            transition={curtain}
          >
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <LogoMark size={128} spin />
            </motion.div>
            <div className="mt-9 overflow-hidden pb-[0.25em]" aria-hidden>
              <motion.div initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                <Wordmark className="text-6xl text-ivory sm:text-7xl" />
              </motion.div>
            </div>
            <motion.p className="mt-4 font-serif text-lg italic text-ivory/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}>
              Il gusto autentico
            </motion.p>
            <div className="mt-9 h-px w-44 overflow-hidden bg-ivory/10">
              <motion.div className="h-full bg-gold" initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.7, ease: [0.65, 0, 0.35, 1] }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
