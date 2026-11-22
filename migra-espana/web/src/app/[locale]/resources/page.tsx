import { PageTitle } from '@/components/PageTitle';
import { RESOURCES } from '@/lib/legal/sources';
import { pageCtx, type P } from '@/lib/page';

export default async function Resources({ params }: P) {
  const { t } = await pageCtx(params);
  return (
    <>
      <PageTitle title={t('res.title')} sub={t('res.intro')} />
      <div className="wrap section"><div className="grid g2">
        {RESOURCES.map((r) => (<a key={r.key} className="card" href={r.url} target="_blank" rel="noopener noreferrer"><h3>{r.name}</h3><p className="meta" style={{ margin: 0 }}>{new URL(r.url).host}</p></a>))}
      </div></div>
    </>
  );
}
