import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import type { ReactNode, MouseEvent } from 'react'

type Props = {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  strength?: number
  ariaLabel?: string
}

/** CTA that leans toward the pointer (fine pointers only; disabled for reduced motion). */
export function MagneticButton({ children, className = '', href, onClick, strength = 0.28, ariaLabel }: Props) {
  const reduced = useReducedMotion()
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })

  const move = (e: MouseEvent<HTMLElement>) => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => { x.set(0); y.set(0) }
  const style = { x: sx, y: sy }

  if (href)
    return (
      <motion.a href={href} onClick={onClick} onMouseMove={move} onMouseLeave={leave} style={style} whileTap={{ scale: 0.96 }} className={className} aria-label={ariaLabel}>
        {children}
      </motion.a>
    )
  return (
    <motion.button type="button" onClick={onClick} onMouseMove={move} onMouseLeave={leave} style={style} whileTap={{ scale: 0.96 }} className={className} aria-label={ariaLabel}>
      {children}
    </motion.button>
  )
}
