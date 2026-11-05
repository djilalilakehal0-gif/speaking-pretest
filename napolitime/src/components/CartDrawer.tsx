import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { site } from '../config/site'
import { catalog, totals, useCart, type Fulfilment } from '../lib/cart'
import { euro } from '../lib/format'
import { menuImage } from './ProductCard'
import { LogoMark } from './Logo'
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

  const title = { cart: 'Votre panier', details: 'Vos coordonnées', sending: 'Envoi…', confirmed: 'Commande reçue', failed: 'Non envoyée', handoff: 'Envoyer la commande' }[step]

  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.2 } }}>
      <button type="button" aria-label="Fermer le panier" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-noir/70 backdrop-blur-sm" />
      <motion.aside
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="cart-title"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.6, ease }}
        className="absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col bg-noir-2 shadow-[-30px_0_80px_-20px_rgba(0,0,0,.8)]"
      >
        <header className="flex items-center justify-between border-b border-ivory/[0.07] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            {step === 'details' && (
              <button type="button" onClick={() => setStep('cart')} aria-label="Retour au panier" className="inline-flex h-10 w-10 rotate-180 items-center justify-center rounded-full border border-ivory/15 hover:border-gold">
                <ArrowIcon />
              </button>
            )}
            <h2 id="cart-title" className="display text-3xl">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer le panier" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/15 hover:border-gold hover:text-gold">
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
              {step === 'sending' && <Status title="Envoi de votre commande…" text="Gardez cette fenêtre ouverte." spinner />}
              {step === 'confirmed' && (
                <Status
                  title="Le restaurant a reçu votre commande"
                  text={`${result.message ?? 'Nous vous appelons en cas de changement.'} Numéro de commande : ${result.orderId}.`}
                  icon={<BagIcon size={48} draw />}
                />
              )}
              {step === 'failed' && <Status title="Votre commande n'a pas été envoyée" text={result.error ?? 'Une erreur est survenue.'} tone="error" />}
              {step === 'handoff' && <Handoff summary={snapshot} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {(step === 'cart' || step === 'details' || step === 'failed') && lines.length > 0 && (
          <footer className="border-t border-ivory/[0.07] bg-noir-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-7">
            {step === 'cart' && <FulfilmentToggle value={fulfilment} onChange={setFulfilment} />}
            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Sous-total" value={euro(t.subtotal)} />
              {fulfilment === 'delivery' && (
                <Row label="Livraison" value={t.deliveryFee ? euro(t.deliveryFee) : 'Offerte'} hint={t.deliveryFee ? `Offerte dès ${euro(site.ordering.freeDeliveryFrom)}` : undefined} />
              )}
              <div className="flex items-baseline justify-between pt-2">
                <dt className="font-semibold uppercase tracking-[0.14em] text-ivory/70">Total</dt>
                <dd className="display text-3xl text-gold">{euro(t.total)}</dd>
              </div>
            </dl>
            {t.belowMinimum && (
              <p className="mt-2 text-xs text-gold" role="status">Minimum de commande en livraison : {euro(site.ordering.minimumDeliveryOrder)}. Ajoutez un article ou choisissez « À emporter ».</p>
            )}
            {step === 'cart' && (
              <button type="button" disabled={t.belowMinimum} onClick={() => setStep('details')} className="btn btn-gold mt-4 w-full disabled:opacity-40">
                Commander <ArrowIcon />
              </button>
            )}
            {(step === 'details' || step === 'failed') && (
              <button type="button" disabled={t.belowMinimum} onClick={placeOrder} className="btn btn-gold mt-4 w-full disabled:opacity-40">
                {site.integrations.orderEndpoint ? `Valider · ${euro(t.total)}` : 'Continuer'}
              </button>
            )}
            <p className="mt-3 text-center text-xs text-ivory/45">{site.ordering.paymentNote} Aucun paiement sur ce site.</p>
          </footer>
        )}
      </motion.aside>
    </motion.div>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between text-ivory/70">
      <dt>{label}{hint && <span className="ml-2 text-xs text-ivory/40">{hint}</span>}</dt>
      <dd className="tabular-nums text-ivory">{value}</dd>
    </div>
  )
}

function FulfilmentToggle({ value, onChange }: { value: Fulfilment; onChange: (f: Fulfilment) => void }) {
  const opts = [
    { id: 'delivery' as const, label: 'Livraison', sub: `${site.ordering.estimatedDeliveryMinutes} min`, Icon: ScooterIcon },
    { id: 'pickup' as const, label: 'À emporter', sub: `${site.ordering.estimatedPickupMinutes} min`, Icon: BagIcon },
  ]
  return (
    <div role="radiogroup" aria-label="Livraison ou à emporter" className="grid grid-cols-2 gap-1 rounded-2xl bg-noir p-1">
      {opts.map((o) => (
        <button
          key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${value === o.id ? 'text-noir' : 'text-ivory/60 hover:text-ivory'}`}
        >
          {value === o.id && <motion.span layoutId="fulfil-pill" className="absolute inset-0 rounded-xl bg-gold" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
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
        <CartIcon size={56} draw className="text-ivory/40" />
        <p className="display mt-6 text-3xl">Votre panier est vide</p>
        <p className="mt-2 max-w-xs text-sm text-ivory/55">Burgers, sandwichs et tacos sont à un geste.</p>
        <a href="#menu" onClick={() => setOpen(false)} className="btn btn-line mt-8">Voir le menu</a>
      </div>
    )
  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {lines.map((l) => {
          const item = catalog.get(l.id)!
                    return (
            <motion.li
              key={l.id} layout
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, x: 60, height: 0, transition: { duration: 0.3 } }}
              className="overflow-hidden"
            >
              <div className="flex gap-4 rounded-2xl bg-noir/60 p-3">
                {item.image ? <img src={menuImage(item.image)} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl bg-noir object-contain p-1" /> : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-noir"><LogoMark size={44} /></span>}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{item.name}{item.option && <span className="block text-xs font-normal text-ivory/55">{item.option}</span>}</p>
                    <button type="button" onClick={() => remove(l.id)} aria-label={`Retirer ${item.name}`} className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory/40 hover:text-[#e8a0ad]">
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-ivory/12" role="group" aria-label={`Quantité : ${item.name}`}>
                      <button type="button" onClick={() => setQty(l.id, l.qty - 1)} aria-label={`Un ${item.name} de moins`} className="flex h-10 w-10 items-center justify-center hover:text-gold"><MinusIcon size={16} /></button>
                      <motion.span key={l.qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</motion.span>
                      <button type="button" onClick={() => setQty(l.id, l.qty + 1)} aria-label={`Un ${item.name} de plus`} className="flex h-10 w-10 items-center justify-center hover:text-gold"><PlusIcon size={16} /></button>
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
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ivory/60">
        {label}{optional && <span className="ml-1 normal-case tracking-normal text-ivory/35">(facultatif)</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p id={`${id}-err`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-[#e8a0ad]" role="alert">
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
      <p className="text-sm text-ivory/60">
        {fulfilment === 'delivery' ? 'Où devons-nous livrer ?' : 'Qui vient chercher la commande ?'} Ces informations servent uniquement à préparer cette commande.
      </p>
      <Field id={`${uid}-name`} label="Nom complet" error={errors.name}><input {...bind('name')} autoComplete="name" maxLength={80} required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${uid}-phone`} label="Téléphone" error={errors.phone}><input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required /></Field>
        <Field id={`${uid}-email`} label="E-mail" error={errors.email} optional><input {...bind('email')} type="email" inputMode="email" autoComplete="email" maxLength={120} /></Field>
      </div>
      {fulfilment === 'delivery' && (
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field id={`${uid}-address`} label="Rue et numéro" error={errors.address}><input {...bind('address')} autoComplete="street-address" maxLength={160} required /></Field>
          <Field id={`${uid}-postcode`} label="Code postal" error={errors.postcode}><input {...bind('postcode')} autoComplete="postal-code" inputMode="numeric" maxLength={12} required /></Field>
        </div>
      )}
      <Field id={`${uid}-notes`} label="Remarques pour la cuisine ou le livreur" error={errors.notes} optional>
        <textarea {...bind('notes')} rows={3} maxLength={300} placeholder="Interphone, allergies, sans oignons…" />
      </Field>
      <p id={`${uid}-privacy`} className="text-xs leading-relaxed text-ivory/40">
        Vos informations ne sont pas enregistrées dans ce navigateur et ne sont envoyées qu’à {site.name}, via une connexion chiffrée.
      </p>
    </form>
  )
}

function Status({ title, text, tone, spinner, icon }: { title: string; text: string; tone?: 'error'; spinner?: boolean; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-14 text-center" role={tone === 'error' ? 'alert' : 'status'}>
      {spinner && <span className="h-12 w-12 animate-spin rounded-full border-2 border-ivory/15 border-t-gold" aria-hidden />}
      {icon && <span className="text-gold">{icon}</span>}
      {tone === 'error' && <span className="flex h-14 w-14 items-center justify-center rounded-full bg-burgundy/40 text-2xl text-[#e8a0ad]" aria-hidden>!</span>}
      <p className="display mt-6 text-3xl">{title}</p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory/65">{text}</p>
      {tone === 'error' && <p className="mt-4 text-sm text-ivory/65">Réessayez ci-dessous ou appelez-nous au <a className="text-gold underline" href={site.contact.phoneHref}>{site.contact.phoneDisplay}</a>.</p>}
    </div>
  )
}

/** Shown when no ordering backend is configured: hands the order to the restaurant, never fakes a confirmation. */
function Handoff({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false)
  const mailto = `mailto:${site.contact.email}?subject=${encodeURIComponent(`Commande ${site.name}`)}&body=${encodeURIComponent(summary)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <div>
      <div className="rounded-2xl border border-gold/40 bg-gold/[0.07] p-4 text-sm leading-relaxed text-ivory/85" role="note">
        <strong className="text-gold">La commande en ligne n’est pas encore connectée.</strong> Votre commande n’est <em>pas</em> passée.
        Envoyez-la au restaurant ci-dessous : elle n’est confirmée que lorsque l’équipe vous répond ou vous rappelle.
      </div>
      <pre className="mt-5 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-noir p-4 font-sans text-xs leading-relaxed text-ivory/75">{summary}</pre>
      <div className="mt-5 grid gap-3">
        <a href={site.contact.phoneHref} className="btn btn-gold w-full"><PhoneIcon size={18} /> Appeler le {site.contact.phoneDisplay}</a>
        <a href={mailto} className="btn btn-line w-full"><MailIcon size={18} /> Envoyer par e-mail</a>
        <button type="button" onClick={copy} className="btn btn-line w-full" aria-live="polite">{copied ? 'Copié ✓' : 'Copier la commande'}</button>
      </div>
    </div>
  )
}
