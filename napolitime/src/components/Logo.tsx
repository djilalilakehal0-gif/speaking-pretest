import { motion, useReducedMotion } from 'framer-motion'

const base = import.meta.env.BASE_URL

/**
 * The official NAPOLITIME badge (public/img/logo-*.webp, made by scripts/make-logo.py).
 * `spin` adds a sweeping gold ring around it (used by the loading screen).
 */
export function LogoMark({ size = 40, spin = false, className = '' }: { size?: number; spin?: boolean; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden>
      <img
        src={`${base}img/${size > 120 ? 'logo-512' : 'logo-160'}.webp`}
        alt="" width={size} height={size} decoding="async"
        className="h-full w-full rounded-full object-contain drop-shadow-[0_6px_18px_rgba(229,9,20,.25)]"
      />
      {spin && !reduced && (
        <motion.svg
          viewBox="0 0 100 100" className="absolute -inset-[8%] h-[116%] w-[116%]"
          animate={{ rotate: 360 }} transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
        >
          <circle cx="50" cy="50" r="48" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="70 232" />
          <circle cx="50" cy="50" r="48" fill="none" stroke="#E50914" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="30 272" strokeDashoffset="-150" />
        </motion.svg>
      )}
    </span>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group inline-flex items-center gap-2.5">
      <motion.span whileHover={{ rotate: -8, scale: 1.06 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="inline-flex">
        <LogoMark size={compact ? 46 : 52} />
      </motion.span>
      <span className="display text-[1.75rem] leading-none text-cream">
        NAPOLI<span className="text-tomato">TIME</span>
      </span>
    </span>
  )
}
