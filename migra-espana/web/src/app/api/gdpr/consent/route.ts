import { z } from 'zod';
import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';

/** Grant an OPTIONAL consent (timestamped). Withdrawal is DELETE /api/gdpr/request?consent=… */
const Body = z.object({ consent: z.enum(['ai', 'doc_sharing']) });
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Body); if (!p.ok) return p.res;
  const col = p.data.consent === 'ai' ? 'consent_ai_processing_at' : 'consent_doc_sharing_at';
  const sb = await serverClient();
  const { error } = await sb.from('user_preferences').update({ [col]: new Date().toISOString() }).eq('user_id', a.user.id);
  return error ? fail(500, 'db_error') : json({ ok: true });
}
