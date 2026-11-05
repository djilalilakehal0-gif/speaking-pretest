import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { Embers } from '../components/Embers'
import { MagneticButton } from '../components/MagneticButton'
import { ArrowIcon, PhoneIcon } from '../components/icons/Icons'
import { ease, Ornament } from '../components/Reveal'
import { openStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { site } from '../config/site'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

const slides = [
  { ...photo('hero-burger'), alt: 'Burger au cheddar fondant sur pain brioché, photographié en studio', pos: '62% 50%' },
  { ...photo('storefront'), alt: 'La devanture illuminée du restaurant NAPOLITIME le soir', pos: '50% 40%' },
]
const SLIDE_MS = 7000

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const [slide, setSlide] = useState(0)
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null)
  useEffect(() => setStatus(openStatus()), [])

  // Cinematic background: slow cross-fade between photos (paused when motion is reduced).
  useEffect(() => {
    if (!ready || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [ready])

  // Headline: characters rise from a mask once the loader has gone.
  useGSAP(() => {
    if (!ready || !title.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let split: SplitText | undefined
      document.fonts.ready.then(() => {
        if (!title.current) return
        split = SplitText.create(title.current.querySelectorAll('[data-split]'), { type: 'words,chars', aria: 'none' })
        gsap.set(title.current, { autoAlpha: 1 })
        gsap.from(split.chars, { yPercent: 120, rotate: 6, duration: 1.3, ease: 'expo.out', stagger: 0.035, delay: 0.1 })
      })
      return () => split?.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set(title.current, { autoAlpha: 1 }) })

    // Scroll: background drifts slower than the content, the copy lifts and fades.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
      tl.to('[data-hero="bg"]', { yPercent: 18, scale: 1.08, ease: 'none' }, 0)
        .to('[data-hero="copy"]', { yPercent: -18, autoAlpha: 0, ease: 'none' }, 0)
        .to('[data-hero="frame"]', { autoAlpha: 0, ease: 'none' }, 0)
    })
    return () => mm.revert()
  }, { scope: root, dependencies: [ready] })

  const show = ready ? 'shown' : 'hidden'
  const item = { hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0, transition: { duration: 1.1, ease } } }

  return (
    <section ref={root} id="top" className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-noir" aria-labelledby="hero-title">
      {/* Background photography */}
      <div data-hero="bg" className="absolute inset-0 -z-20" aria-hidden>
        <AnimatePresence initial={false}>
          <motion.div
            key={slide}
            className="absolute inset-0"
            initial={{ opacity: 0, clipPath: 'inset(0% 0% 0% 100%)' }}
            animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ opacity: 0, transition: { duration: 1.4, delay: 0.6 } }}
            transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <img
              src={slides[slide].src} srcSet={slides[slide].srcSet} sizes="100vw" alt=""
              fetchPriority={slide === 0 ? 'high' : 'auto'} decoding="async"
              style={{ objectPosition: slides[slide].pos }}
              className="kenburns h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(17,17,17,.75)_0%,rgba(17,17,17,.35)_40%,rgba(17,17,17,.85)_100%)]" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_60%,rgba(74,10,23,.55),transparent_60%)]" aria-hidden />
      <Embers className="absolute inset-0 -z-[5] h-full w-full" />

      {/* Thin gold frame */}
      <motion.div data-hero="frame" aria-hidden initial={{ opacity: 0, scale: 1.03 }} animate={ready ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 1.8, ease, delay: 0.3 }}
        className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-gold/20 sm:inset-5 sm:rounded-[2rem]" />

      <motion.div
        data-hero="copy" initial="hidden" animate={show}
        variants={{ shown: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
        className="container-x relative flex flex-1 flex-col items-center justify-center pb-32 pt-32 text-center sm:pb-40"
      >
        <motion.p variants={item} className="eyebrow flex items-center gap-4">
          <span className="h-px w-8 bg-gold/60" /> Napoli<span className="text-ivory/50">·</span>Time <span className="h-px w-8 bg-gold/60" />
        </motion.p>

        <h1 ref={title} id="hero-title" aria-label="Il gusto autentico d'Italia" className="invisible mt-7 font-serif text-ivory">
          <span className="block overflow-hidden pb-[0.06em]" aria-hidden><span data-split className="block text-[clamp(3.1rem,11vw,9.5rem)] font-medium uppercase leading-[0.92] tracking-[-0.01em]">Il gusto autentico</span></span>
          <span className="-mt-[0.1em] block overflow-hidden pb-[0.2em] pr-[0.1em]" aria-hidden><span data-split className="display-i block text-[clamp(2.8rem,9.5vw,8.2rem)] leading-[1.05] text-gold">d’Italia</span></span>
        </h1>

        <motion.div variants={item}><Ornament className="mt-8" /></motion.div>
        <motion.p variants={item} className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-ivory/80 sm:text-2xl">
          Découvrez le goût authentique de l’Italie. Chaque bouchée raconte une histoire.
        </motion.p>

        <motion.div variants={item} className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <MagneticButton href="#menu" className="btn btn-gold w-full sm:w-auto">Découvrir la carte <ArrowIcon /></MagneticButton>
          <MagneticButton href={site.contact.phoneHref} className="btn btn-line w-full sm:w-auto"><PhoneIcon size={16} /> {site.contact.phoneDisplay}</MagneticButton>
        </motion.div>
      </motion.div>

      {/* Bottom bar: opening status · scroll cue · slide counter */}
      <motion.div initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 1.4, duration: 1 }}
        className="container-x absolute inset-x-0 bottom-7 flex items-end justify-between gap-4 sm:bottom-10">
        <div className="min-w-0">
          {status && (
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/75">
              <span className={`h-1.5 w-1.5 rounded-full ${status.open ? 'animate-pulse bg-ok' : 'bg-gold'}`} />
              {status.open ? 'Ouvert maintenant' : status.label}
            </p>
          )}
        </div>
        <a href="#story" className="absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-ivory/60 hover:text-gold sm:flex" aria-label="Défiler vers notre histoire">
          Scroll
          <span className="relative block h-12 w-px overflow-hidden bg-ivory/15"><span className="scroll-cue absolute inset-0 bg-gold" /></span>
        </a>
        <div className="flex items-center gap-3" aria-hidden>
          <span className="font-serif text-lg text-gold tabular-nums">0{slide + 1}</span>
          <span className="flex gap-1.5">
            {slides.map((_, i) => (
              <span key={i} className="relative block h-px w-8 overflow-hidden bg-ivory/20">
                {i === slide && <motion.span key={`${slide}-p`} className="absolute inset-0 origin-left bg-gold" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }} />}
              </span>
            ))}
          </span>
          <span className="font-serif text-lg text-ivory/40 tabular-nums">0{slides.length}</span>
        </div>
      </motion.div>
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
