import { PageTitle } from '@/components/PageTitle';
import { AuthForm } from '@/components/AuthForm';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('auth.register')} /><div className="wrap section"><AuthForm mode="register" /></div></>); }
