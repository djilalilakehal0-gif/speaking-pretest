/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ALL EDITABLE PORTFOLIO CONTENT LIVES IN THIS FILE.
 *  Change text, links, projects, stack and milestones here — no component edits needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { BrandIconKey } from '@/lib/brand-icons'

const REPO = 'https://github.com/djilalilakehal0-gif/speaking-pretest'
const PAGES = 'https://djilalilakehal0-gif.github.io/speaking-pretest'

export const site = {
  brand: 'DJILALI',
  name: 'Djilali',
  title: 'Software Developer | Full-Stack Engineer',
  role: 'Full-Stack Developer',
  tagline: 'Clean code, creative engineering and interfaces that feel effortless.',
  url: process.env.NEXT_PUBLIC_SITE_URL || `${PAGES}/portfolio`,
  description:
    'Djilali — Software Developer and Full-Stack Engineer designing and building high-performance web applications and immersive digital experiences.',
  /** Official portrait (public/img). Replace the files to change the photo everywhere. */
  portrait: {
    src: '/img/portrait.webp',
    srcSmall: '/img/portrait-sm.webp',
    fallback: '/img/portrait.jpg',
    avatar: '/img/avatar.webp',
    alt: 'Djilali, software developer, standing in his workspace holding a laptop',
    width: 800,
    height: 1200,
  },
  availability: 'Available for select projects',
  location: 'Remote · Worldwide',
}

/**
 * Contact details. Leave a value empty ("") to hide that link everywhere.
 * `email` is also used as the fallback for the contact form when no endpoint is configured.
 */
export const contact = {
  email: '', // e.g. 'hello@yourdomain.com'
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

export const nav = [
  { id: 'about', label: 'About' },
  { id: 'stack', label: 'Stack' },
  { id: 'work', label: 'Work' },
  { id: 'services', label: 'Services' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
]

export const hero = {
  badge: 'Available for select projects',
  headline: ['Building Digital', 'Experiences That Feel'],
  highlight: 'Extraordinary.',
  text: 'I design and develop high-performance digital products, modern web applications, and immersive user experiences through clean code and creative engineering.',
  primaryCta: { label: 'Explore My Work', href: '#work' },
  secondaryCta: { label: "Let's Talk", href: '#contact' },
}

export const about = {
  eyebrow: 'About',
  title: 'Engineering Ideas Into Reality.',
  text: 'I’m a software developer passionate about transforming complex problems into elegant, scalable, and user-friendly digital solutions. I combine technical precision, thoughtful design, and modern engineering practices to build meaningful products.',
  pillars: [
    { n: '01', title: 'Clean Code', text: 'Maintainable, scalable, and well-structured software.' },
    { n: '02', title: 'Creative Thinking', text: 'Turning ambitious ideas into intuitive digital experiences.' },
    { n: '03', title: 'Performance First', text: 'Building fast, accessible, and reliable applications.' },
  ],
}

export type TechItem = { name: string; icon: BrandIconKey | 'vscode' | 'api' }
export const stack: { category: string; blurb: string; items: TechItem[] }[] = [
  {
    category: 'Frontend',
    blurb: 'Interfaces that are fast, accessible and pixel-precise.',
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
    category: 'Backend',
    blurb: 'APIs and services built to be predictable and scalable.',
    items: [
      { name: 'Node.js', icon: 'nodejs' },
      { name: 'Express', icon: 'express' },
      { name: 'Python', icon: 'python' },
      { name: 'REST APIs', icon: 'api' },
    ],
  },
  {
    category: 'Databases',
    blurb: 'Relational and document data, modelled with care.',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'MongoDB', icon: 'mongodb' },
      { name: 'Supabase', icon: 'supabase' },
    ],
  },
  {
    category: 'Tools',
    blurb: 'A workflow that keeps shipping smooth.',
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
 * Statistics shown in the About section. Every value must be true for you — edit freely.
 * `value: null` hides a stat (e.g. add your years of experience when you want it shown).
 */
export const stats: { label: string; value: number | null; suffix?: string }[] = [
  { label: 'Projects shipped', value: 3, suffix: '+' },
  { label: 'Technologies in my stack', value: stack.reduce((n, c) => n + c.items.length, 0) },
  { label: 'Platforms — Web, Android, iOS', value: 3 },
  { label: 'Years of experience', value: null, suffix: '+' },
]

export type ProjectVisual = 'napolitime' | 'devspace' | 'nexora'
export type Project = {
  n: string
  title: string
  category: string
  description: string
  tags: string[]
  visual: ProjectVisual
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
    n: '01',
    title: 'NAPOLITIME',
    category: 'Restaurant Website',
    description:
      'A premium restaurant experience featuring an elegant menu, modern branding, responsive layouts, and immersive food visuals.',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Capacitor'],
    visual: 'napolitime',
    image: '/img/projects/napolitime.webp',
    concept: false,
    live: `${PAGES}/napolitime/`,
    source: `${REPO}/tree/main/napolitime`,
    accent: '#ff7a45',
  },
  {
    n: '02',
    title: 'DEVSPACE',
    category: 'SaaS Dashboard',
    description:
      'A modern dashboard concept with data visualization, interactive components, and a clean productivity-focused interface.',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Charts'],
    visual: 'devspace',
    concept: true,
    accent: '#5b8cff',
  },
  {
    n: '03',
    title: 'NEXORA',
    category: 'E-commerce Platform',
    description:
      'A contemporary online shopping experience featuring product discovery, smooth navigation, and responsive product pages.',
    tags: ['Next.js', 'Node.js', 'MongoDB', 'Stripe-ready'],
    visual: 'nexora',
    concept: true,
    accent: '#a77bff',
  },
]

export type ServiceIcon = 'web' | 'stack' | 'ui' | 'perf'
export const services: { title: string; text: string; icon: ServiceIcon; points: string[] }[] = [
  {
    title: 'Website Development',
    icon: 'web',
    text: 'Fast, responsive marketing sites and landing pages with SEO and motion built in from day one.',
    points: ['Responsive & SEO-ready', 'CMS-friendly content'],
  },
  {
    title: 'Full-Stack Application Development',
    icon: 'stack',
    text: 'End-to-end web apps — from database schema and APIs to polished, production-ready interfaces.',
    points: ['REST APIs & auth', 'Web, Android & iOS'],
  },
  {
    title: 'UI/UX Implementation',
    icon: 'ui',
    text: 'Turning Figma designs into accessible, pixel-faithful components with refined micro-interactions.',
    points: ['Design systems', 'Accessible by default'],
  },
  {
    title: 'Performance Optimization',
    icon: 'perf',
    text: 'Auditing and tuning Core Web Vitals, bundle size and rendering so products feel instant.',
    points: ['Core Web Vitals', 'Smooth 60 FPS motion'],
  },
]

/**
 * Journey timeline — real milestones only. Add jobs, education or achievements as you go.
 */
export const journey: { date: string; title: string; org: string; text: string; link?: string }[] = [
  {
    date: 'Nov 2026',
    title: 'NAPOLITIME — website & Android app',
    org: 'Personal project',
    text: 'Single-page restaurant experience with an interactive menu, order flow, GSAP scroll storytelling and a Capacitor Android build.',
    link: `${PAGES}/napolitime/`,
  },
  {
    date: 'Oct 2026',
    title: 'DJILALI store landing',
    org: 'Personal project',
    text: 'An animated single-page product showcase built with React, Tailwind CSS and GSAP, deployed to GitHub Pages.',
    link: `${PAGES}/djilali/`,
  },
  {
    date: 'Oct 2026',
    title: 'Speaking Pre-Test — mobile & web app',
    org: 'Alfikr Almodi School',
    text: 'Offline English speaking test for students on Android, iOS and the web, with a teacher dashboard and in-browser speech recognition for automatic correction.',
    link: `${PAGES}/`,
  },
]

export const workflow = [
  { n: '01', title: 'Discover', text: 'Understand goals and requirements.' },
  { n: '02', title: 'Design', text: 'Create intuitive interfaces and prototypes.' },
  { n: '03', title: 'Develop', text: 'Build scalable, maintainable solutions.' },
  { n: '04', title: 'Deliver', text: 'Test, optimize, and deploy.' },
]

export const contactCopy = {
  eyebrow: 'Contact',
  title: ['Have an Idea?', "Let's Build Something Great."],
  text: "Have a project in mind or want to collaborate? Let's turn your vision into a digital experience.",
}
