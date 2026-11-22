'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

export function CheckoutButton({ tier, disabled }: { tier: 'premium' | 'professional_legal'; disabled?: boolean }) {
  const { t, locale } = useI18n();
  const [msg, setMsg] = useState('');
  return (
    <>
      <button className="btn btn-gold" disabled={disabled} onClick={async () => {
        const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier, locale }) }).catch(() => null);
        if (r?.status === 401) { location.href = `/${locale}/login`; return; }
        const j = await r?.json().catch(() => null);
        if (j?.url) location.href = j.url; else setMsg(r?.status === 503 ? t('common.notConfigured') : t('common.error'));
      }}>{t('pricing.choose')}</button>
      {msg && <p role="alert" className="pending">{msg}</p>}
    </>
  );
}
