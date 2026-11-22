'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

/** POST/PATCH JSON to an API route, then refresh the server component tree. */
export function ActionButton({ url, method = 'POST', body, label, variant = 'gold' }: { url: string; method?: string; body: unknown; label: string; variant?: 'gold' | 'ghost' }) {
  const { t } = useI18n();
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <>
      <button className={`btn btn-${variant}`} disabled={busy} style={variant === 'ghost' ? { color: 'var(--text)' } : undefined} onClick={async () => {
        setBusy(true); setErr(false);
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
        setBusy(false);
        if (res?.ok) r.refresh(); else setErr(true);
      }}>{label}</button>
      {err && <span role="alert" className="pending"> {t('common.error')}</span>}
    </>
  );
}
