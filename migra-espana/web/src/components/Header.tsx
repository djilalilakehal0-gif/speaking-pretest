'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from './I18nProvider';
import { Logo } from './Logo';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n/config';

const NAV = [['law', 'nav.law'], ['eligibility', 'nav.eligibility'], ['guides', 'nav.guides'], ['lawyers', 'nav.lawyers'], ['assistant', 'nav.assistant'], ['pricing', 'nav.pricing'], ['dashboard', 'nav.dashboard']] as const;

export function Header() {
  const { t, locale } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const switchLocale = (l: Locale) => {
    try { document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`; } catch { /* ignore */ }
    router.push(path.replace(/^\/(es|en|fr|ar)(?=\/|$)/, `/${l}`));
  };
  const toggleTheme = () => {
    const cur = document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* ignore */ }
  };

  return (
    <header className="hdr">
      <div className="wrap">
        <Link href={`/${locale}`} className="brand" aria-label="MIGRA ESPAÑA">
          <Logo size={38} /><span>MIGRA ESPAÑA<small>{t('brand.tagline')}</small></span>
        </Link>
        <button className="icon menu-btn" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        <nav id="nav" className="nav" data-open={open} aria-label="Main">
          {NAV.map(([href, key]) => (
            <Link key={href} href={`/${locale}/${href}`} aria-current={path.startsWith(`/${locale}/${href}`) ? 'page' : undefined}>{t(key)}</Link>
          ))}
        </nav>
        <select aria-label={t('nav.language')} value={locale} onChange={(e) => switchLocale(e.target.value as Locale)}>
          {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
        </select>
        <button className="icon" onClick={toggleTheme} aria-label={t('nav.theme')}>◐</button>
      </div>
    </header>
  );
}
