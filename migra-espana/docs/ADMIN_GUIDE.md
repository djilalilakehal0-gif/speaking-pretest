# Administrator guide
Roles: `legal_editor` (edit/publish law), `admin` (verify lawyers, read cases/payments/audit — cannot publish law), `support` (tickets/users read), `super_admin` (break-glass; role grants).
**Verify a lawyer**: look the person up in the official Censo de Letrados (https://www.abogacia.es/servicios-abogacia/censo-de-letrados/) by name or colegiado number, compare name, Colegio and number with the application, then /admin → ✓ (records registry + reviewer; only then is the profile listed).
**Publish law**: see LEGAL_CONTENT_GUIDE. **Audit**: /admin shows latest `audit_logs`; they are append-only.
