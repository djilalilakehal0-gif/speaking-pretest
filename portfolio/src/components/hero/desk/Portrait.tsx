'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { site } from '@/content/site'
import { asset } from '@/lib/asset'
import { TIMELINE } from './timeline'

export function Portrait({ p, role, online }: { p: MotionValue<number>; role: string; online: string }) {
  const { at, scale } = TIMELINE.portraitScale
  const s = useTransform(p, [...at], [...scale])
  return (
    <motion.div style={{ scale: s, z: -140 }} className="absolute left-[33%] top-0 w-[40%]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2.2cqw] border border-line-strong shadow-[0_40px_80px_-30px_#000]">
        <img
          src={asset(site.portrait.srcSmall)}
          alt=""
          width={480}
          height={600}
          fetchPriority="high"
          className="size-full object-cover object-top"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg/80 to-transparent" />
        <div className="absolute bottom-[5%] right-[5%] flex max-w-[70%] items-center gap-[2cqw] rounded-[1.6cqw] border border-white/15 bg-bg/70 px-[2.4cqw] py-[1.6cqw] backdrop-blur-md">
          <span className="size-[1.4cqw] shrink-0 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" title={online} />
          <span className="min-w-0">
            <span className="block truncate text-[2.6cqw] font-semibold leading-tight">{site.name}</span>
            <span className="block truncate text-[2cqw] text-muted">{role}</span>
          </span>
        </div>
      </div>
    </motion.div>
  )
}
