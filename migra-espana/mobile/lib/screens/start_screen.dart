import 'package:flutter/material.dart';
import '../core/app_state.dart';
import 'widgets.dart';

/// "I am in Spain without papers. Where do I start?" Only verified or clearly-pending content; no invented legal claims.
class StartScreen extends StatelessWidget {
  const StartScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return Directionality(
      textDirection: s.rtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(s.t('start.homeLink'))),
        body: SafeArea(child: ScreenList(children: [
          Text(s.t('start.title'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8), Text(s.t('start.sub')), const SizedBox(height: 16),
          for (var n = 1; n <= 4; n++)
            Card(child: ListTile(leading: CircleAvatar(backgroundColor: const Color(0xFF101D35), foregroundColor: const Color(0xFFC7A45B), child: Text('$n')), title: Text(s.t('start.s$n.t'), style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(s.t('start.s$n.b')))),
          const SizedBox(height: 8),
          Text(s.t('start.proofTitle'), style: Theme.of(context).textTheme.titleLarge), const SizedBox(height: 6),
          Text(s.t('start.proofBody')), const SizedBox(height: 8),
          bullets([for (var n = 1; n <= 4; n++) s.t('start.proof$n')]),
          Notice(s.t('docs.noSelfData')),
          const SizedBox(height: 8),
          Text(s.t('start.faqTitle'), style: Theme.of(context).textTheme.titleLarge),
          for (var n = 1; n <= 2; n++) Card(child: ExpansionTile(title: Text(s.t('start.faq${n}q')), childrenPadding: const EdgeInsets.all(12), children: [Notice(s.t('start.faqPending'))])),
          Notice(s.t('elig.disclaimer')),
          const SizedBox(height: 8),
          FilledButton(onPressed: () => Navigator.pop(context), child: Text(s.t('start.cta'))),
        ])),
      ),
    );
  }
}
