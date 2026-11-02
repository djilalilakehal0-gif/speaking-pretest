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
  if (c.name.trim().length < 2) e.name = 'Please enter your name.'
  const digits = c.phone.replace(/[^\d]/g, '')
  if (!/^[+\d][\d\s().-]*$/.test(c.phone.trim()) || digits.length < 7 || digits.length > 15)
    e.phone = 'Enter a valid phone number so we can reach you.'
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = 'This e-mail address looks incomplete.'
  if (fulfilment === 'delivery') {
    if (c.address.trim().length < 6) e.address = 'Enter street and house number for delivery.'
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(c.postcode.trim())) e.postcode = 'Enter a valid postcode.'
  }
  return e
}

export function orderSummaryText(lines: Line[], fulfilment: Fulfilment, c: Customer) {
  const t = totals(lines, fulfilment)
  const rows = lines.map((l) => {
    const it = catalog.get(l.id)!
    return `${l.qty} × ${it.name} — €${(it.price * l.qty).toFixed(2)}`
  })
  return [
    `New ${fulfilment} order for ${site.name}`,
    '',
    ...rows,
    '',
    `Subtotal: €${t.subtotal.toFixed(2)}`,
    fulfilment === 'delivery' ? `Delivery: €${t.deliveryFee.toFixed(2)}` : 'Pickup at the restaurant',
    `Total: €${t.total.toFixed(2)}`,
    '',
    `Name: ${c.name}`,
    `Phone: ${c.phone}`,
    c.email && `E-mail: ${c.email}`,
    fulfilment === 'delivery' && `Address: ${c.address}, ${c.postcode}`,
    c.notes && `Notes: ${c.notes}`,
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
  if (!endpoint) return { ok: false, error: 'Online ordering is not connected.' }
  if (!/^https:\/\//.test(endpoint) && !/^http:\/\/localhost/.test(endpoint))
    return { ok: false, error: 'The ordering endpoint must use HTTPS.' }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        fulfilment,
        items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        customer: sanitize(customer),
        clientTotal: totals(lines, fulfilment).total,
      }),
      signal: ctrl.signal,
      credentials: 'omit',
    })
    const data = (await res.json().catch(() => ({}))) as { orderId?: unknown; message?: unknown; error?: unknown }
    if (!res.ok) return { ok: false, error: typeof data.error === 'string' ? data.error : `The restaurant could not accept the order (error ${res.status}).` }
    if (typeof data.orderId !== 'string' || !data.orderId) return { ok: false, error: 'The restaurant did not confirm the order. Please call us to check.' }
    return { ok: true, orderId: data.orderId, message: typeof data.message === 'string' ? data.message : undefined }
  } catch (err) {
    return { ok: false, error: (err as Error).name === 'AbortError' ? 'The request timed out. Check your connection and try again.' : 'Network error — your order was not sent. Please try again.' }
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
    return res.ok ? { ok: true } : { ok: false, error: `Sign-up failed (error ${res.status}). Please try again.` }
  } catch {
    return { ok: false, error: 'Network error. Please try again.' }
  }
}
