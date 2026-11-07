import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { STORE } from '../data/products'
import { useCart } from '../store/cart'

const LINKS = [
  { to: '/boutique', label: '3D Boutique' },
  { to: '/collection', label: 'Collection' },
  { to: '/new-arrivals', label: 'New Arrivals' },
  { to: '/best-sellers', label: 'Best Sellers' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Navigation({ overlay = false }: { overlay?: boolean }) {
  const { count, setOpen, wishlist } = useCart()
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    setMenu(false)
  }, [loc.pathname])

  return (
    <header className={`${overlay ? 'absolute' : 'sticky'} inset-x-0 top-0 z-40 ${overlay ? 'bg-gradient-to-b from-cocoa-950/80 to-transparent' : 'border-b border-champagne/10 bg-cocoa-900/90 backdrop-blur-xl'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20 md:px-8">
        <button type="button" className="btn btn-ghost !px-0 size-11 lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-menu" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
        <Link to="/" className="font-serif text-xl whitespace-nowrap tracking-[0.12em] text-beige-50 uppercase sm:text-2xl sm:tracking-[0.18em] md:text-[1.7rem]">
          {STORE.brand}
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `text-[0.68rem] tracking-[0.24em] uppercase transition-colors ${isActive ? 'text-gold-soft' : 'text-beige-200 hover:text-champagne'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link to="/collection?wishlist=1" className="relative flex size-11 items-center justify-center text-beige-100" aria-label={`Wishlist, ${wishlist.length} items`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
            </svg>
            {wishlist.length > 0 && <span className="absolute top-1.5 right-1 rounded-full bg-champagne px-1.5 text-[0.6rem] text-cocoa-950">{wishlist.length}</span>}
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="relative flex size-11 items-center justify-center text-beige-100" aria-label={`Cart, ${count} items`} data-testid="cart-button">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" />
            </svg>
            {count > 0 && (
              <span className="absolute top-1.5 right-0.5 rounded-full bg-gold px-1.5 text-[0.6rem] text-cocoa-950" data-testid="cart-count">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {menu && (
        <nav id="mobile-menu" className="border-t border-champagne/10 bg-cocoa-900/97 px-4 py-4 backdrop-blur-xl lg:hidden" aria-label="Mobile">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `block py-3 font-serif text-2xl ${isActive ? 'text-gold-soft' : 'text-beige-100'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-champagne/10 bg-cocoa-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl tracking-[0.18em] uppercase">{STORE.brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-beige-300">Luxury kaftans, presented the way a boutique would: one at a time, in warm light, close enough to see the fabric.</p>
          <p className="mt-4 text-xs text-beige-300/60">Demo storefront: prices, stock and brand details are sample content until the store owner supplies real data.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow mb-3">Shop</p>
          <Link className="block text-beige-200 hover:text-champagne" to="/collection">Collection</Link>
          <Link className="block text-beige-200 hover:text-champagne" to="/new-arrivals">New Arrivals</Link>
          <Link className="block text-beige-200 hover:text-champagne" to="/best-sellers">Best Sellers</Link>
          <Link className="block text-beige-200 hover:text-champagne" to="/boutique">3D Boutique</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow mb-3">Maison</p>
          <Link className="block text-beige-200 hover:text-champagne" to="/about">About us</Link>
          <Link className="block text-beige-200 hover:text-champagne" to="/contact">Contact</Link>
          <Link className="block text-beige-200 hover:text-champagne" to="/cart">Cart</Link>
        </div>
      </div>
    </footer>
  )
}
