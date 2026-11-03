import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { site } from '@/content/site'
import './globals.css'

const ogImage = { url: '/img/og.jpg', width: 1200, height: 630, alt: `${site.name} — ${site.title}` }

export const metadata: Metadata = {
  metadataBase: new URL(site.url.endsWith('/') ? site.url : `${site.url}/`),
  title: { default: `${site.name} — ${site.title}`, template: `%s · ${site.brand}` },
  description: site.description,
  applicationName: site.brand,
  authors: [{ name: site.name }],
  creator: site.name,
  keywords: ['Software Developer', 'Full-Stack Engineer', 'React', 'Next.js', 'TypeScript', 'Node.js', 'Portfolio', site.name],
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    url: './',
    siteName: site.brand,
    title: `${site.name} — ${site.title}`,
    description: site.description,
    images: [ogImage],
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title: `${site.name} — ${site.title}`, description: site.description, images: [ogImage.url] },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#04060d',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.title,
    url: site.url,
    image: `${site.url.replace(/\/$/, '')}/img/portrait.jpg`,
  }
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-white px-5 py-3 text-sm font-medium text-bg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  )
}
