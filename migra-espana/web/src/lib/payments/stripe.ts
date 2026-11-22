import Stripe from 'stripe';

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured');
  return new Stripe(key);
}
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;
