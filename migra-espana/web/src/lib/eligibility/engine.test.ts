import { describe, expect, it } from 'vitest';
import { assess, groupByBucket, monthsBetween } from './engine';
import type { Answers } from './types';

const NOW = new Date('2026-11-22T12:00:00Z');
const base: Answers = {
  nationality: 'MA', arrivalDate: '2023-01-15', hasEmpadronamiento: 'yes', hasHistoricalRegistration: 'no',
  hasContinuousResidenceProof: 'yes', criminalRecord: 'no', hasJobOffer: 'yes', hasFamilyInSpain: 'no',
  hasChildrenInSpain: 'no', hasSpanishCitizenFamily: 'no', appliedAsylum: 'no', receivedRefusal: 'no',
  previousApplication: 'no', hasLawyer: 'no', plansQualifyingTraining: 'no', permitHistory: 'none',
};
const get = (a: Answers, id: string) => assess(a, NOW).results.find((r) => r.pathway === id);

describe('monthsBetween', () => {
  it('counts whole months and respects day-of-month', () => {
    expect(monthsBetween('2024-11-22', NOW)).toBe(24);
    expect(monthsBetween('2024-11-23', NOW)).toBe(23);
  });
  it('rejects future / invalid dates', () => {
    expect(monthsBetween('2030-01-01', NOW)).toBeNull();
    expect(monthsBetween('not-a-date', NOW)).toBeNull();
  });
});

describe('arraigo thresholds (24 months)', () => {
  it('23 months → not_met, 24 months → eligible-capable', () => {
    expect(get({ ...base, arrivalDate: '2024-11-23' }, 'arraigo_sociolaboral')?.bucket).toBe('not_met');
    expect(get({ ...base, arrivalDate: '2024-11-22' }, 'arraigo_sociolaboral')?.met).toContain('residence_24');
  });
});

describe('arraigo sociolaboral', () => {
  it('with job offer + proof + clean record still asks to verify contract conditions (never auto-"eligible")', () => {
    const r = get(base, 'arraigo_sociolaboral')!;
    expect(r.met).toEqual(expect.arrayContaining(['residence_24', 'residence_proof', 'job_offer_declared']));
    expect(r.missing).toContain('contract_conditions_check');
    expect(r.bucket).toBe('needs_info');
  });
  it('without a job offer needs a contract rather than being rejected', () => {
    const r = get({ ...base, hasJobOffer: 'no' }, 'arraigo_sociolaboral')!;
    expect(r.bucket).toBe('needs_info');
    expect(r.missing).toContain('job_contract_needed');
  });
});

describe('arraigo social', () => {
  it('without family ties asks for the integration report', () => {
    expect(get(base, 'arraigo_social')!.missing).toContain('integration_report');
  });
  it('with family ties notes the relative must hold residence', () => {
    const r = get({ ...base, hasFamilyInSpain: 'yes' }, 'arraigo_social')!;
    expect(r.met).toContain('family_ties_declared');
    expect(r.missing).toContain('family_member_must_hold_residence');
  });
});

describe('sensitive circumstances never auto-reject', () => {
  it('criminal record → lawyer review + needs_info, not not_met', () => {
    const res = assess({ ...base, criminalRecord: 'yes' }, NOW);
    expect(res.needsLawyerReview).toBe(true);
    expect(res.lawyerReviewReasons).toContain('criminal_record');
    expect(res.results.find((r) => r.pathway === 'arraigo_social')!.bucket).toBe('needs_info');
  });
  it('previous refusal flags lawyer review', () => {
    expect(assess({ ...base, receivedRefusal: 'yes' }, NOW).lawyerReviewReasons).toContain('previous_refusal');
  });
  it('pending asylum adds interaction check and international protection result', () => {
    const res = assess({ ...base, appliedAsylum: 'yes', asylumDecision: 'pending' }, NOW);
    expect(res.results.find((r) => r.pathway === 'arraigo_social')!.missing).toContain('asylum_interaction');
    expect(res.results.find((r) => r.pathway === 'international_protection')).toBeTruthy();
    expect(res.needsLawyerReview).toBe(true);
  });
});

describe('unanswered is not "no"', () => {
  it('missing arrival date → needs_info', () => {
    const r = get({ nationality: 'MA' }, 'arraigo_social')!;
    expect(r.bucket).toBe('needs_info');
    expect(r.missing).toContain('arrival_date_needed');
  });
});

describe('segunda oportunidad (art. 127.a)', () => {
  it('only shown after a recently expired permit', () => {
    expect(get(base, 'arraigo_segunda_oportunidad')).toBeUndefined();
    expect(get({ ...base, permitHistory: 'expired_lt2y' }, 'arraigo_segunda_oportunidad')!.met).toContain('prior_permit_lt2y');
    expect(get({ ...base, permitHistory: 'expired_gt2y' }, 'arraigo_segunda_oportunidad')!.bucket).toBe('not_met');
  });
});

describe('family regimes & EU nationals', () => {
  it('Spanish citizen relative → separate pathway', () => {
    expect(get({ ...base, hasSpanishCitizenFamily: 'yes' }, 'family_of_spanish_citizen')).toBeTruthy();
  });
  it('EU nationals get the EU regime and no arraigo', () => {
    const res = assess({ ...base, nationality: 'FR' }, NOW);
    expect(res.results.map((r) => r.pathway)).toEqual(['eu_regime']);
  });
});

describe('grouping', () => {
  it('buckets are exhaustive and disjoint', () => {
    const res = assess({ ...base, arrivalDate: '2025-06-01' }, NOW);
    const g = groupByBucket(res);
    expect(g.eligible.length + g.needs_info.length + g.not_met.length).toBe(res.results.length);
  });
  it('always carries the disclaimer key and snapshot date', () => {
    const res = assess(base, NOW);
    expect(res.disclaimerKey).toBe('elig.disclaimer');
    expect(res.rulesSnapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
