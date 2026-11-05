import { site } from '../config/site'
import { catalog, totals, type Fulfilment, type Line } from './cart'

export interface Customer {
  name: string
  phone: string
  email: string
  address: string
  postcode: string
  notes: string
}

export type Errors = Partial<Record<keyof Customer, string>>

const LIMITS: Record<keyof Customer, number> = { name: 80, phone: 30, email: 120, address: 160, postcode: 12, notes: 300 }

export function sanitize(c: Customer): Customer {
  const out = {} as Customer
  for (const k of Object.keys(LIMITS) as (keyof Customer)[]) {
    out[k] = (c[k] ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, LIMITS[k])
  }
  return out
}

export function validate(c: Customer, fulfilment: Fulfilment): Errors {
  const e: Errors = {}
  if (c.name.trim().length < 2) e.name = 'Indiquez votre nom.'
  const digits = c.phone.replace(/[^\d]/g, '')
  if (!/^[+\d][\d\s().-]*$/.test(c.phone.trim()) || digits.length < 7 || digits.length > 15)
    e.phone = 'Indiquez un numéro de téléphone valide.'
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = 'Cette adresse e-mail semble incomplète.'
  if (fulfilment === 'delivery') {
    if (c.address.trim().length < 6) e.address = 'Indiquez la rue et le numéro pour la livraison.'
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(c.postcode.trim())) e.postcode = 'Indiquez un code postal valide.'
  }
  return e
}

export function orderSummaryText(lines: Line[], fulfilment: Fulfilment, c: Customer) {
  const t = totals(lines, fulfilment)
  const rows = lines.map((l) => {
    const it = catalog.get(l.id)!
    return `${l.qty} × ${it.name}${it.option ? ` (${it.option})` : ''} — ${(it.price * l.qty).toFixed(2).replace('.', ',')} €`
  })
  return [
    `Nouvelle commande ${fulfilment === 'delivery' ? 'en livraison' : 'à emporter'} — ${site.name}`,
    '',
    ...rows,
    '',
    `Sous-total : ${t.subtotal.toFixed(2).replace('.', ',')} €`,
    fulfilment === 'delivery' ? `Livraison : ${t.deliveryFee.toFixed(2).replace('.', ',')} €` : 'À emporter au restaurant',
    `Total : ${t.total.toFixed(2).replace('.', ',')} €`,
    '',
    `Nom : ${c.name}`,
    `Téléphone : ${c.phone}`,
    c.email && `E-mail : ${c.email}`,
    fulfilment === 'delivery' && `Adresse : ${c.address}, ${c.postcode}`,
    c.notes && `Remarques : ${c.notes}`,
  ].filter(Boolean).join('\n')
}

export type SubmitResult =
  | { ok: true; orderId: string; message?: string }
  | { ok: false; error: string }

/**
 * Sends the order to the configured backend. Only ids and quantities are sent for items:
 * the server must look up prices itself and is the only source of truth for the total.
 * A success is reported ONLY when the server answers 2xx with an order id.
 */
export async function submitOrder(lines: Line[], fulfilment: Fulfilment, customer: Customer): Promise<SubmitResult> {
  const endpoint = site.integrations.orderEndpoint
  if (!endpoint) return { ok: false, error: 'La commande en ligne n’est pas connectée.' }
  if (!/^https:\/\//.test(endpoint) && !/^http:\/\/localhost/.test(endpoint))
    return { ok: false, error: 'Le service de commande doit utiliser HTTPS.' }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        fulfilment,
        items: lines.map((l) => { const [id, option] = l.id.split('::'); return { id, option, qty: l.qty } }),
        customer: sanitize(customer),
        clientTotal: totals(lines, fulfilment).total,
      }),
      signal: ctrl.signal,
      credentials: 'omit',
    })
    const data = (await res.json().catch(() => ({}))) as { orderId?: unknown; message?: unknown; error?: unknown }
    if (!res.ok) return { ok: false, error: typeof data.error === 'string' ? data.error : `Le restaurant n’a pas pu accepter la commande (erreur ${res.status}).` }
    if (typeof data.orderId !== 'string' || !data.orderId) return { ok: false, error: 'Le restaurant n’a pas confirmé la commande. Appelez-nous pour vérifier.' }
    return { ok: true, orderId: data.orderId, message: typeof data.message === 'string' ? data.message : undefined }
  } catch (err) {
    return { ok: false, error: (err as Error).name === 'AbortError' ? 'Délai dépassé. Vérifiez votre connexion et réessayez.' : 'Erreur réseau : votre commande n’a pas été envoyée. Réessayez.' }
  } finally {
    clearTimeout(timer)
  }
}

export async function subscribeNewsletter(email: string): Promise<{ ok: boolean; error?: string }> {
  const endpoint = site.integrations.newsletterEndpoint
  if (!endpoint) return { ok: false, error: 'not-configured' }
  try {
    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      body: JSON.stringify({ email: email.trim().slice(0, 120) }),
    })
    return res.ok ? { ok: true } : { ok: false, error: `Inscription impossible (erreur ${res.status}). Réessayez.` }
  } catch {
    return { ok: false, error: 'Erreur réseau. Réessayez.' }
  }
}
