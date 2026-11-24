// Runtime translator. Mirrors web/src/i18n/index.ts: locale → Spanish (legal original) → English → key.
import 'package:flutter/widgets.dart';

import 'strings.g.dart';

const supportedLanguageCodes = ['es', 'en', 'fr', 'ar'];

/// ISO codes available in the country picker (order of the web list).
List<String> countryNamesFor(String languageCode) => countryNames[languageCode]?.keys.toList() ?? <String>[];

class L10n {
  final String languageCode;
  const L10n(this.languageCode);

  String t(String key, {Map<String, Object>? vars}) {
    var s = _lookup(languageCode, key) ?? _lookup('es', key) ?? _lookup('en', key) ?? key;
    vars?.forEach((k, v) => s = s.replaceAll('{$k}', '$v'));
    return s;
  }

  /// True when a translation exists for [key] in the current locale chain (used for optional help texts).
  bool has(String key) => _lookup(languageCode, key) != null || _lookup('es', key) != null || _lookup('en', key) != null;

  /// Localized country name (ICU data, same source as the web picker). Falls back to the ISO code.
  String country(String iso) => countryNames[languageCode]?[iso] ?? countryNames['en']?[iso] ?? iso;

  bool get isRtl => languageCode == 'ar';

  static String? _lookup(String lang, String key) {
    final v = dictionaries[lang]?[key];
    return (v == null || v.isEmpty) ? null : v;
  }
}

/// Provides [L10n] to the widget tree. Rebuilds dependents when the language changes.
class L10nScope extends InheritedWidget {
  final L10n l10n;

  const L10nScope({super.key, required this.l10n, required super.child});

  static L10n of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<L10nScope>();
    assert(scope != null, 'No L10nScope found in context');
    return scope!.l10n;
  }

  @override
  bool updateShouldNotify(L10nScope old) => old.l10n.languageCode != l10n.languageCode;
}
