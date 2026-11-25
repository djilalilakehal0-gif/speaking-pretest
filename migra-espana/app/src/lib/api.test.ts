/// <reference types="jest" />
import { ApiError, createApi, expiringSoon, mimeFor, telUri, waUri } from './api';

const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('api client', () => {
  it('sends the Supabase token as Bearer and hits the website API', async () => {
    const f = jest.fn(() => ok([{ id: 'd1', category: 'passport', file_name: 'p.pdf', expires_on: null }]));
    const api = createApi('https://x.test', () => 'a.b.c', f as unknown as typeof fetch);
    const docs = await api.listDocuments();
    const [url, init] = (f.mock.calls[0] as unknown) as [string, RequestInit];
    expect(url).toBe('https://x.test/api/documents');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer a.b.c');
    expect(docs[0].category).toBe('passport');
  });
  it('omits Authorization when signed out', async () => {
    const f = jest.fn(() => ok([]));
    await createApi('https://x.test', () => null, f as unknown as typeof fetch).listLawyers();
    expect((((f.mock.calls[0] as unknown) as [string, RequestInit])[1].headers as Record<string, string>).Authorization).toBeUndefined();
  });
  it('maps server error codes (e.g. ID number in chat)', async () => {
    const f = jest.fn(() => ok({ error: 'identifier_in_message' }, 422));
    const p = createApi('https://x.test', () => 't', f as unknown as typeof fetch).sendMessage('c1', 'X1234567L');
    await expect(p).rejects.toMatchObject({ status: 422, code: 'identifier_in_message' });
    await expect(p).rejects.toBeInstanceOf(ApiError);
  });
  it('books in UTC ISO', async () => {
    const f = jest.fn(() => ok({}, 201));
    await createApi('https://x.test', () => 't', f as unknown as typeof fetch).book('l1', new Date(Date.UTC(2030, 0, 1, 10)), 30);
    expect(JSON.parse(((f.mock.calls[0] as unknown) as [string, RequestInit])[1].body as string)).toEqual({ lawyerId: 'l1', startsAt: '2030-01-01T10:00:00.000Z', minutes: 30 });
  });
});

describe('helpers', () => {
  it('builds tel / WhatsApp links from E.164', () => {
    expect(telUri('+34600111222')).toBe('tel:+34600111222');
    expect(waUri('+212600111222')).toBe('https://wa.me/212600111222');
  });
  it('accepts only PDF/JPG/PNG names', () => {
    expect(mimeFor('a.PDF')).toBe('application/pdf');
    expect(mimeFor('scan.jpeg')).toBe('image/jpeg');
    expect(mimeFor('x.exe')).toBeNull();
  });
  it('60-day expiry window', () => {
    const now = new Date('2026-11-22T00:00:00Z');
    expect(expiringSoon('2027-01-01', now)).toBe(true);
    expect(expiringSoon('2027-06-01', now)).toBe(false);
    expect(expiringSoon(null, now)).toBe(false);
  });
});
