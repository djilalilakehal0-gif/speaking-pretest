/// Build-time configuration: flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=... --dart-define=API_BASE_URL=https://your-site
/// Nothing secret belongs here: the anon key is public by design (Row Level Security protects data).
class Config {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const apiBase = String.fromEnvironment('API_BASE_URL');
  static bool get configured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty && apiBase.isNotEmpty;
}
