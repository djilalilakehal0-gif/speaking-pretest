import { Link, useNavigate } from 'react-router-dom'
import { asset, type Product } from '../data/products'
import { modelActions } from '../hooks/useModelControls'
import { useCart } from '../store/cart'
import { DemoPrice } from './ProductPurchase'

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { wishlist, toggleWish } = useCart()
  const wished = wishlist.includes(product.id)
  return (
    <article className="group relative" data-testid="product-card">
      <Link to={`/product/${product.slug}`} className="block overflow-hidden rounded-2xl bg-cocoa-800">
        <div className="relative aspect-[3/4]">
          <img src={asset(product.images.front)} alt={`${product.name}, front view`} className="absolute inset-0 size-full object-cover transition-opacity duration-700 group-hover:opacity-0" loading="lazy" />
          <img src={asset(product.images.back)} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" loading="lazy" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {product.newArrival && <span className="rounded-full bg-cocoa-900/80 px-2.5 py-1 text-[0.58rem] tracking-[0.2em] text-champagne uppercase">New</span>}
            {product.bestSeller && <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[0.58rem] tracking-[0.2em] text-cocoa-950 uppercase">Best seller</span>}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleWish(product.id)}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-cocoa-900/70 text-champagne backdrop-blur"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
        </svg>
      </button>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl text-beige-50">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-beige-300">{product.tagline}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <DemoPrice product={product} className="text-sm text-champagne" />
        <button
          type="button"
          className="text-[0.62rem] tracking-[0.22em] text-gold-soft uppercase underline-offset-4 hover:underline"
          onClick={() => {
            modelActions.select(product.id)
            navigate('/boutique')
          }}
        >
          View in 3D
        </button>
      </div>
    </article>
  )
}
