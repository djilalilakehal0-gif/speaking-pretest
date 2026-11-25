import { describe, expect, it } from 'vitest';
import { looksLikeIdentifier, OpenConversation, RegisterLawyer, SendMessage } from './schemas';

describe('messaging schemas', () => {
  it('rejects empty and oversize messages', () => {
    expect(SendMessage.safeParse({ body: '   ' }).success).toBe(false);
    expect(SendMessage.safeParse({ body: 'x'.repeat(4001) }).success).toBe(false);
    expect(SendMessage.safeParse({ body: 'hola' }).success).toBe(true);
  });
  it('requires a uuid lawyer id', () => {
    expect(OpenConversation.safeParse({ lawyerId: 'nope' }).success).toBe(false);
    expect(OpenConversation.safeParse({ lawyerId: '00000000-0000-4000-8000-000000000000' }).success).toBe(true);
  });
  it('lawyer registration needs truthfulness confirmation and a language', () => {
    const ok = { displayName: 'Ana Pérez', barAssociation: 'Colegio de Abogados de Madrid', barNumber: '12345', languages: ['es'], confirmTruthful: true };
    expect(RegisterLawyer.safeParse(ok).success).toBe(true);
    expect(RegisterLawyer.safeParse({ ...ok, confirmTruthful: false }).success).toBe(false);
    expect(RegisterLawyer.safeParse({ ...ok, languages: [] }).success).toBe(false);
    expect(RegisterLawyer.safeParse({ ...ok, barNumber: '<script>' }).success).toBe(false);
  });
  it('flags identifiers pasted into chat', () => {
    expect(looksLikeIdentifier('mi NIE es X1234567L')).toBe(true);
    expect(looksLikeIdentifier('pasaporte AB1234567')).toBe(true);
    expect(looksLikeIdentifier('Hola, quisiera una cita el martes')).toBe(false);
  });
});
