import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import VideoCard from '../components/VideoCard.jsx';
import { Section, Empty, Grid } from '../components/Section.jsx';
import { Search } from '../components/Icons.jsx';
import { useApp, useTitle } from '../lib/state.jsx';
import { CATEGORIES } from '../lib/video.js';

const VERSES = [
  { t: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', r: 'سورة الرعد، الآية 28' },
  { t: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', r: 'سورة الطلاق، الآية 3' },
  { t: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا', r: 'سورة الشرح، الآيتان 5–6' },
  { t: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ', r: 'سورة الزمر، الآية 53' },
  { t: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ', r: 'سورة البقرة، الآية 186' },
  { t: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', r: 'سورة التوبة، الآية 40' },
];

const norm = (s) => s.toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

export default function Home() {
  useTitle();
  const { videos, status, favs } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const cat = params.get('cat') || '';
  const set = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });

  const featured = videos.find((v) => v.featured);
  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    return videos.filter((v) => (!cat || v.category === cat) && (!nq || norm(`${v.title} ${v.description}`).includes(nq)));
  }, [videos, q, cat]);
  const popular = useMemo(() => videos.filter((v) => v.views > 0).sort((a, b) => b.views - a.views).slice(0, 4), [videos]);
  const favVideos = videos.filter((v) => favs.includes(v.id));
  const suggested = useMemo(() => {
    const liked = new Set(videos.filter((v) => favs.includes(v.id)).map((v) => v.category));
    const pool = videos.filter((v) => !favs.includes(v.id));
    const pref = pool.filter((v) => liked.has(v.category));
    return (pref.length ? pref : [...pool].sort((a, b) => b.createdAt - a.createdAt)).slice(0, 4);
  }, [videos, favs]);

  return (
    <>
      <Hero />

      {featured && (
        <Section id="featured" title="المقطع المميز" subtitle="اخترناه لك اليوم">
          <div className="mx-auto max-w-3xl"><VideoCard video={featured} big /></div>
        </Section>
      )}

      <Section id="library" title="مكتبة المقاطع" subtitle="ابحث بالعنوان أو بكلمة مفتاحية، أو تصفّح حسب التصنيف">
        <div className="glass mb-6 flex items-center gap-3 rounded-full px-5 py-1">
          <Search className="shrink-0 text-gold-soft" />
          <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="ابحث عن مقطع…" aria-label="بحث في المقاطع"
            className="w-full bg-transparent py-3 text-ivory placeholder:text-ivory/50 focus:outline-none" />
        </div>
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="تصنيفات المقاطع">
          {[{ id: '', name: 'الكل' }, ...CATEGORIES].map((c) => (
            <button key={c.id} type="button" onClick={() => set('cat', c.id)} aria-pressed={cat === c.id}
              className={`rounded-full border px-4 py-2 text-sm transition ${cat === c.id ? 'border-gold bg-gold text-ink font-bold' : 'border-gold/30 text-ivory/80 hover:bg-white/10'}`}>{c.name}</button>
          ))}
        </div>
        {status === 'loading' && <p className="py-16 text-center text-ivory/70" role="status">جارٍ تحميل المقاطع…</p>}
        {status === 'error' && <Empty title="تعذّر تحميل المقاطع" text="تحقق من اتصالك بالإنترنت ثم أعد المحاولة." />}
        {status === 'ready' && videos.length === 0 && <Empty title="لا توجد مقاطع منشورة بعد" text="لم تتم إضافة أي مقطع حتى الآن. سيظهر المحتوى هنا فور نشره من لوحة الإدارة." />}
        {status === 'ready' && videos.length > 0 && (filtered.length
          ? <Grid videos={filtered} />
          : <Empty title="لا توجد نتائج" text="لم نعثر على مقاطع تطابق بحثك. جرّب كلمات أخرى أو تصنيفاً مختلفاً." />)}
      </Section>

      <Section id="popular" title="الأكثر مشاهدة">
        {popular.length ? <Grid videos={popular} /> : <Empty title="لا توجد بيانات مشاهدة بعد" text="ستظهر هنا المقاطع الأكثر مشاهدة بمجرد بدء المشاهدة." />}
      </Section>

      <Section id="favorites" title="المفضلة" subtitle="المقاطع التي حفظتها على هذا الجهاز">
        {favVideos.length ? <Grid videos={favVideos} /> : <Empty title="لم تحفظ أي مقطع بعد" text="اضغط على أيقونة الحفظ في أي مقطع لتجده هنا." />}
      </Section>

      <Section id="suggested" title="مقاطع مقترحة لك" subtitle="بحسب ما حفظته من تصنيفات">
        {suggested.length ? <Grid videos={suggested} /> : <Empty title="لا توجد اقتراحات حالياً" text="ستظهر الاقتراحات عند توفر مقاطع في المكتبة." />}
      </Section>

      <Section id="verses" title="آيات تبعث الطمأنينة">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VERSES.map((v) => (
            <figure key={v.r} className="glass rounded-3xl p-7 text-center">
              <blockquote className="text-2xl leading-[2.4rem] gold-text" lang="ar">﴿ {v.t} ﴾</blockquote>
              <figcaption className="mt-4 text-sm text-ivory/65">{v.r}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}
