import { redirect } from 'next/navigation';
import { PageTitle } from '@/components/PageTitle';
import { ContactEditor } from '@/components/ContactEditor';
import { ActionButton } from '@/components/ActionButton';
import { currentUser, serverClient, supabaseConfigured } from '@/lib/supabase/server';
import { pageCtx, type P } from '@/lib/page';

export const dynamic = 'force-dynamic';

export default async function LawyerDash({ params }: P) {
  const { locale, t } = await pageCtx(params);
  if (!supabaseConfigured()) return (<><PageTitle title={t('lawyerdash.title')} /><div className="wrap section"><p className="banner">{t('common.notConfigured')}</p></div></>);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login`);
  const sb = await serverClient();
  const { data: me } = await sb.from('lawyers').select('id, verification, contact_phone, contact_whatsapp').eq('id', user.id).maybeSingle();
  if (!me) redirect(`/${locale}/lawyer/register`);
  if (me.verification !== 'verified') return (<><PageTitle title={t('lawyerdash.title')} /><div className="wrap section"><p className="banner">{t('lawyerdash.notVerified')}</p></div></>);

  const requests = (await sb.from('appointments').select('id, starts_at, status').eq('lawyer_id', user.id).eq('status', 'requested').order('starts_at')).data ?? [];
  const cases = (await sb.from('immigration_cases').select('id, reference, status').eq('lawyer_id', user.id).order('updated_at', { ascending: false })).data ?? [];
  const fmt = (d: string) => new Date(d).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <>
      <PageTitle title={t('lawyerdash.title')} />
      <div className="wrap section grid g2" style={{ alignItems: 'start' }}>
        <ContactEditor phone={me.contact_phone} whatsapp={me.contact_whatsapp} />
        <section className="card"><h3>{t('msg.title')}</h3><a className="btn btn-gold" href={`/${locale}/messages`}>{t('msg.title')}</a></section>
        <section className="card"><h3>{t('lawyerdash.requests')}</h3>
          {requests.length === 0 ? <p className="pending">—</p> : <table><tbody>{requests.map((r: { id: string; starts_at: string }) => (
            <tr key={r.id}><td>{fmt(r.starts_at)}</td><td>
              <ActionButton url="/api/appointments" method="PATCH" body={{ id: r.id, status: 'confirmed' }} label={t('lawyerdash.accept')} />{' '}
              <ActionButton url="/api/appointments" method="PATCH" body={{ id: r.id, status: 'cancelled' }} label={t('lawyerdash.decline')} variant="ghost" /></td></tr>))}</tbody></table>}</section>
        <section className="card"><h3>{t('lawyerdash.cases')}</h3>
          {cases.length === 0 ? <p className="pending">—</p> : <table><tbody>{cases.map((c: { id: string; reference: string; status: string }) => <tr key={c.id}><td dir="ltr">{c.reference}</td><td>{t(`case.status.${c.status}`)}</td></tr>)}</tbody></table>}</section>
      </div>
    </>
  );
}
