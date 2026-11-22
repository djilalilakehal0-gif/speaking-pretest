'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { Logo } from './Logo';
import { AuthForm } from './AuthForm';
import { EligibilityTool, Results } from './EligibilityTool';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n/config';
import type { Assessment } from '@/lib/eligibility/types';

const TOTAL = 12;
const NEEDS = ['eligibility', 'documents', 'lawyer', 'renewal', 'family', 'asylum'] as const;

export function Onboarding() {
  const { t, locale } = useI18n();
  const router = useRouter(); const path = usePathname();
  const [step, setStep] = useState(1);
  const [needs, setNeeds] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [res, setRes] = useState<Assessment | null>(null);
  const [caseMsg, setCaseMsg] = useState('');
  const [caseRef, setCaseRef] = useState('');
  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const docs = [...new Set((res?.results ?? []).flatMap((r) => r.documents))];

  async function createCase() {
    setCaseMsg('');
    const r = await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => null);
    if (r?.ok) { const j = await r.json(); setCaseRef(j.reference); next(); }
    else if (r?.status === 503) { setCaseMsg(t('common.demo')); }
    else if (r?.status === 401) { setCaseMsg(t('nav.login')); }
    else setCaseMsg(t('common.error'));
  }

  return (
    <div style={{ maxWidth: 760, marginInline: 'auto' }}>
      <div className="bar" aria-hidden><i style={{ width: `${(step / TOTAL) * 100}%` }} /></div>
      <p className="meta">{step} / {TOTAL}</p>

      {step === 1 && (<div className="card" style={{ textAlign: 'center', background: 'var(--navy)', color: '#fff' }}><Logo size={84} /><h1 style={{ fontSize: '2.4rem', color: '#fff', marginTop: 16 }}>MIGRA ESPAÑA</h1><p style={{ color: 'var(--gold)', letterSpacing: '.18em', textTransform: 'uppercase' }}>{t('brand.tagline')}</p><p>{t('hero.sub')}</p><button className="btn btn-gold" onClick={next}>{t('common.next')}</button></div>)}

      {step === 2 && (<div className="card"><h2>{t('onb.language')}</h2><div className="opts">{LOCALES.map((l) => (
        <button key={l} className="opt" style={{ font: 'inherit' }} aria-pressed={l === locale} onClick={() => { document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`; router.push(path.replace(/^\/(es|en|fr|ar)/, `/${l as Locale}`)); }}>{LOCALE_NAMES[l]}{l === locale ? ' ✓' : ''}</button>))}</div>
        <div className="actions"><button className="btn btn-gold" onClick={next}>{t('common.next')}</button></div></div>)}

      {step === 3 && (<div><h2>{t('onb.account')}</h2><AuthForm mode="register" onDone={next} /><div className="actions"><button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={next}>{t('common.next')} →</button></div></div>)}

      {step === 4 && (<div className="card"><h2>{t('onb.privacy')}</h2><p>{t('privacy.body')}</p>
        <label className="opt"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{t('auth.consentTerms')}</label>
        <div className="actions"><button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={back}>{t('common.back')}</button><button className="btn btn-gold" disabled={!consent} onClick={next}>{t('common.next')}</button></div></div>)}

      {step === 5 && (<div className="card"><h2>{t('onb.needs')}</h2><div className="opts">{NEEDS.map((n) => (
        <label key={n} className="opt"><input type="checkbox" checked={needs.includes(n)} onChange={(e) => setNeeds((x) => e.target.checked ? [...x, n] : x.filter((y) => y !== n))} />{t(`need.${n}`)}</label>))}</div>
        <div className="actions"><button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={back}>{t('common.back')}</button><button className="btn btn-gold" onClick={next}>{t('common.next')}</button></div></div>)}

      {step === 6 && (<div><h2>{t('onb.questionnaire')}</h2><EligibilityTool compact onDone={(r) => { setRes(r); next(); }} /></div>)}

      {step === 7 && res && (<div><h2>{t('onb.pathways')}</h2><Results res={res} /><div className="actions"><button className="btn btn-gold" onClick={next}>{t('common.next')}</button></div></div>)}

      {step === 8 && (<div className="card"><h2>{t('onb.checklist')}</h2>{docs.length === 0 ? <p className="pending">{t('elig.empty')}</p> : <ul className="clean">{docs.map((d) => <li key={d}>☐ {t(`doc.${d}`)}</li>)}</ul>}
        <div className="actions"><button className="btn btn-gold" onClick={next}>{t('common.next')}</button></div></div>)}

      {step === 9 && (<div className="card"><h2>{t('onb.case')}</h2><p>{t('case.manualNote')}</p>{caseMsg && <p className="banner" role="alert">{caseMsg}</p>}
        <div className="actions"><button className="btn btn-gold" onClick={createCase}>{t('dash.createCase')}</button><button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={next}>{t('common.next')} →</button></div></div>)}

      {step === 10 && (<div className="card"><h2>{t('onb.mode')}</h2>{caseRef && <p className="meta">{t('case.reference')}: <strong dir="ltr">{caseRef}</strong></p>}
        <div className="grid g2"><button className="btn btn-gold" onClick={next}>{t('onb.selfGuided')}</button><Link className="btn btn-ghost" style={{ color: 'var(--text)' }} href={`/${locale}/lawyers`}>{t('onb.withLawyer')}</Link></div></div>)}

      {step === 11 && (<div className="card"><h2>{t('onb.documents')}</h2><p>{t('docs.formats')}</p><div className="actions"><Link className="btn btn-gold" href={`/${locale}/documents`}>{t('nav.documents')}</Link><button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={next}>{t('common.next')} →</button></div></div>)}

      {step === 12 && (<div className="card" style={{ textAlign: 'center' }}><h2>{t('onb.dashboard')}</h2><Link className="btn btn-gold" href={`/${locale}/dashboard`}>{t('onb.dashboard')}</Link></div>)}
    </div>
  );
}
