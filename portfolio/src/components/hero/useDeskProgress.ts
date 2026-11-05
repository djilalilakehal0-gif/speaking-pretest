'use client'
import { useEffect, type RefObject } from 'react'
import { animate, useMotionValue, useReducedMotion, useScroll, useSpring, type MotionValue } from 'motion/react'
import { useMediaQuery } from '@/lib/hooks'

/** Where the scene rests when it is not driven by the scroll (laptop open, screens part-way). */
const RESTING = 0.72

/**
 * Progress (0 → 1) that drives the desk scene.
 * - Large screens: the page scroll through the (sticky) hero, smoothed by a spring.
 * - Phones/tablets: one short opening move after load, then still. The scroll-linked
 *   work is skipped there because it costs main-thread time on slower CPUs; the icon
 *   rows move with a CSS scroll-driven animation instead (see globals.css).
 * - Reduced motion: the resting state, no movement at all.
 */
export function useDeskProgress(section: RefObject<HTMLElement | null>): MotionValue<number> {
  const reduce = useReducedMotion()
  const large = useMediaQuery('(min-width: 1024px)')
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  const still = useMotionValue(0)

  useEffect(() => {
    if (reduce) {
      still.set(RESTING)
      return
    }
    if (large) return
    const opening = animate(still, RESTING, { duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] })
    return () => opening.stop()
  }, [large, reduce, still])

  return large && !reduce ? smooth : still
}
