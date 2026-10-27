import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Crescent, Menu, Close, Sparkle } from './Icons.jsx';
import { useApp } from '../lib/state.jsx';

const LINKS = [
  { to: '/#library', label: 'المكتبة' },
  { to: '/#popular', label: 'الأكثر مشاهدة' },
  { to: '/#favorites', label: 'المفضلة' },
  { to: '/#suggested', label: 'مقترحة لك' },
  { to: '/#verses', label: 'آيات الطمأنينة' },
  { to: '/contact', label: 'اتصل بنا' },
];
const FX_LABEL = { full: 'كاملة', lite: 'مخففة', off: 'متوقفة' };
const FX_NEXT = { full: 'lite', lite: 'off', off: 'full' };

export default function Header() {
  const [open, setOpen] = useState(false);
  const { fx, setFx } = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const go = (to) => (e) => {
    setOpen(false);
    if (to.startsWith('/#')) {
      e.preventDefault();
      if (pathname === '/') document.getElementById(to.slice(2))?.scrollIntoView({ behavior: fx === 'off' ? 'auto' : 'smooth' });
      else { nav('/'); setTimeout(() => document.getElementById(to.slice(2))?.scrollIntoView(), 120); }
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)} aria-label="نور اليقين — الصفحة الرئيسية">
          <Crescent />
          <span className="text-xl font-extrabold gold-text">نور اليقين</span>
          <span className="hidden rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold-soft sm:inline">whbo94</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={go(l.to)} className="rounded-full px-3 py-2 text-sm text-ivory/80 transition hover:bg-white/10 hover:text-gold-soft">{l.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setFx(FX_NEXT[fx])} title="التحكم في المؤثرات البصرية"
            className="flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 text-xs text-gold-soft hover:bg-white/10">
            <Sparkle width={14} height={14} /> المؤثرات: {FX_LABEL[fx]}
          </button>
          <button type="button" className="rounded-full p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="القائمة">
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="glass border-x-0 border-b-0 px-4 py-3 lg:hidden" aria-label="القائمة">
          <ul className="grid gap-1">
            {LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} onClick={go(l.to)} className="block rounded-xl px-3 py-3 text-ivory/90 hover:bg-white/10">{l.label}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
