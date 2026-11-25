import 'package:flutter/material.dart';

/// Constrains content width on tablets and adds consistent gutters.
class ScreenList extends StatelessWidget {
  final List<Widget> children;
  const ScreenList({super.key, required this.children});
  @override
  Widget build(BuildContext context) => ListView(padding: EdgeInsets.symmetric(horizontal: MediaQuery.sizeOf(context).width > 760 ? (MediaQuery.sizeOf(context).width - 720) / 2 : 16, vertical: 20), children: children);
}

class Notice extends StatelessWidget {
  final String text;
  const Notice(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.symmetric(vertical: 8), padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Theme.of(context).colorScheme.secondary.withValues(alpha: .14), borderRadius: BorderRadius.circular(8), border: const BorderDirectional(start: BorderSide(color: Color(0xFFC7A45B), width: 4))),
        child: Text(text),
      );
}

Widget bullets(List<String> items) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final i in items) Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('•  '), Expanded(child: Text(i))]))]);
