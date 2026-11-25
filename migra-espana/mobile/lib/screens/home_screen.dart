import 'package:flutter/material.dart';
import '../core/app_state.dart';
import 'start_screen.dart';
import 'widgets.dart';

class HomeScreen extends StatelessWidget {
  final void Function(int) go;
  const HomeScreen({super.key, required this.go});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    final tiles = [
      (Icons.fact_check_outlined, 'shortcut.eligibility', 2), (Icons.gavel_outlined, 'shortcut.pathway', 1), (Icons.format_list_numbered, 'shortcut.law', 3),
    ];
    return ScreenList(children: [
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), gradient: const LinearGradient(colors: [Color(0xFF0B1426), Color(0xFF182A4D)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s.t('hero.eyebrow').toUpperCase(), style: const TextStyle(color: Color(0xFFC7A45B), fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1.6)),
          const SizedBox(height: 12),
          Text(s.t('hero.title'), style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700, height: 1.2)),
          const SizedBox(height: 12),
          Text(s.t('hero.sub'), style: const TextStyle(color: Color(0xFFCDD6E6))),
          const SizedBox(height: 18),
          Wrap(spacing: 10, runSpacing: 10, children: [
            FilledButton(onPressed: () => go(2), child: Text(s.t('hero.cta1'))),
            OutlinedButton(style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white54), minimumSize: const Size(48, 48)), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StartScreen())), child: Text(s.t('start.homeLink'))),
          ]),
        ]),
      ),
      const SizedBox(height: 24),
      Text(s.t('home.shortcuts'), style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 10),
      for (final t in tiles)
        Card(child: ListTile(leading: CircleAvatar(backgroundColor: const Color(0xFF101D35), child: Icon(t.$1, color: const Color(0xFFC7A45B))), title: Text(s.t(t.$2)), trailing: const Icon(Icons.chevron_right), onTap: () => go(t.$3))),
      const SizedBox(height: 12),
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s.t('home.trust.title'), style: Theme.of(context).textTheme.titleMedium), const SizedBox(height: 6), Text(s.t('home.trust.body')), Notice(s.t('home.notLawyer'))]))),
    ]);
  }
}
