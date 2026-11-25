import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:migra_espana/core/api.dart';
import 'package:migra_espana/core/app_state.dart';
import 'package:migra_espana/core/auth.dart';
import 'package:migra_espana/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FakeAuth extends AuthService {
  bool on;
  FakeAuth(this.on);
  @override String? get email => on ? 'a@test.dev' : null;
  @override String? get accessToken => on ? 'tok' : null;
  @override bool get available => true;
  @override Future<String?> signIn(String e, String p) async { on = true; notifyListeners(); return null; }
  @override Future<String?> signUp(String e, String p, {required String locale, required bool aiConsent}) async => null;
  @override Future<void> signOut() async { on = false; notifyListeners(); }
  @override Future<void> resetPassword(String e) async {}
}

class FakeApi implements Api {
  List<VaultDoc> docs = [VaultDoc('d1', 'passport', 'passport.pdf', '2026-12-31')];
  final deleted = <String>[];
  final sent = <String>[];
  Object? sendError;
  @override Future<List<VaultDoc>> listDocuments() async => List.of(docs);
  @override Future<void> uploadDocument({required Uint8List bytes, required String fileName, required String mime, required String category, String? expiresOn}) async {}
  @override Future<Uri> signedUrl(String id) async => Uri.parse('https://signed.test/$id');
  @override Future<void> deleteDocument(String id) async { deleted.add(id); docs.removeWhere((d) => d.id == id); }
  @override Future<List<Lawyer>> listLawyers() async => [Lawyer('l1', 'Ana Pérez', 'ICAM', ['es', 'ar'], 5000, 'EUR', phone: '+34600111222', whatsapp: '+34600111222')];
  @override Future<String> openConversation(String lawyerId) async => 'c1';
  @override Future<List<Conversation>> listConversations() async => [Conversation('c1', 'Ana Pérez', 'hola', true)];
  @override Future<List<Message>> messages(String id) async => [Message('m1', 'hola', '2026-11-22T10:00:00Z', false), for (final b in sent) Message('x$b', b, '2026-11-22T10:01:00Z', true)];
  @override Future<void> sendMessage(String id, String body) async { if (sendError != null) throw sendError!; sent.add(body); }
  @override Future<void> book(String lawyerId, DateTime startsAtUtc, int minutes) async {}
}

Future<AppState> boot(WidgetTester tester, {FakeAuth? auth, FakeApi? api, String locale = 'en'}) async {
  SharedPreferences.setMockInitialValues({'locale': locale});
  final state = AppState();
  await tester.runAsync(state.load);
  if (auth != null) state.auth = auth;
  state.api = api;
  tester.view.physicalSize = const Size(800, 1800);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(Scope(state: state, child: const MigraApp()));
  await tester.pumpAndSettle();
  return state;
}

void main() {
  testWidgets('without a backend, the vault and lawyers show a demo notice (nothing is faked)', (tester) async {
    final s = await boot(tester);
    await tester.tap(find.text(s.t('nav.documents')).last);
    await tester.pumpAndSettle();
    expect(find.text(s.t('common.demo')), findsOneWidget);
    expect(find.byIcon(Icons.photo_camera), findsNothing);
  });

  testWidgets('signed out with a backend: vault asks to sign in; login unlocks it', (tester) async {
    final auth = FakeAuth(false);
    final s = await boot(tester, auth: auth, api: FakeApi());
    await tester.tap(find.text(s.t('nav.documents')).last);
    await tester.pumpAndSettle();
    expect(find.text(s.t('msg.login')), findsOneWidget);
    await tester.tap(find.text(s.t('auth.login')).first);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'a@test.dev');
    await tester.enterText(find.byType(TextField).last, 'secret-password');
    await tester.tap(find.widgetWithText(FilledButton, s.t('auth.login')));
    await tester.pumpAndSettle();
    expect(find.text(s.t('docs.title')), findsOneWidget);
    expect(find.text('passport.pdf'), findsNothing, reason: 'file name is shown with expiry in the subtitle');
  });

  testWidgets('vault lists documents, flags missing baseline docs, deletes after confirmation', (tester) async {
    final api = FakeApi();
    final s = await boot(tester, auth: FakeAuth(true), api: api);
    await tester.tap(find.text(s.t('nav.documents')).last);
    await tester.pumpAndSettle();
    expect(find.text(s.t('docs.missing')), findsOneWidget);
    expect(find.textContaining('passport.pdf'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.delete_outline));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, s.t('common.delete')));
    await tester.pumpAndSettle();
    expect(api.deleted, ['d1']);
    expect(find.text(s.t('docs.empty')), findsOneWidget);
  });

  testWidgets('lawyers: only API-provided verified lawyers; chat blocks identifiers and sends normal text', (tester) async {
    final api = FakeApi();
    final s = await boot(tester, auth: FakeAuth(true), api: api, locale: 'fr');
    await tester.tap(find.text(s.t('nav.lawyers')).last);
    await tester.pumpAndSettle();
    expect(find.text('Ana Pérez'), findsOneWidget);
    expect(find.text(s.t('lawyers.verified')), findsOneWidget);
    expect(find.textContaining('+34600111222'), findsOneWidget);
    expect(find.text(s.t('lawyers.whatsapp')), findsOneWidget);
    await tester.tap(find.widgetWithText(OutlinedButton, s.t('msg.open')));
    await tester.pumpAndSettle();
    expect(find.text(s.t('msg.note')), findsOneWidget);
    api.sendError = ApiException(422, 'identifier_in_message');
    await tester.enterText(find.byType(TextField), 'mon NIE X1234567L');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();
    expect(find.text(s.t('msg.idBlocked')), findsOneWidget);
    api.sendError = null;
    await tester.enterText(find.byType(TextField), 'Bonjour, un rendez-vous ?');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();
    expect(api.sent, ['Bonjour, un rendez-vous ?']);
    expect(find.text('Bonjour, un rendez-vous ?'), findsOneWidget);
    // leave the chat so its polling timer is cancelled before the test ends
    tester.state<NavigatorState>(find.byType(Navigator).first).pop();
    await tester.pumpAndSettle();
  });
}
