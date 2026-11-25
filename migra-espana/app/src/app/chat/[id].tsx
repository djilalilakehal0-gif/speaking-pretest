import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { AuthGate } from '~/components/AuthGate';
import { Notice, Txt } from '~/components/ui';
import { ApiError, type Api, type Message } from '~/lib/api';
import { useI18n } from '~/lib/i18n';
import { C, F } from '~/lib/theme';

export function Chat({ api, id }: { api: Api; id: string }) {
  const { t, rtl } = useI18n();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState(''); const [err, setErr] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const load = useCallback(async () => { try { setMsgs(await api.messages(id)); } catch { /* keep last state */ } }, [api, id]);
  useEffect(() => { void load(); const h = setInterval(load, 8000); return () => clearInterval(h); }, [load]);   // polling; Supabase Realtime later

  async function send() {
    const body = text.trim(); if (!body) return; setErr(null);
    try { await api.sendMessage(id, body); setText(''); await load(); }
    catch (e) { setErr(e instanceof ApiError && e.code === 'identifier_in_message' ? t('msg.idBlocked') : e instanceof ApiError && e.code === 'forbidden' ? t('msg.unavailable') : t('common.error')); }
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.night, direction: rtl ? 'rtl' : 'ltr' }}>
      <View style={{ padding: 12 }}><Notice tone="info" text={t('msg.note')} /></View>
      <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd()} contentContainerStyle={{ padding: 12, gap: 8 }}>
        {msgs.map((m) => (
          <View key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: 12, borderRadius: 16, backgroundColor: m.mine ? C.navy : 'rgba(30,52,96,0.9)', borderWidth: 1, borderColor: m.mine ? C.gold : C.lineSoft }}>
            <Txt>{m.body}</Txt>
          </View>))}
      </ScrollView>
      {err && <View style={{ paddingHorizontal: 12 }}><Notice tone="bad" text={err} /></View>}
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, alignItems: 'flex-end' }}>
        <TextInput value={text} onChangeText={setText} placeholder={t('msg.placeholder')} placeholderTextColor={C.muted} multiline maxLength={4000} accessibilityLabel={t('msg.placeholder')}
          style={{ flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 14, borderWidth: 1, borderColor: C.lineSoft, backgroundColor: C.glass2, color: C.ink, paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.body, textAlign: rtl ? 'right' : 'left' }} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.send')} onPress={send} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="send" size={20} color={C.onGold} style={{ transform: [{ scaleX: rtl ? -1 : 1 }] }} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function ChatScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  return (<><Stack.Screen options={{ title: title ?? '' }} /><AuthGate>{(api) => <Chat api={api} id={String(id)} />}</AuthGate></>);
}
