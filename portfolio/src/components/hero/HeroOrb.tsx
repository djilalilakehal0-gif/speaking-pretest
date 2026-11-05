'use client'
import { useEffect, useRef } from 'react'

/**
 * Lightweight 3D "digital sphere": a Fibonacci point cloud + orbit rings projected onto a 2D canvas.
 * No WebGL / three.js needed (~2 KB). The loop pauses when off-screen or when the tab is hidden,
 * uses fewer points on small/low-power devices and renders a single still frame for reduced motion.
 */
export default function HeroOrb({ className = '' }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvas.current!
    const ctx = cv.getContext('2d', { alpha: true })!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 768px)').matches
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4
    const N = small || lowPower ? 340 : 720
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2)

    // Fibonacci sphere
    const pts = new Float32Array(N * 3)
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const t = golden * i
      pts[i * 3] = Math.cos(t) * r
      pts[i * 3 + 1] = y
      pts[i * 3 + 2] = Math.sin(t) * r
    }
    // three tilted orbit rings
    const RING = 120
    const rings = [
      { tilt: 1.15, spin: 0.35, rad: 1.32, color: [122, 162, 255] },
      { tilt: -0.55, spin: -0.22, rad: 1.5, color: [167, 139, 250] },
      { tilt: 0.2, spin: 0.15, rad: 1.7, color: [34, 211, 238] },
    ]

    let w = 0, h = 0, R = 0
    const resize = () => {
      const rect = cv.getBoundingClientRect()
      w = rect.width
      h = rect.height
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      R = Math.min(w, h) * 0.3
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)

    // pointer tilt (eased)
    let px = 0, py = 0, tx = 0, ty = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = (e.clientX / window.innerWidth - 0.5) * 0.6
      ty = (e.clientY / window.innerHeight - 0.5) * 0.4
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const FOV = 3.2
    const draw = (time: number) => {
      const t = time * 0.00012
      px += (tx - px) * 0.05
      py += (ty - py) * 0.05
      const ay = t * 2.2 + px
      const ax = 0.35 + py
      const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax)
      const ox = w / 2, oy = h / 2

      ctx.clearRect(0, 0, w, h)

      // core glow
      const g = ctx.createRadialGradient(ox, oy, R * 0.1, ox, oy, R * 1.45)
      g.addColorStop(0, 'rgba(79,124,255,0.28)')
      g.addColorStop(0.5, 'rgba(139,92,246,0.10)')
      g.addColorStop(1, 'rgba(4,6,13,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // rings (back halves fainter)
      for (const ring of rings) {
        const ct = Math.cos(ring.tilt), st = Math.sin(ring.tilt)
        const rs = t * 10 * ring.spin
        ctx.beginPath()
        for (let i = 0; i <= RING; i++) {
          const a = (i / RING) * Math.PI * 2
          let x = Math.cos(a) * ring.rad, y = 0, z = Math.sin(a) * ring.rad
          // tilt around X
          const y1 = y * ct - z * st, z1 = y * st + z * ct
          y = y1; z = z1
          // global rotation
          const x2 = x * cy + z * sy, z2 = -x * sy + z * cy
          const y3 = y * cx - z2 * sx, z3 = y * sx + z2 * cx
          const s = FOV / (FOV + z3)
          const X = ox + x2 * R * s, Y = oy + y3 * R * s
          i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y)
        }
        ctx.strokeStyle = `rgba(${ring.color.join(',')},0.16)`
        ctx.lineWidth = 1
        ctx.stroke()
        // travelling node on each ring
        const a = rs
        let x = Math.cos(a) * ring.rad, y = 0, z = Math.sin(a) * ring.rad
        const y1 = y * ct - z * st, z1 = y * st + z * ct
        y = y1; z = z1
        const x2 = x * cy + z * sy, z2 = -x * sy + z * cy
        const y3 = y * cx - z2 * sx, z3 = y * sx + z2 * cx
        const s = FOV / (FOV + z3)
        ctx.beginPath()
        ctx.arc(ox + x2 * R * s, oy + y3 * R * s, 2.6 * s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${ring.color.join(',')},${z3 < 0 ? 0.95 : 0.35})`
        ctx.shadowColor = `rgb(${ring.color.join(',')})`
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // sphere points
      for (let i = 0; i < N; i++) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2]
        const x2 = x * cy + z * sy, z2 = -x * sy + z * cy
        const y3 = y * cx - z2 * sx, z3 = y * sx + z2 * cx
        const s = FOV / (FOV + z3)
        const depth = (1 - z3) / 2 // 0 back … 1 front
        const alpha = 0.18 + depth * 0.82
        // colour drifts blue → violet → cyan across the sphere
        const m = (y + 1) / 2
        const r = Math.round(90 + m * 70 - depth * 30)
        const gr = Math.round(130 + (1 - m) * 70)
        const b = 255
        ctx.fillStyle = `rgba(${r},${gr},${b},${alpha})`
        const size = (0.8 + depth * 1.6) * s
        ctx.fillRect(ox + x2 * R * s - size / 2, oy + y3 * R * s - size / 2, size, size)
      }
    }

    let raf = 0
    let inView = true
    const loop = (time: number) => {
      draw(time)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf && inView && !document.hidden && !reduce) raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      inView ? start() : stop()
    })
    io.observe(cv)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)

    if (reduce) draw(4000)
    else start()

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={canvas} className={`block size-full ${className}`} aria-hidden />
}
