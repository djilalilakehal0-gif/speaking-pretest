import { PageTitle } from '@/components/PageTitle';
import { EligibilityTool } from '@/components/EligibilityTool';
import { pageCtx, type P } from '@/lib/page';

export default async function Page({ params }: P) {
  const { t } = await pageCtx(params);
  return (<><PageTitle title={t('elig.title')} sub={t('elig.intro')} /><div className="wrap section" style={{ maxWidth: 820 }}><EligibilityTool /></div></>);
}
