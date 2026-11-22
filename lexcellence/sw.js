/* L'Excellence — offline shell. The page itself is cached after the first visit; videos and 3D libraries load from the network. */
const V = 'lex-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'page-bg.jpg', 'boisson-bg.jpg', 'canettes/index.html', 'canettes/cans.jpg', 'canettes/logo.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range') || /\.(mp4|webm|mp3)$/i.test(r.url)) return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) {                      // CDN (three.js, fonts): cache what succeeds for offline reopen
    e.respondWith(caches.open(V).then(c => fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => c.match(r))));
    return;
  }
  e.respondWith(caches.open(V).then(c => c.match(r, {ignoreSearch: true}).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;                                     // instant from cache, refreshed in the background
  })));
});
