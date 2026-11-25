/// <reference types="jest" />
// The app uses the website's engine and dictionaries directly; this guards the alias wiring.
import { assess } from '@/lib/eligibility/engine';
import { DICTIONARIES } from '@/i18n';

it('shared engine and dictionaries resolve from ../web/src', () => {
  const r = assess({ nationality: 'MA', arrivalDate: '2020-01-01', hasEmpadronamiento: 'yes', criminalRecord: 'no' }, new Date('2026-11-22T00:00:00Z'));
  expect(r.results.map((x) => x.pathway)).toContain('arraigo_social');
  expect(DICTIONARIES.ar['hero.eyebrow']).toBe('خصيصًا للمقيمين في إسبانيا بدون أوراق');
});
