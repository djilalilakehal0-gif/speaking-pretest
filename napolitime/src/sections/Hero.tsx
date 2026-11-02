import { motion } from 'framer-motion'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Embers } from '../components/Embers'
import { Steam } from '../components/Steam'
import { MagneticButton } from '../components/MagneticButton'
import { ArrowIcon, StarIcon } from '../components/icons/Icons'
import { Basil, Tomato, Chili, Pepper } from '../components/Ingredients'
import { photo } from '../lib/img'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ease = [0.16, 1, 0.3, 1] as const

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const pizza = photo('hero-pizza')
  const burger = photo('hero-burger')

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      tl.to('[data-px="pizza"]', { yPercent: -18, rotate: 25, ease: 'none' }, 0)
        .to('[data-px="burger"]', { yPercent: -45, ease: 'none' }, 0)
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
            <span className="h-px w-10 bg-gold" /> Pizza napoletana · Gourmet burgers
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

        {/* Food stage */}
        <div className="relative order-2 mx-auto aspect-square w-full max-w-[min(92vw,640px)] lg:max-w-none">
          <motion.div
            data-px="pizza"
            initial={{ scale: 0.6, opacity: 0, rotate: -60 }}
            animate={ready ? { scale: 1, opacity: 1, rotate: 0 } : {}}
            transition={{ duration: 1.6, ease }}
            className="absolute right-0 top-0 aspect-square w-[86%]"
          >
            <div className="absolute inset-[-6%] rounded-full bg-[radial-gradient(circle,rgba(245,185,66,.25),transparent_62%)] blur-2xl" aria-hidden />
            <div className="relative h-full w-full overflow-hidden rounded-full shadow-[0_60px_120px_-30px_rgba(0,0,0,.9),0_0_0_1px_rgba(245,185,66,.15)]">
              <img
                src={pizza.src} srcSet={pizza.srcSet} sizes="(min-width:1024px) 50vw, 90vw"
                alt="Freshly baked Neapolitan pizza with blistered crust, tomato and basil"
                fetchPriority="high" decoding="async"
                className="spin-slow h-full w-full scale-[1.32] object-cover"
              />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,220,160,.18),transparent_45%),radial-gradient(circle,transparent_55%,rgba(0,0,0,.55)_100%)]" aria-hidden />
            </div>
            <Steam className="absolute -top-[22%] left-[10%] h-[55%] w-[80%]" />
          </motion.div>

          <motion.div
            data-px="burger"
            initial={{ x: -80, y: 60, opacity: 0, scale: 0.8 }}
            animate={ready ? { x: 0, y: 0, opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.25, ease }}
            className="absolute -bottom-[4%] left-[-6%] w-[62%]"
          >
            <img
              src={burger.src} srcSet={burger.srcSet} sizes="(min-width:1024px) 34vw, 60vw"
              alt="Juicy gourmet cheeseburger with melted cheddar"
              decoding="async"
              className="w-full [mask-image:radial-gradient(ellipse_52%_48%_at_50%_52%,#000_60%,transparent_100%)] drop-shadow-[0_40px_60px_rgba(0,0,0,.8)]"
            />
          </motion.div>

          {/* Floating ingredients */}
          <div data-px="ing" className="float absolute left-[8%] top-[6%] w-[11%]" style={{ ['--dur' as string]: '7s', ['--r' as string]: '-20deg' }}><Basil /></div>
          <div data-px="ing" className="float absolute right-[2%] top-[78%] w-[10%]" style={{ ['--dur' as string]: '6s', ['--delay' as string]: '1s', ['--r' as string]: '15deg' }}><Tomato /></div>
          <div data-px="ing" className="float absolute left-[40%] top-[-2%] w-[7%]" style={{ ['--dur' as string]: '5.5s', ['--delay' as string]: '.5s', ['--r' as string]: '35deg' }}><Chili /></div>
          <div data-px="ing" className="float absolute bottom-[6%] right-[30%] w-[6%]" style={{ ['--dur' as string]: '8s', ['--delay' as string]: '2s' }}><Pepper /></div>

          <motion.div
            initial={{ scale: 0, rotate: -30 }} animate={ready ? { scale: 1, rotate: -12 } : {}}
            transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 1.1 }}
            className="absolute right-[2%] top-[58%] flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gold text-center text-ink shadow-xl sm:h-28 sm:w-28"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Since</span>
            <span className="display text-3xl leading-none sm:text-4xl">1889</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">recipe</span>
          </motion.div>
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
