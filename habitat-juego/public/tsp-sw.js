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
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(P).then(c => c.put(r, cp)); return res; }).catch(() => caches.open(P).then(c => c.match(r)).then(m => m || caches.match('/jugar.html'))));
  }
});
/* ---------- avisos sin servidor ----------
   Android con el juego instalado: el navegador despierta este archivo más o menos una vez por día (Periodic Background Sync) y,
   si el jugador activó los avisos y todavía no jugó hoy, muestra uno solo, nunca de noche. El estado lo deja el juego en /__tsp_estado.
   'push' queda listo para cuando haya un servidor que mande avisos: recibe {t, b, url}. */
const N = 'tsp-noti';
async function notiEstado() { try { const c = await caches.open(N), r = await c.match('/__tsp_estado'); return r ? await r.json() : {}; } catch (e) { return {}; } }
async function notiGuardar(o) { try { const c = await caches.open(N); await c.put('/__tsp_estado', new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } })); } catch (e) {} }
const hoyKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
self.addEventListener('periodicsync', e => { if (e.tag !== 'tsp-diario') return; e.waitUntil((async () => {
  const st = await notiEstado(), hoy = hoyKey(), h = new Date().getHours(); if (!st.on || st.jugado === hoy || st.avisado === hoy || h < 9 || h >= 21) return;
  const d = new Date(), adv = d.getMonth() === 11 && d.getDate() <= 25, reyes = d.getMonth() === 0 && d.getDate() === 6;
  const t = reyes ? '👑 Se abrió la ventana de los magos' : adv ? (d.getDate() === 25 ? '⭐ ¡Feliz Navidad! Se abrió la ventana 25' : '🎄 Se abrió la ventana ' + d.getDate() + ' de Adviento') : '☀️ Tu desafío del día te espera';
  const b = adv || reyes ? 'Un tramo nuevo de la historia de la Navidad y un regalito.' : 'Tres metas cortas para hoy en Tras sus pasos.';
  await self.registration.showNotification(t, { body: b, icon: st.icon, tag: 'tsp-diario', data: { url: st.url || '/jugar.html' } });
  st.avisado = hoy; await notiGuardar(st); try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(1); } catch (er) {} })()); });
self.addEventListener('push', e => { let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { t: e.data && e.data.text() }; }
  e.waitUntil(notiEstado().then(st => self.registration.showNotification(d.t || 'Tras sus pasos', { body: d.b || '', icon: st.icon, tag: d.tag || 'tsp', data: { url: d.url || st.url || '/jugar.html' } }))); });
self.addEventListener('notificationclick', e => { e.notification.close(); const url = (e.notification.data && e.notification.data.url) || '/jugar.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => { for (const c of L) if ('focus' in c) return c.focus(); return self.clients.openWindow(url); })); });
