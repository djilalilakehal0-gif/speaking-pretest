import { AnimatePresence, motion, useAnimationControls, useMotionValueEvent, useScroll } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LogoMark } from './Logo'
import { CartIcon, MenuMorph } from './icons/Icons'
import { totals, useCart } from '../lib/cart'
import { euro } from '../lib/format'

export const navLinks = [
  { id: 'menu', label: 'La carte' },
  { id: 'visit', label: 'Le restaurant' },
]

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [ids])
  return active
}

function CartButton() {
  const { lines, setOpen, pulse, fulfilment } = useCart()
  const { count } = totals(lines, fulfilment)
  const controls = useAnimationControls()
  useEffect(() => {
    if (pulse) controls.start({ y: [0, -7, 0, -3, 0], rotate: [0, -10, 8, -4, 0], transition: { duration: 0.6, ease: 'easeOut' } })
  }, [pulse, controls])
  return (
    <button
      type="button" onClick={() => setOpen(true)}
      className="relative inline-flex h-12 w-12 items-center justify-center bg-ink-3 text-cream transition-colors hover:bg-white hover:text-ink"
      aria-label={`Ouvrir le panier, ${count} article${count > 1 ? 's' : ''}`}
    >
      <motion.span animate={controls} className="inline-flex"><CartIcon size={22} /></motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center bg-tomato px-1 text-sm font-bold text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const active = useActiveSection(navLinks.map((l) => l.id))

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 40)
    setHidden(y > 600 && y > prev && !mobileOpen)
  })

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <>
      <a href="#main" className="sr-only z-[90] bg-white px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <motion.header
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || mobileOpen ? 'bg-ink' : 'bg-transparent'}`}
      >
        <nav className="container-x flex h-[4.5rem] items-center justify-between gap-4" aria-label="Navigation principale">
          <a href="#top" aria-label="Accueil NAPOLITIME" onClick={() => setMobileOpen(false)}><LogoMark size={52} /></a>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.id} className="relative">
                <a href={`#${l.id}`} aria-current={active === l.id ? 'true' : undefined}
                  className={`relative block px-4 py-2 text-[length:var(--step-body)] transition-colors ${active === l.id ? 'text-cream' : 'text-cream/75 hover:text-cream'}`}>
                  {l.label}
                  {active === l.id && (
                    <motion.span layoutId="nav-indicator" className="absolute inset-x-4 -bottom-0.5 h-[3px] bg-white" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            
            <CartButton />
            <button
              type="button" onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex h-12 w-12 items-center justify-center bg-ink-3 text-cream lg:hidden"
              aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <MenuMorph open={mobileOpen} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-ink px-6 pb-10 pt-28 lg:hidden"
          >
            <motion.ul initial="hidden" animate="shown" variants={{ shown: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }} className="flex flex-col gap-2">
              {[{ id: 'top', label: 'Accueil' }, ...navLinks].map((l) => (
                <motion.li key={l.id} variants={{ hidden: { opacity: 0, x: 40 }, shown: { opacity: 1, x: 0 } }}>
                  <a href={`#${l.id}`} onClick={() => setMobileOpen(false)} className="display block py-2 text-6xl text-cream active:text-tomato">
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <a href="#menu" onClick={() => setMobileOpen(false)} className="btn btn-primary mt-auto w-full">Voir le menu</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** Mobile: a sticky "view order" bar keeps the cart one tap away once something is in it. */
export function MobileCartBar() {
  const { lines, fulfilment, setOpen, open } = useCart()
  const t = totals(lines, fulfilment)
  return (
    <AnimatePresence>
      {t.count > 0 && !open && (
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
        >
          <button type="button" onClick={() => setOpen(true)} className="btn btn-primary w-full justify-between !px-6">
            <span>Voir le panier ({t.count})</span>
            <span>{euro(t.subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
