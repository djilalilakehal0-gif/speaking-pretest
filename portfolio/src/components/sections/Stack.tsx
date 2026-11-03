import { Database, Layout, Server, Wrench } from 'lucide-react'
import { stack } from '@/content/site'
import { BrandIcon, brandColor } from '../ui/BrandIcon'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

const CAT_ICON = { Frontend: Layout, Backend: Server, Databases: Database, Tools: Wrench } as Record<string, typeof Layout>
const SPAN = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7']

export function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="section">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[60%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(79_124_255/0.08),transparent)]" />
      <div className="container-x">
        <SectionHeading
          id="stack-title"
          eyebrow="Tech Stack"
          title={
            <>
              Tools I use to <span className="text-gradient animate-gradient">ship with confidence.</span>
            </>
          }
          text="A focused, modern toolkit across the whole product — from interface to infrastructure."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {stack.map((cat, ci) => {
            const Icon = CAT_ICON[cat.category] ?? Layout
            return (
              <Reveal key={cat.category} delay={0.06 * ci} className={SPAN[ci % SPAN.length]}>
                <div className="border-beam glass h-full rounded-3xl p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-soft">
                        <Icon className="size-4 text-blue" aria-hidden /> {cat.category}
                      </h3>
                      <p className="mt-2.5 text-sm text-muted">{cat.blurb}</p>
                    </div>
                    <span className="font-mono text-xs text-dim">{String(cat.items.length).padStart(2, '0')}</span>
                  </div>
                  <ul className="mt-7 flex flex-wrap gap-2.5">
                    {cat.items.map((t) => (
                      <li key={t.name}>
                        <span
                          className="group/t relative flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5 text-sm text-soft transition-[border-color,background-color,transform,color] duration-300 hover:-translate-y-0.5 hover:border-[color:var(--c)]/40 hover:bg-white/[0.05] hover:text-ink"
                          style={{ ['--c' as string]: brandColor(t.icon) }}
                        >
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/t:opacity-100"
                            style={{ boxShadow: `0 0 24px -6px ${brandColor(t.icon)}66, inset 0 0 0 1px ${brandColor(t.icon)}55` }}
                          />
                          <span className="text-muted transition-colors duration-300 group-hover/t:text-[color:var(--c)]">
                            <BrandIcon icon={t.icon} className="size-[18px]" />
                          </span>
                          {t.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
