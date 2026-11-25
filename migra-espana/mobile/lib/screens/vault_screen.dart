import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api.dart';
import '../core/app_state.dart';
import 'account_screen.dart';
import 'widgets.dart';

const maxBytes = 15 * 1024 * 1024;
const categories = ['passport', 'identity', 'empadronamiento', 'historical_registration', 'employment_contract', 'payslip', 'family_document', 'birth_certificate', 'marriage_certificate', 'criminal_record', 'training_certificate', 'application_receipt', 'administrative_decision', 'other'];
const baseline = ['passport', 'empadronamiento', 'criminal_record'];

/// Pre-checks only; the server re-validates by sniffing the real file bytes.
String? mimeFor(String name) {
  final n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.png')) return 'image/png';
  return null;
}

class VaultScreen extends StatelessWidget {
  const VaultScreen({super.key});
  @override
  Widget build(BuildContext context) => AuthGate(builder: (_) => const _Vault());
}

class _Vault extends StatefulWidget {
  const _Vault();
  @override
  State<_Vault> createState() => _VaultState();
}

class _VaultState extends State<_Vault> {
  List<VaultDoc>? docs;
  String category = 'passport';
  String? expires, message;
  bool busy = false;

  AppState get s => Scope.of(context);
  @override
  void initState() { super.initState(); WidgetsBinding.instance.addPostFrameCallback((_) => load()); }

  Future<void> load() async {
    try { final d = await s.api!.listDocuments(); if (mounted) setState(() => docs = d); }
    catch (_) { if (mounted) setState(() { docs = []; message = s.t('common.error'); }); }
  }

  Future<void> upload(Uint8List bytes, String name) async {
    final mime = mimeFor(name);
    if (mime == null || bytes.isEmpty || bytes.length > maxBytes) { setState(() => message = s.t('docs.formats')); return; }
    setState(() { busy = true; message = null; });
    try { await s.api!.uploadDocument(bytes: bytes, fileName: name, mime: mime, category: category, expiresOn: expires); await load(); }
    on ApiException { if (mounted) setState(() => message = s.t('common.error')); }
    finally { if (mounted) setState(() => busy = false); }
  }

  Future<void> scan() async {
    final x = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85, maxWidth: 2400);
    if (x != null) await upload(await x.readAsBytes(), x.name.contains('.') ? x.name : '${x.name}.jpg');
  }

  Future<void> pickFile() async {
    final r = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], withData: true);
    final f = r?.files.single;
    if (f?.bytes != null) await upload(f!.bytes!, f.name);
  }

  Future<void> open(VaultDoc d) async {
    try { await launchUrl(await s.api!.signedUrl(d.id), mode: LaunchMode.externalApplication); }
    catch (_) { if (mounted) setState(() => message = s.t('common.error')); }
  }

  Future<void> remove(VaultDoc d) async {
    final ok = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
      title: Text('${s.t('common.delete')}?'), content: Text(d.fileName),
      actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: Text(s.t('common.cancel'))), FilledButton(onPressed: () => Navigator.pop(c, true), child: Text(s.t('common.delete')))]));
    if (ok != true) return;
    try { await s.api!.deleteDocument(d.id); await load(); } catch (_) { if (mounted) setState(() => message = s.t('common.error')); }
  }

  @override
  Widget build(BuildContext context) {
    final have = {for (final d in docs ?? <VaultDoc>[]) d.category};
    final missing = baseline.where((c) => !have.contains(c)).toList();
    return ScreenList(children: [
      Text(s.t('docs.title'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
      Text(s.t('docs.formats'), style: TextStyle(color: Theme.of(context).hintColor)),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(
        initialValue: category, isExpanded: true, decoration: InputDecoration(labelText: s.t('docs.category'), border: const OutlineInputBorder()),
        items: [for (final c in categories) DropdownMenuItem(value: c, child: Text(s.t('doc.cat.$c')))], onChanged: (v) => setState(() => category = v!)),
      const SizedBox(height: 10),
      OutlinedButton.icon(icon: const Icon(Icons.event), onPressed: () async {
        final d = await showDatePicker(context: context, initialDate: DateTime.now().add(const Duration(days: 365)), firstDate: DateTime.now().subtract(const Duration(days: 3650)), lastDate: DateTime.now().add(const Duration(days: 365 * 20)));
        if (d != null) setState(() => expires = d.toIso8601String().substring(0, 10));
      }, label: Text('${s.t('docs.expires')}: ${expires ?? '—'}')),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: FilledButton.icon(icon: const Icon(Icons.photo_camera), onPressed: busy ? null : scan, label: Text(s.t('docs.scan')))),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.upload_file), onPressed: busy ? null : pickFile, label: Text(s.t('docs.upload')), style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48)))),
      ]),
      Notice(s.t('docs.noSelfData')),
      if (message != null) Notice(message!),
      if (missing.isNotEmpty && docs != null) Card(child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s.t('docs.missing'), style: const TextStyle(fontWeight: FontWeight.w700)), bullets([for (final c in missing) s.t('doc.cat.$c')])]))),
      if (docs == null) const Center(child: CircularProgressIndicator())
      else if (docs!.isEmpty) Padding(padding: const EdgeInsets.all(12), child: Text(s.t('docs.empty'), style: TextStyle(fontStyle: FontStyle.italic, color: Theme.of(context).hintColor)))
      else for (final d in docs!)
        Card(child: ListTile(
          title: Text(s.t('doc.cat.${d.category}'), style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('${d.fileName}${d.expiresOn != null ? '\n${s.t('docs.expires')}: ${d.expiresOn}' : ''}', style: TextStyle(color: d.expiringSoon() ? const Color(0xFFA33A3A) : null)),
          isThreeLine: d.expiresOn != null,
          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
            IconButton(tooltip: s.t('common.download'), icon: const Icon(Icons.download), onPressed: () => open(d)),
            IconButton(tooltip: s.t('common.delete'), icon: const Icon(Icons.delete_outline), onPressed: () => remove(d)),
          ]),
        )),
    ]);
  }
}
