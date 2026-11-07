import { Link } from 'react-router-dom'
import { CartLine } from '../components/CartDrawer'
import { formatPrice } from '../data/products'
import { useCart } from '../store/cart'

export default function Cart() {
  const { items, subtotal, clear } = useCart()
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-8">
      <h1 className="font-serif text-5xl">Cart</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl text-beige-300">Your cart is empty.</p>
          <Link to="/collection" className="btn btn-gold mt-6">Shop the collection</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_300px]">
          <div>
            <ul className="divide-y divide-champagne/10 border-y border-champagne/10">
              {items.map((i) => <CartLine key={i.key} item={i} />)}
            </ul>
            <button type="button" className="mt-4 text-[0.65rem] tracking-[0.2em] text-beige-300 uppercase hover:text-gold-soft" onClick={clear}>
              Empty cart
            </button>
          </div>
          <aside className="h-fit space-y-4 rounded-3xl border border-champagne/10 p-6">
            <div className="flex justify-between">
              <span className="text-beige-300">Subtotal</span>
              <span className="tabular-nums" data-testid="cart-page-subtotal">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-beige-300/70">Demo prices. Shipping and taxes are added once the store owner supplies them.</p>
            <Link to="/checkout" className="btn btn-gold w-full">Checkout</Link>
            <Link to="/collection" className="btn btn-ghost w-full">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
