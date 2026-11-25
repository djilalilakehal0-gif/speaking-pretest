import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Bullets, Card, Check, Choice, GoldButton, H1, Notice, OutlineButton, Screen, Txt } from '~/components/ui';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';
// The SAME engine as the website (unit-tested there).
import { assess, groupByBucket } from '@/lib/eligibility/engine';
import { ASYLUM_OPTIONS, PERMIT_OPTIONS, QUESTIONS, isVisible } from '@/lib/eligibility/questions';
import { COUNTRY_CODES } from '@/lib/eligibility/countries';
import type { Answers, Assessment } from '@/lib/eligibility/types';

const flag = (cc: string) => String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
function countryName(cc: string, loc: string) {
  try { return new Intl.DisplayNames([loc], { type: 'region' }).of(cc) ?? cc; } catch { return cc; }   // Hermes may lack DisplayNames
}

export default function Eligibility() {
  const { t, locale } = useI18n();
  const [a, setA] = useState<Answers>({});
  const [i, setI] = useState(0);
  const [res, setRes] = useState<Assessment | null>(null);
  const [query, setQuery] = useState('');
  const visible = QUESTIONS.filter((q) => isVisible(q, a));
  const q = visible[Math.min(i, visible.length - 1)];
  const cur = (a as Record<string, string | undefined>)[q.code];
  const set = (v: string) => setA((x) => ({ ...x, [q.code]: v }) as Answers);
  const countries = useMemo(() => COUNTRY_CODES.map((c) => ({ c, n: countryName(c, locale) })).sort((x, y) => x.n.localeCompare(y.n)), [locale]);

  if (res) return <Results res={res} restart={() => { setA({}); setI(0); setRes(null); }} />;

  const year = new Date().getFullYear();
  const [selY, selM] = (cur ?? '').split('-');
  const last = i >= visible.length - 1;
  return (
    <Screen>
      <H1>{t('elig.title')}</H1>
      <View style={{ height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}><View style={{ height: 8, width: `${((i + 1) / visible.length) * 100}%`, backgroundColor: C.gold }} /></View>
      <Txt style={{ color: C.muted, fontSize: 13 }}>{`${t('elig.question')} ${i + 1} ${t('elig.of')} ${visible.length}${q.additional ? ' · ' + t('elig.additional') : ''}`}</Txt>
      <Txt w="black" style={{ fontSize: 21, lineHeight: 32 }}>{t(`q.${q.code}`)}</Txt>
      {t(`q.help.${q.code}`) !== `q.help.${q.code}` && <Txt style={{ color: C.muted, fontStyle: 'italic' }}>{t(`q.help.${q.code}`)}</Txt>}

      {q.kind === 'country' && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','Y','Z'].map((l) => (
              <Pressable key={l} onPress={() => setQuery(l)} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: query === l ? C.gold : C.lineSoft }}><Txt style={{ fontSize: 13 }}>{l}</Txt></Pressable>))}
          </View>
          <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
            <View style={{ gap: 8 }}>{countries.filter((x) => !query || x.c.startsWith(query) || x.n.toUpperCase().startsWith(query)).map((x) => (
              <Choice key={x.c} label={`${flag(x.c)}  ${x.n}`} selected={cur === x.c} onPress={() => set(x.c)} />))}</View>
          </ScrollView>
        </View>)}

      {q.kind === 'date' && (
        <View style={{ gap: 10 }}>
          <Txt w="bold">{selY ? `${selY}-${selM ?? '…'}` : t('common.select')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{Array.from({ length: 16 }, (_, k) => String(year - k)).map((y) => (
            <Pressable key={y} onPress={() => set(`${y}-${selM ?? '01'}-01`)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: selY === y ? C.gold : C.lineSoft, backgroundColor: selY === y ? 'rgba(199,164,91,0.18)' : 'transparent' }}><Txt>{y}</Txt></Pressable>))}</View>
          {selY && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{Array.from({ length: 12 }, (_, k) => String(k + 1).padStart(2, '0')).map((m) => {
            const future = Number(selY) === year && Number(m) > new Date().getMonth() + 1;
            return <Pressable key={m} disabled={future} onPress={() => set(`${selY}-${m}-01`)} style={{ opacity: future ? 0.3 : 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: selM === m ? C.gold : C.lineSoft, backgroundColor: selM === m ? 'rgba(199,164,91,0.18)' : 'transparent' }}><Txt>{m}</Txt></Pressable>; })}</View>}
        </View>)}

      {(q.kind === 'yesno' || q.kind === 'yesnounsure' || q.kind === 'asylum' || q.kind === 'permit') && (
        <View style={{ gap: 10 }} accessibilityRole="radiogroup">
          {(q.kind === 'asylum' ? ASYLUM_OPTIONS.map((o) => [o, t(`opt.asylum.${o}`)])
            : q.kind === 'permit' ? PERMIT_OPTIONS.map((o) => [o, t(`opt.permit.${o}`)])
            : [['yes', t('common.yes')], ['no', t('common.no')], ...(q.kind === 'yesnounsure' ? [['unsure', t('common.unsure')]] : [])]).map(([v, label]) => (
            <Choice key={v} label={label} selected={cur === v} onPress={() => set(v)} />))}
        </View>)}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <OutlineButton label={t('common.back')} disabled={i === 0} onPress={() => setI(i - 1)} style={{ flex: 1 }} />
        {/* Skipping is allowed: unanswered stays "to confirm", never "no". */}
        <GoldButton label={last ? t('elig.seeResults') : t('common.next')} onPress={() => (last ? setRes(assess(a)) : setI(i + 1))} style={{ flex: 1 }} />
      </View>
      <Notice tone="info" text={t('elig.disclaimer')} />
    </Screen>
  );
}

function Results({ res, restart }: { res: Assessment; restart: () => void }) {
  const { t } = useI18n();
  const g = groupByBucket(res);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const docs = [...new Set(res.results.filter((r) => r.bucket !== 'not_met').flatMap((r) => r.documents))];
  const color = { eligible: C.ok, needs_info: C.warn, not_met: C.bad } as const;
  const section = (title: string, codes: string[], pre = 'elig.code.') => codes.length > 0 && <View style={{ gap: 4 }}><Txt w="bold">{title}</Txt><Bullets items={codes.map((c) => t(pre + c))} /></View>;
  return (
    <Screen>
      <Notice text={t('elig.disclaimer')} />
      {res.monthsInSpain !== null && <Txt style={{ color: C.muted }}>{`${t('elig.monthsInSpain')}: ${res.monthsInSpain} ${t('elig.months')} · ${t('common.lastVerified')}: ${res.rulesSnapshotDate}`}</Txt>}
      {res.results.length === 0 && <Card><Txt>{t('elig.empty')}</Txt></Card>}
      {(['eligible', 'needs_info', 'not_met'] as const).map((b) => g[b].length > 0 && (
        <View key={b} style={{ gap: 10 }}>
          <Txt w="black" style={{ fontSize: 20, color: C.goldHi }}>{t(`elig.${b}`)}</Txt>
          {g[b].map((r) => (
            <Card key={r.pathway} style={{ borderColor: color[b], borderWidth: 1.5 }}>
              <Txt w="black" style={{ fontSize: 17 }}>{t(`pathway.${r.pathway}`)}</Txt>
              {section(t('elig.met'), r.met)}{section(t('elig.missing'), r.missing)}{section(t('elig.notMet'), r.notMet)}
              {section(t('elig.docsNeeded'), r.documents, 'doc.')}{section(t('elig.nextSteps'), r.nextSteps)}
            </Card>))}
        </View>))}
      {docs.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt w="black" style={{ fontSize: 20, color: C.goldHi }}>{t('checklist.title')}</Txt>
          <Txt style={{ color: C.muted }}>{t('checklist.hint')}</Txt>
          {docs.map((d) => <Check key={d} label={t(`doc.${d}`)} value={!!done[d]} onChange={(v) => setDone((x) => ({ ...x, [d]: v }))} />)}
        </View>)}
      {res.needsLawyerReview && <Card gold><Txt w="black" style={{ color: C.goldHi }}>{t('elig.lawyerTitle')}</Txt><Bullets items={res.lawyerReviewReasons.map((x) => t(`elig.reason.${x}`))} /></Card>}
      <GoldButton label={t('elig.restart')} onPress={restart} />
    </Screen>
  );
}
