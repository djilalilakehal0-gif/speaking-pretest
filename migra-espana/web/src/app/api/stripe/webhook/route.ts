import type Stripe from 'stripe';
import { fail, json } from '@/lib/api';
import { stripeClient } from '@/lib/payments/stripe';
import { tierFromPriceId } from '@/lib/payments/plans';
import { adminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return fail(503, 'payments_not_configured');
  const sig = req.headers.get('stripe-signature');
  if (!sig) return fail(400, 'missing_signature');

  const raw = await req.text();                       // raw body is required for signature verification
  let event: Stripe.Event;
  try { event = stripeClient().webhooks.constructEvent(raw, sig, secret); } catch { return fail(400, 'bad_signature'); }

  const db = adminClient();
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const s = event.data.object as Stripe.Subscription;
      const userId = s.metadata?.user_id;
      if (!userId) break;
      const active = ['active', 'trialing'].includes(s.status);
      await db.from('subscriptions').update({
        tier: active ? tierFromPriceId(s.items.data[0]?.price.id) : 'free',
        status: s.status === 'canceled' ? 'cancelled' : s.status === 'unpaid' || s.status === 'past_due' ? 'past_due' : (s.status as never),
        stripe_subscription_id: s.id, cancel_at_period_end: s.cancel_at_period_end,
        current_period_end: new Date(s.current_period_end * 1000).toISOString(),
      }).eq('user_id', userId);
      break;
    }
    case 'customer.subscription.deleted': {
      const s = event.data.object as Stripe.Subscription;
      if (s.metadata?.user_id) await db.from('subscriptions').update({ tier: 'free', status: 'cancelled', cancel_at_period_end: false }).eq('user_id', s.metadata.user_id);
      break;
    }
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      const userId = (inv.subscription_details?.metadata as Record<string, string> | null)?.user_id;
      if (userId && inv.payment_intent) {
        // upsert keyed on payment intent ⇒ idempotent under Stripe retries
        await db.from('payments').upsert({
          user_id: userId, kind: 'subscription', status: 'succeeded', amount_cents: inv.amount_paid - (inv.tax ?? 0), vat_cents: inv.tax ?? 0,
          currency: inv.currency.toUpperCase(), stripe_payment_intent: String(inv.payment_intent),
        }, { onConflict: 'stripe_payment_intent' });
      }
      break;
    }
    case 'charge.refunded': {
      const c = event.data.object as Stripe.Charge;
      if (c.payment_intent) await db.from('payments').update({ status: c.refunded ? 'refunded' : 'partially_refunded', refunded_cents: c.amount_refunded }).eq('stripe_payment_intent', String(c.payment_intent));
      break;
    }
    default: break;
  }
  return json({ received: true });
}
