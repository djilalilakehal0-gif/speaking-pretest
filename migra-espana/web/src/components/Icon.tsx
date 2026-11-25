import { ICON, laurel } from '@/lib/ui/icons';

/** Static, trusted SVG strings from lib/ui/icons (no user input reaches them). */
export function Icon({ name }: { name: keyof typeof ICON }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: ICON[name] }} />;
}
export function Laurel({ mirror }: { mirror?: boolean }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: laurel(mirror) }} />;
}
/** Faint arc of gold stars in the corner of the page (decorative). */
export function Stars() {
  const pts = Array.from({ length: 9 }, (_, i) => { const a = ((200 + i * 14) * Math.PI) / 180; return [170 + Math.cos(a) * 140, 300 + Math.sin(a) * 140]; });
  const star = (x: number, y: number) => Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 6 : 15; const a = ((k * 36 - 90) * Math.PI) / 180; return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  return (
    <svg className="stars" viewBox="0 0 340 300" aria-hidden="true">
      <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1d48a" /><stop offset="1" stopColor="#a9842f" /></linearGradient></defs>
      {pts.map(([x, y], i) => <polygon key={i} points={star(x, y)} fill="#c7a45b" opacity=".75" />)}
    </svg>
  );
}
