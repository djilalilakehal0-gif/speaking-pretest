import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from './index';
import { LOCALES } from './config';
import { assess } from '@/lib/eligibility/engine';
import { QUESTIONS } from '@/lib/eligibility/questions';

const enKeys = Object.keys(DICTIONARIES.en);

describe('translations are complete (no partial languages)', () => {
  for (const l of LOCALES) {
    it(`${l}: same keys as English, none empty`, () => {
      const keys = Object.keys(DICTIONARIES[l]);
      expect(enKeys.filter((k) => !(k in DICTIONARIES[l]))).toEqual([]);
      expect(keys.filter((k) => !(k in DICTIONARIES.en))).toEqual([]);
      expect(keys.filter((k) => !DICTIONARIES[l][k].trim())).toEqual([]);
    });
  }
  it('Arabic does not leave Latin-only sentences (spot check of long strings)', () => {
    const latinOnly = Object.entries(DICTIONARIES.ar).filter(([k, v]) => v.length > 30 && !/[؀-ۿ]/.test(v));
    expect(latinOnly).toEqual([]);
  });
});

describe('every engine output code and questionnaire item has a translation', () => {
  it('codes', () => {
    const codes = new Set<string>();
    const answers = [
      { nationality: 'MA', arrivalDate: '2020-01-01', hasFamilyInSpain: 'yes', hasSpanishCitizenFamily: 'yes', appliedAsylum: 'yes', asylumDecision: 'refused', criminalRecord: 'yes', permitHistory: 'expired_lt2y', plansQualifyingTraining: 'yes', hasJobOffer: 'yes', hasEmpadronamiento: 'yes' },
      { nationality: 'MA', arrivalDate: '2020-01-01', hasFamilyInSpain: 'yes', appliedAsylum: 'yes', asylumDecision: 'granted', permitHistory: 'expired_gt2y', plansQualifyingTraining: 'no', hasJobOffer: 'no', hasEmpadronamiento: 'no', hasHistoricalRegistration: 'no', hasContinuousResidenceProof: 'no', criminalRecord: 'no' },
      { nationality: 'FR' }, { nationality: 'MA' }, { nationality: 'MA', arrivalDate: '2026-06-01', permitHistory: 'none' },
      { nationality: 'MA', arrivalDate: '2020-01-01', permitHistory: 'current', appliedAsylum: 'yes', asylumDecision: 'pending' },
    ] as const;
    for (const a of answers) for (const r of assess({ ...a } as never).results) {
      [...r.met, ...r.missing, ...r.notMet].forEach((c) => codes.add(`elig.code.${c}`));
      r.documents.forEach((c) => codes.add(`doc.${c}`));
      r.nextSteps.forEach((c) => codes.add(`elig.code.${c}`));
      codes.add(`pathway.${r.pathway}`);
    }
    expect([...codes].filter((k) => !(k in DICTIONARIES.en))).toEqual([]);
  });
  it('questions', () => {
    expect(QUESTIONS.filter((q) => !(`q.${q.code}` in DICTIONARIES.en)).map((q) => q.code)).toEqual([]);
  });
});
