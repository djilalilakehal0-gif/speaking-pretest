import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { site } from '../config/site'
import { catalog, totals, useCart, type Fulfilment } from '../lib/cart'
import { euro } from '../lib/format'
import { photo } from '../lib/img'
import { orderSummaryText, sanitize, submitOrder, validate, type Customer, type Errors } from '../lib/order'
import { useDialog } from '../lib/useDialog'
import { ArrowIcon, BagIcon, CartIcon, CloseIcon, MailIcon, MinusIcon, PhoneIcon, PlusIcon, ScooterIcon, TrashIcon } from './icons/Icons'

type Step = 'cart' | 'details' | 'sending' | 'confirmed' | 'failed' | 'handoff'
const emptyCustomer: Customer = { name: '', phone: '', email: '', address: '', postcode: '', notes: '' }
const ease = [0.16, 1, 0.3, 1] as const

export function CartDrawer() {
  const { open, setOpen } = useCart()
  return <AnimatePresence>{open && <Drawer onClose={() => setOpen(false)} />}</AnimatePresence>
}

function Drawer({ onClose }: { onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(true, onClose)
  const cart = useCart()
  const { lines, fulfilment, setFulfilment, clear } = cart
  const t = totals(lines, fulfilment)
  const [step, setStep] = useState<Step>('cart')
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [errors, setErrors] = useState<Errors>({})
  const [result, setResult] = useState<{ orderId?: string; message?: string; error?: string }>({})
  const [snapshot, setSnapshot] = useState('')

  useEffect(() => { if (!lines.length && (step === 'details')) setStep('cart') }, [lines.length, step])

  const placeOrder = async () => {
    const clean = sanitize(customer)
    const errs = validate(clean, fulfilment)
    setErrors(errs)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setSnapshot(orderSummaryText(lines, fulfilment, clean))
    if (!site.integrations.orderEndpoint) { setStep('handoff'); return }
    setStep('sending')
    const res = await submitOrder(lines, fulfilment, clean)
    if (res.ok) {
      setResult({ orderId: res.orderId, message: res.message })
      setStep('confirmed')
      clear()
      setCustomer(emptyCustomer)
    } else {
      setResult({ error: res.error })
      setStep('failed')
    }
  }

  const title = { cart: 'Your order', details: 'Checkout', sending: 'Sending…', confirmed: 'Order received', failed: 'Not sent', handoff: 'Send your order' }[step]

  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.2 } }}>
      <button type="button" aria-label="Close cart" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/70 backdrop-blur-sm" />
      <motion.aside
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="cart-title"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.6, ease }}
        className="absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col bg-ink-2 shadow-[-30px_0_80px_-20px_rgba(0,0,0,.8)]"
      >
        <header className="flex items-center justify-between border-b border-cream/[0.07] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            {step === 'details' && (
              <button type="button" onClick={() => setStep('cart')} aria-label="Back to cart" className="inline-flex h-10 w-10 rotate-180 items-center justify-center rounded-full border border-cream/15 hover:border-gold">
                <ArrowIcon />
              </button>
            )}
            <h2 id="cart-title" className="display text-3xl">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close cart" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 hover:border-gold hover:text-gold">
            <CloseIcon />
          </button>
        </header>

        <div className="relative flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease }}
              className="px-5 py-6 sm:px-7"
            >
              {step === 'cart' && <CartLines />}
              {step === 'details' && <DetailsForm customer={customer} setCustomer={setCustomer} errors={errors} fulfilment={fulfilment} />}
              {step === 'sending' && <Status title="Sending your order…" text="Please keep this window open." spinner />}
              {step === 'confirmed' && (
                <Status
                  title="The restaurant received your order"
                  text={`${result.message ?? 'We will call you if anything changes.'} Order number: ${result.orderId}.`}
                  icon={<BagIcon size={48} draw />}
                />
              )}
              {step === 'failed' && <Status title="Your order was not sent" text={result.error ?? 'Something went wrong.'} tone="error" />}
              {step === 'handoff' && <Handoff summary={snapshot} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {(step === 'cart' || step === 'details' || step === 'failed') && lines.length > 0 && (
          <footer className="border-t border-cream/[0.07] bg-ink-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-7">
            {step === 'cart' && <FulfilmentToggle value={fulfilment} onChange={setFulfilment} />}
            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Subtotal" value={euro(t.subtotal)} />
              {fulfilment === 'delivery' && (
                <Row label="Delivery" value={t.deliveryFee ? euro(t.deliveryFee) : 'Free'} hint={t.deliveryFee ? `Free from ${euro(site.ordering.freeDeliveryFrom)}` : undefined} />
              )}
              <div className="flex items-baseline justify-between pt-2">
                <dt className="font-semibold uppercase tracking-[0.14em] text-cream/70">Total</dt>
                <dd className="display text-3xl text-gold">{euro(t.total)}</dd>
              </div>
            </dl>
            {t.belowMinimum && (
              <p className="mt-2 text-xs text-gold" role="status">Minimum for delivery is {euro(site.ordering.minimumDeliveryOrder)}. Add a little more or choose pickup.</p>
            )}
            {step === 'cart' && (
              <button type="button" disabled={t.belowMinimum} onClick={() => setStep('details')} className="btn btn-primary mt-4 w-full disabled:animate-none disabled:opacity-40">
                Checkout <ArrowIcon />
              </button>
            )}
            {(step === 'details' || step === 'failed') && (
              <button type="button" disabled={t.belowMinimum} onClick={placeOrder} className="btn btn-primary mt-4 w-full disabled:opacity-40">
                {site.integrations.orderEndpoint ? `Place order · ${euro(t.total)}` : 'Continue'}
              </button>
            )}
            <p className="mt-3 text-center text-xs text-cream/45">{site.ordering.paymentNote} No payment is taken on this website.</p>
          </footer>
        )}
      </motion.aside>
    </motion.div>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between text-cream/70">
      <dt>{label}{hint && <span className="ml-2 text-xs text-cream/40">{hint}</span>}</dt>
      <dd className="tabular-nums text-cream">{value}</dd>
    </div>
  )
}

function FulfilmentToggle({ value, onChange }: { value: Fulfilment; onChange: (f: Fulfilment) => void }) {
  const opts = [
    { id: 'delivery' as const, label: 'Delivery', sub: `${site.ordering.estimatedDeliveryMinutes} min`, Icon: ScooterIcon },
    { id: 'pickup' as const, label: 'Pickup', sub: `${site.ordering.estimatedPickupMinutes} min`, Icon: BagIcon },
  ]
  return (
    <div role="radiogroup" aria-label="Delivery or pickup" className="grid grid-cols-2 gap-1 rounded-2xl bg-ink p-1">
      {opts.map((o) => (
        <button
          key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${value === o.id ? 'text-ink' : 'text-cream/60 hover:text-cream'}`}
        >
          {value === o.id && <motion.span layoutId="fulfil-pill" className="absolute inset-0 rounded-xl bg-cream" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="relative flex items-center gap-2"><o.Icon size={20} live={value === o.id} /> {o.label}<span className="text-xs font-normal opacity-60">{o.sub}</span></span>
        </button>
      ))}
    </div>
  )
}

function CartLines() {
  const { lines, setQty, remove, setOpen } = useCart()
  if (!lines.length)
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CartIcon size={56} draw className="text-cream/40" />
        <p className="display mt-6 text-3xl">Your cart is empty</p>
        <p className="mt-2 max-w-xs text-sm text-cream/55">Wood-fired pizza and smash burgers are one tap away.</p>
        <a href="#menu" onClick={() => setOpen(false)} className="btn btn-ghost mt-8">Browse the menu</a>
      </div>
    )
  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {lines.map((l) => {
          const item = catalog.get(l.id)!
          const img = photo(item.image)
          return (
            <motion.li
              key={l.id} layout
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, x: 60, height: 0, transition: { duration: 0.3 } }}
              className="overflow-hidden"
            >
              <div className="flex gap-4 rounded-2xl bg-ink/60 p-3">
                <img src={img.src.replace('-1280', '-640')} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{item.name}{item.kind === 'deal' && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Deal</span>}</p>
                    <button type="button" onClick={() => remove(l.id)} aria-label={`Remove ${item.name}`} className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cream/40 hover:text-tomato">
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-cream/12" role="group" aria-label={`Quantity of ${item.name}`}>
                      <button type="button" onClick={() => setQty(l.id, l.qty - 1)} aria-label={`One less ${item.name}`} className="flex h-10 w-10 items-center justify-center hover:text-gold"><MinusIcon size={16} /></button>
                      <motion.span key={l.qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</motion.span>
                      <button type="button" onClick={() => setQty(l.id, l.qty + 1)} aria-label={`One more ${item.name}`} className="flex h-10 w-10 items-center justify-center hover:text-gold"><PlusIcon size={16} /></button>
                    </div>
                    <p className="font-semibold tabular-nums text-gold">{euro(item.price * l.qty)}</p>
                  </div>
                </div>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

function Field({ id, label, error, children, optional }: { id: string; label: string; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-cream/60">
        {label}{optional && <span className="ml-1 normal-case tracking-normal text-cream/35">(optional)</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p id={`${id}-err`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-tomato" role="alert">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailsForm({ customer, setCustomer, errors, fulfilment }: {
  customer: Customer; setCustomer: (c: Customer) => void; errors: Errors; fulfilment: Fulfilment
}) {
  const uid = useId()
  const bind = (k: keyof Customer) => ({
    id: `${uid}-${k}`,
    value: customer[k],
    onChange: (e: { target: { value: string } }) => setCustomer({ ...customer, [k]: e.target.value }),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${uid}-${k}-err` : undefined,
    className: 'input',
  })
  return (
    <form className="space-y-4" noValidate onSubmit={(e) => e.preventDefault()} aria-describedby={`${uid}-privacy`}>
      <p className="text-sm text-cream/60">
        {fulfilment === 'delivery' ? 'Where should we bring it?' : 'Who is picking up?'} We only use these details to prepare and deliver this order.
      </p>
      <Field id={`${uid}-name`} label="Full name" error={errors.name}><input {...bind('name')} autoComplete="name" maxLength={80} required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${uid}-phone`} label="Phone" error={errors.phone}><input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required /></Field>
        <Field id={`${uid}-email`} label="E-mail" error={errors.email} optional><input {...bind('email')} type="email" inputMode="email" autoComplete="email" maxLength={120} /></Field>
      </div>
      {fulfilment === 'delivery' && (
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field id={`${uid}-address`} label="Street & number" error={errors.address}><input {...bind('address')} autoComplete="street-address" maxLength={160} required /></Field>
          <Field id={`${uid}-postcode`} label="Postcode" error={errors.postcode}><input {...bind('postcode')} autoComplete="postal-code" inputMode="numeric" maxLength={12} required /></Field>
        </div>
      )}
      <Field id={`${uid}-notes`} label="Notes for the kitchen or rider" error={errors.notes} optional>
        <textarea {...bind('notes')} rows={3} maxLength={300} placeholder="Doorbell, allergies, extra basil…" />
      </Field>
      <p id={`${uid}-privacy`} className="text-xs leading-relaxed text-cream/40">
        Your details are not stored in this browser and are sent only to {site.name} over an encrypted connection.
      </p>
    </form>
  )
}

function Status({ title, text, tone, spinner, icon }: { title: string; text: string; tone?: 'error'; spinner?: boolean; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-14 text-center" role={tone === 'error' ? 'alert' : 'status'}>
      {spinner && <span className="h-12 w-12 animate-spin rounded-full border-2 border-cream/15 border-t-gold" aria-hidden />}
      {icon && <span className="text-gold">{icon}</span>}
      {tone === 'error' && <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tomato/15 text-2xl text-tomato" aria-hidden>!</span>}
      <p className="display mt-6 text-3xl">{title}</p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/65">{text}</p>
      {tone === 'error' && <p className="mt-4 text-sm text-cream/65">You can try again below, or call us on <a className="text-gold underline" href={site.contact.phoneHref}>{site.contact.phoneDisplay}</a>.</p>}
    </div>
  )
}

/** Shown when no ordering backend is configured: hands the order to the restaurant, never fakes a confirmation. */
function Handoff({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false)
  const mailto = `mailto:${site.contact.email}?subject=${encodeURIComponent(`${site.name} order`)}&body=${encodeURIComponent(summary)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <div>
      <div className="rounded-2xl border border-gold/40 bg-gold/[0.07] p-4 text-sm leading-relaxed text-cream/85" role="note">
        <strong className="text-gold">Online ordering isn’t connected yet.</strong> Your order has <em>not</em> been placed.
        Send it to the restaurant below — it is confirmed only when the team replies or calls you back.
      </div>
      <pre className="mt-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-ink p-4 font-sans text-xs leading-relaxed text-cream/75">{summary}</pre>
      <div className="mt-5 grid gap-3">
        <a href={site.contact.phoneHref} className="btn btn-primary w-full"><PhoneIcon size={18} /> Call {site.contact.phoneDisplay}</a>
        <a href={mailto} className="btn btn-ghost w-full"><MailIcon size={18} /> Send by e-mail</a>
        <button type="button" onClick={copy} className="btn btn-ghost w-full" aria-live="polite">{copied ? 'Copied ✓' : 'Copy order text'}</button>
      </div>
    </div>
  )
}
