import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

export const supabaseConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Mobile clients authenticate with `Authorization: Bearer <supabase access token>`; the website uses cookies. */
async function bearerToken(): Promise<string | null> {
  const h = await headers();
  const m = /^Bearer\s+([\w-]+\.[\w-]+\.[\w-]+)$/.exec(h.get('authorization') ?? '');
  return m ? m[1] : null;
}

/** Per-request client acting as the signed-in user; Row Level Security applies either way. */
export async function serverClient(): Promise<SupabaseClient> {
  const token = await bearerToken();
  if (token) {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component */ } },
    },
  });
}

export async function currentUser() {
  if (!supabaseConfigured()) return null;
  const token = await bearerToken();
  const sb = await serverClient();
  // getUser() validates the JWT with Supabase (never trust an unverified session on the server).
  const { data } = token ? await sb.auth.getUser(token) : await sb.auth.getUser();
  return data.user ?? null;
}
