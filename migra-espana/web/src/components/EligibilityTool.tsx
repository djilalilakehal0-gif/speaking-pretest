'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from './I18nProvider';
import { assess, groupByBucket } from '@/lib/eligibility/engine';
import { ASYLUM_OPTIONS, PERMIT_OPTIONS, QUESTIONS, isVisible } from '@/lib/eligibility/questions';
import { COUNTRY_CODES } from '@/lib/eligibility/countries';
import { INTL_LOCALE } from '@/i18n/config';
import type { Answers, Assessment, PathwayResult } from '@/lib/eligibility/types';

export function EligibilityTool({ onDone, compact }: { onDone?: (a: Assessment, answers: Answers) => void; compact?: boolean }) {
  const { t, locale } = useI18n();
  const [answers, setAnswers] = useState<Answers>({});
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Assessment | null>(null);

  const visible = useMemo(() => QUESTIONS.filter((q) => isVisible(q, answers)), [answers]);
  const q = visible[Math.min(i, visible.length - 1)];
  // Country names come from the browser's ICU data, which differs from the server's: build after mount to avoid hydration mismatch.
  const [countries, setCountries] = useState<{ c: string; n: string }[]>([]);
  useEffect(() => {
    const dn = new Intl.DisplayNames([INTL_LOCALE[locale]], { type: 'region' });
    setCountries(COUNTRY_CODES.map((c) => ({ c, n: dn.of(c) ?? c })).sort((a, b) => a.n.localeCompare(b.n, INTL_LOCALE[locale])));
  }, [locale]);

  const set = (v: string) => setAnswers((a) => ({ ...a, [q.code]: v }) as Answers);
  const cur = answers[q.code] as string | undefined;
  const finish = () => { const r = assess(answers); setResult(r); onDone?.(r, answers); };

  if (result) return <Results res={result} />;
  const last = i >= visible.length - 1;
  return (
    <div className="card" role="form" aria-labelledby="qtitle">
      <div className="bar" aria-hidden><i style={{ width: `${((i + 1) / visible.length) * 100}%` }} /></div>
      <p className="meta">{t('elig.question')} {i + 1} {t('elig.of')} {visible.length}{q.additional ? ` · ${t('elig.additional')}` : ''}</p>
      <h2 id="qtitle" style={{ fontSize: '1.5rem' }}>{t(`q.${q.code}`)}</h2>
      {t(`q.help.${q.code}`) !== `q.help.${q.code}` && <p className="pending">{t(`q.help.${q.code}`)}</p>}
      <div className="field">
        {q.kind === 'country' && (
          <select aria-label={t(`q.${q.code}`)} value={cur ?? ''} onChange={(e) => set(e.target.value)}>
            <option value="">{t('common.select')}</option>{countries.map((x) => <option key={x.c} value={x.c}>{x.n}</option>)}
          </select>)}
        {q.kind === 'date' && <input type="date" aria-label={t(`q.${q.code}`)} max={new Date().toISOString().slice(0, 10)} value={cur ?? ''} onChange={(e) => set(e.target.value)} />}
        {(q.kind === 'yesno' || q.kind === 'yesnounsure' || q.kind === 'asylum' || q.kind === 'permit') && (
          <div className="opts" role="radiogroup" aria-label={t(`q.${q.code}`)}>
            {(q.kind === 'asylum' ? ASYLUM_OPTIONS.map((o) => [o, t(`opt.asylum.${o}`)])
              : q.kind === 'permit' ? PERMIT_OPTIONS.map((o) => [o, t(`opt.permit.${o}`)])
              : [['yes', t('common.yes')], ['no', t('common.no')], ...(q.kind === 'yesnounsure' ? [['unsure', t('common.unsure')]] : [])]).map(([v, label]) => (
              <label key={v} className="opt"><input type="radio" name={q.code} checked={cur === v} onChange={() => set(v)} />{label}</label>))}
          </div>)}
      </div>
      <div className="actions">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{t('common.back')}</button>
        {/* Skipping is allowed: unanswered ≠ "no" in the engine, it simply stays "to confirm". */}
        {last ? <button className="btn btn-gold" onClick={finish}>{t('elig.seeResults')}</button>
              : <button className="btn btn-gold" onClick={() => setI(i + 1)}>{t('common.next')}</button>}
      </div>
      {!compact && <p className="pending" style={{ marginTop: 18 }}>{t('elig.disclaimer')}</p>}
    </div>
  );
}

export function Results({ res }: { res: Assessment }) {
  const { t, locale } = useI18n();
  const g = groupByBucket(res);
  return (
    <div>
      <p className="banner">{t('elig.disclaimer')}</p>
      {res.monthsInSpain !== null && <p className="meta">{t('elig.monthsInSpain')}: <strong>{res.monthsInSpain} {t('elig.months')}</strong> · {t('common.lastVerified')}: {res.rulesSnapshotDate}</p>}
      {res.results.length === 0 && <p className="card">{t('elig.empty')}</p>}
      {(['eligible', 'needs_info', 'not_met'] as const).map((b) => g[b].length > 0 && (
        <section key={b} style={{ marginBlock: 28 }}>
          <h2>{t(`elig.${b}`)}</h2>
          <div className="grid">{g[b].map((r) => <PathwayCard key={r.pathway} r={r} />)}</div>
        </section>))}
      {res.results.length > 0 && <Checklist res={res} />}
      {res.needsLawyerReview && (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h3>{t('elig.lawyerTitle')}</h3>
          <ul className="clean">{res.lawyerReviewReasons.map((x) => <li key={x}>{t(`elig.reason.${x}`)}</li>)}</ul>
          <Link className="btn btn-gold" href={`/${locale}/lawyers`}>{t('elig.lawyerCta')}</Link>
        </div>)}
    </div>
  );
}

function PathwayCard({ r }: { r: PathwayResult }) {
  const { t } = useI18n();
  const list = (title: string, codes: string[], prefix = 'elig.code.') => codes.length > 0 && (<><h3 style={{ fontSize: '1rem', marginTop: 14 }}>{title}</h3><ul className="clean">{codes.map((c) => <li key={c}>{t(prefix + c)}</li>)}</ul></>);
  return (
    <article className={`card bucket ${r.bucket}`}>
      <h3>{t(`pathway.${r.pathway}`)}</h3>
      {list(t('elig.met'), r.met)}{list(t('elig.missing'), r.missing)}{list(t('elig.notMet'), r.notMet)}
      {list(t('elig.docsNeeded'), r.documents, 'doc.')}{list(t('elig.nextSteps'), r.nextSteps)}
    </article>
  );
}

/** Personal checklist: union of documents across the identified pathways, ticked locally (nothing is sent anywhere). */
function Checklist({ res }: { res: Assessment }) {
  const { t } = useI18n();
  const docs = [...new Set(res.results.filter((r) => r.bucket !== 'not_met').flatMap((r) => r.documents))];
  const [done, setDone] = useState<Record<string, boolean>>({});
  if (docs.length === 0) return null;
  return (
    <section className="card" style={{ marginBlock: 26 }}>
      <h2>{t('checklist.title')}</h2><p className="pending">{t('checklist.hint')}</p>
      <div className="opts">{docs.map((d) => (<label key={d} className="opt"><input type="checkbox" checked={!!done[d]} onChange={(e) => setDone((x) => ({ ...x, [d]: e.target.checked }))} />{t(`doc.${d}`)}</label>))}</div>
    </section>
  );
}
