import { useState } from 'react'
import { Link } from 'react-router-dom'
import { asset, productById } from '../data/products'
import { modelActions, useModelStore } from '../hooks/useModelControls'
import { ModelControls } from './ModelControls'
import { DemoPrice, ProductPurchase, StockBadge } from './ProductPurchase'

/** Premium product panel shown when a model is selected in the boutique. */
export function ProductPanel() {
  const selectedId = useModelStore((s) => s.selectedId)
  const product = productById(selectedId ?? undefined)
  const [tab, setTab] = useState<'controls' | 'details'>('controls')
  const [collapsed, setCollapsed] = useState(false)
  if (!product) return null
  const close = () => {
    modelActions.select(null)
    modelActions.camera('reset')
  }
  return (
    <aside
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[62dvh] overflow-y-auto rounded-t-3xl border-t border-champagne/15 bg-cocoa-900/92 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl md:inset-x-auto md:top-24 md:right-6 md:bottom-6 md:max-h-none md:w-[400px] md:rounded-3xl md:border"
      aria-label={`${product.name} — product panel`}
      data-testid="product-panel"
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-champagne/25 md:hidden" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Model {product.boutiqueSlot + 1} of 5</p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-beige-50" data-testid="panel-title">
            {product.name}
          </h2>
          <DemoPrice product={product} className="mt-1 text-lg text-champagne" />
        </div>
        <div className="flex gap-1">
          <button type="button" className="btn btn-ghost !px-0 size-11 md:hidden" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}>
            {collapsed ? '▴' : '▾'}
          </button>
          <button type="button" className="btn btn-ghost !px-0 size-11" onClick={close} aria-label="Close product panel" data-testid="panel-close">
            ✕
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mt-4 grid grid-cols-2 rounded-full border border-champagne/15 p-1 text-[0.65rem] tracking-[0.22em] uppercase" role="tablist">
            {(['controls', 'details'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`min-h-10 rounded-full transition-colors ${tab === t ? 'bg-champagne text-cocoa-950' : 'text-beige-200'}`}
                onClick={() => setTab(t)}
              >
                {t === 'controls' ? 'Inspect in 3D' : 'Details & buy'}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === 'controls' ? (
              <ModelControls productId={product.id} />
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  {[product.images.front, product.images.threeQuarter, product.images.back].map((src, i) => (
                    <img key={src} src={asset(src)} alt={`${product.name} — ${['front', 'three-quarter', 'back'][i]} view`} className="aspect-[3/4] w-full rounded-xl object-cover" loading="lazy" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-beige-200">{product.description}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                  <dt className="text-beige-300/70">Material</dt>
                  <dd>{product.material}</dd>
                  <dt className="text-beige-300/70">Availability</dt>
                  <dd>
                    <StockBadge product={product} />
                  </dd>
                </dl>
                <ProductPurchase product={product} />
              </div>
            )}
          </div>

          <Link to={`/product/${product.slug}`} className="btn btn-ghost mt-5 w-full">
            Full product page
          </Link>
        </>
      )}
    </aside>
  )
}
