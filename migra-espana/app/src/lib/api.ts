/** Client for the website's /api/* routes, authenticated with the Supabase access token (Bearer). */
export class ApiError extends Error { constructor(public status: number, public code: string) { super(`${status} ${code}`); } }

export interface VaultDoc { id: string; category: string; file_name: string; expires_on: string | null }
export interface Lawyer { id: string; display_name: string; bar_association: string; languages: string[]; consultation_price_cents: number | null; currency: string; contact_phone: string | null; contact_whatsapp: string | null }
export interface Conversation { id: string; withName: string | null; last: { body: string } | null; unread: boolean }
export interface Message { id: string; body: string; created_at: string; mine: boolean }
export interface UploadFile { uri: string; name: string; mimeType: string }

export const telUri = (e164: string) => `tel:${e164}`;
export const waUri = (e164: string) => `https://wa.me/${e164.replace(/^\+/, '')}`;
/** Same 60-day reminder window as the website. */
export const expiringSoon = (d: string | null, now = new Date()) => !!d && new Date(d + 'T00:00:00Z').getTime() - now.getTime() <= 60 * 86_400_000;
export const MAX_BYTES = 15 * 1024 * 1024;
export function mimeFor(name: string): string | null {
  const n = name.toLowerCase();
  return n.endsWith('.pdf') ? 'application/pdf' : n.endsWith('.png') ? 'image/png' : /\.jpe?g$/.test(n) ? 'image/jpeg' : null;
}

export function createApi(base: string, token: () => string | null, f: typeof fetch = fetch) {
  const headers = (extra: Record<string, string> = {}) => { const t = token(); return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };
  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const r = await f(base + path, { ...init, headers: headers(init.headers as Record<string, string>) });
    const text = await r.text();
    if (!r.ok) { let code = 'error'; try { code = JSON.parse(text).error ?? code; } catch { /* not json */ } throw new ApiError(r.status, code); }
    return (text ? JSON.parse(text) : null) as T;
  }
  const json = (body: unknown, method = 'POST'): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return {
    listDocuments: () => call<VaultDoc[]>('/api/documents'),
    uploadDocument: (file: UploadFile, category: string, expiresOn?: string) => {
      const fd = new FormData();
      // React Native's FormData accepts {uri,name,type}; the server re-validates by sniffing bytes.
      fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
      fd.append('category', category);
      if (expiresOn) fd.append('expires_on', expiresOn);
      return call<{ id: string }>('/api/documents', { method: 'POST', body: fd });
    },
    signedUrl: async (id: string) => (await call<{ url: string }>(`/api/documents/${id}/signed-url`)).url,
    deleteDocument: (id: string) => call<unknown>(`/api/documents/${id}`, { method: 'DELETE' }),
    listLawyers: () => call<Lawyer[]>('/api/lawyers'),
    openConversation: async (lawyerId: string) => (await call<{ id: string }>('/api/conversations', json({ lawyerId }))).id,
    listConversations: () => call<Conversation[]>('/api/conversations'),
    messages: (id: string) => call<Message[]>(`/api/conversations/${id}/messages`),
    sendMessage: (id: string, body: string) => call<unknown>(`/api/conversations/${id}/messages`, json({ body })),
    book: (lawyerId: string, startsAt: Date, minutes = 30) => call<unknown>('/api/appointments', json({ lawyerId, startsAt: startsAt.toISOString(), minutes })),
  };
}
export type Api = ReturnType<typeof createApi>;
