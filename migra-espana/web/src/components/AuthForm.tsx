'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { browserClient, browserConfigured } from '@/lib/supabase/browser';

export function AuthForm({ mode, onDone }: { mode: 'login' | 'register'; onDone?: () => void }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false); const [ai, setAi] = useState(false);
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (!browserConfigured()) { setMsg(t('common.notConfigured')); return; }
    if (mode === 'register' && !terms) { setMsg(t('common.required') + ': ' + t('auth.consentTerms')); return; }
    setBusy(true);
    const sb = browserClient(); const now = new Date().toISOString();
    const res = mode === 'login'
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/${locale}/dashboard`, data: { locale, consent_terms_at: now, consent_ai_at: ai ? now : '' } } });
    setBusy(false);
    if (res.error) { setMsg(res.error.message); return; }
    if (mode === 'register' && !res.data.session) { setMsg(t('auth.checkEmail')); onDone?.(); return; }
    if (onDone) onDone(); else router.push(`/${locale}/dashboard`);
  }
  async function forgot() {
    if (!browserConfigured() || !email) return;
    await browserClient().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/${locale}/login` });
    setMsg(t('auth.checkEmail'));
  }
  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 460, marginInline: 'auto' }}>
      <div className="field"><label htmlFor="em">{t('auth.email')}</label><input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></div>
      <div className="field"><label htmlFor="pw">{t('auth.password')}</label><input id="pw" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" /></div>
      {mode === 'register' && (<>
        <label className="opt" style={{ marginBottom: 10 }}><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />{t('auth.consentTerms')}</label>
        <label className="opt" style={{ marginBottom: 16 }}><input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />{t('auth.consentAi')}</label>
      </>)}
      <button className="btn btn-gold" disabled={busy} style={{ width: '100%' }}>{mode === 'login' ? t('auth.login') : t('auth.register')}</button>
      {msg && <p role="alert" className="banner" style={{ marginBottom: 0 }}>{msg}</p>}
      <p style={{ marginTop: 16, marginBottom: 0 }}>
        {mode === 'login' ? (<><button type="button" className="btn-link" onClick={forgot} style={{ background: 'none', border: 0, color: 'var(--accent-ink)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit', padding: 0 }}>{t('auth.forgot')}</button><br />{t('auth.noAccount')} <Link href={`/${locale}/register`}>{t('auth.register')}</Link></>)
          : (<>{t('auth.haveAccount')} <Link href={`/${locale}/login`}>{t('auth.login')}</Link></>)}
      </p>
    </form>
  );
}
