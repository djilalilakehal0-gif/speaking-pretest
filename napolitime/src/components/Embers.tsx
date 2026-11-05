import { useEffect, useRef } from 'react'

/**
 * Floating champagne-gold dust on a canvas.
 * Pauses when off-screen or the tab is hidden; disabled for reduced motion; fewer particles on small screens.
 */
export function Embers({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0, raf = 0, running = true
    const count = window.innerWidth < 640 ? 26 : 60
    type P = { x: number; y: number; r: number; vy: number; vx: number; life: number; hue: number; tw: number }
    const make = (initial = false): P => ({
      x: Math.random() * w, y: initial ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + 0.4, vy: -(Math.random() * 0.5 + 0.18), vx: (Math.random() - 0.5) * 0.25,
      life: Math.random(), hue: Math.random() < 0.8 ? 40 : 28, tw: Math.random() * Math.PI * 2,
    })
    let ps: P[] = []
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ps = Array.from({ length: count }, () => make(true))
    }
    resize()
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of ps) {
        p.tw += 0.03; p.x += p.vx + Math.sin(p.tw) * 0.15; p.y += p.vy
        if (p.y < -10) Object.assign(p, make())
        const a = Math.max(0, Math.min(1, p.y / h)) * (0.55 + Math.sin(p.tw * 2) * 0.25)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        g.addColorStop(0, `hsla(${p.hue}, 55%, 70%, ${a * 0.8})`)
        g.addColorStop(1, `hsla(${p.hue}, 55%, 60%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill()
      }
      if (running) raf = requestAnimationFrame(tick)
    }
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()))
    io.observe(canvas)
    const vis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(tick)
    return () => { stop(); io.disconnect(); document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden />
}
