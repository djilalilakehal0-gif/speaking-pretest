import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ImageReveal, Reveal, SectionHeading } from '../components/Reveal'
import { photo } from '../lib/img'
import { categories, products } from '../data/menu'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const pillars = [
  { n: 'I', it: 'Qualità', fr: 'Qualité', text: 'Des produits choisis et une préparation soignée, de la première à la dernière commande de la soirée.' },
  { n: 'II', it: 'Gusto', fr: 'Goût', text: 'Burgers généreux, sandwichs gourmands, tacos et tex-mex : des recettes franches, servies chaudes.' },
  { n: 'III', it: 'Convivialità', fr: 'Convivialité', text: 'Sur place, à emporter ou livré chez vous : un repas qui se partage, simplement.' },
]

const manifesto =
  'Chez NAPOLITIME, chaque commande est préparée au moment où vous la passez. Pas de vitrine tiède : du pain doré, de la viande saisie, du fromage qui fond — et l’envie d’y revenir.'

/** Editorial "our story" chapter on ivory: masked photo reveals, scroll-lit manifesto and the brand's three values. */
export function Story() {
  const root = useRef<HTMLElement>(null)
  const store = photo('storefront')
  const burger = photo('hero-burger')

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Manifesto words light up one by one as the reader scrolls past
      gsap.fromTo('[data-word]', { opacity: 0.14 }, {
        opacity: 1, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: '[data-manifesto]', start: 'top 80%', end: 'bottom 45%', scrub: true },
      })
      // Rotating seal turns with the scroll
      gsap.to('[data-seal]', { rotate: 240, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      // Small photo floats against the large one
      gsap.fromTo('[data-float-img]', { yPercent: 25 }, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} id="story" className="relative overflow-hidden bg-ivory py-24 text-noir sm:py-36" aria-labelledby="story-title">
      {/* faint oversized letter as a backdrop */}
      <span aria-hidden className="pointer-events-none absolute -right-[6vw] top-10 select-none font-serif text-[38vw] italic leading-none text-burgundy/[0.04]">N</span>

      <div className="container-x grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-24">
        <div>
          <div id="story-title"><SectionHeading tone="light" eyebrow="La nostra storia" title={'Une table _généreuse,\npréparée à la _minute.'} /></div>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-noir/70">
              NAPOLITIME, c’est l’esprit de Naples — le goût du partage et de la table qui déborde — mis au service d’une carte
              de burgers, sandwichs, tacos et tex-mex. On cuisine à la commande, on sert généreusement, et l’on vous accueille comme à la maison.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-noir/10 pt-8">
            {[
              { v: products.length, l: 'Recettes à la carte' },
              { v: categories.length, l: 'Univers gourmands' },
              { v: 3, l: 'Façons de commander' },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-serif text-5xl font-medium text-burgundy tabular-nums">{s.v}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase leading-snug tracking-[0.16em] text-noir/55">{s.l}</p>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <ImageReveal {...store} sizes="(min-width:1024px) 45vw, 92vw" alt="La devanture illuminée du restaurant NAPOLITIME" className="aspect-[4/5] rounded-[1.75rem] sm:rounded-[2.5rem]" />
          <div data-float-img className="absolute -bottom-10 -left-4 w-[46%] sm:-left-12">
            <ImageReveal {...burger} sizes="25vw" alt="Burger au cheddar fondant" from="left" parallax={0}
              className="aspect-square rounded-[1.25rem] border-[6px] border-ivory shadow-[0_40px_80px_-30px_rgba(74,10,23,.5)]" imgClassName="object-[62%_50%]" />
          </div>
          {/* rotating seal */}
          <div className="absolute -right-3 -top-10 h-32 w-32 sm:-right-10 sm:h-40 sm:w-40" aria-hidden>
            <svg data-seal viewBox="0 0 200 200" className="h-full w-full">
              <defs><path id="seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
              <circle cx="100" cy="100" r="98" fill="#6D1022" />
              <text fill="#F7F2E9" fontSize="15.5" letterSpacing="5" fontFamily="Inter Variable, sans-serif" fontWeight="600">
                <textPath href="#seal-path">QUALITÉ · GOÛT · CONVIVIALITÉ · </textPath>
              </text>
              <path d="M100 80 120 100 100 120 80 100Z" fill="#C6A46C" />
            </svg>
          </div>
        </div>
      </div>

      {/* Manifesto lit by scroll */}
      <div className="container-x mt-32 sm:mt-44">
        <p data-manifesto className="mx-auto max-w-5xl text-center font-serif text-[clamp(1.9rem,4.4vw,3.6rem)] font-medium leading-[1.18] text-noir">
          {manifesto.split(' ').map((w, i) => <span key={i} data-word className="inline">{w}{' '}</span>)}
        </p>
      </div>

      {/* Three values from the restaurant's badge */}
      <div className="container-x mt-28 sm:mt-36">
      <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-noir/10 bg-noir/10 md:grid-cols-3">
        {pillars.map((p, i) => (
          <Reveal key={p.it} delay={i * 0.1} className="group relative bg-ivory p-8 transition-colors duration-700 hover:bg-burgundy sm:p-10">
            <p className="font-serif text-lg italic text-burgundy transition-colors duration-700 group-hover:text-gold">{p.n}.</p>
            <h3 className="display mt-6 text-5xl text-noir transition-colors duration-700 group-hover:text-ivory">{p.it}</h3>
            <p className="eyebrow mt-2 !text-noir/45 transition-colors duration-700 group-hover:!text-gold">{p.fr}</p>
            <p className="mt-6 leading-relaxed text-noir/65 transition-colors duration-700 group-hover:text-ivory/75">{p.text}</p>
          </Reveal>
        ))}
      </div>
      </div>
    </section>
  )
}
