/* Tras sus pasos — service worker: guarda los archivos del juego (fijados por versión) para jugar sin cortes y sin internet.
   Los archivos pesados (modelos, texturas, audio) se traen de R2 (Cloudflare) o de raw.githubusercontent.com, mucho más rápidos en frío que githack. */
const C = 'tsp-assets-v1', P = 'tsp-pages-v1';
const isAsset = u => /(^https:\/\/tsp-assets\.galessandrodale-93\.workers\.dev\/)|(^https:\/\/(rawcdn|raw)\.githack\.com\/galessandrodale93-pixel\/)|(^https:\/\/cdn\.jsdelivr\.net\/npm\/three@)|(^https:\/\/fonts\.(gstatic|googleapis)\.com\/)/.test(u);
const GH = /^https:\/\/(rawcdn|raw)\.githack\.com\/galessandrodale93-pixel\/tras-sus-pasos-modelos\/[0-9a-f]{7,40}\//;
const R2 = 'https://tsp-assets.galessandrodale-93.workers.dev/', R2OK = /^(tex|hd|ph|hero|promo|app\/(sky|voice|flora|lobby|icons|tex))\/[\w\-./]+\.(glb|ktx2|webp|jpg|jpeg|png|mp3|mp4|wasm|bin)$/i;
const CT = { glb: 'model/gltf-binary', ktx2: 'image/ktx2', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', mp4: 'video/mp4', json: 'application/json', wasm: 'application/wasm', bin: 'application/octet-stream' };
// primero R2 (Cloudflare), después raw.githubusercontent; si los dos fallan, githack como siempre
async function fromMirror(u) { if (u.startsWith(R2)) { for (const src of [u, 'https://raw.githubusercontent.com/galessandrodale93-pixel/tras-sus-pasos-modelos/main/' + u.slice(R2.length).split('?')[0]]) { try { const r = await fetch(src, { mode: 'cors' }); if (!r.ok) continue; const b = await r.blob(); if (!b.size) continue; const ext = u.split('?')[0].split('.').pop().toLowerCase(); return new Response(b, { status: 200, headers: { 'Content-Type': CT[ext] || r.headers.get('content-type') || 'application/octet-stream' } }); } catch (e) {} } return null; }
  const m = u.match(GH); if (!m) return null; const p = u.slice(m[0].length).split('?')[0], ext = p.split('.').pop().toLowerCase(); if (!CT[ext]) return null;
  const L = []; if (R2OK.test(p)) L.push(R2 + p); L.push(u.replace(/^https:\/\/(rawcdn|raw)\.githack\.com\//, 'https://raw.githubusercontent.com/'));
  for (const src of L) { try { const r = await fetch(src, { mode: 'cors' }); if (!r.ok) continue; const b = await r.blob(); if (!b.size) continue; return new Response(b, { status: 200, headers: { 'Content-Type': CT[ext] } }); } catch (e) {} } return null; }
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
