import { z } from 'zod';

/** Accepts "+34 600 111 222", "+34-600-111-222", "(+34) 600111222"; returns E.164 (+34600111222) or null. */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s().-]/g, '');
  return /^\+[1-9][0-9]{7,14}$/.test(cleaned) ? cleaned : null;
}
export const telLink = (e164: string) => `tel:${e164}`;
/** wa.me wants digits only, no "+". */
export const waLink = (e164: string) => `https://wa.me/${e164.replace(/^\+/, '')}`;

const phone = z.string().trim().max(30).transform((v, ctx) => {
  if (v === '') return null;
  const n = normalizePhone(v);
  if (!n) { ctx.addIssue({ code: 'custom', message: 'invalid_phone' }); return z.NEVER; }
  return n;
});

/** Shared by registration and the later contact editor. Contact requires explicit consent to publish. */
export const ContactFields = z.object({
  contactPhone: phone.optional(),
  contactWhatsapp: phone.optional(),
  shareContact: z.boolean().optional(),
}).refine((v) => !(v.contactPhone || v.contactWhatsapp) || v.shareContact === true, { message: 'consent_required', path: ['shareContact'] });
