import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api.dart';
import '../core/app_state.dart';
import 'account_screen.dart';
import 'widgets.dart';

class LawyersScreen extends StatefulWidget {
  const LawyersScreen({super.key});
  @override
  State<LawyersScreen> createState() => _LawyersScreenState();
}

class _LawyersScreenState extends State<LawyersScreen> {
  List<Lawyer>? lawyers;
  String? message;
  AppState get s => Scope.of(context);

  @override
  void initState() { super.initState(); WidgetsBinding.instance.addPostFrameCallback((_) => load()); }

  Future<void> load() async {
    final api = s.api;
    if (api == null) { setState(() => lawyers = []); return; }
    try { final l = await api.listLawyers(); if (mounted) setState(() => lawyers = l); }
    catch (_) { if (mounted) setState(() { lawyers = []; message = s.t('common.error'); }); }
  }

  Future<void> message_(Lawyer l) async {
    if (!s.auth.signedIn) { await Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen())); if (!s.auth.signedIn) return; }
    try {
      final id = await s.api!.openConversation(l.id);
      if (mounted) Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(conversationId: id, title: l.name)));
    } on ApiException { if (mounted) setState(() => message = s.t('msg.unavailable')); }
  }

  Future<void> book(Lawyer l) async {
    if (!s.auth.signedIn) { await Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen())); if (!s.auth.signedIn) return; }
    final date = await showDatePicker(context: context, initialDate: DateTime.now().add(const Duration(days: 1)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 120)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 10, minute: 0));
    if (time == null) return;
    final start = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    try { await s.api!.book(l.id, start.toUtc(), 30); if (mounted) setState(() => message = s.t('appt.requested')); }
    on ApiException catch (e) { if (mounted) setState(() => message = e.code == 'slot_taken' ? s.t('appt.slotTaken') : e.code == 'too_soon' ? s.t('appt.tooSoon') : s.t('common.error')); }
  }

  @override
  Widget build(BuildContext context) {
    return ScreenList(children: [
      Row(children: [
        Expanded(child: Text(s.t('lawyers.title'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700))),
        IconButton(tooltip: s.t('msg.title'), icon: const Icon(Icons.forum_outlined), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ConversationsScreen()))),
      ]),
      Text(s.t('lawyers.intro')),
      if (message != null) Notice(message!),
      if (lawyers == null) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))
      else if (lawyers!.isEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: Text(s.t('lawyers.empty')))
      else for (final l in lawyers!)
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Chip(avatar: const Icon(Icons.verified, size: 18, color: Color(0xFF1D7A4D)), label: Text(s.t('lawyers.verified'))),
          Text(l.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          Text('${s.t('lawyers.bar')}: ${l.bar}\n${s.t('lawyers.languages')}: ${l.languages.map((x) => localeNames[x] ?? x).join(', ')}'),
          if (l.priceCents != null) Text('${s.t('lawyers.price')}: ${(l.priceCents! / 100).toStringAsFixed(2)} ${l.currency}', style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          Wrap(spacing: 10, runSpacing: 8, children: [FilledButton(onPressed: () => book(l), child: Text(s.t('lawyers.book'))), OutlinedButton(onPressed: () => message_(l), child: Text(s.t('msg.open'))),
            if (l.phone != null) OutlinedButton.icon(icon: const Icon(Icons.call), onPressed: () => launchUrl(telUri(l.phone!)), label: Text('${s.t('lawyers.call')} ${l.phone}')),
            if (l.whatsapp != null) OutlinedButton.icon(icon: const Icon(Icons.chat), onPressed: () => launchUrl(whatsappUri(l.whatsapp!), mode: LaunchMode.externalApplication), label: Text(s.t('lawyers.whatsapp')))]),
        ]))),
      Notice(s.t('lawyers.disclaimer')),
    ]);
  }
}

class ConversationsScreen extends StatelessWidget {
  const ConversationsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return Directionality(textDirection: s.rtl ? TextDirection.rtl : TextDirection.ltr, child: Scaffold(appBar: AppBar(title: Text(s.t('msg.title'))), body: SafeArea(child: AuthGate(builder: (_) => const _Conversations()))));
  }
}

class _Conversations extends StatefulWidget {
  const _Conversations();
  @override
  State<_Conversations> createState() => _ConversationsState();
}

class _ConversationsState extends State<_Conversations> {
  List<Conversation>? items;
  AppState get s => Scope.of(context);
  @override
  void initState() { super.initState(); WidgetsBinding.instance.addPostFrameCallback((_) => load()); }
  Future<void> load() async {
    try { final c = await s.api!.listConversations(); if (mounted) setState(() => items = c); } catch (_) { if (mounted) setState(() => items = []); }
  }
  @override
  Widget build(BuildContext context) => ScreenList(children: [
        if (items == null) const Center(child: CircularProgressIndicator())
        else if (items!.isEmpty) Text(s.t('msg.empty'), style: const TextStyle(fontStyle: FontStyle.italic))
        else for (final c in items!)
          Card(child: ListTile(
            title: Text(c.withName ?? s.t('msg.client'), style: TextStyle(fontWeight: c.unread ? FontWeight.w800 : FontWeight.w500)),
            subtitle: Text(c.lastBody ?? '—', maxLines: 1, overflow: TextOverflow.ellipsis), trailing: c.unread ? const Icon(Icons.circle, size: 12, color: Color(0xFFC7A45B)) : null,
            onTap: () async { await Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(conversationId: c.id, title: c.withName ?? s.t('msg.client')))); load(); })),
      ]);
}

class ChatScreen extends StatefulWidget {
  final String conversationId, title;
  const ChatScreen({super.key, required this.conversationId, required this.title});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Message> msgs = [];
  final ctrl = TextEditingController();
  Timer? timer;
  String? error;
  AppState get s => Scope.of(context);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) { load(); timer = Timer.periodic(const Duration(seconds: 8), (_) => load()); });
  }
  @override
  void dispose() { timer?.cancel(); ctrl.dispose(); super.dispose(); }

  Future<void> load() async {
    try { final m = await s.api!.messages(widget.conversationId); if (mounted) setState(() => msgs = m); } catch (_) {}
  }

  Future<void> send() async {
    final text = ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => error = null);
    try { await s.api!.sendMessage(widget.conversationId, text); ctrl.clear(); await load(); }
    on ApiException catch (e) { if (mounted) setState(() => error = e.code == 'identifier_in_message' ? s.t('msg.idBlocked') : e.code == 'forbidden' ? s.t('msg.unavailable') : s.t('common.error')); }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Directionality(
      textDirection: s.rtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: SafeArea(child: Column(children: [
          Notice(s.t('msg.note')),
          Expanded(child: ListView(padding: const EdgeInsets.all(12), children: [
            for (final m in msgs)
              Align(
                alignment: m.mine ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 4), padding: const EdgeInsets.all(12), constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .8),
                  decoration: BoxDecoration(color: m.mine ? const Color(0xFF101D35) : cs.surface, borderRadius: BorderRadius.circular(14), border: m.mine ? null : Border.all(color: cs.outlineVariant)),
                  child: Text(m.body, style: TextStyle(color: m.mine ? Colors.white : null)),
                ),
              ),
          ])),
          if (error != null) Notice(error!),
          Padding(padding: const EdgeInsets.all(10), child: Row(children: [
            Expanded(child: TextField(controller: ctrl, minLines: 1, maxLines: 4, maxLength: 4000, decoration: InputDecoration(hintText: s.t('msg.placeholder'), border: const OutlineInputBorder(), counterText: ''))),
            const SizedBox(width: 8), IconButton.filled(tooltip: s.t('common.send'), onPressed: send, icon: const Icon(Icons.send)),
          ])),
        ])),
      ),
    );
  }
}
