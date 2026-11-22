# Legal content guide (legal editors / admins)
1. Never publish from memory. Compare with the consolidated BOE text; record the date in `last_verified_on`.
2. Each `legal_rules.body` mirrors `Pathway` in `web/src/lib/legal/types.ts` (4-language sections, `verifiedSections`).
3. Publishing needs: `legal_reference`, `last_verified_on`, `reviewed_by`, a legal-editor role + MFA (DB CHECK + API). Admins cannot publish.
4. Set status `amended`/`expired`/`under_review` honestly; expired schemes are excluded from the AI and must not be shown as available.
5. Fees, forms, deadlines: copy from the official page only, add the source; otherwise leave the section pending.
6. After changing rules in `lib/eligibility/engine.ts`, bump `RULES_SNAPSHOT_DATE` and `ENGINE_VERSION`, update tests.
7. Mark `translations_reviewed` only after a qualified reviewer checks the legal meaning of each language.
