// Dart port of web/src/lib/eligibility/engine.ts. Keep both in sync: see test/eligibility_test.dart (mirrors the web tests).
const engineVersion = '1.0.0';
const rulesSnapshotDate = '2026-11-22';
const arraigoMinMonths = 24;

const euEeaCh = {
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'CH',
};

enum QKind { country, date, yesno, yesnounsure, asylum, permit }

class Question {
  final String code;
  final QKind kind;
  final bool additional;
  const Question(this.code, this.kind, [this.additional = false]);
}

const questions = <Question>[
  Question('nationality', QKind.country), Question('arrivalDate', QKind.date),
  Question('hasEmpadronamiento', QKind.yesno), Question('hasHistoricalRegistration', QKind.yesno),
  Question('hasEmploymentExperience', QKind.yesno), Question('hasJobOffer', QKind.yesno),
  Question('hasFamilyInSpain', QKind.yesno), Question('hasChildrenInSpain', QKind.yesno),
  Question('hasSpanishCitizenFamily', QKind.yesno), Question('appliedAsylum', QKind.yesno),
  Question('asylumDecision', QKind.asylum), Question('criminalRecord', QKind.yesnounsure),
  Question('hasContinuousResidenceProof', QKind.yesno), Question('previousApplication', QKind.yesno),
  Question('receivedRefusal', QKind.yesno), Question('hasLawyer', QKind.yesno),
  Question('plansQualifyingTraining', QKind.yesno, true), Question('permitHistory', QKind.permit, true),
];
const asylumOptions = ['none', 'pending', 'granted', 'refused'];
const permitOptions = ['none', 'expired_lt2y', 'expired_gt2y', 'current'];

typedef Answers = Map<String, String>;

bool isVisible(Question q, Answers a) => q.code != 'asylumDecision' || a['appliedAsylum'] == 'yes';

int? monthsBetween(String fromIso, DateTime to) {
  final from = DateTime.tryParse('${fromIso}T00:00:00Z');
  if (from == null || from.isAfter(to)) return null;
  var m = (to.year - from.year) * 12 + (to.month - from.month);
  if (to.day < from.day) m -= 1;
  return m < 0 ? 0 : m;
}

class PathwayResult {
  final String pathway;
  String bucket = 'needs_info';
  final List<String> met = [], missing = [], notMet = [], documents = [], nextSteps = [];
  PathwayResult(this.pathway);
}

class Assessment {
  final int? monthsInSpain;
  final List<PathwayResult> results;
  final bool needsLawyerReview;
  final List<String> lawyerReviewReasons;
  Assessment(this.monthsInSpain, this.results, this.needsLawyerReview, this.lawyerReviewReasons);
  List<PathwayResult> bucket(String b) => results.where((r) => r.bucket == b).toList();
}

String _proof(Answers a) {
  final sig = [a['hasEmpadronamiento'], a['hasHistoricalRegistration'], a['hasContinuousResidenceProof']];
  if (sig.contains('yes')) return 'yes';
  if (sig.every((v) => v == 'no')) return 'no';
  return 'unknown';
}

String _decide(PathwayResult r) => r.notMet.isNotEmpty ? 'not_met' : (r.missing.isNotEmpty ? 'needs_info' : 'eligible');

/// Preliminary screening only. Unanswered != "no"; sensitive facts route to lawyer review, never to rejection.
Assessment assess(Answers a, [DateTime? now]) {
  now ??= DateTime.now().toUtc();
  final reasons = <String>{};
  final months = a['arrivalDate'] != null ? monthsBetween(a['arrivalDate']!, now) : null;
  final results = <PathwayResult>[];
  final asylumPending = a['appliedAsylum'] == 'yes' && (a['asylumDecision'] == 'pending' || a['asylumDecision'] == null);
  final eu = a['nationality'] != null && euEeaCh.contains(a['nationality']);

  if (a['criminalRecord'] == 'yes' || a['criminalRecord'] == 'unsure') reasons.add('criminal_record');
  if (a['receivedRefusal'] == 'yes') reasons.add('previous_refusal');
  if (a['appliedAsylum'] == 'yes') reasons.add('asylum');
  if (a['previousApplication'] == 'yes') reasons.add('previous_application');

  if (eu) {
    final r = PathwayResult('eu_regime')
      ..met.add('eu_national')
      ..nextSteps.add('register_eu_certificate')
      ..documents.addAll(['passport', 'empadronamiento']);
    results.add(r);
  }

  PathwayResult base(String id) {
    final r = PathwayResult(id);
    if (months == null) {
      r.missing.add('arrival_date_needed');
    } else if (months >= arraigoMinMonths) {
      r.met.add('residence_24');
    } else {
      r.notMet.add('residence_24');
    }
    final p = _proof(a);
    if (p == 'yes') {
      r.met.add('residence_proof');
    } else if (p == 'no') {
      r.missing.add('residence_proof');
    } else {
      r.missing.add('residence_proof_unknown');
    }
    r.documents.addAll(['passport', 'empadronamiento', 'criminal_record_certificate']);
    if (a['criminalRecord'] == 'no') {
      r.met.add('no_record');
    } else {
      r.missing.add('record_review');
    }
    if (asylumPending) r.missing.add('asylum_interaction');
    return r;
  }

  if (!eu) {
    final social = base('arraigo_social');
    if (a['hasFamilyInSpain'] == 'yes' || a['hasChildrenInSpain'] == 'yes') {
      social.met.add('family_ties_declared');
      social.missing.add('family_member_must_hold_residence');
      social.documents.addAll(['family_documents', 'means_of_subsistence']);
    } else {
      social.missing.add('integration_report');
      social.documents.add('integration_report');
    }
    social.nextSteps.addAll(['collect_documents', 'lawyer_review']);
    results.add(social);

    final labour = base('arraigo_sociolaboral');
    if (a['hasJobOffer'] == 'yes') {
      labour.met.add('job_offer_declared');
    } else {
      labour.missing.add('job_contract_needed');
    }
    if (a['hasJobOffer'] == 'yes') labour.missing.add('contract_conditions_check');
    labour.documents.addAll(['employment_contract', 'payslip']);
    labour.nextSteps.addAll(['verify_contract_conditions', 'lawyer_review']);
    results.add(labour);

    final train = base('arraigo_socioformativo');
    if (a['plansQualifyingTraining'] == 'yes') {
      train.met.add('training_declared');
    } else if (a['plansQualifyingTraining'] == 'no') {
      train.notMet.add('training_needed');
    } else {
      train.missing.add('training_unknown');
    }
    train.documents.add('training_certificate');
    train.nextSteps.addAll(['verify_training_type', 'lawyer_review']);
    results.add(train);

    final ph = a['permitHistory'];
    if (ph != 'none' && ph != 'current') {
      final s = PathwayResult('arraigo_segunda_oportunidad');
      if (ph == 'expired_lt2y') {
        s.met.add('prior_permit_lt2y');
        s.missing.add('permit_type_check');
      } else if (ph == 'expired_gt2y') {
        s.notMet.add('prior_permit_gt2y');
      } else {
        s.missing.add('permit_history_unknown');
      }
      s.documents.addAll(['previous_permit', 'administrative_decision']);
      s.nextSteps.add('lawyer_review');
      results.add(s);
    }

    if (a['hasSpanishCitizenFamily'] == 'yes') {
      results.add(PathwayResult('family_of_spanish_citizen')
        ..met.add('spanish_family_declared')
        ..missing.add('relationship_type_check')
        ..documents.addAll(['family_documents', 'marriage_or_birth_certificate', 'passport'])
        ..nextSteps.add('lawyer_review'));
    } else if (a['hasFamilyInSpain'] == 'yes') {
      results.add(PathwayResult('family_reunification')
        ..met.add('family_in_spain_declared')
        ..missing.addAll(['sponsor_must_hold_residence', 'reunification_usually_from_abroad_check'])
        ..documents.addAll(['family_documents', 'means_of_subsistence'])
        ..nextSteps.add('lawyer_review'));
    }
  }

  if (a['appliedAsylum'] == 'yes') {
    final p = PathwayResult('international_protection');
    if (a['asylumDecision'] == 'granted') {
      p.met.add('protection_granted');
    } else if (a['asylumDecision'] == 'refused') {
      p.missing.add('asylum_refusal_remedies');
    } else {
      p.met.add('application_pending');
    }
    p.documents.addAll(['asylum_receipt', 'administrative_decision']);
    p.nextSteps.add('lawyer_review');
    results.add(p);
  }

  for (final r in results) {
    r.bucket = r.pathway == 'eu_regime' ? 'eligible' : _decide(r);
    final d = r.documents.toSet().toList();
    r.documents..clear()..addAll(d);
    final n = r.nextSteps.toSet().toList();
    r.nextSteps..clear()..addAll(n);
  }
  if (results.isNotEmpty && !results.any((r) => r.bucket == 'eligible')) reasons.add('no_pathway_identified');
  if (a['hasLawyer'] == 'yes') reasons.remove('no_pathway_identified');
  return Assessment(months, results, reasons.isNotEmpty, reasons.toList());
}
