import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, Eye, Play } from './Icons.jsx';
import { categoryName, coverOf, formatCount, formatDuration } from '../lib/video.js';
import { useApp } from '../lib/state.jsx';

export default function VideoCard({ video, big = false }) {
  const { isFav, toggleFav, isLiked, fx } = useApp();
  const ref = useRef(null);
  const raf = useRef(0);
  const cover = coverOf(video);
  const fav = isFav(video.id);

  // Pointer tilt only for mouse/pen; touch gets a tap-scale instead (see CSS).
  const onMove = (e) => {
    if (fx !== 'full' || e.pointerType === 'touch') return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.classList.add('tilting');
      el.style.setProperty('--ry', `${(px - 0.5) * -12}deg`);
      el.style.setProperty('--rx', `${(py - 0.5) * 10}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
  };
  const reset = () => {
    cancelAnimationFrame(raf.current);
    const el = ref.current;
    el.classList.remove('tilting');
    el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg');
  };

  return (
    <article className="card3d-wrap">
      <div ref={ref} className="card3d glass overflow-hidden" onPointerMove={onMove} onPointerLeave={reset} onPointerCancel={reset}>
        <Link to={`/v/${video.id}`} className="block" aria-label={`شاهد: ${video.title}`}>
          <div className={`relative overflow-hidden ${video.orientation === 'portrait' ? 'aspect-[4/5]' : big ? 'aspect-[16/8]' : 'aspect-video'}`}>
            {cover
              ? <img src={cover} alt="" loading="lazy" decoding="async" className="thumb h-full w-full object-cover" />
              : <div className="thumb pattern flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-deep to-ink-2"><Play width={44} height={44} className="text-gold/70" /></div>}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <span className="lift absolute end-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs backdrop-blur">{formatDuration(video.duration) || (video.orientation === 'portrait' ? '9:16' : '16:9')}</span>
            <span className="lift absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft/60 bg-black/40 text-gold-soft opacity-90 backdrop-blur"><Play width={24} height={24} /></span>
            <span className="lift absolute start-3 top-3 rounded-full bg-emerald-deep/80 px-2.5 py-1 text-xs text-gold-soft backdrop-blur">{categoryName(video.category)}</span>
          </div>
          <div className="lift p-4">
            <h3 className="line-clamp-2 text-lg font-bold leading-8">{video.title}</h3>
            {video.description && <p className="mt-1 line-clamp-2 text-sm leading-7 text-ivory/70">{video.description}</p>}
          </div>
        </Link>
        <div className="flex items-center justify-between px-4 pb-4 text-sm text-ivory/70">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye width={16} height={16} />{formatCount(video.views)}</span>
            <span className={`flex items-center gap-1 ${isLiked(video.id) ? 'text-rose-300' : ''}`}><Heart width={16} height={16} fill={isLiked(video.id) ? 'currentColor' : 'none'} />{formatCount(video.likes)}</span>
          </span>
          <button type="button" onClick={() => toggleFav(video.id)} aria-pressed={fav} aria-label={fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            className={`rounded-full p-2 transition hover:bg-white/10 ${fav ? 'text-gold' : ''}`}>
            <Bookmark fill={fav ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="shine" aria-hidden="true" />
      </div>
    </article>
  );
}
