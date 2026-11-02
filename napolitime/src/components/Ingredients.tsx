/** Hand-drawn ingredient illustrations used as floating accents. Decorative only. */

export function Basil({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="basil-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7FC25A" /><stop offset="1" stopColor="#2F6B2A" />
        </linearGradient>
      </defs>
      <path d="M8 56C6 30 24 8 58 6c0 30-20 50-50 50Z" fill="url(#basil-g)" />
      <path d="M8 56C22 40 36 26 54 10" stroke="#BFE3A0" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M22 41c-2-6-2-10 0-14M30 33c-1-6 0-10 2-13M38 25c0-4 1-7 3-9M26 37c6 1 10 0 14-2M34 29c5 1 9 0 12-2" stroke="#BFE3A0" strokeWidth=".9" fill="none" opacity=".5" />
    </svg>
  )
}

export function Tomato({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="28" fill="#C7261F" />
      <circle cx="32" cy="32" r="24" fill="#E63932" />
      <g fill="#F7A08A" opacity=".9">
        <path d="M32 32 18 18a20 20 0 0 1 14-6Z" /><path d="M32 32l14-14a20 20 0 0 1 6 14Z" />
        <path d="M32 32l14 14a20 20 0 0 1-14 6Z" /><path d="M32 32 18 46a20 20 0 0 1-6-14Z" />
      </g>
      <g fill="#FFE2A8">
        <ellipse cx="24" cy="20" rx="1.6" ry="2.4" /><ellipse cx="44" cy="24" rx="1.6" ry="2.4" />
        <ellipse cx="40" cy="44" rx="1.6" ry="2.4" /><ellipse cx="20" cy="40" rx="1.6" ry="2.4" />
      </g>
      <circle cx="32" cy="32" r="4" fill="#FFB199" />
      <ellipse cx="22" cy="16" rx="6" ry="2.4" fill="#fff" opacity=".25" transform="rotate(-30 22 16)" />
    </svg>
  )
}

export function Chili({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M44 14c-6 6-10 16-14 26S18 58 8 60c14 2 30-6 36-22 3-8 4-16 0-24Z" fill="#E63932" />
      <path d="M40 22c-3 8-7 18-14 26" stroke="#FF8A7A" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7" />
      <path d="M44 14c0-5 3-9 8-10M40 16c2-2 6-3 9-2" stroke="#3E7D2E" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Pepper({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="#F5B942">
        <circle cx="22" cy="24" r="9" /><circle cx="42" cy="22" r="7" /><circle cx="34" cy="42" r="10" />
      </g>
      <g fill="#FFF3DF" opacity=".55">
        <circle cx="19" cy="21" r="2.6" /><circle cx="40" cy="20" r="2" /><circle cx="31" cy="39" r="3" />
      </g>
    </svg>
  )
}
