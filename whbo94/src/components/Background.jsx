import { useEffect, useRef } from 'react';
import { useApp } from '../lib/state.jsx';

// Night sky: twinkling stars + slow golden particles on one canvas.
export default function Background() {
  const ref = useRef(null);
  const { fx } = useApp();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0, running = true;
    const lite = fx === 'lite';
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5);

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const starCount = Math.round((w * h) / (lite ? 22000 : 9000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.2,
      p: Math.random() * Math.PI * 2, s: Math.random() * 0.02 + 0.004,
    }));
    const parts = Array.from({ length: lite ? 0 : 38 }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.6,
      vy: -(Math.random() * 0.25 + 0.05), vx: (Math.random() - 0.5) * 0.12, a: Math.random() * 0.5 + 0.2,
    }));

    const draw = (animate) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (animate) s.p += s.s;
        ctx.globalAlpha = 0.35 + 0.65 * ((Math.sin(s.p) + 1) / 2);
        ctx.fillStyle = '#fff8e0';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      for (const p of parts) {
        if (animate) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(243,217,139,${p.a})`); g.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
    };

    const loop = () => { if (!running) return; draw(true); raf = requestAnimationFrame(loop); };
    const onVisibility = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (fx !== 'off' && !running) { running = true; loop(); }
    };
    const onResize = () => { resize(); draw(false); };

    if (fx === 'off') { running = false; draw(false); } else loop();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fx]);

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'radial-gradient(120% 80% at 70% 0%, #0d2b25 0%, #08130f 45%, #050807 100%)' }}>
      <div className="absolute inset-0 pattern opacity-70" />
      <div className="clouds absolute inset-0" />
      <canvas ref={ref} className="absolute inset-0" />
    </div>
  );
}
