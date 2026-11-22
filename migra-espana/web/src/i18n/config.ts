export const LOCALES = ['es', 'en', 'fr', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);
export const dirOf = (l: Locale): 'rtl' | 'ltr' => (l === 'ar' ? 'rtl' : 'ltr');
export const LOCALE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français', ar: 'العربية' };
export const INTL_LOCALE: Record<Locale, string> = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', ar: 'ar' };
