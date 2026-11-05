'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { stack, type TechItem } from '@/content/site'
import { BrandIcon, brandColor } from '../ui/BrandIcon'
import { TIMELINE } from './desk/timeline'

const TECH = stack.flatMap((c) => c.items)
const ROWS: TechItem[][] = [TECH.slice(0, 10), [...TECH.slice(10), ...TECH.slice(0, 2)]]

/** Two rows of tech badges that slide in opposite directions as the page scrolls. */
export function TechRows({ p }: { p: MotionValue<number> }) {
  return (
    <div aria-hidden dir="ltr" className="mt-10 space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] lg:mt-6">
      {ROWS.map((items, i) => (
        <Row key={i} items={items} p={p} reverse={i % 2 === 1} />
      ))}
    </div>
  )
}

function Row({ items, p, reverse }: { items: TechItem[]; p: MotionValue<number>; reverse: boolean }) {
  const shift = `-${TIMELINE.iconRows.shift}`
  const x = useTransform(p, [...TIMELINE.iconRows.at], reverse ? [shift, '0%'] : ['0%', shift])
  // Repeated three times so the row never shows an empty edge while it slides.
  const badges = [...items, ...items, ...items]
  return (
    <motion.ul style={{ x }} data-reverse={reverse || undefined} className="tech-row flex w-max gap-3">
      {badges.map((it, i) => (
        <li
          key={i}
          translate="no"
          className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-soft"
        >
          <span style={{ color: brandColor(it.icon) }}>
            <BrandIcon icon={it.icon} className="size-5" />
          </span>
          {it.name}
        </li>
      ))}
    </motion.ul>
  )
}
