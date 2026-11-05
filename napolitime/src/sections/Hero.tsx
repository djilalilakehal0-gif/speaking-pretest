import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { Embers } from '../components/Embers'
import { MagneticButton } from '../components/MagneticButton'
import { ArrowIcon, ChefHatIcon, LeafIcon, ScooterIcon, StarIcon } from '../components/icons/Icons'
import { ease } from '../components/Reveal'
import { photo } from '../lib/img'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

const slides = [
  { ...photo('hero-pizza'), alt: 'Pizza napolitaine à la mozzarella filante, tomates cerises et basilic, devant la trattoria NapoliTime', pos: '78% 50%' },
  { ...photo('hero-burger'), alt: 'Burger au cheddar fondant sur pain brioché', pos: '55% 50%' },
  { ...photo('storefront'), alt: 'La devanture illuminée du restaurant NAPOLITIME le soir', pos: '50% 40%' },
]
const SLIDE_MS = 7000

const features = [
  { Icon: ChefHatIcon, l1: 'Cuisine Italienne', l2: 'Authentique' },
  { Icon: LeafIcon, l1: 'Ingrédients', l2: 'Frais & Sélectionnés' },
  { Icon: ScooterIcon, l1: 'Livraison', l2: 'Rapide' },
  { Icon: (p: { size?: number; strokeWidth?: number; live?: boolean }) => <StarIcon {...p} filled={false} />, l1: 'Qualité', l2: 'Premium' },
]

/**
 * Landing hero: headline on the left, cinematic food photography on the right fading into black,
 * vertical slide dots, and a bar of four brand promises along the bottom.
 */
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  // Photos cross-fade automatically (not when motion is reduced, or after the visitor picks one).
  useEffect(() => {
    if (!ready || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [ready, paused])

  useGSAP(() => {
    if (!ready || !title.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let split: SplitText | undefined
      document.fonts.ready.then(() => {
        if (!title.current) return
        split = SplitText.create(title.current.querySelectorAll('[data-split]'), { type: 'words,chars', aria: 'none' })
        gsap.set(title.current, { autoAlpha: 1 })
        gsap.from(split.chars, { yPercent: 115, rotate: 8, duration: 1.25, ease: 'expo.out', stagger: 0.04, delay: 0.05 })
      })
      // Scroll: photo drifts and zooms, copy lifts away
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
      tl.to('[data-hero="bg"]', { yPercent: 14, scale: 1.06, ease: 'none' }, 0)
        .to('[data-hero="copy"]', { yPercent: -22, autoAlpha: 0, ease: 'none' }, 0)
        .to('[data-hero="bar"]', { yPercent: 40, autoAlpha: 0, ease: 'none' }, 0)
      return () => split?.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set(title.current, { autoAlpha: 1 }) })
    return () => mm.revert()
  }, { scope: root, dependencies: [ready] })

  const show = ready ? 'shown' : 'hidden'
  const item = { hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0, transition: { duration: 1.1, ease } } }

  return (
    <section ref={root} id="top" className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-noir" aria-labelledby="hero-title">
      {/* Photography: right two-thirds on desktop, full-bleed on mobile */}
      <div data-hero="bg" className="absolute inset-0 -z-20 lg:left-[30%]" aria-hidden>
        <AnimatePresence initial={false}>
          <motion.div
            key={slide} className="absolute inset-0"
            initial={{ opacity: 0, clipPath: 'inset(0% 0% 0% 100%)' }}
            animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ opacity: 0, transition: { duration: 1.4, delay: 0.6 } }}
            transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <img
              src={slides[slide].src} srcSet={slides[slide].srcSet} sizes="(min-width:1024px) 70vw, 100vw" alt=""
              fetchPriority={slide === 0 ? 'high' : 'auto'} decoding="async"
              style={{ objectPosition: slides[slide].pos }}
              className="kenburns h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Fades that keep the copy readable */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#111_0%,#111_28%,rgba(17,17,17,.85)_40%,rgba(17,17,17,.15)_65%,transparent_100%)] max-lg:bg-[linear-gradient(180deg,rgba(17,17,17,.5)_0%,rgba(17,17,17,.45)_35%,rgba(17,17,17,.8)_70%,rgba(17,17,17,.97)_100%)]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-noir via-noir/70 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-noir/80 to-transparent" aria-hidden />
      <Embers className="absolute inset-0 -z-[5] h-full w-full" />

      {/* Vertical slide dots */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={ready ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 sm:flex lg:left-7" role="group" aria-label="Choisir la photo">
        {slides.map((s, i) => (
          <button key={i} type="button" onClick={() => { setSlide(i); setPaused(true) }} aria-label={`Photo ${i + 1} : ${s.alt}`} aria-pressed={slide === i}
            className="group relative flex h-6 w-6 items-center justify-center">
            <span className={`block rounded-full border transition-all duration-500 ${slide === i ? 'h-5 w-5 border-ivory/80 bg-rosso shadow-[0_0_0_3px_rgba(200,16,46,.25)]' : 'h-3 w-3 border-ivory/70 group-hover:border-gold'}`} />
          </button>
        ))}
      </motion.div>

      <div className="container-x relative flex flex-1 items-center pb-8 pt-24 lg:pt-28">
        <motion.div data-hero="copy" initial="hidden" animate={show}
          variants={{ shown: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } } }}
          className="max-w-2xl sm:pl-8 lg:pl-14">
          <h1 ref={title} id="hero-title" aria-label="Il gusto autentico d'Italia" className="invisible font-serif text-[clamp(3rem,min(8.4vw,12.2svh),7.6rem)] font-semibold uppercase italic leading-[0.98] tracking-[-0.01em]">
            <span data-split className="block pr-[0.08em] text-gold-light [text-shadow:0_8px_40px_rgba(198,164,108,.3)]" aria-hidden>Il gusto</span>
            <span data-split className="block pr-[0.08em] text-ivory" aria-hidden>Autentico</span>
            <span data-split className="block pr-[0.08em] text-rosso [text-shadow:0_10px_40px_rgba(200,16,46,.35)]" aria-hidden>D’Italia</span>
          </h1>

          {/* dashed gold rule with the Italian flag in the middle */}
          <motion.div variants={item} className="mt-[min(1.75rem,3svh)] flex w-full max-w-md items-center" aria-hidden>
            <span className="h-px flex-1 border-t border-dashed border-gold/50" />
            <motion.span className="tricolore h-[3px] w-40 origin-center rounded-full" initial={{ scaleX: 0 }} animate={ready ? { scaleX: 1 } : {}} transition={{ delay: 1.3, duration: 1, ease }} />
            <span className="h-px flex-1 border-t border-dashed border-gold/50" />
          </motion.div>

          <motion.p variants={item} className="mt-[min(1.75rem,3svh)] max-w-md text-lg leading-relaxed text-ivory/90 sm:text-xl">
            Discover the authentic taste of Italy.<br />Every bite tells a story.
          </motion.p>

          <motion.div variants={item} className="mt-[min(2.25rem,4svh)]">
            <MagneticButton href="#menu" className="btn btn-rosso !min-h-[3.6rem] !px-9 !text-[0.8rem]">Discover our menu <ArrowIcon /></MagneticButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Brand promises */}
      <motion.ul data-hero="bar" initial="hidden" animate={show}
        variants={{ shown: { transition: { staggerChildren: 0.1, delayChildren: 1.1 } } }}
        className="container-x relative grid grid-cols-2 gap-x-4 gap-y-6 pb-8 sm:pb-10 lg:grid-cols-4 lg:gap-0">
        {features.map(({ Icon, l1, l2 }, i) => (
          <motion.li key={l1} variants={item}
            className={`flex items-center gap-3 sm:gap-4 lg:justify-center lg:px-6 ${i ? 'lg:border-l lg:border-ivory/15' : ''}`}>
            <span className="shrink-0 text-gold"><Icon size={40} strokeWidth={1.4} live /></span>
            <span className="text-sm leading-snug text-ivory/90 sm:text-[1.05rem]">{l1}<br />{l2}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}

/** Slow marquee band of Italian words between sections. */
export function Marquee({ tone = 'burgundy' }: { tone?: 'burgundy' | 'ivory' }) {
  const words = ['Qualità', 'Gusto', 'Convivialità', 'Burgers', 'Sandwichs', 'Tacos', 'Tex-Mex', 'Dolci']
  const dark = tone === 'burgundy'
  return (
    <div className={`relative overflow-hidden border-y py-5 ${dark ? 'border-gold/20 bg-burgundy text-ivory' : 'border-noir/10 bg-ivory text-noir'}`} aria-hidden>
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {[...words, ...words, ...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-12 font-serif text-3xl italic sm:text-4xl">
            {w}
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-gold"><path d="M5 0 10 5 5 10 0 5Z" fill="currentColor" /></svg>
          </span>
        ))}
      </div>
    </div>
  )
}
