'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { CODE, CODE_FILE, TOKEN_CLASS } from './content'
import { TIMELINE } from './timeline'
import { WindowDots } from './WindowDots'

export function Laptop({ p }: { p: MotionValue<number> }) {
  const lid = useTransform(p, [...TIMELINE.laptopLid.at], [...TIMELINE.laptopLid.deg])
  const caret = useTransform(p, [...TIMELINE.codeCaret.at], [...TIMELINE.codeCaret.y])
  return (
    <motion.div style={{ z: 150 }} className="absolute bottom-[1%] left-[21%] w-[56%] [transform-style:preserve-3d]">
      {/* lid: opens as the page scrolls */}
      <motion.div
        style={{ rotateX: lid }}
        className="origin-bottom rounded-t-[1.6cqw] border border-white/10 bg-[#0a0d16] p-[1cqw] pb-[1.4cqw] shadow-[0_-10px_60px_-25px_#4f7cff]"
      >
        <div translate="no" className="relative aspect-[16/10] overflow-hidden rounded-[0.6cqw] bg-[#0a1426] font-mono text-[1.85cqw] leading-[1.75]">
          <div className="flex items-center gap-[1cqw] bg-[#10213d] px-[1.6cqw] py-[0.9cqw] text-[1.6cqw] text-[#8ba3c7]">
            <WindowDots size="1.1cqw" />
            <span className="ms-[1cqw]">{CODE_FILE}</span>
          </div>
          <div className="relative px-[2cqw] py-[1.2cqw]">
            <motion.div style={{ y: caret }} className="absolute inset-x-0 top-[1.2cqw] h-[3.24cqw] bg-[#2f8cff]/15" />
            {CODE.map((line, i) => (
              <div key={i} className="relative whitespace-pre">
                <span className="me-[1.6cqw] text-[#4b5f80]">{i + 1}</span>
                {line.map(([token, text], j) => (
                  <span key={j} className={TOKEN_CLASS[token]}>
                    {text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      {/* base */}
      <div className="relative h-[3.4cqw] bg-gradient-to-b from-[#3a4257] via-[#232a3c] to-[#141a28] [clip-path:polygon(3%_0,97%_0,100%_100%,0_100%)]">
        <div className="absolute left-1/2 top-0 h-[1cqw] w-[16%] -translate-x-1/2 rounded-b-[1cqw] bg-[#141a28]" />
      </div>
      <div className="mx-auto h-[2cqw] w-[90%] rounded-full bg-black/60 blur-[1.4cqw]" />
    </motion.div>
  )
}
