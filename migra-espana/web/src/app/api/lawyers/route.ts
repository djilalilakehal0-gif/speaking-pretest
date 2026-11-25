import { fail, json } from '@/lib/api';
import { adminClient } from '@/lib/supabase/admin';

export const revalidate = 60;
/** Public directory: ONLY verified + listed lawyers (also enforced by RLS and a CHECK constraint). */
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json([]);   // no fabricated lawyers, ever
  const { data, error } = await adminClient()
    .from('lawyers')
    .select('id, display_name, bar_association, languages, years_experience, consultation_price_cents, currency, bio, photo_path, contact_phone, contact_whatsapp')
    .eq('listed', true).eq('verification', 'verified');
  return error ? fail(500, 'db_error') : json(data);
}
