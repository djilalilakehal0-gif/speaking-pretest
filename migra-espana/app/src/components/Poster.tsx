import { Image, Text, View } from 'react-native';
import { useI18n } from '~/lib/i18n';
import { C, F } from '~/lib/theme';
import { POSTER, posterLabels } from '@/lib/ui/poster';

/** Arabic: original artwork. Other languages: clean artwork + translated labels at the same spots (shared layout with the website). */
export function Poster({ width }: { width: number }) {
  const { locale, t } = useI18n();
  const labels = posterLabels(locale);
  const scale = width / POSTER.w; const height = POSTER.h * scale;
  return (
    <View style={{ width, height, borderRadius: 28, borderWidth: 2, borderColor: C.gold, overflow: 'hidden' }} accessible accessibilityRole="image" accessibilityLabel={`MIGRA ESPAÑA — ${t('brand.tagline')}`}>
      <Image source={labels ? require('../../assets/brand/hero-clean.jpg') : require('../../assets/brand/hero.jpg')} resizeMode="cover" style={{ width, height }} />
      {labels?.map((l, i) => {
        const fs = l.size * scale; const lh = fs * 1.05; const h = lh * l.lines.length; const w = l.slot.w * scale;
        return (
          <View key={i} pointerEvents="none" style={{ position: 'absolute', left: l.slot.x * scale - w / 2, top: l.slot.y * scale - h / 2, width: w, height: h, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${l.slot.rot}deg` }] }}>
            {l.lines.map((x, k) => <Text key={k} numberOfLines={1} style={{ fontFamily: F.black, fontSize: fs, lineHeight: lh, color: '#fff', textAlign: 'center', writingDirection: 'ltr', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{x}</Text>)}
          </View>);
      })}
    </View>
  );
}
