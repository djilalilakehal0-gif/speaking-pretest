import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/core/eligibility.dart';

// Asset integrity: all four languages have identical keys, no empty values, every engine output code is translated.
void main() {
  final dicts = {for (final l in ['es', 'en', 'fr', 'ar']) l: (jsonDecode(File('assets/i18n/$l.json').readAsStringSync()) as Map<String, dynamic>).cast<String, String>()};
  test('translations complete in all languages', () {
    for (final l in dicts.keys) {
      expect(dicts['en']!.keys.toSet().difference(dicts[l]!.keys.toSet()), isEmpty, reason: l);
      expect(dicts[l]!.values.where((v) => v.trim().isEmpty), isEmpty, reason: l);
    }
  });
  test('engine codes and questions are translated', () {
    final now = DateTime.utc(2026, 11, 22);
    final samples = <Map<String, String>>[
      {'nationality': 'MA', 'arrivalDate': '2020-01-01', 'hasFamilyInSpain': 'yes', 'hasSpanishCitizenFamily': 'yes', 'appliedAsylum': 'yes', 'asylumDecision': 'refused', 'criminalRecord': 'yes', 'permitHistory': 'expired_lt2y', 'plansQualifyingTraining': 'yes', 'hasJobOffer': 'yes', 'hasEmpadronamiento': 'yes'},
      {'nationality': 'MA', 'arrivalDate': '2020-01-01', 'hasFamilyInSpain': 'yes', 'appliedAsylum': 'yes', 'asylumDecision': 'granted', 'permitHistory': 'expired_gt2y', 'plansQualifyingTraining': 'no', 'hasJobOffer': 'no', 'hasEmpadronamiento': 'no', 'hasHistoricalRegistration': 'no', 'hasContinuousResidenceProof': 'no', 'criminalRecord': 'no'},
      {'nationality': 'FR'}, {'nationality': 'MA'},
    ];
    final missing = <String>{};
    for (final a in samples) {
      for (final r in assess(a, now).results) {
        for (final c in [...r.met, ...r.missing, ...r.notMet, ...r.nextSteps]) { if (!dicts['en']!.containsKey('elig.code.$c')) missing.add(c); }
        for (final d in r.documents) { if (!dicts['en']!.containsKey('doc.$d')) missing.add(d); }
        if (!dicts['en']!.containsKey('pathway.${r.pathway}')) missing.add(r.pathway);
      }
    }
    for (final q in questions) { if (!dicts['en']!.containsKey('q.${q.code}')) missing.add(q.code); }
    expect(missing, isEmpty);
  });
}
