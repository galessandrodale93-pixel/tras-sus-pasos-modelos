/* Tras sus pasos — service worker: guarda los archivos del juego (fijados por versión) para jugar sin cortes y sin internet */
const C = 'tsp-assets-v1', P = 'tsp-pages-v1';
const isAsset = u => /(^https:\/\/(rawcdn|raw)\.githack\.com\/galessandrodale93-pixel\/)|(^https:\/\/cdn\.jsdelivr\.net\/npm\/three@)|(^https:\/\/fonts\.(gstatic|googleapis)\.com\/)/.test(u);
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = r.url;
  if (isAsset(u)) {
    // archivo de una versión fija: primero el guardado, si no está se baja y se guarda
    e.respondWith(caches.open(C).then(async c => { const hit = await c.match(u); if (hit) return hit; const res = await fetch(r); if (res.ok && (res.type === 'cors' || res.type === 'basic')) c.put(u, res.clone()); return res; }));
    return;
  }
  if (r.mode === 'navigate' && new URL(u).origin === self.location.origin) {
    // la página: primero internet (para tener la última versión), si no hay conexión la guardada
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(P).then(c => c.put(r, cp)); return res; }).catch(() => caches.open(P).then(c => c.match(r)).then(m => m || caches.match('/'))));
  }
});
