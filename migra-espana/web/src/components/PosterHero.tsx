/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import { POSTER, posterLabels } from '@/lib/ui/poster';

/** Hero poster. Arabic shows the original artwork; other languages show the clean copy with translated labels drawn on top. */
export function PosterHero({ locale, alt }: { locale: string; alt: string }) {
  const labels = posterLabels(locale);
  return (
    <div className="poster-wrap">
      <img src={labels ? '/brand/hero-clean.jpg' : '/brand/hero.jpg'} alt={alt} width={POSTER.w} height={POSTER.h} fetchPriority="high" />
      {labels?.map((l, i) => {
        const style: CSSProperties = {
          left: `${(l.slot.x / POSTER.w) * 100}%`, top: `${(l.slot.y / POSTER.h) * 100}%`, width: `${(l.slot.w / POSTER.w) * 100}%`,
          fontSize: `${(l.size / POSTER.w) * 100}cqw`, transform: `translate(-50%, -50%) rotate(${l.slot.rot}deg)`,
        };
        return <span key={i} className="poster-label" style={style} aria-hidden="true" dir="ltr">{l.lines.map((x, k) => <span key={k}>{x}</span>)}</span>;
      })}
    </div>
  );
}
