import { motion } from 'framer-motion';
import { useApp } from '../lib/state.jsx';
import VideoCard from './VideoCard.jsx';

export function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="mx-auto mt-20 max-w-7xl px-4" aria-labelledby={`${id}-t`}>
      <div className="mb-8 flex items-center gap-4">
        <span aria-hidden="true" className="h-10 w-1.5 rounded-full bg-gradient-to-b from-gold-soft to-emerald" />
        <div>
          <h2 id={`${id}-t`} className="text-2xl font-extrabold md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ivory/65">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Empty({ title, text }) {
  return (
    <div className="glass rounded-3xl px-6 py-14 text-center" role="status">
      <p className="text-xl font-bold text-gold-soft">{title}</p>
      <p className="mx-auto mt-2 max-w-md leading-8 text-ivory/70">{text}</p>
    </div>
  );
}

export function Grid({ videos }) {
  const { fx } = useApp();
  return (
    <div className="grid grid-cols-1 gap-6 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((v, i) => (
        <motion.div key={v.id} initial={fx === 'off' ? false : { opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: Math.min(i % 4, 3) * 0.06 }}>
          <VideoCard video={v} />
        </motion.div>
      ))}
    </div>
  );
}
