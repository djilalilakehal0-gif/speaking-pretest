'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

export function ContactEditor({ phone, whatsapp }: { phone: string | null; whatsapp: string | null }) {
  const { t } = useI18n(); const r = useRouter();
  const [p, setP] = useState(phone ?? ''); const [w, setW] = useState(whatsapp ?? ''); const [share, setShare] = useState(!!(phone || whatsapp));
  const [msg, setMsg] = useState('');
  async function save(remove: boolean) {
    setMsg('');
    const body = remove ? {} : { contactPhone: p, contactWhatsapp: w, shareContact: share };
    const res = await fetch('/api/lawyers/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (res?.ok) { if (remove) { setP(''); setW(''); setShare(false); } setMsg(t('contact.saved')); r.refresh(); } else setMsg(res?.status === 422 ? t('reg.contactInvalid') : t('common.error'));
  }
  return (
    <section className="card"><h3>{t('reg.contactTitle')}</h3><p className="pending">{t('reg.contactHint')}</p>
      <div className="field"><label htmlFor="ep">{t('reg.phone')}</label><input id="ep" type="tel" value={p} onChange={(e) => setP(e.target.value)} dir="ltr" placeholder="+34 600 000 000" /></div>
      <div className="field"><label htmlFor="ew">{t('reg.whatsapp')}</label><input id="ew" type="tel" value={w} onChange={(e) => setW(e.target.value)} dir="ltr" placeholder="+34 600 000 000" /></div>
      <label className="opt" style={{ marginBottom: 12 }}><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />{t('reg.contactConsent')}</label>
      <div className="actions"><button className="btn btn-gold" disabled={(!!(p || w)) && !share} onClick={() => save(false)}>{t('common.save')}</button>
        <button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={() => save(true)}>{t('contact.remove')}</button></div>
      {msg && <p role="status" className="banner info">{msg}</p>}</section>
  );
}
