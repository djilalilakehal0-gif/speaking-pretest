import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export const dynamic = 'force-static'

/** /robots.txt — allow all crawlers and point them to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
