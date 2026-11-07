import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, PRODUCTS } from '../data/products'
import { useCart } from '../store/cart'

/**
 * Checkout path. No payment provider is connected: the brief says to integrate one only after the
 * store owner supplies credentials and business requirements. Submitting records a demo order locally.
 */
export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const [done, setDone] = useState<string | null>(null)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const ref = `DEMO-${Date.now().toString(36).toUpperCase()}`
    clear()
    setDone(ref)
  }

  if (done)
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center" data-testid="order-done">
        <p className="eyebrow">Demo order recorded</p>
        <h1 className="mt-3 font-serif text-5xl">Thank you</h1>
        <p className="mt-4 text-beige-300">Reference <span className="text-champagne">{done}</span>. This is a demonstration: no payment was taken and no order was sent.</p>
        <Link to="/" className="btn btn-gold mt-8">Back to the boutique</Link>
      </div>
    )

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <h1 className="font-serif text-4xl">Nothing to check out yet</h1>
        <Link to="/collection" className="btn btn-gold mt-8">Shop the collection</Link>
      </div>
    )

  const field = 'h-12 w-full rounded-xl border border-champagne/20 bg-cocoa-800 px-4 text-sm placeholder:text-beige-300/50'
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
      <h1 className="font-serif text-5xl">Checkout</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-gold/50 p-4 text-sm text-beige-200" role="note">
        <strong className="text-gold-soft">Demo checkout.</strong> No payment provider is connected yet. It will be added once the store owner supplies the provider, credentials, shipping and tax rules.
      </div>
      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_360px]">
        <form className="space-y-8" onSubmit={submit}>
          <fieldset className="space-y-3">
            <legend className="eyebrow mb-3">Contact</legend>
            <input className={field} type="email" required placeholder="Email" autoComplete="email" aria-label="Email" />
            <input className={field} type="tel" placeholder="Phone (optional)" autoComplete="tel" aria-label="Phone" />
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="eyebrow mb-3">Delivery address</legend>
            <input className={field} required placeholder="First name" autoComplete="given-name" aria-label="First name" />
            <input className={field} required placeholder="Last name" autoComplete="family-name" aria-label="Last name" />
            <input className={`${field} sm:col-span-2`} required placeholder="Address" autoComplete="street-address" aria-label="Address" />
            <input className={field} required placeholder="City" autoComplete="address-level2" aria-label="City" />
            <input className={field} required placeholder="Postcode" autoComplete="postal-code" aria-label="Postcode" />
            <input className={`${field} sm:col-span-2`} required placeholder="Country" autoComplete="country-name" aria-label="Country" />
          </fieldset>
          <fieldset>
            <legend className="eyebrow mb-3">Payment</legend>
            <div className="rounded-xl border border-champagne/15 p-5 text-sm text-beige-300">Payment provider not connected (demo). No card details are collected.</div>
          </fieldset>
          <button type="submit" className="btn btn-gold w-full" data-testid="place-order">Place demo order</button>
        </form>
        <aside className="h-fit rounded-3xl border border-champagne/10 p-6">
          <h2 className="eyebrow mb-4">Order summary</h2>
          <ul className="space-y-3 text-sm">
            {items.map((i) => {
              const p = PRODUCTS.find((x) => x.id === i.productId)!
              return (
                <li key={i.key} className="flex justify-between gap-3">
                  <span>{p.name} <span className="text-beige-300">· {i.size} · ×{i.quantity}</span></span>
                  <span className="tabular-nums">{formatPrice(p.price * i.quantity)}</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-5 space-y-2 border-t border-champagne/10 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-beige-300">Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-beige-300">Shipping</span><span className="text-beige-300">To be supplied</span></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
