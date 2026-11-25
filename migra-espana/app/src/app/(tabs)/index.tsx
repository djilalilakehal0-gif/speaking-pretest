import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, ImageBackground, Pressable, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { Card, GoldButton, Notice, OutlineButton, RuleTitle, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';

function Tile({ title, image, onPress, tall }: { title: string; image: ImageSourcePropType; onPress: () => void; tall?: boolean }) {
  const { rtl } = useI18n();
  const heading = <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: tall ? undefined : 1 }}>
    <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={C.gold} /><Txt w="black" style={{ fontSize: 19, lineHeight: 28, flexShrink: 1 }}>{title}</Txt></View>;
  return (
    <Card onPress={onPress} style={tall ? { gap: 12 } : { flexDirection: 'row', alignItems: 'center', minHeight: 118 }}>
      {heading}
      <Image source={image} resizeMode={tall ? 'cover' : 'contain'} style={tall ? { width: '100%', height: 150, borderRadius: 14 } : { width: 118, height: 92, borderRadius: 14 }} />
    </Card>
  );
}

export default function Home() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width > 680;
  // Title "…. …." → second sentence in gold, like the brand mockup.
  const [line1, ...rest] = t('hero.title').split(/(?<=[.。])\s+/);
  const tiles = {
    elig: <Tile title={t('shortcut.eligibility')} image={require('../../../assets/brand/clipboard.jpg')} onPress={() => router.push('/eligibility')} />,
    road: <Tile tall title={t('shortcut.pathway')} image={require('../../../assets/brand/road.jpg')} onPress={() => router.push('/start')} />,
    law: <Tile title={t('shortcut.law')} image={require('../../../assets/brand/gavel.jpg')} onPress={() => router.push('/law')} />,
  };
  return (
    <Screen style={{ padding: 0, gap: 0 }}>
      <ImageBackground source={require('../../../assets/brand/hero.jpg')} resizeMode="cover" style={{ height: 240 }} imageStyle={{ opacity: 0.95 }} accessibilityLabel="Madrid">
        <LinearGradient colors={['transparent', C.night]} locations={[0.5, 1]} style={{ flex: 1 }} />
      </ImageBackground>
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Txt w="bold" style={{ color: C.goldHi, fontSize: 16 }}>{t('hero.eyebrow')}</Txt>
          <LinearGradient colors={['transparent', C.gold, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, width: 170 }} />
        </View>
        <Txt w="black" style={{ fontSize: 34, lineHeight: 48 }}>{line1}{rest.length > 0 && <Txt w="black" style={{ fontSize: 34, lineHeight: 48, color: C.goldHi }}>{'\n' + rest.join(' ')}</Txt>}</Txt>
        <Txt style={{ fontSize: 15.5, lineHeight: 26 }}>{t('hero.sub')}</Txt>
        <GoldButton icon="rocket-outline" label={t('hero.cta1')} onPress={() => router.push('/eligibility')} />
        <OutlineButton icon="scale-outline" label={t('hero.cta2')} onPress={() => router.push('/law')} />
        <OutlineButton icon="document-text-outline" label={t('start.homeLink')} onPress={() => router.push('/start')} />
        <RuleTitle text={t('home.shortcuts')} />
        {wide ? (
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ flex: 1, gap: 14 }}>{tiles.elig}{tiles.law}</View><View style={{ flex: 1 }}>{tiles.road}</View>
          </View>
        ) : (<>{tiles.elig}{tiles.road}{tiles.law}</>)}
        <Card gold style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="shield-checkmark-outline" size={22} color={C.gold} /><Txt w="black" style={{ color: C.goldHi, fontSize: 18, flexShrink: 1 }}>{t('home.trust.title')}</Txt></View>
            <Txt>{t('home.trust.body')}</Txt>
            <Txt style={{ color: C.muted, fontSize: 13, lineHeight: 20 }}>{t('home.notLawyer')}</Txt>
          </View>
          <Image source={require('../../../assets/brand/folder.jpg')} style={{ width: 92, height: 76, borderRadius: 12 }} />
        </Card>
        <Pressable accessibilityRole="link" onPress={() => router.push('/guides')}><Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name="list-outline" size={22} color={C.gold} /><Txt w="bold" style={{ flex: 1 }}>{t('nav.guides')}</Txt></Card></Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/help')}><Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name="call-outline" size={22} color={C.gold} /><Txt w="bold" style={{ flex: 1 }}>{t('help.title')}</Txt></Card></Pressable>
        <Notice tone="info" text={t('footer.disclaimer')} />
      </View>
    </Screen>
  );
}
