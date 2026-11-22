import { PageTitle } from '@/components/PageTitle';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('privacy.title')} /><div className="wrap section prose" style={{ maxWidth: 820 }}><p className="banner">{t('privacy.body')}</p></div></>); }
