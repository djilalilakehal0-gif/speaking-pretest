import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRODUCTS } from '../data/products'

export interface CartItem {
  key: string
  productId: string
  size: string
  color: string
  quantity: number
}

interface CartApi {
  items: CartItem[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (v: boolean) => void
  add: (item: Omit<CartItem, 'key'>) => void
  update: (key: string, change: Partial<Pick<CartItem, 'size' | 'color' | 'quantity'>>) => void
  remove: (key: string) => void
  clear: () => void
  wishlist: string[]
  toggleWish: (productId: string) => void
}

const CartContext = createContext<CartApi | null>(null)
const KEY = 'kaftan-boutique:cart:v1'
const WISH = 'kaftan-boutique:wishlist:v1'
export const MAX_QTY = 10

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* storage unavailable */
  }
}
const keyOf = (i: Omit<CartItem, 'key' | 'quantity'>) => `${i.productId}|${i.size}|${i.color}`

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    read<CartItem[]>(KEY, []).filter((i) => PRODUCTS.some((p) => p.id === i.productId)),
  )
  const [wishlist, setWishlist] = useState<string[]>(() => read<string[]>(WISH, []))
  const [open, setOpen] = useState(false)

  useEffect(() => {
    write(KEY, items)
  }, [items])
  useEffect(() => {
    write(WISH, wishlist)
  }, [wishlist])

  const add = useCallback((item: Omit<CartItem, 'key'>) => {
    setItems((cur) => {
      const key = keyOf(item)
      const existing = cur.find((c) => c.key === key)
      if (existing) return cur.map((c) => (c.key === key ? { ...c, quantity: Math.min(MAX_QTY, c.quantity + item.quantity) } : c))
      return [...cur, { ...item, key, quantity: Math.min(MAX_QTY, item.quantity) }]
    })
  }, [])

  const update = useCallback((key: string, change: Partial<Pick<CartItem, 'size' | 'color' | 'quantity'>>) => {
    setItems((cur) => {
      const target = cur.find((c) => c.key === key)
      if (!target) return cur
      const next = { ...target, ...change }
      next.quantity = Math.max(1, Math.min(MAX_QTY, next.quantity))
      next.key = keyOf(next)
      const rest = cur.filter((c) => c.key !== key)
      const merge = rest.find((c) => c.key === next.key)
      if (merge) return rest.map((c) => (c.key === next.key ? { ...c, quantity: Math.min(MAX_QTY, c.quantity + next.quantity) } : c))
      const idx = cur.findIndex((c) => c.key === key)
      const out = [...rest]
      out.splice(idx, 0, next)
      return out
    })
  }, [])

  const remove = useCallback((key: string) => setItems((cur) => cur.filter((c) => c.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])
  const toggleWish = useCallback(
    (id: string) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
    [],
  )

  const api = useMemo<CartApi>(() => {
    const subtotal = items.reduce((s, i) => s + (PRODUCTS.find((p) => p.id === i.productId)?.price ?? 0) * i.quantity, 0)
    const count = items.reduce((s, i) => s + i.quantity, 0)
    return { items, count, subtotal, open, setOpen, add, update, remove, clear, wishlist, toggleWish }
  }, [items, open, add, update, remove, clear, wishlist, toggleWish])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const c = useContext(CartContext)
  if (!c) throw new Error('useCart must be used inside <CartProvider>')
  return c
}
