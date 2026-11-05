import { Code2, Webhook } from 'lucide-react'
import { brandIcons } from '@/lib/brand-icons'
import type { TechItem } from '@/content/site'

/** Monochrome brand glyph; colour comes from `currentColor`. */
export function BrandIcon({ icon, className = 'size-5' }: { icon: TechItem['icon']; className?: string }) {
  if (icon === 'vscode') return <Code2 className={className} aria-hidden strokeWidth={1.6} />
  if (icon === 'api') return <Webhook className={className} aria-hidden strokeWidth={1.6} />
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d={brandIcons[icon].path} />
    </svg>
  )
}

/** Brand colour, lifted for legibility on a dark background. */
export function brandColor(icon: TechItem['icon']) {
  if (icon === 'vscode') return '#3ea6ff'
  if (icon === 'api') return '#22d3ee'
  const dark = ['nextjs', 'express', 'github']
  return dark.includes(icon) ? '#e8ecff' : brandIcons[icon].hex
}
