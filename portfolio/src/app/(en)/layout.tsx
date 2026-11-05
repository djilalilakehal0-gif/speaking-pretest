import { buildMetadata, Document, viewportConfig } from '@/components/Document'

export const metadata = buildMetadata('en')
export const viewport = viewportConfig

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Document lang="en">{children}</Document>
}
