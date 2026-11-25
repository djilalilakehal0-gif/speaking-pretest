import { router } from 'expo-router';
import { View } from 'react-native';
import { Card, H1, Notice, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';
import { PATHWAYS } from '@/lib/legal/pathways';

export const statusColor = (s: string) => (s === 'active' ? C.ok : s === 'amended' ? C.warn : C.bad);

export default function Law() {
  const { t, locale } = useI18n();
  return (
    <Screen>
      <H1>{t('nav.law')}</H1>
      <Notice text={t('legal.draftBanner')} />
      <Notice tone="info" text={`${t('legal.extraordinaryTitle')}. ${t('legal.extraordinaryBody')}`} />
      {PATHWAYS.filter((p) => p.slug !== 'extraordinary-regularisation').map((p) => (
        <Card key={p.slug} onPress={() => router.push({ pathname: '/law/[slug]', params: { slug: p.slug } })}>
          <View style={{ flexDirection: 'row' }}><Txt w="bold" style={{ fontSize: 12, color: statusColor(p.status) }}>{t(`status.${p.status}`)}</Txt></View>
          <Txt w="black" style={{ fontSize: 18 }}>{p.title[locale]}</Txt>
          <Txt style={{ color: C.muted, fontSize: 13 }}>{p.legalReference}</Txt>
          <Txt>{p.summary[locale]}</Txt>
          <Txt style={{ color: C.muted, fontSize: 13 }}>{t('common.lastVerified')}: {p.lastVerifiedOn ?? t('common.notVerified')}</Txt>
        </Card>))}
    </Screen>
  );
}
