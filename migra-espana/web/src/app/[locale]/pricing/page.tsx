import Link from 'next/link';
import { PageTitle } from '@/components/PageTitle';
import { CheckoutButton } from '@/components/CheckoutButton';
import { PLANS, displayPrice } from '@/lib/payments/plans';
import { pageCtx, type P } from '@/lib/page';

export default async function Pricing({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const name = { free: 'pricing.free', premium: 'pricing.premium', professional_legal: 'pricing.professional' } as const;
  return (
    <>
      <PageTitle title={t('pricing.title')} sub={t('pricing.separate')} />
      <div className="wrap section">
        <div className="grid g3">
          {PLANS.map((p) => {
            const price = displayPrice(p);
            return (
              <article key={p.tier} className={`card plan ${p.tier === 'premium' ? 'featured' : ''}`}>
                <h3>{t(name[p.tier])}</h3>
                <p className="price">{price === null ? '—' : `€${price}`}{price !== null && p.tier !== 'free' && <small style={{ fontSize: '.9rem', fontFamily: 'var(--sans)' }}> {t('pricing.perMonth')}</small>}</p>
                <ul className="clean">{p.features.map((f) => <li key={f}>{t(f)}</li>)}</ul>
                {p.tier === 'free' ? <Link className="btn btn-ghost" style={{ color: 'var(--text)' }} href={`/${locale}/register`}>{t('auth.register')}</Link>
                  : <CheckoutButton tier={p.tier} planName={t(name[p.tier])} price={price === null ? null : `€${price}`} />}
              </article>);
          })}
        </div>
        <p className="banner info" style={{ marginTop: 28 }}>{t('pricing.vat')} {t('pricing.cancel')}</p>
        <p className="banner">{t('pricing.noGuarantee')}</p>
      </div>
    </>
  );
}
