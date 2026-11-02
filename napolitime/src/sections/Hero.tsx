import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Embers } from '../components/Embers'
import { LogoMark } from '../components/Logo'
import { openStatus } from '../lib/hours'
import { MagneticButton } from '../components/MagneticButton'
import { ArrowIcon, StarIcon } from '../components/icons/Icons'
import { Basil, Tomato, Chili } from '../components/Ingredients'
import { photo } from '../lib/img'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ease = [0.16, 1, 0.3, 1] as const

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const store = photo('storefront')
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null)
  useEffect(() => setStatus(openStatus()), [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      tl.to('[data-px="store"]', { yPercent: -10, ease: 'none' }, 0)
        .to('[data-px="copy"]', { yPercent: 30, opacity: 0.1, ease: 'none' }, 0)
        .to('[data-px="glow"]', { scale: 1.4, opacity: 0.4, ease: 'none' }, 0)
        .to('[data-px="ing"]', { yPercent: -120, ease: 'none', stagger: 0.02 }, 0)
    })
    return () => mm.revert()
  }, { scope: root })

  const show = ready ? 'shown' : 'hidden'

  return (
    <section ref={root} id="top" className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-[4.5rem]" aria-labelledby="hero-title">
      {/* Warm cinematic lighting */}
      <div data-px="glow" aria-hidden className="absolute -right-[20%] top-[5%] -z-10 h-[90vmax] w-[90vmax] rounded-full bg-[radial-gradient(circle,rgba(230,57,50,.32)_0%,rgba(245,185,66,.12)_35%,transparent_65%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_100%,rgba(245,185,66,.10),transparent_55%)]" />
      <Embers className="absolute inset-0 -z-[5] h-full w-full" />

      <div className="container-x relative grid flex-1 items-center gap-6 pb-24 pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:pb-28">
        {/* Copy */}
        <motion.div data-px="copy" initial="hidden" animate={show} variants={{ shown: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }} className="relative z-10 order-1">
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }} className="eyebrow flex items-center gap-3">
            <span className="h-px w-10 bg-gold" /> Pizza · Burger · Sandwich · Tacos
          </motion.p>
          <h1 id="hero-title" className="display mt-5 text-[clamp(3.4rem,10.5vw,8.6rem)] text-cream" aria-label="Real flavor. Unforgettable moments.">
            {['REAL', 'FLAVOR.', 'UNFORGETTABLE', 'MOMENTS.'].map((w, i) => (
              <span key={w} className={`block overflow-hidden pb-[0.04em] ${i === 2 ? 'text-[0.62em] tracking-[0.02em]' : ''} ${i === 3 ? 'text-tomato' : ''}`} aria-hidden>
                <motion.span className="block will-change-transform" variants={{ hidden: { y: '105%' }, shown: { y: '0%', transition: { duration: 1.05, ease } } }}>
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }} className="mt-6 max-w-md text-lg leading-relaxed text-cream/70">
            Authentic pizza. Legendary burgers. <span className="italian text-xl text-gold">Made fresh, made with passion.</span>
          </motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <MagneticButton href="#menu" className="btn btn-ghost">Explore our menu</MagneticButton>
            <MagneticButton href="#menu" className="btn btn-primary" ariaLabel="Order now — go to the menu">
              Order now <ArrowIcon />
            </MagneticButton>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 1 } } }} className="mt-9 flex items-center gap-4 text-sm text-cream/55">
            <span className="flex">{[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} size={16} />)}</span>
            <span>Wood-fired at 485 °C · Smashed to order</span>
          </motion.div>
        </motion.div>

        {/* Storefront */}
        <div className="relative order-2 mx-auto w-full max-w-[min(92vw,600px)] lg:max-w-none">
          <motion.div
            data-px="store"
            initial={{ opacity: 0, y: 60, scale: 0.92, rotate: 2 }}
            animate={ready ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 1.4, ease }}
            className="relative"
          >
            <div className="absolute -inset-[8%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(245,185,66,.28),transparent_62%)] blur-2xl" aria-hidden />
            <div className="relative aspect-[1151/1220] overflow-hidden rounded-[2rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,.95),0_0_0_1px_rgba(245,185,66,.25)]">
              <img
                src={store.src} srcSet={store.srcSet} sizes="(min-width:1024px) 46vw, 92vw"
                alt="The NAPOLITIME restaurant front at night: illuminated sign, open door and the counter inside"
                fetchPriority="high" decoding="async"
                className="kenburns h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(16,16,16,.75)_100%)]" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 pr-28 sm:p-6 sm:pr-36">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Pizza · Burger · Sandwich · Tacos</p>
                  <p className="display mt-1 text-2xl text-cream sm:text-3xl">Qualité · Goût · Convivialité</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -40 }} animate={ready ? { scale: 1, rotate: -8 } : {}}
            transition={{ type: 'spring', stiffness: 150, damping: 13, delay: 0.9 }}
            className="absolute -bottom-6 -right-3 sm:-bottom-8 sm:-right-6"
          >
            <LogoMark size={96} className="sm:!h-[128px] sm:!w-[128px]" />
          </motion.div>

          {status && (
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={ready ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 1.2, duration: 0.6, ease }}
              className="absolute left-4 top-[30%] inline-flex sm:left-auto sm:right-4 sm:top-[42%] items-center gap-2 rounded-full bg-ink/80 px-3.5 py-2 text-xs font-bold text-cream backdrop-blur"
            >
              <span className={`h-2 w-2 rounded-full ${status.open ? 'animate-pulse bg-[#9be07c]' : 'bg-tomato'}`} />
              {status.open ? 'Open now' : status.label}
            </motion.div>
          )}

          {/* Floating ingredients */}
          <div data-px="ing" className="float absolute -right-3 top-[30%] w-[11%]" style={{ ['--dur' as string]: '7s', ['--r' as string]: '-20deg' }}><Basil /></div>
          <div data-px="ing" className="float absolute -left-4 top-[58%] w-[9%]" style={{ ['--dur' as string]: '6s', ['--delay' as string]: '1s', ['--r' as string]: '15deg' }}><Tomato /></div>
          <div data-px="ing" className="float absolute -top-4 left-[46%] w-[7%]" style={{ ['--dur' as string]: '5.5s', ['--delay' as string]: '.5s', ['--r' as string]: '35deg' }}><Chili /></div>
        </div>
      </div>

      <a href="#featured" className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/40 hover:text-cream lg:flex" aria-label="Scroll to featured dishes">
        Scroll
        <motion.span className="block h-10 w-px origin-top bg-cream/40" animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      </a>

      <CheeseBand />
    </section>
  )
}

/** Melting-cheese edge + marquee: the hero literally drips into the page. */
function CheeseBand() {
  const words = ['Wood-fired', 'Smashed to order', '48h dough', 'San Marzano DOP', 'Fior di latte', 'Fresh every day']
  return (
    <div className="relative z-10 mt-auto" aria-hidden>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-8 w-full text-gold sm:h-12">
        <path fill="currentColor" d="M0 60V30c40 0 50 22 80 22s30-30 70-30 38 34 76 34 34-24 70-24 40 18 80 18 38-36 78-36 34 28 70 28 42-22 80-22 36 30 74 30 40-30 80-30 30 22 70 22 42-34 82-34 34 26 74 26 38-18 76-18 40 32 80 32 30-28 70-28 40 20 80 20 36-24 70-24 40 24 60 24V60Z" />
      </svg>
      <div className="-mt-px overflow-hidden bg-gold py-3.5 text-ink">
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {[...words, ...words, ...words, ...words].map((w, i) => (
            <span key={i} className="display flex items-center gap-10 text-2xl">
              {w} <span className="text-tomato">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
