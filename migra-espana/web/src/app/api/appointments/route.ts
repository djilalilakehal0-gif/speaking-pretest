import { z } from 'zod';
import { fail, json, parse, requireUser } from '@/lib/api';
import { serverClient } from '@/lib/supabase/server';

const Body = z.object({ lawyerId: z.string().uuid(), startsAt: z.string().datetime(), minutes: z.number().int().min(15).max(120).default(30), caseId: z.string().uuid().optional() });

export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Body); if (!p.ok) return p.res;
  const start = new Date(p.data.startsAt);
  if (start.getTime() < Date.now() + 3_600_000) return fail(422, 'too_soon');
  const sb = await serverClient();
  const { data, error } = await sb.from('appointments').insert({
    lawyer_id: p.data.lawyerId, client_id: a.user.id, case_id: p.data.caseId ?? null,
    starts_at: start.toISOString(), ends_at: new Date(start.getTime() + p.data.minutes * 60_000).toISOString(),
  }).select('id, starts_at, ends_at, status').single();
  // 23P01 = exclusion_violation from no_lawyer_overlap
  if (error) return fail(error.code === '23P01' ? 409 : 500, error.code === '23P01' ? 'slot_taken' : 'db_error');
  return json(data, 201);
}

const Patch = z.object({ id: z.string().uuid(), status: z.enum(['confirmed', 'cancelled', 'completed']) });
/** Lawyer confirms/cancels; client may cancel. RLS (appt_party_update) restricts to the two parties. */
export async function PATCH(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const p = await parse(req, Patch); if (!p.ok) return p.res;
  const sb = await serverClient();
  const { error, data } = await sb.from('appointments').update({ status: p.data.status }).eq('id', p.data.id).select('id').maybeSingle();
  return error || !data ? fail(403, 'forbidden') : json({ ok: true });
}
