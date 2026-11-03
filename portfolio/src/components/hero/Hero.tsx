'use client'
import dynamic from 'next/dynamic'
import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'
import { hero, site } from '@/content/site'
import { asset } from '@/lib/asset'
import { useFinePointer } from '@/lib/hooks'
import { Magnetic } from '../ui/Magnetic'
import { Terminal } from './Terminal'

// The canvas sphere is decorative: load it after the critical content.
const HeroOrb = dynamic(() => import('./HeroOrb'), { ssr: false })

const EASE = [0.16, 1, 0.3, 1] as const

// deterministic ambient particles (no hydration mismatch)
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 100,
  size: 1 + ((i * 7) % 3),
  delay: (i % 6) * -1.6,
  dur: 9 + (i % 5) * 2,
}))

export function Hero() {
  const reduce = useReducedMotion()
  const fine = useFinePointer()
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const ref = useRef<HTMLElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (!fine) return
    mx.set(e.clientX / window.innerWidth - 0.5)
    my.set(e.clientY / window.innerHeight - 0.5)
  }

  const words = hero.headline.join(' ').split(' ')

  return (
    <section
      ref={ref}
      id="top"
      aria-labelledby="hero-title"
      onPointerMove={onMove}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-24 pt-[calc(var(--header-h)+env(safe-area-inset-top)+2rem)] lg:pb-16"
    >
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-lines absolute inset-0" />
        <div className="absolute -left-[20%] -top-[30%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgb(79_124_255/0.22),transparent)]" />
        <div className="absolute -right-[25%] top-[10%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.18),transparent)]" />
        <div className="absolute bottom-[-30%] left-[30%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.08),transparent)]" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute animate-float rounded-full bg-white/50"
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, opacity: 0.25 + (i % 4) * 0.1 }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="container-x grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
        {/* copy */}
        <div className="relative z-10">
          <div
            className="hero-fade inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] py-1.5 pl-2.5 pr-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-soft backdrop-blur"
          >
            <span className="relative grid size-2 place-items-center">
              <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-[#4ade80]" />
              <span className="relative size-2 rounded-full bg-[#4ade80]" />
            </span>
            {hero.badge}
          </div>

          <h1 id="hero-title" className="mt-7 text-balance text-[clamp(2.6rem,6.2vw,5.3rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
            <span className="sr-only">
              {hero.headline.join(' ')} {hero.highlight}
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
                  <span className="text-gradient inline-block animate-gradient pr-[0.06em]">{hero.highlight}</span>
                </span>
              </span>
            </span>
          </h1>

          <p
            className="hero-rise mt-7 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-muted sm:text-lg"
          >
            {hero.text}
          </p>

          <div
            style={{ animationDelay: '0.5s' }}
            className="hero-fade mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Magnetic>
              <a href={hero.primaryCta.href} className="btn btn-primary group w-full sm:w-auto">
                {hero.primaryCta.label}
                <ArrowDown className="size-4 transition-transform duration-500 group-hover:translate-y-0.5" aria-hidden />
              </a>
            </Magnetic>
            <Magnetic>
              <a href={hero.secondaryCta.href} className="btn btn-ghost group w-full sm:w-auto">
                {hero.secondaryCta.label}
                <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </a>
            </Magnetic>
          </div>

          <p
            style={{ animationDelay: '0.7s' }}
            className="hero-fade mt-10 flex items-center gap-2 font-mono text-xs text-dim"
          >
            <MapPin className="size-3.5" aria-hidden /> {site.location}
          </p>
        </div>

        {/* visual composition */}
        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease: EASE }}
          className="relative mx-auto aspect-[1/1.02] w-full max-w-[560px] sm:aspect-square"
        >
          <Layer mx={mx} my={my} depth={14} className="absolute inset-[-8%]">
            <HeroOrb />
          </Layer>

          {/* profile card */}
          <Layer mx={mx} my={my} depth={-26} className="absolute right-0 top-[4%] sm:right-[2%]">
            <div className="glass animate-float-slow flex items-center gap-3 rounded-2xl p-2.5 pr-4">
              <img
                src={asset(site.portrait.avatar)}
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-xl object-cover"
                fetchPriority="high"
              />
              <div>
                <p className="text-sm font-semibold tracking-tight">{site.name}</p>
                <p className="text-xs text-muted">{site.role}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[#4ade80]">
                  <span className="size-1.5 rounded-full bg-[#4ade80]" /> Online
                </p>
              </div>
            </div>
          </Layer>

          {/* code snippet */}
          <Layer mx={mx} my={my} depth={-18} className="absolute left-0 top-[18%] hidden sm:block">
            <Panel className="animate-float [animation-delay:-3s]">
              <pre className="font-mono text-[11.5px] leading-[1.7]">
                <code>
                  <span className="text-violet">const</span> <span className="text-cyan">craft</span> = {'{'}
                  {'\n'}  code: <span className="text-[#a5d6a7]">&apos;clean&apos;</span>,
                  {'\n'}  motion: <span className="text-[#fbbf77]">60</span>,
                  {'\n'}  ux: <span className="text-[#a5d6a7]">&apos;human&apos;</span>,
                  {'\n'}{'}'}
                </code>
              </pre>
            </Panel>
          </Layer>

          {/* build metrics panel */}
          <Layer mx={mx} my={my} depth={-22} className="absolute bottom-[26%] right-[-2%] hidden md:block">
            <Panel className="w-[176px] animate-float-slow [animation-delay:-6s]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">Pipeline</p>
              {[
                ['Build', 'w-[92%]', 'bg-blue'],
                ['Tests', 'w-[78%]', 'bg-violet'],
                ['Deploy', 'w-[64%]', 'bg-cyan'],
              ].map(([l, wd, c]) => (
                <div key={l} className="mt-2.5">
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>{l}</span>
                    <span className="text-[#4ade80]">✓</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${wd} ${c}`} />
                  </div>
                </div>
              ))}
            </Panel>
          </Layer>

          {/* terminal */}
          <Layer mx={mx} my={my} depth={-34} className="absolute bottom-0 left-0 w-[min(340px,88%)] sm:left-[-4%]">
            <Terminal />
          </Layer>
        </motion.div>
      </div>

      {/* scroll indicator */}
      <a
        href="#about"
        className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-dim transition-colors hover:text-soft lg:flex"
      >
        <span className="flex h-9 w-[22px] justify-center rounded-full border border-line-strong pt-2">
          <span className="block h-1.5 w-[3px] animate-scroll-dot rounded-full bg-current" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Scroll</span>
        <span className="sr-only">to the About section</span>
      </a>
    </section>
  )
}

function Layer({ mx, my, depth, className, children }: { mx: MotionValue<number>; my: MotionValue<number>; depth: number; className?: string; children: ReactNode }) {
  const x = useTransform(mx, (v) => v * depth)
  const y = useTransform(my, (v) => v * depth)
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  )
}

function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`glass rounded-2xl px-4 py-3.5 ${className}`}>{children}</div>
}
