import type { Locale } from '@/i18n/config';
import type { Pathway } from '@/lib/legal/types';
import { sourceById } from '@/lib/legal/sources';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tokens = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2);

/** Multilingual synonyms so an Arabic/French question reaches the Spanish-keyed pathway. */
const SYNONYMS: Record<string, string[]> = {
  'arraigo-social': ['arraigo', 'social', 'roots', 'enracinement', 'اجتماعي', 'ارايغو', 'الارايغو', 'اندماج', 'integration'],
  'arraigo-sociolaboral': ['sociolaboral', 'contrato', 'contract', 'contrat', 'empleo', 'trabajo', 'work', 'travail', 'عمل', 'عقد'],
  'arraigo-socioformativo': ['socioformativo', 'formacion', 'training', 'formation', 'تكوين', 'دراسة', 'studies', 'estudios'],
  'arraigo-familiar': ['familiar', 'padres', 'progenitores', 'parents', 'والدي', 'والدين'],
  'arraigo-segunda-oportunidad': ['segunda', 'oportunidad', 'second', 'chance', 'renovar', 'renew', 'caducada', 'الفرصة', 'seconde'],
  'international-protection': ['asilo', 'asylum', 'asile', 'refugio', 'refugee', 'لجوء', 'protection', 'proteccion'],
  'family-reunification': ['reagrupacion', 'reunification', 'regroupement', 'لم', 'الشمل'],
  'family-of-spanish-citizens': ['espanol', 'spanish', 'espagnol', 'ciudadano', 'citizen', 'conyuge', 'spouse', 'اسباني', 'إسباني'],
  'nie-tie': ['nie', 'tie', 'tarjeta', 'card', 'carte', 'بطاقة'],
  'work-authorization': ['autorizacion', 'authorisation', 'authorization', 'permit', 'تصريح'],
  'long-term-residence': ['larga', 'duracion', 'long-term', 'longue', 'طويلة'],
  'renewal-modification': ['renovacion', 'renewal', 'renouvellement', 'prorroga', 'تجديد', 'modificacion'],
};

export interface RetrievedChunk { slug: string; title: string; text: string; reference: string; status: string; lastVerifiedOn: string; sources: { title: string; url: string }[] }

/**
 * Retrieval over published/verified pathway sections only. Unverified sections and pathways without a
 * verification date are NEVER sent to the model — so the assistant cannot present drafts as law.
 * (Swap for pgvector embeddings in production: same interface, see docs/ARCHITECTURE.md §AI.)
 */
export function retrieve(question: string, pathways: Pathway[], locale: Locale, k = 3): RetrievedChunk[] {
  const qt = new Set(tokens(question));
  const scored = pathways
    .filter((p) => p.lastVerifiedOn && p.verifiedSections.length > 0 && p.status !== 'expired')
    .map((p) => {
      const syn = SYNONYMS[p.slug] ?? [];
      const hay = tokens([p.spanishTerm, ...Object.values(p.title), ...Object.values(p.summary)].join(' '));
      let score = 0;
      for (const t of qt) {
        if (hay.includes(t)) score += 2;
        if (syn.some((s) => norm(s) === t || norm(s).includes(t) && t.length > 3)) score += 3;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored.map(({ p }) => ({
    slug: p.slug,
    title: `${p.spanishTerm} — ${p.title[locale]}`,
    reference: p.legalReference,
    status: p.status,
    lastVerifiedOn: p.lastVerifiedOn as string,
    text: p.verifiedSections.flatMap((s) => (p.sections[s] ?? []).map((x) => `[${s}] ${x.es}`)).join('\n'),   // Spanish original = authoritative
    sources: p.sourceIds.map((id) => sourceById(id)).filter(Boolean).map((s) => ({ title: s!.title, url: s!.url })),
  }));
}

export function formatContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c) => `## ${c.title}\nLegal reference: ${c.reference}\nStatus: ${c.status}\nLast verified: ${c.lastVerifiedOn}\n${c.text}`).join('\n\n');
}

export const newestVerification = (chunks: RetrievedChunk[]) => chunks.map((c) => c.lastVerifiedOn).sort().at(-1) ?? null;
