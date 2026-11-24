// MIGRA ESPAÑA — Flutter entry point.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'eligibility/eligibility_screen.dart';
import 'i18n/i18n.dart';
import 'theme.dart';

const supportedLocales = [Locale('es'), Locale('en'), Locale('fr'), Locale('ar')];

/// Same names as web/src/i18n/config.ts LOCALE_NAMES.
const localeNames = {'es': 'Español', 'en': 'English', 'fr': 'Français', 'ar': 'العربية'};

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );
  runApp(const MigraApp());
}

class MigraApp extends StatefulWidget {
  const MigraApp({super.key});

  @override
  State<MigraApp> createState() => _MigraAppState();
}

class _MigraAppState extends State<MigraApp> {
  Locale _locale = const Locale('es');

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'MIGRA ESPAÑA',
        debugShowCheckedModeBanner: false,
        locale: _locale, // Arabic => automatic RTL via Directionality
        supportedLocales: supportedLocales,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: navy, primary: navy, secondary: gold),
          scaffoldBackgroundColor: grey,
        ),
        darkTheme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          colorScheme: ColorScheme.fromSeed(seedColor: navy, brightness: Brightness.dark, secondary: gold),
        ),
        builder: (context, child) => L10nScope(l10n: L10n(_locale.languageCode), child: child!),
        home: Scaffold(
          appBar: AppBar(
            backgroundColor: navy,
            foregroundColor: Colors.white,
            title: const Text('MIGRA ESPAÑA'),
            actions: [
              PopupMenuButton<Locale>(
                tooltip: 'Language',
                onSelected: (l) => setState(() => _locale = l),
                itemBuilder: (_) => [
                  for (final l in supportedLocales)
                    PopupMenuItem(value: l, child: Text(localeNames[l.languageCode] ?? l.languageCode)),
                ],
              ),
            ],
          ),
          body: const EligibilityScreen(),
        ),
      );
}
