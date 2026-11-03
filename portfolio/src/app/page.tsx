import { Cursor } from '@/components/Cursor'
import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'
import { PageVisibility } from '@/components/PageVisibility'
import { Hero } from '@/components/hero/Hero'
import { Projects } from '@/components/projects/Projects'
import { About } from '@/components/sections/About'
import { Contact } from '@/components/sections/Contact'
import { Journey } from '@/components/sections/Journey'
import { Services } from '@/components/sections/Services'
import { Stack } from '@/components/sections/Stack'

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
        <Hero />
        <About />
        <Stack />
        <Projects />
        <Services />
        <Journey />
        <Contact />
      </main>
      <Footer />
      <div aria-hidden className="grain" />
      <Cursor />
      <PageVisibility />
    </>
  )
}
