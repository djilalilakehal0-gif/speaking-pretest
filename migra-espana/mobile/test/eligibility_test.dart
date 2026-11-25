import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/core/eligibility.dart';

final now = DateTime.utc(2026, 11, 22, 12);
final base = <String, String>{
  'nationality': 'MA', 'arrivalDate': '2023-01-15', 'hasEmpadronamiento': 'yes', 'hasHistoricalRegistration': 'no',
  'hasContinuousResidenceProof': 'yes', 'criminalRecord': 'no', 'hasJobOffer': 'yes', 'hasFamilyInSpain': 'no',
  'hasChildrenInSpain': 'no', 'hasSpanishCitizenFamily': 'no', 'appliedAsylum': 'no', 'receivedRefusal': 'no',
  'previousApplication': 'no', 'hasLawyer': 'no', 'plansQualifyingTraining': 'no', 'permitHistory': 'none',
};
PathwayResult? get(Map<String, String> a, String id) => assess(a, now).results.where((r) => r.pathway == id).firstOrNull;

void main() {
  test('months', () {
    expect(monthsBetween('2024-11-22', now), 24);
    expect(monthsBetween('2024-11-23', now), 23);
    expect(monthsBetween('2030-01-01', now), isNull);
  });
  test('24-month threshold', () {
    expect(get({...base, 'arrivalDate': '2024-11-23'}, 'arraigo_sociolaboral')!.bucket, 'not_met');
    expect(get({...base, 'arrivalDate': '2024-11-22'}, 'arraigo_sociolaboral')!.met, contains('residence_24'));
  });
  test('sociolaboral never auto-eligible; asks to verify contract', () {
    final r = get(base, 'arraigo_sociolaboral')!;
    expect(r.missing, contains('contract_conditions_check'));
    expect(r.bucket, 'needs_info');
    expect(get({...base, 'hasJobOffer': 'no'}, 'arraigo_sociolaboral')!.missing, contains('job_contract_needed'));
  });
  test('sensitive circumstances route to lawyer, not rejection', () {
    final res = assess({...base, 'criminalRecord': 'yes'}, now);
    expect(res.needsLawyerReview, isTrue);
    expect(res.lawyerReviewReasons, contains('criminal_record'));
    expect(res.results.firstWhere((r) => r.pathway == 'arraigo_social').bucket, 'needs_info');
    expect(assess({...base, 'receivedRefusal': 'yes'}, now).lawyerReviewReasons, contains('previous_refusal'));
  });
  test('asylum pending adds interaction check', () {
    final res = assess({...base, 'appliedAsylum': 'yes', 'asylumDecision': 'pending'}, now);
    expect(res.results.firstWhere((r) => r.pathway == 'arraigo_social').missing, contains('asylum_interaction'));
    expect(res.results.any((r) => r.pathway == 'international_protection'), isTrue);
  });
  test('unanswered is not no', () {
    final r = get({'nationality': 'MA'}, 'arraigo_social')!;
    expect(r.bucket, 'needs_info');
    expect(r.missing, contains('arrival_date_needed'));
  });
  test('segunda oportunidad only after recently expired permit', () {
    expect(get(base, 'arraigo_segunda_oportunidad'), isNull);
    expect(get({...base, 'permitHistory': 'expired_lt2y'}, 'arraigo_segunda_oportunidad')!.met, contains('prior_permit_lt2y'));
    expect(get({...base, 'permitHistory': 'expired_gt2y'}, 'arraigo_segunda_oportunidad')!.bucket, 'not_met');
  });
  test('Spanish relative and EU nationals', () {
    expect(get({...base, 'hasSpanishCitizenFamily': 'yes'}, 'family_of_spanish_citizen'), isNotNull);
    expect(assess({...base, 'nationality': 'FR'}, now).results.map((r) => r.pathway).toList(), ['eu_regime']);
  });
}
