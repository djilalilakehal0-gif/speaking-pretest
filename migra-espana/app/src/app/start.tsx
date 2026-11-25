import { router } from 'expo-router';
import { View } from 'react-native';
import { Bullets, Card, GoldButton, H1, Notice, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';

export default function Start() {
  const { t } = useI18n();
  return (
    <Screen>
      <H1>{t('start.title')}</H1>
      <Txt>{t('start.sub')}</Txt>
      {[1, 2, 3, 4].map((n) => (
        <Card key={n} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}><Txt w="black" style={{ color: C.onGold, textAlign: 'center' }}>{n}</Txt></View>
          <View style={{ flex: 1, gap: 4 }}><Txt w="black">{t(`start.s${n}.t`)}</Txt><Txt>{t(`start.s${n}.b`)}</Txt></View>
        </Card>))}
      <Card><Txt w="black" style={{ color: C.goldHi, fontSize: 18 }}>{t('start.proofTitle')}</Txt><Txt>{t('start.proofBody')}</Txt><Bullets items={[1, 2, 3, 4].map((n) => t(`start.proof${n}`))} /></Card>
      <Notice text={t('docs.noSelfData')} />
      <Card><Txt w="black" style={{ color: C.goldHi, fontSize: 18 }}>{t('start.faqTitle')}</Txt>
        {[1, 2].map((n) => <View key={n} style={{ gap: 6 }}><Txt w="bold">{t(`start.faq${n}q`)}</Txt><Notice text={t('start.faqPending')} /></View>)}</Card>
      <GoldButton icon="rocket-outline" label={t('start.cta')} onPress={() => router.push('/eligibility')} />
      <Notice tone="info" text={t('elig.disclaimer')} />
    </Screen>
  );
}
