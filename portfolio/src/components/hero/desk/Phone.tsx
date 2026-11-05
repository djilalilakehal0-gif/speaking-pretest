'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { SCREENS } from './content'
import { ScrollingScreen } from './ScrollingScreen'
import { TIMELINE } from './timeline'

export function Phone({ p }: { p: MotionValue<number> }) {
  const { at, y } = TIMELINE.phoneRise
  const rise = useTransform(p, [...at], [...y])
  return (
    <motion.div style={{ y: rise, z: 90 }} className="absolute bottom-[14%] right-[1%] w-[17%]">
      <div className="rounded-[3cqw] border-[0.9cqw] border-[#0b0f19] bg-[#0b0f19] shadow-[0_30px_60px_-20px_#000,0_0_0_1px_rgb(255_255_255/0.12)]">
        <ScrollingScreen p={p} {...TIMELINE.phoneScroll} image={SCREENS.phone} aspect="9 / 19.5" radius="2.2cqw" />
      </div>
    </motion.div>
  )
}
