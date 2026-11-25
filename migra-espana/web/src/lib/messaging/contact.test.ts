import { describe, expect, it } from 'vitest';
import { ContactFields, normalizePhone, telLink, waLink } from './contact';

describe('phone normalisation', () => {
  it('formats to E.164', () => {
    expect(normalizePhone('+34 600 111 222')).toBe('+34600111222');
    expect(normalizePhone('(+212) 600-111-222')).toBe('+212600111222');
  });
  it('rejects local/short/garbage numbers', () => {
    for (const bad of ['0600111222', '600111222', '+1', '+34 abc', '++34600111222', '']) expect(normalizePhone(bad)).toBeNull();
  });
  it('builds links', () => {
    expect(telLink('+34600111222')).toBe('tel:+34600111222');
    expect(waLink('+34600111222')).toBe('https://wa.me/34600111222');
  });
});
describe('contact fields', () => {
  it('requires consent whenever a number is given', () => {
    expect(ContactFields.safeParse({ contactPhone: '+34 600 111 222' }).success).toBe(false);
    expect(ContactFields.safeParse({ contactPhone: '+34 600 111 222', shareContact: false }).success).toBe(false);
    const ok = ContactFields.safeParse({ contactPhone: '+34 600 111 222', contactWhatsapp: '+212600111222', shareContact: true });
    expect(ok.success && ok.data.contactPhone).toBe('+34600111222');
  });
  it('empty contact is fine and invalid numbers are rejected', () => {
    expect(ContactFields.safeParse({}).success).toBe(true);
    expect(ContactFields.safeParse({ contactPhone: '12', shareContact: true }).success).toBe(false);
  });
});
