'use client'
import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { ArrowUpRight, MessageSquare } from 'lucide-react'
import { projects, type Project } from '@/content/site'
import { fill, type Dictionary } from '@/content/i18n'
import { brandIcons } from '@/lib/brand-icons'
import { useFinePointer } from '@/lib/hooks'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { ProjectVisual } from './ProjectVisual'

type T = Dictionary['work']

export function Projects({ t }: { t: T }) {
  const [first, ...rest] = projects
  return (
    <section id="work" aria-labelledby="work-title" className="section">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            id="work-title"
            eyebrow={t.eyebrow}
            title={
              <>
                {t.titleLead} <span className="text-gradient animate-gradient">{t.titleHighlight}</span>
              </>
            }
            text={t.text}
          />
          <Reveal delay={0.15}>
            <p className="font-mono text-xs text-dim">
              {fill(t.count, { n: String(projects.length).padStart(2, '0'), c: projects.filter((p) => p.concept).length })}
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {first && (
            <Reveal className="lg:col-span-2">
              <ProjectCard project={first} t={t} wide priority />
            </Reveal>
          )}
          {rest.map((p, i) => (
            <Reveal key={p.title} delay={0.08 * i}>
              <ProjectCard project={p} t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project: p, t, wide = false, priority = false }: { project: Project; t: T; wide?: boolean; priority?: boolean }) {
  const text = t.items[p.id]
  const ref = useRef<HTMLElement>(null)
  const fine = useFinePointer()
  const rx = useSpring(0, { stiffness: 150, damping: 18 })
  const ry = useSpring(0, { stiffness: 150, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(600px circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.08), transparent 45%)`

  const onMove = (e: React.PointerEvent) => {
    if (!fine || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * (wide ? 5 : 8))
    rx.set(-(py - 0.5) * (wide ? 5 : 8))
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  const primary = p.live ?? '#contact'
  const external = !!p.live

  return (
    <div style={{ perspective: 1400 }} className="h-full">
      <motion.article
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, ['--beam-color' as string]: p.accent }}
        data-cursor="view"
        className={`border-beam group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-bg-2/80 transition-[border-color] duration-500 hover:border-line-strong ${
          wide ? 'lg:grid lg:grid-cols-[1.45fr_1fr]' : ''
        }`}
      >
        {/* preview */}
        <div className={`relative overflow-hidden ${wide ? 'aspect-[16/10] lg:aspect-auto lg:min-h-[440px]' : 'aspect-[16/10]'}`}>
          <div
            aria-hidden
            className="absolute inset-0 opacity-60"
            style={{ background: `radial-gradient(80% 80% at 30% 20%, ${p.accent}33, transparent 70%)` }}
          />
          <div className={`absolute ${wide ? 'inset-4 sm:inset-6 lg:inset-8 lg:end-0' : 'inset-4 sm:inset-6'} overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.025]`}>
            <ProjectVisual project={p} priority={priority} alt={fill(p.image ? t.screenshotAlt : t.previewAlt, { title: p.title })} />
          </div>
          {p.concept && (
            <span className="absolute end-6 top-6 z-10 rounded-full border border-white/15 bg-bg/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-soft backdrop-blur-md sm:end-8 sm:top-8">
              {t.concept}
            </span>
          )}
        </div>

        {/* body */}
        <div className={`relative flex flex-1 flex-col p-6 sm:p-8 ${wide ? 'lg:justify-center lg:p-10' : ''}`}>
          <div className="flex items-center gap-3 font-mono text-xs text-dim">
            <span>{p.n}</span>
            <span className="h-px w-6 bg-line-strong" />
            <span className="uppercase tracking-[0.16em]" style={{ color: p.accent }}>
              {text.category}
            </span>
          </div>
          <h3 className={`mt-4 font-semibold tracking-[-0.03em] ${wide ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}>
            <a
              href={primary}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="after:absolute after:inset-0 after:z-0 after:content-['']"
            >
              {p.title}
              <span className="sr-only">{' '}{external ? t.srLive : t.srDiscuss}</span>
            </a>
          </h3>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted">{text.description}</p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label={t.technologies}>
            {p.tags.map((tag) => (
              <li key={tag} dir="ltr" className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-soft">
                {tag}
              </li>
            ))}
          </ul>

          <div className="pointer-events-none relative z-10 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 pt-1 lg:mt-auto lg:pt-8">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              {external ? t.view : t.discuss}
              <span className="grid size-8 place-items-center rounded-full border border-line-strong transition-all duration-500 group-hover:rotate-45 group-hover:border-transparent group-hover:bg-white group-hover:text-bg">
                {external ? <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden /> : <MessageSquare className="size-3.5" aria-hidden />}
              </span>
            </span>
            {p.source && (
              <a
                href={p.source}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path d={brandIcons.github.path} />
                </svg>
                {t.source}<span className="sr-only"> {fill(t.srSource, { title: p.title })}</span>
              </a>
            )}
            {p.concept && <span className="text-xs text-dim">{t.soon}</span>}
          </div>
        </div>

        {/* pointer glare */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glare }} />
      </motion.article>
    </div>
  )
}
