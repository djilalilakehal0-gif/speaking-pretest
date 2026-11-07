import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModelControls } from '../components/ModelControls'
import { ProductCard } from '../components/ProductCard'
import { DemoPrice, ProductPurchase, StockBadge } from '../components/ProductPurchase'
import { asset, PRODUCTS, productById } from '../data/products'
import { hasWebGL } from '../lib/env'
import NotFound from './NotFound'

const ModelViewer = lazy(() => import('../components/ModelViewer'))

export default function Product() {
  const { slug } = useParams()
  const product = productById(slug)
  const webgl = useMemo(hasWebGL, [])
  const [view, setView] = useState<'3d' | 'front' | 'threeQuarter' | 'back'>(webgl ? '3d' : 'front')
  if (!product) return <NotFound />
  const views = [
    ...(webgl ? [{ key: '3d' as const, label: '3D' }] : []),
    { key: 'front' as const, label: 'Front' },
    { key: 'threeQuarter' as const, label: '¾' },
    { key: 'back' as const, label: 'Back' },
  ]
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <nav className="mb-6 text-xs text-beige-300" aria-label="Breadcrumb">
        <Link to="/collection" className="hover:text-champagne">Collection</Link> <span aria-hidden>/</span> <span className="text-beige-100">{product.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-cocoa-800 md:aspect-[4/5]">
            {view === '3d' ? (
              <Suspense fallback={<div className="shimmer absolute inset-0" role="status" aria-label="Loading 3D viewer" />}>
                <ModelViewer product={product} />
              </Suspense>
            ) : (
              <img src={asset(product.images[view])} alt={`${product.name}, ${view === 'threeQuarter' ? 'three-quarter' : view} view`} className="absolute inset-0 size-full object-cover" />
            )}
            <div className="absolute top-4 left-4 flex gap-2" role="tablist" aria-label="Views">
              {views.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={view === v.key}
                  onClick={() => setView(v.key)}
                  className={`min-h-10 min-w-10 rounded-full px-3 text-[0.65rem] tracking-[0.2em] uppercase backdrop-blur ${view === v.key ? 'bg-champagne text-cocoa-950' : 'bg-cocoa-900/60 text-beige-100'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {view === '3d' && <p className="pointer-events-none absolute right-4 bottom-4 left-4 text-center text-[0.6rem] tracking-[0.22em] text-beige-200/80 uppercase">Drag the model to turn it · pinch or scroll to zoom</p>}
          </div>
          {view === '3d' && (
            <div className="mt-6 rounded-3xl border border-champagne/10 p-5">
              <ModelControls productId={product.id} movement={false} />
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.newArrival ? 'New arrival' : product.bestSeller ? 'Best seller' : 'Collection'}</p>
          <h1 className="mt-2 font-serif text-5xl leading-none">{product.name}</h1>
          <DemoPrice product={product} className="mt-3 text-xl text-champagne" />
          <div className="mt-3">
            <StockBadge product={product} />
          </div>
          <p className="mt-6 leading-relaxed text-beige-200">{product.description}</p>
          <div className="mt-8">
            <ProductPurchase product={product} />
          </div>
          <div className="mt-10 space-y-6 border-t border-champagne/10 pt-6 text-sm">
            <div>
              <h2 className="eyebrow mb-2">Garment details</h2>
              <ul className="list-inside list-disc space-y-1 text-beige-200 marker:text-gold">
                {product.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="eyebrow mb-2">Material & care</h2>
              <p className="text-beige-200">{product.material}. Care instructions to be supplied by the store owner.</p>
            </div>
            <div>
              <h2 className="eyebrow mb-2">Delivery & returns</h2>
              <p className="text-beige-200">Shipping and return terms will be published by the store owner. No terms are offered in this demo.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-24" aria-labelledby="more">
        <h2 id="more" className="mb-8 font-serif text-3xl">More from the boutique</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {PRODUCTS.filter((p) => p.id !== product.id).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  )
}
