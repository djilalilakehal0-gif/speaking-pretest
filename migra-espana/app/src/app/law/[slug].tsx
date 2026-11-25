import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { Bullets, Card, H1, Notice, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';
import { pathwayBySlug } from '@/lib/legal/pathways';
import { SOURCES } from '@/lib/legal/sources';
import type { SectionKey } from '@/lib/legal/types';

const SECTIONS: [SectionKey, string][] = [['definition', 'legal.definition'], ['who', 'legal.who'], ['conditions', 'legal.conditions'], ['residence', 'legal.residence'], ['employment', 'legal.employment'], ['renewal', 'legal.renewal']];

export default function Pathway() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const p = pathwayBySlug(String(slug));
  if (!p) return <Screen><Notice tone="bad" text={t('common.error')} /></Screen>;
  return (
    <Screen>
      <Stack.Screen options={{ title: p.title[locale] }} />
      <H1>{p.title[locale]}</H1>
      <Txt>{p.summary[locale]}</Txt>
      <Txt style={{ color: C.muted, fontSize: 13 }}>{`${t('legal.spanishTerm')}: ${p.spanishTerm}\n${t('common.legalRef')}: ${p.legalReference}\n${t('common.lastVerified')}: ${p.lastVerifiedOn ?? t('common.notVerified')}`}</Txt>
      <Notice text={t('legal.draftBanner')} />
      {locale !== 'es' && !p.translationsReviewed && <Notice tone="info" text={t('legal.translationBanner')} />}
      {SECTIONS.map(([k, label]) => (
        <Card key={k}>
          <Txt w="black" style={{ color: C.goldHi }}>{t(label)}</Txt>
          {p.verifiedSections.includes(k) && p.sections[k]?.length
            ? <Bullets items={p.sections[k]!.map((x) => x[locale])} />
            : <Txt style={{ color: C.muted, fontStyle: 'italic' }}>{t('legal.pendingSection')}</Txt>}
        </Card>))}
      <Card><Txt w="black" style={{ color: C.goldHi }}>{t('legal.fees')}</Txt><Txt>{t('legal.feesNote')}</Txt></Card>
      <Card><Txt w="black" style={{ color: C.goldHi }}>{t('legal.remedies')}</Txt><Txt>{t('legal.remediesGeneric')}</Txt></Card>
      <Card>
        <Txt w="black" style={{ color: C.goldHi }}>{t('legal.references')}</Txt>
        {SOURCES.filter((s) => p.sourceIds.includes(s.id)).map((s) => (
          <Txt key={s.id} accessibilityRole="link" onPress={() => Linking.openURL(s.url)} style={{ color: C.goldHi, textDecorationLine: 'underline' }}>{s.title}</Txt>))}
      </Card>
    </Screen>
  );
}
