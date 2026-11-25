import 'package:flutter/material.dart';
import '../core/app_state.dart';
import 'widgets.dart';

class AccountScreen extends StatefulWidget {
  final bool startRegister;
  const AccountScreen({super.key, this.startRegister = false});
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final email = TextEditingController(), password = TextEditingController();
  late bool register = widget.startRegister;
  bool terms = false, ai = false, busy = false;
  String? message;

  @override
  void dispose() { email.dispose(); password.dispose(); super.dispose(); }

  Future<void> submit(AppState s) async {
    if (register && !terms) { setState(() => message = '${s.t('common.required')}: ${s.t('auth.consentTerms')}'); return; }
    setState(() { busy = true; message = null; });
    final err = register
        ? await s.auth.signUp(email.text.trim(), password.text, locale: s.locale, aiConsent: ai)
        : await s.auth.signIn(email.text.trim(), password.text);
    if (!mounted) return;
    setState(() => busy = false);
    if (err == null) { Navigator.pop(context); return; }
    setState(() => message = err == 'check_email' ? s.t('auth.checkEmail') : err == 'not_configured' ? s.t('common.notConfigured') : err);
  }

  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return Directionality(
      textDirection: s.rtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(register ? s.t('auth.register') : s.t('auth.login'))),
        body: SafeArea(child: ScreenList(children: [
          if (!s.auth.available) Notice(s.t('common.demo')),
          TextField(controller: email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], decoration: InputDecoration(labelText: s.t('auth.email'), border: const OutlineInputBorder())),
          const SizedBox(height: 14),
          TextField(controller: password, obscureText: true, autofillHints: [register ? AutofillHints.newPassword : AutofillHints.password], decoration: InputDecoration(labelText: s.t('auth.password'), border: const OutlineInputBorder())),
          if (register) ...[
            CheckboxListTile(contentPadding: EdgeInsets.zero, controlAffinity: ListTileControlAffinity.leading, value: terms, onChanged: (v) => setState(() => terms = v!), title: Text(s.t('auth.consentTerms'))),
            CheckboxListTile(contentPadding: EdgeInsets.zero, controlAffinity: ListTileControlAffinity.leading, value: ai, onChanged: (v) => setState(() => ai = v!), title: Text(s.t('auth.consentAi'))),
          ],
          const SizedBox(height: 12),
          FilledButton(onPressed: busy ? null : () => submit(s), child: Text(register ? s.t('auth.register') : s.t('auth.login'))),
          if (message != null) Notice(message!),
          if (!register) TextButton(onPressed: () async { if (email.text.isNotEmpty) { await s.auth.resetPassword(email.text.trim()); setState(() => message = s.t('auth.checkEmail')); } }, child: Text(s.t('auth.forgot'))),
          TextButton(onPressed: () => setState(() => register = !register), child: Text(register ? '${s.t('auth.haveAccount')} ${s.t('auth.login')}' : '${s.t('auth.noAccount')} ${s.t('auth.register')}')),
        ])),
      ),
    );
  }
}

/// Wraps a feature that needs a signed-in user and a configured backend; shows the right empty state otherwise.
class AuthGate extends StatelessWidget {
  final Widget Function(BuildContext) builder;
  const AuthGate({super.key, required this.builder});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return ListenableBuilder(
      listenable: s.auth,
      builder: (context, _) {
        if (!s.auth.available || s.api == null) return ScreenList(children: [Notice(s.t('common.demo')), Notice(s.t('common.notConfigured'))]);
        if (!s.auth.signedIn) {
          return ScreenList(children: [
            Notice(s.t('msg.login')),
            FilledButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen())), child: Text(s.t('auth.login'))),
            TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen(startRegister: true))), child: Text(s.t('auth.register'))),
          ]);
        }
        return builder(context);
      },
    );
  }
}
