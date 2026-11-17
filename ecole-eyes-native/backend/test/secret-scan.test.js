import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanFiles, scanText } from '../scripts/secret-scan.js';

// Samples are assembled at runtime so this file never contains a real-looking secret itself.
const fake = {
  anthropic: 'sk-' + 'ant-api03-' + 'A'.repeat(40),
  aws: 'AKIA' + 'Z'.repeat(16),
  google: 'AIza' + 'b'.repeat(35),
  github: 'ghp_' + 'c'.repeat(36),
  pem: '-----BEGIN ' + 'PRIVATE KEY-----',
  sa: '{"type": "service_account", "project_id": "p", "private_key": "x"}',
  discord: 'https://discord.com/api/webhooks/' + '1'.repeat(18) + '/' + 'd'.repeat(60),
};

test('each kind of secret is detected with its line number', () => {
  assert.deepEqual(scanText(`const a = 1;\nkey = "${fake.anthropic}"`), [{ rule: 'anthropic-key', line: 2 }]);
  assert.equal(scanText(fake.aws)[0].rule, 'aws-access-key');
  assert.equal(scanText(fake.google)[0].rule, 'google-api-key');
  assert.equal(scanText(fake.github)[0].rule, 'github-token');
  assert.equal(scanText(fake.pem)[0].rule, 'private-key');
  assert.equal(scanText(fake.sa)[0].rule, 'google-service-account');
  assert.equal(scanText(fake.discord)[0].rule, 'discord-webhook');
});

test('placeholders, short test values and documentation patterns are not flagged', () => {
  for (const ok of ['api_key="YOUR_API_KEY"', "ANTHROPIC_API_KEY: 'sk-secret'", 'OPENAI_API_KEY=sk-...', 'grep "BEGIN [A-Z ]*PRIVATE KEY"', 'client_secret: INSERT_OAUTH2_CLIENT_SECRET_HERE']) {
    assert.deepEqual(scanText(ok), [], ok);
  }
});

test('keystores and env files fail even when their content looks harmless', () => {
  const { errors } = scanFiles([{ path: 'app/release.jks', text: null }, { path: 'web/.env', text: 'A=1' }, { path: 'backend/.dev.vars', text: '' }, { path: 'x/.env.example', text: 'A=' }]);
  assert.equal(errors.length, 3);
  assert.ok(!errors.some((e) => e.includes('.env.example')));
});

test('the known keystore file is a warning until removed; a new copy is an error', () => {
  const r = scanFiles([{ path: 'KEYSTORE_BASE64.txt', text: 'MIIK...' }, { path: 'apps/KEYSTORE_BASE64_copy.txt', text: 'MIIK...' }]);
  assert.deepEqual(r.warnings, ['KEYSTORE_BASE64.txt: file type must not be committed']);
  assert.deepEqual(r.errors, ['apps/KEYSTORE_BASE64_copy.txt: file type must not be committed']);
});
