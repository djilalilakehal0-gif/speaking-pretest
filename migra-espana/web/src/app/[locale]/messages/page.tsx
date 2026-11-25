import { Suspense } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { Messenger } from '@/components/Messenger';
import { pageCtx, type P } from '@/lib/page';
export default async function Page({ params }: P) { const { t } = await pageCtx(params); return (<><PageTitle title={t('msg.title')} /><div className="wrap section"><Suspense><Messenger /></Suspense></div></>); }
