import { z } from 'zod';
import { clientIp, fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { DISCLOSURE_VERSION } from '@/lib/payments/disclosure';

const Accept = z.object({ tier: z.enum(['premium', 'professional_legal']), locale: z.enum(['ar', 'es', 'fr', 'en']), version: z.literal(DISCLOSURE_VERSION) });

/** Records that the user saw and accepted THIS version of the disclosure, right before payment. */
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Accept); if (!p.ok) return p.res;
  const sb = await serverClient();
  const { error } = await sb.from('payment_disclosure_acceptances').insert({
    user_id: a.user.id, tier: p.data.tier, locale: p.data.locale, disclosure_version: p.data.version, ip: clientIp(req),
  });
  return error ? fail(500, 'db_error') : json({ ok: true }, 201);
}
