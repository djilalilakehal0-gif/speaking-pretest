import { motion, type Variants } from 'framer-motion'
import type { ReactNode, ElementType } from 'react'

const ease = [0.16, 1, 0.3, 1] as const

/** Splits text into words that rise from a mask, staggered. Screen readers get the plain text. */
export function SplitReveal({ text, className = '', as: Tag = 'span', delay = 0, stagger = 0.06 }: {
  text: string; className?: string; as?: ElementType; delay?: number; stagger?: number
}) {
  const lines = text.split('\n')
  const container: Variants = { hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }
  const word: Variants = { hidden: { y: '110%', rotate: 4 }, shown: { y: '0%', rotate: 0, transition: { duration: 0.9, ease } } }
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')}>
      <motion.span aria-hidden initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.4 }} variants={container} className="block">
        {lines.map((line, li) => (
          <span key={li} className="block">
            {line.split(' ').map((w, wi) => (
              <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span variants={word} className="inline-block origin-bottom-left will-change-transform">
                  {w}
                </motion.span>
                {wi < line.split(' ').length - 1 && ' '}
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

/** Fade-up reveal for a block, optionally staggering direct `RevealItem` children. */
export function Reveal({ children, className = '', delay = 0, stagger = 0 }: { children: ReactNode; className?: string; delay?: number; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: stagger ? {} : { opacity: 0, y: 32 },
        shown: stagger
          ? { transition: { staggerChildren: stagger, delayChildren: delay } }
          : { opacity: 1, y: 0, transition: { duration: 0.9, ease, delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
}

export function SectionHeading({ eyebrow, title, italic, intro, align = 'left', light = false }: {
  eyebrow: string; title: string; italic?: string; intro?: string; align?: 'left' | 'center'; light?: boolean
}) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-3xl`}>
      <Reveal><p className={`eyebrow mb-4 ${light ? '!text-tomato' : ''}`}>{eyebrow}</p></Reveal>
      <h2 className={`display text-[clamp(2.6rem,7vw,5.6rem)] ${light ? 'text-ink' : 'text-cream'}`}>
        <SplitReveal text={title} />
        {italic && (
          <Reveal delay={0.25}><span className={`italian mt-1 block text-[0.62em] ${light ? 'text-tomato' : 'text-gold'}`}>{italic}</span></Reveal>
        )}
      </h2>
      {intro && (
        <Reveal delay={0.15}>
          <p className={`mt-6 text-base leading-relaxed sm:text-lg ${light ? 'text-ink/70' : 'text-cream/65'} ${align === 'center' ? 'mx-auto' : ''} max-w-xl`}>{intro}</p>
        </Reveal>
      )}
    </div>
  )
}
