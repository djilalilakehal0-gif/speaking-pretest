import { useState } from 'react'
import { formatPrice, STOCK_LABEL, type Product } from '../data/products'
import { MAX_QTY, useCart } from '../store/cart'

export function DemoPrice({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="tabular-nums">{formatPrice(product.price)}</span>
      <span className="demo-tag" title="Sample price — the store owner will supply real prices">Demo price</span>
    </span>
  )
}

export function StockBadge({ product }: { product: Product }) {
  const tone = product.stock === 'sold-out' ? 'text-red-300' : product.stock === 'low-stock' ? 'text-gold-soft' : 'text-beige-200'
  return (
    <span className={`inline-flex items-center gap-2 text-xs ${tone}`} data-testid="stock-status">
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STOCK_LABEL[product.stock]} <span className="demo-tag">demo</span>
    </span>
  )
}

/** Size, colour, quantity, wishlist and ADD TO CART for one product. */
export function ProductPurchase({ product }: { product: Product }) {
  const cart = useCart()
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState(product.colors[0].name)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')
  const wished = cart.wishlist.includes(product.id)
  const soldOut = product.stock === 'sold-out'

  const add = () => {
    if (!size) {
      setError('Please choose a size.')
      return
    }
    setError('')
    cart.add({ productId: product.id, size, color, quantity: qty })
    setAdded(true)
    cart.setOpen(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="eyebrow mb-2">Colour · {color}</legend>
        <div className="flex gap-3">
          {product.colors.map((c) => (
            <label key={c.name} className="cursor-pointer">
              <input type="radio" name={`color-${product.id}`} className="peer sr-only" checked={color === c.name} onChange={() => setColor(c.name)} />
              <span
                className="block size-9 rounded-full border-2 border-transparent ring-1 ring-champagne/30 peer-checked:border-cocoa-900 peer-checked:ring-2 peer-checked:ring-gold peer-focus-visible:ring-gold-soft"
                style={{ background: c.hex }}
                title={c.name}
              />
              <span className="sr-only">{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-2 flex w-full justify-between">
          <span>Size</span>
          <span className="normal-case tracking-normal text-beige-300/70">Size guide to be supplied</span>
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {product.sizes.map((s) => {
            const out = product.soldOutSizes.includes(s)
            return (
              <label key={s} className={out ? 'cursor-not-allowed' : 'cursor-pointer'}>
                <input
                  type="radio"
                  name={`size-${product.id}`}
                  className="peer sr-only"
                  disabled={out}
                  checked={size === s}
                  onChange={() => {
                    setSize(s)
                    setError('')
                  }}
                  data-testid={`size-${s}`}
                />
                <span
                  className={`flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-xs tracking-widest transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:text-cocoa-950 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-soft ${
                    out ? 'border-champagne/10 text-beige-300/30 line-through' : 'border-champagne/30 hover:border-gold-soft'
                  }`}
                >
                  {s}
                </span>
              </label>
            )
          })}
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-300" role="alert">
            {error}
          </p>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <div className="flex h-11 items-center rounded-full border border-champagne/30" aria-label="Quantity">
          <button type="button" className="size-11 text-lg disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            −
          </button>
          <span className="w-6 text-center tabular-nums" aria-live="polite" data-testid="qty">
            {qty}
          </span>
          <button type="button" className="size-11 text-lg disabled:opacity-30" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="Increase quantity">
            +
          </button>
        </div>
        <button type="button" className="btn btn-gold flex-1" onClick={add} disabled={soldOut} data-testid="add-to-cart">
          {soldOut ? 'Sold out' : added ? 'Added ✓' : 'Add to cart'}
        </button>
        <button
          type="button"
          className={`btn btn-ghost !px-0 size-11 ${wished ? '!text-gold !border-gold' : ''}`}
          onClick={() => cart.toggleWish(product.id)}
          aria-pressed={wished}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          data-testid="wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
