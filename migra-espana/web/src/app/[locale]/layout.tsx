import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { DICTIONARIES } from '@/i18n';
import { LOCALES, dirOf, isLocale } from '@/i18n/config';
import { I18nProvider } from '@/components/I18nProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = { title: { default: 'MIGRA ESPAÑA', template: '%s · MIGRA ESPAÑA' }, description: 'Tu camino legal — Spanish immigration information, tools and verified lawyers.' };
export const viewport: Viewport = { themeColor: '#101d35', width: 'device-width', initialScale: 1 };
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

const THEME_BOOT = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /></head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <I18nProvider locale={locale} messages={DICTIONARIES[locale]}>
          <Header />
          <main id="main">{children}</main>
        </I18nProvider>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
