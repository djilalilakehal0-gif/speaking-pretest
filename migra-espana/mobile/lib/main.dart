import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/api.dart';
import 'core/app_state.dart';
import 'core/auth.dart';
import 'core/config.dart';
import 'screens/account_screen.dart';
import 'screens/lawyers_screen.dart';
import 'screens/vault_screen.dart';
import 'screens/eligibility_screen.dart';
import 'screens/home_screen.dart';
import 'screens/law_screen.dart';

const navy = Color(0xFF101D35), gold = Color(0xFFC7A45B), greyBg = Color(0xFFF4F6F9), charcoal = Color(0xFF202633);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final state = AppState();
  await state.load();
  if (Config.configured) {
    await Supabase.initialize(url: Config.supabaseUrl, anonKey: Config.supabaseAnonKey);
    state.auth = SupabaseAuth();
    state.api = HttpApi(Config.apiBase, () => state.auth.accessToken);
  }
  runApp(Scope(state: state, child: const MigraApp()));
}

ThemeData _theme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(seedColor: navy, brightness: b, primary: dark ? gold : navy, secondary: gold, surface: dark ? const Color(0xFF131F38) : Colors.white);
  return ThemeData(
    useMaterial3: true, colorScheme: scheme, scaffoldBackgroundColor: dark ? const Color(0xFF0B1426) : greyBg,
    appBarTheme: const AppBarTheme(backgroundColor: navy, foregroundColor: Colors.white),
    cardTheme: CardThemeData(elevation: 0, color: scheme.surface, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: dark ? const Color(0xFF26385C) : const Color(0xFFDFE4EC)))),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(backgroundColor: gold, foregroundColor: navy, minimumSize: const Size(48, 48), textStyle: const TextStyle(fontWeight: FontWeight.w600))),
  );
}

class MigraApp extends StatelessWidget {
  const MigraApp({super.key});
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    return MaterialApp(
      title: 'MIGRA ESPAÑA',
      debugShowCheckedModeBanner: false,
      locale: Locale(s.locale), // Arabic => RTL automatically
      supportedLocales: const [Locale('es'), Locale('en'), Locale('fr'), Locale('ar')],
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      theme: _theme(Brightness.light), darkTheme: _theme(Brightness.dark), themeMode: s.theme,
      home: const Shell(),
    );
  }
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int tab = 0;
  void go(int i) => setState(() => tab = i);
  @override
  Widget build(BuildContext context) {
    final s = Scope.of(context);
    final pages = [HomeScreen(go: go), const LawScreen(), const EligibilityScreen(), const VaultScreen(), const LawyersScreen()];
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [const Icon(Icons.shield_outlined, color: gold), const SizedBox(width: 10), Flexible(child: Text('MIGRA ESPAÑA', style: const TextStyle(letterSpacing: 2, fontWeight: FontWeight.w600)))]),
        actions: [
          PopupMenuButton<String>(
            tooltip: s.t('nav.language'), icon: const Icon(Icons.language), onSelected: s.setLocale,
            itemBuilder: (_) => [for (final l in locales) CheckedPopupMenuItem(value: l, checked: l == s.locale, child: Text(localeNames[l]!))],
          ),
          ListenableBuilder(listenable: s.auth, builder: (context, _) => s.auth.signedIn
              ? IconButton(tooltip: s.t('nav.logout'), icon: const Icon(Icons.logout), onPressed: s.auth.signOut)
              : IconButton(tooltip: s.t('nav.login'), icon: const Icon(Icons.account_circle_outlined), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen())))),
          IconButton(tooltip: s.t('nav.theme'), icon: const Icon(Icons.brightness_6), onPressed: () => s.toggleTheme(Theme.of(context).brightness)),
        ],
      ),
      body: SafeArea(child: pages[tab]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab, onDestinationSelected: go,
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), label: s.t('nav.home')),
          NavigationDestination(icon: const Icon(Icons.gavel_outlined), label: s.t('nav.law')),
          NavigationDestination(icon: const Icon(Icons.fact_check_outlined), label: s.t('nav.eligibility')),
          NavigationDestination(icon: const Icon(Icons.folder_outlined), label: s.t('nav.documents')),
          NavigationDestination(icon: const Icon(Icons.balance_outlined), label: s.t('nav.lawyers')),
        ],
      ),
    );
  }
}
