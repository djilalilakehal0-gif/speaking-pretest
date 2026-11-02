import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import type { ReactNode, PointerEvent } from 'react'

/** Subtle 3D tilt with a moving light sheen. Fine pointers only; static for touch and reduced motion. */
export function TiltCard({ children, className = '', max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0.5), py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 150, damping: 18 })
  const sheen = useTransform([px, py] as const, ([x, y]: number[]) =>
    `radial-gradient(600px circle at ${x * 100}% ${y * 100}%, rgba(255,243,223,.16), transparent 40%)`)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
    glow.set(1)
  }
  const glow = useSpring(0, { stiffness: 120, damping: 20 })
  const reset = () => { px.set(0.5); py.set(0.5); glow.set(0) }

  return (
    <div style={{ perspective: 1100 }} className={className}>
      <motion.div onPointerMove={onMove} onPointerLeave={reset} style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative h-full">
        {children}
        {!reduced && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem]" style={{ background: sheen, opacity: glow }} />}
      </motion.div>
    </div>
  )
}
