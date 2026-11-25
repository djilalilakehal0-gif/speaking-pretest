import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageTitle } from '@/components/PageTitle';
import { ActionButton } from '@/components/ActionButton';
import { currentUser, serverClient, supabaseConfigured } from '@/lib/supabase/server';
import { pageCtx, type P } from '@/lib/page';
import { PATHWAYS } from '@/lib/legal/pathways';
import { progressPercent } from '@/lib/case/progress';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const configured = supabaseConfigured();
  const user = configured ? await currentUser() : null;
  if (configured && !user) redirect(`/${locale}/login`);

  let kase: { id: string; reference: string; status: string } | null = null;
  let pct = 0; let docCount = 0;
  let notifs: { id: string; title: Record<string, string> }[] = [];
  let appts: { id: string; starts_at: string; status: string }[] = [];
  if (configured && user) {
    const sb = await serverClient();
    const { data: c } = await sb.from('immigration_cases').select('id, reference, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    kase = c;
    if (c) { const { data: tasks } = await sb.from('case_tasks').select('status, weight').eq('case_id', c.id); pct = progressPercent(tasks ?? []); }
    docCount = (await sb.from('documents').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)).count ?? 0;
    notifs = (await sb.from('notifications').select('id, title').eq('user_id', user.id).is('read_at', null).order('created_at', { ascending: false }).limit(5)).data ?? [];
    appts = (await sb.from('appointments').select('id, starts_at, status').eq('client_id', user.id).gte('starts_at', new Date().toISOString()).order('starts_at').limit(5)).data ?? [];
  }
  const fmt = (d: string) => new Date(d).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <>
      <PageTitle title={`${t('dash.welcome')}${user?.email ? `, ${user.email}` : ''}`} sub={t('dash.status')} />
      <div className="wrap section">
        {!configured && <p className="banner">{t('common.demo')}</p>}
        <div className="grid g2">
          <section className="card">
            <h3>{t('dash.case')}</h3>
            {kase ? (<>
              <p className="meta"><span>{t('case.reference')}: <strong dir="ltr">{kase.reference}</strong></span><span>{t(`case.status.${kase.status}`)}</span></p>
              <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
              <p className="meta">{t('case.progress')}: {pct}%</p>
              <Link className="btn btn-gold" href={`/${locale}/case`}>{t('nav.case')}</Link>
            </>) : (<><p className="pending">{t('dash.noCase')}</p>{configured ? <ActionButton url="/api/cases" body={{}} label={t('dash.createCase')} /> : <Link className="btn btn-gold" href={`/${locale}/onboarding`}>{t('dash.createCase')}</Link>}</>)}
          </section>
          <section className="card"><h3>{t('dash.docs')}</h3><p className="price">{docCount}</p><Link className="btn btn-ghost" style={{ color: 'var(--text)' }} href={`/${locale}/documents`}>{t('nav.documents')}</Link></section>
          <section className="card"><h3>{t('dash.appointments')}</h3>{appts.length === 0 ? <p className="pending">{t('dash.noAppointments')}</p> : <ul className="clean">{appts.map((a) => <li key={a.id}>{fmt(a.starts_at)} — {a.status}</li>)}</ul>}<Link href={`/${locale}/lawyers`}>{t('dash.lawyer')} →</Link></section>
          <section className="card"><h3>{t('msg.title')}</h3><Link className="btn btn-ghost" style={{ color: 'var(--text)' }} href={`/${locale}/messages`}>{t('msg.title')}</Link></section>
          <section className="card"><h3>{t('dash.notifications')}</h3>{notifs.length === 0 ? <p className="pending">{t('dash.noNotifications')}</p> : <ul className="clean">{notifs.map((n) => <li key={n.id}>{n.title[locale] ?? n.title.es}</li>)}</ul>}</section>
        </div>
        <h2 style={{ marginTop: 40 }}>{t('dash.pathways')}</h2>
        <div className="grid g3">{PATHWAYS.filter((p) => p.group === 'A' && p.slug !== 'extraordinary-regularisation').map((p) => (
          <Link key={p.slug} className="card" href={`/${locale}/law/${p.slug}`}><h3>{p.title[locale]}</h3><p className="meta" style={{ margin: 0 }}>{p.legalReference}</p></Link>))}</div>
        <div className="actions"><Link className="btn btn-gold" href={`/${locale}/eligibility`}>{t('shortcut.eligibility')}</Link><Link className="btn btn-ghost" style={{ color: 'var(--text)' }} href={`/${locale}/assistant`}>{t('dash.assistant')}</Link></div>
      </div>
    </>
  );
}
