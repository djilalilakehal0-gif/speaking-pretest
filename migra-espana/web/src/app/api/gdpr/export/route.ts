import { fail, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';

/** GDPR Art. 15/20: machine-readable export of the user's own data (RLS-scoped; documents listed by metadata only). */
export async function GET() {
  const a = await requireUser(); if ('res' in a) return a.res;
  const sb = await serverClient();
  const tables = ['users', 'user_profiles', 'user_preferences', 'eligibility_assessments', 'immigration_cases', 'documents', 'appointments', 'payments', 'subscriptions', 'notifications'] as const;
  const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
  for (const t of tables) {
    const { data, error } = await sb.from(t).select('*');
    if (error) return fail(500, 'db_error');
    out[t] = t === 'documents' ? (data ?? []).map(({ ocr_text, storage_path, ...rest }: Record<string, unknown>) => (void ocr_text, void storage_path, rest)) : data;
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="migra-espana-export.json"', 'Cache-Control': 'no-store' } });
}
