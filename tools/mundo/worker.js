// Tras sus pasos · Worker «tsp-mundo» (Cloudflare): el servidor del multijugador de Hero.
// Cada «mundo» es un Durable Object con hasta 100 jugadores; cuando uno se llena, se abre el siguiente.
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
const CUPO = 100, MUNDOS = 12;
/* las 12 tribus: logros y Resplandor de cada tribu (lo mismo está en el juego) */
const TRIBUS = ['ruben', 'simeon', 'levi', 'juda', 'zabulon', 'isacar', 'dan', 'gad', 'aser', 'neftali', 'jose', 'benjamin'];
const NIVELES = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];
const nivelDe = pts => { let n = 0; NIVELES.forEach((u, i) => { if (pts >= u) n = i; }); return n; };
/* logros: [id, contador, meta, puntos] */
const LOGROS = [['fam1', 'miembros', 10, 50], ['fam2', 'miembros', 50, 150], ['fam3', 'miembros', 200, 500],
  ['ora1', 'ora', 10, 50], ['ora2', 'ora', 100, 150], ['ora3', 'ora', 1000, 500],
  ['fes1', 'festejo', 10, 50], ['fes2', 'festejo', 100, 150], ['fes3', 'festejo', 1000, 500],
  ['pes1', 'comp', 10, 150], ['sal1', 'inv', 20, 150], ['luz1', 'serv', 30, 150], ['int1', 'orv', 50, 150],
  ['ove1', 'oveja', 1, 100], ['ove2', 'oveja', 25, 300], ['ove3', 'oveja', 100, 600],
  ['met1', 'metas', 1, 100], ['met2', 'metas', 4, 300], ['met3', 'metas', 12, 600]];
const PTS = { ora: 3, festejo: 2, comp: 15, inv: 6, serv: 5, orv: 2, oveja: 20 };
/* la meta de la semana: lo que cada uno hace fuera del juego (compartir de Jesús, invitar, servir, orar).
   Topes por persona y por semana (orar: una vez por día), para que cuente lo hecho de verdad y no el apuro. */
const META_K = { comp: 3, inv: 3, serv: 5, orv: 7 };
const META_S = { comp: ['', ''], inv: ['iglesia', 'grupo', 'casa'], serv: ['casa', 'vecino', 'iglesia', 'dar', 'escuela'], orv: ['amigo', 'familia', 'tribu', 'escuela'] };
const metaDe = miembros => Math.min(3000, 40 + 8 * Math.max(1, miembros));
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const semana = () => { const d = new Date(Date.now() - 3 * 3600e3), dia = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dia)).toISOString().slice(0, 10); };
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
  if (typeof tok !== 'string' || tok.length > 8000 || !/^[\w-]+\.[\w-]+$/.test(tok)) return null;
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
    const TR = () => env.TRIBUS.get(env.TRIBUS.idFromName('tribus'));
    /* el contador general (para la web y el juego): a cuántos amigos les hablaron de Jesús y cuántos invitaron, con foto revisada en el aparato */
    /* testimonio de una misión: aviso firmado por Habitat (cuenta una vez por personaje y misión) */
    if (p === '/testimonio' && req.method === 'POST') {
      if (!okOrigin(o)) return new Response('Prohibido', { status: 403, headers: CORS });
      if (limited(ip, 'testim', 10, 60000)) return new Response('Demasiados pedidos', { status: 429, headers: CORS });
      const av = await abrir((await req.text()).slice(0, 2000));
      if (!av || av.cmd !== 'testimonio' || typeof av.p !== 'string' || !/^(fotopastores|fotofelipe)$/.test(av.mis)) return new Response(JSON.stringify({ error: 'aviso' }), { status: 403, headers: CORS });
      const r = await TR().fetch('https://t/testimonio', { method: 'POST', body: JSON.stringify({ p: av.p, mis: av.mis }) });
      return new Response(r.body, { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (p === '/contador' && req.method === 'GET') { const j = await (await TR().fetch('https://t/resumen')).json(); return new Response(JSON.stringify({ ...j.total, semana: j.semana }), { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } }); }
    if (p === '/tribus' && req.method === 'GET') { if (!okOrigin(o)) return new Response('Prohibido', { status: 403, headers: CORS }); const r = await TR().fetch('https://t/resumen'); return new Response(r.body, { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }
    /* mi tribu (con el pase): { pase } la consulta; { pase, t } la elige o la cambia (una vez cada 30 días) */
    if (p === '/tribu' && req.method === 'POST') {
      if (!okOrigin(o)) return new Response('Prohibido', { status: 403, headers: CORS });
      if (limited(ip, 'tribu', 30, 60000)) return new Response('Demasiados pedidos', { status: 429, headers: CORS });
      let x = {}; try { x = JSON.parse((await req.text()).slice(0, 3000)); } catch (e) { }
      const pase = await abrir(x.pase || ''); if (!pase) return new Response(JSON.stringify({ error: 'pase' }), { status: 401, headers: CORS });
      if (x.meta) { if (limited(ip, 'meta', 12, 60000)) return new Response('Demasiados pedidos', { status: 429, headers: CORS }); const r = await TR().fetch('https://t/meta', { method: 'POST', body: JSON.stringify({ m: pase.p, n: pase.n, k: String(x.meta.k || ''), s: String(x.meta.s || '') }) }); return new Response(r.body, { status: r.status, headers: { ...CORS, 'Content-Type': 'application/json' } }); }
      const r = x.t ? await TR().fetch('https://t/unirse', { method: 'POST', body: JSON.stringify({ m: pase.p, t: String(x.t) }) }) : await TR().fetch('https://t/de?m=' + encodeURIComponent(pase.p)); /* la tribu es del personaje: lo acompaña en todos los cursos */
      return new Response(r.body, { status: r.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (p === '/mundo') {
      if (!okOrigin(o)) return new Response('Prohibido', { status: 403, headers: CORS });
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se espera WebSocket', { status: 426, headers: CORS });
      if (limited(ip, 'ws', 20, 60000)) return new Response('Demasiados pedidos', { status: 429, headers: CORS });
      const pase = await abrir(url.searchParams.get('pase') || '');
      if (pase && !Array.isArray(pase.a)) pase.a = [];
      if (!pase || typeof pase.m !== 'string' || typeof pase.p !== 'string') return new Response('Pase inválido', { status: 401, headers: CORS });
      /* el primer mundo con lugar (o el que pidió, si vuelve a entrar) */
      const want = Math.floor(+url.searchParams.get('n') || 0);
      const orden = want >= 1 && want <= MUNDOS ? [want].concat(Array.from({ length: MUNDOS }, (_, i) => i + 1).filter(i => i !== want)) : Array.from({ length: MUNDOS }, (_, i) => i + 1);
      for (const n of orden) {
        const stub = env.MUNDO.get(env.MUNDO.idFromName('hero-' + n));
        const c = await (await stub.fetch('https://m/cupo?m=' + encodeURIComponent(pase.m))).json();
        if (c.bloq) return new Response(JSON.stringify({ error: 'bloqueado', hasta: c.bloq }), { status: 403, headers: CORS });
        if (c.n < CUPO || c.yo) {
          const h = new Headers(req.headers); h.set('x-pase', JSON.stringify({ m: pase.m, p: pase.p, n: pase.n, lv: pase.lv, t: pase.t, a: pase.a.filter(x => typeof x === 'string' && /^[a-zA-Z0-9-]{8,60}$/.test(x)).slice(0, 40) })); h.set('x-mundo', String(n));
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
  constructor(state, env) { this.state = state; this.env_ = env; this.rl = new WeakMap(); }
  socks() { return this.state.getWebSockets(); }
  att(ws) { try { return ws.deserializeAttachment() || {}; } catch (e) { return {}; } }
  async bloqueo(m) { const h = await this.state.storage.get('b:' + m); if (!h) return null; if (h !== 'siempre' && h < Date.now()) { await this.state.storage.delete('b:' + m); return null; } return h; }
  env(ws, o) { try { ws.send(typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) { } }
  a_todos(o, menos, cerca, sin) {
    const s = JSON.stringify(o);
    for (const w of this.socks()) { if (w === menos || (sin && sin.has(w))) continue; const a = this.att(w); if (!a.in) continue;
      if (cerca && a.x != null && Math.hypot(a.x - cerca[0], a.z - cerca[1]) > 160) continue; this.env(w, s); }
  }
  sacar(m, por) { for (const w of this.socks()) { const a = this.att(w); if (a.m === m) { this.env(w, { t: 'fuera', por }); try { w.close(4003, por); } catch (e) { } } } }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/cupo') { const m = url.searchParams.get('m') || ''; const S = this.socks().map(w => this.att(w)); return Response.json({ n: S.filter(a => a.m).length, yo: S.some(a => a.m === m), bloq: await this.bloqueo(m) }); }
    if (url.pathname === '/orden') { const o = await req.json(); if (o.cmd === 'suspender') { await this.state.storage.put('b:' + o.m, o.hasta === 'siempre' ? 'siempre' : Date.parse(o.hasta) || Date.now() + 864e5); this.sacar(o.m, 'suspendido'); } else await this.state.storage.delete('b:' + o.m); return new Response('ok'); }
    if (url.pathname === '/enviar') { const o = await req.json(); for (const w of this.socks()) { const a = this.att(w); if (a.p === o.p) this.env(w, o.msg); } return new Response('ok'); }
    if (url.pathname !== '/entrar') return new Response('No', { status: 404 });
    let pase; try { pase = JSON.parse(req.headers.get('x-pase') || ''); } catch (e) { return new Response('Pase', { status: 400 }); }
    if (await this.bloqueo(pase.m)) return new Response('Bloqueado', { status: 403 });
    /* una sola conexión por cuenta: si vuelve a entrar, se cierra la anterior */
    for (const w of this.socks()) if (this.att(w).m === pase.m) { this.env(w, { t: 'fuera', por: 'otra' }); try { w.close(4001, 'otra'); } catch (e) { } }
    const pair = new WebSocketPair(), [client, server] = Object.values(pair), id = nuevoId();
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, m: pase.m, p: str(pase.p, 60), n: str(pase.n, 16) || 'Jugador', t: pase.t ? 1 : 0, mundo: +req.headers.get('x-mundo') || 1, in: false, info: null, am: Array.isArray(pase.a) ? pase.a : [] });
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
      const tr = await this.tribuDe(a.p);
      a.info = { name: a.n, avatar: avatarOk(i.avatar), branch: 'ados', hum: Math.floor(num(i.hum, 0, 999)), pid: a.p, tribu: tr.t || '', tlv: tr.lv || 0 }; a.tribu = tr.t || ''; a.in = true; ws.serializeAttachment(a);
      const players = this.socks().filter(w => w !== ws).map(w => this.att(w)).filter(b => b.in).map(b => ({ id: b.id, info: b.info }));
      this.env(ws, { t: 'list', host: 'srv', players, mundo: a.mundo });
      this.a_todos({ t: 'hi', id, info: a.info }, ws);
      await this.amg('/on', { p: a.p, n: a.n, mundo: a.mundo });
      await this.evArmar(); if (this.ev && this.ev.fase && this.ev.fase !== 'nada' && this.ev.fase !== 'semilla') this.env(ws, this.evMsg()); return;
    }
    if (m.t === 'voz') { const peer = str(m.peer, 64); if (/^[\w-]{6,64}$/.test(peer)) await this.amg('/peer', { p: a.p, peer }); return; }
    if (!a.in) return;
    if (m.t === 'st') {
      if (!Array.isArray(m.s)) return; const s = m.s;
      const v = [num(s[0], -5e3, 5e3), num(s[1], -500, 2e3), num(s[2], -5e3, 5e3), num(s[3], -50, 50), s[4] ? 1 : 0, typeof s[5] === 'string' ? str(s[5], 16) : null, s[6] ? 1 : 0, num(s[7], -10, 50)];
      v[8] = typeof s[8] === 'string' ? str(s[8], 16) : null; /* festejo que está bailando */
      const act = v[5] === 'pray' ? 'ora' : v[8] && /^D_/.test(v[8]) ? 'fes:' + v[8] : '';
      const nx = Math.round(v[0]), nz = Math.round(v[2]); if (a.x !== nx || a.z !== nz || a.act !== act) { a.x = nx; a.z = nz; a.act = act; ws.serializeAttachment(a); }
      if (act && a.tribu) await this.juntos(ws, a);
      if (this.ev && this.ev.fase === 'cargada' && this.ev.carga === a.id && Math.hypot(nx - this.ev.rx, nz - this.ev.rz) <= 8) await this.evLogrado(ws, a);
      this.a_todos({ t: 'st', id, s: v }, ws, [v[0], v[2]]); return;
    }
    if (m.t === 'say') { this.a_todos({ t: 'say', id, k: Math.floor(num(m.k, 0, 99)) }, ws, a.x != null ? [a.x, a.z] : null); return; }
    if (m.t === 'leg') { const g = str(m.g, 24); if (g) this.a_todos({ t: 'leg', id, g }, ws); return; }
    if (m.t === 'look') { const av = avatarOk(m.avatar); a.info.avatar = av; ws.serializeAttachment(a); this.a_todos({ t: 'look', id, avatar: av }, ws); return; }
    if (m.t === 'tribuSet') { /* eligió o cambió de tribu: se vuelve a leer y se avisa a todos */
      this.trCache = null; const tr = await this.tribuDe(a.p, true); a.tribu = tr.t || ''; a.info.tribu = a.tribu; a.info.tlv = tr.lv || 0; ws.serializeAttachment(a);
      const o = { t: 'tribu', id, tribu: a.tribu, tlv: a.info.tlv }; this.env(ws, o); this.a_todos(o, ws); return;
    }
    /* ---- amigos con voz: solo entre amigos del camino (los que se aceptaron en una sala) ---- */
    if (m.t === 'ping') { await this.amg('/on', { p: a.p, n: a.n, mundo: a.mundo }); return; }
    if (m.t === 'voz') { const peer = str(m.peer, 64); if (/^[\w-]{6,64}$/.test(peer)) await this.amg('/peer', { p: a.p, peer }); return; }
    if (m.t === 'amigos') { const r = await this.amg('/quien', { ps: a.am }); this.env(ws, { t: 'amigos', l: (r && r.l) || [] }); return; }
    if (m.t === 'llamar' || m.t === 'colgar' || m.t === 'no') { /* sonar, cortar o rechazar: solo a un amigo */
      const to = str(m.to, 60); if (!a.am.includes(to)) return; await this.amg('/enviar', { to, msg: { t: m.t, de: a.p, n: a.n, peer: str(m.peer, 64) } }); return;
    }
    if (m.t === 'conv') { /* invitar a una charla de voz a varios amigos */
      const to = (Array.isArray(m.to) ? m.to : []).map(x => str(x, 60)).filter(x => a.am.includes(x)).slice(0, 7); if (!to.length) return;
      await this.amg('/conv', { host: a.p, n: a.n, peer: str(m.peer, 64), to }); return;
    }
    if (m.t === 'convSi' || m.t === 'convFin') { await this.amg('/' + m.t, { c: str(m.c, 40), p: a.p, n: a.n, peer: str(m.peer, 64) }); return; }
    /* ---- grupos de hasta 5 (en este mundo) y sus roles ---- */
    if (m.t === 'gInv') { /* invitar a alguien que está en este mundo */
      const now = Date.now(); if (now - (a.gInvT || 0) < 4000) return; a.gInvT = now; ws.serializeAttachment(a);
      const to = this.socks().find(w => this.att(w).id === m.to); if (!to) return; const b = this.att(to); if (!b.in || b.m === a.m) return;
      if (b.g) { this.env(ws, { t: 'gAviso', k: 'ocupado', n: b.n }); return; }
      const g = a.g || 'g' + a.id; if (this.grupo(g).length >= 5) { this.env(ws, { t: 'gAviso', k: 'lleno' }); return; }
      (this.inv || (this.inv = new Map())).set(b.id, { g, de: a.id, t: now }); if (this.inv.size > 2000) for (const [k, v] of this.inv) if (now - v.t > 60e3) this.inv.delete(k);
      this.env(to, { t: 'gInv', de: a.id, n: a.n, tribu: a.tribu || '' }); return;
    }
    if (m.t === 'gSi' || m.t === 'gNo') {
      const iv = this.inv && this.inv.get(a.id); if (!iv || Date.now() - iv.t > 60e3) return; this.inv.delete(a.id);
      const de = this.socks().find(w => this.att(w).id === iv.de); if (!de) return; const d = this.att(de);
      if (m.t === 'gNo') { this.env(de, { t: 'gAviso', k: 'no', n: a.n }); return; }
      if (a.g) this.salirGrupo(ws, a);
      const g = d.g || iv.g; if (this.grupo(g).length >= 5) { this.env(ws, { t: 'gAviso', k: 'lleno' }); return; }
      if (!d.g) { d.g = g; d.gj = Date.now() - 1; de.serializeAttachment(d); }
      a.g = g; a.gj = Date.now(); a.rol = ''; ws.serializeAttachment(a); this.avisarGrupo(g); return;
    }
    if (m.t === 'gSal') { if (a.g) this.salirGrupo(ws, a); return; }
    if (m.t === 'gRol') {
      const r = String(m.r || ''); if (!a.g || !['pastor', 'rastreador', 'intercesor', 'heraldo', ''].includes(r)) return;
      if (r && this.grupo(a.g).some(([w, b]) => b.id !== a.id && b.rol === r)) { this.env(ws, { t: 'gAviso', k: 'rol' }); return; }
      if (this.ev && this.ev.carga === a.id && r !== 'pastor') return; /* el que lleva la oveja sigue siendo el pastor */
      a.rol = r; ws.serializeAttachment(a); this.avisarGrupo(a.g); return;
    }
    if (m.t === 'gSen') { /* el heraldo toca el shofar: una señal para su grupo */
      const now = Date.now(); if (!a.g || a.rol !== 'heraldo' || now - (a.senT || 0) < 20e3 || a.x == null) return; a.senT = now; ws.serializeAttachment(a);
      for (const [w] of this.grupo(a.g)) this.env(w, { t: 'gSen', id: a.id, n: a.n, x: a.x, z: a.z }); return;
    }
    if (m.t === 'gPista') { /* el intercesor oró: su grupo recibe la pista (el juego la calcula) */
      const now = Date.now(); if (!a.g || a.rol !== 'intercesor' || now - (a.pisT || 0) < 45e3 || !this.ev || this.ev.fase !== 'perdida') return; a.pisT = now; ws.serializeAttachment(a);
      for (const [w] of this.grupo(a.g)) this.env(w, { t: 'gPista', n: a.n }); return;
    }
    /* ---- la oveja perdida ---- */
    if (m.t === 'ovejaPos') { /* el primer juego que responde elige dónde (lejos de quien la elige) */
      const E = this.ev; if (!E || E.fase !== 'semilla' || m.ev !== E.id || a.x == null) return;
      const x = num(m.x, -5e3, 5e3), z = num(m.z, -5e3, 5e3), rx = num(m.rx, -5e3, 5e3), rz = num(m.rz, -5e3, 5e3);
      if (Math.hypot(x - a.x, z - a.z) < 60 || Math.hypot(x - E.sx, z - E.sz) > 260 || Math.hypot(rx - x, rz - z) < 40) return;
      Object.assign(E, { fase: 'perdida', x, z, rx, rz, lugar: str(m.lugar, 40), fin: Date.now() + 12 * 60e3 }); await this.state.storage.put('ev', E);
      this.a_todos(this.evMsg(), null); await this.state.storage.setAlarm(E.fin); return;
    }
    if (m.t === 'ovejaVi') { const E = this.ev; if (!E || E.fase !== 'perdida' || a.x == null || Math.hypot(a.x - E.x, a.z - E.z) > 10 || E.vista) return;
      E.vista = a.id; const msg = { t: 'oveja', fase: 'vista', ev: E.id, n: a.n, id: a.id }; if (a.g) for (const [w] of this.grupo(a.g)) this.env(w, msg); else this.env(ws, msg); return; }
    if (m.t === 'ovejaCargar') {
      const E = this.ev; if (!E || E.fase !== 'perdida' || a.x == null || Math.hypot(a.x - E.x, a.z - E.z) > 10) return;
      if (!a.g || a.rol !== 'pastor' || this.grupo(a.g).length < 2) { this.env(ws, { t: 'gAviso', k: 'pastor' }); return; }
      E.fase = 'cargada'; E.carga = a.id; E.g = a.g; E.cn = a.n; await this.state.storage.put('ev', E); this.a_todos(this.evMsg(), null); return;
    }
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
  /* ---- grupos ---- */
  grupo(g) { return g ? this.socks().map(w => [w, this.att(w)]).filter(([w, b]) => b.in && b.g === g) : []; }
  avisarGrupo(g) {
    const L = this.grupo(g).sort((x, y) => (x[1].gj || 0) - (y[1].gj || 0)), l = L.map(([w, b], i) => ({ id: b.id, n: b.n, rol: b.rol || '', tribu: b.tribu || '', lider: i === 0 ? 1 : 0 }));
    if (L.length === 1) { const [w, b] = L[0]; b.g = ''; b.rol = ''; w.serializeAttachment(b); this.env(w, { t: 'grupo', g: '', l: [] }); return; } /* uno solo ya no es grupo */
    for (const [w] of L) this.env(w, { t: 'grupo', g, l });
  }
  salirGrupo(ws, a) { const g = a.g; a.g = ''; a.rol = ''; ws.serializeAttachment(a); this.env(ws, { t: 'grupo', g: '', l: [] }); this.soltar(a); this.avisarGrupo(g); }
  /* si el que lleva la oveja se va o sale del grupo, la oveja queda donde estaba */
  soltar(a) { const E = this.ev; if (!E || E.fase !== 'cargada' || E.carga !== a.id) return; Object.assign(E, { fase: 'perdida', carga: '', g: '', x: a.x != null ? a.x : E.x, z: a.z != null ? a.z : E.z, vista: '' }); this.state.storage.put('ev', E); this.a_todos(this.evMsg(), null); }
  /* ---- eventos del mundo: la oveja perdida (Lucas 15). Cada 15 minutos, si hay 2 o más jugadores ---- */
  evMsg() { const E = this.ev || {}; return { t: 'oveja', fase: E.fase || 'nada', ev: E.id, x: E.x, z: E.z, rx: E.rx, rz: E.rz, sx: E.sx, sz: E.sz, lugar: E.lugar || '', fin: E.fin || 0, carga: E.carga || '', cn: E.cn || '' }; }
  async evArmar() {
    if (this.ev === undefined) this.ev = (await this.state.storage.get('ev')) || null;
    const al = await this.state.storage.getAlarm(); if (!al) await this.state.storage.setAlarm(Date.now() + (this.ev && this.ev.fin > Date.now() ? this.ev.fin - Date.now() : this.env_.EV_PRUEBA ? 3000 : 4 * 60e3)); /* EV_PRUEBA: solo en pruebas locales */
  }
  async alarm() {
    if (this.ev === undefined) this.ev = (await this.state.storage.get('ev')) || null;
    const now = Date.now(), E = this.ev, ps = this.socks().map(w => this.att(w)).filter(b => b.in && b.x != null);
    if (E && E.fase !== 'nada' && E.fin && now < E.fin) { await this.state.storage.setAlarm(E.fin); return; }
    if (E && (E.fase === 'perdida' || E.fase === 'cargada' || E.fase === 'semilla')) { this.ev = { fase: 'nada', id: E.id }; await this.state.storage.put('ev', this.ev); this.a_todos({ t: 'oveja', fase: 'fin', ev: E.id }, null); }
    if (ps.length >= 2) { /* una oveja nueva: el lugar lo elige el primer juego que responde, cerca de alguien al azar */
      const b = ps[Math.floor(Math.random() * ps.length)], an = Math.random() * 6.283, r = 110 + Math.random() * 90;
      this.ev = { id: 'o' + now.toString(36), fase: 'semilla', sx: Math.round(b.x + Math.cos(an) * r), sz: Math.round(b.z + Math.sin(an) * r), fin: now + 60e3 }; await this.state.storage.put('ev', this.ev);
      this.a_todos({ t: 'oveja', fase: 'semilla', ev: this.ev.id, sx: this.ev.sx, sz: this.ev.sz }, null);
      await this.state.storage.setAlarm(now + 60e3); return;
    }
    if (this.socks().length) await this.state.storage.setAlarm(now + (ps.length ? 5 : 15) * 60e3); /* sin nadie, no se programa nada: se arma de nuevo cuando alguien entra */
  }
  /* el pastor llegó al redil con la oveja: fiesta para todo el grupo y su tribu */
  async evLogrado(ws, a) {
    const E = this.ev, mem = this.grupo(E.g), nombres = mem.map(([w, b]) => b.n), tribus = {}; mem.forEach(([w, b]) => { if (b.tribu) tribus[b.tribu] = (tribus[b.tribu] || 0) + 1; });
    this.ev = { fase: 'nada', id: E.id }; await this.state.storage.put('ev', this.ev); await this.state.storage.setAlarm(Date.now() + 15 * 60e3);
    const TRo = this.env_.TRIBUS.get(this.env_.TRIBUS.idFromName('tribus')); const res = {};
    for (const t in tribus) { try { res[t] = await (await TRo.fetch('https://t/evento', { method: 'POST', body: JSON.stringify({ t, k: 'oveja', n: tribus[t] }) })).json(); } catch (e) { } }
    for (const [w, b] of mem) { let ti = {}; try { ti = await (await TRo.fetch('https://t/titulo', { method: 'POST', body: JSON.stringify({ m: b.p, k: 'oveja' }) })).json(); } catch (e) { }
      this.env(w, { t: 'oveja', fase: 'lograda', ev: E.id, yo: 1, nombres, pts: PTS.oveja, titulo: !!ti.nuevo, logros: (res[b.tribu] || {}).nuevos || [], tlv: (res[b.tribu] || {}).lv || 0 }); }
    this.a_todos({ t: 'oveja', fase: 'lograda', ev: E.id, nombres, cn: E.cn }, null, null, new Set(mem.map(([w]) => w)));
  }
  /* la tribu de cada cuenta la guarda el objeto «tribus» (uno solo para todos los mundos) */
  async tribuDe(m, fresh) {
    try { const r = await (await this.env_.TRIBUS.get(this.env_.TRIBUS.idFromName('tribus')).fetch('https://t/de?m=' + encodeURIComponent(m))).json(); return r || {}; } catch (e) { return {}; }
  }
  /* orar o festejar juntos: 3 o más de la misma tribu, cerca (8 m), haciendo lo mismo. Cada persona suma una vez cada 10 minutos. */
  async juntos(ws, a) {
    const now = Date.now(), cd = this.cd || (this.cd = new Map());
    const grupo = this.socks().map(w => [w, this.att(w)]).filter(([w, b]) => b.in && b.tribu === a.tribu && b.act === a.act && b.x != null && Math.hypot(b.x - a.x, b.z - a.z) <= 8);
    if (grupo.length < 3) return;
    const kind = a.act === 'ora' ? 'ora' : 'festejo', nuevos = grupo.filter(([w, b]) => !(cd.get(b.m + kind) > now));
    if (!nuevos.length) return;
    nuevos.forEach(([w, b]) => cd.set(b.m + kind, now + 10 * 60e3)); if (cd.size > 5000) for (const [k, t] of cd) if (t < now) cd.delete(k);
    let r = {}; try { r = await (await this.env_.TRIBUS.get(this.env_.TRIBUS.idFromName('tribus')).fetch('https://t/evento', { method: 'POST', body: JSON.stringify({ t: a.tribu, k: kind, n: nuevos.length }) })).json(); } catch (e) { }
    const msg = { t: 'juntos', k: kind, n: grupo.length, pts: (PTS[kind] || 1) * nuevos.length, logros: r.nuevos || [], tlv: r.lv || 0 };
    nuevos.forEach(([w]) => this.env(w, msg));
    if ((r.nuevos || []).length) this.a_todos({ t: 'logro', tribu: a.tribu, logros: r.nuevos }, null);
  }
  async amg(path, body) { try { return await (await this.env_.AMIGOS.get(this.env_.AMIGOS.idFromName('amigos')).fetch('https://a' + path, { method: 'POST', body: JSON.stringify(body) })).json(); } catch (e) { return null; } }
  async webSocketClose(ws) { const a = this.att(ws); try { ws.close(1000, 'chau'); } catch (e) { } if (a.g) { const g = a.g; this.soltar(a); a.g = ''; try { ws.serializeAttachment(a); } catch (e) { } this.avisarGrupo(g); } if (a.in) { this.a_todos({ t: 'bye', id: a.id }, ws); if (!this.socks().some(w => w !== ws && this.att(w).p === a.p)) await this.amg('/off', { p: a.p }); } }
  async webSocketError(ws) { const a = this.att(ws); try { ws.close(1011, 'error'); } catch (e) { } if (a.g) { const g = a.g; this.soltar(a); a.g = ''; try { ws.serializeAttachment(a); } catch (e) { } this.avisarGrupo(g); } if (a.in) { this.a_todos({ t: 'bye', id: a.id }, ws); await this.amg('/off', { p: a.p }); } }
}

/* ---------- las 12 tribus: miembros, puntos, logros y Resplandor (un solo objeto para todos los mundos) ---------- */
export class Tribus {
  constructor(state) { this.state = state; }
  async datos() {
    if (this.D) return this.D; let D = await this.state.storage.get('T');
    if (!D) { D = {}; TRIBUS.forEach(t => { D[t] = { miembros: 0, pts: 0, sem: '', spts: 0, cnt: {}, logros: {} }; }); }
    this.D = D; return D;
  }
  async guardar() { await this.state.storage.put('T', this.D); }
  /* lo que ve cada uno de su tribu: su tribu, lo suyo de esta semana, la meta y lo último que hizo la tribu */
  mio(r) {
    const T = this.D[r.t], wk = semana(), w = r.w && r.w.wk === wk ? r.w : {}, esta = T.sem === wk, c = r.c || {};
    return { t: r.t, desde: r.d, lv: nivelDe(T.pts), yo: { comp: w.comp || 0, inv: w.inv || 0, serv: w.serv || 0, orv: w.orv || 0, oroHoy: w.dia === hoyAR(), total: c }, topes: META_K,
      titulos: [c.comp ? 'mensajero' : '', c.oveja ? 'pastor' : ''].filter(Boolean), meta: metaDe(T.miembros), mpts: esta ? T.mpts || 0 : 0, mok: esta ? !!T.mok : false, feed: (T.feed || []).filter(f => Date.now() - f.at < 14 * 864e5) };
  }
  sumar(T, k, n) {
    const D = this.D[T], wk = semana(); if (D.sem !== wk) { D.sem = wk; D.spts = 0; D.mpts = 0; D.mok = 0; }
    if (k !== 'miembros') { D.cnt[k] = (D.cnt[k] || 0) + n; const p = (PTS[k] || 1) * n; D.pts += p; D.spts += p; }
    const nuevos = [];
    if (META_K[k]) { D.mpts = (D.mpts || 0) + (PTS[k] || 1) * n; if (!D.mok && D.mpts >= metaDe(D.miembros)) { D.mok = 1; D.cnt.metas = (D.cnt.metas || 0) + 1; D.pts += 100; D.spts += 100; nuevos.push('meta'); } }
    for (const [id, c, meta, p] of LOGROS) { const v = c === 'miembros' ? D.miembros : (D.cnt[c] || 0); if (!D.logros[id] && v >= meta) { D.logros[id] = new Date().toISOString().slice(0, 10); D.pts += p; D.spts += p; nuevos.push(id); } }
    return nuevos;
  }
  async fetch(req) {
    const url = new URL(req.url), D = await this.datos();
    if (url.pathname === '/resumen') {
      const wk = semana(), out = {};
      TRIBUS.forEach(t => { const x = D[t], esta = x.sem === wk; out[t] = { miembros: x.miembros, pts: x.pts, lv: nivelDe(x.pts), semana: esta ? x.spts : 0, cnt: x.cnt, logros: x.logros, meta: metaDe(x.miembros), mpts: esta ? x.mpts || 0 : 0, mok: esta ? !!x.mok : false }; });
      const total = { comp: 0, inv: 0, serv: 0, orv: 0 }; TRIBUS.forEach(t => { for (const k in total) total[k] += D[t].cnt[k] || 0; });
      const mis = (await this.state.storage.get('testimonios')) || 0; total.mis = mis; total.comp += mis; /* las fotos de testimonio de las misiones también cuentan */
      return Response.json({ tribus: out, semana: wk, total });
    }
    if (url.pathname === '/titulo') { /* lo personal de cada uno (por personaje): cuántas ovejas encontró → «Buen pastor» */
      const x = await req.json(), k = 'm:' + String(x.m || ''), r = (await this.state.storage.get(k)) || null; if (!r) return Response.json({});
      r.c = r.c || {}; r.c[x.k] = (r.c[x.k] || 0) + 1; await this.state.storage.put(k, r); return Response.json({ nuevo: r.c[x.k] === 1 });
    }
    if (url.pathname === '/testimonio') {
      const x = await req.json(), k = 'tm:' + String(x.p || '') + ':' + String(x.mis || ''); if (await this.state.storage.get(k)) return Response.json({ ok: 1, ya: 1 });
      const n = ((await this.state.storage.get('testimonios')) || 0) + 1; await this.state.storage.put({ [k]: 1, testimonios: n }); return Response.json({ ok: 1, n });
    }
    if (url.pathname === '/de') { const m = url.searchParams.get('m') || '', r = await this.state.storage.get('m:' + m); return Response.json(r ? this.mio(r) : {}); }
    /* la meta de la semana: { m, n, k, s } (k: comp, inv, serv, orv; s: de qué forma) */
    if (url.pathname === '/meta') {
      const x = await req.json(), m = String(x.m || ''), k = String(x.k || ''), sub = String(x.s || ''), r = await this.state.storage.get('m:' + m);
      if (!r || !TRIBUS.includes(r.t)) return Response.json({ error: 'sin-tribu' }, { status: 409 });
      if (!META_K[k] || (META_S[k][0] && !META_S[k].includes(sub))) return Response.json({ error: 'meta' }, { status: 400 });
      const wk = semana(); if (!r.w || r.w.wk !== wk) r.w = { wk };
      if ((r.w[k] || 0) >= META_K[k]) return Response.json({ error: 'tope', ...this.mio(r) }, { status: 409 });
      if (k === 'orv' && r.w.dia === hoyAR()) return Response.json({ error: 'hoy', ...this.mio(r) }, { status: 409 });
      r.w[k] = (r.w[k] || 0) + 1; if (k === 'orv') r.w.dia = hoyAR(); r.c = r.c || {}; r.c[k] = (r.c[k] || 0) + 1;
      const titulo = k === 'comp' && r.c.comp === 1; /* la primera vez que comparte de Jesús: «Mensajero» */
      const T = D[r.t], nuevos = this.sumar(r.t, k, 1), nm = String(x.n || '').trim().split(/\s+/)[0].slice(0, 14) || 'Alguien';
      T.feed = [{ n: nm, k, s: sub, at: Date.now() }].concat(T.feed || []).slice(0, 25);
      await this.state.storage.put('m:' + m, r); await this.guardar();
      return Response.json({ ok: 1, pts: PTS[k], nuevos, titulo, ...this.mio(r) });
    }
    if (url.pathname === '/unirse') {
      const x = await req.json(), t = String(x.t || ''), m = String(x.m || ''); if (!TRIBUS.includes(t) || !m) return Response.json({ error: 'tribu' }, { status: 400 });
      const cur = await this.state.storage.get('m:' + m);
      if (cur && cur.t === t) return Response.json(this.mio(cur));
      if (cur && Date.now() - Date.parse(cur.d) < 30 * 864e5) return Response.json({ error: 'reciente', t: cur.t, desde: cur.d, puede: new Date(Date.parse(cur.d) + 30 * 864e5).toISOString().slice(0, 10) }, { status: 409 });
      if (cur) D[cur.t].miembros = Math.max(0, D[cur.t].miembros - 1);
      D[t].miembros++; const d = new Date().toISOString(), nr = { t, d, c: cur ? cur.c : undefined }; await this.state.storage.put('m:' + m, nr); /* lo personal (y el título) lo acompaña; lo de la semana queda en la tribu anterior */
      const nuevos = this.sumar(t, 'miembros', 0); await this.guardar();
      return Response.json({ ...this.mio(nr), nuevos });
    }
    if (url.pathname === '/evento') {
      const x = await req.json(), t = String(x.t || ''), k = String(x.k || ''), n = Math.max(0, Math.min(100, Math.floor(+x.n || 0)));
      if (!TRIBUS.includes(t) || !PTS[k] || !n) return Response.json({ error: 'evento' }, { status: 400 });
      const nuevos = this.sumar(t, k, n); await this.guardar(); return Response.json({ nuevos, lv: nivelDe(D[t].pts), pts: D[t].pts });
    }
    return new Response('No', { status: 404 });
  }
}

/* ---------- quién está conectado (para los amigos) y las charlas de voz ----------
   Guarda en memoria qué perfil está en qué mundo y su id de voz. Solo responde sobre los amigos que figuran en el
   pase de quien pregunta. Las charlas: el anfitrión invita a amigos suyos; los que aceptan se escuchan entre todos. */
export class Amigos {
  constructor(state, env) { this.state = state; this.env = env; this.on = new Map(); this.conv = new Map(); }
  vivo(p) { const x = this.on.get(p); return x && Date.now() - x.t < 3 * 60e3 ? x : null; }
  async mandar(p, msg) { const x = this.vivo(p); if (!x) return false; try { await this.env.MUNDO.get(this.env.MUNDO.idFromName('hero-' + x.mundo)).fetch('https://m/enviar', { method: 'POST', body: JSON.stringify({ p, msg }) }); return true; } catch (e) { return false; } }
  async fetch(req) {
    const path = new URL(req.url).pathname, x = await req.json().catch(() => ({}));
    if (path === '/on') { const cur = this.on.get(x.p) || {}; this.on.set(x.p, { ...cur, n: x.n, mundo: x.mundo, t: Date.now() }); if (this.on.size > 20000) for (const [k, v] of this.on) if (Date.now() - v.t > 3 * 60e3) this.on.delete(k); return Response.json({ ok: 1 }); }
    if (path === '/off') { this.on.delete(x.p); for (const [c, v] of this.conv) if (v.ps.has(x.p)) { v.ps.delete(x.p); for (const q of v.ps.keys()) await this.mandar(q, { t: 'convSale', c, p: x.p }); if (!v.ps.size) this.conv.delete(c); } return Response.json({ ok: 1 }); }
    if (path === '/peer') { const cur = this.on.get(x.p); if (cur) cur.peer = x.peer; return Response.json({ ok: 1 }); }
    if (path === '/quien') { return Response.json({ l: (x.ps || []).map(p => { const v = this.vivo(p); return { p, on: !!v, n: v ? v.n : '', mundo: v ? v.mundo : 0, peer: v ? v.peer || '' : '' }; }) }); }
    if (path === '/enviar') { return Response.json({ ok: await this.mandar(x.to, x.msg) }); }
    if (path === '/conv') {
      const c = 'c' + crypto.randomUUID().replace(/-/g, '').slice(0, 12), ps = new Map([[x.host, { n: x.n, peer: x.peer }]]);
      this.conv.set(c, { host: x.host, inv: new Set(x.to), ps, t: Date.now() }); if (this.conv.size > 2000) { const k = this.conv.keys().next().value; this.conv.delete(k); }
      for (const p of x.to) await this.mandar(p, { t: 'convInv', c, de: x.host, n: x.n });
      await this.mandar(x.host, { t: 'convLista', c, l: [...ps].map(([p, v]) => ({ p, n: v.n, peer: v.peer })) }); return Response.json({ c });
    }
    if (path === '/convSi') {
      const v = this.conv.get(x.c); if (!v || !v.inv.has(x.p) || v.ps.size >= 8) return Response.json({ error: 'conv' });
      v.ps.set(x.p, { n: x.n, peer: x.peer }); const l = [...v.ps].map(([p, w]) => ({ p, n: w.n, peer: w.peer }));
      for (const p of v.ps.keys()) await this.mandar(p, { t: 'convLista', c: x.c, l, nuevo: x.p }); return Response.json({ ok: 1 });
    }
    if (path === '/convFin') { const v = this.conv.get(x.c); if (v && v.ps.has(x.p)) { v.ps.delete(x.p); for (const p of v.ps.keys()) await this.mandar(p, { t: 'convSale', c: x.c, p: x.p }); if (!v.ps.size) this.conv.delete(x.c); } return Response.json({ ok: 1 }); }
    return new Response('No', { status: 404 });
  }
}
