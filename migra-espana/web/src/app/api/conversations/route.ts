import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { OpenConversation } from '@/lib/messaging/schemas';

/** List my conversations (as client or as lawyer). RLS limits rows to the two parties. */
export async function GET() {
  const a = await requireUser(); if ('res' in a) return a.res;
  const sb = await serverClient();
  const { data, error } = await sb.from('conversations').select('id, client_id, lawyer_id, created_at, lawyers(display_name), messages(body, created_at, sender_id, read_at)')
    .order('created_at', { ascending: false }).order('created_at', { referencedTable: 'messages', ascending: false }).limit(1, { referencedTable: 'messages' });
  if (error) return fail(500, 'db_error');
  const rows = (data ?? []).map((c) => {
    const last = (c.messages as { body: string; created_at: string; sender_id: string; read_at: string | null }[])?.[0] ?? null;
    return { id: c.id, withName: (c.lawyers as unknown as { display_name: string } | null)?.display_name ?? null, lawyerId: c.lawyer_id, clientId: c.client_id, last, unread: !!last && last.sender_id !== a.user.id && !last.read_at };
  });
  return json(rows);
}

/** Open (or reuse) a conversation with a verified lawyer. DB policy rejects unverified lawyers. */
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, OpenConversation); if (!p.ok) return p.res;
  const sb = await serverClient();
  const { data: existing } = await sb.from('conversations').select('id').eq('client_id', a.user.id).eq('lawyer_id', p.data.lawyerId).maybeSingle();
  if (existing) return json({ id: existing.id });
  const { data, error } = await sb.from('conversations').insert({ client_id: a.user.id, lawyer_id: p.data.lawyerId }).select('id').single();
  if (error) return fail(error.code === '42501' ? 403 : 500, error.code === '42501' ? 'lawyer_not_available' : 'db_error');
  return json({ id: data.id }, 201);
}
