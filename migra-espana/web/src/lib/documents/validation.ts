export const MAX_BYTES = 15 * 1024 * 1024;
export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

/** Magic-byte sniffing: never trust the client-supplied Content-Type. */
export function sniffMime(bytes: Uint8Array): AllowedMime | null {
  const s = (...b: number[]) => b.every((v, i) => bytes[i] === v);
  if (s(0x25, 0x50, 0x44, 0x46)) return 'application/pdf';
  if (s(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (s(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  return null;
}

export type ValidationError = 'empty' | 'too_large' | 'type_not_allowed' | 'type_mismatch';
export function validateUpload(bytes: Uint8Array, declaredMime: string): { ok: true; mime: AllowedMime } | { ok: false; error: ValidationError } {
  if (bytes.length === 0) return { ok: false, error: 'empty' };
  if (bytes.length > MAX_BYTES) return { ok: false, error: 'too_large' };
  const sniffed = sniffMime(bytes);
  if (!sniffed) return { ok: false, error: 'type_not_allowed' };
  if (declaredMime && declaredMime !== sniffed) return { ok: false, error: 'type_mismatch' };
  return { ok: true, mime: sniffed };
}

/** Storage path is namespaced by owner so the storage RLS policy (first folder = auth.uid()) holds. */
export const storagePath = (ownerId: string, docId: string, mime: AllowedMime) =>
  `${ownerId}/${docId}.${mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg'}`;

export const SIGNED_URL_TTL_SECONDS = 60;

export function expiringSoon(expiresOn: string | null, now = new Date(), days = 60): boolean {
  if (!expiresOn) return false;
  const t = new Date(expiresOn + 'T00:00:00Z').getTime();
  return t - now.getTime() <= days * 86_400_000;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\]/g, '_').replace(/[^\p{L}\p{N}._ -]/gu, '').slice(0, 120) || 'document';
}
