'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { LOCALE_NAMES, LOCALES, type Locale } from '@/i18n/config';

export function LawyerRegisterForm() {
  const { t, locale } = useI18n();
  const [f, setF] = useState({ displayName: '', barAssociation: '', barNumber: '', bio: '' });
  const [langs, setLangs] = useState<Locale[]>([locale]); const [truth, setTruth] = useState(false);
  const [phone, setPhone] = useState(''); const [wa, setWa] = useState(''); const [share, setShare] = useState(false);
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = await fetch('/api/lawyers/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, bio: f.bio || undefined, languages: langs, confirmTruthful: truth, contactPhone: phone, contactWhatsapp: wa, shareContact: share }) }).catch(() => null);
    setBusy(false);
    if (r?.status === 401) { location.href = `/${locale}/register`; return; }
    if (r?.ok) { setOk(true); return; }
    setMsg(r?.status === 422 ? t('reg.contactInvalid') : r?.status === 409 ? t('reg.exists') : r?.status === 503 ? t('common.notConfigured') : t('common.error'));
  }
  if (ok) return <p className="banner info" role="status">{t('reg.done')}</p>;
  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 560 }}>
      <p className="banner info" style={{ marginTop: 0 }}>{t('reg.intro')}</p>
      <div className="field"><label htmlFor="rn">{t('reg.name')}</label><input id="rn" required minLength={3} value={f.displayName} onChange={set('displayName')} /></div>
      <div className="field"><label htmlFor="rb">{t('reg.bar')}</label><input id="rb" required minLength={3} value={f.barAssociation} onChange={set('barAssociation')} /></div>
      <div className="field"><label htmlFor="rc">{t('reg.barNo')}</label><input id="rc" required value={f.barNumber} onChange={set('barNumber')} dir="ltr" /></div>
      <fieldset className="field" style={{ border: 0, padding: 0 }}><legend style={{ fontWeight: 600, marginBottom: 6 }}>{t('reg.langs')}</legend>
        <div className="opts">{LOCALES.map((l) => (<label key={l} className="opt"><input type="checkbox" checked={langs.includes(l)} onChange={(e) => setLangs((x) => e.target.checked ? [...x, l] : x.filter((y) => y !== l))} />{LOCALE_NAMES[l]}</label>))}</div></fieldset>
      <div className="field"><label htmlFor="bi">{t('reg.bio')}</label><textarea id="bi" rows={3} maxLength={1500} value={f.bio} onChange={set('bio')} /></div>
      <fieldset className="field" style={{ border: 0, padding: 0 }}><legend style={{ fontWeight: 600, marginBottom: 6 }}>{t('reg.contactTitle')}</legend>
        <p className="pending" style={{ marginTop: 0 }}>{t('reg.contactHint')}</p>
        <div className="field"><label htmlFor="cp">{t('reg.phone')}</label><input id="cp" type="tel" inputMode="tel" placeholder="+34 600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" /></div>
        <div className="field"><label htmlFor="cw">{t('reg.whatsapp')}</label><input id="cw" type="tel" inputMode="tel" placeholder="+34 600 000 000" value={wa} onChange={(e) => setWa(e.target.value)} dir="ltr" /></div>
        <label className="opt"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />{t('reg.contactConsent')}</label></fieldset>
      <label className="opt" style={{ marginBottom: 16 }}><input type="checkbox" checked={truth} onChange={(e) => setTruth(e.target.checked)} />{t('reg.truth')}</label>
      <button className="btn btn-gold" disabled={busy || !truth || langs.length === 0 || (!!(phone || wa) && !share)}>{t('reg.submit')}</button>
      {msg && <p role="alert" className="banner bad">{msg}</p>}
    </form>
  );
}
