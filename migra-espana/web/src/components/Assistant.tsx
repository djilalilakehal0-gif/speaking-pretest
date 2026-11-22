'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

interface Turn { role: 'me' | 'bot'; text: string; sources?: { title: string; url: string; reference: string }[]; verifiedOn?: string; escalate?: boolean }

export function Assistant() {
  const { t, locale } = useI18n();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState(''); const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim() || !consent) return;
    const question = q.trim(); setQ(''); setBusy(true);
    setTurns((x) => [...x, { role: 'me', text: question }]);
    const r = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale, consent: true }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(false);
    let text = t('common.error');
    if (r?.status === 503) text = t('ai.unavailable');
    else if (j?.refused) text = t('ai.disclaimer');
    else if (j?.noSources) text = t('ai.noSources');
    else if (j?.answer) text = j.answer;
    setTurns((x) => [...x, { role: 'bot', text, sources: j?.sources, verifiedOn: j?.verifiedOn, escalate: j?.escalate }]);
  }
  return (
    <div>
      <p className="banner">{t('ai.disclaimer')}</p>
      <div className="chat" aria-live="polite">
        {turns.map((m, n) => (
          <div key={n} className={`msg ${m.role}`}>
            {m.text}
            {m.sources && m.sources.length > 0 && (<div className="meta" style={{ marginTop: 10, marginBottom: 0, display: 'block' }}>
              <strong>{t('ai.sources')}:</strong>
              <ul className="clean">{m.sources.map((s, k) => <li key={k}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> ({s.reference})</li>)}</ul>
              {m.verifiedOn && <span>{t('ai.verifiedOn')}: {m.verifiedOn}</span>}
            </div>)}
            {m.escalate && <div className="meta" style={{ marginBottom: 0 }}><a href={`/${locale}/lawyers`}>{t('elig.lawyerCta')} →</a></div>}
          </div>))}
      </div>
      <form onSubmit={ask} className="card">
        <label className="opt" style={{ marginBottom: 12 }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{t('ai.consent')}</label>
        <div className="field"><textarea rows={3} maxLength={1500} placeholder={t('ai.placeholder')} aria-label={t('ai.placeholder')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn btn-gold" disabled={busy || !consent || !q.trim()}>{busy ? t('common.loading') : t('common.send')}</button>
      </form>
    </div>
  );
}
