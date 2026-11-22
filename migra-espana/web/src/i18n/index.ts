import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { ar } from './ar';
import type { Locale } from './config';

export const DICTIONARIES: Record<Locale, Record<string, string>> = { en, es, fr, ar };

/** Falls back to Spanish (legal original) then English; never returns an empty string. */
export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let s = DICTIONARIES[locale]?.[key] || DICTIONARIES.es[key] || DICTIONARIES.en[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
export const translator = (locale: Locale) => (key: string, vars?: Record<string, string | number>) => t(locale, key, vars);
