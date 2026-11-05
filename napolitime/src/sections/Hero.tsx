import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Embers } from '../components/Embers'
import { MagneticButton } from '../components/MagneticButton'
import { ArrowIcon, PhoneIcon } from '../components/icons/Icons'
import { LogoMark } from '../components/Logo'
import { openStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { site } from '../config/site'
import { categories } from '../data/menu'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ease = [0.16, 1, 0.3, 1] as const

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const burger = photo('hero-burger')
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null)
  useEffect(() => setStatus(openStatus()), [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      tl.to('[data-px="food"]', { yPercent: -14, scale: 1.06, ease: 'none' }, 0)
        .to('[data-px="copy"]', { yPercent: 25, opacity: 0.1, ease: 'none' }, 0)
        .to('[data-px="glow"]', { scale: 1.3, opacity: 0.35, ease: 'none' }, 0)
    })
    return () => mm.revert()
  }, { scope: root })

  const show = ready ? 'shown' : 'hidden'
  const item = { hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } }

  return (
    <section ref={root} id="top" className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-[4.5rem]" aria-labelledby="hero-title">
      <div data-px="glow" aria-hidden className="absolute -right-[15%] top-[0%] -z-10 h-[85vmax] w-[85vmax] rounded-full bg-[radial-gradient(circle,rgba(229,9,20,.38)_0%,rgba(229,9,20,.10)_35%,transparent_65%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgba(229,9,20,.18),transparent_60%)]" />
      <Embers className="absolute inset-0 -z-[5] h-full w-full" />

      <div className="container-x relative grid flex-1 items-center gap-8 pb-16 pt-6 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:pb-20">
        <motion.div data-px="copy" initial="hidden" animate={show} variants={{ shown: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }} className="relative z-10">
          <motion.div variants={item}><LogoMark size={110} className="sm:!h-[132px] sm:!w-[132px]" /></motion.div>
          <motion.p variants={item} className="eyebrow mt-7 flex items-center gap-3">
            <span className="h-px w-10 bg-tomato" /> Burger · Sandwich · Tacos · Tex-Mex
          </motion.p>
          <h1 id="hero-title" className="display mt-5 text-[clamp(3.3rem,10vw,8rem)] text-cream" aria-label="The Taste of Excellence">
            {['THE TASTE', 'OF', 'EXCELLENCE'].map((w, i) => (
              <span key={w} className={`block overflow-hidden pb-[0.04em] ${i === 1 ? 'text-[0.5em] tracking-[0.3em] text-cream/60' : ''} ${i === 2 ? 'text-tomato [text-shadow:0_0_60px_rgba(229,9,20,.45)]' : ''}`} aria-hidden>
                <motion.span className="block will-change-transform" variants={{ hidden: { y: '105%' }, shown: { y: '0%', transition: { duration: 1.05, ease } } }}>{w}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={item} className="mt-6 max-w-md text-lg leading-relaxed text-cream/70">
            Des burgers généreux, des sandwichs gourmands et des tacos, préparés à la commande.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <MagneticButton href="#menu" className="btn btn-primary" ariaLabel="Voir le menu">Voir le menu <ArrowIcon /></MagneticButton>
            <MagneticButton href={site.contact.phoneHref} className="btn btn-ghost"><PhoneIcon size={18} /> {site.contact.phoneDisplay}</MagneticButton>
          </motion.div>
          <motion.ul variants={item} className="mt-9 flex flex-wrap gap-2" aria-label="Catégories">
            {categories.map((c) => (
              <li key={c.id}><a href={`#cat-${c.id}`} className="block rounded-full border border-white/12 px-3.5 py-1.5 text-xs font-semibold text-cream/65 transition-colors hover:border-tomato hover:text-cream">{c.label}</a></li>
            ))}
          </motion.ul>
        </motion.div>

        <div className="relative mx-auto w-full max-w-[min(92vw,640px)] lg:max-w-none">
          <motion.div
            data-px="food"
            initial={{ opacity: 0, scale: 0.85, y: 40 }} animate={ready ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 1.5, ease }}
            className="relative aspect-square"
          >
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(229,9,20,.55),transparent_68%)] blur-3xl" aria-hidden />
            <svg viewBox="0 0 100 100" className="spin-slow absolute inset-[3%] h-[94%] w-[94%]" aria-hidden>
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth=".3" strokeDasharray="1 2.2" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#E50914" strokeWidth=".5" strokeDasharray="40 236" strokeLinecap="round" />
            </svg>
            <img
              src={burger.src} srcSet={burger.srcSet} sizes="(min-width:1024px) 50vw, 92vw"
              alt="Cheeseburger : pain brioché, steak juteux et cheddar fondant"
              fetchPriority="high" decoding="async"
              className="relative h-full w-full object-cover [mask-image:radial-gradient(closest-side,#000_62%,transparent_100%)]"
            />
          </motion.div>
          {status && (
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={ready ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 1.1, duration: 0.6, ease }}
              className="absolute right-2 top-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3.5 py-2 text-xs font-bold text-cream backdrop-blur"
            >
              <span className={`h-2 w-2 rounded-full ${status.open ? 'animate-pulse bg-[#3ddc84]' : 'bg-tomato'}`} />
              {status.open ? 'Ouvert maintenant' : status.label}
            </motion.div>
          )}
        </div>
      </div>

      <RedBand />
    </section>
  )
}

/** Scrolling brand band between the hero and the menu. */
function RedBand() {
  const words = ['Burgers', 'Sandwichs', 'Tacos', 'Tex-Mex', 'Milkshakes', 'Qualité', 'Goût', 'Convivialité']
  return (
    <div className="relative z-10 mt-auto overflow-hidden bg-tomato py-3.5 text-white shadow-[0_0_60px_rgba(229,9,20,.5)]" aria-hidden>
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {[...words, ...words, ...words, ...words].map((w, i) => (
          <span key={i} className="display flex items-center gap-10 text-2xl">{w} <span className="text-black/50">✦</span></span>
        ))}
      </div>
    </div>
  )
}
