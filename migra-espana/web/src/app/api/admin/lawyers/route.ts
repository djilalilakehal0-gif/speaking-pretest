import { z } from 'zod';
import { fail, json, parse, requireUser, clientIp } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { can, type Role } from '@/lib/rbac';

const Body = z.object({ lawyerId: z.string().uuid(), decision: z.enum(['verified', 'rejected', 'suspended']), checkedAgainst: z.string().min(3).max(200), notes: z.string().max(1000).optional() });

/** Professional verification. Admin only. `checkedAgainst` (the registry consulted) is mandatory so a human must record the check. */
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Body); if (!p.ok) return p.res;
  const sb = await serverClient();
  const [{ data: u }, { data: extra }] = await Promise.all([sb.from('users').select('role').eq('id', a.user.id).single(), sb.from('admin_roles').select('role').eq('user_id', a.user.id)]);
  const roles = [u?.role, ...(extra ?? []).map((r: { role: string }) => r.role)].filter(Boolean) as Role[];
  if (!can(roles, 'lawyers.verify')) return fail(403, 'forbidden');

  const db = adminClient();
  const verified = p.data.decision === 'verified';
  await db.from('lawyer_verifications').insert({ lawyer_id: p.data.lawyerId, status: p.data.decision, checked_against: p.data.checkedAgainst, checked_at: new Date().toISOString(), reviewer_id: a.user.id, notes: p.data.notes ?? null });
  const { error } = await db.from('lawyers').update({ verification: p.data.decision, listed: verified }).eq('id', p.data.lawyerId);
  if (error) return fail(500, 'db_error');
  // Approval grants the lawyer role (needed by messaging/doc-access policies); rejection/suspension revokes it.
  await db.from('users').update({ role: verified ? 'lawyer' : 'user' }).eq('id', p.data.lawyerId).eq('role', verified ? 'user' : 'lawyer');   // never touches staff roles
  await db.from('audit_logs').insert({ actor_id: a.user.id, action: `lawyer.${p.data.decision}`, entity: 'lawyers', entity_id: p.data.lawyerId, after: { checkedAgainst: p.data.checkedAgainst }, ip: clientIp(req) });
  return json({ ok: true });
}
