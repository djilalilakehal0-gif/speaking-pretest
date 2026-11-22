/** MIGRA ESPAÑA seal: a laurel-ringed shield with an arch of two columns forming an "M" — European legal heritage. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="MIGRA ESPAÑA" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e6cb8e" /><stop offset="1" stopColor="#b8913f" /></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#101d35" stroke="url(#lg)" strokeWidth="1.5" />
      <path d="M32 9 50 15v15c0 11-7.6 18.4-18 23C21.600 48.400 14 41 14 30V15L32 9Z" fill="none" stroke="url(#lg)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M21 41V25.500L32 34l11-8.500V41" stroke="url(#lg)" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 25.500c3-6.500 19-6.500 22 0" stroke="url(#lg)" strokeWidth="1.600" strokeLinecap="round" />
      <path d="M17 44h30" stroke="url(#lg)" strokeWidth="1.600" strokeLinecap="round" />
    </svg>
  );
}
