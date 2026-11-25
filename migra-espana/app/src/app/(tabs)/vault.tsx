import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { AuthGate } from '~/components/AuthGate';
import { Bullets, Card, Field, GoldButton, H1, Notice, OutlineButton, Screen, Txt } from '~/components/ui';
import { ApiError, MAX_BYTES, expiringSoon, mimeFor, type Api, type UploadFile, type VaultDoc } from '~/lib/api';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';

const CATS = ['passport', 'identity', 'empadronamiento', 'historical_registration', 'employment_contract', 'payslip', 'family_document', 'birth_certificate', 'marriage_certificate', 'criminal_record', 'training_certificate', 'application_receipt', 'administrative_decision', 'other'];
const BASELINE = ['passport', 'empadronamiento', 'criminal_record'];

export default function VaultTab() { return <AuthGate>{(api) => <Vault api={api} />}</AuthGate>; }

export function Vault({ api }: { api: Api }) {
  const { t } = useI18n();
  const [docs, setDocs] = useState<VaultDoc[] | null>(null);
  const [cat, setCat] = useState('passport');
  const [expires, setExpires] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => { try { setDocs(await api.listDocuments()); } catch { setDocs([]); setMsg(t('common.error')); } }, [api, t]);
  useEffect(() => { void load(); }, [load]);

  async function upload(f: UploadFile, size?: number | null) {
    if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) { setMsg(t('docs.expires') + ': YYYY-MM-DD'); return; }
    if ((size ?? 0) > MAX_BYTES || !mimeFor(f.name)) { setMsg(t('docs.formats')); return; }
    setBusy(true); setMsg(null);
    try { await api.uploadDocument(f, cat, expires || undefined); setExpires(''); await load(); }
    catch { setMsg(t('common.error')); } finally { setBusy(false); }
  }
  async function scan() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setMsg(t('common.error')); return; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    const x = r.assets?.[0];
    if (!r.canceled && x) await upload({ uri: x.uri, name: x.fileName ?? `scan-${Date.now()}.jpg`, mimeType: x.mimeType ?? 'image/jpeg' }, x.fileSize);
  }
  async function pick() {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
    const x = r.assets?.[0];
    if (!r.canceled && x) await upload({ uri: x.uri, name: x.name, mimeType: x.mimeType ?? mimeFor(x.name) ?? 'application/octet-stream' }, x.size);
  }
  async function open(id: string) { try { await Linking.openURL(await api.signedUrl(id)); } catch { setMsg(t('common.error')); } }
  async function remove(id: string) { try { await api.deleteDocument(id); setConfirmId(null); await load(); } catch (e) { setMsg(e instanceof ApiError ? t('common.error') : t('common.error')); } }

  const have = new Set((docs ?? []).map((d) => d.category));
  const missing = BASELINE.filter((c) => !have.has(c));
  return (
    <Screen>
      <H1>{t('docs.title')}</H1>
      <Txt style={{ color: C.muted }}>{t('docs.formats')}</Txt>
      <Txt w="bold">{t('docs.category')}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>{CATS.map((c) => (
        <Pressable key={c} accessibilityRole="radio" accessibilityState={{ selected: c === cat }} onPress={() => setCat(c)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: c === cat ? C.gold : C.lineSoft, backgroundColor: c === cat ? 'rgba(199,164,91,0.2)' : 'transparent' }}><Txt style={{ fontSize: 13 }}>{t(`doc.cat.${c}`)}</Txt></Pressable>))}</View></ScrollView>
      <Field label={`${t('docs.expires')} (YYYY-MM-DD)`} value={expires} onChangeText={setExpires} placeholder="2030-12-31" keyboardType="numbers-and-punctuation" />
      <GoldButton icon="camera-outline" label={t('docs.scan')} onPress={scan} disabled={busy} />
      <OutlineButton icon="cloud-upload-outline" label={t('docs.upload')} onPress={pick} disabled={busy} />
      <Notice tone="info" text={t('docs.noSelfData')} />
      {msg && <Notice tone="bad" text={msg} />}
      {docs && missing.length > 0 && <Card><Txt w="black">{t('docs.missing')}</Txt><Bullets items={missing.map((c) => t(`doc.cat.${c}`))} /></Card>}
      {docs === null ? <Txt>{t('common.loading')}</Txt> : docs.length === 0 ? <Txt style={{ color: C.muted, fontStyle: 'italic' }}>{t('docs.empty')}</Txt> : docs.map((d) => (
        <Card key={d.id}>
          <Txt w="black">{t(`doc.cat.${d.category}`)}</Txt>
          <Txt style={{ color: C.muted }}>{d.file_name}</Txt>
          {d.expires_on && <Txt style={{ color: expiringSoon(d.expires_on) ? C.bad : C.muted }}>{`${t('docs.expires')}: ${d.expires_on}`}</Txt>}
          {confirmId === d.id ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OutlineButton label={t('common.cancel')} onPress={() => setConfirmId(null)} style={{ flex: 1 }} />
              <GoldButton label={t('common.delete')} onPress={() => remove(d.id)} style={{ flex: 1 }} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OutlineButton icon="download-outline" label={t('common.download')} onPress={() => open(d.id)} style={{ flex: 1 }} />
              <OutlineButton icon="trash-outline" label={t('common.delete')} onPress={() => setConfirmId(d.id)} style={{ flex: 1 }} />
            </View>)}
        </Card>))}
    </Screen>
  );
}
