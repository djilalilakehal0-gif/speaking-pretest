import 'package:flutter/material.dart';
import '../core/app_state.dart';
import 'guides_screen.dart';
import 'start_screen.dart';
import 'widgets.dart';

const _gold = Color(0xFFC7A45B), _goldHi = Color(0xFFF1D48A), _goldLo = Color(0xFFA9842F);

class HomeScreen extends StatelessWidget {
  final void Function(int) go;
  const HomeScreen({super.key, required this.go});

  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    final wide = MediaQuery.sizeOf(context).width > 640;
    void guides() => Navigator.push(context, MaterialPageRoute(builder: (_) => Directionality(textDirection: s.rtl ? TextDirection.rtl : TextDirection.ltr, child: Scaffold(appBar: AppBar(title: Text(s.t('nav.guides'))), body: const SafeArea(child: GuidesScreen())))));
    void start() => Navigator.push(context, MaterialPageRoute(builder: (_) => const StartScreen()));
    final tiles = [
      _Tile(title: s.t('shortcut.eligibility'), image: 'assets/brand/clipboard.jpg', onTap: () => go(2)),
      _Tile(title: s.t('shortcut.pathway'), image: 'assets/brand/road.jpg', onTap: start, tall: true),
      _Tile(title: s.t('shortcut.law'), image: 'assets/brand/gavel.jpg', onTap: () => go(1)),
    ];
    return ListView(padding: EdgeInsets.zero, children: [
      // Hero: Madrid photo fading into the night background, then gold-gradient headline.
      SizedBox(height: 230, child: Stack(fit: StackFit.expand, children: [
        Image.asset('assets/brand/hero.jpg', fit: BoxFit.cover, alignment: Alignment.topCenter),
        const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xFF0A1530)], stops: [.55, 1]))),
      ])),
      Padding(padding: const EdgeInsets.fromLTRB(18, 4, 18, 0), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(s.t('hero.eyebrow'), style: const TextStyle(color: _goldHi, fontWeight: FontWeight.w700, fontSize: 16)),
        Container(height: 2, width: 160, margin: const EdgeInsets.only(top: 6, bottom: 10), decoration: const BoxDecoration(gradient: LinearGradient(colors: [Colors.transparent, _gold, Colors.transparent]))),
        ShaderMask(
          shaderCallback: (r) => const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.white, Colors.white, _goldHi, _gold], stops: [0, .45, .7, 1]).createShader(r),
          child: Text(s.t('hero.title'), style: const TextStyle(color: Colors.white, fontSize: 34, height: 1.2, fontWeight: FontWeight.w800)),
        ),
        const SizedBox(height: 12),
        Text(s.t('hero.sub'), style: const TextStyle(color: Color(0xFFE6EBF5), fontSize: 15.5, height: 1.6)),
        const SizedBox(height: 18),
        _GoldButton(icon: Icons.rocket_launch_outlined, label: s.t('hero.cta1'), onTap: () => go(2)),
        const SizedBox(height: 12),
        OutlinedButton.icon(onPressed: () => go(1), icon: const Icon(Icons.balance_outlined, color: _gold), label: Text(s.t('hero.cta2'))),
        const SizedBox(height: 12),
        OutlinedButton.icon(onPressed: start, icon: const Icon(Icons.description_outlined, color: _gold), label: Text(s.t('start.homeLink'))),
        const SizedBox(height: 26),
        _RuleTitle(s.t('home.shortcuts')),
        const SizedBox(height: 14),
        if (wide)
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Column(children: [tiles[0], const SizedBox(height: 14), tiles[2]])),
            const SizedBox(width: 14), Expanded(child: tiles[1]),
          ])
        else ...[tiles[0], const SizedBox(height: 14), tiles[1], const SizedBox(height: 14), tiles[2]],
        const SizedBox(height: 14),
        _TrustCard(title: s.t('home.trust.title'), body: s.t('home.trust.body'), small: s.t('home.notLawyer')),
        const SizedBox(height: 10),
        Card(child: ListTile(leading: const Icon(Icons.format_list_numbered, color: _gold), title: Text(s.t('nav.guides')), trailing: const Icon(Icons.chevron_right), onTap: guides)),
        const SizedBox(height: 24),
      ])),
    ]);
  }
}

class _GoldButton extends StatelessWidget {
  final IconData icon; final String label; final VoidCallback onTap;
  const _GoldButton({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(40), gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [_goldHi, _gold, _goldLo]), boxShadow: [BoxShadow(color: _gold.withValues(alpha: .45), blurRadius: 22, offset: const Offset(0, 8))]),
        child: Material(type: MaterialType.transparency, child: InkWell(borderRadius: BorderRadius.circular(40), onTap: onTap, child: SizedBox(height: 56, child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: const Color(0xFF14203A)), const SizedBox(width: 10),
          Flexible(child: Text(label, style: const TextStyle(color: Color(0xFF14203A), fontWeight: FontWeight.w800, fontSize: 17), overflow: TextOverflow.ellipsis)),
        ])))),
      );
}

class _RuleTitle extends StatelessWidget {
  final String text;
  const _RuleTitle(this.text);
  @override
  Widget build(BuildContext context) {
    Widget line(bool flip) => Expanded(child: Container(height: 2, decoration: BoxDecoration(gradient: LinearGradient(colors: flip ? [_gold, Colors.transparent] : [Colors.transparent, _gold]))));
    return Row(children: [line(false), Flexible(flex: 6, child: Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text(text, textAlign: TextAlign.center, style: const TextStyle(color: _goldHi, fontSize: 22, fontWeight: FontWeight.w800)))), line(true)]);
  }
}

class _Tile extends StatelessWidget {
  final String title, image; final VoidCallback onTap; final bool tall;
  const _Tile({required this.title, required this.image, required this.onTap, this.tall = false});
  @override
  Widget build(BuildContext context) {
    final heading = Row(children: [
      Icon(Directionality.of(context) == TextDirection.rtl ? Icons.chevron_left : Icons.chevron_right, color: _gold),
      const SizedBox(width: 6), Expanded(child: Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white))),
    ]);
    return Card(clipBehavior: Clip.antiAlias, child: InkWell(onTap: onTap, child: Padding(
      padding: const EdgeInsets.all(16),
      child: tall
          ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [heading, const SizedBox(height: 10), ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.asset(image, height: 150, fit: BoxFit.cover))])
          : Row(children: [Expanded(child: heading), const SizedBox(width: 8), ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.asset(image, height: 92, width: 120, fit: BoxFit.contain))]),
    )));
  }
}

class _TrustCard extends StatelessWidget {
  final String title, body, small;
  const _TrustCard({required this.title, required this.body, required this.small});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(24), border: Border.all(color: _gold, width: 1.5), gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF1E3460), Color(0xFF0C1834)])),
        child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Icon(Icons.verified_outlined, color: _gold), const SizedBox(width: 8), Expanded(child: Text(title, style: const TextStyle(color: _goldHi, fontSize: 19, fontWeight: FontWeight.w800)))]),
            const SizedBox(height: 8), Text(body, style: const TextStyle(color: Colors.white, height: 1.55)),
            const SizedBox(height: 8), Notice(small),
          ])),
          const SizedBox(width: 10),
          ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.asset('assets/brand/folder.jpg', width: 96)),
        ]),
      );
}
