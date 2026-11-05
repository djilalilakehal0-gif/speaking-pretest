import { useEffect, useState } from 'react'
import { PhoneIcon } from '../components/icons/Icons'
import { openStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { site } from '../config/site'

/**
 * The poster: the slogan set as huge sign lettering, and the burger in a red neon
 * light box — the backlit menu panels above the counter. The page's one orchestrated
 * moment is here (lines rise, the tube flickers on, the burger lights up), in CSS so
 * it paints before JavaScript and is skipped for reduced motion.
 */
export function Hero() {
  const burger = photo('hero-burger')
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null)
  useEffect(() => setStatus(openStatus()), [])

  return (
    <section id="top" className="relative isolate overflow-hidden pb-16 pt-[5.5rem] sm:pb-24 lg:pt-28" aria-labelledby="hero-title">
      <div className="container-x relative">
        <h1 id="hero-title" className="display hero-type relative z-0 text-[clamp(4.4rem,16vw,13rem)] text-cream lg:text-[min(13.6vw,12.5rem)]">
          <span className="block">The taste <span className="lg:inline hidden">of</span></span>
          <span className="block"><span className="lg:hidden">of </span>excellence</span>
        </h1>

        <div className="relative lg:grid lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-12">
          <figure className="relative z-10 mx-auto mt-8 aspect-square w-[min(88vw,28rem)] lg:order-2 lg:-mt-[1.6vw] lg:w-full">
            <div className="neon neon-on absolute inset-0 rounded-[1.25rem] bg-ink" aria-hidden />
            <img
              src={burger.src} srcSet={burger.srcSet} sizes="(min-width:1024px) 32rem, 88vw"
              alt="Cheeseburger NAPOLITIME : pain brioché, steak et cheddar fondant"
              fetchPriority="high" decoding="async"
              className="hero-burger relative h-full w-full rounded-[1.25rem] object-cover [mask-image:radial-gradient(closest-side,#000_70%,transparent_100%)]"
            />
            <img src={`${import.meta.env.BASE_URL}img/logo-160.webp`} alt="" width={96} height={96} className="hero-badge absolute -bottom-6 -left-6 h-20 w-20 rounded-full sm:h-24 sm:w-24" aria-hidden />
          </figure>

        <div className="hero-copy relative z-10 mt-14 max-w-xl lg:order-1 lg:mt-10">
          <p className="text-xl leading-relaxed text-cream/85">
            Burgers, sandwichs, tacos et tex-mex préparés à la commande, sur place, à emporter ou en livraison.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#menu" className="btn btn-primary">Voir le menu</a>
            <a href={site.contact.phoneHref} className="btn btn-ghost"><PhoneIcon size={18} /> Appeler le {site.contact.phoneDisplay}</a>
          </div>
          {status && (
            <p className="mt-6 flex items-center gap-2.5 text-base text-ash" role="status">
              <span className={`h-2.5 w-2.5 rounded-full ${status.open ? 'bg-[#3ddc84] shadow-[0_0_10px_#3ddc84]' : 'bg-tomato'}`} aria-hidden />
              {status.open ? status.label : `Fermé pour le moment. ${status.label}.`}
            </p>
          )}
        </div>
        </div>
      </div>
    </section>
  )
}
