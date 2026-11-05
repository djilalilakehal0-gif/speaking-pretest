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

/** Script-like serif wordmark: "Napoli" in ivory italic, "Time" in Italian red, Italian-flag underline. */
export function Wordmark({ className = '', flag = true }: { className?: string; flag?: boolean }) {
  return (
    <span className={`relative inline-block font-serif font-semibold italic leading-none tracking-[-0.01em] ${className}`}>
      <span>Napoli</span><span className="text-rosso">Time</span>
      {flag && <span aria-hidden className="tricolore absolute -bottom-[0.18em] left-[18%] h-[0.09em] min-h-[2px] w-[64%] rounded-full" />}
    </span>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <motion.span whileHover={{ y: -1 }} className="inline-flex items-center">
      <Wordmark className={`${compact ? 'text-[1.7rem] sm:text-[2rem]' : 'text-[2.2rem]'} text-ivory`} />
    </motion.span>
  )
}
