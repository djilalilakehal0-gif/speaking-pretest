import { describe, expect, it } from 'vitest';
import { displayPrice, PLANS, splitVat, tierAllows, tierFromPriceId } from './plans';

describe('plans', () => {
  const env = { STRIPE_PRICE_PREMIUM_MONTHLY: 'price_p', STRIPE_PRICE_PROFESSIONAL_MONTHLY: 'price_l', NEXT_PUBLIC_PRICE_PREMIUM_EUR: '9' };
  it('maps price ids to tiers; unknown → free (never grants access by accident)', () => {
    expect(tierFromPriceId('price_p', env)).toBe('premium');
    expect(tierFromPriceId('price_l', env)).toBe('professional_legal');
    expect(tierFromPriceId('price_x', env)).toBe('free');
    expect(tierFromPriceId(undefined, env)).toBe('free');
  });
  it('tier gating is monotonic', () => {
    expect(tierAllows('premium', 'free')).toBe(true);
    expect(tierAllows('free', 'premium')).toBe(false);
    expect(tierAllows('professional_legal', 'premium')).toBe(true);
  });
  it('shows no invented price when unset', () => {
    const pro = PLANS.find((p) => p.tier === 'professional_legal')!;
    expect(displayPrice(pro, env)).toBeNull();
    expect(displayPrice(PLANS.find((p) => p.tier === 'premium')!, env)).toBe('9');
  });
  it('splits VAT without losing cents', () => {
    const { net, vat } = splitVat(12100, 21);
    expect(net).toBe(10000); expect(vat).toBe(2100);
    const r = splitVat(999, 21); expect(r.net + r.vat).toBe(999);
  });
});
