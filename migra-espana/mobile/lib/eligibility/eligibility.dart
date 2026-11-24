// Dart port of web/src/lib/eligibility/{types,countries,engine}.ts (engine v1.0.0).
// Pure logic: no Flutter imports, deterministic, unit-tested in test/eligibility_test.dart.
// Preliminary screening ONLY. Never an official decision.
import 'dart:math';

const engineVersion = '1.0.0';

/// Date the encoded rules were last compared with BOE text. Bump when rules change (see docs/LEGAL_CONTENT_GUIDE.md).
const rulesSnapshotDate = '2026-11-22';

/// Permanence in Spain required for arraigo social / sociolaboral / socioformativo (RD 1155/2024: two years).
const arraigoMinMonths = 24;

// ── Answer values (kept as strings to mirror the web JSON/API exactly) ──
const yes = 'yes';
const no = 'no';
const unsure = 'unsure';

const asylumNone = 'none';
const asylumPending = 'pending';
const asylumGranted = 'granted';
const asylumRefused = 'refused';

const permitNone = 'none';
const permitExpiredLt2y = 'expired_lt2y';
const permitExpiredGt2y = 'expired_gt2y';
const permitCurrent = 'current';

/// EU/EEA + Switzerland: the EU regime applies instead of the general foreigner regime.
const euEeaCh = <String>{
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH',
};

/// One field per questionnaire item. `null` = unanswered (never treated as "no").
class Answers {
  final String? nationality; // ISO-3166 alpha-2
  final String? arrivalDate; // YYYY-MM-DD
  final String? hasEmpadronamiento; // yes|no
  final String? hasHistoricalRegistration;
  final String? hasEmploymentExperience;
  final String? hasJobOffer; // contract >= 20h/week, >= SMI / collective agreement
  final String? hasFamilyInSpain;
  final String? hasChildrenInSpain;
  final String? hasSpanishCitizenFamily;
  final String? appliedAsylum;
  final String? asylumDecision; // none|pending|granted|refused
  final String? criminalRecord; // yes|no|unsure
  final String? hasContinuousResidenceProof;
  final String? previousApplication;
  final String? receivedRefusal;
  final String? hasLawyer;
  // Additional questions for verified pathway conditions (art. 127 RD 1155/2024)
  final String? plansQualifyingTraining;
  final String? permitHistory; // none|expired_lt2y|expired_gt2y|current

  const Answers({
    this.nationality,
    this.arrivalDate,
    this.hasEmpadronamiento,
    this.hasHistoricalRegistration,
    this.hasEmploymentExperience,
    this.hasJobOffer,
    this.hasFamilyInSpain,
    this.hasChildrenInSpain,
    this.hasSpanishCitizenFamily,
    this.appliedAsylum,
    this.asylumDecision,
    this.criminalRecord,
    this.hasContinuousResidenceProof,
    this.previousApplication,
    this.receivedRefusal,
    this.hasLawyer,
    this.plansQualifyingTraining,
    this.permitHistory,
  });

  Answers copyWith({
    String? nationality,
    String? arrivalDate,
    String? hasEmpadronamiento,
    String? hasHistoricalRegistration,
    String? hasEmploymentExperience,
    String? hasJobOffer,
    String? hasFamilyInSpain,
    String? hasChildrenInSpain,
    String? hasSpanishCitizenFamily,
    String? appliedAsylum,
    String? asylumDecision,
    String? criminalRecord,
    String? hasContinuousResidenceProof,
    String? previousApplication,
    String? receivedRefusal,
    String? hasLawyer,
    String? plansQualifyingTraining,
    String? permitHistory,
  }) =>
      Answers(
        nationality: nationality ?? this.nationality,
        arrivalDate: arrivalDate ?? this.arrivalDate,
        hasEmpadronamiento: hasEmpadronamiento ?? this.hasEmpadronamiento,
        hasHistoricalRegistration: hasHistoricalRegistration ?? this.hasHistoricalRegistration,
        hasEmploymentExperience: hasEmploymentExperience ?? this.hasEmploymentExperience,
        hasJobOffer: hasJobOffer ?? this.hasJobOffer,
        hasFamilyInSpain: hasFamilyInSpain ?? this.hasFamilyInSpain,
        hasChildrenInSpain: hasChildrenInSpain ?? this.hasChildrenInSpain,
        hasSpanishCitizenFamily: hasSpanishCitizenFamily ?? this.hasSpanishCitizenFamily,
        appliedAsylum: appliedAsylum ?? this.appliedAsylum,
        asylumDecision: asylumDecision ?? this.asylumDecision,
        criminalRecord: criminalRecord ?? this.criminalRecord,
        hasContinuousResidenceProof: hasContinuousResidenceProof ?? this.hasContinuousResidenceProof,
        previousApplication: previousApplication ?? this.previousApplication,
        receivedRefusal: receivedRefusal ?? this.receivedRefusal,
        hasLawyer: hasLawyer ?? this.hasLawyer,
        plansQualifyingTraining: plansQualifyingTraining ?? this.plansQualifyingTraining,
        permitHistory: permitHistory ?? this.permitHistory,
      );
}

/// Bucket values: 'eligible' | 'needs_info' | 'not_met'.
class PathwayResult {
  final String pathway;
  String bucket;
  final List<String> met = [];
  final List<String> missing = [];
  final List<String> notMet = [];
  final List<String> documents = [];
  final List<String> nextSteps = [];

  PathwayResult(this.pathway, {this.bucket = 'needs_info'});
}

class Assessment {
  final String engineVersion;
  final String rulesSnapshotDate; // date the encoded rules were last reviewed
  final int? monthsInSpain;
  final List<PathwayResult> results;
  final bool needsLawyerReview;
  final List<String> lawyerReviewReasons;
  final String disclaimerKey;

  const Assessment({
    required this.engineVersion,
    required this.rulesSnapshotDate,
    required this.monthsInSpain,
    required this.results,
    required this.needsLawyerReview,
    required this.lawyerReviewReasons,
    this.disclaimerKey = 'elig.disclaimer',
  });
}

/// Questionnaire order (1–17 + 2 additional), as in web/src/lib/eligibility/questions.ts.
enum QuestionKind { country, date, yesno, yesnounsure, asylum, permit }

class Question {
  final String code; // Answers field name
  final QuestionKind kind;
  final int position;
  final bool additional;
  const Question(this.code, this.kind, this.position, {this.additional = false});
}

const questions = <Question>[
  Question('nationality', QuestionKind.country, 1),
  Question('arrivalDate', QuestionKind.date, 2), // also answers Q3 (how long) — duration is derived
  Question('hasEmpadronamiento', QuestionKind.yesno, 4),
  Question('hasHistoricalRegistration', QuestionKind.yesno, 5),
  Question('hasEmploymentExperience', QuestionKind.yesno, 6),
  Question('hasJobOffer', QuestionKind.yesno, 7),
  Question('hasFamilyInSpain', QuestionKind.yesno, 8),
  Question('hasChildrenInSpain', QuestionKind.yesno, 9),
  Question('hasSpanishCitizenFamily', QuestionKind.yesno, 10),
  Question('appliedAsylum', QuestionKind.yesno, 11),
  Question('asylumDecision', QuestionKind.asylum, 12),
  Question('criminalRecord', QuestionKind.yesnounsure, 13),
  Question('hasContinuousResidenceProof', QuestionKind.yesno, 14),
  Question('previousApplication', QuestionKind.yesno, 15),
  Question('receivedRefusal', QuestionKind.yesno, 16),
  Question('hasLawyer', QuestionKind.yesno, 17),
  Question('plansQualifyingTraining', QuestionKind.yesno, 18, additional: true),
  Question('permitHistory', QuestionKind.permit, 19, additional: true),
];

/// Questions skipped when an earlier answer makes them irrelevant.
bool isVisible(Question q, Answers a) {
  if (q.code == 'asylumDecision') return a.appliedAsylum == yes;
  return true;
}

/// Whole months between an ISO date and [to]; null if invalid or in the future.
int? monthsBetween(String fromIso, DateTime to) {
  final from = DateTime.tryParse('${fromIso}T00:00:00Z');
  if (from == null) return null;
  final end = to.toUtc();
  if (from.isAfter(end)) return null;
  var m = (end.year - from.year) * 12 + (end.month - from.month);
  if (end.day < from.day) m -= 1;
  return max(0, m);
}

enum _Proof { yes, no, unknown }

_Proof _proofOfResidence(Answers a) {
  final sig = [a.hasEmpadronamiento, a.hasHistoricalRegistration, a.hasContinuousResidenceProof];
  if (sig.contains(yes)) return _Proof.yes;
  if (sig.every((v) => v == no)) return _Proof.no;
  return _Proof.unknown;
}

/// Unanswered produces needs_info; any notMet item produces not_met.
String _decide(PathwayResult r) {
  if (r.notMet.isNotEmpty) return 'not_met';
  if (r.missing.isNotEmpty) return 'needs_info';
  return 'eligible';
}

/// Preliminary screening. Pure and deterministic.
/// Design rules:
///  - unanswered ≠ "no": unanswered produces `needs_info`, not `not_met`.
///  - sensitive circumstances (criminal record, refusal, asylum) never auto-reject; they route to lawyer review.
Assessment assess(Answers a, {DateTime? now}) {
  final at = now ?? DateTime.now();
  final reasons = <String>{};
  final months = a.arrivalDate == null ? null : monthsBetween(a.arrivalDate!, at);
  final results = <PathwayResult>[];
  final asylumIsPending =
      a.appliedAsylum == yes && (a.asylumDecision == asylumPending || a.asylumDecision == null);
  final euNational = a.nationality != null && euEeaCh.contains(a.nationality);

  if (a.criminalRecord == yes || a.criminalRecord == unsure) reasons.add('criminal_record');
  if (a.receivedRefusal == yes) reasons.add('previous_refusal');
  if (a.appliedAsylum == yes) reasons.add('asylum');
  if (a.previousApplication == yes) reasons.add('previous_application');

  if (euNational) {
    final r = PathwayResult('eu_regime', bucket: 'eligible')
      ..met.add('eu_national')
      ..nextSteps.add('register_eu_certificate')
      ..documents.addAll(['passport', 'empadronamiento']);
    results.add(r);
  }

  // ── Arraigo family: social / sociolaboral / socioformativo share residence + proof + record gates ──
  PathwayResult arraigoBase(String id) {
    final r = PathwayResult(id);
    if (months == null) {
      r.missing.add('arrival_date_needed');
    } else if (months >= arraigoMinMonths) {
      r.met.add('residence_24');
    } else {
      r.notMet.add('residence_24');
    }

    switch (_proofOfResidence(a)) {
      case _Proof.yes:
        r.met.add('residence_proof');
      case _Proof.no:
        r.missing.add('residence_proof');
      case _Proof.unknown:
        r.missing.add('residence_proof_unknown');
    }
    r.documents.addAll(['passport', 'empadronamiento', 'criminal_record_certificate']);

    if (a.criminalRecord == no) {
      r.met.add('no_record');
    } else {
      r.missing.add('record_review'); // yes/unsure/unanswered → verify, never reject
    }

    if (asylumIsPending) r.missing.add('asylum_interaction');
    return r;
  }

  if (!euNational) {
    // arraigo social
    final social = arraigoBase('arraigo_social');
    if (a.hasFamilyInSpain == yes || a.hasChildrenInSpain == yes) {
      social.met.add('family_ties_declared');
      social.missing.add('family_member_must_hold_residence');
      social.documents.addAll(['family_documents', 'means_of_subsistence']);
    } else {
      social.missing.add('integration_report');
      social.documents.add('integration_report');
    }
    social.nextSteps.addAll(['collect_documents', 'lawyer_review']);
    results.add(social);

    // arraigo sociolaboral
    final labour = arraigoBase('arraigo_sociolaboral');
    if (a.hasJobOffer == yes) {
      labour.met.add('job_offer_declared');
      labour.missing.add('contract_conditions_check');
    } else {
      labour.missing.add('job_contract_needed');
    }
    labour.documents.addAll(['employment_contract', 'payslip']);
    labour.nextSteps.addAll(['verify_contract_conditions', 'lawyer_review']);
    results.add(labour);

    // arraigo socioformativo
    final train = arraigoBase('arraigo_socioformativo');
    if (a.plansQualifyingTraining == yes) {
      train.met.add('training_declared');
    } else if (a.plansQualifyingTraining == no) {
      train.notMet.add('training_needed');
    } else {
      train.missing.add('training_unknown');
    }
    train.documents.add('training_certificate');
    train.nextSteps.addAll(['verify_training_type', 'lawyer_review']);
    results.add(train);

    // arraigo segunda oportunidad (held a non-exceptional permit within the two years before applying)
    final second = PathwayResult('arraigo_segunda_oportunidad');
    if (a.permitHistory == permitExpiredLt2y) {
      second.met.add('prior_permit_lt2y');
      second.missing.add('permit_type_check');
    } else if (a.permitHistory == permitExpiredGt2y) {
      second.notMet.add('prior_permit_gt2y');
    } else if (a.permitHistory == permitNone || a.permitHistory == permitCurrent) {
      second.notMet.add('no_expired_permit');
    } else {
      second.missing.add('permit_history_unknown');
    }
    second.documents.addAll(['previous_permit', 'administrative_decision']);
    second.nextSteps.add('lawyer_review');
    // Hide for people who never held a permit rather than show a pointless "not met" card.
    if (a.permitHistory != permitNone && a.permitHistory != permitCurrent) results.add(second);

    if (a.hasSpanishCitizenFamily == yes) {
      // Family of a Spanish citizen: different regime, needs relationship check
      final f = PathwayResult('family_of_spanish_citizen')
        ..met.add('spanish_family_declared')
        ..missing.add('relationship_type_check')
        ..documents.addAll(['family_documents', 'marriage_or_birth_certificate', 'passport'])
        ..nextSteps.add('lawyer_review');
      results.add(f);
    } else if (a.hasFamilyInSpain == yes) {
      final f = PathwayResult('family_reunification')
        ..met.add('family_in_spain_declared')
        ..missing.addAll(['sponsor_must_hold_residence', 'reunification_usually_from_abroad_check'])
        ..documents.addAll(['family_documents', 'means_of_subsistence'])
        ..nextSteps.add('lawyer_review');
      results.add(f);
    }
  }

  // International protection
  if (a.appliedAsylum == yes) {
    final p = PathwayResult('international_protection');
    if (a.asylumDecision == asylumGranted) {
      p.met.add('protection_granted');
    } else if (a.asylumDecision == asylumRefused) {
      p.missing.add('asylum_refusal_remedies');
    } else {
      p.met.add('application_pending');
    }
    p.documents.addAll(['asylum_receipt', 'administrative_decision']);
    p.nextSteps.add('lawyer_review');
    results.add(p);
  }

  for (final r in results) {
    // Unanswered-critical states never silently become "eligible".
    r.bucket = r.pathway == 'eu_regime' ? 'eligible' : _decide(r);
    final docs = r.documents.toSet().toList();
    final steps = r.nextSteps.toSet().toList();
    r.documents
      ..clear()
      ..addAll(docs);
    r.nextSteps
      ..clear()
      ..addAll(steps);
  }

  final anyEligible = results.any((r) => r.bucket == 'eligible');
  if (!anyEligible && results.isNotEmpty) reasons.add('no_pathway_identified');
  if (a.hasLawyer == yes) reasons.remove('no_pathway_identified'); // already represented

  return Assessment(
    engineVersion: engineVersion,
    rulesSnapshotDate: rulesSnapshotDate,
    monthsInSpain: months,
    results: results,
    needsLawyerReview: reasons.isNotEmpty,
    lawyerReviewReasons: reasons.toList(),
  );
}

/// Buckets are exhaustive and disjoint.
Map<String, List<PathwayResult>> groupByBucket(Assessment res) => {
      'eligible': res.results.where((r) => r.bucket == 'eligible').toList(),
      'needs_info': res.results.where((r) => r.bucket == 'needs_info').toList(),
      'not_met': res.results.where((r) => r.bucket == 'not_met').toList(),
    };
