const V='boi-2026-11-03-5';
const SHELL=['/','/index.html','/style.css?v=2026-11-03-5','/app.js?v=2026-11-03-5','/data/places.js?v=2026-11-03-5','/auth.js?v=2026-11-03-5','/vendor/supabase.js','/vendor/leaflet.js','/vendor/leaflet.markercluster.js','/vendor/leaflet.css','/vendor/MarkerCluster.css','/manifest.webmanifest','/icons/icon-192.png'];
const TILES='boi-tiles';const MAX_TILES=1500;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trim(){const c=await caches.open(TILES);const ks=await c.keys();for(let i=0;i<ks.length-MAX_TILES;i++)await c.delete(ks[i])}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET')return;
  if(u.pathname.startsWith('/api/'))return;
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp))}return res}).catch(()=>caches.match(e.request,{ignoreSearch:u.pathname==='/'}).then(r=>r||caches.match('/index.html'))));return;
  }
  if(/arcgisonline\.com|tile\.openstreetmap\.org/.test(u.host)){
    e.respondWith(fetch(e.request).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(TILES).then(c=>c.put(e.request,cp)).then(trim)}return res}).catch(()=>caches.match(e.request)));
  }
});
