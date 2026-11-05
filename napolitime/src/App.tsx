import { MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CartProvider } from './lib/cart'
import type { Product } from './data/menu'
import { Loader } from './components/Loader'
import { Navbar, MobileCartBar } from './components/Navbar'
import { CartDrawer } from './components/CartDrawer'
import { AddedToast } from './components/AddedToast'
import { ProductModal } from './components/ProductModal'
import { Hero, Marquee } from './sections/Hero'
import { Story } from './sections/Story'
import { BurgerShowcase } from './sections/BurgerShowcase'
import { Signature } from './sections/Signature'
import { Beverages } from './sections/Beverages'
import { Menu } from './sections/Menu'
import { Experience } from './sections/Experience'
import { FinalCta, Visit, Footer } from './sections/Visit'

export default function App() {
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  // Pinned sections are measured once fonts and images have settled.
  useEffect(() => {
    if (!ready) return
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [ready])

  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <Loader onDone={() => setReady(true)} />
        <Navbar />
        <main id="main">
          <Hero ready={ready} />
          <Marquee />
          <Story />
          <BurgerShowcase onOpen={setSelected} />
          <Signature onOpen={setSelected} />
          <Beverages onOpen={setSelected} />
          <Menu onOpen={setSelected} />
          <Experience />
          <FinalCta />
          <Visit />
        </main>
        <Footer />
        <ProductModal product={selected} onClose={() => setSelected(null)} />
        <CartDrawer />
        <AddedToast />
        <MobileCartBar />
      </CartProvider>
    </MotionConfig>
  )
}
