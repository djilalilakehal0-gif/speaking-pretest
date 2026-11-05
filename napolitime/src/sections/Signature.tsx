import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { categories, productById, signatureIds, type Product } from '../data/menu'
import { AddButton, BestSellerBadge, FavButton, Price, ProductImage } from '../components/ProductCard'
import { Reveal, SectionHeading } from '../components/Reveal'
import { ArrowIcon } from '../components/icons/Icons'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const dishes = signatureIds.map((id) => productById.get(id)).filter((p): p is Product => !!p)

/**
 * Signature dishes. Desktop: the section pins and the dishes travel horizontally as you scroll.
 * Touch / reduced motion: a native horizontal carousel with snap points.
 */
export function Signature({ onOpen }: { onOpen: (p: Product) => void }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const el = track.current!
      const distance = () => el.scrollWidth - window.innerWidth
      const move = gsap.to(el, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: 0.8, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
      })
      gsap.utils.toArray<HTMLElement>('[data-sig-img]').forEach((img) => {
        gsap.fromTo(img, { xPercent: 10, scale: 1.12 }, {
          xPercent: -10, scale: 1, ease: 'none',
          scrollTrigger: { trigger: img, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
        })
      })
      gsap.to('[data-sig-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} id="signature" className="relative overflow-hidden bg-noir py-24 sm:py-32 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0" aria-labelledby="sig-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(109,16,34,.35),transparent_55%)]" />
      <div className="container-x relative flex flex-wrap items-end justify-between gap-6">
        <div id="sig-title"><SectionHeading eyebrow="Piatti signature" title={'Nos _incontournables.'} /></div>
        <Reveal delay={0.2}>
          <a href="#menu" className="link-u inline-flex items-center gap-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Toute la carte <ArrowIcon size={14} /></a>
        </Reveal>
      </div>

      <div className="relative mt-12 lg:mt-14">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:gap-7 sm:px-7 lg:w-max lg:snap-none lg:overflow-visible lg:px-12 lg:pb-0"
        >
          {dishes.map((p, i) => <SignatureCard key={p.id} product={p} index={i} onOpen={onOpen} />)}
          <a href="#menu" className="group flex w-[72vw] max-w-[22rem] shrink-0 snap-center flex-col items-center justify-center gap-6 rounded-[1.75rem] border border-gold/25 p-10 text-center transition-colors duration-700 hover:bg-burgundy lg:w-[22rem]">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 text-gold transition-transform duration-700 group-hover:rotate-[-45deg] group-hover:scale-110"><ArrowIcon size={26} /></span>
            <span className="display text-4xl text-ivory">Voir toute<br /><span className="display-i text-gold">la carte</span></span>
          </a>
        </div>
        <div className="container-x mt-10 hidden lg:block" aria-hidden>
          <div className="h-px w-full bg-ivory/10"><div data-sig-progress className="h-px origin-left scale-x-0 bg-gold" /></div>
        </div>
      </div>
    </section>
  )
}

function SignatureCard({ product, index, onOpen }: { product: Product; index: number; onOpen: (p: Product) => void }) {
  const cat = categories.find((c) => c.id === product.category)!
  return (
    <article className="group relative flex w-[82vw] max-w-[30rem] shrink-0 snap-center flex-col lg:w-[30rem]">
      <button type="button" onClick={() => onOpen(product)} className="plate block aspect-[5/4] rounded-[1.75rem] text-left lg:aspect-[4/3.2]" aria-label={`Voir le détail : ${product.name}`}>
        <div data-sig-img className="h-full w-full">
          <ProductImage product={product} className="h-full w-full p-5 transition-transform duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]" />
        </div>
        <span className="absolute left-5 top-5 z-[2] font-serif text-lg italic text-gold">{String(index + 1).padStart(2, '0')}</span>
        {product.bestSeller && <span className="absolute bottom-5 left-5 z-[2]"><BestSellerBadge /></span>}
      </button>
      <FavButton product={product} className="absolute right-4 top-4 z-[2]" />
      <div className="mt-6">
        <div className="flex items-center gap-4">
          <p className="eyebrow !text-ivory/45">{cat.label}</p>
          <span className="h-px flex-1 bg-ivory/10" aria-hidden />
          <Price price={product.price} className="text-2xl text-gold" />
        </div>
        <h3 className="display mt-2 text-[clamp(2.2rem,4vw,3rem)] text-ivory">{product.name}</h3>
        {product.options && <p className="mt-1 text-sm italic text-ivory/50">{product.options.join(' · ')}</p>}
      </div>
      <div className="mt-5 flex items-center gap-5">
        <AddButton product={product} tone="dark" onChoose={() => onOpen(product)} />
        <button type="button" onClick={() => onOpen(product)} className="link-u text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/55 hover:text-ivory">Détails</button>
      </div>
    </article>
  )
}
