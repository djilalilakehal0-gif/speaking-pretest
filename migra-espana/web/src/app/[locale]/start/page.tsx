import Link from 'next/link';
import { pageCtx, type P } from '@/lib/page';

export default async function Start({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">{t('start.eyebrow')}</div>
          <h1 style={{ fontSize: 'clamp(1.9rem,4.5vw,3rem)' }}>{t('start.title')}</h1>
          <p className="lead">{t('start.sub')}</p>
          <div className="actions">
            <Link className="btn btn-gold" href={`/${locale}/eligibility`}>{t('start.cta')}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/lawyers`}>{t('start.lawyers')}</Link>
          </div>
        </div>
      </section>
      <div className="wrap section" style={{ maxWidth: 860 }}>
        <ol className="steps">{[1, 2, 3, 4].map((n) => (<li key={n}><div><h3>{t(`start.s${n}.t`)}</h3><p style={{ margin: 0 }}>{t(`start.s${n}.b`)}</p></div></li>))}</ol>
        <section className="card" style={{ marginTop: 28 }}>
          <h2>{t('start.proofTitle')}</h2><p>{t('start.proofBody')}</p>
          <ul className="clean">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`start.proof${n}`)}</li>)}</ul>
          <p className="banner info">{t('docs.noSelfData')}</p>
        </section>
        <section style={{ marginTop: 28 }}>
          <h2>{t('start.faqTitle')}</h2>
          {[1, 2].map((n) => (<details key={n} className="card" style={{ marginBottom: 12 }}><summary><strong>{t(`start.faq${n}q`)}</strong></summary><p className="banner" style={{ marginTop: 12 }}>{t('start.faqPending')}</p></details>))}
        </section>
        <p className="banner">{t('elig.disclaimer')}</p>
      </div>
    </>
  );
}
