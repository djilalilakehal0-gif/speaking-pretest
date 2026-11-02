/** Soft rising steam: blurred SVG wisps animated with CSS (hidden for reduced motion). */
export function Steam({ className = '' }: { className?: string }) {
  const wisps = [
    { x: 30, d: 'M10 120 C 0 90, 22 70, 10 45 S 14 10, 8 0', dur: 5.5, delay: 0, drift: -10 },
    { x: 46, d: 'M10 120 C 22 95, -2 75, 12 50 S 2 15, 12 0', dur: 6.5, delay: 1.6, drift: 14 },
    { x: 60, d: 'M10 120 C -2 92, 20 72, 8 48 S 18 12, 10 0', dur: 6, delay: 3.1, drift: -6 },
    { x: 38, d: 'M10 120 C 18 96, 0 70, 14 46 S 4 14, 10 0', dur: 7, delay: 4.2, drift: 18 },
    { x: 54, d: 'M10 120 C 2 98, 18 76, 6 50 S 16 16, 8 0', dur: 5.8, delay: 2.4, drift: -14 },
  ]
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {wisps.map((w, i) => (
        <svg
          key={i} viewBox="0 0 20 120" className="steam-wisp absolute bottom-0 h-[70%] w-[9%]"
          style={{ left: `${w.x}%`, ['--dur' as string]: `${w.dur}s`, ['--delay' as string]: `${w.delay}s`, ['--drift' as string]: `${w.drift}px`, filter: 'blur(6px)' }}
        >
          <path d={w.d} stroke="rgba(255,243,223,.55)" strokeWidth="7" fill="none" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  )
}
