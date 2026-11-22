import { z } from 'zod';
import { fail, json, parse, requireUser, clientIp } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { can, type Role } from '@/lib/rbac';

const Body = z.object({ ruleId: z.string().uuid(), lastVerifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), translationsReviewed: z.boolean() });

/** Publishing legal content: legal_editor only, MFA-enrolled, with verification date + reviewer. Audited by trigger + explicit log. */
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Body); if (!p.ok) return p.res;
  const sb = await serverClient();
  const [{ data: u }, { data: extra }] = await Promise.all([
    sb.from('users').select('role, mfa_enrolled').eq('id', a.user.id).single(),
    sb.from('admin_roles').select('role').eq('user_id', a.user.id),
  ]);
  const roles = [u?.role, ...(extra ?? []).map((r: { role: string }) => r.role)].filter(Boolean) as Role[];
  if (!can(roles, 'legal.publish')) return fail(403, 'forbidden');
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return fail(403, 'mfa_required');
  if (new Date(p.data.lastVerifiedOn) > new Date()) return fail(422, 'future_verification_date');

  const db = adminClient();
  const { error } = await db.from('legal_rules').update({
    state: 'published', status: 'active', last_verified_on: p.data.lastVerifiedOn, translations_reviewed: p.data.translationsReviewed,
    reviewed_by: a.user.id, published_at: new Date().toISOString(),
  }).eq('id', p.data.ruleId);
  if (error) return fail(422, 'publish_rejected');   // DB CHECK enforces verification date + reference + reviewer
  await db.from('audit_logs').insert({ actor_id: a.user.id, action: 'legal_rule.publish_request', entity: 'legal_rules', entity_id: p.data.ruleId, after: p.data, ip: clientIp(req) });
  return json({ ok: true });
}
