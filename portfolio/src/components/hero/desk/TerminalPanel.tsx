'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { TERMINAL, TERMINAL_TONE } from './content'
import { TIMELINE } from './timeline'
import { WindowDots } from './WindowDots'

export function TerminalPanel({ p }: { p: MotionValue<number> }) {
  const { at, y } = TIMELINE.terminalDrop
  const drop = useTransform(p, [...at], [...y])
  const { first, step, fade } = TIMELINE.terminalLines
  return (
    <motion.div style={{ y: drop, z: 60 }} className="absolute right-[-2%] top-[6%] w-[36%]">
      <div className="glass overflow-hidden rounded-[1.8cqw]">
        <div className="flex items-center gap-[1cqw] border-b border-line px-[2cqw] py-[1.4cqw]">
          <WindowDots dim />
        </div>
        <div translate="no" className="space-y-[1cqw] px-[2.4cqw] py-[2cqw] font-mono text-[2.1cqw] leading-tight">
          {TERMINAL.map((line, i) => (
            <TerminalLine key={line.text} p={p} at={first + i * step} fade={fade} text={line.text} className={TERMINAL_TONE[line.tone]} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function TerminalLine({ p, at, fade, text, className }: { p: MotionValue<number>; at: number; fade: number; text: string; className: string }) {
  const opacity = useTransform(p, [at, at + fade], [0.12, 1])
  return (
    <motion.p style={{ opacity }} className={`truncate ${className}`}>
      {text}
    </motion.p>
  )
}
