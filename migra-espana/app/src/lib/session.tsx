import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { CONFIG, backendConfigured } from './config';
import { createApi, type Api } from './api';

/** Session tokens go to the device keychain/keystore (SecureStore); web falls back to AsyncStorage (localStorage). */
const storage = Platform.OS === 'web'
  ? AsyncStorage
  : { getItem: (k: string) => SecureStore.getItemAsync(k), setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v), removeItem: (k: string) => SecureStore.deleteItemAsync(k) };

let client: SupabaseClient | null = null;
function sb() {
  if (!backendConfigured()) return null;
  client ??= createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, { auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}

interface Ctx {
  available: boolean; session: Session | null; api: Api | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, locale: string, aiConsent: boolean) => Promise<string | null>;
  signOut: () => Promise<void>; resetPassword: (email: string) => Promise<void>;
}
const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children, override }: { children: React.ReactNode; override?: Partial<Ctx> }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const c = sb(); if (!c) return;
    c.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = c.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<Ctx>(() => {
    const c = sb();
    return {
      available: !!c, session,
      api: c ? createApi(CONFIG.apiBase, () => session?.access_token ?? null) : null,
      signIn: async (email, password) => { if (!c) return 'not_configured'; const { error } = await c.auth.signInWithPassword({ email, password }); return error?.message ?? null; },
      // Consent is timestamped in user metadata; the DB trigger copies it to user_preferences.
      signUp: async (email, password, locale, aiConsent) => {
        if (!c) return 'not_configured';
        const now = new Date().toISOString();
        const { data, error } = await c.auth.signUp({ email, password, options: { data: { locale, consent_terms_at: now, consent_ai_at: aiConsent ? now : '' } } });
        if (error) return error.message;
        return data.session ? null : 'check_email';
      },
      signOut: async () => { await c?.auth.signOut(); },
      resetPassword: async (email) => { await c?.auth.resetPasswordForEmail(email); },
      ...override,
    };
  }, [session, override]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
export function useSession() { const c = useContext(SessionCtx); if (!c) throw new Error('SessionProvider missing'); return c; }
