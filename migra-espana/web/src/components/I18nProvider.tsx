'use client';
import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/i18n/config';

interface Ctx { locale: Locale; messages: Record<string, string> }
const C = createContext<Ctx | null>(null);

export function I18nProvider({ locale, messages, children }: Ctx & { children: React.ReactNode }) {
  const v = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
export function useI18n() {
  const c = useContext(C); if (!c) throw new Error('I18nProvider missing');
  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = c.messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
  return { t, locale: c.locale };
}
