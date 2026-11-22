import { fail, json, requireUser, clientIp } from '@/lib/api';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const { id } = await params;
  const sb = await serverClient();
  const { data: doc } = await sb.from('documents').select('id, storage_path').eq('id', id).eq('owner_id', a.user.id).maybeSingle();
  if (!doc) return fail(404, 'not_found');
  const db = adminClient();
  await db.from('document_access_logs').insert({ document_id: id, actor_id: a.user.id, action: 'delete', ip: clientIp(req) });
  await db.storage.from('vault').remove([doc.storage_path]);          // remove the object first; DB row last
  const { error } = await sb.from('documents').delete().eq('id', id);
  return error ? fail(500, 'db_error') : json({ ok: true });
}
