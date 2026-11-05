/**
 * Smooth scrolling (Lenis) driven by GSAP's ticker, so ScrollTrigger and Lenis share one frame loop.
 * Off for reduced motion and inside the Android app (native scrolling feels better there).
 * Every overlay locks scrolling through `lockScroll`, which counts nested locks.
 */
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let locks = 0

export function initSmoothScroll() {
  if (lenis || typeof window === 'undefined') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const native = document.documentElement.classList.contains('native-app')
  if (reduced || native) return
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -80 }, autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  if (locks > 0) lenis.stop()
}

export function lockScroll(lock: boolean) {
  locks = Math.max(0, locks + (lock ? 1 : -1))
  const on = locks > 0
  document.body.style.overflow = on ? 'hidden' : ''
  if (on) lenis?.stop()
  else lenis?.start()
}

/** Scrolls to an element id ("menu", "cat-burgers"…), smoothly unless motion is reduced. */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -80 })
  else el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0)
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}
