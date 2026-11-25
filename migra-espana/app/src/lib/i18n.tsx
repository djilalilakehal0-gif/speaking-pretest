import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// Shared with the website (single source of truth).
import { DICTIONARIES } from '@/i18n';
import { LOCALES, type Locale } from '@/i18n/config';

interface Ctx { locale: Locale; rtl: boolean; t: (k: string) => string; setLocale: (l: Locale) => void }
const I18n = createContext<Ctx | null>(null);
const KEY = 'locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const device = getLocales()[0]?.languageCode ?? 'es';
  const [locale, setL] = useState<Locale>((LOCALES as readonly string[]).includes(device) ? (device as Locale) : 'es');
  useEffect(() => { AsyncStorage.getItem(KEY).then((v) => { if (v && (LOCALES as readonly string[]).includes(v)) setL(v as Locale); }).catch(() => {}); }, []);
  const setLocale = useCallback((l: Locale) => { setL(l); AsyncStorage.setItem(KEY, l).catch(() => {}); }, []);
  const value = useMemo<Ctx>(() => ({
    locale, rtl: locale === 'ar', setLocale,
    // Falls back to Spanish (legal original) then English; never empty.
    t: (k) => DICTIONARIES[locale][k] ?? DICTIONARIES.es[k] ?? DICTIONARIES.en[k] ?? k,
  }), [locale, setLocale]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}
export function useI18n() { const c = useContext(I18n); if (!c) throw new Error('I18nProvider missing'); return c; }
