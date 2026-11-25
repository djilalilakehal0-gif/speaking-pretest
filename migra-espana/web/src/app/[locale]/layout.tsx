import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { DICTIONARIES } from '@/i18n';
import { LOCALES, dirOf, isLocale } from '@/i18n/config';
import { I18nProvider } from '@/components/I18nProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Stars } from '@/components/Icon';

export const metadata: Metadata = { title: { default: 'MIGRA ESPAÑA', template: '%s · MIGRA ESPAÑA' }, description: 'Tu camino legal — Spanish immigration information, tools and verified lawyers.' };
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#0a1530', width: 'device-width', initialScale: 1 };
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));


export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Stars />
        <I18nProvider locale={locale} messages={DICTIONARIES[locale]}>
          <Header />
          <main id="main">{children}</main>
        </I18nProvider>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
