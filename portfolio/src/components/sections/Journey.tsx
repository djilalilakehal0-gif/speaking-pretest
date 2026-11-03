import { ArrowUpRight } from 'lucide-react'
import { journey } from '@/content/site'
import type { Dictionary } from '@/content/i18n'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

export function Journey({ t, newTab }: { t: Dictionary['journey']; newTab: string }) {
  return (
    <section id="journey" aria-labelledby="journey-title" className="section">
      <div className="container-x grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="journey-title"
            eyebrow={t.eyebrow}
            title={
              <>
                {t.titleLead} <span className="text-gradient animate-gradient">{t.titleHighlight}</span>
              </>
            }
            text={t.text}
          />
        </div>

        <ol className="relative">
          <span aria-hidden className="absolute bottom-2 start-[7px] top-2 w-px bg-gradient-to-b from-blue via-violet/50 to-transparent" />
          {journey.map(({ key, link }, i) => {
            const j = t.items[key]
            return (
            <Reveal as="li" key={key} delay={0.06 * i} className="relative pb-12 ps-10 last:pb-0">
              <span aria-hidden className="absolute start-0 top-1.5 grid size-[15px] place-items-center rounded-full border border-blue/60 bg-bg">
                <span className="size-[5px] rounded-full bg-blue shadow-[0_0_12px_2px_rgb(79_124_255/0.7)]" />
              </span>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-dim">
                <time>{j.date}</time> · {j.org}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{j.title}</h3>
              <p className="mt-2 max-w-xl leading-relaxed text-muted">{j.text}</p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-blue"
                >
                  {t.seeLive} <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                  <span className="sr-only">: {j.title} {newTab}</span>
                </a>
              )}
            </Reveal>
            )
          })}
        </ol>
      </div>

      <div className="container-x mt-24 lg:mt-32">
        <Reveal>
          <h3 className="eyebrow">{t.howIWork}</h3>
        </Reveal>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {t.workflow.map((w, i) => (
            <Reveal as="li" key={w.title} delay={0.08 * i} className="group relative bg-bg p-7 transition-colors duration-500 hover:bg-bg-2">
              <span className="font-mono text-5xl font-medium tracking-tighter text-white/[0.07] transition-colors duration-500 group-hover:text-blue/40">{String(i + 1).padStart(2, '0')}</span>
              <h4 className="mt-6 text-xl font-semibold tracking-tight">{w.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.text}</p>
              <span aria-hidden className="absolute inset-x-7 bottom-0 h-px origin-left rtl:origin-right scale-x-0 bg-gradient-to-r from-blue to-violet transition-transform duration-700 group-hover:scale-x-100" />
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
