export type YesNo = 'yes' | 'no';
export type YesNoUnsure = 'yes' | 'no' | 'unsure';
export type AsylumDecision = 'none' | 'pending' | 'granted' | 'refused';
export type PermitHistory = 'none' | 'expired_lt2y' | 'expired_gt2y' | 'current';

/** One field per questionnaire item. `undefined` = unanswered (never treated as "no"). */
export interface Answers {
  nationality?: string;                 // 1  ISO-3166 alpha-2
  arrivalDate?: string;                 // 2  YYYY-MM-DD
  hasEmpadronamiento?: YesNo;           // 4
  hasHistoricalRegistration?: YesNo;    // 5
  hasEmploymentExperience?: YesNo;      // 6
  hasJobOffer?: YesNo;                  // 7  (contract >= 20h/week, >= SMI / collective agreement)
  hasFamilyInSpain?: YesNo;             // 8
  hasChildrenInSpain?: YesNo;           // 9
  hasSpanishCitizenFamily?: YesNo;      // 10
  appliedAsylum?: YesNo;                // 11
  asylumDecision?: AsylumDecision;      // 12
  criminalRecord?: YesNoUnsure;         // 13
  hasContinuousResidenceProof?: YesNo;  // 14
  previousApplication?: YesNo;          // 15
  receivedRefusal?: YesNo;              // 16
  hasLawyer?: YesNo;                    // 17
  // Additional questions required to evaluate verified pathway conditions (art. 127 RD 1155/2024)
  plansQualifyingTraining?: YesNo;
  permitHistory?: PermitHistory;
}

export type PathwayId =
  | 'arraigo_social' | 'arraigo_sociolaboral' | 'arraigo_socioformativo' | 'arraigo_segunda_oportunidad'
  | 'family_of_spanish_citizen' | 'family_reunification' | 'international_protection' | 'eu_regime';

export type Bucket = 'eligible' | 'needs_info' | 'not_met';

/** Codes map to translated strings (`elig.code.<code>`) so every language is served from one engine. */
export interface PathwayResult {
  pathway: PathwayId;
  bucket: Bucket;
  met: string[];
  missing: string[];
  notMet: string[];
  documents: string[];
  nextSteps: string[];
}

export interface Assessment {
  engineVersion: string;
  rulesSnapshotDate: string;   // date the encoded rules were last reviewed
  monthsInSpain: number | null;
  results: PathwayResult[];
  needsLawyerReview: boolean;
  lawyerReviewReasons: string[];
  disclaimerKey: 'elig.disclaimer';
}
