/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { PosterHero } from '@/components/PosterHero';
import { pageCtx, type P } from '@/lib/page';

export default async function Home({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <section className="wrap">
        <div className="lux-hero">
          <PosterHero locale={locale} alt={`MIGRA ESPAÑA — ${t('brand.tagline')}`} />
          <div className="copy">
            <span className="eyebrow-line">{t('hero.eyebrow')}</span>
            <h1>{t('hero.title').split(/(?<=[.。])\s+/).map((x, i, a) => <span key={i} style={{ display: 'block' }}>{x}</span>)}</h1>
            <p className="lead" style={{ maxWidth: '58ch' }}>{t('hero.sub')}</p>
          </div>
        </div>
        <div className="ctas">
          <Link className="btn btn-gold" href={`/${locale}/eligibility`}><Icon name="rocket" />{t('hero.cta1')}</Link>
          <Link className="btn btn-ghost" href={`/${locale}/law`}><Icon name="scales" />{t('hero.cta2')}</Link>
          <Link className="btn btn-ghost" href={`/${locale}/start`}><Icon name="doc" />{t('start.homeLink')}</Link>
        </div>
      </section>
      <section className="wrap section">
        <h2 className="rule-title">{t('home.shortcuts')}</h2>
        <div className="tiles">
          <Link className="tile t-elig" href={`/${locale}/eligibility`}><h3><Icon name="chevron" />{t('shortcut.eligibility')}</h3><img src="/brand/clipboard.jpg" alt="" /></Link>
          <Link className="tile t-road" href={`/${locale}/start`}><h3><Icon name="chevron" />{t('shortcut.pathway')}</h3><img src="/brand/road.jpg" alt="" /></Link>
          <Link className="tile t-law" href={`/${locale}/law`}><h3><Icon name="chevron" />{t('shortcut.law')}</h3><img src="/brand/gavel.jpg" alt="" /></Link>
        </div>
        <div className="trust">
          <div className="ribbon" aria-hidden="true"><i /></div>
          <div><h3><Icon name="badge" />{t('home.trust.title')}</h3><p>{t('home.trust.body')}</p><p className="meta" style={{ margin: 0 }}>{t('home.notLawyer')}</p></div>
          <img src="/brand/folder.jpg" alt="" />
        </div>
      </section>
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <h2 className="rule-title">{t('dash.faq')}</h2>
        <div className="grid g2">
          {[1, 2, 3, 4].map((i) => (<details key={i} className="card"><summary><strong>{t(`faq.q${i}`)}</strong></summary><p style={{ marginTop: 12 }}>{t(`faq.a${i}`)}</p></details>))}
        </div>
      </section>
    </>
  );
}
