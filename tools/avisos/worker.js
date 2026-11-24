// Tras sus pasos · Worker "tsp-avisos" (Cloudflare): avisos push de verdad, aunque el juego esté cerrado.
// El juego se anota (POST /alta) con la suscripción del navegador; cada día que juega avisa (POST /jugue).
// Cada hora, el cron revisa a quién le toca: un solo aviso por día, a las 18 h de su zona, solo si ese día todavía no jugó.
// Todo el estado viaja en los metadatos de KV (z: zona en minutos, j: último día jugado, a: último día avisado), así el cron no lee cada valor.
// Seguridad: solo las páginas del juego pueden anotarse. No se guarda nombre, mail ni nada del jugador: solo la dirección del aviso.
const ORIGINS = [/^https:\/\/headless-tjfrhnexbhw-galessandrodale93-1411\.wix-site-host\.com$/, /^https:\/\/([\w-]+\.)?habitat-cfm\.org$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const okO = o => !!o && ORIGINS.some(r => r.test(o));
const cors = o => ({ 'Access-Control-Allow-Origin': okO(o) ? o : 'null', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' });
const HORA = 18, CONTACTO = 'mailto:info@habitat-cfm.org';
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const te = new TextEncoder();
async function idDe(endpoint) { return b64u(await crypto.subtle.digest('SHA-256', te.encode(endpoint))).slice(0, 32); }
const diaLocal = (z, t = Date.now()) => { const d = new Date(t - z * 60000); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); };
const horaLocal = (z, t = Date.now()) => new Date(t - z * 60000).getUTCHours();

/* clave VAPID: el JWK privado vive como secreto VAPID_JWK; la pública sale de x e y */
async function vapid(env) { const j = JSON.parse(env.VAPID_JWK), pub = cat(new Uint8Array([4]), unb64u(j.x), unb64u(j.y));
  const key = await crypto.subtle.importKey('jwk', { ...j, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']); return { key, pub }; }
async function jwt(v, aud) { const h = b64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))), c = b64u(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: CONTACTO })));
  const s = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.key, te.encode(h + '.' + c)); return h + '.' + c + '.' + b64u(s); }
async function hkdf(salt, ikm, info, len) { const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']); return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8)); }
/* cifrado aes128gcm de RFC 8291 */
async function cifrar(sub, texto) {
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']), asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(te.encode('WebPush: info\0'), ua, asPub), 32), salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16), nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const k = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, cat(te.encode(texto), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function enviar(env, v, sub, msg) {
  const u = new URL(sub.endpoint), body = await cifrar(sub, JSON.stringify(msg));
  const r = await fetch(sub.endpoint, { method: 'POST', body, headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '21600', Urgency: 'normal',
    Authorization: 'vapid t=' + await jwt(v, u.origin) + ', k=' + b64u(v.pub) } });
  return r.status;
}
/* el texto del día, igual que el aviso sin servidor del juego */
function mensaje(z) { const d = new Date(Date.now() - z * 60000), m = d.getUTCMonth(), dd = d.getUTCDate(), adv = m === 11 && dd <= 25, reyes = m === 0 && dd === 6;
  const t = reyes ? '👑 Se abrió la ventana de los magos' : adv ? (dd === 25 ? '⭐ ¡Feliz Navidad! Se abrió la ventana 25' : '🎄 Se abrió la ventana ' + dd + ' de Adviento') : '☀️ Tu desafío del día te espera';
  return { t, b: adv || reyes ? 'Un tramo nuevo de la historia de la Navidad y un regalito.' : 'Tres metas cortas para hoy en Tras sus pasos.', tag: 'tsp-diario', url: '/jugar.html' }; }

async function ronda(env, solo) {
  const v = await vapid(env); let cur, n = 0, env2 = 0, bajas = 0;
  do { const L = await env.AV.list({ prefix: 's:', cursor: cur }); cur = L.list_complete ? null : L.cursor;
    for (const k of L.keys) { const m = k.metadata || {}, z = m.z || 180, hoy = diaLocal(z); n++;
      if (!solo && (horaLocal(z) !== HORA || m.j === hoy || m.a === hoy)) continue; if (solo && k.name !== solo) continue;
      const raw = await env.AV.get(k.name); if (!raw) continue; let st = 0; try { st = await enviar(env, v, JSON.parse(raw), mensaje(z)); } catch (e) { st = -1; }
      if (st === 404 || st === 410) { await env.AV.delete(k.name); bajas++; continue; }
      if (st >= 200 && st < 300) { env2++; await env.AV.put(k.name, raw, { metadata: { ...m, a: hoy } }); } }
  } while (cur);
  return { anotados: n, enviados: env2, bajas };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, o = req.headers.get('Origin'), H = { ...cors(o), 'Content-Type': 'application/json' };
    if (req.method === 'OPTIONS') return new Response(null, { status: okO(o) ? 204 : 403, headers: H });
    if (p === '/' || p === '/salud') return new Response('ok', { headers: H });
    /* prueba desde el panel de GitHub: manda un aviso a todos los anotados (clave de un solo uso guardada como secreto PRUEBA) */
    if (p === '/prueba-todos' && env.PRUEBA && req.headers.get('X-Prueba') === env.PRUEBA) { const v = await vapid(env); let cur, out = [];
      do { const L = await env.AV.list({ prefix: 's:', cursor: cur }); cur = L.list_complete ? null : L.cursor;
        for (const k of L.keys) { const raw = await env.AV.get(k.name); if (!raw) continue; let st; try { st = await enviar(env, v, JSON.parse(raw), { t: '🔔 Prueba de avisos', b: 'Así te va a llegar el aviso de cada día en Tras sus pasos.', tag: 'tsp-prueba', url: '/jugar.html' }); } catch (e) { st = 'error ' + e.message; }
          if (st === 404 || st === 410) await env.AV.delete(k.name); out.push({ k: k.name.slice(2, 8), st, ep: (JSON.parse(raw).endpoint || '').split('/')[2] }); } } while (cur);
      return new Response(JSON.stringify(out), { headers: H }); }
    if (p === '/clave') { const v = await vapid(env); return new Response(JSON.stringify({ k: b64u(v.pub) }), { headers: H }); }
    if (!okO(o)) return new Response('{"error":"prohibido"}', { status: 403, headers: H });
    if (req.method !== 'POST') return new Response('{"error":"metodo"}', { status: 405, headers: H });
    let d; try { d = await req.json(); } catch (e) { return new Response('{"error":"json"}', { status: 400, headers: H }); }
    const sub = d.sub || {}, ep = String(sub.endpoint || d.endpoint || '');
    if (!/^https:\/\/[\w.-]+\//.test(ep) || ep.length > 900) return new Response('{"error":"endpoint"}', { status: 400, headers: H });
    const k = 's:' + await idDe(ep), z = Math.max(-840, Math.min(840, Number(d.z) || 0));
    if (p === '/alta') { if (!sub.keys || !sub.keys.p256dh || !sub.keys.auth) return new Response('{"error":"claves"}', { status: 400, headers: H });
      await env.AV.put(k, JSON.stringify({ endpoint: ep, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } }), { metadata: { z, j: diaLocal(z) } });
      return new Response('{"ok":true}', { headers: H }); }
    if (p === '/jugue') { const r = await env.AV.getWithMetadata(k); if (!r.value) return new Response('{"ok":false,"falta":true}', { headers: H });
      const hoy = diaLocal(z); if ((r.metadata || {}).j !== hoy) await env.AV.put(k, r.value, { metadata: { ...(r.metadata || {}), z, j: hoy } }); return new Response('{"ok":true}', { headers: H }); }
    if (p === '/baja') { await env.AV.delete(k); return new Response('{"ok":true}', { headers: H }); }
    if (p === '/probar') { const r = await env.AV.get(k); if (!r) return new Response('{"ok":false}', { headers: H }); const v = await vapid(env);
      const st = await enviar(env, v, JSON.parse(r), { t: '🔔 Avisos activados', b: 'Así te va a llegar el aviso de cada día.', tag: 'tsp-prueba', url: '/jugar.html' }); return new Response(JSON.stringify({ ok: st < 300, st }), { headers: H }); }
    return new Response('{"error":"ruta"}', { status: 404, headers: H });
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(ronda(env).then(r => console.log('ronda', JSON.stringify(r)))); }
};
