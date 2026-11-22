import type { Locale } from '@/i18n/config';

export type L = Record<Locale, string>;
export type RuleStatus = 'active' | 'amended' | 'expired' | 'under_review';
export type SectionKey =
  | 'definition' | 'who' | 'conditions' | 'residence' | 'documents' | 'employment' | 'family' | 'criminal'
  | 'procedure' | 'forms' | 'fees' | 'where' | 'stages' | 'outcomes' | 'renewal' | 'refusal' | 'remedies';

export interface LegalSource {
  id: string;
  title: string;
  issuer: string;
  url: string;
  reference?: string;
  publishedOn?: string;
  effectiveOn?: string;
  lastVerifiedOn?: string;      // ISO date a human compared it with the official text
}

export interface Pathway {
  slug: string;
  group: 'A' | 'B' | 'C' | 'D' | 'E';
  code: string;                  // A..M per product spec
  title: L;
  spanishTerm: string;           // original legal term, always displayed
  summary: L;
  status: RuleStatus;
  legalReference: string;
  sourceIds: string[];
  effectiveOn?: string;
  lastVerifiedOn: string | null; // null = never verified by a human legal editor
  translationsReviewed: boolean;
  /** Only sections listed in verifiedSections are rendered; the rest show a "pending verification" notice. */
  verifiedSections: SectionKey[];
  sections: Partial<Record<SectionKey, L[]>>;
}
