'use client'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { site, stats } from '@/content/site'
import type { Dictionary } from '@/content/i18n'
import { asset } from '@/lib/asset'
import { Reveal } from '../ui/Reveal'

export function About({ t }: { t: Pick<Dictionary, 'about' | 'site'> }) {
  const about = t.about
  const shown = stats.filter((s) => s.value !== null)
  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container-x grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* official portrait */}
        <Reveal className="relative mx-auto w-full max-w-[440px] lg:sticky lg:top-28 lg:self-start">
          <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgb(79_124_255/0.35),transparent)] blur-2xl" />
          <figure className="border-beam group relative overflow-hidden rounded-[1.75rem] border border-line-strong bg-bg-2 [--beam-color:#4f7cff]">
            <picture>
              <source media="(max-width: 640px)" srcSet={asset(site.portrait.srcSmall)} type="image/webp" />
              <source srcSet={asset(site.portrait.src)} type="image/webp" />
              <img
                src={asset(site.portrait.fallback)}
                alt={t.site.portraitAlt}
                width={site.portrait.width}
                height={site.portrait.height}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover object-top transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
              />
            </picture>
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
            <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
              <div className="glass rounded-2xl px-4 py-3">
                <p className="text-base font-semibold tracking-tight">{site.name}</p>
                <p className="text-xs text-muted">{t.site.title}</p>
              </div>
              <span className="glass grid size-12 shrink-0 place-items-center rounded-2xl font-mono text-sm text-cyan">&lt;/&gt;</span>
            </figcaption>
          </figure>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow">{about.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 id="about-title" className="h-section mt-5 text-balance">
              {about.titleLead} <span className="text-gradient animate-gradient">{about.titleHighlight}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-2xl text-pretty text-[1.05rem] leading-relaxed text-muted md:text-lg">{about.text}</p>
          </Reveal>

          <ul className="mt-12 grid gap-4 sm:grid-cols-3">
            {about.pillars.map((p, i) => (
              <Reveal as="li" key={p.title} delay={0.08 * i}>
                <div className="border-beam glass group h-full rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1">
                  <span className="font-mono text-xs text-dim transition-colors group-hover:text-cyan">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-8 text-lg font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <dl className={`mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line ${shown.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {shown.map((s) => (
              <div key={s.key} className={`flex flex-col-reverse justify-end gap-2 bg-bg p-6 ${shown.length % 2 && s === shown[shown.length - 1] ? 'col-span-2 md:col-span-1' : ''}`}>
                <dt className="text-sm leading-snug text-muted">{about.stats[s.key]}</dt>
                <dd className="text-4xl font-semibold tracking-tight md:text-5xl">
                  <Counter value={s.value!} />
                  <span className="text-gradient">{s.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(value) // server/no-JS render shows the real value

  useEffect(() => {
    if (!reduce && !inView) setN(0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, reduce, value])

  return <span ref={ref} className="tabular-nums">{n}</span>
}
