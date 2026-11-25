-- Optional professional phone / WhatsApp for lawyers. Public only after verification + listing (existing lawyers_public_read policy),
-- and only with the lawyer's explicit consent: the CHECK makes "contact stored without consent" impossible.
alter table lawyers
  add column contact_phone text,
  add column contact_whatsapp text,
  add column contact_consent_at timestamptz,
  add constraint lawyer_contact_format check (
    (contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{7,14}$') and
    (contact_whatsapp is null or contact_whatsapp ~ '^\+[1-9][0-9]{7,14}$')),
  add constraint lawyer_contact_needs_consent check (
    (contact_phone is null and contact_whatsapp is null) or contact_consent_at is not null);
