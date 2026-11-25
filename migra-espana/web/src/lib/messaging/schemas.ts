import { z } from 'zod';
import { ContactFields } from './contact';

export const SendMessage = z.object({ body: z.string().trim().min(1).max(4000) });
export const OpenConversation = z.object({ lawyerId: z.string().uuid() });
export const LAWYER_LANGS = ['ar', 'es', 'fr', 'en'] as const;
export const RegisterLawyer = z.object({
  displayName: z.string().trim().min(3).max(120),
  barAssociation: z.string().trim().min(3).max(120),
  barNumber: z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N}./ -]+$/u),
  languages: z.array(z.enum(LAWYER_LANGS)).min(1).max(4),
  bio: z.string().trim().max(1500).optional(),
  confirmTruthful: z.literal(true),
}).and(ContactFields);

/** Messages may not carry document identifiers: those go through the vault with consent. */
const ID_PATTERNS = [/\b[XYZxyz][- ]?\d{7}[- ]?[A-Za-z]\b/, /\b\d{8}[- ]?[A-Za-z]\b/, /\b[A-Z]{1,2}\d{6,9}\b/];
export const looksLikeIdentifier = (text: string) => ID_PATTERNS.some((p) => p.test(text));
