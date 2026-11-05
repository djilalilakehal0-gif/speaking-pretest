import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { products } from '../data/menu'
import { site } from '../config/site'
import { cents } from './format'

/**
 * A cart line id is the product id, or `productId::option` when the product has options
 * (e.g. `milkshake::Oreo`), so each flavour is its own line.
 */
export interface CatalogItem { id: string; name: string; option?: string; price: number; image?: string }

const byId = new Map(products.map((p) => [p.id, p]))

export const lineId = (productId: string, option?: string) => (option ? `${productId}::${option}` : productId)

export const catalog = {
  get(id: string): CatalogItem | undefined {
    const [pid, option] = id.split('::')
    const p = byId.get(pid)
    if (!p) return undefined
    if (option !== undefined && !p.options?.includes(option)) return undefined
    if (option === undefined && p.options?.length) return undefined
    return { id, name: p.name, option, price: p.price, image: p.image }
  },
  has(id: string) { return !!this.get(id) },
}

export type Fulfilment = 'delivery' | 'pickup'
export interface Line { id: string; qty: number }

type State = { lines: Line[] }
type Action =
  | { type: 'add'; id: string; qty?: number }
  | { type: 'set'; id: string; qty: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

const MAX_QTY = 20
const STORAGE_KEY = 'napolitime.cart.v1'

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add': {
      if (!catalog.has(action.id)) return state
      const existing = state.lines.find((l) => l.id === action.id)
      const qty = Math.min(MAX_QTY, (existing?.qty ?? 0) + (action.qty ?? 1))
      return existing
        ? { lines: state.lines.map((l) => (l.id === action.id ? { ...l, qty } : l)) }
        : { lines: [...state.lines, { id: action.id, qty }] }
    }
    case 'set': {
      const qty = Math.max(0, Math.min(MAX_QTY, Math.floor(action.qty)))
      if (qty === 0) return { lines: state.lines.filter((l) => l.id !== action.id) }
      return { lines: state.lines.map((l) => (l.id === action.id ? { ...l, qty } : l)) }
    }
    case 'remove':
      return { lines: state.lines.filter((l) => l.id !== action.id) }
    case 'clear':
      return { lines: [] }
  }
}

/** Only ids and quantities are stored locally — never customer details. */
function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lines: [] }
    const parsed = JSON.parse(raw) as Line[]
    return {
      lines: parsed
        .filter((l) => catalog.has(l.id) && Number.isFinite(l.qty) && l.qty > 0)
        .map((l) => ({ id: l.id, qty: Math.min(MAX_QTY, Math.floor(l.qty)) })),
    }
  } catch {
    return { lines: [] }
  }
}

export function totals(lines: Line[], fulfilment: Fulfilment) {
  const subtotal = cents(lines.reduce((s, l) => s + (catalog.get(l.id)?.price ?? 0) * l.qty, 0))
  const o = site.ordering
  const deliveryFee = fulfilment === 'delivery' && subtotal > 0 && subtotal < o.freeDeliveryFrom ? o.deliveryFee : 0
  const belowMinimum = fulfilment === 'delivery' && subtotal > 0 && subtotal < o.minimumDeliveryOrder
  return { subtotal, deliveryFee, total: cents(subtotal + deliveryFee), belowMinimum, count: lines.reduce((s, l) => s + l.qty, 0) }
}

interface CartCtx {
  lines: Line[]
  add: (id: string, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  fulfilment: Fulfilment
  setFulfilment: (f: Fulfilment) => void
  open: boolean
  setOpen: (o: boolean) => void
  /** Increments on every add; drives the cart icon bounce. */
  pulse: number
  lastAdded: string | null
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [fulfilment, setFulfilment] = useState<Fulfilment>('delivery')
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(0)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines)) } catch { /* storage unavailable */ }
  }, [state.lines])

  const add = useCallback((id: string, qty = 1) => {
    dispatch({ type: 'add', id, qty })
    setPulse((p) => p + 1)
    setLastAdded(id)
  }, [])
  const setQty = useCallback((id: string, qty: number) => dispatch({ type: 'set', id, qty }), [])
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const value = useMemo(
    () => ({ lines: state.lines, add, setQty, remove, clear, fulfilment, setFulfilment, open, setOpen, pulse, lastAdded }),
    [state.lines, add, setQty, remove, clear, fulfilment, open, pulse, lastAdded],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside CartProvider')
  return c
}

