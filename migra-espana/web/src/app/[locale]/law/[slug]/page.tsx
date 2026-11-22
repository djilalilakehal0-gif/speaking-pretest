import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageTitle } from '@/components/PageTitle';
import { loadPathways, sourcesFor } from '@/lib/legal/repository';
import type { SectionKey } from '@/lib/legal/types';
import { pageCtx } from '@/lib/page';

export const dynamic = 'force-dynamic';
const ORDER: [SectionKey, string][] = [
  ['definition', 'legal.definition'], ['who', 'legal.who'], ['conditions', 'legal.conditions'], ['residence', 'legal.residence'], ['documents', 'legal.documents'],
  ['employment', 'legal.employment'], ['family', 'legal.family'], ['criminal', 'legal.criminal'], ['procedure', 'legal.procedure'], ['forms', 'legal.forms'],
  ['fees', 'legal.fees'], ['where', 'legal.where'], ['stages', 'legal.stages'], ['outcomes', 'legal.outcomes'], ['renewal', 'legal.renewal'], ['refusal', 'legal.refusal'], ['remedies', 'legal.remedies'],
];

export default async function Pathway({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, t } = await pageCtx(params);
  const { slug } = await params;
  const { pathways, origin } = await loadPathways();
  const p = pathways.find((x) => x.slug === slug);
  if (!p) notFound();
  const sources = sourcesFor(p.sourceIds);
  return (
    <>
      <PageTitle title={p.title[locale]} sub={p.summary[locale]} />
      <div className="wrap section prose" style={{ maxWidth: 860 }}>
        <div className="meta">
          <span className={`badge ${p.status}`}>{t(`status.${p.status}`)}</span>
          <span>{t('legal.spanishTerm')}: <strong>{p.spanishTerm}</strong></span>
          <span>{t('common.legalRef')}: {p.legalReference}</span>
          {p.effectiveOn && <span>{t('common.effective')}: {p.effectiveOn}</span>}
          <span>{t('common.lastVerified')}: {p.lastVerifiedOn ?? t('common.notVerified')}</span>
        </div>
        {(origin === 'seed' || !p.lastVerifiedOn) && <p className="banner">{t('legal.draftBanner')}</p>}
        {locale !== 'es' && !p.translationsReviewed && <p className="banner info">{t('legal.translationBanner')}</p>}

        {ORDER.map(([key, label]) => {
          const verified = p.verifiedSections.includes(key);
          const items = p.sections[key];
          if (key === 'fees') return (<section key={key}><h3>{t(label)}</h3><p className="pending">{t('legal.feesNote')}</p></section>);
          if (key === 'remedies') return (<section key={key}><h3>{t(label)}</h3><p>{t('legal.remediesGeneric')}</p></section>);
          return (
            <section key={key}>
              <h3>{t(label)}</h3>
              {verified && items?.length ? <ul className="clean">{items.map((it, n) => <li key={n}>{it[locale]}{locale !== 'es' && <details><summary className="pending">ES</summary><span lang="es" dir="ltr">{it.es}</span></details>}</li>)}</ul>
                : <p className="pending">{t('legal.pendingSection')}</p>}
            </section>);
        })}

        <h3>{t('legal.references')}</h3>
        <ul className="clean">{sources.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> — {s.issuer}{s.reference ? `, ${s.reference}` : ''}{s.lastVerifiedOn ? ` (${t('common.lastVerified')}: ${s.lastVerifiedOn})` : ''}</li>)}</ul>
        <div className="actions"><Link className="btn btn-gold" href={`/${locale}/eligibility`}>{t('hero.cta1')}</Link><Link className="btn btn-ghost" href={`/${locale}/guides`} style={{ color: 'var(--text)' }}>{t('nav.guides')}</Link></div>
      </div>
    </>
  );
}
