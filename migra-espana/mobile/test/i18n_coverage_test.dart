// Every key the eligibility UI or engine can emit must exist in all four locales.
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/eligibility/answers_codec.dart';
import 'package:migra_espana/eligibility/eligibility.dart';
import 'package:migra_espana/i18n/i18n.dart';
import 'package:migra_espana/i18n/strings.g.dart';

const _locales = ['es', 'en', 'fr', 'ar'];

void _expectKey(String key, {String? from}) {
  for (final l in _locales) {
    expect(dictionaries[l]!.containsKey(key), isTrue, reason: 'missing "$key" in $l (from $from)');
  }
}

void main() {
  test('question labels, help texts and option labels exist in all locales', () {
    for (final q in questions) {
      _expectKey('q.${q.code}', from: 'question');
    }
    for (final o in asylumOptions) {
      _expectKey('opt.asylum.$o');
    }
    for (final o in permitOptions) {
      _expectKey('opt.permit.$o');
    }
    for (final k in ['common.select', 'common.yes', 'common.no', 'common.unsure', 'common.back', 'common.next',
        'common.lastVerified', 'elig.question', 'elig.of', 'elig.additional', 'elig.seeResults', 'elig.restart',
        'elig.disclaimer', 'elig.eligible', 'elig.needs_info', 'elig.not_met', 'elig.met', 'elig.missing',
        'elig.notMet', 'elig.docsNeeded', 'elig.nextSteps', 'elig.lawyerTitle', 'elig.lawyerCta',
        'elig.monthsInSpain', 'elig.months', 'elig.empty']) {
      _expectKey(k);
    }
  });

  test('every code emitted by the engine has a translation', () {
    final seen = <String>{};
    final dates = [null, '2026-11-01', '2024-11-22', '2023-01-15', '2020-01-01'];
    final nationalities = [null, 'MA', 'FR'];
    final tri = [null, 'yes', 'no', 'unsure'];
    for (final date in dates) {
      for (final nat in nationalities) {
        for (final a in tri) {
          for (final b in tri) {
            for (final c in tri) {
              for (final asy in [null, 'yes', 'no']) {
                for (final dec in asylumOptions) {
                  for (final permit in permitOptions) {
                    for (final train in [null, 'yes', 'no']) {
                      final ans = Answers(
                        arrivalDate: date,
                        nationality: nat,
                        hasJobOffer: a,
                        hasFamilyInSpain: b,
                        hasSpanishCitizenFamily: c,
                        criminalRecord: c,
                        appliedAsylum: asy,
                        asylumDecision: dec,
                        permitHistory: permit,
                        plansQualifyingTraining: train,
                        receivedRefusal: a,
                        previousApplication: b,
                        hasLawyer: c,
                        hasEmpadronamiento: a,
                        hasContinuousResidenceProof: c,
                        hasHistoricalRegistration: b,
                      );
                      final res = assess(ans, now: DateTime.utc(2026, 11, 24));
                      for (final r in res.results) {
                        _expectKey('pathway.${r.pathway}', from: 'pathway');
                        seen.addAll(r.met.map((c) => 'elig.code.$c'));
                        seen.addAll(r.missing.map((c) => 'elig.code.$c'));
                        seen.addAll(r.notMet.map((c) => 'elig.code.$c'));
                        seen.addAll(r.nextSteps.map((c) => 'elig.code.$c'));
                        seen.addAll(r.documents.map((c) => 'doc.$c'));
                      }
                      seen.addAll(res.lawyerReviewReasons.map((c) => 'elig.reason.$c'));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    expect(seen.length, greaterThan(40));
    for (final key in seen) {
      _expectKey(key);
    }
  });

  test('country names exist for every locale and every picker code', () {
    for (final l in _locales) {
      expect(countryNamesFor(l), isNotEmpty);
      for (final c in countryNamesFor(l)) {
        expect(L10n(l).country(c), isNot(equals(c)), reason: 'no name for $c in $l');
      }
    }
  });

  test('L10n falls back to Spanish, then English, then the key', () {
    expect(const L10n('fr').t('common.select'), dictionaries['fr']!['common.select']);
    expect(const L10n('xx').t('common.next'), dictionaries['es']!['common.next']);
    expect(const L10n('es').t('does.not.exist'), 'does.not.exist');
    expect(const L10n('es').t('elig.months'), dictionaries['es']!['elig.months']);
  });
}
