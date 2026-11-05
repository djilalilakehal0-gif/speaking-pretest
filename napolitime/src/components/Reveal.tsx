import { motion, type Variants } from 'framer-motion'
import { Fragment, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const ease = [0.16, 1, 0.3, 1] as const

/** Splits text into words that rise from a mask, staggered. Screen readers get the plain text. */
export function SplitReveal({ text, className = '', as: Tag = 'span', delay = 0, stagger = 0.07 }: {
  text: string; className?: string; as?: 'span' | 'p' | 'div' | 'h2' | 'h3'; delay?: number; stagger?: number
}) {
  const lines = text.split('\n')
  const container: Variants = { hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }
  const word: Variants = { hidden: { y: '115%', rotate: 3 }, shown: { y: '0%', rotate: 0, transition: { duration: 1.1, ease } } }
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')}>
      <motion.span aria-hidden initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.4 }} variants={container} className="block">
        {lines.map((line, li) => (
          <span key={li} className="block">
            {line.split(' ').map((w, wi, all) => (
              <Fragment key={wi}>
                <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] pr-[0.04em] align-bottom">
                  <motion.span variants={word} className={`inline-block origin-bottom-left will-change-transform ${w.startsWith('_') ? 'display-i text-gold' : ''}`}>
                    {w.replace(/^_/, '')}
                  </motion.span>
                </span>
                {wi < all.length - 1 && ' '}
              </Fragment>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

/** Fade-up reveal for a block. */
export function Reveal({ children, className = '', delay = 0, y = 32 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Photo that is uncovered by a sliding mask as it enters the viewport, then drifts slowly
 * (parallax) while the page scrolls. Pure CSS fallback when motion is reduced.
 */
export function ImageReveal({ src, srcSet, sizes, alt, className = '', imgClassName = '', from = 'bottom', parallax = 12, children }: {
  src: string; srcSet?: string; sizes?: string; alt: string; className?: string; imgClassName?: string
  from?: 'bottom' | 'left' | 'right'; parallax?: number; children?: ReactNode
}) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const clip = { bottom: 'inset(100% 0% 0% 0%)', left: 'inset(0% 100% 0% 0%)', right: 'inset(0% 0% 0% 100%)' }[from]
      gsap.fromTo(root.current, { clipPath: clip }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 85%', once: true },
      })
      gsap.fromTo('[data-ir-img]', { scale: 1.25 }, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 85%', once: true } })
      if (parallax)
        gsap.fromTo('[data-ir-inner]', { yPercent: -parallax / 2 }, {
          yPercent: parallax / 2, ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        })
    })
    return () => mm.revert()
  }, { scope: root })
  return (
    <div ref={root} className={`relative overflow-hidden ${className}`}>
      <div data-ir-inner className="absolute -inset-y-[8%] inset-x-0">
        <img data-ir-img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-cover ${imgClassName}`} />
      </div>
      {children}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, intro, align = 'left', tone = 'dark', className = '' }: {
  eyebrow: string; title: string; intro?: string; align?: 'left' | 'center'; tone?: 'dark' | 'light'; className?: string
}) {
  const light = tone === 'light'
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      <Reveal y={12}>
        <p className={`eyebrow mb-5 flex items-center gap-4 ${align === 'center' ? 'justify-center' : ''} ${light ? '!text-burgundy' : ''}`}>
          <span className={`h-px w-10 ${light ? 'bg-burgundy/50' : 'bg-gold/60'}`} />{eyebrow}
          {align === 'center' && <span className={`h-px w-10 ${light ? 'bg-burgundy/50' : 'bg-gold/60'}`} />}
        </p>
      </Reveal>
      <h2 className={`display text-[clamp(2.8rem,7.5vw,6rem)] ${light ? 'text-noir' : 'text-ivory'}`}>
        <SplitReveal text={title} />
      </h2>
      {intro && (
        <Reveal delay={0.15}>
          <p className={`mt-6 max-w-xl text-base leading-relaxed sm:text-lg ${light ? 'text-noir/65' : 'text-ivory/65'} ${align === 'center' ? 'mx-auto' : ''}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  )
}

/** Small gold ornament: line · diamond · line. */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-12 bg-current opacity-60" />
      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 10 5 5 10 0 5Z" fill="currentColor" /></svg>
      <span className="h-px w-12 bg-current opacity-60" />
    </span>
  )
}
