/**
 * Section entrances: every [data-reveal] element rises in once as it enters the viewport,
 * staggered by its order inside its section (--i). Content is visible without script
 * (the hiding only applies under html.js) and under reduced motion.
 */
export function startReveal() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  document.documentElement.classList.add('js')
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('is-in')
      io.unobserve(e.target)
    }),
    { rootMargin: '0px 0px -8% 0px' },
  )
  const scan = () => {
    document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rv])').forEach((el) => {
      el.setAttribute('data-rv', '')
      const scope = el.closest('section, footer') ?? document.body
      const index = [...scope.querySelectorAll('[data-reveal]')].indexOf(el)
      el.style.setProperty('--i', String(Math.min(index, 6)))
      io.observe(el)
    })
  }
  scan()
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
}
