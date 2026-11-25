import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:migra_espana/core/api.dart';

void main() {
  test('sends the Supabase token as a Bearer header and parses documents', () async {
    late http.Request seen;
    final api = HttpApi('https://x.test', () => 'a.b.c', MockClient((r) async {
      seen = r;
      return http.Response(jsonEncode([{'id': 'd1', 'category': 'passport', 'file_name': 'p.pdf', 'expires_on': '2030-01-01'}]), 200);
    }));
    final docs = await api.listDocuments();
    expect(seen.headers['Authorization'], 'Bearer a.b.c');
    expect(seen.url.toString(), 'https://x.test/api/documents');
    expect(docs.single.category, 'passport');
  });

  test('maps API errors to ApiException with the server code', () async {
    final api = HttpApi('https://x.test', () => 't', MockClient((_) async => http.Response('{"error":"identifier_in_message"}', 422)));
    expect(() => api.sendMessage('c1', 'X1234567L'), throwsA(isA<ApiException>().having((e) => e.code, 'code', 'identifier_in_message').having((e) => e.status, 'status', 422)));
  });

  test('upload is multipart with category, filename and expiry', () async {
    late http.BaseRequest seen;
    final api = HttpApi('https://x.test', () => 't', MockClient.streaming((r, body) async {
      seen = r;
      await body.drain();
      return http.StreamedResponse(Stream.value(utf8.encode('{"id":"n"}')), 201);
    }));
    await api.uploadDocument(bytes: Uint8List.fromList([0x25, 0x50, 0x44, 0x46]), fileName: 'p.pdf', mime: 'application/pdf', category: 'passport', expiresOn: '2030-05-01');
    final m = seen as http.MultipartRequest;
    expect(m.fields, {'category': 'passport', 'expires_on': '2030-05-01'});
    expect(m.files.single.filename, 'p.pdf');
    expect(m.files.single.contentType.mimeType, 'application/pdf');
  });

  test('booking sends UTC ISO time', () async {
    late Map body;
    final api = HttpApi('https://x.test', () => 't', MockClient((r) async { body = jsonDecode(r.body); return http.Response('{}', 201); }));
    await api.book('l1', DateTime.utc(2030, 1, 1, 10), 30);
    expect(body['startsAt'], '2030-01-01T10:00:00.000Z');
    expect(body['minutes'], 30);
  });

  test('no token => no Authorization header', () async {
    late http.Request seen;
    final api = HttpApi('https://x.test', () => null, MockClient((r) async { seen = r; return http.Response('[]', 200); }));
    await api.listLawyers();
    expect(seen.headers.containsKey('Authorization'), isFalse);
  });

  test('expiry reminder window (60 days)', () {
    final now = DateTime.utc(2026, 11, 22);
    expect(VaultDoc('1', 'passport', 'p', '2027-01-01').expiringSoon(now), isTrue);
    expect(VaultDoc('1', 'passport', 'p', '2027-06-01').expiringSoon(now), isFalse);
    expect(VaultDoc('1', 'passport', 'p', null).expiringSoon(now), isFalse);
  });
}
