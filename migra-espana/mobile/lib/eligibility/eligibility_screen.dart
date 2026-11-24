// Port of web/src/components/EligibilityTool.tsx (questionnaire step).
import 'package:flutter/material.dart';

import '../i18n/i18n.dart';
import '../theme.dart';
import 'answers_codec.dart';
import 'eligibility.dart';
import 'results_view.dart';

class EligibilityScreen extends StatefulWidget {
  const EligibilityScreen({super.key});

  @override
  State<EligibilityScreen> createState() => _EligibilityScreenState();
}

class _EligibilityScreenState extends State<EligibilityScreen> {
  Answers _answers = const Answers();
  int _i = 0;
  Assessment? _result;

  List<Question> get _visible => questions.where((q) => isVisible(q, _answers)).toList();

  void _set(String code, String value) => setState(() => _answers = setAnswer(_answers, code, value));

  void _restart() => setState(() {
        _answers = const Answers();
        _i = 0;
        _result = null;
      });

  void _finish() => setState(() => _result = assess(_answers));

  @override
  Widget build(BuildContext context) {
    final l = L10nScope.of(context);
    final result = _result;
    if (result != null) {
      return ResultsView(result: result, onRestart: _restart);
    }

    final visible = _visible;
    // Mirrors the web: visible list can shrink when an earlier answer hides questions.
    final idx = _i.clamp(0, visible.length - 1);
    final q = visible[idx];
    final last = idx >= visible.length - 1;
    final cur = getAnswer(_answers, q.code);
    final title = l.t('q.${q.code}');

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: (idx + 1) / visible.length,
              minHeight: 10,
              backgroundColor: surface2,
              color: gold,
            ),
          ),
          const SizedBox(height: 16),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${l.t('elig.question')} ${idx + 1} ${l.t('elig.of')} ${visible.length}'
                    '${q.additional ? ' · ${l.t('elig.additional')}' : ''}',
                    style: const TextStyle(color: muted, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: navy)),
                  if (l.has('q.help.${q.code}')) ...[
                    const SizedBox(height: 8),
                    Text(l.t('q.help.${q.code}'), style: const TextStyle(color: muted, fontStyle: FontStyle.italic)),
                  ],
                  const SizedBox(height: 16),
                  _buildInput(context, q, cur, l),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: idx == 0 ? null : () => setState(() => _i = idx - 1),
                  child: Text(l.t('common.back')),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: gold, foregroundColor: navy),
                  // Skipping is allowed: unanswered is not "no"; the engine keeps it "to confirm".
                  onPressed: last ? _finish : () => setState(() => _i = idx + 1),
                  child: Text(last ? l.t('elig.seeResults') : l.t('common.next')),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(l.t('elig.disclaimer'), style: const TextStyle(color: muted, fontStyle: FontStyle.italic, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildInput(BuildContext context, Question q, String? cur, L10n l) {
    switch (q.kind) {
      case QuestionKind.country:
        return _PickerTile(
          label: cur == null ? l.t('common.select') : l.country(cur),
          filled: cur != null,
          onTap: () async {
            final picked = await _pickCountry(context, l);
            if (picked != null) _set(q.code, picked);
          },
        );
      case QuestionKind.date:
        return _PickerTile(
          label: cur == null ? l.t('common.select') : _displayDate(cur),
          filled: cur != null,
          onTap: () async {
            final now = DateTime.now();
            final picked = await showDatePicker(
              context: context,
              initialDate: (cur != null ? DateTime.tryParse(cur) : null) ?? DateTime(now.year - 2),
              firstDate: DateTime(1900),
              lastDate: now,
            );
            if (picked != null) _set(q.code, _isoDate(picked));
          },
        );
      case QuestionKind.yesno:
        return _choices(q, cur, [(yes, l.t('common.yes')), (no, l.t('common.no'))]);
      case QuestionKind.yesnounsure:
        return _choices(q, cur, [
          (yes, l.t('common.yes')),
          (no, l.t('common.no')),
          (unsure, l.t('common.unsure')),
        ]);
      case QuestionKind.asylum:
        return _choices(q, cur, [for (final o in asylumOptions) (o, l.t('opt.asylum.$o'))]);
      case QuestionKind.permit:
        return _choices(q, cur, [for (final o in permitOptions) (o, l.t('opt.permit.$o'))]);
    }
  }

  Widget _choices(Question q, String? cur, List<(String, String)> options) {
    return Column(
      children: [
        for (final (value, label) in options)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _ChoiceTile(label: label, selected: cur == value, onTap: () => _set(q.code, value)),
          ),
      ],
    );
  }

  Future<String?> _pickCountry(BuildContext context, L10n l) {
    final codes = countryCodesFor(l);
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _CountrySheet(codes: codes, l10n: l),
    );
  }

  static String _isoDate(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  static String _displayDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}

class _ChoiceTile extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _ChoiceTile({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: selected ? gold : border, width: selected ? 2 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                    color: selected ? gold : muted),
                const SizedBox(width: 12),
                Expanded(child: Text(label, style: const TextStyle(fontSize: 16, color: charcoal))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PickerTile extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;

  const _PickerTile({required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: filled ? gold : border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Row(
            children: [
              Expanded(
                child: Text(label,
                    style: TextStyle(fontSize: 16, color: filled ? charcoal : muted)),
              ),
              const Icon(Icons.expand_more, color: muted),
            ],
          ),
        ),
      ),
    );
  }
}

/// Country codes sorted by their localized name, like the web picker (`localeCompare`).
List<String> countryCodesFor(L10n l) {
  final codes = countryNamesFor(l.languageCode);
  codes.sort((a, b) => l.country(a).compareTo(l.country(b)));
  return codes;
}

class _CountrySheet extends StatefulWidget {
  final List<String> codes;
  final L10n l10n;

  const _CountrySheet({required this.codes, required this.l10n});

  @override
  State<_CountrySheet> createState() => _CountrySheetState();
}

class _CountrySheetState extends State<_CountrySheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final shown = q.isEmpty
        ? widget.codes
        : widget.codes.where((c) => widget.l10n.country(c).toLowerCase().contains(q)).toList();
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.75,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              autofocus: true,
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: widget.l10n.t('common.select'),
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: shown.length,
              itemBuilder: (_, i) => ListTile(
                title: Text(widget.l10n.country(shown[i])),
                onTap: () => Navigator.of(context).pop(shown[i]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
