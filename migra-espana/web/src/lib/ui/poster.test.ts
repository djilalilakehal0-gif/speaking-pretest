import { describe, expect, it } from 'vitest';
import { POSTER_TEXT, SLOTS, fitSize, posterLabels } from './poster';

describe('poster localisation', () => {
  it('Arabic keeps the original artwork (no overlay); es/fr/en get 5 labels', () => {
    expect(posterLabels('ar')).toBeNull();
    for (const l of ['es', 'fr', 'en']) expect(posterLabels(l)).toHaveLength(5);
  });
  it('every translated label fits inside its slot', () => {
    for (const l of ['es', 'fr', 'en'] as const) {
      for (const lab of posterLabels(l)!) {
        for (const line of lab.lines) expect(line.length * lab.size * 0.55).toBeLessThanOrEqual(lab.slot.w + 0.5);
        expect(lab.lines.length).toBeLessThanOrEqual(2);
        expect(lab.size).toBeGreaterThanOrEqual(24);   // never unreadably small (poster px; ~11px on a phone)
      }
    }
  });
  it('slots stay inside the poster', () => {
    for (const s of [SLOTS.ribbon, ...SLOTS.signs]) { expect(s.x - s.w / 2).toBeGreaterThan(0); expect(s.x + s.w / 2).toBeLessThan(1200); }
  });
  it('fitSize shrinks long text and caps short text', () => {
    expect(fitSize('x', SLOTS.signs[0])).toBe(SLOTS.signs[0].size);
    expect(fitSize('x'.repeat(40), SLOTS.signs[0])).toBeLessThan(SLOTS.signs[0].size);
  });
  it('has copy for all three Latin languages', () => expect(Object.keys(POSTER_TEXT)).toEqual(['es', 'fr', 'en']));
});
