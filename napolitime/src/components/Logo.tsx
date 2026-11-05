import { motion, useReducedMotion } from 'framer-motion'

const base = import.meta.env.BASE_URL

/**
 * The official NAPOLITIME badge (public/img/logo-*.webp, made by scripts/make-logo.py),
 * set inside a thin champagne-gold ring. `spin` animates the ring (loading screen).
 */
export function LogoMark({ size = 40, spin = false, className = '' }: { size?: number; spin?: boolean; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden>
      <img
        src={`${base}img/${size > 120 ? 'logo-512' : 'logo-160'}.webp`}
        alt="" width={size} height={size} decoding="async"
        className="h-full w-full rounded-full object-contain"
      />
      <svg viewBox="0 0 100 100" className="absolute -inset-[9%] h-[118%] w-[118%]">
        <circle cx="50" cy="50" r="48.5" fill="none" stroke="#C6A46C" strokeOpacity=".45" strokeWidth=".8" />
      </svg>
      {spin && !reduced && (
        <motion.svg
          viewBox="0 0 100 100" className="absolute -inset-[9%] h-[118%] w-[118%]"
          animate={{ rotate: 360 }} transition={{ duration: 2.8, ease: 'linear', repeat: Infinity }}
        >
          <circle cx="50" cy="50" r="48.5" fill="none" stroke="#C6A46C" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="60 245" />
        </motion.svg>
      )}
    </span>
  )
}

/** Serif wordmark: "Napoli" upright, "time" in gold italic. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-serif leading-none tracking-[0.02em] ${className}`}>
      <span className="font-semibold uppercase tracking-[0.14em]">Napoli</span>
      <span className="display-i ml-0.5 text-gold">time</span>
    </span>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group inline-flex items-center gap-3">
      <motion.span whileHover={{ rotate: -10, scale: 1.05 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="inline-flex">
        <LogoMark size={compact ? 38 : 46} />
      </motion.span>
      <Wordmark className="text-[1.35rem] text-ivory sm:text-[1.5rem]" />
    </span>
  )
}
