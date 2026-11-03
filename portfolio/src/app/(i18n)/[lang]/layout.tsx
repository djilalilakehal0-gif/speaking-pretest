import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata, Document, viewportConfig } from '@/components/Document'
import { isLocale } from '@/content/i18n'

// English lives at "/", the other languages at "/fr/" and "/ar/".
export const dynamicParams = false
export const generateStaticParams = () => [{ lang: 'fr' }, { lang: 'ar' }]
export const viewport = viewportConfig

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? buildMetadata(lang) : {}
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang) || lang === 'en') notFound()
  return <Document lang={lang}>{children}</Document>
}
