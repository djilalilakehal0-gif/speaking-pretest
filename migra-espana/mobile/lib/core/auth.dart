import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Auth abstraction so screens/tests do not depend on Supabase directly.
abstract class AuthService extends ChangeNotifier {
  String? get email;
  String? get accessToken;
  bool get signedIn => accessToken != null;
  bool get available;
  Future<String?> signIn(String email, String password);
  Future<String?> signUp(String email, String password, {required String locale, required bool aiConsent});
  Future<void> signOut();
  Future<void> resetPassword(String email);
}

/// No backend configured: screens show a demo notice and nothing is stored.
class NoBackendAuth extends AuthService {
  @override
  String? get email => null;
  @override
  String? get accessToken => null;
  @override
  bool get available => false;
  @override
  Future<String?> signIn(String email, String password) async => 'not_configured';
  @override
  Future<String?> signUp(String email, String password, {required String locale, required bool aiConsent}) async => 'not_configured';
  @override
  Future<void> signOut() async {}
  @override
  Future<void> resetPassword(String email) async {}
}

class SupabaseAuth extends AuthService {
  SupabaseAuth() {
    Supabase.instance.client.auth.onAuthStateChange.listen((_) => notifyListeners());
  }
  GoTrueClient get _a => Supabase.instance.client.auth;
  @override
  String? get email => _a.currentUser?.email;
  @override
  String? get accessToken => _a.currentSession?.accessToken;
  @override
  bool get available => true;

  @override
  Future<String?> signIn(String email, String password) async {
    try { await _a.signInWithPassword(email: email, password: password); return null; } on AuthException catch (e) { return e.message; }
  }

  /// Consent is timestamped in user metadata; the database trigger copies it to user_preferences.
  /// Returns 'check_email' when the project requires email confirmation before a session exists.
  @override
  Future<String?> signUp(String email, String password, {required String locale, required bool aiConsent}) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();
      final r = await _a.signUp(email: email, password: password, data: {'locale': locale, 'consent_terms_at': now, 'consent_ai_at': aiConsent ? now : ''});
      return r.session == null ? 'check_email' : null;
    } on AuthException catch (e) { return e.message; }
  }

  @override
  Future<void> signOut() => _a.signOut();
  @override
  Future<void> resetPassword(String email) => _a.resetPasswordForEmail(email);
}
