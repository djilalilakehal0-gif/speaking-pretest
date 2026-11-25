import { describe, expect, it } from 'vitest';
import { DISCLOSURE, renderDisclosure, DISCLOSURE_VERSION } from './disclosure';

describe('pre-payment disclosure', () => {
  it('has the same number of items in every language', () => {
    const n = DISCLOSURE.es.items.length;
    for (const l of ['ar', 'fr', 'en'] as const) expect(DISCLOSURE[l].items).toHaveLength(n);
  });
  it('never claims a guaranteed outcome (all languages state it is not guaranteed)', () => {
    const forbidden = /garantiza la|asegura la|guarantee (the )?(residence|approval)|garantit l'octroi|garantee/i;
    for (const l of ['es', 'en', 'fr'] as const) expect(DISCLOSURE[l].items.join(' ')).toMatch(/no garantiza|does not guarantee|ne garantit aucun/i);
    expect(JSON.stringify(DISCLOSURE)).not.toMatch(forbidden);
  });
  it('fills plan, price and refund placeholders, leaves no braces behind', () => {
    for (const l of ['es', 'ar', 'fr', 'en'] as const) {
      const out = renderDisclosure(l, 'Premium', '9,00 €').join('\n');
      expect(out).toContain('Premium');
      expect(out).not.toMatch(/\{(plan|price|refund)\}/);
    }
  });
  it('version is set', () => expect(DISCLOSURE_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}-v\d+$/));
});
