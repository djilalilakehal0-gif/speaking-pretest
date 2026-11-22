import { PageTitle } from '@/components/PageTitle';
import { BookingForm } from '@/components/BookingForm';
import { pageCtx } from '@/lib/page';

export default async function Book({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { t } = await pageCtx(params);
  const { id } = await params;
  return (<><PageTitle title={t('lawyers.book')} sub={t('lawyers.disclaimer')} /><div className="wrap section"><BookingForm lawyerId={id} /></div></>);
}
