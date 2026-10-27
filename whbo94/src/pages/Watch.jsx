import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { Grid, Empty } from '../components/Section.jsx';
import { Heart, Bookmark, Share, Next, Eye } from '../components/Icons.jsx';
import { useApp, useTitle } from '../lib/state.jsx';
import { categoryName, formatCount, shareVideo } from '../lib/video.js';

export default function Watch() {
  const { id } = useParams();
  const nav = useNavigate();
  const { videos, status, isFav, toggleFav, isLiked, toggleLike, addView, notify } = useApp();
  const idx = videos.findIndex((v) => v.id === Number(id));
  const video = videos[idx];
  const next = videos.length > 1 ? videos[(idx + 1) % videos.length] : null;
  useTitle(video?.title);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (status === 'loading') return <p className="py-32 text-center text-ivory/70" role="status">جارٍ التحميل…</p>;
  if (!video) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <Empty title="المقطع غير متوفر" text="ربما حُذف هذا المقطع أو أن الرابط غير صحيح." />
        <p className="mt-6 text-center"><Link to="/" className="btn-gold">العودة إلى الرئيسية</Link></p>
      </div>
    );
  }
  const related = videos.filter((v) => v.category === video.category && v.id !== video.id).slice(0, 4);
  const onShare = async () => { const r = await shareVideo(video); if (r === 'copied') notify('تم نسخ رابط المقطع'); };
  const goNext = next ? () => nav(`/v/${next.id}`) : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <VideoPlayer video={video} onNext={goNext} onPlay={() => addView(video.id)} />
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-emerald-deep/80 px-3 py-1 text-xs text-gold-soft">{categoryName(video.category)}</span>
          <h1 className="mt-3 text-2xl font-extrabold leading-10 md:text-3xl">{video.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-ivory/60"><Eye width={16} height={16} /> {formatCount(video.views)} مشاهدة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`btn-ghost !px-4 !py-2 ${isLiked(video.id) ? '!text-rose-300' : ''}`} onClick={() => toggleLike(video.id)} aria-pressed={isLiked(video.id)}>
            <Heart fill={isLiked(video.id) ? 'currentColor' : 'none'} /> {formatCount(video.likes)}
          </button>
          <button type="button" className={`btn-ghost !px-4 !py-2 ${isFav(video.id) ? '!text-gold' : ''}`} onClick={() => toggleFav(video.id)} aria-pressed={isFav(video.id)}>
            <Bookmark fill={isFav(video.id) ? 'currentColor' : 'none'} /> {isFav(video.id) ? 'في المفضلة' : 'حفظ'}
          </button>
          <button type="button" className="btn-ghost !px-4 !py-2" onClick={onShare}><Share /> مشاركة</button>
          {goNext && <button type="button" className="btn-gold !px-4 !py-2" onClick={goNext}><Next /> التالي</button>}
        </div>
      </div>
      {video.description && <p className="glass mt-6 rounded-2xl p-5 leading-9 text-ivory/85">{video.description}</p>}
      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="rel">
          <h2 id="rel" className="mb-6 text-xl font-extrabold">مقاطع من نفس التصنيف</h2>
          <Grid videos={related} />
        </section>
      )}
    </div>
  );
}
