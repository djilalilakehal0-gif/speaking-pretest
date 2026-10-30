import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { products, navLinks, brand } from './data/products'

gsap.registerPlugin(useGSAP)

// Read once. Every GSAP duration is multiplied by this (0 when reduced motion is requested).
const MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1

// Column layout: the details stack over the image, so fit the image into the space above them.
// The first panel also reserves room for the floating nav.
function fitImage(panel, isFirst) {
  const img = panel.querySelector('[data-image]')
  const details = panel.querySelector('[data-details]')
  const padB = parseFloat(getComputedStyle(img.parentElement).paddingBottom) || 0
  // The panel is still mid-expansion here, so measure the size it will settle at (flex-grow 2.6 of 2.6 + 0.7 + 0.7)
  const height = panel.parentElement.clientHeight * (2.6 / 4)
  // Same for the image: its max-height tracks the settled panel, so derive its settled size
  const imgH = Math.min(
    window.innerHeight * 0.46,
    height - padB,
    panel.clientWidth * 0.86 * (img.naturalHeight / img.naturalWidth || 0.75),
  )
  const top = isFirst ? 76 : 12
  const bottom = height - details.offsetHeight - 24 - 12
  const avail = bottom - top
  const scale = Math.min(1.06, Math.max(avail, 0) / imgH)
  const y = (top + bottom) / 2 - (height - padB) / 2
  // Too little room left (tiny screens, first panel under the nav): hide it rather than overlap the text
  return { scale, y, hide: avail < 56 }
}

// Touch devices drive the panels with taps; their synthetic mouse events would fight the layout animation
const canHover = () => window.matchMedia('(hover: hover)').matches

export default function App() {
  const [active, setActive] = useState(null)
  const root = useRef(null)

  // Entrance — once on load
  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from(q('[data-panel]'), { yPercent: 6, autoAlpha: 0, duration: 0.9 * MOTION, stagger: 0.12 * MOTION })
        .from(q('[data-image-wrap]'), { y: 70, autoAlpha: 0, duration: 1.1 * MOTION, stagger: 0.12 * MOTION }, '-=0.5')
        .from(q('[data-label-wrap]'), { y: 20, autoAlpha: 0, duration: 0.8 * MOTION, stagger: 0.1 * MOTION }, '-=0.7')
        .from(q('[data-header]'), { y: -16, autoAlpha: 0, duration: 0.7 * MOTION }, '-=0.8')
    },
    { scope: root },
  )

  // Hover state machine
  useGSAP(
    () => {
      const idle = active === null
      const isDesktop = window.matchMedia('(min-width: 48rem)').matches
      gsap.utils.toArray('[data-panel]').forEach((panel, i) => {
        const isActive = active === i
        const q = (s) => panel.querySelector(s)
        const to = (target, vars) => gsap.to(target, { overwrite: 'auto', ...vars, duration: vars.duration * MOTION })

        to(panel, { flexGrow: isActive ? 2.6 : idle ? 1 : 0.7, duration: 1.05, ease: 'power4.out' })

        const fit = isActive && !isDesktop ? fitImage(panel, i === 0) : null
        to(q('[data-image]'), {
          scale: isActive ? (fit ? fit.scale : 1.06) : idle ? 1 : 0.92,
          y: isActive ? (fit ? fit.y : -14) : 0,
          autoAlpha: fit?.hide ? 0 : 1,
          duration: 1.05,
          ease: 'power4.out',
        })

        if (isActive) {
          to(q('[data-watermark]'), { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' })
        } else {
          to(q('[data-watermark]'), { autoAlpha: 0, scale: 1.04, duration: 0.35 })
        }

        to(q('[data-glow]'), {
          opacity: isActive ? 1 : idle ? 0.6 : 0.25,
          scale: isActive ? 1.25 : 1,
          duration: 0.9,
          ease: 'power2.out',
        })

        if (isActive) {
          to(q('[data-label]'), { autoAlpha: 0, y: -12, duration: 0.3 })
        } else {
          to(q('[data-label]'), { autoAlpha: idle ? 1 : 0.4, y: 0, duration: 0.55 })
        }

        const items = q('[data-details]').children
        // A not-yet-started delayed reveal from a previous panel switch survives overwrite: 'auto', so cancel it
        gsap.killTweensOf(items)
        if (isActive) {
          gsap.fromTo(
            items,
            { y: 26, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.75 * MOTION,
              stagger: 0.055 * MOTION,
              delay: 0.18 * MOTION,
              ease: 'power3.out',
              overwrite: 'auto',
            },
          )
        } else {
          to(items, { autoAlpha: 0, y: 14, duration: 0.25, ease: 'power2.in' })
        }
      })
    },
    { scope: root, dependencies: [active] },
  )

  return (
    <div ref={root} className="relative h-full w-full overflow-hidden bg-[#0e0d0b] font-body">
      {/* Floating liquid-glass nav */}
      <header
        data-header
        className="pointer-events-none absolute inset-x-0 top-5 z-40 flex justify-center px-4 md:top-7"
      >
        <nav className="glass-nav pointer-events-auto flex items-center gap-2 py-2 pr-2 pl-5 text-white md:gap-4 md:pl-6">
          <a href="#" className="relative text-[18px] leading-none font-bold tracking-tight">
            {brand.logo}
            <sup className="ml-0.5 text-[9px] font-medium align-super">®</sup>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <a
                key={l}
                href="#"
                className="glass-link relative px-3.5 py-2 font-mono text-[11px] tracking-[0.18em] text-white/75 uppercase"
              >
                {l}
              </a>
            ))}
          </div>
          <button
            type="button"
            className="relative cursor-pointer rounded-full bg-white/90 px-4 py-2 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap text-[#16120b] uppercase transition-colors duration-300 hover:bg-white"
          >
            Cart (0)
          </button>
        </nav>
      </header>

      {/* Panels */}
      <main className="flex h-full w-full flex-col md:flex-row" onMouseLeave={() => canHover() && setActive(null)}>
        {products.map((p, i) => {
          const t = p.theme
          const isActive = active === i
          return (
            <section
              key={p.id}
              data-panel
              tabIndex={0}
              aria-label={p.name}
              onMouseEnter={() => canHover() && setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className="relative min-h-0 min-w-0 cursor-pointer overflow-hidden outline-none"
              style={{ flex: '1 1 0%', willChange: 'flex-grow', background: t.bg, color: t.text }}
            >
              {/* Watermark */}
              <div
                data-watermark
                aria-hidden="true"
                className="invisible absolute inset-0 z-0 flex flex-col items-center justify-center overflow-hidden opacity-0 select-none"
                style={{
                  color: t.watermark,
                  fontSize: 'clamp(4rem, 13vw, 13rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.82,
                  textTransform: 'uppercase',
                }}
              >
                <span>{brand.watermark}</span>
                <span>{brand.watermark}</span>
                <span>{brand.watermark}</span>
              </div>

              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <div
                  data-glow
                  className="h-[60vmin] w-[60vmin] rounded-full"
                  style={{ background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, filter: 'blur(64px)' }}
                />
              </div>

              {/* Product image */}
              <div
                data-image-wrap
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pb-[10vh] md:pb-[8vh]"
              >
                <img
                  data-image
                  src={p.image}
                  alt={`${p.name} — ${p.finish}`}
                  draggable="false"
                  className="max-h-[min(46vh,100%)] max-w-[86%] object-contain md:max-h-[56vh]"
                  style={{ filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.35))' }}
                />
              </div>

              {/* Idle label */}
              <div data-label-wrap className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 md:p-7">
                <div data-label className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] tracking-[0.2em]" style={{ color: t.muted }}>
                      {p.index}
                    </div>
                    <div className="truncate text-[18px] leading-tight font-semibold tracking-tight">{p.name}</div>
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.15em] whitespace-nowrap" style={{ color: t.muted }}>
                    {p.price}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-6 pb-6 md:pb-12">
                <div data-details className="flex flex-col items-center text-center">
                  <p
                    className="invisible font-mono text-[11px] tracking-[0.28em] uppercase opacity-0"
                    style={{ color: t.accent }}
                  >
                    {p.finish} · {brand.tagline}
                  </p>
                  <h2 className="invisible mt-2 text-[36px] leading-none font-bold tracking-tight opacity-0 md:text-[48px]">
                    {p.price}
                  </h2>
                  <p
                    className="invisible mt-3 max-w-sm text-[13px] leading-relaxed opacity-0"
                    style={{ color: t.muted }}
                  >
                    {p.description}
                  </p>
                  <p
                    className="invisible mt-3 font-mono text-[10px] tracking-[0.2em] uppercase opacity-0"
                    style={{ color: t.muted }}
                  >
                    {p.specs.join(' / ')}
                  </p>
                  <div className="invisible mt-5 opacity-0">
                    <button
                      type="button"
                      tabIndex={isActive ? 0 : -1}
                      className="buy-btn cursor-pointer rounded-full px-8 py-3 text-[13px] font-semibold"
                      style={{
                        background: t.buttonBg,
                        color: t.buttonText,
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
