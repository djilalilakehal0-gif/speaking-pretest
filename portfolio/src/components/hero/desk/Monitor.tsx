'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { SCREENS } from './content'
import { ScrollingScreen } from './ScrollingScreen'
import { TIMELINE } from './timeline'

export function Monitor({ p }: { p: MotionValue<number> }) {
  const { at, deg, x } = TIMELINE.monitorTurn
  const rotateY = useTransform(p, [...at], [...deg])
  const shift = useTransform(p, [...at], [...x])
  return (
    <motion.div style={{ rotateY, x: shift, z: 30 }} className="absolute left-[-3%] top-[24%] w-[56%] origin-left">
      <div className="rounded-[1.8cqw] border border-white/10 bg-[#0a0d16] p-[1.1cqw] shadow-[0_40px_90px_-30px_#000,0_0_50px_-20px_#4f7cff]">
        <ScrollingScreen p={p} {...TIMELINE.monitorScroll} image={SCREENS.monitor} aspect="16 / 10" radius="0.8cqw" />
      </div>
      {/* stand */}
      <div className="mx-auto h-[5cqw] w-[9%] bg-gradient-to-b from-[#1a2133] to-[#0d1220]" />
      <div className="mx-auto h-[1.2cqw] w-[38%] rounded-full bg-[#141a2a] shadow-[0_8px_20px_#000]" />
    </motion.div>
  )
}
