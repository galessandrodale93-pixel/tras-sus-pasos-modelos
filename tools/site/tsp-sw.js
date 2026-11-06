/* Tras sus pasos — service worker: guarda los archivos del juego (fijados por versión) para jugar sin cortes y sin internet.
   Los archivos pesados (modelos, texturas, audio) se traen de raw.githubusercontent.com, que en frío es mucho más rápido que githack. */
const C = 'tsp-assets-v1', P = 'tsp-pages-v1';
const isAsset = u => /(^https:\/\/(rawcdn|raw)\.githack\.com\/galessandrodale93-pixel\/)|(^https:\/\/cdn\.jsdelivr\.net\/npm\/three@)|(^https:\/\/fonts\.(gstatic|googleapis)\.com\/)/.test(u);
const GH = /^https:\/\/(rawcdn|raw)\.githack\.com\/galessandrodale93-pixel\/tras-sus-pasos-modelos\//, RAW = 'https://raw.githubusercontent.com/galessandrodale93-pixel/tras-sus-pasos-modelos/';
const CT = { glb: 'model/gltf-binary', ktx2: 'image/ktx2', webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', json: 'application/json', wasm: 'application/wasm', bin: 'application/octet-stream' };
async function fromMirror(u) { const ext = u.split('?')[0].split('.').pop().toLowerCase(); if (!GH.test(u) || !CT[ext]) return null; try { const r = await fetch(u.replace(GH, RAW), { mode: 'cors' }); if (!r.ok) return null; return new Response(await r.blob(), { status: 200, headers: { 'Content-Type': CT[ext] } }); } catch (e) { return null; } }
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = r.url;
  if (isAsset(u)) {
    e.respondWith(caches.open(C).then(async c => { const hit = await c.match(u); if (hit) return hit;
      const m = await fromMirror(u); if (m) { c.put(u, m.clone()); return m; }
      const res = await fetch(r); if (res.ok && (res.type === 'cors' || res.type === 'basic')) c.put(u, res.clone()); return res; }));
    return;
  }
  if (r.mode === 'navigate' && new URL(u).origin === self.location.origin) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(P).then(c => c.put(r, cp)); return res; }).catch(() => caches.open(P).then(c => c.match(r)).then(m => m || caches.match('/'))));
  }
});
