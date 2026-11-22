import { randomUUID, createHash } from 'node:crypto';
import { fail, json, requireUser } from '@/lib/api';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';
import { sanitizeFileName, storagePath, validateUpload } from '@/lib/documents/validation';

export const runtime = 'nodejs';
const CATS = ['passport','identity','empadronamiento','historical_registration','employment_contract','payslip','family_document','birth_certificate','marriage_certificate','criminal_record','training_certificate','application_receipt','administrative_decision','other'];

/** Upload to the PRIVATE vault bucket. Content is sniffed server-side; the client Content-Type is not trusted. */
export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return fail(422, 'file_required');
  const category = String(form?.get('category') ?? 'other');
  if (!CATS.includes(category)) return fail(422, 'bad_category');
  const expiresOn = (form?.get('expires_on') as string) || null;
  if (expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) return fail(422, 'bad_date');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const v = validateUpload(bytes, file.type);
  if (!v.ok) return fail(415, v.error);

  const id = randomUUID();
  const path = storagePath(a.user.id, id, v.mime);
  const db = adminClient();
  const up = await db.storage.from('vault').upload(path, bytes, { contentType: v.mime, upsert: false });
  if (up.error) return fail(500, 'storage_error');

  const sb = await serverClient();   // insert as the user so RLS enforces ownership
  const { data, error } = await sb.from('documents').insert({
    id, owner_id: a.user.id, category, file_name: sanitizeFileName(file.name), storage_path: path, mime_type: v.mime,
    size_bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), expires_on: expiresOn,
  }).select('id, category, file_name, expires_on, created_at').single();
  if (error) { await db.storage.from('vault').remove([path]); return fail(500, 'db_error'); }
  return json(data, 201);
}

export async function GET() {
  const a = await requireUser(); if ('res' in a) return a.res;
  const sb = await serverClient();
  const { data, error } = await sb.from('documents').select('id, category, file_name, mime_type, size_bytes, expires_on, created_at').eq('owner_id', a.user.id).order('created_at', { ascending: false });
  return error ? fail(500, 'db_error') : json(data);
}
