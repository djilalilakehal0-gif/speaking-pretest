import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { CartProvider } from './lib/cart'
import { Loader } from './components/Loader'
import { Navbar, MobileCartBar } from './components/Navbar'
import { CartDrawer } from './components/CartDrawer'
import { AddedToast } from './components/AddedToast'
import { Hero } from './sections/Hero'
import { Menu } from './sections/Menu'
import { Visit, Footer } from './sections/Visit'

export default function App() {
  const [ready, setReady] = useState(false)
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <Loader onDone={() => setReady(true)} />
        <Navbar />
        <main id="main">
          <Hero ready={ready} />
          <Menu />
          <Visit />
        </main>
        <Footer />
        <CartDrawer />
        <AddedToast />
        <MobileCartBar />
      </CartProvider>
    </MotionConfig>
  )
}
