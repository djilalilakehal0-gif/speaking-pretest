#!/usr/bin/env node
// Secret scanner for the repository (unit-tested in test/secret-scan.test.js; run in CI by .github/workflows/security.yml).
//
//   node ecole-eyes-native/backend/scripts/secret-scan.js        # from the repository root: scans every tracked file
//
// Fails (exit 1) on any new secret. Files listed in KNOWN are reported as warnings until they are removed.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const RULES = [
  { id: 'anthropic-key', re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: 'openai-key', re: /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  { id: 'aws-access-key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'github-token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{50,}/ },
  { id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{20,}/ },
  { id: 'slack-webhook', re: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]{20,}/ },
  { id: 'discord-webhook', re: /https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d{15,}\/[A-Za-z0-9_-]{50,}/ },
  { id: 'stripe-live-key', re: /\b[rs]k_live_[A-Za-z0-9]{20,}/ },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/ },
  { id: 'google-service-account', re: /"type"\s*:\s*"service_account"[\s\S]{0,400}"private_key"/ },
];

// Files that must never be committed, whatever their content.
export const FORBIDDEN_FILES = [/\.(?:jks|keystore|p12|pfx|pem|key)$/i, /(?:^|\/)\.env(?:\.local|\.production)?$/, /(?:^|\/)\.dev\.vars$/, /(?:^|\/)local\.properties$/, /KEYSTORE_BASE64.*\.txt$/i];

// Known findings awaiting removal by the owner (see ecole-eyes-native/SECURITY.md). Warn, do not fail.
export const KNOWN = new Set(['KEYSTORE_BASE64.txt']);

const SKIP = /(?:^|\/)(?:node_modules|build|dist|\.gradle)\/|\.(?:png|jpe?g|gif|webp|ico|mp4|mp3|wav|woff2?|ttf|otf|pdf|zip|apk|aab|jar|so|tflite)$/i;

/** Returns the findings in one file's text: [{ rule, line }]. */
export function scanText(text) {
  const out = [];
  const lines = text.split('\n');
  for (const rule of RULES) {
    if (rule.id === 'google-service-account') { if (rule.re.test(text)) out.push({ rule: rule.id, line: 1 }); continue; }
    lines.forEach((l, i) => { if (rule.re.test(l)) out.push({ rule: rule.id, line: i + 1 }); });
  }
  return out;
}

/** Scans [files] ({ path, text }). Returns { errors, warnings } as printable strings. */
export function scanFiles(files) {
  const errors = []; const warnings = [];
  for (const { path, text } of files) {
    const known = KNOWN.has(path);
    const found = [];
    if (FORBIDDEN_FILES.some((re) => re.test(path))) found.push(`${path}: file type must not be committed`);
    if (text != null) for (const f of scanText(text)) found.push(`${path}:${f.line}: ${f.rule}`);
    (known ? warnings : errors).push(...found);
  }
  return { errors, warnings };
}

function main() {
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  const files = tracked.filter((p) => !SKIP.test(p)).map((path) => {
    try { return statSync(path).size > 2 * 1024 * 1024 ? { path, text: null } : { path, text: readFileSync(path, 'utf8') }; }
    catch { return { path, text: null }; }
  });
  const { errors, warnings } = scanFiles(files);
  for (const w of warnings) console.log(`::warning::Known secret pending removal: ${w}`);
  for (const e of errors) console.log(`::error::Secret or forbidden file: ${e}`);
  console.log(`Scanned ${files.length} files: ${errors.length} error(s), ${warnings.length} known warning(s).`);
  process.exit(errors.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
