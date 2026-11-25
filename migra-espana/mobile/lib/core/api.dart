import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;

class ApiException implements Exception {
  final int status;
  final String code;
  ApiException(this.status, this.code);
  @override
  String toString() => 'ApiException($status, $code)';
}

class VaultDoc {
  final String id, category, fileName;
  final String? expiresOn;
  VaultDoc(this.id, this.category, this.fileName, this.expiresOn);
  factory VaultDoc.fromJson(Map<String, dynamic> j) => VaultDoc(j['id'], j['category'], j['file_name'], j['expires_on']);
  /// Same 60-day reminder window as the website.
  bool expiringSoon([DateTime? now]) {
    if (expiresOn == null) return false;
    final d = DateTime.tryParse('${expiresOn}T00:00:00Z');
    return d != null && d.difference(now ?? DateTime.now().toUtc()).inDays <= 60;
  }
}

class Lawyer {
  final String id, name, bar;
  final List<String> languages;
  final int? priceCents;
  final String currency;
  Lawyer(this.id, this.name, this.bar, this.languages, this.priceCents, this.currency);
  factory Lawyer.fromJson(Map<String, dynamic> j) => Lawyer(j['id'], j['display_name'], j['bar_association'], (j['languages'] as List).cast<String>(), j['consultation_price_cents'] as int?, (j['currency'] ?? 'EUR') as String);
}

class Conversation {
  final String id;
  final String? withName, lastBody;
  final bool unread;
  Conversation(this.id, this.withName, this.lastBody, this.unread);
  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(j['id'], j['withName'], (j['last'] as Map?)?['body'] as String?, j['unread'] == true);
}

class Message {
  final String id, body, createdAt;
  final bool mine;
  Message(this.id, this.body, this.createdAt, this.mine);
  factory Message.fromJson(Map<String, dynamic> j) => Message(j['id'], j['body'], j['created_at'], j['mine'] == true);
}

abstract class Api {
  Future<List<VaultDoc>> listDocuments();
  Future<void> uploadDocument({required Uint8List bytes, required String fileName, required String mime, required String category, String? expiresOn});
  Future<Uri> signedUrl(String id);
  Future<void> deleteDocument(String id);
  Future<List<Lawyer>> listLawyers();
  Future<String> openConversation(String lawyerId);
  Future<List<Conversation>> listConversations();
  Future<List<Message>> messages(String conversationId);
  Future<void> sendMessage(String conversationId, String body);
  Future<void> book(String lawyerId, DateTime startsAtUtc, int minutes);
}

/// Talks to the same /api/* routes as the website, authenticated with the Supabase access token.
class HttpApi implements Api {
  final String base;
  final String? Function() token;
  final http.Client client;
  HttpApi(this.base, this.token, [http.Client? c]) : client = c ?? http.Client();

  Map<String, String> get _h => {if (token() != null) 'Authorization': 'Bearer ${token()}'};
  Uri _u(String p) => Uri.parse('$base$p');

  dynamic _ok(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) return r.body.isEmpty ? null : jsonDecode(r.body);
    String code = 'error';
    try { code = (jsonDecode(r.body) as Map)['error'] as String; } catch (_) {}
    throw ApiException(r.statusCode, code);
  }

  Future<dynamic> _get(String p) async => _ok(await client.get(_u(p), headers: _h));
  Future<dynamic> _post(String p, Map<String, dynamic> b) async => _ok(await client.post(_u(p), headers: {..._h, 'Content-Type': 'application/json'}, body: jsonEncode(b)));

  @override
  Future<List<VaultDoc>> listDocuments() async => [for (final j in await _get('/api/documents') as List) VaultDoc.fromJson(j)];

  @override
  Future<void> uploadDocument({required Uint8List bytes, required String fileName, required String mime, required String category, String? expiresOn}) async {
    final req = http.MultipartRequest('POST', _u('/api/documents'))
      ..headers.addAll(_h)
      ..fields['category'] = category
      ..files.add(http.MultipartFile.fromBytes('file', bytes, filename: fileName, contentType: MediaType.parse(mime)));
    if (expiresOn != null) req.fields['expires_on'] = expiresOn;
    _ok(await http.Response.fromStream(await client.send(req)));
  }

  @override
  Future<Uri> signedUrl(String id) async => Uri.parse((await _get('/api/documents/$id/signed-url') as Map)['url'] as String);

  @override
  Future<void> deleteDocument(String id) async => _ok(await client.delete(_u('/api/documents/$id'), headers: _h));

  @override
  Future<List<Lawyer>> listLawyers() async => [for (final j in await _get('/api/lawyers') as List) Lawyer.fromJson(j)];

  @override
  Future<String> openConversation(String lawyerId) async => (await _post('/api/conversations', {'lawyerId': lawyerId}) as Map)['id'] as String;

  @override
  Future<List<Conversation>> listConversations() async => [for (final j in await _get('/api/conversations') as List) Conversation.fromJson(j)];

  @override
  Future<List<Message>> messages(String id) async => [for (final j in await _get('/api/conversations/$id/messages') as List) Message.fromJson(j)];

  @override
  Future<void> sendMessage(String id, String body) async => _post('/api/conversations/$id/messages', {'body': body});

  @override
  Future<void> book(String lawyerId, DateTime startsAtUtc, int minutes) async => _post('/api/appointments', {'lawyerId': lawyerId, 'startsAt': startsAtUtc.toUtc().toIso8601String(), 'minutes': minutes});
}
