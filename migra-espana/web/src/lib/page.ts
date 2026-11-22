import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { translator } from '@/i18n';

export type P = { params: Promise<{ locale: string }> };
export async function pageCtx(params: P['params']) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale: locale as Locale, t: translator(locale as Locale) };
}
