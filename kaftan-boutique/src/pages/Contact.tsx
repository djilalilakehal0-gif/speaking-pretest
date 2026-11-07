import { useState, type FormEvent } from 'react'
import { STORE } from '../data/products'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  const field = 'w-full rounded-xl border border-champagne/20 bg-cocoa-800 px-4 py-3 text-sm placeholder:text-beige-300/50'
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-4 py-14 md:grid-cols-2 md:px-8">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-2 font-serif text-5xl">Visit or write to us</h1>
        <dl className="mt-10 space-y-5 text-sm">
          <div><dt className="eyebrow mb-1">Boutique</dt><dd className="text-beige-200">{STORE.contact.address}</dd></div>
          <div><dt className="eyebrow mb-1">Hours</dt><dd className="text-beige-200">{STORE.contact.hours}</dd></div>
          <div><dt className="eyebrow mb-1">Email</dt><dd className="text-beige-200">{STORE.contact.email}</dd></div>
          <div><dt className="eyebrow mb-1">Phone</dt><dd className="text-beige-200">{STORE.contact.phone}</dd></div>
        </dl>
        <p className="mt-8 text-xs text-beige-300/70">Placeholder contact details, to be replaced in src/data/products.ts (STORE.contact).</p>
      </div>
      {sent ? (
        <div className="flex items-center justify-center rounded-3xl border border-champagne/10 p-10 text-center" role="status">
          <div>
            <p className="font-serif text-3xl">Thank you</p>
            <p className="mt-2 text-sm text-beige-300">Demo form: no message was sent. A mail service will be connected by the store owner.</p>
          </div>
        </div>
      ) : (
        <form className="space-y-3 rounded-3xl border border-champagne/10 p-6" onSubmit={submit}>
          <input className={field} required placeholder="Name" aria-label="Name" autoComplete="name" />
          <input className={field} required type="email" placeholder="Email" aria-label="Email" autoComplete="email" />
          <textarea className={`${field} min-h-40`} required placeholder="Your message" aria-label="Message" />
          <button type="submit" className="btn btn-gold w-full">Send (demo)</button>
        </form>
      )}
    </div>
  )
}
