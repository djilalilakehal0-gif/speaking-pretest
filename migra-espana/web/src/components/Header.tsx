'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from './I18nProvider';
import { Icon, Laurel } from './Icon';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n/config';

const MAIN = [['law', 'nav.law', 'book'], ['eligibility', 'nav.eligibility', 'people'], ['guides', 'nav.guides', 'scales'], ['resources', 'help.title', 'chat']] as const;
const MORE = [['lawyers', 'nav.lawyers'], ['assistant', 'nav.assistant'], ['documents', 'nav.documents'], ['messages', 'msg.title'], ['pricing', 'nav.pricing'], ['dashboard', 'nav.dashboard']] as const;

export function Header() {
  const { t, locale } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const here = (h: string) => (path.startsWith(`/${locale}/${h}`) ? 'page' : undefined);
  const switchLocale = (l: Locale) => {
    try { document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`; } catch { /* ignore */ }
    router.push(path.replace(/^\/(es|en|fr|ar)(?=\/|$)/, `/${l}`));
  };
  return (
    <header className="site-head">
      <div className="mast">
        <div className="flag" aria-hidden="true"><i /></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="seal" src="/brand/logo.jpg" alt="" width={64} height={64} />
        <Link href={`/${locale}`} className="brandrow" aria-label="MIGRA ESPAÑA">
          <Laurel /><span><span className="wordmark" style={{ display: 'block' }}>MIGRA ESPAÑA</span><span className="tagline">{t('brand.tagline')}</span></span><Laurel mirror />
        </Link>
      </div>
      <nav className="navwrap" aria-label="Main">
        <Link className="homebtn" href={`/${locale}`}><Icon name="home" />{t('nav.home')}</Link>
        <Link className="roundbtn" href={`/${locale}/dashboard`} aria-label={t('dash.notifications')}><Icon name="bell" /></Link>
        <div className="pill-nav">{MAIN.map(([h, k, ic]) => <Link key={h} href={`/${locale}/${h}`} aria-current={here(h)}><Icon name={ic} /><span>{t(k)}</span></Link>)}</div>
      </nav>
      <div className="subrow">
        <label className="langpill"><Icon name="globe" /><select aria-label={t('nav.language')} value={locale} onChange={(e) => switchLocale(e.target.value as Locale)}>
          {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}</select><Icon name="chevronDown" /></label>
        <nav className="sublinks" aria-label="More">{MORE.map(([h, k]) => <Link key={h} href={`/${locale}/${h}`} aria-current={here(h)}>{t(k)}</Link>)}</nav>
      </div>
    </header>
  );
}
