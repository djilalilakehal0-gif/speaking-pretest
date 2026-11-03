'use client'
import { useEffect, useRef, useState } from 'react'

type Line = { text: string; kind: 'cmd' | 'ok' | 'info' | 'out' }
const SCRIPT: Line[] = [
  { kind: 'cmd', text: 'npx create-experience djilali' },
  { kind: 'ok', text: 'design tokens loaded' },
  { kind: 'ok', text: 'motion engine · 60fps target' },
  { kind: 'ok', text: 'a11y + SEO checks passed' },
  { kind: 'cmd', text: 'npm run ship' },
  { kind: 'info', text: 'building optimized static export…' },
  { kind: 'out', text: '▲ ready — let’s build something great' },
]

/** A looping "live" terminal. Typing only runs while it is on screen and the tab is visible. */
export function Terminal({ className = '' }: { className?: string }) {
  const [lines, setLines] = useState<Line[]>([])
  const [typing, setTyping] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLines(SCRIPT)
      return
    }
    let timer = 0
    let li = 0, ci = 0
    let running = false
    let visible = true
    let done: Line[] = []

    const step = () => {
      if (!running) return
      if (li >= SCRIPT.length) {
        timer = window.setTimeout(() => {
          li = ci = 0
          done = []
          setLines([])
          setTyping('')
          step()
        }, 3200)
        return
      }
      const line = SCRIPT[li]
      if (line.kind === 'cmd' && ci < line.text.length) {
        ci++
        setTyping(line.text.slice(0, ci))
        timer = window.setTimeout(step, 38 + Math.random() * 45)
        return
      }
      done = [...done, line]
      setLines(done)
      setTyping('')
      li++
      ci = 0
      timer = window.setTimeout(step, line.kind === 'cmd' ? 380 : 260)
    }
    const set = (on: boolean) => {
      if (on && !running) {
        running = true
        step()
      } else if (!on && running) {
        running = false
        clearTimeout(timer)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      set(visible && !document.hidden)
    })
    io.observe(box.current!)
    const onVis = () => set(visible && !document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      running = false
      clearTimeout(timer)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const current = SCRIPT[lines.length]
  return (
    <div ref={box} className={`glass overflow-hidden rounded-2xl ${className}`} aria-hidden>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
        <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
        <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        <span className="ml-3 font-mono text-[11px] text-dim">~/djilali — zsh</span>
      </div>
      <div className="h-[184px] space-y-1.5 px-4 py-3.5 font-mono text-[12px] leading-relaxed">
        {lines.map((l, i) => (
          <TermLine key={i} line={l} />
        ))}
        {current?.kind === 'cmd' && (
          <p className="text-soft">
            <span className="text-cyan">❯</span> {typing}
            <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-blink bg-blue" />
          </p>
        )}
      </div>
    </div>
  )
}

function TermLine({ line }: { line: Line }) {
  if (line.kind === 'cmd')
    return (
      <p className="text-soft">
        <span className="text-cyan">❯</span> {line.text}
      </p>
    )
  if (line.kind === 'ok')
    return (
      <p className="text-muted">
        <span className="text-[#4ade80]">✓</span> {line.text}
      </p>
    )
  if (line.kind === 'info') return <p className="text-dim">{line.text}</p>
  return <p className="text-gradient animate-gradient font-medium">{line.text}</p>
}
