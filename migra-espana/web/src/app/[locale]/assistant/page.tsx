import { PageTitle } from '@/components/PageTitle';
import { Assistant } from '@/components/Assistant';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('ai.title')} sub={t('ai.intro')} /><div className="wrap section" style={{ maxWidth: 820 }}><Assistant /></div></>); }
