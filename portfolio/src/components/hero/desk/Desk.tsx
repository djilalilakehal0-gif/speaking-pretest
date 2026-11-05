'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { Laptop } from './Laptop'
import { Monitor } from './Monitor'
import { Phone } from './Phone'
import { Portrait } from './Portrait'
import { TerminalPanel } from './TerminalPanel'
import { TIMELINE } from './timeline'

/**
 * The developer's desk: decorative CSS 3D scene sized with container query units (cqw),
 * so it scales with its column without JavaScript measuring. Hidden from assistive tech
 * and kept left-to-right in every language (it shows code and an English website).
 */
export function Desk({ p, role, online }: { p: MotionValue<number>; role: string; online: string }) {
  const tilt = useTransform(p, [...TIMELINE.sceneTilt.at], [...TIMELINE.sceneTilt.deg])
  return (
    <div aria-hidden dir="ltr" className="relative mx-auto w-full max-w-[760px] [container-type:inline-size] [perspective:1600px] lg:-me-[3%]">
      <motion.div style={{ rotateY: tilt, rotateX: 4 }} className="desk-in relative aspect-[1/0.98] w-full [transform-style:preserve-3d]">
        {/* back to front */}
        <Portrait p={p} role={role} online={online} />
        <Monitor p={p} />
        <TerminalPanel p={p} />
        <Phone p={p} />
        <Laptop p={p} />
      </motion.div>
    </div>
  )
}
