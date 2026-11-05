import { MotionConfig } from 'framer-motion'
import { CartProvider } from './lib/cart'
import { Navbar, MobileCartBar } from './components/Navbar'
import { CartDrawer } from './components/CartDrawer'
import { AddedToast } from './components/AddedToast'
import { Hero } from './sections/Hero'
import { Menu } from './sections/Menu'
import { Favourites } from './sections/Favourites'
import { Visit, Footer } from './sections/Visit'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <Navbar />
        <main id="main">
          <Hero />
          <Favourites />
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
