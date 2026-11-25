import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { ContactFields } from '@/lib/messaging/contact';

/** A lawyer edits or WITHDRAWS their public contact. Sending no numbers removes both and clears the consent timestamp. */
export async function PATCH(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, ContactFields); if (!p.ok) return p.res;
  const phone = p.data.contactPhone ?? null, wa = p.data.contactWhatsapp ?? null;
  const sb = await serverClient();
  const { data, error } = await sb.from('lawyers').update({ contact_phone: phone, contact_whatsapp: wa, contact_consent_at: phone || wa ? new Date().toISOString() : null }).eq('id', a.user.id).select('id').maybeSingle();
  if (error) return fail(422, 'rejected');
  return data ? json({ ok: true }) : fail(404, 'not_a_lawyer');
}
