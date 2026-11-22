import { z } from 'zod';
import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';
import { canTransition, CASE_STATUSES, type CaseStatus } from '@/lib/case/progress';

const Create = z.object({ categorySlug: z.string().max(80).optional() });
const Update = z.object({ id: z.string().uuid(), status: z.enum(CASE_STATUSES), note: z.string().max(500).optional() });

export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Create); if (!p.ok) return p.res;
  const sb = await serverClient();
  let categoryId: string | null = null;
  if (p.data.categorySlug) {
    const { data } = await sb.from('immigration_categories').select('id').eq('slug', p.data.categorySlug).maybeSingle();
    categoryId = data?.id ?? null;
  }
  const { data, error } = await sb.from('immigration_cases').insert({ user_id: a.user.id, category_id: categoryId }).select('id, reference, status').single();
  return error ? fail(500, 'db_error') : json(data, 201);
}

/** Status changes are validated server-side against the transition table; RLS limits who may update. */
export async function PATCH(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Update); if (!p.ok) return p.res;
  const sb = await serverClient();
  const { data: cur } = await sb.from('immigration_cases').select('status').eq('id', p.data.id).maybeSingle();
  if (!cur) return fail(404, 'not_found');
  if (!canTransition(cur.status as CaseStatus, p.data.status)) return fail(409, 'invalid_transition');
  const { error } = await sb.from('immigration_cases').update({ status: p.data.status }).eq('id', p.data.id);
  return error ? fail(403, 'forbidden') : json({ ok: true });
}
