'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

export function MessageButton({ lawyerId }: { lawyerId: string }) {
  const { t, locale } = useI18n();
  const [err, setErr] = useState('');
  return (<>
    <button className="btn btn-ghost" style={{ color: 'var(--text)' }} onClick={async () => {
      const r = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lawyerId }) }).catch(() => null);
      if (r?.status === 401) { location.href = `/${locale}/login`; return; }
      const j = await r?.json().catch(() => null);
      if (j?.id) location.href = `/${locale}/messages?c=${j.id}`; else setErr(r?.status === 503 ? t('common.notConfigured') : t('msg.unavailable'));
    }}>{t('msg.open')}</button>
    {err && <span role="alert" className="pending"> {err}</span>}
  </>);
}
