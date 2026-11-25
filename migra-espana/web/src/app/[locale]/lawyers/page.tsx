import Link from 'next/link';
import { PageTitle } from '@/components/PageTitle';
import { MessageButton } from '@/components/MessageButton';
import { telLink, waLink } from '@/lib/messaging/contact';
import { pageCtx, type P } from '@/lib/page';
import { LOCALE_NAMES, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';
interface Lawyer { id: string; display_name: string; bar_association: string; languages: Locale[]; years_experience: number | null; consultation_price_cents: number | null; currency: string; bio: Partial<Record<Locale, string>>; contact_phone: string | null; contact_whatsapp: string | null }

async function load(): Promise<Lawyer[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { adminClient } = await import('@/lib/supabase/admin');
  const { data } = await adminClient().from('lawyers').select('id, display_name, bar_association, languages, years_experience, consultation_price_cents, currency, bio, contact_phone, contact_whatsapp').eq('listed', true).eq('verification', 'verified');
  return (data ?? []) as Lawyer[];
}

export default async function Lawyers({ params }: P) {
  const { locale, t } = await pageCtx(params);
  const lawyers = await load();
  return (
    <>
      <PageTitle title={t('lawyers.title')} sub={t('lawyers.intro')} />
      <div className="wrap section">
        {lawyers.length === 0 ? <p className="card">{t('lawyers.empty')}</p> : (
          <div className="grid g2">{lawyers.map((l) => (
            <article key={l.id} className="card">
              <span className="badge active">✓ {t('lawyers.verified')}</span>
              <h3 style={{ marginTop: 10 }}>{l.display_name}</h3>
              <p className="meta"><span>{t('lawyers.bar')}: {l.bar_association}</span><span>{t('lawyers.languages')}: {l.languages.map((x) => LOCALE_NAMES[x]).join(', ')}</span></p>
              <p>{l.bio?.[locale] ?? l.bio?.es ?? ''}</p>
              {l.consultation_price_cents != null && <p><strong>{t('lawyers.price')}: {(l.consultation_price_cents / 100).toLocaleString(locale, { style: 'currency', currency: l.currency })}</strong></p>}
              <div className="actions" style={{ marginTop: 8 }}><a className="btn btn-gold" href={`/${locale}/lawyers/${l.id}/book`}>{t('lawyers.book')}</a><MessageButton lawyerId={l.id} />{l.contact_phone && <a className="btn btn-ghost" style={{ color: 'var(--text)' }} href={telLink(l.contact_phone)}>{t('lawyers.call')} <span dir="ltr">{l.contact_phone}</span></a>}{l.contact_whatsapp && <a className="btn btn-ghost" style={{ color: 'var(--text)' }} href={waLink(l.contact_whatsapp)} target="_blank" rel="noopener noreferrer">{t('lawyers.whatsapp')}</a>}</div>
            </article>))}</div>)}
        <p className="banner info" style={{ marginTop: 24 }}>{t('lawyers.disclaimer')}</p>
        <p><Link href={`/${locale}/lawyer/register`}>{t('reg.link')}</Link></p>
        <h2 style={{ marginTop: 32 }}>{t('nav.lawyers')}</h2>
        <ol className="clean" style={{ columns: '2 280px' }}>{Array.from({ length: 12 }, (_, i) => <li key={i}>{t(`svc.${i + 1}`)}</li>)}</ol>
      </div>
    </>
  );
}
