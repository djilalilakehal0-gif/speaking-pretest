'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { DISCLOSURE, renderDisclosure, DISCLOSURE_VERSION, type DisclosureLocale } from '@/lib/payments/disclosure';

/**
 * Full disclosure shown BEFORE checkout. The checkbox starts unticked and the pay button stays disabled until it is ticked.
 * Acceptance is recorded server-side (version + tier + time); the checkout endpoint refuses payment without it.
 */
export function PrePaymentConfirm({ tier, planName, price, onCancel }: { tier: 'premium' | 'professional_legal'; planName: string; price: string; onCancel: () => void }) {
  const { t, locale } = useI18n();
  const dl = (['ar', 'es', 'fr', 'en'].includes(locale) ? locale : 'es') as DisclosureLocale;
  const d = DISCLOSURE[dl];
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function proceed() {
    setBusy(true); setMsg('');
    const rec = await fetch('/api/payments/disclosure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier, locale: dl, version: DISCLOSURE_VERSION }) }).catch(() => null);
    if (rec?.status === 401) { location.href = `/${locale}/login`; return; }
    if (!rec?.ok) { setBusy(false); setMsg(t('common.error')); return; }
    const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier, locale }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    if (j?.url) { location.href = j.url; return; }
    setBusy(false);
    setMsg(r?.status === 503 ? t('common.notConfigured') : t('common.error'));
  }

  return (
    <section className="card" role="dialog" aria-modal="false" aria-labelledby="pp-title" dir={dl === 'ar' ? 'rtl' : 'ltr'} style={{ maxWidth: 720 }}>
      <h2 id="pp-title">{d.title}</h2>
      <ol className="clean">{renderDisclosure(dl, planName, price).map((x, i) => <li key={i}>{x}</li>)}</ol>
      <label className="opt" style={{ margin: '16px 0' }}>
        <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
        {d.check}
      </label>
      <div className="actions">
        <button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={onCancel} disabled={busy}>{d.back}</button>
        <button className="btn btn-gold" disabled={!ticked || busy} onClick={proceed}>{d.nextLabel}</button>
      </div>
      {msg && <p role="alert" className="banner bad">{msg}</p>}
    </section>
  );
}
