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

const goldHi = Color(0xFFF1D48A), goldLo = Color(0xFFA9842F), night = Color(0xFF0A1530), glass = Color(0xFF16284A);

/// Single-theme luxury night look (brand mockup): navy stage, gold accents, rounded glass cards.
ThemeData luxTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: navy, brightness: Brightness.dark, primary: gold, onPrimary: navy, secondary: goldHi, surface: glass, onSurface: const Color(0xFFF4F6F9));
  return ThemeData(
    useMaterial3: true, colorScheme: scheme, scaffoldBackgroundColor: night,
    appBarTheme: const AppBarTheme(backgroundColor: night, foregroundColor: goldHi, centerTitle: true, elevation: 0),
    cardTheme: CardThemeData(elevation: 0, color: glass.withValues(alpha: .85), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22), side: BorderSide(color: gold.withValues(alpha: .45)))),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(backgroundColor: gold, foregroundColor: navy, minimumSize: const Size(48, 52), shape: const StadiumBorder(), textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: gold, width: 1.5), minimumSize: const Size(48, 52), shape: const StadiumBorder(), textStyle: const TextStyle(fontWeight: FontWeight.w700))),
    navigationBarTheme: NavigationBarThemeData(backgroundColor: const Color(0xFF0B1630), indicatorColor: gold.withValues(alpha: .22), labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)), iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(color: s.contains(WidgetState.selected) ? goldHi : gold))),
    inputDecorationTheme: InputDecorationTheme(filled: true, fillColor: const Color(0xFF0E1C3D), border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: gold.withValues(alpha: .4)))),
    dividerColor: gold.withValues(alpha: .3),
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
      theme: luxTheme(), darkTheme: luxTheme(), themeMode: ThemeMode.dark,
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
        toolbarHeight: 72,
        leading: Padding(padding: const EdgeInsets.all(8), child: ClipOval(child: Image.asset('assets/brand/logo.jpg', fit: BoxFit.cover))),
        title: Column(mainAxisSize: MainAxisSize.min, children: [
          ShaderMask(shaderCallback: (r) => const LinearGradient(colors: [goldHi, gold, goldLo], begin: Alignment.topCenter, end: Alignment.bottomCenter).createShader(r),
            child: const Text('MIGRA ESPAÑA', style: TextStyle(color: Colors.white, fontFamily: 'serif', fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 2.5))),
          Text(s.t('brand.tagline'), style: const TextStyle(color: goldHi, fontSize: 13, fontWeight: FontWeight.w700)),
        ]),
        actions: [
          PopupMenuButton<String>(
            tooltip: s.t('nav.language'), icon: const Icon(Icons.language), onSelected: s.setLocale,
            itemBuilder: (_) => [for (final l in locales) CheckedPopupMenuItem(value: l, checked: l == s.locale, child: Text(localeNames[l]!))],
          ),
          ListenableBuilder(listenable: s.auth, builder: (context, _) => s.auth.signedIn
              ? IconButton(tooltip: s.t('nav.logout'), icon: const Icon(Icons.logout), onPressed: s.auth.signOut)
              : IconButton(tooltip: s.t('nav.login'), icon: const Icon(Icons.account_circle_outlined), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen())))),
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
