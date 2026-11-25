import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Check, Field, GoldButton, H1, Notice, OutlineButton, Screen } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { useSession } from '~/lib/session';

export default function Account() {
  const { t, locale } = useI18n();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { available, session, signIn, signUp, signOut, resetPassword } = useSession();
  const [register, setRegister] = useState(mode === 'register');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false); const [ai, setAi] = useState(false);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  if (session) return <Screen><H1>{session.user.email ?? ''}</H1><GoldButton label={t('nav.logout')} onPress={async () => { await signOut(); router.back(); }} /></Screen>;
  async function submit() {
    if (register && !terms) { setMsg(`${t('common.required')}: ${t('auth.consentTerms')}`); return; }
    setBusy(true); setMsg(null);
    const err = register ? await signUp(email.trim(), password, locale, ai) : await signIn(email.trim(), password);
    setBusy(false);
    if (!err) { router.back(); return; }
    setMsg(err === 'check_email' ? t('auth.checkEmail') : err === 'not_configured' ? t('common.notConfigured') : err);
  }
  return (
    <Screen>
      <H1>{register ? t('auth.register') : t('auth.login')}</H1>
      {!available && <Notice text={t('common.demo')} />}
      <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete={register ? 'new-password' : 'current-password'} />
      {register && <><Check label={t('auth.consentTerms')} value={terms} onChange={setTerms} /><Check label={t('auth.consentAi')} value={ai} onChange={setAi} /></>}
      <GoldButton label={register ? t('auth.register') : t('auth.login')} onPress={submit} disabled={busy || password.length < 10 || !email.includes('@')} />
      {msg && <Notice text={msg} />}
      {!register && <OutlineButton label={t('auth.forgot')} onPress={async () => { if (email) { await resetPassword(email.trim()); setMsg(t('auth.checkEmail')); } }} />}
      <OutlineButton label={register ? `${t('auth.haveAccount')} ${t('auth.login')}` : `${t('auth.noAccount')} ${t('auth.register')}`} onPress={() => setRegister(!register)} />
    </Screen>
  );
}
