import { PageTitle } from '@/components/PageTitle';
import { DocumentVault } from '@/components/DocumentVault';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('docs.title')} sub={t('docs.formats')} /><div className="wrap section"><DocumentVault /></div></>); }
