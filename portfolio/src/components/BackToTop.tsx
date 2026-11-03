'use client'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
        document.querySelector<HTMLElement>('#top a, #top button')?.focus({ preventScroll: true })
      }}
      aria-label="Back to top"
      className="group relative grid size-11 place-items-center overflow-hidden rounded-full border border-line-strong bg-white/[0.04] text-ink transition-colors hover:bg-white hover:text-bg"
    >
      <ArrowUp className="size-4 transition-transform duration-500 group-hover:-translate-y-[150%]" aria-hidden />
      <ArrowUp className="absolute size-4 translate-y-[150%] transition-transform duration-500 group-hover:translate-y-0" aria-hidden />
    </button>
  )
}
