import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Card, GoldButton, H1, Notice, OutlineButton, Screen, Txt } from '~/components/ui';
import { ApiError, telUri, waUri, type Lawyer } from '~/lib/api';
import { useI18n } from '~/lib/i18n';
import { useSession } from '~/lib/session';
import { C } from '~/lib/theme';
import { LOCALE_NAMES, type Locale } from '@/i18n/config';

export default function Lawyers() {
  const { t } = useI18n();
  const { api, session } = useSession();
  const [list, setList] = useState<Lawyer[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => { if (!api) { setList([]); return; } api.listLawyers().then(setList).catch(() => { setList([]); setMsg(t('common.error')); }); }, [api, t]);
  const needLogin = () => { if (!session) { router.push('/account'); return true; } return false; };

  async function message(l: Lawyer) {
    if (needLogin() || !api) return;
    try { const id = await api.openConversation(l.id); router.push({ pathname: '/chat/[id]', params: { id, title: l.display_name } }); }
    catch { setMsg(t('msg.unavailable')); }
  }
  async function book(l: Lawyer) {
    if (needLogin() || !api || !day || !time) return;
    try { await api.book(l.id, new Date(`${day}T${time}:00`)); setMsg(t('appt.requested')); setBooking(null); }
    catch (e) { setMsg(e instanceof ApiError && e.code === 'slot_taken' ? t('appt.slotTaken') : e instanceof ApiError && e.code === 'too_soon' ? t('appt.tooSoon') : t('common.error')); }
  }
  const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() + k + 1); return d.toISOString().slice(0, 10); });
  const times = Array.from({ length: 18 }, (_, k) => `${String(9 + Math.floor(k / 2)).padStart(2, '0')}:${k % 2 ? '30' : '00'}`);
  const chip = (label: string, on: boolean, onPress: () => void) => <Pressable key={label} onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: on ? C.gold : C.lineSoft, backgroundColor: on ? 'rgba(199,164,91,0.2)' : 'transparent' }}><Txt style={{ fontSize: 13 }}>{label}</Txt></Pressable>;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <H1 style={{ flex: 1 }}>{t('lawyers.title')}</H1>
        <OutlineButton icon="chatbubbles-outline" label={t('msg.title')} onPress={() => router.push('/conversations')} style={{ minHeight: 44 }} />
      </View>
      <Txt>{t('lawyers.intro')}</Txt>
      {msg && <Notice text={msg} />}
      {!api && <Notice text={t('common.demo')} />}
      {list === null ? <Txt>{t('common.loading')}</Txt> : list.length === 0 ? <Card><Txt>{t('lawyers.empty')}</Txt></Card> : list.map((l) => (
        <Card key={l.id}>
          <Txt w="bold" style={{ color: C.ok, fontSize: 13 }}>✓ {t('lawyers.verified')}</Txt>
          <Txt w="black" style={{ fontSize: 18 }}>{l.display_name}</Txt>
          <Txt style={{ color: C.muted }}>{`${t('lawyers.bar')}: ${l.bar_association}\n${t('lawyers.languages')}: ${l.languages.map((x) => LOCALE_NAMES[x as Locale] ?? x).join(', ')}`}</Txt>
          {l.consultation_price_cents != null && <Txt w="bold">{`${t('lawyers.price')}: ${(l.consultation_price_cents / 100).toFixed(2)} ${l.currency}`}</Txt>}
          <GoldButton icon="calendar-outline" label={t('lawyers.book')} onPress={() => setBooking(booking === l.id ? null : l.id)} />
          {booking === l.id && (
            <View style={{ gap: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 6 }}>{days.map((d) => chip(d.slice(5), day === d, () => setDay(d)))}</View></ScrollView>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{times.map((x) => chip(x, time === x, () => setTime(x)))}</View>
              <GoldButton label={t('lawyers.book')} disabled={!day || !time} onPress={() => book(l)} />
            </View>)}
          <OutlineButton icon="chatbubble-ellipses-outline" label={t('msg.open')} onPress={() => message(l)} />
          {l.contact_phone && <OutlineButton icon="call-outline" label={`${t('lawyers.call')} ${l.contact_phone}`} onPress={() => Linking.openURL(telUri(l.contact_phone!))} />}
          {l.contact_whatsapp && <OutlineButton icon="logo-whatsapp" label={t('lawyers.whatsapp')} onPress={() => Linking.openURL(waUri(l.contact_whatsapp!))} />}
        </Card>))}
      <Notice tone="info" text={t('lawyers.disclaimer')} />
    </Screen>
  );
}
