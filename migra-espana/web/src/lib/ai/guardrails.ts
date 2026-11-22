import type { Locale } from '@/i18n/config';

export type RefusalReason = 'falsification' | 'illegal_crossing' | 'hide_record' | 'fabricate_work' | 'deceive_authorities' | 'guarantee_request';

/** First-line filter for requests the assistant must never help with. The system prompt repeats these rules. */
const PATTERNS: Record<RefusalReason, RegExp[]> = {
  fabricate_work: [
    /\b(fake|fictitious|false|invent\w*|buy|sell)\b.{0,25}\b(job offer|work contract|employment contract|contrato)\b/i,
    /\b(contrato (falso|ficticio)|comprar (un )?contrato|vender contrato)\b/i,
    /\b(faux contrat|contrat fictif)\b/i,
    /(عقد (عمل )?(وهمي|مزور|مزيف)|شراء عقد عمل|بيع عقد عمل)/,
  ],
  falsification: [
    /\b(fake|forge|forged|falsif\w*|counterfeit|doctor)\b.{0,30}\b(document|passport|certificate|padr[oó]n|empadronamiento|id|contract|payslip|nómina)/i,
    /\b(falsific\w*|falsear|documento falso|papeles falsos|empadronamiento falso)\b/i,
    /\b(faux document|fausse? (attestation|carte|fiche)|falsifier)\b/i,
    /(تزوير|وثيقة مزورة|مستند مزور|أوراق مزورة|شهادة مزورة)/,
  ],
  illegal_crossing: [
    /\b(cross|enter|sneak)\b.{0,25}\b(border|spain|ceuta|melilla)\b.{0,25}\b(illegal\w*|without (papers|visa)|secretly|unnoticed)/i,
    /\b(entrar|cruzar)\b.{0,25}\b(ilegalmente|sin papeles|clandestin\w*)\b/i,
    /\b(passer|traverser)\b.{0,25}\b(clandestin\w*|illégalement)\b/i,
    /(الهجرة غير الشرعية|عبور الحدود (بطريقة )?غير (قانونية|شرعية)|التسلل|الحرقة)/,
  ],
  hide_record: [
    /\b(hide|conceal|not (declare|mention|tell))\b.{0,30}\b(criminal|record|antecedentes|conviction)/i,
    /\b(ocultar|esconder|no (declarar|decir))\b.{0,30}\bantecedentes\b/i,
    /\b(cacher|dissimuler)\b.{0,30}\b(casier|antécédents)\b/i,
    /(إخفاء|اخفاء|أخفي|اخفي).{0,25}(السجل|سوابق|الجنائي|العدلي)/,
  ],
  deceive_authorities: [
    /\b(lie|lying|mislead|false (information|statement))\b.{0,30}\b(immigration|authorit\w+|police|extranjer\w+|administration)/i,
    /\b(mentir|engañar)\b.{0,30}\b(extranjer\w+|administraci[oó]n|polic[ií]a)\b/i,
    /\b(mentir|tromper)\b.{0,30}\b(administration|police|préfecture)\b/i,
    /(الكذب على|خداع).{0,25}(السلطات|الإدارة|الشرطة)/,
  ],
  guarantee_request: [],
};

export function screenUserInput(text: string): RefusalReason | null {
  for (const [reason, pats] of Object.entries(PATTERNS) as [RefusalReason, RegExp[]][]) {
    if (pats.some((p) => p.test(text))) return reason;
  }
  return null;
}

/** Data minimisation: strip direct identifiers before any text leaves our infrastructure. */
export function redactPII(text: string): { text: string; redacted: number } {
  let n = 0;
  const sub = (re: RegExp, tag: string) => { text = text.replace(re, () => { n++; return tag; }); };
  sub(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]');
  sub(/\b[XYZxyz][- ]?\d{7}[- ]?[A-Za-z]\b/g, '[NIE]');                // NIE
  sub(/\b\d{8}[- ]?[A-Za-z]\b/g, '[DNI]');                               // DNI
  sub(/\b[A-Za-z]{2}\d{2}[ ]?(?:\d{4}[ ]?){4,7}\d{1,4}\b/g, '[IBAN]');   // IBAN
  sub(/(?<![\w])\+?\d[\d\s().-]{7,}\d(?![\w])/g, '[number]');             // phones / long numeric ids
  sub(/\b[A-Z]{1,2}\d{6,9}\b/g, '[document-number]');                     // passport-like
  return { text, redacted: n };
}

export function systemPrompt(locale: Locale, context: string, verifiedOn: string): string {
  const langName = { ar: 'Modern Standard Arabic (simple, plain wording)', es: 'Spanish', fr: 'French', en: 'English' }[locale];
  return [
    'You are the MIGRA ESPAÑA immigration information assistant for people dealing with Spanish immigration law.',
    `Answer ONLY in ${langName}. Keep Spanish legal terms in Spanish in parentheses where helpful (e.g. "empadronamiento").`,
    'Use ONLY the verified context below. If the context does not contain the answer, say clearly that you cannot verify it and recommend the official sources or a registered lawyer. Never fill gaps from memory.',
    'Distinguish clearly between (a) what the cited legal text says and (b) general guidance. State uncertainty explicitly.',
    'Mention the legal reference when you rely on a rule. Do not invent article numbers, deadlines, fees or requirements.',
    'You are not a lawyer and do not give legal advice. When the situation is individual, sensitive, involves refusals, deadlines, criminal records or asylum, recommend review by a registered lawyer.',
    'NEVER: guarantee approval of any application; help falsify or alter documents; suggest hiding a criminal record; suggest fabricating job contracts or other evidence; recommend illegal border crossing; advise giving false information to any authority. If asked, refuse briefly and explain the lawful alternative.',
    'Ask users not to share passport/ID numbers. Do not request personal identifiers.',
    `Legal database last verified: ${verifiedOn}.`,
    '--- VERIFIED CONTEXT START ---', context, '--- VERIFIED CONTEXT END ---',
  ].join('\n');
}
