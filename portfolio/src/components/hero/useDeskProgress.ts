'use client'
import { type RefObject } from 'react'
import { useMotionValue, useReducedMotion, useScroll, useSpring, type MotionValue } from 'motion/react'
import { useMediaQuery } from '@/lib/hooks'

/** Where the scene rests when it is not driven by the scroll (laptop open, screens part-way). */
const RESTING = 0.72

/**
 * Progress (0 → 1) that drives the desk scene.
 * - Large screens: the page scroll through the (sticky) hero, smoothed by a spring.
 * - Phones/tablets and reduced motion: the resting state, with no JavaScript animation.
 *   Scroll-linked updates cost main-thread time on slower CPUs, so on small screens only
 *   the icon rows move, through a CSS scroll-driven animation (see globals.css).
 */
export function useDeskProgress(section: RefObject<HTMLElement | null>): MotionValue<number> {
  const reduce = useReducedMotion()
  const large = useMediaQuery('(min-width: 1024px)')
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  const resting = useMotionValue(RESTING)
  return large && !reduce ? smooth : resting
}
