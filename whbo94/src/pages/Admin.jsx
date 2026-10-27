import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApp, useTitle } from '../lib/state.jsx';
import { CATEGORIES, TITLE_SUGGESTIONS, categoryName, formatDuration, parseDuration } from '../lib/video.js';
import { Edit, Trash, Up, Down, Pin } from '../components/Icons.jsx';

export default function Admin() {
  useTitle('لوحة الإدارة');
  const [user, setUser] = useState(undefined);
  useEffect(() => { api.admin.me().then((u) => setUser(u.username)).catch(() => setUser(null)); }, []);
  if (user === undefined) return <p className="py-32 text-center text-ivory/70" role="status">جارٍ التحقق…</p>;
  if (!user) return <Login onDone={setUser} />;
  return <Dashboard user={user} onLogout={async () => { await api.admin.logout(); setUser(null); }} />;
}

function Login({ onDone }) {
  const [f, setF] = useState({ u: '', p: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { onDone((await api.admin.login(f.u, f.p)).username); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-7">
        <h1 className="gold-text text-2xl font-extrabold">دخول المسؤول</h1>
        <label className="block"><span className="mb-1 block text-sm">اسم المستخدم</span><input className="field" required autoComplete="username" value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-sm">كلمة المرور</span><input className="field" type="password" required autoComplete="current-password" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} /></label>
        {err && <p role="alert" className="text-rose-300">{err}</p>}
        <button className="btn-gold w-full">دخول</button>
      </form>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const { videos, reload, notify } = useApp();
  const [tab, setTab] = useState('videos');
  const [editing, setEditing] = useState(null); // null | 'new' | video
  const guard = async (fn, ok) => { try { await fn(); await reload(); if (ok) notify(ok); } catch (e) { notify(e.message); } };

  const move = (i, d) => {
    const ids = videos.map((v) => v.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    guard(() => api.admin.reorder(ids));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="gold-text text-3xl font-extrabold">لوحة الإدارة</h1>
        <div className="flex items-center gap-3 text-sm"><span className="text-ivory/70">{user}</span><Link to="/" className="btn-ghost !px-4 !py-1.5">الموقع</Link><button type="button" className="btn-ghost !px-4 !py-1.5" onClick={onLogout}>خروج</button></div>
      </div>
      <div className="mb-6 flex gap-2" role="tablist">
        {[['videos', 'المقاطع'], ['messages', 'الرسائل'], ['account', 'الحساب']].map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}
            className={`rounded-full border px-5 py-2 text-sm ${tab === id ? 'border-gold bg-gold font-bold text-ink' : 'border-gold/30'}`}>{l}</button>
        ))}
      </div>

      {tab === 'videos' && (editing
        ? <VideoForm video={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={async () => { setEditing(null); await reload(); notify('تم الحفظ'); }} />
        : (
          <>
            <button type="button" className="btn-gold mb-5" onClick={() => setEditing('new')}>+ إضافة مقطع</button>
            {videos.length === 0 && <p className="glass rounded-2xl p-8 text-center text-ivory/70">لا توجد مقاطع. أضف أول مقطع.</p>}
            <ul className="space-y-3">
              {videos.map((v, i) => (
                <li key={v.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
                  <div className="flex flex-col">
                    <button type="button" className="rounded p-1 hover:bg-white/10 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="تحريك للأعلى"><Up /></button>
                    <button type="button" className="rounded p-1 hover:bg-white/10 disabled:opacity-30" disabled={i === videos.length - 1} onClick={() => move(i, 1)} aria-label="تحريك للأسفل"><Down /></button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{v.featured && <span className="me-2 text-gold">★</span>}{v.title}</p>
                    <p className="text-xs text-ivory/60">{categoryName(v.category)} · {v.orientation === 'portrait' ? '9:16' : '16:9'} · {formatDuration(v.duration) || '—'} · {v.views} مشاهدة</p>
                  </div>
                  <button type="button" className={`btn-ghost !px-3 !py-1.5 text-sm ${v.featured ? '!bg-gold/20' : ''}`} onClick={() => guard(() => api.admin.feature(v.id, !v.featured), v.featured ? 'أُلغي التثبيت' : 'تم التثبيت في الواجهة')}><Pin width={16} height={16} />{v.featured ? 'مثبّت' : 'تثبيت'}</button>
                  <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={() => setEditing(v)} aria-label="تعديل"><Edit /></button>
                  <button type="button" className="rounded-full p-2 text-rose-300 hover:bg-white/10" aria-label="حذف"
                    onClick={() => confirm(`حذف «${v.title}» نهائياً؟`) && guard(() => api.admin.remove(v.id), 'تم الحذف')}><Trash /></button>
                </li>
              ))}
            </ul>
          </>
        ))}
      {tab === 'messages' && <Messages />}
      {tab === 'account' && <Account />}
    </div>
  );
}

function VideoForm({ video, onCancel, onSaved }) {
  const [f, setF] = useState({
    title: video?.title || '', description: video?.description || '', category: video?.category || CATEGORIES[0].id,
    orientation: video?.orientation || 'landscape', duration: formatDuration(video?.duration) || '',
    video_url: video && !video.videoUrl.startsWith('/uploads/') ? video.videoUrl : '',
    cover_url: video && !video.coverUrl.startsWith('/uploads/') ? video.coverUrl : '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const videoFile = useRef(null), coverFile = useRef(null);
  const on = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const detect = (file) => {
    if (!file) return;
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      setF((x) => ({ ...x, duration: formatDuration(Math.round(el.duration)), orientation: el.videoHeight > el.videoWidth ? 'portrait' : 'landscape' }));
      URL.revokeObjectURL(el.src);
    };
    el.src = URL.createObjectURL(file);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const fd = new FormData();
    ['title', 'description', 'category', 'orientation', 'video_url', 'cover_url'].forEach((k) => fd.append(k, f[k]));
    fd.append('duration', String(parseDuration(f.duration)));
    if (videoFile.current.files[0]) fd.append('video', videoFile.current.files[0]);
    if (coverFile.current.files[0]) fd.append('cover', coverFile.current.files[0]);
    try { await api.admin.save(video?.id, fd); await onSaved(); } catch (x) { setErr(x.message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="glass grid gap-4 rounded-3xl p-6 md:grid-cols-2">
      <h2 className="text-xl font-extrabold md:col-span-2">{video ? 'تعديل المقطع' : 'إضافة مقطع جديد'}</h2>
      <label className="md:col-span-2"><span className="mb-1 block text-sm">العنوان</span>
        <input required list="title-ideas" maxLength={200} className="field" value={f.title} onChange={on('title')} />
        <datalist id="title-ideas">{TITLE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}</datalist></label>
      <label className="md:col-span-2"><span className="mb-1 block text-sm">وصف قصير</span><textarea rows={3} maxLength={1000} className="field" value={f.description} onChange={on('description')} /></label>
      <label><span className="mb-1 block text-sm">التصنيف</span><select className="field" value={f.category} onChange={on('category')}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label><span className="mb-1 block text-sm">نسبة العرض</span><select className="field" value={f.orientation} onChange={on('orientation')}><option value="landscape">أفقي 16:9</option><option value="portrait">عمودي 9:16</option></select></label>
      <fieldset className="space-y-2 md:col-span-2"><legend className="mb-1 text-sm">الفيديو {video && '(اتركه فارغاً للإبقاء على الحالي)'}</legend>
        <input dir="ltr" type="url" placeholder="https://… رابط يوتيوب أو ملف MP4/WebM مباشر" className="field text-end" value={f.video_url} onChange={on('video_url')} />
        <input ref={videoFile} type="file" accept="video/mp4,video/webm" className="field" onChange={(e) => detect(e.target.files[0])} />
        <p className="text-xs text-ivory/55">يمكنك إدخال رابط أو رفع ملف (حتى 500MB). عند رفع ملف تُحسب المدة والاتجاه تلقائياً.</p></fieldset>
      <fieldset className="space-y-2"><legend className="mb-1 text-sm">صورة الغلاف</legend>
        <input ref={coverFile} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field" />
        <input dir="ltr" type="url" placeholder="أو رابط صورة https://…" className="field text-end" value={f.cover_url} onChange={on('cover_url')} />
        <p className="text-xs text-ivory/55">لروابط يوتيوب تُستخدم صورة المقطع تلقائياً إذا تُرك الغلاف فارغاً.</p></fieldset>
      <label><span className="mb-1 block text-sm">المدة (د:ث)</span><input dir="ltr" className="field text-end" placeholder="3:45" pattern="\d+(:\d{1,2}){0,2}" value={f.duration} onChange={on('duration')} /></label>
      {err && <p role="alert" className="text-rose-300 md:col-span-2">{err}</p>}
      <div className="flex gap-3 md:col-span-2"><button className="btn-gold" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button><button type="button" className="btn-ghost" onClick={onCancel}>إلغاء</button></div>
    </form>
  );
}

function Messages() {
  const [list, setList] = useState(null);
  const load = () => api.admin.messages().then(setList);
  useEffect(() => { load(); }, []);
  if (!list) return <p role="status">جارٍ التحميل…</p>;
  if (!list.length) return <p className="glass rounded-2xl p-8 text-center text-ivory/70">لا توجد رسائل.</p>;
  return (
    <ul className="space-y-3">
      {list.map((m) => (
        <li key={m.id} className="glass rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-bold">{m.name} <a dir="ltr" className="text-sm font-normal text-gold-soft" href={`mailto:${m.email}`}>{m.email}</a></p>
              <p className="text-xs text-ivory/50">{new Date(m.created_at).toLocaleString('ar')}</p></div>
            <button type="button" className="rounded-full p-2 text-rose-300 hover:bg-white/10" aria-label="حذف الرسالة" onClick={() => api.admin.removeMessage(m.id).then(load)}><Trash /></button>
          </div>
          <p className="mt-2 whitespace-pre-wrap leading-8">{m.body}</p>
        </li>
      ))}
    </ul>
  );
}

function Account() {
  const [f, setF] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState({ ok: false, text: '' });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.admin.password(f.current, f.next); setF({ current: '', next: '' }); setMsg({ ok: true, text: 'تم تغيير كلمة المرور.' }); }
    catch (x) { setMsg({ ok: false, text: x.message }); }
  };
  return (
    <form onSubmit={submit} className="glass max-w-md space-y-4 rounded-3xl p-6">
      <h2 className="text-xl font-extrabold">تغيير كلمة المرور</h2>
      <label className="block"><span className="mb-1 block text-sm">الحالية</span><input type="password" required autoComplete="current-password" className="field" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
      <label className="block"><span className="mb-1 block text-sm">الجديدة (10 أحرف فأكثر)</span><input type="password" required minLength={10} autoComplete="new-password" className="field" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
      {msg.text && <p role="status" className={msg.ok ? 'text-emerald' : 'text-rose-300'}>{msg.text}</p>}
      <button className="btn-gold">حفظ</button>
    </form>
  );
}
