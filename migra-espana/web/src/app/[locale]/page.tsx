import Link from 'next/link';
import { pageCtx, type P } from '@/lib/page';

const SHORTCUTS = [['eligibility', '✓', 'shortcut.eligibility'], ['law', '⚖', 'shortcut.pathway'], ['documents', '▤', 'shortcut.documents'], ['lawyers', '✦', 'shortcut.lawyer'], ['case', '◔', 'shortcut.track'], ['guides', '❖', 'shortcut.law']] as const;

export default async function Home({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">{t('hero.eyebrow')}</div>
          <h1>{t('hero.title')}</h1>
          <p className="lead">{t('hero.sub')}</p>
          <div className="actions">
            <Link className="btn btn-gold" href={`/${locale}/eligibility`}>{t('hero.cta1')}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/law`}>{t('hero.cta2')}</Link>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <h2>{t('home.shortcuts')}</h2>
        <div className="grid g3">
          {SHORTCUTS.map(([href, ico, key]) => (
            <Link key={key} className="card" href={`/${locale}/${href}`}><div className="tile-ico" aria-hidden>{ico}</div><h3>{t(key)}</h3></Link>
          ))}
        </div>
      </section>
      <section className="section wrap" style={{ paddingTop: 0 }}>
        <div className="card">
          <h2>{t('home.trust.title')}</h2>
          <p>{t('home.trust.body')}</p>
          <p className="banner info">{t('home.notLawyer')}</p>
        </div>
      </section>
      <section className="section wrap" style={{ paddingTop: 0 }}>
        <h2>{t('dash.faq')}</h2>
        <div className="grid g2">
          {[1, 2, 3, 4].map((i) => (<details key={i} className="card"><summary><strong>{t(`faq.q${i}`)}</strong></summary><p style={{ marginTop: 12 }}>{t(`faq.a${i}`)}</p></details>))}
        </div>
      </section>
    </>
  );
}
