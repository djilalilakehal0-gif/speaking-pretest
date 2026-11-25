import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/core/app_state.dart';
import 'package:migra_espana/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('home renders the luxury design without layout errors (ar, phone)', (tester) async {
    SharedPreferences.setMockInitialValues({'locale': 'ar'});
    final state = AppState();
    await tester.runAsync(state.load);
    tester.view.physicalSize = const Size(1170, 2532);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(Scope(state: state, child: const MigraApp()));
    // let asset images decode for the golden
    await tester.runAsync(() async { for (final e in find.byType(Image).evaluate()) { await precacheImage((e.widget as Image).image, e); } });
    await tester.pumpAndSettle();
    expect(find.text(state.t('hero.title')), findsOneWidget);
    expect(find.text(state.t('home.shortcuts')), findsOneWidget);
  });
}
