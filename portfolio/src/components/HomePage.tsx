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
import { getDictionary, type Locale } from '@/content/i18n'

export function HomePage({ lang }: { lang: Locale }) {
  const t = getDictionary(lang)
  return (
    <>
      <Nav lang={lang} t={{ nav: t.nav, ui: t.ui }} />
      <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
        <Hero t={{ hero: t.hero, site: t.site, ui: t.ui }} />
        <About t={{ about: t.about, site: t.site }} />
        <Stack t={t.stack} />
        <Projects t={t.work} />
        <Services t={t.services} />
        <Journey t={t.journey} newTab={t.ui.newTab} />
        <Contact t={t.contact} site={{ availability: t.site.availability, location: t.site.location }} ui={{ newTab: t.ui.newTab, startProject: t.ui.startProject }} />
      </main>
      <Footer t={{ nav: t.nav, ui: t.ui, footer: t.footer, site: t.site }} />
      <div aria-hidden className="grain" />
      <Cursor label={t.ui.cursorView} />
      <PageVisibility />
    </>
  )
}
