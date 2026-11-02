import { animate, motion, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { photo } from '../lib/img'
import { SectionHeading, Reveal } from '../components/Reveal'
import { ChefHatIcon, FlameIcon, LeafIcon } from '../components/icons/Icons'
import { ingredients } from '../data/content'
import { Basil, Chili, Pepper, Tomato } from '../components/Ingredients'

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const reduced = useReducedMotion()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    if (reduced) { setV(to); return }
    const c = animate(0, to, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => setV(Math.round(n)) })
    return () => c.stop()
  }, [inView, to, reduced])
  return <span ref={ref} className="tabular-nums">{v}{suffix}</span>
}

/** 5. Our story — inspired by Naples */
export function Story() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], ['12%', '-12%'])
  const y2 = useTransform(scrollYProgress, [0, 1], ['-6%', '18%'])
  const clip = useTransform(scrollYProgress, [0.05, 0.4], ['inset(18% 12% 18% 12% round 2rem)', 'inset(0% 0% 0% 0% round 2rem)'])
  const naples = photo('naples'), chef = photo('chef')

  return (
    <section ref={ref} id="story" className="relative overflow-hidden bg-ink py-24 sm:py-32" aria-labelledby="story-title">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2">
        <div className="relative order-2 h-[520px] sm:h-[640px] lg:order-1">
          <motion.div style={{ y: y1, clipPath: clip }} className="absolute left-0 top-0 h-[78%] w-[72%] overflow-hidden">
            <img src={naples.src} srcSet={naples.srcSet} sizes="(min-width:1024px) 34vw, 70vw" alt="A narrow street in Naples with laundry hanging between buildings" loading="lazy" className="h-full w-full scale-110 object-cover" />
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute bottom-0 right-0 h-[52%] w-[56%] overflow-hidden rounded-[2rem] border-[6px] border-ink shadow-2xl">
            <img src={chef.src} srcSet={chef.srcSet} sizes="(min-width:1024px) 26vw, 55vw" alt="Pizzaiolo sliding a pizza into a wood-fired oven" loading="lazy" className="h-full w-full object-cover" />
          </motion.div>
          <motion.div
            initial={{ rotate: -90, scale: 0 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="absolute bottom-[38%] left-[58%] flex h-24 w-24 items-center justify-center rounded-full bg-tomato text-white shadow-xl"
          >
            <FlameIcon size={44} live className="[&_path]:!stroke-white" />
          </motion.div>
        </div>

        <div id="story-title" className="order-1 lg:order-2">
          <SectionHeading eyebrow="Our story" title="Inspired by Naples." italic="Dove la pizza è nata" />
          <Reveal delay={0.1}>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-cream/70">
              <p>NAPOLITIME started with a simple promise: bring the pizza of Via dei Tribunali — soft, smoky, gone in five minutes — to everyone who loves real food.</p>
              <p>Our pizzaioli trained in Naples. Our burgers are built with the same obsession: the best ingredients, cooked hot and fast, served the moment they’re ready. That moment is everything.</p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-cream/10 pt-8">
              {[
                { n: 48, s: 'h', l: 'Dough fermentation' },
                { n: 485, s: '°C', l: 'Wood-oven heat' },
                { n: 90, s: 's', l: 'Bake time' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="display text-4xl text-gold sm:text-5xl"><Counter to={s.n} suffix={s.s} /></dd>
                  <dd className="mt-2 text-xs uppercase tracking-[0.16em] text-cream/50">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/** 6. Fresh ingredients & quality — a cream "daylight" section for rhythm. */
export function Quality() {
  const caprese = photo('caprese'), oven = photo('oven')
  const icons = [LeafIcon, LeafIcon, FlameIcon, ChefHatIcon]
  return (
    <section id="ingredients" className="relative overflow-hidden bg-cream py-24 text-ink sm:py-32" aria-labelledby="quality-title">
      {/* Floating ingredients */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="float absolute right-[18%] top-[4%] w-14 opacity-90 sm:w-20" style={{ ['--dur' as string]: '7s', ['--r' as string]: '-25deg' }}><Basil /></div>
        <div className="float absolute right-[6%] top-[14%] w-12 sm:w-16" style={{ ['--dur' as string]: '6s', ['--delay' as string]: '1s' }}><Tomato /></div>
        <div className="float absolute bottom-[10%] left-[46%] w-10 sm:w-12" style={{ ['--dur' as string]: '5s', ['--r' as string]: '30deg' }}><Chili /></div>
        <div className="float absolute bottom-[18%] right-[3%] w-10" style={{ ['--dur' as string]: '8s', ['--delay' as string]: '.6s' }}><Pepper /></div>
      </div>

      <div className="container-x relative">
        <div id="quality-title" className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <SectionHeading light eyebrow="Fresh ingredients" title="Quality you can taste." italic="Niente scorciatoie — no shortcuts" />
          <Reveal delay={0.1}>
            <p className="max-w-lg text-lg leading-relaxed text-ink/70">Everything starts with the ingredients. We buy from small Campanian producers, make our dough and sauces in-house every day, and never use frozen mozzarella or pre-formed patties.</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {ingredients.map((ing, i) => {
              const Icon = icons[i]
              return (
                <motion.div
                  key={ing.title}
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  className="rounded-[1.75rem] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(16,16,16,.35)]"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-cream"><Icon size={28} draw live /></span>
                  <h3 className="display mt-6 text-3xl">{ing.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink/65">{ing.text}</p>
                </motion.div>
              )
            })}
          </div>
          <div className="grid gap-5">
            {[{ img: caprese, alt: 'Fresh tomatoes, mozzarella and basil' }, { img: oven, alt: 'Pizza baking in a wood-fired oven' }].map(({ img, alt }, i) => (
              <motion.div
                key={alt} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.3 }}
                className="relative min-h-[240px]"
              >
                <motion.div
                  variants={{ hidden: { clipPath: 'inset(0 0 100% 0 round 1.75rem)' }, shown: { clipPath: 'inset(0 0 0% 0 round 1.75rem)' } }}
                  transition={{ duration: 1.2, delay: i * 0.15, ease: [0.76, 0, 0.24, 1] }}
                  className="absolute inset-0 overflow-hidden rounded-[1.75rem]"
                >
                  <img src={img.src} srcSet={img.srcSet} sizes="(min-width:1024px) 40vw, 92vw" alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] hover:scale-105" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
