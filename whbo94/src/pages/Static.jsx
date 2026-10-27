import { useState } from 'react';
import { api } from '../lib/api.js';
import { useTitle } from '../lib/state.jsx';

const Page = ({ title, children }) => (
  <article className="mx-auto max-w-3xl px-4 py-14">
    <h1 className="gold-text mb-8 text-3xl font-extrabold">{title}</h1>
    <div className="glass space-y-5 rounded-3xl p-7 leading-9 text-ivory/85">{children}</div>
  </article>
);

export function Privacy() {
  useTitle('سياسة الخصوصية');
  return (
    <Page title="سياسة الخصوصية">
      <p>نحترم خصوصيتك. هذا الموقع لا يطلب منك إنشاء حساب ولا يجمع بياناتك الشخصية لأغراض إعلانية.</p>
      <h2 className="text-xl font-bold text-gold-soft">ما نخزّنه على جهازك</h2>
      <p>نحفظ في متصفحك (التخزين المحلي) قائمة المقاطع المفضلة والمقاطع التي أعجبتك وإعداد المؤثرات البصرية. تبقى هذه البيانات على جهازك ويمكنك حذفها بمسح بيانات الموقع.</p>
      <h2 className="text-xl font-bold text-gold-soft">ما نخزّنه على الخادم</h2>
      <p>نحتفظ بعدّادات مجمّعة مجهولة للمشاهدات والإعجابات، وبالرسائل التي ترسلها عبر نموذج «اتصل بنا» (الاسم والبريد والنص) للرد عليك فقط.</p>
      <h2 className="text-xl font-bold text-gold-soft">خدمات خارجية</h2>
      <p>عند تشغيل مقطع مستضاف على يوتيوب يُحمَّل مشغّل يوتيوب (بنطاق youtube-nocookie.com) بعد ضغطك على زر التشغيل فقط، وتخضع تلك الخدمة لسياسة خصوصية مزوّدها.</p>
      <h2 className="text-xl font-bold text-gold-soft">التواصل</h2>
      <p>لأي استفسار حول الخصوصية أو لطلب حذف رسالة أرسلتها، استخدم صفحة «اتصل بنا».</p>
    </Page>
  );
}

export function Terms() {
  useTitle('شروط الاستخدام');
  return (
    <Page title="شروط الاستخدام">
      <p>باستخدامك لهذا الموقع فإنك توافق على الشروط التالية:</p>
      <ul className="list-disc space-y-2 ps-6">
        <li>المحتوى مخصص للتذكير والطمأنينة، وهو ليس فتوى شرعية؛ لأحكام الدين راجع أهل العلم الموثوقين.</li>
        <li>حقوق المقاطع محفوظة لأصحابها، ولا يجوز إعادة نشرها لأغراض تجارية دون إذنهم.</li>
        <li>يمكنك مشاركة روابط المقاطع بحرية، ويُمنع إساءة استخدام الموقع أو محاولة اختراقه أو تعطيله.</li>
        <li>يحق لإدارة الموقع إزالة أي محتوى أو تعديل الموقع في أي وقت.</li>
        <li>إن كنت صاحب حق في مقطع وترغب في إزالته، تواصل معنا عبر صفحة «اتصل بنا» وسنستجيب سريعاً.</li>
      </ul>
    </Page>
  );
}

export function Contact() {
  useTitle('اتصل بنا');
  const [form, setForm] = useState({ name: '', email: '', body: '' });
  const [state, setState] = useState({ busy: false, msg: '', ok: false });
  const on = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, msg: '', ok: false });
    try {
      await api.contact(form);
      setForm({ name: '', email: '', body: '' });
      setState({ busy: false, ok: true, msg: 'وصلتنا رسالتك، جزاك الله خيراً.' });
    } catch (err) { setState({ busy: false, ok: false, msg: err.message }); }
  };
  return (
    <Page title="اتصل بنا">
      <p>اقتراح أو ملاحظة أو طلب إزالة محتوى؟ اكتب لنا وسنقرأ رسالتك.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="mb-1 block text-sm">الاسم</span><input required maxLength={100} className="field" value={form.name} onChange={on('name')} autoComplete="name" /></label>
        <label className="block"><span className="mb-1 block text-sm">البريد الإلكتروني</span><input required type="email" dir="ltr" className="field text-end" value={form.email} onChange={on('email')} autoComplete="email" /></label>
        <label className="block"><span className="mb-1 block text-sm">الرسالة</span><textarea required minLength={5} maxLength={3000} rows={6} className="field" value={form.body} onChange={on('body')} /></label>
        <button className="btn-gold" disabled={state.busy}>{state.busy ? 'جارٍ الإرسال…' : 'إرسال'}</button>
        {state.msg && <p role="status" className={state.ok ? 'text-emerald' : 'text-rose-300'}>{state.msg}</p>}
      </form>
    </Page>
  );
}
