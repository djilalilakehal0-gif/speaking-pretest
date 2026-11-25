/** Public build-time config (EXPO_PUBLIC_* is inlined into the bundle). Nothing secret belongs here. */
export const CONFIG = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  apiBase: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
};
export const backendConfigured = () => !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && CONFIG.apiBase);
