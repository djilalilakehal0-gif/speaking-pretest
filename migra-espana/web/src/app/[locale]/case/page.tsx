import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageTitle } from '@/components/PageTitle';
import { CaseTimeline } from '@/components/CaseTimeline';
import { currentUser, serverClient, supabaseConfigured } from '@/lib/supabase/server';
import { pageCtx, type P } from '@/lib/page';
import { progressPercent, type CaseStatus } from '@/lib/case/progress';

export const dynamic = 'force-dynamic';

export default async function CasePage({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const configured = supabaseConfigured();
  const user = configured ? await currentUser() : null;
  if (configured && !user) redirect(`/${locale}/login`);

  let status: CaseStatus = 'new_case'; let reference = '—'; let deadline: string | null = null;
  let tasks: { id: string; title: string; status: string; weight: number; due_on: string | null }[] = [];
  let hasCase = !configured;
  if (configured && user) {
    const sb = await serverClient();
    const { data: c } = await sb.from('immigration_cases').select('id, reference, status, next_deadline').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (c) { hasCase = true; status = c.status as CaseStatus; reference = c.reference; deadline = c.next_deadline; tasks = (await sb.from('case_tasks').select('id, title, status, weight, due_on').eq('case_id', c.id).order('created_at')).data ?? []; }
  }
  const pct = progressPercent(tasks.map((x) => ({ status: x.status as never, weight: x.weight })));
  return (
    <>
      <PageTitle title={t('case.title')} sub={t('case.manualNote')} />
      <div className="wrap section">
        {!configured && <p className="banner">{t('common.demo')}</p>}
        {!hasCase ? <div className="card"><p>{t('dash.noCase')}</p><Link className="btn btn-gold" href={`/${locale}/dashboard`}>{t('dash.createCase')}</Link></div> : (
          <div className="grid g2" style={{ alignItems: 'start' }}>
            <section className="card"><h3>{t('case.timeline')}</h3><p className="meta"><span>{t('case.reference')}: <strong dir="ltr">{reference}</strong></span>{deadline && <span>{t('case.deadline')}: {deadline}</span>}</p><CaseTimeline status={status} t={t} /></section>
            <section className="card"><h3>{t('case.progress')}: {pct}%</h3><div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
              <h3 style={{ marginTop: 22 }}>{t('case.tasks')}</h3>
              {tasks.length === 0 ? <p className="pending">—</p> : <ul className="clean">{tasks.map((x) => <li key={x.id}>{x.status === 'done' ? '✓ ' : '○ '}{x.title}{x.due_on ? ` (${x.due_on})` : ''}</li>)}</ul>}
              <p className="meta"><a href="https://extranjeros.inclusion.gob.es" target="_blank" rel="noopener noreferrer">{t('guide.officialLinks')} →</a></p>
            </section>
          </div>)}
      </div>
    </>
  );
}
