/* El juego guardado en la compu.
   Todo lo que el juego pide de los servidores de archivos (modelos, texturas, música, voces, el código de cada versión)
   pasa por acá: si ya está en el disco se entrega desde el disco, y si no, se baja una vez y queda guardado.
   La primera vez se baja el juego completo de una sola vez (pantalla de descarga); con cada versión nueva, solo lo que cambió.
   La cuenta, el progreso y el pago siguen yendo por internet como siempre. */
const { protocol, session, app, safeStorage } = require('electron');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const REPO = 'galessandrodale93-pixel/tras-sus-pasos-modelos';
const RAW = 'https://raw.githubusercontent.com/' + REPO + '/';
const GH = 'https://rawcdn.githack.com/' + REPO + '/';
const ABASE = 'https://tsp-assets.galessandrodale-93.workers.dev/';
const R2 = 'https://pub-e5804be7c3c34eeca20229d760c593a3.r2.dev/';
const VERSION_API = process.env.KH_VERSION_API || 'https://www.habitat-cfm.org/api/kh-version'; /* KH_VERSION_API y KH_PRUEBA_MAX: solo para probar el programa */
const SITE = 'https://www.habitat-cfm.org';
const R2_PRE = ['grass/', 'palms/', 'trees/'];

const BIN = /\.(glb|gltf|ktx2|webp|jpe?g|png|gif|mp3|ogg|m4a|wav|mp4|webm|wasm|bin|woff2?|ttf|otf|hdr|exr|basis|svg)$/i;
const CODE = /\.(m?js|json|css|html?|txt|tsv)$/i;
const R2OK = /^(tex|hd|ph|hero|promo|app\/(sky|voice|flora|lobby|icons|tex))\/[\w\-./]+\.(glb|ktx2|webp|jpg|jpeg|png|mp3|mp4|wasm|bin)$/i;
const INCLUDE = /^(app|hd|ph|tex|hero)\//;
const EXCLUDE = /\.(md|py|zip|psd|blend|fbx|xcf)$/i;
const CT = { js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', css: 'text/css', html: 'text/html', htm: 'text/html', txt: 'text/plain', tsv: 'text/plain',
  glb: 'model/gltf-binary', gltf: 'model/gltf+json', ktx2: 'image/ktx2', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm', wasm: 'application/wasm', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' };
const ext = u => (u.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();

let DIR, FILES, IDX, idxT = null, DL;
const inflight = new Map();

function loadIdx() { try { IDX = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8')); } catch (e) { IDX = null; } if (!IDX || IDX.v !== 1) IDX = { v: 1, hash: '', done: false, lang: '', e: {} }; }
function saveIdx(now) { clearTimeout(idxT); const w = () => { try { const t = path.join(DIR, 'index.json.tmp'); fs.writeFileSync(t, JSON.stringify(IDX)); fs.renameSync(t, path.join(DIR, 'index.json')); } catch (e) {} }; if (now) w(); else idxT = setTimeout(w, 1500); }
const fileOf = k => path.join(FILES, crypto.createHash('sha1').update(k).digest('hex'));
/* los archivos se guardan cifrados (AES-256-GCM) con una clave propia de cada compu: así los modelos pagos no se pueden
   sacar sueltos y, si alguien toca un archivo, el sello no cierra y el programa vuelve a bajar el original */
const MAGIC = Buffer.from('KHC1');
let KEY = null, KEY_NUEVA = false;
function clave() {
  const kf = path.join(DIR, 'clave'), envolver = () => crypto.createHash('sha256').update('kids&hero|tras-sus-pasos|' + os.userInfo().username + '|' + os.homedir()).digest();
  const usaSS = process.platform === 'win32' && safeStorage.isEncryptionAvailable();
  try {
    const raw = fs.readFileSync(kf);
    if (raw[0] === 1 && usaSS) return Buffer.from(safeStorage.decryptString(raw.subarray(1)), 'hex');
    if (raw[0] === 2) { const iv = raw.subarray(1, 13), tag = raw.subarray(13, 29), d = crypto.createDecipheriv('aes-256-gcm', envolver(), iv); d.setAuthTag(tag); return Buffer.concat([d.update(raw.subarray(29)), d.final()]); }
  } catch (e) {}
  const k = crypto.randomBytes(32); KEY_NUEVA = true;
  try {
    if (usaSS) fs.writeFileSync(kf, Buffer.concat([Buffer.from([1]), safeStorage.encryptString(k.toString('hex'))]));
    else { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', envolver(), iv), x = Buffer.concat([c.update(k), c.final()]); fs.writeFileSync(kf, Buffer.concat([Buffer.from([2]), iv, c.getAuthTag(), x])); }
  } catch (e) {}
  return k;
}
function cifrar(k, b) { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', KEY, iv); c.setAAD(Buffer.from(k)); const x = Buffer.concat([c.update(b), c.final()]); return Buffer.concat([MAGIC, iv, c.getAuthTag(), x]); }
/* leer un archivo guardado; si fue tocado (o es de otra compu) tira error y se vuelve a bajar */
function leer(k) {
  const f = fileOf(k), b = fs.readFileSync(f);
  if (b.length >= 32 && b.subarray(0, 4).equals(MAGIC)) { const d = crypto.createDecipheriv('aes-256-gcm', KEY, b.subarray(4, 16)); d.setAAD(Buffer.from(k)); d.setAuthTag(b.subarray(16, 32)); return Buffer.concat([d.update(b.subarray(32)), d.final()]); }
  /* archivo de la versión 1.1 (sin cifrar): si se puede comprobar contra el original, se cifra; si no coincide, se descarta */
  const e = IDX.e[k]; if (e && e.sha && gitSha(b) !== e.sha) throw new Error('alterado');
  const t = f + '.' + process.pid + '.tmp'; fs.writeFileSync(t, cifrar(k, b)); fs.renameSync(t, f); return b;
}
function descartar(k) { try { fs.unlinkSync(fileOf(k)); } catch (e) {} delete IDX.e[k]; saveIdx(); }
const gitSha = buf => crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex');

/* qué archivo es cada dirección (y si se puede guardar) */
function keyOf(url) {
  const u = url.split('#')[0].split('?')[0];
  let m = u.match(/^https:\/\/(?:rawcdn\.githack\.com|raw\.githack\.com|raw\.githubusercontent\.com)\/galessandrodale93-pixel\/tras-sus-pasos-modelos\/([^/]+)\/(.+)$/);
  if (m) { const p = decodeURIComponent(m[2]); if (BIN.test(p)) return { k: 'r:' + p, mode: 'disk' }; if (CODE.test(p)) return { k: 'h:' + m[1] + ':' + p, mode: /^[0-9a-f]{40}$/.test(m[1]) ? 'disk' : 'net' }; return null; }
  if (u.startsWith(ABASE)) { const p = decodeURIComponent(u.slice(ABASE.length)); if (BIN.test(p)) return { k: 'r:' + p, mode: 'disk' }; if (CODE.test(p)) return { k: 'x:' + u, mode: 'net' }; return null; }
  if (u.startsWith(R2)) { if (BIN.test(u)) return { k: 'x:' + u, mode: 'disk' }; if (CODE.test(u)) return { k: 'x:' + u, mode: 'net' }; return null; }
  if (/^https:\/\/cdn\.jsdelivr\.net\/npm\/[^/]+@\d/.test(u) && (BIN.test(u) || CODE.test(u))) return { k: 'x:' + u, mode: 'disk' };
  if (u.startsWith('https://static.wixstatic.com/media/') && BIN.test(u)) return { k: 'x:' + url.split('#')[0], mode: 'disk' };
  return null;
}

async function bajar(srcs, timeoutMs) {
  for (const src of srcs) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeoutMs || 120000);
    try { const r = await DL.fetch(src, { signal: ctl.signal }); if (!r.ok) continue; const b = Buffer.from(await r.arrayBuffer()); clearTimeout(to); return { b, ct: r.headers.get('content-type') }; }
    catch (e) {} finally { clearTimeout(to); }
  }
  return null;
}
function guardar(k, b, ct, sha) {
  const f = fileOf(k), t = f + '.' + process.pid + '.tmp'; fs.writeFileSync(t, cifrar(k, b)); fs.renameSync(t, f);
  IDX.e[k] = { s: b.length, ct: ct || '', sha: sha || (IDX.e[k] && IDX.e[k].sha) || '' }; saveIdx();
}
function respuesta(b, ct, u) {
  return new Response(b, { status: 200, headers: { 'Content-Type': ct || CT[ext(u)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache', 'Content-Length': String(b.length) } });
}

/* entregar un archivo al juego: del disco si está; si no, bajarlo y guardarlo */
async function servir(orig) {
  const K = keyOf(orig); if (!K) { const r = await bajar([orig]); return r ? respuesta(r.b, r.ct, orig) : new Response('', { status: 502 }); }
  const f = fileOf(K.k), e = IDX.e[K.k]; let hay = e && fs.existsSync(f);
  if (hay && K.mode === 'disk') { try { return respuesta(leer(K.k), e.ct, orig); } catch (er) { descartar(K.k); hay = false; } }
  if (inflight.has(K.k)) { const r = await inflight.get(K.k); if (r) return respuesta(r.b, r.ct, orig); }
  const p = (async () => { const r = await bajar([orig], K.mode === 'net' ? 10000 : 120000); if (r) { try { guardar(K.k, r.b, r.ct); } catch (er) {} } return r; })();
  inflight.set(K.k, p); let r; try { r = await p; } finally { inflight.delete(K.k); }
  if (r) return respuesta(r.b, r.ct, orig);
  if (hay) { try { return respuesta(leer(K.k), e.ct, orig); } catch (er) { descartar(K.k); } }
  return new Response('', { status: 504 });
}

const FILTRO = ['https://rawcdn.githack.com/*', 'https://raw.githack.com/*', 'https://raw.githubusercontent.com/*', ABASE + '*', R2 + '*', 'https://cdn.jsdelivr.net/*', 'https://static.wixstatic.com/*'];

function preparar() {
  protocol.registerSchemesAsPrivileged([{ scheme: 'khc', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, bypassCSP: true } }]);
}
function iniciar() {
  DIR = path.join(app.getPath('userData'), 'juego'); FILES = path.join(DIR, 'archivos'); fs.mkdirSync(FILES, { recursive: true }); loadIdx(); KEY = clave();
  /* clave nueva (se perdió la anterior): lo cifrado con la vieja ya no se puede abrir, se vuelve a bajar en la próxima descarga */
  if (KEY_NUEVA) { let n = 0; for (const k of Object.keys(IDX.e)) { try { const fd = fs.openSync(fileOf(k), 'r'), h = Buffer.alloc(4); fs.readSync(fd, h, 0, 4, 0); fs.closeSync(fd); if (h.equals(MAGIC)) { fs.unlinkSync(fileOf(k)); delete IDX.e[k]; n++; } } catch (e) {} } if (n) { IDX.done = false; saveIdx(true); } }
  DL = session.fromPartition('persist:kh-descargas');
  /* el servidor de los modelos responde como a la web de Habitat */
  DL.webRequest.onBeforeSendHeaders({ urls: [ABASE + '*', R2 + '*'] }, (d, cb) => { d.requestHeaders.Origin = SITE; d.requestHeaders.Referer = SITE + '/'; cb({ requestHeaders: d.requestHeaders }); });
  protocol.handle('khc', req => servir(decodeURIComponent(new URL(req.url).pathname.slice(1))));
  session.defaultSession.webRequest.onBeforeRequest({ urls: FILTRO }, (d, cb) => {
    if (d.method !== 'GET' || !keyOf(d.url)) return cb({});
    cb({ redirectURL: 'khc://a/' + encodeURIComponent(d.url) });
  });
}

/* descargar el juego completo (la primera vez) o solo lo que cambió (en cada versión nueva) */
let SYNC = null;
function sincronizar(prog) { if (!SYNC) SYNC = sync(prog).finally(() => { SYNC = null; }); return SYNC; }
async function getJSON(u, h) { const r = await bajar([u], 20000); if (!r) throw new Error('sin conexión'); return JSON.parse(r.b.toString('utf8')); }
async function sync(prog) {
  prog = prog || (() => {});
  let hash; try { hash = (await getJSON(VERSION_API)).hash; } catch (e) { return { ok: false, offline: true }; }
  if (!/^[0-9a-f]{40}$/.test(hash || '')) return { ok: false };
  if (IDX.hash === hash && IDX.done) return { ok: true, nada: true, hash };
  const primera = !IDX.done; prog({ fase: 'lista', primera });
  const tareas = [];
  try {
    const t = await getJSON('https://api.github.com/repos/' + REPO + '/git/trees/' + hash + '?recursive=1');
    for (const it of t.tree || []) {
      if (it.type !== 'blob' || !INCLUDE.test(it.path) || EXCLUDE.test(it.path)) continue; const p = it.path, bin = BIN.test(p);
      if (!bin && !CODE.test(p)) continue;
      const k = bin ? 'r:' + p : 'h:' + hash + ':' + p, e = IDX.e[k], f = fileOf(k);
      if (e && fs.existsSync(f)) { if (!bin || e.sha === it.sha) continue; if (!e.sha) { try { const s = gitSha(leer(k)); if (s === it.sha) { e.sha = s; continue; } } catch (er) {} } }
      tareas.push({ k, n: it.size || 0, sha: bin ? it.sha : '', srcs: bin && R2OK.test(p) ? [ABASE + p, RAW + hash + '/' + p, GH + hash + '/' + p] : [RAW + hash + '/' + p, GH + hash + '/' + p] });
    }
  } catch (e) {}
  for (const pre of R2_PRE) {
    try { const man = await getJSON(R2 + pre + 'manifest.json'), seen = new Set();
      const walk = v => { if (typeof v === 'string') { if (BIN.test(v) && !/^data:/.test(v)) seen.add(new URL(v, R2 + pre).href.split('?')[0]); } else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
      walk(man);
      for (const u of seen) { if (!u.startsWith(R2)) continue; const k = 'x:' + u; if (IDX.e[k] && fs.existsSync(fileOf(k))) continue; tareas.push({ k, n: 0, srcs: [u] }); }
    } catch (e) {}
  }
  if (+process.env.KH_PRUEBA_MAX) tareas.splice(+process.env.KH_PRUEBA_MAX);
  const tot = tareas.reduce((a, t) => a + t.n, 0); let got = 0, hechos = 0, fallas = 0; const t0 = Date.now();
  prog({ fase: 'bajando', primera, tot, got, n: 0, N: tareas.length });
  const cola = tareas.slice().sort((a, b) => b.n - a.n);
  const una = async () => { while (cola.length) { const t = cola.shift(); let ok = false;
      if (!inflight.has(t.k)) { const r = await bajar(t.srcs); if (r && (!t.n || r.b.length === t.n)) { try { guardar(t.k, r.b, r.ct, t.sha); ok = true; } catch (e) {} } } else ok = !!(await inflight.get(t.k));
      if (!ok) fallas++; hechos++; got += t.n; const s = (Date.now() - t0) / 1000;
      prog({ fase: 'bajando', primera, tot, got, n: hechos, N: tareas.length, vel: got / Math.max(.5, s) }); } };
  await Promise.all(Array.from({ length: 8 }, una));
  /* el código de versiones anteriores ya no hace falta */
  for (const k of Object.keys(IDX.e)) if (k.startsWith('h:') && !k.startsWith('h:' + hash + ':')) { try { fs.unlinkSync(fileOf(k)); } catch (e) {} delete IDX.e[k]; }
  IDX.hash = hash; IDX.done = fallas === 0 || fallas < tareas.length * 0.02; saveIdx(true);
  prog({ fase: 'listo', primera, tot, got, n: hechos, N: tareas.length, fallas });
  return { ok: true, hash, fallas, bajados: hechos };
}
const idioma = l => { if (l && l !== IDX.lang) { IDX.lang = l; saveIdx(); } return IDX.lang || 'es'; };
const listo = () => IDX.done;
module.exports = { preparar, iniciar, sincronizar, idioma, listo };
