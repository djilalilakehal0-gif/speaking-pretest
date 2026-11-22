import Link from 'next/link';
import { PageTitle } from '@/components/PageTitle';
import { loadPathways } from '@/lib/legal/repository';
import { pageCtx, type P } from '@/lib/page';

export const dynamic = 'force-dynamic';
const GROUPS = { A: 'legal.groupA', B: 'legal.groupB', C: 'legal.groupC', D: 'legal.groupD', E: 'legal.groupE' } as const;

export default async function Law({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const { pathways, origin } = await loadPathways();
  return (
    <>
      <PageTitle title={t('nav.law')} sub={t('home.trust.body')} />
      <div className="wrap section">
        {origin === 'seed' && <p className="banner">{t('legal.draftBanner')}</p>}
        <div className="banner info"><strong>{t('legal.extraordinaryTitle')}.</strong> {t('legal.extraordinaryBody')}</div>
        {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => {
          const items = pathways.filter((p) => p.group === g && p.slug !== 'extraordinary-regularisation');
          return items.length > 0 && (
            <section key={g} style={{ marginBlock: 32 }}>
              <h2>{t(GROUPS[g])}</h2>
              <div className="grid g2">
                {items.map((p) => (
                  <Link key={p.slug} className="card" href={`/${locale}/law/${p.slug}`}>
                    <span className={`badge ${p.status}`}>{t(`status.${p.status}`)}</span>
                    <h3 style={{ marginTop: 10 }}>{p.title[locale]}</h3>
                    <p className="meta" style={{ margin: 0 }}>{p.spanishTerm !== p.title[locale] && <span>{p.spanishTerm}</span>}<span>{p.legalReference}</span></p>
                    <p style={{ marginTop: 10 }}>{p.summary[locale]}</p>
                    <p className="meta" style={{ marginBottom: 0 }}>{t('common.lastVerified')}: {p.lastVerifiedOn ?? t('common.notVerified')}</p>
                  </Link>))}
              </div>
            </section>);
        })}
      </div>
    </>
  );
}
