import Link from 'next/link';
import { PageTitle } from '@/components/PageTitle';
import { pageCtx, type P } from '@/lib/page';
import { RESOURCES } from '@/lib/legal/sources';

export default async function Guides({ params }: P) {
  const { locale, t } = await pageCtx(params);
  return (
    <>
      <PageTitle title={t('guide.title')} sub={t('guide.timing')} />
      <div className="wrap section" style={{ maxWidth: 860 }}>
        <ol className="steps">
          {Array.from({ length: 14 }, (_, n) => n + 1).map((n) => (
            <li key={n}><div><h3>{t(`guide.s${n}.t`)}</h3><p style={{ margin: 0 }}>{t(`guide.s${n}.b`)}</p>
              {n === 7 || n === 8 || n === 9 ? <p className="meta" style={{ marginBottom: 0 }}>{t('guide.officialLinks')}: <a href={RESOURCES.find((r) => r.key === 'portal')!.url} target="_blank" rel="noopener noreferrer">Portal de Inmigración</a></p> : null}
              {n === 10 || n === 3 ? <p className="meta" style={{ marginBottom: 0 }}><Link href={`/${locale}/documents`}>{t('nav.documents')} →</Link></p> : null}
            </div></li>))}
        </ol>
      </div>
    </>
  );
}
