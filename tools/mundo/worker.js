// Tras sus pasos · Worker «tsp-mundo» (Cloudflare): el servidor del multijugador de Hero.
// Cada «mundo» es un Durable Object con hasta 30 jugadores; cuando uno se llena, se abre el siguiente.
// Seguridad (son chicos y adolescentes):
//  · Solo entra quien trae un pase firmado por habitat-cfm.org/api/kh-mundo (cuenta real, personaje propio de Hero,
//    nivel mínimo y sin suspensión). El pase dura 15 minutos; el nombre sale del pase, no de lo que mande el juego.
//  · No hay texto libre ni voz: solo posiciones, frases armadas (por número), festejos y el aspecto del personaje.
//  · Todo se revisa acá (tamaño, tipos, rangos) y hay límite de mensajes por segundo.
//  · Reportar: con 3 personas distintas que reporten a alguien en 30 minutos, sale del mundo por 30 minutos.
//  · Suspensiones del equipo: llegan como orden firmada (POST /orden) y sacan a la persona al instante.

const ORIGINS = [/^https:\/\/([\w-]+\.)?habitat-cfm\.org$/, /^https:\/\/headless-tjfrhnexbhw-galessandrodale93-1411\.wix-site-host\.com$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const okOrigin = o => !!o && ORIGINS.some(r => r.test(o));
const cors = o => ({ 'Access-Control-Allow-Origin': okOrigin(o) ? o : 'null', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' });
let PUB_URL = 'https://www.habitat-cfm.org/api/kh-mundo?pub=1';
const CUPO = 30, MUNDOS = 12;
const RATE = new Map();
function limited(ip, what, max, perMs) {
  const k = what + ip, now = Date.now(); let r = RATE.get(k); if (!r || now - r.t > perMs) { r = { t: now, n: 0 }; RATE.set(k, r); }
  if (RATE.size > 5000) for (const [kk, v] of RATE) { if (now - v.t > perMs) RATE.delete(kk); }
  return ++r.n > max;
}

/* la clave pública de Habitat (para verificar pases y órdenes); se guarda 10 minutos */
let PUB = null, PUB_T = 0;
async function pub(force) {
  if (PUB && !force && Date.now() - PUB_T < 10 * 60e3) return PUB;
  const r = await fetch(PUB_URL, { cf: { cacheTtl: 0 } }); if (!r.ok) throw new Error('clave');
  const j = await r.json(); PUB = await crypto.subtle.importKey('jwk', j.pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']); PUB_T = Date.now(); return PUB;
}
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
async function abrir(tok) {
  if (typeof tok !== 'string' || tok.length > 2000 || !/^[\w-]+\.[\w-]+$/.test(tok)) return null;
  const [body, sig] = tok.split('.'), data = new TextEncoder().encode(body);
  for (const force of [false, true]) {
    try { if (await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await pub(force), unb64(sig), data)) { const o = JSON.parse(new TextDecoder().decode(unb64(body))); return o && o.exp > Date.now() ? o : null; } } catch (e) { }
  }
  return null;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, o = req.headers.get('Origin'), CORS = cors(o), ip = req.headers.get('CF-Connecting-IP') || '?';
    if (env.PUB_URL_PRUEBA) PUB_URL = env.PUB_URL_PRUEBA; /* solo en pruebas locales */
    if (req.method === 'OPTIONS') return new Response(null, { status: okOrigin(o) ? 204 : 403, headers: CORS });
    if (p === '/' || p === '/salud') return new Response('ok', { headers: CORS });
    /* orden del equipo (firmada en Habitat): suspender o levantar una suspensión en todos los mundos */
    if (p === '/orden' && req.method === 'POST') {
      if (limited(ip, 'orden', 30, 60000)) return new Response('Demasiados pedidos', { status: 429 });
      const ord = await abrir((await req.text()).slice(0, 2000));
      if (!ord || !/^(suspender|levantar)$/.test(ord.cmd) || typeof ord.m !== 'string') return new Response('Orden inválida', { status: 403 });
      await Promise.allSettled(Array.from({ length: MUNDOS }, (_, i) => env.MUNDO.get(env.MUNDO.idFromName('hero-' + (i + 1))).fetch('https://m/orden', { method: 'POST', body: JSON.stringify(ord) })));
      return new Response('ok');
    }
    if (p === '/mundo') {
      if (!okOrigin(o)) return new Response('Prohibido', { status: 403, headers: CORS });
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se espera WebSocket', { status: 426, headers: CORS });
      if (limited(ip, 'ws', 20, 60000)) return new Response('Demasiados pedidos', { status: 429, headers: CORS });
      const pase = await abrir(url.searchParams.get('pase') || '');
      if (!pase || typeof pase.m !== 'string' || typeof pase.p !== 'string') return new Response('Pase inválido', { status: 401, headers: CORS });
      /* el primer mundo con lugar (o el que pidió, si vuelve a entrar) */
      const want = Math.floor(+url.searchParams.get('n') || 0);
      const orden = want >= 1 && want <= MUNDOS ? [want].concat(Array.from({ length: MUNDOS }, (_, i) => i + 1).filter(i => i !== want)) : Array.from({ length: MUNDOS }, (_, i) => i + 1);
      for (const n of orden) {
        const stub = env.MUNDO.get(env.MUNDO.idFromName('hero-' + n));
        const c = await (await stub.fetch('https://m/cupo?m=' + encodeURIComponent(pase.m))).json();
        if (c.bloq) return new Response(JSON.stringify({ error: 'bloqueado', hasta: c.bloq }), { status: 403, headers: CORS });
        if (c.n < CUPO || c.yo) {
          const h = new Headers(req.headers); h.set('x-pase', JSON.stringify({ m: pase.m, p: pase.p, n: pase.n, lv: pase.lv, t: pase.t })); h.set('x-mundo', String(n));
          return stub.fetch(new Request('https://m/entrar', { headers: h }));
        }
      }
      return new Response('Todos los mundos están llenos', { status: 503, headers: CORS });
    }
    return new Response('No encontrado', { status: 404, headers: CORS });
  }
};

/* ---------- revisión de lo que manda cada jugador ---------- */
const num = (v, a, b) => { v = +v; return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : 0; };
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
const avatarOk = a => { if (!a || typeof a !== 'object' || Array.isArray(a)) return {}; try { return JSON.stringify(a).length <= 2500 ? a : {}; } catch (e) { return {}; } };
const nuevoId = () => 'w' + crypto.randomUUID().replace(/-/g, '').slice(0, 10);

export class Mundo {
  constructor(state) { this.state = state; this.rl = new WeakMap(); }
  socks() { return this.state.getWebSockets(); }
  att(ws) { try { return ws.deserializeAttachment() || {}; } catch (e) { return {}; } }
  async bloqueo(m) { const h = await this.state.storage.get('b:' + m); if (!h) return null; if (h !== 'siempre' && h < Date.now()) { await this.state.storage.delete('b:' + m); return null; } return h; }
  env(ws, o) { try { ws.send(typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) { } }
  a_todos(o, menos, cerca) {
    const s = JSON.stringify(o);
    for (const w of this.socks()) { if (w === menos) continue; const a = this.att(w); if (!a.in) continue;
      if (cerca && a.x != null && Math.hypot(a.x - cerca[0], a.z - cerca[1]) > 160) continue; this.env(w, s); }
  }
  sacar(m, por) { for (const w of this.socks()) { const a = this.att(w); if (a.m === m) { this.env(w, { t: 'fuera', por }); try { w.close(4003, por); } catch (e) { } } } }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/cupo') { const m = url.searchParams.get('m') || ''; const S = this.socks().map(w => this.att(w)); return Response.json({ n: S.filter(a => a.m).length, yo: S.some(a => a.m === m), bloq: await this.bloqueo(m) }); }
    if (url.pathname === '/orden') { const o = await req.json(); if (o.cmd === 'suspender') { await this.state.storage.put('b:' + o.m, o.hasta === 'siempre' ? 'siempre' : Date.parse(o.hasta) || Date.now() + 864e5); this.sacar(o.m, 'suspendido'); } else await this.state.storage.delete('b:' + o.m); return new Response('ok'); }
    if (url.pathname !== '/entrar') return new Response('No', { status: 404 });
    let pase; try { pase = JSON.parse(req.headers.get('x-pase') || ''); } catch (e) { return new Response('Pase', { status: 400 }); }
    if (await this.bloqueo(pase.m)) return new Response('Bloqueado', { status: 403 });
    /* una sola conexión por cuenta: si vuelve a entrar, se cierra la anterior */
    for (const w of this.socks()) if (this.att(w).m === pase.m) { this.env(w, { t: 'fuera', por: 'otra' }); try { w.close(4001, 'otra'); } catch (e) { } }
    const pair = new WebSocketPair(), [client, server] = Object.values(pair), id = nuevoId();
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, m: pase.m, p: str(pase.p, 60), n: str(pase.n, 16) || 'Jugador', t: pase.t ? 1 : 0, mundo: +req.headers.get('x-mundo') || 1, in: false, info: null });
    this.env(server, { t: 'pase', id, mundo: +req.headers.get('x-mundo') || 1 });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    const len = typeof raw === 'string' ? raw.length : raw.byteLength; if (len > 6000) return;
    { const now = Date.now(); let q = this.rl.get(ws); if (!q || now - q.t > 1000) { q = { t: now, n: 0, x: q ? q.x : 0 }; this.rl.set(ws, q); } if (++q.n > 25) { if (++q.x > 200) { try { ws.close(1008, 'demasiados mensajes'); } catch (e) { } } return; } }
    let m; try { m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch (e) { return; }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    const a = this.att(ws), id = a.id; if (!id) return;
    if (m.t === 'hi') {
      if (a.in) return; const i = m.info && typeof m.info === 'object' ? m.info : {};
      a.info = { name: a.n, avatar: avatarOk(i.avatar), branch: 'ados', hum: Math.floor(num(i.hum, 0, 999)), pid: a.p }; a.in = true; ws.serializeAttachment(a);
      const players = this.socks().filter(w => w !== ws).map(w => this.att(w)).filter(b => b.in).map(b => ({ id: b.id, info: b.info }));
      this.env(ws, { t: 'list', host: 'srv', players, mundo: a.mundo });
      this.a_todos({ t: 'hi', id, info: a.info }, ws); return;
    }
    if (!a.in) return;
    if (m.t === 'st') {
      if (!Array.isArray(m.s)) return; const s = m.s;
      const v = [num(s[0], -5e3, 5e3), num(s[1], -500, 2e3), num(s[2], -5e3, 5e3), num(s[3], -50, 50), s[4] ? 1 : 0, typeof s[5] === 'string' ? str(s[5], 16) : null, s[6] ? 1 : 0, num(s[7], -10, 50)];
      const nx = Math.round(v[0]), nz = Math.round(v[2]); if (a.x !== nx || a.z !== nz) { a.x = nx; a.z = nz; ws.serializeAttachment(a); }
      this.a_todos({ t: 'st', id, s: v }, ws, [v[0], v[2]]); return;
    }
    if (m.t === 'say') { this.a_todos({ t: 'say', id, k: Math.floor(num(m.k, 0, 99)) }, ws, a.x != null ? [a.x, a.z] : null); return; }
    if (m.t === 'leg') { const g = str(m.g, 24); if (g) this.a_todos({ t: 'leg', id, g }, ws); return; }
    if (m.t === 'look') { const av = avatarOk(m.avatar); a.info.avatar = av; ws.serializeAttachment(a); this.a_todos({ t: 'look', id, avatar: av }, ws); return; }
    if (m.t === 'rep') {
      const to = this.socks().find(w => this.att(w).id === m.to); if (!to) return; const b = this.att(to); if (b.m === a.m) return;
      /* se guarda (no solo en memoria) para que no se pierda si el servidor se duerme */
      const now = Date.now(); let r = await this.state.storage.get('r:' + b.m); if (!r || now - r.t > 30 * 60e3) r = { t: now, de: [] };
      if (!r.de.includes(a.m)) r.de.push(a.m);
      if (r.de.length >= 3) { await this.state.storage.delete('r:' + b.m); await this.state.storage.put('b:' + b.m, now + 30 * 60e3); this.sacar(b.m, 'reportes'); }
      else await this.state.storage.put('r:' + b.m, r);
      return;
    }
  }
  async webSocketClose(ws) { const a = this.att(ws); try { ws.close(1000, 'chau'); } catch (e) { } if (a.in) this.a_todos({ t: 'bye', id: a.id }, ws); }
  async webSocketError(ws) { const a = this.att(ws); try { ws.close(1011, 'error'); } catch (e) { } if (a.in) this.a_todos({ t: 'bye', id: a.id }, ws); }
}
