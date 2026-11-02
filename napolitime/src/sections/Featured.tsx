import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion } from 'framer-motion'
import { productById } from '../data/menu'
import { photo } from '../lib/img'
import { euro } from '../lib/format'
import { TiltCard } from '../components/TiltCard'
import { AddButton } from '../components/ProductCard'
import { SectionHeading, revealItem } from '../components/Reveal'
import { iconSet } from '../components/icons/Icons'
import { Basil, Tomato } from '../components/Ingredients'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const panels = [
  {
    key: 'pizza', productId: 'napoli-special', kicker: '01 — Pizza napoletana',
    title: 'Born in\nthe fire.', body: '48-hour dough, San Marzano tomatoes and fior di latte, blistered for 90 seconds in a 485 °C wood oven. Soft, airy, leopard-spotted.',
    image: 'napoli', accent: 'text-tomato', bg: 'from-tomato/25',
  },
  {
    key: 'burger', productId: 'classic-smash', kicker: '02 — Gourmet burgers',
    title: 'Smashed\nto order.', body: 'Dry-aged beef pressed hard on a 250 °C plancha for crispy lace edges, aged cheddar melted on top and our signature sauce on a toasted brioche.',
    image: 'double-cheese', accent: 'text-gold', bg: 'from-gold/20',
  },
]

export function Featured() {
  const root = useRef<HTMLElement>(null)

  // Desktop: pin the stage and morph from the pizza story to the burger story while scrolling.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '[data-stage]', start: 'top top', end: '+=120%', scrub: 0.8, pin: true, anticipatePin: 1 },
      })
      tl.fromTo('[data-panel="burger"]', { clipPath: 'circle(0% at 70% 50%)' }, { clipPath: 'circle(150% at 70% 50%)', ease: 'power2.inOut' })
        .to('[data-panel="pizza"] [data-img]', { scale: 1.15, rotate: -4, ease: 'none' }, 0)
        .fromTo('[data-panel="burger"] [data-img]', { scale: 1.3, yPercent: 10 }, { scale: 1, yPercent: 0, ease: 'none' }, 0)
        .fromTo('[data-progress]', { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0)
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} id="featured" className="relative bg-ink py-24 lg:py-0" aria-labelledby="featured-title">
      <div className="container-x lg:hidden">
        <SectionHeading eyebrow="Featured" title="Two crafts. One obsession." />
      </div>

      <div data-stage className="relative mt-12 lg:mt-0 lg:motion-safe:h-screen lg:motion-safe:overflow-hidden">
        <h2 id="featured-title" className="sr-only">Featured pizzas and burgers</h2>
        <div aria-hidden className="absolute left-10 top-1/2 z-20 hidden h-40 w-[2px] -translate-y-1/2 bg-cream/10 lg:motion-safe:block">
          <div data-progress className="h-full w-full origin-top bg-tomato" />
        </div>
        {panels.map((p, i) => {
          const product = productById.get(p.productId)!
          const img = photo(p.image)
          return (
            <div
              key={p.key} data-panel={p.key}
              className={`container-x relative grid items-center gap-10 bg-ink py-10 lg:max-w-none lg:grid-cols-2 lg:gap-16 lg:px-24 lg:py-16 lg:motion-safe:absolute lg:motion-safe:inset-0 lg:motion-safe:py-0 ${i === 1 ? 'lg:z-10' : ''}`}
            >
              <div aria-hidden className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${p.bg} via-transparent to-transparent opacity-60`} />
              <motion.div initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.3 }} variants={{ shown: { transition: { staggerChildren: 0.1 } } }} className="relative z-10 order-2 lg:order-1">
                <motion.p variants={revealItem} className="eyebrow">{p.kicker}</motion.p>
                <motion.h3 variants={revealItem} className={`display mt-4 whitespace-pre-line text-[clamp(3.2rem,8vw,7.5rem)] ${p.accent}`}>{p.title}</motion.h3>
                <motion.p variants={revealItem} className="mt-6 max-w-md text-lg leading-relaxed text-cream/70">{p.body}</motion.p>
                <motion.div variants={revealItem} className="mt-8 flex items-center gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cream/45">Try the</p>
                    <p className="display text-2xl">{product.name} · <span className="text-gold">{euro(product.price)}</span></p>
                  </div>
                  <AddButton id={product.id} name={product.name} />
                </motion.div>
              </motion.div>
              <div className="relative order-1 lg:order-2">
                <TiltCard className="mx-auto aspect-square w-full max-w-[560px]">
                  <motion.div
                    initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.25 }}
                    className="relative h-full overflow-hidden rounded-[2rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,.9)]"
                  >
                    <div data-img className="h-full w-full">
                      <motion.img
                        src={img.src} srcSet={img.srcSet} sizes="(min-width:1024px) 45vw, 92vw" alt={product.name}
                        variants={{ hidden: { clipPath: 'inset(100% 0 0 0)', scale: 1.25 }, shown: { clipPath: 'inset(0% 0 0 0)', scale: 1 } }}
                        transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
                  </motion.div>
                </TiltCard>
                <div aria-hidden className="float absolute -left-4 -top-6 w-16 sm:w-20" style={{ ['--dur' as string]: '6s', ['--r' as string]: '-15deg', transform: 'translateZ(60px)' }}>
                  {i === 0 ? <Basil /> : <Tomato />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <IconStrip />
    </section>
  )
}

/** Brand icon collection in use: each icon draws on, then idles with its own motion. */
function IconStrip() {
  const copy: Record<string, string> = {
    Pizza: 'Neapolitan classics', Burger: 'Smash burgers', Delivery: '30–45 min delivery', Chef: 'Pizzaioli from Naples',
    'Wood fire': '485 °C wood oven', Fast: 'Pickup in 15 min', Takeaway: 'Eco packaging', Location: 'Centro storico',
    Rated: '4.9 average rating', Fresh: 'Fresh daily', Cart: 'Easy ordering', Contact: 'Real humans, fast',
  }
  return (
    <div className="container-x relative z-20 bg-ink py-20 lg:py-28">
      <motion.ul
        initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.2 }}
        variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-cream/[0.07] bg-cream/[0.07] sm:grid-cols-3 lg:grid-cols-6"
      >
        {iconSet.map(({ name, Icon }) => (
          <motion.li key={name} variants={revealItem} className="group flex flex-col items-start gap-4 bg-ink p-6 transition-colors duration-500 hover:bg-ink-2">
            <motion.span whileHover={{ scale: 1.15, rotate: -6 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }} className="text-cream">
              <Icon size={36} draw live />
            </motion.span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{name}</p>
              <p className="mt-1 text-sm text-cream/60">{copy[name]}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
