import type { Answers } from './types';

export type QuestionKind = 'country' | 'date' | 'yesno' | 'yesnounsure' | 'asylum' | 'permit';
export interface Question { code: keyof Answers; kind: QuestionKind; position: number; additional?: boolean }

/** Order follows the product spec (1–17); the two additional questions are needed to test verified conditions. */
export const QUESTIONS: Question[] = [
  { code: 'nationality', kind: 'country', position: 1 },
  { code: 'arrivalDate', kind: 'date', position: 2 },          // also answers Q3 (how long) — duration is derived
  { code: 'hasEmpadronamiento', kind: 'yesno', position: 4 },
  { code: 'hasHistoricalRegistration', kind: 'yesno', position: 5 },
  { code: 'hasEmploymentExperience', kind: 'yesno', position: 6 },
  { code: 'hasJobOffer', kind: 'yesno', position: 7 },
  { code: 'hasFamilyInSpain', kind: 'yesno', position: 8 },
  { code: 'hasChildrenInSpain', kind: 'yesno', position: 9 },
  { code: 'hasSpanishCitizenFamily', kind: 'yesno', position: 10 },
  { code: 'appliedAsylum', kind: 'yesno', position: 11 },
  { code: 'asylumDecision', kind: 'asylum', position: 12 },
  { code: 'criminalRecord', kind: 'yesnounsure', position: 13 },
  { code: 'hasContinuousResidenceProof', kind: 'yesno', position: 14 },
  { code: 'previousApplication', kind: 'yesno', position: 15 },
  { code: 'receivedRefusal', kind: 'yesno', position: 16 },
  { code: 'hasLawyer', kind: 'yesno', position: 17 },
  { code: 'plansQualifyingTraining', kind: 'yesno', position: 18, additional: true },
  { code: 'permitHistory', kind: 'permit', position: 19, additional: true },
];

export const ASYLUM_OPTIONS = ['none', 'pending', 'granted', 'refused'] as const;
export const PERMIT_OPTIONS = ['none', 'expired_lt2y', 'expired_gt2y', 'current'] as const;

/** Questions that are skipped when an earlier answer makes them irrelevant. */
export function isVisible(q: Question, a: Answers): boolean {
  if (q.code === 'asylumDecision') return a.appliedAsylum === 'yes';
  return true;
}
