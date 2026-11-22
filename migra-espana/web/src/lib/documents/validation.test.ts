import { describe, expect, it } from 'vitest';
import { expiringSoon, sanitizeFileName, storagePath, validateUpload, MAX_BYTES } from './validation';

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
describe('upload validation', () => {
  it('accepts real PDF/PNG', () => {
    expect(validateUpload(pdf, 'application/pdf')).toEqual({ ok: true, mime: 'application/pdf' });
    expect(validateUpload(png, 'image/png')).toEqual({ ok: true, mime: 'image/png' });
  });
  it('rejects spoofed content type', () => expect(validateUpload(pdf, 'image/png')).toEqual({ ok: false, error: 'type_mismatch' }));
  it('rejects executables / unknown bytes', () => expect(validateUpload(new Uint8Array([0x4d, 0x5a, 0, 0]), 'application/pdf')).toEqual({ ok: false, error: 'type_not_allowed' }));
  it('rejects empty and oversize', () => {
    expect(validateUpload(new Uint8Array(), 'application/pdf')).toEqual({ ok: false, error: 'empty' });
    const big = new Uint8Array(MAX_BYTES + 1); big.set(pdf);
    expect(validateUpload(big, 'application/pdf')).toEqual({ ok: false, error: 'too_large' });
  });
});
describe('helpers', () => {
  it('storage path is owner-namespaced', () => expect(storagePath('u1', 'd1', 'image/jpeg')).toBe('u1/d1.jpg'));
  it('expiry reminder window', () => {
    const now = new Date('2026-11-22T00:00:00Z');
    expect(expiringSoon('2027-01-01', now)).toBe(true);
    expect(expiringSoon('2027-06-01', now)).toBe(false);
    expect(expiringSoon(null, now)).toBe(false);
  });
  it('sanitises path traversal in names', () => expect(sanitizeFileName('../../etc/passwd')).not.toContain('/'));
});
