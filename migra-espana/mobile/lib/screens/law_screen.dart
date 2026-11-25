import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/app_state.dart';
import 'widgets.dart';

String _l(Map m, String loc) => (m[loc] ?? m['es'] ?? '') as String;

class LawScreen extends StatelessWidget {
  const LawScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    final items = s.legal.pathways.where((p) => p['slug'] != 'extraordinary-regularisation').toList();
    return ScreenList(children: [
      Text(s.t('nav.law'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
      Notice(s.t('legal.draftBanner')),
      Notice('${s.t('legal.extraordinaryTitle')}. ${s.t('legal.extraordinaryBody')}'),
      for (final p in items)
        Card(child: ListTile(
          title: Text(_l(p['title'] as Map, s.locale), style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('${s.t('status.${p['status']}')} · ${p['legalReference']}\n${s.t('common.lastVerified')}: ${p['lastVerifiedOn'] ?? s.t('common.notVerified')}'),
          isThreeLine: true, trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PathwayScreen(p))),
        )),
    ]);
  }
}

class PathwayScreen extends StatelessWidget {
  final Map<String, dynamic> p;
  const PathwayScreen(this.p, {super.key});
  static const sections = [['definition', 'legal.definition'], ['who', 'legal.who'], ['conditions', 'legal.conditions'], ['residence', 'legal.residence'], ['employment', 'legal.employment'], ['renewal', 'legal.renewal']];
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    final verified = (p['verifiedSections'] as List).cast<String>();
    final secs = p['sections'] as Map<String, dynamic>;
    final srcs = s.legal.sources.where((x) => (p['sourceIds'] as List).contains(x['id'])).toList();
    return Directionality(
      textDirection: s.rtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(_l(p['title'] as Map, s.locale))),
        body: SafeArea(child: ScreenList(children: [
          Text(_l(p['summary'] as Map, s.locale)),
          const SizedBox(height: 8),
          Text('${s.t('legal.spanishTerm')}: ${p['spanishTerm']}\n${s.t('common.legalRef')}: ${p['legalReference']}\n${s.t('common.lastVerified')}: ${p['lastVerifiedOn'] ?? s.t('common.notVerified')}', style: TextStyle(color: Theme.of(context).hintColor)),
          Notice(s.t('legal.draftBanner')),
          if (s.locale != 'es') Notice(s.t('legal.translationBanner')),
          for (final sec in sections) ...[
            const SizedBox(height: 10), Text(s.t(sec[1]), style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFFC7A45B), fontWeight: FontWeight.w700)),
            if (verified.contains(sec[0]) && (secs[sec[0]] as List?)?.isNotEmpty == true)
              bullets([for (final it in secs[sec[0]] as List) _l(it as Map, s.locale)])
            else Text(s.t('legal.pendingSection'), style: TextStyle(fontStyle: FontStyle.italic, color: Theme.of(context).hintColor)),
          ],
          const SizedBox(height: 10), Text(s.t('legal.fees'), style: Theme.of(context).textTheme.titleMedium), Text(s.t('legal.feesNote')),
          const SizedBox(height: 10), Text(s.t('legal.remedies'), style: Theme.of(context).textTheme.titleMedium), Text(s.t('legal.remediesGeneric')),
          const SizedBox(height: 10), Text(s.t('legal.references'), style: Theme.of(context).textTheme.titleMedium),
          for (final x in srcs) ListTile(contentPadding: EdgeInsets.zero, title: Text(x['title'] as String), subtitle: Text(x['issuer'] as String), trailing: const Icon(Icons.open_in_new), onTap: () => launchUrl(Uri.parse(x['url'] as String), mode: LaunchMode.externalApplication)),
        ])),
      ),
    );
  }
}
