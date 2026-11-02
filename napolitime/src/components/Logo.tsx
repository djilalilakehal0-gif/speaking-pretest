import { motion, useReducedMotion } from 'framer-motion'

/**
 * NAPOLITIME mark: a Neapolitan pizza seen as a clock face — "Napoli" + "time".
 * The missing slice doubles as the clock hand; it sweeps on hover and in the loader.
 */
export function LogoMark({ size = 40, spin = false, className }: { size?: number; spin?: boolean; className?: string }) {
  const reduced = useReducedMotion()
  const ticks = Array.from({ length: 12 }, (_, i) => i)
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22.5" fill="#101010" stroke="#F5B942" strokeWidth="1.5" />
      {ticks.map((i) => (
        <line key={i} x1="24" y1="3.6" x2="24" y2={i % 3 === 0 ? 6.4 : 5.2} stroke="#F5B942" strokeWidth={i % 3 === 0 ? 1.4 : 0.8} strokeLinecap="round" transform={`rotate(${i * 30} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="16.5" fill="#E8A33A" />
      <circle cx="24" cy="24" r="13.6" fill="#E63932" />
      <circle cx="18.5" cy="27.5" r="2.6" fill="#FFF3DF" />
      <circle cx="28.5" cy="29" r="2.1" fill="#FFF3DF" />
      <circle cx="19.5" cy="19" r="1.8" fill="#FFF3DF" />
      <path d="M27.5 22.5c1.4-.9 3-.6 3.6.3-1 .9-2.6 1-3.6-.3Z" fill="#4E8A3A" />
      <motion.g
        style={{ originX: '24px', originY: '24px' }}
        animate={spin && !reduced ? { rotate: 360 } : { rotate: 0 }}
        transition={spin ? { duration: 2.4, ease: [0.65, 0, 0.35, 1], repeat: Infinity } : { duration: 0.6 }}
      >
        <path d="M24 24 L24 6.8 A17.2 17.2 0 0 1 38.9 15.4 Z" fill="#101010" />
        <path d="M24 24 L24 6.8" stroke="#F5B942" strokeWidth="1" />
      </motion.g>
      <circle cx="24" cy="24" r="1.7" fill="#F5B942" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group inline-flex items-center gap-2.5">
      <motion.span whileHover={{ rotate: 30 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="inline-flex">
        <LogoMark size={compact ? 34 : 40} />
      </motion.span>
      <span className="display text-[1.55rem] leading-none tracking-[0.04em] text-cream">
        NAPOLI<span className="text-tomato">TIME</span>
      </span>
    </span>
  )
}
