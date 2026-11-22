import { z } from 'zod';
import OpenAI from 'openai';
import { fail, json, parse, clientIp } from '@/lib/api';
import { currentUser } from '@/lib/supabase/server';
import { redactPII, screenUserInput, systemPrompt } from '@/lib/ai/guardrails';
import { formatContext, newestVerification, retrieve } from '@/lib/ai/retrieval';
import { rateLimit } from '@/lib/ai/rate-limit';
import { loadPathways } from '@/lib/legal/repository';
import { RULES_SNAPSHOT_DATE } from '@/lib/eligibility/engine';

export const runtime = 'nodejs';
const Body = z.object({ question: z.string().min(3).max(1500), locale: z.enum(['ar', 'es', 'fr', 'en']), consent: z.literal(true) });

export async function POST(req: Request) {
  const p = await parse(req, Body);
  if (!p.ok) return p.res;
  const { question, locale } = p.data;

  const user = await currentUser();
  if (!rateLimit(`ai:${user?.id ?? clientIp(req) ?? 'anon'}`, 15)) return fail(429, 'rate_limited');

  // 1. Hard refusals happen before any model call.
  const refusal = screenUserInput(question);
  if (refusal) return json({ refused: refusal, answer: null, sources: [], escalate: true });

  // 2. Retrieval over verified content only. No verified context ⇒ say so, do not call the model.
  const { pathways } = await loadPathways();
  const chunks = retrieve(question, pathways, locale);
  if (chunks.length === 0) return json({ answer: null, noSources: true, sources: [], escalate: true });

  if (!process.env.OPENAI_API_KEY) return fail(503, 'assistant_not_configured');

  // 3. Data minimisation: redact identifiers before leaving our infrastructure.
  const { text: safeQuestion } = redactPII(question);
  const verifiedOn = newestVerification(chunks) ?? RULES_SNAPSHOT_DATE;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const out = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 700,
      messages: [{ role: 'system', content: systemPrompt(locale, formatContext(chunks), verifiedOn) }, { role: 'user', content: safeQuestion }],
    });
    return json({
      answer: out.choices[0]?.message?.content ?? null,
      // Sources and verification date come from OUR database, never from model output.
      sources: chunks.flatMap((c) => c.sources.map((s) => ({ ...s, reference: c.reference }))),
      verifiedOn,
      escalate: /lawyer|abogad|avocat|محام/i.test(question) || chunks.some((c) => c.status !== 'active'),
    });
  } catch {
    return fail(502, 'assistant_upstream_error');
  }
}
