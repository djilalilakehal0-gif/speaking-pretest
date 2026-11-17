# ÉCOLE EYES — Security audit and owner checklist

Audit date: 2026-11-17. Scope: `ecole-eyes-native/` (Android app + Cloudflare Worker), the repository's git history and the
GitHub Actions workflows. Re-run the checks at the end of this file before each public release.

## Architecture in one paragraph

There are **no user accounts, no passwords, no admin panel and no server database**. The phone talks to one endpoint,
`POST /v1/messages` on the Worker, which adds the AI provider key and forwards the request. All personal data (history,
notes, reading positions, emergency contact) lives on the phone, encrypted with an Android-Keystore key. This shapes which
checklist items apply (see "Not applicable" below).

## Findings and fixes

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | **Release signing key committed** (`KEYSTORE_BASE64.txt`, public repository, since 2026-11-05). Protected only by the `KEYSTORE_PASSWORD` secret, which is not in git. | High | Workflows now prefer the `KEYSTORE_BASE64` secret and warn when the file is used. **Owner action required** (below). |
| 2 | Worker forwarded `tools` and message blocks unchecked: anyone holding the app token could add paid server tools (web search, code execution), URL images or document blocks at the owner's expense. | High | Fixed: only client tools `{name, description, input_schema}`; only text / base64 image / tool_use / tool_result blocks, rebuilt field by field; max 8 images, system ≤ 20,000 chars, temperature 0–1. Tests: `backend/test/security.test.js`. |
| 3 | Rate limiting was commented out. | Medium | Fixed: `[[ratelimits]]` binding on by default, 20 requests / minute / IP. |
| 4 | No way to stop spending quickly. | Medium | Fixed: `DISABLED=true` variable returns 503 without calling the provider. |
| 5 | No logs or alerts. | Medium | Fixed: one JSON line per request (status, duration, provider, country, 8-hex hash of the IP) via Workers Logs; never the body, key, token or raw IP (tested). Alerts: owner action. |
| 6 | Deploy tool `wrangler` 3.x: 8 advisories (7 high) in its dev-time dependencies (undici, ws, esbuild, sharp, zod…). Not in deployed code. | Low | Fixed: wrangler 4.163.0, lockfile added, `npm audit`: 0 vulnerabilities. |
| 7 | BouncyCastle 1.72 (via pdfbox-android, reachable with encrypted PDFs): CVE-2024-29857, CVE-2024-30171, CVE-2024-30172. | Medium | Fixed: forced to 1.87 with a Gradle constraint. |
| 8 | Unused libraries `androidx.documentfile`, Compose preview tooling. | Info | Removed. |
| 9 | App token is embedded in the APK (extractable). | Medium | Documented design limit. Proper fix: Play Integrity (below). Mitigated by #2–#4 and the provider spending cap. |

### Verified OK

* Git history (311 commits, all branches): no AI provider key, cloud key, GitHub/Slack token, private key or real password.
  Matches were documentation placeholders, empty templates (`.env.example`, `secret.tfvars`) and a test fixture password
  in another project (`whbo94/server/test/api.test.js`, not in this app).
* The provider key exists only as a Worker secret; the app has no provider key (`BuildConfig` holds only the backend URL and
  app token). `.dev.vars`, `local.properties`, keystores and `node_modules` are git-ignored.
* App: no logging of user content; HTTPS only (`usesCleartextTraffic=false`); `allowBackup=false`; settings and token in
  EncryptedSharedPreferences; history and notes AES-256-GCM with a non-exportable Keystore key; R8 minification on release.
* Exported components: `MainActivity` (launcher/voice command), `NotificationReader` (protected by
  `BIND_NOTIFICATION_LISTENER_SERVICE`). `ListeningService` is not exported.
* "Don't send extra data": contacts, location, notifications and notes are never sent to the AI; photos are downscaled and
  sent only on request; the Worker now strips every unknown field.
* Prompt injection (text in a photo or document telling the AI to act): calls and SMS always require a spoken "yes" from
  the user, emergency numbers are only dialled, and notes/notifications content is not returned to the model.

### Not applicable (and why)

* **Hash passwords, 2FA for admins, admin routes, user access checks:** there are no accounts, logins or admin endpoints.
  If you add any later, use a hosted identity provider rather than hand-written password storage.
* **Row-Level Security on every table:** there is no server database (RLS is a Postgres/Supabase feature). The only
  database is Room on the phone, private to the app, with sensitive columns encrypted.

## Owner actions (cannot be done from the code)

1. **Move the signing key out of git** (in this order, or builds break):
   1. GitHub → Settings → Secrets and variables → Actions → New secret `KEYSTORE_BASE64` = the content of
      `KEYSTORE_BASE64.txt`. Check that `KEYSTORE_PASSWORD` is long and random.
   2. Run any build workflow; the log must no longer show "Using KEYSTORE_BASE64.txt".
   3. Delete `KEYSTORE_BASE64.txt` and commit.
   4. Optional: remove it from history (`git filter-repo --path KEYSTORE_BASE64.txt --invert-paths`, then force-push every
      branch). This does not undo the exposure. Do not replace the key: phones that installed the app from GitHub could no
      longer update. Before publishing on Google Play, enrol in **Play App Signing** so Google holds the app key and the
      upload key can be reset if it is ever compromised.
2. **Spending cap:** set a monthly limit and a budget e-mail alert in the AI provider console (Anthropic: Settings →
   Limits; OpenAI-compatible providers have an equivalent).
3. **Alerts:** Cloudflare → Notifications → add alerts for Worker error rate / request spikes. Set `DISABLED=true` in the
   Worker variables to stop all AI traffic immediately if spending looks wrong.
4. **Rotate `APP_TOKEN`** whenever you suspect abuse (`npx wrangler secret put APP_TOKEN`, then rebuild the app).
5. **Stronger client authentication before a large public launch:** Google Play Integrity. The app requests an integrity
   token per session; the Worker verifies it with Google (needs a Google Cloud project linked in the Play Console and a
   service-account secret on the Worker) and rejects modified apps and scripts. This replaces the embedded token as the
   real gate.

## Re-run the audit

```bash
# secrets in all history
git log --all -p | grep -nE "sk-ant-|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|ghp_|github_pat_|BEGIN [A-Z ]*PRIVATE KEY"
(cd backend && npm audit && npm test)                 # 0 vulnerabilities, 27 tests
./gradlew testDebugUnitTest lintDebug                 # 224 tests, lint clean
./gradlew :app:dependencies --configuration releaseRuntimeClasspath | grep bouncycastle   # 1.87
```
