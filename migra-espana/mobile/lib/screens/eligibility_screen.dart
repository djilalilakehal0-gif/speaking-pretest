import 'package:flutter/material.dart';
import '../core/app_state.dart';
import '../core/eligibility.dart';
import 'widgets.dart';

const _countries = 'AF AL DZ AD AO AR AM AU AZ BD BY BO BA BR CM CA CF TD CL CN CO CD CG CR CI CU DO EC EG SV ER ET GE GH GT GN GW GY HT HN IN ID IR IQ JM JP JO KZ KE XK KG LB LR LY MK MG ML MR MX MD MA MZ MM NP NI NE NG PK PS PA PY PE PH RU RW SN RS SL SO ZA SS SD SY TJ TZ TH TG TN TR TM UG UA UY UZ VE VN YE ZM ZW AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI SE IS LI NO CH GB US';

/// ISO code -> flag emoji + code (no ICU dependency; names resolved by the user's own recognition of the code/flag).
String _flag(String c) => String.fromCharCodes(c.codeUnits.map((u) => 0x1F1E6 + u - 65));

class EligibilityScreen extends StatefulWidget {
  const EligibilityScreen({super.key});
  @override
  State<EligibilityScreen> createState() => _EligibilityScreenState();
}

class _EligibilityScreenState extends State<EligibilityScreen> {
  final Answers answers = {};
  int i = 0;
  bool done = false;
  final Set<String> ticked = {};

  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return done ? _results(context, s) : _question(context, s);
  }

  Widget _question(BuildContext context, AppState s) {
    final vis = questions.where((q) => isVisible(q, answers)).toList();
    final q = vis[i.clamp(0, vis.length - 1)];
    final cur = answers[q.code];
    final last = i >= vis.length - 1;
    Widget input;
    switch (q.kind) {
      case QKind.country:
        input = DropdownButtonFormField<String>(
          initialValue: cur, isExpanded: true, hint: Text(s.t('common.select')), menuMaxHeight: 360,
          items: [for (final c in _countries.split(' ')) DropdownMenuItem(value: c, child: Text('${_flag(c)}  $c'))],
          onChanged: (v) => setState(() => answers[q.code] = v!),
        );
      case QKind.date:
        input = OutlinedButton.icon(
          icon: const Icon(Icons.event), style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          label: Text(cur ?? s.t('common.select')),
          onPressed: () async {
            final d = await showDatePicker(context: context, initialDate: DateTime.now().subtract(const Duration(days: 365 * 3)), firstDate: DateTime(1980), lastDate: DateTime.now());
            if (d != null) setState(() => answers[q.code] = d.toIso8601String().substring(0, 10));
          },
        );
      default:
        final opts = q.kind == QKind.asylum ? [for (final o in asylumOptions) (o, s.t('opt.asylum.$o'))]
            : q.kind == QKind.permit ? [for (final o in permitOptions) (o, s.t('opt.permit.$o'))]
            : [('yes', s.t('common.yes')), ('no', s.t('common.no')), if (q.kind == QKind.yesnounsure) ('unsure', s.t('common.unsure'))];
        input = RadioGroup<String>(
          groupValue: cur, onChanged: (v) => setState(() => answers[q.code] = v!),
          child: Column(children: [for (final o in opts) Card(child: RadioListTile<String>(value: o.$1, title: Text(o.$2)))]),
        );
    }
    final help = s.t('q.help.${q.code}');
    return ScreenList(children: [
      Text(s.t('elig.title'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
      const SizedBox(height: 10),
      LinearProgressIndicator(value: (i + 1) / vis.length, color: gold, minHeight: 8, borderRadius: BorderRadius.circular(8)),
      const SizedBox(height: 8),
      Text('${s.t('elig.question')} ${i + 1} ${s.t('elig.of')} ${vis.length}${q.additional ? ' · ${s.t('elig.additional')}' : ''}', style: TextStyle(color: Theme.of(context).hintColor)),
      const SizedBox(height: 12),
      Text(s.t('q.${q.code}'), style: Theme.of(context).textTheme.titleLarge),
      if (help != 'q.help.${q.code}') Padding(padding: const EdgeInsets.only(top: 6), child: Text(help, style: TextStyle(fontStyle: FontStyle.italic, color: Theme.of(context).hintColor))),
      const SizedBox(height: 14), input, const SizedBox(height: 16),
      Row(children: [
        OutlinedButton(onPressed: i == 0 ? null : () => setState(() => i--), child: Text(s.t('common.back'))),
        const Spacer(),
        // Skipping is allowed: unanswered is "to confirm", never "no".
        FilledButton(onPressed: () => setState(() => last ? done = true : i++), child: Text(last ? s.t('elig.seeResults') : s.t('common.next'))),
      ]),
      Notice(s.t('elig.disclaimer')),
    ]);
  }

  Widget _results(BuildContext context, AppState s) {
    final res = assess(answers);
    final docs = {for (final r in res.results.where((r) => r.bucket != 'not_met')) ...r.documents};
    Widget sect(String title, List<String> codes, [String pre = 'elig.code.']) => codes.isEmpty ? const SizedBox() : Padding(padding: const EdgeInsets.only(top: 10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w700)), bullets([for (final c in codes) s.t('$pre$c')])]));
    final colors = {'eligible': const Color(0xFF1D7A4D), 'needs_info': const Color(0xFF9A6A00), 'not_met': const Color(0xFFA33A3A)};
    return ScreenList(children: [
      Notice(s.t('elig.disclaimer')),
      if (res.monthsInSpain != null) Text('${s.t('elig.monthsInSpain')}: ${res.monthsInSpain} ${s.t('elig.months')} · ${s.t('common.lastVerified')}: $rulesSnapshotDate'),
      if (res.results.isEmpty) Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(s.t('elig.empty')))),
      for (final b in ['eligible', 'needs_info', 'not_met'])
        if (res.bucket(b).isNotEmpty) ...[
          Padding(padding: const EdgeInsets.only(top: 20, bottom: 6), child: Text(s.t('elig.$b'), style: Theme.of(context).textTheme.titleLarge)),
          for (final r in res.bucket(b))
            Card(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: colors[b]!, width: 1.5)), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(s.t('pathway.${r.pathway}'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              sect(s.t('elig.met'), r.met), sect(s.t('elig.missing'), r.missing), sect(s.t('elig.notMet'), r.notMet),
              sect(s.t('elig.docsNeeded'), r.documents, 'doc.'), sect(s.t('elig.nextSteps'), r.nextSteps),
            ]))),
        ],
      if (docs.isNotEmpty) ...[
        Padding(padding: const EdgeInsets.only(top: 20), child: Text(s.t('checklist.title'), style: Theme.of(context).textTheme.titleLarge)),
        Text(s.t('checklist.hint'), style: TextStyle(color: Theme.of(context).hintColor)),
        for (final d in docs) CheckboxListTile(value: ticked.contains(d), onChanged: (v) => setState(() => v! ? ticked.add(d) : ticked.remove(d)), title: Text(s.t('doc.$d')), controlAffinity: ListTileControlAffinity.leading),
      ],
      if (res.needsLawyerReview) Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s.t('elig.lawyerTitle'), style: Theme.of(context).textTheme.titleMedium), bullets([for (final x in res.lawyerReviewReasons) s.t('elig.reason.$x')])]))),
      const SizedBox(height: 16),
      FilledButton(onPressed: () => setState(() { answers.clear(); i = 0; done = false; ticked.clear(); }), child: Text(s.t('elig.restart'))),
    ]);
  }
}

const gold = Color(0xFFC7A45B);
