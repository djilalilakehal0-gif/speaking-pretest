import { EU_EEA_CH } from './countries';
import type { Answers, Assessment, Bucket, PathwayResult } from './types';

export const ENGINE_VERSION = '1.0.0';
/**
 * Date on which the encoded rules were last compared with BOE text.
 * Source: RD 1155/2024 (BOE-A-2024-24099) as amended by RD 316/2026; consolidated text updated 22-09-2026.
 * A legal editor must bump this when rules change — see docs/LEGAL_CONTENT_GUIDE.md.
 */
export const RULES_SNAPSHOT_DATE = '2026-11-22';

/** Permanence in Spain required for arraigo social / sociolaboral / socioformativo (RD 1155/2024 preamble: two years). */
export const ARRAIGO_MIN_MONTHS = 24;

export function monthsBetween(fromISO: string, to: Date): number | null {
  const from = new Date(fromISO + 'T00:00:00Z');
  if (Number.isNaN(from.getTime()) || from > to) return null;
  let m = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) m -= 1;
  return Math.max(0, m);
}

const result = (pathway: PathwayResult['pathway']): PathwayResult => ({
  pathway, bucket: 'needs_info', met: [], missing: [], notMet: [], documents: [], nextSteps: [],
});

function proofOfResidence(a: Answers): 'yes' | 'no' | 'unknown' {
  const sig = [a.hasEmpadronamiento, a.hasHistoricalRegistration, a.hasContinuousResidenceProof];
  if (sig.includes('yes')) return 'yes';
  if (sig.every((v) => v === 'no')) return 'no';
  return 'unknown';
}

function decide(r: PathwayResult): Bucket {
  if (r.notMet.length > 0) return 'not_met';
  if (r.missing.length > 0) return 'needs_info';
  return 'eligible';
}

/**
 * Preliminary screening ONLY. Never an official decision. Pure function: deterministic and unit-tested.
 * Design rules:
 *  - unanswered ≠ "no": unanswered produces `needs_info`, not `not_met`.
 *  - sensitive circumstances (criminal record, refusal, asylum) never auto-reject; they route to lawyer review.
 */
export function assess(a: Answers, now: Date = new Date()): Assessment {
  const reasons = new Set<string>();
  const months = a.arrivalDate ? monthsBetween(a.arrivalDate, now) : null;
  const results: PathwayResult[] = [];
  const asylumPending = a.appliedAsylum === 'yes' && (a.asylumDecision === 'pending' || a.asylumDecision === undefined);
  const euNational = !!a.nationality && EU_EEA_CH.has(a.nationality);

  if (a.criminalRecord === 'yes' || a.criminalRecord === 'unsure') reasons.add('criminal_record');
  if (a.receivedRefusal === 'yes') reasons.add('previous_refusal');
  if (a.appliedAsylum === 'yes') reasons.add('asylum');
  if (a.previousApplication === 'yes') reasons.add('previous_application');

  if (euNational) {
    const r = result('eu_regime');
    r.met.push('eu_national');
    r.nextSteps.push('register_eu_certificate');
    r.documents.push('passport', 'empadronamiento');
    r.bucket = 'eligible';
    results.push(r);
  }

  // ── Arraigo family (social / sociolaboral / socioformativo share the residence + proof + record gates) ──
  const arraigoBase = (id: PathwayResult['pathway']): PathwayResult => {
    const r = result(id);
    if (months === null) r.missing.push('arrival_date_needed');
    else if (months >= ARRAIGO_MIN_MONTHS) r.met.push('residence_24');
    else r.notMet.push('residence_24');

    const proof = proofOfResidence(a);
    if (proof === 'yes') r.met.push('residence_proof');
    else if (proof === 'no') r.missing.push('residence_proof');
    else r.missing.push('residence_proof_unknown');
    r.documents.push('passport', 'empadronamiento', 'criminal_record_certificate');

    if (a.criminalRecord === 'no') r.met.push('no_record');
    else r.missing.push('record_review');   // yes/unsure/unanswered → verify, never reject

    if (asylumPending) { r.missing.push('asylum_interaction'); }
    return r;
  };

  if (!euNational) {
    // arraigo social
    const social = arraigoBase('arraigo_social');
    if (a.hasFamilyInSpain === 'yes' || a.hasChildrenInSpain === 'yes') {
      social.met.push('family_ties_declared');
      social.missing.push('family_member_must_hold_residence');
      social.documents.push('family_documents', 'means_of_subsistence');
    } else {
      social.missing.push('integration_report');
      social.documents.push('integration_report');
    }
    social.nextSteps.push('collect_documents', 'lawyer_review');
    results.push(social);

    // arraigo sociolaboral
    const labour = arraigoBase('arraigo_sociolaboral');
    if (a.hasJobOffer === 'yes') labour.met.push('job_offer_declared');
    else labour.missing.push('job_contract_needed');
    labour.missing = [...labour.missing, ...(a.hasJobOffer === 'yes' ? ['contract_conditions_check'] : [])];
    labour.documents.push('employment_contract', 'payslip');
    labour.nextSteps.push('verify_contract_conditions', 'lawyer_review');
    results.push(labour);

    // arraigo socioformativo
    const train = arraigoBase('arraigo_socioformativo');
    if (a.plansQualifyingTraining === 'yes') train.met.push('training_declared');
    else if (a.plansQualifyingTraining === 'no') train.notMet.push('training_needed');
    else train.missing.push('training_unknown');
    train.documents.push('training_certificate');
    train.nextSteps.push('verify_training_type', 'lawyer_review');
    results.push(train);

    // arraigo segunda oportunidad (verified: held non-exceptional permit within the two years before applying)
    const second = result('arraigo_segunda_oportunidad');
    if (a.permitHistory === 'expired_lt2y') { second.met.push('prior_permit_lt2y'); second.missing.push('permit_type_check'); }
    else if (a.permitHistory === 'expired_gt2y') second.notMet.push('prior_permit_gt2y');
    else if (a.permitHistory === 'none' || a.permitHistory === 'current') second.notMet.push('no_expired_permit');
    else second.missing.push('permit_history_unknown');
    second.documents.push('previous_permit', 'administrative_decision');
    second.nextSteps.push('lawyer_review');
    // Not-applicable for people who never held a permit: hide rather than show a pointless "not met" card.
    if (a.permitHistory !== 'none' && a.permitHistory !== 'current') results.push(second);

    // Family of a Spanish citizen: different regime, needs relationship check
    if (a.hasSpanishCitizenFamily === 'yes') {
      const f = result('family_of_spanish_citizen');
      f.met.push('spanish_family_declared');
      f.missing.push('relationship_type_check');
      f.documents.push('family_documents', 'marriage_or_birth_certificate', 'passport');
      f.nextSteps.push('lawyer_review');
      results.push(f);
    } else if (a.hasFamilyInSpain === 'yes') {
      const f = result('family_reunification');
      f.met.push('family_in_spain_declared');
      f.missing.push('sponsor_must_hold_residence', 'reunification_usually_from_abroad_check');
      f.documents.push('family_documents', 'means_of_subsistence');
      f.nextSteps.push('lawyer_review');
      results.push(f);
    }
  }

  // International protection
  if (a.appliedAsylum === 'yes') {
    const p = result('international_protection');
    if (a.asylumDecision === 'granted') p.met.push('protection_granted');
    else if (a.asylumDecision === 'refused') p.missing.push('asylum_refusal_remedies');
    else p.met.push('application_pending');
    p.documents.push('asylum_receipt', 'administrative_decision');
    p.nextSteps.push('lawyer_review');
    results.push(p);
  }

  for (const r of results) {
    // Ensure unanswered-critical states never silently become "eligible".
    r.bucket = r.pathway === 'eu_regime' ? 'eligible' : decide(r);
    r.documents = [...new Set(r.documents)];
    r.nextSteps = [...new Set(r.nextSteps)];
  }

  const anyEligible = results.some((r) => r.bucket === 'eligible');
  if (!anyEligible && results.length > 0) reasons.add('no_pathway_identified');
  if (a.hasLawyer === 'yes') reasons.delete('no_pathway_identified'); // already represented

  return {
    engineVersion: ENGINE_VERSION,
    rulesSnapshotDate: RULES_SNAPSHOT_DATE,
    monthsInSpain: months,
    results,
    needsLawyerReview: reasons.size > 0,
    lawyerReviewReasons: [...reasons],
    disclaimerKey: 'elig.disclaimer',
  };
}

export function groupByBucket(res: Assessment) {
  return {
    eligible: res.results.filter((r) => r.bucket === 'eligible'),
    needs_info: res.results.filter((r) => r.bucket === 'needs_info'),
    not_met: res.results.filter((r) => r.bucket === 'not_met'),
  };
}
