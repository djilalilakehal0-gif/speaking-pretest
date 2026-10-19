/* Teacher app: works offline for listening again, and turns on all processor cores for the speech model. */
const VERSION='teacher-v2',ASR_CACHE='asr-v1';
const FILES=['./','index.html','manifest.webmanifest','../img/logo.png','../img/icon-192.png','../fonts/plex-400.woff2','../fonts/plex-600.woff2','../fonts/plexar-400.woff2','../fonts/plexar-600.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('teacher-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function isolate(res){if(!res||res.status===0||res.type==='opaque')return res;const h=new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy','same-origin');h.set('Cross-Origin-Embedder-Policy','require-corp');h.set('Cross-Origin-Resource-Policy','same-origin');
  return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h})}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  if(u.pathname.endsWith('sync.json'))return;
  const store=u.pathname.includes('/asr/')?ASR_CACHE:VERSION;
  const net=()=>fetch(e.request).then(res=>{if(res.ok){const c=res.clone();caches.open(store).then(x=>x.put(e.request,c))}return res});
  // the app page itself: newest from the internet when possible, so updates arrive
  if(e.request.mode==='navigate'||u.pathname.endsWith('/teacher/')||u.pathname.endsWith('index.html'))
    e.respondWith(net().catch(()=>caches.match(e.request,{ignoreSearch:true})).then(isolate));
  else e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||net()).then(isolate));
});
