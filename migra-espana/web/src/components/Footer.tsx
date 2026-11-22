import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { t } from '@/i18n';

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <p>© {new Date().getFullYear()} MIGRA ESPAÑA — {t(locale, 'footer.disclaimer')}</p>
        <p><Link href={`/${locale}/resources`}>{t(locale, 'nav.resources')}</Link> · <Link href={`/${locale}/privacy`}>{t(locale, 'privacy.title')}</Link> · <Link href={`/${locale}/terms`}>{t(locale, 'terms.title')}</Link></p>
      </div>
    </footer>
  );
}
