import { View } from 'react-native';
import { Card, H1, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';

export default function Guides() {
  const { t } = useI18n();
  return (
    <Screen>
      <H1>{t('guide.title')}</H1>
      <Txt style={{ color: C.muted }}>{t('guide.timing')}</Txt>
      {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
        <Card key={n} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}><Txt w="black" style={{ color: C.onGold, textAlign: 'center' }}>{n}</Txt></View>
          <View style={{ flex: 1, gap: 4 }}><Txt w="black">{t(`guide.s${n}.t`)}</Txt><Txt>{t(`guide.s${n}.b`)}</Txt></View>
        </Card>))}
    </Screen>
  );
}
