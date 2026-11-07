import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { asset, formatPrice, PRODUCTS } from '../data/products'
import { MAX_QTY, useCart, type CartItem } from '../store/cart'

export function CartLine({ item }: { item: CartItem }) {
  const { update, remove } = useCart()
  const p = PRODUCTS.find((x) => x.id === item.productId)!
  return (
    <li className="flex gap-4 py-4" data-testid="cart-line">
      <img src={asset(p.images.front)} alt="" className="h-28 w-21 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <p className="font-serif text-lg leading-tight text-beige-50">{p.name}</p>
          <p className="text-sm tabular-nums text-champagne" data-testid="line-total">
            {formatPrice(p.price * item.quantity)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="sr-only" htmlFor={`size-${item.key}`}>
            Size
          </label>
          <select
            id={`size-${item.key}`}
            className="h-9 rounded-full border border-champagne/25 bg-cocoa-800 px-3"
            value={item.size}
            onChange={(e) => update(item.key, { size: e.target.value })}
            data-testid="line-size"
          >
            {p.sizes.map((s) => (
              <option key={s} value={s} disabled={p.soldOutSizes.includes(s)}>
                Size {s}
              </option>
            ))}
          </select>
          <span className="text-beige-300">{item.color}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex h-9 items-center rounded-full border border-champagne/25">
            <button type="button" className="size-9 disabled:opacity-30" onClick={() => update(item.key, { quantity: item.quantity - 1 })} disabled={item.quantity <= 1} aria-label={`Decrease quantity of ${p.name}`}>
              −
            </button>
            <span className="w-6 text-center text-sm tabular-nums" data-testid="line-qty">
              {item.quantity}
            </span>
            <button type="button" className="size-9 disabled:opacity-30" onClick={() => update(item.key, { quantity: item.quantity + 1 })} disabled={item.quantity >= MAX_QTY} aria-label={`Increase quantity of ${p.name}`} data-testid="line-inc">
              +
            </button>
          </div>
          <button type="button" className="text-[0.62rem] tracking-[0.2em] text-beige-300 uppercase hover:text-gold-soft" onClick={() => remove(item.key)} data-testid="line-remove">
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}

export function CartDrawer() {
  const { open, setOpen, items, subtotal, count } = useCart()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-cocoa-950/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-cocoa-900 shadow-2xl transition-transform duration-500 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        data-testid="cart-drawer"
        inert={!open}
      >
        <header className="flex items-center justify-between border-b border-champagne/10 px-6 py-5">
          <h2 className="font-serif text-2xl">Your cart {count > 0 && <span className="text-base text-beige-300">({count})</span>}</h2>
          <button ref={closeRef} type="button" className="btn btn-ghost !px-0 size-11" onClick={() => setOpen(false)} aria-label="Close cart">
            ✕
          </button>
        </header>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-serif text-2xl text-beige-200">Your cart is empty</p>
            <Link to="/collection" className="btn btn-gold" onClick={() => setOpen(false)}>
              Shop the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-champagne/10 overflow-y-auto px-6">
              {items.map((i) => (
                <CartLine key={i.key} item={i} />
              ))}
            </ul>
            <footer className="space-y-3 border-t border-champagne/10 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-between text-sm">
                <span className="text-beige-300">Subtotal</span>
                <span className="tabular-nums text-beige-50" data-testid="cart-subtotal">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-beige-300/70">Demo prices. Shipping and taxes are set by the store owner and shown at checkout once supplied.</p>
              <Link to="/checkout" className="btn btn-gold w-full" onClick={() => setOpen(false)} data-testid="checkout-link">
                Checkout
              </Link>
              <Link to="/cart" className="btn btn-ghost w-full" onClick={() => setOpen(false)}>
                View cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
