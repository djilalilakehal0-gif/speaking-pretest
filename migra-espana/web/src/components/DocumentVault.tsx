'use client';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from './I18nProvider';
import { expiringSoon } from '@/lib/documents/validation';

interface Doc { id: string; category: string; file_name: string; size_bytes: number; expires_on: string | null; created_at: string }
const CATS = ['passport', 'identity', 'empadronamiento', 'historical_registration', 'employment_contract', 'payslip', 'family_document', 'birth_certificate', 'marriage_certificate', 'criminal_record', 'training_certificate', 'application_receipt', 'administrative_decision', 'other'];
const BASELINE = ['passport', 'empadronamiento', 'criminal_record'];

export function DocumentVault() {
  const { t, locale } = useI18n();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [state, setState] = useState<'ok' | 'demo' | 'login'>('ok');
  const [category, setCategory] = useState('passport'); const [expires, setExpires] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/documents').catch(() => null);
    if (!r || r.status === 503) { setState('demo'); setDocs([]); return; }
    if (r.status === 401) { setState('login'); setDocs([]); return; }
    setDocs(await r.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.set('file', file); fd.set('category', category); if (expires) fd.set('expires_on', expires);
    setBusy(true);
    const r = await fetch('/api/documents', { method: 'POST', body: fd }).catch(() => null);
    setBusy(false);
    if (r?.ok) { e.currentTarget.reset(); await load(); } else setMsg(t('common.error'));
  }
  async function open(id: string) {
    const r = await fetch(`/api/documents/${id}/signed-url`).catch(() => null);
    const j = await r?.json().catch(() => null);
    if (j?.url) window.open(j.url, '_blank', 'noopener,noreferrer'); else setMsg(t('common.error'));
  }
  async function remove(id: string) {
    if (!confirm(t('common.delete') + '?')) return;
    const r = await fetch(`/api/documents/${id}`, { method: 'DELETE' }).catch(() => null);
    if (r?.ok) await load(); else setMsg(t('common.error'));
  }
  const have = new Set((docs ?? []).map((d) => d.category));
  const missing = BASELINE.filter((c) => !have.has(c));

  return (
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div>
        {state === 'demo' && <p className="banner">{t('common.demo')}</p>}
        {state === 'login' && <p className="banner"><a href={`/${locale}/login`}>{t('nav.login')}</a></p>}
        <form className="card" onSubmit={upload}>
          <h3>{t('docs.upload')}</h3>
          <p className="pending">{t('docs.formats')}</p>
          <div className="field"><label htmlFor="cat">{t('docs.category')}</label><select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>{CATS.map((c) => <option key={c} value={c}>{t(`doc.cat.${c}`)}</option>)}</select></div>
          <div className="field"><label htmlFor="ex">{t('docs.expires')}</label><input id="ex" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} dir="ltr" /></div>
          {/* accept images from the camera on mobile ("scan") or any allowed file */}
          <div className="field"><label htmlFor="f">{t('docs.scan')} / {t('docs.upload')}</label><input id="f" name="file" type="file" accept="application/pdf,image/jpeg,image/png" capture="environment" required /></div>
          <p className="banner info">{t('docs.noSelfData')}</p>
          <button className="btn btn-gold" disabled={busy || state !== 'ok'}>{busy ? t('common.loading') : t('docs.upload')}</button>
          {msg && <p role="alert" className="banner bad">{msg}</p>}
        </form>
      </div>
      <div>
        {missing.length > 0 && state === 'ok' && <div className="card" style={{ marginBottom: 16 }}><h3>{t('docs.missing')}</h3><ul className="clean">{missing.map((c) => <li key={c}>{t(`doc.cat.${c}`)}</li>)}</ul></div>}
        <div className="card">
          <h3>{t('docs.title')}</h3>
          {docs === null ? <p>{t('common.loading')}</p> : docs.length === 0 ? <p className="pending">{t('docs.empty')}</p> : (
            <ul className="clean" style={{ listStyle: 'none', paddingInlineStart: 0 }}>{docs.map((d) => (
              <li key={d.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                <strong>{t(`doc.cat.${d.category}`)}</strong> — {d.file_name}
                {d.expires_on && <span className={`badge ${expiringSoon(d.expires_on) ? 'under_review' : ''}`} style={{ marginInlineStart: 8 }}>{t('docs.expires')}: {d.expires_on}</span>}
                <div className="actions" style={{ marginTop: 8 }}>
                  <button className="btn btn-ghost" style={{ color: 'var(--text)', minHeight: 36, padding: '6px 14px' }} onClick={() => open(d.id)}>{t('common.download')}</button>
                  <button className="btn btn-ghost" style={{ color: 'var(--bad)', minHeight: 36, padding: '6px 14px' }} onClick={() => remove(d.id)}>{t('common.delete')}</button>
                </div>
              </li>))}</ul>)}
        </div>
      </div>
    </div>
  );
}
