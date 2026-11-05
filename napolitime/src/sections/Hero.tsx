import { useEffect, useState } from 'react'
import { openStatus, type OpenStatus } from '../lib/hours'
import { photo } from '../lib/img'
import { site } from '../config/site'

/**
 * Hero — "Name across the middle". The shop's lit fascia is the name on a black band, so the
 * page sets NAPOLITIME across the whole width; the burger photograph stands in for its first O.
 * Corners: the slogan and the one action (top left), the live open sign (bottom left, the
 * page's live thing) and the phone (bottom right).
 */
export function Hero() {
  const burger = photo('hero-burger')
  const store = photo('storefront')
  return (
    <section id="top" className="relative flex flex-col pt-[4.75rem] lg:min-h-[100svh]" aria-labelledby="hero-title">
      <div className="container-x load-2 pt-6">
        <div className="max-w-[26rem]">
          <p className="text-[length:var(--step-lead)] leading-snug">
            The taste of excellence. Burgers, sandwichs, tacos et tex-mex, sur place, à emporter ou livrés.
          </p>
          <a href="#menu" className="btn btn-primary mt-5 w-full sm:w-auto">Voir la carte</a>
        </div>
      </div>

      <h1 id="hero-title" aria-label="NAPOLITIME" className="monument load-1 display my-10 flex items-baseline justify-center whitespace-nowrap px-[var(--margin)] text-[clamp(4.1rem,21.4vw,20rem)] !leading-[0.8] lg:my-auto">
        <span aria-hidden>NAP</span>
        <span aria-hidden className="relative mx-[0.03em] inline-block h-[0.7em] w-[0.62em] overflow-hidden bg-black">
          <img src={burger.src} srcSet={burger.srcSet} sizes="20vw" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full scale-[1.45] object-cover" />
        </span>
        <span aria-hidden>LITIME</span>
      </h1>

      <div className="container-x load-3 flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <OpenSign />
        <a href={site.contact.phoneHref} className="text-[length:var(--step-lead)] underline decoration-2 underline-offset-4 hover:text-tomato">
          Appeler le {site.contact.phoneDisplay}
        </a>
      </div>

      {/* Phone: the lower half shows the shop itself, cropped by the screen's edge. */}
      <img src={store.src} srcSet={store.srcSet} sizes="100vw" alt="La devanture lumineuse de NAPOLITIME le soir" loading="lazy"
        className="mt-4 aspect-[4/5] w-full object-cover object-top sm:hidden" />
    </section>
  )
}

/** The window's LED "OPEN" sign, made live: lit while open, with the time it closes or opens. */
export function OpenSign({ big = false }: { big?: boolean }) {
  const [s, setS] = useState<OpenStatus | null>(null)
  useEffect(() => {
    setS(openStatus())
    const t = setInterval(() => setS(openStatus()), 30_000)
    return () => clearInterval(t)
  }, [])
  if (!s) return <p className="text-[length:var(--step-lead)] text-ash">Horaires plus bas</p>
  return (
    <p className={`flex items-center gap-3 ${big ? 'display text-[length:var(--step-head)]' : 'text-[length:var(--step-lead)]'}`} role="status">
      <svg aria-hidden viewBox="0 0 64 26" className={`shrink-0 ${s.open ? 'sign-on' : 'opacity-35'} ${big ? 'h-[0.6em]' : 'h-[1.1em]'}`}>
        <rect width="64" height="26" fill="#E50914" />
        <text x="32" y="21" textAnchor="middle" fill="#fff" fontFamily="Bebas Neue, sans-serif" fontSize="22" letterSpacing="1">OPEN</text>
      </svg>
      <span>{s.open ? s.label : `Fermé. ${s.label}`}</span>
    </p>
  )
}
