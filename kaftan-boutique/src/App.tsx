import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { CartDrawer } from './components/CartDrawer'
import { Footer, Navigation } from './components/Navigation'
import { CartProvider } from './store/cart'
import Home from './pages/Home'

const Boutique = lazy(() => import('./pages/Boutique'))
const Collection = lazy(() => import('./pages/Collection'))
const Product = lazy(() => import('./pages/Product'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const immersive = pathname === '/' || pathname === '/boutique'
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-cocoa-950">
        Skip to content
      </a>
      {!immersive && <Navigation />}
      <main id="main" className="min-h-[70dvh]">
        <Suspense fallback={<div className="shimmer h-[70dvh]" role="status" aria-label="Loading" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/new-arrivals" element={<Collection preset="new" />} />
            <Route path="/best-sellers" element={<Collection preset="best" />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {pathname !== '/boutique' && <Footer />}
      <CartDrawer />
    </>
  )
}

export default function App() {
  return (
    <CartProvider>
      <HashRouter>
        <Layout />
      </HashRouter>
    </CartProvider>
  )
}
