import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LogoMark } from './Logo'

/** Branded intro: the pizza-clock sweeps while the wordmark assembles, then wipes away. */
export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()
  const [show, setShow] = useState(true)

  useEffect(() => {
    const min = reduced ? 300 : 1700
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
    document.body.style.overflow = show ? 'hidden' : ''
  }, [show])

  const letters = 'NAPOLITIME'.split('')
  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          key="loader"
          role="status" aria-live="polite" aria-label="Loading NAPOLITIME"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={reduced ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
            <LogoMark size={150} spin />
          </motion.div>
          <div className="mt-7 flex overflow-hidden display text-5xl tracking-[0.06em] sm:text-6xl" aria-hidden>
            {letters.map((l, i) => (
              <motion.span
                key={i}
                className={i >= 6 ? 'text-gold' : 'text-cream'}
                initial={{ y: '110%' }} animate={{ y: '0%' }}
                transition={{ delay: 0.25 + i * 0.045, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <motion.p className="italian mt-3 text-xl text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            Taste the Moment.
          </motion.p>
          <div className="mt-8 h-px w-40 overflow-hidden bg-cream/10">
            <motion.div className="h-full bg-gold" initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
