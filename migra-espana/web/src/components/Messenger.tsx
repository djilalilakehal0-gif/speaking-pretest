'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from './I18nProvider';

interface Conv { id: string; withName: string | null; last: { body: string } | null; unread: boolean }
interface Msg { id: string; body: string; created_at: string; mine: boolean }

export function Messenger() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [active, setActive] = useState<string | null>(params.get('c'));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState(''); const [err, setErr] = useState(''); const [auth, setAuth] = useState(true);
  const end = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    const r = await fetch('/api/conversations').catch(() => null);
    if (!r || r.status === 503) { setConvs([]); return; }
    if (r.status === 401) { setAuth(false); setConvs([]); return; }
    setConvs(await r.json());
  }, []);
  const loadMsgs = useCallback(async (id: string) => {
    const r = await fetch(`/api/conversations/${id}/messages`).catch(() => null);
    if (r?.ok) setMsgs(await r.json());
  }, []);
  useEffect(() => { void loadConvs(); }, [loadConvs]);
  useEffect(() => {
    if (!active) return;
    void loadMsgs(active);
    const timer = setInterval(() => { if (!document.hidden) void loadMsgs(active); }, 8000);   // polling; swap for Supabase Realtime at scale
    return () => clearInterval(timer);
  }, [active, loadMsgs]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!active || !text.trim()) return; setErr('');
    const r = await fetch(`/api/conversations/${active}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) }).catch(() => null);
    if (r?.ok) { setText(''); await loadMsgs(active); void loadConvs(); return; }
    const j = await r?.json().catch(() => null);
    setErr(j?.error === 'identifier_in_message' ? t('msg.idBlocked') : j?.error === 'forbidden' ? t('msg.unavailable') : t('common.error'));
  }

  if (!auth) return <p className="banner">{t('msg.login')} <a href={`/${locale}/login`}>{t('nav.login')}</a></p>;
  return (
    <div className="grid g2" style={{ gridTemplateColumns: 'minmax(220px, 1fr) minmax(0, 2fr)', alignItems: 'start' }}>
      <div className="card">
        {convs === null ? <p>{t('common.loading')}</p> : convs.length === 0 ? <p className="pending">{t('msg.empty')}</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{convs.map((c) => (
            <li key={c.id}><button onClick={() => setActive(c.id)} aria-current={c.id === active} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', padding: '10px 6px', borderBottom: '1px solid var(--border)', fontWeight: c.unread ? 700 : 400 }}>
              {c.withName ?? t('msg.client')}{c.unread && ' ●'}<br /><small className="pending">{c.last?.body.slice(0, 50) ?? '—'}</small></button></li>))}</ul>)}
      </div>
      <div className="card">
        <p className="banner info" style={{ marginTop: 0 }}>{t('msg.note')}</p>
        {!active ? <p className="pending">{t('msg.pick')}</p> : (<>
          <div className="chat" style={{ maxHeight: 420, overflowY: 'auto' }} aria-live="polite">
            {msgs.map((m) => <div key={m.id} className={`msg ${m.mine ? 'me' : 'bot'}`}>{m.body}<div style={{ fontSize: '.7rem', opacity: .7 }}>{new Date(m.created_at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</div></div>)}
            <div ref={end} />
          </div>
          <form onSubmit={send}>
            <div className="field"><textarea rows={2} maxLength={4000} aria-label={t('msg.placeholder')} placeholder={t('msg.placeholder')} value={text} onChange={(e) => setText(e.target.value)} /></div>
            <button className="btn btn-gold" disabled={!text.trim()}>{t('common.send')}</button>
            {err && <p role="alert" className="banner bad">{err}</p>}
          </form></>)}
      </div>
    </div>
  );
}
