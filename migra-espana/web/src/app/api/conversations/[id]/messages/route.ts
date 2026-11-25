import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { looksLikeIdentifier, SendMessage } from '@/lib/messaging/schemas';
import { rateLimit } from '@/lib/ai/rate-limit';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const { id } = await params; if (!UUID.test(id)) return fail(404, 'not_found');
  const sb = await serverClient();
  const { data, error } = await sb.from('messages').select('id, sender_id, body, created_at, read_at').eq('conversation_id', id).order('created_at').limit(500);
  if (error) return fail(500, 'db_error');
  // mark incoming messages read (RLS: recipient only; trigger forbids touching anything else)
  await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', id).neq('sender_id', a.user.id).is('read_at', null);
  return json((data ?? []).map((m) => ({ ...m, mine: m.sender_id === a.user.id })));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const { id } = await params; if (!UUID.test(id)) return fail(404, 'not_found');
  if (!rateLimit(`msg:${a.user.id}`, 30)) return fail(429, 'rate_limited');
  const p = await parse(req, SendMessage); if (!p.ok) return p.res;
  // Identifiers belong in the vault (consent + access log), not in chat history.
  if (looksLikeIdentifier(p.data.body)) return fail(422, 'identifier_in_message');

  const sb = await serverClient();
  const { data: conv } = await sb.from('conversations').select('client_id, lawyer_id').eq('id', id).maybeSingle();
  if (!conv) return fail(404, 'not_found');
  const { data, error } = await sb.from('messages').insert({ conversation_id: id, sender_id: a.user.id, body: p.data.body }).select('id, created_at').single();
  if (error) return fail(error.code === '42501' ? 403 : 500, error.code === '42501' ? 'forbidden' : 'db_error');

  // Notify the other party (best effort; never fails the send).
  try {
    const to = conv.client_id === a.user.id ? conv.lawyer_id : conv.client_id;
    if (to) await adminClient().from('notifications').insert({ user_id: to, kind: 'message', title: { es: 'Nuevo mensaje', en: 'New message', fr: 'Nouveau message', ar: 'رسالة جديدة' }, link: `/messages?c=${id}` });
  } catch { /* ignore */ }
  return json(data, 201);
}
