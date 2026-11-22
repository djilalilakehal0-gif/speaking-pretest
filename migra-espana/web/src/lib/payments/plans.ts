export type Tier = 'free' | 'premium' | 'professional_legal';

export interface Plan { tier: Tier; priceEnv: string; displayPriceEnv: string; features: string[] }

/**
 * Prices are a commercial decision and are NOT hard-coded: set STRIPE_PRICE_* (Stripe price ids) and
 * NEXT_PUBLIC_PRICE_*_EUR (display, VAT-inclusive as configured in Stripe Tax). Unset ⇒ UI shows "set at launch".
 */
export const PLANS: Plan[] = [
  { tier: 'free', priceEnv: '', displayPriceEnv: '', features: ['pricing.free.1', 'pricing.free.2', 'pricing.free.3', 'pricing.free.4'] },
  { tier: 'premium', priceEnv: 'STRIPE_PRICE_PREMIUM_MONTHLY', displayPriceEnv: 'NEXT_PUBLIC_PRICE_PREMIUM_EUR',
    features: ['pricing.premium.1', 'pricing.premium.2', 'pricing.premium.3', 'pricing.premium.4', 'pricing.premium.5'] },
  { tier: 'professional_legal', priceEnv: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY', displayPriceEnv: 'NEXT_PUBLIC_PRICE_PROFESSIONAL_EUR',
    features: ['pricing.pro.1', 'pricing.pro.2', 'pricing.pro.3', 'pricing.pro.4', 'pricing.pro.5'] },
];

export const tierRank: Record<Tier, number> = { free: 0, premium: 1, professional_legal: 2 };
export const tierAllows = (have: Tier, need: Tier) => tierRank[have] >= tierRank[need];

/** Map a Stripe price id back to a tier (used by the webhook). */
export function tierFromPriceId(priceId: string | undefined, env: Record<string, string | undefined> = process.env): Tier {
  if (!priceId) return 'free';
  for (const p of PLANS) if (p.priceEnv && env[p.priceEnv] === priceId) return p.tier;
  return 'free';
}

export const displayPrice = (p: Plan, env: Record<string, string | undefined> = process.env) =>
  p.tier === 'free' ? '0' : (p.displayPriceEnv ? env[p.displayPriceEnv] ?? null : null);

/** Split a gross amount into net+VAT. Spanish standard VAT rate 21% is a config input, not an assumption baked into law. */
export function splitVat(grossCents: number, ratePercent: number) {
  const net = Math.round(grossCents / (1 + ratePercent / 100));
  return { net, vat: grossCents - net };
}
