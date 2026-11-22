import { PageTitle } from '@/components/PageTitle';
import { Onboarding } from '@/components/Onboarding';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('onb.welcome')} /><div className="wrap section"><Onboarding /></div></>); }
