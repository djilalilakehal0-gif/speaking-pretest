import { Check, Gauge, Layers, MonitorSmartphone, PenTool } from 'lucide-react'
import { services, type ServiceIcon } from '@/content/site'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const ICONS: Record<ServiceIcon, typeof Gauge> = { web: MonitorSmartphone, stack: Layers, ui: PenTool, perf: Gauge }

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="section">
      <div className="container-x">
        <SectionHeading
          id="services-title"
          eyebrow="Services"
          align="center"
          title={
            <>
              What I can build <span className="text-gradient animate-gradient">for you.</span>
            </>
          }
          text="From a single landing page to a complete product — engineered end-to-end with the same attention to detail."
        />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => {
            const Icon = ICONS[s.icon]
            return (
              <Reveal as="li" key={s.title} delay={0.07 * i}>
                <div className="border-beam glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                  <div aria-hidden className="absolute -right-16 -top-16 size-40 rounded-full bg-blue/20 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
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
