/**
 * NAPOLITIME animated icon set.
 * One visual language: 24×24 grid, 1.75 stroke, round caps/joins, currentColor + gold accents.
 * - `draw`  : stroke paths draw on when the icon scrolls into view (Framer Motion pathLength).
 * - `live`  : a subtle looping idle motion specific to each icon (CSS, paused for reduced motion).
 * Decorative by default (aria-hidden); pass `title` to expose a label.
 */
import { motion, useReducedMotion, type SVGMotionProps } from 'framer-motion'
import { createContext, useContext, type ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
  draw?: boolean
  live?: boolean
  title?: string
  strokeWidth?: number
}

const DrawCtx = createContext<{ draw: boolean; reduced: boolean }>({ draw: false, reduced: false })

function Svg({ size = 24, className, draw = false, title, strokeWidth = 1.75, children }: IconProps & { children: ReactNode }) {
  const reduced = !!useReducedMotion()
  return (
    <DrawCtx.Provider value={{ draw: draw && !reduced, reduced }}>
      <motion.svg
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}
        role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}
        initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.6 }}
        transition={{ staggerChildren: 0.12 }}
        overflow="visible"
      >
        {title && <title>{title}</title>}
        {children}
      </motion.svg>
    </DrawCtx.Provider>
  )
}

/** A stroke path that draws itself on when its icon enters the viewport. */
function P(props: SVGMotionProps<SVGPathElement>) {
  const { draw } = useContext(DrawCtx)
  if (!draw) return <motion.path {...props} />
  return (
    <motion.path
      {...props}
      variants={{ hidden: { pathLength: 0, opacity: 0 }, shown: { pathLength: 1, opacity: 1 } }}
      transition={{ pathLength: { duration: 0.9, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.15 } }}
    />
  )
}
function C(props: SVGMotionProps<SVGCircleElement>) {
  const { draw } = useContext(DrawCtx)
  if (!draw) return <motion.circle {...props} />
  return (
    <motion.circle
      {...props}
      variants={{ hidden: { pathLength: 0, opacity: 0 }, shown: { pathLength: 1, opacity: 1 } }}
      transition={{ pathLength: { duration: 0.9, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.15 } }}
    />
  )
}

const GOLD = '#FFFFFF'
const RED = '#C6A46C' // champagne gold accent

export function PizzaSliceIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M12 21.5 3.2 5.6a14 14 0 0 1 17.6 0Z" />
      <P d="M4.6 8.2a11.2 11.2 0 0 1 14.8 0" stroke={GOLD} />
      <C cx="10" cy="10.6" r="1.4" stroke={RED} />
      <C cx="14.2" cy="12.4" r="1.2" stroke={RED} />
      <C cx="12" cy="16.2" r="1" stroke={RED} />
    </Svg>
  )
}

export function BurgerIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M4 10.5h16a8 8 0 0 0-16 0Z" />
      <P d="M3.5 13.5c1.4 0 1.4 1.2 2.8 1.2s1.4-1.2 2.8-1.2 1.4 1.2 2.9 1.2 1.4-1.2 2.8-1.2 1.4 1.2 2.8 1.2 1.4-1.2 2.9-1.2" stroke={GOLD} />
      <P d="M4.5 17h15" stroke={RED} strokeWidth={2.4} />
      <P d="M4.5 19.5h15c0 1-1 1.8-2 1.8h-11c-1 0-2-.8-2-1.8Z" />
      <P d="M9 7.2h.01M12.5 6.4h.01M15 8h.01" stroke={GOLD} strokeWidth={2.2} />
    </Svg>
  )
}

export function ScooterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M1 21.5h4M8 21.5h12" strokeDasharray="3 3" className={p.live ? 'ico-road' : undefined} strokeOpacity={0.5} />
      <g className={p.live ? 'ico-wheel' : undefined}><C cx="6" cy="17" r="2.6" /><P d="M6 14.4v5.2M3.4 17h5.2" strokeOpacity={0.5} strokeWidth={1} /></g>
      <g className={p.live ? 'ico-wheel' : undefined}><C cx="18.5" cy="17" r="2.6" /><P d="M18.5 14.4v5.2M15.9 17h5.2" strokeOpacity={0.5} strokeWidth={1} /></g>
      <P d="M8.6 17h7.3l1.6-6.5H20M17.5 10.5 16.4 6.5H14" />
      <P d="M3 12.2h6.6v4.8" />
      <P d="M3.6 6.4h5.6v5.8H3.6Z" stroke={RED} />
    </Svg>
  )
}

export function ChefHatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M7 14.5v5.5h10v-5.5" />
      <P d="M7 14.5A4.2 4.2 0 0 1 6.4 6.2a5.6 5.6 0 0 1 11.2 0A4.2 4.2 0 0 1 17 14.5" />
      <P d="M7 17.2h10" stroke={GOLD} />
      <P d="M10 14.5v-2.4M14 14.5v-2.4" strokeOpacity={0.6} />
    </Svg>
  )
}

export function FlameIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className={p.live ? 'ico-flame' : undefined}>
        <P d="M12 22c4 0 7-2.8 7-6.8 0-4.2-3.2-6.6-4.4-10.7-.4 2.4-1.6 3.8-3 4.6C11.5 6.5 10 4 8.5 2.5 8.6 7 5 9.6 5 15.2 5 19.2 8 22 12 22Z" stroke={RED} />
      </g>
      <g className={p.live ? 'ico-flame-inner' : undefined}>
        <P d="M12 21c1.9 0 3.3-1.3 3.3-3.2 0-2-1.4-3-2-5-.5 1.4-1.6 2-2.4 2.6-.9.7-2.2 1.3-2.2 2.6 0 1.8 1.4 3 3.3 3Z" stroke={GOLD} />
      </g>
    </Svg>
  )
}

export function ClockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <C cx="12" cy="12" r="9.2" />
      <P d="M12 3.6v1.4M20.4 12H19M12 20.4V19M3.6 12H5" stroke={GOLD} />
      <g className={p.live ? 'ico-hand-h' : undefined}><P d="M12 12V8" strokeWidth={2.2} /></g>
      <g className={p.live ? 'ico-hand-m' : undefined}><P d="M12 12l3.6 2.4" stroke={RED} /></g>
    </Svg>
  )
}

export function BagIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M5 8h14l-1.1 12.1a1.6 1.6 0 0 1-1.6 1.4H7.7a1.6 1.6 0 0 1-1.6-1.4Z" />
      <P d="M8.8 10.5V6.8a3.2 3.2 0 0 1 6.4 0v3.7" stroke={GOLD} />
      <P d="M9.5 15.5 11.3 17.3 14.8 13.8" stroke={RED} />
    </Svg>
  )
}

export function PinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className={p.live ? 'ico-pin' : undefined}>
        <P d="M12 21.5s-7-6.1-7-11.6a7 7 0 0 1 14 0c0 5.5-7 11.6-7 11.6Z" />
        <C cx="12" cy="9.8" r="2.6" stroke={RED} />
      </g>
      <P d="M8.5 22.5h7" stroke={GOLD} strokeOpacity={0.6} />
    </Svg>
  )
}

export function StarIcon({ filled = true, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...p}>
      <P
        d="m12 2.8 2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3-4.6-4.4 6.3-.8Z"
        stroke="currentColor" fill={filled ? 'currentColor' : 'none'}
      />
    </Svg>
  )
}

export function LeafIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className={p.live ? 'ico-leaf' : undefined}>
        <P d="M5 19C5 10 10 4.5 20 4c-.3 9.6-5.6 15-14.5 15Z" stroke="#7FB069" />
        <P d="M5 19c3.2-4.6 6.4-7.6 10-10" />
      </g>
      <C cx="17.5" cy="18" r="2.6" stroke={RED} />
      <P d="M17.5 15.4v-1.2" stroke="#7FB069" />
    </Svg>
  )
}

export function CartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M2.5 3.5h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.5-1.2l1.5-6.3H6.2" />
      <C cx="9.5" cy="20" r="1.4" />
      <C cx="17" cy="20" r="1.4" />
    </Svg>
  )
}

export function ChatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M20.5 11.6a8.2 8.2 0 0 1-12 7.3L3.5 20.5l1.6-4.6a8.2 8.2 0 1 1 15.4-4.3Z" />
      <P d="M8.5 11.8h.01M12.2 11.8h.01M15.9 11.8h.01" stroke={GOLD} strokeWidth={2.6} />
    </Svg>
  )
}

export function PhoneIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M21 16.6v2.8a1.9 1.9 0 0 1-2 1.9A18.6 18.6 0 0 1 2.7 5.1a1.9 1.9 0 0 1 1.9-2h2.8a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L8.4 10.6a15 15 0 0 0 5 5l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.7 1.9Z" />
    </Svg>
  )
}

export function MailIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M3.5 5.5h17v13h-17Z" />
      <P d="m3.8 6 8.2 6.6L20.2 6" stroke={GOLD} />
    </Svg>
  )
}

export function InstagramIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M7.5 2.8h9a4.7 4.7 0 0 1 4.7 4.7v9a4.7 4.7 0 0 1-4.7 4.7h-9a4.7 4.7 0 0 1-4.7-4.7v-9a4.7 4.7 0 0 1 4.7-4.7Z" />
      <C cx="12" cy="12" r="4" />
      <P d="M17.4 6.6h.01" strokeWidth={2.6} stroke={GOLD} />
    </Svg>
  )
}

export function TiktokIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M14 3v11.8a3.8 3.8 0 1 1-3.8-3.8" />
      <P d="M14 3c.4 2.9 2.4 4.8 5.5 5" stroke={GOLD} />
    </Svg>
  )
}

export function FacebookIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <P d="M15.5 3h-2.4a4 4 0 0 0-4 4v2.8H6.5v3.6h2.6V21h3.6v-7.6h2.7l.6-3.6h-3.3V7.5a.9.9 0 0 1 .9-.9h1.9Z" />
    </Svg>
  )
}

/* ── Utility glyphs (no draw-on by default) ─────────────────── */

export function ArrowIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}
export function CloseIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
export function PlusIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
export function MinusIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className={className} aria-hidden>
      <path d="M5 12h14" />
    </svg>
  )
}
export function TrashIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12.6a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10 11v6M14 11v6" />
    </svg>
  )
}

/** Heart that morphs from outline to filled with a spring pop. */
export function HeartToggle({ active, size = 20 }: { active: boolean; size?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 24 24" aria-hidden
      animate={active && !reduced ? { scale: [1, 1.35, 0.9, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <motion.path
        d="M12 20.3S3.5 15.4 3.5 9.2A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.5 2.5c0 6.2-8.5 11.1-8.5 11.1Z"
        stroke={active ? RED : 'currentColor'} strokeWidth={1.8} strokeLinejoin="round"
        animate={{ fill: active ? RED : 'rgba(198,164,108,0)' }}
        transition={{ duration: 0.25 }}
      />
    </motion.svg>
  )
}

/** Plus → check morph used on add-to-cart buttons (same path command structure, so it tweens). */
export function AddMorph({ done, size = 18 }: { done: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <motion.path
        initial={false}
        animate={{ d: done ? 'M5 12.5 L10 17.5 L10 17.5 L19 7' : 'M12 5 L12 19 M5 12 L19 12' }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      />
    </svg>
  )
}

/** Hamburger ↔ close morph for the mobile navigation. */
export function MenuMorph({ open }: { open: boolean }) {
  const t = { type: 'spring' as const, stiffness: 380, damping: 30 }
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <motion.path initial={false} animate={{ d: open ? 'M6 6 L18 18' : 'M4 7 L20 7' }} transition={t} />
      <motion.path initial={false} animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }} d="M4 12 L20 12" style={{ originX: '50%' }} transition={t} />
      <motion.path initial={false} animate={{ d: open ? 'M6 18 L18 6' : 'M4 17 L14 17' }} transition={t} />
    </svg>
  )
}

export const iconSet = [
  { name: 'Pizza', Icon: PizzaSliceIcon },
  { name: 'Burger', Icon: BurgerIcon },
  { name: 'Delivery', Icon: ScooterIcon },
  { name: 'Chef', Icon: ChefHatIcon },
  { name: 'Wood fire', Icon: FlameIcon },
  { name: 'Fast', Icon: ClockIcon },
  { name: 'Takeaway', Icon: BagIcon },
  { name: 'Location', Icon: PinIcon },
  { name: 'Rated', Icon: StarIcon },
  { name: 'Fresh', Icon: LeafIcon },
  { name: 'Cart', Icon: CartIcon },
  { name: 'Contact', Icon: ChatIcon },
] as const
