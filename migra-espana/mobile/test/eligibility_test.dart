// Port of web/src/lib/eligibility/engine.test.ts — must stay behaviorally identical.
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/eligibility/eligibility.dart';

final now = DateTime.parse('2026-11-22T12:00:00Z');

const base = Answers(
  nationality: 'MA',
  arrivalDate: '2023-01-15',
  hasEmpadronamiento: yes,
  hasHistoricalRegistration: no,
  hasContinuousResidenceProof: yes,
  criminalRecord: no,
  hasJobOffer: yes,
  hasFamilyInSpain: no,
  hasChildrenInSpain: no,
  hasSpanishCitizenFamily: no,
  appliedAsylum: no,
  receivedRefusal: no,
  previousApplication: no,
  hasLawyer: no,
  plansQualifyingTraining: no,
  permitHistory: permitNone,
);

PathwayResult? get(Answers a, String id) {
  for (final r in assess(a, now: now).results) {
    if (r.pathway == id) return r;
  }
  return null;
}

void main() {
  group('monthsBetween', () {
    test('counts whole months and respects day-of-month', () {
      expect(monthsBetween('2024-11-22', now), 24);
      expect(monthsBetween('2024-11-23', now), 23);
    });
    test('rejects future / invalid dates', () {
      expect(monthsBetween('2030-01-01', now), isNull);
      expect(monthsBetween('not-a-date', now), isNull);
    });
  });

  group('arraigo thresholds (24 months)', () {
    test('23 months → not_met, 24 months → residence_24 met', () {
      expect(get(base.copyWith(arrivalDate: '2024-11-23'), 'arraigo_sociolaboral')?.bucket, 'not_met');
      expect(get(base.copyWith(arrivalDate: '2024-11-22'), 'arraigo_sociolaboral')?.met, contains('residence_24'));
    });
  });

  group('arraigo sociolaboral', () {
    test('job offer + proof + clean record still asks to verify contract conditions', () {
      final r = get(base, 'arraigo_sociolaboral')!;
      expect(r.met, containsAll(['residence_24', 'residence_proof', 'job_offer_declared']));
      expect(r.missing, contains('contract_conditions_check'));
      expect(r.bucket, 'needs_info');
    });
    test('without a job offer needs a contract rather than being rejected', () {
      final r = get(base.copyWith(hasJobOffer: no), 'arraigo_sociolaboral')!;
      expect(r.bucket, 'needs_info');
      expect(r.missing, contains('job_contract_needed'));
    });
  });

  group('arraigo social', () {
    test('without family ties asks for the integration report', () {
      expect(get(base, 'arraigo_social')!.missing, contains('integration_report'));
    });
    test('with family ties notes the relative must hold residence', () {
      final r = get(base.copyWith(hasFamilyInSpain: yes), 'arraigo_social')!;
      expect(r.met, contains('family_ties_declared'));
      expect(r.missing, contains('family_member_must_hold_residence'));
    });
  });

  group('sensitive circumstances never auto-reject', () {
    test('criminal record → lawyer review + needs_info, not not_met', () {
      final res = assess(base.copyWith(criminalRecord: yes), now: now);
      expect(res.needsLawyerReview, isTrue);
      expect(res.lawyerReviewReasons, contains('criminal_record'));
      expect(get(base.copyWith(criminalRecord: yes), 'arraigo_social')!.bucket, 'needs_info');
    });
    test('previous refusal flags lawyer review', () {
      expect(assess(base.copyWith(receivedRefusal: yes), now: now).lawyerReviewReasons, contains('previous_refusal'));
    });
    test('pending asylum adds interaction check and international protection result', () {
      final a = base.copyWith(appliedAsylum: yes, asylumDecision: asylumPending);
      final res = assess(a, now: now);
      expect(get(a, 'arraigo_social')!.missing, contains('asylum_interaction'));
      expect(get(a, 'international_protection'), isNotNull);
      expect(res.needsLawyerReview, isTrue);
    });
  });

  group('unanswered is not "no"', () {
    test('missing arrival date → needs_info', () {
      final r = get(const Answers(nationality: 'MA'), 'arraigo_social')!;
      expect(r.bucket, 'needs_info');
      expect(r.missing, contains('arrival_date_needed'));
    });
  });

  group('segunda oportunidad (art. 127.a)', () {
    test('only shown after a recently expired permit', () {
      expect(get(base, 'arraigo_segunda_oportunidad'), isNull);
      expect(get(base.copyWith(permitHistory: permitExpiredLt2y), 'arraigo_segunda_oportunidad')!.met,
          contains('prior_permit_lt2y'));
      expect(get(base.copyWith(permitHistory: permitExpiredGt2y), 'arraigo_segunda_oportunidad')!.bucket, 'not_met');
    });
  });

  group('family regimes & EU nationals', () {
    test('Spanish citizen relative → separate pathway', () {
      expect(get(base.copyWith(hasSpanishCitizenFamily: yes), 'family_of_spanish_citizen'), isNotNull);
    });
    test('EU nationals get the EU regime and no arraigo', () {
      final res = assess(base.copyWith(nationality: 'FR'), now: now);
      expect(res.results.map((r) => r.pathway).toList(), ['eu_regime']);
    });
  });

  group('grouping', () {
    test('buckets are exhaustive and disjoint', () {
      final res = assess(base.copyWith(arrivalDate: '2025-06-01'), now: now);
      final g = groupByBucket(res);
      expect(g['eligible']!.length + g['needs_info']!.length + g['not_met']!.length, res.results.length);
    });
    test('always carries the disclaimer key and snapshot date', () {
      final res = assess(base, now: now);
      expect(res.disclaimerKey, 'elig.disclaimer');
      expect(RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(res.rulesSnapshotDate), isTrue);
    });
  });
}
