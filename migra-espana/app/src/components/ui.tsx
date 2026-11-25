import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useI18n } from '~/lib/i18n';
import { C, F } from '~/lib/theme';
import { LOCALES, LOCALE_NAMES } from '@/i18n/config';

type Weight = 'body' | 'semi' | 'bold' | 'black';
/** Text that follows the active language direction (no app restart needed when switching to Arabic). */
export function Txt({ w = 'body', style, ...p }: TextProps & { w?: Weight }) {
  const { rtl } = useI18n();
  return <Text {...p} style={[{ color: C.ink, fontFamily: F[w], textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr', fontSize: 15, lineHeight: 24 }, style]} />;
}

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const { rtl } = useI18n();
  const inner = <View style={[{ direction: rtl ? 'rtl' : 'ltr', padding: 16, gap: 14, maxWidth: 760, width: '100%', alignSelf: 'center' }, style]}>{children}</View>;
  return <View style={{ flex: 1, backgroundColor: C.night }}>{scroll ? <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>{inner}</ScrollView> : inner}</View>;
}

export function GoldButton({ label, onPress, icon, disabled, style }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderRadius: 999 }, s.goldShadow, style]}>
      <LinearGradient colors={[C.goldHi, C.gold, C.goldLo]} style={s.pill}>
        {icon && <Ionicons name={icon} size={20} color={C.onGold} />}
        <Text style={{ color: C.onGold, fontFamily: F.black, fontSize: 19 }} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, icon, disabled, style }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => [s.pill, s.outline, { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      {icon && <Ionicons name={icon} size={20} color={C.gold} />}
      <Text style={{ color: C.ink, fontFamily: F.bold, fontSize: 18 }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress, gold }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; gold?: boolean }) {
  const body = <LinearGradient colors={['rgba(30,52,96,0.92)', 'rgba(12,24,52,0.95)']} style={[s.card, gold && { borderColor: C.gold, borderWidth: 1.5 }, style]}>{children}</LinearGradient>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>{body}</Pressable> : body;
}

export function Notice({ text, tone = 'gold' }: { text: string; tone?: 'gold' | 'info' | 'bad' }) {
  const border = tone === 'bad' ? C.bad : tone === 'info' ? C.lineSoft : C.gold;
  return <View style={[s.notice, { borderStartColor: border, backgroundColor: tone === 'info' ? 'rgba(255,255,255,0.05)' : 'rgba(199,164,91,0.12)' }]}><Txt style={{ fontSize: 14, lineHeight: 22 }}>{text}</Txt></View>;
}

export function RuleTitle({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <LinearGradient colors={['transparent', C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 2 }} />
      <Txt w="black" style={{ color: C.goldHi, fontSize: 27, lineHeight: 38, textAlign: 'center', flexShrink: 1 }}>{text}</Txt>
      <LinearGradient colors={[C.gold, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 2 }} />
    </View>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Txt w="black" style={[{ fontSize: 26, lineHeight: 38, color: C.goldHi }, style]}>{children}</Txt>;
}

export function Bullets({ items }: { items: string[] }) {
  return <View style={{ gap: 6 }}>{items.map((x, i) => <View key={i} style={{ flexDirection: 'row', gap: 8 }}><Txt style={{ color: C.gold }}>•</Txt><Txt style={{ flex: 1 }}>{x}</Txt></View>)}</View>;
}

/** Masthead: seal + gold wordmark + tagline, then the language pills. */
export function Masthead() {
  const { t, locale, setLocale } = useI18n();
  return (
    <View style={{ backgroundColor: C.night, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: C.lineSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image source={require('../../assets/brand/logo.jpg')} style={s.seal} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.brand, fontSize: 24, letterSpacing: 2, color: C.goldHi }} numberOfLines={1} adjustsFontSizeToFit>MIGRA ESPAÑA</Text>
          <Text style={{ fontFamily: F.bold, color: C.gold, fontSize: 14 }}>{t('brand.tagline')}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('nav.language')}>
        {LOCALES.map((l) => (
          <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: l === locale }} onPress={() => setLocale(l)} style={[s.lang, l === locale && { backgroundColor: 'rgba(199,164,91,0.22)', borderColor: C.gold }]}>
            <Text style={{ color: l === locale ? C.goldHi : C.ink, fontFamily: F.semi, fontSize: 13 }}>{LOCALE_NAMES[l]}</Text>
          </Pressable>))}
      </View>
    </View>
  );
}

export function Field({ label, ...p }: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { rtl } = useI18n();
  return (
    <View style={{ gap: 6 }}>
      <Txt w="bold" style={{ fontSize: 14 }}>{label}</Txt>
      <TextInput placeholderTextColor={C.muted} {...p} accessibilityLabel={label} style={[s.input, { textAlign: rtl ? 'right' : 'left' }, p.style]} />
    </View>
  );
}

export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[s.choice, selected && { borderColor: C.gold, backgroundColor: 'rgba(199,164,91,0.16)' }]}>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={C.gold} />
      <Txt w="semi" style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={[s.choice, value && { borderColor: C.gold }]}>
      <Ionicons name={value ? 'checkbox' : 'square-outline'} size={22} color={C.gold} />
      <Txt style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: { minHeight: 62, borderRadius: 999, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  outline: { borderWidth: 1.5, borderColor: C.gold, backgroundColor: 'rgba(10,21,48,0.55)' },
  goldShadow: { shadowColor: C.gold, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16, gap: 8, overflow: 'hidden' },
  notice: { borderStartWidth: 4, borderRadius: 10, padding: 12 },
  seal: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: C.gold },
  lang: { borderWidth: 1, borderColor: C.lineSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  input: { borderWidth: 1, borderColor: C.lineSoft, borderRadius: 14, backgroundColor: C.glass2, color: C.ink, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: F.body },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.lineSoft, borderRadius: 14, padding: 14, backgroundColor: 'rgba(10,21,48,0.55)' },
});
