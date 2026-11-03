import { useId } from 'react'

/** DJILALI brand mark: a geometric "D" cut by a code slash. */
export function Logo({ className = 'size-8' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id={`lg-${id}`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7aa2ff" />
          <stop offset=".55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0b1022" stroke={`url(#lg-${id})`} strokeOpacity=".7" />
      <path d="M10 9h5.5a7 7 0 0 1 0 14H10V9Z" stroke={`url(#lg-${id})`} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M17.5 12.5 14 19.5" stroke="#eef1ff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
