'use client';
import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { PrePaymentConfirm } from './PrePaymentConfirm';

/** Choose → full disclosure with an unticked box → only then the payment session is created. */
export function CheckoutButton({ tier, planName, price, disabled }: { tier: 'premium' | 'professional_legal'; planName: string; price: string | null; disabled?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (open) return <PrePaymentConfirm tier={tier} planName={planName} price={price ?? '—'} onCancel={() => setOpen(false)} />;
  return <button className="btn btn-gold" disabled={disabled || price === null} onClick={() => setOpen(true)}>{t('pricing.choose')}</button>;
}
