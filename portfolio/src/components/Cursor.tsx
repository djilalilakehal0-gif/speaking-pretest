'use client'
import { useEffect, useRef } from 'react'
import { useFinePointer } from '@/lib/hooks'

/**
 * Desktop-only custom cursor: a precise dot plus a softly trailing ring.
 * - grows over links/buttons, shows "View" over elements with data-cursor="view"
 * - transforms only (GPU), and the rAF loop sleeps once the ring has caught up
 */
export function Cursor({ label = 'View' }: { label?: string }) {
  const enabled = useFinePointer()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    root.classList.add('has-custom-cursor')
    const d = dot.current!
    const r = ring.current!
    let tx = -100, ty = -100, rx = -100, ry = -100
    let raf = 0
    let visible = false

    const loop = () => {
      rx += (tx - rx) * 0.2
      ry += (ty - ry) * 0.2
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.1 ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = e.clientX
      ty = e.clientY
      d.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
      if (!visible) {
        visible = true
        rx = tx
        ry = ty
        root.dataset.cursor = root.dataset.cursor || 'default'
        d.style.opacity = r.style.opacity = '1'
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element
      const view = t.closest('[data-cursor="view"]')
      const field = t.closest('input, textarea, select')
      const link = t.closest('a, button, [role="button"], label, summary')
      const state = field ? 'text' : view ? 'view' : link ? 'link' : 'default'
      r.dataset.state = d.dataset.state = state
    }
    const onLeave = () => {
      visible = false
      d.style.opacity = r.style.opacity = '0'
    }
    const onDown = () => r.classList.add('is-down')
    const onUp = () => r.classList.remove('is-down')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={ring} aria-hidden className="cursor-ring pointer-events-none fixed left-0 top-0 z-[100] opacity-0" data-state="default">
        <span className="cursor-ring__shape">
          <span className="cursor-ring__label">{label}</span>
        </span>
      </div>
      <div ref={dot} aria-hidden className="cursor-dot pointer-events-none fixed left-0 top-0 z-[101] opacity-0" data-state="default" />
      <style>{`
        .cursor-dot{width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:99px;background:#fff;mix-blend-mode:difference;transition:opacity .3s, width .3s, height .3s, margin .3s}
        .cursor-dot[data-state=view]{opacity:0!important}
        .cursor-dot[data-state=text]{width:2px;height:20px;margin:-10px 0 0 -1px}
        .cursor-ring{transition:opacity .3s}
        .cursor-ring__shape{position:absolute;left:0;top:0;display:grid;place-items:center;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:99px;border:1px solid rgb(255 255 255 / .35);transition:transform .45s cubic-bezier(.16,1,.3,1),background-color .3s,border-color .3s,opacity .3s;will-change:transform}
        .cursor-ring__label{font:500 11px/1 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:#050816;opacity:0;transform:scale(.6);transition:opacity .3s,transform .4s cubic-bezier(.16,1,.3,1)}
        .cursor-ring[data-state=link] .cursor-ring__shape{transform:scale(1.55);border-color:rgb(122 162 255 / .7);background:rgb(79 124 255 / .08)}
        .cursor-ring[data-state=view] .cursor-ring__shape{transform:scale(2.4);background:#fff;border-color:transparent}
        .cursor-ring[data-state=view] .cursor-ring__label{opacity:1;transform:scale(.42)}
        .cursor-ring[data-state=text] .cursor-ring__shape{opacity:0}
        .cursor-ring.is-down .cursor-ring__shape{transform:scale(.8)}
      `}</style>
    </>
  )
}
