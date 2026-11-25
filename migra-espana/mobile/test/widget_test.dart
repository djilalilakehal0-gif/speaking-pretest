import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/core/app_state.dart';
import 'package:migra_espana/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<AppState> boot(WidgetTester tester, String locale) async {
  SharedPreferences.setMockInitialValues({'locale': locale});
  final state = AppState();
  await tester.runAsync(state.load);
  tester.view.physicalSize = const Size(800, 1600);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(Scope(state: state, child: const MigraApp()));
  await tester.pumpAndSettle();
  return state;
}

void main() {
  testWidgets('Arabic renders RTL and the eligibility flow reaches results with disclaimer + checklist', (tester) async {
    final s = await boot(tester, 'ar');
    expect(Directionality.of(tester.element(find.byType(Shell))), TextDirection.rtl);
    expect(find.text(s.t('hero.title')), findsOneWidget);
    await tester.tap(find.text(s.t('nav.eligibility')).last);
    await tester.pumpAndSettle();
    // Skip every question: unanswered must produce "to confirm", never a crash or a silent rejection.
    while (find.text(s.t('common.next')).evaluate().isNotEmpty) {
      await tester.tap(find.text(s.t('common.next')));
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text(s.t('elig.seeResults')));
    await tester.pumpAndSettle();
    expect(find.text(s.t('elig.disclaimer')), findsWidgets);
    expect(find.text(s.t('elig.needs_info')), findsOneWidget);
    expect(find.text(s.t('pathway.arraigo_social')), findsOneWidget);
  });

  testWidgets('Law centre shows draft banner and pending sections; no invented content', (tester) async {
    final s = await boot(tester, 'fr');
    await tester.tap(find.text(s.t('nav.law')).last);
    await tester.pumpAndSettle();
    expect(find.text(s.t('legal.draftBanner')), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Arraigo sociolaboral'), 200);
    await tester.tap(find.text('Arraigo sociolaboral'));
    await tester.pumpAndSettle();
    expect(find.text(s.t('legal.translationBanner')), findsOneWidget);
    expect(find.text(s.t('legal.pendingSection'), skipOffstage: false), findsWidgets);
  });

  testWidgets('Start page ("no papers") opens from home with all four steps', (tester) async {
    final s = await boot(tester, 'es');
    await tester.tap(find.text(s.t('start.homeLink')));
    await tester.pumpAndSettle();
    expect(find.text(s.t('start.s1.t')), findsOneWidget);
    await tester.scrollUntilVisible(find.text(s.t('start.s4.t')), 200);
    expect(find.text(s.t('start.s4.t')), findsOneWidget);
  });
}
