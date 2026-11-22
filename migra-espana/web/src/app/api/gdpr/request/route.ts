import { z } from 'zod';
import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

const Body = z.object({ kind: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']) });

export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Body); if (!p.ok) return p.res;
  const sb = await serverClient();
  const { data, error } = await sb.from('data_requests').insert({ user_id: a.user.id, kind: p.data.kind }).select('id, due_on').single();
  if (error) return fail(500, 'db_error');
  // Erasure: soft-delete immediately (access revoked); hard delete by apply_retention() after 30 days.
  if (p.data.kind === 'erasure') await adminClient().from('users').update({ deleted_at: new Date().toISOString() }).eq('id', a.user.id);
  return json(data, 201);
}

/** Withdraw optional consents (AI processing / document sharing) at any time. */
export async function DELETE(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const which = new URL(req.url).searchParams.get('consent');
  if (which !== 'ai' && which !== 'doc_sharing') return fail(422, 'bad_consent');
  const sb = await serverClient();
  const col = which === 'ai' ? 'consent_ai_processing_at' : 'consent_doc_sharing_at';
  const { error } = await sb.from('user_preferences').update({ [col]: null }).eq('user_id', a.user.id);
  return error ? fail(500, 'db_error') : json({ ok: true });
}
