import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Next, Volume, Mute, Fullscreen } from './Icons.jsx';
import { coverOf, formatDuration, youtubeId } from '../lib/video.js';

export default function VideoPlayer({ video, onNext, onPlay }) {
  const yt = youtubeId(video.videoUrl);
  const portrait = video.orientation === 'portrait';
  const frame = portrait
    ? 'aspect-[9/16] max-h-[78vh] mx-auto'
    : 'aspect-video w-full';
  return (
    <div className={`${frame} relative overflow-hidden rounded-3xl border border-gold/30 bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)]`}>
      {yt
        ? <YouTube id={yt} title={video.title} onPlay={onPlay} />
        : <FilePlayer key={video.id} video={video} onNext={onNext} onPlay={onPlay} />}
    </div>
  );
}

function YouTube({ id, title, onPlay }) {
  const [started, setStarted] = useState(false);
  if (!started) {
    return (
      <button type="button" className="group absolute inset-0 h-full w-full" onClick={() => { setStarted(true); onPlay?.(); }} aria-label={`تشغيل: ${title}`}>
        <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-black/35" />
        <span className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/90 text-ink shadow-xl transition group-hover:scale-110"><Play width={34} height={34} /></span>
      </button>
    );
  }
  return (
    <iframe className="absolute inset-0 h-full w-full" title={title} allowFullScreen
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
  );
}

function FilePlayer({ video, onNext, onPlay }) {
  const wrap = useRef(null);
  const vid = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(video.duration || 0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const hideTimer = useRef(0);

  const poke = () => {
    setShowUi(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUi(false), 2800);
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const toggle = () => {
    const v = vid.current;
    if (v.paused) v.play().catch(() => setError(true)); else v.pause();
  };
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else (wrap.current.requestFullscreen?.() || vid.current.webkitEnterFullscreen?.());
  };
  const onKey = (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    if (e.key === 'f') fullscreen();
    if (e.key === 'ArrowLeft') vid.current.currentTime += 5;
    if (e.key === 'ArrowRight') vid.current.currentTime -= 5;
  };

  if (error) {
    return <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-ivory/80" role="alert">تعذّر تشغيل هذا المقطع. تأكد من أن الرابط صالح وأن الصيغة مدعومة (MP4 أو WebM).</div>;
  }

  return (
    <div ref={wrap} className="group absolute inset-0 bg-black" tabIndex={0} onKeyDown={onKey} onMouseMove={poke} onTouchStart={poke}>
      <video ref={vid} src={video.videoUrl} poster={coverOf(video) || undefined} preload="metadata" playsInline
        className="h-full w-full object-contain" onClick={toggle}
        onPlay={() => { setPlaying(true); onPlay?.(); poke(); }} onPause={() => { setPlaying(false); setShowUi(true); }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onVolumeChange={(e) => { setVol(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}
        onEnded={() => onNext?.()} onError={() => setError(true)} />
      {!playing && (
        <button type="button" onClick={toggle} aria-label="تشغيل" className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/90 text-ink shadow-xl transition hover:scale-110"><Play width={34} height={34} /></button>
      )}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-10 transition-opacity ${showUi || !playing ? 'opacity-100' : 'opacity-0'}`}>
        <input type="range" className="vp-range w-full" min="0" max={dur || 0} step="0.1" value={time} aria-label="شريط التقدم"
          onChange={(e) => { vid.current.currentTime = Number(e.target.value); }}
          style={{ background: `linear-gradient(to right, #d4af37 ${dur ? (time / dur) * 100 : 0}%, rgb(255 255 255 / .25) 0)` }} />
        <div className="mt-2 flex items-center gap-2 text-sm">
          <button type="button" onClick={toggle} className="rounded-full p-2 hover:bg-white/15" aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}>{playing ? <Pause /> : <Play />}</button>
          {onNext && <button type="button" onClick={onNext} className="rounded-full p-2 hover:bg-white/15" aria-label="الفيديو التالي"><Next /></button>}
          <button type="button" onClick={() => { vid.current.muted = !vid.current.muted; }} className="rounded-full p-2 hover:bg-white/15" aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}>{muted || vol === 0 ? <Mute /> : <Volume />}</button>
          <input type="range" className="vp-range hidden w-20 sm:block" min="0" max="1" step="0.05" value={muted ? 0 : vol} aria-label="مستوى الصوت"
            onChange={(e) => { vid.current.muted = false; vid.current.volume = Number(e.target.value); }} />
          <span className="ms-1 tabular-nums text-ivory/80" dir="ltr">{formatDuration(Math.floor(time)) || '0:00'} / {formatDuration(Math.floor(dur)) || '0:00'}</span>
          <button type="button" onClick={fullscreen} className="ms-auto rounded-full p-2 hover:bg-white/15" aria-label="ملء الشاشة"><Fullscreen /></button>
        </div>
      </div>
    </div>
  );
}
