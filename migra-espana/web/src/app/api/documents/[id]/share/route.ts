import { z } from 'zod';
import { fail, json, parse, requireUser, clientIp } from '@/lib/api';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';

const Grant = z.object({ lawyerId: z.string().uuid(), days: z.number().int().min(1).max(90).default(30) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Grant); if (!p.ok) return p.res;
  const { id } = await params;
  const sb = await serverClient();

  // Consent gate: sharing requires explicit, current consent.
  const { data: prefs } = await sb.from('user_preferences').select('consent_doc_sharing_at').eq('user_id', a.user.id).maybeSingle();
  if (!prefs?.consent_doc_sharing_at) return fail(403, 'sharing_consent_required');

  // Only verified lawyers may receive access.
  const db = adminClient();
  const { data: lawyer } = await db.from('lawyers').select('id').eq('id', p.data.lawyerId).eq('verification', 'verified').maybeSingle();
  if (!lawyer) return fail(422, 'lawyer_not_verified');

  const expires = new Date(Date.now() + p.data.days * 86_400_000).toISOString();
  const { error } = await sb.from('document_permissions').upsert({ document_id: id, grantee_id: lawyer.id, expires_at: expires, revoked_at: null }, { onConflict: 'document_id,grantee_id' });
  if (error) return fail(403, 'forbidden');          // RLS: only the owner can insert
  await db.from('document_access_logs').insert({ document_id: id, actor_id: a.user.id, action: 'share', ip: clientIp(req) });
  return json({ ok: true, expires });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const lawyerId = new URL(req.url).searchParams.get('lawyerId');
  if (!lawyerId) return fail(422, 'lawyer_required');
  const { id } = await params;
  const sb = await serverClient();
  const { error } = await sb.from('document_permissions').update({ revoked_at: new Date().toISOString() }).eq('document_id', id).eq('grantee_id', lawyerId);
  if (error) return fail(403, 'forbidden');
  await adminClient().from('document_access_logs').insert({ document_id: id, actor_id: a.user.id, action: 'revoke', ip: clientIp(req) });
  return json({ ok: true });
}
