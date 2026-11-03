import en, { type Dictionary } from './locales/en'
import fr from './locales/fr'
import ar from './locales/ar'

export const locales = ['en', 'fr', 'ar'] as const
export type Locale = (typeof locales)[number]
export type { Dictionary }

export const localeMeta: Record<Locale, { label: string; short: string; dir: 'ltr' | 'rtl'; path: string; og: string }> = {
  en: { label: 'English', short: 'EN', dir: 'ltr', path: '/', og: 'en_US' },
  fr: { label: 'Français', short: 'FR', dir: 'ltr', path: '/fr/', og: 'fr_FR' },
  ar: { label: 'العربية', short: 'ع', dir: 'rtl', path: '/ar/', og: 'ar_DZ' },
}

const dictionaries: Record<Locale, Dictionary> = { en, fr, ar }
export const getDictionary = (l: Locale) => dictionaries[l]
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v)

/** Replace {key} placeholders. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
