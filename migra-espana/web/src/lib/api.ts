import { NextResponse } from 'next/server';
import { z, type ZodTypeAny } from 'zod';
import { currentUser, supabaseConfigured } from '@/lib/supabase/server';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const fail = (status: number, code: string) => json({ error: code }, status);

export async function parse<T extends ZodTypeAny>(req: Request, schema: T): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: NextResponse }> {
  let raw: unknown;
  try { raw = await req.json(); } catch { return { ok: false, res: fail(400, 'invalid_json') }; }
  const r = schema.safeParse(raw);
  return r.success ? { ok: true, data: r.data } : { ok: false, res: fail(422, 'validation_failed') };
}

/** Auth gate for API routes. Returns the validated user or a 401/503 response. */
export async function requireUser() {
  if (!supabaseConfigured()) return { res: fail(503, 'backend_not_configured') } as const;
  const user = await currentUser();
  if (!user) return { res: fail(401, 'unauthenticated') } as const;
  return { user } as const;
}

export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
