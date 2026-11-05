'use client'
import { useRef } from 'react'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'
import type { Dictionary } from '@/content/i18n'
import { Magnetic } from '../ui/Magnetic'
import { Desk } from './desk/Desk'
import { TechRows } from './TechRows'
import { useDeskProgress } from './useDeskProgress'

type Props = { t: Pick<Dictionary, 'hero' | 'site' | 'ui'> }

/**
 * Hero: headline and calls to action next to "the developer's desk".
 * On large screens the section is 280vh tall and its content sticky, so scrolling
 * drives the desk scene (see desk/timeline.ts) before the page moves on.
 */
export function Hero({ t }: Props) {
  const hero = t.hero
  const section = useRef<HTMLElement>(null)
  const p = useDeskProgress(section)

  const words = hero.headline.split(' ')

  return (
    <section ref={section} id="top" aria-labelledby="hero-title" className="relative isolate lg:h-[280vh]">
      <div className="relative flex min-h-[100svh] flex-col justify-center overflow-clip pb-10 pt-[calc(var(--header-h)+env(safe-area-inset-top)+1.5rem)] lg:sticky lg:top-0 lg:h-[100svh] lg:pb-6">
        {/* atmosphere: two still glows and the grid, no looping motion */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="grid-lines absolute inset-0" />
          <div className="absolute -left-[20%] -top-[30%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgb(79_124_255/0.2),transparent)]" />
          <div className="absolute -right-[20%] top-[5%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.1),transparent)]" />
        </div>

        <div className="container-x grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
          {/* copy */}
          <div className="relative z-10">
            <div className="hero-fade inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] py-1.5 pe-3.5 ps-2.5 text-[13px] text-soft backdrop-blur">
              <span className="relative size-2 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]" aria-hidden />
              {hero.badge}
            </div>

            <h1 id="hero-title" className="mt-7 text-balance text-[clamp(2.5rem,4.9vw,4.5rem)] font-semibold leading-[1] tracking-[-0.045em]">
              <span className="sr-only">
                {hero.headline} {hero.highlight}
              </span>
              <span aria-hidden>
                {words.map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
                    <span className="hero-word" style={{ animationDelay: `${0.08 + i * 0.06}s` }}>
                      {w}&nbsp;
                    </span>
                  </span>
                ))}
                <span className="inline-block overflow-hidden pb-[0.12em] align-top">
                  <span className="hero-word" style={{ animationDelay: `${0.08 + words.length * 0.06}s` }}>
                    <span className="text-gradient inline-block pe-[0.06em]">{hero.highlight}</span>
                  </span>
                </span>
              </span>
            </h1>

            <p className="hero-rise mt-6 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-muted sm:text-lg">{hero.text}</p>

            <div style={{ animationDelay: '0.5s' }} className="hero-fade mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <a href="#work" className="btn btn-primary group w-full sm:w-auto">
                  {hero.primary}
                  <ArrowDown className="size-4 transition-transform duration-500 group-hover:translate-y-0.5" aria-hidden />
                </a>
              </Magnetic>
              <Magnetic>
                <a href="#contact" className="btn btn-ghost group w-full sm:w-auto">
                  {hero.secondary}
                  <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
                </a>
              </Magnetic>
            </div>

            <p style={{ animationDelay: '0.7s' }} className="hero-fade mt-8 flex items-center gap-2 text-sm text-dim">
              <MapPin className="size-4" aria-hidden /> {t.site.location}
            </p>
          </div>

          {/* the desk */}
          <Desk p={p} role={t.site.role} online={t.site.online} />
        </div>

        <TechRows p={p} />
      </div>
    </section>
  )
}
