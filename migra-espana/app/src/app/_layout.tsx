import { Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold } from '@expo-google-fonts/cairo';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { I18nProvider, useI18n } from '~/lib/i18n';
import { SessionProvider } from '~/lib/session';
import { C, F } from '~/lib/theme';

function Inner() {
  const { t } = useI18n();
  const header = { headerStyle: { backgroundColor: C.night }, headerTintColor: C.goldHi, headerTitleStyle: { fontFamily: F.bold }, contentStyle: { backgroundColor: C.night } };
  return (
    <Stack screenOptions={header}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="start" options={{ title: t('start.homeLink') }} />
      <Stack.Screen name="guides" options={{ title: t('nav.guides') }} />
      <Stack.Screen name="help" options={{ title: t('help.title') }} />
      <Stack.Screen name="account" options={{ title: t('nav.login') }} />
      <Stack.Screen name="conversations" options={{ title: t('msg.title') }} />
      <Stack.Screen name="law/[slug]" options={{ title: t('nav.law') }} />
      <Stack.Screen name="chat/[id]" options={{ title: t('msg.title') }} />
    </Stack>
  );
}

export default function Root() {
  // Fonts are bundled with the app (no network needed at runtime).
  const [loaded] = useFonts({ Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold, Cinzel_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.night, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.gold} /></View>;
  return (
    <I18nProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Inner />
      </SessionProvider>
    </I18nProvider>
  );
}
