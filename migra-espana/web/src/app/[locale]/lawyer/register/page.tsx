import { PageTitle } from '@/components/PageTitle';
import { LawyerRegisterForm } from '@/components/LawyerRegisterForm';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('reg.title')} /><div className="wrap section"><LawyerRegisterForm /></div></>); }
