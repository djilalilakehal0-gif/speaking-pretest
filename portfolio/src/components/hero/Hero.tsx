'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'
import { site, stack } from '@/content/site'
import type { Dictionary } from '@/content/i18n'
import { asset } from '@/lib/asset'
import { BrandIcon, brandColor } from '../ui/BrandIcon'
import { Magnetic } from '../ui/Magnetic'

type Props = { t: Pick<Dictionary, 'hero' | 'site' | 'ui'> }

const TECH = stack.flatMap((c) => c.items)
const ROW_A = TECH.slice(0, 10)
const ROW_B = TECH.slice(10).concat(TECH.slice(0, 2))

/**
 * Hero: "the developer's desk".
 * The scene is sticky on large screens; scrolling opens the laptop, scrolls the real
 * NAPOLITIME site inside the monitor and the phone, prints the terminal lines and slides
 * the two rows of tech icons. Everything is transform/opacity only. With reduced motion
 * the scene is shown in its finished state and nothing moves.
 */
export function Hero({ t }: Props) {
  const hero = t.hero
  const reduce = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  const still = useMotionValue(0.72)
  const p = reduce ? still : smooth

  const words = hero.headline.split(' ')

  return (
    <section ref={section} id="top" aria-labelledby="hero-title" className="relative isolate lg:h-[280vh]">
      <div className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-10 pt-[calc(var(--header-h)+env(safe-area-inset-top)+1.5rem)] lg:sticky lg:top-0 lg:h-[100svh] lg:pb-6">
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

        {/* scrolling icon rows */}
        <div aria-hidden dir="ltr" className="mt-10 space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] lg:mt-6">
          <IconRow items={ROW_A} p={p} from="0%" to="-34%" />
          <IconRow items={ROW_B} p={p} from="-34%" to="0%" />
        </div>
      </div>
    </section>
  )
}

function IconRow({ items, p, from, to }: { items: typeof TECH; p: MotionValue<number>; from: string; to: string }) {
  const x = useTransform(p, [0, 1], [from, to])
  const all = [...items, ...items, ...items]
  return (
    <motion.ul style={{ x }} className="flex w-max gap-3">
      {all.map((it, i) => (
        <li
          key={i}
          translate="no"
          className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-soft"
          style={{ ['--c' as string]: brandColor(it.icon) }}
        >
          <span className="text-[color:var(--c)]">
            <BrandIcon icon={it.icon} className="size-5" />
          </span>
          {it.name}
        </li>
      ))}
    </motion.ul>
  )
}

const CODE: [string, string][][] = [
  [['k', 'export async function '], ['f', 'launch'], ['t', '(idea) {']],
  [['k', '  const '], ['t', 'app = '], ['k', 'await '], ['f', 'build'], ['t', '(idea, {']],
  [['t', '    design: '], ['s', "'premium'"], ['t', ',']],
  [['t', '    responsive: '], ['n', 'true'], ['t', ',']],
  [['t', '    languages: ['], ['s', "'ar'"], ['t', ', '], ['s', "'fr'"], ['t', ', '], ['s', "'en'"], ['t', '],']],
  [['t', '  })']],
  [['k', '  return '], ['f', 'deploy'], ['t', '(app)']],
  [['t', '}']],
]
const TOK: Record<string, string> = { k: 'text-[#7aa2ff]', f: 'text-[#5cd3ff]', s: 'text-[#8ef0c4]', n: 'text-[#ffb86b]', t: 'text-[#dfe9ff]' }
const TERM = ['❯ npm run build', '✓ compiled in 1.2s', '✓ 48 tests passed', '▲ live on djilali.pages.dev']

function Desk({ p, role, online }: { p: MotionValue<number>; role: string; online: string }) {
  const sceneRy = useTransform(p, [0, 1], [-7, 6])
  const lid = useTransform(p, [0, 0.28], [62, -6])
  const monRy = useTransform(p, [0, 0.3], [34, 16])
  const monX = useTransform(p, [0, 0.3], ['-6%', '0%'])
  const monScroll = useTransform(p, [0.22, 0.96], ['0%', '-86%'])
  const phoneY = useTransform(p, [0, 0.35], ['12%', '0%'])
  const phoneScroll = useTransform(p, [0.3, 0.98], ['0%', '-78%'])
  const termY = useTransform(p, [0, 0.35], ['-10%', '0%'])
  const caret = useTransform(p, [0.25, 0.95], ['0%', '700%'])
  const portraitS = useTransform(p, [0, 0.4], [0.94, 1])

  return (
    <div aria-hidden dir="ltr" className="relative mx-auto w-full max-w-[760px] [container-type:inline-size] [perspective:1600px] lg:-me-[3%]">
      <motion.div style={{ rotateY: sceneRy, rotateX: 4 }} className="desk-in relative aspect-[1/0.98] w-full [transform-style:preserve-3d]">
        {/* portrait */}
        <motion.div style={{ scale: portraitS, z: -140 }} className="absolute left-[33%] top-[0%] w-[40%]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.2cqw] border border-line-strong shadow-[0_40px_80px_-30px_#000]">
            <img src={asset(site.portrait.srcSmall)} alt="" width={480} height={720} fetchPriority="high" className="size-full object-cover object-[50%_14%]" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg/80 to-transparent" />
            <div className="absolute bottom-[5%] right-[5%] flex max-w-[70%] items-center gap-[2cqw] rounded-[1.6cqw] border border-white/15 bg-bg/70 px-[2.4cqw] py-[1.6cqw] backdrop-blur-md">
              <span className="size-[1.4cqw] shrink-0 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
              <span className="min-w-0">
                <span className="block truncate text-[2.6cqw] font-semibold leading-tight">{site.name}</span>
                <span className="block truncate text-[2cqw] text-muted" title={online}>
                  {role}
                </span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* monitor */}
        <motion.div style={{ rotateY: monRy, x: monX, z: 30 }} className="absolute left-[-3%] top-[24%] w-[56%] origin-left">
          <div className="rounded-[1.8cqw] border border-white/10 bg-[#0a0d16] p-[1.1cqw] shadow-[0_40px_90px_-30px_#000,0_0_50px_-20px_#4f7cff]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[0.8cqw] bg-black">
              <motion.img
                style={{ y: monScroll }}
                src={asset('/img/projects/napo-desk-full.webp')}
                alt=""
                width={900}
                height={5200}
                loading="lazy"
                decoding="async"
                className="block w-full"
              />
            </div>
          </div>
          <div className="mx-auto h-[5cqw] w-[9%] bg-gradient-to-b from-[#1a2133] to-[#0d1220]" />
          <div className="mx-auto h-[1.2cqw] w-[38%] rounded-full bg-[#141a2a] shadow-[0_8px_20px_#000]" />
        </motion.div>

        {/* terminal */}
        <motion.div style={{ y: termY, z: 60 }} className="absolute right-[-2%] top-[6%] w-[36%]">
          <div className="glass overflow-hidden rounded-[1.8cqw]">
            <div className="flex items-center gap-[1cqw] border-b border-line px-[2cqw] py-[1.4cqw]">
              <i className="size-[1.4cqw] rounded-full bg-[#ff5f57]/80" />
              <i className="size-[1.4cqw] rounded-full bg-[#febc2e]/80" />
              <i className="size-[1.4cqw] rounded-full bg-[#28c840]/80" />
            </div>
            <div translate="no" className="space-y-[1cqw] px-[2.4cqw] py-[2cqw] font-mono text-[2.1cqw] leading-tight">
              {TERM.map((line, i) => (
                <TermLine key={i} p={p} at={0.3 + i * 0.14} text={line} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* phone */}
        <motion.div style={{ y: phoneY, z: 90 }} className="absolute bottom-[14%] right-[1%] w-[17%]">
          <div className="rounded-[3cqw] border-[0.9cqw] border-[#0b0f19] bg-[#0b0f19] shadow-[0_30px_60px_-20px_#000,0_0_0_1px_rgb(255_255_255/0.12)]">
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.2cqw] bg-black">
              <motion.img
                style={{ y: phoneScroll }}
                src={asset('/img/projects/napo-mob-full.webp')}
                alt=""
                width={360}
                height={4200}
                loading="lazy"
                decoding="async"
                className="block w-full"
              />
            </div>
          </div>
        </motion.div>

        {/* laptop */}
        <motion.div style={{ z: 150 }} className="absolute bottom-[1%] left-[21%] w-[56%] [transform-style:preserve-3d]">
          <motion.div style={{ rotateX: lid }} className="origin-bottom rounded-t-[1.6cqw] border border-white/10 bg-[#0a0d16] p-[1cqw] pb-[1.4cqw] shadow-[0_-10px_60px_-25px_#4f7cff]">
            <div translate="no" className="relative aspect-[16/10] overflow-hidden rounded-[0.6cqw] bg-[#0a1426] font-mono text-[1.85cqw] leading-[1.75]">
              <div className="flex items-center gap-[1cqw] bg-[#10213d] px-[1.6cqw] py-[0.9cqw] text-[1.6cqw] text-[#8ba3c7]">
                <i className="size-[1.1cqw] rounded-full bg-[#ff5f57]" />
                <i className="size-[1.1cqw] rounded-full bg-[#febc2e]" />
                <i className="size-[1.1cqw] rounded-full bg-[#28c840]" />
                <span className="ms-[1cqw]">launch.ts</span>
              </div>
              <div className="relative px-[2cqw] py-[1.2cqw]">
                <motion.div style={{ y: caret }} className="absolute inset-x-0 top-[1.2cqw] h-[3.24cqw] bg-[#2f8cff]/15" />
                {CODE.map((ln, i) => (
                  <div key={i} className="relative whitespace-pre">
                    <span className="me-[1.6cqw] text-[#4b5f80]">{i + 1}</span>
                    {ln.map(([k, s], j) => (
                      <span key={j} className={TOK[k]}>
                        {s}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          <div className="relative h-[3.4cqw] bg-gradient-to-b from-[#3a4257] via-[#232a3c] to-[#141a28] [clip-path:polygon(3%_0,97%_0,100%_100%,0_100%)]">
            <div className="absolute left-1/2 top-0 h-[1cqw] w-[16%] -translate-x-1/2 rounded-b-[1cqw] bg-[#141a28]" />
          </div>
          <div className="mx-auto h-[2cqw] w-[90%] rounded-full bg-black/60 blur-[1.4cqw]" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function TermLine({ p, at, text }: { p: MotionValue<number>; at: number; text: string }) {
  const opacity = useTransform(p, [at, at + 0.06], [0.12, 1])
  const color = text.startsWith('✓') ? 'text-[#8ef0c4]' : text.startsWith('▲') ? 'text-[#5cd3ff]' : 'text-[#dfe9ff]'
  return (
    <motion.p style={{ opacity }} className={`truncate ${color}`}>
      {text}
    </motion.p>
  )
}
