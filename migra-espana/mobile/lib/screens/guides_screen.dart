import 'package:flutter/material.dart';
import '../core/app_state.dart';
import 'widgets.dart';

class GuidesScreen extends StatelessWidget {
  const GuidesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return ScreenList(children: [
      Text(s.t('guide.title'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
      Text(s.t('guide.timing'), style: TextStyle(color: Theme.of(context).hintColor)),
      const SizedBox(height: 12),
      for (var n = 1; n <= 14; n++)
        Card(child: ListTile(leading: CircleAvatar(backgroundColor: const Color(0xFF101D35), foregroundColor: const Color(0xFFC7A45B), child: Text('$n')), title: Text(s.t('guide.s$n.t'), style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(s.t('guide.s$n.b')))),
    ]);
  }
}
