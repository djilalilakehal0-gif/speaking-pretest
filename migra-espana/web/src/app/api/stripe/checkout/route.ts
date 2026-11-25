import { z } from 'zod';
import { fail, json, parse, requireUser } from '@/lib/api';
import { stripeClient, stripeConfigured } from '@/lib/payments/stripe';
import { PLANS } from '@/lib/payments/plans';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';
import { DISCLOSURE_VERSION } from '@/lib/payments/disclosure';

const Body = z.object({ tier: z.enum(['premium', 'professional_legal']), locale: z.enum(['ar', 'es', 'fr', 'en']).default('es') });

export async function POST(req: Request) {
  const a = await requireUser(); if ('res' in a) return a.res;
  if (!stripeConfigured()) return fail(503, 'payments_not_configured');
  const p = await parse(req, Body); if (!p.ok) return p.res;

  // Server-side gate: no checkout unless THIS user accepted THIS disclosure version for THIS tier (not just a client-side tick).
  const sbAccept = await serverClient();
  const { data: acc } = await sbAccept.from('payment_disclosure_acceptances').select('id').eq('user_id', a.user.id).eq('tier', p.data.tier).eq('disclosure_version', DISCLOSURE_VERSION).gte('accepted_at', new Date(Date.now() - 30 * 60_000).toISOString()).limit(1).maybeSingle();
  if (!acc) return fail(412, 'disclosure_not_accepted');

  const plan = PLANS.find((x) => x.tier === p.data.tier)!;
  const price = process.env[plan.priceEnv];
  if (!price) return fail(503, 'price_not_configured');

  const stripe = stripeClient();
  const db = adminClient();
  const { data: sub } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', a.user.id).maybeSingle();
  let customer = sub?.stripe_customer_id as string | undefined;
  if (!customer) {
    customer = (await stripe.customers.create({ email: a.user.email ?? undefined, metadata: { user_id: a.user.id } })).id;
    await db.from('subscriptions').update({ stripe_customer_id: customer }).eq('user_id', a.user.id);
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', customer, line_items: [{ price, quantity: 1 }],
    automatic_tax: { enabled: true }, tax_id_collection: { enabled: true }, customer_update: { address: 'auto', name: 'auto' },
    allow_promotion_codes: false, client_reference_id: a.user.id, metadata: { user_id: a.user.id, tier: p.data.tier },
    subscription_data: { metadata: { user_id: a.user.id, tier: p.data.tier } },
    success_url: `${site}/${p.data.locale}/dashboard?checkout=success`, cancel_url: `${site}/${p.data.locale}/pricing?checkout=cancelled`,
    locale: p.data.locale === 'ar' ? 'auto' : p.data.locale,
  });
  return json({ url: session.url });
}
