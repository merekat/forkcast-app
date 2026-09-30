const CACHE="essen-v16";
const FILES=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
// Nur eigene Dateien und das Firebase-SDK cachen, Anmeldung und Datenbank-Verbindungen nicht anfassen
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET")return;
  if(u.origin!==location.origin&&!(u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/")))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){let c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("./index.html"))))});
