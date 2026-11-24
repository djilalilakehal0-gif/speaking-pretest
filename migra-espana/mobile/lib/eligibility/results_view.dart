// Port of Results / PathwayCard in web/src/components/EligibilityTool.tsx.
import 'package:flutter/material.dart';

import '../i18n/i18n.dart';
import '../theme.dart';
import 'eligibility.dart';

class ResultsView extends StatelessWidget {
  final Assessment result;
  final VoidCallback onRestart;

  /// Optional: opens the lawyer directory. Hidden when null (the screen is not built yet).
  final VoidCallback? onFindLawyer;

  const ResultsView({super.key, required this.result, required this.onRestart, this.onFindLawyer});

  @override
  Widget build(BuildContext context) {
    final l = L10nScope.of(context);
    final groups = groupByBucket(result);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Banner(text: l.t('elig.disclaimer')),
          if (result.monthsInSpain != null)
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 8),
              child: Text(
                '${l.t('elig.monthsInSpain')}: ${result.monthsInSpain} ${l.t('elig.months')} · '
                '${l.t('common.lastVerified')}: ${result.rulesSnapshotDate}',
                style: const TextStyle(color: muted, fontSize: 13),
              ),
            ),
          if (result.results.isEmpty)
            Card(
              margin: const EdgeInsets.symmetric(vertical: 12),
              child: Padding(padding: const EdgeInsets.all(16), child: Text(l.t('elig.empty'))),
            ),
          for (final bucket in const ['eligible', 'needs_info', 'not_met'])
            if (groups[bucket]!.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text(l.t('elig.$bucket'),
                  style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w600, color: navy)),
              const SizedBox(height: 10),
              for (final r in groups[bucket]!) Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PathwayCard(r: r),
              ),
            ],
          if (result.needsLawyerReview) ...[
            const SizedBox(height: 12),
            _LawyerBox(
              reasons: [for (final x in result.lawyerReviewReasons) l.t('elig.reason.$x')],
              onFindLawyer: onFindLawyer,
            ),
          ],
          const SizedBox(height: 20),
          OutlinedButton(onPressed: onRestart, child: Text(l.t('elig.restart'))),
        ],
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  final String text;
  const _Banner({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: warnBg,
        borderRadius: BorderRadius.circular(8),
        border: const BorderDirectional(start: BorderSide(color: gold, width: 4)),
      ),
      child: Text(text, style: const TextStyle(color: charcoal, fontSize: 14)),
    );
  }
}

class _PathwayCard extends StatelessWidget {
  final PathwayResult r;
  const _PathwayCard({required this.r});

  Color get _accent => switch (r.bucket) {
        'eligible' => ok,
        'needs_info' => warn,
        _ => bad,
      };

  @override
  Widget build(BuildContext context) {
    final l = L10nScope.of(context);

    Widget section(String title, List<String> codes, {String prefix = 'elig.code.'}) {
      if (codes.isEmpty) return const SizedBox.shrink();
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: charcoal)),
            const SizedBox(height: 4),
            for (final c in codes)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('•  ', style: TextStyle(color: muted)),
                    Expanded(child: Text(l.t('$prefix$c'), style: const TextStyle(color: charcoal, height: 1.45))),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(14),
        border: BorderDirectional(start: BorderSide(color: _accent, width: 5)),
        boxShadow: const [BoxShadow(color: Color(0x14101D35), blurRadius: 12, offset: Offset(0, 4))],
      ),
      padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l.t('pathway.${r.pathway}'),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: navy)),
          section(l.t('elig.met'), r.met),
          section(l.t('elig.missing'), r.missing),
          section(l.t('elig.notMet'), r.notMet),
          section(l.t('elig.docsNeeded'), r.documents, prefix: 'doc.'),
          section(l.t('elig.nextSteps'), r.nextSteps),
        ],
      ),
    );
  }
}

class _LawyerBox extends StatelessWidget {
  final List<String> reasons;
  final VoidCallback? onFindLawyer;

  const _LawyerBox({required this.reasons, this.onFindLawyer});

  @override
  Widget build(BuildContext context) {
    final l = L10nScope.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: gold, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l.t('elig.lawyerTitle'),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: navy)),
          const SizedBox(height: 8),
          for (final reason in reasons)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('•  ', style: TextStyle(color: muted)),
                  Expanded(child: Text(reason, style: const TextStyle(color: charcoal, height: 1.45))),
                ],
              ),
            ),
          if (onFindLawyer != null) ...[
            const SizedBox(height: 12),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: gold, foregroundColor: navy),
              onPressed: onFindLawyer,
              child: Text(l.t('elig.lawyerCta')),
            ),
          ],
        ],
      ),
    );
  }
}
