import { router } from 'expo-router';
import { GoldButton, Notice, OutlineButton, Screen } from './ui';
import { useI18n } from '~/lib/i18n';
import { useSession } from '~/lib/session';
import type { Api } from '~/lib/api';

/** Features that need an account + backend. Without config: a demo notice, never fake data. */
export function AuthGate({ children }: { children: (api: Api) => React.ReactNode }) {
  const { t } = useI18n();
  const { available, session, api } = useSession();
  if (!available || !api) return <Screen><Notice text={t('common.demo')} /><Notice tone="info" text={t('common.notConfigured')} /></Screen>;
  if (!session) return (
    <Screen>
      <Notice text={t('msg.login')} />
      <GoldButton label={t('auth.login')} onPress={() => router.push('/account')} />
      <OutlineButton label={t('auth.register')} onPress={() => router.push({ pathname: '/account', params: { mode: 'register' } })} />
    </Screen>);
  return <>{children(api)}</>;
}
