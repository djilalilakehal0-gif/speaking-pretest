import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AuthGate } from '~/components/AuthGate';
import { Card, Screen, Txt } from '~/components/ui';
import type { Api, Conversation } from '~/lib/api';
import { useI18n } from '~/lib/i18n';
import { C } from '~/lib/theme';

function List({ api }: { api: Api }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Conversation[] | null>(null);
  useEffect(() => { api.listConversations().then(setItems).catch(() => setItems([])); }, [api]);
  return (
    <Screen>
      {items === null ? <Txt>{t('common.loading')}</Txt> : items.length === 0 ? <Txt style={{ color: C.muted, fontStyle: 'italic' }}>{t('msg.empty')}</Txt> : items.map((c) => (
        <Card key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id, title: c.withName ?? t('msg.client') } })}>
          <Txt w={c.unread ? 'black' : 'semi'}>{(c.withName ?? t('msg.client')) + (c.unread ? '  ●' : '')}</Txt>
          <Txt style={{ color: C.muted }} numberOfLines={1}>{c.last?.body ?? '—'}</Txt>
        </Card>))}
    </Screen>
  );
}
export default function Conversations() { return <AuthGate>{(api) => <List api={api} />}</AuthGate>; }
