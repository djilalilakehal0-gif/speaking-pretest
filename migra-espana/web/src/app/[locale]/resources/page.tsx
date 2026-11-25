import { PageTitle } from '@/components/PageTitle';
import { RESOURCES } from '@/lib/legal/sources';
import { HELP_ORGS, HELP_SOURCE } from '@/lib/legal/help';
import { pageCtx, type P } from '@/lib/page';

export default async function Resources({ params }: P) {
  const { t } = await pageCtx(params);
  return (
    <>
      <PageTitle title={t('res.title')} sub={t('res.intro')} />
      <div className="wrap section"><div className="grid g2">
        {RESOURCES.map((r) => (<a key={r.key} className="card" href={r.url} target="_blank" rel="noopener noreferrer"><h3>{r.name}</h3><p className="meta" style={{ margin: 0 }}>{new URL(r.url).host}</p></a>))}
      </div>
        <section style={{ marginTop: 40 }}>
          <h2>{t('help.title')}</h2><p>{t('help.intro')}</p>
          <div className="grid g2">{HELP_ORGS.map((o) => (
            <article key={o.id} className="card"><h3>{o.url ? <a href={o.url} target="_blank" rel="noopener noreferrer">{o.name}</a> : o.name}</h3>
              <p className="meta" style={{ margin: 0 }}>{t(`help.scope.${o.scope}`)}</p>
              <p style={{ marginTop: 10 }}><strong dir="ltr">{o.phone}</strong>{o.hours ? <span className="meta"> · {o.hours}</span> : null}</p>
              <a className="btn btn-ghost" style={{ color: 'var(--text)' }} href={`tel:${o.phone.replace(/\s/g, '')}`}>{t('help.call')}</a></article>))}</div>
          <p className="banner info">{t('help.note')} {t('help.source')}: <a href={HELP_SOURCE.url} target="_blank" rel="noopener noreferrer">{HELP_SOURCE.title}</a> ({t('help.checked')} {HELP_SOURCE.checkedOn}).</p>
          <p className="banner">{t('help.verify')}</p>
        </section>
      </div>
    </>
  );
}
