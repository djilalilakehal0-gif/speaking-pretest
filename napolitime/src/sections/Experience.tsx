import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { site } from '../config/site'
import { euro } from '../lib/format'
import { photo } from '../lib/img'
import { menuImage } from '../components/ProductCard'
import { ease, Reveal, SectionHeading } from '../components/Reveal'
import { BagIcon, PinIcon, ScooterIcon } from '../components/icons/Icons'

const o = site.ordering
const store = photo('storefront')
const burger = photo('hero-burger')

const chapters = [
  {
    id: 'sur-place', n: '01', it: 'Al tavolo', title: 'Sur place', Icon: PinIcon,
    text: 'Installez-vous : la commande part en cuisine dès qu’elle est passée et arrive à table, chaude et généreuse.',
    facts: ['Préparé à la commande', 'Accueil convivial'],
    img: { ...store, alt: 'La devanture illuminée du restaurant NAPOLITIME' }, contain: false,
  },
  {
    id: 'emporter', n: '02', it: 'Da asporto', title: 'À emporter', Icon: BagIcon,
    text: 'Commandez, passez la prendre : votre commande vous attend, prête à partir.',
    facts: [`Prêt en ${o.estimatedPickupMinutes} min`, 'Paiement au retrait'],
    img: { ...burger, alt: 'Burger au cheddar fondant sur pain brioché' }, contain: false,
  },
  {
    id: 'livraison', n: '03', it: 'A domicilio', title: 'Livraison', Icon: ScooterIcon,
    text: 'Restez chez vous : nous livrons votre repas, de la box tex-mex au milkshake.',
    facts: [`${o.estimatedDeliveryMinutes} min environ`, `Livraison ${euro(o.deliveryFee)} · offerte dès ${euro(o.freeDeliveryFrom)}`, `Minimum ${euro(o.minimumDeliveryOrder)}`],
    img: { src: menuImage('tex-box-xl'), srcSet: undefined, alt: 'Menu Tex Box XL : tenders, wings et oignons rings' }, contain: true,
  },
]

/**
 * "The experience": a sticky photo frame on the left changes with a masked wipe while the three
 * chapters (dine in, take away, delivery) scroll past on the right. Stacks on small screens.
 */
export function Experience() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)) }),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const c = chapters[active]
  return (
    <section id="experience" className="grain relative bg-noir-2 py-24 sm:py-36" aria-labelledby="exp-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_30%,rgba(109,16,34,.35),transparent_55%)]" />
      <div className="container-x relative">
        <div id="exp-title"><SectionHeading eyebrow="L’esperienza" title={'À votre table,\n_ou à la vôtre.'} intro="Sur place, à emporter ou livré : trois façons de goûter NAPOLITIME." /></div>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          {/* sticky frame (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-28 h-[min(calc(100svh-9rem),48rem)] w-full overflow-hidden rounded-[2.25rem]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={c.id}
                  className={`absolute inset-0 ${c.contain ? 'plate' : ''}`}
                  initial={{ clipPath: 'inset(100% 0% 0% 0%)' }} animate={{ clipPath: 'inset(0% 0% 0% 0%)' }} exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.5 } }}
                  transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
                >
                  <motion.img
                    src={c.img.src} srcSet={c.img.srcSet} sizes="50vw" alt={c.img.alt} loading="lazy"
                    initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease }}
                    className={`h-full w-full ${c.contain ? 'object-contain p-8' : 'object-cover'}`}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between bg-gradient-to-t from-noir/80 to-transparent p-7">
                <AnimatePresence mode="wait">
                  <motion.p key={c.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.5, ease }}
                    className="display-i text-4xl text-gold">{c.it}</motion.p>
                </AnimatePresence>
                <p className="font-serif text-lg text-ivory/60 tabular-nums">{c.n} <span className="text-ivory/30">/ 0{chapters.length}</span></p>
              </div>
            </div>
          </div>

          {/* chapters */}
          <div>
            {chapters.map((ch, i) => (
              <article
                key={ch.id} data-i={i} ref={(el) => { refs.current[i] = el }}
                className={`flex flex-col justify-center border-t border-ivory/10 py-12 transition-opacity duration-700 lg:min-h-[75svh] lg:py-0 ${active === i ? 'lg:opacity-100' : 'lg:opacity-35'}`}
              >
                <div className={`relative mb-8 aspect-[4/3] overflow-hidden rounded-[1.5rem] lg:hidden ${ch.contain ? 'plate' : ''}`}>
                  <img src={ch.img.src} srcSet={ch.img.srcSet} sizes="92vw" alt={ch.img.alt} loading="lazy" className={`h-full w-full ${ch.contain ? 'object-contain p-5' : 'object-cover'}`} />
                </div>
                <Reveal>
                  <p className="flex items-center gap-4 text-gold">
                    <span className="font-serif text-lg italic">{ch.n}</span>
                    <span className="h-px w-10 bg-gold/50" />
                    <ch.Icon size={22} live={active === i} />
                  </p>
                  <h3 className="display mt-6 text-[clamp(3rem,6vw,5rem)] text-ivory">{ch.title}</h3>
                  <p className="display-i mt-1 text-2xl text-gold/80">{ch.it}</p>
                  <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/70">{ch.text}</p>
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {ch.facts.map((f) => <li key={f} className="rounded-full border border-gold/30 px-4 py-2 text-xs font-medium text-ivory/80">{f}</li>)}
                  </ul>
                </Reveal>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
