import { ArrowUpRight, Check, Gauge, Layers, Lightbulb, MonitorSmartphone, PenTool } from 'lucide-react'
import { services, type ServiceKey } from '@/content/site'
import type { Dictionary } from '@/content/i18n'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const ICONS: Record<ServiceKey, typeof Gauge> = { consult: Lightbulb, web: MonitorSmartphone, stack: Layers, ui: PenTool, perf: Gauge }

export function Services({ t }: { t: Dictionary['services'] }) {
  return (
    <section id="services" aria-labelledby="services-title" className="section">
      <div className="container-x">
        <SectionHeading
          id="services-title"
          eyebrow={t.eyebrow}
          align="center"
          title={
            <>
              {t.titleLead} <span className="text-gradient animate-gradient">{t.titleHighlight}</span>
            </>
          }
          text={t.text}
        />
        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((key, i) => {
            const Icon = ICONS[key]
            const s = t.items[key]
            if (i === 0)
              return (
                <Reveal as="li" key={key} className="min-w-0 sm:col-span-2 lg:col-span-4">
                  <div className="border-beam glass group relative grid gap-8 overflow-hidden rounded-3xl p-7 sm:p-9 lg:grid-cols-[1.1fr_1fr] lg:gap-12 [--beam-color:#22d3ee]">
                    <div aria-hidden className="absolute -end-24 -top-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.18),transparent)]" />
                    <div className="relative">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="grid size-12 place-items-center rounded-2xl border border-cyan/40 bg-cyan/10 text-cyan">
                          <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                        </span>
                        <span className="rounded-full border border-line-strong bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-soft">
                          {t.featured}
                        </span>
                      </div>
                      <h3 className="mt-7 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{s.title}</h3>
                      <p className="mt-4 max-w-xl leading-relaxed text-muted">{s.text}</p>
                      <a href="#contact" className="btn btn-primary group/cta mt-8 w-full whitespace-normal py-3 text-center sm:w-auto">
                        {t.consultCta}
                        <ArrowUpRight className="size-4 transition-transform duration-500 group-hover/cta:-translate-y-0.5 rtl:-scale-x-100" aria-hidden />
                      </a>
                    </div>
                    <ul className="relative grid content-center gap-3 sm:grid-cols-2">
                      {s.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 text-sm leading-snug text-soft">
                          <Check className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden /> {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )
            return (
              <Reveal as="li" key={key} delay={0.07 * (i - 1)}>
                <div className="border-beam glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                  <div aria-hidden className="absolute -end-16 -top-16 size-40 rounded-full bg-blue/20 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
                  <span className="relative grid size-12 place-items-center rounded-2xl border border-line-strong bg-gradient-to-b from-white/[0.08] to-transparent text-soft transition-colors duration-500 group-hover:text-cyan">
                    <Icon className="size-5 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.6} aria-hidden />
                  </span>
                  <h3 className="mt-8 text-xl font-semibold leading-snug tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.text}</p>
                  <ul className="mt-auto space-y-2 pt-7">
                    {s.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2 text-xs text-soft">
                        <Check className="size-3.5 text-blue" aria-hidden /> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
