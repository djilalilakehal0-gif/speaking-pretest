'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

const MSG: Record<string, string> = { slot_taken: 'appt.slotTaken', too_soon: 'appt.tooSoon' };
export function BookingForm({ lawyerId }: { lawyerId: string }) {
  const { t, locale } = useI18n();
  const [when, setWhen] = useState(''); const [minutes, setMinutes] = useState(30);
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  const min = new Date(Date.now() + 2 * 3600_000 - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lawyerId, startsAt: new Date(when).toISOString(), minutes }) }).catch(() => null);
    setBusy(false);
    if (r?.status === 401) { location.href = `/${locale}/login`; return; }
    if (r?.ok) { setOk(true); return; }
    const j = await r?.json().catch(() => null);
    setMsg(j?.error && MSG[j.error] ? t(MSG[j.error]) : r?.status === 503 ? t('common.notConfigured') : t('common.error'));
  }
  if (ok) return <p className="banner info" role="status">{t('appt.requested')}</p>;
  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 480 }}>
      <div className="field"><label htmlFor="w">{t('appt.when')}</label><input id="w" type="datetime-local" min={min} required value={when} onChange={(e) => setWhen(e.target.value)} dir="ltr" /></div>
      <div className="field"><label htmlFor="m">{t('appt.duration')}</label>
        <select id="m" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>{[30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select></div>
      <button className="btn btn-gold" disabled={busy || !when}>{t('lawyers.book')}</button>
      {msg && <p role="alert" className="banner bad">{msg}</p>}
    </form>
  );
}
