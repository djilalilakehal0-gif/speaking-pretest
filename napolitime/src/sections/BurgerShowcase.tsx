import { useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { featuredBurger, productById, products, type Product } from '../data/menu'
import { AddButton, BestSellerBadge, Price } from '../components/ProductCard'
import { ease, Ornament, Reveal, SplitReveal } from '../components/Reveal'
import { ArrowIcon } from '../components/icons/Icons'
import { MagneticButton } from '../components/MagneticButton'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const base = import.meta.env.BASE_URL
/** The supplied photo, kept at full resolution (1536 px) with lighter sizes for phones. */
export const gourmetPhoto = {
  src: `${base}img/burgers/burger-gourmet-1536.webp`,
  srcSet: [640, 1024, 1536].map((w) => `${base}img/burgers/burger-gourmet-${w}.webp ${w}w`).join(', '),
  width: 1536,
  height: 1024,
}

/** Where the three highlight labels sit on the photo (desktop only). */
const pins = [
  { top: '53%', left: '14%' }, // steak
  { top: '50%', left: '58%' }, // cheddar
  { top: '27%', left: '62%' }, // bacon
]

/**
 * "Burger Gourmet": a cinematic, advertising-style presentation of the burger photo.
 * Price and add-to-cart come from the real menu product set in `featuredBurger.productId`;
 * without one, the section shows the lowest burger price and leads to the burgers.
 */
export function BurgerShowcase({ onOpen }: { onOpen: (p: Product) => void }) {
  const root = useRef<HTMLElement>(null)
  const product = featuredBurger.productId ? productById.get(featuredBurger.productId) : undefined
  const fromPrice = Math.min(...products.filter((p) => p.category === 'burgers').map((p) => p.price))

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Photo is uncovered from the centre outwards, then settles from a slight zoom
      gsap.fromTo('[data-bg-frame]', { clipPath: 'inset(18% 22% 18% 22% round 2rem)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 2rem)', duration: 1.8, ease: 'expo.out',
        scrollTrigger: { trigger: '[data-bg-frame]', start: 'top 80%', once: true },
      })
      gsap.fromTo('[data-bg-img]', { scale: 1.3 }, { scale: 1, duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: '[data-bg-frame]', start: 'top 80%', once: true } })
      // Parallax drift while scrolling
      gsap.fromTo('[data-bg-drift]', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      // Oversized outline word slides across the background
      gsap.fromTo('[data-bg-word]', { xPercent: 10 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.to('[data-bg-ring]', { rotate: 180, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      // Highlight labels pop in one after another
      gsap.from('[data-bg-pin]', { autoAlpha: 0, y: 20, scale: 0.8, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.18, scrollTrigger: { trigger: '[data-bg-frame]', start: 'top 55%', once: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} id="burger-gourmet" className="grain relative isolate overflow-hidden bg-noir py-24 sm:py-36" aria-labelledby="bg-title">
      {/* Atmosphere: burgundy glow, golden light, outline word, slow ring */}
      <div aria-hidden className="pointer-events-none absolute -left-[10%] top-[10%] -z-10 h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgba(109,16,34,.55)_0%,rgba(109,16,34,.12)_45%,transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute right-[5%] top-0 -z-10 h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle,rgba(198,164,108,.16),transparent_65%)]" />
      <p data-bg-word aria-hidden className="pointer-events-none absolute left-0 top-6 -z-10 select-none whitespace-nowrap font-serif text-[28vw] font-semibold italic leading-none text-transparent [-webkit-text-stroke:1px_rgba(198,164,108,.14)] sm:top-2">
        Gourmet · Gourmet
      </p>
      <svg data-bg-ring aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-[18vmax] bottom-[-18vmax] -z-10 h-[60vmax] w-[60vmax] text-gold/20">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth=".3" strokeDasharray="2 4" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth=".2" />
      </svg>

      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
        {/* The photo */}
        <figure className="group relative">
          <div data-bg-frame className="light-sweep relative aspect-[3/2] overflow-hidden rounded-[1.5rem] shadow-[0_60px_120px_-40px_rgba(0,0,0,.9),0_0_0_1px_rgba(198,164,108,.22)] sm:rounded-[2rem]">
            <div data-bg-drift className="absolute -inset-y-[6%] inset-x-0">
              <img
                data-bg-img src={gourmetPhoto.src} srcSet={gourmetPhoto.srcSet} sizes="(min-width:1024px) 58vw, 94vw"
                width={gourmetPhoto.width} height={gourmetPhoto.height} loading="lazy" decoding="async"
                alt="Burger Gourmet : pain brioché au sésame, steak grillé, cheddar fondant, bacon, oignon rouge, tomate et salade, servi avec des frites"
                className="h-full w-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]"
              />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_55%,rgba(17,17,17,.55)_100%)]" />
            {product?.bestSeller && <span className="absolute left-5 top-5 z-[3]"><BestSellerBadge /></span>}

            {/* Highlight labels */}
            {featuredBurger.highlights.slice(0, pins.length).map((h, i) => (
              <span key={h} data-bg-pin className="absolute z-[3] hidden md:block" style={pins[i]}>
                <span className="float flex items-center gap-2 rounded-full border border-gold/35 bg-noir/70 py-1.5 pl-2 pr-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory backdrop-blur-md" style={{ ['--delay' as string]: `${i * 0.8}s`, ['--dur' as string]: `${5 + i}s` }}>
                  <span className="relative flex h-2.5 w-2.5"><span className="absolute inset-0 animate-ping rounded-full bg-gold/60" /><span className="relative h-2.5 w-2.5 rounded-full bg-gold" /></span>
                  {h}
                </span>
              </span>
            ))}
          </div>
          <figcaption className="mt-4 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-ivory/40">
            <span>Signature della casa</span>
            <span className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" aria-hidden />
            <span className="font-serif text-sm normal-case italic tracking-normal text-gold/70">NapoliTime</span>
          </figcaption>
        </figure>

        {/* The product card */}
        <Reveal delay={0.15}>
          <article className="relative overflow-hidden rounded-[2rem] border border-gold/15 bg-[linear-gradient(160deg,rgba(34,34,34,.85),rgba(17,17,17,.95))] p-7 shadow-[0_40px_100px_-40px_rgba(109,16,34,.7)] backdrop-blur sm:p-10">
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-burgundy via-gold to-burgundy" />
            <p className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-gold/60" />Il burger della casa</p>
            <h2 id="bg-title" className="display mt-5 text-[clamp(3rem,6vw,5rem)] text-ivory">
              <SplitReveal text={featuredBurger.title.replace(/(\S+)$/, '_$1')} />
            </h2>
            <Ornament className="mt-5" />
            <p className="mt-6 text-base leading-relaxed text-ivory/70 sm:text-lg">{featuredBurger.description}</p>

            <ul className="mt-6 flex flex-wrap gap-2 md:hidden">
              {featuredBurger.highlights.map((h) => <li key={h} className="rounded-full border border-gold/30 px-3.5 py-1.5 text-xs text-ivory/80">{h}</li>)}
            </ul>

            <div className="mt-8 flex items-end justify-between gap-4 border-t border-ivory/10 pt-7">
              <div>
                <p className="eyebrow !text-ivory/45">{product ? 'Prix' : 'À partir de'}</p>
                <Price price={product ? product.price : fromPrice} className="mt-1 block text-5xl text-gold" />
              </div>
              {product && <p className="pb-2 text-xs text-ivory/40">{product.name} · TTC</p>}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              {product ? (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.4, ease }}>
                    <AddButton product={product} tone="dark" onChoose={() => onOpen(product)} className="!h-14 w-full justify-center !px-7 !text-xs sm:w-auto" />
                  </motion.div>
                  <button type="button" onClick={() => onOpen(product)} className="btn btn-line">Détails</button>
                </>
              ) : (
                <MagneticButton href="#cat-burgers" className="btn btn-gold w-full sm:w-auto">Choisir mon burger <ArrowIcon /></MagneticButton>
              )}
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
