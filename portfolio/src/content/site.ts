/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SHARED PORTFOLIO DATA (same in every language): links, contact, photos,
 *  tech stack, projects, numbers.
 *  All visible TEXT lives in src/content/locales/{en,fr,ar}.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { BrandIconKey } from '@/lib/brand-icons'

const REPO = 'https://github.com/djilalilakehal0-gif/speaking-pretest'
const PAGES = 'https://djilalilakehal0-gif.github.io/speaking-pretest'

export const site = {
  brand: 'DJILALI',
  name: 'Djilali',
  /** Absolute URL of the English home page (other languages live at /fr/ and /ar/). */
  url: (process.env.NEXT_PUBLIC_SITE_URL || `${PAGES}/portfolio`).replace(/\/$/, ''),
  /** Official portrait (public/img). Replace the files to change the photo everywhere. */
  portrait: {
    src: '/img/portrait.webp',
    srcSmall: '/img/portrait-sm.webp',
    fallback: '/img/portrait.jpg',
    avatar: '/img/avatar.webp',
    width: 800,
    height: 1200,
  },
}

/**
 * Contact details. Leave a value empty ("") to hide it everywhere.
 * `email` is also used as the fallback for the contact form when no endpoint is configured.
 */
export const contact = {
  email: '', // e.g. 'hello@yourdomain.com'
  /** Phone in international format (digits only after +). Empty = hidden. */
  phone: '+33755244752',
  phoneDisplay: '+33 7 55 24 47 52',
  /** Public form endpoint (Formspree, Getform, your own function). Set NEXT_PUBLIC_CONTACT_ENDPOINT. */
  endpoint: process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || '',
}

export type SocialKey = 'github' | 'linkedin' | 'x' | 'dribbble' | 'instagram'
export const socials: { key: SocialKey; label: string; href: string }[] = [
  { key: 'github', label: 'GitHub', href: 'https://github.com/djilalilakehal0-gif' },
  { key: 'linkedin', label: 'LinkedIn', href: '' }, // add your profile URL to show it
  { key: 'x', label: 'X / Twitter', href: '' },
  { key: 'instagram', label: 'Instagram', href: '' },
].filter((s) => s.href) as { key: SocialKey; label: string; href: string }[]

/** Section ids in page order (labels come from the dictionaries). */
export const navIds = ['about', 'stack', 'work', 'services', 'journey', 'contact'] as const
export type NavId = (typeof navIds)[number]

export type TechItem = { name: string; icon: BrandIconKey | 'vscode' | 'api' }
export type StackKey = 'frontend' | 'backend' | 'databases' | 'tools'
export const stack: { key: StackKey; items: TechItem[] }[] = [
  {
    key: 'frontend',
    items: [
      { name: 'React', icon: 'react' },
      { name: 'Next.js', icon: 'nextjs' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'HTML5', icon: 'html5' },
      { name: 'CSS3', icon: 'css' },
      { name: 'Tailwind CSS', icon: 'tailwind' },
    ],
  },
  {
    key: 'backend',
    items: [
      { name: 'Node.js', icon: 'nodejs' },
      { name: 'Express', icon: 'express' },
      { name: 'Python', icon: 'python' },
      { name: 'REST APIs', icon: 'api' },
    ],
  },
  {
    key: 'databases',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'MongoDB', icon: 'mongodb' },
      { name: 'Supabase', icon: 'supabase' },
    ],
  },
  {
    key: 'tools',
    items: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github' },
      { name: 'Docker', icon: 'docker' },
      { name: 'Figma', icon: 'figma' },
      { name: 'VS Code', icon: 'vscode' },
    ],
  },
]

/**
 * Statistics in the About section. Every value must be true for you.
 * `value: null` hides a stat (e.g. add your years of experience when you want it shown).
 */
export type StatKey = 'projects' | 'tech' | 'platforms' | 'years'
export const stats: { key: StatKey; value: number | null; suffix?: string }[] = [
  { key: 'projects', value: 3, suffix: '+' },
  { key: 'tech', value: stack.reduce((n, c) => n + c.items.length, 0) },
  { key: 'platforms', value: 3 },
  { key: 'years', value: null, suffix: '+' },
]

export type ProjectId = 'napolitime' | 'devspace' | 'nexora'
export type Project = {
  id: ProjectId
  n: string
  title: string
  tags: string[]
  /** Screenshot in /public (optional). Without it a designed preview is rendered. */
  image?: string
  /** true = demonstration concept, labelled as such until replaced with real work. */
  concept: boolean
  live?: string
  source?: string
  accent: string
}
export const projects: Project[] = [
  {
    id: 'napolitime',
    n: '01',
    title: 'NAPOLITIME',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Capacitor'],
    image: '/img/projects/napolitime.webp',
    concept: false,
    live: `${PAGES}/napolitime/`,
    source: `${REPO}/tree/main/napolitime`,
    accent: '#ff7a45',
  },
  {
    id: 'devspace',
    n: '02',
    title: 'DEVSPACE',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Charts'],
    concept: true,
    accent: '#5b8cff',
  },
  {
    id: 'nexora',
    n: '03',
    title: 'NEXORA',
    tags: ['Next.js', 'Node.js', 'MongoDB', 'Stripe-ready'],
    concept: true,
    accent: '#a77bff',
  },
]

export type ServiceKey = 'web' | 'stack' | 'ui' | 'perf'
export const services: ServiceKey[] = ['web', 'stack', 'ui', 'perf']

/** Journey timeline — real milestones only (text per language in the dictionaries). */
export type JourneyKey = 'napolitime' | 'store' | 'pretest'
export const journey: { key: JourneyKey; link?: string }[] = [
  { key: 'napolitime', link: `${PAGES}/napolitime/` },
  { key: 'store', link: `${PAGES}/djilali/` },
  { key: 'pretest', link: `${PAGES}/` },
]
