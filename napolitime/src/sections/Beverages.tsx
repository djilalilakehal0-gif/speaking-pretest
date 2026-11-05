import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { productById, type Product } from '../data/menu'
import { AddButton, Price } from '../components/ProductCard'
import { ease, Reveal, SectionHeading } from '../components/Reveal'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const CansScene = lazy(() => import('../three/CansScene'))
const base = import.meta.env.BASE_URL

/** The two cans are real menu products: names, prices and options come from src/data/menu.ts. */
const drinks = [
  { id: 'coca', accent: '#E41E2B', preview: `${base}models/previews/coca-cola-preview.webp` },
  { id: 'pepsi', accent: '#1E5BD8', preview: `${base}models/previews/pepsi-preview.webp` },
] as const

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/** If the 3D scene throws (old GPU, lost context…), the rendered photos take its place. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function StillCans({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`absolute inset-0 grid grid-cols-2 items-center gap-2 px-4 transition-opacity duration-700 sm:px-[12%] ${dim ? 'opacity-40' : ''}`}>
      {drinks.map((d) => (
        <img key={d.id} src={d.preview} alt="" className="mx-auto h-[85%] w-auto max-w-full object-contain" loading="lazy" decoding="async" />
      ))}
    </div>
  )
}

/**
 * "Bevande": Coca-Cola and Pepsi as genuine 3D models (public/models/*.glb, made by scripts/generate_beverages.py).
 * The WebGL scene is fetched only when the section approaches the viewport and stops rendering when it leaves.
 */
export function Beverages({ onOpen }: { onOpen: (p: Product) => void }) {
  const root = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const reduced = !!useReducedMotion()
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [webgl, setWebgl] = useState(true)

  useEffect(() => {
    setWebgl(webglAvailable())
    const el = root.current!
    const nearObs = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '800px 0px' })
    const visObs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px 0px' })
    nearObs.observe(el)
    visObs.observe(el)
    return () => { nearObs.disconnect(); visObs.disconnect() }
  }, [])

  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: root.current, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => { progress.current = self.progress },
    })
    return () => st.kill()
  }, { scope: root })

  const items = drinks.map((d) => ({ ...d, product: productById.get(d.id) })).filter((d): d is typeof d & { product: Product } => !!d.product)

  return (
    <section ref={root} id="bevande" className="grain relative isolate overflow-hidden bg-noir py-24 sm:py-32" aria-labelledby="bev-title">
      {/* red and blue light pools behind each can */}
      <div aria-hidden className="pointer-events-none absolute left-[8%] top-[30%] -z-10 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(228,30,43,.22),transparent_62%)]" />
      <div aria-hidden className="pointer-events-none absolute right-[8%] top-[30%] -z-10 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(30,91,216,.22),transparent_62%)]" />

      <div className="container-x">
        <div id="bev-title"><SectionHeading align="center" eyebrow="Bevande fresche" title={'Bien _frais.'} intro="Faites tourner les canettes : glissez-les du doigt ou de la souris." /></div>
      </div>

      <div className="relative mx-auto mt-6 h-[min(70svh,640px)] w-full max-w-6xl sm:mt-10">
        {webgl ? (
          <SceneBoundary fallback={<StillCans />}>
            {!loaded && <StillCans dim={near} />}
            {near && (
              <Suspense fallback={null}>
                <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: loaded ? 1 : 0 }} transition={{ duration: 1.2, ease }}>
                  <CansScene progress={progress} reduced={reduced} active={visible} onReady={() => setLoaded(true)} />
                </motion.div>
              </Suspense>
            )}
            {near && !loaded && (
              <p className="absolute inset-x-0 bottom-4 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70" role="status">Chargement 3D…</p>
            )}
          </SceneBoundary>
        ) : (
          <StillCans />
        )}
      </div>

      <div className="container-x relative mt-6 grid max-w-5xl grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-6">
        {items.map((d, i) => (
          <Reveal key={d.id} delay={i * 0.1}>
            <article className="group relative overflow-hidden rounded-[1.5rem] border border-ivory/10 bg-noir-2/80 p-6 backdrop-blur transition-colors duration-500 hover:border-gold/40 sm:p-7">
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: d.accent }} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow !text-ivory/45">Boisson · 33 cl</p>
                  <h3 className="display mt-2 text-4xl text-ivory">{d.product.name}</h3>
                  {d.product.options && <p className="mt-1 text-sm italic text-ivory/50">{d.product.options.join(' · ')}</p>}
                </div>
                <Price price={d.product.price} className="text-3xl text-gold" />
              </div>
              <div className="mt-6 flex items-center gap-4">
                <AddButton product={d.product} tone="dark" onChoose={() => onOpen(d.product)} />
                <button type="button" onClick={() => onOpen(d.product)} className="link-u text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/55 hover:text-ivory">Détails</button>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
