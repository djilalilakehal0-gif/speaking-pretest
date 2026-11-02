import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { CartProvider } from './lib/cart'
import { Loader } from './components/Loader'
import { Navbar, MobileCartBar } from './components/Navbar'
import { CartDrawer } from './components/CartDrawer'
import { AddedToast } from './components/AddedToast'
import { Hero } from './sections/Hero'
import { Featured } from './sections/Featured'
import { Menu } from './sections/Menu'
import { Story, Quality } from './sections/Story'
import { BestSellers, Offers, Reviews } from './sections/Promo'
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
          <Featured />
          <Menu />
          <Story />
          <Quality />
          <BestSellers />
          <Offers />
          <Reviews />
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
