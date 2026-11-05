'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navIds, site, socials } from '@/content/site'
import { locales, localeMeta, type Dictionary, type Locale } from '@/content/i18n'
import { SocialIcon } from './ui/SocialIcon'
import { Logo } from './ui/Logo'

type Props = { lang: Locale; t: Pick<Dictionary, 'nav' | 'ui'> }

export function Nav({ lang, t }: Props) {
  const nav = navIds.map((id) => ({ id, label: t.nav[id] }))
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const menuBtn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // glass background once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // highlight the section currently in view
  useEffect(() => {
    const els = nav.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // mobile menu: lock scroll, close on Escape, keep focus inside
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = panel.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuBtn.current?.focus()
      }
      if (e.key === 'Tab' && panel.current) {
        const f = [menuBtn.current!, ...panel.current.querySelectorAll<HTMLElement>('a, button')]
        const i = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div
        className={`absolute inset-0 -z-10 border-b transition-all duration-500 ${
          scrolled || open ? 'border-line bg-bg/70 backdrop-blur-xl' : 'border-transparent bg-transparent'
        }`}
      />
      <nav aria-label={t.ui.primaryNav} className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
        <a href="#top" className="group flex items-center gap-2.5 rounded-lg" aria-label={`${site.brand} — ${t.ui.backHome}`}>
          <Logo className="size-8 transition-transform duration-500 group-hover:rotate-[20deg]" />
          <span className="text-[15px] font-semibold tracking-[0.18em]">{site.brand}</span>
        </a>

        <ul className="hidden items-center gap-1 rounded-full border border-line bg-white/[0.025] p-1 backdrop-blur-md lg:flex">
          {nav.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                aria-current={active === n.id ? 'true' : undefined}
                className="relative block rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-ink aria-[current]:text-ink"
              >
                {active === n.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} label={t.ui.language} className="hidden sm:flex" />
          <a href="#contact" className="btn btn-primary hidden !min-h-10 !px-4 text-sm sm:inline-flex">
            {t.ui.startProject} <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </a>
          <button
            ref={menuBtn}
            type="button"
            className="grid size-11 place-items-center rounded-full border border-line-strong bg-white/[0.03] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.ui.closeMenu : t.ui.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={t.ui.menu}
            className="fixed inset-x-0 bottom-0 top-[calc(var(--header-h)+env(safe-area-inset-top))] z-40 overflow-y-auto bg-bg/95 backdrop-blur-2xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container-x flex min-h-full flex-col justify-between pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
              <ul className="space-y-1">
                {nav.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={reduce ? false : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <a
                      href={`#${n.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 border-b border-line py-4 text-[2rem] font-medium tracking-tight"
                    >
                      <span className="font-mono text-xs text-dim">0{i + 1}</span>
                      {n.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <motion.div
                className="mt-10 space-y-6"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <a href="#contact" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                  {t.ui.startProject} <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </a>
                <LangSwitch lang={lang} label={t.ui.language} className="flex w-full [&>a]:flex-1" />
                <div className="flex gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.label} ${t.ui.newTab}`}
                      className="grid size-12 place-items-center rounded-full border border-line-strong"
                    >
                      <SocialIcon k={s.key} />
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/** EN / FR / ع segmented switch. Links point to the same page in another language. */
function LangSwitch({ lang, label, className = '' }: { lang: Locale; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`items-center gap-0.5 rounded-full border border-line-strong bg-white/[0.03] p-1 ${className}`}>
      {locales.map((l) => {
        const m = localeMeta[l]
        const active = l === lang
        return (
          <Link
            key={l}
            href={m.path}
            hrefLang={l}
            lang={l}
            aria-current={active ? 'page' : undefined}
            aria-label={`${m.short} – ${m.label}`}
            title={m.label}
            className={`grid h-8 min-w-9 place-items-center rounded-full px-2.5 text-xs font-medium transition-colors ${
              active ? 'bg-white text-bg' : 'text-muted hover:bg-white/[0.08] hover:text-ink'
            }`}
          >
            {m.short}
          </Link>
        )
      })}
    </div>
  )
}
