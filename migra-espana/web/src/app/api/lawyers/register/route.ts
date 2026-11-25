import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { RegisterLawyer } from '@/lib/messaging/schemas';

/**
 * Self-registration creates a PENDING, UNLISTED profile only (RLS policy lawyers_self_insert + CHECK constraint).
 * Nothing is public and no client can contact the lawyer until an admin verifies the bar registration.
 */
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, RegisterLawyer); if (!p.ok) return p.res;
  const sb = await serverClient();
  const { error } = await sb.from('lawyers').insert({
    id: a.user.id, display_name: p.data.displayName, bar_association: p.data.barAssociation, bar_number: p.data.barNumber,
    languages: p.data.languages, bio: p.data.bio ? { es: p.data.bio } : {},
    contact_phone: p.data.contactPhone ?? null, contact_whatsapp: p.data.contactWhatsapp ?? null,
    contact_consent_at: p.data.contactPhone || p.data.contactWhatsapp ? new Date().toISOString() : null,
  });
  if (error) return fail(error.code === '23505' ? 409 : 500, error.code === '23505' ? 'already_registered' : 'db_error');
  await sb.from('lawyer_verifications').insert({ lawyer_id: a.user.id, status: 'pending' });
  return json({ status: 'pending' }, 201);
}
