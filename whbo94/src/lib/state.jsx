import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function defaultFx() {
  const saved = read('whbo94:fx', null);
  if (saved) return saved;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
  if ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2) return 'lite';
  return 'full';
}

export function AppProvider({ children }) {
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState('loading');
  const [favs, setFavs] = useState(() => read('whbo94:favs', []));
  const [liked, setLiked] = useState(() => read('whbo94:liked', []));
  const [fx, setFxState] = useState(defaultFx);
  const [toast, setToast] = useState('');

  const reload = useCallback(() => api.videos()
    .then((v) => { setVideos(v); setStatus('ready'); })
    .catch(() => setStatus('error')), []);
  useEffect(() => { reload(); }, [reload]);

  useEffect(() => { document.documentElement.classList.remove('fx-full', 'fx-lite', 'fx-off'); document.documentElement.classList.add(`fx-${fx}`); }, [fx]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  const value = useMemo(() => ({
    videos, status, reload, fx, toast, notify: setToast,
    setFx: (m) => { write('whbo94:fx', m); setFxState(m); },
    favs, isFav: (id) => favs.includes(id),
    toggleFav: (id) => setFavs((f) => { const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; write('whbo94:favs', n); return n; }),
    liked, isLiked: (id) => liked.includes(id),
    toggleLike: async (id) => {
      const was = liked.includes(id);
      const n = was ? liked.filter((x) => x !== id) : [...liked, id];
      setLiked(n); write('whbo94:liked', n);
      setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, likes: Math.max(0, v.likes + (was ? -1 : 1)) } : v)));
      try { await api.like(id, !was); } catch { /* optimistic update kept */ }
    },
    addView: (id) => {
      const key = `whbo94:viewed:${id}`;
      try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
      api.view(id);
      setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, views: v.views + 1 } : v)));
    },
  }), [videos, status, reload, fx, toast, favs, liked]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTitle(title) {
  useEffect(() => { document.title = title ? `${title} | نور اليقين` : 'نور اليقين | whbo94 — دعاء ويقين وطمأنينة'; }, [title]);
}
