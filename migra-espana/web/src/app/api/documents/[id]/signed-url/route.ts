import { fail, json, requireUser, clientIp } from '@/lib/api';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';
import { SIGNED_URL_TTL_SECONDS } from '@/lib/documents/validation';

/**
 * Short-lived signed URL. Access = owner OR an unexpired, unrevoked grant. The RLS-scoped select below proves it
 * (documents_owner / docs_granted_read policies); every issuance is written to document_access_logs.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const { id } = await params;
  const sb = await serverClient();
  const { data: doc } = await sb.from('documents').select('id, storage_path, owner_id').eq('id', id).maybeSingle();
  if (!doc) return fail(404, 'not_found');           // same answer for "missing" and "forbidden": no existence oracle

  const db = adminClient();
  await db.from('document_access_logs').insert({ document_id: doc.id, actor_id: a.user.id, action: 'download', ip: clientIp(req) });
  const { data, error } = await db.storage.from('vault').createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return fail(500, 'storage_error');
  return json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
