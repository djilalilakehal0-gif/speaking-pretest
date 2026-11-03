import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import '@fontsource-variable/readex-pro'
import { contact, site } from '@/content/site'
import { getDictionary, localeMeta, locales, type Locale } from '@/content/i18n'
import '@/app/globals.css'

/** Absolute URL of a page in a given language. */
export const pageUrl = (l: Locale) => `${site.url}${localeMeta[l].path}`

export function buildMetadata(lang: Locale): Metadata {
  const t = getDictionary(lang)
  const ogImage = { url: `${site.url}/img/og.jpg`, width: 1200, height: 630, alt: t.meta.ogAlt }
  return {
    metadataBase: new URL(`${site.url}/`),
    title: t.meta.title,
    description: t.meta.description,
    applicationName: site.brand,
    authors: [{ name: site.name }],
    creator: site.name,
    keywords: ['Software Developer', 'Full-Stack Engineer', 'React', 'Next.js', 'TypeScript', 'Node.js', 'Portfolio', site.name],
    alternates: {
      canonical: pageUrl(lang),
      languages: { ...Object.fromEntries(locales.map((l) => [l, pageUrl(l)])), 'x-default': pageUrl('en') },
    },
    openGraph: {
      type: 'website',
      url: pageUrl(lang),
      siteName: site.brand,
      title: t.meta.title,
      description: t.meta.description,
      images: [ogImage],
      locale: localeMeta[lang].og,
      alternateLocale: locales.filter((l) => l !== lang).map((l) => localeMeta[l].og),
    },
    twitter: { card: 'summary_large_image', title: t.meta.title, description: t.meta.description, images: [ogImage.url] },
    robots: { index: true, follow: true },
  }
}

export const viewportConfig = {
  themeColor: '#04060d',
  colorScheme: 'dark' as const,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export function Document({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const t = getDictionary(lang)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: t.site.title,
    url: pageUrl(lang),
    image: `${site.url}/img/portrait.jpg`,
    ...(contact.phone ? { telephone: contact.phone } : {}),
  }
  return (
    <html lang={lang} dir={localeMeta[lang].dir} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed start-4 top-4 z-[200] -translate-y-24 rounded-full bg-white px-5 py-3 text-sm font-medium text-bg transition-transform focus:translate-y-0"
        >
          {t.ui.skip}
        </a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  )
}
