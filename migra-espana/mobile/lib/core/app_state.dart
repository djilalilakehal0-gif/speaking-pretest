import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

const locales = ['es', 'en', 'fr', 'ar'];
const localeNames = {'es': 'Español', 'en': 'English', 'fr': 'Français', 'ar': 'العربية'};

class Legal {
  final String snapshot;
  final List<Map<String, dynamic>> pathways, sources, resources;
  Legal(this.snapshot, this.pathways, this.sources, this.resources);
}

class AppState extends ChangeNotifier {
  String locale = 'es';
  ThemeMode theme = ThemeMode.system;
  final Map<String, Map<String, String>> _dict = {};
  late Legal legal;

  Future<void> load() async {
    for (final l in locales) {
      final raw = jsonDecode(await rootBundle.loadString('assets/i18n/$l.json')) as Map<String, dynamic>;
      _dict[l] = raw.map((k, v) => MapEntry(k, v as String));
    }
    final j = jsonDecode(await rootBundle.loadString('assets/legal.json')) as Map<String, dynamic>;
    List<Map<String, dynamic>> lst(String k) => (j[k] as List).cast<Map<String, dynamic>>();
    legal = Legal(j['snapshot'] as String, lst('pathways'), lst('sources'), lst('resources'));
    try {
      final p = await SharedPreferences.getInstance();
      final saved = p.getString('locale');
      if (saved != null && locales.contains(saved)) {
        locale = saved;
      } else {
        final dev = WidgetsBinding.instance.platformDispatcher.locale.languageCode;
        if (locales.contains(dev)) locale = dev;
      }
      final th = p.getString('theme');
      theme = th == 'dark' ? ThemeMode.dark : th == 'light' ? ThemeMode.light : ThemeMode.system;
    } catch (_) {/* preferences are a convenience only */}
  }

  /// Falls back to Spanish (legal original) then English, never returns empty.
  String t(String key) => _dict[locale]?[key] ?? _dict['es']![key] ?? _dict['en']![key] ?? key;
  bool get rtl => locale == 'ar';

  Future<void> setLocale(String l) async {
    locale = l;
    notifyListeners();
    try { (await SharedPreferences.getInstance()).setString('locale', l); } catch (_) {}
  }

  Future<void> toggleTheme(Brightness current) async {
    theme = current == Brightness.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
    try { (await SharedPreferences.getInstance()).setString('theme', theme == ThemeMode.dark ? 'dark' : 'light'); } catch (_) {}
  }
}

class Scope extends InheritedNotifier<AppState> {
  const Scope({super.key, required AppState state, required super.child}) : super(notifier: state);
  static AppState of(BuildContext c) => c.dependOnInheritedWidgetOfExactType<Scope>()!.notifier!;
}
