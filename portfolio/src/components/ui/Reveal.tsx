'use client'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type Props = { delay?: number; y?: number; as?: 'div' | 'li'; className?: string; children: ReactNode }

/** Scroll-triggered fade/slide-in (IntersectionObserver under the hood, runs once). */
export function Reveal({ delay = 0, y = 28, as = 'div', className, children }: Props) {
  const reduce = useReducedMotion()
  const Comp = as === 'li' ? motion.li : motion.div
  return (
    <Comp
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: reduce ? 0.3 : 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  )
}
