// Walks the questionnaire end to end and checks the results screen.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/eligibility/eligibility.dart';
import 'package:migra_espana/eligibility/eligibility_screen.dart';
import 'package:migra_espana/i18n/i18n.dart';

Widget _app(String lang) => MaterialApp(
      home: Scaffold(
        body: L10nScope(l10n: L10n(lang), child: const EligibilityScreen()),
      ),
    );

void main() {
  testWidgets('skipping every question reaches results with the disclaimer', (tester) async {
    tester.view.physicalSize = const Size(900, 1800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    const l = L10n('es');

    await tester.pumpWidget(_app('es'));
    expect(find.text(l.t('q.nationality')), findsOneWidget);
    // 17 visible questions by default (asylum decision is hidden until "yes" to asylum).
    expect(find.text('${l.t('elig.question')} 1 ${l.t('elig.of')} 17'), findsOneWidget);

    for (var i = 0; i < 16; i++) {
      await tester.tap(find.text(l.t('common.next')));
      await tester.pump();
    }
    expect(find.text(l.t('q.permitHistory')), findsOneWidget);
    expect(find.text(l.t('elig.seeResults')), findsOneWidget);

    await tester.tap(find.text(l.t('elig.seeResults')));
    await tester.pumpAndSettle();

    expect(find.text(l.t('elig.disclaimer')), findsWidgets);
    expect(find.text(l.t('elig.restart')), findsOneWidget);
    // Unanswered is never "no": nothing is eligible, and a pathway needs info.
    expect(find.text(l.t('elig.needs_info')), findsOneWidget);
    expect(find.text(l.t('elig.eligible')), findsNothing);
  });

  testWidgets('answering asylum "yes" reveals the asylum decision question', (tester) async {
    tester.view.physicalSize = const Size(900, 1800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    const l = L10n('en');

    await tester.pumpWidget(_app('en'));
    // appliedAsylum is the 10th visible question: 9 taps from Q1.
    for (var i = 0; i < 9; i++) {
      await tester.tap(find.text(l.t('common.next')));
      await tester.pump();
    }
    expect(find.text(l.t('q.appliedAsylum')), findsOneWidget);
    await tester.tap(find.text(l.t('common.yes')));
    await tester.pump();

    await tester.tap(find.text(l.t('common.next')));
    await tester.pump();
    expect(find.text(l.t('q.asylumDecision')), findsOneWidget);
    expect(find.text(l.t('opt.asylum.pending')), findsOneWidget);
    expect(find.text('${l.t('elig.question')} 11 ${l.t('elig.of')} 18'), findsOneWidget);
  });

  test('screen is RTL in Arabic', () {
    expect(const L10n('ar').isRtl, isTrue);
    expect(const L10n('es').isRtl, isFalse);
  });
}
