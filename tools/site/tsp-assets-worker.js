// Tras sus pasos · Worker "tsp-assets" (Cloudflare): sirve los archivos pesados del juego desde R2 (bucket tras-sus-pasos, binding B).
// Si un archivo todavía no está en R2, lo trae una vez de GitHub (rama main), lo guarda en R2 y lo sirve. Con CORS abierto (GET/HEAD).
const ORIGIN = 'https://raw.githubusercontent.com/galessandrodale93-pixel/tras-sus-pasos-modelos/main/';
const OK_DIR = /^(tex|hd|ph|hero|promo|app\/(sky|voice|flora|lobby|icons|tex))\//;
const CT = { glb: 'model/gltf-binary', ktx2: 'image/ktx2', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', mp4: 'video/mp4', wasm: 'application/wasm', bin: 'application/octet-stream' };
// Candado por dominio: solo responde a pedidos que vienen desde las páginas del juego (Origin o Referer). Así nadie puede
// enlazar ni bajar los modelos pagos desde otro sitio. Para sumar un dominio nuevo, agregarlo a DOMINIOS.
const DOMINIOS = ['headless-tjfrhnexbhw-galessandrodale93-1411.wix-site-host.com', 'habitat-cfm.org', 'www.habitat-cfm.org', 'localhost', '127.0.0.1'];
const deAca = req => { for (const h of ['Origin', 'Referer']) { const v = req.headers.get(h); if (!v) continue; try { const host = new URL(v).hostname; if (DOMINIOS.includes(host)) return true; } catch (e) {} } return false; };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Expose-Headers': 'Content-Length, Content-Type, ETag' };
export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Método no permitido', { status: 405, headers: CORS });
    const url = new URL(req.url), key = decodeURIComponent(url.pathname.slice(1));
    if (key === '' || key === 'salud') return new Response('ok', { headers: CORS });
    if (!deAca(req)) return new Response('No autorizado', { status: 403, headers: CORS });
    const ext = key.split('.').pop().toLowerCase(), ct = CT[ext];
    if (!ct || !OK_DIR.test(key) || key.includes('..') || !/^[\w\-./]+$/.test(key)) return new Response('No encontrado', { status: 404, headers: CORS });
    const hd = { ...CORS, 'Content-Type': ct, 'Cache-Control': 'public, max-age=604800' };
    const obj = await env.B.get(key);
    if (obj) { hd['ETag'] = obj.httpEtag; hd['Content-Length'] = String(obj.size); hd['X-TSP'] = 'r2'; return new Response(req.method === 'HEAD' ? null : obj.body, { headers: hd }); }
    const r = await fetch(ORIGIN + key, { cf: { cacheTtl: 3600 } });
    if (!r.ok) return new Response('No encontrado', { status: 404, headers: CORS });
    const buf = await r.arrayBuffer();
    ctx.waitUntil(env.B.put(key, buf, { httpMetadata: { contentType: ct } }));
    hd['Content-Length'] = String(buf.byteLength); hd['X-TSP'] = 'github';
    return new Response(req.method === 'HEAD' ? null : buf, { headers: hd });
  }
};
