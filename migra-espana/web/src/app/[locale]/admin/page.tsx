import { redirect } from 'next/navigation';
import { PageTitle } from '@/components/PageTitle';
import { ActionButton } from '@/components/ActionButton';
import { currentUser, serverClient, supabaseConfigured } from '@/lib/supabase/server';
import { can, type Role } from '@/lib/rbac';
import { pageCtx, type P } from '@/lib/page';

export const dynamic = 'force-dynamic';

export default async function Admin({ params }: P) {
  const { locale, t } = await pageCtx(params);
  if (!supabaseConfigured()) return (<><PageTitle title={t('admin.title')} /><div className="wrap section"><p className="banner">{t('common.notConfigured')}</p></div></>);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login`);
  const sb = await serverClient();
  const [{ data: u }, { data: extra }] = await Promise.all([sb.from('users').select('role').eq('id', user.id).single(), sb.from('admin_roles').select('role').eq('user_id', user.id)]);
  const roles = [u?.role, ...(extra ?? []).map((r: { role: string }) => r.role)].filter(Boolean) as Role[];
  if (!roles.some((r) => !['user', 'lawyer'].includes(r))) return (<><PageTitle title={t('admin.title')} /><div className="wrap section"><p className="banner bad">{t('admin.forbidden')}</p></div></>);

  const pending = can(roles, 'lawyers.verify') ? (await sb.from('lawyers').select('id, display_name, bar_association, bar_number').eq('verification', 'pending')).data ?? [] : [];
  const drafts = can(roles, 'legal.read_drafts') ? (await sb.from('legal_rules').select('id, legal_reference, state, last_verified_on').neq('state', 'published').limit(50)).data ?? [] : [];
  const audit = can(roles, 'audit.read') ? (await sb.from('audit_logs').select('id, action, entity, created_at').order('created_at', { ascending: false }).limit(20)).data ?? [] : [];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageTitle title={t('admin.title')} sub={roles.join(', ')} />
      <div className="wrap section grid">
        {can(roles, 'lawyers.verify') && (<section className="card"><h3>{t('admin.lawyers')} — {t('admin.pending')}</h3>
          {pending.length === 0 ? <p className="pending">—</p> : (<table><tbody>{pending.map((l: { id: string; display_name: string; bar_association: string; bar_number: string }) => (
            <tr key={l.id}><td>{l.display_name}<br /><small>{l.bar_association} · {l.bar_number}</small></td>
              <td><ActionButton url="/api/admin/lawyers" body={{ lawyerId: l.id, decision: 'verified', checkedAgainst: `${l.bar_association} census (${today})` }} label="✓" />{' '}
                  <ActionButton url="/api/admin/lawyers" body={{ lawyerId: l.id, decision: 'rejected', checkedAgainst: `${l.bar_association} census (${today})` }} label="✕" variant="ghost" /></td></tr>))}</tbody></table>)}
          <p className="pending">Verify only after checking the lawyer's registration in the official Colegio de Abogados census.</p></section>)}
        {can(roles, 'legal.read_drafts') && (<section className="card"><h3>{t('admin.legal')}</h3><p className="pending">{t('admin.publishRule')}</p>
          {drafts.length === 0 ? <p className="pending">—</p> : (<table><tbody>{drafts.map((d: { id: string; legal_reference: string; state: string }) => (
            <tr key={d.id}><td>{d.legal_reference}<br /><small>{d.state}</small></td>
              <td>{can(roles, 'legal.publish') ? <ActionButton url="/api/admin/legal-publish" body={{ ruleId: d.id, lastVerifiedOn: today, translationsReviewed: false }} label={t('admin.publish')} /> : '—'}</td></tr>))}</tbody></table>)}</section>)}
        {can(roles, 'audit.read') && (<section className="card"><h3>{t('admin.audit')}</h3><table><tbody>{audit.map((a: { id: number; action: string; entity: string; created_at: string }) => <tr key={a.id}><td>{new Date(a.created_at).toLocaleString(locale)}</td><td>{a.action}</td><td>{a.entity}</td></tr>)}</tbody></table></section>)}
      </div>
    </>
  );
}
