import { AnimatePresence, motion, useAnimationControls, useMotionValueEvent, useScroll } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import { CartIcon, MenuMorph, PhoneIcon } from './icons/Icons'
import { totals, useCart } from '../lib/cart'
import { euro } from '../lib/format'
import { lockScroll } from '../lib/smooth'
import { site } from '../config/site'

export const navLinks = [
  { id: 'story', label: 'Histoire', it: 'Storia' },
  { id: 'signature', label: 'Signature', it: 'Firma' },
  { id: 'menu', label: 'La carte', it: 'Menù' },
  { id: 'experience', label: 'Expérience', it: 'Esperienza' },
  { id: 'visit', label: 'Restaurant', it: 'Ristorante' },
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
    if (pulse) controls.start({ y: [0, -6, 0, -2, 0], rotate: [0, -10, 8, -4, 0], transition: { duration: 0.6, ease: 'easeOut' } })
  }, [pulse, controls])
  return (
    <button
      type="button" onClick={() => setOpen(true)}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-gold hover:text-gold"
      aria-label={`Ouvrir le panier, ${count} article${count > 1 ? 's' : ''}`}
    >
      <motion.span animate={controls} className="inline-flex"><CartIcon size={20} /></motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-noir"
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
    setHidden(y > 700 && y > prev + 2 && !mobileOpen)
    if (y < prev - 2) setHidden(false)
  })

  useEffect(() => {
    if (!mobileOpen) return
    lockScroll(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => { lockScroll(false); window.removeEventListener('keydown', onKey) }
  }, [mobileOpen])

  return (
    <>
      <a href="#main" className="sr-only z-[90] rounded-full bg-gold px-4 py-2 font-semibold text-noir focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <motion.header
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 ${
          mobileOpen ? 'border-b border-transparent' : scrolled ? 'border-b border-gold/10 bg-noir/85 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <nav className="container-x flex h-[4.25rem] items-center justify-between gap-4 sm:h-[4.75rem]" aria-label="Navigation principale">
          <a href="#top" aria-label="Accueil NAPOLITIME" onClick={() => setMobileOpen(false)}><Logo compact /></a>

          <ul className="hidden items-center lg:flex">
            {navLinks.map((l) => (
              <li key={l.id} className="relative">
                <a href={`#${l.id}`} aria-current={active === l.id ? 'true' : undefined}
                  className={`group relative block px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors xl:px-4 ${active === l.id ? 'text-gold' : 'text-ivory/70 hover:text-ivory'}`}>
                  <span className="relative block overflow-hidden">
                    <span className="block transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-full">{l.label}</span>
                    <span className="absolute inset-0 block translate-y-full font-serif text-[13px] normal-case italic tracking-normal text-gold transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0" aria-hidden>{l.it}</span>
                  </span>
                  {active === l.id && (
                    <motion.span layoutId="nav-indicator" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-gold" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a href="#menu" className="btn btn-gold hidden !min-h-11 !px-5 sm:inline-flex">Commander</a>
            <CartButton />
            <button
              type="button" onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 text-ivory lg:hidden"
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
            id="mobile-nav" data-lenis-prevent
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="grain fixed inset-0 z-40 flex flex-col overflow-y-auto bg-burgundy px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-28 lg:hidden"
          >
            <motion.ul initial="hidden" animate="shown" variants={{ shown: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }} className="flex flex-col">
              {[{ id: 'top', label: 'Accueil', it: 'Home' }, ...navLinks].map((l, i) => (
                <motion.li key={l.id} variants={{ hidden: { opacity: 0, y: 40 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }} className="border-b border-ivory/10">
                  <a href={`#${l.id}`} onClick={() => setMobileOpen(false)} className="flex items-baseline gap-4 py-3.5 text-ivory active:text-gold">
                    <span className="font-serif text-sm italic text-gold">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display text-[2.6rem] leading-none">{l.label}</span>
                    <span className="ml-auto font-serif text-base italic text-ivory/40">{l.it}</span>
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-auto space-y-3 pt-10">
              <a href={site.contact.phoneHref} className="btn btn-line w-full"><PhoneIcon size={16} /> {site.contact.phoneDisplay}</a>
              <a href="#menu" onClick={() => setMobileOpen(false)} className="btn btn-gold w-full">Commander</a>
            </motion.div>
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
          <button type="button" onClick={() => setOpen(true)} className="btn btn-burgundy w-full justify-between !px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,.7)]">
            <span>Voir le panier · {t.count}</span>
            <span className="font-serif text-base normal-case tracking-normal">{euro(t.subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
