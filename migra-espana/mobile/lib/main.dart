// MIGRA ESPAÑA — Flutter entry point (scaffold). NOT yet built or tested: Flutter SDK was unavailable
// in the authoring environment. See ../docs/MOBILE.md for what remains.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const navy = Color(0xFF101D35), gold = Color(0xFFC7A45B), grey = Color(0xFFF4F6F9), charcoal = Color(0xFF202633);
const supportedLocales = [Locale('es'), Locale('en'), Locale('fr'), Locale('ar')];

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
        locale: _locale, // Arabic => automatic RTL via Directionality
        supportedLocales: supportedLocales,
        localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
        theme: ThemeData(useMaterial3: true, colorScheme: ColorScheme.fromSeed(seedColor: navy, primary: navy, secondary: gold), scaffoldBackgroundColor: grey),
        darkTheme: ThemeData(useMaterial3: true, brightness: Brightness.dark, colorScheme: ColorScheme.fromSeed(seedColor: navy, brightness: Brightness.dark, secondary: gold)),
        home: Scaffold(
          appBar: AppBar(backgroundColor: navy, foregroundColor: Colors.white, title: const Text('MIGRA ESPAÑA'), actions: [
            PopupMenuButton<Locale>(onSelected: (l) => setState(() => _locale = l), itemBuilder: (_) => [for (final l in supportedLocales) PopupMenuItem(value: l, child: Text(l.languageCode.toUpperCase()))]),
          ]),
          body: const Center(child: Text('Scaffold — screens to be ported from web/src (see docs/MOBILE.md)')),
        ),
      );
}
