import { Link } from 'react-router-dom'
import { asset, PRODUCTS } from '../data/products'

/** Shown instead of the 3D scene when the browser cannot run WebGL. */
export function WebGLFallback() {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-cocoa-900 px-4 pt-24 pb-10" data-testid="webgl-fallback">
      <p className="eyebrow text-center">3D not available on this device</p>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-beige-300">Your browser cannot display WebGL, so here is the collection photographed in our studio instead.</p>
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-5">
        {PRODUCTS.map((p) => (
          <Link key={p.id} to={`/product/${p.slug}`} className="block">
            <img src={asset(p.images.threeQuarter)} alt={p.name} className="aspect-[3/4] w-full rounded-2xl object-cover" />
            <p className="mt-2 text-center font-serif text-lg">{p.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
