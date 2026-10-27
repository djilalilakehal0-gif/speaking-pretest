import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Crescent } from './Icons.jsx';
import { useApp } from '../lib/state.jsx';

const scrollTo = (id, fx) => document.getElementById(id)?.scrollIntoView({ behavior: fx === 'off' ? 'auto' : 'smooth' });

export default function Hero() {
  const { fx, videos } = useApp();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const on = fx !== 'off';
  const imgY = useTransform(scrollYProgress, [0, 1], on ? [0, 70] : [0, 0]);
  const moonY = useTransform(scrollYProgress, [0, 1], on ? [0, -120] : [0, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], on ? [0, 40] : [0, 0]);
  const first = videos[0];

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="hero-title">
      <motion.div style={{ y: moonY }} aria-hidden="true" className="pointer-events-none absolute top-3 start-[4%] opacity-90 drop-shadow-[0_0_40px_rgba(243,217,139,.6)] md:start-[12%]">
        <Crescent size={84} />
      </motion.div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 pt-8 md:grid-cols-[1.05fr_.95fr] md:gap-10 md:pb-20 md:pt-12">
        {/* Large hero image — first on mobile */}
        <motion.div style={{ y: imgY }} className="order-1 mx-auto w-full max-w-[min(100%,440px)] md:order-2 md:max-w-[500px]">
          <div className="floaty relative">
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2.2rem] bg-gradient-to-br from-gold/50 via-emerald/30 to-transparent opacity-70 blur-2xl" />
            <div className="hero-portrait relative overflow-hidden rounded-[2rem] border-2 border-gold/50 p-1.5 glass">
              <img src="/hero.jpg" alt="صورة الواجهة الرئيسية" width="1280" height="2274" fetchPriority="high" decoding="async"
                className="aspect-[9/14] max-h-[82vh] w-full rounded-[1.6rem] object-cover object-top md:aspect-[9/15]" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            <div className="glass absolute -bottom-4 start-4 rounded-2xl px-4 py-2 text-sm font-bold text-gold-soft shadow-xl">whbo94</div>
          </div>
        </motion.div>

        <motion.div style={{ y: textY }} className="order-2 text-center md:order-1 md:text-start">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-1.5 text-sm text-gold-soft glass">
            <Crescent size={18} /> نور اليقين
          </p>
          <h1 id="hero-title" className="text-4xl font-extrabold leading-[1.45] sm:text-5xl lg:text-6xl">
            <span className="gold-text">حين يطمئن قلبك بالله،</span><br />يصبح كل شيء ممكناً
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-9 text-ivory/80 md:mx-0">
            أدعية تلامس القلب، ومقاطع تجدد اليقين وتزرع الأمل
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <button type="button" className="btn-gold" onClick={() => scrollTo('library', fx)}>اكتشف المقاطع</button>
            {first
              ? <Link to={`/v/${first.id}`} className="btn-ghost">ابدأ رحلة اليقين</Link>
              : <button type="button" className="btn-ghost" onClick={() => scrollTo('verses', fx)}>ابدأ رحلة اليقين</button>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
