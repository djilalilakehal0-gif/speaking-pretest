import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/tabs';
import { Masthead } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C, F } from '~/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const tab = (icon: IconName) => ({ tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={icon} color={color as string} size={size} /> });

export default function TabsLayout() {
  const { t, rtl } = useI18n();
  return (
    <Tabs screenOptions={{
      header: () => <Masthead />,
      tabBarStyle: { backgroundColor: '#0b1630', borderTopColor: C.lineSoft, height: 64, paddingBottom: 8, direction: rtl ? 'rtl' : 'ltr' },
      tabBarActiveTintColor: C.goldHi, tabBarInactiveTintColor: C.gold, tabBarLabelStyle: { fontFamily: F.semi, fontSize: 11 },
      sceneStyle: { backgroundColor: C.night },
    }}>
      <Tabs.Screen name="index" options={{ title: t('nav.home'), ...tab('home-outline') }} />
      <Tabs.Screen name="law" options={{ title: t('nav.law'), ...tab('book-outline') }} />
      <Tabs.Screen name="eligibility" options={{ title: t('nav.eligibility'), ...tab('checkmark-done-outline') }} />
      <Tabs.Screen name="vault" options={{ title: t('nav.documents'), ...tab('folder-open-outline') }} />
      <Tabs.Screen name="lawyers" options={{ title: t('nav.lawyers'), ...tab('people-outline') }} />
    </Tabs>
  );
}
