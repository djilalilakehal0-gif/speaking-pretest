import type { MetadataRoute } from 'next'
import { site } from '@/content/site'
import { localeMeta, locales } from '@/content/i18n'

export const dynamic = 'force-static'

/** /sitemap.xml — the three language versions, each listing its alternates (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (l: (typeof locales)[number]) => `${site.url}${localeMeta[l].path}`
  const languages = Object.fromEntries(locales.map((l) => [l, url(l)]))
  return locales.map((l) => ({
    url: url(l),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: l === 'en' ? 1 : 0.9,
    alternates: { languages },
  }))
}
