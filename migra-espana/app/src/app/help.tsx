import { Linking } from 'react-native';
import { Card, H1, Notice, OutlineButton, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';
import { HELP_ORGS, HELP_SOURCE } from '@/lib/legal/help';
import { RESOURCES } from '@/lib/legal/sources';

export default function Help() {
  const { t } = useI18n();
  const censo = RESOURCES.find((r) => r.key === 'censo')!;
  return (
    <Screen>
      <H1>{t('help.title')}</H1>
      <Txt>{t('help.intro')}</Txt>
      {HELP_ORGS.map((o) => (
        <Card key={o.id}>
          <Txt w="black" style={{ fontSize: 17 }}>{o.name}</Txt>
          <Txt style={{ color: C.muted, fontSize: 13 }}>{t(`help.scope.${o.scope}`)}</Txt>
          <Txt w="bold" style={{ writingDirection: 'ltr' }}>{o.phone}{o.hours ? `  ·  ${o.hours}` : ''}</Txt>
          <OutlineButton icon="call-outline" label={t('help.call')} onPress={() => Linking.openURL(`tel:${o.phone.replace(/\s/g, '')}`)} />
        </Card>))}
      <Notice tone="info" text={`${t('help.note')} ${t('help.source')}: ${HELP_SOURCE.title} (${t('help.checked')} ${HELP_SOURCE.checkedOn}).`} />
      <Notice text={t('help.verify')} />
      <Txt accessibilityRole="link" onPress={() => Linking.openURL(censo.url)} style={{ color: C.goldHi, textDecorationLine: 'underline' }}>{censo.name}</Txt>
    </Screen>
  );
}
