import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { bestSellers, deals, dealSavings, reviews } from '../data/content'
import { productById } from '../data/menu'
import { photo } from '../lib/img'
import { euro } from '../lib/format'
import { AddButton } from '../components/ProductCard'
import { SectionHeading, Reveal } from '../components/Reveal'
import { TiltCard } from '../components/TiltCard'
import { ArrowIcon, StarIcon } from '../components/icons/Icons'

/** 7. Best sellers — draggable rail with ranked cards. */
export function BestSellers() {
  const track = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [bounds, setBounds] = useState(0)

  useEffect(() => {
    const measure = () => setBounds(Math.max(0, (track.current?.scrollWidth ?? 0) - (viewport.current?.clientWidth ?? 0)))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const nudge = (dir: 1 | -1) => {
    const step = (viewport.current?.clientWidth ?? 400) * 0.7
    animate(x, Math.max(-bounds, Math.min(0, x.get() - dir * step)), { type: 'spring', stiffness: 200, damping: 30 })
  }

  return (
    <section id="bestsellers" className="relative overflow-hidden bg-ink-2 py-24 sm:py-32" aria-labelledby="bs-title">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div id="bs-title"><SectionHeading eyebrow="Best sellers" title="Most loved." italic="The ones everyone orders twice" /></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => nudge(-1)} aria-label="Previous best sellers" className="inline-flex h-12 w-12 rotate-180 items-center justify-center rounded-full border border-cream/20 hover:border-gold hover:text-gold"><ArrowIcon /></button>
            <button type="button" onClick={() => nudge(1)} aria-label="Next best sellers" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 hover:border-gold hover:text-gold"><ArrowIcon /></button>
          </div>
        </div>
      </div>

      <div ref={viewport} className="container-x mt-12 overflow-hidden">
        <motion.div
          ref={track} drag="x" dragConstraints={{ left: -bounds, right: 0 }} dragElastic={0.08} style={{ x }}
          className="flex w-max cursor-grab gap-5 active:cursor-grabbing"
        >
          {bestSellers.map((p, i) => {
            const img = photo(p.image)
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, x: 80 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="w-[78vw] max-w-[360px] shrink-0 sm:w-[340px]"
              >
                <TiltCard max={6}>
                  <div className="group relative overflow-hidden rounded-[2rem] bg-ink">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={img.src} srcSet={img.srcSet} sizes="360px" alt={p.name} loading="lazy" draggable={false} className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      <span className="display absolute -left-1 top-2 text-[7rem] leading-none text-cream/90 [-webkit-text-stroke:0] [text-shadow:0_10px_40px_rgba(0,0,0,.6)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <StarIcon key={s} size={14} />)}</p>
                      <h3 className="display mt-2 text-4xl">{p.name}</h3>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="display text-2xl text-gold">{euro(p.price)}</span>
                        <AddButton id={p.id} name={p.name} />
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/** 8. Special offers & meal deals — functional bundles priced in the catalogue. */
export function Offers() {
  const accent = {
    red: 'bg-tomato text-white',
    gold: 'bg-gold text-ink',
    cream: 'bg-cream text-ink',
  }
  return (
    <section id="offers" className="relative bg-ink py-24 sm:py-32" aria-labelledby="offers-title">
      <div className="container-x">
        <div id="offers-title"><SectionHeading eyebrow="Meal deals" title="Better together." italic="Combos built for sharing" /></div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {deals.map((d, i) => {
            const img = photo(d.image)
            const save = dealSavings(d)
            return (
              <motion.article
                key={d.id}
                initial={{ opacity: 0, y: 50, rotate: i % 2 ? 2 : -2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative flex flex-col overflow-hidden rounded-[2rem] ${accent[d.accent]}`}
              >
                <div className="relative h-52 overflow-hidden">
                  <img src={img.src} srcSet={img.srcSet} sizes="(min-width:1024px) 30vw, 92vw" alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                  {save > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }} whileInView={{ scale: 1, rotate: 8 }} viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.4 + i * 0.1 }}
                      className="display absolute right-4 top-4 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-ink text-center text-gold shadow-xl"
                    >
                      <span className="text-[10px] font-sans font-bold tracking-[0.16em]">SAVE</span>
                      <span className="text-xl leading-none">{euro(save).replace(/\.00$/, '')}</span>
                    </motion.span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">{d.kicker}</p>
                  <h3 className="display mt-2 text-5xl">{d.name}</h3>
                  <ul className="mt-4 space-y-1 text-sm opacity-80">
                    {d.includes.map((id) => <li key={id}>— {productById.get(id)?.name}</li>)}
                  </ul>
                  <div className="mt-auto flex items-center justify-between pt-7">
                    <span className="display text-4xl">{euro(d.price)}</span>
                    <AddButton id={d.id} name={d.name} className={d.accent === 'red' ? '!bg-ink !text-cream' : ''} />
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** 9. Customer reviews — dual marquee, paused on hover/focus; static grid for reduced motion. */
export function Reviews() {
  const reduced = useReducedMotion()
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  const Card = ({ r }: { r: (typeof reviews)[number] }) => (
    <figure className="card-surface w-[82vw] max-w-[400px] shrink-0 rounded-[1.75rem] p-7 sm:w-[400px]">
      <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} size={16} filled={i < r.rating} />)}
      </div>
      <blockquote className="mt-4 text-lg leading-relaxed text-cream/85">“{r.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="display flex h-10 w-10 items-center justify-center rounded-full bg-tomato text-lg text-white">{r.name[0]}</span>
        <span><span className="block font-semibold">{r.name}</span><span className="text-sm text-cream/50">{r.city}</span></span>
      </figcaption>
    </figure>
  )
  return (
    <section id="reviews" className="relative overflow-hidden bg-ink-2 py-24 sm:py-32" aria-labelledby="reviews-title">
      <div className="container-x flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div id="reviews-title"><SectionHeading eyebrow="Reviews" title="Grazie mille." italic="What our guests say" /></div>
        <Reveal>
          <div className="flex items-center gap-5">
            <span className="display text-7xl text-gold">{avg}</span>
            <div>
              <p className="flex">{[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} size={20} />)}</p>
              <p className="mt-1 text-sm text-cream/55">Sample reviews (demo content)</p>
            </div>
          </div>
        </Reveal>
      </div>
      {reduced ? (
        <div className="container-x mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{reviews.map((r) => <Card key={r.name} r={r} />)}</div>
      ) : (
        <>
        <ul className="sr-only">{reviews.map((r) => <li key={r.name}>{r.rating} stars — {r.name}, {r.city}: {r.text}</li>)}</ul>
        <div aria-hidden className="group mt-14 space-y-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          {[0, 1].map((row) => (
            <div key={row} className="flex overflow-hidden">
              <div className="marquee flex w-max gap-5 pr-5 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]" style={{ animationDuration: row ? '70s' : '60s', animationDirection: row ? 'reverse' : 'normal' }}>
                {[...reviews, ...reviews].map((r, i) => <Card key={i} r={row ? reviews[(i + 2) % reviews.length] : r} />)}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </section>
  )
}
