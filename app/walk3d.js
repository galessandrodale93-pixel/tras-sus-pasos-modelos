/* Vista 3D del recorrido: el personaje de espaldas camina por el mismo camino del mapa. */
const THREE_URL = window.THREE_URL || 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
let THREE = null, S = null;
const G = () => window.GAME;
const PREF = 'tsp-view';
const WS = 3; // escala del mundo: todo tres veces más grande y espaciado
const SC = 0.06 * WS; // píxeles del mapa → unidades 3D
const toV = (x, y) => [(x - 180) * SC, -y * SC];

function pref() { try { return localStorage.getItem(PREF) || '3d'; } catch (e) { return '3d'; } }
function setPref(v) { try { localStorage.setItem(PREF, v); } catch (e) {} }

/* ---------- utilidades ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bez(P1, P2, t) { // misma curva que edgeD del mapa
  const my = (P1.y + P2.y) / 2, u = 1 - t;
  const x = u * u * u * P1.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P2.x;
  const y = u * u * u * P1.y + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * P2.y;
  return { x, y };
}
/* ---------- camino de Kids: losas irregulares de piedra caliza clara (Poly Haven monastery_stone_floor, KTX2) con juntas de tierra
   y algo de pasto, bordes que se deshacen en el terreno; debajo una franja de tierra más ancha con borde irregular ---------- */
const KPATH = { u: null };
function stonePath(pts, w, stone, y) {
  const pos = [], uv = [], idx = []; let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const nx = -dz * w / 2, nz = dx * w / 2;
    if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); pos.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz); uv.push(0, s, 1, s); if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  if (!KPATH.u) { KPATH.u = { tS: { value: null }, sOn: { value: 0 } }; new THREE.TextureLoader().load(TEXB + 'kpath_stone.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; KPATH.u.tS.value = t; KPATH.u.sOn.value = 1; }); }
  const m = new THREE.MeshStandardMaterial({ color: stone ? '#FFFFFF' : '#D9BE90', roughness: .9, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: stone ? -2 : -1 }), U = KPATH.u, wM = w;
  m.onBeforeCompile = sh => { sh.uniforms.tS = U.tS; sh.uniforms.sOn = U.sOn; sh.vertexShader = 'varying vec2 vPU;varying vec2 vPW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPU=uv;vPW=(modelMatrix*vec4(position,1.)).xz;');
    sh.fragmentShader = 'uniform sampler2D tS;uniform float sOn;varying vec2 vPU;varying vec2 vPW;\nfloat ph(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float pn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ph(i),ph(i+vec2(1,0)),f.x),mix(ph(i+vec2(0,1)),ph(i+vec2(1,1)),f.x),f.y);}\n' +
      sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat e=abs(vPU.x-.5)*2.,n=pn(vPW*' + (stone ? '1.7' : '.9') + ')*.6+pn(vPW*5.3)*.4;if(e>1.-n*' + (stone ? '.42' : '.55') + ')discard;' +
        (stone ? 'if(sOn>.5){vec3 c=texture2D(tS,vec2(vPU.x*' + (wM / 2.2).toFixed(2) + ',vPU.y/2.2)).rgb;float L=dot(c,vec3(.333));diffuseColor.rgb=c*vec3(.98,.96,.92);}' : 'diffuseColor.rgb*=.92+pn(vPW*2.3)*.16;')); };
  m.customProgramCacheKey = () => 'kpath' + stone;
  const me = new THREE.Mesh(geo, m); me.receiveShadow = true; me.renderOrder = stone ? 1 : 0; return me;
}
/* ---------- piedra por región: Cafarnaúm y la orilla del lago en basalto negro; Jerusalén en caliza clara con el campo de Judea más seco ---------- */
function regionStone(scene) {
  const P = S.pois || [], cap = P.find(q => q.k === 'roofhouse'), lake = P.find(q => q.k === 'lake'), jer = P.find(q => q.k === 'upper') || P.find(q => q.k === 'temple');
  if (jer) { const v = SEAS.u.jud.value; v.x = jer.x; v.y = jer.z; v.z = 130; }
  const orig = new Map(); for (const k in PBR) { const m = /^(patterned_clay_plaster|plastered_stone_wall)([\d.]+)x([\d.]+)/.exec(k); if (m) orig.set(PBR[k], [+m[2], +m[3]]); }
  const reg = (x, z) => { if ((cap && Math.hypot(x - cap.x, z - cap.z) < 75) || (lake && Math.hypot(x - lake.x, z - lake.z) < 115)) return 'bas'; if (jer && Math.hypot(x - jer.x, z - jer.z) < 120) return 'lim'; return null; };
  const V = new THREE.Vector3(), swap = new Map();
  scene.traverse(o => { if (!o.isMesh || !o.material) return; const ms = [].concat(o.material); if (!ms.some(m => orig.has(m))) return; o.getWorldPosition(V); const r = reg(V.x, V.z); if (!r) return;
    const nm = ms.map(m => { if (!orig.has(m)) return m; const [rx, ry] = orig.get(m), key = r + rx + 'x' + ry; if (!swap.has(key)) swap.set(key, r === 'bas' ? pbrMat('japanese_stone_wall', rx * 1.15, ry * 1.15, { color: '#8E8A86' }) : pbrMat('white_sandstone_bricks', rx, ry, { color: '#FFFFFF' })); return swap.get(key); });
    o.material = Array.isArray(o.material) ? nm : nm[0]; });
}
function mat(color, opts) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0 }, opts || {})); }
// letreros de Hero: letras de arena (Cinzel 800) con degradé cálido, contorno oscuro, sombra, brillo y grano sutil
function goldPaint(x, txt, cx, cy, f) {
  x.font = `800 ${f}px Cinzel, Fraunces, Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.save(); x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = f * .22; x.shadowOffsetY = f * .08; x.lineWidth = f * .2; x.strokeStyle = '#1f170a'; x.strokeText(txt, cx, cy); x.restore();
  x.lineWidth = f * .07; x.strokeStyle = '#4a3a1c'; x.strokeText(txt, cx, cy);
  const g = x.createLinearGradient(0, cy - f * .5, 0, cy + f * .5); g.addColorStop(0, '#e9d9a6'); g.addColorStop(.5, '#cdb67c'); g.addColorStop(.62, '#b89a5a'); g.addColorStop(1, '#6e5a30');
  x.fillStyle = g; x.fillText(txt, cx, cy);
  // bisel: luz arriba y sombra abajo dentro de la letra, y un brillo diagonal suave
  const w = Math.ceil(x.measureText(txt).width) + f, h = f * 1.6, o = document.createElement('canvas'); o.width = w; o.height = h; const y = o.getContext('2d');
  y.font = x.font; y.textAlign = 'center'; y.textBaseline = 'middle'; y.fillStyle = '#fff'; y.fillText(txt, w / 2, h / 2); y.globalCompositeOperation = 'source-in';
  const s = y.createLinearGradient(0, 0, w, h); s.addColorStop(0, 'rgba(255,248,220,0)'); s.addColorStop(.42, 'rgba(255,248,220,0)'); s.addColorStop(.5, 'rgba(255,248,220,.35)'); s.addColorStop(.58, 'rgba(255,248,220,0)'); s.addColorStop(1, 'rgba(255,248,220,0)'); y.fillStyle = s; y.fillRect(0, 0, w, h);
  x.drawImage(o, cx - w / 2, cy - h / 2);
  { const q = document.createElement('canvas'); q.width = w; q.height = h; const z = q.getContext('2d'); z.font = x.font; z.textAlign = 'center'; z.textBaseline = 'middle'; z.fillStyle = '#fff'; z.fillText(txt, w / 2, h / 2); z.globalCompositeOperation = 'source-in'; let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < w * h / 6; i++) { const v = rnd(); z.fillStyle = v < .5 ? 'rgba(60,40,10,.22)' : 'rgba(255,245,215,.2)'; z.fillRect(rnd() * w, rnd() * h, 1.2, 1.2); } x.drawImage(q, cx - w / 2, cy - h / 2); }
  x.save(); x.beginPath(); x.rect(0, cy - f, x.canvas.width, f * .62); x.clip(); x.lineWidth = f * .025; x.strokeStyle = 'rgba(255,240,190,.6)'; x.strokeText(txt, cx, cy - f * .02); x.restore();
}
function goldSprite(txt) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), f = 44; x.font = `800 ${f}px Cinzel, Fraunces, Georgia, serif`;
  const w = Math.ceil(x.measureText(txt).width) + 48; c.width = w; c.height = 76; goldPaint(x, txt, w / 2, 40, f);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true })); sp.scale.set(w / 76 * .62, .62, 1); return sp;
}
try { document.fonts && document.fonts.load('800 44px Cinzel'); } catch (e) {}
// letreros con letras de un atlas A–Z: Kids usa espuma blanca y Hero, oro romano. Los acentos se redibujan como una marca suave;
// cualquier otro carácter va con la fuente de respaldo
const ATLAS = {
  foam: { file: 'foam-atlas.webp', A: {"h":150,"g":{"A":[2,2,136,150],"B":[142,2,122,150],"C":[268,2,135,150],"D":[407,2,124,150],"E":[535,2,114,150],"F":[653,2,110,150],"G":[767,2,125,150],"H":[896,2,127,150],"I":[1027,2,113,150],"J":[1144,2,116,150],"K":[1264,2,115,150],"L":[1383,2,109,150],"M":[1496,2,185,150],"N":[1685,2,122,150],"O":[1811,2,140,150],"P":[1955,2,120,150],"Q":[2079,2,150,150],"R":[2233,2,121,150],"S":[2358,2,114,150],"T":[2476,2,106,150],"U":[2586,2,119,150],"V":[2709,2,131,150],"W":[2844,2,157,150],"X":[3005,2,130,150],"Y":[3139,2,126,150],"Z":[3269,2,116,150]}}, adv: 10, sp: 50, mark: '#fff', font: '900 40px Nunito, Arial, sans-serif', fill: '#fff', shadow: 'rgba(40,60,90,.5)', bright: 1.18, img: null, ready: false, list: [] },
  roman: { file: 'roman-gold-atlas.webp', A: {"h":150,"g":{"A":[2,2,113,150],"B":[119,2,84,150],"C":[207,2,92,150],"D":[303,2,110,150],"E":[417,2,83,150],"F":[504,2,76,150],"G":[584,2,105,150],"H":[693,2,124,150],"I":[821,2,49,150],"J":[874,2,57,150],"K":[935,2,101,150],"L":[1040,2,82,150],"M":[1126,2,131,150],"N":[1261,2,121,150],"O":[1386,2,110,150],"P":[1500,2,79,150],"Q":[1583,2,112,150],"R":[1699,2,87,150],"S":[1790,2,79,150],"T":[1873,2,100,150],"U":[1977,2,123,150],"V":[2104,2,110,150],"W":[2218,2,154,150],"X":[2376,2,105,150],"Y":[2485,2,110,150],"Z":[2599,2,106,150]}}, adv: 2, sp: 46, mark: '#E8B850', font: '600 40px Cinzel, Georgia, serif', fill: '#E0B050', shadow: 'rgba(0,0,0,.6)', bright: 1, img: null, ready: false, list: [] }
};
function atlasLoad(T) {
  if (T.img) return; const im = new Image(); im.crossOrigin = 'anonymous'; T.img = im; let alt = false;
  im.onload = () => { T.top = atlasTops(T); T.ready = true; T.list.forEach(e => atlasDraw(T, e)); };
  im.onerror = () => { if (alt) return; alt = true; im.src = DLW.root + 'app/lobby/' + T.file; };
  im.src = DLM.r2 + 'app/lobby/' + T.file;
}
// fila donde empieza la tinta de cada letra (para apoyar el acento justo encima)
function atlasTops(T) { const o = {}; try { const c = document.createElement('canvas'), x = c.getContext('2d'); for (const ch in T.A.g) { const [gx, gy, gw, gh] = T.A.g[ch]; c.width = gw; c.height = gh; x.clearRect(0, 0, gw, gh); x.drawImage(T.img, gx, gy, gw, gh, 0, 0, gw, gh); const d = x.getImageData(0, 0, gw, gh).data; let top = 0; outer: for (let y = 0; y < gh; y++) for (let i = 0; i < gw; i++) if (d[(y * gw + i) * 4 + 3] > 60) { top = y; break outer; } o[ch] = top; } } catch (e) {} return o; }
function atlasDraw(T, e) {
  const H = 76, k = 54 / T.A.h, chars = [];
  for (const ch of e.txt.normalize('NFD')) { if (/[̀-ͯ]/.test(ch)) { if (chars.length) chars[chars.length - 1][1] = ch === '̃' ? '~' : '´'; continue; } chars.push([ch.toUpperCase(), null]); }
  const meas = document.createElement('canvas').getContext('2d'); meas.font = T.font;
  const adv = ([c]) => c === ' ' ? T.sp * k : T.A.g[c] ? (T.A.g[c][2] - T.adv) * k : meas.measureText(c).width + 4;
  const w = Math.ceil(chars.reduce((s, c) => s + adv(c), 0) + 40), c = e.c; c.width = w; c.height = H; const x = c.getContext('2d'); x.clearRect(0, 0, w, H);
  const pass = sh => { let px = 20; x.save(); if (sh) { x.shadowColor = T.shadow; x.shadowBlur = 10; x.shadowOffsetY = 4; }
    for (const [ch, ac] of chars) {
      const g = T.A.g[ch];
      if (g) { x.drawImage(T.img, g[0], g[1], g[2], g[3], px, 20, g[2] * k, g[3] * k); }
      else if (ch !== ' ') { x.font = T.font; x.fillStyle = T.fill; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(ch, px, 48); }
      if (ac) { const cx = px + (g ? g[2] * k : 24) / 2 - 2; x.fillStyle = T.mark; x.font = '900 42px Nunito, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const ty = g && T.top && T.top[ch] != null ? 20 + T.top[ch] * k : 26; x.fillText(ac, cx, Math.max(9, ty - (ac === '~' ? 7 : 5))); }
      px += adv([ch]); }
    x.restore(); };
  pass(true); if (T.bright !== 1) { try { x.filter = 'brightness(' + T.bright + ')'; } catch (er) {} } pass(false); try { x.filter = 'none'; } catch (er) {}
  e.t.needsUpdate = true; const m = e.sp.scale.y / .62 || 1; e.sp.scale.set(w / 76 * .62 * m, .62 * m, 1);
}
function atlasSprite(T, txt, fallback) {
  const c = document.createElement('canvas'), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true })), e = { txt, c, t, sp };
  sp.userData.bob = Math.random() * 6.283; T.list.push(e); LBOB.push(sp);
  if (T.ready) atlasDraw(T, e); else { fallback(c, txt); sp.scale.set(c.width / 76 * .62, .62, 1); atlasLoad(T); }
  return sp;
}
const LBOB = [];
const foamSprite = txt => atlasSprite(ATLAS.foam, txt, (c, txt) => { const x = c.getContext('2d'), f = 44; x.font = `800 ${f}px Nunito, Arial, sans-serif`; const w = Math.ceil(x.measureText(txt).width) + 48; c.width = w; c.height = 76; x.font = `800 ${f}px Nunito, Arial, sans-serif`;
  x.fillStyle = 'rgba(255,255,255,.9)'; const r = 30; x.beginPath(); x.moveTo(r, 4); x.arcTo(w - 4, 4, w - 4, 72, r); x.arcTo(w - 4, 72, 4, 72, r); x.arcTo(4, 72, 4, 4, r); x.arcTo(4, 4, w - 4, 4, r); x.fill(); x.fillStyle = '#22407F'; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(txt, w / 2, 40); });
const romanSprite = txt => atlasSprite(ATLAS.roman, txt, (c, txt) => { const x = c.getContext('2d'), f = 44; x.font = `800 ${f}px Cinzel, Georgia, serif`; const w = Math.ceil(x.measureText(txt).width) + 48; c.width = w; c.height = 76; goldPaint(x, txt, w / 2, 40, f); });
// vaivén suave (solo en Kids)
function foamTick(t) { if (!ATLAS.foam.list.length) return; for (const e of ATLAS.foam.list) { const s = e.sp; if (!s.parent) continue; if (s.userData.by === undefined) s.userData.by = s.position.y; s.position.y = s.userData.by + Math.sin(t * 1.3 + s.userData.bob) * .06; } }
function textSprite(txt, hx) {
  if (hx) return romanSprite(txt);
  if (G().branch !== 'ados') return foamSprite(txt);
  const c = document.createElement('canvas'), x = c.getContext('2d'), f = 44;
  x.font = `800 ${f}px Nunito, Arial, sans-serif`;
  const w = Math.ceil(x.measureText(txt).width) + 48; c.width = w; c.height = 76;
  x.font = `800 ${f}px Nunito, Arial, sans-serif`;
  x.fillStyle = hx ? 'rgba(14,12,9,.82)' : 'rgba(255,255,255,.9)';
  const r = 30; x.beginPath(); x.moveTo(r, 4); x.arcTo(w - 4, 4, w - 4, 72, r); x.arcTo(w - 4, 72, 4, 72, r); x.arcTo(4, 72, 4, 4, r); x.arcTo(4, 4, w - 4, 4, r); x.fill();
  x.fillStyle = hx ? '#F1D7A2' : '#22407F'; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(txt, w / 2, 40);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }));
  sp.scale.set(w / 76 * .62, .62, 1); return sp;
}

/* ---------- objetos para juntar ---------- */
export const ITEMS = [
  { id: 'estrella', r: 0, name: 'Estrella de Belén', desc: 'La estrella que guió a los magos hasta el niño.', ref: 'Mateo 2:9-10', k: 'star' },
  { id: 'paja', r: 0, name: 'Paja del pesebre', desc: 'María acostó a Jesús en un pesebre porque no había lugar para ellos.', ref: 'Lucas 2:7', k: 'hay' },
  { id: 'mirra', r: 0, name: 'Frasco de mirra', desc: 'Uno de los regalos de los magos, un perfume muy valioso.', ref: 'Mateo 2:11', k: 'jar' },
  { id: 'cayado', r: 0, name: 'Cayado de pastor', desc: 'Los pastores cuidaban sus rebaños de noche cuando apareció el ángel.', ref: 'Lucas 2:8', k: 'staff' },
  { id: 'tortolas', r: 1, name: 'Pluma de tórtola', desc: 'José y María ofrecieron dos tórtolas en el templo.', ref: 'Lucas 2:24', k: 'feather' },
  { id: 'martillo', r: 1, name: 'Martillo de carpintero', desc: 'Jesús creció en la casa de José, el carpintero de Nazaret.', ref: 'Mateo 13:55', k: 'hammer' },
  { id: 'rollo', r: 1, name: 'Rollo de las Escrituras', desc: 'En el templo, Jesús escuchaba y preguntaba a los maestros.', ref: 'Lucas 2:46', k: 'scroll' },
  { id: 'sandalias', r: 1, name: 'Sandalias de viaje', desc: 'Cada año la familia viajaba a Jerusalén para la Pascua.', ref: 'Lucas 2:41', k: 'sandal' },
  { id: 'cinturon', r: 2, name: 'Cinturón de cuero', desc: 'Juan se vestía con pelo de camello y un cinturón de cuero.', ref: 'Mateo 3:4', k: 'belt' },
  { id: 'panal', r: 2, name: 'Panal de miel silvestre', desc: 'Juan comía langostas y miel silvestre en el desierto.', ref: 'Mateo 3:4', k: 'honey' },
  { id: 'cantaro', r: 2, name: 'Cántaro del Jordán', desc: 'Mucha gente se bautizaba en el río Jordán.', ref: 'Mateo 3:5-6', k: 'jar2' },
  { id: 'pluma', r: 2, name: 'Pluma blanca', desc: 'El Espíritu de Dios descendió sobre Jesús como una paloma.', ref: 'Mateo 3:16', k: 'feather2' }
];
const ITEM_PTS = 25;
function itemMesh(k) {
  const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: '#FFD873', emissive: '#FFB43C', emissiveIntensity: .7, roughness: .35, metalness: .3 });
  const m = (geo, color, e) => new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: e ?? .25, roughness: .6 }));
  if (k === 'star') { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.32, 0), gold); s.scale.set(1, 1.3, .5); g.add(s); }
  else if (k === 'hay') { for (let i = 0; i < 7; i++) { const b = m(new THREE.CylinderGeometry(.015, .015, .6, 4), '#E8C66A'); b.rotation.z = (i - 3) * .15; b.rotation.x = (i % 2 - .5) * .3; g.add(b); } }
  else if (k === 'jar' || k === 'jar2') { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(.12 + Math.sin(t * Math.PI) * .14 - (t > .85 ? .08 : 0), t * .5 - .25)); } g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 16), new THREE.MeshStandardMaterial({ color: k === 'jar' ? '#B46A3C' : '#C98C5A', roughness: .7, emissive: '#3A1E10', emissiveIntensity: .3 }))); }
  else if (k === 'staff') { const s = m(new THREE.CylinderGeometry(.025, .03, .9, 6), '#8B5B32'); g.add(s); const h = m(new THREE.TorusGeometry(.1, .025, 6, 12, Math.PI), '#8B5B32'); h.position.set(.1, .45, 0); g.add(h); g.rotation.z = .3; }
  else if (k === 'feather' || k === 'feather2') { const f = m(new THREE.SphereGeometry(.2, 10, 8), k === 'feather' ? '#C9B8A0' : '#FFFFFF', .5); f.scale.set(.35, 1.2, .08); g.add(f); g.rotation.z = .5; }
  else if (k === 'hammer') { const h = m(new THREE.CylinderGeometry(.025, .025, .55, 6), '#8B5B32'); g.add(h); const hd = m(new THREE.BoxGeometry(.24, .08, .08), '#8C8C8C'); hd.position.y = .27; g.add(hd); }
  else if (k === 'scroll') { const r = m(new THREE.CylinderGeometry(.07, .07, .5, 12), '#EADBB4'); r.rotation.z = Math.PI / 2; g.add(r); [-1, 1].forEach(s => { const e = m(new THREE.CylinderGeometry(.03, .03, .12, 8), '#8B5B32'); e.rotation.z = Math.PI / 2; e.position.x = s * .3; g.add(e); }); }
  else if (k === 'sandal') { [-1, 1].forEach(s => { const so = m(new THREE.BoxGeometry(.14, .03, .36), '#9A6A3E'); so.position.x = s * .1; g.add(so); const st = m(new THREE.TorusGeometry(.07, .015, 6, 12, Math.PI), '#6B4A2A'); st.position.set(s * .1, .02, .05); st.rotation.y = Math.PI / 2; g.add(st); }); g.rotation.x = -.6; }
  else if (k === 'belt') { const b = m(new THREE.TorusGeometry(.2, .035, 8, 24), '#7A4E2A'); b.rotation.x = Math.PI / 2.4; g.add(b); }
  else if (k === 'honey') { const h = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .12, 6), gold); g.add(h); }
  const halo = new THREE.Mesh(new THREE.RingGeometry(.42, .5, 32), new THREE.MeshBasicMaterial({ color: '#FFE39A', transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = -.65; g.add(halo);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), new THREE.MeshBasicMaterial({ color: '#FFD873', transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(glow);
  g.userData.halo = halo; return g;
}
export const ICONS = {
  star: '<path d="M12 2l2.6 6.6L21 9.3l-5 4.5L17.4 21 12 17.3 6.6 21 8 13.8 3 9.3l6.4-.7Z" fill="#FFD25E"/>',
  hay: '<path d="M7 20L10 4M10 20L11 4M13 20L13 4M15 20L14 4M17 20L16 5" stroke="#E8C66A" stroke-width="1.8" stroke-linecap="round"/><path d="M7 14h11" stroke="#B9923A" stroke-width="2"/>',
  jar: '<path d="M9 3h6v2l-1 1c3 2 4 5 4 8 0 4-3 7-6 7s-6-3-6-7c0-3 1-6 4-8L9 5Z" fill="#B46A3C"/>',
  jar2: '<path d="M9 3h6v2l-1 1c3 2 4 5 4 8 0 4-3 7-6 7s-6-3-6-7c0-3 1-6 4-8L9 5Z" fill="#C98C5A"/><path d="M7 13h10" stroke="#7FC4F0" stroke-width="2"/>',
  staff: '<path d="M9 22L12 6c.5-3 5-3 5 0" stroke="#8B5B32" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  feather: '<path d="M19 3C10 4 6 11 5 21c4-7 9-9 11-13 1-2 2-3 3-5Z" fill="#C9B8A0"/><path d="M5 21L15 8" stroke="#8C7A62" stroke-width="1.2"/>',
  feather2: '<path d="M19 3C10 4 6 11 5 21c4-7 9-9 11-13 1-2 2-3 3-5Z" fill="#F4F4FA"/><path d="M5 21L15 8" stroke="#B8B8C8" stroke-width="1.2"/>',
  hammer: '<path d="M10 10l9 10" stroke="#8B5B32" stroke-width="2.6" stroke-linecap="round"/><path d="M4 7l5-4 5 5-5 4Z" fill="#9AA0A8"/>',
  scroll: '<rect x="5" y="7" width="14" height="10" rx="2" fill="#EADBB4"/><rect x="3" y="6" width="3" height="12" rx="1.5" fill="#8B5B32"/><rect x="18" y="6" width="3" height="12" rx="1.5" fill="#8B5B32"/><path d="M8 10h8M8 13h6" stroke="#9A8A6A" stroke-width="1.2"/>',
  sandal: '<ellipse cx="9" cy="13" rx="3" ry="7" fill="#9A6A3E"/><ellipse cx="16" cy="12" rx="3" ry="7" fill="#9A6A3E"/><path d="M6 11h6M13 10h6" stroke="#5A3A1E" stroke-width="1.6"/>',
  belt: '<circle cx="12" cy="12" r="7" fill="none" stroke="#7A4E2A" stroke-width="3"/><rect x="15" y="10" width="5" height="4" rx="1" fill="#C9A04A"/>',
  honey: '<path d="M12 3l7 4v10l-7 4-7-4V7Z" fill="#FFC23D"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4Z" fill="#E09A1E"/>'
};

/* ---------- personaje ---------- */
function buildAvatar(av, hx) {
  const g = new THREE.Group();
  const D = gearOn(av), skin = mat(av.skin || '#E6B691'), hair = mat(av.hair || '#2A1B14', { roughness: .7 }), shirt = mat(D.shirt ? D.shirt.c : (av.outfit || '#5B8DEF')), pants = mat(D.pants ? D.pants.c : (hx ? '#3A3226' : '#34426E')), shoe = mat(D.boots ? D.boots.c : (hx ? '#2A1E14' : '#2B2B3A')), handM = D.gloves ? mat(D.gloves.c) : skin;
  const kid = (av.age || 12) < 12, k = kid ? .88 : 1;
  const hip = new THREE.Group(); hip.position.y = .78 * k; g.add(hip);
  const leg = (sx) => { const l = new THREE.Group(); l.position.set(sx * .13, 0, 0); const th = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .5 * k, 4, 10), pants); th.position.y = -.33 * k; l.add(th); const sh = new THREE.Mesh(new THREE.BoxGeometry(.17, .1, .3), shoe); sh.position.set(0, -.72 * k, .05); l.add(sh); hip.add(l); return l; };
  const L = leg(-1), R = leg(1);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .38 * k, 6, 14), shirt); torso.position.y = .36 * k; hip.add(torso);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .06, 16), mat(hx ? '#5A3E22' : '#2E4CB0')); belt.position.y = .1; hip.add(belt);
  const arm = (sx) => { const a = new THREE.Group(); a.position.set(sx * .32, .58 * k, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .42 * k, 4, 10), shirt); m.position.y = -.24 * k; a.add(m); const h = new THREE.Mesh(new THREE.SphereGeometry(.085, 12, 10), handM); h.position.y = -.5 * k; a.add(h); hip.add(a); return a; };
  const AL = arm(-1), AR = arm(1);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.08, .09, .1, 10), skin); neck.position.y = .72 * k; hip.add(neck);
  const head = new THREE.Group(); head.position.y = 1.0 * k; hip.add(head);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.25, 24, 18), skin); hd.scale.set(1, 1.06, 1); head.add(hd);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.265, 24, 16, 0, Math.PI * 2, 0, Math.PI * .55), hair); cap.position.y = .03; cap.rotation.x = -.25; head.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(.255, 20, 14), hair); back.scale.set(1, .9, .7); back.position.set(0, -.02, -.1); head.add(back);
  if (av.g === 'chica') { const pony = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .28, 4, 8), hair); pony.position.set(0, -.12, -.3); pony.rotation.x = .5; head.add(pony); const tie = new THREE.Mesh(new THREE.TorusGeometry(.06, .02, 8, 14), mat('#FFCF5C')); tie.position.set(0, .02, -.27); tie.rotation.x = 1.2; head.add(tie); }
  const eyeM = mat('#1A2B57'); [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 8), eyeM); e.position.set(s * .085, .02, .23); head.add(e); });
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), skin); e.position.set(s * .25, 0, 0); head.add(e); });
  let lamp = null;
  if (hx) { // mochila, correas y farol
    const pack = new THREE.Mesh(new THREE.BoxGeometry(.38, .44, .2), mat('#6B4A2A')); pack.position.set(0, .4 * k, -.27); hip.add(pack);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(.39, .14, .22), mat('#57391E')); flap.position.set(0, .58 * k, -.27); hip.add(flap);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .42, 12), mat('#8A6A44')); roll.rotation.z = Math.PI / 2; roll.position.set(0, .66 * k, -.3); hip.add(roll);
    [-1, 1].forEach(s => { const st = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .05), mat('#4A321C')); st.position.set(s * .14, .42 * k, .2); hip.add(st); });
    lamp = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .13, 10), mat('#C9A04A', { metalness: .4, roughness: .4 })); lamp.add(body);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFD27A' })); lamp.add(glow);
    lamp.position.set(0, -.6 * k, .06); AR.add(lamp);
    const pl = new THREE.PointLight('#FFB45A', 6, 7, 1.6); pl.position.set(0, 0, 0); lamp.add(pl);
  } else { // bufanda y mochilita
    const sc = new THREE.Mesh(new THREE.TorusGeometry(.17, .05, 8, 18), mat('#FFCF5C')); sc.rotation.x = Math.PI / 2; sc.position.y = .7 * k; hip.add(sc);
    const pack = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .14, 4, 10), mat('#FF8A2B')); pack.position.set(0, .4 * k, -.26); hip.add(pack);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: hx ? .45 : .2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; g.add(shadow);
  dressKid(D, { head, M: c => mat(c) });
  g.userData = { L, R, AL, AR, hip, head, k };
  return g;
}
function animAvatar(av, t, moving, dt) {
  if (av.userData.h3) { av.userData.h3.moving = moving; return; }
  if (av.userData.hero) return animHero(av, t, moving, dt);
  const u = av.userData, s = moving ? Math.sin(t * 9) : 0, a = moving ? .6 : .05;
  u.L.rotation.x = s * a; u.R.rotation.x = -s * a; u.AL.rotation.x = -s * a * .9; u.AR.rotation.x = s * a * .9 - (S && S.hx ? .3 : 0);
  u.hip.position.y = .78 * u.k + (moving ? Math.abs(Math.cos(t * 9)) * .06 : Math.sin(t * 2) * .012);
  u.head.rotation.y = moving ? 0 : Math.sin(t * .7) * .25;
}

/* ---------- personaje Hero: proporciones humanas y ropa de la época ---------- */
function buildHeroAvatar(av) {
  if (H3.ok) return buildHero3(av);
  const g = new THREE.Group(), girl = av.g === 'chica', age = av.age || 14, k = .9 + Math.min(18, Math.max(12, age)) / 18 * .1;
  const M = (c, r, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r ?? .9, metalness: 0 }, o || {}));
  const D = gearOn(av), base = new THREE.Color(av.outfit || '#2FAE7C'), tunicC = D.shirt ? new THREE.Color(D.shirt.c) : base.clone().lerp(new THREE.Color('#B8A27A'), .5), mantleC = base.clone().lerp(new THREE.Color('#3E2C20'), .8);
  const skin = M(av.skin || '#E6B691', .62), hairM = M(av.hair || '#2A1B14', .75), tunic = M(tunicC, .95), under = M('#D9C8A6', .95), mantle = M(mantleC, .96, { side: THREE.DoubleSide }), sash = M('#8E3B2A', .9), leather = M('#6A4528', .85), sole = M('#3E2A18', .9);
  const lathe = (pts, mtl, seg = 20) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), mtl);
  const hip = new THREE.Group(); hip.position.y = .92 * k; g.add(hip);
  // piernas con rodilla
  const leg = sx => { const top = new THREE.Group(); top.position.set(sx * .1, -.02, 0); hip.add(top);
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(.068, .34 * k, 6, 12), under); th.position.y = -.22 * k; top.add(th);
    const knee = new THREE.Group(); knee.position.y = -.45 * k; top.add(knee);
    const sh = new THREE.Mesh(new THREE.CapsuleGeometry(.056, .34 * k, 6, 12), skin); sh.position.y = -.21 * k; knee.add(sh);
    const foot = new THREE.Group(); foot.position.y = -.43 * k; knee.add(foot);
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(.11, .025, .25), sole); s1.position.set(0, -.012, .05); foot.add(s1);
    const ft = new THREE.Mesh(new THREE.CapsuleGeometry(.045, .12, 4, 8), skin); ft.rotation.x = Math.PI / 2; ft.position.set(0, .03, .06); foot.add(ft);
    const straps = [.0, .09].map(z => { const st = new THREE.Mesh(new THREE.TorusGeometry(.05, .009, 6, 12, Math.PI), leather); st.position.set(0, .03, z); st.rotation.y = Math.PI / 2; foot.add(st); return st; });
    const lace = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .02, 12, 1, true), leather); lace.position.y = .1; foot.add(lace); straps.push(lace);
    return { top, knee, th, sh, foot, ft, straps }; };
  const L = leg(-1), R = leg(1);
  // túnica: falda hasta la rodilla y torso
  const skirt = lathe([[.0, -.52 * k], [.27, -.52 * k], [.24, -.3 * k], [.2, -.05], [.19, .04]], tunic); hip.add(skirt);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(.268, .012, 6, 28), sash); hem.rotation.x = Math.PI / 2; hem.position.y = -.5 * k; hip.add(hem);
  const chest = new THREE.Group(); chest.position.y = .04; hip.add(chest);
  const torso = lathe([[.0, 0], [.19, 0], [.205, .12], girl ? [.205, .3] : [.215, .3], [.2, .42], [.14, .5], [.06, .53], [0, .53]].map(p => [p[0], p[1] * k]), tunic, 24); torso.scale.z = .72; chest.add(torso);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(.198, .03, 8, 28), sash); belt.rotation.x = Math.PI / 2; belt.scale.y = .72; belt.position.y = .03; chest.add(belt);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(.06, .16, .02), sash); knot.position.set(.1, -.06, .145); knot.rotation.z = .2; chest.add(knot);
  // manto cruzado sobre un hombro y caída por la espalda
  const cloak = new THREE.Group(); cloak.position.set(0, .5 * k, -.1); chest.add(cloak);
  const cg = new THREE.CylinderGeometry(.24, .34, 1.02 * k, 18, 6, true, Math.PI * .6, Math.PI * .8); cg.translate(0, -.5 * k, 0);
  const cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) { const y = cp.getY(i), x = cp.getX(i); cp.setZ(i, cp.getZ(i) + Math.sin(x * 18 + y * 3) * .012); } cg.computeVertexNormals();
  cg.dispose(); // sin capa: el grupo queda vacío para no tocar la animación
  // bolso de cuero cruzado
  const strap = new THREE.Mesh(new THREE.TorusGeometry(.26, .014, 6, 30), leather); strap.position.set(0, .26 * k, 0); strap.rotation.set(0, 0, .9); strap.scale.z = .62; chest.add(strap);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(.2, .17, .07), leather); bag.position.set(-.21, -.05, .03); bag.rotation.y = -.5; chest.add(bag);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(.205, .08, .075), M('#57391E', .85)); flap.position.set(-.21, .02, .035); flap.rotation.y = -.5; chest.add(flap);
  // brazos con codo
  const arm = sx => { const sh = new THREE.Group(); sh.position.set(sx * .245, .46 * k, 0); chest.add(sh);
    const sl = lathe([[.0, 0], [.072, 0], [.075, -.1], [.08, -.24 * k], [0, -.24 * k]], tunic, 12); sh.add(sl);
    const ua = new THREE.Mesh(new THREE.CapsuleGeometry(.048, .2 * k, 4, 10), skin); ua.position.y = -.17 * k; sh.add(ua);
    const el = new THREE.Group(); el.position.y = -.3 * k; sh.add(el);
    const fa = new THREE.Mesh(new THREE.CapsuleGeometry(.042, .2 * k, 4, 10), skin); fa.position.y = -.13 * k; el.add(fa);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(.045, .01, 6, 12), leather); cuff.rotation.x = Math.PI / 2; cuff.position.y = -.2 * k; el.add(cuff);
    const hand = new THREE.Group(); hand.position.y = -.28 * k; el.add(hand);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(.048, 12, 10), skin); palm.scale.set(.8, 1.1, .55); hand.add(palm);
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(.016, .04, 3, 6), skin); th.position.set(-sx * .035, .0, .02); th.rotation.z = sx * .6; hand.add(th);
    return { sh, el, hand, palm, th, fa }; };
  const AL = arm(-1), AR = arm(1);
  // cuello y cabeza
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.05, .058, .11, 12), skin); neck.position.y = .57 * k; chest.add(neck);
  const head = new THREE.Group(); head.position.y = .7 * k; chest.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.112, 28, 22), skin); skull.scale.set(.92, 1.1, 1); head.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.088, 20, 14), skin); jaw.scale.set(.9, .8, .95); jaw.position.set(0, -.06, .02); head.add(jaw);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.018, .05, 8), skin); nose.position.set(0, -.012, .112); nose.rotation.x = Math.PI / 2 + .35; head.add(nose);
  const white = M('#F2EDE4', .35), iris = M('#3A2716', .3);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.017, 12, 10), white); e.scale.set(1.3, .8, .6); e.position.set(s * .04, .018, .096); head.add(e);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(.009, 10, 8), iris); ir.position.set(s * .04, .018, .106); head.add(ir);
    const br = new THREE.Mesh(new THREE.BoxGeometry(.04, .008, .012), hairM); br.position.set(s * .042, .044, .1); br.rotation.z = s * -.12; head.add(br);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.025, 10, 8), skin); ear.scale.set(.5, 1, .8); ear.position.set(s * .1, 0, -.005); head.add(ear); });
  const lip = new THREE.Mesh(new THREE.CapsuleGeometry(.006, .03, 3, 6), M(new THREE.Color(av.skin || '#E6B691').multiplyScalar(.75), .6)); lip.rotation.z = Math.PI / 2; lip.position.set(0, -.058, .098); head.add(lip);
  // pelo
  const capH = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 16, 0, Math.PI * 2, 0, Math.PI * .5), hairM); capH.scale.set(.95, 1.05, 1.05); capH.position.set(0, .012, -.008); capH.rotation.x = -.22; head.add(capH);
  if (girl) {
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .3, 6, 14), hairM); back.scale.set(1.05, 1, .5); back.position.set(0, -.15, -.07); head.add(back);
    var veil = new THREE.Mesh(new THREE.SphereGeometry(.135, 24, 16, Math.PI * .1, Math.PI * 1.8, 0, Math.PI * .62), M('#D8CBB2', .95, { side: THREE.DoubleSide })); veil.rotation.y = Math.PI; veil.position.set(0, .01, -.01); head.add(veil);
    var vb = new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, .32, 18, 1, true, Math.PI * .7, Math.PI * .6), M('#D8CBB2', .95, { side: THREE.DoubleSide })); vb.position.set(0, -.18, -.02); head.add(vb);
  } else {
    var curls = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, c = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), hairM); c.position.set(Math.cos(a) * .1, .05 + Math.sin(i * 1.7) * .02, Math.sin(a) * .1 - .01); if (c.position.z > .07) c.position.y += .02; head.add(c); curls.push(c); }
    var band = new THREE.Mesh(new THREE.TorusGeometry(.117, .012, 6, 28), sash); band.rotation.x = Math.PI / 2 - .22; band.position.y = .045; head.add(band);
  }
  // farol en la mano derecha
  const lamp = new THREE.Group(); lamp.position.set(0, -.11, .02); AR.hand.add(lamp);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .006, 6, 12), M('#3A2A1A', .5, { metalness: .5 })); ring.position.y = .02; lamp.add(ring);
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .12, 8), M('#B8862E', .4, { metalness: .6 })); lb.position.y = -.07; lamp.add(lb);
  const gl = new THREE.Mesh(new THREE.SphereGeometry(.034, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFD27A' })); gl.position.y = -.07; lamp.add(gl);
  const pl = new THREE.PointLight('#FFB45A', 5, 7, 1.6); pl.position.y = -.07; lamp.add(pl);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.36, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .3, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; g.add(shadow);
  dressHero(D, M, k, { hip, chest, head, L, R, AL, AR, hideHair: () => { [veil, vb, band].forEach(o => { if (o) o.visible = false; }); (curls || []).forEach(o => { if (o.position.y > .05) o.visible = false; }); } });
  g.userData = { hero: true, L, R, AL, AR, hip, chest, head, cloak, k, ph: 0 };
  return g;
}
function animHero(av, t, moving, dt) {
  const u = av.userData; u.w = (u.w || 0) + ((moving ? 1 : 0) - (u.w || 0)) * Math.min(1, (dt || .016) * 8); const w = u.w;
  u.ph += (dt || .016) * (moving ? 9.5 : 0); const p = u.ph, s = Math.sin(p), c = Math.cos(p);
  const swing = .62 * w;
  u.L.top.rotation.x = s * swing; u.R.top.rotation.x = -s * swing;
  u.L.knee.rotation.x = Math.max(0, -Math.cos(p - .6)) * 1.0 * w + .02; u.R.knee.rotation.x = Math.max(0, Math.cos(p - .6)) * 1.0 * w + .02;
  u.AL.sh.rotation.x = -s * .55 * w; u.AR.sh.rotation.x = s * .45 * w - .15;
  u.AL.el.rotation.x = -(.25 + Math.max(0, s) * .45 * w); u.AR.el.rotation.x = -(.55 + Math.max(0, -s) * .3 * w);
  u.AL.sh.rotation.z = -.06; u.AR.sh.rotation.z = .06;
  u.hip.position.y = .92 * u.k + Math.abs(c) * .045 * w - .02 * w + (1 - w) * Math.sin(t * 1.8) * .006;
  u.hip.rotation.y = s * .12 * w; u.chest.rotation.y = -s * .18 * w; u.chest.rotation.x = .06 * w + (1 - w) * Math.sin(t * 1.8) * .012;
  u.chest.rotation.z = c * .03 * w;
  u.cloak.rotation.x = .12 + w * (.25 + Math.sin(p * 2) * .05) + Math.sin(t * 1.3) * .03;
  u.head.rotation.y = (1 - w) * Math.sin(t * .6) * .35; u.head.rotation.x = -.04 * w;
}

/* ---------- escenario ---------- */
// junta cajas en una sola geometría (menos dibujos por casa)
function mergeBoxes(list) {
  const P = [], N = [], U = [], M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3(1, 1, 1);
  for (const [w, h, d, x, y, z, ry] of list) { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); M4.compose(V.set(x, y, z), Q.setFromEuler(E.set(0, ry || 0, 0)), Sc); g.applyMatrix4(M4);
    // UV en metros para que la piedra no se estire
    const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv; for (let i = 0; i < pa.count; i++) { const ax = Math.abs(na.getX(i)), ay = Math.abs(na.getY(i)); ua.setXY(i, (ax > .5 ? pa.getZ(i) : pa.getX(i)) * .45, (ay > .5 ? pa.getZ(i) : pa.getY(i)) * .45); }
    P.push(...pa.array); N.push(...na.array); U.push(...ua.array); g.dispose(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeBoundingSphere(); return g;
}
// casa de pueblo a escala real: la puerta mide 2,3 m (bastante más alta que el personaje)
const HOUSEM = {};
let HCOLS = [];
function house(R, hx) {
  const g = new THREE.Group(), r0 = R(), w = 4.4 + r0 * 1.6, d = w * (.78 + hsh(r0, 3) * .15), h = 3 + hsh(r0, 7) * .5, t = .3, dw = 1.15, dh = 2.3, k = hx ? 'h' : 'k';
  const T = townTex(), wm = HOUSEM['w' + k] || (HOUSEM['w' + k] = pbrMat('patterned_clay_plaster', .7, .7, { color: hx ? '#F2E8DA' : '#FFFFFF' })),
    wd = HOUSEM['d' + k] || (HOUSEM['d' + k] = new THREE.MeshStandardMaterial({ color: hx ? '#6B4A2C' : '#8A5E36', roughness: .85 })),
    dk = HOUSEM['k' + k] || (HOUSEM['k' + k] = new THREE.MeshStandardMaterial({ color: hx ? '#2A2016' : '#4A3826', roughness: 1, emissive: hx ? '#3A2408' : '#000000', emissiveIntensity: .4 }));
  const sw = (w - dw) / 2, W = [[w, h, t, 0, h / 2, -d / 2 + t / 2], [t, h, d, -w / 2 + t / 2, h / 2, 0], [t, h, d, w / 2 - t / 2, h / 2, 0],
    [sw, h, t, -w / 2 + sw / 2, h / 2, d / 2 - t / 2], [sw, h, t, w / 2 - sw / 2, h / 2, d / 2 - t / 2], [dw, h - dh, t, 0, dh + (h - dh) / 2, d / 2 - t / 2],
    [w + .1, .18, d + .1, 0, h + .02, 0], [w + .1, .35, .2, 0, h + .27, d / 2 - .05], [w + .1, .35, .2, 0, h + .27, -d / 2 + .05], [.2, .35, d - .3, -w / 2 + .05, h + .27, 0], [.2, .35, d - .3, w / 2 - .05, h + .27, 0],
    [w + .5, 1.2, d + .5, 0, -.55, 0]];
  const body = new THREE.Mesh(mergeBoxes(W), wm); body.castShadow = body.receiveShadow = true; g.add(body);
  const nb = Math.max(4, Math.round(w / .8)), B = [[dw + .3, .16, t + .14, 0, dh + .08, d / 2 - t / 2]]; for (let i = 0; i < nb; i++) B.push([.14, .14, .55, -w / 2 + .35 + i * (w - .7) / (nb - 1), h - .25, d / 2 + .12]);
  B.push([dw - .08, dh - .04, .06, (dw - .08) / 2, dh / 2, 0, 0]);
  const wood = new THREE.Mesh(mergeBoxes(B.slice(0, -1)), wd); wood.castShadow = true; g.add(wood);
  const door = new THREE.Mesh(new THREE.BoxGeometry(dw - .08, dh - .04, .06), wd); door.position.set(-dw / 2 + .04 + (dw - .08) / 2, dh / 2, d / 2 - t - .02); g.add(door);
  const win = new THREE.Mesh(mergeBoxes([[.62, .55, .06, -w * .3, 1.85, d / 2 + .005], [.62, .55, .06, w * .3, 1.85, d / 2 + .005], [.06, .55, .62, w / 2 + .005, 1.85, 0]]), dk); g.add(win);
  g.userData.box = [-w / 2 - .1, w / 2 + .1, -d / 2 - .1, d / 2 + .1]; g.userData.house = 1; return g;
}
function palm(R) { const g = new THREE.Group(), h = 2 + R(); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, h / 6, 7), mat('#8B6A44')); s.position.set(Math.sin(i * .3) * .1, h / 12 + i * h / 6, 0); g.add(s); } const lm = mat('#3E8E4A', { side: THREE.DoubleSide }); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.35, 1.3), lm); l.position.y = h; l.rotation.set(-1.0, i / 6 * Math.PI * 2, 0, 'YXZ'); l.translateY(.55); g.add(l); } return g; }
function pillar(R) { const g = new THREE.Group(), h = 1 + R() * 1.6; const p = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, h, 10), mat('#7D7461')); p.position.y = h / 2; p.rotation.z = (R() - .5) * .15; g.add(p); const top = new THREE.Mesh(new THREE.BoxGeometry(.55, .14, .55), mat('#6E6553')); top.position.y = h; g.add(top); return g; }

/* ---------- mundo Hero: luz de atardecer, cielo, relieve y vegetación ---------- */
const hsh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = hsh(xi, yi), b = hsh(xi + 1, yi), c = hsh(xi, yi + 1), d = hsh(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y) => vnoise(x, y) * .5 + vnoise(x * 2.07, y * 2.07) * .25 + vnoise(x * 4.13, y * 4.13) * .125 + vnoise(x * 8.3, y * 8.3) * .0625;
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function noiseTex(size, fn, rep) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), im = x.createImageData(size, size); for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const v = fn(i, j), k = (j * size + i) * 4; im.data[k] = v[0]; im.data[k + 1] = v[1]; im.data[k + 2] = v[2]; im.data[k + 3] = 255; } x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = matchMedia('(pointer: coarse)').matches ? 8 : 12; return t; }
/* texturas del suelo (generadas para el juego, se repiten sin cortes) */
// archivos pesados desde R2 (dirección fija: la caché no se pierde con cada versión del juego); window.ASSET_BASE = '' usa las rutas del repositorio
const ABASE = window.ASSET_BASE !== undefined ? window.ASSET_BASE : 'https://tsp-assets.galessandrodale-93.workers.dev/';
const TEXB = ABASE ? ABASE + 'app/tex/' : new URL('./tex/', import.meta.url).href;
function texL(name, aniso) { const t = new THREE.TextureLoader().load(TEXB + name); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; }
function groundMat(Q, kids) {
  const an = Q.sh > 2048 ? 12 : 8, U = { sTint: SEAS.u.sTint, sDry: SEAS.u.sDry, jud: SEAS.u.jud, tG: { value: texL('grass_v.jpg', an) }, tY: { value: texL('dry_v.jpg', an) }, tD: { value: texL('dirt.jpg', an) }, tR: { value: texL('rock.jpg', an) }, nG: { value: null }, nY: { value: null }, nD: { value: null }, nR: { value: null }, nOn: { value: 0 }, pbr: { value: 0 }, det: { value: 0 }, lo: { value: 0 } }; TEXK.tdet = U.det; TEXK.tlo = U.lo;
  // texturas de Poly Haven (CC0) en KTX2 según la calidad: pasto, tierra seca, tierra del camino/orilla y roca
  const IDS = { G: 'leafy_grass', Y: 'withered_grass', D: 'dirt_floor', R: 'rock_boulder_dry' }; TEXK.tids = Object.values(IDS);
  TEXK.terrain = async res => { const all = await Promise.all(Object.entries(IDS).flatMap(([k, id]) => [texGet(id, 'diff', res).then(t => ['t' + k, t]), texGet(id, 'nor', res).then(t => ['n' + k, t])])); if (res !== TEXK.res) return; if (all.some(([, t]) => !t)) return; all.forEach(([k, t]) => { U[k].value = t; }); U.nOn.value = 1; U.pbr.value = 1; };
  if (TEXK.res) TEXK.terrain(TEXK.res);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0 });
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec4 splat;\nvarying vec4 vSpl;\nvarying vec2 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpl=splat;vWP=(modelMatrix*vec4(position,1.)).xz;');
    sh.fragmentShader = SEAS_GLSL + 'uniform vec3 jud;uniform sampler2D tG,tY,tD,tR,nG,nY,nD,nR;uniform float nOn,pbr,det,lo;\nvarying vec4 vSpl;\nvarying vec2 vWP;\nvec4 wS;\nvec3 tx(sampler2D t,float s){vec3 a=texture2D(t,vWP*s).rgb;if(lo>.5)return a;vec3 b=texture2D(t,vWP*s*.29+vec2(.37,.11)).rgb;return mix(a,b,.38);}\nvec3 nx(sampler2D t,float s){return texture2D(t,vWP*s).xyz*2.-1.;}\n' + sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nif(nOn>.5&&lo<.5){vec3 nb=nx(nG,.22)*wS.x+nx(nY,.2)*wS.y+nx(nD,.3)*wS.z+nx(nR,.12)*wS.w;vec3 Tv=normalize((viewMatrix*vec4(1.,0.,0.,0.)).xyz),Bv=normalize((viewMatrix*vec4(0.,0.,-1.,0.)).xyz);normal=normalize(normal+(Tv*nb.x+Bv*nb.y)*.9);}').replace('#include <map_fragment>',
      'vec3 cG=tx(tG,.22),cY=tx(tY,.2),cD=tx(tD,.3),cR=tx(tR,.12)*mix(vec3(1.),vec3(.8,.74,.64),pbr);vec4 w=vSpl*(vec4(dot(cG,vec3(.33)),dot(cY,vec3(.33)),dot(cD,vec3(.33)),dot(cR,vec3(.33)))*1.6+.4);w=pow(w,vec4(3.));w/=max(.0001,w.x+w.y+w.z+w.w);wS=w;if(det>.5){float fd=smoothstep(22.,3.,length(vViewPosition));if(fd>0.){vec3 dG=texture2D(tG,vWP*1.3).rgb,dY=texture2D(tY,vWP*1.2).rgb,dD=texture2D(tD,vWP*1.5).rgb,dR=texture2D(tR,vWP*.8).rgb;vec3 dd=dG*w.x+dY*w.y+dD*w.z+dR*w.w,bb=cG*w.x+cY*w.y+cD*w.z+cR*w.w;float k=dot(dd,vec3(.333))/max(.05,dot(bb,vec3(.333)));cG*=mix(1.,k,fd*.55);cY*=mix(1.,k,fd*.55);cD*=mix(1.,k,fd*.55);cR*=mix(1.,k,fd*.55);}}cG=seasG(cG);cY=mix(cY,seasG(cY),.55);if(jud.z>0.){float jd=smoothstep(jud.z,jud.z*.4,length(vWP-jud.xy));cG=mix(cG,vec3(dot(cG,vec3(.333)))*vec3(1.08,.93,.7)*1.95,jd*.7);cY=mix(cY,cY*vec3(1.08,1.,.86),jd*.5);}diffuseColor.rgb*=(cG*w.x+cY*w.y+cD*w.z+cR*w.w)*' + (kids ? 'vec3(1.32,1.42,1.18)' : 'vec3(1.15)') + '*mix(1.,1.02,pbr);'); };
  return m;
}
/* ---------- agua de verdad: Mar de Galilea y río Jordán (oleaje, reflejo según el ángulo, espuma en la orilla y corriente) ---------- */
const WATER = { basins: [], river: null, uT: { value: 0 }, WL: -.05, RL: -.12, nm: null, env: null, mats: [] };
function waterPlan(pois) {
  WATER.basins = []; WATER.river = null; WATER.mats = [];
  for (const p of pois) { if (p.k === 'lake') WATER.basins.push({ x: p.x, z: p.z, r: 30 }); if (p.k === 'shore') WATER.basins.push({ x: p.x + p.side * 7, z: p.z, r: 8.5 }); if (p.k === 'river') WATER.river = p.pts; }
}
// mapa de normales que se repite sin costura (suma de ondas con frecuencias enteras)
function waterNormalTex() {
  if (WATER.nm) return WATER.nm; const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N), H = new Float32Array(N * N), R = rng(808), W = [];
  for (let i = 0; i < 14; i++) W.push([1 + Math.floor(R() * 7), Math.floor(R() * 9) - 4, R() * 6.28, .5 / (1 + i * .35)]);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let h = 0; for (const [a, b, p, k] of W) h += Math.sin((a * i + b * j) / N * 6.2832 + p) * k; H[j * N + i] = h; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = H[j * N + (i + 1) % N] - H[j * N + (i + N - 1) % N], dy = H[((j + 1) % N) * N + i] - H[((j + N - 1) % N) * N + i], k = (j * N + i) * 4, nx = -dx * 2.2, ny = -dy * 2.2, l = Math.hypot(nx, ny, 1);
    im.data[k] = (nx / l * .5 + .5) * 255; im.data[k + 1] = (ny / l * .5 + .5) * 255; im.data[k + 2] = (1 / l * .5 + .5) * 255; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return (WATER.nm = t);
}
// reflejo del cielo: una sola vez, un cielo claro de mediodía
function waterEnv(renderer) {
  if (WATER.env) return WATER.env; const sc = new THREE.Scene(), g = new THREE.SphereGeometry(10, 24, 12), m = new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec3 vP;void main(){float h=max(vP.y,0.);gl_FragColor=vec4(mix(vec3(.86,.9,.93),vec3(.32,.56,.86),pow(h,.6)),1.);}' });
  sc.add(new THREE.Mesh(g, m)); const pm = new THREE.PMREMGenerator(renderer); WATER.env = pm.fromScene(sc, 0, .1, 100).texture; pm.dispose(); g.dispose(); m.dispose(); return WATER.env;
}
function waterMat(hx, flow) {
  const nm = waterNormalTex().clone(), cn = waterNormalTex().clone(); nm.needsUpdate = cn.needsUpdate = true; nm.repeat.set(1, 1); cn.repeat.set(1, 1);
  const m = new THREE.MeshPhysicalMaterial({ color: hx ? '#2F6F7E' : '#3FA0D8', roughness: .12, metalness: 0, transparent: true, opacity: .93, normalMap: nm, normalScale: new THREE.Vector2(.55, .55), clearcoat: 1, clearcoatRoughness: .05, clearcoatNormalMap: cn, clearcoatNormalScale: new THREE.Vector2(.35, .35), envMap: S ? waterEnv(S.renderer) : null, envMapIntensity: hx ? .8 : 1, depthWrite: false });
  m.userData = { nm, cn, flow, env: m.envMap };
  m.onBeforeCompile = sh => { sh.uniforms.wt = WATER.uT; sh.uniforms.shal = { value: new THREE.Color(hx ? '#6FA8A0' : '#8FD8E8') };
    sh.vertexShader = 'attribute float shore;varying float vSh;uniform float wt;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSh=shore;vec4 wp0=modelMatrix*vec4(position,1.);transformed.y+=(sin(wp0.x*.35+wt*1.3)*.05+sin(wp0.z*.29-wt*1.05)*.045)*smoothstep(0.,.25,shore);');
    sh.fragmentShader = 'varying float vSh;uniform float wt;uniform vec3 shal;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb=mix(shal,diffuseColor.rgb,smoothstep(.0,.35,vSh));float fo=smoothstep(.09,.0,vSh)*(.55+.45*sin(vSh*140.-wt*2.6));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.),clamp(fo,0.,1.)*.75);diffuseColor.a=mix(.55,diffuseColor.a,smoothstep(0.,.12,vSh));'); };
  WATER.mats.push(m); return m;
}
// lago: un disco con el dato "shore" (0 en la orilla, 1 en el centro) y UV en metros
function waterLake(scene, cx, cz, r, hx, hf) {
  const g = new THREE.RingGeometry(.01, r, 72, 18); g.rotateX(-Math.PI / 2); const P = g.attributes.position, uv = g.attributes.uv, sh = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); sh[i] = hf ? Math.max(0, Math.min(1, (WATER.WL - hf(x + cx, z + cz)) / .7)) : 1 - Math.hypot(x, z) / r; uv.setXY(i, (x + cx) * .06, (z + cz) * .06); }
  g.setAttribute('shore', new THREE.BufferAttribute(sh, 1)); const m = new THREE.Mesh(g, waterMat(hx, 0)); m.position.set(cx, WATER.WL, cz); m.renderOrder = 2; m.receiveShadow = true; scene.add(m); return m;
}
// río: cinta a lo largo del cauce; UV.y avanza con la corriente
function waterRiver(scene, pts, w, hx, hf) {
  const pos = [], uvs = [], shs = [], idx = []; let along = 0, n = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; if (i) along += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    for (let k = 0; k <= 6; k++) { const u = k / 6 - .5, x = pts[i][0] - dz * u * w, z = pts[i][1] + dx * u * w; pos.push(x, 0, z); uvs.push(u * w * .08, along * .08); shs.push(hf ? Math.max(0, Math.min(1, (WATER.RL - hf(x, z)) / .4)) : 1 - Math.abs(u) * 2); }
    if (i) for (let k = 0; k < 6; k++) { const p0 = (i - 1) * 7 + k, p1 = i * 7 + k; idx.push(p0, p1, p0 + 1, p1, p1 + 1, p0 + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('shore', new THREE.Float32BufferAttribute(shs, 1)); g.setIndex(idx); g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) { g.setIndex(idx.map((v, i) => idx[i - i % 3 + [0, 2, 1][i % 3]])); g.computeVertexNormals(); }
  const m = new THREE.Mesh(g, waterMat(hx, 1)); m.position.y = WATER.RL; m.renderOrder = 2; m.receiveShadow = true; scene.add(m); return m;
}
function waterTick(dt, t) {
  WATER.uT.value = t; for (const m of WATER.mats) { const u = m.userData; if (u.flow) { u.nm.offset.y -= dt * .09; u.cn.offset.y -= dt * .14; u.cn.offset.x = Math.sin(t * .2) * .05; } else { u.nm.offset.x += dt * .012; u.nm.offset.y += dt * .007; u.cn.offset.x -= dt * .009; u.cn.offset.y += dt * .013; } }
}
// cuánto "moja" la orilla en este punto (0 lejos, 1 en el borde del agua)
function waterWet(x, z, rf) { let w = 0; for (const b of WATER.basins) { const dd = Math.hypot(x - b.x, z - b.z) / b.r; w = Math.max(w, 1 - sstep(.92, 1.35, dd)); } if (rf != null) w = Math.max(w, 1 - sstep(2.4, 5, rf)); return w; }

/* ---------- cielo real (HDRI CC0 de Poly Haven): amanecer y mediodía, con reflejos del cielo en los materiales ---------- */
const SKY = { tex: {}, env: {}, res: '', rot: [-1.462, -2.631], dir: [[.575, .083, -.814], [-.300, .742, -.599]], gen: null };
const SKYB = ABASE ? ABASE + 'app/sky/' : new URL('./sky/', import.meta.url).href;
let _r0 = null; const renderer0 = () => _r0;
function skyRes() { return ['1k', '2k', '2k', '4k'][QUAL.lv]; }
function skyLoad(sky, kids, r) {
  const res = skyRes(); SKY.res = res; const L = new THREE.TextureLoader(), u = sky.material.uniforms; u.kb.value = kids ? 1.12 : 1; u.rA.value = SKY.rot[0]; u.rB.value = SKY.rot[1];
  ['sunrise', 'noon'].forEach((n, i) => { const k = n + '_' + res; if (SKY.tex[k]) { u[i ? 'tB' : 'tA'].value = SKY.tex[k]; SKY['t' + i] = SKY.tex[k]; u.useT.value = u.tA.value && u.tB.value ? 1 : 0; return; }
    L.load(SKYB + k + '.webp', t => { t.colorSpace = THREE.NoColorSpace; t.wrapS = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; SKY.tex[k] = t; SKY['t' + i] = t; u[i ? 'tB' : 'tA'].value = t; u.useT.value = u.tA.value && u.tB.value ? 1 : 0; if (S && S.daySig) S.daySig = ''; skyEnv(); }); });
}
// luz del cielo para los materiales (PMREM), una vez por fase
function skyEnv() {
  if (!S || !SKY.t0 || !SKY.t1 || QUAL.lv === 0) return; const r = S.renderer; if (!SKY.gen) SKY.gen = new THREE.PMREMGenerator(r);
  [0, 1].forEach(i => { if (SKY.env[i]) return; const src = SKY['t' + i].clone(); src.colorSpace = THREE.SRGBColorSpace; src.mapping = THREE.EquirectangularReflectionMapping; src.offset.x = -SKY.rot[i] / 6.2831853; src.needsUpdate = true; SKY.env[i] = SKY.gen.fromEquirectangular(src).texture; });
  if (S.dayI != null) S.scene.environment = SKY.env[S.dayI] || null;
}
// parte una malla grande (terreno, montañas) en franjas a lo largo de z que comparten los mismos buffers: la cámara recorta lo que no ve
function splitZ(scene, mesh, step) {
  const g = mesh.geometry, I = g.index, P = g.attributes.position; if (!I) return [mesh]; const by = new Map(), a = I.array;
  for (let t = 0; t < a.length; t += 3) { const z = (P.getZ(a[t]) + P.getZ(a[t + 1]) + P.getZ(a[t + 2])) / 3, k = Math.floor(z / step); let L = by.get(k); if (!L) by.set(k, L = []); L.push(a[t], a[t + 1], a[t + 2]); }
  const out = [], V = new THREE.Vector3(); by.forEach(L => { const sg = new THREE.BufferGeometry(); for (const n in g.attributes) sg.setAttribute(n, g.attributes[n]); sg.setIndex(new THREE.BufferAttribute(P.count > 65535 ? new Uint32Array(L) : new Uint16Array(L), 1));
    const bb = new THREE.Box3(); for (const i of L) bb.expandByPoint(V.fromBufferAttribute(P, i)); sg.boundingBox = bb; sg.boundingSphere = bb.getBoundingSphere(new THREE.Sphere());
    const m = new THREE.Mesh(sg, mesh.material); m.receiveShadow = mesh.receiveShadow; m.castShadow = mesh.castShadow; m.userData.terrain = 1; m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m); out.push(m); });
  if (mesh.parent) mesh.parent.remove(mesh); return out;
}
function heroWorld(scene, g, allPts, flatSpots, zMax, Q, KK) {
  // campo de distancias al camino (para dejarlo plano y ubicar la vegetación)
  const X0 = -XB - 40, X1 = XB + 40, Z0 = zMax - 50, Z1 = 50, CS = 1.5, NX = Math.ceil((X1 - X0) / CS) + 1, NZ = Math.ceil((Z1 - Z0) / CS) + 1, DF = new Float32Array(NX * NZ);
  const pts = allPts.filter((p, i) => i % 2 === 0).concat(flatSpots), buckets = new Map(), bk = z => Math.floor(z / 6);
  pts.forEach(p => { const k = bk(p[1]); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(p); });
  for (let j = 0; j < NZ; j++) { const z = Z0 + j * CS, b0 = bk(z); for (let i = 0; i < NX; i++) { const x = X0 + i * CS; let d = 400; for (let b = b0 - 3; b <= b0 + 3; b++) { const L = buckets.get(b); if (!L) continue; for (const p of L) { const q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } } DF[j * NX + i] = Math.min(20, Math.sqrt(d)); } }
  const dAt = (x, z) => { const fx = Math.max(0, Math.min(NX - 1.001, (x - X0) / CS)), fz = Math.max(0, Math.min(NZ - 1.001, (z - Z0) / CS)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = DF[j * NX + i], b = DF[j * NX + i + 1], c = DF[(j + 1) * NX + i], d = DF[(j + 1) * NX + i + 1]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const h0 = (x, z) => { const d = dAt(x, z), m = sstep(2.6, 10, d), side = sstep(16 * WS, 44 * WS, Math.abs(x)); return m * (fbm(x * .07 + 3, z * .07) * 3.4 - .9 + side * (4 + fbm(x * .025, z * .025) * 14)) * (KK ? .5 : 1); };
  // cauce del Jordán: distancia al río en la misma grilla
  let RF = null; if (WATER.river) { RF = new Float32Array(NX * NZ); const rb = new Map(); WATER.river.forEach(p => { const k = bk(p[1]); if (!rb.has(k)) rb.set(k, []); rb.get(k).push(p); });
    for (let j = 0; j < NZ; j++) { const z = Z0 + j * CS, b0 = bk(z); for (let i = 0; i < NX; i++) { const x = X0 + i * CS; let d = 400; for (let b = b0 - 2; b <= b0 + 2; b++) { const L = rb.get(b); if (!L) continue; for (const p of L) { const q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } } RF[j * NX + i] = Math.min(20, Math.sqrt(d)); } } }
  const rAt = (x, z) => { if (!RF) return 20; const fx = Math.max(0, Math.min(NX - 1.001, (x - X0) / CS)), fz = Math.max(0, Math.min(NZ - 1.001, (z - Z0) / CS)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = RF[j * NX + i], b = RF[j * NX + i + 1], c = RF[(j + 1) * NX + i], d = RF[(j + 1) * NX + i + 1]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  // el lago y el río se cavan en el terreno: así el agua queda adentro y la orilla es de verdad
  const hAt = (x, z) => { let h = h0(x, z); for (const b of WATER.basins) { const dd = Math.hypot(x - b.x, z - b.z) / b.r; if (dd < 1.25) h = Math.min(h, -1.5 + (h + 1.5) * sstep(.86, 1.22, dd) + sstep(.86, 1.05, dd) * .18); }
    if (RF) { const rf = rAt(x, z); if (rf < 4.5) h = Math.min(h, -.6 + (h + .6) * sstep(1.7, 4.2, rf) + sstep(1.7, 2.9, rf) * .12); } return h; };
  // cielo de atardecer
  const sunDir = new THREE.Vector3(-.42, .17, -.89).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { tA: { value: null }, tB: { value: null }, sk: { value: 0 }, rA: { value: 0 }, rB: { value: 0 }, useT: { value: 0 }, kb: { value: 1 }, top: { value: new THREE.Color('#16203C') }, mid: { value: new THREE.Color('#5B5A7A') }, hor: { value: new THREE.Color('#F0A35E') }, gnd: { value: new THREE.Color('#2B2118') }, sun: { value: sunDir }, sunC: { value: new THREE.Color('#FFD39A') }, t: { value: 0 }, stars: { value: 1 }, inv: { value: 0 }, ex: { value: 1 } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top,mid,hor,gnd,sun,sunC;uniform float t,stars,inv,ex,sk,rA,rB,useT,kb;uniform sampler2D tA,tB;varying vec3 vP;vec3 eq(sampler2D T,vec3 d,float r){float u=(atan(d.z,d.x)-r)/6.2831853+.5;float v=acos(clamp(d.y,-1.,1.))/3.1415927;return texture2D(T,vec2(fract(u),1.-v)).rgb;}vec3 unTone(vec3 d){d=clamp(d,0.,.985);vec3 L=mix(d/12.92,pow((d+.055)/1.055,vec3(2.4)),step(.04045,d));L=min(L,vec3(.975));vec3 A=1.-.983729*L,B=.0245786-.432951*L,C=-(.000090537+.238081*L);vec3 v=(-B+sqrt(B*B-4.*A*C))/(2.*A);return v*.6/ex;}float h2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){float h=vP.y;vec3 c=mix(hor,mid,smoothstep(0.,.22,h));c=mix(c,top,smoothstep(.18,.75,h));c=mix(c,gnd,smoothstep(0.,-.12,h));float s=max(dot(vP,sun),0.);c+=sunC*(pow(s,900.)*6.+pow(s,24.)*.45+pow(s,4.)*.18);float az=atan(vP.x,vP.z);float cl=smoothstep(.55,.85,sin(az*3.+h*14.+t*.02)*.5+.5+h2(floor(vec2(az*20.,h*60.)))*.08)*smoothstep(.05,.14,h)*smoothstep(.34,.16,h);c=mix(c,mix(vec3(.42,.3,.32),sunC,pow(s,6.)*.8),cl*.45);if(h>.3){vec2 g=floor(vP.xz/(h+.3)*180.);float st=step(.9975,h2(g));c+=st*smoothstep(.3,.6,h)*.7*stars;}if(useT>.5){vec3 d=normalize(vP);vec3 hc=mix(eq(tA,d,rA),eq(tB,d,rB),sk)*kb;hc=mix(hc,gnd,smoothstep(.0,-.09,h));c=hc;}if(inv>.5)c=unTone(c);gl_FragColor=vec4(c,1.);}' }));
  sky.renderOrder = -1; scene.add(sky); skyLoad(sky, !!KK, renderer0());
  if (!KK) { scene.background = new THREE.Color('#2B2118'); scene.fog = new THREE.FogExp2('#94705A', .0105); } else scene.fog = new THREE.Fog(scene.fog ? scene.fog.color : '#F3E6D6', 40, 170);
  // luces
  const hemi = KK ? KK.hemi : new THREE.HemisphereLight('#9EAACB', '#4A3826', .62); if (!KK) scene.add(hemi);
  const sunL = KK ? KK.sun : new THREE.DirectionalLight('#FFC788', 2.7); sunL.castShadow = true; if (KK) sunDir.copy(sunL.position).normalize(); sunL.shadow.mapSize.set(Q.sh, Q.sh);
  const sc = sunL.shadow.camera; sc.left = -Q.ext; sc.right = Q.ext; sc.top = Q.ext; sc.bottom = -Q.ext; sc.near = 1; sc.far = 90; sunL.shadow.bias = -.0005; sunL.shadow.normalBias = .025; sunL.shadow.radius = 3; scene.add(sunL); scene.add(sunL.target);
  // terreno
  const L = Z1 - Z0, geo = new THREE.PlaneGeometry(X1 - X0, L, Math.round((X1 - X0) / Q.tg), Math.round(L / Q.tg)); geo.rotateX(-Math.PI / 2); geo.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), spl = new Float32Array(P.count * 4);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), d = dAt(x, z), h = hAt(x, z); P.setY(i, h); const n = fbm(x * .15, z * .15), n2 = vnoise(x * .04 + 7, z * .04);
    const sl = Math.hypot(hAt(x + .8, z) - hAt(x - .8, z), hAt(x, z + .8) - hAt(x, z - .8)) / 1.6;
    let wd = 1 - sstep(1.1, 2.8, d), wr = Math.max(sstep(5, 11, h) * .8, sstep(.6, 1.1, sl)), wy = sstep(.55, .85, n2) * .65 * (1 - wd), wg = 1;
    wg *= (1 - wd) * (1 - wr) * (1 - wy * .9); wy *= (1 - wr); wd *= (1 - wr * .6); const tt = wg + wy + wd + wr || 1;
    const wet = waterWet(x, z, RF ? rAt(x, z) : null); if (wet > 0) { const k2 = wet * .9; wg *= 1 - k2; wy *= 1 - k2; wr *= 1 - k2; wd = wd * (1 - k2) + k2; }
    { const t2 = wg + wy + wd + wr || 1; spl.set([wg / t2, wy / t2, wd / t2, wr / t2], i * 4); } const v = (.86 + n * .26) * (1 - wet * .22); col.set([v, v * (1 - wet * .02), v * (1 - wet * .05)], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('splat', new THREE.BufferAttribute(spl, 4)); geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, groundMat(Q, !!KK)); terrain.receiveShadow = true; scene.add(terrain); splitZ(scene, terrain, 64);
  // montañas: el mismo terreno sigue y se levanta en cordones continuos (sin piedras sueltas), con roca según la pendiente
  const MW = 140, mtnH = (x, z) => { const ax = Math.abs(x), u = Math.max(0, (ax - X1) / MW), e = hAt(Math.sign(x) * X1, z), r = 1 - Math.abs(vnoise(x * .018 + 11, z * .014) * 2 - 1), n = fbm(x * .011 + 5, z * .009), rr = 1 - Math.abs(vnoise(x * .05 - 3, z * .045) * 2 - 1);
    return e + sstep(0, .55, u) * (10 + n * 34 + r * r * 30 + rr * 6) * (KK ? .55 : 1) - sstep(.85, 1, u) * 4; };
  [-1, 1].forEach(sd => { const mg = new THREE.PlaneGeometry(MW, L, Math.round(MW / 3.5), Math.round(L / 3.5)); mg.rotateX(-Math.PI / 2); mg.translate(sd * (X1 + MW / 2), 0, (Z0 + Z1) / 2);
    const mp = mg.attributes.position, mc = new Float32Array(mp.count * 3), ms = new Float32Array(mp.count * 4);
    for (let i = 0; i < mp.count; i++) { const x = mp.getX(i), z = mp.getZ(i), xx = Math.abs(x - sd * X1) < .01 ? sd * X1 : x, h = Math.abs(x - sd * X1) < .01 ? hAt(sd * X1, z) : mtnH(xx, z); mp.setY(i, h);
      const sl = Math.hypot(mtnH(x + 1.5, z) - mtnH(x - 1.5, z), mtnH(x, z + 1.5) - mtnH(x, z - 1.5)) / 3, n2 = vnoise(x * .04 + 7, z * .04);
      let wr = Math.max(sstep(.5, 1.05, sl), sstep(40, 70, h) * .5), wy = Math.max(sstep(.5, .8, n2) * .6, sstep(12, 30, h) * .75), wg = (1 - wr) * (1 - wy * .8); wy *= 1 - wr; const tt = wr + wy + wg || 1; ms.set([wg / tt, wy / tt, 0, wr / tt], i * 4);
      const v = .82 + fbm(x * .15, z * .15) * .26 + sstep(30, 60, h) * .12; mc.set([v, v, v], i * 3); }
    mg.setAttribute('color', new THREE.BufferAttribute(mc, 3)); mg.setAttribute('splat', new THREE.BufferAttribute(ms, 4)); mg.computeVertexNormals();
    const m = new THREE.Mesh(mg, terrain.material); m.receiveShadow = true; scene.add(m); splitZ(scene, m, 96); });
  return { hAt, dAt, sunL, sunDir, sky, terrain, hemi, mtnH, X1 };
}
/* plantas reales escaneadas (Poly Haven, CC0): pasto, pasto bermuda y flores amarillas, con viento */
const FLB = new URL('./flora/', import.meta.url).href;
async function realFlora(scene, W, allPts, Q, uT) {
  let man; try { man = await (await fetch(FLB + 'flora.json')).json(); } catch (e) { return; }
  const coarse = Q.sh <= 2048, R = rng(4711), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), C = new THREE.Color();
  const dm = Q.dens || 1, SET = { grass_medium_01: { n: (coarse ? 1800 : 4500) * dm, s: [2.4, 3.8], r: [1.5, 13] }, grass_bermuda_01: { n: (coarse ? 9000 : 22000) * dm, s: [3.2, 4.8], r: [1.3, 15] }, celandine_01: { n: (coarse ? 700 : 1800) * dm, s: [2.2, 3.2], r: [2, 14] } };
  for (const [base, meshes] of Object.entries(man)) { const cfg = SET[base]; if (!cfg) continue; let buf; try { buf = await (await fetch(FLB + base + '.bin')).arrayBuffer(); } catch (e2) { continue; }
    const tex = new THREE.TextureLoader().load(FLB + base + '.webp'); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .45, roughness: .92, metalness: 0 });
    mat.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <project_vertex>', 'vec4 mvPosition=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nmvPosition=instanceMatrix*mvPosition;\n#endif\nfloat k=clamp(position.y*4.,0.,1.);k*=k;mvPosition.x+=sin(uT*1.9+mvPosition.x*.4+mvPosition.z*.3)*.07*k;mvPosition.z+=cos(uT*1.4+mvPosition.x*.25)*.04*k;\nmvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;'); };
    seasonMat(mat); const per = Math.ceil(cfg.n / meshes.length);
    meshes.forEach(mm => { let o = mm.off; const P = new Float32Array(buf, o, mm.nv * 3); o += mm.nv * 12; const N = new Int8Array(buf, o, mm.nv * 3); o += mm.nv * 3; o = (o + 3) & ~3; const U = new Float32Array(buf, o, mm.nv * 2); o += mm.nv * 8; const I = new Uint16Array(buf, o, mm.ni);
      const g = new THREE.BufferGeometry(), NU = new Float32Array(mm.nv * 3), I2 = new Uint16Array(mm.ni * 2); for (let k = 0; k < mm.nv; k++) { NU[k * 3] = N[k * 3] / 127 * .35; NU[k * 3 + 1] = .9; NU[k * 3 + 2] = N[k * 3 + 2] / 127 * .35; } I2.set(I); for (let k = 0; k < mm.ni; k += 3) { I2[mm.ni + k] = I[k]; I2[mm.ni + k + 1] = I[k + 2]; I2[mm.ni + k + 2] = I[k + 1]; }
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(NU, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setIndex(new THREE.BufferAttribute(I2, 1));
      const list = []; for (let i = 0; i < per * 3 && list.length < per; i++) { const p = allPts[Math.floor(R() * allPts.length)], a = R() * 6.28, r = cfg.r[0] + Math.pow(R(), 1.4) * (cfg.r[1] - cfg.r[0]), x = p[0] + Math.cos(a) * r, z = p[1] + Math.sin(a) * r; if (W.dAt(x, z) < cfg.r[0] || W.hAt(x, z) > 7 || blockedAt(x, z)) continue; list.push([x, z]); }
      chunkInst(scene, g, mat, list, ([x, z], i, im) => { const s2 = cfg.s[0] + R() * (cfg.s[1] - cfg.s[0]); e.set((R() - .5) * .15, R() * 6.28, (R() - .5) * .15); q.setFromEuler(e); M4.compose(v.set(x, W.hAt(x, z) - .02, z), q, sc.set(s2, s2 * (.85 + R() * .3), s2)); im.setMatrixAt(i, M4); im.setColorAt(i, C.setRGB(.9 + R() * .2, .9 + R() * .2, .85 + R() * .2)); }, { recv: true, xz: 1 }); });
  }
}
const FLORA = { chunks: [] };
// pasto en parcelas de 36 m: cada parcela se recorta sola fuera de cámara y se apaga lejos del jugador
function chunkInst(scene, geo, mat, list, fn, o) {
  o = o || {}; const by = new Map(), Z = it => o.xz ? it[1] : it.z; list.forEach(it => { const k = Math.floor(Z(it) / 72); if (!by.has(k)) by.set(k, []); by.get(k).push(it); });
  by.forEach((L, k) => { const im = new THREE.InstancedMesh(geo, mat, L.length); L.forEach((it, i) => fn(it, i, im)); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.receiveShadow = !!o.recv; im.userData.n = L.length; im.userData.zc = (k + .5) * 72; scene.add(im); FLORA.chunks.push(im); });
}
function floraTick(dt) {
  if (!S || !FLORA.chunks.length) return; FLORA.acc = (FLORA.acc || 0) - dt; if (FLORA.acc > 0) return; FLORA.acc = .4;
  const cz = S.av.position.z, far = QT.far[QUAL.lv], dens = QT.dens[QUAL.lv];
  for (const im of FLORA.chunks) { const d = Math.abs(im.userData.zc - cz) - 36; const lim = im.userData.tree ? Math.max(far * 1.35 + 20, 110) : far; im.visible = d < lim; if (im.visible && !im.userData.tree) { im.count = Math.max(1, Math.floor(im.userData.n * (d > far * .55 ? dens * .6 : dens))); if (im.userData.fl) im.count = Math.floor(im.count * Math.min(1, SEAS.cur[im.userData.fl] || 0)); } }
}
function heroFlora(scene, W, allPts, zMax, R, Q) {
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SV = new THREE.Vector3(), CL = new THREE.Color();
  const put = (x, y, z, rx, ry, rz, sx, sy, sz) => { E.set(rx, ry, rz, 'YXZ'); Q4.setFromEuler(E); V.set(x, y, z); SV.set(sx, sy ?? sx, sz ?? sx); M4.compose(V, Q4, SV); };
  // árboles, arbustos y rocas en franjas de 72 m: así se recortan por distancia y por cámara (antes se dibujaba el mundo entero siempre).
  // Devuelve un objeto con la misma interfaz por índice global (getMatrixAt/setMatrixAt) para talar y regenerar.
  const inst = (geo, m, list, fn, shadow) => { const by = new Map(), map = new Array(list.length), mats = [], cols = [];
    list.forEach((o, i) => { const c = fn(o, i); mats[i] = M4.clone(); cols[i] = c; const z = M4.elements[14], k = Math.floor(z / 72); if (!by.has(k)) by.set(k, []); by.get(k).push(i); });
    const chunks = []; by.forEach((L, k) => { const im = new THREE.InstancedMesh(geo, m, L.length); L.forEach((gi, li) => { im.setMatrixAt(li, mats[gi]); if (cols[gi]) { CL.set(cols[gi]); if (FLORA.kids) CL.offsetHSL(0, .12, .1); im.setColorAt(li, CL); } map[gi] = [im, li]; });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = !!shadow; im.receiveShadow = true; im.userData.n = L.length; im.userData.zc = (k + .5) * 72; im.userData.tree = 1; scene.add(im); FLORA.chunks.push(im); chunks.push(im); });
    return { uuid: THREE.MathUtils.generateUUID(), chunks, isChunked: true, getMatrixAt(i, M) { const r = map[i]; if (r) r[0].getMatrixAt(r[1], M); return M; }, setMatrixAt(i, M) { const r = map[i]; if (r) { r[0].setMatrixAt(r[1], M); r[0].instanceMatrix.needsUpdate = true; } }, instanceMatrix: { set needsUpdate(v) {} }, set visible(v) { chunks.forEach(c => c.visible = v); } }; };
  const olive = [], cyp = [], bush = [], rock = [];
  for (let i = 0; i < Q.trees; i++) { const x = (R() - .5) * (XB * 2 + 50), z = 40 + R() * (zMax - 70); const d = W.dAt(x, z); if (d < 2.6 + R() * 2) continue; const y = W.hAt(x, z), r = R(), o = { x, y, z, s: .75 + R() * .6, rot: R() * 6.28, v: R() };
    if (Math.abs(x) > XB * .8 && r < .5) continue; (r < .42 ? olive : r < .62 ? cyp : r < .9 ? bush : rock).push(o); }
  const trunkM = new THREE.MeshStandardMaterial({ color: '#8A7058', roughness: 1, map: texL('rock.jpg', 4) });
  const leafM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .9, map: texL('leaves.jpg', 4) }); leafM.map.repeat.set(1.6, 1.6);
  // copas con borde de hojas: en el contorno (donde la superficie se ve de canto) se recorta según la textura, así la masa deja de verse como una bola lisa
  leafM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{float fe=abs(dot(normalize(vNormal),normalize(vViewPosition)));float lum=dot(diffuseColor.rgb,vec3(.333));if(fe<.55&&lum<mix(.62,.18,fe/.55))discard;diffuseColor.rgb*=mix(.78,1.08,smoothstep(.2,.9,fe));}'); }; leafM.customProgramCacheKey = () => 'leafEdge'; leafM.side = THREE.DoubleSide;
  // olivos: tronco torcido y copa de varias masas
  FLORA.olive = olive; FLORA.rock = rock; FLORA.oT = inst(new THREE.CylinderGeometry(.12, .22, 1, 6), trunkM, olive, o => { const h = 1.5 * o.s; put(o.x, o.y + h / 2, o.z, (o.v - .5) * .3, o.rot, (o.v - .5) * .25, o.s, h, o.s); }, true);
  const blobs = []; olive.forEach(o => { for (let j = 0; j < 6; j++) { const a = j / 6 * 6.28 + o.rot, r = j ? .55 : 0; blobs.push({ o, x: Math.cos(a) * r, z: Math.sin(a) * r, y: 1.55 + (j ? -.1 + hsh(j, o.x) * .35 : .35), s: .55 + hsh(o.z, j) * .3 }); } });
  FLORA.oB = inst(new THREE.IcosahedronGeometry(1, 1), leafM, blobs, b => { const o = b.o; put(o.x + b.x * o.s, o.y + b.y * o.s, o.z + b.z * o.s, b.x, o.rot + b.z, 0, b.s * o.s * 1.15, b.s * o.s * .8, b.s * o.s * 1.15); return ['#5E7140', '#6F7E4A', '#526638', '#7A8A55'][Math.floor(hsh(b.x * 9, b.y * 7 + o.z) * 4)]; }, true);
  // los cipreses cónicos se reemplazaron por los árboles reales de Poly Haven (se ubican en phWorld)
  FLORA.cyp = cyp; FLORA.bush = bush;
  // arbustos y piedras
  const bb = []; bush.forEach(o => { for (let j = 0; j < 3; j++) bb.push({ o, dx: (hsh(j, o.x) - .5) * .9, dz: (hsh(o.z, j) - .5) * .9, r: .35 + hsh(j + 3, o.z) * .3 }); });
  inst(new THREE.IcosahedronGeometry(1, 1), leafM, bb, ({ o, dx, dz, r }) => { put(o.x + dx * o.s, o.y + r * .55 * o.s, o.z + dz * o.s, 0, o.rot, 0, r * o.s * 1.2, r * o.s * .8, r * o.s * 1.2); return ['#4C5E30', '#5D6B3A', '#6B6A3C'][Math.floor(o.v * 3)]; }, true);
  FLORA.rI = inst(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .95, flatShading: true, map: texL('rock.jpg', 4) }), rock, o => { put(o.x, o.y - .12 * o.s, o.z, o.rot, o.rot * 2, o.v, (.35 + o.v * .7) * o.s, (.25 + o.v * .4) * o.s, (.35 + o.v * .6) * o.s); return ['#C9C0B0', '#D8CFBE', '#B8B0A2'][Math.floor(o.v * 3)]; }, true);
  // matas de pasto: tarjetas cruzadas con textura y viento (más densas cerca del camino)
  const cg = new THREE.BufferGeometry(), cp = [], cu = [], ci = [];
  for (let k = 0; k < 3; k++) { const an = k * Math.PI / 3, cx = Math.cos(an) * .5, cz = Math.sin(an) * .5, o = cp.length / 3; cp.push(-cx, 0, -cz, cx, 0, cz, cx, 1, cz, -cx, 1, -cz); cu.push(0, 0, 1, 0, 1, 1, 0, 1); ci.push(o, o + 1, o + 2, o, o + 2, o + 3, o, o + 2, o + 1, o, o + 3, o + 2); }
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(cp.length / 3).fill([0, 1, 0]).flat(), 3)); cg.setIndex(ci);
  const gm = new THREE.MeshLambertMaterial({ map: texL('grasscard.png', 4), alphaTest: .42 }), uT = { value: 0 };
  gm.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <project_vertex>', 'vec4 mvPosition=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nmvPosition=instanceMatrix*mvPosition;\n#endif\nfloat k=position.y*position.y;mvPosition.x+=sin(uT*1.8+mvPosition.x*.35+mvPosition.z*.28)*.12*k;mvPosition.z+=cos(uT*1.3+mvPosition.x*.22)*.06*k;\nmvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;'); };
  seasonMat(gm);
  const gl = []; for (let i = 0; i < Q.grass / 3.6; i++) { const p = allPts[Math.floor(R() * allPts.length)], a = R() * 6.28, wide = R() < .45, r = 1.2 + Math.pow(R(), 1.5) * 15, x = wide ? (R() - .5) * XB * 2.2 : p[0] + Math.cos(a) * r, z = wide ? p[1] + (R() - .5) * 10 : p[1] + Math.sin(a) * r; if (W.dAt(x, z) < 1.3 || W.hAt(x, z) > 7) continue; gl.push({ x, z, h: .32 + R() * .5, w: .6 + R() * .7, rot: R() * 6.28, c: R() }); }
  try { flowerField(scene, W, allPts, R, put, M4, CL, Q); } catch (e) { console.warn('flores', e); }
  chunkInst(scene, cg, gm, gl, (o, i, im) => { put(o.x, W.hAt(o.x, o.z) - .03, o.z, 0, o.rot, 0, o.w, o.h, o.w); im.setMatrixAt(i, M4); im.setColorAt(i, FLORA.kids ? CL.setRGB(1.15 + o.c * .25, 1.35 + o.c * .2, .8 + o.c * .15) : CL.setRGB(1.05 + o.c * .3, 1.1 + o.c * .25, .85 + o.c * .2)); }, { recv: true });
  return uT;
}

/* ---------- construcción ---------- */

// pasos del armado del mundo: se registran y se muestran en la sala de espera, así nunca queda colgado en silencio
const BSTEP = { u: null, log: [] };
function buildStep(n) { BSTEP.log.push([n, Math.round(performance.now())]); try { console.log('[armado]', n); } catch (e) {} try { if (BSTEP.u) BSTEP.u.prog(null, 'Armando el mundo… · ' + n); } catch (e) {} window.__armado = BSTEP.log; }
const withTO = (p, ms, n) => Promise.race([p, new Promise((_, j) => setTimeout(() => j(new Error('tiempo: ' + n)), ms))]);
function buildFail(U, e) {
  console.warn('armado', e); const ov = U && U.ov; if (!ov) return; const box = document.createElement('div'); box.className = 'lb-fail';
  box.innerHTML = `<b>No pudimos armar el mundo en este aparato.</b><p>Paso: ${esc((BSTEP.log[BSTEP.log.length - 1] || ['inicio'])[0])}. Probá de nuevo con la calidad Baja: se ve más simple, pero anda en cualquier celular.</p><button type="button" class="lb-go">Entrar en calidad Baja</button>`;
  (ov.querySelector('.lb-in') || ov).appendChild(box); box.querySelector('button').onclick = () => { try { localStorage.setItem('tsp:q', 'bajo'); } catch (er) {} location.reload(); };
}
async function build() {
  H3.npcs = []; await heroLoad(); buildStep('terreno y casas');
  const g = G(), hx = g.branch === 'ados', root = document.getElementById('view3d'), _c = root.classList.toggle('hx', hx), cv = document.getElementById('c3d');
  const renderer = _r0 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = hx ? 1.0 : 1.05;
  S_poiPts = planPois(g).flatMap(q => q.flat).concat(planDoors(g).flatMap(q => q.flat));
  const coarse = matchMedia('(pointer: coarse)').matches, QL = coarse ? { sh: 2048, grass: 30000, trees: 2900, tg: 2, ext: 22 } : { sh: 4096, grass: 62000, trees: 4300, tg: 1.6, ext: 26 };
  // pasto y flores más densos en Alto/Ultra (se decide antes de armar el mundo)
  { const lv0 = qEarly(); QL.dens = [.75, 1, 1.35, 1.7][lv0]; QL.grass = Math.round(QL.grass * QL.dens); }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setPixelRatio(Math.min(coarse ? 1.75 : 2, devicePixelRatio || 1));
  const scene = new THREE.Scene();
  const skyTop = hx ? '#0A100B' : '#7FB6FF', skyBot = hx ? '#2A2216' : '#FFE6C9';
const KL = {};
  if (!hx) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, skyTop); gr.addColorStop(.62, skyBot); gr.addColorStop(1, skyBot); x.fillStyle = gr; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; KL.cv = c; KL.tex = t; }
  if (!hx) scene.fog = new THREE.Fog('#F3E6D6', 14, 60);
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 420);
  if (!hx) { KL.hemi = new THREE.HemisphereLight('#DDEBFF', '#C9B27A', 1.1); scene.add(KL.hemi); }
  const sun = new THREE.DirectionalLight(hx ? '#FFD9A0' : '#FFF4DC', hx ? .55 : 1.6); sun.position.set(-6, 12, 6); if (!hx) scene.add(sun); KL.sun = sun;
  const W = g.WIDTH, totalY = g.TOP + g.REGIONS.length * g.RH + 200, R = rng(7);
  // suelo
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(XB * 2 + 200, totalY * SC + 160), mat(hx ? '#2A2417' : '#A9D98E'));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -(totalY * SC) / 2); if (!hx) scene.add(ground);
  // camino
  const pathM = mat(hx ? '#5E4A32' : '#F1D9A4'), edgeM = mat(hx ? '#3F3221' : '#E2C287');
  const ribbon = (pts, w, m, y) => { const pos = [], idx = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const nx = -dz * w / 2, nz = dx * w / 2; pos.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz); if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const me = new THREE.Mesh(geo, m); me.material.side = THREE.DoubleSide; return me; };
  const edgePts = {};
  g.EDGES.forEach(([a, b]) => { const A = g.NODES[a], B = g.NODES[b], pts = []; for (let i = 0; i <= 100; i++) { const p = bez(A, B, i / 100); pts.push(toV(p.x, p.y)); } edgePts[a + '>' + b] = pts; if (!hx) { scene.add(stonePath(pts, 2.5, 0, .012)); scene.add(stonePath(pts, 1.8, 1, .03)); } });
  // vegetación y rocas, lejos del camino (instanciadas para que ande fluido en el celular)
  const allPts = Object.values(edgePts).flat(), near = (x, z, d) => allPts.some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < d * d) || (S_poiPts || []).some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < (d + 4) * (d + 4));
  const zMax = -totalY * SC;
  let HW = null, uGrass = null;
  const pois = planPois(g), doors = planDoors(g), poiPts = pois.flatMap(q => q.flat).concat(doors.flatMap(q => q.flat)); waterPlan(pois); MAPT.tiles.clear();
  { const flat = g.VIGN.map(([r, x, y]) => toV(x, g.TOP + r * g.RH + y)).concat(poiPts); FLORA.kids = !hx; FLORA.chunks = []; HW = heroWorld(scene, g, allPts, flat, zMax, QL, hx ? null : KL); uGrass = heroFlora(scene, HW, allPts, zMax, R, hx ? QL : Object.assign({}, QL, { grass: QL.grass * .8, trees: QL.trees * .8 })); realFlora(scene, HW, allPts, QL, uGrass); if (!hx) { ground.visible = false; KL.sun.position.set(-14, 26, 12); } }
  const spots = { tree: [], bush: [], rock: [] };
  for (let i = 0; i < (HW ? 0 : 1500); i++) {
    const x = (R() - .5) * (XB * 2 + 40), z = R() * zMax - 6; if (near(x, z, 2.2)) continue;
    const r = R(), s = .8 + R() * .7, rot = R() * 6.28;
    (r < .45 ? spots.tree : r < .8 ? spots.bush : spots.rock).push({ x, z, s, rot, h: R(), v: R() });
  }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SV = new THREE.Vector3();
  const inst = (geo, m, list, fn) => { const im = new THREE.InstancedMesh(geo, m, list.length); list.forEach((o, i) => { fn(o, i); im.setMatrixAt(i, M4); }); im.instanceMatrix.needsUpdate = true; scene.add(im); return im; };
  const put = (x, y, z, rx, ry, rz, sx, sy, sz) => { E.set(rx, ry, rz, 'YXZ'); Q.setFromEuler(E); V.set(x, y, z); SV.set(sx, sy ?? sx, sz ?? sx); M4.compose(V, Q, SV); };
  const T = spots.tree;
  if (hx) {} else if (false) {
    inst(new THREE.CylinderGeometry(.09, .16, 1, 7), mat('#3A2A1A'), T, o => { const h = (2.4 + o.h * 2.6) * o.s; put(o.x, h / 2, o.z, 0, o.rot, 0, o.s, h, o.s); });
    const leaves = []; T.forEach(o => { const h = (2.4 + o.h * 2.6) * o.s; for (let j = 0; j < 7; j++) leaves.push({ o, j, h }); });
    const leafGeo = new THREE.ConeGeometry(.35, 1.9, 4, 1, true); leafGeo.translate(0, .8, 0);
    const lm = mat('#22401F', { side: THREE.DoubleSide });
    inst(leafGeo, lm, leaves, ({ o, j, h }) => put(o.x, h, o.z, 1.15 + (j % 3) * .12, o.rot + j / 7 * 6.283, 0, o.s));
  } else {
    inst(new THREE.CylinderGeometry(.08, .12, 1, 7), mat('#8B5B32'), T, o => { const h = (.9 + o.h * .8) * o.s; put(o.x, h / 2, o.z, 0, 0, 0, o.s, h, o.s); });
    const crowns = []; T.forEach(o => { const h = (.9 + o.h * .8) * o.s; [[0, .35, 0, .55], [.3, .15, .1, .38], [-.28, .2, -.05, .4]].forEach(c => crowns.push({ o, c, h })); });
    inst(new THREE.IcosahedronGeometry(1, 1), mat('#5FA956'), crowns, ({ o, c, h }) => put(o.x + c[0] * o.s, h + c[1] * o.s, o.z + c[2] * o.s, 0, o.rot, 0, c[3] * o.s));
  }
  const bl = []; spots.bush.forEach(o => { for (let j = 0; j < 3; j++) bl.push({ o, dx: (R() - .5) * .5, dz: (R() - .5) * .5, r: .25 + R() * .2 }); });
  inst(new THREE.IcosahedronGeometry(1, 0), mat(hx ? '#1F3420' : '#6DB862'), bl, ({ o, dx, dz, r }) => put(o.x + dx * o.s, .2 * o.s, o.z + dz * o.s, 0, o.rot, 0, r * o.s));
  inst(new THREE.DodecahedronGeometry(1, 0), mat(hx ? '#4A4438' : '#C9B79A'), spots.rock, o => put(o.x, .12, o.z, o.rot, o.rot * 2, o.v, (.25 + o.h * .35) * o.s));
  if (hx) for (let i = 0; i < 60; i++) { const x = (R() - .5) * 30 * WS, z = R() * zMax; if (near(x, z, 2.4)) continue; pillar(R); } // columnas sueltas quitadas (se consume el azar igual para no mover el resto del mundo)
  // escenas del mapa (casas, palmeras)
  const addV = o => { if (HW) { o.position.y = HW.hAt(o.position.x, o.position.z) - .05; o.traverse(m => { m.castShadow = m.receiveShadow = true; }); } scene.add(o); };
  g.VIGN.forEach(([r, x, y, k]) => { const [vx, vz] = toV(x, g.TOP + r * g.RH + y); if (k === 'house' || k === 'stable' || k === 'temple') { for (let i = 0; i < 3; i++) { const h = house(R, hx), hx0 = vx + (i - 1) * 7.2, hz0 = vz + (R() - .5) * 3, ry = (R() - .5) * .6; if (HW && HW.dAt(hx0, hz0) < 5.5) continue; h.position.set(hx0, 0, hz0); h.rotation.y = ry; addV(h); HCOLS.push(wBox(hx0, hz0, ry, ...h.userData.box)); } } if (k === 'palms' || k === 'tree') { for (let i = 0; i < 3; i++) { const q = R(), x = vx + (R() - .5) * 3, z = vz + (R() - .5) * 2, s = .8 + q * .35, id = ['tree_small_02', 'island_tree_03', 'tree_small_02'][i]; if (HW) (DPALM.spots = DPALM.spots || []).push({ x, y: HW.hAt(x, z) - .05, z, ry: q * 40, s: s * (i === 1 ? 1.12 : 1) }); void id; } } if (k === 'riv') { const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), mat(hx ? '#3B6266' : '#7FC4F0', { roughness: hx ? .08 : .2, metalness: hx ? .35 : .1 })); w.rotation.x = -Math.PI / 2; w.position.set(vx, .02, vz); scene.add(w); } });
  // nubes (Kids) o luciérnagas (Hero)
  let flies = null;
  if (hx) { const n = 900, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (R() - .5) * 30 * WS; pos[i * 3 + 1] = .4 + R() * 3; pos[i * 3 + 2] = R() * zMax; } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); flies = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFD27A', size: .09, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(flies); }
  else { const cm = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, emissive: '#FFFFFF', emissiveIntensity: .25 }), parts = []; for (let i = 0; i < 40; i++) { const cx = (R() - .5) * 60, cy = 9 + R() * 6, cz = R() * zMax; for (let j = 0; j < 4; j++) parts.push({ x: cx + j * 1.1 - 1.6, y: cy + R() * .5, z: cz + R() * .6, r: .8 + R() * .8 }); } inst(new THREE.IcosahedronGeometry(1, 1), cm, parts, o => put(o.x, o.y, o.z, 0, 0, 0, o.r)); }
  // objetos para juntar, un poco fuera del camino
  const items = {}, have = g.P().items || {};
  ITEMS.forEach((it, i) => {
    if (have[it.id]) return;
    const RR = rng(300 + i), reg = g.REGIONS[it.r].id;
    const eds = g.EDGES.filter(([a, b]) => a.startsWith(reg) && b.startsWith(reg));
    const [a, b] = eds[Math.floor(RR() * eds.length)], pts = edgePts[a + '>' + b], pi = 8 + Math.floor(RR() * (pts.length - 16)), p0 = pts[pi], p1 = pts[pi + 1];
    let dx = p1[0] - p0[0], dz = p1[1] - p0[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const side = RR() < .5 ? -1 : 1, off = (2.6 + RR() * 1.8) * 2.2;
    const mesh = itemMesh(it.k); mesh.position.set(p0[0] - dz * off * side, .85, p0[1] + dx * off * side); mesh.userData.by = HW ? HW.hAt(mesh.position.x, mesh.position.z) : 0; mesh.position.y += mesh.userData.by; scene.add(mesh); items[it.id] = mesh;
  });
  // paradas
  const markers = {};
  Object.values(g.NODES).forEach(n => {
    const [x, z] = toV(n.x, n.y), grp = new THREE.Group(); grp.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.62, .72, .18, 24), mat(hx ? '#3A342A' : '#FFFFFF')); base.position.y = .09; grp.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .05, 8, 32), new THREE.MeshBasicMaterial({ color: '#E9B44C' })); ring.rotation.x = Math.PI / 2; ring.position.y = .19; grp.add(ring);
    const orbM = new THREE.MeshStandardMaterial({ color: '#FFD873', emissive: '#FFB43C', emissiveIntensity: .9, roughness: .3 });
    const orb = new THREE.Mesh(n.kind === 'gate' ? new THREE.TorusGeometry(.42, .1, 10, 24, Math.PI) : new THREE.OctahedronGeometry(.28, 0), orbM); orb.position.y = n.kind === 'gate' ? .2 : 1.05; grp.add(orb);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.04, .3, 3.2, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#FFD873', transparent: true, opacity: .18, depthWrite: false, blending: THREE.AdditiveBlending })); beam.position.y = 1.6; grp.add(beam);
    const label = textSprite(n.label, hx); label.position.y = 2.25; grp.add(label);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 3, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = 1.4; grp.add(hit);
    grp.userData = { id: n.id, ring, orb, orbM, beam, label, base };
    scene.add(grp); markers[n.id] = grp;
  });
  // personaje
  const av = (hx || H3.ok) ? buildHeroAvatar(lookOf(g.P())) : buildAvatar(lookOf(g.P()), hx); if (hx || H3.ok) av.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(av);
  const n0 = g.NODES[g.P().pos], [ax, az] = toV(n0.x, n0.y); av.position.set(ax, 0, az);
  S = { renderer, scene, camera, hx, av, markers, edgePts, allPts, items, joy: { x: 0, y: 0 }, keys: {}, flies, ground, yaw: Math.PI, camYaw: 0, camDist: 6.6, camPitch: .4, walking: false, moving: false, t: 0, root, cv, sig: '', onStop: g.P().pos, W: HW, uGrass, KL, zEnd: zMax };
  // orientar al personaje hacia la próxima parada
  buildPois(scene, pois, hx, HW, rng(77), ribbon); S.pois = pois; buildTowns(scene, g, hx, HW, pois); ambReset(); S_stair = null; S.doors = buildDoors(scene, doors, hx, HW); S.stair = S_stair; setTimeout(() => tutOpen(), 1500); setTimeout(() => { if (MP.code) { const keep = Object.entries(MP.players).map(([id, p]) => [id, p.info]); MP.players = {}; keep.forEach(([id, info]) => mpAdd(id, info)); } mpUI(); mpAuto(); }, 0);
  try { scatterNodes(g, HW); if (S.npos[g.P().pos]) { const q = S.npos[g.P().pos]; av.position.set(q[0], 0, q[1]); } } catch (e) { console.warn('hitos', e); } S.spawn = [av.position.x, av.position.z];
  S0 = S; try { attrMigrate(); } catch (e) { console.warn('migración de atributos', e); } insMigrate(); setTimeout(glowUI, 400); S.mis = buildMissions(scene, g, hx, HW); { const pm = misState(); if (pm.mact && S.mis[pm.mact.id]) misCarry(S.mis[pm.mact.id], pm.mact.has); }
  const nx = nextList()[0]; if (nx) { const N = g.NODES[nx], [bx, bz] = toV(N.x, N.y); S.yaw = Math.atan2(bx - ax, bz - az); }
  av.rotation.y = S.yaw;
  camera.position.set(ax - Math.sin(S.yaw) * 6.6, 3.3, az - Math.cos(S.yaw) * 6.6);
  S.fill = new THREE.DirectionalLight(hx ? '#FFD9B0' : '#FFFFFF', hx ? .5 : .5); scene.add(S.fill); scene.add(S.fill.target);
  wireInput(); wireJoy(); if (!window.__acts) { window.__acts = 1; wireActs(); auButtons(); } resize(); addEventListener('resize', resize);
  renderer.info.autoReset = false; qInit(); fxInit(); if (hx) svBuild(scene, HW, R); try { phWorld(scene, HW, allPts, zMax, hx, R); } catch (e) { console.warn('ph', e); } try { ambWorld(scene, HW, allPts, zMax, hx); } catch (e) { console.warn('amb', e); } try { mergeHouses(scene); } catch (e) { console.warn('merge', e); } setTimeout(() => { try { if (!/[?&]nomerge/.test(location.search)) worldMerge(scene); } catch (e) { console.warn('wmerge', e); } }, 1200); setTimeout(() => { try { if (S && S.renderer.compileAsync) S.renderer.compileAsync(S.scene, S.camera); } catch (e) {} }, 300);
  const me = S, run = n => { if (S !== me) return; requestAnimationFrame(run); loop(n); }; requestAnimationFrame(run);
}
function resize() { if (!S) return; const r = S.root.getBoundingClientRect(); const w = r.width || innerWidth, h = r.height || innerHeight; S.renderer.setSize(w, h, false); S.camera.aspect = w / h; S.camera.updateProjectionMatrix(); if (S.fx) { S.fx.setPixelRatio(S.renderer.getPixelRatio()); S.fx.setSize(w, h); } }
/* gráficos altos en PC: resplandor suave (bloom) con antialias; si la compu no da, se apaga solo */
const FX_BASE = window.FX_BASE || new URL('../hero/', import.meta.url).href;
let FXM = null;
async function fxInit() {
  try { globalThis.__THREE = THREE; FXM = FXM || await import(FX_BASE + 'fx.js'); } catch (e) { return; }
  if (!S || S.fx || !S.renderer.capabilities.isWebGL2) return;
  const mob = matchMedia('(pointer: coarse)').matches, r = S.renderer, sz = r.getDrawingBufferSize(new THREE.Vector2()), rt = new THREE.WebGLRenderTarget(sz.x, sz.y, { type: THREE.HalfFloatType, samples: mob ? 2 : 4 });
  const c = new FXM.EffectComposer(r, rt); c.addPass(new FXM.RenderPass(S.scene, S.camera));
  c.addPass(new FXM.UnrealBloomPass(new THREE.Vector2(sz.x / 2, sz.y / 2), S.hx ? .2 : .14, .4, 1.0)); c.addPass(new FXM.OutputPass());
  S.fxC = c; S.fx = QUAL.lv >= 3 ? c : null; resize();
}
/* ---------- el avatar 3D en los minijuegos: cuadros renderizados del mismo personaje (ropa, piel, pelo y proporciones) ---------- */
const AVS = { key: '', p: null };
async function avSprites(av) {
  try {
    if (!THREE) THREE = await (loading || (loading = import(THREE_URL))); await heroLoad(); if (!H3.ok) return null;
    const key = JSON.stringify(av) + G().branch; if (AVS.key === key && AVS.p) return AVS.p; AVS.key = key;
    AVS.p = (async () => {
      const FW = 128, FH = 168, NF = 8, cv = document.createElement('canvas'); cv.width = FW * (NF + 1); cv.height = FH;
      const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(FW, FH, false); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#F4F0FF', '#6A5A48', 1.4)); const dl = new THREE.DirectionalLight('#FFF1DC', 2.4); dl.position.set(-2, 4, -3); sc.add(dl); const rl = new THREE.DirectionalLight('#BFD4FF', 1.1); rl.position.set(3, 2, 3); sc.add(rl);
      const o = buildHero3(Object.assign({}, av)); o.position.set(0, 0, 0); o.rotation.y = 0; sc.add(o); o.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type === 'CircleGeometry') m.visible = false; if (m.isSprite) m.visible = false; });
      const u = o.userData.h3; if (u.lamp) u.lamp.visible = false;
      // cámara de atrás y un poco de arriba (como se ve el jugador en los minijuegos); encuadre fijo: el chico se ve más chico que el adolescente
      const cam = new THREE.OrthographicCamera(-.82, .82, 2.06, -.1, .1, 20); cam.position.set(1.1, 2.6, -3.4); cam.lookAt(0, .95, 0); cam.updateProjectionMatrix();
      const x = cv.getContext('2d'), shot = (i, clip, tt) => { Object.values(u.act).forEach(a => a.stop()); const a = u.act[clip]; if (a) { a.reset(); a.play(); u.mixer.setTime(tt); } if (u.headS && u.bones.Head) u.bones.Head.scale.setScalar(u.headS); if (u.kidP) kidApply(u); o.updateMatrixWorld(true); R.render(sc, cam); x.drawImage(R.domElement, i * FW, 0); };
      const run = H3.clips.Jog_Fwd_Loop ? 'Jog_Fwd_Loop' : 'Walk_Loop', dur = H3.clips[run] ? H3.clips[run].duration : 1;
      for (let i = 0; i < NF; i++) shot(i, run, i / NF * dur); shot(NF, u.idleK, .5);
      R.dispose(); R.forceContextLoss(); return { cv, FW, FH, NF };
    })(); return AVS.p;
  } catch (e) { return null; }
}
/* ---------- Hero: tomas cinematográficas del lugar real para la intro de cada etapa ---------- */
function stageShots(nodeId) {
  try {
    if (!S || !S.hx) return null; const m = S.markers[nodeId], c = S.camera, r = S.renderer; if (!m) return null; const P0 = c.position.clone(), Q0 = c.quaternion.clone(), f0 = c.fov, a0 = c.aspect, out = [];
    const sz = r.getSize(new THREE.Vector2()), tx = m.position.x, tz = m.position.z, ty = (S.W ? S.W.hAt(tx, tz) : 0);
    const poses = [[2.4, 2.2, 9, 1.6], [-.9, 1.1, 6, 1.2], [.5, 5.5, 15, 3.5]];
    for (const [ang, h, dist, ly] of poses) { const yaw = S.yaw + ang, px = tx - Math.sin(yaw) * dist, pz = tz - Math.cos(yaw) * dist, gy = S.W ? S.W.hAt(px, pz) : 0;
      c.position.set(px, Math.max(gy + .6, ty + h), pz); c.fov = 38; c.aspect = sz.x / sz.y; c.updateProjectionMatrix(); c.lookAt(tx, ty + ly, tz);
      r.shadowMap.needsUpdate = true; if (S.fx) S.fx.render(0); else r.render(S.scene, c); out.push(r.domElement.toDataURL('image/jpeg', .82)); }
    c.position.copy(P0); c.quaternion.copy(Q0); c.fov = f0; c.aspect = a0; c.updateProjectionMatrix(); return out;
  } catch (e) { return null; }
}
/* ---------- instalar como app y "Descargar mundo completo": guarda todo en el aparato (Cache Storage) para jugar sin cortes y sin internet ---------- */
const DLW = { root: new URL('../', import.meta.url).href, cache: 'tsp-assets-v1', busy: false };
try { if ('serviceWorker' in navigator && location.protocol === 'https:' && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register('/tsp-sw.js').catch(() => {}); } catch (e) {}
// descarga en paralelo (8 a la vez, los más grandes primero) desde raw.githubusercontent (mucho más rápido en frío que githack)
// y se guarda con la misma dirección que pide el juego, así el service worker la encuentra
// orden de fuentes: R2 de Cloudflare (Worker tsp-assets, rápido y con CDN) → raw.githubusercontent → githack
const DLM = { rx: /^https:\/\/(rawcdn|raw)\.githack\.com\/galessandrodale93-pixel\/tras-sus-pasos-modelos\/[0-9a-f]{7,40}\//, raw: 'https://raw.githubusercontent.com/galessandrodale93-pixel/tras-sus-pasos-modelos/main/', r2: 'https://tsp-assets.galessandrodale-93.workers.dev/', r2ok: /^(tex|hd|ph|hero|promo|app\/(sky|voice|flora|lobby|icons|tex))\/[\w\-./]+\.(glb|ktx2|webp|jpg|jpeg|png|mp3|mp4|wasm|bin)$/i };
const dlSrc = u => { if (DLM.r2 && u.startsWith(DLM.r2)) return [u, 'https://raw.githubusercontent.com/galessandrodale93-pixel/tras-sus-pasos-modelos/main/' + u.slice(DLM.r2.length)]; const m = u.match(DLM.rx); if (!m) return [u]; const p = u.slice(m[0].length).split('?')[0], L = []; if (DLM.r2ok.test(p)) L.push(DLM.r2 + p); L.push(u.replace(DLM.rx, m0 => m0.replace(/^https:\/\/(rawcdn|raw)\.githack\.com\//, 'https://raw.githubusercontent.com/'))); L.push(u); return L; };
const DLCT = { js: 'application/javascript', css: 'text/css', json: 'application/json', wasm: 'application/wasm', glb: 'model/gltf-binary', ktx2: 'image/ktx2', webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', bin: 'application/octet-stream' };
async function dlFetch(c, files, prog) {
  const q = files.slice().sort((a, b) => b[1] - a[1]), fail = []; let got = 0; const t0 = performance.now(), tot = files.reduce((a, f) => a + f[1], 0) || 1;
  const one = async ([u, n]) => { const ext = (u.split('?')[0].split('.').pop() || '').toLowerCase();
    for (const src of dlSrc(u)) { try { const r = await fetch(src, { mode: 'cors' }); if (!r.ok) continue; const b = await r.blob(); if (!b.size && n) continue; await c.put(u, new Response(b, { headers: { 'Content-Type': DLCT[ext] || r.headers.get('content-type') || 'application/octet-stream' } })); return true; } catch (e) {} } return false; };
  const work = async () => { while (q.length) { const f = q.shift(); if (!(await one(f))) fail.push(f); got += f[1]; const s = (performance.now() - t0) / 1000, sp = got / Math.max(.5, s); prog && prog(got, tot, sp, (tot - got) / Math.max(1, sp)); } };
  await Promise.all(Array.from({ length: 8 }, work)); return fail;
}
const dlFmt = (got, tot, sp, eta) => `${(got / 1048576).toFixed(0)} de ${(tot / 1048576).toFixed(0)} MB · ${(got / tot * 100).toFixed(0)}% · ${(sp / 1048576).toFixed(1)} MB/s · faltan ${eta > 90 ? Math.ceil(eta / 60) + ' min' : Math.ceil(eta) + ' s'}`;
async function dlList(lv) {
  const man = await (await fetch(DLW.root + 'app/assets.json', { cache: 'no-store' })).json(), T = ['bajo', 'medio', 'alto', 'ultra'][lv];
  const paths = man.tiers[T] || [], abs = man.abs || []; return { files: paths.map(p => [(ABASE && DLM.r2ok.test(p) ? ABASE : DLW.root) + p, man.size[p] || 0]).concat(abs.map(([u, n]) => [u, n])), mb: man.mb[T] };
}
// primera vez en una compu: ofrecer bajar todo el mundo de una vez (como la pantalla de carga de los juegos de PC)
async function dlAsk() {
  try { if (localStorage.getItem('tsp:dlAsk') || matchMedia('(pointer: coarse)').matches || !('caches' in window)) return; localStorage.setItem('tsp:dlAsk', '1'); } catch (e) { return; }
  let mb = 0; try { mb = (await dlList(QUAL.lv)).mb; } catch (e) { return; }
  const ov = document.createElement('div'); ov.className = 'v3dl'; ov.innerHTML = `<div class="v3dl-in"><b>Tras sus pasos</b><p class="v3dl-t">¿Querés descargar todo el mundo ahora (${mb.toFixed(0)} MB, calidad ${QL[QUAL.lv]})? Así jugás sin cortes y la próxima vez arranca al instante, aun sin internet.</p><div class="v3dl-b"><button class="v3dl-x v3dl-go">Descargar mundo completo</button> <button class="v3dl-x v3dl-no">Jugar ya</button></div></div>`;
  document.body.appendChild(ov); ov.querySelector('.v3dl-no').onclick = () => ov.remove(); ov.querySelector('.v3dl-go').onclick = () => { ov.remove(); dlWorld(); };
}
async function dlWorld() {
  if (DLW.busy || !('caches' in window)) { G().toast('Este navegador no permite guardar el mundo.'); return; } const lv = QUAL.lv;
  let ov = document.getElementById('v3dl'); if (!ov) { ov = document.createElement('div'); ov.id = 'v3dl'; ov.className = 'v3dl'; document.body.appendChild(ov); }
  ov.hidden = false; ov.innerHTML = `<div class="v3dl-in"><b>Descargar mundo completo</b><p class="v3dl-t">Calidad ${QL[lv]} · preparando la lista…</p><div class="v3dl-bar"><i></i></div><p class="v3dl-n"></p><div class="v3dl-b"><button class="v3dl-x">Cancelar</button></div></div>`;
  const bar = ov.querySelector('i'), txt = ov.querySelector('.v3dl-t'), num = ov.querySelector('.v3dl-n'); let stop = false; ov.querySelector('.v3dl-x').onclick = () => { stop = true; ov.hidden = true; };
  DLW.busy = true;
  try {
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
    const { files, mb } = await dlList(lv), c = await caches.open(DLW.cache), have = new Set((await c.keys()).map(r => r.url)), miss = files.filter(([u]) => !have.has(u));
    txt.textContent = `Calidad ${QL[lv]} · ${mb.toFixed(0)} MB en total. Después el juego carga al instante y funciona sin internet.`;
    const fl = await dlFetch(c, miss, (g, t, sp, eta) => { bar.style.width = (g / t * 100).toFixed(1) + '%'; num.textContent = dlFmt(g, t, sp, eta); }); const fail = fl.length;
    if (!stop) { let used = ''; try { const e = await navigator.storage.estimate(); used = ` (${(e.usage / 1048576).toFixed(0)} MB guardados en este aparato)`; } catch (e) {} txt.textContent = fail ? `Se guardó casi todo; ${fail} archivos fallaron. Podés volver a intentarlo.` : `¡Listo! El mundo quedó guardado${used}. La próxima vez arranca al instante, aunque no tengas internet.`; ov.querySelector('.v3dl-x').textContent = 'Cerrar'; ov.querySelector('.v3dl-x').onclick = () => { ov.hidden = true; }; }
  } catch (e) { txt.textContent = 'No se pudo descargar ahora. Revisá la conexión y probá de nuevo.'; }
  DLW.busy = false;
}
/* ---------- sala de espera: antes de jugar se baja todo el mundo de la calidad del aparato (como los juegos de PC) ---------- */
const LOBBY = { done: false };
function qDetectGL() { try { const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); const e = gl && gl.getExtension('WEBGL_debug_renderer_info'); const g = gl ? (e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : ''; const lose = gl && gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); return g || ''; } catch (e) { return ''; } }
// nivel de arranque: el más alto que el aparato aguanta; después Auto baja si los cuadros tardan (y sube hasta QUAL.max)
// nivel antes de tener el renderer (para densidad del pasto y avatares en alta)
let _qE = null;
function qEarly() { if (_qE != null) return _qE; let m = 'auto'; try { m = QOLD[localStorage.getItem('tsp:q')] || localStorage.getItem('tsp:q') || 'auto'; } catch (e) {} return (_qE = QN[m] && m !== 'auto' ? { ultra: 3, alto: 2, medio: 1, bajo: 0 }[m] : qLevelFor(qDetectGL()).lv); }
function qLevelFor(g) {
  const coarse = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 4, good = /RTX|RX ?[67]\d{3}|Radeon Pro|Apple M\d|GTX|Radeon|Iris Xe|Arc|Adreno \(TM\) 7[3-9]\d|Mali-G7[1-9]|Immortalis|Xclipse|Apple GPU/i.test(g);
  if (/SwiftShader|llvmpipe|Software/i.test(g)) return { lv: 0, max: 1 };
  if (coarse) return { lv: 1, max: 1 }; // celulares y tablets: Medio como máximo (memoria de WebGL limitada, sobre todo en iPhone)
  if (good) return { lv: 3, max: 3 };
  return { lv: 2, max: 3 };
}
const HOWTO = {
  kids: [['🚶', 'Caminá', 'Mové el círculo de abajo (o las flechas) para caminar por donde quieras.'], ['🗺️', 'El mapa', 'Tocá «Mapa» para ver dónde estás y elegir a dónde ir.'], ['🎮', 'Juegos', 'En cada parada hay una historia de Jesús y un juego. ¡Cada juego es distinto!'], ['🌟', 'Brillá', 'Con el botón de la estrella hacés una pose y te llenás de luz. Ayudar a otros te hace brillar más.'], ['💪', 'Tus fuerzas', 'Cuando subís de nivel ganás puntos para tus fuerzas. Tocá la estrellita de arriba para elegirlas.'], ['🏅', 'Tus puntos', 'Los puntos que juntás se guardan y siguen sumando en todos los cursos.']],
  hero: [['🧭', 'Recorré la tierra', 'Joystick o W A S D para moverte; arrastrá para mirar. El mundo es abierto: explorá.'], ['🗺️', 'Mapa', 'El mapa muestra el camino, las paradas, las misiones y dónde estás. Tocá un lugar para marcar el destino.'], ['⚔️', 'Minijuegos', 'Cada parada cuenta un pasaje y trae un desafío propio. Ninguno se repite.'], ['✦', 'Resplandor', 'Las buenas obras y las poses llenan tu Resplandor: un reflejo de Dios, no de vos. Los demás lo ven en tu nombre.'], ['📈', 'Atributos', 'Al subir de nivel ganás puntos para repartir. El ícono junto a tu nivel te avisa cuántos tenés.'], ['🏆', 'Progreso', 'Tus puntos, insignias y Resplandor se acumulan entre todos los cursos.']]
};
// sala de espera: aparece al instante (fondo con degradé, fotos del juego, versículos y tarjetas), baja el mundo completo
// y se queda mientras se arma el mundo 3D; se cierra sola cuando todo está listo
const LB_IMG = { hero: ['hero_1.jpg', 'hero_2.jpg', 'hero_3.jpg', 'hero_4.jpg', 'hero_5.jpg'], kids: ['kids_1.jpg', 'kids_2.jpg', 'kids_3.jpg', 'kids_4.jpg', 'kids_5.jpg'] };
function lobbyUI(kid) {
  const ov = document.createElement('div'); ov.className = 'v3lobby' + (kid ? ' kid' : ''); const H = HOWTO[kid ? 'kids' : 'hero'];
  const im = (LB_IMG[kid ? 'kids' : 'hero'] || []).map(n => `url(${DLM.r2}app/lobby/${n}),url(${DLW.root}app/lobby/${n})`);
  let lines = []; try { lines = (G().lobbyLines && G().lobbyLines()) || []; } catch (e) {}
  ov.innerHTML = `<div class="lb-sl">${im.map((u, i) => `<div class="lb-im${i ? '' : ' on'}" style="background-image:${u}"></div>`).join('')}</div><div class="lb-shade"></div>
    <div class="lb-top"><button class="lb-mus" aria-label="Tocar para música">🎵 <span>Tocar para música</span></button></div>
    <div class="lb-in">${kid ? '<small>Kids</small>' : `<h1 class="lb-hero"><picture><source type="image/webp" srcset="${new URL('./lobby/hero-oro-v4.webp', import.meta.url).href}"><img src="${new URL('./lobby/hero-oro-v4.png', import.meta.url).href}" alt="Hero" width="1200" height="308" onerror="this.closest('h1').outerHTML='<small>Hero</small>'"></picture></h1>`}<b>Tras sus pasos</b><p class="lb-sub">${kid ? '¡Vamos a caminar la historia de Jesús!' : 'Recorré la tierra donde caminó Jesús.'}</p>
      <p class="lb-vs" aria-live="polite"></p>
      <div class="lb-cards" hidden></div>
      <div class="lb-dl"><div class="lb-bar"><i></i></div><p class="lb-n">Preparando el mundo…</p></div>
      <button class="lb-go" hidden></button><p class="lb-note"></p></div>`;
  document.body.appendChild(ov); document.body.classList.add('v3lb');
  const $ = q => ov.querySelector(q), ims = [...ov.querySelectorAll('.lb-im')], T = [];
  let si = 0; T.push(setInterval(() => { if (ims.length < 2) return; ims[si].classList.remove('on'); si = (si + 1) % ims.length; ims[si].classList.add('on'); }, 5000));
  let vi = Math.floor(Math.random() * Math.max(1, lines.length)); const vs = $('.lb-vs'), verse = () => { if (!lines.length) return; vs.classList.remove('on'); setTimeout(() => { vs.textContent = lines[vi % lines.length]; vi++; vs.classList.add('on'); }, 350); }; verse(); T.push(setInterval(verse, 8000));
  const fresh = (() => { try { return !localStorage.getItem('tsp:howto'); } catch (e) { return false; } })(), cards = $('.lb-cards'); let ci = 0;
  const card = () => { cards.innerHTML = `<div class="lb-card"><span class="lb-ico">${H[ci][0]}</span><div><b>${H[ci][1]}</b><p>${H[ci][2]}</p></div></div><div class="lb-dots">${H.map((_, i) => `<i class="${i === ci ? 'on' : ''}"></i>`).join('')}</div>`; };
  if (fresh) { cards.hidden = false; card(); T.push(setInterval(() => { ci = (ci + 1) % H.length; card(); }, 6500)); cards.onclick = () => { ci = (ci + 1) % H.length; card(); }; }
  let mus = null, on = false; const L2 = MUS[kid ? 'kids' : 'hero'] || [], mb = $('.lb-mus');
  mb.onclick = () => { if (!L2.length) return; if (!mus) { mus = new Audio(L2[Math.floor(Math.random() * L2.length)]); mus.loop = true; mus.volume = .5; } on = !on; if (on) mus.play().catch(() => {}); else mus.pause(); mb.innerHTML = on ? '🔊 <span>Música</span>' : '🔇 <span>Música</span>'; mb.classList.toggle('on', on); };
  const U = { ov, $, bar: $('.lb-bar i'), num: $('.lb-n'), go: $('.lb-go'), note: $('.lb-note'), dl: $('.lb-dl'),
    prog(f, txt) { if (f == null) this.bar.parentNode.classList.add('ind'); else { this.bar.parentNode.classList.remove('ind'); this.bar.style.width = (Math.max(0, Math.min(1, f)) * 100).toFixed(1) + '%'; } if (txt != null) this.num.textContent = txt; },
    close() { T.forEach(clearInterval); try { localStorage.setItem('tsp:howto', '1'); } catch (e) {} ov.classList.add('out'); document.body.classList.remove('v3lb'); if (mus) { const m = mus; const f = setInterval(() => { m.volume = Math.max(0, m.volume - .05); if (m.volume <= 0) { clearInterval(f); m.pause(); } }, 60); } setTimeout(() => ov.remove(), 750); } };
  return U;
}
// devuelve la sala abierta (para cerrarla cuando el mundo está armado) o null
async function lobby() {
  const kid = G().branch !== 'ados'; const U = lobbyUI(kid);
  if (LOBBY.done || !('caches' in window)) { LOBBY.done = true; U.prog(null, 'Armando el mundo…'); return U; }
  let list = null, c = null, miss = [], files = [];
  try { list = await dlList(matchMedia('(pointer: coarse)').matches ? 1 : 3); files = list.files; c = await caches.open(DLW.cache); const have = new Set((await c.keys()).map(r => r.url)); miss = files.filter(([u]) => !have.has(u)); } catch (e) { LOBBY.done = true; U.prog(null, 'Armando el mundo…'); return U; }
  const tot = files.reduce((a, f) => a + f[1], 0) || 1, MB = n => (n / 1048576).toFixed(0);
  const purge = () => { try { const keep = new Set(files.map(f => f[0])); c.keys().then(K => K.forEach(rq => { const m = rq.url.match(DLM.rx); if (m && DLM.r2ok.test(rq.url.slice(m[0].length)) && !keep.has(rq.url)) c.delete(rq); })); } catch (e) {} };
  if (!miss.length) { LOBBY.done = true; purge(); U.prog(1, 'Mundo guardado en este aparato ✓ · Armando el mundo…'); return U; }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  U.note.textContent = `Se guarda el mundo completo en máxima calidad (${MB(tot)} MB). Solo la primera vez: después entrás al instante, aun sin internet.`;
  return new Promise(resolve => {
    const run = async () => { U.go.hidden = true; const base = tot - miss.reduce((a, f) => a + f[1], 0);
      const fail = await dlFetch(c, miss, (g, t, sp, eta) => { const G2 = base + g; U.prog(G2 / tot, 'Descargando mundo en máxima calidad · ' + dlFmt(G2, tot, sp, (tot - G2) / Math.max(1, sp))); });
      if (fail.length) { miss = fail; U.go.hidden = false; U.go.textContent = 'Reintentar'; U.note.textContent = `Faltan ${fail.length} archivos (se cortó la conexión). Tocá «Reintentar».`; U.go.onclick = () => run(); return; }
      LOBBY.done = true; purge(); U.prog(1, '¡Listo! Mundo guardado ✓'); U.note.textContent = 'Todo listo para jugar sin cortes.'; U.go.hidden = false; U.go.textContent = '¡Listo! Entrar'; U.go.classList.add('ready');
      U.go.onclick = () => { U.go.hidden = true; U.note.textContent = ''; U.prog(null, 'Armando el mundo…'); resolve(U); }; };
    run();
  });
}
/* ---------- perfilador (?prof=1): milisegundos por sistema, promedio de los últimos cuadros ---------- */
const PROF = { on: /[?&#]prof=1/.test(location.href), acc: {}, n: 0, el: null,
  add(o) { for (const k in o) this.acc[k] = (this.acc[k] || 0) + o[k]; if (++this.n < 60) return; const t = Object.entries(this.acc).map(([k, v]) => `${k} ${(v / this.n).toFixed(1)}`).join(' · '); this.acc = {}; this.n = 0;
    if (!this.el) { this.el = document.createElement('div'); this.el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(22px + env(safe-area-inset-top,0px));z-index:99999;font:10px/1.3 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:5px;pointer-events:none;white-space:nowrap'; document.body.appendChild(this.el); }
    const i = S.renderer.info; this.el.textContent = `ms: ${t} · ${QUAL.lastCalls || 0} dib · ${((QUAL.lastTris || 0) / 1e6).toFixed(2)}M tri · ${i.memory.textures} tex · ${i.programs ? i.programs.length : 0} prog`; this.last = t; } };
/* ---------- calidad gráfica: Auto (detecta la placa de video y mide los cuadros), Ultra, Alto, Medio, Bajo; contador con ?fps=1 ---------- */
const QUAL = { mode: 'auto', lv: 2, max: 3, dpr: 1, cap: 1.5, ema: 16, slow: 0, fast: 0, cool: 0, fr: 0, ft: new Float32Array(300), fi: 0, el: null, acc: 0, gpu: '' };
const QN = { auto: 'Auto', ultra: 'Ultra', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' }, QL = ['Bajo', 'Medio', 'Alto', 'Ultra'], QOLD = { alta: 'alto', media: 'medio', baja: 'bajo' };
const QT = { dpr: [1, 1, 1.25, 1.5], sh: [1024, 1024, 2048, 2048], shEvery: [4, 3, 2, 1], far: [36, 60, 110, 140], dens: [.12, .45, 1, 1], see: [.42, .62, 1, 1.25], near: [0, .5, 1, 1] };
// nivel según la placa de video (si el navegador lo informa) y el tipo de aparato
function qDetect() { let g = ''; try { const gl = S.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); g = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) {} QUAL.gpu = g || ''; return qLevelFor(QUAL.gpu); }
function qInit() {
  try { QUAL.mode = localStorage.getItem('tsp:q') || 'auto'; } catch (e) {} QUAL.mode = QOLD[QUAL.mode] || QUAL.mode; if (!QN[QUAL.mode]) QUAL.mode = 'auto';
  const D = qDetect(); QUAL.max = D.max; QUAL.lv = QUAL.mode === 'auto' ? D.lv : { ultra: 3, alto: 2, medio: 1, bajo: 0 }[QUAL.mode];
  QUAL.dpr = 0; qApply(); try { if (localStorage.getItem('tsp:fps') === '1') qOverlay(); } catch (e) {}
}
function qApply() {
  if (!S) return; const r = S.renderer, lv = QUAL.lv; QUAL.cap = Math.min(QT.dpr[lv], devicePixelRatio || 1);
  if (!QUAL.dpr || QUAL.mode !== 'auto' || QUAL.dpr > QUAL.cap) QUAL.dpr = QUAL.cap; r.setPixelRatio(QUAL.dpr);
  if (S.W) { const L = S.W.sunL, sz = QT.sh[lv]; if (L.shadow.mapSize.x !== sz) { L.shadow.mapSize.set(sz, sz); if (L.shadow.map) { L.shadow.map.dispose(); L.shadow.map = null; } } r.shadowMap.type = lv ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    if (S.W.sky && skyRes() !== SKY.res) skyLoad(S.W.sky, !S.hx); }
  r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = true;
  // Bajo: sin sombras (en el celular es lo que más cuesta); al cambiar, los materiales se recompilan una vez
  { const want = lv > 0; if (r.shadowMap.enabled !== want) { r.shadowMap.enabled = want; S.scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); }); } }
  if (TEXK.tlo) TEXK.tlo.value = lv === 0 ? 1 : 0; WATER.mats.forEach(m => { m.clearcoat = lv ? 1 : 0; m.envMap = lv ? m.userData.env || m.envMap : null; m.needsUpdate = true; });
  if (S.fxC) S.fx = lv >= 3 ? S.fxC : null;
  if (lv < 2) S.scene.environment = null; else skyEnv();
  try { texTier(lv); } catch (e) {} if (TEXK.tdet) TEXK.tdet.value = lv >= 2 ? 1 : 0;
  FLORA.acc = 0; PH.near = 0; resize();
}
function qSet(mode) { _qE = null; QUAL.mode = mode; try { localStorage.setItem('tsp:q', mode); } catch (e) {} QUAL.dpr = 0; qInit(); }
function qCycle() { const k = Object.keys(QN), m = k[(k.indexOf(QUAL.mode) + 1) % k.length]; qSet(m); return 'Calidad gráfica: ' + QN[m] + (m === 'auto' ? ' (' + QL[QUAL.lv] + ')' : ''); }
function qLabel() { return QN[QUAL.mode] + (QUAL.mode === 'auto' ? ' · ' + QL[QUAL.lv] : ''); }
// cada cuadro: mide el tiempo, ajusta resolución y nivel en Auto y decide si se redibujan las sombras
function qFrame(raw) {
  QUAL.fr++; QUAL.ft[QUAL.fi++ % 300] = raw; QUAL.ema += (Math.min(raw, 100) - QUAL.ema) * .05;
  if (QUAL.mode === 'auto' && !window.__fxKeep) { QUAL.cool -= raw;
    if (QUAL.ema > 20) { QUAL.slow += raw; QUAL.fast = 0; } else if (QUAL.ema < 12.5) { QUAL.fast += raw; QUAL.slow = 0; } else { QUAL.slow = 0; QUAL.fast = 0; }
    if (QUAL.slow > (QUAL.fr < 900 ? 700 : 2000)) { QUAL.slow = 0; QUAL.cool = 8000; if (QUAL.dpr > QUAL.cap * .8 + .01) { QUAL.dpr = Math.max(.75, QUAL.dpr - .15); S.renderer.setPixelRatio(QUAL.dpr); resize(); } else if (QUAL.lv > 0) { QUAL.lv--; QUAL.dpr = 0; qApply(); } else if (QUAL.dpr > .76) { QUAL.dpr = Math.max(.75, QUAL.dpr - .15); S.renderer.setPixelRatio(QUAL.dpr); resize(); } }
    else if (QUAL.fast > 7000 && QUAL.cool <= 0) { QUAL.fast = 0; QUAL.cool = 6000; if (QUAL.dpr < QUAL.cap - .01) { QUAL.dpr = Math.min(QUAL.cap, QUAL.dpr + .1); S.renderer.setPixelRatio(QUAL.dpr); resize(); } else if (QUAL.lv < QUAL.max) { QUAL.lv++; QUAL.dpr = 0; qApply(); } } }
  const every = QT.shEvery[QUAL.lv]; if (QUAL.fr % every === 0) S.renderer.shadowMap.needsUpdate = true;
  if (QUAL.el && (QUAL.acc += raw) > 500) { QUAL.acc = 0; const a = Array.from(QUAL.ft.slice(0, Math.min(300, QUAL.fi))).sort((x, y) => x - y), n = a.length, avg = a.reduce((x, y) => x + y, 0) / Math.max(1, n), p99 = a[Math.floor(n * .99)] || 0, i = S.renderer.info;
    QUAL.el.textContent = `${(1000 / avg).toFixed(0)} fps · 1% ${(1000 / Math.max(1, p99)).toFixed(0)} · ${QUAL.lastCalls || 0} dib · ${((QUAL.lastTris || 0) / 1000).toFixed(0)}k tri · ${i.memory.textures} tex · ${QUAL.dpr.toFixed(2)}x · ${qLabel()}`; }
}
function qFpsToggle() { let on = false; try { on = localStorage.getItem('tsp:fps') !== '1'; localStorage.setItem('tsp:fps', on ? '1' : '0'); } catch (e) {} if (on) qOverlay(); else if (QUAL.el) { QUAL.el.remove(); QUAL.el = null; } return on; }
function qOverlay() { if (QUAL.el) return; const d = document.createElement('div'); d.id = 'v3fps'; d.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99999;font:12px/1.3 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.6);padding:4px 7px;border-radius:6px;pointer-events:none'; document.body.appendChild(d); QUAL.el = d; }
function qProf() { return PROF.last || ''; }
function qStats() { const a = Array.from(QUAL.ft.slice(0, Math.min(300, QUAL.fi))).sort((x, y) => x - y), n = a.length, avg = a.reduce((x, y) => x + y, 0) / Math.max(1, n), i = S.renderer.info; return { avgFps: +(1000 / avg).toFixed(1), low1: +(1000 / (a[Math.floor(n * .99)] || 1)).toFixed(1), p50ms: +(a[n >> 1] || 0).toFixed(1), maxMs: +(a[n - 1] || 0).toFixed(1), calls: i.render.calls, tris: i.render.triangles, programs: i.programs ? i.programs.length : 0, textures: i.memory.textures, geoms: i.memory.geometries, dpr: QUAL.dpr, mode: QUAL.mode, lv: QUAL.lv, tier: QL[QUAL.lv], gpu: QUAL.gpu }; }
function fxWatch() {}

/* ---------- estado de las paradas ---------- */
function nextList() { const g = G(), p = g.P(); return (g.ADJ[p.pos] || []).filter(id => g.reachable(id) && !g.visited(id)); }
function refresh() {
  const g = G(), p = g.P(); if (!p) return;
  const sig = JSON.stringify([p.pos, Object.keys(p.done).length, p.visited.length]);
  if (sig === S.sig) return; S.sig = sig;
  Object.values(S.markers).forEach(m => {
    const id = m.userData.id, n = g.NODES[id], reach = g.reachable(id), vis = g.visited(id), done = n.kind === 'ch' && g.isDone(id), ok = done && p.done[id];
    const col = done ? (ok ? '#5FD39A' : '#FF7A5C') : (reach && !vis ? '#FFD873' : (vis ? '#E9B44C' : '#8C8A84'));
    m.userData.orbM.color.set(col); m.userData.orbM.emissive.set(done ? (ok ? '#2FAE7C' : '#C9452E') : (reach ? '#FFB43C' : '#2A2A2A'));
    m.userData.orbM.emissiveIntensity = reach && !vis ? 1.2 : .35;
    m.userData.beam.visible = reach && !vis && !done; m.userData.ring.material.color.set(reach ? '#E9B44C' : '#6B6A64');
    m.userData.label.material.opacity = reach || vis ? 1 : .45; m.userData.label.visible = id !== p.pos;
    m.userData.orb.visible = id !== p.pos;
  });
  ui();
}
function ui() {
  const g = G(), p = g.P(), box = document.getElementById('v3go'); if (!box) return;
  const cur = g.NODES[p.pos], list = nextList();
  if (S.walking || S.freeMoving || S.quiet) { box.innerHTML = ''; return; }
  if (cur.kind === 'ch' && !g.isDone(cur.id)) { box.innerHTML = `<button class="v3b main" data-to="${cur.id}">Entrar ${aL(cur.label)}</button>`; }
  else if (list.length === 1) { const n = g.NODES[list[0]]; box.innerHTML = `<button class="v3b main" data-to="${n.id}">Caminar ${aL(n.label)}</button>`; }
  else if (list.length > 1) { const [a, b] = list.map(id => g.NODES[id]).sort((x, y) => x.x - y.x); box.innerHTML = `<span class="v3k">El camino se bifurca</span><div class="v3two"><button class="v3b" data-to="${a.id}">← ${esc(a.label)}</button><button class="v3b" data-to="${b.id}">${esc(b.label)} →</button></div>`; }
  else box.innerHTML = '';
  box.querySelectorAll('[data-to]').forEach(bt => bt.onclick = () => go(bt.dataset.to));
}
const aL = l => /^el /i.test(l) ? 'al ' + esc(l.slice(3)) : 'a ' + esc(l);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- caminar ---------- */
async function go(id) {
  const g = G(), p = g.P(); if (S.walking) return;
  if (id === p.pos) { g.arrive(id); return; }
  if (!g.reachable(id)) { g.toast('Esa parada todavía está cerrada. Seguí el camino que brilla.'); return; }
  const path = g.bfs(p.pos, id); if (!path) return;
  S.walking = true; S.quiet = false; wake(); ui();
  const h = g.NODES[p.pos], [hx0, hz0] = toV(h.x, h.y); if (Math.hypot(S.av.position.x - hx0, S.av.position.z - hz0) > .3) await walkLine(hx0, hz0);
  for (let i = 0; i < path.length - 1; i++) await walkEdge(path[i], path[i + 1]);
  if (S.npos && S.npos[id]) await walkLine(S.npos[id][0], S.npos[id][1]);
  S.walking = false; S.onStop = id; p.pos = id; g.save(); S.sig = ''; g.arrive(id); refresh();
}
function walkLine(x1, z1) {
  return new Promise(res => {
    const x0 = S.av.position.x, z0 = S.av.position.z, len = Math.hypot(x1 - x0, z1 - z0), dur = len / 5 * 1000, t0 = performance.now(); S.moving = true;
    const ty = Math.atan2(x1 - x0, z1 - z0);
    const step = now => { const k = Math.min(1, (now - t0) / dur); S.av.position.set(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k); let d = ty - S.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; S.yaw += d * .2; S.av.rotation.y = S.yaw; if (k < 1) requestAnimationFrame(step); else { S.moving = false; res(); } };
    requestAnimationFrame(step);
  });
}
function walkEdge(a, b) {
  return new Promise(res => {
    let pts = S.edgePts[a + '>' + b]; if (!pts) pts = (S.edgePts[b + '>' + a] || []).slice().reverse(); if (pts.length < 2) { res(); return; }
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const speed = 5, dur = len / speed * 1000, t0 = performance.now(); S.moving = true;
    const step = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur)), f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, z = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
      const ty = Math.atan2(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      let d = ty - S.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; S.yaw += d * .2;
      S.av.position.set(x, 0, z); S.av.rotation.y = S.yaw;
      if (k < 1) requestAnimationFrame(step); else { S.moving = false; res(); }
    };
    requestAnimationFrame(step);
  });
}

/* ---------- mochila ---------- */
function collect(id, m) {
  const g = G(), p = g.P(); p.items = p.items || {}; if (p.items[id]) return;
  p.items[id] = true; m.userData.gone = .001; g.save(); g.refreshHud && g.refreshHud();
  const it = ITEMS.find(x => x.id === id); bagBtn(); pop(it);
}
function pop(it) {
  const el = document.getElementById('v3pop'); if (!el) return;
  el.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[it.k]}</svg></span><span class="tx"><small>¡Encontraste algo! +${ITEM_PTS}</small><b>${esc(it.name)}</b></span>`;
  el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  clearTimeout(pop.t); pop.t = setTimeout(() => { el.classList.remove('on'); el.hidden = true; }, 2600);
}
// en 3D la mochila va arriba (donde estaba el menú ☰) y el menú baja al lugar de la mochila
function hudSwap(on) {
  const m = document.getElementById('menuBtn'), b = document.getElementById('v3bag'); if (!m || !b) return; const H = hudSwap;
  if (on && !H.on) { H.mp = m.parentNode; H.mn = m.nextSibling; H.bp = b.parentNode; H.bn = b.nextSibling; H.mp.insertBefore(b, m); document.body.appendChild(m); m.classList.add('v3menufab'); b.classList.add('v3baghud'); H.on = true; }
  else if (!on && H.on) { H.mp.insertBefore(m, H.mn && H.mn.parentNode === H.mp ? H.mn : null); H.bp.insertBefore(b, H.bn && H.bn.parentNode === H.bp ? H.bn : null); m.classList.remove('v3menufab'); b.classList.remove('v3baghud'); H.on = false; }
}
// ---------- HUD mínimo: abanico de íconos (se despliega hacia arriba y se repliega solo a los 4 s) y minimapa ----------
const FAN = { el: null, open: false, t: 0 };
function fanFire(b) { if (!b) return; if (b.onpointerdown) b.onpointerdown({ preventDefault() {}, stopPropagation() {}, pointerType: 'mouse', button: 0, target: b, currentTarget: b }); else b.click(); }
function fanItems() {
  const L = [], money = (() => { const m = document.querySelector('#v3surv .sv-money'); return m ? (m.textContent.match(/\d+/) || ['0'])[0] : null; })();
  L.push(['💪', 'Atributos', () => openBag('at')]);
  if (S && S.sv) { L.push(['🍽️', 'Comer (C)', () => svEat()]); L.push(['🔨', 'Fabricar (B)', () => svCraft()]); if (money != null) L.push([`<span class="fan-coin"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#F5C443" stroke="#8A5A12" stroke-width="1.6"/><circle cx="12" cy="12" r="7" fill="none" stroke="#B9801E" stroke-width="1.2"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="900" font-family="Georgia,serif" fill="#7A4E0E">D</text></svg><em>${money}</em></span>`, `${money} denarios (monedas)`, () => openBag()]); }
  const acts = document.getElementById('v3acts'); if (acts) acts.querySelectorAll('button[data-a]').forEach(b => { if (b.dataset.a === 'room') return; L.push([b.innerHTML, b.title || b.getAttribute('aria-label') || b.dataset.a, () => fanFire(b)]); });
  try { if (G().hstHas && G().hstHas()) L.push(['📜', 'Rollo de Isaías', () => G().hstScroll()]); } catch (e) {}
  L.push(['⭐', 'Mi progreso', () => { const h = document.getElementById('hudLv'); if (h) h.click(); }]);
  L.push(['☰', 'Menú y ajustes', () => { const m = document.getElementById('menuBtn'); if (m) m.click(); }]);
  return L;
}
function fanArm() { clearTimeout(FAN.t); if (FAN.open) FAN.t = setTimeout(() => fanSet(false), 4000); }
function fanSet(open) {
  const el = FAN.el; if (!el) return; FAN.open = open; el.classList.toggle('open', open); el.querySelector('.fan-tg').setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) { const box = el.querySelector('.fan-items'), L = fanItems(); box.innerHTML = L.map(([ico, t], i) => `<button data-i="${i}" title="${String(t).replace(/"/g, '&quot;')}" aria-label="${String(t).replace(/<[^>]+>/g, '').replace(/"/g, '&quot;')}" style="transition-delay:${(i * 22)}ms">${ico}</button>`).join('');
    box.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); const f = L[+b.dataset.i]; try { f && f[2](); } catch (er) {} fanArm(); setTimeout(() => { if (FAN.open) fanSet(true); }, 250); }); }
  fanArm();
}
function bagHud() { const b = document.getElementById('v3bag'), row = document.querySelector('.hud .hud-row'); if (!b || !row || b.parentNode === row) return; const sc = row.querySelector('.pill.score'); row.insertBefore(b, sc ? sc.nextSibling : null); b.classList.add('v3baghud'); }
function fanInit() {
  if (FAN.el && document.body.contains(FAN.el)) return; const el = document.createElement('div'); el.id = 'v3fan'; el.className = 'v3fan';
  el.innerHTML = '<div class="fan-items" role="menu"></div><button class="fan-tg" aria-label="Más opciones" aria-expanded="false"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="6" cy="6" r="2.2" fill="currentColor"/><circle cx="12" cy="6" r="2.2" fill="currentColor"/><circle cx="18" cy="6" r="2.2" fill="currentColor"/><circle cx="6" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="18" cy="12" r="2.2" fill="currentColor"/><circle cx="6" cy="18" r="2.2" fill="currentColor"/><circle cx="12" cy="18" r="2.2" fill="currentColor"/><circle cx="18" cy="18" r="2.2" fill="currentColor"/></svg></button>';
  document.body.appendChild(el); FAN.el = el; el.querySelector('.fan-tg').onclick = e => { e.stopPropagation(); fanSet(!FAN.open); };
  el.addEventListener('pointerdown', () => fanArm(), true); el.addEventListener('pointermove', () => fanArm(), { passive: true });
}
const MINI = { cv: null, t: 0 };
// Hero: los hitos de cada etapa no van en fila sobre el camino; se reparten por la etapa (cerca del lugar que nombran) en suelo alcanzable.
// El camino queda como guía: "Caminar a…" sigue el camino y después hace un tramo recto (verificado libre) hasta el hito.
function nodeActive() { const g = G(), p = g.P(), cur = g.NODES[p.pos]; if (cur && cur.kind === 'ch' && !g.isDone(cur.id)) return cur.id; const L = nextList(); return L[0] || null; }
function scatterNodes(g, HW) {
  S.npos = {}; if (!S.hx || !HW) return; const used = [];
  const wet = (x, z) => { if (waterWet(x, z, null) > .06) return true; for (const B of WATER.basins) if (Math.hypot(x - B.x, z - B.z) < B.r * 1.3 + 1.5) return true; return false; };
  const segClear = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .8); for (let i = 2; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; if (blockedAt(x, z) || wet(x, z)) return false; } return true; };
  const ok = (x, z) => { if (Math.abs(x) > Math.min(XB * .88, (HW.X1 || XB) - 6)) return false; if (HW.dAt(x, z) < 8) return false; if (wet(x, z)) return false; const sl = Math.hypot(HW.hAt(x + 1, z) - HW.hAt(x - 1, z), HW.hAt(x, z + 1) - HW.hAt(x, z - 1)) / 2; if (sl > .36) return false;
    for (let k = 0; k < 8; k++) { const an = k / 8 * 6.283; if (blockedAt(x + Math.cos(an) * 1.4, z + Math.sin(an) * 1.4)) return false; } for (const u of used) if (Math.hypot(x - u[0], z - u[1]) < 12) return false; return true; };
  Object.values(g.NODES).forEach(n => {
    if (n.kind !== 'ch') return; const m = S.markers[n.id]; if (!m) return; const [px, pz] = toV(n.x, n.y); let h = 0; for (const c of n.id) h = (h * 31 + c.charCodeAt(0)) >>> 0; const R = rng(4000 + h % 9973), lab = (n.label || '').toLowerCase();
    const poi = lab && lab !== 'el camino' ? (S.pois || []).find(q => q.r === n.r && q.k !== 'river' && q.name && (q.name.toLowerCase().includes(lab) || lab.includes(q.name.toLowerCase()))) : null;
    let best = null; for (let t = 0; t < 160 && !best; t++) { let x, z; if (poi && t < 60) { const a = R() * 6.283, r = 7 + R() * 9; x = poi.x + Math.cos(a) * r; z = poi.z + Math.sin(a) * r; } else { const a = R() * 6.283, r = 16 + R() * (t < 110 ? 22 : 34); x = px + Math.cos(a) * r; z = pz + Math.sin(a) * r * .6; }
      if (ok(x, z) && segClear(px, pz, x, z)) best = [x, z]; }
    if (!best) return; used.push(best); m.position.set(best[0], Math.max(0, HW.hAt(best[0], best[1])), best[1]); S.npos[n.id] = best;
  });
}
const COMP = { el: null, t: 0 };
/* el HUD de arriba se acomoda midiendo el marco del panel: Día, Mapa y la bolsa van justo debajo, y la guía «Rumbo a…»
   se corre debajo de todo si en el centro chocaría con el panel (celular en vertical). Corre en Hero y en Kids. */
const HUDL = { t: 0 };
function hudLay() {
  const h = document.querySelector('body.v3on .hud-in'), B = document.body.style; if (!h) return; const r = h.getBoundingClientRect(); if (!r.width || !r.height) return;
  const hb = Math.round(r.bottom + 8); if (B.getPropertyValue('--hudB') !== hb + 'px') B.setProperty('--hudB', hb + 'px');
  const c = COMP.el; if (!c || c.hidden) return; const w = c.offsetWidth || 190, L = (innerWidth - w) / 2, R = L + w;
  const sv = document.querySelector('body.v3on .v3surv') || document.getElementById('v3mmbox'), sr = sv && sv.offsetParent !== null ? sv.getBoundingClientRect() : null;
  const hit = q => q && L < q.right + 8 && R > q.left - 8; let top = '';
  if (hit(r)) top = Math.round(Math.max(r.bottom, hit(sr) ? sr.bottom : 0) + 8) + 'px';
  if (B.getPropertyValue('--compT') !== top) { if (top) B.setProperty('--compT', top); else B.removeProperty('--compT'); }
}
function compassTick(dt) {
  HUDL.t = (HUDL.t || 0) - dt; if (HUDL.t <= 0) { HUDL.t = .25; try { hudLay(); } catch (e) {} }
  if (!S || !S.hx) return; COMP.t -= dt; if (COMP.t > 0) return; COMP.t = .2;
  if (!COMP.el) { COMP.el = document.createElement('div'); COMP.el.className = 'v3comp'; COMP.el.innerHTML = '<i><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l6 15-6-3.5L6 18Z" fill="currentColor"/></svg></i><span></span>'; COMP.el.onclick = () => openMap(); document.body.appendChild(COMP.el); }
  const a = S.av.position, bg = S.sv && S.sv.bag; if (bg && !S.walking && !sheetUp()) { const dx = bg.x - a.x, dz = bg.z - a.z, d = Math.hypot(dx, dz), C = S.yaw + S.camYaw, th = Math.atan2(dx * -Math.cos(C) + dz * Math.sin(C), dx * Math.sin(C) + dz * Math.cos(C)); COMP.el.hidden = d < 2; COMP.el.firstChild.style.transform = `rotate(${th}rad)`; COMP.el.lastChild.textContent = `Tu bolsa · ${Math.round(d)} m`; return; }
  const id = nodeActive(), m = id && S.markers[id]; if (!m || S.walking || sheetUp()) { COMP.el.hidden = true; return; }
  const dx = m.position.x - a.x, dz = m.position.z - a.z, d = Math.hypot(dx, dz); if (d < 3.5) { COMP.el.hidden = true; return; }
  const C = S.yaw + S.camYaw, f = dx * Math.sin(C) + dz * Math.cos(C), r = dx * -Math.cos(C) + dz * Math.sin(C), th = Math.atan2(r, f);
  COMP.el.hidden = false; COMP.el.firstChild.style.transform = `rotate(${th}rad)`; const nd = G().NODES[id], rid = G().REGIONS[nd.r] && G().REGIONS[nd.r].id; let pas = ''; if (rid === 'jerusalen') { const dn = Object.keys(G().NODES).filter(k => k.startsWith('jerusalen-') && G().NODES[k].kind === 'ch' && G().isDone(k)).length; pas = ` · faltan ${Math.max(1, 7 - dn)} días para la Pascua`; } else if (rid === 'cruz') pas = ' · Pascua'; COMP.el.lastChild.textContent = `${nd.label} · ${Math.round(d)} m${pas}`;
}
function miniInit() {
  if (MINI.btn && document.body.contains(MINI.btn)) return; const b = document.createElement('button'); b.className = 'v3mapbtn'; b.setAttribute('aria-label', 'Abrir el mapa');
  b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Mapa</span>'; b.onclick = () => openMap();
  const sv = document.getElementById('v3surv'); if (sv && S && S.sv) sv.appendChild(b); else { let x = document.getElementById('v3mmbox'); if (!x) { x = document.createElement('div'); x.id = 'v3mmbox'; x.className = 'v3mmbox'; document.body.appendChild(x); } x.appendChild(b); }
  MINI.btn = b;
  // el mapa grande se cierra también tocando afuera
  if (!MINI.bd) { MINI.bd = 1; document.addEventListener('click', e => { const m = e.target; if (m && m.classList && m.classList.contains('v3map')) { const x = m.querySelector('[aria-label="Cerrar mapa"]'); if (x) x.click(); } }); }
}
function miniTick(dt) {
  if (!S || !MINI.cv || !document.body.contains(MINI.cv)) return; MINI.t -= dt; if (MINI.t > 0) return; MINI.t = .5; const cv = MINI.cv, w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  const dpr = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  if (MAPT.hx !== S.hx) { MAPT.tiles.clear(); MAPT.hx = S.hx; }
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); const a = S.av.position, sc = w / 220, X = wx => w / 2 + (wx - a.x) * sc, Y = wz => h / 2 - (wz - a.z) * sc;
  x.fillStyle = S.hx ? '#1A150E' : '#CFE3F2'; x.fillRect(0, 0, w, h);
  const L = 0, Tm = 256 / (Math.pow(2, L) * .5); let made = 0;
  for (let tz = Math.ceil((a.z + 120) / Tm); tz * Tm > a.z - 120 - Tm; tz--) for (let tx = Math.floor((a.x - 120) / Tm); tx * Tm < a.x + 120; tx++) { let t = MAPT.tiles.get(L + ':' + tx + ':' + tz); if (!t && made < 1) { t = mapTile(L, tx, tz); made++; } if (t) x.drawImage(t.cv, X(t.x0), Y(t.z0), t.size * sc + .5, t.size * sc + .5); }
  // paradas y destino
  const g = G(), p = g.P(); for (const id in S.markers) { const m = S.markers[id], px = X(m.position.x), py = Y(m.position.z); if (px < -4 || py < -4 || px > w + 4 || py > h + 4) continue; const done = p.done && p.done[id.split('-').pop()]; x.fillStyle = done ? 'rgba(255,255,255,.55)' : '#FFD25E'; x.beginPath(); x.arc(px, py, 2.6, 0, 6.283); x.fill(); }
  if (S.wp) { const px = Math.max(6, Math.min(w - 6, X(S.wp.x))), py = Math.max(6, Math.min(h - 6, Y(S.wp.z))); x.strokeStyle = '#FF7A3D'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 4.5, 0, 6.283); x.stroke(); }
  // jugador: flecha según hacia dónde mira la cámara
  x.save(); x.translate(w / 2, h / 2); x.rotate(S.av.rotation.y); x.fillStyle = '#FFFFFF'; x.strokeStyle = '#2A1A06'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, -7); x.lineTo(5, 5); x.lineTo(0, 2.5); x.lineTo(-5, 5); x.closePath(); x.fill(); x.stroke(); x.restore();
}
// PC: sugerir pantalla completa al entrar (una vez por sesión, se cierra sola a los 6 s o con la X)
function fullHint() {
  try { if (fullHint.done || !matchMedia('(pointer: fine)').matches || matchMedia('(pointer: coarse)').matches) return; const d = document; if (d.fullscreenElement || d.webkitFullscreenElement || (screen.height - innerHeight < 4 && screen.width - innerWidth < 4)) return; if (sessionStorage.getItem('tsp:fullHint')) return; sessionStorage.setItem('tsp:fullHint', '1'); } catch (e) { return; }
  fullHint.done = true; const mac = /Mac/i.test(navigator.platform || navigator.userAgent), el = document.createElement('div'); el.className = 'v3full';
  el.innerHTML = `<span>🖥️</span><p>Para vivir la experiencia completa, apretá <kbd>${mac ? 'Ctrl+Cmd+F' : 'F11'}</kbd> y jugá en pantalla completa.</p><button class="v3full-go">Pantalla completa</button><button class="v3full-x" aria-label="Cerrar">✕</button>`;
  document.body.appendChild(el); const bye = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }; const t = setTimeout(bye, 6000);
  el.querySelector('.v3full-x').onclick = () => { clearTimeout(t); bye(); };
  el.querySelector('.v3full-go').onclick = () => { clearTimeout(t); bye(); try { const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } catch (e) {} };
}
// iPhone: Safari no deja usar pantalla completa en páginas; una tarjeta (una sola vez) explica cómo instalarlo en el inicio
function iosHint() {
  try { const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); if (!ios || navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || localStorage.getItem('tsp:a2hs')) return; localStorage.setItem('tsp:a2hs', '1'); } catch (e) { return; }
  const ua = navigator.userAgent, how = /CriOS/i.test(ua) ? 'tocá <b>Compartir</b> <span class="sh">⬆︎</span> (el ícono junto a la barra de direcciones) y elegí <b>«Agregar a pantalla de inicio»</b>' : /FxiOS|EdgiOS|OPiOS|GSA\//i.test(ua) ? 'abrí este link en <b>Safari</b>, tocá <b>Compartir</b> <span class="sh">⬆︎</span> y elegí <b>«Agregar a inicio»</b>' : 'tocá <b>Compartir</b> <span class="sh">⬆︎</span> (abajo) y elegí <b>«Agregar a inicio»</b>';
  const el = document.createElement('div'); el.className = 'v3full ios'; el.innerHTML = `<span>📲</span><p>Para jugar en pantalla completa: ${how}. Después abrí <b>Kids &amp; Hero</b> desde el ícono.</p><button class="v3full-x" aria-label="Cerrar">✕</button>`;
  document.body.appendChild(el); const bye = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }; const t = setTimeout(bye, 12000); el.querySelector('.v3full-x').onclick = () => { clearTimeout(t); bye(); };
}
function bagBtn() { const b = document.getElementById('v3bag'); if (!b) return; b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 7V6a4 4 0 0 1 8 0v1h2.5a1 1 0 0 1 1 1l-1 12H5.5l-1-12a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'; b.setAttribute('aria-label', 'Abrir mochila'); }
function openBag(first) {
  const el = document.getElementById('v3sheet'); if (!el) return; S.joy.x = 0; S.joy.y = 0;
  el.innerHTML = `<div class="inv${S.hx ? ' hx' : ''}"><div class="inv-h"><b>Mochila</b><button class="bag-x" aria-label="Cerrar">✕</button></div>
    <div class="inv-tabs" role="tablist"><button data-t="eq" class="on">Equipo</button><button data-t="ob">Objetos</button><button data-t="me">Recuerdos</button><button data-t="cu">Cursos hechos</button>${S.hx ? '<button data-t="su">Trabajo</button>' : ''}<button data-t="at">${S.hx ? 'Atributos' : 'Mis fuerzas'}</button></div>
    <div class="inv-body"></div></div>`;
  el.hidden = false; const close = () => { el.hidden = true; }; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  const tabs = el.querySelectorAll('.inv-tabs button'), body = el.querySelector('.inv-body');
  const show = t => { tabs.forEach(b => b.classList.toggle('on', b.dataset.t === t)); body.innerHTML = ''; if (t === 'eq') invEquip(body); else if (t === 'ob') invItems(body); else if (t === 'su') invSurv(body); else if (t === 'at') invAttr(body); else if (t === 'cu') invCourses(body); else invMemories(body); };
  tabs.forEach(b => b.onclick = () => show(b.dataset.t)); show(first || 'eq');
}
/* ícono dibujado de cada prenda: su forma, su color real y su detalle (rayas, vendas, bordado, metal) */
const icoGear = it => {
  const c = it.c, c2 = it.c2 || 'rgba(255,240,210,.55)', L = 'rgba(255,236,200,.85)', D = 'rgba(0,0,0,.28)', id = 'g' + it.id;
  const fill = it.rb ? `url(#${id})` : c, defs = it.rb ? `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#C0392B"/><stop offset=".25" stop-color="#E6B04A"/><stop offset=".5" stop-color="#3E8A4A"/><stop offset=".75" stop-color="#3E5A9A"/><stop offset="1" stop-color="#7A3E8A"/></linearGradient></defs>` : '';
  const sh = (d, ex) => `<path d="${d}" fill="${fill}" stroke="${L}" stroke-width="1.1" stroke-linejoin="round"/>${ex || ''}`;
  const ln = (d, col, w) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w || 1.3}" stroke-linecap="round"/>`;
  let g = '';
  if (it.s === 'shirt') { const body = 'M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a3 3 0 0 1-8 0Z';
    g = sh(body, it.t === 'stripes' ? ln('M10.2 4.5V20.5M13.8 4.5V20.5', c2, 1.5) : it.t === 'seamless' ? ln('M9 3.6a3 3 0 0 0 6 0', c2, 1.4) + ln('M7.5 19.2h9', c2, 1.2) : ln('M7.4 13.5h9.2', D, 1.6)); }
  else if (it.s === 'pants') { const leg = 'M6 3h12l1 18h-5l-2-11-2 11H5Z';
    g = sh(leg, it.t === 'wrap' ? ln('M5.9 7.6l4.3 1.3M5.6 11.6l4 1.2M5.3 15.6l3.6 1.1M13.8 8.9l4.3-1.3M14.6 12.8l3.9-1.2M15.4 16.7l3.4-1.1', it.c2 || L, 1) : ln('M6 5.2h12', D, 1.8) + (it.id === 'cabra' ? ln('M7 9l-.6 2M8 13l-.6 2M7.2 17l-.5 1.8M16.6 9l.6 2M17 13.4l.5 2M16.4 17l.4 1.8', L, .8) : '')); }
  else if (it.s === 'boots') {
    g = it.t === 'sandal' ? `<path d="M4 18.5h16v2.5H4Z" fill="${fill}" stroke="${L}" stroke-width="1.1"/>` + ln('M6 18.5 9 12M9 18.5 12 12M12 12l5 6.5M8 10.5h5', c, 1.8) + ln('M6 18.5 9 12M9 18.5 12 12M12 12l5 6.5M8 10.5h5', L, .5)
      : sh('M7 3h6v10l6 3v4H5V3Z', ln('M7 7h6M5 17.6h14', D, 1.4) + (it.c2 ? ln('M7 7h6', it.c2, 1.2) : '')); }
  else if (it.s === 'gloves') {
    g = it.t === 'bracer' ? sh('M6 6h12l-1 13H7Z', ln('M6.6 9h10.8M7 16h10', c2, 1.8) + `<circle cx="12" cy="12.5" r="1.6" fill="${c2}"/>`)
      : sh('M7 21v-8L5 9a1.5 1.5 0 0 1 2.5-1.6L9 10V4a1.5 1.5 0 0 1 3 0v6V3a1.5 1.5 0 0 1 3 0v7V5a1.5 1.5 0 0 1 3 0v9c0 4-2 7-5 7Z', it.t === 'wrap' ? ln('M7.2 14.5l10-2M7.4 17.5l9.6-2', L, .9) : ln('M7.2 18h10', D, 1.6)); }
  else { // sombreros
    if (it.t === 'turban') g = `<ellipse cx="12" cy="13" rx="8.5" ry="6.5" fill="${fill}" stroke="${L}" stroke-width="1.1"/>` + ln('M4.5 12c3-2 12-2 15 0M5 15.5c4-2.4 10-2.4 14 0M8 8.2c2.5-1.4 5.5-1.4 8 0', D, 1.1) + (it.id === 'sacerdote' ? `<rect x="9" y="12.4" width="6" height="2.6" rx=".6" fill="#E6B84A"/>` : '');
    else if (it.t === 'straw') g = `<ellipse cx="12" cy="16" rx="10.5" ry="3.2" fill="${fill}" stroke="${L}" stroke-width="1.1"/>` + sh('M7 15.5c0-5 2.2-8 5-8s5 3 5 8Z', ln('M7.2 13.6h9.6', '#7A4E2A', 1.5)) + ln('M3.5 16h17M6 17.8h12', D, .7);
    else if (it.t === 'cap') g = sh('M4 16c0-5 3.6-9 8-9s8 4 8 9Z', ln('M4 16h16', D, 2) + ln('M8 9.6c2.5-1.2 5.5-1.2 8 0', L, .8));
    else g = sh('M4 20c0-9 3.5-15 8-15s8 6 8 15c-1.5-2-3-3-3-3H7s-1.5 1-3 3Z', ln('M6.6 11.5c3.5-1.4 7.3-1.4 10.8 0', c2, 1.8));
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${defs}${g}</svg>`;
};
function invEquip(body) {
  const st = gearState(), slotPos = { hat: 'a', shirt: 'b', pants: 'c', gloves: 'd', boots: 'e' };
  body.innerHTML = `<div class="inv-doll"><div class="inv-pv"><canvas></canvas><span class="inv-rot">↻ arrastrá para girar</span></div>
      ${SLOTS.map(([s, n]) => `<button class="inv-slot s-${slotPos[s]}" data-s="${s}" aria-label="${n}"></button>`).join('')}</div>
    <div class="inv-info"></div>
    <div class="inv-cap"><b>Inventario</b></div>
    <div class="inv-grid"></div>`;
  const pv = invPreview(body.querySelector('canvas')); let sel = null;
  const cell = (it, cls) => `<span class="inv-ico ${cls || ''}" style="--rc:${RAR[it.r][1]}">${icoGear(it)}</span>`;
  const draw = () => {
    body.querySelectorAll('.inv-slot').forEach(b => { const s = b.dataset.s, it = GBY[st.eq[s]]; b.classList.toggle('full', !!it); b.classList.toggle('sel', !!(sel && sel.from === 'slot' && sel.s === s));
      b.innerHTML = it ? cell(it) : `<span class="inv-ghost"><svg viewBox="0 0 24 24" aria-hidden="true">${GICO[s]}</svg></span>`; b.style.setProperty('--rc', it ? RAR[it.r][1] : 'transparent'); });
    const free = GEAR.filter(x => st.own.includes(x.id) && st.eq[x.s] !== x.id), n = Math.max(16, Math.ceil((free.length + 1) / 4) * 4);
    body.querySelector('.inv-grid').innerHTML = Array.from({ length: n }, (_, i) => { const it = free[i]; return it ? `<button class="inv-cell${sel && sel.id === it.id && sel.from === 'grid' ? ' sel' : ''}" data-id="${it.id}" style="--rc:${RAR[it.r][1]}" aria-label="${esc(it.name)}">${cell(it)}</button>` : '<span class="inv-cell empty"></span>'; }).join('');
    const info = body.querySelector('.inv-info'), it = sel && GBY[sel.id];
    if (!it) info.innerHTML = st.own.length ? '<p class="inv-tip">Tocá una prenda del inventario para ponértela. Tocá un casillero del personaje para sacártela.</p>' : '<p class="inv-tip">Todavía no tenés ropa de la época. Aparece muy de vez en cuando brillando cerca del camino, y a veces llega como premio al terminar una misión.</p>';
    else info.innerHTML = `<div class="inv-sel" style="--rc:${RAR[it.r][1]}">${cell(it)}<div><small>${RAR[it.r][0]} · ${SLOTS.find(q => q[0] === it.s)[1]}</small><b>${esc(it.name)}</b><span>${esc(it.desc)}</span></div></div>
      <button class="inv-act">${sel.from === 'slot' ? 'Sacármela' : 'Ponérmela'}</button>`;
    const act = info.querySelector('.inv-act'); if (act) act.onclick = () => sel.from === 'slot' ? unequip(sel.s) : equip(it);
    body.querySelectorAll('.inv-cell[data-id]').forEach(b => { b.onclick = () => { const id = b.dataset.id; if (sel && sel.id === id && sel.from === 'grid') { equip(GBY[id]); return; } sel = { id, from: 'grid' }; draw(); }; });
    body.querySelectorAll('.inv-slot').forEach(b => b.onclick = () => { const s = b.dataset.s; if (!st.eq[s]) { sel = null; draw(); return; } if (sel && sel.from === 'slot' && sel.s === s) { unequip(s); return; } sel = { id: st.eq[s], from: 'slot', s }; draw(); });
  };
  const fly = (from, to, it, done) => { if (!from || !to) { done(); return; } const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), f = document.createElement('div'); f.className = 'inv-fly'; f.style.setProperty('--rc', RAR[it.r][1]); f.innerHTML = icoGear(it);
    Object.assign(f.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' }); document.body.appendChild(f);
    requestAnimationFrame(() => { f.style.transform = `translate(${b.left - a.left + (b.width - a.width) / 2}px,${b.top - a.top + (b.height - a.height) / 2}px) scale(1.08)`; }); setTimeout(() => { f.remove(); done(); }, 380); };
  const equip = it => { const from = body.querySelector(`.inv-cell[data-id="${it.id}"]`), to = body.querySelector(`.inv-slot[data-s="${it.s}"]`); sel = null;
    fly(from, to, it, () => { st.eq[it.s] = it.id; G().save(); reLook(); pv.set(); draw(); const s = body.querySelector(`.inv-slot[data-s="${it.s}"]`); if (s) { s.classList.add('pop'); setTimeout(() => s.classList.remove('pop'), 500); } }); };
  const unequip = s => { const it = GBY[st.eq[s]], from = body.querySelector(`.inv-slot[data-s="${s}"]`), to = body.querySelector('.inv-cell.empty') || body.querySelector('.inv-grid'); sel = null;
    fly(from, to, it, () => { delete st.eq[s]; G().save(); reLook(); pv.set(); draw(); }); };
  draw();
}
// el personaje girando en 3D dentro de la mochila
function invPreview(cv) {
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }), sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(24, 1, .1, 30);
  R.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping;
  sc.add(new THREE.HemisphereLight('#FFF4E0', '#3A2A1C', 1.5)); const key = new THREE.DirectionalLight('#FFE2B8', 2.4); key.position.set(2, 4, 4); sc.add(key); const rim = new THREE.DirectionalLight('#9EC2FF', 1.6); rim.position.set(-3, 2.5, -3); sc.add(rim);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.62, .66, .06, 40), new THREE.MeshStandardMaterial({ color: '#3A2C1E', roughness: .7, metalness: .2 })); base.position.y = -.03; sc.add(base);
  let av = null, rot = .5, vel = 0, drag = null, last = performance.now(); const sheet = document.getElementById('v3sheet');
  const set = () => { if (av) sc.remove(av); const look = lookOf(G().P()); av = (S.hx || H3.ok) ? buildHeroAvatar(look) : buildAvatar(look, false); av.traverse(o => { if (o.isPointLight) o.intensity = 0; }); if (av.userData.h3) av.userData.h3.lamp.visible = false; av.position.set(0, 0, 0); sc.add(av);
    const h = av.userData.h3 ? 1.85 * av.scale.y : 2.1; cam.position.set(0, h * .55, h * 2.75); cam.lookAt(0, h * .5, 0); };
  const size = () => { const w = cv.clientWidth || 160, h = cv.clientHeight || 220; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  cv.addEventListener('pointerdown', e => { drag = e.clientX; vel = 0; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  cv.addEventListener('pointermove', e => { if (drag === null) return; const d = (e.clientX - drag) * .012; rot += d; vel = d; drag = e.clientX; });
  ['pointerup', 'pointercancel'].forEach(k => cv.addEventListener(k, () => { drag = null; }));
  set(); size();
  const loop = now => { if (!cv.isConnected || sheet.hidden) { R.dispose(); return; } const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (drag === null) { rot += vel; vel *= .92; if (Math.abs(vel) < .0005) rot += dt * .35; }
    if (av) { av.rotation.y = rot; if (av.userData.h3) av.userData.h3.mixer.update(dt); else animAvatar(av, now / 1000, false, dt); }
    R.render(sc, cam); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  return { set };
}
function invItems(body) {
  const p = G().P(), have = p.items || {}, got = ITEMS.filter(it => have[it.id]); let sel = null;
  const draw = () => {
    const n = Math.max(16, Math.ceil(got.length / 4) * 4);
    body.innerHTML = `<div class="inv-cap"><b>Objetos del camino</b><span>${got.length} de ${ITEMS.length}</span></div>
      <div class="inv-grid">${Array.from({ length: n }, (_, i) => { const it = got[i]; return it ? `<button class="inv-cell obj${sel === it.id ? ' sel' : ''}" data-id="${it.id}" aria-label="${esc(it.name)}"><span class="inv-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[it.k]}</svg></span></button>` : '<span class="inv-cell empty"></span>'; }).join('')}</div>
      <div class="inv-info">${sel ? (it => `<div class="inv-sel obj"><span class="inv-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[it.k]}</svg></span><div><small>${esc(it.ref)}</small><b>${esc(it.name)}</b><span>${esc(it.desc)}</span></div></div>`)(ITEMS.find(x => x.id === sel)) : `<p class="inv-tip">${got.length ? 'Tocá un objeto para ver de dónde viene en la Biblia.' : 'Todavía no encontraste nada. Salí del camino y explorá: hay objetos escondidos que brillan.'}</p>`}</div>`;
    body.querySelectorAll('.inv-cell[data-id]').forEach(b => b.onclick = () => { sel = b.dataset.id; draw(); });
  };
  draw();
}
function invMemories(body) {
  body.innerHTML = '<div class="bag-in inv-mem"></div>'; const box = body.firstChild;
  bagMedia({ querySelector: () => box }).then(() => { if (!box.children.length) box.innerHTML = '<p class="inv-tip">Acá van a aparecer tus lecturas grabadas y las fotos de tus testimonios.</p>'; });
}


/* ---------- misiones en el escenario ---------- */
const MIS_PTS = 50;
export const MISSIONS = [
  { id: 'tunica', r: 2, serv: 3, kind: 'deliver', giver: { name: 'Un seguidor de Juan', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2A1A', outfit: '#7A6A4A' } }, target: { name: 'un hombre sin abrigo', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#6A6A6A', outfit: '#7A6A5A' } },
    item: { name: 'una túnica de abrigo', k: 'cloth', c: '#8A6A44' }, ask: 'Juan el Bautista nos enseñó que el que tiene dos túnicas comparta con el que no tiene. Tengo una de más: ¿se la llevás a ese hombre que pasa frío?', done: '¡Gracias! Compartir lo que tenemos es una forma de prepararle el camino al Señor.', ref: 'Lucas 3:10-11' },
  { id: 'viuda', r: 6, serv: 3, kind: 'deliver', giver: { name: 'Una vendedora del mercado', look: { g: 'chica', age: 18, skin: '#D6A57C', hair: '#2A1B14', outfit: '#8E2E22' } }, target: { name: 'una viuda pobre', look: { g: 'chica', age: 18, skin: '#B98A62', hair: '#9A9A9A', outfit: '#5A4A6A' } },
    item: { name: 'una canasta con pan', k: 'cloth', c: '#D9A25A' }, ask: 'Esa viuda dio todo lo que tenía en el templo y hoy no tiene qué comer. ¿Le llevás esta canasta con pan?', done: 'Dios ve cada gesto de amor hecho en silencio. ¡Gracias por servir!', ref: 'Marcos 12:41-44 · Santiago 1:27' },
  { id: 'pez', r: 8, kind: 'fetch', giver: { name: 'Juan, el discípulo', look: { g: 'chico', age: 17, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#5A6E8A' } },
    item: { name: 'el pez que se escapó', k: 'fish' }, ask: 'Esta mañana echamos la red a la derecha, como dijo Jesús, y se llenó de peces. ¡Uno saltó y se escapó por la orilla! ¿Lo buscás?', done: '¡Gracias! Ciento cincuenta y tres, y la red no se rompió.', ref: 'Juan 21:6-11' },
  { id: 'emaus', r: 8, kind: 'deliver', giver: { name: 'Una vecina de Emaús', look: { g: 'chica', age: 17, skin: '#C99A72', hair: '#2A1B14', outfit: '#8A6A44' } }, target: { name: 'Cleofas', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#4A4A4A', outfit: '#7A5A3A' } },
    item: { name: 'el pan recién horneado', k: 'cloth', c: '#D9A25A' }, ask: 'Cleofas invitó a cenar a un viajero que caminó con él desde Jerusalén. ¿Le llevás este pan?', done: '¡Era Jesús! Lo reconocimos cuando partió el pan. ¡Tenemos que volver a Jerusalén a contarlo!', ref: 'Lucas 24:28-35' },
  { id: 'gracias', hum: 4, r: 7, kind: 'act', act: 'pray', place: 'golgota', giver: { name: 'María Magdalena', look: { g: 'chica', age: 17, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#8A5A6A' } },
    item: { name: 'El Gólgota' }, hint: 'Andá al Gólgota y arrodillate a orar (🙏)', ask: 'Jesús dio su vida por amor a nosotros. ¿Venís a orar un momento al pie de la cruz y darle gracias?', done: 'Gracias por orar. Su amor es más grande que todo.', ref: 'Juan 19:25 · Juan 15:13' },
  { id: 'especias', r: 7, kind: 'deliver', giver: { name: 'Nicodemo', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#6A6A6A', outfit: '#4A4A6A' } }, target: { name: 'José de Arimatea', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#4A4A4A', outfit: '#6A5A3A' } },
    item: { name: 'las especias aromáticas', k: 'jar', c: '#C9A877' }, ask: 'José de Arimatea pidió el cuerpo de Jesús para darle sepultura. ¿Le llevás estas especias aromáticas?', done: 'Gracias. Lo vamos a poner en la tumba nueva del huerto, con todo el respeto que merece.', ref: 'Juan 19:38-42' },
  { id: 'velar', hum: 3, r: 6, kind: 'act', act: 'pray', place: 'garden', giver: { name: 'Juan, el discípulo', look: { g: 'chico', age: 17, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#5A6E8A' } },
    item: { name: 'Getsemaní' }, hint: 'Andá al huerto de Getsemaní y arrodillate a orar (🙏)', ask: 'Jesús nos pidió que veláramos y oráramos con él, pero nos ganó el sueño. ¿Vas a orar al huerto?', done: 'Gracias por velar. Orar nos da fuerzas para hacer la voluntad de Dios.', ref: 'Mateo 26:40-41' },
  { id: 'cantaro2', r: 6, kind: 'deliver', giver: { name: 'Pedro', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#6E8A9A' } }, target: { name: 'el dueño de la casa del aposento alto', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#4A4A4A', outfit: '#7A5A3A' } },
    item: { name: 'el pan sin levadura', k: 'honey', c: '#D9A25A' }, ask: 'Jesús nos mandó a preparar la cena de la Pascua. ¿Le llevás este pan al dueño de la casa del aposento alto?', done: '¡Gracias! Todo está listo para la Pascua.', ref: 'Lucas 22:8-13' },
  { id: 'perdida', r: 5, kind: 'fetch', giver: { name: 'Un pastor de Judea', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1E140C', outfit: '#7A6A4A' } },
    item: { name: 'la oveja número cien', k: 'sheep' }, ask: 'Tengo cien ovejas y conté noventa y nueve. ¡Falta una! ¿Me ayudás a buscarla por las colinas?', done: '¡La encontraste! Vamos a festejar: la que estaba perdida volvió.', ref: 'Lucas 15:4-6' },
  { id: 'samaritano', hum: 2, r: 5, kind: 'act', act: 'wave', place: 'inn', giver: { name: 'El samaritano', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#5A7A9A' } }, target: { name: 'el encargado de la posada', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#4A4A4A', outfit: '#8A6A44' } },
    item: { name: 'la posada' }, hint: 'Andá a la posada y saludá al encargado de parte del samaritano (👋)', ask: 'Dejé al hombre herido en la posada. ¿Pasás a saludar al encargado y le avisás que voy a volver a pagar lo que falte?', done: 'Gracias. Un buen prójimo cuida hasta el final.', ref: 'Lucas 10:34-35' },
  { id: 'canasta', r: 4, kind: 'deliver', giver: { name: 'Felipe', look: { g: 'chico', age: 17, skin: '#C99A72', hair: '#2A1B14', outfit: '#5A7A5A' } }, target: { name: 'una familia que llegó tarde', look: { g: 'chica', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#8A5A4A' } },
    item: { name: 'una de las doce canastas', k: 'honey', c: '#D9A25A' }, ask: '¡Comieron todos y todavía sobraron doce canastas! ¿Le llevás una a aquella familia que llegó tarde?', done: '¡Gracias! Con Jesús alcanzó para todos y sobró.', ref: 'Juan 6:12-13' },
  { id: 'amigos', r: 4, kind: 'act', act: 'wave', place: 'roofhouse', giver: { name: 'Uno de los cuatro amigos', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#7A6A4A' } }, target: { name: 'el hombre que volvió a caminar', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: '#C9B48A' } },
    item: { name: 'el hombre sanado' }, hint: 'Andá a la casa del techo abierto y saludá al hombre sanado (👋)', ask: 'Bajamos a nuestro amigo por el techo y Jesús lo sanó. ¿Vas a saludarlo? ¡Ahora camina!', done: 'Jesús vio nuestra fe. ¡Gracias por alegrarte con nosotros!', ref: 'Marcos 2:5, 12' },
  { id: 'cantaro', r: 3, kind: 'fetch', well: true, giver: { name: 'Un sirviente de la boda', look: { g: 'chico', age: 17, skin: '#C99A72', hair: '#2A1B14', outfit: '#8A6A4A' } },
    item: { name: 'el cántaro', k: 'jar' }, ask: 'Jesús nos pidió que llenemos de agua las tinajas, ¡y se me perdió el cántaro! ¿Me ayudás a encontrarlo junto al pozo?', done: '¡Gracias! Ahora a llenar las tinajas, tal como él dijo.', ref: 'Juan 2:7' },
  { id: 'lago', r: 3, kind: 'act', act: 'pray', place: 'lake', giver: { name: 'Santiago, hijo de Zebedeo', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#3E5A6A' } },
    item: { name: 'el mar de Galilea' }, hint: 'Andá a la orilla del mar de Galilea y arrodillate a orar (🙏)', ask: 'Jesús nos llamó a dejar las redes y seguirlo. Antes de salir, ¿orás conmigo a la orilla del lago?', done: 'Gracias por orar conmigo. Seguir a Jesús empieza por escucharlo y confiar en él.', ref: 'Mateo 4:21-22' },
  { id: 'peces', r: 3, kind: 'deliver', giver: { name: 'Zebedeo, el pescador', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#BDBDBD', outfit: '#5A6A6A' } }, target: { name: 'una viuda del pueblo', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#9A9A9A', outfit: '#6A5A7A' } },
    item: { name: 'el canasto de pescados', k: 'fish' }, ask: 'Hoy la pesca fue enorme. ¿Le llevás este canasto de pescados a la viuda que vive más adelante? Ella no tiene quién pesque por ella.', done: '¡Qué bendición! Dios ve a los que más lo necesitan.', ref: 'Santiago 1:27' },
  { id: 'posada', r: 0, kind: 'deliver', giver: { name: 'El posadero', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2A1A', outfit: '#7A5A3A' } }, target: { name: 'José', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#2A1B14', outfit: '#5A6E8A' } },
    item: { name: 'la manta de lana', k: 'cloth', c: '#B9874E' }, ask: 'No me queda lugar en la posada, pero tengo una manta de lana. ¿Se la llevás a la familia que pasa la noche en el establo?', done: '¡Gracias! María va a poder abrigar al bebé esta noche.', ref: 'Lucas 2:7' },
  { id: 'oveja', r: 0, kind: 'fetch', giver: { name: 'Un pastor', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1E140C', outfit: '#8A7A5A' } },
    item: { name: 'la oveja perdida', k: 'sheep' }, ask: 'Con tanta luz en el cielo, una de mis ovejas se asustó y se escapó. ¿Me ayudás a encontrarla?', done: '¡La encontraste! Ahora vamos todos a Belén a ver lo que nos anunció el ángel.', ref: 'Lucas 2:15' },
  { id: 'taller', r: 1, kind: 'deliver', giver: { name: 'José, el carpintero', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#2A1B14', outfit: '#5A6E8A' } }, target: { name: 'la vecina', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: '#9A5A6A' } },
    item: { name: 'el banquito de madera', k: 'stool' }, ask: 'Terminé este banquito en el taller. ¿Se lo llevás a la vecina? Vive del otro lado del camino.', done: '¡Qué lindo trabajo! Decile a José que muchas gracias.', ref: 'Mateo 13:55' },
  { id: 'pozo', r: 1, kind: 'fetch', well: true, giver: { name: 'María', look: { g: 'chica', age: 17, skin: '#D6A57C', hair: '#2A1B14', outfit: '#4A6A9A' } },
    item: { name: 'el cántaro de agua', k: 'jar' }, ask: '¿Me ayudás a traer agua? Dejé el cántaro junto al pozo, un poco más adelante.', done: 'Gracias. Jesús también ayudaba en casa y obedecía a sus padres.', ref: 'Lucas 2:51' },
  { id: 'miel', r: 2, kind: 'fetch', giver: { name: 'Juan el Bautista', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1E140C', outfit: '#7A5A34' } },
    item: { name: 'el panal de miel silvestre', k: 'honey' }, ask: 'En el desierto como langostas y miel silvestre. ¿Me traés un panal? Vi abejas cerca de las rocas.', done: '¡Gracias! Sigamos preparando el camino para el Señor.', ref: 'Mateo 3:4' },
  { id: 'tunica', r: 2, kind: 'deliver', giver: { name: 'Un discípulo de Juan', look: { g: 'chico', age: 17, skin: '#C99A72', hair: '#3A2A1A', outfit: '#6A7A5A' } }, target: { name: 'el hombre que tiene frío', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#4A4A4A', outfit: '#6A6258' } },
    item: { name: 'la túnica', k: 'cloth', c: '#C9B48A' }, ask: 'Juan enseña que el que tiene dos túnicas comparta una con el que no tiene. ¿Le llevás esta a aquel hombre que tiene frío?', done: '¡Gracias! Hacía mucho que nadie me ayudaba así.', ref: 'Lucas 3:11' },
  { id: 'adorar', r: 0, kind: 'act', act: 'pray', place: 'village', giver: { name: 'Uno de los magos', look: { g: 'chico', age: 18, skin: '#8A5A3A', hair: '#1A120C', outfit: '#6A3A7A' } },
    item: { name: 'Belén' }, hint: 'Andá a Belén y arrodillate a adorar (🙏)', ask: 'Seguimos la estrella para adorar al rey que nació. ¿Venís con nosotros? Cuando llegues a Belén, arrodillate a adorarlo.', done: 'Así lo hicieron los magos: se inclinaron ante el niño y lo adoraron.', ref: 'Mateo 2:11' },
  { id: 'ana', r: 1, kind: 'act', act: 'wave', giver: { name: 'Simeón', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#BDBDBD', outfit: '#8A8070' } }, target: { name: 'Ana', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#9A9A9A', outfit: '#5A4A6A' } },
    item: { name: 'Ana' }, hint: 'Buscá a Ana en el templo y saludala (👋)', ask: 'Esperé muchos años para ver al Mesías y hoy lo tuve en mis brazos. Andá a saludar a Ana, que está en el templo: ella también lo esperaba.', done: 'Ana dio gracias a Dios y habló del niño a todos los que esperaban la redención.', ref: 'Lucas 2:36-38' },
  { id: 'orilla', r: 2, kind: 'act', act: 'pray', place: 'river', giver: { name: 'Andrés', look: { g: 'chico', age: 17, skin: '#B98A62', hair: '#2A1B14', outfit: '#4A6A6A' } },
    item: { name: 'el Jordán' }, hint: 'Andá a la orilla del Jordán y arrodillate a orar (🙏)', ask: 'Cuando Jesús se bautizó, mientras oraba, el cielo se abrió. ¿Vamos a orar a la orilla del Jordán?', done: 'Gracias por orar conmigo. Ahí mismo el Espíritu bajó sobre Jesús como una paloma.', ref: 'Lucas 3:21-22' },
  { id: 'leer23', r: 0, kind: 'record', title: 'El Salmo del pastor', giver: { name: 'Un anciano de Belén', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#D8D8D8', outfit: '#6A5A4A' } },
    item: { name: 'Salmo 23' }, hint: 'Grabá el Salmo 23 en voz alta · tocá acá', ask: 'David cuidaba ovejas en estos mismos campos de Belén y escribió un salmo sobre Dios como su pastor. ¿Lo leés en voz alta para que lo escuchemos?', done: '¡Qué bien que lo leíste! El Señor también es tu pastor.', ref: 'Salmo 23' },
  { id: 'fotopastores', r: 0, kind: 'photo', title: 'Contalo como los pastores', giver: { name: 'Uno de los pastores', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#7A6A4A' } },
    item: { name: 'testimonio' }, hint: 'Contale a un compañero quién es Jesús y sacate una foto · tocá acá', ask: 'Después de ver al niño, salimos a contarle a todo el mundo lo que el ángel nos había dicho. ¿Vos también te animás a contarlo?', done: '¡Eso es! La noticia sigue llegando a otros, como en Belén.', ref: 'Lucas 2:17-18' },
  { id: 'leer1', r: 1, kind: 'record', title: 'El camino del que confía', giver: { name: 'Un maestro del templo', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#4A4A4A', outfit: '#3E4A6A' } },
    item: { name: 'Salmo 1' }, hint: 'Grabá el Salmo 1 en voz alta · tocá acá', ask: 'En el templo, Jesús escuchaba y hacía preguntas a los maestros sobre las Escrituras. ¿Leés en voz alta el Salmo 1?', done: 'Excelente lectura. Que la Palabra de Dios sea tu alegría todos los días.', ref: 'Salmo 1' },
  { id: 'fotofelipe', r: 2, kind: 'photo', title: 'Vení a ver', giver: { name: 'Felipe', look: { g: 'chico', age: 17, skin: '#C99A72', hair: '#2A1B14', outfit: '#5A7A5A' } },
    item: { name: 'testimonio' }, hint: 'Contale a un compañero quién es Jesús y sacate una foto · tocá acá', ask: 'Cuando conocí a Jesús, fui a buscar a mi amigo Natanael y le dije: «Vení a ver». ¿Hay alguien de tu curso a quien le puedas contar de Jesús?', done: '¡Gracias por animarte! Así empezó todo: un amigo que le cuenta a otro.', ref: 'Juan 1:45-46' }
];
function misMesh(it) {
  if (it.k === 'jar' || it.k === 'honey') { const m = itemMesh(it.k); m.remove(m.userData.halo); return m; }
  const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .9 });
  if (it.k === 'cloth') { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .36), M(it.c)); g.add(b); const f = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .37), M(new THREE.Color(it.c).multiplyScalar(.8))); f.position.y = .03; g.add(f); }
  else if (it.k === 'sheep') { const body = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10), M('#F2EEE4')); body.scale.set(1.25, .9, .9); body.position.y = .38; g.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), M('#3A322C')); hd.position.set(.36, .46, 0); g.add(hd); [[-.15, -.12], [-.15, .12], [.15, -.12], [.15, .12]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .26, 6), M('#3A322C')); l.position.set(x, .13, z); g.add(l); }); }
  else if (it.k === 'fish') { const b = new THREE.Mesh(new THREE.CylinderGeometry(.26, .2, .22, 12), M('#B89A5E')); b.position.y = .11; g.add(b); for (let i = 0; i < 4; i++) { const f2 = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), M('#9AB8C2')); f2.scale.set(2, .5, .6); f2.position.set((i % 2 - .5) * .14, .24 + (i > 1 ? .05 : 0), ((i >> 1) - .5) * .12); f2.rotation.y = i; g.add(f2); } }
  else if (it.k === 'stool') { const s = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .06, 14), M('#9A6A3E')); s.position.y = .36; g.add(s); for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28, l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .36, 6), M('#7A5230')); l.position.set(Math.cos(a) * .14, .17, Math.sin(a) * .14); l.rotation.set(Math.sin(a) * .15, 0, -Math.cos(a) * .15); g.add(l); } }
  return g;
}
function bangSprite() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#FFD25E'; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.fill(); x.lineWidth = 8; x.strokeStyle = '#7A4E12'; x.stroke(); x.fillStyle = '#5A3608'; x.font = '900 84px Nunito, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(.55, .55, .55); s.renderOrder = 5; return s; }
function buildMissions(scene, g, hx, HW, rr) {
  const yAt = (x, z) => Math.max(HW ? HW.hAt(x, z) : 0, floorH(x, z)), M = {};
  const regNodes = r => Object.keys(g.NODES).filter(id => id.startsWith(g.REGIONS[r].id + '-') && !/gate|fA|fB/.test(id)).map(id => S0.markers[id]).sort((a, b) => b.position.z - a.position.z);
  const npc = (look, x, z, face) => { const rig = hx || H3.ok, o = rig ? buildHeroAvatar(look) : buildAvatar(look, false); if (!rig) o.scale.setScalar(1.08); o.position.set(x, yAt(x, z), z); o.rotation.y = face; if (rig) o.traverse(q => { if (q.isMesh) q.castShadow = true; }); o.traverse(q => { if (q.isPointLight) q.intensity = 0; }); scene.add(o); return o; };
  const ring = (x, z) => { const m = new THREE.Mesh(new THREE.RingGeometry(.55, .7, 36), new THREE.MeshBasicMaterial({ color: '#FFD873', transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, yAt(x, z) + .05, z); m.visible = false; scene.add(m); return m; };
  const per = new Array(16).fill(0);
  // Hero: las misiones no van sobre el camino; se reparten por la etapa en lugares con sentido (aldeas, pozo, lago, monte…) y siempre en suelo alcanzable
  const used = Object.values(S0.npos || {}).map(q => q.slice()); const spotOk = (x, z) => { if (!HW) return false; if (Math.abs(x) > Math.min(XB * .9, (HW.X1 || XB) - 6)) return false; if (HW.dAt(x, z) < 9) return false; if (waterWet(x, z, null) > .04) return false;
    for (const B of WATER.basins) if (Math.hypot(x - B.x, z - B.z) < B.r * 1.4 + 2) return false; const sl = Math.hypot(HW.hAt(x + 1, z) - HW.hAt(x - 1, z), HW.hAt(x, z + 1) - HW.hAt(x, z - 1)) / 2; if (sl > .38) return false;
    for (let k = 0; k < 8; k++) { const an = k / 8 * 6.283; if (blockedAt(x + Math.cos(an) * 1.2, z + Math.sin(an) * 1.2)) return false; } for (const u of used) if (Math.hypot(x - u[0], z - u[1]) < 14) return false; return true; };
  const spot = (r, R, k, avoid) => { const [za, zb] = regionZ(g, r), pois = (S0.pois || []).filter(q => q.r === r && q.k !== 'river'), anchors = pois.map(q => [q.x, q.z]);
    for (let t = 0; t < 90; t++) { let x, z; const an = anchors.length ? anchors[(k + t) % anchors.length] : null;
      if (an && t < 50) { const ang = R() * 6.283, rad = 12 + R() * 16; x = an[0] + Math.cos(ang) * rad; z = an[1] + Math.sin(ang) * rad; } else { x = (R() * 2 - 1) * XB * .85; z = zb + (za - zb) * (.1 + R() * .8); }
      if (z > za + 5 || z < zb - 5) continue; if (avoid && Math.hypot(x - avoid[0], z - avoid[1]) < 22) continue; if (spotOk(x, z)) { used.push([x, z]); return [x, z]; } }
    return null; };
  MISSIONS.forEach((d, i) => {
    const R = rng(900 + i), ns = regNodes(d.r); if (ns.length < 3) return; const slot = per[d.r]++, side = slot % 2 ? 1 : -1;
    const a = ns[Math.min(ns.length - 1, 1 + slot)], b = ns[Math.min(ns.length - 1, 3 + slot)];
    let gx = a.position.x + side * 8, gz = a.position.z - .6; const sp = hx ? spot(d.r, R, slot * 2) : null; if (sp) [gx, gz] = sp; const giver = npc(d.giver.look, gx, gz, sp ? Math.atan2(a.position.x - gx, a.position.z - gz) : -side * Math.PI / 2);
    const bang = bangSprite(); bang.position.set(gx, yAt(gx, gz) + 2.35, gz); scene.add(bang);
    const m = { d, giver, bang, gp: [gx, gz] };
    if (d.kind === 'act') { const poi = (S0.pois || []).find(q => q.k === (d.place || 'temple')); let tx = poi ? poi.x : b.position.x - side * 8, tz = poi ? poi.z : b.position.z; if (poi && poi.k === 'river') { const q = poi.pts[Math.floor(poi.pts.length / 2)]; tx = q[0] - 3.3; tz = q[1]; } if (poi && poi.k === 'temple') { tx = poi.x - poi.side * 6.5; tz = poi.z; } if (poi && poi.k === 'lake') { tx = poi.x - poi.side * 33; tz = poi.z + 9; } if (poi && poi.k === 'shore') { tx = poi.x - poi.side * 6; tz = poi.z + 2; } if (poi && poi.k === 'golgota') { tx = poi.x - poi.side * 5; tz = poi.z + 3; } if (poi && poi.k === 'tomb') { tx = poi.x - poi.side * 5; tz = poi.z + 2; } if (poi && poi.k === 'garden') { tx = poi.x - poi.side * 2.5; tz = poi.z + 2.5; } if (poi && poi.k === 'inn') { tx = poi.x - poi.side * 6; tz = poi.z - 2; } if (poi && poi.k === 'roofhouse') { tx = poi.x - poi.side * 6; tz = poi.z + 1.5; } if (poi && poi.k === 'village') { tx = poi.x - poi.side * 1.6; tz = poi.z + 1.6; }
      if (d.target) { m.target = npc(d.target.look, tx, tz, poi ? -poi.side * Math.PI / 2 : 0); } m.tp = [tx, tz]; m.ring = ring(tx, tz); }
    else if (d.kind === 'deliver') { let tx = b.position.x - side * 8, tz = b.position.z - .4; const tp = hx ? spot(d.r, R, slot * 2 + 1, [gx, gz]) : null; if (tp) [tx, tz] = tp; m.target = npc(d.target.look, tx, tz, side * Math.PI / 2); m.tp = [tx, tz]; m.ring = ring(tx, tz); }
    else { let px = b.position.x - side * (12 + R() * 6), pz = b.position.z + 3 + R() * 6; const pp = hx ? spot(d.r, R, slot * 2 + 1, [gx, gz]) : null; if (pp) [px, pz] = pp; m.pp = [px, pz]; m.pick = misMesh(d.item); m.pick.position.set(px, yAt(px, pz) + (d.item.k === 'jar' || d.item.k === 'honey' ? .5 : 0), pz); m.pick.visible = false; scene.add(m.pick); m.ring = ring(px, pz);
      if (d.well) { const w = new THREE.Group(), st = new THREE.MeshStandardMaterial({ color: '#8C8374', roughness: 1, flatShading: true }); const wall = new THREE.Mesh(new THREE.CylinderGeometry(.6, .66, .6, 14, 1, true), st); wall.material.side = THREE.DoubleSide; wall.position.y = .3; w.add(wall); const lip = new THREE.Mesh(new THREE.TorusGeometry(.62, .07, 6, 18), st); lip.rotation.x = Math.PI / 2; lip.position.y = .6; w.add(lip); const wat = new THREE.Mesh(new THREE.CircleGeometry(.58, 18), new THREE.MeshStandardMaterial({ color: '#2E5A66', roughness: .1, metalness: .3 })); wat.rotation.x = -Math.PI / 2; wat.position.y = .25; w.add(wat); w.position.set(px + 1.1, yAt(px + 1.1, pz), pz); w.traverse(q => { if (q.isMesh) { q.castShadow = q.receiveShadow = !!hx; } }); scene.add(w); } }
    M[d.id] = m;
  });
  return M;
}
let S0 = null, S_poiPts = null;
function misState() { const p = G().P(); p.missions = p.missions || {}; return p; }
function regionOpen(r) { const g = G(); return Object.keys(g.NODES).some(id => id.startsWith(g.REGIONS[r].id + '-') && g.reachable(id)); }
function misUI() {
  if (!S.misEl) { S.misEl = document.createElement('div'); S.misEl.className = 'v3mis'; S.misEl.hidden = true; S.misEl.innerHTML = '<i><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3l7 16-7-4-7 4Z" fill="currentColor"/></svg></i><span></span>'; document.body.appendChild(S.misEl); }
  return S.misEl;
}
function misPop(title, sub) { const el = document.getElementById('v3pop'); if (!el) return; el.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.6L21 9.3l-5 4.5L17.4 21 12 17.3 6.6 21 8 13.8 3 9.3l6.4-.7Z" fill="#FFD25E"/></svg></span><span class="tx"><small>${esc(title)}</small><b>${esc(sub)}</b></span>`; el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(pop.t); pop.t = setTimeout(() => { el.classList.remove('on'); el.hidden = true; }, 3200); }
function openMission(m) {
  const el = document.getElementById('v3sheet'), d = m.d; if (!el) return;
  const hNeed = S.hx && d.hum ? d.hum : 0, hOk = humV() >= hNeed;
  el.innerHTML = `<div class="bag-in mis-in"><div class="bag-h"><b>${esc(d.giver.name)}</b><span>Misión · +${MIS_PTS} puntos${hNeed ? ' · Humildad ' + hNeed : ''}</span><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="mis-ask">“${esc(d.ask)}”</p><small class="mis-ref">${esc(d.ref)}</small>${hOk ? '' : `<p class="cap-note">Esta misión pide <b>Humildad ${hNeed}</b> (tenés ${humV()}). La humildad crece cuando le das puntos de tus atributos a otros en una sala con amigos.</p>`}<div class="mis-btns">${hOk ? '<button class="mis-yes">¡Dale!</button>' : ''}<button class="mis-no">Ahora no</button></div></div>`;
  el.hidden = false; const close = () => { el.hidden = true; S.misSkip = d.id; try { G().voStop(); } catch (e) {} }; try { G().vo(d.ask, d.giver.look && d.giver.look.g === 'chica' ? 'mujer' : 'varon'); } catch (e) {}
  el.querySelector('.bag-x').onclick = close; el.querySelector('.mis-no').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  if (hOk) el.querySelector('.mis-yes').onclick = () => { const p = misState(); p.mact = { id: d.id, has: d.kind !== 'fetch' }; G().save(); el.hidden = true; misCarry(m, p.mact.has); if (d.kind === 'record' || d.kind === 'photo') setTimeout(() => openCapture(m), 250); };
}
function misCarry(m, on) {
  if (S.carry) { S.av.remove(S.carry); S.carry = null; }
  if (on && !['act', 'record', 'photo'].includes(m.d.kind)) { const c = misMesh(m.d.item); c.scale.setScalar(.7); c.position.y = 2.25; if (S.av.userData.h3 && H3.clips.M_Holding_Idle) { c.scale.setScalar(.45); c.position.set(0, 1.08, .34); } S.av.add(c); S.carry = c; }
  if (m.pick) m.pick.visible = !on && !!misState().mact; 
}
function misDone(m) {
  const p = misState(), d = m.d; p.missions[d.id] = true; p.mact = null; G().save(); G().refreshHud && G().refreshHud(); misCarry(m, false); if (m.ring) m.ring.visible = false; if (m.pick) m.pick.visible = false;
  if (S.hx) { const help = ['deliver', 'fetch', 'act'].includes(d.kind); if (help) { axGain('amor', 3); const b = [0, 5, 5, 10, 10, 10][ft('amor')]; if (b) { const pp = G().P(); pp.bonus = (pp.bonus || 0) + b; } } axGain('ale', 2); axGain('fid', 1); if (fv('ale') >= 40) { S.boostT = 30; setTimeout(() => svToast('😊 ¡Alegría! 30 segundos de paso rápido.'), 2200); } behav('misiones'); }
  misPop('¡Misión cumplida! +' + MIS_PTS, d.done); tone3d(); try { const who = d.target || d.giver; G().vo(d.done, who.look && who.look.g === 'chica' ? 'mujer' : 'varon'); } catch (e) {} glowAdd(10, 'mision'); h3npcPlay(m.target || m.giver, ['M_Thankful', 'M_Cheering'], 3); if (m.target && m.giver) setTimeout(() => h3npcPlay(m.giver, ['M_Clapping', 'M_Thankful'], 2.5), 600);
  if (Math.random() < .5) setTimeout(() => gearGive(gearRoll(), 'Recompensa de la misión'), 3400);
  if (S && S.hx) setTimeout(() => svMissionReward(d), 1800);
}
function tone3d() { try { const A = new (window.AudioContext || window.webkitAudioContext)(); [660, 880, 1100].forEach((f, i) => { const o = A.createOscillator(), gn = A.createGain(); o.frequency.value = f; o.type = 'triangle'; gn.gain.setValueAtTime(.0001, A.currentTime + i * .12); gn.gain.exponentialRampToValueAtTime(.15, A.currentTime + i * .12 + .02); gn.gain.exponentialRampToValueAtTime(.0001, A.currentTime + i * .12 + .3); o.connect(gn); gn.connect(A.destination); o.start(A.currentTime + i * .12); o.stop(A.currentTime + i * .12 + .35); }); } catch (e) {} }
function misTick(t) {
  if (!S.mis) return; const p = misState(), a = S.av.position, ui = misUI(), d2 = (q) => (q[0] - a.x) ** 2 + (q[1] - a.z) ** 2;
  if (document.getElementById('view3d').hidden) { ui.hidden = true; return; }
  for (const id in S.mis) { const m = S.mis[id], open = regionOpen(m.d.r), done = !!p.missions[id], act = p.mact && p.mact.id === id; m.bang.visible = open && !done && !act; m.bang.position.y = m.giver.position.y + 2.35 + Math.sin(t * 3) * .08; m.giver.visible = m.target ? true : true; }
  const act = p.mact && S.mis[p.mact.id];
  if (act) {
    const d = act.d, has = p.mact.has; let goal, txt;
    const cap = d.kind === 'record' || d.kind === 'photo';
    if (cap) { goal = act.gp; txt = d.hint; }
    else if (d.kind === 'act') { goal = act.tp; txt = d.hint; }
    else if (d.kind === 'deliver') { goal = act.tp; txt = `Llevale ${d.item.name} a ${d.target.name}`; }
    else if (!has) { goal = act.pp; txt = `Buscá ${d.item.name}`; if (act.pick) { act.pick.visible = true; act.pick.rotation.y = t; } }
    else { goal = act.gp; txt = `Volvé con ${d.item.name}`; }
    if (act.ring) { act.ring.visible = !cap && (d.kind !== 'fetch' || !has); act.ring.material.opacity = .45 + Math.sin(t * 4) * .25; }
    if (!sheetUp()) {
      if (d.kind === 'fetch' && !has && d2(act.pp) < 1.6) { p.mact.has = true; G().save(); misCarry(act, true); if (act.ring) act.ring.visible = false; misPop('Conseguiste', d.item.name.replace(/^(el|la) /, '').replace(/^./, c => c.toUpperCase())); }
      else if (cap) { }
      else if (d.kind === 'act') { if (d2(goal) < 9 && ((d.act === 'pray' && S.pose === 'pray' && S.prayT > 1.2) || (d.act === 'wave' && S.waveT > 0 && S.waveT < 1.6))) misDone(act); }
      else if (has && d2(goal) < 2.4) misDone(act);
    }
    const C = S.yaw + S.camYaw, dx = goal[0] - a.x, dz = goal[1] - a.z, xs = dx * -Math.cos(C) + dz * Math.sin(C), ys = dx * Math.sin(C) + dz * Math.cos(C);
    ui.hidden = false; ui.lastChild.textContent = txt; ui.firstChild.style.transform = `rotate(${Math.atan2(xs, ys)}rad)`; ui.firstChild.style.visibility = cap ? 'hidden' : ''; ui.classList.toggle('tap', cap); ui.onclick = cap ? () => openCapture(act) : null;
  } else ui.hidden = true;
  if (sheetUp() || S.walking) return;
  if (!act) for (const id in S.mis) { const m = S.mis[id]; if (p.missions[id] || !regionOpen(m.d.r)) continue; const dd = d2(m.gp); if (dd < 2.6) { if (S.misSkip !== id) { S.joy.x = 0; S.joy.y = 0; openMission(m); } } else if (S.misSkip === id && dd > 9) S.misSkip = null; }
}

/* ---------- mundo abierto: lugares para explorar y mapa general ---------- */
const XB = 34 * WS;
const POIS = [
  { r: 0, k: 'pastores', name: 'Campos de los pastores', side: -1, f: .3, dx: 18 * WS },
  { r: 0, k: 'village', name: 'Belén', side: 1, f: .78, dx: 17 * WS },
  { r: 1, k: 'taller', name: 'Taller de José', side: -1, f: .28, dx: 17 * WS },
  { r: 1, k: 'temple', name: 'Templo de Jerusalén', side: 1, f: .75, dx: 20 * WS },
  { r: 2, k: 'river', name: 'Río Jordán', side: 1, f: .5, dx: 21 * WS },
  { r: 2, k: 'desert', name: 'Desierto de Judea', side: -1, f: .72, dx: 19 * WS },
  { r: 3, k: 'lake', name: 'Mar de Galilea', side: 1, f: .42, dx: 24 * WS },
  { r: 3, k: 'village', name: 'Caná', side: -1, f: .2, dx: 17 * WS },
  { r: 4, k: 'roofhouse', name: 'Casa en Capernaúm', side: -1, f: .3, dx: 17 * WS },
  { r: 4, k: 'feeding', name: 'La colina de los cinco mil', side: 1, f: .62, dx: 20 * WS },
  { r: 5, k: 'field', name: 'El campo del sembrador', side: -1, f: .3, dx: 18 * WS },
  { r: 5, k: 'inn', name: 'La posada', side: 1, f: .55, dx: 17 * WS },
  { r: 6, k: 'upper', name: 'El aposento alto', side: -1, f: .55, dx: 17 * WS },
  { r: 6, k: 'garden', name: 'Getsemaní', side: 1, f: .78, dx: 19 * WS },
  { r: 7, k: 'golgota', name: 'El Gólgota', side: -1, f: .45, dx: 18 * WS },
  { r: 7, k: 'tomb', name: 'La tumba del huerto', side: 1, f: .75, dx: 19 * WS },
  { r: 8, k: 'village', name: 'Emaús', side: -1, f: .4, dx: 17 * WS },
  { r: 8, k: 'shore', name: 'La orilla del lago', side: 1, f: .7, dx: 18 * WS }
];
function regionZ(g, r) { let a = -Infinity, b = Infinity; for (const id in g.NODES) if (id.startsWith(g.REGIONS[r].id + '-')) { const [, z] = toV(g.NODES[id].x, g.NODES[id].y); a = Math.max(a, z); b = Math.min(b, z); } return [a, b]; }
function planPois(g) {
  return POIS.filter(p => p.r < g.REGIONS.length).map(p => { const [a, b] = regionZ(g, p.r), z = a + (b - a) * p.f, x = p.side * p.dx, q = { ...p, x, z, a, b, pts: [] };
    if (p.k === 'river') { for (let zz = a + 4; zz >= b - 4; zz -= 1.5) q.pts.push([x + Math.sin(zz * .04) * 9, zz]); q.flat = q.pts; }
    else if (p.k === 'taller' || p.k === 'temple' || p.k === 'lake' || p.k === 'roofhouse' || p.k === 'feeding' || p.k === 'field' || p.k === 'inn' || p.k === 'upper' || p.k === 'garden' || p.k === 'golgota' || p.k === 'tomb' || p.k === 'shore') { const rx = p.k === 'temple' ? 21 : p.k === 'lake' ? 40 : 19, rz = p.k === 'temple' ? 23 : p.k === 'lake' ? 36 : 17, cx2 = p.k === 'lake' ? x - p.side * 4 : x; q.flat = []; for (let u = -rx; u <= rx; u += 3) for (let v = -rz; v <= rz; v += 3) q.flat.push([cx2 + u, z + v]); }
    else { q.flat = [[x, z]]; for (let i = 0; i < 10; i++) { const an = i / 10 * 6.28; q.flat.push([x + Math.cos(an) * 5, z + Math.sin(an) * 5]); } }
    return q; });
}
function buildPois(scene, pois, hx, HW, R, ribbon) {
  const yAt = (x, z) => HW ? HW.hAt(x, z) : 0, M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: !!hx }, o || {}));
  const add = (o, x, z, ry) => { o.position.set(x, yAt(x, z), z); if (ry) o.rotation.y = ry; if (hx) o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); scene.add(o); return o; };
  const sign = (p) => { const s = new THREE.Group(); const post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 1.6, 6), M('#6A4A2C')); post.position.y = .8; s.add(post); const lb = textSprite(p.name, hx); lb.position.y = 2.1; lb.scale.multiplyScalar(1.15); s.add(lb); const sx = p.k === 'river' ? p.x - p.side * 4.5 : p.x - p.side * 4.2; add(s, sx, p.z + 3); };
  for (const p of pois) {
    if (p.k === 'village') { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + .3, r = 10 + R() * 2.5, h = house(R, hx); R(); const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (HW && HW.dAt(x, z) < 5.5) continue; add(h, x, z, -a + Math.PI / 2); HCOLS.push(wBox(x, z, -a + Math.PI / 2, ...h.userData.box)); } const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .55, 12), M('#8C8374')); w.position.y = .27; const gw = new THREE.Group(); gw.add(w); add(gw, p.x, p.z); }
    if (p.k === 'pastores') { const f = new THREE.Group(); for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.16, 0), M('#6E665A')); const a = i / 9 * 6.28; st.position.set(Math.cos(a) * .55, .08, Math.sin(a) * .55); f.add(st); } [0, 1.2].forEach(a => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 6), M('#5A3E24')); l.rotation.set(Math.PI / 2, a, 0); l.position.y = .1; f.add(l); });
      const fl = new THREE.Mesh(new THREE.ConeGeometry(.25, .7, 7), new THREE.MeshBasicMaterial({ color: '#FFB347' })); fl.position.y = .4; f.add(fl); if (hx && qEarly() >= 1) { const pl = new THREE.PointLight('#FF9A3C', 6, 9, 1.6); pl.position.y = .8; f.add(pl); } add(f, p.x, p.z);
      for (let i = 0; i < 8; i++) { const sh = misMesh({ k: 'sheep' }); const a = R() * 6.28, r = 2.2 + R() * 3.5; add(sh, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, R() * 6.28); }
      const tent = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 4), M('#7A5E44')); tent.position.y = .9; tent.rotation.y = .7; const tg = new THREE.Group(); tg.add(tent); add(tg, p.x - p.side * -2.6, p.z - 2.4); }
    if (p.k === 'taller' && false) { const h = house(R, hx); h.scale.setScalar(1.4); add(h, p.x, p.z - 1.5);
      const shed = new THREE.Group(); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, 1.5, 6), M('#6A4A2C')); post.position.set(a * 1.1, .75, b * .8); shed.add(post); }); const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, .08, 2), M('#8A6A44')); roof.position.y = 1.52; roof.rotation.z = .08; shed.add(roof);
      for (let i = 0; i < 5; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(1.4, .06, .24), M('#B88A55')); pl.position.set(0, .05 + i * .07, -.3 + (i % 2) * .05); pl.rotation.y = (R() - .5) * .2; shed.add(pl); }
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, .1, .4), M('#9A6A3E')); bench.position.set(.2, .5, .5); shed.add(bench); add(shed, p.x + p.side * -2.8, p.z + 1.2); }
    if (p.k === 'temple' && false) { const t = new THREE.Group(), stone = M(hx ? '#C9B892' : '#F4E8CC'), dark = M(hx ? '#A8987A' : '#E0D0AE');
      const base = new THREE.Mesh(new THREE.BoxGeometry(10, .8, 8), dark); base.position.y = .4; t.add(base); for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(5, .2, .5), stone); st.position.set(0, .1 + i * .2, 4.2 - i * .5 + 1.5); t.add(st); }
      const hall = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 4.5), stone); hall.position.set(0, 2.5, -1); t.add(hall); const roof = new THREE.Mesh(new THREE.BoxGeometry(6.6, .3, 5), dark); roof.position.set(0, 4.3, -1); t.add(roof);
      for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, 3.2, 10), stone); c.position.set(-2.6 + i * 1.04, 2.4, 1.6); t.add(c); }
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, .1), M('#6B4A2C')); door.position.set(0, 1.8, 1.27); t.add(door); add(t, p.x, p.z, p.side > 0 ? -Math.PI / 2 : Math.PI / 2); }
    if (p.k === 'river') { waterRiver(scene, p.pts, 9, hx, yAt);
      const reed = new THREE.InstancedMesh(new THREE.CylinderGeometry(.015, .02, 1, 4), M('#6E8A44'), 160), m4 = new THREE.Matrix4(); let n = 0; for (let i = 0; i < 160; i++) { const q = p.pts[Math.floor(R() * p.pts.length)], s = R() < .5 ? -1 : 1, x = q[0] + s * (2.4 + R() * .8), z = q[1] + (R() - .5); m4.makeScale(1, .6 + R() * .7, 1); m4.setPosition(x, yAt(x, z) + .4, z); reed.setMatrixAt(n++, m4); } reed.instanceMatrix.needsUpdate = true; scene.add(reed); }
    if (p.k === 'desert') { const sand = new THREE.Mesh(new THREE.CircleGeometry(7, 28), M('#C9A86E', { flatShading: false })); sand.rotation.x = -Math.PI / 2; sand.position.set(p.x, yAt(p.x, p.z) + .03, p.z); sand.receiveShadow = true; scene.add(sand);
      for (let i = 0; i < 9; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(.6 + R() * 1.1, 0), M('#A88E66')); rk.scale.y = .6 + R() * .5; const a = R() * 6.28, r = 2 + R() * 4.5; const gr = new THREE.Group(); rk.position.y = .3; gr.add(rk); add(gr, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, R() * 6); } }
    if (!['taller', 'temple', 'lake', 'roofhouse', 'feeding', 'field', 'inn', 'upper', 'garden', 'golgota', 'tomb', 'shore'].includes(p.k)) sign(p);
  }
}
/* ---------- pueblos de la época: casas grandes con oficios, el templo y el lago ---------- */
// cajas de choque (paredes) y pisos elevados (plataforma del templo, muelle); se llenan al armar el mundo
function rotXZ(lx, lz, r) { const c = Math.cos(r), s = Math.sin(r); return [lx * c + lz * s, -lx * s + lz * c]; }
function wBox(x, z, r, lx0, lx1, lz0, lz1) { const P = [[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1]].map(([a, b]) => rotXZ(a, b, r)); return { x0: x + Math.min(...P.map(p => p[0])), x1: x + Math.max(...P.map(p => p[0])), z0: z + Math.min(...P.map(p => p[1])), z1: z + Math.max(...P.map(p => p[1])) }; }
function blockedAt(x, z) { const L = S && S.cols; if (!L) return false; const r = S.hx ? .34 : .28; for (const b of L) if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) { if (b.oi != null && S.sv && S.sv.felled && S.sv.felled.has(b.oi)) continue; if (b.r == null || (x - b.cx) ** 2 + (z - b.cz) ** 2 < (b.r + r) ** 2) return true; } return false; }
function floorH(x, z) { const L = S && S.floors; if (!L) return -1; let h = -1; for (const f of L) if (x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1 && f.y > h) h = f.y; return h; }
function cnvTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
let TT = null; // texturas compartidas
function townTex() {
  if (TT) return TT; const R = rng(4242);
  const stone = (base, j) => (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let y = 0, row = 0; y < h; y += 16, row++) for (let i = -(row % 2) * 14; i < w; i += 28) { const v = (R() - .5) * j; x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 240 : 0},${v > 0 ? 210 : 0},${Math.abs(v)})`; x.fillRect(i + 1, y + 1, 26, 14); } x.strokeStyle = 'rgba(60,45,30,.35)'; x.lineWidth = 1.5; for (let y = 0, row = 0; y < h; y += 16, row++) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let i = -(row % 2) * 14; i < w; i += 28) { x.beginPath(); x.moveTo(i, y); x.lineTo(i, y + 16); x.stroke(); } } };
  TT = {
    wall: cnvTex(256, 256, stone('#C8B08A', .22), [1, 1]),
    wallT: cnvTex(256, 256, stone('#E9DCC0', .16), [1, 1]),
    floor: cnvTex(128, 128, (x, w, h) => { x.fillStyle = '#9C8160'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${R() < .5 ? '60,40,20' : '200,170,130'},${R() * .18})`; x.fillRect(R() * w, R() * h, 2 + R() * 4, 2 + R() * 3); } }, [3, 3]),
    pave: cnvTex(256, 256, (x, w, h) => { x.fillStyle = '#D8C8A6'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(90,70,50,.35)'; x.lineWidth = 2; for (let y = 0; y < h; y += 32) for (let i = (y / 32 % 2) * 32; i < w; i += 64) x.strokeRect(i, y, 64, 32); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${R() * .12})`; x.fillRect(R() * w, R() * h, 3, 3); } }, [6, 6]),
    weave: cnvTex(64, 64, (x, w, h) => { const cs = ['#8E2E22', '#C9A04A', '#3E5A8A', '#E8DDC6']; for (let y = 0; y < h; y += 4) { x.fillStyle = cs[(y / 4 | 0) % 4]; x.fillRect(0, y, w, 4); } x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < w; i += 2) x.fillRect(i, 0, 1, h); }, [2, 3]),
    net: cnvTex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#D9CBA6'; x.lineWidth = 2; for (let i = 0; i <= w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }, [3, 2])
  };
  return TT;
}
const TWN = {}; // materiales reutilizados
function tm(k, c, o) { const key = k + c; if (!TWN[key]) TWN[key] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9 }, o || {})); return TWN[key]; }
function bx(w, h, d, m, x, y, z, g) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (g) g.add(o); return o; }
function cy(rt, rb, h, m, x, y, z, g, seg) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (g) g.add(o); return o; }
function jar(g, x, z, s, c, y) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2((.16 + Math.sin(t * Math.PI) * .2 - (t > .82 ? .1 : 0)) * s, t * .7 * s)); } const o = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), tm('jar', c || '#B4704A')); o.position.set(x, y || 0, z); o.castShadow = true; g.add(o); return o; }
const WOOD = () => tm('w', '#8B5B32'), WOODL = () => tm('wl', '#C08A55'), CLAY = () => tm('c', '#A85A34');
// interiores de cada oficio (coordenadas locales de la casa; la puerta mira hacia +z)
const TRADES = {
  carpintero(g, w, d) {
    const tb = new THREE.Group(); bx(2.4, .12, .9, WOODL(), 0, .95, 0, tb); [[-1.1, -.38], [1.1, -.38], [-1.1, .38], [1.1, .38]].forEach(([a, b]) => bx(.1, .95, .1, WOOD(), a, .47, b, tb));
    bx(.8, .05, .18, tm('saw', '#9A9A9A', { metalness: .6, roughness: .4 }), -.5, 1.04, .1, tb); bx(.12, .14, .3, WOOD(), -.95, 1.06, .1, tb); bx(.6, .08, .25, WOODL(), .6, 1.05, -.1, tb); bx(.16, .1, .08, tm('hm', '#5A5A5A', { metalness: .5 }), .2, 1.06, .25, tb); bx(.04, .3, .04, WOOD(), .2, 1.06, .38, tb).rotation.x = Math.PI / 2;
    tb.position.set(-w / 2 + 2.2, 0, -d / 2 + 1.6); g.add(tb);
    for (let i = 0; i < 7; i++) bx(2.6, .08, .3, WOODL(), w / 2 - 1.8, .06 + i * .085, -d / 2 + 1 + (i % 2) * .08, g).rotation.y = (i % 3 - 1) * .04;
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(.7, .07, 6, 16, Math.PI), WOODL()); yoke.rotation.set(0, 0, Math.PI); yoke.position.set(w / 2 - 1.4, .85, d / 2 - 1.6); g.add(yoke);
    const rack = new THREE.Group(); bx(2, .1, .1, WOOD(), 0, 1.7, 0, rack); for (let i = 0; i < 5; i++) bx(.06, .5 + (i % 2) * .2, .04, i % 2 ? WOODL() : tm('tool', '#7A7A7A', { metalness: .5 }), -.8 + i * .4, 1.35, .05, rack); rack.position.set(0, 0, -d / 2 + .25); g.add(rack);
    const st = cy(.25, .25, .5, WOOD(), -w / 2 + 3.6, .25, -d / 2 + 2.6, g); st.name = 'stool';
    const sh = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, .02, .06), tm('shv', '#E2C08A'), 40), m4 = new THREE.Matrix4(); for (let i = 0; i < 40; i++) { m4.makeRotationY(i * 2.1); m4.setPosition(-w / 2 + 2.2 + Math.sin(i * 7.1) * 1.4, .02, -d / 2 + 1.6 + Math.cos(i * 3.3) * 1.1); sh.setMatrixAt(i, m4); } g.add(sh);
    bx(1.2, 2, .1, WOODL(), w / 2 - .5, 1, -.3, g).rotation.set(0, Math.PI / 2, .12);
  },
  alfarero(g, w, d) {
    const wh = new THREE.Group(); cy(.55, .6, .12, WOOD(), 0, .1, 0, wh, 18); cy(.05, .05, .6, WOOD(), 0, .45, 0, wh); cy(.32, .32, .06, WOODL(), 0, .78, 0, wh, 18); const cl = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 10), CLAY()); cl.scale.y = .8; cl.position.y = .9; wh.add(cl); wh.position.set(-w / 2 + 2, 0, -d / 2 + 2); g.add(wh); cy(.2, .2, .45, WOOD(), -w / 2 + 2, .22, -d / 2 + 2.9, g);
    const sf = new THREE.Group(); for (let k = 0; k < 3; k++) bx(2.6, .07, .45, WOOD(), 0, .5 + k * .6, 0, sf); [-1.25, 1.25].forEach(a => bx(.08, 1.8, .45, WOOD(), a, .9, 0, sf)); for (let k = 0; k < 3; k++) for (let i = 0; i < 5; i++) jar(sf, -1 + i * .5, 0, .5 + ((i + k) % 3) * .12, ['#B4704A', '#C98A5A', '#8E5A3A'][(i + k) % 3], .54 + k * .6); sf.position.set(w / 2 - 1.8, 0, -d / 2 + .4); g.add(sf);
    const kiln = new THREE.Mesh(new THREE.SphereGeometry(.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), tm('kl', '#8A6A4A')); kiln.position.set(w / 2 - 1.3, 0, d / 2 - 1.5); kiln.castShadow = true; g.add(kiln); const mouth = new THREE.Mesh(new THREE.CircleGeometry(.28, 12), tm('fire', '#FF8A3A', { emissive: '#FF6A1A', emissiveIntensity: 2 })); mouth.position.set(w / 2 - 1.3, .3, d / 2 - .62); g.add(mouth);
    for (let i = 0; i < 6; i++) jar(g, -w / 2 + .6 + (i % 3) * .55, d / 2 - 1 - (i > 2 ? .5 : 0), .9 + (i % 2) * .3, '#B4704A');
  },
  panadero(g, w, d) {
    const ov = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), tm('ov', '#9A7656')); ov.scale.y = 1.1; ov.position.set(-w / 2 + 1.6, 0, -d / 2 + 1.6); ov.castShadow = true; g.add(ov);
    const fm = new THREE.Mesh(new THREE.CircleGeometry(.32, 14), tm('fire', '#FF8A3A', { emissive: '#FF6A1A', emissiveIntensity: 2 })); fm.position.set(-w / 2 + 1.6, .45, -d / 2 + 2.62); g.add(fm); fm.name = 'glow';
    const tb = new THREE.Group(); bx(2.2, .1, .8, WOODL(), 0, .8, 0, tb); [[-1, -.32], [1, -.32], [-1, .32], [1, .32]].forEach(([a, b]) => bx(.1, .8, .1, WOOD(), a, .4, b, tb)); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 8), tm('pan', '#D9A25A')); l.scale.set(1, .32, 1); l.position.set(-.8 + i * .32, .89, (i % 2 - .5) * .3); tb.add(l); } tb.position.set(w / 2 - 1.8, 0, -d / 2 + 1.5); g.add(tb);
    const tr = bx(1.4, .35, .7, WOOD(), w / 2 - 1.8, .3, 0, g); const dough = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), tm('dg', '#F0DDB8')); dough.scale.set(1.6, .4, .9); dough.position.set(w / 2 - 1.8, .5, 0); g.add(dough); tr.name = 'trough';
    for (let i = 0; i < 4; i++) { const sk = cy(.26, .32, .7, tm('sk', '#D8C8A0'), -w / 2 + .7 + i * .6, .35, d / 2 - .9, g, 10); sk.rotation.z = (i % 2 - .5) * .1; }
    const mill = new THREE.Group(); cy(.55, .58, .2, tm('st', '#8C8374'), 0, .1, 0, mill, 16); cy(.5, .5, .16, tm('st', '#8C8374'), 0, .29, 0, mill, 16); cy(.04, .04, .4, WOOD(), .35, .5, 0, mill); mill.position.set(-w / 2 + 3.6, 0, -d / 2 + 2.6); g.add(mill);
  },
  tejedora(g, w, d) {
    const lm = new THREE.Group(); [-1, 1].forEach(a => bx(.12, 2.2, .12, WOOD(), a, 1.1, 0, lm)); bx(2.3, .12, .14, WOOD(), 0, 2.15, 0, lm); bx(2.3, .1, .1, WOOD(), 0, .5, 0, lm);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshStandardMaterial({ map: townTex().weave, roughness: 1, side: THREE.DoubleSide })); cloth.position.set(0, 1.3, 0); lm.add(cloth);
    for (let i = 0; i < 10; i++) { const w8 = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), tm('st', '#8C8374')); w8.position.set(-.85 + i * .19, .32, .05); lm.add(w8); }
    lm.position.set(-w / 2 + 1.8, 0, -d / 2 + .9); g.add(lm);
    const wool = ['#E8DDC6', '#8E2E22', '#3E5A8A', '#C9A04A', '#5A2A6A', '#66763E'];
    for (let b = 0; b < 3; b++) { const bk = cy(.38, .3, .4, tm('bk', '#B89A5E'), w / 2 - 1 - b * .9, .2, -d / 2 + 1, g, 12); for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), tm('wo', wool[(b * 2 + i) % 6])); s.position.set(bk.position.x + (i % 2 - .5) * .22, .45 + (i > 1 ? .1 : 0), bk.position.z + ((i >> 1) - .5) * .2); g.add(s); } }
    const rope = cy(.015, .015, w - 1.2, WOOD(), 0, 2.2, d / 2 - 1.4, g); rope.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.2), tm('cl' + i, wool[i + 1], { side: THREE.DoubleSide })); c.position.set(-w / 2 + 1.4 + i * 1.05, 1.6, d / 2 - 1.4); g.add(c); }
    const sp = cy(.02, .02, .5, WOOD(), w / 2 - 2, .6, 0, g); sp.rotation.z = .3; const wh = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), tm('wo', '#E8DDC6')); wh.position.set(w / 2 - 2.08, .82, 0); g.add(wh);
  },
  cena(g, w, d) {
    const tb = new THREE.Group(); bx(4.6, .12, 1.1, WOODL(), 0, .42, 0, tb); [[-2.1, -.4], [2.1, -.4], [-2.1, .4], [2.1, .4], [0, -.4], [0, .4]].forEach(([a, b]) => bx(.1, .42, .1, WOOD(), a, .21, b, tb));
    const cush = ['#8E2E22', '#3E5A8A', '#C9A04A', '#66763E', '#5A2A6A', '#B4704A']; for (let i = 0; i < 13; i++) { const side = i < 6 ? -1 : i < 12 ? 1 : 0, k = i % 6, cx = side ? -2 + k * .8 : 2.75, cz = side ? side * .95 : 0; const cu = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .14, 12), tm('cu' + (i % 6), cush[i % 6])); cu.position.set(cx, .07, cz); tb.add(cu); }
    const br = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), tm('pan', '#D9A25A')); br.scale.y = .4; br.position.set(1.6, .54, 0); tb.add(br); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.08, .04, .2, 12), tm('gold2', '#C9A04A', { metalness: .7, roughness: .35 })); cup.position.set(1.9, .58, .2); tb.add(cup);
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), tm('lmp', '#FFD27A', { emissive: '#FFB347', emissiveIntensity: 2.5 })); l.position.set(-1.5 + i, .55, (i % 2 - .5) * .3); tb.add(l); }
    tb.position.set(0, 0, -.4); g.add(tb); bx(.8, .5, .5, tm('basin', '#B07A3A', { metalness: .5, roughness: .4 }), w / 2 - 1, .25, d / 2 - 1.4, g); bx(.6, .04, .3, tm('towel', '#EFE6D2'), w / 2 - 1, .55, d / 2 - 1.4, g);
  },
  posada(g, w, d) {
    for (let i = 0; i < 3; i++) { const bed = new THREE.Group(); bx(1.9, .25, .9, WOOD(), 0, .13, 0, bed); bx(1.8, .12, .8, tm('mat', '#E8DDC6'), 0, .3, 0, bed); bx(.4, .1, .6, tm('pil', '#C9B48A'), -.7, .4, 0, bed); bed.position.set(-w / 2 + 1.3, 0, -d / 2 + 1 + i * 1.2); g.add(bed); }
    const tb = new THREE.Group(); bx(1.6, .1, .9, WOODL(), 0, .75, 0, tb); [[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]].forEach(([a, b]) => bx(.08, .75, .08, WOOD(), a, .37, b, tb)); jar(tb, -.4, 0, .6, '#B4704A', .8); jar(tb, .2, .1, .45, '#8E5A3A', .8); bx(.3, .08, .2, tm('cloth3', '#E8DDC6'), .5, .84, -.2, tb); tb.position.set(w / 2 - 1.6, 0, -d / 2 + 1.4); g.add(tb);
    for (let i = 0; i < 2; i++) { const c2 = cy(.03, .03, .03, tm('coin', '#C8CCD4', { metalness: .8, roughness: .3 }), w / 2 - 1.3 + i * .1, .82, -d / 2 + 1.2, g, 10); c2.scale.set(3, 1, 3); }
  },
  techo(g, w, d) {
    const st = new THREE.Group(); bx(1.9, .08, .8, tm('mat', '#C9B48A'), 0, 0, 0, st); [-1, 1].forEach(s2 => bx(2.1, .06, .06, WOOD(), 0, .02, s2 * .42, st)); [[-.9, -.4], [.9, -.4], [-.9, .4], [.9, .4]].forEach(([a, b]) => { const r = cy(.012, .012, 1.9, tm('rp', '#C9B48A'), a, .95, b, st, 4); r.castShadow = false; }); st.position.set(0, 1.2, 0); g.add(st); st.name = 'stretcher';
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.6, 3.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#FFF2C8', transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide })); shaft.position.set(0, 1.65, 0); g.add(shaft);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, p = new THREE.Group(); cy(.2, .26, 1.1, tm('rb' + i, ['#7E9BD0', '#C9876A', '#9AB072', '#B08CC9', '#D3A35E', '#8A7A5A'][i]), 0, .55, 0, p, 8); const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), tm('sk', '#D6A57C')); hd.position.y = 1.25; p.add(hd); p.position.set(Math.cos(a) * 2.1, 0, Math.sin(a) * 1.6 - .2); if (Math.abs(p.position.x) < 1 && p.position.z > 1) continue; g.add(p); }
  },
  pescador(g, w, d) {
    const net = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshStandardMaterial({ map: townTex().net, transparent: true, alphaTest: .3, side: THREE.DoubleSide, roughness: 1 })); net.position.set(0, 1.4, -d / 2 + .3); g.add(net);
    for (let i = 0; i < 3; i++) { const bk = cy(.35, .28, .35, tm('bk', '#B89A5E'), -w / 2 + 1 + i * .9, .18, d / 2 - 1.2, g, 12); for (let f = 0; f < 3; f++) { const fi = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), tm('fi', '#9AA6A8', { metalness: .3, roughness: .5 })); fi.scale.set(2, .5, .6); fi.position.set(bk.position.x + (f - 1) * .14, .4, bk.position.z); fi.rotation.y = f; g.add(fi); } }
    [0, 1].forEach(i => { const o = bx(.08, .06, 2.4, WOODL(), w / 2 - .5 - i * .3, 1.2, 0, g); o.rotation.x = 1.25; });
    const coil = new THREE.Mesh(new THREE.TorusGeometry(.3, .06, 6, 16), tm('rp', '#C9B48A')); coil.rotation.x = Math.PI / 2; coil.position.set(w / 2 - 1.6, .06, d / 2 - 1.2); g.add(coil);
    const line = cy(.012, .012, 3, WOOD(), -w / 2 + 2.5, 2.1, -d / 2 + 1.6, g); line.rotation.z = Math.PI / 2; for (let i = 0; i < 6; i++) { const fi = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), tm('fs', '#B8A27A')); fi.scale.set(.5, 2, .4); fi.position.set(-w / 2 + 1.3 + i * .45, 1.85, -d / 2 + 1.6); g.add(fi); }
  }
};
const TRADE_INFO = {
  tumbavacia: ['¡La tumba está vacía!', 'La piedra está corrida y adentro solo quedaron los lienzos. Un ángel les dijo a las mujeres que Jesús no estaba ahí: había resucitado, tal como lo había dicho.', 'Mateo 28:1-7 · Juan 20:1-9'],
  orilla: ['La orilla del lago', 'Al amanecer, Jesús esperó a sus discípulos en la orilla con un fuego encendido, pescado y pan. Ahí le preguntó tres veces a Pedro si lo amaba.', 'Juan 21:1-17'],
  golgota: ['El Gólgota', 'Fuera de los muros de Jerusalén, en el sitio llamado Lugar de la Calavera, Jesús fue crucificado entre dos criminales. Allí dio su vida por amor a nosotros y perdonó a los que lo lastimaban.', 'Juan 19:17-30 · Lucas 23:33-43'],
  tumba: ['La tumba del huerto', 'Cerca del lugar donde crucificaron a Jesús había un huerto con una tumba nueva, cavada en la roca. José de Arimatea y Nicodemo pusieron allí su cuerpo y rodaron una gran piedra en la entrada. Pero la historia no termina acá…', 'Juan 19:38-42 · Marcos 15:46'],
  cena: ['El aposento alto', 'En una sala como esta, Jesús lavó los pies de sus discípulos y celebró con ellos la Pascua. Partió el pan y compartió la copa: así nació la Cena del Señor.', 'Juan 13:1-15 · Lucas 22:14-20'],
  huerto: ['El huerto de Getsemaní', 'Entre olivos, al pie del monte de los Olivos, Jesús oró con angustia la noche antes de la cruz y le dijo al Padre que se hiciera su voluntad.', 'Mateo 26:36-46 · Lucas 22:39-46'],
  posada: ['La posada', 'En una posada como esta, el samaritano dejó al hombre herido. Pagó dos monedas de plata al encargado y le pidió que lo cuidara hasta que volviera.', 'Lucas 10:34-35'],
  campo: ['El campo del sembrador', 'Mirá los cuatro tipos de tierra: el camino duro, las piedras, los espinos y la tierra fértil. Jesús dijo que la semilla es la Palabra de Dios.', 'Mateo 13:3-9, 18-23'],
  techo: ['La casa del techo abierto', 'La casa estaba tan llena que cuatro amigos subieron al techo, abrieron un hueco y bajaron a su amigo paralítico en una camilla. Jesús vio la fe de ellos, le perdonó los pecados y lo sanó.', 'Marcos 2:1-12'],
  cestas: ['La colina de los cinco mil', 'Acá comieron miles de personas con cinco panes y dos pescados que un muchachito compartió. Todos quedaron satisfechos y con lo que sobró llenaron doce canastas.', 'Juan 6:5-13'],
  carpintero: ['Carpintería', 'Acá se hacían puertas, mesas, arados y yugos para los bueyes. José era carpintero y Jesús aprendió el oficio en Nazaret. Por eso la gente lo conocía como «el carpintero».', 'Mateo 13:55 · Marcos 6:3'],
  alfarero: ['Alfarería', 'Con barro, agua y un torno se hacían las vasijas para el agua, el aceite y la harina. Dios usa esta imagen: como el barro en las manos del alfarero, así somos nosotros en sus manos.', 'Jeremías 18:1-6'],
  panadero: ['Panadería', 'El pan se horneaba todos los días en hornos de barro. Jesús dijo de sí mismo que él es el pan de vida: el que va a él nunca más tendrá hambre.', 'Juan 6:35'],
  tejedora: ['Casa de la tejedora', 'En el telar se tejía la lana y el lino para hacer túnicas y mantos. La túnica de Jesús era sin costura, tejida de una sola pieza de arriba abajo.', 'Juan 19:23'],
  pescador: ['Casa del pescador', 'Redes, canastos y remos: así trabajaban Pedro, Andrés, Santiago y Juan en el lago. Jesús los llamó a dejar las redes y seguirlo.', 'Mateo 4:18-22']
};
// casa grande en la que se puede entrar: muros con puerta, techo plano con vigas y el interior del oficio
/* ---------- rendimiento: une la geometría estática por material (cientos de cajas → unos pocos dibujos) ---------- */
function staticMerge(root, keep) {
  // keep(o): true para lo que se mueve o se oculta (puertas, techos, carteles, luces, animados)
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), groups = new Map(), drop = [], M = new THREE.Matrix4();
  const skip = o => { for (let p = o; p && p !== root; p = p.parent) if (p.userData && p.userData.dyn || (keep && keep(p))) return true; return false; };
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.visible || skip(o)) return;
    const m = o.material, g = o.geometry; if (m.onBeforeCompile && m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || m.transparent || !g.attributes.position || !g.attributes.normal) return;
    const key = m.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '') + (g.attributes.uv ? 'u' : '') + (g.attributes.color ? 'k' : ''); if (!groups.has(key)) groups.set(key, { m, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    groups.get(key).list.push(o);
  });
  let saved = 0;
  groups.forEach(G2 => { if (G2.list.length < 2) return; const P = [], N = [], U = [], C = [], hasU = !!G2.list[0].geometry.attributes.uv, hasC = !!G2.list[0].geometry.attributes.color;
    G2.list.forEach(o => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); M.multiplyMatrices(inv, o.matrixWorld); g.applyMatrix4(M);
      P.push(g.attributes.position.array); N.push(g.attributes.normal.array); if (hasU) U.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2)); if (hasC) C.push(g.attributes.color ? g.attributes.color.array : new Float32Array(g.attributes.position.count * 3).fill(1)); g.dispose(); drop.push(o); });
    const cat = A => { const n = A.reduce((a, b) => a + b.length, 0), out = new Float32Array(n); let o = 0; A.forEach(a => { out.set(a, o); o += a.length; }); return out; };
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(cat(P), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(cat(N), 3)); if (hasU) geo.setAttribute('uv', new THREE.BufferAttribute(cat(U), 2)); if (hasC) geo.setAttribute('color', new THREE.BufferAttribute(cat(C), 3)); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, G2.m); mesh.castShadow = G2.cast; mesh.receiveShadow = G2.recv; mesh.userData.merged = 1; root.add(mesh); saved += G2.list.length - 1; });
  drop.forEach(o => { if (o.parent) o.parent.remove(o); });
  return saved;
}
// fusión global del mundo estático: todo lo que no se mueve ni se oculta se junta por zona (64 m) y material.
// Se excluye lo que el juego guarda en S (misiones, puertas, mendigos, fuegos…), lo animado (se mide 40 cuadros) y lo marcado dyn.
function worldMerge(scene, frames) {
  const refs = new Set(), seen = new Set(), SK = { scene: 1, renderer: 1, camera: 1, allPts: 1, cam: 1 };
  const walk = (v, d) => { if (!v || typeof v !== 'object' || seen.has(v) || d > 6) return; seen.add(v); if (v.isObject3D) { if (v !== scene) refs.add(v); return; }
    if (Array.isArray(v)) { if (v.length > 4000) return; for (const x of v) walk(x, d + 1); return; } const pr = Object.getPrototypeOf(v); if (pr !== Object.prototype && pr !== null) return; for (const k in v) if (!SK[k]) walk(v[k], d + 1); };
  walk(S, 0); refs.add(S.av);
  const bad = o => { for (let p = o; p && p !== scene; p = p.parent) if (refs.has(p) || (p.userData && (p.userData.dyn || p.userData.keep)) || p.isSkinnedMesh || p.isLight && p !== o) return true; return false; };
  const SG = new Map(), tu = t => t ? t.uuid : '', hx = c => c ? c.getHex() : '';
  const msig = m => { let k = SG.get(m); if (k) return k; k = [m.type, hx(m.color), hx(m.emissive), m.emissiveIntensity, m.roughness, m.metalness, tu(m.map), tu(m.normalMap), tu(m.roughnessMap), tu(m.metalnessMap), tu(m.aoMap), tu(m.emissiveMap), tu(m.envMap), tu(m.alphaMap), m.alphaTest, m.side, m.flatShading, m.vertexColors, m.envMapIntensity, m.opacity, m.fog, m.wireframe, m.depthWrite, m.depthTest, m.polygonOffset, m.normalScale ? m.normalScale.x + ',' + m.normalScale.y : '', m.clearcoat, m.sheen, m.transmission, m.toneMapped, m.colorWrite, m.dithering].join('|'); SG.set(m, k); return k; };
  const cand = []; scene.updateMatrixWorld(true);
  scene.children.forEach(top => { if (top.isLight || top.isCamera || top.isInstancedMesh || top.isPoints || refs.has(top) || (top.userData && (top.userData.dyn || top.userData.wm || top.userData.terrain))) return; let sk = false; top.traverse(o => { if (o.isSkinnedMesh) sk = true; }); if (sk) return;
    top.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible || o.morphTargetInfluences) return; const g = o.geometry, ms = Array.isArray(o.material) ? o.material : [o.material]; if (!g || !g.attributes.position || !g.attributes.normal || g.morphAttributes && g.morphAttributes.position) return;
      if (ms.some(m => !m || m.transparent || m.isShaderMaterial || m.isPointsMaterial || m.onBeforeCompile && m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile)) return; if (o.customDepthMaterial) return; const F = at => !at || (at.array instanceof Float32Array && !at.isInterleavedBufferAttribute && !at.normalized); if (!F(g.attributes.position) || !F(g.attributes.normal) || !F(g.attributes.uv)) return; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (!vis) return;
      cand.push({ o, e: o.matrixWorld.elements.slice() }); }); });
  let n = 0; const tick = () => { if (!S || S.scene !== scene) return; if (++n < (frames || 40)) return requestAnimationFrame(tick); scene.updateMatrixWorld(true);
    const ok = cand.filter(c => { const o = c.o; if (!o.parent || !o.visible || bad(o)) return false; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (!vis) return false; const e = o.matrixWorld.elements; for (let i = 0; i < 16; i++) if (Math.abs(e[i] - c.e[i]) > 1e-5) return false; return true; });
    const B = new Map(), V = new THREE.Vector3();
    ok.forEach(({ o }) => { const ms = Array.isArray(o.material) ? o.material : [o.material], g = o.geometry; V.setFromMatrixPosition(o.matrixWorld); const cell = Math.floor(V.x / 64) + ',' + Math.floor(V.z / 64);
      const parts = Array.isArray(o.material) ? (g.groups.length ? g.groups : [{ start: 0, count: g.index ? g.index.count : g.attributes.position.count, materialIndex: 0 }]) : [null];
      parts.forEach(gr => { const m = gr ? ms[gr.materialIndex] : ms[0]; if (!m) return; const key = cell + '|' + msig(m) + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '') + (g.attributes.uv ? 'u' : '') + (g.attributes.color ? 'k' : '') + (m.side || 0);
        if (!B.has(key)) B.set(key, { m, cast: o.castShadow, recv: o.receiveShadow, hasU: !!g.attributes.uv, hasC: !!g.attributes.color, list: [] }); B.get(key).list.push({ o, gr }); }); });
    const drop = new Set(), out = new THREE.Group(); out.name = 'worldMerge'; out.userData.wm = 1; let saved = 0;
    const cat = A => { const t = A.reduce((a, b) => a + b.length, 0), r = new Float32Array(t); let k = 0; A.forEach(a => { r.set(a, k); k += a.length; }); return r; };
    B.forEach(G2 => { const P = [], N = [], U = [], C = [];
      G2.list.forEach(({ o, gr }) => { const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; const a0 = gr ? gr.start : 0, cnt = gr ? Math.min(gr.count, src.attributes.position.count - a0) : src.attributes.position.count;
        const g = new THREE.BufferGeometry(); const sl = (att, k) => new THREE.BufferAttribute(att.array.slice(a0 * k, (a0 + cnt) * k), k); g.setAttribute('position', sl(src.attributes.position, 3)); g.setAttribute('normal', sl(src.attributes.normal, 3));
        if (src.attributes.uv && src.attributes.uv.itemSize === 2) g.setAttribute('uv', sl(src.attributes.uv, 2)); { const ca = src.attributes.color; if (ca && ca.array instanceof Float32Array && !ca.isInterleavedBufferAttribute) g.setAttribute('color', new THREE.BufferAttribute(ca.itemSize === 3 ? ca.array.slice(a0 * 3, (a0 + cnt) * 3) : ca.array.slice(a0 * 4, (a0 + cnt) * 4).filter((_, i) => i % 4 < 3), 3)); }
        g.applyMatrix4(o.matrixWorld); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); if (G2.hasU) U.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(cnt * 2)); if (G2.hasC) C.push(g.attributes.color ? g.attributes.color.array : new Float32Array(cnt * 3).fill(1));
        g.dispose(); if (src !== o.geometry) src.dispose(); drop.add(o); });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(cat(P), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(cat(N), 3)); if (G2.hasU) geo.setAttribute('uv', new THREE.BufferAttribute(cat(U), 2)); if (G2.hasC) geo.setAttribute('color', new THREE.BufferAttribute(cat(C), 3)); geo.computeBoundingSphere(); geo.computeBoundingBox();
      const mesh = new THREE.Mesh(geo, G2.m); mesh.castShadow = G2.cast; mesh.receiveShadow = G2.recv; mesh.matrixAutoUpdate = false; mesh.userData.merged = 1; out.add(mesh); saved += G2.list.length - 1; });
    drop.forEach(o => { if (o.parent) o.parent.remove(o); }); saved = drop.size - out.children.length;
    out.children.forEach(m => m.updateMatrix()); scene.add(out); S.wmSaved = saved; S.wmMeshes = out.children.length; S.wmDbg = { cand: cand.length, ok: ok.length, refs: refs.size, tops: scene.children.length };
    try { if (S.renderer.compileAsync) S.renderer.compileAsync(out, S.camera); } catch (e) {}
  };
  requestAnimationFrame(tick);
}
// todas las casitas del mundo en un solo grupo: quedan 3 o 4 dibujos en total
function mergeHouses(scene) { const L = scene.children.filter(o => o.userData && o.userData.house); if (L.length < 2) return; const G2 = new THREE.Group(); scene.add(G2); L.forEach(h => G2.attach(h)); const n = staticMerge(G2); G2.children.filter(o => o.userData && o.userData.house && !o.children.length).forEach(o => G2.remove(o)); return n; }
function bigHouse(trade, hx) {
  const T = townTex(), g = new THREE.Group(), w = 7.4, d = 6.2, h = 3.3, t = .34, dw = 1.9;
  const wm = trade === 'cena' ? pbrMat('plastered_stone_wall', 2.4, 1.1, { color: '#FFFFFF' }) : pbrMat('patterned_clay_plaster', 2.4, 1.1, { color: hx ? '#F2E8DA' : '#FFFFFF' }), wmIn = new THREE.MeshStandardMaterial({ color: hx ? '#D8C6A4' : '#FFF1DA', roughness: 1 });
  const wall = (W, H, D, x, y, z) => { const o = bx(W, H, D, [wm, wm, wmIn, wmIn, wm, wm], x, y, z, g); return o; };
  wall(w, h, t, 0, h / 2, -d / 2 + t / 2); wall(t, h, d, -w / 2 + t / 2, h / 2, 0); wall(t, h, d, w / 2 - t / 2, h / 2, 0);
  const sideW = (w - dw) / 2; wall(sideW, h, t, -w / 2 + sideW / 2, h / 2, d / 2 - t / 2); wall(sideW, h, t, w / 2 - sideW / 2, h / 2, d / 2 - t / 2); wall(dw, h - 2.4, t, 0, 2.4 + (h - 2.4) / 2, d / 2 - t / 2);
  bx(dw + .4, .16, t + .12, WOOD(), 0, 2.45, d / 2 - t / 2, g);
  const hinge = new THREE.Group(); hinge.position.set(-dw / 2, 0, d / 2); bx(dw - .1, 2.3, .07, tm('door', '#6B4A2C'), (dw - .1) / 2, 1.15, 0, hinge); hinge.rotation.y = 1.25; g.add(hinge);
  [-1, 1].forEach(sx => { const wf = bx(.7, .6, .08, tm('wf', '#3A2A1A'), sx * (w / 2 - 1.5), 2, d / 2 + .01, g); wf.castShadow = false; });
  bx(w + .2, 1.6, d + .2, tm('fnd', hx ? '#8C7A62' : '#D8C6A4'), 0, -.78, 0, g);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - t * 2, d - t * 2), new THREE.MeshStandardMaterial({ map: T.floor, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = .04; floor.receiveShadow = true; g.add(floor);
  const roof = [], rm = tm('roof', hx ? '#A88E6A' : '#E6CFA4');
  if (trade === 'techo') { const hw = 1.2, hd = .8; roof.push(bx(w + .3, .26, (d + .3) / 2 - hd, rm, 0, h + .13, -(d + .3) / 4 - hd / 2, g), bx(w + .3, .26, (d + .3) / 2 - hd, rm, 0, h + .13, (d + .3) / 4 + hd / 2, g), bx((w + .3) / 2 - hw, .26, hd * 2, rm, -(w + .3) / 4 - hw / 2, h + .13, 0, g), bx((w + .3) / 2 - hw, .26, hd * 2, rm, (w + .3) / 4 + hw / 2, h + .13, 0, g));
    for (let i = 0; i < 9; i++) roof.push(bx(.35 + Math.random() * .3, .08, .25, rm, (Math.random() - .5) * 2, h + .3, (Math.random() - .5) * 1.6, g)); }
  else roof.push(bx(w + .3, .26, d + .3, rm, 0, h + .13, 0, g));
  [[0, -d / 2 - .05, w + .3, .14], [0, d / 2 + .05, w + .3, .14]].forEach(([x, z, W, D]) => roof.push(bx(W, .4, D, wm, x, h + .45, z, g)));
  [-1, 1].forEach(sx => roof.push(bx(.14, .4, d + .3, wm, sx * (w / 2 + .08), h + .45, 0, g)));
  for (let i = 0; i < 7; i++) { const b = cy(.09, .09, .5, WOOD(), -w / 2 + .6 + i * (w - 1.2) / 6, h - .18, d / 2 + .18, g, 7); b.rotation.x = Math.PI / 2; roof.push(b); }
  // (sin escalera exterior: se sacó de todas las casas)
  if (TRADES[trade]) TRADES[trade](g, w, d);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), tm('lmp', '#FFD27A', { emissive: '#FFB347', emissiveIntensity: 2.5 })); lamp.position.set(0, 2.1, -d / 2 + t + .08); g.add(lamp);
  const info = TRADE_INFO[trade]; if (info) { const lb = textSprite(info[0], hx); lb.position.set(0, h + 1.4, d / 2 + .3); lb.scale.multiplyScalar(1.05); g.add(lb); }
  const cols = [[-w / 2, w / 2, -d / 2, -d / 2 + t], [-w / 2, -w / 2 + t, -d / 2, d / 2], [w / 2 - t, w / 2, -d / 2, d / 2], [-w / 2, -dw / 2, d / 2 - t, d / 2], [dw / 2, w / 2, d / 2 - t, d / 2]];
  const solid = { cena: [[-2.4, 2.4, -1.05, .25], [2.5, 3.2, 1.4, 2.1]], posada: [[-3.7 + .34, -3.7 + 2.3, -3.1 + .5, -3.1 + 3.9], [3.7 - 2.4, 3.7 - .8, -3.1 + .9, -3.1 + 1.9]], techo: [], carpintero: [[-w / 2 + 1, -w / 2 + 3.4, -d / 2 + 1.1, -d / 2 + 2.1], [w / 2 - 3.1, w / 2 - .5, -d / 2 + .8, -d / 2 + 1.5]], alfarero: [[-w / 2 + 1.4, -w / 2 + 2.6, -d / 2 + 1.4, -d / 2 + 2.6], [w / 2 - 3.1, w / 2 - .5, -d / 2 + .2, -d / 2 + .7], [w / 2 - 2.2, w / 2 - .4, d / 2 - 2.4, d / 2 - .6]], panadero: [[-w / 2 + .6, -w / 2 + 2.6, -d / 2 + .6, -d / 2 + 2.6], [w / 2 - 2.9, w / 2 - .7, -d / 2 + 1.1, -d / 2 + 1.9]], tejedora: [[-w / 2 + .6, -w / 2 + 3, -d / 2 + .7, -d / 2 + 1.1]], pescador: [] }[trade] || [];
  return { g, cols: cols.concat(solid), roof, room: [-w / 2 + t, w / 2 - t, -d / 2 + t, d / 2 - t], trade, w, d };
}
// coloca una casa en el mundo: rot en múltiplos de 90° para que las cajas de choque sigan alineadas
function placeHouse(scene, H, x, z, rot, y) {
  H.g.position.set(x, y, z); H.g.rotation.y = rot; scene.add(H.g); { const roof = new Set(H.roof); try { staticMerge(H.g, o => roof.has(o)); } catch (e) {} }
  H.cols.forEach(c => S.cols.push(wBox(x, z, rot, ...c)));
  const r = wBox(x, z, rot, ...H.room); r.roof = H.roof; r.trade = H.trade; r.y = y; S.rooms.push(r);
}
// pozo de la plaza
function well(hx) { const w = new THREE.Group(), st = tm('st', '#8C8374'); const wall = new THREE.Mesh(new THREE.CylinderGeometry(.9, .95, .8, 18, 1, true), st); wall.material.side = THREE.DoubleSide; wall.position.y = .4; w.add(wall); const lip = new THREE.Mesh(new THREE.TorusGeometry(.92, .1, 6, 20), st); lip.rotation.x = Math.PI / 2; lip.position.y = .8; w.add(lip); [-1, 1].forEach(s => cy(.06, .06, 1.6, WOOD(), s * .85, 1.4, 0, w)); const bar = cy(.05, .05, 1.9, WOOD(), 0, 2.15, 0, w); bar.rotation.z = Math.PI / 2; cy(.15, .12, .25, WOOD(), 0, 1.5, 0, w); const water = new THREE.Mesh(new THREE.CircleGeometry(.85, 18), tm('wa', '#2E5A66', { roughness: .1, metalness: .3 })); water.rotation.x = -Math.PI / 2; water.position.y = .25; w.add(water); return w; }
// el templo de Jerusalén: atrio con pórticos, altar, fuente y el santuario con el Lugar Santo para recorrer
function bigTemple(scene, x, z, side, hx, yAt) { const r0 = bigTemple0(scene, x, z, side, hx, yAt); try { const keep = new Set([].concat(...(S.rooms || []).filter(r => /santo|atrio|velo/.test(r.trade)).map(r => r.roof || []))); staticMerge(r0 && r0.g || r0, o => keep.has(o) || !!o.name); } catch (e) {} return r0; }
function bigTemple0(scene, x, z, side, hx, yAt) {
  const T = townTex(), g = new THREE.Group(), rot = side > 0 ? -Math.PI / 2 : Math.PI / 2, y0 = yAt(x, z);
  // piedra propia del Templo (sillares claros herodianos) y piso de losas: texturas PBR únicas, a 4k en Ultra
  const st = pbrMat('white_sandstone_bricks', 1, 2.5, { color: '#FFFFFF' }), stD = pbrMat('white_sandstone_bricks', 4, 1, { color: hx ? '#EEE2CC' : '#FFF8EC' }), gold = tm('gold', '#E6B84A', { metalness: .85, roughness: .3, emissive: '#5A3A08', emissiveIntensity: .25 });
  const W = 36, D = 32, P = .9; // plataforma (x local = ancho, z local: +z mira al camino)
  const plat = new THREE.Mesh(new THREE.BoxGeometry(W, P + 5, D), [stD, stD, pbrMat('monastery_stone_floor', 9, 8, { color: '#FFFFFF' }), stD, stD, stD]); plat.position.y = P / 2 - 2.5; plat.receiveShadow = true; plat.castShadow = true; g.add(plat);
  for (let i = 0; i < 3; i++) bx(12, .3, .8, stD, 0, .15 + i * .3 - .0, D / 2 + 2.4 - i * .8, g);
  // pórticos (columnatas) en los costados y al fondo, con techo
  const colM = st, colsL = [];
  const portico = (ax, az, len, alongX) => { const n = Math.round(len / 3); for (let i = 0; i <= n; i++) { const u = -len / 2 + i * len / n, px = alongX ? ax + u : ax, pz = alongX ? az : az + u; cy(.32, .36, 5.2, colM, px, P + 2.6, pz, g, 14); bx(.9, .3, .9, stD, px, P + 5.3, pz, g); } const rf = bx(alongX ? len + 2 : 3.2, .35, alongX ? 3.2 : len + 2, stD, ax + (alongX ? 0 : (ax > 0 ? 1.2 : -1.2)), P + 5.6, az + (alongX ? (az > 0 ? 1.2 : -1.2) : 0), g); return rf; };
  portico(-W / 2 + 1.2, -1, D - 6, false); portico(W / 2 - 1.2, -1, D - 6, false); portico(0, -D / 2 + 1.2, W - 4, true);
  // muro bajo del atrio con la entrada al frente
  [-1, 1].forEach(s => bx(W / 2 - 4, 1.2, .5, stD, s * (W / 4 + 2), P + .6, D / 2 - .4, g));
  // santuario
  const sx = 0, sz = -5, sw = 10, sd = 15, sh = 11;
  const sanc = new THREE.Group(); sanc.position.set(sx, P, sz); g.add(sanc);
  const wall = (Wd, H, Dp, x2, y2, z2) => bx(Wd, H, Dp, st, x2, y2, z2, sanc);
  wall(sw, sh, .5, 0, sh / 2, -sd / 2); wall(.5, sh, sd, -sw / 2, sh / 2, 0); wall(.5, sh, sd, sw / 2, sh / 2, 0);
  const dw = 3.2; wall((sw - dw) / 2, sh, .5, -sw / 4 - dw / 4, sh / 2, sd / 2); wall((sw - dw) / 2, sh, .5, sw / 4 + dw / 4, sh / 2, sd / 2); wall(dw, sh - 6, .5, 0, 6 + (sh - 6) / 2, sd / 2);
  const roofS = [bx(sw + 1, .5, sd + 1, stD, 0, sh + .25, 0, sanc)]; for (let i = 0; i < 12; i++) roofS.push(bx(.18, .9, .18, gold, -sw / 2 + .4 + i * (sw - .8) / 11, sh + .95, sd / 2 + .4, sanc));
  // fachada: pórtico de entrada con columnas doradas y friso
  [-1, 1].forEach(s => { cy(.42, .46, 8, st, s * 2.3, 4, sd / 2 + 1.3, sanc, 16); bx(1.1, .5, 1.1, gold, s * 2.3, 8.2, sd / 2 + 1.3, sanc); }); bx(7, .8, 1.4, gold, 0, 8.7, sd / 2 + 1.3, sanc);
  // Lugar Santo: candelabro, mesa de los panes y altar del incienso
  const veilZ = -sd / 2 + 4.5;
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(sw - .6, sh - .4), new THREE.MeshStandardMaterial({ map: cnvTex(64, 128, (c, w2, h2) => { const cs = ['#2E4A9A', '#5A2A7A', '#9A1E2A', '#E8DDC6']; for (let y = 0; y < h2; y += 8) { c.fillStyle = cs[(y / 8 | 0) % 4]; c.fillRect(0, y, w2, 8); } c.fillStyle = 'rgba(230,184,74,.55)'; for (let y = 4; y < h2; y += 24) for (let x2 = 6; x2 < w2; x2 += 14) { c.beginPath(); c.arc(x2, y, 3, 0, 7); c.fill(); } }), side: THREE.DoubleSide, roughness: 1 })); veil.position.set(0, sh / 2, veilZ); sanc.add(veil);
  const men = new THREE.Group(); cy(.06, .25, .3, gold, 0, .15, 0, men); cy(.05, .05, 1.6, gold, 0, 1.05, 0, men); [-1, 1].forEach(s => [.3, .55, .8].forEach((r, i) => { const arm = new THREE.Mesh(new THREE.TorusGeometry(r, .035, 6, 14, Math.PI / 2), gold); arm.position.set(0, 1.85, 0); arm.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI; arm.scale.y = 1.4 - i * .2; men.add(arm); }));
  [-.8, -.55, -.3, 0, .3, .55, .8].forEach(px => { cy(.06, .04, .1, gold, px, px === 0 ? 1.9 : 1.85 + .0, 0, men); const fl = new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 6), tm('fire', '#FF8A3A', { emissive: '#FFB347', emissiveIntensity: 3 })); fl.position.set(px, 2.02, 0); men.add(fl); });
  men.position.set(-2.6, 0, veilZ + 3); sanc.add(men);
  const tbl = new THREE.Group(); bx(1.6, .1, .8, gold, 0, 1, 0, tbl); [[-.7, -.3], [.7, -.3], [-.7, .3], [.7, .3]].forEach(([a, b]) => bx(.08, 1, .08, gold, a, .5, b, tbl)); for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 6), tm('pan', '#D9A25A')); l.scale.y = .35; l.position.set(-.55 + (i % 6) * .22, 1.1 + Math.floor(i / 6) * .08, i < 6 ? -.15 : .15); tbl.add(l); } tbl.position.set(2.6, 0, veilZ + 3); sanc.add(tbl);
  const inc = new THREE.Group(); bx(.7, 1.1, .7, gold, 0, .55, 0, inc); const sm = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .25, depthWrite: false })); sm.position.y = 1.5; sm.name = 'smoke'; inc.add(sm); inc.position.set(0, 0, veilZ + 1.5); sanc.add(inc);
  const glowL = new THREE.Mesh(new THREE.PlaneGeometry(sw - 1, sd - 5), new THREE.MeshBasicMaterial({ color: '#FFD27A', transparent: true, opacity: .06, depthWrite: false })); glowL.rotation.x = -Math.PI / 2; glowL.position.set(0, .05, veilZ + (sd / 2 - veilZ) / 2 + 1); sanc.add(glowL);
  // altar de los holocaustos y fuente de bronce, delante del santuario
  const alt = new THREE.Group(); bx(3.6, 1.6, 3.6, tm('alt', '#9A8F7C'), 0, .8, 0, alt); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(.3, .35, .3, tm('alt', '#9A8F7C'), a * 1.65, 1.75, b * 1.65, alt)); const emb = new THREE.Mesh(new THREE.BoxGeometry(2.4, .1, 2.4), tm('fire', '#FF8A3A', { emissive: '#FF5A1A', emissiveIntensity: 1.6 })); emb.position.y = 1.62; alt.add(emb); bx(1.2, .6, 3, stD, 0, .3, 3.3, alt).rotation.x = -.25;
  alt.position.set(-5.5, P, 7.5); g.add(alt);
  const lav = new THREE.Group(); cy(1.1, .6, .9, tm('brz', '#B07A3A', { metalness: .7, roughness: .35 }), 0, 1.5, 0, lav, 20); cy(.25, .4, 1, tm('brz', '#B07A3A', { metalness: .7, roughness: .35 }), 0, .5, 0, lav, 12); const lw = new THREE.Mesh(new THREE.CircleGeometry(1.02, 20), tm('wa', '#2E5A66', { roughness: .1, metalness: .3 })); lw.rotation.x = -Math.PI / 2; lw.position.y = 1.9; lav.add(lw); lav.position.set(5.5, P, 7.5); g.add(lav);
  // rincón de los maestros, bajo el pórtico: bancos y rollos
  const tc = new THREE.Group(); for (let i = 0; i < 3; i++) bx(3.4, .45, .6, stD, 0, .22, i * 1.2, tc); for (let i = 0; i < 5; i++) { const sc = cy(.08, .08, .5, tm('sc', '#EADBB4'), -1.2 + i * .6, .52, (i % 3) * 1.2, tc, 8); sc.rotation.z = Math.PI / 2; } tc.position.set(-W / 2 + 4.5, P, -4); g.add(tc);
  g.position.set(x, y0, z); g.rotation.y = rot; g.traverse(o => { if (o.isMesh && hx) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } }); scene.add(g);
  const lb = textSprite('Templo de Jerusalén', hx); lb.scale.multiplyScalar(1.4); lb.position.set(0, P + sh + 4, sz + sd / 2); g.add(lb);
  // choques: pórticos (sus columnas forman un muro con pasos), muros del santuario, cortina, altar y fuente
  const C = (a, b, c2, d2) => S.cols.push(wBox(x, z, rot, a, b, c2, d2));
  C(-W / 2, -W / 2 + .6, -D / 2, D / 2); C(W / 2 - .6, W / 2, -D / 2, D / 2); C(-W / 2, W / 2, -D / 2, -D / 2 + .6);
  C(-W / 2, -6, D / 2 - .7, D / 2 - .1); C(6, W / 2, D / 2 - .7, D / 2 - .1);
  C(sx - sw / 2 - .3, sx - sw / 2 + .3, sz - sd / 2, sz + sd / 2); C(sx + sw / 2 - .3, sx + sw / 2 + .3, sz - sd / 2, sz + sd / 2); C(sx - sw / 2, sx + sw / 2, sz - sd / 2 - .3, sz + veilZ + .3);
  C(sx - sw / 2, sx - dw / 2, sz + sd / 2 - .3, sz + sd / 2 + .3); C(sx + dw / 2, sx + sw / 2, sz + sd / 2 - .3, sz + sd / 2 + .3);
  C(-5.5 - 1.9, -5.5 + 1.9, 7.5 - 1.9, 7.5 + 1.9); C(5.5 - 1.2, 5.5 + 1.2, 7.5 - 1.2, 7.5 + 1.2);
  C(-2.6 - .5, -2.6 + .5, sz + veilZ + 2.5, sz + veilZ + 3.5); C(2.6 - .9, 2.6 + .9, sz + veilZ + 2.5, sz + veilZ + 3.5); C(-.45, .45, sz + veilZ + 1.05, sz + veilZ + 1.95);
  const fl = wBox(x, z, rot, -W / 2, W / 2, -D / 2, D / 2); fl.y = y0 + P; S.floors.push(fl);
  for (let i = 0; i < 3; i++) { const f2 = wBox(x, z, rot, -6, 6, D / 2 + 2 - i * .8, D / 2 + 2.8 - i * .8); f2.y = y0 + .3 + i * .3; S.floors.push(f2); }
  const room = wBox(x, z, rot, sx - sw / 2 + .3, sx + sw / 2 - .3, sz + veilZ, sz + sd / 2); room.roof = roofS; room.trade = 'santo'; room.y = y0 + P; S.rooms.push(room);
  const court = wBox(x, z, rot, -W / 2 + 1, W / 2 - 1, -D / 2 + 1, D / 2 - 1); court.trade = 'atrio'; court.roof = []; court.y = y0 + P; court.open = true; S.rooms.push(court);
  const veilBox = wBox(x, z, rot, sx - sw / 2, sx + sw / 2, sz + veilZ - 1.2, sz + veilZ + 1.4); veilBox.trade = 'velo'; veilBox.roof = []; veilBox.open = true; S.rooms.push(veilBox);
  return { g, smoke: sm, y0 };
}
TRADE_INFO.atrio = ['El templo de Jerusalén', 'Este es el atrio del templo, rodeado de pórticos. Acá Jesús, con doce años, se quedó escuchando y haciendo preguntas a los maestros. Años después enseñó en el Pórtico de Salomón.', 'Lucas 2:46 · Juan 10:23'];
TRADE_INFO.santo = ['El Lugar Santo', 'Solo los sacerdotes entraban acá. El candelabro de oro daba luz, sobre la mesa estaban los doce panes y en el altar del incienso subía el perfume, como las oraciones que suben a Dios.', 'Éxodo 25:30-31 · Salmo 141:2'];
TRADE_INFO.velo = ['La cortina del templo', 'Detrás de esta cortina estaba el Lugar Santísimo: el sumo sacerdote entraba una sola vez al año. Cuando Jesús murió, la cortina se rasgó de arriba abajo: por él, ahora todos podemos acercarnos a Dios.', 'Hebreos 9:7 · Mateo 27:51 · Hebreos 10:19-20'];
TRADE_INFO.lago = ['El mar de Galilea', 'Un lago grande de agua dulce rodeado de pueblos de pescadores como Capernaúm y Betsaida. Jesús caminó sobre sus aguas, calmó la tormenta y llamó ahí a sus primeros discípulos.', 'Marcos 1:16-20 · Marcos 4:35-41'];
// el lago de Galilea: agua con olas suaves, orilla, muelle, barcas y la casa del pescador
function buildLake(scene, cx, cz, side, hx, yAt) {
  const R = 30, y0 = WATER.WL - .42;
  const uni = { t: { value: 0 } }; waterLake(scene, cx, cz, R * 1.2, hx, yAt);
  // muelle de tablas que entra al agua
  const dock = new THREE.Group(), dx = cx + side * (R - 3.5), len = 12; for (let i = 0; i < 24; i++) bx(.48, .1, 2.2, WOODL(), -len / 2 + i * .5, 0, 0, dock).rotation.y = (i % 3 - 1) * .02; for (let i = 0; i < 7; i++) [-1, 1].forEach(s => cy(.1, .1, 1.6, WOOD(), -len / 2 + i * 2, -.6, s * 1.05, dock, 7));
  dock.position.set(dx, y0 + .62, cz + 4); scene.add(dock); const df = { x0: dx - len / 2, x1: dx + len / 2, z0: cz + 4 - 1.1, z1: cz + 4 + 1.1, y: y0 + .67 }; S.floors.push(df);
  const boat = (bx2, bz, ry) => { const b = new THREE.Group(); const hull = new THREE.Mesh(new THREE.CylinderGeometry(1, .6, 5, 14, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#7A5234', roughness: .9, side: THREE.DoubleSide })); hull.rotation.set(Math.PI / 2, 0, Math.PI); hull.scale.set(1, 1, .7); b.add(hull); [-1.2, 0, 1.2].forEach(q => bx(1.7, .08, .3, WOODL(), 0, -.15, q, b)); const mast = cy(.06, .07, 4, WOOD(), 0, 1.8, -.6, b, 7); const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), tm('sail', '#EFE6D2', { side: THREE.DoubleSide })); sail.position.set(0, 2.3, -.4); sail.rotation.y = .3; b.add(sail); [-1, 1].forEach(s => { const o = bx(.07, .05, 2.6, WOODL(), s * .9, .2, .8, b); o.rotation.x = .5; }); b.position.set(bx2, y0 + .45, bz); b.rotation.y = ry; b.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(b); return b; };
  const boats = [boat(dx - side * 5, cz + 8, .2), boat(cx - side * 6, cz - 10, 1.4), boat(cx + side * 4, cz + 14, -.8)];
  // juncos en la orilla
  const reed = new THREE.InstancedMesh(new THREE.CylinderGeometry(.015, .02, 1, 4), tm('reed', '#6E8A44'), 260), m4 = new THREE.Matrix4(), rr = rng(31); for (let i = 0; i < 260; i++) { const a = rr() * 6.28, r = R - .5 + rr() * 2.5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; m4.makeScale(1, .6 + rr() * .9, 1); m4.setPosition(x, y0 + .85, z); reed.setMatrixAt(i, m4); } scene.add(reed);
  // el agua no se camina: un anillo de cajas finas alrededor (dejando libre el muelle)
  for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, a2 = (i + 1) / 48 * 6.283, x1 = cx + Math.cos(a) * (R * 1.08), z1 = cz + Math.sin(a) * (R * 1.08), x2 = cx + Math.cos(a2) * (R * 1.08), z2 = cz + Math.sin(a2) * (R * 1.08); const b = { x0: Math.min(x1, x2) - .3, x1: Math.max(x1, x2) + .3, z0: Math.min(z1, z2) - .3, z1: Math.max(z1, z2) + .3 }; if (b.x1 > df.x0 - .5 && b.x0 < df.x1 + .5 && b.z1 > df.z0 - .5 && b.z0 < df.z1 + .5) continue; S.cols.push(b); }
  S.cols.push({ x0: df.x0 - .3, x1: df.x1 + .3, z0: df.z0 - .5, z1: df.z0 - .2 }, { x0: df.x0 - .3, x1: df.x1 + .3, z0: df.z1 + .2, z1: df.z1 + .5 }); // barandas invisibles del muelle
  const r = { x0: cx - R, x1: cx + R, z0: cz - R, z1: cz + R, trade: 'lago', roof: [], open: true, y: y0 }; S.rooms.push(r);
  const lb = textSprite('Mar de Galilea', hx); lb.scale.multiplyScalar(1.5); lb.position.set(cx, y0 + 7, cz); scene.add(lb);
  return { uni, boats, y0 };
}
// estado de "adentro": oculta el techo, acomoda la cámara y cuenta la historia del lugar la primera vez
function roomTick(dt) {
  if (!S || !S.rooms) return; const a = S.av.position; let inR = null, openR = null;
  for (const r of S.rooms) if (a.x > r.x0 && a.x < r.x1 && a.z > r.z0 && a.z < r.z1) { if (r.open) { if (!openR || (r.x1 - r.x0) < (openR.x1 - openR.x0)) openR = r; } else inR = r; }
  for (const r of S.rooms) { if (r.open) continue; const show = r !== inR; r.roof.forEach(m => { m.visible = show; }); }
  if (inR !== S.inRoom) { if (inR && !S.inRoom) S.camKeep = { d: S.camDist, p: S.camPitch }; if (!inR && S.camKeep) { S.camDist = S.camKeep.d; S.camPitch = S.camKeep.p; S.camKeep = null; } S.inRoom = inR; }
  if (inR) { S.camDist += (Math.min(S.camKeep ? S.camKeep.d : 6, 5.2) - S.camDist) * Math.min(1, dt * 3); S.camPitch += (Math.max(S.camKeep ? S.camKeep.p : .4, .95) - S.camPitch) * Math.min(1, dt * 3); }
  const here = inR || openR; if (here && here.trade && TRADE_INFO[here.trade]) { const p = G().P(); p.seen = p.seen || {}; if (!p.seen[here.trade]) { p.seen[here.trade] = 1; G().save(); placeCard(TRADE_INFO[here.trade]); } }
  if (S.lake) { S.lake.uni.t.value += dt; S.lake.boats.forEach((b, i) => { b.position.y = S.lake.y0 + .45 + Math.sin(S.t * 1.2 + i) * .06; b.rotation.z = Math.sin(S.t * .9 + i * 2) * .04; }); }
  if (S.temple && S.temple.smoke) { const sm = S.temple.smoke; sm.position.y = 1.5 + (S.t * .4 % 1.2); sm.material.opacity = .3 * (1 - (S.t * .4 % 1.2) / 1.2); sm.scale.setScalar(1 + (S.t * .4 % 1.2)); }
}
function placeCard(info) {
  let el = document.getElementById('v3place'); if (!el) { el = document.createElement('div'); el.id = 'v3place'; el.className = 'v3place'; document.body.appendChild(el); }
  el.innerHTML = `<small>Lugar de la época</small><b>${esc(info[0])}</b><p>${esc(info[1])}</p><em>${esc(info[2])}</em><button aria-label="Cerrar">✕</button>`;
  el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); el.querySelector('button').onclick = () => { el.hidden = true; try { G().voStop(); } catch (e) {} }; try { G().vo(info[0]); G().vo(info[1], 'narrador', { queue: 1 }); } catch (e) {}
  clearTimeout(placeCard.t); placeCard.t = setTimeout(() => { el.hidden = true; }, 14000); tone3d();
}
// arma todo: Nazaret con sus talleres, el templo y el lago (si existe la etapa de Galilea)
function buildTowns(scene, g, hx, HW, pois) {
  S.cols = HCOLS; HCOLS = []; S.floors = []; S.rooms = []; const yAt = (x, z) => HW ? HW.hAt(x, z) : 0;
  for (const p of pois) {
    if (p.k === 'taller') { // Nazaret: cuatro talleres alrededor de una plaza con pozo
      const pv = new THREE.Mesh(new THREE.CircleGeometry(15, 40), new THREE.MeshStandardMaterial({ map: townTex().pave, color: hx ? '#BFAE8E' : '#FFFFFF', roughness: 1 })); pv.rotation.x = -Math.PI / 2; pv.position.set(p.x, yAt(p.x, p.z) + .03, p.z); pv.receiveShadow = true; scene.add(pv);
      const w = well(hx); w.position.set(p.x, yAt(p.x, p.z), p.z); w.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(w); S.cols.push({ x0: p.x - 1, x1: p.x + 1, z0: p.z - 1, z1: p.z + 1 });
      [['carpintero', -6, -8.5, 0], ['alfarero', 6, -8.5, 0], ['panadero', -6, 8.5, Math.PI], ['tejedora', 6, 8.5, Math.PI]].forEach(([k, ox, oz, rot]) => { const H = bigHouse(k, hx), x = p.x + ox * 1.25, z = p.z + oz, y = Math.max(yAt(x, z), yAt(x - 3, z - 3), yAt(x + 3, z + 3)) - .02; placeHouse(scene, H, x, z, rot, y); });
    }
    if (p.k === 'temple') S.temple = bigTemple(scene, p.x, p.z, p.side, hx, yAt);
    if (p.k === 'upper') { const H = bigHouse('cena', hx); placeHouse(scene, H, p.x, p.z, p.side > 0 ? -Math.PI / 2 : Math.PI / 2, yAt(p.x, p.z) - .02); }
    if (p.k === 'shore') { const y = yAt(p.x, p.z), cx = p.x + p.side * 7;
      waterLake(scene, cx, p.z, 8.5 * 1.25, hx, yAt); S.cols.push({ x0: cx - 6.5, x1: cx + 6.5, z0: p.z - 6.5, z1: p.z + 6.5 });
      const boat = new THREE.Group(); bx(3.2, .5, 1.1, WOOD(), 0, .25, 0, boat); bx(3.4, .12, 1.25, WOODL(), 0, .52, 0, boat); cy(.05, .05, 2.6, WOOD(), .4, 1.6, 0, boat); boat.position.set(cx - p.side * 4, WATER.WL - .1, p.z + 2); boat.rotation.y = .4; scene.add(boat);
      const fire = new THREE.Group(); for (let i = 0; i < 5; i++) { const l = cy(.05, .06, .7, tm('wd', '#6A4A2E'), 0, .08, 0, fire); l.rotation.z = Math.PI / 2 - .25; l.rotation.y = i / 5 * 6.28; } const fl = new THREE.Mesh(new THREE.ConeGeometry(.2, .55, 8), tm('fire', '#FF8A3A', { emissive: '#FFB347', emissiveIntensity: 3 })); fl.position.y = .35; fire.add(fl);
      for (let i = 0; i < 3; i++) { const f2 = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .22, 4, 8), tm('fishc', '#B08A6A')); f2.rotation.z = Math.PI / 2; f2.position.set(-.3 + i * .3, .5, .35); fire.add(f2); } const br = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), tm('pan', '#D9A25A')); br.scale.y = .5; br.position.set(.7, .08, -.3); fire.add(br);
      fire.position.set(p.x - p.side * 2, y, p.z - 1); scene.add(fire);
      S.rooms.push({ x0: p.x - 12, x1: p.x + 12, z0: p.z - 12, z1: p.z + 12, trade: 'orilla', roof: [], open: true, y }); const lb = textSprite(p.name, hx); lb.scale.multiplyScalar(1.2); lb.position.set(p.x, y + 4.5, p.z); scene.add(lb); }
    if (p.k === 'golgota') { const y = yAt(p.x, p.z), R = rng(77), stn = tm('st', '#8C8374'), wd = tm('crw', '#5A4632');
      const mound = new THREE.Mesh(new THREE.SphereGeometry(6, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), tm('gol', '#9A8C74')); mound.scale.y = .32; mound.position.set(p.x, y - .1, p.z); mound.receiveShadow = true; mound.castShadow = true; scene.add(mound); S.cols.push({ x0: p.x - 4.6, x1: p.x + 4.6, z0: p.z - 4.6, z1: p.z + 4.6 });
      [-2.6, 0, 2.6].forEach((dz, i) => { const cr = new THREE.Group(), hh = i === 1 ? 4.4 : 3.8; bx(.26, hh, .26, wd, 0, hh / 2, 0, cr); bx(2.1, .22, .24, wd, 0, hh - .9, 0, cr); if (i === 1) { bx(.5, .3, .05, tm('tit', '#E8DDC6'), 0, hh - .2, .16, cr); } cr.position.set(p.x, y + 1.8, p.z + dz); cr.rotation.y = Math.PI / 2; cr.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(cr); });
      for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = 6.5 + R() * 6, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, rk = new THREE.Mesh(new THREE.DodecahedronGeometry(.4 + R() * .7, 0), stn); rk.scale.y = .6; rk.position.set(x, yAt(x, z) + .15, z); rk.castShadow = true; scene.add(rk); }
      S.rooms.push({ x0: p.x - 13, x1: p.x + 13, z0: p.z - 13, z1: p.z + 13, trade: 'golgota', roof: [], open: true, y }); const lb = textSprite(p.name, hx); lb.scale.multiplyScalar(1.2); lb.position.set(p.x, y + 7.2, p.z); scene.add(lb); }
    if (p.k === 'tomb') { const y = yAt(p.x, p.z), R = rng(91), rockM = tm('tmb', '#A69A86'), sd = -p.side;
      const cliff = new THREE.Group(); [[0, 2.2, 0, 3.4], [-2.6, 1.6, .4, 2.6], [2.6, 1.7, .2, 2.7], [0, 3.6, -.6, 2.4]].forEach(([a, b, c2, r]) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), rockM); m.position.set(a, b, c2 - 1.4); m.castShadow = true; m.receiveShadow = true; cliff.add(m); });
      bx(5.4, 3.2, .7, rockM, 0, 1.6, 1.85, cliff); const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), tm('tdoor', '#1A1612')); door.position.set(0, .95, 2.21); cliff.add(door);
      const risen = !!(G().isDone && G().isDone('resurreccion-n1')); const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .4, 24), tm('tst', '#B4A890')); stone.rotation.x = Math.PI / 2; stone.position.set(risen ? -2.2 : -.45, 1.15, risen ? 2.6 : 2.42); stone.castShadow = true; cliff.add(stone);
      if (risen) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.75), new THREE.MeshBasicMaterial({ color: '#FFF2C8', transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })); gl.position.set(0, .95, 2.215); cliff.add(gl); const ln = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .35), tm('lino', '#F4EEDC')); ln.position.set(.4, .1, 2.6); cliff.add(ln); }
      cliff.position.set(p.x, y, p.z); cliff.rotation.y = sd > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(cliff); S.cols.push({ x0: p.x - 4.2, x1: p.x + 4.2, z0: p.z - 4.2, z1: p.z + 4.2 });
      for (let i = 0; i < 18; i++) { const a = R() * 6.28, r = 6 + R() * 8, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, b2 = new THREE.Mesh(new THREE.IcosahedronGeometry(.5 + R() * .4, 0), tm('bush', ['#6E8A4A', '#7A9A5A', '#5A7A3A'][i % 3])); b2.scale.y = .7; b2.position.set(x, yAt(x, z) + .3, z); b2.castShadow = true; scene.add(b2); if (i % 3 === 0) { const fl = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), tm('fl' + (i % 2), i % 2 ? '#F2EEE4' : '#E8B04A')); fl.position.set(x + .3, yAt(x, z) + .65, z); scene.add(fl); } }
      S.rooms.push({ x0: p.x - 13, x1: p.x + 13, z0: p.z - 13, z1: p.z + 13, trade: risen ? 'tumbavacia' : 'tumba', roof: [], open: true, y }); const lb = textSprite(p.name, hx); lb.scale.multiplyScalar(1.2); lb.position.set(p.x, y + 7, p.z); scene.add(lb); }
    if (p.k === 'garden') { const y = yAt(p.x, p.z), R = rng(52); for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = 4 + R() * 12, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, t2 = new THREE.Group(); const tr = cy(.16, .26, 1.6, tm('olt', '#6A5A44'), 0, .8, 0, t2, 7); tr.rotation.z = (R() - .5) * .4; const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), tm('olv', '#7A8A5A')); cr.scale.y = .7; cr.position.y = 2; t2.add(cr); t2.position.set(x, yAt(x, z), z); t2.rotation.y = R() * 6; t2.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(t2); S.cols.push({ x0: x - .35, x1: x + .35, z0: z - .35, z1: z + .35 }); }
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), tm('st', '#8C8374')); rock.scale.set(1.3, .6, 1); rock.position.set(p.x, y + .3, p.z); rock.castShadow = true; scene.add(rock); S.cols.push({ x0: p.x - 1.2, x1: p.x + 1.2, z0: p.z - .9, z1: p.z + .9 });
      const rr2 = { x0: p.x - 15, x1: p.x + 15, z0: p.z - 15, z1: p.z + 15, trade: 'huerto', roof: [], open: true, y }; S.rooms.push(rr2); const lb = textSprite(p.name, hx); lb.scale.multiplyScalar(1.2); lb.position.set(p.x, y + 4.5, p.z); scene.add(lb); }
    if (p.k === 'inn') { const H = bigHouse('posada', hx); placeHouse(scene, H, p.x, p.z, p.side > 0 ? -Math.PI / 2 : Math.PI / 2, yAt(p.x, p.z) - .02); const dk = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .8, 4, 8), tm('dk', '#8A7A6A')); body.rotation.z = Math.PI / 2; body.position.y = .9; dk.add(body); const hd2 = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .4, 4, 8), tm('dk', '#8A7A6A')); hd2.position.set(.62, 1.2, 0); hd2.rotation.z = -.6; dk.add(hd2); [[-.35, -.15], [-.35, .15], [.35, -.15], [.35, .15]].forEach(([a, b]) => cy(.06, .05, .7, tm('dk', '#8A7A6A'), a, .35, b, dk, 6)); dk.position.set(p.x - p.side * 6, yAt(p.x - p.side * 6, p.z + 5), p.z + 5); dk.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(dk); S.cols.push({ x0: dk.position.x - .8, x1: dk.position.x + .8, z0: dk.position.z - .5, z1: dk.position.z + .5 }); }
    if (p.k === 'field') { const y = yAt(p.x, p.z), zc = [['#C9B48A', 'camino'], ['#8C8374', 'piedras'], ['#5A6A3A', 'espinos'], ['#6B4A2C', 'fértil']];
      zc.forEach(([col], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(22, 5), tm('soil' + i, col)); m.rotation.x = -Math.PI / 2; m.position.set(p.x, y + .04, p.z - 8 + i * 5.4); m.receiveShadow = true; scene.add(m);
        const zz = p.z - 8 + i * 5.4; if (i === 1) for (let k = 0; k < 14; k++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.25 + Math.random() * .25, 0), tm('st', '#8C8374')); r.position.set(p.x - 10 + k * 1.5, y + .1, zz + (Math.random() - .5) * 3); r.castShadow = true; scene.add(r); }
        if (i === 2) for (let k = 0; k < 16; k++) { const b = new THREE.Mesh(new THREE.ConeGeometry(.35, .8, 5), tm('thorn', '#3E4A22')); b.position.set(p.x - 10 + k * 1.35, y + .4, zz + (Math.random() - .5) * 3); scene.add(b); }
        if (i === 3) { const n = 220, wm = new THREE.InstancedMesh(new THREE.ConeGeometry(.05, .9, 4), tm('wheat', '#E6C46A'), n), m4 = new THREE.Matrix4(); for (let k = 0; k < n; k++) { m4.makeRotationZ((Math.random() - .5) * .2); m4.setPosition(p.x - 10.5 + Math.random() * 21, y + .45, zz - 2.3 + Math.random() * 4.6); wm.setMatrixAt(k, m4); } scene.add(wm); } });
      const rr2 = { x0: p.x - 12, x1: p.x + 12, z0: p.z - 11, z1: p.z + 11, trade: 'campo', roof: [], open: true, y }; S.rooms.push(rr2); const lb = textSprite(p.name, hx); lb.scale.multiplyScalar(1.2); lb.position.set(p.x, y + 4, p.z - 12); scene.add(lb); }
    if (p.k === 'roofhouse') { const H = bigHouse('techo', hx); placeHouse(scene, H, p.x, p.z, p.side > 0 ? -Math.PI / 2 : Math.PI / 2, yAt(p.x, p.z) - .02); }
    if (p.k === 'feeding') { const y = yAt(p.x, p.z), R = rng(66); const cl = ['#C9B48A', '#8E2E22', '#3E5A8A', '#E8DDC6', '#66763E'];
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r = 6.5, bk = new THREE.Group(); cy(.42, .32, .45, tm('bk', '#B89A5E'), 0, .22, 0, bk, 12); for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), tm('pan', '#D9A25A')); l.scale.y = .5; l.position.set((k % 2 - .5) * .26, .5, ((k >> 1) - .5) * .22); bk.add(l); } bk.position.set(p.x + Math.cos(a) * r, y, p.z + Math.sin(a) * r); bk.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(bk); }
      for (let i = 0; i < 10; i++) { const a = R() * 6.28, r = 9 + R() * 6, m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), tm('cloth' + (i % 5), cl[i % 5], { side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.rotation.z = R() * 3; m.position.set(p.x + Math.cos(a) * r, y + .04, p.z + Math.sin(a) * r); m.receiveShadow = true; scene.add(m); for (let k = 0; k < 4; k++) { const pp = new THREE.Group(), robe = ['#7E9BD0', '#C9876A', '#9AB072', '#B08CC9', '#D3A35E', '#8A7A5A'][(i + k) % 6]; cy(.24, .3, .55, tm('rb' + robe, robe), 0, .28, 0, pp, 8); const hd = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), tm('sk', '#D6A57C')); hd.position.y = .68; pp.add(hd); const b2 = a + (k - 1.5) * .35; pp.position.set(m.position.x + Math.cos(b2) * 1.5, y, m.position.z + Math.sin(b2) * 1.5); pp.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(pp); } }
      const rr2 = { x0: p.x - 16, x1: p.x + 16, z0: p.z - 16, z1: p.z + 16, trade: 'cestas', roof: [], open: true, y }; S.rooms.push(rr2); const lb = textSprite(p.name, hx); lb.scale.multiplyScalar(1.2); lb.position.set(p.x, y + 4, p.z); scene.add(lb); }
    if (p.k === 'lake') { S.lake = buildLake(scene, p.x, p.z, p.side, hx, yAt); const H = bigHouse('pescador', hx), hx2 = p.x - p.side * 36, hz = p.z - 6; placeHouse(scene, H, hx2, hz, p.side > 0 ? Math.PI / 2 : -Math.PI / 2, yAt(hx2, hz)); }
  }
}
/* destino marcado en el mapa: columna de luz y flecha en el piso */
function wpSync() {
  if (!S) return; const yAt = (x, z) => S.W ? S.W.hAt(x, z) : 0;
  if (!S.wpObj) { const g = new THREE.Group(); const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .6, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#FF6A4A', transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.y = 15; g.add(beam); const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.3, 40), new THREE.MeshBasicMaterial({ color: '#FF6A4A', transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .1; g.add(ring); g.userData.ring = ring; S.scene.add(g); S.wpObj = g;
    const sh = new THREE.Shape(); sh.moveTo(0, .9); sh.lineTo(.55, .1); sh.lineTo(.2, .1); sh.lineTo(.2, -.6); sh.lineTo(-.2, -.6); sh.lineTo(-.2, .1); sh.lineTo(-.55, .1); sh.closePath(); const ag = new THREE.ShapeGeometry(sh); ag.rotateX(Math.PI / 2); /* la punta mira a +Z, hacia donde apunta rotation.y = atan2(dx, dz) */ const ar = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: '#FFD25E', transparent: true, opacity: .9, depthWrite: false, side: THREE.DoubleSide })); const ap = new THREE.Group(); ar.scale.setScalar(1.5); ap.add(ar); ar.position.z = 0; S.scene.add(ap); S.wpArrow = ap; }
  S.wpObj.visible = S.wpArrow.visible = !!S.wp; if (S.wp) S.wpObj.position.set(S.wp.x, yAt(S.wp.x, S.wp.z), S.wp.z);
  let el = document.getElementById('v3wp'); if (!el) { el = document.createElement('div'); el.id = 'v3wp'; el.className = 'v3mis v3wp'; el.innerHTML = '<i><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3l7 16-7-4-7 4Z" fill="currentColor"/></svg></i><span></span><button aria-label="Quitar destino">✕</button>'; document.body.appendChild(el); el.querySelector('button').onclick = () => { S.wp = null; wpSync(); }; }
  el.hidden = !S.wp;
}
function wpTick(t) {
  if (!S || !S.wp || !S.wpArrow) return; const a = S.av.position, dx = S.wp.x - a.x, dz = S.wp.z - a.z, d = Math.hypot(dx, dz);
  if (d < 3) { G().toast('Llegaste a ' + S.wp.name + '.'); S.wp = null; wpSync(); return; }
  const ang = Math.atan2(dx, dz); S.wpArrow.position.set(a.x + Math.sin(ang) * 2.4, a.y + .12 + Math.sin(t * 4) * .03, a.z + Math.cos(ang) * 2.4); S.wpArrow.rotation.y = ang; S.wpArrow.children[0].material.opacity = .6 + Math.sin(t * 4) * .3;
  S.wpObj.userData.ring.scale.setScalar(1 + (t % 1.5) * .4); S.wpObj.userData.ring.material.opacity = .9 - (t % 1.5) * .5;
  const el = document.getElementById('v3wp'); if (el) { const C = S.yaw + S.camYaw, xs = dx * -Math.cos(C) + dz * Math.sin(C), ys = dx * Math.sin(C) + dz * Math.cos(C); el.firstChild.style.transform = `rotate(${Math.atan2(xs, ys)}rad)`; el.children[1].textContent = `${S.wp.name} · ${Math.round(d)} pasos`; }
}
/* mapa general */
function mapColors(hx) { return hx ? { bg: '#1A1610', land: ['#3E4A2A', '#4A4A2C', '#5A4C30'], path: 'rgba(233,195,122,.55)', ink: '#F1D7A2', ink2: '#A99C88', lock: 'rgba(8,6,4,.72)', water: '#3B6266' } : { bg: '#DCEFD0', land: ['#A9D98E', '#BFDC95', '#E2D4A0'], path: 'rgba(120,80,30,.55)', ink: '#22407F', ink2: '#5A6A8A', lock: 'rgba(30,40,70,.55)', water: '#7FC4F0' }; }
/* relieve del mapa: se calcula una vez por mundo (1 píxel = 1 metro) con el mismo terreno del 3D */
function nearestPathFast(x, z) { let d = 400; for (let i = 0; i < S.allPts.length; i += 3) { const p = S.allPts[i], q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } return Math.sqrt(d); }
/* ---------- mapa ilustrado: relieve real del mundo (sombreado de laderas), agua, caminos, casas y árboles; arrastrar para mover, rueda o pellizco para acercar ---------- */
const MAPT = { tiles: new Map(), q: [], hx: null };
function mapH(x, z) { const W = S.W; if (!W) return 0; return W.mtnH && Math.abs(x) > W.X1 ? W.mtnH(x, z) : W.hAt(x, z); }
function mapTile(L, tx, tz) {
  const k = L + ':' + tx + ':' + tz; let t = MAPT.tiles.get(k); if (t) return t;
  const N = 256, ppm = Math.pow(2, L) * .5, m = 1 / ppm, x0 = tx * N * m, z0 = tz * N * m, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), im = c.createImageData(N, N), D = im.data, hx = S.hx, W = S.W;
  const G = N + 2, H = new Float32Array(G * G); for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) H[j * G + i] = mapH(x0 + (i - 1 + .5) * m, z0 - (j - 1 + .5) * m);
  const C = hx ? { g1: [86, 104, 52], g2: [118, 120, 62], dry: [164, 146, 96], rock: [140, 132, 120], hi: [196, 188, 174], sand: [176, 152, 112], wet: [128, 112, 84], road: [196, 164, 116], w1: [36, 92, 110], w2: [70, 132, 140] } : { g1: [140, 200, 110], g2: [176, 214, 128], dry: [226, 208, 150], rock: [196, 188, 172], hi: [232, 226, 214], sand: [238, 216, 168], wet: [204, 178, 132], road: [242, 220, 168], w1: [70, 150, 214], w2: [130, 200, 236] };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], Lx = -.55, Ly = .62, Lz = -.56;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const wx = x0 + (i + .5) * m, wz = z0 - (j + .5) * m, h = H[(j + 1) * G + i + 1], dx = (H[(j + 1) * G + i + 2] - H[(j + 1) * G + i]) / (2 * m), dz = (H[j * G + i + 1] - H[(j + 2) * G + i + 1]) / (2 * m);
    const nl = Math.hypot(dx, 1, dz), sl = Math.hypot(dx, dz), sh = Math.max(0, (-dx * Lx + Ly - dz * Lz) / nl), lit = .5 + sh * .72;
    let c3 = mix(C.g1, C.g2, vnoise(wx * .06, wz * .06)); c3 = mix(c3, C.dry, sstep(.55, .85, vnoise(wx * .03 + 7, wz * .03)) * .6); c3 = mix(c3, C.rock, Math.max(sstep(.45, 1, sl), sstep(14, 30, h) * .8)); c3 = mix(c3, C.hi, sstep(34, 60, h) * .8);
    const wet = waterWet(wx, wz, null); c3 = mix(c3, C.wet, wet * .7);
    let r = c3[0] * lit, g = c3[1] * lit, b = c3[2] * lit;
    let wl = null; for (const B of WATER.basins) if (Math.hypot(wx - B.x, wz - B.z) < B.r * 1.25) wl = WATER.WL; if (wl == null && WATER.river && h < WATER.RL + .05 && wet > .3) wl = WATER.RL;
    if (wl != null && h < wl) { const dp = Math.min(1, (wl - h) / 1.4), wc = mix(C.w2, C.w1, dp), sp = .92 + vnoise(wx * .5, wz * .5) * .12 + sh * .08; r = wc[0] * sp; g = wc[1] * sp; b = wc[2] * sp; if (dp < .12) { const f = (1 - dp / .12) * .5; r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } }
    const n = .95 + hsh(Math.floor(wx * 3), Math.floor(wz * 3)) * .08, k = (j * N + i) * 4; D[k] = r * n; D[k + 1] = g * n; D[k + 2] = b * n; D[k + 3] = 255; }
  c.putImageData(im, 0, 0); t = { cv, x0, z0, size: N * m }; MAPT.tiles.set(k, t); if (MAPT.tiles.size > 260) MAPT.tiles.delete(MAPT.tiles.keys().next().value); return t;
}
function mapExt() { const g = G(); let zTop = 30, zBot = 0; for (const id in S.markers) zBot = Math.min(zBot, S.markers[id].position.z); return { x0: -(XB + 110), x1: XB + 110, zTop, zBot: zBot - 30, g }; }
function drawMap(cv) {
  const g = G(), p = g.P(), hx = S.hx, C = mapColors(hx), dpr = Math.min(2, devicePixelRatio || 1), sc = cv.parentElement, cw = sc.clientWidth, ch = sc.clientHeight, E = mapExt();
  if (MAPT.hx !== hx) { MAPT.tiles.clear(); MAPT.hx = hx; }
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; }
  const V = S.mapV || (S.mapV = { cx: S.av.position.x, cz: S.av.position.z, s: cw / (E.x1 - E.x0) * 1.6 }); V.s = Math.max(cw / (E.x1 - E.x0) * .9, Math.min(14, V.s));
  const X = wx => cw / 2 + (wx - V.cx) * V.s, Y = wz => ch / 2 - (wz - V.cz) * V.s; cv._toWorld = (px, py) => [V.cx + (px - cw / 2) / V.s, V.cz - (py - ch / 2) / V.s]; cv._X = X; cv._Y = Y;
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = hx ? '#0E0C08' : '#CFE3F2'; x.fillRect(0, 0, cw, ch);
  // relieve en mosaicos al detalle justo para el zoom (nítido a cualquier escala)
  const want = V.s * dpr, L = Math.max(0, Math.min(4, Math.ceil(Math.log2(want / .5)))), ppm = Math.pow(2, L) * .5, Tm = 256 / ppm;
  const wx0 = Math.max(E.x0, V.cx - cw / 2 / V.s), wx1 = Math.min(E.x1, V.cx + cw / 2 / V.s), wzT = Math.min(E.zTop, V.cz + ch / 2 / V.s), wzB = Math.max(E.zBot, V.cz - ch / 2 / V.s);
  let made = 0, pend = false; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  for (let tz = Math.ceil(wzT / Tm); tz * Tm > wzB - Tm; tz--) for (let tx = Math.floor(wx0 / Tm); tx * Tm < wx1; tx++) {
    const k = L + ':' + tx + ':' + tz; let t = MAPT.tiles.get(k);
    if (!t && made < 6) { t = mapTile(L, tx, tz); made++; }
    if (t) x.drawImage(t.cv, X(t.x0), Y(t.z0), t.size * V.s + .5, t.size * V.s + .5);
    else { pend = true; const L2 = Math.max(0, L - 2), T2 = 256 / (Math.pow(2, L2) * .5), t2 = MAPT.tiles.get(L2 + ':' + Math.floor(tx * Tm / T2) + ':' + Math.ceil(tz * Tm / T2)) || mapTile(L2, Math.floor(tx * Tm / T2), Math.ceil(tz * Tm / T2)); x.drawImage(t2.cv, X(t2.x0), Y(t2.z0), t2.size * V.s + .5, t2.size * V.s + .5); } }
  if (pend) { cancelAnimationFrame(cv._raf); cv._raf = requestAnimationFrame(() => drawMap(cv)); }
  // casas (techos con sombra) y árboles (copas con sombra)
  if (V.s > .9) { x.fillStyle = 'rgba(0,0,0,.28)'; (S.cols || []).forEach(c => { if (c.x1 - c.x0 > 1.2 && c.z1 - c.z0 > 1.2) x.fillRect(X(c.x0) + 2, Y(c.z1) + 2, (c.x1 - c.x0) * V.s, (c.z1 - c.z0) * V.s); });
    x.fillStyle = hx ? '#B79A72' : '#E8CFA4'; x.strokeStyle = hx ? '#5A4630' : '#9A7A52'; x.lineWidth = 1; (S.cols || []).forEach(c => { if (c.x1 - c.x0 > 1.2 && c.z1 - c.z0 > 1.2) { x.fillRect(X(c.x0), Y(c.z1), (c.x1 - c.x0) * V.s, (c.z1 - c.z0) * V.s); x.strokeRect(X(c.x0), Y(c.z1), (c.x1 - c.x0) * V.s, (c.z1 - c.z0) * V.s); } }); }
  if (V.s > 1.4) { const trees = (FLORA.olive || []).map(o => [o.x, o.z, 1.6 * o.s]); for (const B of (PH.bands || [])) if (/tree|jacaranda/.test(B.id)) B.list.forEach(it => trees.push([it.x, it.z, 2.4 * (it.s || 1)]));
    trees.forEach(([tx, tz, r]) => { const px = X(tx), py = Y(tz); if (px < -20 || py < -20 || px > cw + 20 || py > ch + 20) return; x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(px + r * V.s * .35, py + r * V.s * .35, r * V.s, 0, 7); x.fill(); x.fillStyle = hx ? '#3A4E26' : '#5E9A48'; x.beginPath(); x.arc(px, py, r * V.s, 0, 7); x.fill(); x.fillStyle = hx ? 'rgba(140,160,90,.35)' : 'rgba(200,240,150,.45)'; x.beginPath(); x.arc(px - r * V.s * .3, py - r * V.s * .3, r * V.s * .45, 0, 7); x.fill(); }); }
  // camino completo entre lugares
  x.lineCap = 'round'; x.lineJoin = 'round'; [[Math.max(3, 3.4 * V.s), hx ? 'rgba(60,44,26,.7)' : 'rgba(150,110,60,.6)'], [Math.max(1.8, 2.4 * V.s), hx ? '#C9A46E' : '#F4DFAE']].forEach(([w, col]) => { x.strokeStyle = col; x.lineWidth = w; for (const k in S.edgePts) { const pts = S.edgePts[k]; x.beginPath(); pts.forEach((pt, i) => i ? x.lineTo(X(pt[0]), Y(pt[1])) : x.moveTo(X(pt[0]), Y(pt[1]))); x.stroke(); } });
  // etapas
  g.REGIONS.forEach((Rg, r) => { const [a] = regionZ(g, r), top = r === 0 ? E.zTop : (a + regionZ(g, r - 1)[1]) / 2, y = Y(top); if (y < -50 || y > ch + 10) return; if (r) { x.strokeStyle = hx ? 'rgba(241,215,162,.45)' : 'rgba(34,64,127,.35)'; x.setLineDash([10, 8]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, y); x.lineTo(cw, y); x.stroke(); x.setLineDash([]); }
    x.fillStyle = hx ? 'rgba(14,12,8,.72)' : 'rgba(255,255,255,.82)'; x.beginPath(); x.roundRect(8, y + 6, 220, 42, 10); x.fill(); x.fillStyle = C.ink2; x.font = '900 10px Nunito, sans-serif'; x.fillText('ETAPA ' + (r + 1) + (regionOpen(r) ? '' : ' · 🔒'), 16, y + 20); x.fillStyle = C.ink; x.font = `700 16px ${hx ? 'Cinzel, Georgia' : 'Fraunces, Georgia'}, serif`; x.fillText(Rg.name, 16, y + 40); });
  const label = (t, px, py, big) => { x.font = (big ? '800 13px' : '800 11px') + ' Nunito, sans-serif'; x.textAlign = 'center'; x.lineWidth = 3.5; x.strokeStyle = hx ? 'rgba(10,8,4,.9)' : 'rgba(255,255,255,.95)'; x.strokeText(t, px, py); x.fillStyle = C.ink; x.fillText(t, px, py); x.textAlign = 'left'; };
  // lugares
  for (const q of S.pois || []) { const open = regionOpen(q.r), qx = q.k === 'river' ? q.pts[Math.floor(q.pts.length / 2)][0] : q.x, px = X(qx), py = Y(q.z); x.globalAlpha = open ? 1 : .5; x.fillStyle = hx ? '#E9C37A' : '#FF9636'; x.strokeStyle = hx ? '#1A1610' : '#FFFFFF'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py - 8); x.lineTo(px + 7, py); x.lineTo(px, py + 8); x.lineTo(px - 7, py); x.closePath(); x.fill(); x.stroke(); label(q.name, px, py + 21, true); x.globalAlpha = 1; }
  // paradas de cada etapa
  for (const id in S.markers) { const m = S.markers[id], n = g.NODES[id], done = n.kind === 'ch' && g.isDone(id), reach = g.reachable(id), px = X(m.position.x), py = Y(m.position.z); x.fillStyle = done ? '#3FBF7F' : reach ? (hx ? '#FFD873' : '#FFC23D') : 'rgba(140,138,132,.8)'; x.strokeStyle = hx ? '#1A1610' : '#FFFFFF'; x.lineWidth = 2.5; x.beginPath(); x.arc(px, py, 6.5, 0, 7); x.fill(); x.stroke(); if (V.s > 2.2 && n.label) label(n.label, px, py - 11); }
  { const ai = nodeActive(), am = ai && S.markers[ai]; if (am) { const px = X(am.position.x), py = Y(am.position.z), k = .5 + .5 * Math.sin(performance.now() / 260); x.strokeStyle = '#FF7A3D'; x.lineWidth = 3; x.beginPath(); x.arc(px, py, 12 + k * 4, 0, 7); x.stroke(); } }
  // misiones
  if (S.mis) for (const id in S.mis) { const m = S.mis[id]; if (p.missions && p.missions[id] || !regionOpen(m.d.r) || (p.mact && p.mact.id === id)) continue; const px = X(m.gp[0]), py = Y(m.gp[1]); x.fillStyle = '#FFD25E'; x.strokeStyle = '#5A3608'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 8, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#5A3608'; x.font = '900 12px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('!', px, py + 4); x.textAlign = 'left'; }
  if (S.sv && S.sv.bag) { const b = S.sv.bag, px = X(b.x), py = Y(b.z); x.fillStyle = '#FF6A4A'; x.strokeStyle = '#3A0E06'; x.lineWidth = 2.5; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); x.stroke(); x.font = '900 11px Nunito, sans-serif'; x.textAlign = 'center'; x.fillStyle = '#FFF'; x.fillText('🎒', px, py + 4); x.textAlign = 'left'; label('Tu bolsa', px, py - 13); }
  if (S.hx && SEC.list.length) { const sp = secP(); SEC.list.forEach(e => { if (!sp.secrets[e.d.id]) return; const px = X(e.x), py = Y(e.z); x.fillStyle = '#B98AFF'; x.strokeStyle = '#2A1A3A'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#FFF'; x.font = '900 10px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('✦', px, py + 3.5); x.textAlign = 'left'; if (V.s > 2.2) label(e.d.name, px, py - 11); }); }
  if (S.hx && VIL.list.length) VIL.list.forEach(v => { const px = X(v.x), py = Y(v.z) + 16, st = repStars(v.name); x.font = '900 11px Nunito, sans-serif'; x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.6)'; const t = '★'.repeat(st) + '☆'.repeat(5 - st); x.strokeText(t, px, py); x.fillStyle = '#FFD25E'; x.fillText(t, px, py); x.textAlign = 'left'; });
  if (p.mact && S.mis && S.mis[p.mact.id]) { const m = S.mis[p.mact.id], d = m.d, goal = d.kind === 'deliver' ? m.tp : (p.mact.has ? m.gp : m.pp); x.strokeStyle = '#FFD25E'; x.lineWidth = 3; x.beginPath(); x.arc(X(goal[0]), Y(goal[1]), 11, 0, 7); x.stroke(); x.fillStyle = '#FFD25E'; x.beginPath(); x.arc(X(goal[0]), Y(goal[1]), 4, 0, 7); x.fill(); }
  { const sv = p.surv; x.font = '18px sans-serif'; x.textAlign = 'center'; if (sv && sv.house) x.fillText('🏠', X(sv.house.x), Y(sv.house.z) + 6); if (sv && sv.bag) x.fillText('🎒', X(sv.bag.x), Y(sv.bag.z) + 6); x.textAlign = 'left'; }
  // vos
  const a = S.av.position, px = X(a.x), py = Y(a.z); x.save(); x.translate(px, py); x.rotate(S.yaw); x.fillStyle = 'rgba(255,255,255,.3)'; x.beginPath(); x.arc(0, 0, 16, 0, 7); x.fill(); x.fillStyle = hx ? '#FFFFFF' : '#2E4CB0'; x.strokeStyle = hx ? '#1A1610' : '#FFFFFF'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 9); x.lineTo(0, 4); x.lineTo(-9, 9); x.closePath(); x.fill(); x.stroke(); x.restore(); label('Estás acá', px, py + 30, true);
  if (S.wp) { const wx = X(S.wp.x), wy = Y(S.wp.z); x.fillStyle = '#E8473B'; x.beginPath(); x.arc(wx, wy - 16, 9, Math.PI * .85, Math.PI * .15); x.lineTo(wx, wy); x.closePath(); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(wx, wy - 16, 3.5, 0, 7); x.fill(); }
  // escala
  { const m = [10, 25, 50, 100, 250, 500].find(v => v * V.s > 70) || 500, w = m * V.s; x.fillStyle = hx ? 'rgba(14,12,8,.7)' : 'rgba(255,255,255,.85)'; x.fillRect(cw - w - 22, ch - 30, w + 14, 22); x.fillStyle = C.ink; x.fillRect(cw - w - 15, ch - 14, w, 3); x.font = '800 10px Nunito, sans-serif'; x.fillText(m + ' m', cw - w - 15, ch - 18); }
}
function mapZoom(f, px, py) { const cv = document.querySelector('#v3map canvas'); if (!cv || !S.mapV) return; const sc = cv.parentElement, cw = sc.clientWidth, ch = sc.clientHeight; px = px ?? cw / 2; py = py ?? ch / 2; const [wx, wz] = cv._toWorld(px, py); S.mapV.s *= f; drawMap(cv); const [wx2, wz2] = cv._toWorld(px, py); S.mapV.cx += wx - wx2; S.mapV.cz += wz - wz2; drawMap(cv); }
function openMap() {
  let ov = document.getElementById('v3map');
  if (!ov) { ov = document.createElement('div'); ov.id = 'v3map'; ov.className = 'v3map'; ov.innerHTML = '<div class="v3map-in"><div class="v3map-h"><b>Mapa</b><span>Arrastrá para moverte · rueda o pellizco para acercar · tocá un lugar para ir</span><div class="v3map-zz"><button class="v3map-z" data-z="in" aria-label="Acercar">＋</button><button class="v3map-z" data-z="out" aria-label="Alejar">－</button><button class="v3map-z" data-z="me" aria-label="Centrar en mí">◎</button></div><button class="bag-x" aria-label="Cerrar mapa">✕</button></div><div class="v3map-sc"><canvas></canvas></div><div class="v3map-f"><span><i class="k4"></i>Vos</span><span><i class="k1"></i>Paradas</span><span><i class="k2"></i>Misiones</span><span><i class="k3"></i>Lugares</span><span><i class="k5"></i>Camino</span><span><i class="k6"></i>Agua</span><button class="v3map-classic">Vista clásica</button></div></div>'; document.body.appendChild(ov);
    ov.querySelector('.bag-x').onclick = () => { ov.hidden = true; }; ov.onclick = e => { if (e.target === ov) ov.hidden = true; }; ov.querySelector('.v3map-classic').onclick = () => { ov.hidden = true; show3d(false); };
    ov.querySelectorAll('.v3map-z').forEach(b => b.onclick = () => { const z = b.dataset.z; if (z === 'me') { S.mapV.cx = S.av.position.x; S.mapV.cz = S.av.position.z; drawMap(ov.querySelector('canvas')); } else mapZoom(z === 'in' ? 1.6 : 1 / 1.6); });
    const cvm = ov.querySelector('canvas'), P = new Map(); let moved = 0, pinch = 0;
    cvm.onwheel = e => { e.preventDefault(); const r = cvm.getBoundingClientRect(); mapZoom(Math.exp(-e.deltaY * .0015), e.clientX - r.left, e.clientY - r.top); };
    cvm.onpointerdown = e => { cvm.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (P.size === 2) { const [a, b] = [...P.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
    cvm.onpointermove = e => { if (!P.has(e.pointerId)) return; const o = P.get(e.pointerId), dx = e.clientX - o[0], dy = e.clientY - o[1]; P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = cvm.getBoundingClientRect(); if (pinch) mapZoom(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch = d; moved = 99; return; }
      moved += Math.abs(dx) + Math.abs(dy); S.mapV.cx -= dx / S.mapV.s; S.mapV.cz += dy / S.mapV.s; cancelAnimationFrame(cvm._mv); cvm._mv = requestAnimationFrame(() => drawMap(cvm)); };
    cvm.onpointerup = cvm.onpointercancel = e => { const had = P.has(e.pointerId); P.delete(e.pointerId); if (P.size < 2) pinch = 0; if (!had || moved > 8 || e.type === 'pointercancel') return;
      const r = cvm.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let [wx, wz] = cvm._toWorld(px, py), name = 'Destino marcado', bd = 22 * 22;
      const cand = []; (S.pois || []).forEach(q => cand.push([q.k === 'river' ? q.pts[Math.floor(q.pts.length / 2)][0] : q.x, q.z, q.name])); for (const id in S.markers) cand.push([S.markers[id].position.x, S.markers[id].position.z, G().NODES[id].label]); for (const id in (S.mis || {})) cand.push([S.mis[id].gp[0], S.mis[id].gp[1], S.mis[id].d.giver.name]);
      cand.forEach(([cx, cz, n]) => { const d = (cvm._X(cx) - px) ** 2 + (cvm._Y(cz) - py) ** 2; if (d < bd) { bd = d; wx = cx; wz = cz; name = n; } });
      if (S.wp && Math.hypot(S.wp.x - wx, S.wp.z - wz) < 3) { S.wp = null; drawMap(cvm); wpSync(); return; }
      S.wp = { x: wx, z: wz, name }; wpSync(); drawMap(cvm); setTimeout(() => { ov.hidden = true; }, 450); G().toast('Destino: ' + name + '. Seguí la flecha.'); };
    addEventListener('resize', () => { if (!ov.hidden) drawMap(cvm); }); }
  ov.classList.toggle('hx', !!S.hx); ov.hidden = false; S.mapV = null; requestAnimationFrame(() => drawMap(ov.querySelector('canvas')));
}

/* ---------- movimientos: saltar, orar y saludar ---------- */
function doJump() { if (!S || S.walking || sheetUp()) return; if (S.pose === 'pray') { S.pose = null; return; } if (S.jy <= .01 && S.sv && S.hx) { AXS.jumps = (AXS.jumps || 0) + 1; if (AXS.jumps % 5 === 0) axGain('agi', 1); } if (S.jy > .01) return; S.jv = 6.2 * Math.sqrt(agiMul()); S.jy = .001; wake(); }
function doPray() { if (!S || S.walking || sheetUp()) return; poseEnd(); S.pose = S.pose === 'pray' ? null : 'pray'; S.prayT = 0; S.joy.x = 0; S.joy.y = 0; wake(); actUI(); }
function doSit() { if (!S || S.walking || sheetUp() || !S.hx) return; poseEnd(); if (S.pose === 'pray') S.pose = null; S.sit = !S.sit; S.joy.x = 0; S.joy.y = 0; wake(); actUI(); }
function doWave() { if (!S || S.walking || sheetUp()) return; if (S.pose === 'pray') S.pose = null; S.waveT = 2.2; wake(); actUI(); }
function actUI() { const b = document.querySelector('#v3acts [data-a="pray"]'); if (b) b.classList.toggle('on', S && S.pose === 'pray'); const bs = document.querySelector('#v3acts [data-a="sit"]'); if (bs) { bs.classList.toggle('on', !!(S && S.sit)); bs.hidden = !(S && S.hx); } document.body.classList.toggle('v3pray', !!(S && S.pose === 'pray')); }
function wireActs() {
  let box = document.getElementById('v3acts');
  if (!box) { box = document.createElement('div'); box.id = 'v3acts'; box.className = 'v3acts';
    box.innerHTML = '<button data-a="jump" aria-label="Saltar" title="Saltar (barra espaciadora)"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 4l7 7h-4v6H9v-6H5Z" fill="currentColor"/><path d="M6 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button data-a="pray" aria-label="Arrodillarse a orar" title="Orar (tecla O)">🙏</button><button data-a="wave" aria-label="Saludar" title="Saludar (tecla H)">👋</button><button data-a="glow" aria-label="Resplandor" title="Resplandor (tecla P)">🌟</button><button data-a="room" aria-label="Jugar con amigos" title="Jugar con amigos">👥</button><button data-a="help" aria-label="Cómo se juega" title="Cómo se juega">❔</button>';
    document.body.appendChild(box); box.querySelectorAll('button').forEach(b => b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); ({ jump: doJump, pray: doPray, wave: doWave, sit: doSit, glow: () => S && (S.hx ? poseMenu() : kidsShine()), room: mpPanel, help: () => tutOpen(true) })[b.dataset.a](); }); }
  addEventListener('keydown', e => { if (!S || document.getElementById('view3d').hidden || e.repeat || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return; const k = e.key.toLowerCase(); if (k === ' ') { e.preventDefault(); doJump(); } else if (k === 'o') doPray(); else if (k === 'h') doWave(); else if (k === 't' && MP.code) talkStart(); else if (k === 'e') axHold(true); else if (k === 'c') svEat(); else if (k === 'b') svCraft(); else if (k === 'p' && S) (S.hx ? poseMenu() : kidsShine()); });
  addEventListener('keyup', e => { if ((e.key || '').toLowerCase() === 't') talkStop(); }); addEventListener('blur', () => talkStop());
}
function lerpR(o, k, v, w) { o[k] += (v - o[k]) * w; }
function applyPose(av, t, dt, st) {
  st = st || S;
  const u = av.userData, w = Math.min(1, dt * 7); st.poseW = (st.poseW || 0) + (((st.pose === 'pray') ? 1 : 0) - (st.poseW || 0)) * w; st.waveW = (st.waveW || 0) + (((st.waveT || 0) > 0 ? 1 : 0) - (st.waveW || 0)) * Math.min(1, dt * 9);
  if (st.waveT > 0) st.waveT -= dt;
  const air = st.jy > .02 ? 1 : 0, p = st.poseW, q = st.waveW;
  if (u.h3) { h3pose(av, t, dt, st); if (st.pose === 'pray') st.prayT = (st.prayT || 0) + dt; return; }
  if (u.hero) {
    if (air) { lerpR(u.L.top.rotation, 'x', -.55, .3); lerpR(u.R.top.rotation, 'x', -.2, .3); lerpR(u.L.knee.rotation, 'x', 1.0, .3); lerpR(u.R.knee.rotation, 'x', .6, .3); lerpR(u.AL.sh.rotation, 'x', -.6, .3); lerpR(u.AR.sh.rotation, 'x', -.5, .3); }
    if (p > .01) { const hy = .5 * u.k + .05; u.hip.position.y += (hy - u.hip.position.y) * p; ['L', 'R'].forEach(s => { lerpR(u[s].top.rotation, 'x', -.12, p); lerpR(u[s].knee.rotation, 'x', 1.5, p); });
      lerpR(u.AL.sh.rotation, 'x', -.85, p); lerpR(u.AR.sh.rotation, 'x', -.85, p); lerpR(u.AL.sh.rotation, 'z', .38, p); lerpR(u.AR.sh.rotation, 'z', -.38, p); lerpR(u.AL.el.rotation, 'x', -1.35, p); lerpR(u.AR.el.rotation, 'x', -1.35, p); lerpR(u.head.rotation, 'x', .38, p); lerpR(u.head.rotation, 'y', 0, p); lerpR(u.chest.rotation, 'x', .12, p); }
    if (q > .01) { lerpR(u.AR.sh.rotation, 'z', 2.55, q); lerpR(u.AR.sh.rotation, 'x', -.15, q); u.AR.el.rotation.x += ((-.35 + Math.sin(t * 11) * .45) - u.AR.el.rotation.x) * q; lerpR(u.head.rotation, 'y', 0, q); }
  } else {
    if (air) { lerpR(u.L.rotation, 'x', -.5, .3); lerpR(u.R.rotation, 'x', -.2, .3); }
    if (p > .01) { const hy = .78 * u.k * .55; u.hip.position.y += (hy - u.hip.position.y) * p; lerpR(u.L.rotation, 'x', 1.45, p); lerpR(u.R.rotation, 'x', 1.45, p); lerpR(u.AL.rotation, 'x', -1.25, p); lerpR(u.AR.rotation, 'x', -1.25, p); lerpR(u.AL.rotation, 'z', .3, p); lerpR(u.AR.rotation, 'z', -.3, p); lerpR(u.head.rotation, 'x', .3, p); }
    else { u.AL.rotation.z *= .8; u.head.rotation.x *= .8; if (q < .01) u.AR.rotation.z *= .8; }
    if (q > .01) { u.AR.rotation.z += ((2.6 + Math.sin(t * 12) * .3) - u.AR.rotation.z) * q; lerpR(u.AR.rotation, 'x', 0, q); }
  }
  if (st.pose === 'pray') st.prayT = (st.prayT || 0) + dt;
}

/* ---------- música y voz ---------- */
const VERSOS = {
  paz: { name: 'Paz', v: [
    ['Les dejo un regalo: paz en la mente y en el corazón. Y la paz que yo doy es un regalo que el mundo no puede dar. Así que no se angustien ni tengan miedo.', 'Juan 14:27'],
    ['No se preocupen por nada; en cambio, oren por todo. Díganle a Dios lo que necesitan y denle gracias por todo lo que él ha hecho. Así experimentarán la paz de Dios, que supera todo lo que podemos entender. La paz de Dios cuidará su corazón y su mente mientras vivan en Cristo Jesús.', 'Filipenses 4:6-7'],
    ['¡Tú guardarás en perfecta paz a todos los que confían en ti; a todos los que concentran en ti sus pensamientos!', 'Isaías 26:3'],
    ['Vengan a mí todos los que están cansados y llevan cargas pesadas, y yo les daré descanso.', 'Mateo 11:28']] },
  fe: { name: 'Fe', v: [
    ['La fe es la confianza de que en verdad sucederá lo que esperamos; es lo que nos da la certeza de las cosas que no podemos ver.', 'Hebreos 11:1'],
    ['Confía en el SEÑOR con todo tu corazón; no dependas de tu propio entendimiento. Busca su voluntad en todo lo que hagas, y él te mostrará cuál camino tomar.', 'Proverbios 3:5-6'],
    ['Soy la sierva del Señor. Que se cumpla todo lo que has dicho acerca de mí.', 'Lucas 1:38']] },
  identidad: { name: 'Identidad', v: [
    ['Miren con cuánto amor nos ama nuestro Padre que nos llama sus hijos, ¡y eso es lo que somos! Pero la gente de este mundo no reconoce que somos hijos de Dios, porque no lo conocen a él.', '1 Juan 3:1'],
    ['Pues somos la obra maestra de Dios. Él nos creó de nuevo en Cristo Jesús, a fin de que hagamos las cosas buenas que preparó para nosotros tiempo atrás.', 'Efesios 2:10'],
    ['¡Gracias por hacerme tan maravillosamente complejo! Tu fino trabajo es maravilloso, lo sé muy bien.', 'Salmo 139:14']] },
  valentia: { name: 'Valentía', v: [
    ['Mi mandato es: “¡Sé fuerte y valiente! No tengas miedo ni te desanimes, porque el Señor tu Dios está contigo dondequiera que vayas”.', 'Josué 1:9'],
    ['No tengas miedo, porque yo estoy contigo; no te desalientes, porque yo soy tu Dios. Te daré fuerzas y te ayudaré; te sostendré con mi mano derecha victoriosa.', 'Isaías 41:10'],
    ['No tengan miedo. Les traigo buenas noticias que darán gran alegría a toda la gente.', 'Lucas 2:10']] },
  amor: { name: 'Amor de Dios', v: [
    ['Pues Dios amó tanto al mundo que dio a su único Hijo, para que todo el que crea en él no se pierda, sino que tenga vida eterna.', 'Juan 3:16'],
    ['Pues el SEÑOR tu Dios vive en medio de ti. Él es un poderoso salvador. Se deleitará en ti con alegría. Con su amor calmará todos tus temores. Se gozará por ti con cantos de alegría.', 'Sofonías 3:17'],
    ['Este es mi Hijo amado, quien me da un gran gozo.', 'Mateo 3:17']] }
};
const PASO = [['Jesús crecía en sabiduría y en estatura, y en el favor de Dios y de toda la gente.', 'Lucas 2:52'], ['¡Miren! ¡El Cordero de Dios, que quita el pecado del mundo!', 'Juan 1:29'], ['Soberano Señor, permite ahora que tu siervo muera en paz, como prometiste. He visto tu salvación.', 'Lucas 2:29-30']];
const pref2 = (k, v) => { try { if (v === undefined) return localStorage.getItem('tsp:' + k); localStorage.setItem('tsp:' + k, v); } catch (e) { return null; } };
const AU = { ctx: null, on: pref2('music') !== '0', voice: pref2('voice') !== '0', topic: pref2('topic') || 'paz' };
/* instrumentos reales (muestras grabadas) servidos desde jsDelivr: orquesta para la aventura, piano para la oración */
const SMP = {
  piano: ['piano', '1.1.2', ['C2', 'E2', 'Gs2', 'C3', 'E3', 'Gs3', 'C4', 'E4', 'Gs4', 'C5', 'E5', 'Gs5', 'C6']],
  harp: ['harp', '1.1.1', ['C3', 'E3', 'G3', 'B3', 'D4', 'F4', 'A4', 'C5', 'E5', 'G5', 'B5', 'D6']],
  horn: ['french-horn', '1.1.2', ['A1', 'C2', 'Ds2', 'G2', 'D3', 'F3', 'A3', 'C4', 'D5', 'F5']],
  violin: ['violin', '1.1.1', ['G3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6', 'E6']],
  cello: ['cello', '1.1.1', ['C2', 'E2', 'Gs2', 'C3', 'E3', 'Gs3', 'C4', 'E4', 'Gs4', 'C5']],
  bass: ['contrabass', '1.1.2', ['Fs1', 'As1', 'D2', 'E2', 'Gs2', 'Cs3', 'E3']],
  flute: ['flute', '1.1.2', ['C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'C6', 'E6', 'A6']]
};
const nm = n => { const m = /^([A-G])(s?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0); };
function loadInst(k) {
  AU.bank = AU.bank || {}; if (AU.bank[k]) return; const [pkg, ver, notes] = SMP[k], set = AU.bank[k] = [];
  notes.forEach(n => fetch(`https://cdn.jsdelivr.net/npm/tonejs-instrument-${pkg}-mp3@${ver}/${n}.mp3`).then(r => r.arrayBuffer()).then(b => AU.ctx.decodeAudioData(b)).then(buf => { set.push({ m: nm(n), buf }); }).catch(() => {}));
}
function play(k, m, t, vol, dur, bus, rel) {
  const set = AU.bank && AU.bank[k]; if (!set || !set.length) return; let best = set[0]; for (const s of set) if (Math.abs(s.m - m) < Math.abs(best.m - m)) best = s;
  const c = AU.ctx, src = c.createBufferSource(), g = c.createGain(); src.buffer = best.buf; src.playbackRate.value = Math.pow(2, (m - best.m) / 12);
  const end = t + Math.min(dur, best.buf.duration / src.playbackRate.value);
  const rl = rel == null ? .6 : rel; g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, Math.max(t + .04, end - Math.min(.8, rl + .2))); g.gain.exponentialRampToValueAtTime(.0001, end + rl);
  src.connect(g); g.connect(bus); src.start(t); src.stop(end + rl + .1);
}
/* timbal sintetizado: golpe grave con cuerpo y parche */
function timp(m, t, vol) {
  const c = AU.ctx; while (m > 47) m -= 12; while (m < 36) m += 12; const f = 440 * Math.pow(2, (m - 69) / 12);
  [[1, 1], [1.5, .35], [1.98, .15]].forEach(([k, v]) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f * k * 1.06, t); o.frequency.exponentialRampToValueAtTime(f * k, t + .08); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (k === 1 ? 1.8 : .6)); o.connect(g); g.connect(AU.adv); o.start(t); o.stop(t + 1.9); });
  const n = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain(); n.buffer = AU.noise; nf.type = 'lowpass'; nf.frequency.value = 700; ng.gain.setValueAtTime(vol * .6, t); ng.gain.exponentialRampToValueAtTime(.0001, t + .22); n.connect(nf); nf.connect(ng); ng.connect(AU.adv); n.start(t); n.stop(t + .25);
}
/* música grabada: pistas largas en partes de 15 minutos, una sigue a la otra; al orar, otra pista con fundido */
const MUS = window.MUS_URLS || {
  // Hero, exploración: «The Road Beyond the Ruins» (elegida por Gui), en bucle con fundido de 3 s
  hero: [new URL('./music/hero_exploracion.mp3', import.meta.url).href],
  // Kids, exploración: «The Light Beyond the Crystals» (piano), en bucle con fundido de 3 s
  kids: [new URL('./music/kids_exploracion.mp3', import.meta.url).href],
  // Kids, minijuegos: «The Inn at the End of the Old Road» (cortada a 3:12 con fundido); Hero mantiene su música hasta que Gui elija
  kidsMg: [new URL('./music/kids_minijuegos.mp3', import.meta.url).href],
  orar: ['https://music.wixstatic.com/mp3/43ca3b_538f7365d7e248f1bf574404060d1d65.mp3', 'https://music.wixstatic.com/mp3/43ca3b_b29f4283091e41ebb259f0338ad83024.mp3', 'https://music.wixstatic.com/mp3/43ca3b_0ec4648425c24a579ef24a9a0b7caa81.mp3', 'https://music.wixstatic.com/mp3/43ca3b_c88f06c8392149c2a87c327e80823a50.mp3']
};
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// en iOS el volumen de un <audio> no se puede cambiar desde el código: la música pasa por el mismo AudioContext del ambiente
// (un nodo de ganancia por pista), así el deslizador y los fundidos funcionan y todo se desbloquea con el mismo toque
function auEl(url) { const a = new Audio(); if (IOS) a.crossOrigin = 'anonymous'; a.preload = 'auto'; if (url) a.src = url; return a; }
function auVol(el, v) { if (!el) return; v = Math.max(0, Math.min(1, v)); if (IOS && AU.ctx) { if (!el._g) { try { const s = AU.ctx.createMediaElementSource(el), g = AU.ctx.createGain(); s.connect(g); g.connect(AU.ctx.destination); el._g = g; } catch (e) { el._g = { bad: 1 }; } } if (!el._g.bad) { el._g.gain.value = v; return; } } try { el.volume = v; } catch (e) {} }
// pista única en bucle sin cortes: dos reproductores que se cruzan 3 s antes del final
function musLoop(url) {
  const mk = () => { const a = auEl(url); auVol(a, 0); return a; };
  const t = { list: [url], loop: true, a: mk(), b: null, cur: 'a', xf: false, v: 0, ok: true, primed: false, get el() { return this[this.cur]; } };
  t.a.onerror = () => { t.ok = false; }; return t;
}
function musLoopTick(t) {
  const A = t.el, o = t.cur === 'a' ? 'b' : 'a', v = Math.max(0, Math.min(1, t.v * mixV('mus'))), now = performance.now();
  if (!t.xf && A.duration && !A.paused && A.currentTime > A.duration - 3) { if (!t[o]) t[o] = auEl(t.list[0]); const B = t[o]; t.xf = true; t.x0 = now; try { B.currentTime = 0; } catch (e) {} auVol(B, 0); B.play().catch(() => {}); }
  if (t.xf) { const B = t[o], k = Math.min(1, (now - t.x0) / 3000); auVol(A, v * (1 - k)); auVol(B, v * k); if (k >= 1 || A.ended) { A.pause(); t.cur = o; t.xf = false; } }
  if (t.want <= 0 && t.v < .01) { const B = t[o]; if (B && !B.paused) B.pause(); }
}
function musTrack(list) {
  if (list.length === 1) return musLoop(list[0]);
  const t = { list, i: Math.floor(Math.random() * list.length), el: auEl(), v: 0, ok: true, primed: false }; auVol(t.el, 0);
  t.el.src = list[t.i]; t.el.onended = () => { t.i = (t.i + 1) % list.length; t.el.src = list[t.i]; t.el.play().catch(() => {}); };
  t.el.onerror = () => { t.err = (t.err || 0) + 1; if (t.err > 3) { t.ok = false; return; } t.i = (t.i + 1) % list.length; t.el.src = list[t.i]; };
  return t;
}
function musInit() {
  if (AU.mus || !MUS.orar.length) return; const br = S && S.hx ? 'hero' : 'kids'; if (!MUS[br].length) return;
  AU.mus = { br, adv: musTrack(MUS[br]), pray: musTrack(MUS.orar), mg: MUS.kidsMg && MUS.kidsMg.length ? musTrack(MUS.kidsMg) : null };
}
function musGesture() { // en un toque del usuario: habilita la reproducción (iPhone/Safari lo exigen)
  const m = AU.mus; if (!m) return;
  [m.adv, m.pray, m.mg].filter(Boolean).forEach(t => { if (t.primed) return; t.primed = true; if (t.loop && !t.b) { t.b = auEl(t.list[0]); auVol(t.b, 0); const q = t.b.play(); if (q) q.then(() => t.b.pause()).catch(() => {}); } const p = t.el.play(); if (p) p.then(() => { if (t.want <= 0) t.el.pause(); }).catch(() => { t.primed = false; }); });
}
function musTick() {
  const m = AU.mus; if (!m) return false; if (S && (S.hx ? 'hero' : 'kids') !== m.br) { m.adv.el.pause(); m.adv = musTrack(MUS[S.hx ? 'hero' : 'kids']); m.br = S.hx ? 'hero' : 'kids'; m.adv.primed = false; }
  if (!m.adv.ok && !m.pray.ok) return false;
  const arcOpen = !document.getElementById('arcade').hidden, shown = !document.getElementById('view3d').hidden && !arcOpen, pray = S && (S.pose === 'pray' || S.solemn === 2), on = AU.on && shown && !(S && S.solemn === 1), kidsMg = !!(m.mg && arcOpen && !(S && S.hx) && G().branch !== 'ados');
  m.adv.want = on && !pray ? (AU.speaking || AU.narr ? .22 : .55) : 0; m.pray.want = on && pray ? (AU.speaking || AU.narr ? .35 : .7) : 0; if (m.mg) m.mg.want = AU.on && kidsMg ? (AU.speaking || AU.narr ? .22 : .5) : 0;
  for (const t of [m.adv, m.pray, m.mg]) { if (!t) continue;
    if (!t.ok) continue; const step = t.want > t.v ? .045 : .07; t.v += Math.max(-step, Math.min(step, t.want - t.v));
    if (!t.xf) auVol(t.el, t.v * mixV('mus'));
    if (t.want > 0 && t.el.paused && t.primed) t.el.play().catch(() => {});
    if (t.want <= 0 && !t.el.paused && (t.v < .01 || IOS)) t.el.pause();
    if (t.loop) musLoopTick(t);
  }
  return true;
}
function auStart() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); musInit(); musGesture(); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = AU.ctx; AU.master = c.createGain(); AU.master.gain.value = 0; AU.master.connect(c.destination);
  const ir = c.createBuffer(2, c.sampleRate * 3.2, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
  AU.verb = c.createConvolver(); AU.verb.buffer = ir; const vg = c.createGain(); vg.gain.value = .42; AU.verb.connect(vg); vg.connect(AU.master);
  const warm = (gain, wet, cut) => { const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut || 6500; g.gain.value = 0; g.connect(lp); lp.connect(AU.master); const w = c.createGain(); w.gain.value = wet; lp.connect(w); w.connect(AU.verb); return g; };
  AU.adv = warm(0, .38); AU.soak = warm(0, .8, 2600);
  AU.noise = c.createBuffer(1, c.sampleRate * .3, c.sampleRate); { const d = AU.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  musInit(); musGesture(); if (!AU.mus) Object.keys(SMP).forEach(loadInst);
  AU.next = c.currentTime + .3; AU.step = 0; AU.snext = c.currentTime + .3; AU.sstep = 0;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  setInterval(auTick, 90);
}
/* ---------- mezcla en tres buses (Música, Ambiente, Efectos y voz) y paisaje sonoro ambiente.
   Todo el ambiente se sintetiza en el navegador (viento, agua, pájaros, grillos, murmullo, fuego, ovejas, pasos):
   no usa grabaciones de terceros, así que no hay licencias que cumplir (obra propia, CC0). ---------- */
const MIX = (() => { let m = { mus: .7, amb: .4, sfx: 1 }; try { Object.assign(m, JSON.parse(localStorage.getItem('tsp:mix') || '{}')); } catch (e) {} return m; })();
const mixV = k => Math.max(0, Math.min(1, +MIX[k] || 0));
function mixSet(k, v) { MIX[k] = Math.max(0, Math.min(1, v)); try { localStorage.setItem('tsp:mix', JSON.stringify(MIX)); } catch (e) {} }
window.TSP_MIX = { v: mixV, set: mixSet };
const SND = { on: false, t: 0, birdT: 1, crT: 0, fireT: 0, sheepT: 6, stepT: 0, side: 1 };
function sndInit() {
  const c = AU.ctx; if (!c || SND.on) return; SND.on = true;
  AU.amb = c.createGain(); AU.amb.gain.value = 0; AU.amb.connect(c.destination);
  AU.sfx = c.createGain(); AU.sfx.gain.value = mixV('sfx'); AU.sfx.connect(c.destination);
  const sr = c.sampleRate, len = sr * 4, pink = c.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) { const d = pink.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * .1848) * .2; }
    const f = sr * .25; for (let i = 0; i < f; i++) { const k = i / f; d[i] = d[i] * k + d[len - f + i] * (1 - k); } } // costura sin clic
  SND.pink = pink;
  const loop = (type, freq, q) => { const s = c.createBufferSource(); s.buffer = pink; s.loop = true; s.loopStart = .25; s.loopEnd = 4; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || .7; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AU.amb); s.start(c.currentTime + Math.random() * 2, Math.random() * 3); return { s, f, g }; };
  SND.wind = loop('bandpass', 420, .5); SND.wind2 = loop('lowpass', 180, .5);
  SND.water = loop('lowpass', 700, .9); SND.waterHi = loop('bandpass', 2400, 1.4);
  SND.crowd = loop('bandpass', 520, 1.8); SND.crowd2 = loop('bandpass', 1300, 2.2);
}
const sndClamp = v => Math.max(0, Math.min(1, v));
function sndPan(x, z) { // izquierda/derecha según dónde está la fuente respecto de la cámara
  const c = AU.ctx, p = c.createStereoPanner ? c.createStereoPanner() : c.createGain();
  if (p.pan && S && S.camera) { const dx = x - S.camera.position.x, dz = z - S.camera.position.z, cy = Math.atan2(dx, dz), fy = S.camera.rotation ? S.camera.rotation.y : 0; p.pan.value = Math.max(-.9, Math.min(.9, -Math.sin(cy - fy - Math.PI))); }
  return p;
}
function sndChirp(x, z, vol, kid) { // pájaro: 2-5 notas con barrido de frecuencia
  const c = AU.ctx, t0 = c.currentTime + .02, n = 2 + Math.floor(Math.random() * 4), base = (kid ? 2600 : 2100) + Math.random() * 1600, pn = sndPan(x, z); pn.connect(AU.amb);
  for (let i = 0; i < n; i++) { const t = t0 + i * (.09 + Math.random() * .07), o = c.createOscillator(), g = c.createGain(), up = Math.random() < .5; o.type = 'sine';
    o.frequency.setValueAtTime(base * (up ? .8 : 1.2), t); o.frequency.exponentialRampToValueAtTime(base * (up ? 1.25 : .75), t + .07);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + .08); o.connect(g); g.connect(pn); o.start(t); o.stop(t + .1); }
}
function sndCrickets(vol) { // grillo: tren de pulsos agudos
  const c = AU.ctx, t0 = c.currentTime + .02, o = c.createOscillator(), g = c.createGain(), pn = sndPan((S.av.position.x + (Math.random() - .5) * 30), S.av.position.z + (Math.random() - .5) * 30); o.type = 'square'; o.frequency.value = 4300 + Math.random() * 500;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4600; bp.Q.value = 6; g.gain.value = 0;
  for (let i = 0; i < 4; i++) { const t = t0 + i * .055; g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(0, t + .03); }
  o.connect(bp); bp.connect(g); g.connect(pn); pn.connect(AU.amb); o.start(t0); o.stop(t0 + .3);
}
function sndCrack(x, z, vol) { // chasquido de leña
  const c = AU.ctx, t = c.currentTime + .01, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), pn = sndPan(x, z); s.buffer = SND.pink; f.type = 'highpass'; f.frequency.value = 1200 + Math.random() * 2500;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03 + Math.random() * .05); s.connect(f); f.connect(g); g.connect(pn); pn.connect(AU.amb); s.start(t, Math.random() * 3, .1);
}
function sndBleat(x, z, vol) { // oveja: diente de sierra con vibrato y formante
  const c = AU.ctx, t = c.currentTime + .02, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), f = c.createBiquadFilter(), g = c.createGain(), pn = sndPan(x, z), b = 360 + Math.random() * 160, d = .5 + Math.random() * .4;
  o.type = 'sawtooth'; o.frequency.setValueAtTime(b, t); o.frequency.linearRampToValueAtTime(b * .86, t + d); lfo.frequency.value = 7 + Math.random() * 3; lg.gain.value = b * .045; lfo.connect(lg); lg.connect(o.frequency);
  f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.6; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .06); g.gain.setValueAtTime(vol, t + d - .12); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(f); f.connect(g); g.connect(pn); pn.connect(AU.amb); o.start(t); lfo.start(t); o.stop(t + d + .05); lfo.stop(t + d + .05);
}
function sndStep(vol, hard) { // pasos (bus de efectos): golpe grave + roce de tierra o piedra
  const c = AU.ctx, t = c.currentTime + .01, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = SND.pink; f.type = 'bandpass'; f.frequency.value = (hard ? 1800 : 650) * (.85 + Math.random() * .3); f.Q.value = .9;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + (hard ? .07 : .12)); s.connect(f); f.connect(g); g.connect(AU.sfx); s.start(t, Math.random() * 3, .16);
}
function sndUI(kind) { // sonidos de interfaz que pasan por el bus de efectos
  const c = AU.ctx; if (!c || !SND.on) return; const t = c.currentTime + .01, notes = kind === 'ok' ? [76, 83] : kind === 'gift' ? [72, 76, 79, 84] : [69];
  notes.forEach((m, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); g.gain.setValueAtTime(.0001, t + i * .07); g.gain.exponentialRampToValueAtTime(.14, t + i * .07 + .015); g.gain.exponentialRampToValueAtTime(.0001, t + i * .07 + .35); o.connect(g); g.connect(AU.sfx); o.start(t + i * .07); o.stop(t + i * .07 + .4); });
}
function sndDist(list, x, z, fr) { let d = 1e9, best = null; for (const p of list) { const q = Math.hypot(p.x - x, p.z - z) - (fr ? fr(p) : 0); if (q < d) { d = q; best = p; } } return [d, best]; }
function sndTick(dt) {
  const c = AU.ctx; if (!c) return; sndInit(); if (!S || !S.av) return;
  const now = c.currentTime, view = !document.getElementById('view3d').hidden, arc = !document.getElementById('arcade').hidden, cine = !!(typeof CINE !== 'undefined' && CINE && CINE.on);
  const duck = AU.speaking || AU.narr ? .45 : 1, pray = S.pose === 'pray' ? .6 : 1, a = S.av.position, hx = !!S.hx, dn = dayNow(), dawn = dn.i === 0 ? 1 - dn.k * .85 : dn.k * .15, dark = document.querySelector('.v3dark') ? 1 : 0;
  const busA = view && !arc ? mixV('amb') * duck * pray : 0;
  AU.amb.gain.setTargetAtTime(busA, now, busA > AU.amb.gain.value ? .9 : .25); AU.sfx.gain.setTargetAtTime(mixV('sfx'), now, .1);
  if (busA <= 0.001 && AU.amb.gain.value < .01) return;
  // viento: siempre, más fuerte en Hero y en lo alto; ráfagas lentas
  SND.t += dt; const gust = .55 + .45 * Math.sin(SND.t * .21) * Math.sin(SND.t * .037 + 1.3), alt = sndClamp((a.y || 0) / 12);
  SND.wind.g.gain.setTargetAtTime((hx ? .22 : .12) * gust * (1 + alt), now, .8); SND.wind.f.frequency.setTargetAtTime(300 + gust * 380 + alt * 300, now, 1.2); SND.wind2.g.gain.setTargetAtTime((hx ? .16 : .08) * (.6 + gust * .4), now, 1.2);
  // agua: orilla del lago, costas y río
  const W = (typeof WATER !== 'undefined' && WATER) || {}; let wd = 1e9; for (const b of W.basins || []) wd = Math.min(wd, Math.hypot(a.x - b.x, a.z - b.z) - b.r * 1.12); if (W.river) for (const q of W.river) wd = Math.min(wd, Math.hypot(a.x - q[0], a.z - q[1]) - 3);
  const wk = sndClamp(1 - Math.max(0, wd) / 26), lap = .65 + .35 * Math.sin(SND.t * 1.3) * Math.sin(SND.t * .53 + .7);
  SND.water.g.gain.setTargetAtTime(wk * .55 * lap, now, .35); SND.waterHi.g.gain.setTargetAtTime(wk * .09 * (1.2 - lap), now, .3);
  // murmullo de gente cerca de pueblos, plaza y templo
  const towns = (S.pois || []).filter(p => p.k === 'village' || p.k === 'temple' || p.k === 'vil' || p.k === 'shop'); const [td] = sndDist(towns.length ? towns : [{ x: 1e6, z: 1e6 }], a.x, a.z);
  const ck = sndClamp(1 - Math.max(0, td - 10) / 32) * (1 - dark), mur = .6 + .4 * Math.sin(SND.t * .9) * Math.sin(SND.t * 2.3);
  SND.crowd.g.gain.setTargetAtTime(ck * (hx ? .2 : .14) * mur, now, .6); SND.crowd2.g.gain.setTargetAtTime(ck * .06 * (1.3 - mur), now, .5);
  // pájaros (de día, más al amanecer y en Kids) y grillos al amanecer
  SND.birdT -= dt; if (SND.birdT <= 0 && !dark) { SND.birdT = (hx ? 2.4 : 1.4) + Math.random() * (hx ? 5 : 3.5) - dawn; const an = Math.random() * 6.28, r = 8 + Math.random() * 25; sndChirp(a.x + Math.cos(an) * r, a.z + Math.sin(an) * r, (hx ? .035 : .05) * (.5 + Math.random() * .5) * (1 - wk * .4), !hx); }
  SND.crT -= dt; if (SND.crT <= 0) { SND.crT = .35 + Math.random() * .6; const cv = (dawn > .55 ? (dawn - .55) * 2.2 : 0) + dark * .9; if (cv > .05) sndCrickets(.012 * cv); }
  // fogatas, braseros y antorchas cercanas
  const fires = (S.sv && S.sv.fires || []).concat((typeof AMB !== 'undefined' && AMB.src || []).filter(f => f.s >= .3)); const [fd, fb] = sndDist(fires.length ? fires : [{ x: 1e6, z: 1e6 }], a.x, a.z);
  SND.fireT -= dt; if (fb && fd < 14 && SND.fireT <= 0) { const k = 1 - fd / 14; SND.fireT = .05 + Math.random() * (.5 - k * .4); sndCrack(fb.x, fb.z, .12 * k * k); }
  // ovejas
  const sheep = (S.pois || []).filter(p => p.k === 'sheep'); const [sd, sb] = sndDist(sheep.length ? sheep : [{ x: 1e6, z: 1e6 }], a.x, a.z);
  SND.sheepT -= dt; if (sb && sd < 40 && SND.sheepT <= 0) { SND.sheepT = 4 + Math.random() * 9; sndBleat(sb.x + (Math.random() - .5) * 6, sb.z + (Math.random() - .5) * 6, .05 * (1 - sd / 40)); }
  // pasos del avatar (bus de efectos)
  const mov = S.moving || S.freeMoving; if (mov && !cine) { SND.stepT -= dt; if (SND.stepT <= 0) { SND.stepT = hx ? .4 : .34; sndStep(hx ? .2 : .15, ck > .5); } } else SND.stepT = .05;
}
function mixPanel() {
  let el = document.getElementById('v3mix'); if (el) { el.hidden = !el.hidden; el.classList.toggle('kids', !(S && S.hx)); return; }
  el = document.createElement('div'); el.id = 'v3mix'; el.className = 'v3mix' + (S && S.hx ? '' : ' kids');
  const row = (k, lab, ic) => `<label><span>${ic} ${lab}</span><input type="range" min="0" max="100" step="1" data-k="${k}" value="${Math.round(mixV(k) * 100)}" aria-label="Volumen de ${lab}"><b>${Math.round(mixV(k) * 100)}</b></label>`;
  el.innerHTML = `<div class="hd"><strong>Sonido</strong><button type="button" aria-label="Cerrar">✕</button></div>${row('mus', 'Música', '🎵')}${row('amb', 'Ambiente', '🌿')}${row('sfx', 'Efectos y voz', '👣')}<p>La música se apaga con 🎵; la voz que lee versículos, con 🗣️.</p>`;
  document.body.appendChild(el);
  el.querySelector('.hd button').onclick = () => { el.hidden = true; };
  el.querySelectorAll('input').forEach(r => { r.oninput = () => { mixSet(r.dataset.k, r.value / 100); r.nextElementSibling.textContent = r.value; auStart(); if (r.dataset.k === 'sfx') sndUI('tick'); }; });
  ['pointerdown', 'keydown', 'wheel'].forEach(e => el.addEventListener(e, ev => ev.stopPropagation()));
}

/* composición épica al estilo de las aventuras de Narnia: 16 compases en 4/4.
   A = tema heroico en cornos (o flauta), B = las cuerdas toman la melodía y todo crece.
   Cada vuelta suma orquesta: 1) flauta, arpa y cuerdas suaves 2) cornos, timbales 3) tutti con violines arriba */
const CH = (r, t) => ({ r, t });
const Dm = CH(38, [50, 53, 57]), Bb = CH(34, [50, 53, 58]), F = CH(41, [53, 57, 60]), C = CH(36, [52, 55, 60]), Gm = CH(43, [50, 55, 58]), A7 = CH(33, [49, 52, 57]), G7 = CH(43, [50, 55, 59]), Am = CH(45, [52, 57, 60]);
const SONG = {
  hx: { bpm: 92, epic: true, prog: [Dm, Bb, F, C, Dm, Bb, Gm, A7, Bb, F, C, Dm, Bb, F, Gm, A7],
    mel: [[[62, 0, 3], [69, 3, 1], [69, 4, 4]], [[70, 0, 2], [69, 2, 2], [65, 4, 4]], [[67, 0, 2], [69, 2, 2], [72, 4, 4]], [[70, 0, 3], [69, 3, 1], [67, 4, 4]],
      [[62, 0, 3], [69, 3, 1], [74, 4, 4]], [[74, 0, 2], [72, 2, 2], [70, 4, 4]], [[67, 0, 3], [70, 3, 1], [74, 4, 4]], [[73, 0, 4], [69, 4, 4]],
      [[74, 0, 6], [72, 6, 2]], [[72, 0, 3], [69, 3, 1], [65, 4, 4]], [[67, 0, 3], [72, 3, 1], [76, 4, 4]], [[74, 0, 8]],
      [[77, 0, 3], [74, 3, 1], [70, 4, 4]], [[72, 0, 3], [77, 3, 1], [81, 4, 4]], [[79, 0, 2], [77, 2, 2], [74, 4, 4]], [[73, 0, 4], [76, 4, 4]]] },
  kids: { bpm: 104, epic: false, prog: [C, G7, Am, F, C, G7, F, G7, F, C, G7, Am, F, C, F, G7],
    mel: [[[76, 0, 2], [79, 2, 2], [84, 4, 4]], [[83, 0, 2], [81, 2, 2], [79, 4, 4]], [[76, 0, 2], [81, 2, 2], [79, 4, 2], [76, 6, 2]], [[77, 0, 4], [76, 4, 2], [74, 6, 2]],
      [[76, 0, 2], [79, 2, 2], [84, 4, 4]], [[86, 0, 2], [83, 2, 2], [79, 4, 4]], [[81, 0, 2], [79, 2, 2], [77, 4, 2], [76, 6, 2]], [[74, 0, 8]],
      [[77, 0, 3], [76, 3, 1], [77, 4, 4]], [[79, 0, 3], [76, 3, 1], [72, 4, 4]], [[74, 0, 2], [76, 2, 2], [79, 4, 4]], [[81, 0, 8]],
      [[77, 0, 2], [81, 2, 2], [84, 4, 4]], [[84, 0, 3], [79, 3, 1], [76, 4, 4]], [[81, 0, 2], [77, 2, 2], [74, 4, 4]], [[79, 0, 4], [83, 4, 4]]] },
  // oración: solo piano, muy lento y suave
  soak: { bpm: 44, prog: [[36, 43, 52, 55, 59, 64], [33, 40, 48, 52, 55, 60], [29, 36, 45, 48, 52, 57], [31, 38, 47, 50, 55, 62]] }
};
function auTick() {
  const c = AU.ctx; if (!c || !S) return; try { sndTick(.09); } catch (e) { if (!AU.sndErr) { AU.sndErr = 1; console.warn('ambiente', e); } }
  const shown = !document.getElementById('view3d').hidden && document.getElementById('arcade').hidden;
  const pray = S.pose === 'pray' || S.solemn === 2, tm = c.currentTime + .35;
  if (musTick()) { AU.master.gain.setTargetAtTime(0, c.currentTime, .2); AU.next = c.currentTime + .1; AU.snext = c.currentTime + .1; return; }
  if (AU.mus && !AU.bank) Object.keys(SMP).forEach(loadInst); // si la música grabada falla, vuelve la orquesta sintetizada
  AU.master.gain.setTargetAtTime(AU.on && shown ? .9 * mixV('mus') : 0, c.currentTime, .4);
  AU.adv.gain.setTargetAtTime(pray ? 0 : (AU.speaking || AU.narr ? .45 : 1), c.currentTime, pray ? .8 : 1.6);
  AU.soak.gain.setTargetAtTime(pray ? (AU.speaking ? .7 : 1) : 0, c.currentTime, pray ? 2.2 : .9);
  if (!AU.on || !shown) { AU.next = Math.max(AU.next, c.currentTime + .1); AU.snext = Math.max(AU.snext, c.currentTime + .1); return; }
  const song = S.hx ? SONG.hx : SONG.kids, e8 = 60 / song.bpm / 2, L = song.prog.length, O = AU.adv, ep = song.epic;
  while (AU.next < tm) { const t = AU.next, s = AU.step, bar = Math.floor(s / 8) % L, b = s % 8, pass = Math.floor(s / (8 * L)) % 3, ch = song.prog[bar], r = ch.r, A = bar < 8, big = pass > 0;
    if (!pray) {
      // contrabajo: fundamental en 1 y 3
      if (b === 0 || b === 4) play('bass', r, t, ep ? (big ? .3 : .2) : .16, e8 * 4, O, .3);
      // ostinato de cellos (el pulso de la aventura)
      const os = [12, 12, 19, 12, 24, 12, 19, 12][b];
      if (ep || b % 2 === 0) play('cello', r + os, t, (b === 0 ? .22 : .14) * (big ? 1 : .65) * (ep ? 1 : .8), e8 * (ep ? 1.1 : .9), O, .22);
      // arpa: glissando al cambiar de acorde
      if (b === 0 && (!big || bar % 4 === 0)) [...ch.t, ...ch.t.map(m => m + 12)].forEach((m, i) => play('harp', m + 12, t + .02 + i * .06, .13, 3, O));
      // timbales: golpe en el 1, redoble al cerrar cada frase
      if (ep && big) { if (b === 0) timp(r, t, bar % 4 === 0 ? .55 : .38); if (bar % 8 === 7 && b >= 4) { timp(r, t, .22 + (b - 4) * .06); timp(r, t + e8 / 2, .25 + (b - 4) * .06); } }
      // cuerdas altas sosteniendo en la tercera vuelta
      if (pass === 2 && b === 0) play('violin', ch.t[2] + 12, t, .07, e8 * 8, O, 1);
      // melodía
      for (const [m, st, len] of song.mel[bar]) if (st === b) { const d = e8 * len + .3;
        if (A) {
          if (!big) play('flute', m < 72 ? m + 12 : m, t, .2, d, O, .8);
          else if (ep) { play('horn', m, t, .34, d, O, .9); if (pass === 2) play('violin', m + 12, t, .12, d, O, .9); }
          else { play('flute', m, t, .22, d, O, .7); if (pass === 2) play('violin', m, t, .1, d, O, .7); }
        } else {
          play('violin', m, t, big ? .24 : .16, d, O, .9);
          if (ep && big && st === 0) { play('horn', ch.t[1] + 12, t, .14, e8 * 8, O, 1); play('horn', ch.t[0] + 12, t, .12, e8 * 8, O, 1); }
          if (!ep && pass === 2) play('flute', m + 12 > 96 ? m : m + 12, t, .1, d, O, .6);
        }
      }
    }
    AU.next += e8; AU.step++; }
  // oración: solo piano, lento y suave
  const sp = SONG.soak, s8 = 60 / sp.bpm / 2, pent = [72, 74, 76, 79, 81];
  while (AU.snext < tm) { const t = AU.snext, s = AU.sstep, bar = Math.floor(s / 12) % 4, b = s % 12, ch = sp.prog[bar];
    if (pray) {
      if (b === 0) { play('piano', ch[0], t, .17, 12, AU.soak, 2.5); play('piano', ch[2] + 12, t + .04, .07, 10, AU.soak, 2.5); }
      if (b === 3) play('piano', ch[3] + 12, t, .065, 8, AU.soak, 2.5);
      if (b === 6) play('piano', ch[4] + 12, t, .06, 8, AU.soak, 2.5);
      if (b === 9 && Math.random() < .7) play('piano', pent[Math.floor(Math.random() * pent.length)], t, .08, 7, AU.soak, 2.5);
    }
    AU.snext += s8; AU.sstep++; }
}
/* voz: la más natural disponible en el aparato */
function esVoice() {
  try { const vs = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang)); if (!vs.length) return null;
    const sc = v => (/natural|neural|online/i.test(v.name) ? 8 : 0) + (/premium|enhanced|mejorad|plus|siri/i.test(v.name) ? 6 : 0) + (/google/i.test(v.name) ? 4 : 0) + (/es-(AR|419|US|MX|CO|CL|UY)/i.test(v.lang) ? 2 : 0) + (v.localService ? 0 : 1) - (/compact|eloquence|espeak/i.test(v.name) ? 6 : 0);
    return vs.sort((a, b) => sc(b) - sc(a))[0]; } catch (e) { return null; }
}
function say(txt, ref, onend) {
  if (AU.voice && G().vo && G().voOn()) { caption(txt, ref, 60); AU.speaking = true; AU.voSay = true; G().vo(txt, 'narrador', { onend: () => { AU.speaking = false; AU.voSay = false; caption(null); onend && onend(); } }); return; }
  if (!AU.voice || !('speechSynthesis' in window)) { caption(txt, ref, 9); onend && setTimeout(onend, 9000); return; }
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt.replace(/SEÑOR/g, 'Señor') + '. ' + ref.replace(/(\d+):(\d+)-(\d+)/, '$1, versículos $2 al $3').replace(/(\d+):(\d+)/, '$1, versículo $2')); const v = esVoice(); if (v) u.voice = v; u.lang = v ? v.lang : 'es-419'; u.rate = 1.06; u.pitch = .96; u.volume = .85;
    u.volume = mixV('sfx'); AU.speaking = true; caption(txt, ref, 60); const t0 = performance.now(), minMs = 2500 + txt.length * 55; u.onend = u.onerror = () => { setTimeout(() => { AU.speaking = false; caption(null); onend && onend(); }, Math.max(0, minMs - (performance.now() - t0))); }; speechSynthesis.speak(u); } catch (e) { AU.speaking = false; }
}
function caption(txt, ref, secs) {
  let el = document.getElementById('v3say'); if (!el) { el = document.createElement('div'); el.id = 'v3say'; el.className = 'v3say'; document.body.appendChild(el); }
  clearTimeout(caption.t); if (!txt) { el.classList.remove('on'); return; }
  el.innerHTML = `<p>${esc(txt)}</p><small>${esc(ref)} · NTV</small>`; el.classList.add('on'); caption.t = setTimeout(() => el.classList.remove('on'), secs * 1000);
}
function stopVoice() { try { speechSynthesis.cancel(); } catch (e) {} try { if (AU.voSay) { AU.voSay = false; G().voStop && G().voStop(); } } catch (e) {} AU.speaking = false; caption(null); }
function topicUI(show) {
  let el = document.getElementById('v3topics');
  if (!el) { el = document.createElement('div'); el.id = 'v3topics'; el.className = 'v3topics'; el.innerHTML = '<span>Elegí un tema para meditar</span><div>' + Object.entries(VERSOS).map(([k, t]) => `<button data-t="${k}">${t.name}</button>`).join('') + '</div>'; document.body.appendChild(el);
    el.querySelectorAll('button').forEach(b => b.onclick = () => { AU.topic = b.dataset.t; pref2('topic', AU.topic); AU.vi = 0; topicUI(true); stopVoice(); AU.nextSay = 0; }); }
  el.hidden = !show; el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === AU.topic));
}
function voiceTick(dt) {
  if (!S) return; const pray = S.pose === 'pray';
  if (pray !== AU.wasPray) { AU.wasPray = pray; topicUI(pray); if (!pray && AU.prayVoice) { stopVoice(); AU.prayVoice = false; } AU.nextSay = pray ? 3.5 : AU.nextSay; }
  if (sheetUp() || document.getElementById('view3d').hidden) { if (AU.speaking) stopVoice(); return; }
  if (pray) { if (AU.speaking || AU.narr) return; AU.nextSay -= dt; if (AU.nextSay <= 0) { const T = VERSOS[AU.topic] || VERSOS.paz, v = T.v[(AU.vi = (AU.vi ?? -1) + 1) % T.v.length]; AU.prayVoice = true; AU.nextSay = 99; say(v[0], v[1], () => { AU.nextSay = 5; }); } return; }
  if (S.moving || S.freeMoving) AU.walkT = (AU.walkT || 0) + dt;
  if (AU.walkT > 75 && !AU.speaking && !AU.narr) { AU.walkT = 0; const all = PASO.concat(...Object.values(VERSOS).map(t => t.v)), v = all[Math.floor(Math.random() * all.length)]; say(v[0], v[1]); }
}
function auButtons() {
  const box = document.getElementById('v3acts'); if (!box || box.querySelector('[data-a="music"]')) return;
  box.insertAdjacentHTML('afterbegin', '<button data-a="music" aria-label="Música" title="Música"></button><button data-a="voice" aria-label="Voz que lee versículos" title="Voz"></button><button data-a="mix" aria-label="Volumen de música, ambiente y efectos" title="Sonido">🎚️</button>');
  box.querySelector('[data-a="mix"]').onpointerdown = e => { e.preventDefault(); e.stopPropagation(); auStart(); mixPanel(); };
  const paint = () => { box.querySelector('[data-a="music"]').textContent = AU.on ? '🎵' : '🔇'; box.querySelector('[data-a="voice"]').textContent = AU.voice ? '🗣️' : '🤐'; box.querySelector('[data-a="music"]').classList.toggle('off', !AU.on); box.querySelector('[data-a="voice"]').classList.toggle('off', !AU.voice); };
  box.querySelector('[data-a="music"]').onpointerdown = e => { e.preventDefault(); e.stopPropagation(); AU.on = !AU.on; pref2('music', AU.on ? '1' : '0'); auStart(); paint(); };
  box.querySelector('[data-a="voice"]').onpointerdown = e => { e.preventDefault(); e.stopPropagation(); AU.voice = !AU.voice; pref2('voice', AU.voice ? '1' : '0'); if (!AU.voice) stopVoice(); paint(); };
  paint();
  const unlock = e => { auStart(); if (!AU.ttsOk && e && e.type !== 'pointerdown') { AU.ttsOk = true; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (er) {} } if (AU.ctx && AU.ctx.state !== 'running') AU.ctx.resume().catch(() => {}); };
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(k => addEventListener(k, unlock, { passive: true, capture: true }));
}

/* ---------- lecturas en voz alta y testimonios: quedan guardados solo en este aparato ---------- */
const MDB = { db: null };
function mdb() { return MDB.db || (MDB.db = new Promise((res, rej) => { try { const r = indexedDB.open('tsp-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('m'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } })); }
async function mput(k, v) { const db = await mdb(); return new Promise((res, rej) => { const tx = db.transaction('m', 'readwrite'); tx.objectStore('m').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function mget(k) { const db = await mdb(); return new Promise(res => { const rq = db.transaction('m').objectStore('m').get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); }); }
const mkey = id => (G().P().id || 'p') + ':' + id;
function openCapture(m) {
  const el = document.getElementById('v3sheet'), d = m.d, kids = !S.hx; if (!el) return; S.joy.x = 0; S.joy.y = 0;
  const close = () => { el.hidden = true; if (el._rec && el._rec.state === 'recording') { el._rec.onstop = () => { AU.on = AU.wasOn; }; el._rec.stop(); } if (el._stream) { el._stream.getTracks().forEach(t => t.stop()); el._stream = null; } };
  if (d.kind === 'record') {
    el.innerHTML = `<div class="bag-in mis-in cap"><div class="bag-h"><b>${esc(d.title)}</b><span>Lectura en voz alta · +${MIS_PTS} puntos</span><button class="bag-x" aria-label="Cerrar">✕</button></div>
      <p class="mis-ask">Abrí tu Biblia en <b>${esc(d.ref)}</b> y leelo completo en voz alta. Te vamos a pedir permiso para usar el micrófono.</p>
      <p class="cap-note">La grabación queda guardada solo en este ${kids ? 'aparato' : 'celular'}. Nadie más la escucha.</p>
      <div class="cap-rec"><span class="cap-dot"></span><b class="cap-t">0:00</b></div><audio class="cap-audio" controls hidden></audio><p class="cap-err" hidden></p>
      <div class="mis-btns"><button class="mis-yes cap-go">🎙️ Empezar a grabar</button><button class="mis-no cap-save" hidden>Guardar</button></div></div>`;
    el.hidden = false; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
    const go = el.querySelector('.cap-go'), save = el.querySelector('.cap-save'), tEl = el.querySelector('.cap-t'), au = el.querySelector('.cap-audio'), err = el.querySelector('.cap-err'), box = el.querySelector('.cap-rec');
    let rec = null, chunks = [], t0 = 0, tm = null, blob = null; const MIN = 25;
    const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    go.onclick = async () => {
      if (rec && rec.state === 'recording') { if ((performance.now() - t0) / 1000 < MIN) { err.hidden = false; err.textContent = 'Seguí leyendo: el capítulo completo lleva un poco más de tiempo.'; return; } rec.stop(); return; }
      try { el._stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { err.hidden = false; err.textContent = 'No pudimos usar el micrófono. Revisá que el navegador tenga permiso para usarlo y probá de nuevo.'; return; }
      if (AU.speaking) stopVoice(); AU.wasOn = AU.on; AU.on = false;
      chunks = []; rec = el._rec = new MediaRecorder(el._stream); rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      rec.onstop = () => { clearInterval(tm); box.classList.remove('on'); AU.on = AU.wasOn; blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); au.src = URL.createObjectURL(blob); au.hidden = false; save.hidden = false; go.textContent = '🎙️ Grabar de nuevo'; if (el._stream) el._stream.getTracks().forEach(t => t.stop()); el._stream = null; };
      rec.start(); t0 = performance.now(); box.classList.add('on'); err.hidden = true; au.hidden = true; save.hidden = true; go.textContent = '⏹ Terminar'; tm = setInterval(() => { tEl.textContent = fmt((performance.now() - t0) / 1000); }, 250);
    };
    save.onclick = async () => { if (!blob) return; const v = { kind: 'audio', blob, ref: d.ref, at: Date.now() }; try { await mput(mkey(d.id), v); } catch (e) {} close(); misDone(m); setTimeout(() => shareAsk(el, v, d), 1400); };
  } else {
    el.innerHTML = `<div class="bag-in mis-in cap"><div class="bag-h"><b>${esc(d.title)}</b><span>Testimonio · +${MIS_PTS} puntos</span><button class="bag-x" aria-label="Cerrar">✕</button></div>
      <p class="mis-ask">Contale a un compañero o compañera de tu ${kids ? 'grado' : 'curso'} quién es Jesús${kids ? '. Pedile a un adulto que te acompañe' : ''}. Si tu compañero o compañera está de acuerdo, sacate una foto con él o ella.</p>
      <p class="cap-note">Te vamos a pedir permiso para usar la cámara. La foto queda guardada solo en este ${kids ? 'aparato' : 'celular'}.</p>
      <label class="cap-chk"><input type="checkbox" class="c1"> Le hablé de Jesús</label><label class="cap-chk"><input type="checkbox" class="c2"> Mi compañero o compañera aceptó sacarse la foto</label>
      <img class="cap-img" alt="Foto del testimonio" hidden><input type="file" accept="image/*" capture="user" class="cap-file" hidden><p class="cap-err" hidden></p>
      <div class="mis-btns"><button class="mis-yes cap-go">📷 Abrir la cámara</button><button class="mis-no cap-save" hidden>Guardar</button></div></div>`;
    el.hidden = false; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
    const go = el.querySelector('.cap-go'), save = el.querySelector('.cap-save'), file = el.querySelector('.cap-file'), img = el.querySelector('.cap-img'), err = el.querySelector('.cap-err'), c1 = el.querySelector('.c1'), c2 = el.querySelector('.c2');
    let blob = null; const ready = () => { save.hidden = !blob; save.disabled = !(c1.checked && c2.checked); }; c1.onchange = c2.onchange = ready;
    go.onclick = () => { if (!c1.checked || !c2.checked) { err.hidden = false; err.textContent = 'Primero contale de Jesús y preguntale si está de acuerdo con la foto. Después marcá las dos casillas.'; return; } err.hidden = true; file.click(); };
    file.onchange = () => { const f = file.files && file.files[0]; if (!f) return; const im = new Image(); im.onload = () => { const k = Math.min(1, 1100 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); cv.toBlob(b => { blob = b; img.src = URL.createObjectURL(b); img.hidden = false; go.textContent = '📷 Sacar otra'; ready(); }, 'image/jpeg', .85); }; im.src = URL.createObjectURL(f); };
    save.onclick = async () => { if (!blob || !c1.checked || !c2.checked) return; const v = { kind: 'photo', blob, ref: d.ref, at: Date.now() }; try { await mput(mkey(d.id), v); } catch (e) {} close(); misDone(m); setTimeout(() => shareAsk(el, v, d), 1400); };
  }
}
async function shareMedia(v, d) {
  const ext = /mp4|m4a|aac/.test(v.blob.type) ? 'm4a' : /ogg/.test(v.blob.type) ? 'ogg' : /webm/.test(v.blob.type) ? 'webm' : 'jpg', name = (G().P().name || 'Mi') .replace(/[^\wáéíóúñÁÉÍÓÚÑ ]/g, '').trim() || 'Mi';
  const file = new File([v.blob], `${d.title} - ${name}.${ext}`, { type: v.blob.type || (ext === 'jpg' ? 'image/jpeg' : 'audio/webm') });
  const text = v.kind === 'audio' ? `¡Hola! Te comparto mi lectura en voz alta de ${d.ref}, de la misión «${d.title}» de Tras Sus Pasos.` : `¡Hola! Te comparto mi testimonio de la misión «${d.title}» (${d.ref}) de Tras Sus Pasos: le conté a un compañero quién es Jesús.`;
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: d.title, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); G().toast('Se descargó el archivo. Adjuntalo en un mail para tus papás.');
}
function shareAsk(el, v, d) {
  el.innerHTML = `<div class="bag-in mis-in cap"><div class="bag-h"><b>¡Guardado!</b><span>${esc(d.title)} · ${esc(d.ref)}</span><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="mis-ask">¿Se lo mandás a tus papás? Elegí Mail (o WhatsApp) y enviáselo.</p><div class="mis-btns"><button class="mis-yes sh-go">✉️ Enviar a mis papás</button><button class="mis-no sh-no">Más tarde</button></div><p class="cap-note">También lo podés enviar después desde la Mochila.</p></div>`;
  el.hidden = false; const close = () => { el.hidden = true; }; el.querySelector('.bag-x').onclick = close; el.querySelector('.sh-no').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  el.querySelector('.sh-go').onclick = async () => { await shareMedia(v, d); close(); };
}
async function bagMedia(el) {
  const ids = MISSIONS.filter(d => d.kind === 'record' || d.kind === 'photo').map(d => d.id), have = (G().P().missions || {}), out = [];
  for (const id of ids) { if (!have[id]) continue; const v = await mget(mkey(id)).catch(() => null), d = MISSIONS.find(x => x.id === id); out.push({ d, v }); }
  if (!out.length) return; const sec = document.createElement('div'); sec.className = 'bag-media';
  sec.innerHTML = '<h4>Mis lecturas y testimonios</h4>' + out.map(({ d }, i) => `<div class="bag-it on"><b>${esc(d.title)}</b><small>${esc(d.ref)}</small><div class="bm-${i}"></div></div>`).join('');
  el.querySelector('.bag-in').appendChild(sec);
  out.forEach(({ v }, i) => { const slot = sec.querySelector('.bm-' + i); if (!v || !v.blob) { slot.innerHTML = '<span>Guardado en otro aparato.</span>'; return; } const u = URL.createObjectURL(v.blob); slot.innerHTML = (v.kind === 'audio' ? `<audio controls src="${u}"></audio>` : `<img src="${u}" alt="Foto del testimonio">`) + '<button class="bm-share">✉️ Enviar a mis papás</button>'; slot.querySelector('.bm-share').onclick = () => shareMedia(v, out[i].d); });
}

/* ---------- jugar con amigos: salas privadas de hasta 5, conexión directa entre aparatos ---------- */
const MP = { peer: null, conns: {}, host: false, code: null, players: {}, conn: null, last: 0, sig: '' };
const PHR = ['¡Hola!', '¡Vamos!', '¡Seguime!', '¡Esperame!', '¡Bien ahí!', '¡Gracias!', '¡Amén!', 'Oremos 🙏'];
const CODECH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', mkCode = () => Array.from({ length: 6 }, () => CODECH[Math.floor(Math.random() * CODECH.length)]).join('');
const pid = c => 'habitat-tsp-' + c.toLowerCase();
function mpLoad() { return window.Peer ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const meInfo = () => { const p = G().P(); return { name: (p.name || 'Invitado').slice(0, 16), avatar: lookOf(p), branch: G().branch, hum: (p.attr && p.attr.hum) || 0 }; };
const roomLink = () => location.origin + location.pathname + '#sala-' + (G().branch === 'ados' ? 'hero' : 'kids') + '-' + MP.code;
function mpSend(msg, except) { const d = msg; if (MP.host) { for (const id in MP.conns) if (id !== except && MP.conns[id].open) MP.conns[id].send(d); } else if (MP.conn && MP.conn.open) MP.conn.send(d); }
async function mpCreate() {
  try { await mpLoad(); } catch (e) { G().toast('No se pudo cargar el modo con amigos. Revisá la conexión.'); return; }
  mpLeave(true); MP.code = mkCode(); MP.host = true; MP.peer = new Peer(pid(MP.code)); talkPeer(MP.peer);
  MP.peer.on('open', () => { mpUI(); mpPanel(); });
  MP.peer.on('connection', c => {
    c.on('open', () => { if (Object.keys(MP.conns).length >= 4) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; } });
    c.on('data', m => {
      if (!m || !m.t) return;
      if (m.t === 'hi') { if (m.info.branch !== G().branch) { c.send({ t: 'branch', b: G().branch }); setTimeout(() => c.close(), 300); return; } if (Object.keys(MP.conns).length >= 4) return; MP.conns[c.peer] = c;
        c.send({ t: 'list', host: MP.peer.id, players: [{ id: MP.peer.id, info: meInfo() }].concat(Object.entries(MP.players).map(([id, p]) => ({ id, info: p.info }))) });
        mpAdd(c.peer, m.info); mpSend({ t: 'hi', id: c.peer, info: m.info }, c.peer); G().toast(m.info.name + ' entró a la sala.'); mpUI(); return; }
      if (m.t === 'st' || m.t === 'say' || m.t === 'talk' || m.t === 'look') { m.id = c.peer; mpOn(m); mpSend(m, c.peer); }
      if (m.t === 'x') xRelay(c, m);
    });
    c.on('close', () => { if (MP.conns[c.peer]) { delete MP.conns[c.peer]; const n = MP.players[c.peer] && MP.players[c.peer].info.name; mpDel(c.peer); mpSend({ t: 'bye', id: c.peer }); if (n) G().toast(n + ' salió de la sala.'); mpUI(); } });
  });
  MP.peer.on('error', e => { if (e.type === 'unavailable-id') mpCreate(); else G().toast('Hubo un problema con la sala. Probá de nuevo.'); });
}
async function mpJoin(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length !== 6) { G().toast('El código tiene 6 letras y números.'); return; }
  try { await mpLoad(); } catch (e) { G().toast('No se pudo cargar el modo con amigos. Revisá la conexión.'); return; }
  mpLeave(true); MP.code = code; MP.host = false; MP.peer = new Peer(); talkPeer(MP.peer);
  MP.peer.on('open', () => { const c = MP.conn = MP.peer.connect(pid(code), { reliable: true }); let ok = false;
    const to = setTimeout(() => { if (!ok) { G().toast('No encontramos esa sala. Revisá el código o pedí el link de nuevo.'); mpLeave(); } }, 9000);
    c.on('open', () => { c.send({ t: 'hi', info: meInfo() }); });
    c.on('data', m => { if (!m || !m.t) return; ok = true; clearTimeout(to);
      if (m.t === 'full') { G().toast('La sala ya tiene 5 personas.'); mpLeave(); return; }
      if (m.t === 'branch') { G().toast(m.b === 'ados' ? 'Esa sala es de Hero. Entrá con tu perfil de Hero.' : 'Esa sala es de Kids. Entrá con tu perfil de Kids.'); mpLeave(); return; }
      if (m.t === 'list') { m.players.forEach(p => { if (p.id !== MP.peer.id) mpAdd(p.id, p.info); }); G().toast('¡Entraste a la sala ' + code + '!'); mpUI(); return; }
      if (m.t === 'hi') { mpAdd(m.id, m.info); G().toast(m.info.name + ' entró a la sala.'); mpUI(); return; }
      if (m.t === 'bye') { const n = MP.players[m.id] && MP.players[m.id].info.name; mpDel(m.id); if (n) G().toast(n + ' salió de la sala.'); mpUI(); return; }
      if (m.t === 'x') { mpX(m); return; }
      mpOn(m); });
    c.on('close', () => { if (MP.code) { G().toast('Se cerró la sala.'); mpLeave(); } }); });
  MP.peer.on('error', e => { G().toast(e.type === 'peer-unavailable' ? 'No encontramos esa sala. Revisá el código o pedí el link de nuevo.' : 'Hubo un problema con la sala. Probá de nuevo.'); mpLeave(); });
}

/* micrófono: se habla solo mientras se mantiene apretado (tecla T o el botón) */
const TALK = { stream: null, calls: {}, aus: {}, on: false, want: false };
function talkPeer(peer) {
  peer.on('call', c => { if (!MP.players[c.peer]) { c.close(); return; } c.answer(); c.on('stream', st => { let a = TALK.aus[c.peer]; if (!a) { a = TALK.aus[c.peer] = new Audio(); a.autoplay = true; } a.srcObject = st; a.play().catch(() => {}); }); });
}
function talkCallAll() { if (!TALK.stream || !MP.peer) return; for (const id in MP.players) if (!TALK.calls[id]) { try { const c = MP.peer.call(id, TALK.stream); if (!c) continue; TALK.calls[id] = c; c.on('close', () => { delete TALK.calls[id]; }); c.on('error', () => { delete TALK.calls[id]; }); } catch (e) {} } }
async function talkStart() {
  if (!MP.code || TALK.on) return; TALK.want = true;
  if (!TALK.stream) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { G().toast('Este aparato no permite usar el micrófono acá.'); return; }
    try { TALK.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch (e) { G().toast('Para hablar con la sala hace falta permitir el micrófono.'); TALK.want = false; return; }
    TALK.stream.getAudioTracks().forEach(t => t.enabled = false); talkCallAll();
    if (!TALK.want) return;
  }
  TALK.on = true; TALK.stream.getAudioTracks().forEach(t => t.enabled = true); talkCallAll();
  mpSend({ t: 'talk', id: MP.peer && MP.peer.id, on: 1 }); talkUI();
}
function talkStop() { TALK.want = false; if (!TALK.on) return; TALK.on = false; if (TALK.stream) TALK.stream.getAudioTracks().forEach(t => t.enabled = false); mpSend({ t: 'talk', id: MP.peer && MP.peer.id, on: 0 }); talkUI(); }
function talkEnd() { TALK.on = false; TALK.want = false; for (const id in TALK.calls) try { TALK.calls[id].close(); } catch (e) {} for (const id in TALK.aus) { TALK.aus[id].srcObject = null; } if (TALK.stream) TALK.stream.getTracks().forEach(t => t.stop()); TALK.stream = null; TALK.calls = {}; TALK.aus = {}; talkUI(); }
function talkUI() { const b = document.querySelector('#v3room .r-mic'); if (b) { b.classList.toggle('on', TALK.on); b.textContent = TALK.on ? '🎙️ Hablando…' : '🎙️ Hablar'; } }
function mpLeave(silent) {
  talkEnd();
  try { for (const id in MP.conns) MP.conns[id].close(); if (MP.conn) MP.conn.close(); if (MP.peer) MP.peer.destroy(); } catch (e) {}
  for (const id in MP.players) mpDel(id); MP.peer = null; MP.conn = null; MP.conns = {}; MP.code = null; MP.host = false; if (!silent) mpUI();
}
function mpAdd(id, info) {
  if (!S || MP.players[id]) return; const hx = S.hx, rig = hx || H3.ok, av = rig ? buildHeroAvatar(info.avatar || {}) : buildAvatar(info.avatar || {}, false); av.traverse(o => { if (o.isPointLight) o.intensity = 2; if (o.isMesh && rig) o.castShadow = true; });
  const tag = tagSprite(info.name + (info.avatar && info.avatar.don && DONL[info.avatar.don] ? ' · ' + DONL[info.avatar.don] : ''), (info.avatar && info.avatar.ins) || [], hx, (info.avatar && info.avatar.glow) || 0); tag.scale.multiplyScalar(.42); tag.position.y = 2.55 * (av.userData.h3 ? av.userData.h3.tagK || 1 : 1); av.add(tag); if ((info.hum || 0) >= 10) av.add(humHalo()); av.position.copy(S.av.position); av.position.x += 1.5; S.scene.add(av);
  if (TALK.stream) setTimeout(talkCallAll, 600);
  MP.players[id] = { info, av, tag, tgt: { x: av.position.x, y: 0, z: av.position.z, yaw: 0 }, st: { pose: null, waveT: 0, jy: 0 }, moving: false, bubble: null, bT: 0 };
}
function mpDel(id) { if (TALK.calls[id]) { try { TALK.calls[id].close(); } catch (e) {} delete TALK.calls[id]; } if (TALK.aus[id]) { TALK.aus[id].srcObject = null; delete TALK.aus[id]; } const p = MP.players[id]; if (!p) return; if (S) S.scene.remove(p.av); delete MP.players[id]; }
function mpOn(m) {
  const p = MP.players[m.id]; if (!p) return;
  if (m.t === 'st') { const [x, y, z, yaw, mv, pose, wv, jy] = m.s; p.tgt = { x, y, z, yaw }; p.moving = !!mv; if (pose !== p.st.pose) { p.st.pose = pose; p.st.prayT = 0; } if (wv && !(p.st.waveT > 0)) p.st.waveT = 2.2; p.st.jy = jy; }
  if (m.t === 'say') mpBubble(p, PHR[m.k] || '');
  if (m.t === 'look' && m.avatar) { p.info.avatar = m.avatar; const pos = p.av.position.clone(), rot = p.av.rotation.y, info = p.info; S.scene.remove(p.av); delete MP.players[m.id]; mpAdd(m.id, info); const q = MP.players[m.id]; q.av.position.copy(pos); q.av.rotation.y = rot; q.tgt = p.tgt; return; }
  if (m.t === 'talk') { if (m.on) { mpBubble(p, '🎙️'); p.bT = 600; } else if (p.bubble) p.bT = .01; }
}
function mpBubble(p, txt) { if (p.bubble) p.av.remove(p.bubble); const b = textSprite(txt, S.hx); b.scale.multiplyScalar(.4); b.position.y = 2.95; p.av.add(b); p.bubble = b; p.bT = 4; }
function mpSay(k) { if (!MP.code) return; mpSend({ t: 'say', id: MP.peer && MP.peer.id, k }); if (!S.meP) S.meP = { av: S.av }; mpBubble(S.meP, PHR[k]); }
function mpTick(t, dt) {
  if (!S) return;
  if (S.meP && S.meP.bT > 0) { S.meP.bT -= dt; if (S.meP.bT <= 0 && S.meP.bubble) { S.av.remove(S.meP.bubble); S.meP.bubble = null; } }
  if (!MP.code) return;
  for (const id in MP.players) { const p = MP.players[id], a = p.av.position, k = Math.min(1, dt * 8); a.x += (p.tgt.x - a.x) * k; a.z += (p.tgt.z - a.z) * k; a.y += (p.tgt.y - a.y) * k; let d = p.tgt.yaw - p.av.rotation.y; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; p.av.rotation.y += d * k;
    animAvatar(p.av, t, p.moving && !(p.st.jy > .02), dt); applyPose(p.av, t, dt, p.st); if (p.bT > 0) { p.bT -= dt; if (p.bT <= 0 && p.bubble) { p.av.remove(p.bubble); p.bubble = null; } } }
  const now = performance.now(); if (now - MP.last > 110) { const a = S.av.position, s = [+a.x.toFixed(2), +a.y.toFixed(2), +a.z.toFixed(2), +S.yaw.toFixed(2), (S.moving || S.freeMoving) ? 1 : 0, S.pose || null, S.waveT > 1.8 ? 1 : 0, +(S.jy || 0).toFixed(2)], sig = JSON.stringify(s); if (sig !== MP.sig || now - MP.last > 1500) { MP.sig = sig; MP.last = now; mpSend({ t: 'st', id: MP.peer && MP.peer.id, s }); } }
}
function mpUI() {
  let el = document.getElementById('v3room'); if (!el) { el = document.createElement('div'); el.id = 'v3room'; el.className = 'v3room'; el.innerHTML = '<button class="r-who"></button><button class="r-mic">🎙️ Hablar</button><button class="r-say" aria-label="Frases rápidas">💬</button><div class="r-phr" hidden></div>';
    { const m = el.querySelector('.r-mic'); m.addEventListener('pointerdown', e => { e.preventDefault(); try { m.setPointerCapture(e.pointerId); } catch (x) {} talkStart(); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => m.addEventListener(ev, talkStop)); m.addEventListener('contextmenu', e => e.preventDefault()); if (!matchMedia('(pointer: coarse)').matches) m.title = 'También podés mantener apretada la tecla T'; } document.body.appendChild(el);
    el.querySelector('.r-who').onclick = mpPanel; el.querySelector('.r-say').onclick = () => { const b = el.querySelector('.r-phr'); b.hidden = !b.hidden; };
    el.querySelector('.r-phr').innerHTML = PHR.map((p, i) => `<button data-k="${i}">${p}</button>`).join(''); el.querySelectorAll('.r-phr button').forEach(b => b.onclick = () => { mpSay(+b.dataset.k); el.querySelector('.r-phr').hidden = true; }); }
  el.hidden = !MP.code; el.querySelector('.r-who').textContent = `👥 Sala ${MP.code || ''} · ${1 + Object.keys(MP.players).length}/5`;
  const b = document.querySelector('#v3acts [data-a="room"]'); if (b) b.classList.toggle('on', !!MP.code);
}
function mpPanel() {
  const el = document.getElementById('v3sheet'); if (!el) return; S.joy.x = 0; S.joy.y = 0; const close = () => { el.hidden = true; };
  if (!MP.code) {
    el.innerHTML = `<div class="bag-in mis-in"><div class="bag-h"><b>Jugar con amigos</b><span>Salas privadas de hasta 5 personas</span><button class="bag-x" aria-label="Cerrar">✕</button></div>
      <p class="mis-ask">Cada uno juega con su propio perfil y conserva su nivel. En la sala se ven caminando juntos por el mismo mundo.</p>
      <div class="mis-btns"><button class="mis-yes r-new">Crear una sala</button></div>
      <p class="cap-note" style="margin-top:16px">¿Te pasaron un código?</p><div class="r-join"><input class="r-code" maxlength="6" placeholder="CÓDIGO" autocapitalize="characters" autocomplete="off" spellcheck="false"><button class="mis-no r-go">Entrar</button></div>
      <p class="cap-note">Solo entra quien tenga el código o el link. Adentro pueden hablar manteniendo apretado 🎙️ (o la tecla T en la compu) y usar frases rápidas.</p></div>`;
    el.hidden = false; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
    el.querySelector('.r-new').onclick = () => { el.querySelector('.r-new').textContent = 'Creando…'; mpCreate(); };
    el.querySelector('.r-go').onclick = () => { close(); mpJoin(el.querySelector('.r-code').value); };
    return;
  }
  const list = [`<li>${esc(meInfo().name)} <small>(vos${MP.host ? ', creaste la sala' : ''})</small></li>`].concat(Object.values(MP.players).map(p => `<li>${esc(p.info.name)}</li>`)).join('');
  el.innerHTML = `<div class="bag-in mis-in"><div class="bag-h"><b>Sala ${MP.code}</b><span>${1 + Object.keys(MP.players).length} de 5 personas</span><button class="bag-x" aria-label="Cerrar">✕</button></div>
    <div class="r-big">${MP.code}</div><ul class="r-list">${list}</ul>
    <div class="x-acts"><button class="r-esp1">⚔️ Espadeo mano a mano</button><button class="r-espA">📖 Espadeo todos contra todos</button><button class="r-quien">🕵️ ¿Quién soy?</button><button class="r-cad">🔗 Versículo en cadena</button><button class="r-race">🏁 Carrera a un lugar</button>${S.hx ? '<button class="r-trade">🤝 Intercambiar o regalar</button><button class="r-gift">🙏 Dar un punto (humildad)</button>' : ''}</div>
    <div class="mis-btns"><button class="mis-yes r-share">📨 Invitar con el link</button><button class="mis-no r-leave">Salir de la sala</button></div>
    <p class="cap-note">🙏 Si se arrodillan a orar juntos, cerca, reciben una bendición una vez por día.</p><p class="cap-note">Mandá el link solo a personas que conocés. Para hablar mantené apretado 🎙️${matchMedia('(pointer: coarse)').matches ? '' : ' o la tecla T'}; al soltar se apaga el micrófono. ${MP.host ? 'Si salís, la sala se cierra para todos.' : ''}</p></div>`;
  el.hidden = false; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  el.querySelector('.r-leave').onclick = () => { close(); mpLeave(); };
  el.querySelector('.r-esp1').onclick = () => espStart('1v1'); el.querySelector('.r-espA').onclick = () => espStart('all'); el.querySelector('.r-quien').onclick = () => gmInvite('quien', '¿Quién soy?'); el.querySelector('.r-cad').onclick = () => gmInvite('cadena', 'Versículo en cadena'); el.querySelector('.r-race').onclick = () => gmInvite('carrera', 'Carrera a un lugar'); if (S.hx) { el.querySelector('.r-trade').onclick = xTrade; el.querySelector('.r-gift').onclick = xGift; }
  el.querySelector('.r-share').onclick = async () => { const url = roomLink(), text = `¡Sumate a mi sala en Tras Sus Pasos! Código ${MP.code}`; try { if (navigator.share) { await navigator.share({ title: 'Tras Sus Pasos', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText(text + ' ' + url); G().toast('Link copiado. Pegalo en WhatsApp para invitar.'); } catch (e) { G().toast(url); } };
}
function mpAuto() { let j = null; try { j = sessionStorage.getItem('tsp:join'); sessionStorage.removeItem('tsp:join'); } catch (e) {} if (j) setTimeout(() => mpJoin(j), 800); }

/* ---------- amanecer y mediodía: cambia solo cada 5 minutos (igual para todos en una sala); del mediodía vuelve a un amanecer nuevo ---------- */
const DAYP = 5 * 60e3, DAYX = 50e3, DAYN = ['Amanecer', 'Mediodía'];
const DAYH = [
  { top: '#4A6AA8', mid: '#B9B4CE', hor: '#FBC9A0', sunC: '#FFE0BE', dir: [.55, .3, -.78], sunL: '#FFD6B0', sI: 2.8, hs: '#C9D2EC', hg: '#5A4A3A', hI: .8, fog: '#C9B8B4', fd: .0062, st: 0, ex: 1.08 },
  { top: '#2E6CC0', mid: '#7DB1E4', hor: '#DDE8F0', sunC: '#FFF6E2', dir: [-.25, .82, -.5], sunL: '#FFF2DA', sI: 3.0, hs: '#C2D8F2', hg: '#5C4C34', hI: .85, fog: '#B7C6CF', fd: .0052, st: 0, ex: 1.0 }];
DAYH[0].dir = [.575, .083, -.814]; DAYH[1].dir = [-.300, .742, -.599];
const DAYK = [
  { top: '#F4B6A6', bot: '#FFE4C6', sun: '#FFD9B8', sI: 1.4, hs: '#F2D9E6', hg: '#C9B27A', hI: 1.0, fog: '#F6E0D2' },
  { top: '#7FB6FF', bot: '#FFE6C9', sun: '#FFF4DC', sI: 1.6, hs: '#DDEBFF', hg: '#C9B27A', hI: 1.1, fog: '#F3E6D6' }];
let _c1 = null, _c2 = null;
const mixC = (a, b, k) => { if (!_c1) { _c1 = new THREE.Color(); _c2 = new THREE.Color(); } return _c1.set(a).lerp(_c2.set(b), k); };
function dayNow() { const n = Date.now(), i = Math.floor(n / DAYP) % 2, f = n % DAYP, k = f < DAYX ? f / DAYX : 1; return { i, prev: (i + 1) % 2, k: k * k * (3 - 2 * k) }; }
function dayTick(dt) {
  if (!S) return; S.dayAcc = (S.dayAcc || 9) + dt; if (S.dayAcc < .5) return; S.dayAcc = 0;
  const d = dayNow(), sig = d.i + ':' + d.k.toFixed(3); if (sig === S.daySig) return; S.daySig = sig;
  if (S.dayI !== undefined && S.dayI !== d.i && d.k < .5) G().toast(['🌅 Amanece un día nuevo…', '☀️ Llegó el mediodía.'][d.i]);
  S.dayI = d.i;
  if (S.W && S.W.sky) { const u = S.W.sky.material.uniforms; u.sk.value = d.i === 1 ? d.k : 1 - d.k; if (SKY.env[0] && QUAL.lv >= 2) { const e = SKY.env[d.k > .5 ? d.i : d.prev] || null; if (S.scene.environment !== e) S.scene.environment = e; } }
  if (S.hx && S.W) {
    const A = DAYH[d.prev], B = DAYH[d.i], k = d.k, u = S.W.sky.material.uniforms;
    ['top', 'mid', 'hor', 'sunC'].forEach(n => u[n].value.copy(mixC(A[n], B[n], k)));
    u.stars.value = A.st + (B.st - A.st) * k;
    S.W.sunDir.set(A.dir[0] + (B.dir[0] - A.dir[0]) * k, A.dir[1] + (B.dir[1] - A.dir[1]) * k, A.dir[2] + (B.dir[2] - A.dir[2]) * k).normalize();
    S.W.sunL.color.copy(mixC(A.sunL, B.sunL, k)); S.W.sunL.intensity = A.sI + (B.sI - A.sI) * k;
    S.W.hemi.color.copy(mixC(A.hs, B.hs, k)); S.W.hemi.groundColor.copy(mixC(A.hg, B.hg, k)); S.W.hemi.intensity = A.hI + (B.hI - A.hI) * k;
    S.scene.fog.color.copy(mixC(A.fog, B.fog, k)); S.scene.fog.density = A.fd + (B.fd - A.fd) * k; u.gnd.value.copy(S.scene.fog.color); if (S.scene.environment) S.W.hemi.intensity *= .6;
    S.renderer.toneMappingExposure = A.ex + (B.ex - A.ex) * k;
  } else if (S.KL && S.KL.cv) {
    const A = DAYK[d.prev], B = DAYK[d.i], k = d.k, L = S.KL, x = L.cv.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256), top = '#' + mixC(A.top, B.top, k).getHexString(), bot = '#' + mixC(A.bot, B.bot, k).getHexString();
    gr.addColorStop(0, top); gr.addColorStop(.62, bot); gr.addColorStop(1, bot); x.fillStyle = gr; x.fillRect(0, 0, 4, 256); L.tex.needsUpdate = true;
    L.sun.color.copy(mixC(A.sun, B.sun, k)); L.sun.intensity = A.sI + (B.sI - A.sI) * k;
    if (L.hemi) { L.hemi.color.copy(mixC(A.hs, B.hs, k)); L.hemi.groundColor.copy(mixC(A.hg, B.hg, k)); L.hemi.intensity = A.hI + (B.hI - A.hI) * k; }
    if (S.scene.fog) S.scene.fog.color.copy(mixC(A.fog, B.fog, k));
    if (S.W && S.W.sky) { S.W.sky.material.uniforms.gnd.value.copy(S.scene.fog.color); if (S.scene.environment && L.hemi) L.hemi.intensity *= .6; }
  }
}

/* ---------- vestimenta de la época: se encuentra rara vez en el camino o como premio de misión ---------- */
const SLOTS = [['hat', 'Sombrero'], ['shirt', 'Camiseta'], ['pants', 'Pantalones'], ['boots', 'Botas'], ['gloves', 'Guantes']];
const RAR = { c: ['Común', '#C9C2B4', 60], r: ['Rara', '#6FB6FF', 28], e: ['Épica', '#C77DFF', 9], l: ['Legendaria', '#FFB13B', 2.5], u: ['Única · nunca se pierde', '#4FD1C5', 0] };
const GEAR = [
  { id: 'turbante', s: 'hat', r: 'c', t: 'turban', c: '#E8DDC6', name: 'Turbante de lino', desc: 'Una tela larga enrollada en la cabeza para cubrirse del sol del camino.' },
  { id: 'tocado', s: 'hat', r: 'c', t: 'cloth', c: '#D9CBB0', c2: '#3A2A1A', name: 'Tocado de pastor', desc: 'Paño de lana sujeto con un cordón, como el de los pastores de Belén en las noches de frío.' },
  { id: 'gorro', s: 'hat', r: 'r', t: 'cap', c: '#8A5A3A', name: 'Gorro de lana de Belén', desc: 'Tejido con lana de las ovejas de los campos de Belén.' },
  { id: 'paja', s: 'hat', r: 'r', t: 'straw', c: '#D9B86A', name: 'Sombrero de paja del Jordán', desc: 'Trenzado con juncos que crecen a la orilla del río Jordán.' },
  { id: 'purpura', s: 'hat', r: 'e', t: 'cloth', c: '#6A2A6E', c2: '#E6B04A', name: 'Tocado de púrpura de Tiro', desc: 'La púrpura era el tinte más caro de la época. Lidia, en Filipos, vendía telas de este color (Hechos 16:14).' },
  { id: 'lino', s: 'shirt', r: 'c', t: 'plain', c: '#E4D8BE', name: 'Túnica de lino crudo', desc: 'La prenda de todos los días en Galilea, fresca para el calor.' },
  { id: 'indigo', s: 'shirt', r: 'c', t: 'plain', c: '#3E5A8A', name: 'Túnica teñida de índigo', desc: 'Lana teñida con plantas, del color del Mar de Galilea al atardecer.' },
  { id: 'rayas', s: 'shirt', r: 'r', t: 'stripes', c: '#C9B48A', c2: '#7A2E22', name: 'Túnica a rayas de Galilea', desc: 'Con dos franjas de color que bajan desde los hombros, muy usadas en la época.' },
  { id: 'pescador', s: 'shirt', r: 'r', t: 'stripes', c: '#8A9A8E', c2: '#2E4A5A', name: 'Túnica de pescador', desc: 'Corta y resistente, como la de Pedro y Andrés cuando echaban las redes.' },
  { id: 'sincostura', s: 'shirt', r: 'e', t: 'seamless', c: '#EFE6D2', c2: '#C9A04A', name: 'Túnica sin costura', desc: 'Tejida de una sola pieza de arriba abajo, como la túnica de Jesús que menciona Juan 19:23.' },
  { id: 'calzas', s: 'pants', r: 'c', t: 'wrap', c: '#CDBF9E', name: 'Calzas de lino', desc: 'Vendas de lino enrolladas en las piernas para caminar entre los espinos.' },
  { id: 'polainas', s: 'pants', r: 'c', t: 'wrap', c: '#6E5A44', name: 'Polainas de lana', desc: 'Abrigan las piernas en las noches del campo.' },
  { id: 'cabra', s: 'pants', r: 'r', t: 'plain', c: '#8A7A68', name: 'Calzas de pelo de cabra', desc: 'El pelo de cabra se tejía para carpas y prendas que aguantan la lluvia.' },
  { id: 'bordadas', s: 'pants', r: 'e', t: 'wrap', c: '#2E3E6A', c2: '#E6B04A', name: 'Calzas bordadas', desc: 'Con bordados dorados, dignas de una fiesta de bodas como la de Caná.' },
  { id: 'altas', s: 'boots', r: 'c', t: 'sandal', c: '#9A6A3E', name: 'Sandalias de caña alta', desc: 'Con tiras de cuero que suben por el tobillo.' },
  { id: 'cuero', s: 'boots', r: 'c', t: 'boot', c: '#6A4528', name: 'Botines de cuero', desc: 'Hechos por un curtidor, como Simón, el de Jope (Hechos 9:43).' },
  { id: 'pastor', s: 'boots', r: 'r', t: 'boot', c: '#3E2E22', name: 'Botas de pastor', desc: 'Firmes para subir a las colinas detrás de las ovejas.' },
  { id: 'caminante', s: 'boots', r: 'r', t: 'sandal', c: '#5A3A22', name: 'Sandalias de caminante', desc: 'Con suela gruesa y clavos, para los caminos largos entre ciudades.' },
  { id: 'rojas', s: 'boots', r: 'e', t: 'boot', c: '#8E2E22', name: 'Botas de cuero teñido', desc: 'Cuero teñido de rojo, un lujo que pocos se daban.' },
  { id: 'carpintero', s: 'gloves', r: 'c', t: 'wrap', c: '#8A6A44', name: 'Vendas de carpintero', desc: 'Protegen las manos en el taller, como en el de José en Nazaret.' },
  { id: 'red', s: 'gloves', r: 'c', t: 'glove', c: '#B8A27A', name: 'Guantes de pescador', desc: 'Para tirar de las redes en el Mar de Galilea.' },
  { id: 'lana', s: 'gloves', r: 'r', t: 'glove', c: '#7A4E3A', name: 'Guantes de lana', desc: 'Calentitos para las madrugadas en el desierto.' },
  { id: 'bronce', s: 'gloves', r: 'e', t: 'bracer', c: '#6A4528', c2: '#C08A3A', name: 'Brazaletes de bronce', desc: 'Pulidos y brillantes, con cuero por debajo.' },
  { id: 'capucha', s: 'hat', r: 'c', t: 'cloth', c: '#7A5A3A', c2: '#3A2A1A', name: 'Capucha de peregrino', desc: 'Para los que subían a Jerusalén a las fiestas, como la familia de Jesús (Lucas 2:41).' },
  { id: 'gorrogal', s: 'hat', r: 'c', t: 'cap', c: '#5A6A44', name: 'Gorro de Galilea', desc: 'Tejido a mano en las aldeas junto al lago.' },
  { id: 'veloazul', s: 'hat', r: 'r', t: 'cloth', c: '#3E5A8A', c2: '#E8DDC6', name: 'Velo azul con cordón', desc: 'El azul recordaba los mandamientos de Dios, como el cordón de los mantos (Números 15:38-39).' },
  { id: 'magos', s: 'hat', r: 'e', t: 'turban', c: '#5A2A70', name: 'Turbante de los magos', desc: 'Como el de los sabios que vinieron de Oriente siguiendo la estrella (Mateo 2:1-2).' },
  { id: 'sacerdote', s: 'hat', r: 'l', t: 'turban', c: '#F4EEE2', name: 'Turbante de lino fino', desc: 'Como el del sumo sacerdote, con la inscripción «Santo para el SEÑOR» (Éxodo 28:36-39).' },
  { id: 'arcilla', s: 'shirt', r: 'c', t: 'plain', c: '#A85A34', name: 'Túnica color arcilla', desc: 'Teñida con tierra roja, como la de los alfareros.' },
  { id: 'olivo', s: 'shirt', r: 'c', t: 'plain', c: '#66763E', name: 'Túnica verde olivo', desc: 'Del color de los olivares que rodean Jerusalén.' },
  { id: 'pastorm', s: 'shirt', r: 'r', t: 'stripes', c: '#8A7A5A', c2: '#3A2A1A', name: 'Manto de pastor', desc: 'Grueso y abrigado, para cuidar el rebaño de noche (Lucas 2:8).' },
  { id: 'grana', s: 'shirt', r: 'e', t: 'plain', c: '#8E1E2A', name: 'Túnica teñida de grana', desc: 'La mujer virtuosa vestía a los suyos de grana para el invierno (Proverbios 31:21).' },
  { id: 'jose', s: 'shirt', r: 'l', t: 'stripes', c: '#D9A63A', c2: '#3E5A9A', rb: 1, name: 'Túnica de muchos colores', desc: 'Como la que Jacob le hizo a su hijo José (Génesis 37:3). Casi nadie la encuentra.' },
  { id: 'arena', s: 'pants', r: 'c', t: 'wrap', c: '#C2A878', name: 'Calzas color arena', desc: 'Para caminar por el desierto de Judea sin llamar la atención.' },
  { id: 'lananegra', s: 'pants', r: 'c', t: 'plain', c: '#2E2824', name: 'Calzas de lana oscura', desc: 'Resistentes al polvo y al barro del camino.' },
  { id: 'viajero', s: 'pants', r: 'r', t: 'wrap', c: '#6A5038', c2: '#C9A04A', name: 'Calzas de viajero', desc: 'Con cintas de cuero, como las de los que llevaban el mensaje de ciudad en ciudad.' },
  { id: 'purpurap', s: 'pants', r: 'e', t: 'plain', c: '#5A2A6A', name: 'Calzas de púrpura', desc: 'Teñidas con el caracol de Tiro, el color de los reyes.' },
  { id: 'juncos', s: 'boots', r: 'c', t: 'sandal', c: '#B89A5E', name: 'Sandalias de juncos', desc: 'Livianas, tejidas con las cañas del río.' },
  { id: 'desierto', s: 'boots', r: 'c', t: 'boot', c: '#A8865A', name: 'Botas del desierto', desc: 'Para la arena caliente del camino a Jericó.' },
  { id: 'jordan', s: 'boots', r: 'r', t: 'boot', c: '#3E4A5A', name: 'Botas del Jordán', desc: 'Aguantan el agua y el barro de la orilla del río.' },
  { id: 'doradas', s: 'boots', r: 'e', t: 'sandal', c: '#C9A04A', name: 'Sandalias doradas', desc: 'Con hebillas de bronce que brillan al sol.' },
  { id: 'tsp', s: 'shirt', r: 'u', t: 'seamless', c: '#F4EEDC', c2: '#C9A04A', name: 'Túnica de Tras sus pasos', desc: 'La recibieron quienes terminaron Tras sus pasos antes del cinturón de la verdad. Es única y nunca se pierde.' },
  { id: 'servidor', s: 'hat', r: 'u', t: 'wrap', c: '#EFE6D2', c2: '#C9A04A', name: 'Pañuelo del servidor', desc: 'Por servir a los demás. Jesús estuvo entre sus discípulos como el que sirve (Lucas 22:27). Nunca se pierde.' },
  { id: 'siervo', s: 'boots', r: 'u', t: 'sandal', c: '#B07A3A', c2: '#EFE6D2', name: 'Sandalias del siervo', desc: 'Por crecer en humildad. Recuerdan que Jesús lavó los pies de sus discípulos (Juan 13:14-15). Nunca se pierden.' },
  { id: 'evangelio', s: 'boots', r: 'l', t: 'sandal', c: '#FFF2C8', name: 'Sandalias del evangelio', desc: 'Calzados con la disposición de anunciar el evangelio de la paz (Efesios 6:15).' },
  { id: 'vendaslino', s: 'gloves', r: 'c', t: 'wrap', c: '#D8CCB0', name: 'Vendas de lino', desc: 'Para proteger las manos al cosechar.' },
  { id: 'plata', s: 'gloves', r: 'r', t: 'bracer', c: '#5A4A3A', c2: '#C8CCD4', name: 'Brazaletes de plata', desc: 'Trabajados por un platero, con dibujos de vid.' },
  { id: 'oro', s: 'gloves', r: 'e', t: 'bracer', c: '#5A3A22', c2: '#E6B84A', name: 'Brazaletes de oro', desc: 'Un regalo de valor, como los que llevaba Rebeca (Génesis 24:22).' }
];
const GBY = Object.fromEntries(GEAR.map(x => [x.id, x]));
function gearState() { const p = G().P(); p.gear = p.gear || { own: [], eq: {} }; p.gear.own = p.gear.own || []; p.gear.eq = p.gear.eq || {}; return p.gear; }
function lookOf(p) { const gs = p.gear || {}, eq = {}; for (const k in (gs.eq || {})) if (GBY[gs.eq[k]]) eq[k] = gs.eq[k]; return Object.assign({}, p.avatar || {}, { gear: eq, ins: Object.keys((p.ins && typeof p.ins === 'object') ? p.ins : {}).filter(k => CBY[k]), glow: glowLv((p.glow && p.glow.pts) || 0), don: (() => { const I = (p.ins && typeof p.ins === 'object') ? p.ins : {}; for (const k in I) if (I[k] && I[k].don) return I[k].don; return null; })() }); }
function gearOn(av) { const o = {}, e = (av && av.gear) || {}; SLOTS.forEach(([s]) => { if (GBY[e[s]]) o[s] = GBY[e[s]]; }); return o; }
function gearRoll() {
  const st = gearState(), left = GEAR.filter(x => !st.own.includes(x.id) && x.r !== 'u'); if (!left.length) return null;
  const w = left.map(x => RAR[x.r][2]), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, i = 0; while (r > w[i]) r -= w[i++];
  return left[Math.min(i, left.length - 1)];
}
function gearGive(it, why) {
  if (!it) return; const st = gearState(); if (st.own.includes(it.id)) return; st.own.push(it.id); G().save();
  const el = document.getElementById('v3pop'); if (!el) return; const R = RAR[it.r];
  el.innerHTML = `<span class="ic" style="background:${R[1]}33;border:1px solid ${R[1]}">${icoGear(it)}</span><span class="tx"><small style="color:${R[1]}">${esc(why)} · ${R[0]}</small><b>${esc(it.name)}</b><em class="gp-tip">Ponétela desde la mochila</em></span>`;
  el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(pop.t); pop.t = setTimeout(() => { el.classList.remove('on'); el.hidden = true; }, 4200);
  tone3d(); const b = document.getElementById('v3bag'); if (b) { b.classList.remove('nw'); void b.offsetWidth; b.classList.add('nw'); }
}
const GICO = {
  hat: '<path d="M4 15c0-4 3.6-8 8-8s8 4 8 8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 16h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  shirt: '<path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a3 3 0 0 1-8 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  pants: '<path d="M6 3h12l1 18h-5l-2-11-2 11H5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  boots: '<path d="M7 3h6v10l6 3v4H5V3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  gloves: '<path d="M7 21v-8L5 9a1.5 1.5 0 0 1 2.5-1.6L9 10V4a1.5 1.5 0 0 1 3 0v6V3a1.5 1.5 0 0 1 3 0v7V5a1.5 1.5 0 0 1 3 0v9c0 4-2 7-5 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
};
// ropa puesta sobre el modelo Hero
function dressHero(d, M, k, P) {
  const { hip, chest, head, L, R, AL, AR } = P;
  if (d.pants) { const pm = M(d.pants.c, .95); [L, R].forEach(l => { l.th.material = pm; l.sh.material = pm; if (d.pants.t === 'wrap') for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(.059, .01, 5, 14), M(d.pants.c2 || new THREE.Color(d.pants.c).multiplyScalar(.75), .9)); w.rotation.x = Math.PI / 2 + (i % 2 ? .25 : -.25); w.position.y = -.08 - i * .065 * k; l.knee.add(w); } }); }
  if (d.boots) { const bm = M(d.boots.c, .8); [L, R].forEach(l => { l.ft.material = bm; if (d.boots.t === 'boot') { l.straps.forEach(s => s.visible = false); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.064, .06, .2, 12), bm); sh.position.y = .08; l.foot.add(sh); const toe = new THREE.Mesh(new THREE.SphereGeometry(.058, 12, 10), bm); toe.scale.set(1, .7, 1.5); toe.position.set(0, .025, .09); l.foot.add(toe); } else { l.straps.forEach(s => s.material = bm); for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(.058, .008, 5, 12), bm); w.rotation.x = Math.PI / 2; w.position.y = .1 + i * .05; l.foot.add(w); } } }); }
  if (d.gloves) { const gm = M(d.gloves.c, .85); [AL, AR].forEach(a => { a.palm.material = gm; a.th.material = gm; if (d.gloves.t === 'bracer') { const b = new THREE.Mesh(new THREE.CylinderGeometry(.052, .046, .12, 12), M(d.gloves.c2, .35, { metalness: .7 })); b.position.y = -.16 * k; a.el.add(b); } else { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .046, .07, 10), gm); c.position.y = -.21 * k; a.el.add(c); if (d.gloves.t === 'wrap') a.fa.material = gm; } }); }
  if (d.hat) { const h = d.hat, hm = M(h.c, h.t === 'straw' ? .8 : .95, { side: THREE.DoubleSide }), hg = new THREE.Group(); head.add(hg); P.hideHair();
    if (h.t === 'turban') { for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.105 - i * .012, .03, 8, 22), hm); t.rotation.x = Math.PI / 2 - .2 + (i % 2) * .12; t.position.y = .05 + i * .03; hg.add(t); } const top = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hm); top.position.y = .1; hg.add(top); }
    else if (h.t === 'cloth') { const c = new THREE.Mesh(new THREE.SphereGeometry(.13, 22, 14, 0, Math.PI * 2, 0, Math.PI * .55), hm); c.position.y = .01; hg.add(c); const back = new THREE.Mesh(new THREE.CylinderGeometry(.13, .21, .34, 18, 1, true, Math.PI * .65, Math.PI * .7), hm); back.position.set(0, -.15, -.01); hg.add(back); const cord = new THREE.Mesh(new THREE.TorusGeometry(.124, .014, 6, 26), M(h.c2, .6, { metalness: h.r === 'e' ? .6 : 0 })); cord.rotation.x = Math.PI / 2 - .15; cord.position.y = .05; hg.add(cord); }
    else if (h.t === 'cap') { const c = new THREE.Mesh(new THREE.SphereGeometry(.122, 20, 12, 0, Math.PI * 2, 0, Math.PI * .5), hm); c.scale.y = 1.12; c.position.y = .02; hg.add(c); const rim = new THREE.Mesh(new THREE.TorusGeometry(.118, .02, 6, 22), hm); rim.rotation.x = Math.PI / 2; rim.position.y = .025; hg.add(rim); }
    else if (h.t === 'straw') { const brim = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .012, 26), hm); brim.position.y = .07; hg.add(brim); const cr = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .1, 18), hm); cr.position.y = .12; hg.add(cr); const band = new THREE.Mesh(new THREE.TorusGeometry(.117, .01, 6, 22), M('#7A3A22', .8)); band.rotation.x = Math.PI / 2; band.position.y = .085; hg.add(band); } }
  if (d.shirt) { const s = d.shirt; if (s.t === 'stripes') [-1, 1].forEach(sx => { const b = new THREE.Mesh(new THREE.BoxGeometry(.035, .5 * k, .01), M(s.c2, .9)); b.position.set(sx * .07, .26 * k, .152); chest.add(b); const b2 = b.clone(); b2.position.z = -.152; chest.add(b2); });
    if (s.t === 'seamless') { const col = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 6, 20), M(s.c2, .4, { metalness: .5 })); col.rotation.x = Math.PI / 2; col.position.y = .52 * k; chest.add(col); } }
}
function dressKid(d, P) {
  const { head, M } = P; if (!d.hat) return; const h = d.hat, hm = M(h.c), hg = new THREE.Group(); head.add(hg);
  if (h.t === 'turban' || h.t === 'cap') { const c = new THREE.Mesh(new THREE.SphereGeometry(.27, 22, 14, 0, Math.PI * 2, 0, Math.PI * .5), hm); c.scale.y = h.t === 'turban' ? 1.15 : .95; c.position.y = .05; hg.add(c); if (h.t === 'turban') for (let i = 0; i < 2; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.26 - i * .04, .045, 8, 22), hm); t.rotation.x = Math.PI / 2; t.position.y = .08 + i * .07; hg.add(t); } }
  else if (h.t === 'cloth') { const c = new THREE.Mesh(new THREE.SphereGeometry(.285, 22, 14, 0, Math.PI * 2, 0, Math.PI * .58), hm); c.position.y = .02; hg.add(c); const back = new THREE.Mesh(new THREE.CylinderGeometry(.27, .33, .36, 18, 1, true, Math.PI * .65, Math.PI * .7), new THREE.MeshStandardMaterial({ color: h.c, side: THREE.DoubleSide })); back.position.y = -.14; hg.add(back); const cord = new THREE.Mesh(new THREE.TorusGeometry(.27, .025, 6, 24), M(h.c2)); cord.rotation.x = Math.PI / 2 - .1; cord.position.y = .1; hg.add(cord); }
  else if (h.t === 'straw') { const brim = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .02, 26), hm); brim.position.y = .16; hg.add(brim); const cr = new THREE.Mesh(new THREE.CylinderGeometry(.2, .25, .2, 18), hm); cr.position.y = .26; hg.add(cr); }
}
// cambiar la ropa del personaje en el momento
function reLook() {
  if (!S) return; const p = G().P(), look = lookOf(p), old = S.av, rig = S.hx || H3.ok, av = rig ? buildHeroAvatar(look) : buildAvatar(look, S.hx); if (rig) av.traverse(o => { if (o.isMesh) o.castShadow = true; });
  av.position.copy(old.position); av.rotation.copy(old.rotation); if (S.carry) av.add(S.carry); if (S.meP) { S.meP.av = av; if (S.meP.bubble) av.add(S.meP.bubble); }
  S.scene.remove(old); S.scene.add(av); S.av = av; if (MP.code) mpSend({ t: 'look', id: MP.peer && MP.peer.id, avatar: look });
}
// fardo brillante que aparece muy de vez en cuando
function gearDropTick(dt, t) {
  if (!S || document.getElementById('view3d').hidden) return;
  const dr = S.gdrop;
  if (dr) { dr.life -= dt; dr.m.rotation.y = t * 1.2; dr.m.position.y = dr.y + .9 + Math.sin(t * 2.2) * .12; dr.beam.material.opacity = .28 + Math.sin(t * 3) * .1;
    const a = S.av.position; if ((dr.m.position.x - a.x) ** 2 + (dr.m.position.z - a.z) ** 2 < 2.8) { S.scene.remove(dr.m); S.gdrop = null; gearGive(dr.it, '¡Encontraste ropa de la época!'); return; }
    if (dr.life <= 0) { S.scene.remove(dr.m); S.gdrop = null; } return; }
  if (S.walking || S.freeMoving) S.gwalk = (S.gwalk || 0) + dt;
  if (S.gnext === undefined) S.gnext = 150 + Math.random() * 150;
  if (S.gwalk < S.gnext) return; S.gwalk = 0; S.gnext = 200 + Math.random() * 220; if (Math.random() > .6) return;
  const it = gearRoll(); if (!it) return; const a = S.av.position, fr = frontier(); let x = 0, z = 0, okp = false;
  for (let i = 0; i < 12 && !okp; i++) { const ang = S.yaw + (Math.random() - .5) * 2.2, dd = 12 + Math.random() * 12; x = a.x + Math.sin(ang) * dd; z = a.z + Math.cos(ang) * dd; okp = Math.abs(x) < XB - 3 && z > fr + 2 && z < 4; }
  if (!okp) return; const y = S.W ? Math.max(0, S.W.hAt(x, z)) : 0, R = RAR[it.r][1], m = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: it.c, roughness: .8, emissive: R, emissiveIntensity: .25 });
  const bun = new THREE.Mesh(new THREE.SphereGeometry(.3, 14, 10), cm); bun.scale.set(1.2, .75, 1); m.add(bun); const knot = new THREE.Mesh(new THREE.ConeGeometry(.12, .22, 8), cm); knot.position.y = .26; m.add(knot);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 6, 14), new THREE.MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: .8 })); tie.rotation.x = Math.PI / 2; tie.position.y = .16; m.add(tie);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.12, .5, 14, 14, 1, true), new THREE.MeshBasicMaterial({ color: R, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.y = 6.5; m.add(beam);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 32), new THREE.MeshBasicMaterial({ color: R, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = -.85; m.add(halo);
  m.position.set(x, y + .9, z); S.scene.add(m); S.gdrop = { m, beam, it, y, life: 240 };
  G().toast('✨ Algo brilla cerca del camino… ¡andá a buscarlo antes de que desaparezca!');
}
function bagWear(el, pick) {
  const st = gearState(), box = el.querySelector('.bag-wear'); if (!box) return; const cur = pick || box.dataset.s || 'hat'; box.dataset.s = cur;
  const mine = GEAR.filter(x => x.s === cur && st.own.includes(x.id)), on = st.eq[cur];
  box.innerHTML = `<h4>Vestimenta <span>${st.own.length} de ${GEAR.length} encontradas</span></h4>
    <div class="bw-slots">${SLOTS.map(([s, n]) => `<button class="bw-s${s === cur ? ' on' : ''}" data-s="${s}"><svg viewBox="0 0 24 24" aria-hidden="true">${GICO[s]}</svg><span>${n}</span>${st.eq[s] ? '<i></i>' : ''}</button>`).join('')}</div>
    <div class="bw-list">${mine.length ? `<button class="bw-it${!on ? ' on' : ''}" data-id=""><b>Lo de siempre</b><span>La ropa con la que empezaste.</span></button>` + mine.map(x => `<button class="bw-it${on === x.id ? ' on' : ''}" data-id="${x.id}" style="--rc:${RAR[x.r][1]}"><i style="background:${x.c}"></i><div><small>${RAR[x.r][0]}</small><b>${esc(x.name)}</b><span>${esc(x.desc)}</span></div></button>`).join('')
      : `<p class="bag-empty">Todavía no tenés ${SLOTS.find(q => q[0] === cur)[1].toLowerCase()}. La ropa aparece muy de vez en cuando brillando cerca del camino, y a veces llega como premio al terminar una misión.</p>`}</div>`;
  box.querySelectorAll('.bw-s').forEach(b => b.onclick = () => bagWear(el, b.dataset.s));
  box.querySelectorAll('.bw-it').forEach(b => b.onclick = () => { if (b.dataset.id) st.eq[cur] = b.dataset.id; else delete st.eq[cur]; G().save(); reLook(); bagWear(el, cur); });
}

/* ---------- puertas gigantes de los otros cursos (y la escalera al cielo de Maranata) ---------- */
const DOORS = [
  { ico: '👑', id: 'maranata', k: 'stair', r: 0, side: 1, f: .2, dx: 10 * WS, name: 'Escuela Maranata', sub: '150 capítulos de los últimos tiempos', c: '#E6C46A', txt: 'Una escalera al cielo para estudiar lo que la Biblia enseña sobre el regreso de Jesús.' },
  { ico: '🌳', id: 'genesis', k: 'door', r: 0, side: -1, f: .82, dx: 16 * WS, name: 'Génesis', sub: 'Los comienzos', c: '#7FB38A', txt: 'La creación, Abraham, José y las promesas de Dios desde el principio.' },
  { ico: '📜', id: 'exodo', k: 'door', r: 1, side: 1, f: .32, dx: 16 * WS, name: 'Éxodo', sub: 'La gran salida', c: '#D98A5A', txt: 'Moisés, las plagas, el mar abierto y el camino por el desierto.' },
  { ico: '🔥', id: 'hechos', k: 'door', r: 2, side: -1, f: .3, dx: 16 * WS, name: 'Hechos', sub: 'La iglesia en marcha', c: '#6FA6D9', txt: 'Pentecostés, Pedro, Pablo y el evangelio llegando hasta lo último de la tierra.' }
];
const ST = { L: 44, H: 27, N: 54, W: 2.3, P: 8 };
function planDoors(g) {
  return DOORS.map(d => { const [a, b] = regionZ(g, d.r), z = a + (b - a) * d.f, x = d.side * d.dx, q = { ...d, x, z, flat: [] };
    if (d.k === 'stair') { for (let u = -3; u <= ST.L + ST.P + 2; u += 2) for (let v = -4; v <= 4; v += 2) q.flat.push([x + d.side * u, z + v]); }
    else { q.flat.push([x, z]); for (const r of [4, 8, 11]) for (let i = 0; i < 14; i++) { const an = i / 14 * 6.28; q.flat.push([x + Math.cos(an) * r, z + Math.sin(an) * r]); } }
    return q; });
}
function stairH(x, z) {
  const d = S && S.stair; if (!d) return -1; const u = (x - d.x) * d.side, v = Math.abs(z - d.z);
  if (u < 0 || u > ST.L + ST.P) return -1; if (u <= ST.L) return v <= ST.W ? d.y0 + Math.min(ST.N, Math.floor(u / ST.L * ST.N) + 1) * ST.H / ST.N : -1;
  return v <= 4.2 ? d.y0 + ST.H : -1;
}
/* ---------- Ambiente vivo (todo procedural, sin licencias): fuego con luz que titila, humo y brasas, estandartes al viento,
   ondas en el agua, aves y mariposas. Un solo dibujo instanciado por tipo para que ande bien en el celular. ---------- */
const AMB = { src: [], uT: { value: 0 }, lights: [], next: 0, ban: [], cap: 220, im: null, sm: null, em: null, ready: false };
const AMB_GLSL = 'float ah(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float an(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ah(i),ah(i+vec2(1.,0.)),f.x),mix(ah(i+vec2(0.,1.)),ah(i+vec2(1.,1.)),f.x),f.y);}';
// billboard instanciado: el centro sale de la instancia, el tamaño de su escala
const AMB_VB = 'attribute float aSeed;uniform float uT;varying vec2 vUv;varying float vS;varying float vL;';
function ambFlameMat() {
  return new THREE.ShaderMaterial({ uniforms: { uT: AMB.uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: AMB_VB + 'void main(){vUv=uv;vS=aSeed;vec3 c=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float sc=length(instanceMatrix[0].xyz);vec4 mv=modelViewMatrix*vec4(c,1.);float fl=1.+.13*sin(uT*13.+aSeed*7.)+.08*sin(uT*7.3+aSeed*3.);mv.x+=position.x*sc*.62;mv.y+=(position.y+.5)*sc*fl;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform float uT;varying vec2 vUv;varying float vS;' + AMB_GLSL + 'void main(){float y=vUv.y,x=(vUv.x-.5)*2.;float t=uT*2.3+vS*10.;float nn=an(vec2(x*2.2,y*3.-t*1.9))*.6+an(vec2(x*5.,y*6.5-t*3.2))*.4;float w=(1.-y)*.95*(.5+.5*nn);float s=smoothstep(w,w-.3,abs(x+(nn-.5)*.4*y));s*=smoothstep(1.,.3,y+nn*.28)*smoothstep(0.,.07,y);vec3 c=mix(vec3(1.,.32,.04),vec3(1.,.82,.36),smoothstep(.15,.85,s*(1.-y*.55)));c=mix(c,vec3(1.,1.,.86),smoothstep(.72,1.,s)*(1.-y));gl_FragColor=vec4(c*s*1.7,s);}' });
}
function ambSmokeMat() {
  return new THREE.ShaderMaterial({ uniforms: { uT: AMB.uT }, transparent: true, depthWrite: false,
    vertexShader: AMB_VB + 'void main(){vUv=uv;vS=aSeed;vec3 c=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float sc=length(instanceMatrix[0].xyz);float l=fract(uT*.16+aSeed);vL=l;vec3 p=c+vec3(sin(aSeed*40.+uT*.7)*.35*l+l*.6,l*4.2*sc,cos(aSeed*33.)*.3*l);vec4 mv=modelViewMatrix*vec4(p,1.);float s=sc*(.35+l*1.6);mv.xy+=position.xy*s;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec2 vUv;varying float vL;varying float vS;' + AMB_GLSL + 'void main(){vec2 p=vUv-.5;float d=length(p);float n=an(p*4.+vS*9.);float a=smoothstep(.5,.05,d)*(.55+.45*n)*smoothstep(0.,.12,vL)*(1.-vL)*.32;gl_FragColor=vec4(vec3(.42,.4,.38)+n*.08,a);}' });
}
function ambEmberMat() {
  return new THREE.ShaderMaterial({ uniforms: { uT: AMB.uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: AMB_VB + 'void main(){vUv=uv;vS=aSeed;vec3 c=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float sc=length(instanceMatrix[0].xyz);float l=fract(uT*.45+aSeed*3.7);vL=l;vec3 p=c+vec3(sin(aSeed*91.+l*6.)*.5*l*sc,l*2.6*sc,cos(aSeed*57.+l*5.)*.5*l*sc);vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=position.xy*.05*(1.-l*.6);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec2 vUv;varying float vL;void main(){float d=length(vUv-.5);float a=smoothstep(.5,0.,d)*(1.-vL);gl_FragColor=vec4(vec3(1.,.62,.2)*a*2.,a);}' });
}
// registra una fuente de fuego: tamaño de llama, humo y brasas (las luces se reparten entre las más cercanas)
function ambFire(x, y, z, size, o) { o = o || {}; const f = { x, y, z, s: size, smoke: o.smoke !== false && size > .3, emb: o.emb !== false && size > .25, light: o.light !== false, i: -1 }; AMB.src.push(f); if (AMB.ready) ambPut(f); return f; }
const _am = { m: null };
function ambPut(f) {
  if (!AMB.im) return; const k = AMB.im.count; if (k >= AMB.cap) return; f.i = k; const m = _am.m || (_am.m = new THREE.Matrix4());
  m.makeScale(f.s, f.s, f.s); m.setPosition(f.x, f.y, f.z); AMB.im.setMatrixAt(k, m); AMB.im.count = k + 1; AMB.im.instanceMatrix.needsUpdate = true; AMB.im.computeBoundingSphere();
  f.si = AMB.sm.count; f.ei = AMB.em.count;
  if (f.smoke) for (let j = 0; j < 5; j++) { const n = AMB.sm.count; if (n >= AMB.cap * 5) break; m.makeScale(f.s, f.s, f.s); m.setPosition(f.x, f.y + f.s * .7, f.z); AMB.sm.setMatrixAt(n, m); AMB.sm.count = n + 1; }
  if (f.emb) for (let j = 0; j < 6; j++) { const n = AMB.em.count; if (n >= AMB.cap * 6) break; m.makeScale(f.s, f.s, f.s); m.setPosition(f.x, f.y + f.s * .3, f.z); AMB.em.setMatrixAt(n, m); AMB.em.count = n + 1; }
  AMB.sm.instanceMatrix.needsUpdate = true; AMB.em.instanceMatrix.needsUpdate = true; AMB.sm.computeBoundingSphere(); AMB.em.computeBoundingSphere();
}
function ambOff(f) { if (!f) return; f.light = false; AMB.src = AMB.src.filter(q => q !== f); if (f.i < 0 || !AMB.im) return; const m = _am.m || (_am.m = new THREE.Matrix4()); m.makeScale(0, 0, 0); AMB.im.setMatrixAt(f.i, m); AMB.im.instanceMatrix.needsUpdate = true;
  for (let j = f.si; j < AMB.sm.count && j < f.si + (f.smoke ? 5 : 0); j++) AMB.sm.setMatrixAt(j, m); for (let j = f.ei; j < AMB.em.count && j < f.ei + (f.emb ? 6 : 0); j++) AMB.em.setMatrixAt(j, m); AMB.sm.instanceMatrix.needsUpdate = true; AMB.em.instanceMatrix.needsUpdate = true; }
function ambReset() { AMB.src = []; AMB.ready = false; AMB.im = AMB.sm = AMB.em = null; AMB.lights = []; AMB.ban = []; }
function ambInst(geo, mat, n, seedMul) { const g = geo.clone(), seeds = new Float32Array(n); for (let i = 0; i < n; i++) seeds[i] = Math.random() * (seedMul || 1); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1)); const im = new THREE.InstancedMesh(g, mat, n); im.count = 0; im.frustumCulled = false; return im; }
function ambBuild(scene) {
  const pl = new THREE.PlaneGeometry(1, 1);
  AMB.im = ambInst(pl, ambFlameMat(), AMB.cap); AMB.im.renderOrder = 4; scene.add(AMB.im);
  AMB.sm = ambInst(pl, ambSmokeMat(), AMB.cap * 5); AMB.sm.renderOrder = 3; scene.add(AMB.sm);
  AMB.em = ambInst(pl, ambEmberMat(), AMB.cap * 6, 1); AMB.em.renderOrder = 4; scene.add(AMB.em);
  const nL = [0, 2, 3, 5][qEarly()] - (matchMedia('(pointer: coarse)').matches && qEarly() > 1 ? 1 : 0); AMB.lights = []; for (let i = 0; i < nL; i++) { const l = new THREE.PointLight('#FF9A42', 0, 14, 1.7); l.userData.f = null; scene.add(l); AMB.lights.push(l); }
  AMB.ready = true; AMB.src.forEach(ambPut);
}
// antorcha de pared o de pie, brasero de bronce, lámpara de aceite y vela
const AMBM = {};
const ambM = (k, c, o) => AMBM[k] || (AMBM[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {})));
function ambTorch(parent, x, y, z, o) {
  o = o || {}; const g = new THREE.Group(), wood = ambM('twood', '#4A3020', { roughness: .9 }), iron = ambM('tiron', '#3A332C', { metalness: .6, roughness: .45 });
  if (!o.wall) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 2.2, 8), wood); p.position.y = 1.1; g.add(p); }
  else { const br = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .5), iron); br.position.set(0, 0, .25); g.add(br); const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .7, 8), wood); st.position.set(0, .25, .48); st.rotation.x = .25; g.add(st); }
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.17, .09, .26, 10, 1, true), iron); cup.material.side = THREE.DoubleSide; cup.position.set(0, o.wall ? .62 : 2.25, o.wall ? .56 : 0); g.add(cup);
  const coal = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), ambM('coal', '#FF7A2A', { emissive: '#FF5A1A', emissiveIntensity: 2.5 })); coal.position.copy(cup.position); coal.position.y += .08; g.add(coal);
  g.position.set(x, y, z); if (o.ry) g.rotation.y = o.ry; parent.add(g); g.updateMatrixWorld(true); const w = new THREE.Vector3(); coal.getWorldPosition(w); ambFire(w.x, w.y + .02, w.z, (o.size || .62) * (o.k || 1)); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function ambBrazier(parent, x, y, z, s) {
  s = s || 1; const g = new THREE.Group(), br = ambM('bronze', '#B8853A', { metalness: .85, roughness: .32 });
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.4, 6), br); const a = i / 3 * 6.283; l.position.set(Math.cos(a) * .32, .62, Math.sin(a) * .32); l.rotation.set(Math.sin(a) * .25, 0, -Math.cos(a) * .25); g.add(l); }
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(.62, 18, 10, 0, 6.283, Math.PI * .5, Math.PI * .5), br); bowl.material.side = THREE.DoubleSide; bowl.position.y = 1.55; g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.62, .05, 8, 28), br); rim.rotation.x = Math.PI / 2; rim.position.y = 1.55; g.add(rim);
  const coal = new THREE.Mesh(new THREE.CircleGeometry(.56, 18), ambM('coal', '#FF7A2A', { emissive: '#FF5A1A', emissiveIntensity: 2.5 })); coal.rotation.x = -Math.PI / 2; coal.position.y = 1.45; g.add(coal);
  g.scale.setScalar(s); g.position.set(x, y, z); parent.add(g); g.updateMatrixWorld(true); const w = new THREE.Vector3(); coal.getWorldPosition(w); ambFire(w.x, w.y, w.z, 1.25 * s); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function ambLamp(parent, x, y, z, s) { s = s || 1; const l = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 6), ambM('clay2', '#A8784A')); l.scale.set(1.4, .55, 1) ; l.scale.multiplyScalar(s); l.position.set(x, y + .03 * s, z); parent.add(l); parent.updateMatrixWorld(true); const w = new THREE.Vector3(); l.getWorldPosition(w); ambFire(w.x + .08 * s, w.y + .03 * s, w.z, .16 * s, { smoke: false, emb: false }); return l; }
// estandarte que flamea, colgado de un travesaño
function ambBanner(parent, x, y, z, w, h, color, o) {
  o = o || {}; const geo = new THREE.PlaneGeometry(w, h, 6, 12); geo.translate(0, -h / 2, 0);
  const m = new THREE.MeshStandardMaterial({ color, roughness: .85, side: THREE.DoubleSide, map: o.map || null });
  m.onBeforeCompile = sh => { sh.uniforms.uT = AMB.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat k=-position.y/' + h.toFixed(2) + ';transformed.z+=sin(uT*2.4+position.y*1.6+position.x*2.)*.12*k+sin(uT*4.1+position.y*3.)*.04*k;transformed.x+=sin(uT*1.7+position.y)*.05*k;'); };
  const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); if (o.ry) b.rotation.y = o.ry; b.castShadow = true; parent.add(b);
  if (o.rod !== false) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, w + .3, 8), ambM('bronze', '#B8853A', { metalness: .85, roughness: .32 })); r.rotation.z = Math.PI / 2; r.position.set(x, y + .02, z); if (o.ry) { r.rotation.set(0, o.ry, Math.PI / 2); } parent.add(r); }
  return b;
}
// ondas en el agua: anillos procedurales sobre la superficie
function ambRipples(scene, x, y, z, r) {
  const m = new THREE.ShaderMaterial({ uniforms: { uT: AMB.uT, R: { value: r } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform float uT,R;varying vec2 vP;' + AMB_GLSL + 'void main(){float a=0.;for(int i=0;i<4;i++){float fi=float(i);vec2 c=vec2(ah(vec2(fi,floor(uT*.25+fi*.37)))-.5,ah(vec2(fi*3.1,floor(uT*.25+fi*.37)))-.5)*R*1.4;float l=fract(uT*.25+fi*.37);float d=length(vP-c);a+=smoothstep(.06,0.,abs(d-l*R*.35))*(1.-l)*.5;}float sp=pow(an(vP*1.6+uT*.4),8.)*.9;float e=smoothstep(R,R*.85,length(vP));gl_FragColor=vec4(vec3(1.,1.,.96)*(a+sp)*e,(a+sp)*e*.6);}' });
  const p = new THREE.Mesh(new THREE.CircleGeometry(r, 48), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.renderOrder = 2; scene.add(p); return p;
}
// aves en el cielo y mariposas cerca de las flores (vuelan con el shader)
function ambFlyers(scene, allPts, hx, zMax) {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const bird = new THREE.BufferGeometry(); bird.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .25, -.7, 0, -.1, 0, 0, -.2, 0, 0, .25, 0, 0, -.2, .7, 0, -.1], 3)); bird.setAttribute('wing', new THREE.Float32BufferAttribute([0, 1, 0, 0, 0, 1], 1));
  const fly = (geo, n, col, vs) => { const g = geo.clone(), seeds = new Float32Array(n); for (let i = 0; i < n; i++) seeds[i] = Math.random(); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1)); const m = new THREE.ShaderMaterial({ uniforms: { uT: AMB.uT, C: { value: new THREE.Color(col) } }, side: THREE.DoubleSide, vertexShader: vs, fragmentShader: 'uniform vec3 C;varying float vB;void main(){gl_FragColor=vec4(C*(.75+vB*.35),1.);}' }); const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; scene.add(im); return im; };
  const nb = coarse ? 18 : 30, birds = fly(bird, nb, hx ? '#2A2420' : '#3A3440', 'attribute float aSeed;attribute float wing;uniform float uT;varying float vB;void main(){vec3 c=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float sp=.12+aSeed*.08;float a=uT*sp+aSeed*6.28;float r=14.+aSeed*16.;vec3 o=c+vec3(cos(a)*r,sin(uT*.5+aSeed*9.)*1.5,sin(a)*r);float flap=sin(uT*9.+aSeed*20.);vec3 p=position*1.4;p.y+=wing*abs(p.x)*flap*.9;float h=a+1.5708;mat2 R=mat2(cos(h),-sin(h),sin(h),cos(h));p.xz=R*p.xz;vB=wing;gl_Position=projectionMatrix*modelViewMatrix*vec4(o+p,1.);}');
  const M4 = new THREE.Matrix4(), R = rng(515); for (let i = 0; i < nb; i++) { const p = allPts[Math.floor(R() * allPts.length)]; M4.makeTranslation(p[0] + (R() - .5) * 30, 18 + R() * 14, p[1]); birds.setMatrixAt(i, M4); }
  const wingQ = new THREE.BufferGeometry(); wingQ.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .06, -.11, 0, .1, -.1, 0, -.08, 0, 0, .06, -.1, 0, -.08, 0, 0, -.06, 0, 0, .06, .11, 0, .1, .1, 0, -.08, 0, 0, .06, .1, 0, -.08, 0, 0, -.06], 3)); wingQ.setAttribute('wing', new THREE.Float32BufferAttribute([0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0], 1));
  const nf = coarse ? 40 : 80, cols = ['#FFD24A', '#FF8FB0', '#FFFFFF', '#8FC8FF', '#FFA44A'];
  const bf = []; for (let c = 0; c < cols.length; c++) bf.push(fly(wingQ, Math.ceil(nf / cols.length), cols[c], 'attribute float aSeed;attribute float wing;uniform float uT;varying float vB;void main(){vec3 c=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float t=uT*.6+aSeed*20.;vec3 o=c+vec3(sin(t*1.3)*1.6+sin(t*3.1)*.3,.6+sin(t*2.)*.35+abs(sin(t*5.))*.15,cos(t*1.1)*1.6);float flap=abs(sin(uT*16.+aSeed*30.));vec3 p=position*1.3;p.y+=wing*abs(p.x)*(flap*2.-.5)*1.4;float h=t*1.3;mat2 R=mat2(cos(h),-sin(h),sin(h),cos(h));p.xz=R*p.xz;vB=wing;gl_Position=projectionMatrix*modelViewMatrix*vec4(o+p,1.);}'));
  bf.forEach(im => { for (let i = 0; i < im.count; i++) { const p = allPts[Math.floor(R() * allPts.length)], a = R() * 6.28, r = 2 + R() * 7; M4.makeTranslation(p[0] + Math.cos(a) * r, (S.W ? S.W.hAt(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r) : 0), p[1] + Math.sin(a) * r); im.setMatrixAt(i, M4); } });
  AMB.flyers = { birds, bf };
}
// las luces de fuego van a las llamas más cercanas al jugador, con parpadeo
function ambTick(dt, t) {
  if (!S || !AMB.ready) return; AMB.uT.value = t; const a = S.av.position;
  if ((AMB.next -= dt) <= 0) { AMB.next = .5; const L = AMB.src.filter(f => f.light).map(f => [f, (f.x - a.x) ** 2 + (f.z - a.z) ** 2]).filter(v => v[1] < 900).sort((p, q) => p[1] - q[1]); AMB.lights.forEach((l, i) => { const v = L[i]; l.userData.f = v ? v[0] : null; if (v) l.position.set(v[0].x, v[0].y + .4, v[0].z); }); }
  AMB.lights.forEach((l, i) => { const f = l.userData.f; if (!f) { l.intensity = 0; return; } const fl = .78 + Math.sin(t * 13 + i * 3) * .1 + Math.sin(t * 7.7 + i) * .08 + Math.sin(t * 23 + i * 5) * .04; l.intensity = (S.hx ? 9 : 5) * Math.min(2.4, f.s * 1.5) * fl; l.distance = 6 + f.s * 9; });
}
// ambiente de cada lugar: antorchas en las plazas, braseros en el templo, lámparas en los puestos, estandartes, agua viva
function ambWorld(scene, W, allPts, zMax, hx) {
  const yAt = (x, z) => W.hAt(x, z), R = rng(4242), free = (x, z) => !blockedAt(x, z) && W.dAt(x, z) > 1.4;
  ambBuild(scene);
  for (const p of (S.pois || [])) {
    if (/taller|inn|upper|roofhouse|feeding|lake/.test(p.k)) { let c = 0; for (let t = 0; t < 40 && c < (p.k === 'taller' ? 6 : 3); t++) { const a = R() * 6.28, r = (p.k === 'taller' ? 9 : 6) + R() * 4, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (!free(x, z)) continue; ambTorch(scene, x, yAt(x, z), z); c++; } }
    if (p.k === 'taller') { for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + .4, x = p.x + Math.cos(a) * 13.5, z = p.z + Math.sin(a) * 13.5; if (!free(x, z)) continue; const y = yAt(x, z), pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 4.2, 8), ambM('twood', '#4A3020')); pole.position.set(x, y + 2.1, z); pole.castShadow = true; scene.add(pole); ambBanner(scene, x, y + 4, z + .1, .9, 2, ['#8E2E22', '#3E5A8A', '#C9A04A', '#66763E'][i]); } }
    if (p.k === 'temple') { for (const s of [-1, 1]) { const x = p.x - p.side * 10, z = p.z + s * 6; ambBrazier(scene, x, yAt(x, z), z, 1.2); } }
    if (p.k === 'shore') { const y = yAt(p.x, p.z); ambFire(p.x - p.side * 2, y + .25, p.z - 1, .55); ambRipples(scene, p.x + p.side * 7, y + .1, p.z, 7.6); }
    if (p.k === 'lake') ambRipples(scene, p.x - p.side * 4, yAt(p.x, p.z) - .25 + .45, p.z, 26);
    if (p.k === 'garden') { for (let i = 0; i < 2; i++) { const x = p.x + (i ? 3 : -3), z = p.z + 3; if (free(x, z)) ambTorch(scene, x, yAt(x, z), z); } }
  }
  // lámparas de aceite en los puestos del mercado
  ((S.sv && S.sv.stalls) || []).forEach(s => ambLamp(scene, s.x + .1, yAt(s.x, s.z) + .9, s.z + .35, 1.2));
  // fogatas que ya existen
  ((S.sv && S.sv.fires) || []).forEach(f => { if (!f.amb) { f.amb = ambFire(f.x, f.y + .25, f.z, .7); f.fl.visible = false; } });
  ambFlyers(scene, allPts, hx, zMax);
}

/* ---------- Portales épicos y escalera al cielo: piedra tallada, bronce, madera, rayos de luz y polvo dorado ----------
   Texturas PBR CC0 de Poly Haven (large_sandstone_blocks, old_sandstone_02, marble_01, brown_planks_05, metal_plate). */
const PBR = {};
/* ---------- texturas PBR comprimidas en la placa de video (KTX2): 1k en Bajo/Medio, 2k en Alto, 4k en Ultra (paquete HD) ---------- */
const TEXK = { L: null, reg: [], cache: {}, res: '', base: ABASE ? ABASE + 'tex/' : new URL('../tex/', import.meta.url).href, hd: window.HD_BASE || (ABASE ? ABASE + 'hd/' : new URL('../hd/', import.meta.url).href), terrain: null, hd4: new Set([]), no4: new Set(['leafy_grass', 'withered_grass', 'aerial_grass_rock', 'japanese_stone_wall']) };
const texRes = lv => ['1k', '1k', '2k', '4k'][lv];
async function texLoader() {
  if (TEXK.L) return TEXK.L; if (!S) return null;
  TEXK.L = (async () => { globalThis.__THREE = THREE; const mod = await import(H3_BASE + 'gltf.js'); if (!mod.KTX2Loader) return null; const L = new mod.KTX2Loader(); L.setTranscoderPath(H3_BASE + 'basis/'); L.detectSupport(S.renderer); TEXK.mod = mod; return L; })();
  return TEXK.L;
}
// normales y rugosidad 1k hasta Alto (color 2k); Ultra (paquete HD): color, normales y rugosidad a 4k
// normal y rugosidad en 4K solo para los ids que ya tienen ese archivo publicado (TEXK.hd4); el resto usa 1K
function texURL(id, m, res) { if (res === '4k' && TEXK.no4.has(id)) res = '2k'; if (m !== 'diff' && !(res === '4k' && TEXK.hd4 && TEXK.hd4.has(id))) res = '1k'; return (res === '4k' ? TEXK.hd + '4k/' : TEXK.base + res + '/') + id + '_' + m + '.ktx2'; }
async function texGet(id, m, res) {
  const u = texURL(id, m, res); if (TEXK.cache[u]) return TEXK.cache[u]; const L = await texLoader(); if (!L) return null;
  TEXK.cache[u] = new Promise(ok => L.load(u, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, S.renderer.capabilities.getMaxAnisotropy()); ok(t); }, undefined, () => ok(null))); return TEXK.cache[u];
}
function texReg(e) { TEXK.reg.push(e); if (TEXK.res) texApply(e, TEXK.res); }
async function texApply(e, res) {
  const [d, n, r] = await Promise.all(['diff', 'nor', 'rough'].map(m => texGet(e.id, m, res))); if (res !== TEXK.res) return;
  const set = (slot, t) => { if (!t) return; const c = t.clone(); c.repeat.set(e.rx, e.ry); c.needsUpdate = true; const old = e.mat[slot]; e.mat[slot] = c; if (old && old !== c && old.isCompressedTexture) old.dispose(); };
  set('map', d); set('normalMap', n); set('roughnessMap', r); e.mat.roughness = r ? 1 : e.mat.roughness; e.mat.needsUpdate = true;
}
function texTier(lv) {
  const res = texRes(lv); if (res === TEXK.res) return; TEXK.res = res;
  TEXK.reg.forEach(e => texApply(e, res)); if (TEXK.terrain) TEXK.terrain(res);
  // libera la resolución anterior
  const need = new Set(); TEXK.reg.map(e => e.id).concat(TEXK.tids || []).forEach(id => ['diff', 'nor', 'rough'].forEach(m => need.add(texURL(id, m, res))));
  setTimeout(() => Object.keys(TEXK.cache).forEach(u => { if (!need.has(u)) { TEXK.cache[u].then(t => t && t.dispose()); delete TEXK.cache[u]; } }), 4000);
}
function pbrMat(id, rx, ry, o) {
  o = o || {}; const k = id + rx + 'x' + ry + JSON.stringify(o); if (PBR[k]) return PBR[k];
  const web = /^(large_sandstone_blocks|old_sandstone_02|marble_01|brown_planks_05|metal_plate)$/.test(id);
  const ld = (m, srgb) => { if (!web) return null; const t = new THREE.TextureLoader().load(TEXB + 'pbr/' + id + '_' + m + '.webp'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const m = new THREE.MeshStandardMaterial(Object.assign({ map: ld('diff', 1), normalMap: ld('nor'), roughnessMap: ld('rough'), roughness: web ? 1 : .9, metalness: 0 }, o)); if (o.normalScale) m.normalScale.set(o.normalScale, o.normalScale);
  texReg({ mat: m, id, rx, ry }); return (PBR[k] = m);
}
const LOQ = () => matchMedia('(pointer: coarse)').matches;
// perfil torneado de columna: basa con molduras, fuste con éntasis y capitel
function columnGeo(h, r, seg) {
  const P = [], v = (x, y) => P.push(new THREE.Vector2(x, y));
  v(0, 0); v(r * 1.45, 0); v(r * 1.45, r * .35); v(r * 1.3, r * .42); v(r * 1.32, r * .55); v(r * 1.15, r * .7); v(r * 1.18, r * .82); v(r * 1.02, r * .95);
  for (let i = 0; i <= 8; i++) { const t = i / 8, y = r * .95 + t * (h - r * 2.6); v(r * (1 - t * .14 + Math.sin(t * Math.PI) * .03), y); }
  const yt = h - r * 1.65; v(r * .95, yt + .05 * r); v(r * 1.05, yt + .2 * r); v(r * .95, yt + .32 * r); v(r * 1.25, yt + .8 * r); v(r * 1.5, yt + 1.15 * r); v(r * 1.62, yt + 1.2 * r); v(r * 1.62, h); v(0, h);
  return new THREE.LatheGeometry(P, seg);
}
// bloque con bisel (las aristas atrapan la luz y deja de verse como un cubo)
function bevBox(w, h, d, b) { const s = new THREE.Shape(); s.moveTo(-w / 2 + b, -h / 2); s.lineTo(w / 2 - b, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + b); s.lineTo(w / 2, h / 2 - b); s.quadraticCurveTo(w / 2, h / 2, w / 2 - b, h / 2); s.lineTo(-w / 2 + b, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - b); s.lineTo(-w / 2, -h / 2 + b); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + b, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - b * 2, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 2, curveSegments: 3 }); g.translate(0, 0, -(d - b * 2) / 2); boxUV(g); return g; }
// UV planas por cara (tipo caja) para que la textura no se estire
function boxUV(g, sc) { sc = sc || .25; g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v; if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); } else if (ay >= az) { u = p.getX(i); v = p.getZ(i); } else { u = p.getX(i); v = p.getY(i); } uv[i * 2] = u * sc; uv[i * 2 + 1] = v * sc; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; }
// arco de dovelas: anillo extruido con bisel
function archGeo(rIn, rOut, depth, seg) { const s = new THREE.Shape(); s.absarc(0, 0, rOut, 0, Math.PI, false); s.lineTo(-rIn, 0); s.absarc(0, 0, rIn, Math.PI, 0, true); s.lineTo(rOut, 0); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 2, curveSegments: seg }); g.translate(0, 0, -depth / 2); return boxUV(g, .22); }
// friso tallado: relieve de vides y espigas dibujado y usado como relieve (bump)
let _frieze = null;
function friezeTex() { if (_frieze) return _frieze; const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 64);
  x.strokeStyle = '#FFFFFF'; x.lineWidth = 5; x.beginPath(); for (let i = 0; i <= 512; i += 4) { const y = 32 + Math.sin(i / 512 * Math.PI * 8) * 14; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke();
  for (let k = 0; k < 8; k++) { const cx = 32 + k * 64, cy = 32 + Math.sin((cx / 512) * Math.PI * 8 + Math.PI / 2) * 6; x.fillStyle = '#E8E8E8'; for (let j = 0; j < 5; j++) { x.beginPath(); x.ellipse(cx + Math.cos(j * 1.256) * 9, cy + Math.sin(j * 1.256) * 9, 7, 4, j * 1.256, 0, 7); x.fill(); } x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill(); }
  x.fillStyle = '#B0B0B0'; x.fillRect(0, 0, 512, 5); x.fillRect(0, 59, 512, 5); _frieze = new THREE.CanvasTexture(c); _frieze.wrapS = THREE.RepeatWrapping; return _frieze; }
// rayos de luz suaves (shader) y polvo dorado
function shaftMat(col) { return new THREE.ShaderMaterial({ uniforms: { uT: AMB.uT, C: { value: new THREE.Color(col) }, K: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: 'uniform float uT,K;uniform vec3 C;varying vec2 vUv;' + AMB_GLSL + 'void main(){float e=smoothstep(0.,.35,vUv.x)*smoothstep(1.,.65,vUv.x);float f=smoothstep(1.,.0,vUv.y)*.8+.2;float n=.65+.35*an(vec2(vUv.x*6.+uT*.15,vUv.y*2.-uT*.1));float a=e*f*n*.22*K;gl_FragColor=vec4(C*a,a);}' }); }
function dustPts(n, w, h, d, col) { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set([(Math.random() - .5) * w, Math.random() * h, Math.random() * d], i * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: .09, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); }
function gateLeaf(R, h, mat, bronze, lo, anim, piv, s) {
  const leaf = new THREE.Group(); leaf.position.x = -s * R / 2; piv.add(leaf);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; leaf.add(o); return o; };
  add(bevBox(R - .04, h, .32, .05), mat, 0, h / 2, 0);
  if (bronze) { for (let k = 1; k < 5; k++) add(new THREE.BoxGeometry(R * .96, .2, .42), bronze, 0, h * k / 5, .04);
    const n0 = lo ? 4 : 8, studs = new THREE.InstancedMesh(new THREE.SphereGeometry(.08, 8, 6), bronze, n0 * 4), M4 = new THREE.Matrix4(); let n = 0;
    for (let k = 1; k < 5; k++) for (let j = 0; j < n0; j++) { M4.makeTranslation(-R * .42 + j * R * .84 / (n0 - 1), h * k / 5, .27); studs.setMatrixAt(n++, M4); } leaf.add(studs); anim.detail.push(studs);
    const ring = add(new THREE.TorusGeometry(.32, .06, 8, 24), bronze, -s * R * .36, h * .45, .3); }
  return leaf;
}
function epicGate(d, h, hx) {
  const g = new THREE.Group(), lo = LOQ(), seg = lo ? 16 : 28, w = h * .36, col = new THREE.Color(d.c), hot = col.clone().lerp(new THREE.Color('#FFFFFF'), .5);
  const anim = { fire: [], parts: null, gem: null, glow: [], t0: Math.random() * 9, doors: [], open: 0, shafts: [], detail: [] };
  const stone = pbrMat('large_sandstone_blocks', 1, 1, { color: '#FFF8EC' }), trim = pbrMat('old_sandstone_02', 1, 1, { color: '#FFFCF4' }), colm = pbrMat('old_sandstone_02', 2, 3, { color: '#FFFCF4' }), wood = pbrMat('brown_planks_05', 1, 1, { color: hx ? '#9A6A42' : '#C08A58' }), bronze = pbrMat('metal_plate', 1, 1, { color: '#C99A4A', metalness: .9, roughness: 1 }), gold = new THREE.MeshStandardMaterial({ color: '#E8B84A', metalness: .95, roughness: .28, emissive: '#5A3A08', emissiveIntensity: .25 });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); o.castShadow = true; o.receiveShadow = true; return o; };
  const base = 1.35, R = w + .15, W2 = w + 4.6, Ht = h + w + 4.2;
  // escalinata biselada
  for (let i = 0; i < 3; i++) add(bevBox(W2 * 2 + 3 - i * 1.6, .45, 4.6 - i * .9, .07), trim, 0, .22 + i * .45, 1.5 - i * .45);
  // muro de sillares con el vano en arco (un solo contorno en U)
  const ws = new THREE.Shape(); ws.moveTo(-W2, 0); ws.lineTo(-R, 0); ws.lineTo(-R, h); ws.absarc(0, h, R, Math.PI, 0, true); ws.lineTo(R, 0); ws.lineTo(W2, 0); ws.lineTo(W2, Ht); ws.lineTo(-W2, Ht); ws.lineTo(-W2, 0);
  const wg = new THREE.ExtrudeGeometry(ws, { depth: 2.2, bevelEnabled: true, bevelSize: .1, bevelThickness: .1, bevelSegments: 2, curveSegments: seg }); wg.translate(0, 0, -1.1); add(boxUV(wg, .2), stone, 0, base, 0);
  // columnas adosadas sobre pedestal
  [-1, 1].forEach(s => { const x = s * (w + 2.6); add(bevBox(2.4, 1.2, 2.4, .08), trim, x, base + .6, 1.4); add(columnGeo(h + 1.2, .74, seg), colm, x, base + 1.2, 1.4); });
  // arco de dovelas, arquivolta y clave con el emblema del curso
  add(archGeo(R - .02, R + 1.1, 2.6, seg), trim, 0, base + h, .1);
  add(archGeo(R + 1.1, R + 1.4, 2.8, seg), trim, 0, base + h, .15);
  add(bevBox(1.5, 2.1, 2.9, .1), trim, 0, base + h + R + .55, .15);
  const kc = document.createElement('canvas'); kc.width = kc.height = 256; const kx = kc.getContext('2d'), gr = kx.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(255,240,190,.95)'); gr.addColorStop(.6, 'rgba(255,200,90,.3)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); kx.fillStyle = gr; kx.fillRect(0, 0, 256, 256); kx.font = '150px serif'; kx.textAlign = 'center'; kx.textBaseline = 'middle'; kx.fillText(d.ico || '✦', 128, 138);
  const et = new THREE.CanvasTexture(kc); et.colorSpace = THREE.SRGBColorSpace; const emb = add(new THREE.CircleGeometry(.85, 32), new THREE.MeshBasicMaterial({ map: et, transparent: true, depthWrite: false }), 0, base + h + R + .55, 1.62); emb.castShadow = false; anim.glow.push(emb);
  add(new THREE.TorusGeometry(.9, .07, 8, 32), gold, 0, base + h + R + .55, 1.6);
  // tímpano tallado sobre las puertas
  const ft = friezeTex().clone(); ft.needsUpdate = true; ft.wrapS = THREE.RepeatWrapping; ft.repeat.set(3, 1); const fm = new THREE.MeshStandardMaterial({ color: hx ? '#D8C8A8' : '#F6EAD2', roughness: .9, bumpMap: ft, bumpScale: 4 });
  const ty = add(new THREE.CircleGeometry(R, seg, 0, Math.PI), fm, 0, base + h, -.3); ty.castShadow = false;
  // entablamento con friso tallado y cornisa
  const fg = new THREE.PlaneGeometry(W2 * 2 - .6, 1.1); const fr = add(fg, new THREE.MeshStandardMaterial({ color: hx ? '#E6D7B8' : '#FFF4DE', roughness: .9, bumpMap: (() => { const t = friezeTex().clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(5, 1); return t; })(), bumpScale: 4 }), 0, base + Ht - 1.9, 1.22); fr.castShadow = false;
  add(bevBox(W2 * 2 + .6, .55, 2.9, .1), trim, 0, base + Ht - .9, .3); add(bevBox(W2 * 2 + 1.2, .38, 3.2, .1), trim, 0, base + Ht - .4, .35);
  // puertas de tablones con bandas y clavos de bronce, sobre bisagras: se abren hacia adentro
  [-1, 1].forEach(s => { const piv = new THREE.Group(); piv.userData.dyn = 1; piv.position.set(s * R, base, -.25); g.add(piv); gateLeaf(R, h, wood, bronze, lo, anim, piv, s); anim.doors.push({ piv, s }); });
  // la luz de adentro, los rayos y el polvo dorado (se encienden al abrir)
  const inner = add(new THREE.PlaneGeometry(R * 2.4, h + R), new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), 0, base + (h + R) / 2, -5); inner.castShadow = false; anim.inner = inner;
  const nS = lo ? 3 : 5; for (let i = 0; i < nS; i++) { const sm = shaftMat(hot), sp = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.2, h * 1.35).rotateZ(Math.PI), sm); sp.position.set((i - (nS - 1) / 2) * .9, base + h * .45, h * .5 + .2); sp.rotation.set(-Math.PI / 4, (i - (nS - 1) / 2) * .1, 0); sp.renderOrder = 5; g.add(sp); anim.shafts.push(sm); }
  anim.parts = dustPts(lo ? 60 : 140, R * 2.2, h, 6, hot); anim.parts.position.set(0, base, .4); g.add(anim.parts); anim.ph = h;
  const rune = add(new THREE.RingGeometry(3.4, 3.7, 64), new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, base + .03, 4.4); rune.rotation.x = -Math.PI / 2; rune.castShadow = false; anim.rune = rune;
  const lab = textSprite(d.name, hx); lab.scale.multiplyScalar(3.2); lab.position.set(0, base + Ht + 2.4, .4); g.add(lab);
  const sub = textSprite(d.sub, hx); sub.scale.multiplyScalar(1.6); sub.position.set(0, base + Ht + 1, .4); g.add(sub);
  if (hx && qEarly() >= 2) { const pl = new THREE.PointLight(hot, 0, 26, 1.4); pl.position.set(0, base + h * .5, 3); g.add(pl); anim.glowL = pl; }
  // antorchas, braseros y estandartes: se agregan cuando el portal ya está en su lugar (el fuego vive en coordenadas del mundo)
  g.userData.decor = () => { [-1, 1].forEach(s => { ambTorch(g, s * (R + 1.0), base + h * .5, 1.12, { wall: 1, size: .7 }); ambBrazier(g, s * (W2 + 1.6), .45, 3.4, 1.1); ambBanner(g, s * (w + 2.6), base + h + .2, 2.3, 1.5, h * .5, col);
      // rocas reales al pie de los muros y niebla baja
      phOne('namaqualand_boulders_01', g, s * (W2 + 2.6), -.6, -.4, s * .8, 1.4); phOne(s > 0 ? 'namaqualand_boulder_04' : 'namaqualand_boulder_05', g, s * (W2 + .6), -.3, -2.2, s, 1.6); });
    if (QUAL.lv >= 2) { const fm = new THREE.SpriteMaterial({ map: cloudTex(), color: '#F2E8D8', transparent: true, opacity: .32, depthWrite: false }); for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(fm); sp.position.set((i - 3) * 3.2, .9, 3 + (i % 3) * 1.6); sp.scale.set(7, 2.2, 1); g.add(sp); } } };
  g.userData.anim = anim; return g;
}
// la puerta de perla de la Nueva Jerusalén (arriba de la escalera de Maranata): oro, perla y las doce piedras de los cimientos
function pearlGate(d, hx) {
  const g = new THREE.Group(), lo = LOQ(), seg = lo ? 20 : 36, h = 9, R = 3.4, anim = { fire: [], parts: null, gem: null, glow: [], t0: 0, doors: [], open: 1, shafts: [], detail: [], alwaysOpen: 1 };
  const pearl = new THREE.MeshPhysicalMaterial({ color: '#FFF8F0', roughness: .2, metalness: 0, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], clearcoat: 1, clearcoatRoughness: .15, sheen: .6, sheenColor: new THREE.Color('#FFE8F4'), emissive: '#FFF4E8', emissiveIntensity: hx ? .08 : .18 });
  const gold = new THREE.MeshStandardMaterial({ color: '#F2C14E', metalness: 1, roughness: .2, emissive: '#6A4410', emissiveIntensity: .35 }), marble = pbrMat('marble_01', 1, 2, { color: '#FFFFFF' });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); o.castShadow = true; o.receiveShadow = true; return o; };
  const gems = ['#5E9C6E', '#3A5FCD', '#7ACFC0', '#2E8B57', '#C8A27A', '#B22222', '#F2D06B', '#7FC8A9', '#E0B85A', '#9ACD32', '#6A5ACD', '#9370DB'];
  gems.forEach((c, i) => add(bevBox(R * 2 + 5 - i * .1, .16, 3.2 - i * .04, .03), new THREE.MeshStandardMaterial({ color: c, roughness: .15, metalness: .1, emissive: c, emissiveIntensity: .25 }), 0, .08 + i * .16, 0));
  const top = 12 * .16;
  [-1, 1].forEach(s => { add(columnGeo(h, .55, seg), marble, s * (R + .9), top, 0); });
  add(archGeo(R - .1, R + 1, 1.8, seg), pearl, 0, top + h - .35, 0);
  add(archGeo(R + 1, R + 1.25, 2, seg), gold, 0, top + h - .35, 0);
  [-1, 1].forEach(s => { const piv = new THREE.Group(); piv.userData.dyn = 1; piv.position.set(s * (R - .1), top, -.2); g.add(piv); gateLeaf(R - .1, h - .35, pearl, null, lo, anim, piv, s); anim.doors.push({ piv, s }); });
  const inner = add(new THREE.PlaneGeometry(R * 2.6, h + R), new THREE.MeshBasicMaterial({ color: '#FFF4D6', transparent: true, opacity: .85, toneMapped: false, depthWrite: false }), 0, top + (h + R) / 2 - .4, -4.6); inner.castShadow = false; anim.inner = inner;
  const street = add(new THREE.PlaneGeometry(R * 2, 16), new THREE.MeshStandardMaterial({ color: '#F6D27A', metalness: 1, roughness: .08, emissive: '#7A5410', emissiveIntensity: .45 }), 0, top + .02, -8); street.rotation.x = -Math.PI / 2; street.castShadow = false;
  const nS = lo ? 4 : 6; for (let i = 0; i < nS; i++) { const sm = shaftMat('#FFF1C8'), sp = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.3, h * 1.35).rotateZ(Math.PI), sm); sp.position.set((i - (nS - 1) / 2) * .8, top + h * .45, h * .5); sp.rotation.set(-Math.PI / 4, (i - (nS - 1) / 2) * .1, 0); sp.renderOrder = 5; g.add(sp); anim.shafts.push(sm); }
  anim.parts = dustPts(lo ? 80 : 180, R * 3, h * 1.4, 7, '#FFF0B8'); anim.parts.position.set(0, top, .2); g.add(anim.parts); anim.ph = h * 1.4;
  if (hx && qEarly() >= 2) { const pl = new THREE.PointLight('#FFE7A0', 30, 30, 1.3); pl.position.set(0, top + h * .5, 3); g.add(pl); anim.glowL = pl; }
  g.userData.anim = anim; return g;
}
// escalera al cielo: escalones de mármol con nariz, balaustrada torneada, nubes suaves, neblina y luz
let _cloudTex = null;
function cloudTex() { if (_cloudTex) return _cloudTex; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 14; i++) { const px = 30 + Math.random() * 68, py = 40 + Math.random() * 48, r = 18 + Math.random() * 26, gr = x.createRadialGradient(px, py, 2, px, py, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } _cloudTex = new THREE.CanvasTexture(c); return _cloudTex; }
function heavenStair(g, hx) {
  const lo = LOQ(), dep = ST.L / ST.N, marble = pbrMat('marble_01', 1, 1, { color: '#FFFFFF', emissive: '#FFF6E0', emissiveIntensity: hx ? .06 : .14 }), gold = new THREE.MeshStandardMaterial({ color: '#E8B84A', metalness: .95, roughness: .25, emissive: '#5A3A08', emissiveIntensity: .25 });
  // escalón: huella con nariz redondeada (perfil extruido)
  const s = new THREE.Shape(); s.moveTo(-dep / 2, -1); s.lineTo(dep / 2, -1); s.lineTo(dep / 2, -.04); s.quadraticCurveTo(dep / 2, 0, dep / 2 - .04, 0); s.lineTo(-dep / 2 - .08, 0); s.quadraticCurveTo(-dep / 2 - .12, -.04, -dep / 2 - .08, -.08); s.lineTo(-dep / 2, -.1); s.lineTo(-dep / 2, -1);
  const sg = new THREE.ExtrudeGeometry(s, { depth: ST.W * 2, bevelEnabled: false, curveSegments: 3 }); sg.translate(0, 0, -ST.W); sg.rotateY(-Math.PI / 2); boxUV(sg, .5);
  const im = new THREE.InstancedMesh(sg, marble, ST.N), M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Qn = new THREE.Quaternion(), Sc = new THREE.Vector3();
  for (let i = 0; i < ST.N; i++) { const top = (i + 1) * ST.H / ST.N, hh = Math.min(top, 3); M4.compose(V.set(0, top, (i + .5) * dep), Qn, Sc.set(1, hh, 1)); im.setMatrixAt(i, M4); } im.receiveShadow = true; im.castShadow = !!hx; g.add(im);
  // zancas y balaustrada torneada con pasamanos de oro
  const len = Math.hypot(ST.L, ST.H), ang = Math.atan2(ST.H, ST.L);
  const bal = columnGeo(1.05, .07, lo ? 8 : 12), nb = lo ? 18 : 30, bim = new THREE.InstancedMesh(bal, marble, nb * 2); let k = 0;
  [-1, 1].forEach(sd => { const str = new THREE.Mesh(bevBox(.35, .5, len, .05), marble); str.rotation.x = -ang; str.position.set(sd * (ST.W + .17), ST.H / 2 + .05, ST.L / 2); g.add(str);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, len, 10), gold); rail.rotation.x = Math.PI / 2 - ang; rail.position.set(sd * (ST.W + .17), ST.H / 2 + 1.3, ST.L / 2); g.add(rail);
    for (let i = 0; i < nb; i++) { const u = (i + .5) / nb; M4.makeTranslation(sd * (ST.W + .17), u * ST.H + .28, u * ST.L); bim.setMatrixAt(k++, M4); } });
  bim.castShadow = !!hx; g.add(bim);
  const plat = new THREE.Mesh(bevBox(8.4, 1.2, ST.P, .08), marble); plat.position.set(0, ST.H - .6, ST.L + ST.P / 2); plat.receiveShadow = true; g.add(plat);
  const inl = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.45, 48), gold); inl.rotation.x = -Math.PI / 2; inl.position.set(0, ST.H + .02, ST.L + ST.P / 2); g.add(inl);
  // nubes y neblina: billboards suaves
  const cm = new THREE.SpriteMaterial({ map: cloudTex(), color: '#FFFFFF', transparent: true, opacity: .9, depthWrite: false }), clouds = [];
  const puff = (x, y, z, s) => { const sp = new THREE.Sprite(cm); sp.position.set(x, y, z); sp.scale.set(s, s * .55, 1); g.add(sp); clouds.push({ sp, x, y, z, s, p: Math.random() * 6 }); };
  for (let i = 0; i < (lo ? 18 : 34); i++) { const a = i / (lo ? 18 : 34) * 6.28, r = 6 + hsh(i, 2) * 8; puff(Math.cos(a) * r, ST.H - 1.4 + hsh(i, 7) * 1.6, ST.L + ST.P / 2 + Math.sin(a) * r * .8, 6 + hsh(i, 5) * 6); }
  for (let i = 0; i < (lo ? 10 : 18); i++) { const u = i / (lo ? 10 : 18); puff((i % 2 ? 1 : -1) * (ST.W + 2 + hsh(i, 4) * 3), u * ST.H + .4, u * ST.L, 4 + hsh(i, 3) * 4); }
  // luz del cielo y partículas que suben por la escalera
  const shafts = []; for (let i = 0; i < 3; i++) { const sm = shaftMat('#FFF1C2'); sm.uniforms.K.value = 1.4; const sp = new THREE.Mesh(new THREE.PlaneGeometry(12, 70), sm); sp.position.set((i - 1) * 3, ST.H + 30, ST.L + ST.P / 2 - 2 + i); sp.rotation.y = i * .9; g.add(sp); shafts.push(sp); }
  const parts = dustPts(lo ? 80 : 160, ST.W * 3, ST.H + 6, ST.L + ST.P, '#FFF2C0'); g.add(parts);
  return { clouds, parts, ph: ST.H + 6 };
}
let _gT = 0;
function gateTick(t) {
  if (!S || !S.doors) return; const dt = Math.min(.1, Math.max(0, t - _gT)); _gT = t; const a = S.av.position;
  for (const o of S.doors) { const A = o.anim; if (!A || !A.doors) continue; const d2 = (a.x - o.d.x) ** 2 + (a.z - o.d.z) ** 2;
    if (A.detail) A.detail.forEach(m => { m.visible = d2 < 3600; });
    if (d2 > 25600) continue;
    const want = A.alwaysOpen ? 1 : (d2 < 480 ? 1 : 0); A.open += (want - A.open) * Math.min(1, dt * .8);
    const e = A.open * A.open * (3 - 2 * A.open); A.doors.forEach(D => { D.piv.rotation.y = -D.s * e * 1.3; });
    if (A.inner) A.inner.material.opacity = A.alwaysOpen ? .85 : e * .95;
    A.shafts.forEach((m, i) => { m.uniforms.K.value = (A.alwaysOpen ? 1 : e) * (.85 + Math.sin(t * .8 + i) * .15); });
    if (A.parts) { A.parts.material.opacity = A.alwaysOpen ? .8 : .15 + e * .65; }
    if (A.glowL) A.glowL.intensity = (A.alwaysOpen ? 30 : e * 36) * (.9 + Math.sin(t * 1.3) * .1);
    const st = o.stair; if (st && d2 < 22500) { st.clouds.forEach(c => { c.sp.position.x = c.x + Math.sin(t * .12 + c.p) * 1.2; c.sp.position.y = c.y + Math.sin(t * .2 + c.p) * .25; });
      const P = st.parts.geometry.attributes.position; for (let k = 0; k < P.count; k++) { let y = P.getY(k) + dt * .9; if (y > st.ph) y = 0; P.setY(k, y); } P.needsUpdate = true; } }
}

function buildDoors(scene, doors, hx, HW) {
  const yAt = (x, z) => HW ? Math.max(0, HW.hAt(x, z)) : 0, M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85 }, o || {}));
  const stone = M(hx ? '#CFC2A4' : '#F2E6CC'), stone2 = M(hx ? '#A89878' : '#E2D2B0'), wood = M(hx ? '#5A3A22' : '#9A6A3E'), gold = M('#E6B04A', { metalness: .6, roughness: .35, emissive: '#7A5410', emissiveIntensity: .3 });
  const sh = o => { if (hx) o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  // portal monumental: escalinata, columnas con capiteles de oro, arco con gema, puertas grabadas, braseros, estandartes y luz que se escapa
  const portal = (d, h) => { const g = new THREE.Group(), w = h * .36, col = new THREE.Color(d.c), hot = col.clone().lerp(new THREE.Color('#FFFFFF'), .45), anim = { fire: [], parts: null, gem: null, glow: [], t0: Math.random() * 9 };
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
    for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(w * 2 + 7 - i * 1.4, .45, 4.2 - i * .9), i % 2 ? stone2 : stone, 0, .22 + i * .45, 1.4 - i * .45);
    const base = 1.35;
    [-1, 1].forEach(s => { const x = s * (w + 1.1);
      add(new THREE.BoxGeometry(2.6, 1, 2.6), stone2, x, base + .5, 0);
      const sh = add(new THREE.CylinderGeometry(.95, 1.08, h, 20), stone, x, base + 1 + h / 2, 0);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, fl = add(new THREE.BoxGeometry(.12, h * .96, .12), stone2, x + Math.cos(a) * .98, base + 1 + h / 2, Math.sin(a) * .98); fl.rotation.y = -a; }
      add(new THREE.CylinderGeometry(1.35, 1.0, .7, 20), gold, x, base + 1 + h + .35, 0);
      add(new THREE.BoxGeometry(3, .45, 3), stone2, x, base + 1 + h + .92, 0);
      const ban = add(new THREE.PlaneGeometry(1.5, h * .55), new THREE.MeshStandardMaterial({ color: col, roughness: .8, side: THREE.DoubleSide, emissive: col, emissiveIntensity: .12 }), x, base + 1 + h * .62, 1.12);
      const tri = add(new THREE.ConeGeometry(.75, .9, 3), ban.material, x, base + 1 + h * .62 - h * .275 - .3, 1.12); tri.rotation.z = Math.PI; tri.scale.z = .02;
      const em = add(new THREE.TorusGeometry(.42, .07, 8, 24), gold, x, base + 1 + h * .72, 1.15);
      // brasero
      const bx = s * (w + 4.2); add(new THREE.CylinderGeometry(.18, .28, 2.2, 10), gold, bx, 1.1 + .45, 2.6); add(new THREE.CylinderGeometry(.85, .45, .55, 14, 1, true), gold, bx, 2.5 + .45, 2.6);
      const fm = new THREE.MeshBasicMaterial({ color: '#FFB347', transparent: true, opacity: .92, blending: THREE.AdditiveBlending, depthWrite: false });
      const f1 = add(new THREE.ConeGeometry(.55, 1.6, 10), fm, bx, 3.45 + .45, 2.6), f2 = add(new THREE.ConeGeometry(.32, 1.1, 10), new THREE.MeshBasicMaterial({ color: '#FFF0B0', transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }), bx, 3.3 + .45, 2.6);
      const pl = new THREE.PointLight('#FF9A3C', hx ? 26 : 10, 18, 1.6); pl.position.set(bx, 4.2, 2.6); g.add(pl); anim.fire.push({ f1, f2, pl });
    });
    // arco y gema
    const arch = add(new THREE.TorusGeometry(w + 1.1, .95, 12, 40, Math.PI), stone, 0, base + 1 + h, 0); arch.scale.z = 1.1;
    add(new THREE.TorusGeometry(w + 1.1, .22, 8, 40, Math.PI), gold, 0, base + 1 + h, .95);
    const key = add(new THREE.BoxGeometry(1.5, 2, 1.6), stone2, 0, base + 1 + h + w + 1.2, .1);
    anim.gem = add(new THREE.OctahedronGeometry(.62, 0), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.6, metalness: .3, roughness: .2 }), 0, base + 1 + h + w + 1.25, .95);
    // puertas grabadas
    const doorM = new THREE.MeshStandardMaterial({ color: hx ? '#3E2716' : '#8A5A32', roughness: .7, metalness: .1 });
    [-1, 1].forEach(s => { add(new THREE.BoxGeometry(w, h, .5), doorM, s * w / 2, base + 1 + h / 2, 0);
      for (let k = 1; k < 5; k++) add(new THREE.BoxGeometry(w * .94, .18, .6), gold, s * w / 2, base + 1 + h * k / 5, 0);
      add(new THREE.BoxGeometry(.18, h * .97, .6), gold, s * (w - .15), base + 1 + h / 2, 0);
      for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(.12, 8, 6), gold, s * w * .5 + (k % 2 ? .6 : -.6), base + 1 + h * (.15 + Math.floor(k / 2) * .3), .32);
      const ring = add(new THREE.TorusGeometry(.5, .1, 8, 24), gold, s * .75, base + 1 + h * .45, .42); });
    const tymp = add(new THREE.CircleGeometry(w, 40, 0, Math.PI), doorM, 0, base + 1 + h, 0);
    // emblema del curso
    const ec = document.createElement('canvas'); ec.width = ec.height = 256; const ex = ec.getContext('2d'); const gr = ex.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(255,240,190,.95)'); gr.addColorStop(.55, 'rgba(255,200,90,.35)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); ex.fillStyle = gr; ex.fillRect(0, 0, 256, 256); ex.font = '140px serif'; ex.textAlign = 'center'; ex.textBaseline = 'middle'; ex.fillText(d.ico || '✦', 128, 136);
    const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.SRGBColorSpace;
    const emb = add(new THREE.PlaneGeometry(w * 1.1, w * 1.1), new THREE.MeshBasicMaterial({ map: et, transparent: true, depthWrite: false }), 0, base + 1 + h + w * .45, .3); anim.glow.push(emb);
    // la luz que se escapa por la rendija
    add(new THREE.PlaneGeometry(.22, h * .98), new THREE.MeshBasicMaterial({ color: '#FFF3C4' }), 0, base + 1 + h / 2, .27);
    const beamM = new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const fan = add(new THREE.CylinderGeometry(.1, 3.2, 9, 24, 1, true, -Math.PI / 2, Math.PI), beamM, 0, base + 1 + h / 2, 4.6); fan.rotation.x = Math.PI / 2; anim.glow.push(fan);
    const halo = add(new THREE.PlaneGeometry(w * 3.4, h * 1.9), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending }), 0, base + 1 + h * .62, -.6); anim.glow.push(halo);
    // runas en el piso
    const rune = add(new THREE.RingGeometry(3.4, 3.9, 64), new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, base + .03, 4.4); rune.rotation.x = -Math.PI / 2; anim.rune = rune;
    // chispas que suben
    const N = 90, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3); for (let k = 0; k < N; k++) { pp[k * 3] = (Math.random() - .5) * w * 2.4; pp[k * 3 + 1] = Math.random() * h * 1.4; pp[k * 3 + 2] = Math.random() * 4 + .4; }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); anim.parts = new THREE.Points(pg, new THREE.PointsMaterial({ color: hot, size: .22, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })); anim.parts.position.y = base; g.add(anim.parts); anim.ph = h * 1.4;
    const lab = textSprite(d.name, hx); lab.scale.multiplyScalar(3.2); lab.position.set(0, base + 1 + h + w + 4.2, .4); g.add(lab);
    const sub = textSprite(d.sub, hx); sub.scale.multiplyScalar(1.6); sub.position.set(0, base + 1 + h + w + 2.7, .4); g.add(sub);
    if (hx) { const pl = new THREE.PointLight(hot, 40, 26, 1.4); pl.position.set(0, base + h * .5, 4); g.add(pl); anim.glowL = pl; }
    g.userData.anim = anim; return g; };
  const out = [];
  for (const d of doors) {
    if (d.k === 'door') { const y = yAt(d.x, d.z), g = epicGate(d, 12, hx); g.position.set(d.x, y, d.z); g.rotation.y = -d.side * Math.PI / 2; scene.add(g); g.updateMatrixWorld(true); g.userData.decor(); try { staticMerge(g); } catch (e) {} out.push({ d, g, anim: g.userData.anim, fx: d.x - d.side * 4.5, fz: d.z }); continue; }
    // escalera al cielo
    const y0 = yAt(d.x, d.z), g = new THREE.Group(); g.position.set(d.x, y0, d.z); g.rotation.y = d.side > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g);
    const st = heavenStair(g, hx);
    const pt = pearlGate(d, hx); pt.position.set(0, ST.H, ST.L + ST.P - 1.6); pt.rotation.y = Math.PI; pt.scale.setScalar(.8); g.add(pt);
    const up = textSprite('☁️ Subí acá', hx); up.scale.multiplyScalar(2.2); up.position.set(0, 3.6, -1.5); g.add(up);
    const ar = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.2, 4), new THREE.MeshBasicMaterial({ color: '#FFD25E' })); ar.rotation.x = Math.PI; ar.position.set(0, 2.2, -1.5); g.add(ar); up.userData.ar = ar;
    if (hx && qEarly() >= 2) { const pl = new THREE.PointLight('#FFE7A0', 30, 26, 1.4); pl.position.set(0, ST.H + 4, ST.L + 2); g.add(pl); }
    S_stair = { x: d.x, z: d.z, side: d.side, y0 }; out.push({ d, g, top: true, ar, stair: st, anim: pt.userData.anim, fx: d.x + d.side * (ST.L + ST.P * .6), fz: d.z });
  }
  return out;
}
let S_stair = null;
function doorTick(t) {
  if (!S || !S.doors || document.getElementById('view3d').hidden) return; gateTick(t); const a = S.av.position;
  for (const o of S.doors) { if (o.ar) o.ar.position.y = 2.2 + Math.sin(t * 3) * .3;
    const A = o.anim; if (A && (a.x - o.d.x) ** 2 + (a.z - o.d.z) ** 2 < 14400) { const tt = t + A.t0;
      A.fire.forEach((f, k) => { const fl = .85 + Math.sin(tt * 13 + k) * .1 + Math.sin(tt * 7.3 + k * 2) * .08; f.f1.scale.set(1, fl, 1); f.f2.scale.set(1, fl * 1.1, 1); f.pl.intensity = (S.hx ? 26 : 10) * (.8 + fl * .25); });
      if (A.gem) { A.gem.rotation.y = tt * 1.2; A.gem.material.emissiveIntensity = 1.3 + Math.sin(tt * 2.4) * .5; }
      A.glow.forEach((m, k) => { m.material.opacity = (k === 0 ? .9 : .18) + Math.sin(tt * 1.7 + k) * (k === 0 ? .1 : .06); });
      if (A.rune) A.rune.rotation.z = tt * .25;
      if (A.parts) { const P = A.parts.geometry.attributes.position; for (let k = 0; k < P.count; k++) { let y = P.getY(k) + .03; if (y > A.ph) y = 0; P.setY(k, y); } P.needsUpdate = true; } }
    const near = (a.x - o.fx) ** 2 + (a.z - o.fz) ** 2 < (o.top ? 12 : 9) && (!o.top || stairH(a.x, a.z) >= S.stair.y0 + ST.H - .1);
    if (near && S.doorAt !== o.d.id) { S.doorAt = o.d.id; doorSheet(o.d); } else if (!near && S.doorAt === o.d.id) S.doorAt = null; }
}
function doorSheet(d) {
  const el = document.getElementById('v3sheet'); if (!el || sheetUp()) return; S.joy.x = 0; S.joy.y = 0; S.keys = {}; const p = G().P(), want = (p.want || {})[d.id];
  el.innerHTML = `<div class="bag-in mis-in door-in" style="--dc:${d.c}"><div class="bag-h"><b>${esc(d.name)}</b><span>${esc(d.sub)}</span><button class="bag-x" aria-label="Cerrar">✕</button></div>
    <p class="mis-ask">${esc(d.txt)}</p>
    <p class="door-lock">🔒 Para entrar a este curso hay que inscribirse. Pedile a un adulto que te anote en Habitat.</p>
    <div class="mis-btns"><button class="mis-yes d-want">${want ? '✓ Ya avisaste que te interesa' : 'Quiero inscribirme'}</button><button class="mis-no d-no">Seguir explorando</button></div>
    <p class="cap-note">Todo lo que ganes acá (puntos y nivel) también te acompaña en ese curso.</p></div>`;
  el.hidden = false; const close = () => { el.hidden = true; }; el.querySelector('.bag-x').onclick = close; el.querySelector('.d-no').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  el.querySelector('.d-want').onclick = () => { p.want = p.want || {}; p.want[d.id] = true; G().save(); el.querySelector('.d-want').textContent = '✓ Ya avisaste que te interesa'; if (DOOR_LINK) window.open(DOOR_LINK + (DOOR_LINK.includes('?') ? '&' : '?') + 'curso=' + d.id, '_blank'); else G().toast('Guardamos que te interesa ' + d.name + '. Contale a tus papás para que te inscriban.'); };
}
const DOOR_LINK = '';

/* ---------- guía rápida para los que arrancan ---------- */
function tutSteps() {
  const pc = !matchMedia('(pointer: coarse)').matches;
  return [
    [null, '¡Bienvenido al camino!', 'Vas a recorrer la vida de Jesús etapa por etapa. Te muestro en un minuto cómo se juega.'],
    ['#v3joy', 'Caminar', pc ? 'Caminá con las flechas o con W A S D. Podés ir a donde quieras y explorar todo el escenario.' : 'Arrastrá este círculo para caminar. Podés ir a donde quieras y explorar todo el escenario.'],
    ['.v3cam', 'La cámara', pc ? 'Arrastrá con el mouse para mirar para cualquier lado, también arriba y abajo. Con la rueda (o + y −) acercás y alejás. Q y E giran; ⌖ la vuelve atrás tuyo.' : 'Arrastrá con un dedo para mirar para cualquier lado, también arriba y abajo. Pellizcá con dos dedos para acercar o alejar. ⌖ la vuelve atrás tuyo.'],
    [null, 'Los hitos del camino', 'Los círculos dorados que brillan en el piso son los hitos. Cuando pisás uno, entrás a un juego o a un desafío. Completalos para pasar a la etapa siguiente.'],
    ['#mapView .hud-in', 'Tu nivel', 'Acá ves tu nivel, la etapa en la que estás y tus puntos. Todo lo que ganás se suma para siempre, también en los próximos cursos.'],
    [null, 'Misiones ⭐', 'Algunos personajes tienen una estrella arriba: te piden ayuda para llevar algo, buscar algo, orar o grabar un salmo. Acercate y aceptá. La misión activa aparece arriba y cada una suma 50 puntos.'],
    ['#v3bag', 'La mochila', 'Guarda lo que encontrás, tus grabaciones, tus fotos y la ropa de la época. Desde acá elegís sombrero, camiseta, pantalones, botas y guantes.'],
    [null, 'Ropa de la época ✨', 'Muy de vez en cuando aparece un paquete brillante cerca del camino, y a veces llega ropa como premio de una misión. ¡Es difícil de conseguir!'],
    ['#v3acts', 'Acciones', pc ? 'Saltar (barra espaciadora), arrodillarte a orar (O) y saludar (H). Al orar suena música tranquila y podés elegir versículos por tema.' : 'Saltar, arrodillarte a orar y saludar. Al orar suena música tranquila y podés elegir versículos por tema.'],
    ['#viewToggle', 'El mapa', 'Mirá dónde estás. Si tocás un lugar del mapa, una flecha en el piso te guía hasta ahí.'],
    ['#v3acts [data-a="room"]', 'Jugar con amigos', 'Creá una sala privada y pasale el código o el link solo a tus amigos (hasta 5). Para hablar, mantené apretado 🎙️' + (pc ? ' o la tecla T.' : '.')],
    [null, 'Lugares para entrar', 'En Nazaret hay talleres de oficios, en Jerusalén está el templo y en Galilea el lago. Entrá y descubrí cómo se vivía en la época de Jesús.'],
    [null, 'Puertas de otros cursos', 'En el escenario vas a ver puertas gigantes y una escalera al cielo: son otros cursos. Podés acercarte a mirarlos; para entrar hay que inscribirse.'],
    ['#v3acts [data-a="help"]', '¡Listo para arrancar!', 'Si te olvidás de algo, tocá ❔ y esta guía vuelve a aparecer.']
  ];
}
function tutOpen(force) {
  const key = 'tsp:tut:' + G().branch; let seen = false; try { seen = !!localStorage.getItem(key); } catch (e) {}
  if (seen && !force) return; try { localStorage.setItem(key, '1'); } catch (e) {}
  const steps = tutSteps(); let i = 0; S.joy.x = 0; S.joy.y = 0;
  let el = document.getElementById('v3tut'); if (!el) { el = document.createElement('div'); el.id = 'v3tut'; el.className = 'v3tut'; document.body.appendChild(el); }
  const draw = () => { const [sel, t, txt] = steps[i], tg = sel && document.querySelector(sel), r = tg && tg.offsetParent !== null ? tg.getBoundingClientRect() : null;
    el.innerHTML = `<div class="tut-hole"${r ? ` style="left:${r.left - 8}px;top:${r.top - 8}px;width:${r.width + 16}px;height:${r.height + 16}px"` : ' data-none'}></div>
      <div class="tut-card${r && r.top + r.height / 2 > innerHeight / 2 ? ' up' : ''}${r ? '' : ' mid'}"><small>${i + 1} de ${steps.length}</small><b>${esc(t)}</b><p>${esc(txt)}</p>
      <div class="tut-b"><button class="tut-skip">${i === steps.length - 1 ? '' : 'Saltear'}</button>${i ? '<button class="tut-prev">Atrás</button>' : ''}<button class="tut-next">${i === steps.length - 1 ? '¡A jugar!' : 'Siguiente'}</button></div></div>`;
    el.hidden = false; try { G().vo(txt); } catch (e) {} el.querySelector('.tut-next').onclick = () => { if (++i >= steps.length) { el.hidden = true; try { G().voStop(); } catch (e) {} } else draw(); };
    const pv = el.querySelector('.tut-prev'); if (pv) pv.onclick = () => { i--; draw(); }; el.querySelector('.tut-skip').onclick = () => { el.hidden = true; }; };
  draw();
}

/* ---------- personajes 3D de Hero: modelos esculpidos con esqueleto y animaciones (Quaternius, CC0) ---------- */
const H3 = { ok: false, fail: false, sex: {}, clips: null, skClone: null, npcs: [] };
const H3_BASE = window.H3_BASE || new URL('../hero/', import.meta.url).href;
async function heroLoad() {
  if (H3.ok || H3.fail) return;
  try {
    globalThis.__THREE = THREE; buildStep('personajes'); const mod = await withTO(import(H3_BASE + 'gltf.js'), 30000, 'gltf.js'), L = new mod.GLTFLoader(); const coarseM = matchMedia('(pointer: coarse)').matches;
    const ld = u => new Promise((r, j) => L.load((ABASE ? ABASE + 'hero/' : H3_BASE) + u, r, undefined, j));
    const [m, f, an] = await Promise.race([Promise.all([ld(qEarly() >= 3 && !coarseM ? 'hero_m_hd.glb' : 'hero_m.glb'), ld(qEarly() >= 3 && !coarseM ? 'hero_f_hd.glb' : 'hero_f.glb'), ld('hero_anims.glb')]), new Promise((_, j) => setTimeout(() => j(new Error('tiempo')), window.H3_TO || 45000))]);
    H3.skClone = mod.skClone; const all = gl => { const r = new THREE.Group(); gl.scenes.forEach(x => r.add(x)); return r; }; H3.sex.m = h3Template(all(m)); H3.sex.f = h3Template(all(f));
    H3.clips = Object.fromEntries(an.animations.map(c => [c.name, c]));
    const xl = f => new Promise((r, j) => L.load(new URL('../hero/' + f, import.meta.url).href, r, undefined, j)).then(ex => ex.animations.forEach(c => { if (!H3.clips[c.name] && !/dance/i.test(c.name)) H3.clips[c.name] = c; })).catch(e2 => console.warn('hero3d extra', f, e2));
    buildStep('animaciones'); await withTO(Promise.all([xl('hero_anims2.glb'), xl('hero_anims3.glb')]), 25000, 'animaciones').catch(e => console.warn('hero3d extra', e));
    H3.ok = true;
  } catch (e) { console.warn('hero3d', e); H3.fail = true; }
}
// junta todas las piezas (cabeza, ropa, pelo) sobre un solo esqueleto
function h3Template(scene) {
  scene.updateMatrixWorld(true); const sk = []; scene.traverse(o => { if (o.isSkinnedMesh) sk.push(o); });
  const head = sk.find(o => /^super/i.test(o.name)) || sk[0], bones = {}; head.skeleton.bones.forEach(b => bones[b.name] = b);
  let top = bones.root || head.skeleton.bones[0]; while (top.parent && top.parent !== scene && top.parent.type !== 'Scene' && top.parent.type !== 'Group') top = top.parent;
  const T = new THREE.Group(); T.attach(top);
  const bn = b => bones[b.name] || bones[b.name.replace(/_\d+$/, '')];
  sk.forEach(m => { if (m === head || m.skeleton.bones.every(bn)) return; console.warn('hero3d huesos', m.name); });
  sk.forEach(m => { const bs = m.skeleton.bones.map(bn); m.bind(new THREE.Skeleton(bs, m.skeleton.boneInverses), m.bindMatrix); m.frustumCulled = false; T.attach(m); });
  T.updateMatrixWorld(true); const hb = bones.Head, hp = new THREE.Vector3(); hb.getWorldPosition(hp);
  const want = new THREE.Matrix4().makeTranslation(hp.x, hp.y + .1, hp.z + .015), hatM = hb.matrixWorld.clone().invert().multiply(want);
  return { T, hatM };
}
const H3_PART = { body: /_(Peasant|Ranger)_Body/, arms: /_(Peasant|Ranger)_Arms(_\d)?$/, legs: /_(Peasant|Ranger)_Legs/, feet: /_(Peasant|Ranger)_Feet/, bracer: /Arms_Bracer/, hood: /Head_Hood/, pauldron: /Pauldron/ };
const H3_GEAR = {
  tocado: { hood: '#CDBD9E' }, purpura: { hood: '#6A2A7E' },
  lino: { p: 'Peasant', t: '#E6DCC6' }, indigo: { p: 'Peasant', t: '#34508E' }, rayas: { p: 'Peasant' }, pescador: { p: 'Ranger', t: '#6E8A80' }, sincostura: { p: 'Ranger', t: '#EEE6D6' },
  calzas: { p: 'Peasant', t: '#CFC2A4' }, polainas: { p: 'Peasant' }, cabra: { p: 'Ranger', t: '#8A7A68' }, bordadas: { p: 'Ranger', t: '#283A74' },
  altas: { p: 'Peasant', t: '#8E6038' }, cuero: { p: 'Peasant' }, pastor: { p: 'Ranger', t: '#4A3628' }, caminante: { p: 'Ranger' }, rojas: { p: 'Ranger', t: '#922A20' },
  carpintero: { t: '#7E6040' }, red: { t: '#A8926C' }, lana: { t: '#6E4434' }, bronce: { t: '#C08A3A', metal: .6 },
  capucha: { hood: '#6A4A2E' }, veloazul: { hood: '#34508E' },
  arcilla: { p: 'Peasant', t: '#A85A34' }, olivo: { p: 'Peasant', t: '#5E6E38' }, pastorm: { p: 'Ranger', t: '#8A7A5A' }, grana: { p: 'Ranger', t: '#8E1E2A' }, jose: { p: 'Peasant', t: '#FFFFFF', rb: 1 },
  arena: { p: 'Peasant', t: '#C2A878' }, lananegra: { p: 'Ranger', t: '#2E2824' }, viajero: { p: 'Ranger', t: '#6A5038' }, purpurap: { p: 'Peasant', t: '#5A2A6A' },
  juncos: { p: 'Peasant', t: '#B89A5E' }, desierto: { p: 'Ranger', t: '#A8865A' }, jordan: { p: 'Peasant', t: '#3E4A5A' }, doradas: { p: 'Ranger', t: '#C9A04A', metal: .45 }, evangelio: { p: 'Ranger', t: '#FFF2C8', glow: '#7A5A10' },
  vendaslino: { t: '#D8CCB0' }, plata: { t: '#C8CCD4', metal: .7 }, oro: { t: '#E6B84A', metal: .75 }, sacerdote: {}, magos: {}, gorrogal: {}
};
// tiñe la tela: pasa la textura a gris (conserva costuras y pliegues) y la pinta con el color de la prenda
function h3cloth(mt, rb) {
  mt.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\nvec4 sampledDiffuseColor = texture2D( map, vMapUv );\nfloat lum = dot( sampledDiffuseColor.rgb, vec3( .299, .587, .114 ) );\nsampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, vec3( clamp( sqrt( lum ) * 1.55, 0., 1.25 ) ), .88 );\n' + (rb ? 'sampledDiffuseColor.rgb *= .45 + .55 * cos( 6.2832 * ( vec3( 0., .33, .67 ) + floor( vMapUv.y * 9. ) / 9. * 1.7 ) );\n' : '') + 'diffuseColor *= sampledDiffuseColor;\n#endif'); };
  mt.customProgramCacheKey = () => 'h3cloth' + (rb ? 'rb' : '');
}
// proporciones de chico (7 a 11 años): piernas y brazos un poco más cortos; la pelvis baja lo mismo para que los pies sigan en el piso
function kidProp(o, B) {
  if (!B.thigh_l || !B.foot_l || !B.pelvis) return null; o.updateMatrixWorld(true); const a = new THREE.Vector3(), b = new THREE.Vector3(), ps = new THREE.Vector3();
  B.thigh_l.getWorldPosition(a); B.foot_l.getWorldPosition(b); B.pelvis.parent.getWorldScale(ps); const L = .9;
  return { L, A: .9, drop: (a.y - b.y) * (1 - L) / (ps.y || 1) };
}
function kidApply(u) {
  const B = u.bones, k = u.kidP; ['thigh_l', 'thigh_r'].forEach(n => B[n] && B[n].scale.setScalar(k.L)); ['upperarm_l', 'upperarm_r'].forEach(n => B[n] && B[n].scale.setScalar(k.A));
  if (k.last !== undefined && B.pelvis.position.y === k.last) B.pelvis.position.y += k.drop; // el clip no movió la pelvis: no acumular
  B.pelvis.position.y -= k.drop; k.last = B.pelvis.position.y;
}
function buildHero3(av) {
  const sx = av.g === 'chica' ? 'f' : 'm', tpl = H3.sex[sx], o = H3.skClone(tpl.T), D = gearOn(av), npc = !('gear' in av), hx = (it) => it && H3_GEAR[it.id];
  const pick = { body: (hx(D.shirt) || {}).p || 'Peasant', legs: (hx(D.pants) || {}).p || 'Peasant', feet: (hx(D.boots) || {}).p || 'Peasant' };
  const tint = { body: (hx(D.shirt) || {}).t || (npc && av.outfit ? new THREE.Color(av.outfit).lerp(new THREE.Color('#FFFFFF'), av.tintK ?? .35).getStyle() : null), legs: (hx(D.pants) || {}).t, feet: (hx(D.boots) || {}).t, bracer: (hx(D.gloves) || {}).t, hood: (hx(D.hat) || {}).hood };
  const kid = G().branch !== 'ados'; if (kid && !tint.body && av.outfit) tint.body = new THREE.Color(av.outfit).lerp(new THREE.Color('#FFFFFF'), npc ? .45 : .12).getStyle();
  const hood = !!(hx(D.hat) || {}).hood, hatProc = D.hat && !hood ? D.hat : null, gray = /^#(9|A|B|C|D)/i.test(av.hair || ''), drop = [];
  const skinC = new THREE.Color(av.skin || '#D9A57E').multiplyScalar(1.28), hairC = new THREE.Color(av.hair || '#2A1B14').multiplyScalar(1.15);
  const recolor = (m, c, opt) => { m.material = m.material.clone(); m.material.color.set(c); if (opt && opt.metal) { m.material.metalness = opt.metal; m.material.roughness = .4; } if (opt && opt.glow) { m.material.emissive = new THREE.Color(opt.glow); m.material.emissiveIntensity = .6; } if (opt && opt.cloth) h3cloth(m.material, opt.rb); };
  o.traverse(m => {
    if (!m.isSkinnedMesh) return; const n = m.name, mn = (m.material && m.material.name) || '';
    const want = k => H3_PART[k].test(n);
    let keep = true, part = null;
    if (want('pauldron')) keep = false;
    else if (want('hood')) { keep = hood; part = 'hood'; }
    else if (want('bracer')) { keep = !!D.gloves; part = 'bracer'; }
    else if (want('body')) { keep = n.includes(pick.body); part = 'body'; }
    else if (want('arms')) { keep = n.includes(pick.body); part = 'arms'; }
    else if (want('legs')) { keep = n.includes(pick.legs); part = 'legs'; }
    else if (want('feet')) { keep = n.includes(pick.feet); part = 'feet'; }
    else if (/^Hair_/.test(n) || /Hair/.test(mn) && !/Eyebrow/i.test(n)) {
      const def = sx === 'm' ? 'Hair_SimpleParted' : 'Hair_Long', isBeard = /Beard/.test(n);
      keep = isBeard ? (sx === 'm' && npc && gray) : (n.startsWith(def) && !hood && !(hatProc && hatProc.t !== 'straw'));
    }
    if (!keep) { drop.push(m); return; }
    if (/Regular|Superhero/i.test(mn)) recolor(m, skinC);
    else if (/Hair/i.test(mn)) recolor(m, hairC);
    else if (part === 'arms' && tint.body) recolor(m, tint.body, Object.assign({ cloth: 1 }, hx(D.shirt)));
    else if (part && tint[part]) recolor(m, tint[part], Object.assign({ cloth: 1 }, hx({ body: D.shirt, legs: D.pants, feet: D.boots, bracer: D.gloves, hood: D.hat }[part])));
    m.castShadow = true; m.receiveShadow = true;
  });
  drop.forEach(m => m.parent.remove(m));
  let bones = {}; o.traverse(b => { if (b.isBone) bones[b.name] = b; });
  if (hatProc) { const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(tpl.hatM); bones.Head.add(g); const k = new THREE.Group(); k.scale.setScalar(.95); g.add(k);
    dressHero({ hat: hatProc }, (c, r, op) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r ?? .9 }, op || {})), 1, { head: k, hideHair: () => {} }); }
  const lamp = new THREE.Group(), lb = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .12, 8), new THREE.MeshStandardMaterial({ color: '#B8862E', roughness: .4, metalness: .6 })); lamp.add(lb);
  const gl = new THREE.Mesh(new THREE.SphereGeometry(.034, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFD27A' })); lamp.add(gl); const pl = new THREE.PointLight('#FFB45A', 5, 7, 1.6); lamp.add(pl); lamp.visible = !npc; o.add(lamp);
  const age = Math.max(12, Math.min(18, av.age || 16)); o.scale.setScalar(npc ? 1 : kid ? .66 + Math.max(0, Math.min(5, (av.age || 8) - 6)) * .018 : .9 + (age - 12) / 6 * .1);
  if (!npc || av.ins) insBelt(o, bones, av.ins || []);
  if (av.glow) glowApply(o, av.glow);
  const mixer = new THREE.AnimationMixer(o), act = new Proxy({}, { get: (c, k) => c[k] || (typeof k === 'string' && H3.clips[k] ? (c[k] = mixer.clipAction(H3.clips[k])) : undefined) });
  const idleK = h3idleFor(av, npc); act[idleK].play(); mixer.update(Math.random() * 3);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.36, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .3, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; o.add(shadow);
  o.userData = { hero: true, h3: { mixer, act, cur: idleK, idleK, bones, lamp, npc, headS: kid ? (npc ? 1.05 : 1.22) : 0, tagK: kid && !npc ? .74 : 1, kidP: kid && !npc ? kidProp(o, bones) : null } };
  if (npc) H3.npcs.push(o);
  return o;
}
/* idles de los personajes: cada uno con su manera de estar (Mixamo + Quaternius) */
const H3_IDLES = ['Idle_Loop', 'M_Standing_Idle', 'M_Idle', 'M_Thinking', 'M_Looking', 'M_Holding_Idle', 'M_Idle', 'M_Standing_Idle', 'M_Looking_Around'];
const H3_ONCE = /^(Death01|Interact|PickUp_Table|M_Standing_Up|M_Kneeling_Down|M_Throw|M_Picking_Up|M_Quick_Formal_Bow|M_Sit_To_Stand|M_Stand_To_Sit|M_Lifting_Object|M_Pick_Fruit.*|M_Yawn|M_Looking_Around|M_Shaking_Hands_2|M_Drinking|M_Thankful|M_Cheering|M_Kneeling_Inspecting)$/;
function h3idleFor(av, npc) {
  const ok = k => !!H3.clips[k];
  if (av.anim) { const l = [].concat(av.anim).filter(ok); if (l.length) return l[Math.floor(Math.random() * l.length)]; }
  if (!npc) return 'Idle_Loop';
  const l = H3_IDLES.filter(ok); return l[Math.floor(Math.random() * l.length)] || 'Idle_Loop';
}
// un NPC hace un gesto y vuelve a su idle
function h3npcPlay(o, keys, secs) {
  const u = o && o.userData && o.userData.h3; if (!u) return; const k = [].concat(keys).find(x => H3.clips[x]); if (!k) return;
  const a = u.act[k], b = u.act[u.cur]; a.reset(); a.setLoop(H3_ONCE.test(k) ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = true; a.play(); if (b && b !== a) a.crossFadeFrom(b, .3, false); u.cur = k; u.backT = secs || Math.min(4, H3.clips[k].duration);
}
// el jugador hace una acción con su animación (la primera que exista de la lista)
function h3do(keys, secs, off, speed) { if (!S) return; const k = [].concat(keys).find(x => H3.clips && H3.clips[x]) || [].concat(keys).pop(); S.actK = k; S.actT = secs; S.actO = off || 0; S.actS = speed || 1; S.fidT = 0; }
let _V = null;
function h3vec() { if (!_V) _V = { a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion(), pq: new THREE.Quaternion(), bq: new THREE.Quaternion(), rq: new THREE.Quaternion(), d: new THREE.Vector3(), m: new THREE.Matrix4() }; return _V; }
// gira un hueso para que apunte hacia una dirección (en el espacio del personaje)
function h3aim(av, B, bn, cn, x, y, z, w) {
  const b = B[bn], c = B[cn]; if (!b || !c || w <= 0) return; const V = h3vec();
  b.getWorldPosition(V.a); c.getWorldPosition(V.b); V.b.sub(V.a).normalize(); av.getWorldQuaternion(V.rq); V.d.set(x, y, z).normalize().applyQuaternion(V.rq);
  V.q.setFromUnitVectors(V.b, V.d); b.getWorldQuaternion(V.bq); b.parent.getWorldQuaternion(V.pq); V.q.multiply(V.bq); V.pq.invert().multiply(V.q); b.quaternion.slerp(V.pq, Math.min(1, w)); b.updateMatrixWorld(true);
}
function h3pose(av, t, dt, st) {
  const u = av.userData.h3, B = u.bones, p = st.poseW || 0, q = st.waveW || 0, air = (st.jy || 0) > .02;
  const has = k => !!H3.clips[k], me = st === S, mxPray = st.pose === 'pray' && has('M_Praying'), mxWave = (st.waveT || 0) > 0 && !u.moving && has('M_Waving');
  const fish = me && st.sv && st.sv.fishing, weak = me && st.sv && (st.sv.gray || 0) > .35, carry = me && !!st.carry;
  let want = st.pose === 'pray' ? (mxPray ? 'M_Praying' : 'Fixing_Kneeling') : air ? 'Jump_Loop' : u.moving ? (st.sprint && has('Sprint_Loop') ? 'Sprint_Loop' : u.run === false ? (u.npcFormal && has('Walk_Formal_Loop') ? 'Walk_Formal_Loop' : 'Walk_Loop') : 'Jog_Fwd_Loop') : (st.talk && has('M_Idle') ? 'M_Idle' : (u.idleK && has(u.idleK) ? u.idleK : 'Idle_Loop'));
  if (u.moving && !air) { if (carry && has('M_Holding_Walk') && !st.sprint) want = 'M_Holding_Walk'; else if (weak && has('M_Sad_Walk')) want = 'M_Sad_Walk'; }
  if (!u.moving && !air && st.pose !== 'pray') {
    if (st.down && has('Death01')) want = 'Death01'; else if (st.actT > 0 && has(st.actK)) want = st.actK; else if (st.sit && has('Sitting_Idle_Loop')) want = 'Sitting_Idle_Loop';
    else if (fish) want = fish.mode === 'net' ? (has('M_Pulling_A_Rope') ? 'M_Pulling_A_Rope' : want) : (fish.t < 2.4 && has('M_Fishing_Cast') ? 'M_Fishing_Cast' : has('M_Fishing_Idle') ? 'M_Fishing_Idle' : want);
    else if (mxWave) want = 'M_Waving';
    else if (carry && has('M_Holding_Idle')) want = 'M_Holding_Idle';
    else if (weak && has('M_Injured_Hurting_Idle')) want = 'M_Injured_Hurting_Idle';
    else if (me && !st.talk) { st.fidT = (st.fidT || 0) + dt; if (st.fidT > 14) { st.fidT = 0; const l = ['M_Looking_Around', 'M_Yawn', 'M_Thinking', 'M_Lengthy_Head_Nod'].filter(has); if (l.length) { const k = l[Math.floor(Math.random() * l.length)]; st.actK = k; st.actT = Math.min(5, H3.clips[k].duration); st.actO = 0; st.actS = 1; want = k; } } }
  } else if (me) st.fidT = 0;
  if (st.actT > 0) st.actT -= dt;
  if (want !== u.cur) { const a = u.act[want], o = u.act[u.cur]; a.reset(); a.timeScale = 1; const once = H3_ONCE.test(want); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once; if (want === 'Fixing_Kneeling') { a.time = a.getClip().duration * .3; a.timeScale = 0; } if (want === st.actK && st.actT > 0) { a.time = st.actO || 0; a.timeScale = st.actS || 1; } a.play(); if (o) a.crossFadeFrom(o, want === 'Death01' ? .15 : .28, false); u.cur = want; }
  if (u.cur === 'Jog_Fwd_Loop') u.act.Jog_Fwd_Loop.timeScale = 1.15;
  u.mixer.update(dt); if (u.headS && B.Head) B.Head.scale.setScalar(u.headS); if (u.kidP) kidApply(u); av.updateMatrixWorld(true);
  if (p > .01 && !mxPray) { // de rodillas con las dos rodillas en el piso
    ['l', 'r'].forEach(sd => { const sx = sd === 'l' ? .1 : -.1; h3aim(av, B, 'thigh_' + sd, 'calf_' + sd, sx, -1, .32, p); h3aim(av, B, 'calf_' + sd, 'foot_' + sd, sx * .4, -.1, -1, p); h3aim(av, B, 'foot_' + sd, 'ball_' + sd, 0, -.12, -1, p); });
    const V = h3vec(), pv = B.pelvis, kl = B.calf_l, kr = B.calf_r;
    if (pv && kl && kr) { kl.getWorldPosition(V.a); kr.getWorldPosition(V.b); const knee = Math.min(V.a.y, V.b.y); av.getWorldPosition(V.d); const dy = (V.d.y + .07 * av.scale.y - knee) * Math.min(1, p);
      pv.getWorldPosition(V.a); V.a.y += dy; pv.parent.worldToLocal(V.a); pv.position.copy(V.a); pv.updateMatrixWorld(true); }
  }
  if (p > .01 && !mxPray) { h3aim(av, B, 'spine_01', 'spine_02', 0, 1, .05, p); h3aim(av, B, 'spine_02', 'spine_03', 0, 1, .05, p); h3aim(av, B, 'spine_03', 'neck_01', 0, 1, .08, p); h3aim(av, B, 'neck_01', 'Head', 0, 1, .3, p);
    h3aim(av, B, 'upperarm_r', 'lowerarm_r', .18, -.88, .48, p); h3aim(av, B, 'lowerarm_r', 'hand_r', .38, .8, .45, p); h3aim(av, B, 'upperarm_l', 'lowerarm_l', -.18, -.88, .48, p); h3aim(av, B, 'lowerarm_l', 'hand_l', -.38, .8, .45, p); }
  if (q > .01 && !mxWave && u.cur !== 'M_Waving') { h3aim(av, B, 'upperarm_r', 'lowerarm_r', -.85, .38, .18, q); h3aim(av, B, 'lowerarm_r', 'hand_r', -.15 + Math.sin(t * 11) * .38, 1, .15, q); }
  if (me) toolPose(av, B, t, dt, st);
  if (me && u.talkT > -.4 && u.talkAge != null) { talkLayer(av, u, dt, null); if (u.talkT <= -.4) u.talkAge = null; }
  if (u.lamp.visible) { const V = h3vec(); B.hand_r.getWorldPosition(V.a); av.worldToLocal(V.a); u.lamp.position.copy(V.a); u.lamp.position.y -= .1 / av.scale.y; }
}
/* ---------- herramientas en la mano mientras se hace la acción: caña o red al pescar, hacha al talar, pico al picar, pedernal al encender ---------- */
const TOOLH = { line: null, bob: null, net: null, rope: null, fish: null, mats: null };
function toolMats() {
  if (TOOLH.mats) return TOOLH.mats; const M = (c, r, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r ?? .85, metalness: 0 }, o || {}));
  return TOOLH.mats = { wood: M('#7A5532', .8), dark: M('#4A3020', .85), iron: M('#8A8E96', .38, { metalness: .75 }), cane: M('#B89A62', .7), rope: M('#C9B48A', .95), stone: M('#34343C', .55), red: M('#C8402E', .6), white: M('#F2EEE4', .6),
    netw: new THREE.MeshStandardMaterial({ color: '#D8C9A2', roughness: 1, wireframe: true, transparent: true, opacity: .85 }), fish: M('#A9B4BC', .35, { metalness: .35 }) };
}
function toolMesh(geo, mat, x, y, z, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
function toolGroup(av, k) {
  const u = av.userData.h3; if (!u || !u.bones || !u.bones.hand_r) return null; u.tools = u.tools || {}; if (u.tools[k]) return u.tools[k];
  const T = toolMats(), g = new THREE.Group(), inn = new THREE.Group(); g.add(inn);
  if (k === 'axe') { const fb = new THREE.Group(); inn.add(fb); toolMesh(new THREE.CylinderGeometry(.018, .022, .62, 8), T.wood, 0, .19, 0, fb); const bl = toolMesh(new THREE.BoxGeometry(.02, .1, .16), T.iron, 0, .44, .07, fb); bl.rotation.x = .08;
    phOne('wooden_axe', inn, 0, -.12, 0, 0, 1, { done: () => { fb.visible = false; } }); }
  else if (k === 'pick') { toolMesh(new THREE.CylinderGeometry(.018, .022, .66, 8), T.wood, 0, .21, 0, inn); const h = toolMesh(new THREE.BoxGeometry(.03, .04, .42), T.iron, 0, .5, 0, inn); h.rotation.x = .12;
    const tp = toolMesh(new THREE.ConeGeometry(.02, .09, 6), T.iron, 0, .5, .25, inn); tp.rotation.x = Math.PI / 2; const tq = toolMesh(new THREE.ConeGeometry(.02, .09, 6), T.iron, 0, .5, -.25, inn); tq.rotation.x = -Math.PI / 2; }
  else if (k === 'rod') { toolMesh(new THREE.CylinderGeometry(.022, .026, .32, 8), T.dark, 0, 0, 0, inn); toolMesh(new THREE.CylinderGeometry(.006, .02, 1.7, 6), T.cane, 0, 1, 0, inn);
    const rl = toolMesh(new THREE.TorusGeometry(.035, .01, 6, 12), T.iron, .03, .1, 0, inn); rl.rotation.y = Math.PI / 2; const tip = new THREE.Object3D(); tip.position.set(0, 1.85, 0); inn.add(tip); g.userData.tip = tip; }
  else if (k === 'net') { const b = toolMesh(new THREE.IcosahedronGeometry(.16, 1), T.netw, 0, .1, .05, inn); b.scale.set(1, .75, 1); toolMesh(new THREE.TorusGeometry(.12, .012, 6, 14), T.rope, 0, .1, .05, inn); }
  else if (k === 'flint') { toolMesh(new THREE.DodecahedronGeometry(.045, 0), T.stone, 0, .05, .02, inn); toolMesh(new THREE.BoxGeometry(.07, .018, .03), T.iron, .02, .1, .03, inn); }
  g.scale.setScalar(1 / Math.max(.5, av.scale.x)); g.rotation.set(0, 0, Math.PI / 2); g.visible = false; g.traverse(o => { o.frustumCulled = false; }); u.bones.hand_r.add(g); u.tools[k] = g; return g;
}
// la línea de la caña y la red flotando van en la escena (no en la mano)
function toolWorld() {
  if (TOOLH.line || !S) return; const T = toolMats();
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3)); TOOLH.line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: '#EDEDED', transparent: true, opacity: .8 })); TOOLH.line.frustumCulled = false; S.scene.add(TOOLH.line);
  const bob = new THREE.Group(); toolMesh(new THREE.SphereGeometry(.05, 10, 8), T.red, 0, 0, 0, bob); toolMesh(new THREE.SphereGeometry(.05, 10, 8, 0, 6.29, 0, 1.4), T.white, 0, .005, 0, bob); S.scene.add(bob); TOOLH.bob = bob;
  const net = new THREE.Group(); const disk = toolMesh(new THREE.CircleGeometry(1.1, 18, 0, 6.29), T.netw, 0, 0, 0, net); disk.rotation.x = -Math.PI / 2; const rim = toolMesh(new THREE.TorusGeometry(1.1, .02, 6, 30), T.rope, 0, 0, 0, net); rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; toolMesh(new THREE.CylinderGeometry(.04, .04, .05, 8), T.wood, Math.cos(a) * 1.1, .02, Math.sin(a) * 1.1, net); } S.scene.add(net); TOOLH.net = net;
  const fish = new THREE.Group(); const bd = toolMesh(new THREE.SphereGeometry(.07, 10, 8), T.fish, 0, 0, 0, fish); bd.scale.set(.55, 2.2, 1); const tl = toolMesh(new THREE.ConeGeometry(.06, .1, 4), T.fish, 0, -.19, 0, fish); tl.rotation.x = Math.PI; S.scene.add(fish); TOOLH.fish = fish;
  [TOOLH.line, bob, net, fish].forEach(o => { o.visible = false; });
}
function toolWaterSpot(dist) { // el primer punto con agua delante del personaje
  const a = S.av.position, fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), WL = WATER.WL; let d = 1.5;
  for (; d < 14; d += .5) if (S.W.hAt(a.x + fx * d, a.z + fz * d) < WL - .04) break; d = d >= 14 ? dist : d + dist * .5;
  return [a.x + fx * d, WL + .02, a.z + fz * d];
}
function toolLine(p0, p1, sag) { const P = TOOLH.line.geometry.attributes.position; for (let i = 0; i < 16; i++) { const k = i / 15; P.setXYZ(i, p0.x + (p1.x - p0.x) * k, p0.y + (p1.y - p0.y) * k - Math.sin(k * Math.PI) * sag, p0.z + (p1.z - p0.z) * k); } P.needsUpdate = true; TOOLH.line.visible = true; }
// orienta la herramienta según el antebrazo (mango perpendicular al puño) o, la caña, hacia adelante y arriba
const _ta = { a: null };
function toolAim(av, B, g, k, f, st) {
  if (!g || !B.lowerarm_r || !B.hand_r) return; const T = _ta.a || (_ta.a = { p: new THREE.Vector3(), h: new THREE.Vector3(), d: new THREE.Vector3(), r: new THREE.Vector3(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion(), pq: new THREE.Quaternion(), m: new THREE.Matrix4() });
  B.lowerarm_r.getWorldPosition(T.p); B.hand_r.getWorldPosition(T.h); T.d.copy(T.h).sub(T.p).normalize(); av.getWorldQuaternion(T.q); T.r.set(-1, 0, 0).applyQuaternion(T.q);
  if (k === 'rod') { const c = f && f.t < .9 ? Math.min(1, f.t / .9) : 1, up = (st.catchT || 0) > 0 ? .4 : 0; T.y.set(0, 1 - c * .45 + up, -.45 + c * 1.45 - up * .6).normalize().applyQuaternion(T.q); }
  else T.y.crossVectors(T.r, T.d).normalize();
  T.z.copy(T.d).addScaledVector(T.y, -T.d.dot(T.y)); if (T.z.lengthSq() < 1e-4) T.z.set(0, 0, 1).applyQuaternion(T.q); T.z.normalize(); T.x.crossVectors(T.y, T.z).normalize();
  T.m.makeBasis(T.x, T.y, T.z); T.q.setFromRotationMatrix(T.m); B.hand_r.getWorldQuaternion(T.pq); g.quaternion.copy(T.pq.invert().multiply(T.q));
  T.s.copy(T.h).addScaledVector(T.d, .06); B.hand_r.worldToLocal(T.s); g.position.copy(T.s); B.hand_r.getWorldScale(T.p); g.scale.setScalar(1 / Math.max(.05, T.p.x)); g.updateMatrixWorld(true);
}
function toolPose(av, B, t, dt, st) {
  const sv = st.sv, f = sv && sv.fishing; toolWorld(); if (!TOOLH.line) return;
  if ((st.catchT || 0) > 0) st.catchT -= dt; if ((st.toolT || 0) > 0) { st.toolT -= dt; if (st.toolT <= 0) st.toolK = null; }
  let want = null; if (f) want = f.mode === 'net' ? (f.t < .9 ? 'net' : null) : 'rod'; else if (st.catchT > 0) want = 'rod'; else if (st.toolK) want = st.toolK;
  const u = av.userData.h3; if (want) toolGroup(av, want); if (u.tools) for (const k in u.tools) u.tools[k].visible = k === want;
  // golpe de hacha: brazos arriba sobre el hombro y bajan de golpe hacia adelante
  if ((st.chopT || 0) > 0 && (want === 'axe')) { st.chopT -= dt; const ph = 1 - Math.max(0, st.chopT) / (st.chopD || .85), w = Math.min(1, ph * 8, Math.max(0, st.chopT) * 10 + (st.chopT > 0 ? .4 : 0));
    const up = ph < .55 ? ph / .55 : ph < .72 ? 1 - (ph - .55) / .17 : 0, e = up * up * (3 - 2 * up);
    const dx = -.08 - e * .2, dy = -.35 + e * 1.3, dz = 1 - e * 1.25;
    h3aim(av, B, 'upperarm_r', 'lowerarm_r', dx, dy, dz, w); h3aim(av, B, 'lowerarm_r', 'hand_r', dx * .5, dy + .15, dz + .2, w);
    h3aim(av, B, 'upperarm_l', 'lowerarm_l', -dx * .2 - .12, dy - .1, dz, w); h3aim(av, B, 'lowerarm_l', 'hand_l', -.18, dy + .1, dz + .25, w);
    h3aim(av, B, 'spine_02', 'spine_03', 0, 1, .1 + (1 - e) * .35, w * .6); }
  if (want && u.tools[want]) toolAim(av, B, u.tools[want], want, f, st);
  // caña: línea desde la punta hasta la boya; la boya vuela al lanzar y se hunde cuando pica
  const g = u.tools && u.tools.rod, V = h3vec();
  if (want === 'rod' && g && g.userData.tip) { g.userData.tip.getWorldPosition(V.a);
    if (st.catchT > 0) { TOOLH.bob.visible = false; TOOLH.fish.visible = true; TOOLH.fish.position.set(V.a.x, V.a.y - .75 - Math.sin(t * 9) * .04, V.a.z); TOOLH.fish.rotation.z = Math.sin(t * 14) * .5; V.b.copy(TOOLH.fish.position); V.b.y += .2; toolLine(V.a, V.b, 0); }
    else { if (!f.spot) f.spot = toolWaterSpot(4.5); const k = Math.max(0, Math.min(1, (f.t - .9) / .6)), bite = f.t >= f.bite && f.t <= f.bite + (f.win || 1); TOOLH.fish.visible = false;
      if (f.t < .9) { TOOLH.line.visible = false; TOOLH.bob.visible = false; }
      else { const s = f.spot; TOOLH.bob.visible = true; TOOLH.bob.position.set(V.a.x + (s[0] - V.a.x) * k, k < 1 ? V.a.y + (s[1] - V.a.y) * k + Math.sin(k * Math.PI) * 1.2 : s[1] + Math.sin(t * 2.2) * .015 - (bite ? .05 + Math.abs(Math.sin(t * 13)) * .05 : 0), V.a.z + (s[2] - V.a.z) * k);
        V.b.copy(TOOLH.bob.position); toolLine(V.a, V.b, k < 1 ? 0 : (bite ? .02 : .35)); } } }
  else if (f && f.mode === 'net') { if (!f.spot) f.spot = toolWaterSpot(2.5); const s = f.spot, k = Math.max(0, Math.min(1, (f.t - .7) / .6)); TOOLH.bob.visible = false; TOOLH.fish.visible = false;
    if (k > 0) { B.hand_r.getWorldPosition(V.a); TOOLH.net.visible = true; TOOLH.net.position.set(V.a.x + (s[0] - V.a.x) * k, k < 1 ? V.a.y + (s[1] - V.a.y) * k + Math.sin(k * Math.PI) : s[1] - Math.min(.12, (f.t - 1.3) * .03), V.a.z + (s[2] - V.a.z) * k); TOOLH.net.scale.setScalar(.25 + k * .75); TOOLH.net.rotation.y = f.t * .1;
      V.b.copy(TOOLH.net.position); toolLine(V.a, V.b, .25); } else { TOOLH.net.visible = false; TOOLH.line.visible = false; } }
  else { TOOLH.line.visible = false; TOOLH.bob.visible = false; TOOLH.net.visible = false; TOOLH.fish.visible = st.catchT > 0 && TOOLH.fish.visible; if (!(st.catchT > 0)) TOOLH.fish.visible = false; }
}
// chispas del pedernal antes de que prenda el fuego
function fireSparks(x, y, z, n) {
  if (!S) return; const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#FFD27A', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), P = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.018, 5, 4), m); s.position.set(x, y, z); g.add(s); P.push({ s, v: [(Math.random() - .5) * 1.6, .8 + Math.random() * 1.6, (Math.random() - .5) * 1.6] }); }
  S.scene.add(g); const t0 = performance.now(); let last = t0;
  const step = now => { const dt = Math.min(.05, (now - last) / 1000), age = (now - t0) / 1000; last = now; P.forEach(p => { p.v[1] -= 4 * dt; p.s.position.x += p.v[0] * dt; p.s.position.y = Math.max(y - .02, p.s.position.y + p.v[1] * dt); p.s.position.z += p.v[2] * dt; }); m.opacity = Math.max(0, 1 - age / .55);
    if (age < .55 && S) requestAnimationFrame(step); else { S && S.scene.remove(g); m.dispose(); } };
  requestAnimationFrame(step);
}
// pescado en un espetón sobre el fuego mientras se cocina; se va dorando
function fireSpit(f, secs) {
  if (!f || !f.g || f.spit) return; const T = toolMats(), g = new THREE.Group(); [-1, 1].forEach(sd => { const st = toolMesh(new THREE.CylinderGeometry(.018, .02, .72, 6), T.wood, sd * .42, .36, 0, g); st.rotation.z = sd * .08; });
  const bar = toolMesh(new THREE.CylinderGeometry(.012, .012, 1, 6), T.wood, 0, .66, 0, g); bar.rotation.z = Math.PI / 2;
  const fm = T.fish.clone(); const fish = new THREE.Group(); const bd = toolMesh(new THREE.SphereGeometry(.07, 10, 8), fm, 0, 0, 0, fish); bd.scale.set(2.4, .6, 1); const tl = toolMesh(new THREE.ConeGeometry(.06, .1, 4), fm, -.2, 0, 0, fish); tl.rotation.z = Math.PI / 2; fish.position.set(0, .62, 0); g.add(fish);
  f.g.add(g); f.spit = g; const t0 = performance.now(), c0 = new THREE.Color('#A9B4BC'), c1 = new THREE.Color('#8A5A2A');
  const step = now => { const k = Math.min(1, (now - t0) / (secs * 1000)); fm.color.copy(c0).lerp(c1, k); fish.rotation.x = k * 6.28 * 2; if (k < 1 && f.g.parent) requestAnimationFrame(step); else { f.g.remove(g); f.spit = null; fm.dispose(); } };
  requestAnimationFrame(step);
}
/* ---------- conversación natural para quien habla: respira, mueve apenas la cabeza, mira a quien escucha
   y cada tanto hace un gesto suave con una mano. Reemplaza los clips de gesticulación exagerada. ---------- */
const TALK_BASE = ['M_Standing_Idle', 'M_Idle', 'Idle_Loop'];
function talkGo(o, secs, g) {
  const u = o && o.userData && o.userData.h3; if (!u) return; if (o !== (S && S.av)) h3npcPlay(o, TALK_BASE, secs);
  u.talkT = secs; u.talkAge = 0; u.talkPh = u.talkPh ?? Math.random() * 6.28; u.gestT = g === 'point' ? .4 : 1.2 + Math.random() * 1.8; u.gest = null; u.nodT = g === 'nod' ? .2 : 1.5 + Math.random() * 2;
}
function talkLayer(o, u, dt, tgt) {
  const B = u.bones; if (!B || !B.Head || !B.neck_01) return; u.talkT -= dt; u.talkAge += dt; const tt = (u.talkPh += dt);
  const w = Math.max(0, Math.min(1, u.talkAge * 2.5, (u.talkT + .4) * 2.5)); if (w <= 0) return; o.updateMatrixWorld(true);
  const V = h3vec(); // mirar a quien escucha (en el espacio del personaje)
  let lx = 0, ly = 0, lz = 1; if (tgt) { B.Head.getWorldPosition(V.a); V.d.copy(tgt).sub(V.a); o.getWorldQuaternion(V.rq); V.d.applyQuaternion(V.rq.invert()); const L = Math.hypot(V.d.x, V.d.z) || 1; lx = Math.max(-.6, Math.min(.6, V.d.x / L)); lz = Math.max(.6, V.d.z / L); ly = Math.max(-.25, Math.min(.2, V.d.y / L)); }
  // asentimiento corto y ocasional (acompaña lo que dice), más una deriva lenta y pequeña
  u.nodT -= dt; if (u.nodT <= 0) { u.nod = 0; u.nodT = 2.2 + Math.random() * 3; } if (u.nod != null) { u.nod += dt; if (u.nod > .7) u.nod = null; }
  const nod = u.nod != null ? Math.sin(u.nod / .7 * Math.PI) * .09 : 0, sway = Math.sin(tt * .9) * .035 + Math.sin(tt * 2.1 + 1) * .015;
  h3aim(o, B, 'neck_01', 'Head', lx * .5 + sway, .55 + ly * .4 - nod, lz, w * .55);
  // respiración: el pecho sube y baja muy poco
  if (B.spine_02 && B.spine_03) h3aim(o, B, 'spine_02', 'spine_03', 0, 1, .06 + Math.sin(tt * 1.7) * .025, w * .25);
  // gesto de mano suave: el antebrazo sube un poco y abre la palma, y vuelve; alterna manos, nunca seguido
  u.gestT -= dt; if (!u.gest && u.gestT <= 0 && u.talkT > 1.2) { u.gest = { s: Math.random() < .6 ? 'r' : 'l', k: 0, d: 1.3 + Math.random() * .6 }; u.gestT = 3.5 + Math.random() * 3.5; }
  if (u.gest) { const gs = u.gest; gs.k += dt / gs.d; if (gs.k >= 1) u.gest = null; else { const e = Math.sin(gs.k * Math.PI), sx = gs.s === 'r' ? -1 : 1, lo = 'lowerarm_' + gs.s, hd = 'hand_' + gs.s;
    if (B[lo] && B[hd]) { h3aim(o, B, lo, hd, sx * .25, -.05 + e * .15, 1, e * .55 * w); h3aim(o, B, hd, hd === 'hand_r' ? (B.middle_01_r ? 'middle_01_r' : hd) : (B.middle_01_l ? 'middle_01_l' : hd), sx * .35, .1, 1, e * .3 * w); } } }
}
function h3npcTick(dt) {
  if (!S || !H3.npcs.length) return; const a = S.av.position;
  for (const o of H3.npcs) { if (!o.parent) continue; const u = o.userData.h3;
    if (u.backT > 0 && (u.backT -= dt) <= 0) { const a = u.act[u.idleK], b = u.act[u.cur]; a.reset(); a.setLoop(THREE.LoopRepeat); a.play(); if (b && b !== a) a.crossFadeFrom(b, .4, false); u.cur = u.idleK; }
    const e = o.matrixWorld.elements, d = (e[12] - a.x) ** 2 + (e[14] - a.z) ** 2, vis = d < [1600, 2500, 4900, 8100][QUAL.lv]; if (o.visible !== vis) o.visible = vis; if (d < 1600 && vis) { u.mixer.update(dt); if (u.headS && u.bones.Head) u.bones.Head.scale.setScalar(u.headS); if (u.talkT > -.4 && u.talkAge != null) { const V = h3vec(); S.av.getWorldPosition(V.b); V.b.y += 1.5 * S.av.scale.y; talkLayer(o, u, dt, CINE.on && S.camera ? S.camera.position : V.b); if (u.talkT <= -.4) u.talkAge = null; } } }
}

/* ---------- Poly Haven (CC0): árboles, rocas, plantas y objetos reales escaneados ----------
   Cada modelo se baja recién cuando el jugador se acerca a la zona donde aparece (por franjas),
   se dibuja con instancias y las franjas lejanas se apagan, para que ande fluido en el celular. */
const PHB = ABASE ? ABASE + 'ph/' : new URL('../ph/', import.meta.url).href;
const PH = { L: null, cache: {}, bands: [], one: [], uT: { value: 0 }, kids: false, near: 0 };
const PH_BAND = 150; // franjas grandes: menos dibujos por modelo
async function phLoader() { if (!PH.L) PH.L = (async () => { globalThis.__THREE = THREE; const mod = await import(H3_BASE + 'gltf.js'), L = new mod.GLTFLoader(); if (mod.MeshoptDecoder) L.setMeshoptDecoder(mod.MeshoptDecoder); try { const K = await texLoader(); if (K) L.setKTX2Loader(K); } catch (e) {} return L; })(); return PH.L; }
// recortes de hojas y pasto (los mapas alfa de Poly Haven vienen aparte): sin esto las tarjetas de hojas se ven como placas opacas
const PH_ALPHA = { island_tree_01: '_leaves', island_tree_02: '_leaves', island_tree_03: '_leaves', jacaranda_tree: '_leaves', tree_small_02: '_leaves', pine_sapling_small: '_twig', searsia_burchellii: '_leaves', searsia_lucida: '_leaves', wild_rooibos_bush: '_leaves',
  celandine_01: '', dandelion_01: '', flower_heliophila: '', grass_bermuda_01: '', grass_medium_01: '', grass_medium_02: '', nettle_plant: '', shrub_01: '', shrub_02: '', shrub_03: '', shrub_04: '' };
async function phAlpha(id, root) {
  if (!(id in PH_ALPHA)) return; const want = id + PH_ALPHA[id]; let tex = null;
  try { tex = await new THREE.TextureLoader().loadAsync(PHB + 'alpha/' + id + '.png'); } catch (e) { return; } tex.flipY = false; tex.colorSpace = THREE.NoColorSpace || '';
  root.traverse(o => { if (!o.isMesh) return; [].concat(o.material).forEach(m => { if (!m || m.name !== want || m.alphaMap) return; const a = tex.clone(); const mp = m.map;
    if (mp) { a.offset.copy(mp.offset); a.repeat.copy(mp.repeat); a.rotation = mp.rotation; a.center.copy(mp.center); a.wrapS = mp.wrapS; a.wrapT = mp.wrapT; if ('channel' in mp) a.channel = mp.channel; }
    a.needsUpdate = true; m.alphaMap = a; m.alphaTest = .5; m.transparent = false; m.depthWrite = true; m.side = THREE.DoubleSide; m.needsUpdate = true; }); });
}
function phGet(id) {
  if (!PH.cache[id]) PH.cache[id] = phLoader().then(L => new Promise((r, j) => L.load(PHB + id + '.glb', r, undefined, j))).then(async g => {
    await phAlpha(id, g.scene); g.scene.updateMatrixWorld(true); const vars = (g.scene.children.length ? g.scene.children : [g.scene]).map(c => { const ms = []; c.traverse(o => { if (o.isMesh) ms.push({ geo: o.geometry, mat: o.material, m: o.matrixWorld.clone() }); }); return ms; }).filter(v => v.length);
    return vars;
  }).catch(e => { console.warn('ph', id, e); return []; });
  return PH.cache[id];
}
function phMat(m, o) {
  const k = '_ph' + (o.wind ? 'w' + o.wind : '') + (o.grass ? 'g' : '') + (PH.kids ? 'k' : ''); if (m[k]) return m[k];
  const c = m.clone(); if (PH.kids && c.color) c.color.multiplyScalar(1.12);
  if (o.wind) { if (o.wind < 3) c.side = THREE.DoubleSide; c.onBeforeCompile = sh => { sh.uniforms.uT = PH.uT; const W = o.wind > 2 ? ['1.5', '7.', '.022', '.6'] : o.wind > 1 ? ['0.', '.8', '.06', '1.4'] : ['0.', '1.3', '.04', '1.2'];
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <project_vertex>', 'vec4 wp=vec4(transformed,1.);vec3 bp=vec3(0.);\n#ifdef USE_INSTANCING\nwp=instanceMatrix*wp;bp=instanceMatrix[3].xyz;\n#endif\nwp=modelMatrix*wp;bp=(modelMatrix*vec4(bp,1.)).xyz;\nfloat hh=wp.y-bp.y,k=clamp((hh-' + W[0] + ')/' + W[1] + ',0.,1.);k*=k;float ph=uT*' + W[3] + '+bp.x*.37+bp.z*.29;\nwp.x+=(sin(ph)*.7+sin(ph*2.3+1.)*.3)*' + W[2] + '*k*max(hh,1.)+sin(uT*3.1+wp.x*2.3+wp.z*1.9)*.012*k;wp.z+=cos(ph*.8+.6)*' + W[2] + '*.5*k*max(hh,1.);\nvec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;'); }; c.customProgramCacheKey = () => 'phw2' + o.wind; }
  if (o.grass) seasonMat(c);
  m[k] = c; return c;
}
/* ---------- estaciones: cambian solas cada 8 semanas reales (primavera → verano → otoño → invierno, ciclo de 32 semanas),
   contadas desde una fecha fija común para que todos vean la misma. Entre una y otra hay 4 días de transición.
   Solo cambian tintes, densidad de flores, nubes y lluvia: no se recargan texturas. ---------- */
const SEAS = { auto: true, EPOCH: Date.UTC(2026, 10, 2, 3), LEN: 8 * 7 * 864e5, XF: 4 * 864e5,
  NAMES: ['Primavera', 'Verano', 'Otoño', 'Invierno'], ICON: ['🌸', '☀️', '🍂', '🌧️'],
  // frase del material que se muestra una vez, al entrar, cada vez que empieza una estación nueva (canal 10)
  FRASE: ['Las laderas de Galilea se llenan de flores silvestres, como las anémonas rojas. Muchos piensan que en ellas pensaba Jesús cuando dijo que miraran los lirios del campo (Mateo 6:28).',
    'En verano todo se seca y se dora, y llega la cosecha de higos, uvas y aceitunas.',
    'Vuelven las lluvias: las tempranas que Dios le prometía a su pueblo (Deuteronomio 11:14).',
    'En Israel llueve en otoño e invierno. Después llegan las lluvias tardías, que también eran una promesa de Dios (Deuteronomio 11:14).'],
  // tinte del pasto, cuánto se seca, flores (anémonas, amarillas, adelfas), lluvia y cielo gris
  P: [{ t: [.42, .62, .22], dry: .08, an: 1, ye: 1, ol: .45, rain: .04, gray: 0 }, { t: [.78, .62, .3], dry: .72, an: 0, ye: .15, ol: 1, rain: 0, gray: 0 },
    { t: [.66, .48, .26], dry: .5, an: 0, ye: .05, ol: .25, rain: .22, gray: .38 }, { t: [.38, .55, .28], dry: .18, an: .12, ye: .3, ol: 0, rain: .42, gray: .55 }],
  u: { sTint: { value: { r: .42, g: .62, b: .22 } }, sDry: { value: .08 }, jud: { value: { x: 0, y: 0, z: 0 } } }, cur: null, acc: 9, rainOn: false };
function seasonNow(t) {
  t = t ?? Date.now(); if (!SEAS.auto) t = SEAS.EPOCH + 864e5; const n = Math.floor((t - SEAS.EPOCH) / SEAS.LEN), i = ((n % 4) + 4) % 4, into = (t - SEAS.EPOCH) - n * SEAS.LEN, k = Math.max(0, (into - (SEAS.LEN - SEAS.XF)) / SEAS.XF), sk = k * k * (3 - 2 * k);
  const A = SEAS.P[i], B = SEAS.P[(i + 1) % 4], L = (a, b) => a + (b - a) * sk; return { i, n, k: sk, name: SEAS.NAMES[i], icon: SEAS.ICON[i], t: [0, 1, 2].map(j => L(A.t[j], B.t[j])), dry: L(A.dry, B.dry), an: L(A.an, B.an), ye: L(A.ye, B.ye), ol: L(A.ol, B.ol), rain: L(A.rain, B.rain), gray: L(A.gray, B.gray) };
}
function seasonApply(s) { const v = SEAS.u.sTint.value; v.r = s.t[0]; v.g = s.t[1]; v.b = s.t[2]; SEAS.u.sDry.value = s.dry; }
SEAS.cur = seasonNow(); seasonApply(SEAS.cur);
// fragmento GLSL que tiñe un color de pasto según la estación
const SEAS_GLSL = 'uniform vec3 sTint;uniform float sDry;\nvec3 seasG(vec3 c){float L=dot(c,vec3(.333));vec3 dry=vec3(L)*sTint*2.15;vec3 wet=c*mix(vec3(1.),sTint*2.,.28);return mix(wet,dry,sDry);}\n';
function seasonMat(m) { // pasto e hierbas: aplica el tinte de estación después del color de la textura
  const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.sTint = SEAS.u.sTint; sh.uniforms.sDry = SEAS.u.sDry; sh.fragmentShader = SEAS_GLSL + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb=seasG(diffuseColor.rgb);'); };
  const pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => ''; m.customProgramCacheKey = () => pk() + '|seas'; return m;
}
// flores silvestres: anémonas rojas y flores amarillas en tarjetas cruzadas, instanciadas por parcelas (la densidad sigue a la calidad)
function flowerTex(kind) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); c.strokeStyle = '#4E6E2E'; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 128); c.quadraticCurveTo(60, 90, 64, 52); c.stroke();
  c.fillStyle = '#5E7E36'; c.beginPath(); c.ellipse(52, 100, 12, 4, -.6, 0, 6.28); c.fill(); c.beginPath(); c.ellipse(76, 92, 12, 4, .6, 0, 6.28); c.fill();
  const N = kind === 'an' ? 6 : 10, col = kind === 'an' ? '#D8222A' : kind === 'ol' ? '#F2F2F2' : '#F2C230';
  for (let i = 0; i < N; i++) { const a = i / N * 6.283; c.fillStyle = col; c.beginPath(); c.ellipse(64 + Math.cos(a) * 14, 38 + Math.sin(a) * 14, kind === 'an' ? 15 : 11, kind === 'an' ? 11 : 5, a, 0, 6.28); c.fill(); }
  c.fillStyle = kind === 'an' ? '#1E1424' : '#B8701E'; c.beginPath(); c.arc(64, 38, kind === 'an' ? 8 : 7, 0, 6.28); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function flowerField(scene, W, allPts, R, put, M4, CL, Q) {
  const cg = new THREE.BufferGeometry(), cp = [], cu = [], ci = []; for (let k = 0; k < 2; k++) { const an = k * Math.PI / 2, cx = Math.cos(an) * .5, cz = Math.sin(an) * .5, o = cp.length / 3; cp.push(-cx, 0, -cz, cx, 0, cz, cx, 1, cz, -cx, 1, -cz); cu.push(0, 0, 1, 0, 1, 1, 0, 1); ci.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(cp.length / 3).fill([0, 1, 0]).flat(), 3)); cg.setIndex(ci);
  const coarse = Q.sh <= 2048;
  [['an', coarse ? 2600 : 6000], ['ye', coarse ? 2200 : 5000]].forEach(([kind, n]) => { const m = new THREE.MeshLambertMaterial({ map: flowerTex(kind), alphaTest: .5, side: THREE.DoubleSide }); const L = [];
    // en manchas: cada flor nace cerca de un "foco" para que haya grupos y claros
    const foci = []; for (let i = 0; i < n / 40; i++) { const p = allPts[Math.floor(R() * allPts.length)], a = R() * 6.28, r = 3 + Math.pow(R(), 1.3) * 26; foci.push([p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r]); }
    for (let i = 0; i < n * 1.5 && L.length < n; i++) { const f = foci[Math.floor(R() * foci.length)], a = R() * 6.28, r = Math.pow(R(), .7) * 4, x = f[0] + Math.cos(a) * r, z = f[1] + Math.sin(a) * r; if (W.dAt(x, z) < 1.6 || W.hAt(x, z) > 7 || W.hAt(x, z) < .02) continue; L.push({ x, z, h: .22 + R() * .2, rot: R() * 6.28, c: R() }); }
    chunkInst(scene, cg, m, L, (o, i, im) => { put(o.x, W.hAt(o.x, o.z) - .02, o.z, 0, o.rot, 0, o.h * .9, o.h, o.h * .9); im.setMatrixAt(i, M4); im.setColorAt(i, CL.setRGB(.9 + o.c * .2, .9 + o.c * .2, .9 + o.c * .2)); }, { recv: true });
    FLORA.chunks.slice(-1000).forEach(im => { if (im.material === m) im.userData.fl = kind; }); });
}
// adelfas junto al agua: matas verde oscuro con flores rosas, rojas y blancas (florecen sobre todo en verano)
function oleanders(scene, W, R) {
  const spots = []; (S.pois || []).forEach(p => { if (p.k !== 'lake' && p.k !== 'shore') return; const cx = p.k === 'shore' ? p.x + p.side * 7 : p.x, cz = p.z, r0 = p.k === 'shore' ? 9 : 31;
    for (let t = 0; t < 120 && spots.length < 70; t++) { const a = R() * 6.283; let r = r0 * .7; while (r < r0 * 2.6 && W.hAt(cx + Math.cos(a) * r, cz + Math.sin(a) * r) < -.01) r += .4; r += 1 + R() * 6; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (W.dAt(x, z) < 2.4 || blockedAt(x, z)) continue; spots.push({ x, z, s: .8 + R() * .6, ry: R() * 6.28 }); } });
  if (!spots.length) return; const lt = dpalmTex().leaf, lm = new THREE.MeshStandardMaterial({ map: lt, alphaTest: .45, side: THREE.DoubleSide, color: '#4E6E3E', roughness: .8 }), fm = new THREE.MeshLambertMaterial({ map: flowerTex('ol'), alphaTest: .5, side: THREE.DoubleSide });
  const leaves = [], blos = [], RR = rng(91); for (let i = 0; i < 46; i++) { const a = RR() * 6.28, el = .2 + RR() * 1.1, len = .5 + RR() * .4, y = .2 + RR() * 1.2; const g = new THREE.PlaneGeometry(.09, len); g.translate(0, len / 2, 0); g.rotateX(-(Math.PI / 2 - el)); g.rotateY(a); g.translate(Math.cos(a) * .2, y, Math.sin(a) * .2); leaves.push(g); }
  for (let i = 0; i < 26; i++) { const a = RR() * 6.28, r = .3 + RR() * .5, y = .9 + RR() * .9; const g = new THREE.PlaneGeometry(.34, .34); g.translate(0, .17, 0); g.rotateY(RR() * 6.28); g.translate(Math.cos(a) * r, y, Math.sin(a) * r); blos.push(g); }
  const mg = l => { const o = mergeGeos(l); const uv = []; l.forEach(g => { const u = g.toNonIndexed().attributes.uv.array; for (let i = 0; i < u.length; i++) uv.push(u[i]); }); o.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return o; };
  const gL = mg(leaves), gB = mg(blos), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3(), C = new THREE.Color(), cols = ['#F07AA8', '#E0304A', '#F6F2EE', '#F49AC0'];
  const iL = new THREE.InstancedMesh(gL, phMat(lm, { wind: 1 }), spots.length), iB = new THREE.InstancedMesh(gB, phMat(fm, { wind: 1 }), spots.length);
  spots.forEach((it, i) => { E.set(0, it.ry, 0); Q.setFromEuler(E); M4.compose(V.set(it.x, W.hAt(it.x, it.z) - .05, it.z), Q, SC.setScalar(it.s)); iL.setMatrixAt(i, M4); iB.setMatrixAt(i, M4); iB.setColorAt(i, C.set(cols[i % 4])); phCyl(it.x, it.z, .45 * it.s); });
  [iL, iB].forEach(im => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = QUAL.lv > 1; im.receiveShadow = true; scene.add(im); }); iB.userData.n = spots.length; SEAS.olB = iB;
}
// lluvia: líneas que caen alrededor de la cámara, solo en ratos de lluvia (se decide por tramos de 20 minutos, igual para todos)
function rainTick(dt) {
  if (!S || !S.scene) return; const s = SEAS.cur, slot = Math.floor(Date.now() / 12e5), hsh2 = Math.abs(Math.sin(slot * 12.9898) * 43758.5453) % 1, on = !S.indoor && hsh2 < s.rain;
  if (on && !SEAS.rain) { const n = QUAL.lv >= 2 ? 1800 : 700, P = new Float32Array(n * 6); for (let i = 0; i < n; i++) { const x = (Math.random() - .5) * 40, y = Math.random() * 18, z = (Math.random() - .5) * 40; P.set([x, y, z, x - .05, y - .55, z], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); SEAS.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#C8D2DC', transparent: true, opacity: .38, depthWrite: false })); SEAS.rain.frustumCulled = false; S.scene.add(SEAS.rain); }
  if (SEAS.rain) { SEAS.rain.visible = on; if (on) { const c = S.camera.position, P = SEAS.rain.geometry.attributes.position, a = P.array; for (let i = 0; i < a.length; i += 6) { a[i + 1] -= dt * 16; a[i + 4] -= dt * 16; if (a[i + 1] < -2) { a[i + 1] += 20; a[i + 4] += 20; } } P.needsUpdate = true; SEAS.rain.position.set(c.x, c.y - 6, c.z); } }
  SEAS.rainOn = on;
}
function seasonTick(dt) {
  if (!S) return; if (SEAS.auto) rainTick(dt); SEAS.acc += dt; if (SEAS.acc < 5) return; SEAS.acc = 0; const s = SEAS.cur = seasonNow();
  seasonApply(s);
  if (SEAS.olB) SEAS.olB.count = Math.floor(SEAS.olB.userData.n * Math.min(1, s.ol));
  // cielo más gris y luz más baja con nubes o lluvia
  if (!SEAS.base && S.scene) { SEAS.base = { lights: [] }; S.scene.traverse(o => { if (o.isDirectionalLight || o.isHemisphereLight) SEAS.base.lights.push([o, o.intensity]); }); if (S.scene.fog) SEAS.base.fog = S.scene.fog.color.clone(); }
  const g = Math.min(1, s.gray + (SEAS.rainOn ? .35 : 0)); if (SEAS.base) { SEAS.base.lights.forEach(([o, i0]) => { o.intensity = i0 * (1 - g * (o.isDirectionalLight ? .45 : .15)); }); if (SEAS.base.fog && S.scene.fog) S.scene.fog.color.copy(SEAS.base.fog).lerp(new THREE.Color('#9AA2A8'), g * .6); }
  const tst = document.getElementById('toast'), busy = (tst && tst.classList.contains('on')) || (typeof CINE !== 'undefined' && CINE.on) || !document.getElementById('arcade').hidden;
  if (SEAS.auto && !SEAS.told && !busy && document.getElementById('view3d') && !document.getElementById('view3d').hidden) { SEAS.told = true; let fr = '';
    try { const p = G().P(); p.story = p.story || {}; if (p.story.seas !== s.n) { p.story.seas = s.n; fr = SEAS.FRASE[s.i] || ''; G().save(); } } catch (e) {}
    const el = document.createElement('div'); el.className = 'v3seas' + (fr ? ' fr' : ''); el.innerHTML = `<b>${s.icon} ${s.name} en Galilea</b>${fr ? `<span>${fr}</span>` : ''}`; document.body.appendChild(el); setTimeout(() => el.classList.add('on'), 50); setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 900); }, fr ? 9000 : 4200); }
}
/* ---------- palmera datilera (Phoenix dactylifera) hecha a mano: tronco con las bases de hojas viejas en rombos,
   copa de 22 hojas pinnadas que se arquean, hojas secas colgando y racimos de dátiles. Todo en pocas geometrías
   compartidas e instanciadas (3 variantes), con el mismo viento suave que el resto de los árboles. ---------- */
const DPALM = { mats: null, vars: null };
function dpalmTex() {
  const bark = document.createElement('canvas'); bark.width = 128; bark.height = 256; let c = bark.getContext('2d');
  c.fillStyle = '#6E5A44'; c.fillRect(0, 0, 128, 256);
  for (let y = -16; y < 272; y += 16) for (let x = -16; x < 144; x += 32) { const ox = (y / 16) % 2 ? 16 : 0, g = c.createLinearGradient(0, y, 0, y + 16); g.addColorStop(0, '#9A8466'); g.addColorStop(.55, '#7A6448'); g.addColorStop(1, '#3E3024');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + ox, y); c.lineTo(x + ox + 16, y + 9); c.lineTo(x + ox, y + 18); c.lineTo(x + ox - 16, y + 9); c.closePath(); c.fill(); }
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '30,22,14' : '170,150,120'},${Math.random() * .18})`; c.fillRect(Math.random() * 128, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 3); }
  const leaf = document.createElement('canvas'); leaf.width = 32; leaf.height = 256; c = leaf.getContext('2d'); // foliolo lanceolado con nervio central
  const lg = c.createLinearGradient(0, 0, 0, 256); lg.addColorStop(0, '#9DAE6A'); lg.addColorStop(.5, '#6F8A4A'); lg.addColorStop(1, '#4E6A36'); c.fillStyle = lg;
  c.beginPath(); c.moveTo(16, 2); c.quadraticCurveTo(31, 120, 17, 254); c.lineTo(15, 254); c.quadraticCurveTo(1, 120, 16, 2); c.fill(); c.strokeStyle = 'rgba(220,230,170,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(16, 6); c.lineTo(16, 250); c.stroke();
  const T = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  return { bark: T(bark, true), leaf: T(leaf, true) };
}
function dpalmMats() {
  if (DPALM.mats) return DPALM.mats; const t = dpalmTex();
  return DPALM.mats = { trunk: new THREE.MeshStandardMaterial({ map: t.bark, roughness: .95, metalness: 0 }), leaf: new THREE.MeshStandardMaterial({ map: t.leaf, alphaTest: .45, side: THREE.DoubleSide, roughness: .8, metalness: 0, vertexColors: true }),
    date: new THREE.MeshStandardMaterial({ color: '#B8632A', roughness: .55, metalness: 0 }) };
}
function dpalmGeo(seed, lo) {
  const R = rng(seed), H = 6.5 + R() * 2.5, bend = (R() - .5) * .9, trunkR = .24 + R() * .05;
  const at = t => new THREE.Vector3(Math.sin(t * 1.6) * bend * t, t * H, 0); // tronco apenas curvo
  // tronco: anillos con radio que se afina, UV que repite los rombos
  const tp = [], tu = [], ti = [], SEG = lo ? 8 : 12, RING = lo ? 12 : 22;
  for (let j = 0; j <= RING; j++) { const t = j / RING, c = at(t), r = trunkR * (1.25 - t * .35) * (1 + (j === 0 ? .25 : 0)); for (let i = 0; i <= SEG; i++) { const a = i / SEG * 6.283; tp.push(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r); tu.push(i / SEG * 2, t * H * 1.6); } }
  for (let j = 0; j < RING; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + SEG + 1; ti.push(a, b, a + 1, b, b + 1, a + 1); }
  const trunk = new THREE.BufferGeometry(); trunk.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); trunk.setAttribute('uv', new THREE.Float32BufferAttribute(tu, 2)); trunk.setIndex(ti); trunk.computeVertexNormals();
  // hojas: raquis curvo con foliolos en V a los dos lados
  const lp = [], lu = [], lc = [], li = [], top = at(1), C = new THREE.Color();
  const quad = (p0, dir, side, len, w, col) => { const o = lp.length / 3; const n = new THREE.Vector3().crossVectors(dir, side).normalize().multiplyScalar(w / 2);
    const p1 = p0.clone().addScaledVector(side, len); [p0.clone().sub(n), p0.clone().add(n), p1.clone().add(n), p1.clone().sub(n)].forEach(v => lp.push(v.x, v.y, v.z)); lu.push(0, 1, 1, 1, 1, 0, 0, 0); for (let k = 0; k < 4; k++) lc.push(col.r, col.g, col.b); li.push(o, o + 1, o + 2, o, o + 2, o + 3); };
  const frond = (az, el, L, dead) => {
    const N = lo ? 14 : 26, pts = []; let p = top.clone().add(new THREE.Vector3(0, -.15, 0)), d = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    for (let k = 0; k <= N; k++) { pts.push({ p: p.clone(), d: d.clone() }); p.addScaledVector(d, L / N); d.y -= (dead ? .16 : .055 + (1 - el) * .02) * (L / 3); d.normalize(); }
    const right = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az));
    for (let k = lo ? 2 : 4; k < N; k++) { const q = pts[k], t = k / N, ll = (.55 - Math.abs(t - .45) * .55) * (dead ? .8 : 1), up = new THREE.Vector3().crossVectors(right, q.d).normalize();
      if (dead) C.setRGB(.55 + R() * .1, .42 + R() * .08, .28); else C.setRGB(.82 + R() * .25, .9 + R() * .2, .78 + R() * .15);
      [1, -1].forEach(sg => { const side = right.clone().multiplyScalar(sg).addScaledVector(up, .55).addScaledVector(q.d, .25).normalize(); quad(q.p, q.d, side, ll, lo ? .1 : .06, C); }); }
    // raquis
    for (let k = 0; k < N; k++) { const a = pts[k].p, b = pts[k + 1].p, side = right.clone().multiplyScalar(.035); const o = lp.length / 3; [a.clone().sub(side), a.clone().add(side), b.clone().add(side), b.clone().sub(side)].forEach(v => lp.push(v.x, v.y, v.z)); lu.push(.45, .9, .55, .9, .55, .1, .45, .1); for (let q = 0; q < 4; q++) lc.push(.75, .7, .5); li.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  };
  for (let i = 0; i < (lo ? 16 : 22); i++) frond(i * 2.399 + R() * .3, .35 + (i % 3) * .28 + R() * .15, 2.6 + R() * .9, false);
  for (let i = 0; i < (lo ? 5 : 8); i++) frond(i * .785 + R() * .4, -.45 - R() * .4, 1.8 + R() * .5, true);
  const fr = new THREE.BufferGeometry(); fr.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); fr.setAttribute('uv', new THREE.Float32BufferAttribute(lu, 2)); fr.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3)); fr.setIndex(li); fr.computeVertexNormals();
  // racimos de dátiles bajo la copa
  const dg = []; const base = new THREE.OctahedronGeometry(.04, 0); for (let k = 0; k < 3 + Math.floor(R() * 3); k++) { const a = R() * 6.28, cx = top.x + Math.cos(a) * .35, cz = top.z + Math.sin(a) * .35, cy = top.y - .45;
    for (let q = 0; q < (lo ? 10 : 22); q++) { const g = base.clone(), h = R() * .55; g.translate(cx + Math.cos(a) * h * .3 + (R() - .5) * .16, cy - h, cz + Math.sin(a) * h * .3 + (R() - .5) * .16); dg.push(g); } }
  const dates = dg.length ? mergeGeos(dg) : null;
  return { trunk, fr, dates, top };
}
function mergeGeos(list) { // une geometrías no indexadas o indexadas en una sola (posición y normal)
  let n = 0; list.forEach(g => { n += (g.index ? g.index.count : g.attributes.position.count); }); const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
  list.forEach(g => { const gg = g.index ? g.toNonIndexed() : g; gg.computeVertexNormals(); P.set(gg.attributes.position.array, o * 3); N.set(gg.attributes.normal.array, o * 3); o += gg.attributes.position.count; });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); return out;
}
function dpalmPlace(scene, list) {
  if (!list.length) return; const M = dpalmMats(), lo = matchMedia('(pointer: coarse)').matches || QUAL.lv < 2; if (!DPALM.vars || DPALM.lo !== lo) { DPALM.vars = [11, 23, 37].map(sd => dpalmGeo(sd, lo)); DPALM.lo = lo; }
  const mT = phMat(M.trunk, { wind: 3 }), mL = phMat(M.leaf, { wind: 3 }), mD = phMat(M.date, { wind: 3 }), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  const by = new Map(); list.forEach((it, i) => { const k = (i % 3) + ':' + Math.floor(it.z / 72); if (!by.has(k)) by.set(k, []); by.get(k).push(it); });
  by.forEach((L, key) => { const vi = +key.split(':')[0], zc = (Math.floor(L[0].z / 72) + .5) * 72, v = DPALM.vars[vi];
    [[v.trunk, mT, true], [v.fr, mL, true], [v.dates, mD, false]].forEach(([geo, mat, sh]) => { if (!geo) return; const im = new THREE.InstancedMesh(geo, mat, L.length);
      L.forEach((it, i) => { E.set(0, it.ry, 0); Q.setFromEuler(E); M4.compose(V.set(it.x, it.y, it.z), Q, SC.setScalar(it.s)); im.setMatrixAt(i, M4); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = sh && QUAL.lv > 0; im.receiveShadow = true; im.userData.n = L.length; im.userData.zc = zc; im.userData.tree = 1; scene.add(im); FLORA.chunks.push(im); }); });
  list.forEach(it => phCyl(it.x, it.z, .32 * it.s));
}
// troncos y arbustos chocan como el resto de los obstáculos (cilindro simple); los modelos de Poly Haven se suman cuando se arma su franja
const PH_RAD = { island_tree_01: .45, island_tree_02: .5, island_tree_03: .4, tree_small_02: .32, jacaranda_tree: .55, quiver_tree_01: .4, quiver_tree_02: .35, pine_tree_01: .4, dead_quiver_trunk: .35, searsia_lucida: .6, searsia_burchellii: .6, wild_rooibos_bush: .5, shrub_01: .55, shrub_02: .5, shrub_03: .5, shrub_04: .45, pine_sapling_medium: .35 };
function phCyl(x, z, r, oi) { if (!S || !S.cols) return; S.cols.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, cx: x, cz: z, r, oi }); }
// registra un grupo de instancias; se construye cuando el jugador se acerca a su franja
function phPlace(id, items, o) {
  o = o || {}; if (/^grass_/.test(id)) o.grass = 1; const by = new Map();
  items.forEach(it => { const b = Math.floor(it.z / PH_BAND); if (!by.has(b)) by.set(b, []); by.get(b).push(it); });
  by.forEach((list, b) => PH.bands.push({ id, list, o, zc: (b + .5) * PH_BAND, built: false, ims: [] }));
}
let _phM, _phQ, _phE, _phV, _phS;
async function phBuild(B) {
  B.built = true; if (!_phM) { _phM = new THREE.Matrix4(); _phQ = new THREE.Quaternion(); _phE = new THREE.Euler(); _phV = new THREE.Vector3(); _phS = new THREE.Vector3(); } const vars = await phGet(B.id); if (!vars.length || !S) return; const per = vars.map(() => []);
  B.list.forEach((it, i) => per[it.v != null ? it.v % vars.length : i % vars.length].push(it));
  vars.forEach((ms, vi) => { const L = per[vi]; if (!L.length) return;
    ms.forEach(mm => { const im = new THREE.InstancedMesh(mm.geo, phMat(mm.mat, B.o), L.length);
      L.forEach((it, i) => { _phE.set(it.rx || 0, it.ry || 0, it.rz || 0, 'YXZ'); _phQ.setFromEuler(_phE); _phS.set(it.s, it.sy ?? it.s, it.s); _phM.compose(_phV.set(it.x, it.y, it.z), _phQ, _phS).multiply(mm.m); im.setMatrixAt(i, _phM); });
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = !!B.o.shadow && QUAL.lv > 0; im.receiveShadow = true; im.userData.n = L.length; if (B.o.near) im.count = Math.floor(L.length * QT.near[QUAL.lv]); B.ims.push(im); }); const r0 = PH_RAD[B.id]; if (r0) { const c = B.o.near ? Math.floor(L.length * QT.near[QUAL.lv]) : L.length; for (let i = 0; i < c; i++) phCyl(L[i].x, L[i].z, r0 * (L[i].s || 1)); } });
  // se compila el material antes de mostrarlo (evita el tirón la primera vez que aparece en pantalla)
  const g = new THREE.Group(); B.ims.forEach(im => g.add(im)); S.scene.add(g); g.visible = false; B.g = g;
  try { if (S.renderer.compileAsync) await S.renderer.compileAsync(g, S.camera, S.scene); } catch (e) {} B.ok = true;
}
// un objeto suelto (muebles, fogatas): se agrega a un grupo cuando el modelo llega
function phOne(id, parent, x, y, z, ry, s, o) {
  phGet(id).then(vars => { if (!vars.length) return; const v = vars[(o && o.v) || 0] || vars[0], g = new THREE.Group(); v.forEach(mm => { const m = new THREE.Mesh(mm.geo, phMat(mm.mat, o || {})); m.matrixAutoUpdate = false; m.matrix.copy(mm.m); m.castShadow = true; m.receiveShadow = true; g.add(m); });
    g.position.set(x, y, z); g.rotation.set((o && o.rx) || 0, ry || 0, 0); g.scale.setScalar(s || 1); parent.add(g); if (o && o.done) o.done(g); });
}
function phTick(dt) {
  if (!S || !PH.bands.length) return; PH.uT.value = S.t || 0; PH.near -= dt; if (PH.near > 0) return; PH.near = .5;
  const cz = S.av.position.z, see = (S.hx ? 120 : 140) * QT.see[QUAL.lv], pre = see + 50; let next = null, nd = 1e9;
  for (const B of PH.bands) { const d = Math.abs(B.zc - cz) - PH_BAND / 2, lim = B.o.far ? see * 1.6 : B.o.near ? see * .55 : see; if (B.g && B.o.shadow) { const cs = QUAL.lv >= 2 && d < [0, 0, 40, 70][QUAL.lv]; if (B.cs !== cs) { B.cs = cs; B.ims.forEach(im => { im.castShadow = cs; }); } } if (!B.built && d < (B.o.far ? pre * 1.6 : pre) && d < nd) { nd = d; next = B; } if (B.g) { B.g.visible = !!B.ok && d < lim; if (B.g.visible && B.ims && B.ims.length && B.thin !== QUAL.lv + ':' + B.ims.length) { B.thin = QUAL.lv + ':' + B.ims.length; const f = [.45, .65, 1, 1][QUAL.lv]; B.ims.forEach(im => { if (im.userData.n0 == null) im.userData.n0 = im.count; const g = im.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3; im.count = tri > 1500 ? Math.max(1, Math.floor(im.userData.n0 * f)) : im.userData.n0; }); } } }
  if (next) { phBuild(next); PH.near = .12; } // de a una franja por vez, para no trabar un cuadro
}
function phWorld(scene, W, allPts, zMax, hx, R0) {
  SEAS.base = null; SEAS.rain = null; SEAS.olB = null; SEAS.acc = 9;
  const R = rng(9091), coarse = matchMedia('(pointer: coarse)').matches, k = (hx ? 1 : .8) * (coarse ? .7 : 1); PH.kids = !hx; PH.bands = [];
  const yAt = (x, z) => W.hAt(x, z), Z0 = zMax + 30, Z1 = 25;
  const scatter = (n, test) => { const out = []; for (let i = 0; i < n * 4 && out.length < n; i++) { const x = (R() - .5) * (XB * 2 + 60), z = Z0 + R() * (Z1 - Z0), d = W.dAt(x, z), h = yAt(x, z); if (blockedAt(x, z) || (S_poiPts || []).some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < 30)) continue; const r = test(x, z, d, h); if (r) out.push(Object.assign({ x, z, y: h - .04, ry: R() * 6.28 }, r)); } return out; };
  const nearPath = (n, r0, r1, s0, s1) => { const out = []; for (let i = 0; i < n * 3 && out.length < n; i++) { const p = allPts[Math.floor(R() * allPts.length)], a = R() * 6.28, r = r0 + Math.pow(R(), 1.3) * (r1 - r0), x = p[0] + Math.cos(a) * r, z = p[1] + Math.sin(a) * r; if (W.dAt(x, z) < r0 || yAt(x, z) > 7 || blockedAt(x, z)) continue; out.push({ x, z, y: yAt(x, z) - .03, ry: R() * 6.28, s: s0 + R() * (s1 - s0) }); } return out; };
  const S2 = (a, b) => ({ s: a + R() * (b - a) });
  // árboles: donde antes había cipreses cónicos ahora van árboles reales (Poly Haven, CC0)
  { const cy = (FLORA.cyp || []).filter(o => !blockedAt(o.x, o.z) && !(S_poiPts || []).some(p => (p[0] - o.x) ** 2 + (p[1] - o.z) ** 2 < 30)), ids = ['island_tree_03', 'tree_small_02', 'island_tree_01'], by = [[], [], []];
    cy.forEach((o, i) => by[i % 3].push({ x: o.x, z: o.z, y: yAt(o.x, o.z) - .04, ry: o.rot, s: (i % 3 === 1 ? .8 : .7) + o.v * .45 })); ids.forEach((id, i) => phPlace(id, by[i], { shadow: true, wind: 3 })); }
  phPlace('island_tree_01', scatter(50 * k, (x, z, d) => d > 7 && Math.abs(x) < XB + 6 && S2(.75, 1.15)), { shadow: true , wind: 3 });
  phPlace('island_tree_03', scatter(60 * k, (x, z, d) => d > 5 && Math.abs(x) < XB + 6 && S2(.9, 1.4)), { shadow: true , wind: 3 });
  phPlace('tree_small_02', scatter(55 * k, (x, z, d) => d > 4.5 && S2(.8, 1.2)), { shadow: true , wind: 3 });
  phPlace('quiver_tree_01', scatter(28 * k, (x, z, d, h) => d > 6 && h > 1.5 && S2(.9, 1.4)), { shadow: true });
  phPlace('quiver_tree_02', scatter(28 * k, (x, z, d, h) => d > 5 && h > 1 && S2(1.2, 1.8)), { shadow: true });
  phPlace('pine_sapling_small', scatter(70 * k, (x, z, d) => d > 3.5 && S2(1, 1.6)), { wind: 2 });
  phPlace('dead_tree_trunk', scatter(30 * k, (x, z, d) => d > 3 && Object.assign(S2(.8, 1.1), { y: yAt(x, z) + .1, rz: Math.PI / 2 })), { shadow: true });
  phPlace('dead_tree_trunk_02', scatter(25 * k, (x, z, d) => d > 3.5 && S2(.7, 1)), { shadow: true });
  phPlace('tree_stump_01', scatter(40 * k, (x, z, d) => d > 2.6 && S2(.6, .9)), { shadow: true });
  // jacarandá: pocos, en las plazas de los pueblos
  const towns = (S.pois || []).filter(p => /taller|inn|upper|roofhouse|lake|feeding/.test(p.k)), jac = [];
  towns.forEach(p => { for (let t = 0; t < 8 && jac.filter(j => j.p === p).length < 1; t++) { const a = R() * 6.28, r = 16 + R() * 8, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (blockedAt(x, z) || W.dAt(x, z) < 6) continue; jac.push({ p, x, z, y: yAt(x, z) - .05, ry: R() * 6.28, s: .36 + R() * .08 }); } });
  phPlace('jacaranda_tree', jac, { shadow: true, far: 1 , wind: 3 });
  // arbustos y flores con viento
  phPlace('searsia_burchellii', scatter(45 * k, (x, z, d) => d > 7 && S2(.55, .85)), { wind: 2, shadow: true });
  phPlace('wild_rooibos_bush', nearPath(260 * k, 2.5, 16, 1, 1.5), { wind: 1, near: 1 });
  phPlace('leipoldtia_schultzei', nearPath(220 * k, 2, 14, 1.1, 1.7), { wind: 1, near: 1 });
  phPlace('flower_heliophila', nearPath((hx ? 180 : 320) * k, 1.8, 13, 1.2, 1.8), { wind: 1, near: 1 });
  phPlace('dandelion_01', nearPath((hx ? 320 : 520) * k, 1.6, 12, 2, 3), { wind: 1, near: 1 });
  phPlace('nettle_plant', nearPath(340 * k, 1.8, 14, 2.6, 3.6), { wind: 1, near: 1 });
  phPlace('grass_medium_02', nearPath(700 * k, 1.4, 14, 2.6, 3.6), { wind: 1, near: 1 });
  phPlace('grass_medium_01', nearPath(300 * k, 1.6, 12, 2.4, 3.4), { wind: 1, near: 1 });
  phPlace('celandine_01', nearPath(260 * k, 2, 14, 2.2, 3), { wind: 1, near: 1 });
  phPlace('grass_bermuda_01', nearPath(900 * k, 1.3, 14, 3.4, 4.6), { wind: 1, near: 1 });
  // rocas
  phPlace('namaqualand_boulder_02', scatter(80 * k, (x, z, d) => d > 3 && S2(.6, 1.3)).map(o => Object.assign(o, { y: o.y - .3 * o.s })), { shadow: true });
  phPlace('sand_rocks_small_01', scatter(45 * k, (x, z, d) => d > 2.6 && S2(.6, 1)), {});
  ['coast_land_rocks_02', 'coast_land_rocks_03', 'coast_land_rocks_04'].forEach(id => phPlace(id, scatter(16 * k, (x, z, d, h) => d > 9 && h > 2.5 && S2(.7, 1.1)).map(o => Object.assign(o, { y: o.y - .5 * o.s })), { shadow: true }));
  ['rock_face_01', 'rock_face_02'].forEach(id => phPlace(id, scatter(22 * k, (x, z, d, h) => Math.abs(x) > XB * .55 && d > 8 && Object.assign(S2(1, 1.7), { ry: (x > 0 ? -1 : 1) * Math.PI / 2 + (R() - .5) * .6 })).map(o => Object.assign(o, { y: o.y - .9 * o.s })), { shadow: true }));
  const edge = (n, a, b, s0, s1, ry) => { const out = []; for (let i = 0; i < n; i++) { const sd = i % 2 ? 1 : -1, x = sd * (XB + a + R() * (b - a)), z = Z0 + (i + R()) / n * (Z1 - Z0); out.push({ x, z, y: yAt(x, z) - .6, ry: ry != null ? ry * sd : R() * 6.28, s: s0 + R() * (s1 - s0) }); } return out; };
  // (acantilados sueltos del borde reemplazados por el cordón montañoso continuo)
  // (acantilados sueltos del borde reemplazados por el cordón montañoso continuo)
  // (acantilados sueltos del borde reemplazados por el cordón montañoso continuo)
  // orilla y lago: rocas de costa y muelle
  const shoreRocks = []; (S.pois || []).filter(p => p.k === 'shore' || p.k === 'lake').forEach(p => { const cx = p.k === 'shore' ? p.x + p.side * 7 : p.x - p.side * 4, rr = p.k === 'shore' ? 8.4 : 36; for (let i = 0; i < (p.k === 'shore' ? 5 : 9); i++) { const a = R() * 6.28, x = cx + Math.cos(a) * rr, z = p.z + Math.sin(a) * rr * (p.k === 'shore' ? 1 : .9); if (W.dAt(x, z) < 2.5) continue; shoreRocks.push({ x, z, y: yAt(x, z) - .2, ry: R() * 6.28, s: .35 + R() * .3 }); } });
  phPlace('coast_rocks_05', shoreRocks, { shadow: true });
  (S.pois || []).filter(p => p.k === 'shore').forEach(p => { const y = yAt(p.x, p.z), ry = p.side > 0 ? Math.PI / 2 : -Math.PI / 2; const dock = []; for (let i = 0; i < 3; i++) dock.push({ x: p.x + p.side * (1.2 + i * 2.4), z: p.z + 3.2, y: y + .22, ry, s: 1, v: 0 }); phPlace('modular_wooden_pier', dock, { shadow: true });
    phPlace('stone_fire_pit', [{ x: p.x - p.side * 2, z: p.z - 1, y: y - .02, ry: 0, s: .6 }], {}); phPlace('wicker_basket_01', [{ x: p.x - p.side * 3.2, z: p.z + .4, y, ry: .4, s: 1.4 }], {}); phPlace('wooden_bucket_02', [{ x: p.x - p.side * .6, z: p.z + 3.6, y, ry: 0, s: .9 }], {}); });
  // pueblos: baldes, banquitos, canastas con fruta, hachas y un cofre de ofrendas en el templo
  const props = { wooden_bucket_02: [], wooden_stool_02: [], wicker_basket_01: [], food_pears_asian_01: [], lemon: [], food_avocado_01: [], food_kiwi_01: [], wooden_axe: [], wooden_cutting_board: [], wooden_spoon: [], wooden_bowl_02: [], Lantern_01: [], brass_candleholders: [], treasure_chest: [], carrot_cake: [], wooden_candlestick: [], stone_fire_pit: [] };
  const free = (x, z) => !blockedAt(x, z) && W.dAt(x, z) > 1.3;
  const ring = (p, r0, r1, fn, n) => { let c = 0; for (let t = 0; t < n * 6 && c < n; t++) { const a = R() * 6.28, r = r0 + R() * (r1 - r0), x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (!free(x, z)) continue; fn(x, z, yAt(x, z) - .02, R() * 6.28); c++; } };
  const basket = (x, z, y, ry) => { props.wicker_basket_01.push({ x, z, y, ry, s: 1.5 }); const fr = ['food_pears_asian_01', 'lemon', 'food_avocado_01', 'food_kiwi_01'][Math.floor(R() * 4)]; for (let i = 0; i < 4; i++) props[fr].push({ x: x + (R() - .5) * .25, z: z + (R() - .5) * .18, y: y + .1, ry: R() * 6.28, s: 1.4 }); };
  for (const p of towns) {
    ring(p, 2.4, 5, (x, z, y, ry) => props.wooden_bucket_02.push({ x, z, y, ry, s: .85 }), p.k === 'taller' ? 3 : 2);
    ring(p, 4, 9, (x, z, y, ry) => props.wooden_stool_02.push({ x, z, y, ry, s: 2.2 }), 3);
    ring(p, 4, 10, basket, 2);
    ring(p, 5, 10, (x, z, y, ry) => props.wooden_axe.push({ x, z, y: y + .03, ry, rz: Math.PI / 2, s: 1.3 }), p.k === 'taller' ? 2 : 1);
    ring(p, 5, 9, (x, z, y, ry) => props.stone_fire_pit.push({ x, z, y, ry, s: .55 }), 1);
    if (p.k === 'inn' || p.k === 'upper') { ring(p, 5, 8, (x, z, y, ry) => props.Lantern_01.push({ x, z, y, ry, s: 1.6 }), 2); ring(p, 5, 8, (x, z, y, ry) => { props.wooden_stool_02.push({ x, z, y, ry, s: 2.6 }); props.carrot_cake.push({ x, z, y: y + .47, ry, s: 1 }); }, 1); }
    if (p.k === 'upper') ring(p, 5, 8, (x, z, y, ry) => props.brass_candleholders.push({ x, z, y, ry, s: 1.2, v: 1 }), 1);
  }
  (S.pois || []).filter(p => p.k === 'temple').forEach(p => { const x = p.x - p.side * 8.5, z = p.z + 4; if (free(x, z)) props.treasure_chest.push({ x, z, y: yAt(x, z), ry: p.side > 0 ? -Math.PI / 2 : Math.PI / 2, s: 1 }); ring({ x: p.x - p.side * 9, z: p.z }, 1, 4, (x2, z2, y2, ry) => props.brass_candleholders.push({ x: x2, z: z2, y: y2, ry, s: 1.6, v: 0 }), 2); });
  // puestos del mercado (Hero): fruta, tabla, cuchara y cuenco sobre la mesa
  ((S.sv && S.sv.stalls) || []).forEach(s => { const y = yAt(s.x, s.z) + .9; basket(s.x, s.z, y - .02, R() * 6.28); props.wooden_cutting_board.push({ x: s.x, z: s.z + .7, y, ry: Math.PI / 2, s: 1 }); props.wooden_spoon.push({ x: s.x + .05, z: s.z + .7, y: y + .03, ry: Math.PI / 2, s: 1.2 }); props.wooden_bowl_02.push({ x: s.x, z: s.z - .7, y, ry: 0, s: 1.6 }); props.wooden_candlestick.push({ x: s.x + .2, z: s.z - .35, y, ry: 0, s: 1.2 }); });
  ((S.sv && S.sv.beggars) || []).forEach(b => { if (b.bowl) b.bowl.visible = false; const x = b.bx ?? b.x, z = b.bz ?? b.z; props.wooden_bowl_02.push({ x, z, y: yAt(x, z) + .02, ry: 0, s: 2 }); });
  for (const id in props) if (props[id].length) phPlace(id, props[id], { shadow: /chest|bucket|stool|basket|fire/.test(id) });
  // ---- más objetos de época (Poly Haven, CC0; ver CREDITOS-ASSETS.md): vasijas, cántaros, canastos, cajones, granadas, banquitos, rocas, arbustos y árboles
  const P2 = {}, put2 = (id, o) => (P2[id] = P2[id] || []).push(o), pots = ['ceramic_vase_01', 'ceramic_vase_02', 'ceramic_vase_03', 'ceramic_vase_04', 'antique_ceramic_vase_01', 'jug_01', 'ceramic_pot', 'planter_pot_clay'];
  for (const p of towns) {
    ring(p, 3, 11, (x, z, y, ry) => { const n = 1 + Math.floor(R() * 3); for (let i = 0; i < n; i++) put2(pots[Math.floor(R() * pots.length)], { x: x + (R() - .5) * .9, z: z + (R() - .5) * .9, y, ry: R() * 6.28, s: .9 + R() * .35 }); }, p.k === 'taller' ? 6 : 4);
    ring(p, 4, 11, (x, z, y, ry) => { put2(R() < .5 ? 'wooden_crate_01' : 'wooden_crate_02', { x, z, y, ry, s: 1 }); if (R() < .5) put2('wicker_basket_02', { x: x + .7, z, y, ry, s: 1 }); }, 2);
    ring(p, 4, 9, (x, z, y, ry) => put2(R() < .5 ? 'folding_wooden_stool' : 'wooden_stool_01', { x, z, y, ry, s: 1 }), 2);
    if (p.k === 'upper') ring(p, 4, 7, (x, z, y, ry) => put2('brass_goblets', { x, z, y: y + .02, ry, s: 1 }), 1);
  }
  (S.pois || []).filter(p => p.k === 'temple').forEach(p => ring({ x: p.x - p.side * 9, z: p.z }, 2, 6, (x, z, y, ry) => put2('brass_pot_01', { x, z, y, ry, s: 1.2 }), 2));
  ((S.sv && S.sv.stalls) || []).forEach(s2 => { const y = yAt(s2.x, s2.z) + .9; put2('carved_wooden_plate', { x: s2.x - .45, z: s2.z - .4, y, ry: 0, s: 1 }); for (let i = 0; i < 5; i++) put2('food_pomegranate_01', { x: s2.x - .45 + (R() - .5) * .2, z: s2.z - .4 + (R() - .5) * .2, y: y + .05, ry: R() * 6.28, s: 1 }); put2('wooden_bowl_01', { x: s2.x + .45, z: s2.z - .4, y, ry: 0, s: 1 }); });
  (S.pois || []).filter(p => p.k === 'shore').forEach(p => put2('wooden_bucket_01', { x: p.x - p.side * 1.5, z: p.z + 4.4, y: yAt(p.x, p.z), ry: 0, s: 1 }));
  // rocas hundidas en el terreno y arbustos; árboles nuevos en el campo
  const sink = (o, k) => Object.assign(o, { y: o.y - k * o.s });
  ['boulder_01', 'namaqualand_boulder_03', 'namaqualand_boulder_04', 'namaqualand_boulder_05', 'rock_07', 'rock_09'].forEach(id => phPlace(id, scatter(18 * k, (x, z, d) => d > 4 && S2(.6, 1.2)).map(o => sink(o, .25)), { shadow: true }));
  ['namaqualand_rocks_01', 'namaqualand_stones_01', 'stone_01'].forEach(id => phPlace(id, scatter(24 * k, (x, z, d) => d > 2.4 && S2(.7, 1.1)).map(o => sink(o, .08)), {}));
  phPlace('namaqualand_boulders_01', scatter(14 * k, (x, z, d, h) => d > 8 && h > 1.5 && S2(.8, 1.3)).map(o => sink(o, .4)), { shadow: true });
  ['namaqualand_cliff_01', 'namaqualand_cliff_02'].forEach((id, i) => { const L = []; for (let z = Z1 - 40 - i * 90; z > Z0; z -= 180) [-1, 1].forEach(sd => { const x = sd * (W.X1 - 4 - R() * 6); L.push({ x, z: z + (R() - .5) * 40, y: yAt(x, z) - 2.5, ry: (sd > 0 ? -1 : 1) * Math.PI / 2 + (R() - .5) * .5, s: 1.4 + R() * .6 }); }); phPlace(id, L, { shadow: true, far: 1 }); });
  ['shrub_01', 'shrub_02', 'shrub_03', 'shrub_04'].forEach(id => phPlace(id, nearPath(90 * k, 3, 16, .8, 1.3), { wind: 1, near: 1, shadow: true }));
  phPlace('dry_branches_medium_01', scatter(20 * k, (x, z, d) => d > 3 && S2(.8, 1.2)), {});
  phPlace('searsia_lucida', scatter(40 * k, (x, z, d) => d > 6 && Math.abs(x) < XB + 6 && S2(.8, 1.2)), { shadow: true, wind: 3 });
  phPlace('island_tree_02', scatter(40 * k, (x, z, d) => d > 7 && Math.abs(x) < XB + 6 && S2(.7, 1.1)), { shadow: true, wind: 3 });
  // más variedad para que nada se repita: costa del lago, raíces y ramas, pinos, flores silvestres, helechos junto al río, vasijas de bronce y herramientas
  (S.pois || []).filter(p => p.k === 'lake' || p.k === 'shore').forEach(p => { const cx = p.k === 'shore' ? p.x + p.side * 7 : p.x, rr = p.k === 'shore' ? 9.5 : 33; ['coast_rocks_01', 'coast_rocks_02', 'coast_rocks_03', 'rock_moss_set_01', 'rock_moss_set_02'].forEach((id, j) => { const L = []; for (let i = 0; i < (p.k === 'shore' ? 1 : 3); i++) { const a = R() * 6.28, x = cx + Math.cos(a) * rr * (1 + R() * .12), z = p.z + Math.sin(a) * rr * (1 + R() * .12); if (!blockedAt(x, z)) L.push({ x, z, y: yAt(x, z) - .25, ry: R() * 6.28, s: .8 + R() * .5 }); } if (L.length) phPlace(id, L, { shadow: true }); });
    if (p.k === 'lake') ['coast_line_01', 'coast_line_02'].forEach(id => { const a = R() * 6.28, x = p.x + Math.cos(a) * 35, z = p.z + Math.sin(a) * 35; phPlace(id, [{ x, z, y: yAt(x, z) - .4, ry: -a + Math.PI / 2, s: 1 }], { shadow: true }); }); });
  ['root_cluster_01', 'root_cluster_02', 'single_root', 'bark_debris_01', 'dead_quiver_branch_01', 'dead_quiver_branch_02', 'pine_roots'].forEach(id => phPlace(id, scatter(16 * k, (x, z, d) => d > 3 && S2(.8, 1.2)).map(o => sink(o, .05)), {}));
  phPlace('dead_quiver_trunk', scatter(10 * k, (x, z, d) => d > 6 && S2(.8, 1.1)), { shadow: true });
  phPlace('tree_stump_02', scatter(16 * k, (x, z, d) => d > 3 && S2(.8, 1.1)), { shadow: true });
  phPlace('pine_tree_01', scatter(26 * k, (x, z, d, h) => d > 8 && h > 1 && Math.abs(x) < XB + 8 && S2(.7, 1)), { shadow: true, wind: 3 });
  phPlace('pine_sapling_medium', scatter(30 * k, (x, z, d) => d > 5 && S2(.8, 1.2)), { wind: 2 });
  ['flower_empodium', 'flower_gazania', 'flower_stinkkruid', 'flower_ursinia', 'crystalline_iceplant', 'cheiridopsis_succulent', 'didelta_spinosa', 'othonna_cerarioides', 'dry_quiver_leaf'].forEach(id => phPlace(id, nearPath(70 * k, 2.2, 14, .9, 1.4), { wind: 1, near: 1 }));
  (S.pois || []).filter(p => p.k === 'river').forEach(p => { ['fern_02', 'moss_01', 'shrub_sorrel_01'].forEach(id => { const L = []; for (let i = 0; i < 26; i++) { const q = p.pts[Math.floor(R() * p.pts.length)], sd = R() < .5 ? -1 : 1, x = q[0] + sd * (4.4 + R() * 3), z = q[1] + (R() - .5) * 2; L.push({ x, z, y: yAt(x, z) - .03, ry: R() * 6.28, s: .8 + R() * .5 }); } phPlace(id, L, { wind: 1, near: 1 }); }); });
  { const L = (DPALM.spots || []).slice(); DPALM.spots = [];
    const RP = rng(5151), nP = matchMedia('(pointer: coarse)').matches ? 9 : 18; (S.pois || []).filter(p => p.k === 'lake').forEach(p => { let tries = 0; for (let n = 0; n < nP && tries < 400; tries++) { const a = RP() * 6.283; let r = 20; while (r < 90 && W.hAt(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r) < -.01) r += .5; r += 2.5 + RP() * 14; const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (W.dAt(x, z) < 3.2 || blockedAt(x, z) || Math.abs(W.hAt(x - 1, z) - W.hAt(x + 1, z)) > .8 || L.some(q => (q.x - x) ** 2 + (q.z - z) ** 2 < 16)) continue; L.push({ x, y: W.hAt(x, z) - .05, z, ry: RP() * 6.28, s: .85 + RP() * .35 }); n++; } });
    try { regionStone(scene); } catch (e) { console.warn('piedra', e); } try { dpalmPlace(scene, L); } catch (e) { console.warn('palmeras', e); } try { oleanders(scene, W, rng(5252)); } catch (e) { console.warn('adelfas', e); } }
  (FLORA.olive || []).forEach((o, i) => phCyl(o.x, o.z, .3 * o.s, i)); (FLORA.bush || []).forEach(o => phCyl(o.x, o.z, .55 * o.s));
  const P3 = {}, put3 = (id, o) => (P3[id] = P3[id] || []).push(o);
  for (const p of towns) { ring(p, 4, 10, (x, z, y, ry) => put3(R() < .5 ? 'periwinkle_plant' : 'weed_plant_02', { x, z, y, ry, s: 1 }), 4);
    if (p.k === 'taller') ring(p, 4, 9, (x, z, y, ry) => put3(['wooden_axe_02', 'wooden_axe_03', 'wooden_hammer_01'][Math.floor(R() * 3)], { x, z, y: y + .03, ry, rz: Math.PI / 2, s: 1 }), 3);
    ring(p, 4, 10, (x, z, y, ry) => put3(['brass_vase_01', 'brass_vase_02', 'brass_vase_03', 'brass_vase_04', 'metal_jug'][Math.floor(R() * 5)], { x, z, y, ry, s: 1 }), 2); }
  (S.pois || []).filter(p => p.k === 'temple').forEach(p => ring({ x: p.x - p.side * 9, z: p.z }, 2, 6, (x, z, y, ry) => put3('brass_pan_01', { x, z, y, ry, s: 1.2 }), 2));
  ((S.sv && S.sv.stalls) || []).forEach(s2 => { const y = yAt(s2.x, s2.z) + .9; for (let i = 0; i < 4; i++) put3(R() < .5 ? 'food_apple_01' : 'yellow_onion', { x: s2.x + .45 + (R() - .5) * .25, z: s2.z + .1 + (R() - .5) * .25, y: y + .03, ry: R() * 6.28, s: 1 }); });
  for (const id in P3) phPlace(id, P3[id], { shadow: /vase|jug|pan/.test(id) });
  for (const id in P2) phPlace(id, P2[id], { shadow: /crate|stool|vase|pot|jug/.test(id) });
}

/* ---------- Cinturón de la verdad: una insignia por cada curso terminado ----------
   Se ve siempre sobre cualquier ropa (no depende de lo que tengas puesto), en el personaje y junto al nombre.
   Idea de Efesios 6:14: estar firmes, ceñidos con la verdad. */
const COURSES = [
  { id: 'tsp', name: 'Tras sus pasos', em: 'cross', c: '#F2C14E', g: '#FFE7A0' },
  { id: 'hechos', name: 'Hechos', em: 'flame', c: '#FF8A3A', g: '#FFD08A', soon: 1 },
  { id: 'maranata', name: 'Maranata', em: 'star', c: '#FFD86A', g: '#FFF3C2', soon: 1 },
  { id: 'principio', name: 'En el principio', em: 'tree', c: '#6FCF6A', g: '#CFF5C0', soon: 1 },
  { id: 'heroes', name: 'Héroes de la fe', em: 'shield', c: '#7FB2FF', g: '#D6E6FF', soon: 1 }];
const CBY = Object.fromEntries(COURSES.map(c => [c.id, c]));
// dibuja el emblema de un curso en un canvas (sirve para el cinturón, el nombre y la mochila)
function emblemDraw(x, id, cx, cy, r) {
  const c = CBY[id]; if (!c) return; x.save(); x.translate(cx, cy);
  const gl = x.createRadialGradient(0, 0, r * .2, 0, 0, r * 1.25); gl.addColorStop(0, c.g); gl.addColorStop(1, 'rgba(255,220,140,0)'); x.fillStyle = gl; x.beginPath(); x.arc(0, 0, r * 1.25, 0, 7); x.fill();
  x.fillStyle = '#3A2410'; x.beginPath(); x.arc(0, 0, r * .92, 0, 7); x.fill(); x.lineWidth = r * .14; x.strokeStyle = c.c; x.stroke();
  x.fillStyle = c.c; x.strokeStyle = c.c; x.lineCap = 'round'; x.lineJoin = 'round'; const k = r * .55;
  if (c.em === 'cross') { // sandalia con una cruz: caminar tras sus pasos
    x.beginPath(); x.ellipse(0, k * .25, k * .45, k * .85, 0, 0, 7); x.lineWidth = r * .1; x.stroke(); x.fillRect(-k * .11, -k * .95, k * .22, k * 1.5); x.fillRect(-k * .5, -k * .55, k * 1, k * .22); }
  else if (c.em === 'flame') { x.beginPath(); x.moveTo(0, -k); x.bezierCurveTo(k * .9, -k * .2, k * .7, k * .9, 0, k * .9); x.bezierCurveTo(-k * .7, k * .9, -k * .9, -k * .1, 0, -k); x.fill(); }
  else if (c.em === 'star') { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? k * .42 : k; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); }
  else if (c.em === 'tree') { x.fillRect(-k * .12, k * .1, k * .24, k * .8); x.beginPath(); x.arc(0, -k * .15, k * .62, 0, 7); x.fill(); }
  else if (c.em === 'shield') { x.beginPath(); x.moveTo(0, -k); x.lineTo(k * .8, -k * .6); x.lineTo(k * .6, k * .4); x.lineTo(0, k); x.lineTo(-k * .6, k * .4); x.lineTo(-k * .8, -k * .6); x.closePath(); x.fill(); }
  x.restore();
}
const _emTex = {};
function emblemTex(id) { if (_emTex[id]) return _emTex[id]; const cv = document.createElement('canvas'); cv.width = cv.height = 128; emblemDraw(cv.getContext('2d'), id, 64, 64, 50); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (_emTex[id] = t); }
function emblemURL(id, px) { const cv = document.createElement('canvas'); cv.width = cv.height = px || 64; emblemDraw(cv.getContext('2d'), id, cv.width / 2, cv.height / 2, cv.width * .38); return cv.toDataURL(); }
// el cinturón: cuero con hebilla dorada y un emblema brillante por curso, sujeto a la cadera
function insBelt(o, bones, ins) {
  const list = (ins || []).filter(id => CBY[id]); if (!list.length || !bones.pelvis) return;
  o.updateMatrixWorld(true); const pv = bones.pelvis, wp = new THREE.Vector3(); pv.getWorldPosition(wp); o.worldToLocal(wp);
  const g = new THREE.Group(), leather = new THREE.MeshStandardMaterial({ color: '#5A3A22', roughness: .75 }), gold = new THREE.MeshStandardMaterial({ color: '#E2B44A', roughness: .3, metalness: .75, emissive: '#5A3A08', emissiveIntensity: .4 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, .14, 6, 28), leather); band.rotation.x = Math.PI / 2; band.scale.set(.165, .13, .2); g.add(band);
  const n = list.length; list.forEach((id, i) => {
    const a = (i - (n - 1) / 2) * .42, px = Math.sin(a) * .17, pz = Math.cos(a) * .135;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .012, 18), gold); disc.rotation.x = Math.PI / 2; disc.position.set(px, 0, pz + .004); disc.rotation.z = 0; disc.rotation.y = a; g.add(disc);
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(.075, .075), new THREE.MeshBasicMaterial({ map: emblemTex(id), transparent: true, depthWrite: false, toneMapped: false })); sp.position.set(px * 1.06, 0, pz + .014); sp.rotation.y = a; g.add(sp);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(.16, .16), new THREE.MeshBasicMaterial({ map: emblemTex(id), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); glow.position.set(px * 1.08, 0, pz + .02); glow.rotation.y = a; glow.userData.glow = 1; g.add(glow);
  });
  g.position.set(0, wp.y + .08, wp.z + .01); o.add(g); o.updateMatrixWorld(true); pv.attach(g); g.userData.belt = 1;
}
// cartel del nombre con los emblemas al lado (lo ven los demás en las salas)
function tagSprite(name, ins, hx, glow) {
  const list = (ins || []).filter(id => CBY[id]); if (hx && glow) name = name + '  ✦' + glow; if (!list.length) return textSprite(name, hx);
  const c = document.createElement('canvas'), x = c.getContext('2d'), f = 44; x.font = `800 ${f}px Nunito, Arial, sans-serif`;
  const tw = Math.ceil(x.measureText(name).width), ew = list.length * 58, w = tw + ew + 60; c.width = w; c.height = 76; x.font = `800 ${f}px Nunito, Arial, sans-serif`;
  x.fillStyle = hx ? 'rgba(14,12,9,.82)' : 'rgba(255,255,255,.9)'; const r = 30; x.beginPath(); x.moveTo(r, 4); x.arcTo(w - 4, 4, w - 4, 72, r); x.arcTo(w - 4, 72, 4, 72, r); x.arcTo(4, 72, 4, 4, r); x.arcTo(4, 4, w - 4, 4, r); x.fill();
  x.fillStyle = hx ? '#F1D7A2' : '#22407F'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(name, 26, 40); list.forEach((id, i) => emblemDraw(x, id, 26 + tw + 32 + i * 58, 38, 24));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.scale.set(w / 76 * .5, .5, 1); sp.renderOrder = 6; return sp;
}
function insState() { const p = G().P(); if (!p.ins || typeof p.ins !== 'object') p.ins = {}; return p.ins; }
// puntaje del curso: promedio de los mejores exámenes de cada etapa
function insScore() { const p = G().P(), ex = p.exams || {}, R = (G().REGIONS || []); let ok = 0, sum = 0, of = 0; R.forEach(r => { const e = ex[r.id]; if (e && e.passed) { ok++; sum += +(e.best ?? e.ok ?? 0); of += +(e.of || 12); } }); return { ok, total: R.length, pct: of ? Math.round(sum / of * 100) : 0 }; }
function insGive(id, silent) {
  const I = insState(); if (!CBY[id] || I[id]) return false; const sc = insScore(), dn = S && S.hx ? donTop() : null; I[id] = { at: new Date().toISOString(), pct: sc.pct, ok: sc.ok, of: sc.total, don: dn }; { const p = G().P(); p.badges = p.badges || []; if (!p.badges.some(b => b.course === id)) p.badges.push({ course: id, name: CBY[id].name, don: dn, donName: dn ? DONL[dn] : null, at: I[id].at }); } G().save();
  if (S) reLook(); if (!silent) { const el = document.getElementById('v3pop'); if (el) { el.innerHTML = `<span class="ic" style="background:#3A2410;border:1px solid ${CBY[id].c}"><img alt="" src="${emblemURL(id, 64)}" width="34" height="34"></span><span class="tx"><small style="color:${CBY[id].c}">Cinturón de la verdad · Curso terminado</small><b>${esc(CBY[id].name)}</b><em class="gp-tip">Tu insignia brilla en tu cinturón y junto a tu nombre</em></span>`; el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(pop.t); pop.t = setTimeout(() => { el.classList.remove('on'); el.hidden = true; }, 5200); tone3d(); } }
  return true;
}
// quienes ya tenían la túnica del curso o aprobaron todos los exámenes reciben la insignia
function insMigrate() {
  try { const p = G().P(), I = insState(), own = ((p.gear || {}).own || []), R = G().REGIONS || [], ex = p.exams || {};
    const all = R.some(r => r.id === 'resurreccion') && R.every(r => ex[r.id] && ex[r.id].passed);
    if (!I.tsp && (own.includes('tsp') || all)) insGive('tsp', true); } catch (e) { console.warn('ins', e); }
}
function invCourses(body) {
  const I = insState(); const fmt = d => { try { return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
  body.innerHTML = `<div class="ins-wrap"><p class="ins-lead">Cada curso que terminás suma una insignia a tu <b>cinturón de la verdad</b>. Se ve siempre, con cualquier ropa, y los demás la ven junto a tu nombre.</p>${COURSES.map(c => { const d = I[c.id];
    return `<div class="ins-row${d ? ' on' : ''}"><img alt="" src="${emblemURL(c.id, 72)}" width="44" height="44"><div><b>${esc(c.name)}</b><small>${d ? 'Terminado el ' + fmt(d.at) + (d.of ? ` · Exámenes ${d.ok}/${d.of} · ${d.pct}%` : '') : c.soon ? 'Próximamente' : 'Todavía no terminado'}</small>${d && d.don && DONL[d.don] ? `<small class="ins-don">✦ Don descubierto: <b>${DONL[d.don]}</b></small>` : ''}</div>${d ? '<span class="ins-ok">✓</span>' : ''}</div>`; }).join('')}</div>`;
}

/* ---------- Resplandor: poses quietas, modo cinemático y la luz que crece con las buenas obras ----------
   No es vanidad: es reflejar a Dios (como el rostro de Moisés que brillaba después de estar con el Señor, Éxodo 34)
   y dejar que las buenas obras alumbren a otros (Mateo 5). Nada de bailes. */
const POSES = [
  { id: 'brazos', name: 'Brazos cruzados', ico: '🙅', clip: 'M_Idle' },
  { id: 'capa', name: 'Capa al viento', ico: '🧣', clip: 'Idle_Loop', cape: 1 },
  { id: 'horizonte', name: 'Mirar el horizonte', ico: '🌅', clip: 'M_Looking' },
  { id: 'lampara', name: 'Levantar la lámpara', ico: '🪔', clip: 'Idle_Torch_Loop', lamp: 1 }];
const GLW = { lvMax: 10 };
function glowState() { const p = G().P(); if (!p.glow || typeof p.glow !== 'object') p.glow = { pts: 0 }; return p.glow; }
const glowLv = pts => Math.min(GLW.lvMax, Math.floor(Math.sqrt(Math.max(0, pts) / 12)));
function glowAdd(n, why) { try { const g = glowState(), before = glowLv(g.pts); g.pts = (g.pts || 0) + n; G().save(); const lv = glowLv(g.pts); glowUI(); if (lv > before && S) { if (S.hx) G().toast('✦ Tu resplandor creció: nivel ' + lv); glowApply(S.av, lv); if (MP.code) mpSend({ t: 'look', id: MP.peer && MP.peer.id, avatar: lookOf(G().P()) }); } } catch (e) {} }
// halo de luz suave alrededor del personaje (lo ven todos en la sala)
let _glowTex = null;
function glowTex() { if (_glowTex) return _glowTex; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,244,200,1)'); g.addColorStop(.35, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); _glowTex = new THREE.CanvasTexture(c); return _glowTex; }
function glowApply(o, lv) {
  if (!o) return; let g = o.userData.glow; const kid = G().branch !== 'ados';
  if (!lv) { if (g) g.visible = false; return; }
  if (!g) { g = new THREE.Group(); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sp.position.y = 1.05; g.add(sp); g.userData.sp = sp; const pl = new THREE.PointLight('#FFE2A0', 0, 5, 2); pl.position.y = 1.3; g.add(pl); g.userData.pl = pl; o.add(g); o.userData.glow = g; }
  g.visible = true; const k = lv / GLW.lvMax; g.userData.sp.scale.setScalar(1.6 + k * 1.4); g.userData.sp.material.opacity = (kid ? .18 : .12) + k * .38; g.userData.pl.intensity = .4 + k * (kid ? 2 : 2.6); g.userData.lv = lv;
}
function glowUI() {
  if (!S || !S.hx) return; let el = document.getElementById('v3glow'); if (!el) { el = document.createElement('div'); el.id = 'v3glow'; el.className = 'v3glow'; el.title = 'Resplandor: crece con misiones de servicio, compartir con quien lo necesita, respuestas correctas y versículos'; document.body.appendChild(el); }
  const g = glowState(), lv = glowLv(g.pts), a = 12 * lv * lv, b = 12 * (lv + 1) * (lv + 1), pc = lv >= GLW.lvMax ? 100 : Math.round((g.pts - a) / (b - a) * 100);
  el.innerHTML = `<b>✦ ${lv}</b><span>Resplandor</span><i><em style="width:${pc}%"></em></i>`; el.hidden = !!document.getElementById('view3d').hidden;
}
// capa: tela que flamea con el viento, colgada de la espalda
function poseCape(o) {
  const u = o.userData.h3; if (!u || u.cape) return u && u.cape; const B = u.bones; if (!B.spine_03) return null;
  const geo = new THREE.PlaneGeometry(.62, 1.15, 6, 10); geo.translate(0, -.575, 0);
  const m = new THREE.MeshStandardMaterial({ color: '#8E2E22', roughness: .85, side: THREE.DoubleSide }); m.onBeforeCompile = sh => { sh.uniforms.uT = PH.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat k=-position.y/1.15;transformed.z-=k*k*.55+sin(uT*3.2+position.y*5.+position.x*3.)*.09*k;transformed.x+=sin(uT*2.1+position.y*4.)*.04*k;'); };
  const c = new THREE.Mesh(geo, m); c.castShadow = true; o.updateMatrixWorld(true); const w = new THREE.Vector3(); B.spine_03.getWorldPosition(w); o.worldToLocal(w); c.position.set(0, w.y + .08, w.z - .14); c.rotation.x = .12; o.add(c); B.spine_03.attach(c); c.visible = false; u.cape = c; return c;
}
// espada sencilla (la Palabra de Dios es la espada del Espíritu, Efesios 6)
function poseSword(o) {
  const u = o.userData.h3; if (!u || u.sword) return u && u.sword; const B = u.bones; if (!B.hand_r) return null; const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#D8DCE2', metalness: .85, roughness: .25 }), gold = new THREE.MeshStandardMaterial({ color: '#D9A93E', metalness: .8, roughness: .35 });
  const bl = new THREE.Mesh(new THREE.BoxGeometry(.035, .78, .012), steel); bl.position.y = .47; g.add(bl); const gd = new THREE.Mesh(new THREE.BoxGeometry(.2, .03, .04), gold); gd.position.y = .07; g.add(gd); const hd = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .13, 8), new THREE.MeshStandardMaterial({ color: '#4A3020', roughness: .8 })); g.add(hd);
  g.scale.setScalar(1 / Math.max(.5, o.scale.x)); B.hand_r.add(g); g.rotation.set(0, 0, Math.PI / 2); g.visible = false; u.sword = g; return g;
}
const POSE = { cine: 0, rays: null, menu: null };
function poseSet(id) {
  if (!S || S.walking) return; const P0 = POSES.find(p => p.id === id); if (S.pose === 'pray') S.pose = null; S.sit = false;
  S.poseK = P0 ? id : null; S.poseT = 0; S.joy.x = 0; S.joy.y = 0; const u = S.av.userData.h3;
  if (u) { const c = poseCape(S.av), sw = poseSword(S.av); if (c) c.visible = !!(P0 && P0.cape); if (sw) sw.visible = !!(P0 && P0.sword); u.poseLamp = !!(P0 && P0.lamp); }
  if (P0) { S.actK = H3.clips && H3.clips[P0.clip] ? P0.clip : 'Idle_Loop'; S.actT = 9999; S.actO = 0; S.actS = 1; } else { S.actT = 0; }
  poseMenu(false); wake(); actUI();
}
function poseEnd() { if (!S || !S.poseK) return; poseOff(); S.poseK = null; S.actT = 0; POSE.cine = 0; const u = S.av.userData.h3; if (u) { if (u.cape) u.cape.visible = false; if (u.sword) u.sword.visible = false; u.poseLamp = false; } cineUI(false); }
function poseMenu(show) {
  let el = POSE.menu; if (!el) { el = document.createElement('div'); el.className = 'v3poses'; el.hidden = true; document.body.appendChild(el); POSE.menu = el; }
  if (show === undefined) show = el.hidden; if (!show) { el.hidden = true; return; }
  const list = POSES.filter(p => !p.hx || S.hx); el.innerHTML = `<b>Resplandor · elegí una pose</b>${list.map(p => `<button data-p="${p.id}"><span>${p.ico}</span>${p.name}</button>`).join('')}<small>Quedate quieto unos segundos y la cámara te rodea. La luz que tenés crece con tus buenas obras.</small>`;
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => poseSet(b.dataset.p)); el.hidden = false;
}
// Kids: un solo botón que brilla con chispas
function kidsShine() { if (!S || S.walking) return; poseSet('lampara'); S.shineT = 4.5; sparkBurst(); setTimeout(() => { if (S && S.poseK === 'lampara') poseEnd(); }, 4600); }
let _spk = null;
function sparkTex() { if (_spk) return _spk; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,240,200,.8)'); g.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(30, 4, 4, 56); x.fillRect(4, 30, 56, 4); _spk = new THREE.CanvasTexture(c); return _spk; }
function sparkBurst() {
  if (!S) return; const n = 70, pos = new Float32Array(n * 3), vel = []; for (let i = 0; i < n; i++) { pos.set([0, 1.2, 0], i * 3); const a = Math.random() * 6.28, up = .6 + Math.random() * 1.6, r = .4 + Math.random() * .9; vel.push([Math.cos(a) * r, up, Math.sin(a) * r]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: '#FFE38A', size: .16, map: sparkTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); p.position.copy(S.av.position); S.scene.add(p); let t = 0; const tick = () => { t += .016; const a = g.attributes.position; for (let i = 0; i < n; i++) { a.array[i * 3] += vel[i][0] * .016; a.array[i * 3 + 1] += (vel[i][1] - t * 1.4) * .016; a.array[i * 3 + 2] += vel[i][2] * .016; } a.needsUpdate = true; m.opacity = Math.max(0, 1 - t / 2.4); if (t < 2.4 && S) requestAnimationFrame(tick); else { S && S.scene.remove(p); g.dispose(); m.dispose(); } }; requestAnimationFrame(tick);
  glowApply(S.av, Math.max(4, glowLv(glowState().pts))); setTimeout(() => S && glowApply(S.av, glowLv(glowState().pts)), 4500);
}
// rayos de luz que bajan del cielo cuando la pose se sostiene
function cineRays(on) {
  if (!S) return; if (!POSE.rays) { const g = new THREE.Group(), ac = document.createElement('canvas'); ac.width = 4; ac.height = 64; const ax = ac.getContext('2d'), ag = ax.createLinearGradient(0, 0, 0, 64); ag.addColorStop(0, '#000'); ag.addColorStop(.25, '#fff'); ag.addColorStop(.75, '#888'); ag.addColorStop(1, '#000'); ax.fillStyle = ag; ax.fillRect(0, 0, 4, 64);
    const m = new THREE.MeshBasicMaterial({ color: '#FFE9B8', alphaMap: new THREE.CanvasTexture(ac), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide, toneMapped: false });
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.18 + i * .04, .7 + i * .15, 14, 16, 1, true), m); c.position.set((i - 1.5) * .45, 7, (i % 2 - .5) * .6); c.rotation.z = -.2 + i * .03; g.add(c); } g.userData.m = m; S.scene.add(g); POSE.rays = g; }
  POSE.rays.userData.want = on ? .05 : 0;
}
function cineUI(on) {
  let b = document.getElementById('v3photo'); if (!b) { b = document.createElement('button'); b.id = 'v3photo'; b.className = 'v3photo'; b.textContent = '📸 Foto épica'; b.onclick = cinePhoto; document.body.appendChild(b); }
  b.hidden = !on || !S || !S.hx; document.body.classList.toggle('v3cine', !!on);
}
function cinePhoto() {
  const nm = 'resplandor-' + (G().P().name || 'heroe').replace(/[^\wáéíóúñ]+/gi, '-') + '.jpg', fail = () => G().toast('No se pudo guardar la foto en este aparato');
  const save = url => { const a = document.createElement('a'); a.href = url; a.download = nm; document.body.appendChild(a); a.click(); a.remove(); G().toast('📸 Guardaste tu foto épica'); };
  try { S.renderer.render(S.scene, S.camera);
    if (S.cv.toBlob) S.cv.toBlob(b => { if (!b) return fail(); const u = URL.createObjectURL(b); save(u); setTimeout(() => URL.revokeObjectURL(u), 8000); }, 'image/jpeg', .92);
    else save(S.cv.toDataURL('image/jpeg', .92)); } catch (e) { fail(); }
}
function cineSting() { try { if (!AU.ctx || !AU.on) return; const t = AU.ctx.currentTime + .05; [62, 66, 69, 74].forEach((m, i) => play('harp', m, t + i * .09, .16, 3, AU.adv)); play('horn', 62, t + .35, .24, 2.6, AU.adv, .9); play('horn', 69, t + .35, .18, 2.6, AU.adv, .9); } catch (e) {} }
function poseTick(dt) {
  if (!S) return; if (POSE.rays) { const m = POSE.rays.userData.m; m.opacity += ((POSE.rays.userData.want || 0) - m.opacity) * Math.min(1, dt * 1.5); POSE.rays.visible = m.opacity > .003; POSE.rays.position.set(S.av.position.x, S.av.position.y, S.av.position.z); }
  if (!S.poseK) return; if (S.moving || S.freeMoving || S.walking || (S.jy || 0) > .02) { poseEnd(); return; }
  S.poseT += dt; const u = S.av.userData.h3;
  if (S.poseK === 'brazos' && u) { const B = u.bones, w = Math.min(1, S.poseT * 3); h3aim(S.av, B, 'upperarm_r', 'lowerarm_r', -.18, -.82, .5, w); h3aim(S.av, B, 'lowerarm_r', 'hand_r', .95, .2, .25, w); h3aim(S.av, B, 'upperarm_l', 'lowerarm_l', .18, -.82, .5, w); h3aim(S.av, B, 'lowerarm_l', 'hand_l', -.95, .28, .3, w); }
  if (S.poseT > 3 && !POSE.cine && S.hx) { POSE.cine = 1; S.cineKeep = { d: S.camDist, p: S.camPitch }; cineRays(true); cineSting(); cineUI(true); }
  if (POSE.cine) { S.camYaw += dt * .28; S.camDist += (4.2 - S.camDist) * Math.min(1, dt); S.camPitch += (.16 - S.camPitch) * Math.min(1, dt); if (u) u.mixer.timeScale = .6; }
}
function poseOff() { if (POSE.cine) { POSE.cine = 0; cineRays(false); cineUI(false); if (S && S.cineKeep) { S.camDist = S.cineKeep.d; S.camPitch = S.cineKeep.p; } } const u = S && S.av.userData.h3; if (u) u.mixer.timeScale = 1; }

/* ---------- caminar libre ---------- */
function nearestPath(x, z) { let d = Infinity; for (const p of S.allPts) { const q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } return Math.sqrt(d); }
/* mundo abierto: se puede caminar por todo el terreno; las historias de cada etapa siguen en orden */
function frontier() { return (S.zEnd ?? -1e9) + 10; }
function sheetUp() { const v = document.getElementById('v3sheet'); return CINE.on || (v && !v.hidden) || !!document.querySelector('.sheet:not([hidden])') || !document.getElementById('arcade').hidden; }
function autoEnter() {
  const g = G(), p = g.P(), a = S.av.position; let best = null, bd = .95 * .95;
  for (const id in S.markers) { const m = S.markers[id], d = (m.position.x - a.x) ** 2 + (m.position.z - a.z) ** 2; if (d < bd) { bd = d; best = id; } }
  if (!best) { if (S.onStop) { const m = S.markers[S.onStop]; if ((m.position.x - a.x) ** 2 + (m.position.z - a.z) ** 2 > 2.4) S.onStop = null; } return; }
  if (best === S.onStop) return;
  S.onStop = best; const n = g.NODES[best];
  if (!g.reachable(best)) { if (performance.now() - (S.lockT || 0) > 8000) { S.lockT = performance.now(); g.toast('Podés recorrer este lugar. Su historia se abre cuando termines las anteriores.'); } return; }
  const pending = n.kind === 'ch' ? !g.isDone(best) : !g.visited(best);
  if (!pending) { if (best !== p.pos) { p.pos = best; g.save(); S.sig = ''; } return; }
  S.joy.x = 0; S.joy.y = 0; S.keys = {}; const kn = document.querySelector('#v3joy i'); if (kn) kn.style.transform = '';
  const m = S.markers[best]; a.x = m.position.x; a.z = m.position.z; S.freeMoving = false;
  p.pos = best; g.save(); S.sig = ''; g.arrive(best); refresh();
}
function freeWalk(dt) {
  if (S.walking) { S.freeMoving = false; return; }
  if (sheetUp()) { S.joy.x = 0; S.joy.y = 0; return; }
  let jx = S.joy.x, jy = S.joy.y; const k = S.keys;
  if (k.ArrowUp || k.w) jy -= 1; if (k.ArrowDown || k.s) jy += 1; if (k.ArrowLeft || k.a) jx -= 1; if (k.ArrowRight || k.d) jx += 1;
  const mag = Math.min(1, Math.hypot(jx, jy)); if (mag >= .12 && S.pose === 'pray') { S.pose = null; actUI(); } if (mag >= .12 && S.sit) { S.sit = false; actUI(); } if (mag >= .12 && S.poseK) poseEnd(); S.fullT = mag > .96 ? (S.fullT || 0) + dt : 0; if (S.sprint && S.hx) { AXS.run = (AXS.run || 0) + dt; if (AXS.run > 12) { AXS.run = 0; axGain('agi', 1); } } S.sprint = !!S.hx && (!!k.Shift || S.fullT > 1.2); if (mag < .12) { if (S.freeMoving) { S.freeMoving = false; snapToStop(); } return; }
  const C = S.yaw + S.camYaw, fx = Math.sin(C), fz = Math.cos(C), rx = -Math.cos(C), rz = Math.sin(C);
  let mx = fx * -jy + rx * jx, mz = fz * -jy + rz * jx; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
  if (S.boostT > 0) S.boostT -= dt; const sp = 5 * mag * dt * agiMul() * (S.sprint ? 1.55 : 1) * (S.boostT > 0 ? 1.3 : 1), a = S.av.position, fr = frontier(), z0 = 6;
  const ok = (x, z) => Math.abs(x) < XB && z > fr && z < z0 && !blockedAt(x, z);
  let nx = a.x + mx * sp, nz = a.z + mz * sp;
  if (!ok(nx, nz)) { if (nz <= fr && performance.now() - (S.wallT || 0) > 6000) { S.wallT = performance.now(); G().toast('Hasta acá llega el camino por ahora.'); } if (ok(nx, a.z)) nz = a.z; else if (ok(a.x, nz)) nx = a.x; else { nx = a.x; nz = a.z; } }
  a.x = nx; a.z = nz; S.freeMoving = true; S.quiet = true; wake(); autoEnter(); if (!S.freeMoving) return;
  const camWorld = S.yaw + S.camYaw, ty = Math.atan2(mx, mz); let d = ty - S.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
  S.yaw += d * Math.min(1, dt * 10); S.camYaw = camWorld - S.yaw; S.av.rotation.y = S.yaw;
  const box = document.getElementById('v3go'); if (box && box.innerHTML && !S.hiddenUi) { box.innerHTML = ''; S.hiddenUi = true; }
}
function snapToStop() {
  const g = G(), p = g.P(), a = S.av.position; S.hiddenUi = false;
  let best = null, bd = 1.6 * 1.6;
  for (const id in S.markers) { const m = S.markers[id], d = (m.position.x - a.x) ** 2 + (m.position.z - a.z) ** 2; if (d < bd && g.reachable(id)) { bd = d; best = id; } }
  if (best && best !== p.pos) { p.pos = best; g.save(); const n = g.NODES[best]; if (n.kind !== 'ch' && !g.visited(best)) g.arrive(best); }
  S.sig = ''; refresh();
}
function wireJoy() {
  const base = document.getElementById('v3joy'); if (!base) return; const knob = base.firstElementChild; let id = null, cx = 0, cy = 0;
  const set = (x, y) => { const r = 42, dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy), k = l > r ? r / l : 1; knob.style.transform = `translate(${dx * k}px,${dy * k}px)`; S.joy.x = dx * k / r; S.joy.y = dy * k / r; };
  base.onpointerdown = e => { e.preventDefault(); wake(); e.stopPropagation(); id = e.pointerId; const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; try { base.setPointerCapture(id); } catch (er) {} set(e.clientX, e.clientY); };
  base.onpointermove = e => { if (e.pointerId === id) set(e.clientX, e.clientY); };
  base.onpointerup = base.onpointercancel = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; S.joy.x = 0; S.joy.y = 0; };
  addEventListener('keydown', e => { if (!S || document.getElementById('view3d').hidden) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'Shift'].includes(k)) { S.keys[k] = true; if (k !== 'Shift') e.preventDefault(); } if (k === 'x' && !e.repeat && false) doSit(); });
  addEventListener('keyup', e => { if (!S) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; S.keys[k] = false; });
  document.getElementById('v3bag').onclick = openBag; bagBtn();
}

/* ---------- cámara, toques y bucle ---------- */
function wireInput() {
  const cv = S.cv, ray = new THREE.Raycaster(), v = new THREE.Vector2(); let down = null, drag = 0;
  const pts = new Map(), Z = d => Math.max(2.4, Math.min(16, d)); let pinch = null;
  const spread = () => { const v = [...pts.values()]; return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) || 1; };
  cv.onpointerdown = e => { wake(); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    if (pts.size === 2) { pinch = { d0: spread(), dist: S.camDist }; drag = 99; down = null; return; }
    down = { x: e.clientX, y: e.clientY, yaw: S.camYaw, pitch: S.camPitch }; drag = 0; };
  cv.onpointermove = e => { if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) { S.camDist = Z(pinch.dist * pinch.d0 / spread()); return; }
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; drag = Math.max(drag, Math.abs(dx), Math.abs(dy));
    S.camYaw = down.yaw - dx * .008; S.camLookT = performance.now(); S.camPitch = Math.max(-.18, Math.min(1.2, down.pitch + dy * .005)); };
  cv.onpointercancel = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; down = null; };
  cv.onwheel = e => { e.preventDefault(); wake(); S.camDist = Z(S.camDist * Math.exp(e.deltaY * .0012)); };
  // botones de cámara: acercar, alejar y volver atrás del personaje
  const cb = document.createElement('div'); cb.className = 'v3cam'; cb.innerHTML = '<button type="button" class="v3cam-tg" aria-label="Opciones de cámara" aria-expanded="false" title="Cámara"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="13" height="10" rx="2"/><path d="M15.5 10.6l5.2-3.1v9l-5.2-3.1z"/></svg></button><div class="v3cam-o"><button data-z="-1" aria-label="Acercar cámara" title="Acercar">+</button><button data-z="1" aria-label="Alejar cámara" title="Alejar">−</button><button data-z="m" class="v3cam-m" aria-label="Cambiar modo de cámara"></button><button data-z="0" aria-label="Centrar cámara detrás del personaje" title="Centrar">⌖</button></div>';
  const camFold = on => { cb.classList.toggle('open', on); cb.querySelector('.v3cam-tg').setAttribute('aria-expanded', on ? 'true' : 'false'); };
  if (!window.__camOut) { window.__camOut = true; document.addEventListener('pointerdown', e => { const c = document.querySelector('.v3cam.open'); if (c && !c.contains(e.target)) { c.classList.remove('open'); const t = c.querySelector('.v3cam-tg'); t && t.setAttribute('aria-expanded', 'false'); } }, true); }
  cb.onpointerdown = e => e.stopPropagation(); cb.onclick = e => { const z = e.target.closest('button'); if (!z) return; wake(); if (z.classList.contains('v3cam-tg')) { camFold(!cb.classList.contains('open')); return; } camFold(false); if (z.dataset.z === 'm') { camModeToggle(); return; } const k = +z.dataset.z; if (k) S.camDist = Z(S.camDist * (k > 0 ? 1.3 : 1 / 1.3)); else { S.camYaw = 0; S.camPitch = .4; S.camDist = 6.6; } };
  S.root.querySelectorAll('.v3cam').forEach(x => x.remove()); S.root.appendChild(cb); camModeUI();
  if (!window.__camKeys) window.__camKeys = 1, addEventListener('keydown', e => { if (!S || document.getElementById('view3d').hidden || sheetUp() || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return; const k = e.key.toLowerCase();
    if (k === '+' || k === '=') S.camDist = Z(S.camDist / 1.2); else if (k === '-' || k === '_') S.camDist = Z(S.camDist * 1.2); else if (k === 'q') S.camYaw += .12; else if (k === 'e') S.camYaw -= .12; else if (k === 'r') S.camPitch = Math.max(-.18, S.camPitch - .08); else if (k === 'f') S.camPitch = Math.min(1.2, S.camPitch + .08); else if (k === 'v') camModeToggle(); else if (k === 'x') camRecenter(); });
  cv.onpointerup = e => {
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    const was = down; down = null; if (!was || drag > 8) return;
    const r = cv.getBoundingClientRect(); v.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, S.camera); const here = G().P().pos, hits = ray.intersectObjects(Object.values(S.markers).filter(m => m.userData.id !== here), true);
    if (hits.length) { let o = hits[0].object; while (o && !o.userData.id) o = o.parent; if (o) { go(o.userData.id); return; } }
    const gh = ray.intersectObject(S.ground)[0]; if (!gh) return;
    const g = G(), cand = nextList(); let best = null, bd = Infinity;
    const pool = cand.length ? cand : Object.keys(S.markers).filter(id => id !== g.P().pos && g.reachable(id));
    pool.forEach(id => { const m = S.markers[id], d = (m.position.x - gh.point.x) ** 2 + (m.position.z - gh.point.z) ** 2; if (d < bd) { bd = d; best = id; } });
    if (best && (cand.length || bd < 36)) go(best);
  };
}
function loop(now) {
  if (!S) return;
  const root = S.root; if (!root || root.hidden || root.closest('main').hidden || document.hidden) { S.last = 0; return; }
  // con un minijuego abierto el mundo 3D no se dibuja: toda la máquina queda para el minijuego
  const arc = S.arcEl || (S.arcEl = document.getElementById('arcade')); if (arc && !arc.hidden) { S.last = 0; return; }
  const raw = now - (S.last || now), t = now / 1000, dt = Math.min(.05, raw / 1000); S.last = now; S.t = t; S.renderer.info.reset(); if (raw > 0 && raw < 250) qFrame(raw);
  const PF = PROF.on, p0 = PF ? performance.now() : 0; freeWalk(dt); refresh(); const p1 = PF ? performance.now() : 0; phTick(dt); floraTick(dt); miniTick(dt); compassTick(dt); vilTick(dt); foamTick(t); dawnTick(dt); const p2 = PF ? performance.now() : 0; waterTick(dt, t); ambTick(dt, t); const p3 = PF ? performance.now() : 0; animAvatar(S.av, t, (S.moving || S.freeMoving) && !(S.jy > .02), dt); applyPose(S.av, t, dt); poseTick(dt); const p4 = PF ? performance.now() : 0;
  for (const id in S.items) { const m = S.items[id];
    if (m.userData.gone) { m.userData.gone += dt; const k = m.userData.gone / .5; m.scale.setScalar(1 + k); m.position.y += dt * 2; m.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - k); } }); if (k >= 1) { S.scene.remove(m); delete S.items[id]; } continue; }
    m.rotation.y = t * 1.6; m.position.y = (m.userData.by || 0) + .85 + Math.sin(t * 2.4 + id.length) * .12;
    if ((m.position.x - S.av.position.x) ** 2 + (m.position.z - S.av.position.z) ** 2 < 2.6) collect(id, m);
  }
  camFollow(dt); const yaw = S.yaw + S.camYaw, a = S.av.position, ph = S.camPitch ?? .4, back = camSafeBack(a, yaw, S.camDist * Math.cos(ph)), up = (S.hx ? 1.3 : 1.02) + S.camDist * Math.sin(ph);
  { const gnd = Math.max(S.W ? Math.max(0, S.W.hAt(a.x, a.z)) : 0, stairH(a.x, a.z), floorH(a.x, a.z)); S.gy = (S.gy ?? gnd) + (gnd - (S.gy ?? gnd)) * Math.min(1, dt * 12); if (S.jy > 0) { S.jv -= 17 * dt; S.jy = Math.max(0, S.jy + S.jv * dt); } a.y = S.gy + (S.jy || 0); }
  if (S.W) { S.W.sunL.position.set(a.x + S.W.sunDir.x * 40, a.y + 11, a.z + S.W.sunDir.z * 40); S.W.sunL.target.position.copy(a); S.uGrass.value = t; S.W.sky.material.uniforms.t.value = t; }
  const cx = a.x - Math.sin(yaw) * back, cz = a.z - Math.cos(yaw) * back;
  S.camera.position.x += (cx - S.camera.position.x) * .08; S.camera.position.z += (cz - S.camera.position.z) * .08; { const cg = S.W ? S.W.hAt(S.camera.position.x, S.camera.position.z) : 0; S.camera.position.y += (Math.max(a.y + up, cg + .45) - S.camera.position.y) * .08; }
  { const la = Math.min(4.5, 1.2 + S.camDist * .5) * Math.max(.15, 1 - Math.max(0, ph - .4) * 1.2); S.camL = [a.x + Math.sin(yaw) * la, a.y + (S.hx ? 1.2 : .92) + Math.max(0, .3 - ph) * 4, a.z + Math.cos(yaw) * la]; S.camI = [cx, Math.max(a.y + up, (S.W ? S.W.hAt(cx, cz) : 0) + .45), cz]; S.camera.lookAt(S.camL[0], S.camL[1], S.camL[2]); } if (S.W) S.W.sky.position.copy(S.camera.position);
  S.fill.position.copy(S.camera.position); S.fill.target.position.copy(a);
  { let i = 0; for (const id in S.markers) { const m = S.markers[id], o = m.userData.orb; i++; const d2 = (m.position.x - a.x) ** 2 + (m.position.z - a.z) ** 2, vis = d2 < [4900, 8100, 14400, 22500][QUAL.lv]; if (m.visible !== vis) m.visible = vis; if (d2 > 6400) continue; o.rotation.y = t * 1.4 + i; o.position.y = (o.geometry.type === 'TorusGeometry' ? .2 : 1.05 + Math.sin(t * 2 + i) * .08); } }
  if (S.flies) { S.flies.visible = false; S.flies.material.opacity = .6 + Math.sin(t * 3) * .3; S.flies.rotation.y = Math.sin(t * .05) * .02; }
  cineTick(dt); if (window.__camFix) { const f = window.__camFix; S.camera.position.set(...f.p); S.camera.lookAt(...f.l); }
  fxWatch(now); if (S.W) { const u = S.W.sky.material.uniforms; u.inv.value = S.fx ? 1 : 0; u.ex.value = S.renderer.toneMappingExposure; }
  const p5 = PF ? performance.now() : 0; if (S.fx) S.fx.render(dt); else S.renderer.render(S.scene, S.camera); const p6 = PF ? performance.now() : 0; QUAL.lastCalls = S.renderer.info.render.calls; QUAL.lastTris = S.renderer.info.render.triangles;
  idle(dt); misTick(t); voiceTick(dt); wpTick(t); mpTick(t, dt); dayTick(dt); seasonTick(dt); gearDropTick(dt, t); doorTick(t); h3npcTick(dt); roomTick(dt); survTick(dt, t); prayTogetherTick(dt); axVerse(dt);
  if (PF) { const p7 = performance.now(); PROF.add({ mov: p1 - p0, zonas: p2 - p1, agua_fuego: p3 - p2, avatar: p4 - p3, escena: p5 - p4, render: p6 - p5, npc_misiones: p7 - p6 }); }
}

/* ---------- cuando el jugador se queda quieto ---------- */
const THINK = {
  kids: ['¿A dónde seguimos?', '¿Qué habrá más adelante?', '¡Vamos, que el camino sigue!', '¿Y si busco algún objeto escondido?', 'Mmm… ¿por dónde era?'],
  hx: ['¿A dónde seguimos?', 'Algo me dice que hay más por descubrir…', '¿Qué habrá detrás de esos árboles?', 'El camino sigue. ¿Vamos?', 'Siento que me falta encontrar algo…']
};
/* ---------- modos de cámara: "Detrás" (sigue la espalda del personaje) y "Libre" (como antes) ---------- */
const CAMM = { mode: (() => { try { return localStorage.getItem('tsp:cam') || 'behind'; } catch (e) { return 'behind'; } })() };
function camModeUI() { const b = document.querySelector('.v3cam-m'); if (b) { b.textContent = CAMM.mode === 'behind' ? '🎥' : '👀'; b.title = CAMM.mode === 'behind' ? 'Cámara: detrás (V para cambiar)' : 'Cámara: libre (V para cambiar)'; } }
function camTip(t) { let el = document.getElementById('v3camtip'); if (!el) { el = document.createElement('div'); el.id = 'v3camtip'; el.className = 'v3camtip'; document.body.appendChild(el); } el.textContent = t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(CAMM.tt); CAMM.tt = setTimeout(() => el.classList.remove('on'), 1600); }
function camModeToggle() { CAMM.mode = CAMM.mode === 'behind' ? 'free' : 'behind'; try { localStorage.setItem('tsp:cam', CAMM.mode); } catch (e) {} camModeUI(); camTip(CAMM.mode === 'behind' ? 'Cámara: detrás' : 'Cámara: libre'); if (CAMM.mode === 'behind') S.camLookT = 0; }
function camRecenter() { if (!S) return; S.camYaw = 0; S.camPitch = .4; S.camLookT = 0; camTip('Cámara centrada'); }
// en modo "Detrás", el ángulo de la cámara vuelve suave a la espalda (≈0,2 s); mirar con el mouse lo suspende un momento
function camFollow(dt) {
  if (!S || CAMM.mode !== 'behind' || S.walking || CINE.on || CINE.cam || POSE.cine) return;
  if (S.camLookT && performance.now() - S.camLookT < (S.freeMoving ? 600 : 2500)) return;
  // caminando hacia la cámara no se persigue (evita girar sin fin); al soltar, vuelve suave a la espalda
  { const k = S.keys || {}, back = (S.joy.y || 0) + ((k.ArrowDown || k.s) ? 1 : 0) - ((k.ArrowUp || k.w) ? 1 : 0); if (S.freeMoving && back > .5) return; }
  let d = -S.camYaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; S.camYaw += d * Math.min(1, dt / .2);
}
// la cámara no atraviesa paredes ni casas: se acerca al personaje si hay algo en medio
function camSafeBack(a, yaw, back) { let b = back; for (let k = 1; k <= 8; k++) { const r = back * k / 8; if (blockedAt(a.x - Math.sin(yaw) * r, a.z - Math.cos(yaw) * r)) { b = Math.max(.9, back * (k - 1) / 8 - .2); break; } } return b; }
function wake() { if (!S) return; S.idleT = 0; if (S.hint) S.hint.classList.remove('on'); if (S.think) S.think.classList.remove('on'); }
const HV = { v: null };
function idle(dt) {
  if (!S.hint) {
    S.hint = document.createElement('div'); S.hint.className = 'v3hint'; S.hint.textContent = matchMedia('(pointer: fine)').matches ? 'Flechas para caminar · Espacio: saltar · O: orar · H: saludar · Rueda o + −: zoom · Arrastrá para mirar' : 'Usá el joystick para explorar · arrastrá para mirar · pellizcá para acercar'; S.root.appendChild(S.hint);
    S.think = document.createElement('div'); S.think.className = 'v3think'; S.think.innerHTML = '<span></span><i></i><i></i>'; S.root.appendChild(S.think); S.idleT = 0;
  }
  const sheetOpen = !document.getElementById('v3sheet').hidden || document.querySelector('.sheet:not([hidden])');
  if (S.walking || S.moving || S.freeMoving || sheetOpen) { if (S.idleT) wake(); return; }
  S.idleT = (S.idleT || 0) + dt;
  if (S.idleT > 30 && !S.think.classList.contains('on')) { const L = S.hx ? THINK.hx : THINK.kids; S.think.firstChild.textContent = L[Math.floor(Math.random() * L.length)]; if (!S.hx) try { G().vo(S.think.firstChild.textContent, 'narrador', { queue: 1, tts: false }); } catch (e) {} S.think.classList.add('on'); }
  if (S.idleT > 60) { S.hint.classList.add('on'); if (S.quiet) { S.quiet = false; S.sig = ''; } }
  if (S.think.classList.contains('on')) {
    if (!HV.v) HV.v = new THREE.Vector3();
    HV.v.set(S.av.position.x, 2.35, S.av.position.z).project(S.camera);
    const r = S.root.getBoundingClientRect(), x = (HV.v.x + 1) / 2 * r.width, y = (1 - HV.v.y) / 2 * r.height;
    const w = S.think.firstChild.offsetWidth, cx = Math.max(30, Math.min(x, r.width - w - 4)); S.think.style.transform = `translate(${Math.round(cx)}px,${Math.round(y)}px)`;
  }
}

/* ---------- entrada pública ---------- */
let loading = null, builtFor = null;
async function show3d(on) {
  const root = document.getElementById('view3d'), btn = document.getElementById('viewToggle'); if (!root || !btn) return;
  setPref(on ? '3d' : 'map');
  if (!on) { document.body.classList.remove('v3boot'); root.hidden = true; btn.innerHTML = '<span>Vista 3D</span>'; document.body.classList.remove('v3on'); G().syncMap(); return; }
  root.hidden = false; document.body.classList.add('v3on'); btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Mapa</span>';
  const g = G(), key = g.branch + '|' + g.P().id + '|' + JSON.stringify(g.P().avatar);
  if (!THREE) { if (!loading) loading = import(THREE_URL); try { THREE = await loading; } catch (e) { document.body.classList.remove('v3boot'); root.hidden = true; document.body.classList.remove('v3on'); btn.hidden = true; return; } }
  let LBU = null; if (builtFor !== key || !S) { if (!window.__noLobby && !/[?&]lobby=0/.test(location.search)) { try { LBU = await lobby(); } catch (e) { console.warn('lobby', e); } } if (S) { S.renderer.dispose(); S = null; } builtFor = key; BSTEP.u = LBU; BSTEP.log = [];
    let ok = false; try { await withTO(build(), 120000, 'armado'); ok = true; } catch (e) { builtFor = null; buildFail(LBU, e); if (!LBU) { document.body.classList.remove('v3boot'); root.hidden = true; document.body.classList.remove('v3on'); } return; } finally { BSTEP.u = null; if (LBU && ok) LBU.close(); } }
  else { const n = g.NODES[g.P().pos], [x, z] = (S.npos && S.npos[n.id]) || toV(n.x, n.y); S.av.position.set(x, 0, z); S.sig = ''; S.onStop = g.P().pos; S.quiet = false; }
  resize(); refresh(); bagBtn(); try { fanInit(); miniInit(); bagHud(); } catch (e) { console.warn('hud', e); } setTimeout(fullHint, 1500); setTimeout(iosHint, 1800); setTimeout(fidDaily, 5000); document.body.classList.remove('v3boot');
}
export function enter() {
  const btn = document.getElementById('viewToggle'); if (!btn) return;
  btn.hidden = false; btn.onclick = () => { if (document.getElementById('view3d').hidden) show3d(true); else if (S) openMap(); };
  const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!ok) { btn.hidden = true; document.body.classList.remove('v3boot'); return; }
  show3d(pref() === '3d');
}

/* =====================================================================
   SUPERVIVENCIA Y RPG (solo Hero)
   - Herramientas: pedernal, hacha, pico, caña y red (misiones o flotando en el mapa)
   - Recursos: madera (talar olivos), piedra (picar rocas), frutos (granados), pescado (lago y río)
   - Fogata para cocinar, hambre con 45 + 12 minutos de juego, desmayo y bolsa en el piso 2 minutos (+1 con Control propio 40; con Amor 50 no se pierde)
   - Fabricar: tablones, bloques, fogata, casa y muebles (cama, mesa, banco, horno, cofre, lámpara)
   - Atributos: 2 puntos por nivel para repartir
   - Días: cada jugador cuenta sus propios días de camino (15 minutos de juego = 1 día)
   ===================================================================== */
const SV = { FULL: 57 * 60, WARN: 12 * 60, DAY: 15 * 60, BAG: 2 * 60, TREE: 240, ROCK: 300, FRUIT: 180, FIRE: 240 };
const TOOLS = {
  flint: ['Pedernal', '🔥', 'Para encender fogatas.'], axe: ['Hacha', '🪓', 'Para talar árboles y sacar madera.'], pick: ['Pico', '⛏️', 'Para picar rocas y sacar piedra.'],
  rod: ['Caña de pescar', '🎣', 'Esperá a que pique y tirá en el momento justo.'], net: ['Red de pescar', '🕸️', 'Se tira al agua y atrapa peces sola, aunque tarda más.']
};
const TOOL_ORDER = ['flint', 'axe', 'rod', 'pick', 'net'];
const RES = {
  wood: ['Madera', '🪵'], stone: ['Piedra', '🪨'], plank: ['Tablones', '🟫'], block: ['Bloques de piedra', '🧱'],
  fruit: ['Granadas', '🍎'], fish: ['Pescado crudo', '🐟'], cooked: ['Pescado asado', '🍢']
};
const FOOD = { cooked: 25 * 60, fruit: 10 * 60 };
// Kids: atributos de siempre. Hero: frutos del Espíritu (Gálatas 5:22-23, NTV) + Cuerpo. Las claves viejas se reusan (nadie pierde puntos):
// dom→Control propio, pac→Paciencia, gen→Bondad, sab→Alegría; fue y agi pasan a Cuerpo; amor, paz, gent y fid son nuevos. Humildad sigue igual (hum).
const ATTRK = [
  ['fue', 'Fuerza', 'Talás y picás con menos golpes, y sacás más madera.'],
  ['agi', 'Agilidad', 'Caminás más rápido y saltás más alto.'],
  ['dom', 'Dominio propio', 'El hambre baja más despacio (Gálatas 5:22-23).'],
  ['pac', 'Paciencia', 'Los peces pican antes y es más fácil sacarlos.'],
  ['sab', 'Sabiduría', 'Ganás más puntos de experiencia por trabajar.'],
  ['gen', 'Generosidad', 'Las misiones te regalan comida y materiales.']
];
const FRUITS = [
  ['amor', 'Amor', 'Crece ayudando.', ['+10% en misiones de ayuda', 'Los que ayudaste vuelven con una misión nueva', '+20% en misiones de ayuda', 'Tus ayudas suben la reputación de la aldea', 'Si te desmayás, alguien que ayudaste cuida tu bolsa: no se pierde aunque pase el tiempo']],
  ['ale', 'Alegría', 'Crece cumpliendo misiones y animando a otros.', ['+5% de experiencia', 'Las estrellas de los minijuegos valen más', '+10% de experiencia', '30 s de carrera rápida al completar una misión', '+15% de experiencia y compañeros más animados']],
  ['paz', 'Paz', 'Crece jugando los minijuegos con golpes.', ['Parpadeo de invulnerabilidad de 0,5 s tras un golpe', '1 s de invulnerabilidad', '+1 corazón', '2 s de invulnerabilidad', 'Escudo de paz: el primer golpe de cada partida no resta']],
  ['pac', 'Paciencia', 'Crece pescando con caña.', ['Los peces pican 10% antes', 'Ventana más larga para tirar', 'Pican 20% antes', 'Chance de sacar dos peces', 'Peces raros que valen más']],
  ['gent', 'Gentileza', 'Crece tratando bien a la gente de las aldeas.', ['-5% en los precios', 'Te saludan primero y te dan pistas', '-10% en los precios', 'Te regalan comida', 'Misiones escondidas']],
  ['gen', 'Bondad', 'Crece compartiendo pan y denarios.', ['Compartir duplica la reputación que ganás', 'Lo compartido a veces vuelve como regalo', 'Los necesitados te cuentan dónde hay lugares secretos', 'Compartir también suma Alegría', 'A veces aparece una canasta extra de pan']],
  ['fid', 'Fidelidad', 'Crece volviendo cada día y terminando lo empezado.', ['Bonus de racha', '1 día de gracia en la racha', 'Bonus de racha mayor', 'Las misiones a medias nunca se pierden', 'Cofre semanal']],
  ['dom', 'Control propio', 'Crece comiendo con medida y cuidando tus fuerzas.', ['-10% de hambre', 'Comer te llena más', '-20% de hambre', 'Si te desmayás, tenés 1 minuto más para buscar la bolsa', '-35% de hambre']]
];
const BODY = [['fue', 'Fuerza', 'Talás y picás con menos golpes, y sacás más madera.'], ['agi', 'Agilidad', 'Caminás más rápido y saltás más alto.']];
const SABI = ['sab', 'Sabiduría', 'Crece escuchando a los testigos, descubriendo lugares secretos, mirando los objetos del camino, leyendo la Escritura, respondiendo a Teófilo y aprobando exámenes.', ['+40% de experiencia por trabajar', '+80% de experiencia por trabajar', '+120% de experiencia por trabajar', '+160% de experiencia por trabajar', '+200% de experiencia por trabajar']];
const ATTRH = FRUITS.map(([k, n, d]) => [k, n, d]).concat([[SABI[0], SABI[1], SABI[2]]], BODY);
const attrList = () => (S && S.hx) || (G().branch === 'ados') ? ATTRH : ATTRK;
const ATTR = new Proxy([], { get: (o, k) => { const L = attrList(), v = L[k]; return typeof v === 'function' ? v.bind(L) : v; } });
// valor del fruto (0–50) y escalón (0–5)
const fv = k => Math.min(50, (atP()[k] || 0) + axLv(k)), ft = k => Math.floor(fv(k) / 10);
const RECIPES = [
  { id: 'plank', name: 'Tablones', out: { plank: 1 }, need: { wood: 2 }, tool: 'axe', desc: 'Cortá la madera en tablones para construir.' },
  { id: 'block', name: 'Bloques de piedra', out: { block: 1 }, need: { stone: 2 }, tool: 'pick', desc: 'Tallá la piedra en bloques.' },
  { id: 'fire', name: 'Fogata', place: 'fire', need: { wood: 3 }, tool: 'flint', desc: 'Para cocinar el pescado. Dura unos minutos.' },
  { id: 'house', name: 'Tu casa', place: 'house', need: { plank: 10, block: 6 }, desc: 'Una casa de piedra y madera, con lugar para tus muebles. Se arma donde estés parado, fuera del camino.' },
  { id: 'cama', name: 'Cama', furn: 1, need: { plank: 3, fruit: 0 }, desc: 'Si te quedás sin fuerzas, te despertás acá.' },
  { id: 'mesa', name: 'Mesa', furn: 1, need: { plank: 2 }, desc: 'Para compartir la comida.' },
  { id: 'banco', name: 'Banco', furn: 1, need: { plank: 1 }, desc: 'Para sentarse a descansar.' },
  { id: 'horno', name: 'Horno de piedra', furn: 1, need: { block: 4 }, desc: 'Un fuego que no se apaga: cociná sin armar fogatas.' },
  { id: 'cofre', name: 'Cofre', furn: 1, need: { plank: 2, block: 1 }, desc: 'Lo que guardás acá no se pierde nunca.' },
  { id: 'lampara', name: 'Lámpara de aceite', furn: 1, need: { block: 1 }, desc: 'Ilumina tu casa de noche.' }
];
function svOn() { return !!(S && S.hx); }
function svP() { const p = G().P(); p.surv = p.surv || {}; const s = p.surv; if (s.sat == null) s.sat = SV.FULL; s.play = s.play || 0; s.inv = s.inv || {}; s.tools = s.tools || []; s.furn = s.furn || []; s.chest = s.chest || {}; return s; }
function atP() { const p = G().P(); p.attr = p.attr || {}; ATTR.forEach(([k]) => { p.attr[k] = p.attr[k] || 0; }); return p.attr; }
function atr(k) { return Math.min(50, (atP()[k] || 0) + axLv(k)) / 5; }
/* ---------- experiencia por atributo: lo que hacés seguido te sale mejor (pescar → Paciencia, talar y picar → Fuerza, correr y saltar → Agilidad…) ---------- */
const AXN = new Proxy({}, { get: (o, k) => { const x = attrList().find(q => q[0] === k); return x ? x[1] : undefined; } });
const axNeed = l => 30 + l * 22; // cada nivel pide un poco más
function axP() { const a = atP(); a.xp = a.xp || {}; a.xl = a.xl || {}; return a; }
function axLv(k) { const a = atP(); return (a.xl && a.xl[k]) || 0; }
// Sabiduría pasa a ser un atributo propio y Alegría se guarda en 'ale'. Para quien ya jugaba: la experiencia que venía de las
// misiones (2 por misión) pasa a Alegría y se descuenta de Sabiduría; los puntos de Sabiduría del material se suman al atributo real.
function attrMigrate() {
  if (!S || !S.hx) return; const p = G().P(), a = axP(); p.story = p.story || {}; let dirty = false;
  const tot = k => { let t = a.xp[k] || 0; for (let l = 0; l < (a.xl[k] || 0); l++) t += axNeed(l); return t; }, set = (k, t) => { let l = 0; while (t >= axNeed(l) && l < 30) { t -= axNeed(l); l++; } a.xl[k] = l; a.xp[k] = t; };
  if (!p.story.aleMig) { p.story.aleMig = 1; const m = ((p.behav && p.behav.misiones) || 0) * 2; set('ale', tot('ale') + m); set('sab', Math.max(0, tot('sab') - m)); dirty = true; }
  const pm = p.mat; if (pm && (pm.sabi || 0) > (pm.sabiM || 0)) { set('sab', tot('sab') + pm.sabi - (pm.sabiM || 0)); pm.sabiM = pm.sabi; dirty = true; }
  if (dirty) G().save();
}
function axGain(k, n) {
  if (!AXN[k] || !S) return; const a = axP(); a.xp[k] = (a.xp[k] || 0) + n; let up = false;
  while (a.xp[k] >= axNeed(a.xl[k] || 0) && (a.xl[k] || 0) < 30) { a.xp[k] -= axNeed(a.xl[k] || 0); a.xl[k] = (a.xl[k] || 0) + 1; up = true; }
  axFloat(up ? `+1 ${AXN[k]}` : `+${n} exp. ${AXN[k]}`, up); if (up) { G().toast(`💪 Tu ${AXN[k]} subió a ${(a[k] || 0) + a.xl[k]} de tanto practicar.`); G().save(); }
  else { AXS.dirty = (AXS.dirty || 0) + 1; if (AXS.dirty > 6) { AXS.dirty = 0; G().save(); } }
}
const AXS = {};
// contadores de comportamiento (para el futuro descubrimiento de dones)
function behav(k, n) { try { const p = G().P(); p.behav = p.behav || {}; p.behav[k] = (p.behav[k] || 0) + (n || 1); } catch (e) {} }
function fidDaily() { try { if (!S || !S.hx) return; const p = G().P(), d = new Date().toISOString().slice(0, 10); if (p.fidDay === d) return; const prev = p.fidDay; p.fidDay = d; const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10), y2 = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  p.fidRun = prev === y || (prev === y2 && fv('fid') >= 20) ? (p.fidRun || 0) + 1 : 1; axGain('fid', 4); const b = fv('fid') >= 30 ? 10 : fv('fid') >= 10 ? 5 : 0; if (b && p.fidRun > 1) { p.bonus = (p.bonus || 0) + b * Math.min(7, p.fidRun); setTimeout(() => svToast(`📅 Volviste ${p.fidRun} días seguidos: +${b * Math.min(7, p.fidRun)} puntos por tu Fidelidad.`), 4000); }
  if (fv('fid') >= 50) { const w = Math.floor(Date.now() / 6048e5); if (p.fidWeek !== w) { p.fidWeek = w; setTimeout(() => { svAdd('bread', 3); svAdd('money', 10); svToast('🎁 Cofre semanal de la Fidelidad: 3 panes y 10 denarios.'); }, 6000); } } behav('dias'); G().save(); } catch (e) {} }
function axFloat(t, big) { const d = document.createElement('div'); d.className = 'v3ax' + (big ? ' up' : ''); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1700); }
// mantener apretada la acción (E o el botón) repite el trabajo: talar, picar, pescar
function axHold(on) { clearInterval(AXS.hold); if (!on) return; svAct(); AXS.hold = setInterval(() => { if (!S || !S.sv || S.sv.fishing && S.sv.fishing.mode === 'net') return; svAct(); }, 850); }
// cada tanto, mientras trabajás, el narrador recuerda la historia de la etapa
function axVerse(dt) {
  if (!S || !S.sv) return; const busy = S.sv.fishing || (AXS.workT || 0) > 0; AXS.workT = Math.max(0, (AXS.workT || 0) - dt); if (!busy) return;
  AXS.vT = (AXS.vT == null ? 45 + Math.random() * 45 : AXS.vT) - dt; if (AXS.vT > 0) return; AXS.vT = 45 + Math.random() * 45;
  try { const g = G(), t = g.stageLine && g.stageLine(); if (t) g.vo(t, 'narrador', { queue: 1 }); } catch (e) {}
}
function agiMul() { return 1 + atr('agi') * .06; }
function lvlNow() { const g = G(); return g.level ? g.level() : 1; }
const ATTR_PER_LV = 10, ATTR_MAX = 50, LV_MAX = 75;
// botón de atributos en la barra de nivel, con globito de puntos sin repartir
function attrSync() {
  try { const row = document.querySelector('#mapView .hud-row'); if (!row) return; let b = document.getElementById('hudAttr'); const kid = G().branch !== 'ados';
    if (!b) { b = document.createElement('button'); b.id = 'hudAttr'; b.className = 'hud-attr'; b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="currentColor"/></svg><i class="hud-badge" hidden></i>'; const t = document.getElementById('hudTitle'); row.insertBefore(b, t ? t.nextSibling : null); b.onclick = attrOpen; }
    const n = ptsFree(); b.setAttribute('aria-label', (kid ? 'Mis fuerzas' : 'Atributos') + (n ? ` · ${n} puntos para repartir` : '')); b.title = b.getAttribute('aria-label'); const i = b.querySelector('.hud-badge'); i.hidden = !n; i.textContent = n > 99 ? '99+' : n; b.classList.toggle('pulse', n > 0);
  } catch (e) {}
}
async function attrOpen() { try { if (document.getElementById('view3d').hidden) await show3d(true); } catch (e) {} if (S) setTimeout(() => openBag('at'), 200); }
function ptsFree() { const a = atP(); return Math.max(0, (Math.min(LV_MAX, lvlNow()) - 1) * ATTR_PER_LV - (a.spent || 0)); }
function humHalo() { const g = new THREE.Group(), r = new THREE.Mesh(new THREE.TorusGeometry(.32, .025, 8, 32), new THREE.MeshBasicMaterial({ color: '#FFD25E', transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })); r.rotation.x = Math.PI / 2; r.position.y = 2.15; g.add(r); g.name = 'humHalo'; return g; }
function svXP(n) { const p = G().P(); p.bonus = (p.bonus || 0) + Math.round(n * (S && S.hx ? 1 + [0, .05, .05, .1, .1, .15][ft('ale')] + atr('sab') * .2 : 1 + atr('sab') * .2)); }
function svAdd(k, n) { const s = svP(); s.inv[k] = Math.max(0, (s.inv[k] || 0) + n); }
function svHas(need) { const s = svP(); return Object.entries(need).every(([k, n]) => (s.inv[k] || 0) >= n); }
function svPay(need) { Object.entries(need).forEach(([k, n]) => svAdd(k, -n)); }
function svTool(t) { return svP().tools.includes(t); }
function svToast(t) { G().toast(t); }
function svGiveTool(t, why) {
  const s = svP(); if (s.tools.includes(t)) return false; s.tools.push(t); G().save();
  const el = document.getElementById('v3pop'); if (el) { el.innerHTML = `<span class="ic sv-ic">${TOOLS[t][1]}</span><span class="tx"><small>${esc(why)}</small><b>${esc(TOOLS[t][0])}</b><em class="gp-tip">${esc(TOOLS[t][2])}</em></span>`; el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(pop.t); pop.t = setTimeout(() => { el.classList.remove('on'); el.hidden = true; }, 4200); }
  svUI(); return true;
}
function svMissionReward(d) {
  if (!svOn()) return; { const cash = 5 + (servV() >= 8 ? 5 : 0); svAdd('money', cash); servAdd((d && d.serv) || 1); svToast('🪙 +' + cash + ' denarios · Tu Servicio creció a ' + atP().serv + '.'); } const s = svP(), t = TOOL_ORDER.find(x => !s.tools.includes(x)); if (t) svGiveTool(t, 'Recompensa de la misión');
  const g = atr('gen'); if (g > 0) { svAdd('fruit', 1 + Math.floor(g / 2)); svAdd('wood', g); svToast('Por tu generosidad te regalaron ' + (1 + Math.floor(g / 2)) + ' granadas y ' + g + ' de madera.'); G().save(); svUI(); }
}

/* ---------- el mundo: árboles talables, rocas, granados, herramientas flotando ---------- */
let M4z0 = null; const M4zero = () => M4z0 || (M4z0 = new THREE.Matrix4().makeScale(0, 0, 0));
function svBuild(scene, W) {
  const R = rng(313), st = { felled: new Map(), mined: new Map(), fruitT: [], picks: [], fires: [], bag: null };
  S.sv = st; const yAt = (x, z) => W.hAt(x, z);
  // granados (frutales) cerca del camino
  const trees = []; for (let i = 0; i < 260 && trees.length < 90; i++) { const p = S.allPts[Math.floor(R() * S.allPts.length)], a = R() * 6.28, r = 4 + R() * 9, x = p[0] + Math.cos(a) * r, z = p[1] + Math.sin(a) * r; if (W.dAt(x, z) < 3.2 || blockedAt(x, z) || trees.some(q => (q.x - x) ** 2 + (q.z - z) ** 2 < 36)) continue; trees.push({ x, z, y: yAt(x, z), s: .85 + R() * .3, n: 5, t: 0 }); }
  const TR = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .17, 1.4, 6), new THREE.MeshStandardMaterial({ color: '#6A5038', roughness: 1 }), trees.length);
  const CN = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#4E7A34', roughness: .9, map: texL('leaves.jpg', 4) }), trees.length);
  const FR = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshStandardMaterial({ color: '#C0392B', roughness: .45, emissive: '#5A0E08', emissiveIntensity: .35 }), trees.length * 5);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  trees.forEach((o, i) => { m4.compose(v.set(o.x, o.y + .7 * o.s, o.z), q.identity(), sc.set(o.s, o.s, o.s)); TR.setMatrixAt(i, m4); m4.compose(v.set(o.x, o.y + 1.85 * o.s, o.z), q.identity(), sc.set(1.05 * o.s, .8 * o.s, 1.05 * o.s)); CN.setMatrixAt(i, m4);
    o.fm = []; for (let k = 0; k < 5; k++) { const an = k / 5 * 6.28 + i, fm = new THREE.Matrix4().compose(v.set(o.x + Math.cos(an) * .85 * o.s, o.y + (1.55 + (k % 2) * .4) * o.s, o.z + Math.sin(an) * .85 * o.s), q.identity(), sc.set(1, 1, 1)); o.fm.push(fm); FR.setMatrixAt(i * 5 + k, fm); } });
  [TR, CN, FR].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; scene.add(m); });
  st.fruit = { trees, FR };
  // herramientas flotando en lugares de la época (si todavía no las tenés)
  const spot = (k, dx, dz) => { const p = (S.pois || []).find(q => q.k === k); return p ? [p.x + dx * p.side, p.z + dz] : null; };
  const start = S.allPts[0] || [0, 0];
  [['flint', [start[0] + 4, start[1] - 10]], ['axe', spot('taller', -10, 3)], ['rod', spot('lake', -30, 14)], ['net', spot('lake', -34, -10)], ['pick', spot('temple', -14, 8)]].forEach(([t, at]) => {
    if (!at || svTool(t)) return; const g = new THREE.Group(), el = textSprite(TOOLS[t][1] + ' ' + TOOLS[t][0], true); el.position.y = 1.6; el.scale.multiplyScalar(.7); g.add(el); g.add(svToolMesh(t));
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.08, .5, 7, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#FFD25E', transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.y = 3.4; g.add(beam);
    g.position.set(at[0], yAt(at[0], at[1]), at[1]); g.userData = { t, y: yAt(at[0], at[1]) }; scene.add(g); st.picks.push(g); });
  // luz reutilizable para la fogata (se crea una vez para no recompilar sombreadores)
  st.fl = new THREE.PointLight('#FF9A3C', 0, 10, 1.6); scene.add(st.fl);
  // tu casa, si ya la construiste
  const s = svP(); if (s.house) svPlaceHouse(scene, s.house, true);
  if (s.bag && s.bag.left > 0) svDropBag(s.bag, true);
  try { econBuild(scene, W); } catch (e) { console.warn('econ', e); } try { vilBuild(scene, W).then(() => secBuild(scene, W)).then(() => matBuild(scene, W)).catch(e => console.warn('sec', e)); } catch (e) { console.warn('vil', e); }
  svUI();
}
function svToolMesh(t) {
  const g = new THREE.Group(), W2 = tm('wd', '#7A5A3A'), MT = tm('met', '#9AA0AA', { metalness: .6, roughness: .35 });
  if (t === 'axe' || t === 'pick') { cy(.035, .035, .9, W2, 0, .45, 0, g); const h = bx(t === 'axe' ? .32 : .6, .12, .06, MT, t === 'axe' ? .12 : 0, .86, 0, g); if (t === 'pick') h.rotation.z = .12; }
  else if (t === 'rod') { const r = cy(.02, .03, 1.6, W2, 0, .8, 0, g); r.rotation.z = .35; }
  else if (t === 'net') { const n = new THREE.Mesh(new THREE.TorusGeometry(.35, .03, 6, 16), tm('rope', '#C9B48A')); n.position.y = .6; g.add(n); const m = new THREE.Mesh(new THREE.CircleGeometry(.34, 12), new THREE.MeshStandardMaterial({ color: '#C9B48A', wireframe: true })); m.position.y = .6; g.add(m); }
  else { const f = new THREE.Mesh(new THREE.DodecahedronGeometry(.18, 0), tm('flint', '#3A3A42')); f.position.y = .5; g.add(f); }
  g.position.y = .3; return g;
}

/* ---------- qué hay cerca para hacer ---------- */
function svNear() {
  if (!svOn() || !S.sv) return null; const a = S.av.position, st = S.sv, s = svP(), d2 = (x, z) => (x - a.x) ** 2 + (z - a.z) ** 2;
  if (st.fishing) return { k: 'fishing' };
  { const v = vilNearNpc(); if (v) return { k: 'vil', v, label: vilLabel(v) }; }
  { const e = secNear(); if (e) return { k: 'sec', e, label: secP().secrets[e.d.id] ? 'Ver el lugar secreto' : SEC.mod.ENTRY[e.d.entry][0] }; }
  { const m = matNear(); if (m) return m; }
  for (const b of (st.beggars || [])) if (d2(b.x, b.z) < 6) return { k: 'beg', b, label: 'Ayudar' };
  for (const m of (st.stalls || [])) if (d2(m.x, m.z) < 9) return { k: 'shop', shop: 'mercado', label: 'Comprar y vender' };
  if (S.inRoom && SHOPS[S.inRoom.trade]) return { k: 'shop', shop: S.inRoom.trade, label: 'Comprar y vender' };
  if (st.bag && d2(st.bag.x, st.bag.z) < 4) return { k: 'bag', label: 'Recoger tus cosas' };
  const fire = svFireNear(); if (fire && (s.inv.fish || 0) > 0) return { k: 'cook', label: 'Cocinar pescado', fire };
  if (fire && fire.lit !== false && MAT.mod) return { k: 'reflex', label: 'Sentarte junto al fuego', fire };
  let best = null, bd = 2.6 * 2.6;
  st.fruit.trees.forEach((o, i) => { const d = d2(o.x, o.z); if (d < bd && o.n > 0) { bd = d; best = { k: 'fruit', i, label: 'Recoger granadas' }; } });
  (FLORA.olive || []).forEach((o, i) => { if (st.felled.has(i)) return; const d = d2(o.x, o.z); if (d < bd) { bd = d; best = { k: 'tree', i, label: svTool('axe') ? 'Talar' : 'Necesitás un hacha', need: !svTool('axe') }; } });
  (FLORA.rock || []).forEach((o, i) => { if (st.mined.has(i)) return; const r = .6 + (.35 + o.v * .7) * o.s, d = d2(o.x, o.z); if (d < (r + 1.4) ** 2 && d < bd + 2) { bd = d; best = { k: 'rock', i, label: svTool('pick') ? 'Picar piedra' : 'Necesitás un pico', need: !svTool('pick') }; } });
  if (best) return best;
  if (svWaterNear()) return { k: 'fish', label: svTool('rod') ? 'Pescar con caña' : svTool('net') ? 'Tirar la red' : 'Necesitás caña o red', need: !svTool('rod') && !svTool('net') };
  return null;
}
function svWaterNear() {
  const a = S.av.position; for (const p of (S.pois || [])) {
    if (p.k === 'lake') { const d = Math.hypot(a.x - p.x, a.z - p.z); if (d > 24 && d < 38) return true; }
    if (p.k === 'shore') { const d = Math.hypot(a.x - (p.x + p.side * 7), a.z - p.z); if (d < 11.5) return true; }
    if (p.k === 'river') for (const q of p.pts) if ((q[0] - a.x) ** 2 + (q[1] - a.z) ** 2 < 26) return true;
  } return false;
}
function svFireNear() {
  const a = S.av.position, st = S.sv; const f = st.fires.find(f => (f.x - a.x) ** 2 + (f.z - a.z) ** 2 < 9); if (f) return f;
  const s = svP(); if (s.house && s.furn.includes('horno') && S.sv.oven) { const o = S.sv.oven; if ((o.x - a.x) ** 2 + (o.z - a.z) ** 2 < 6) return o; } return null;
}

/* ---------- acciones ---------- */
function svSwing(k) { if (k === 'rock') { S.toolK = 'pick'; S.toolT = 1.6; h3do(['M_Digging', 'Interact'], 1.5, .9); } else { S.toolK = 'axe'; S.toolT = 1.3; S.chopT = S.chopD = .85; h3do(['M_Idle', 'Idle_Loop'], .95); } try { const A = svSwing.A = svSwing.A || new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), g = A.createGain(); o.type = 'square'; o.frequency.value = 140 + Math.random() * 40; g.gain.setValueAtTime(.08, A.currentTime); g.gain.exponentialRampToValueAtTime(.0001, A.currentTime + .12); o.connect(g); g.connect(A.destination); o.start(); o.stop(A.currentTime + .13); } catch (e) {} }
function svHide(im, i, on) { im.getMatrixAt(i, svHide.m = svHide.m || new THREE.Matrix4()); if (!on) { svHide.store.set(im.uuid + i, svHide.m.clone()); im.setMatrixAt(i, M4zero()); } else { const m = svHide.store.get(im.uuid + i); if (m) im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; }
svHide.store = new Map();
function svAct() {
  if (!svOn() || !S.sv || S.walking || sheetUp() || S.down) return; const n = svNear(), s = svP(), st = S.sv; wake();
  if (!n) { svToast('No hay nada para hacer acá. Buscá árboles, rocas, granados o agua.'); return; }
  if (n.need) { svToast(n.label + '. Las herramientas se consiguen en misiones o brillando en el mapa.'); return; }
  if (n.k === 'fishing') { svFishTap(); return; }
  if (n.k === 'vil') { vilAct(n.v); return; }
  if (n.k === 'sec') { secOpen(n.e); return; }
  if (n.k === 'mato') { matObj(n.e); return; }
  if (n.k === 'matp') { matTalk(n.e); return; }
  if (n.k === 'mateo') { matTeo(n.e); return; }
  if (n.k === 'mates') { escAct(n.e); if (n.e.lb) n.e.lb.visible = false; return; }
  if (n.k === 'matg') { pergOpen(n.e); return; }
  if (n.k === 'matv') { memOpen(n.e); return; }
  if (n.k === 'matj') { jueOpen(n.e); return; }
  if (n.k === 'matn') { senOpen(n.e); return; }
  if (n.k === 'mat7') { sieteOpen(); return; }
  if (n.k === 'reflex') { matReflex(); return; }
  if (n.k === 'shop') { svShop(n.shop); return; }
  if (n.k === 'beg') { svGive(n.b); return; }
  if (n.k === 'bag') { svPickBag(); return; }
  if (n.k === 'fruit') { const o = st.fruit.trees[n.i], c = o.n; for (let k = 0; k < 5; k++) st.fruit.FR.setMatrixAt(n.i * 5 + k, M4zero()); st.fruit.FR.instanceMatrix.needsUpdate = true; o.n = 0; o.t = SV.FRUIT; h3do([['M_Pick_Fruit', 'M_Pick_Fruit_1', 'M_Pick_Fruit_2'][Math.floor(Math.random() * 3)], 'PickUp_Table'], 2.4, .4); svAdd('fruit', c); svXP(1); axGain('dom', 1); G().save(); svToast('🍎 Recogiste ' + c + ' granadas.'); svUI(); return; }
  if (n.k === 'tree' || n.k === 'rock') { const key = n.k + n.i; st.hits = st.hitKey === key ? st.hits + 1 : 1; st.hitKey = key; svSwing(n.k); const need = Math.max(2, 5 - Math.floor(atr('fue') / 1.5)); axGain('fue', 1); AXS.workT = 6;
    if (st.hits < need) { svToast((n.k === 'tree' ? '🪓 ' : '⛏️ ') + 'Golpe ' + st.hits + ' de ' + need); return; } st.hits = 0;
    if (n.k === 'tree') { svHide(FLORA.oT, n.i, false); for (let j = 0; j < 6; j++) svHide(FLORA.oB, n.i * 6 + j, false); st.felled.set(n.i, SV.TREE); const w = 2 + (atr('fue') >= 3 ? 1 : 0); svAdd('wood', w); svXP(2); svToast('🪵 Conseguiste ' + w + ' de madera. El árbol vuelve a crecer en unos minutos.'); }
    else { svHide(FLORA.rI, n.i, false); st.mined.set(n.i, SV.ROCK); svAdd('stone', 2); svXP(2); svToast('🪨 Conseguiste 2 piedras.'); }
    G().save(); svUI(); return; }
  if (n.k === 'cook') { h3do(['M_Kneeling_Idle', 'PickUp_Table'], 2.6); try { fireSpit(n.fire, 3.2); } catch (e) {} const k = s.inv.fish; svAdd('fish', -k); svAdd('cooked', k); svXP(k); G().save(); svToast('🍢 Cocinaste ' + k + (k > 1 ? ' pescados.' : ' pescado.') + ' Ya se pueden comer (tecla C o el botón de comer).'); svUI(); return; }
  if (n.k === 'fish') { if (svTool('rod')) { st.fishing = S.hx ? { mode: 'rod', t: 0, bite: Math.max(1, (2 + Math.random() * 4) * [1, .9, .9, .8, .8, .8][ft('pac')]), win: 1.1 + (fv('pac') >= 20 ? .7 : 0) + fv('pac') * .01 } : { mode: 'rod', t: 0, bite: Math.max(1.2, 2 + Math.random() * 4 - atr('pac') * .35), win: 1.1 + atr('pac') * .15 }; svToast('🎣 Tiraste la caña. Cuando pique, tocá la acción (E).'); }
    else { st.fishing = { mode: 'net', t: 0, bite: 5 - atr('pac') * .2 }; svToast('🕸️ Tiraste la red. Esperá un momento…'); } S.joy.x = 0; S.joy.y = 0; svUI(); }
}
function svFishTap() { const f = S.sv.fishing; if (!f || f.mode !== 'rod') return; if (f.t >= f.bite && f.t <= f.bite + f.win) { axGain('pac', 3); const n = 1 + (S.hx ? (fv('pac') >= 40 && Math.random() < .3 ? 1 : 0) : (Math.random() < atr('pac') * .06 ? 1 : 0)); svAdd('fish', n); if (S.hx && fv('pac') >= 50 && Math.random() < .15) { svAdd('money', 3); svToast('✨ ¡Un pez raro! Lo vendiste por 3 denarios.'); } S.catchT = 1.6; h3do(['M_Fishing_Idle', 'M_Holding_Idle'], 1.6); svXP(2); G().save(); svToast('🐟 ¡Sacaste ' + (n > 1 ? 'dos peces!' : 'un pez!') + ' Cocinalo en una fogata antes de comerlo.'); } else svToast('Muy rápido. Esperá a que pique.'); S.sv.fishing = null; svUI(); }
function svEat() {
  if (!svOn() || S.down) return; const s = svP(), k = (s.inv.cooked || 0) > 0 ? 'cooked' : (s.inv.bread || 0) > 0 ? 'bread' : (s.inv.fruit || 0) > 0 ? 'fruit' : null;
  if (!k) { svToast((s.inv.fish || 0) > 0 ? 'El pescado crudo hay que cocinarlo primero en una fogata.' : 'No tenés comida. Buscá granados o pescá.'); return; }
  h3do(['M_Drinking', 'PickUp_Table'], 2.4, .6, 1.2); svAdd(k, -1); s.sat = Math.min(SV.FULL, s.sat + FOOD[k] * (S.hx && fv('dom') >= 20 ? 1.25 : 1)); s.warned = 0; G().save(); if (humV() >= 1 && MP.code) xSend({ k: 'share', by: meInfo().name, x: S.av.position.x, z: S.av.position.z }); svToast(k === 'cooked' ? '🍢 Comiste pescado asado. ¡Recuperaste fuerzas!' : k === 'bread' ? '🥖 Comiste pan.' : '🍎 Comiste una granada.'); svUI();
}

/* ---------- fabricar y construir ---------- */
function svCraft() {
  if (!svOn() || S.down) return; const el = document.getElementById('v3sheet'); if (!el) return; S.joy.x = 0; S.joy.y = 0; const s = svP();
  const draw = () => {
    const have = Object.entries(RES).map(([k, [n, i]]) => `<span class="sv-chip">${i} ${s.inv[k] || 0}</span>`).join('');
    const rows = RECIPES.filter(r => !r.furn || s.house).map(r => { const done = r.furn && s.furn.includes(r.id), built = r.id === 'house' && s.house, can = !done && !built && svHas(r.need) && (!r.tool || svTool(r.tool));
      const need = Object.entries(r.need).filter(([, n]) => n > 0).map(([k, n]) => `<i class="${(s.inv[k] || 0) >= n ? 'ok' : ''}">${RES[k][1]} ${n}</i>`).join(' ') + (r.tool ? ` <i class="${svTool(r.tool) ? 'ok' : ''}">${TOOLS[r.tool][1]} ${TOOLS[r.tool][0]}</i>` : '');
      return `<div class="sv-rec${can ? '' : ' off'}"><div><b>${esc(r.name)}</b><small>${esc(r.desc)}</small><span class="sv-need">${need}</span></div><button data-r="${r.id}" ${can ? '' : 'disabled'}>${done || built ? 'Hecho' : r.place || r.furn ? 'Construir' : 'Fabricar'}</button></div>`; }).join('');
    el.innerHTML = `<div class="inv hx sv-sheet"><div class="inv-h"><b>Fabricar y construir</b><button class="bag-x" aria-label="Cerrar">✕</button></div><div class="sv-have">${have}</div><p class="sv-tip">Talá árboles y picá piedras. Con la madera hacé tablones y con la piedra, bloques. Con eso construís tu casa y después los muebles.</p>${rows}${s.house ? '' : '<p class="sv-tip">Cuando tengas tu casa, vas a poder hacer muebles: cama, mesa, banco, horno, cofre y lámpara.</p>'}</div>`;
    el.querySelector('.bag-x').onclick = () => { el.hidden = true; };
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const r = RECIPES.find(x => x.id === b.dataset.r); if (!svHas(r.need)) return;
      if (r.place === 'fire') { svPay(r.need); S.toolK = 'flint'; S.toolT = 2.2; h3do(['M_Kneeling_Idle', 'PickUp_Table'], 2.6); svFire(undefined, undefined, true); el.hidden = true; }
      else if (r.place === 'house') { const spot = svHouseSpot(); if (!spot) { svToast('Acá no se puede construir. Alejate del camino y de otras construcciones.'); return; } svPay(r.need); s.house = spot; svPlaceHouse(S.scene, spot); h3do(['M_Lifting_Object', 'PickUp_Table'], 3, .8, 1.2); svXP(30); svToast('🏠 ¡Construiste tu casa! Ahora podés hacerle muebles.'); el.hidden = true; }
      else if (r.furn) { svPay(r.need); s.furn.push(r.id); svFurnish(r.id); h3do(['M_Box_Idle', 'PickUp_Table'], 2); svXP(8); svToast('Agregaste: ' + r.name + '.'); draw(); }
      else { Object.entries(r.out).forEach(([k, n]) => svAdd(k, n)); svPay(r.need); h3do(['M_Pull_Heavy_Object', 'Interact'], 1.4); svXP(1); draw(); }
      G().save(); svUI(); });
  };
  el.hidden = false; el.onclick = e => { if (e.target === el) el.hidden = true; }; draw();
}
function svFire(x, z, slow) {
  const a = S.av.position; x = x ?? a.x + Math.sin(S.yaw) * 1.6; z = z ?? a.z + Math.cos(S.yaw) * 1.6; const y = S.W.hAt(x, z), g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const l = cy(.06, .07, .8, tm('wd', '#6A4A2E'), 0, .1, 0, g); l.rotation.z = Math.PI / 2 - .25; l.rotation.y = i / 5 * 6.28; }
  { const old = new THREE.Group(); for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.12, 0), tm('st', '#8C8374')); r.position.set(Math.cos(i / 8 * 6.28) * .5, .06, Math.sin(i / 8 * 6.28) * .5); old.add(r); } g.add(old); phOne('stone_fire_pit', g, 0, -.03, 0, 0, .55, { done: () => { old.visible = false; } }); }
  const fl = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 8), new THREE.MeshBasicMaterial({ color: '#FFB347', transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.y = .4; g.add(fl);
  g.position.set(x, y, z); S.scene.add(g); const f = { x, z, y, g, fl, left: SV.FIRE }; S.sv.fires.push(f); const lite = () => { if (!g.parent) return; if (AMB.ready) { f.amb = ambFire(x, y + .25, z, .7); fl.visible = false; } else fl.visible = true; f.lit = true; };
  if (slow) { fl.visible = false; [.35, .8, 1.25].forEach(d => setTimeout(() => fireSparks(x, y + .14, z, 14), d * 1000)); setTimeout(lite, 1550); } else lite(); svXP(2); svToast('🔥 Encendiste una fogata. Acercate con pescado crudo para cocinarlo.'); if (S.hx) setTimeout(fireTalk, 5000);
}
function svHouseSpot() {
  const a = S.av.position; if (!S.W) return null; const ok = (x, z) => { if (Math.abs(x) > XB - 6) return false; for (let u = -4.5; u <= 4.5; u += 1.5) for (let v = -4.5; v <= 4.5; v += 1.5) { if (blockedAt(x + u, z + v) || S.W.dAt(x + u, z + v) < 1.6) return false; } return Math.abs(S.W.hAt(x - 3, z - 3) - S.W.hAt(x + 3, z + 3)) < 1.6; };
  for (const dd of [6, 8, 10, 12]) for (let k = 0; k < 12; k++) { const an = S.yaw + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * .5, x = a.x + Math.sin(an) * dd, z = a.z + Math.cos(an) * dd; if (ok(x, z)) { const rot = Math.round(Math.atan2(a.x - x, a.z - z) / (Math.PI / 2)) * (Math.PI / 2); return { x, z, rot }; } }
  return null;
}
function svPlaceHouse(scene, h, silent) {
  const H = bigHouse('mia', true), y = Math.max(S.W.hAt(h.x, h.z), S.W.hAt(h.x - 3, h.z - 3), S.W.hAt(h.x + 3, h.z + 3)) - .02; placeHouse(scene, H, h.x, h.z, h.rot, y);
  const lb = textSprite('Casa de ' + (G().P().name || 'tu familia'), true); lb.position.set(0, 4.8, 0); H.g.add(lb); S.sv.house = H; S.sv.houseY = y;
  svP().furn.forEach(id => svFurnish(id, true));
}
const FURN_AT = { cama: [-2.3, -1.6, 0], mesa: [.9, -.6, 0], banco: [.9, .5, 0], horno: [2.6, -1.9, 0], cofre: [-2.6, 1.6, 0], lampara: [0, -2.6, 0] };
function svFurnish(id, silent) {
  const H = S.sv && S.sv.house; if (!H) return; const g = new THREE.Group(), [fx, fz] = FURN_AT[id], WD = WOOD(), WL = WOODL();
  if (id === 'cama') { bx(1.0, .3, 2.0, WD, 0, .15, 0, g); bx(.9, .14, 1.85, tm('mat', '#E8DDC6'), 0, .36, 0, g); bx(.7, .12, .4, tm('pil', '#C9B48A'), 0, .48, -.7, g); bx(.92, .06, 1.1, tm('wool', '#8E2E22'), 0, .45, .3, g); }
  if (id === 'mesa') { bx(1.4, .08, .8, WL, 0, .72, 0, g); [[-.6, -.32], [.6, -.32], [-.6, .32], [.6, .32]].forEach(([a, b]) => bx(.07, .72, .07, WD, a, .36, b, g)); jar(g, -.3, 0, .76, '#B4704A', .7); const br = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), tm('pan', '#D9A25A')); br.scale.y = .5; br.position.set(.3, .8, 0); g.add(br); }
  if (id === 'banco') { bx(1.3, .07, .32, WL, 0, .42, 0, g); [-.55, .55].forEach(a => bx(.08, .42, .28, WD, a, .21, 0, g)); [-1.05, 1.05].forEach(a => phOne('wooden_stool_02', g, a, 0, .1, a, 2.2)); }
  if (id === 'horno') { const o = new THREE.Mesh(new THREE.SphereGeometry(.7, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), tm('clay', '#A8784A')); o.scale.y = 1.2; g.add(o); bx(.4, .35, .1, tm('ash', '#2A1A12'), 0, .25, .66, g); const fl = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), tm('fire', '#FF8A3A', { emissive: '#FFB347', emissiveIntensity: 3 })); fl.position.set(0, .2, .55); g.add(fl); }
  if (id === 'cofre') { const old = new THREE.Group(); bx(.9, .5, .55, WD, 0, .25, 0, old); bx(.92, .1, .57, WL, 0, .52, 0, old); bx(.12, .14, .04, tm('gold2', '#C9A04A', { metalness: .7, roughness: .35 }), 0, .42, .29, old); g.add(old); phOne('treasure_chest', g, 0, 0, 0, 0, .95, { done: () => { old.visible = false; } }); }
  if (id === 'lampara') { phOne('Lantern_01', g, .18, 1.33, 0, 0, 1.3); const l = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), tm('lmp', '#FFD27A', { emissive: '#FFB347', emissiveIntensity: 3 })); l.position.set(0, 1.4, 0); g.add(l); bx(.3, .06, .2, tm('clay', '#A8784A'), 0, 1.3, 0, g); cy(.03, .03, 1.3, WD, 0, .65, 0, g); }
  if (id === 'mesa') { phOne('wooden_candlestick', g, .45, .76, -.15, 0, 1.3); phOne('wooden_bowl_02', g, .1, .76, .18, 0, 1.6); phOne('wooden_cutting_board', g, -.1, .76, -.2, .3, 1); }
  if (id === 'horno') phOne('wooden_bucket_02', g, 1.1, 0, .2, 0, .8);
  g.position.set(fx, 0, fz); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); H.g.add(g);
  if (id === 'horno') { const w = new THREE.Vector3(); H.g.updateMatrixWorld(true); g.getWorldPosition(w); S.sv.oven = { x: w.x, z: w.z }; }
  if (id === 'cama') { const w = new THREE.Vector3(); H.g.updateMatrixWorld(true); g.getWorldPosition(w); S.sv.bed = { x: w.x, z: w.z + 0 }; }
}

/* ---------- hambre, desmayo y la bolsa en el piso ---------- */
function svTickHunger(dt) {
  const s = svP(); if (S.down) return; s.play += dt; const drain = S.hx ? 1 - [0, .1, .1, .2, .2, .35][ft('dom')] : 1 - Math.min(.6, atr('dom') * .07); s.sat -= dt * drain;
  if (s.sat <= SV.WARN && (!s.warned || s.play - s.warned > 120)) { s.warned = s.play; svToast('🍞 Tenés hambre. Necesitás comer pronto: frutos de los granados o pescado asado.'); }
  if (s.sat <= 0) svFaint();
}
function svFaint() {
  // la bolsa queda donde caíste (2 min; Control propio 40+ suma 1 min). Con Amor 50+ alguien que ayudaste la cuida y no desaparece.
  const s = svP(), p = G().P(), gs = gearState(); S.down = 1; S.pose = null; S.joy.x = 0; S.joy.y = 0;
  const keep = new Set(gs.own.filter(id => GBY[id] && GBY[id].r === 'u')), prot = Math.floor(humV() / 5); gs.own.map(id => GBY[id]).filter(x => x && x.r !== 'u').sort((a, b) => 'lerc'.indexOf(a.r) - 'lerc'.indexOf(b.r)).slice(0, prot).forEach(x => keep.add(x.id));
  const guard = S.hx && fv('amor') >= 50, secs = SV.BAG + (S.hx && fv('dom') >= 40 ? 60 : 0);
  const bag = { x: S.av.position.x, z: S.av.position.z, left: secs, guard, inv: { ...s.inv }, tools: s.tools.slice(), own: gs.own.filter(id => !keep.has(id)), eq: Object.fromEntries(Object.entries(gs.eq).filter(([, id]) => !keep.has(id))) };
  s.inv = {}; s.tools = []; gs.own = [...keep]; gs.eq = Object.fromEntries(Object.entries(gs.eq).filter(([, id]) => keep.has(id))); s.bag = bag; s.sat = 20 * 60; s.warned = 0; G().save(); reLook && reLook();
  const mm = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  const el = document.getElementById('v3sheet'); el.innerHTML = `<div class="inv hx sv-faint"><h3>Sin alimento, ${esc(p.name || 'tu personaje')} no pudo seguir el camino.</h3><p>Se quedó sin fuerzas y cayó al suelo. La bolsa con todo lo que llevaba quedó en ese lugar. Vas a despertar en el punto de partida: <b>la bolsa está marcada en el mapa y en la brújula</b>.</p>${guard ? `<p class="sv-lost">🤝 Alguien que ayudaste se quedó cuidando tu bolsa: no se va a perder, pero tenés que ir a buscarla.</p>` : `<p class="sv-lost">Si no la encontrás en <b>${mm}</b>, perdés todo lo que tenía.</p>`}<p class="sv-verse">Un buen samaritano te ayudó a levantarte y te dio algo de comer. Desde ahora, no te olvides de alimentarte.</p><button class="sv-up">Levantarme</button></div>`;
  el.hidden = false; el.onclick = null; svDropBag(bag); svUI();
  el.querySelector('.sv-up').onclick = () => { el.hidden = true; S.down = 0; h3do(['M_Standing_Up'], 4, 0, 1.6); const sp = S.spawn; if (sp) { S.av.position.x = sp[0]; S.av.position.z = sp[1]; } svToast(guard ? '🎒 Tu bolsa te espera donde caíste. Seguí la brújula.' : '🎒 ¡Corré a buscar tu bolsa! Seguí la brújula.'); svUI(); };
}
function svDropBag(bag, silent) {
  const y = S.W.hAt(bag.x, bag.z), g = new THREE.Group(), cm = tm('sack', '#8A6A44'); const b = new THREE.Mesh(new THREE.SphereGeometry(.35, 14, 10), cm); b.scale.set(1.1, .8, 1); b.position.y = .28; g.add(b); const k = new THREE.Mesh(new THREE.ConeGeometry(.12, .25, 8), cm); k.position.y = .62; g.add(k);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.1, .6, 9, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#FF6A4A', transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.y = 4.5; g.add(beam);
  g.position.set(bag.x, y, bag.z); S.scene.add(g); S.sv.bag = { ...bag, g };
}

// contador visible de la bolsa en el piso
function bagTimer() {
  const s = svP(), b = s && s.bag; let el = document.getElementById('v3bagt');
  if (!b || !S.sv || !S.sv.bag) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'v3bagt'; el.className = 'v3bagt'; el.onclick = () => openMap(); document.body.appendChild(el); }
  const a = S.av.position, d = Math.round(Math.hypot(b.x - a.x, b.z - a.z)), L = Math.max(0, Math.ceil(b.left)), mm = Math.floor(L / 60) + ':' + String(L % 60).padStart(2, '0');
  const txt = b.guard ? `🎒 Tu bolsa está a ${d} m · la cuidan por vos` : `🎒 Si no la encontrás en ${mm} perdés todo · ${d} m`;
  if (el.textContent !== txt) el.textContent = txt; el.hidden = false; el.classList.toggle('urg', !b.guard && L <= 30);
}
function svPickBag() {
  h3do(['M_Picking_Up', 'PickUp_Table'], 2.4, .8, 1.3); const s = svP(), b = s.bag, gs = gearState(); if (!b) return; Object.entries(b.inv).forEach(([k, n]) => svAdd(k, n)); b.tools.forEach(t => { if (!s.tools.includes(t)) s.tools.push(t); });
  b.own.forEach(id => { if (!gs.own.includes(id)) gs.own.push(id); }); Object.assign(gs.eq, b.eq); s.bag = null; if (S.sv.bag) S.scene.remove(S.sv.bag.g); S.sv.bag = null; G().save(); reLook && reLook(); svToast('🎒 ¡Recuperaste tus cosas!'); svUI(); bagTimer();
}

/* ---------- tick ---------- */
function survTick(dt, t) {
  if (!svOn() || !S.sv) return; const st = S.sv, s = svP();
  svTickHunger(dt);
  if (humV() >= 10 && !S.av.getObjectByName('humHalo')) S.av.add(humHalo());
  S.talk = !!document.querySelector('#v3sheet:not([hidden]) .mis-in');
  // gris por hambre
  const gray = s.sat < SV.WARN ? Math.min(.9, (1 - s.sat / SV.WARN) * .9 + .15) : 0; if (Math.abs((st.gray || 0) - gray) > .01) { st.gray = gray; S.cv.style.filter = gray ? `grayscale(${gray}) brightness(${1 - gray * .25})` : ''; }
  // caído
  const tgt = S.down && !(S.av.userData.h3 && H3.clips.Death01) ? -1.45 : 0; S.av.rotation.x += (tgt - S.av.rotation.x) * Math.min(1, dt * 4);
  // regenerar árboles, rocas y frutos
  for (const [i, left] of st.felled) { if (left - dt <= 0) { st.felled.delete(i); svHide(FLORA.oT, i, true); for (let j = 0; j < 6; j++) svHide(FLORA.oB, i * 6 + j, true); } else st.felled.set(i, left - dt); }
  for (const [i, left] of st.mined) { if (left - dt <= 0) { st.mined.delete(i); svHide(FLORA.rI, i, true); } else st.mined.set(i, left - dt); }
  st.fruit.trees.forEach((o, i) => { if (o.n > 0) return; o.t -= dt; if (o.t <= 0) { o.n = 5; o.fm.forEach((m, k) => st.fruit.FR.setMatrixAt(i * 5 + k, m)); st.fruit.FR.instanceMatrix.needsUpdate = true; } });
  // fogatas
  let lit = null; st.fires = st.fires.filter(f => { f.left -= dt; f.fl.scale.set(1 + Math.sin(t * 13) * .12, 1 + Math.sin(t * 9 + 1) * .2, 1); if (f.left <= 0) { S.scene.remove(f.g); ambOff(f.amb); return false; } if (!lit || (f.x - S.av.position.x) ** 2 + (f.z - S.av.position.z) ** 2 < (lit.x - S.av.position.x) ** 2 + (lit.z - S.av.position.z) ** 2) lit = f; return true; });
  if (lit) { st.fl.position.set(lit.x, lit.y + 1, lit.z); st.fl.intensity = 5 + Math.sin(t * 17) * 1.2; } else st.fl.intensity = 0;
  // herramientas flotando
  st.picks = st.picks.filter(g => { g.children[1].rotation.y = t * 1.5; g.children[1].position.y = .3 + Math.sin(t * 2.3) * .12; if ((g.position.x - S.av.position.x) ** 2 + (g.position.z - S.av.position.z) ** 2 < 3) { svGiveTool(g.userData.t, 'Encontraste'); S.scene.remove(g); return false; } return true; });
  // bolsa en el piso
  if (st.bag) { st.bag.g.children[2].material.opacity = .22 + Math.sin(t * 3) * .1; if (!S.down && !s.bag.guard) { s.bag.left -= dt; if (s.bag.left <= 0) { S.scene.remove(st.bag.g); st.bag = null; s.bag = null; G().save(); svToast('No llegaste a tiempo: se perdió lo que tenías en la bolsa.'); } } } bagTimer();
  // pesca
  if (st.fishing) { const f = st.fishing; f.t += dt; const a = S.av.position; if (S.freeMoving) { st.fishing = null; svToast('Dejaste de pescar.'); }
    else if (f.mode === 'rod') { if (f.t >= f.bite && !f.cue) { f.cue = 1; svToast('🐟 ¡Pica! Tocá la acción (E) ahora.'); try { tone3d(); } catch (e) {} } if (f.t > f.bite + f.win + .2) { st.fishing = null; svToast('Se escapó el pez. Probá otra vez.'); } }
    else if (f.t >= f.bite) { const n = 1 + (Math.random() < .35 + atr('pac') * .05 ? 1 : 0); svAdd('fish', n); svXP(2); G().save(); st.fishing = null; axGain('pac', 2); svToast('🕸️ La red sacó ' + n + (n > 1 ? ' peces.' : ' pez.') + ' Cocinalo en una fogata.'); } }
  // interfaz cada medio segundo
  st.ui = (st.ui || 0) + dt; if (st.ui > .5) { st.ui = 0; svUI(); }
}
function svUI() {
  if (!svOn()) { const e = document.getElementById('v3surv'); if (e) e.hidden = true; return; }
  let el = document.getElementById('v3surv'); if (!el) { el = document.createElement('div'); el.id = 'v3surv'; el.className = 'v3surv';
    el.innerHTML = '<div class="sv-day"></div><div class="sv-day sv-money" title="Denarios"></div><div class="sv-food" title="Alimento"><i></i><span></span></div><button class="sv-do" data-a="do"><b>✋</b><span></span></button><button class="sv-btn" data-a="eat" title="Comer (C)">🍽️</button><button class="sv-btn" data-a="craft" title="Fabricar y construir (B)">🔨</button>';
    document.body.appendChild(el); { const b = el.querySelector('[data-a="do"]'); b.onpointerdown = e => { e.preventDefault(); axHold(true); }; b.onpointerup = b.onpointerleave = b.onpointercancel = () => axHold(false); } el.querySelector('[data-a="eat"]').onclick = svEat; el.querySelector('[data-a="craft"]').onclick = svCraft; }
  el.hidden = document.getElementById('view3d').hidden; const s = svP(), k = Math.max(0, s.sat) / SV.FULL, mins = Math.ceil(Math.max(0, s.sat) / 60);
  el.querySelector('.sv-day').textContent = 'Día ' + (Math.floor(s.play / SV.DAY) + 1); el.querySelector('.sv-money').textContent = '🪙 ' + (s.inv.money || 0);
  const fi = el.querySelector('.sv-food i'); fi.style.width = (k * 100).toFixed(1) + '%'; fi.className = s.sat < SV.WARN ? 'low' : ''; el.querySelector('.sv-food span').textContent = s.sat < SV.WARN ? '¡Comé algo! ' + mins + ' min' : '🍞 ' + mins + ' min';
  const n = S.sv && !S.down ? svNear() : null, b = el.querySelector('.sv-do'); b.hidden = !n; if (n) { b.querySelector('span').textContent = n.k === 'fishing' ? (S.sv.fishing.mode === 'rod' ? 'Tirar' : 'Esperando…') : n.label + ' (E)'; b.classList.toggle('need', !!n.need); }
}

/* ---------- mochila: trabajo y atributos ---------- */
function invSurv(body) {
  const s = svP(); const tools = TOOL_ORDER.map(t => `<div class="sv-tool${s.tools.includes(t) ? '' : ' off'}"><span>${TOOLS[t][1]}</span><b>${TOOLS[t][0]}</b><small>${s.tools.includes(t) ? TOOLS[t][2] : 'Todavía no la tenés'}</small></div>`).join('');
  const res = Object.entries(RES).map(([k, [n, i]]) => `<div class="sv-res"><span>${i}</span><b>${s.inv[k] || 0}</b><small>${n}</small></div>`).join('');
  body.innerHTML = `<div class="sv-inv"><h4>Herramientas</h4><div class="sv-tools">${tools}</div><h4>Materiales y comida</h4><div class="sv-ress">${res}</div>
    <div class="sv-row"><button data-a="eat">🍽️ Comer</button><button data-a="craft">🔨 Fabricar y construir</button></div>
    ${s.house && s.furn.includes('cofre') ? `<h4>Cofre de tu casa</h4><p class="sv-tip">Lo que está en el cofre no se pierde nunca. ${Object.entries(s.chest).filter(([, n]) => n).map(([k, n]) => RES[k][1] + ' ' + n).join(' · ') || 'Está vacío.'}</p><div class="sv-row"><button data-a="store">Guardar todo</button><button data-a="take">Sacar todo</button></div>` : ''}
    <p class="sv-tip">Día ${Math.floor(s.play / SV.DAY) + 1} de tu camino · Alimento para ${Math.ceil(Math.max(0, s.sat) / 60)} minutos de juego</p></div>`;
  const nearHome = () => { const h = s.house; if (!h) return false; const a = S.av.position; return (a.x - h.x) ** 2 + (a.z - h.z) ** 2 < 49; };
  body.querySelector('[data-a="eat"]').onclick = () => { svEat(); invSurv(body); }; body.querySelector('[data-a="craft"]').onclick = () => svCraft();
  const st = body.querySelector('[data-a="store"]'), tk = body.querySelector('[data-a="take"]');
  if (st) st.onclick = () => { if (!nearHome()) { svToast('Tenés que estar en tu casa para usar el cofre.'); return; } Object.entries(s.inv).forEach(([k, n]) => { s.chest[k] = (s.chest[k] || 0) + n; }); s.inv = {}; G().save(); invSurv(body); };
  if (tk) tk.onclick = () => { if (!nearHome()) { svToast('Tenés que estar en tu casa para usar el cofre.'); return; } Object.entries(s.chest).forEach(([k, n]) => svAdd(k, n)); s.chest = {}; G().save(); invSurv(body); };
}
function perksHtml(k) { const f = FRUITS.find(x => x[0] === k) || (k === 'sab' ? SABI : null); if (!f) return ''; const t = ft(k); return `<span class="sv-perk">${t ? `✓ ${esc(f[3][t - 1])}` : ''}${t < 5 ? `${t ? ' · ' : ''}Con ${(t + 1) * 10}: ${esc(f[3][t])}` : ''}</span>`; }
function invAttr(body) {
  const AP = invAttr.pend || (invAttr.pend = {}), pt = Object.values(AP).reduce((x, y) => x + y, 0);
  const a = atP(), free = ptsFree() - pt, lv = Math.min(LV_MAX, lvlNow()), h = a.hum || 0;
  let glowH = ''; if (S && S.hx) { const g = glowState(), gl = glowLv(g.pts), ga = 12 * gl * gl, gb = 12 * (gl + 1) * (gl + 1), pc = gl >= GLW.lvMax ? 100 : Math.round((g.pts - ga) / (gb - ga) * 100); glowH = `<div class="sv-glow"><b>✦ Resplandor ${gl}</b><small>Crece con misiones de servicio, compartir con quien lo necesita, respuestas correctas y versículos.</small><span class="sv-axbar"><i style="width:${pc}%"></i></span></div>`; }
  body.innerHTML = `<div class="sv-inv">${glowH}<p class="sv-tip">Nivel ${lv} de ${LV_MAX}. Cada vez que subís de nivel ganás <b>${ATTR_PER_LV} puntos</b> para repartir como quieras (máximo ${ATTR_MAX} por atributo). Cada 5 puntos se nota un escalón más.</p><div class="sv-free">Puntos para repartir: <b>${free}</b></div>${pt ? `<div class="sv-conf"><p>Vas a sumar ${ATTR.filter(([k]) => AP[k]).map(([k, n]) => `<b>${n} +${AP[k]}</b>`).join(', ')}. <em>Una vez confirmados, los puntos quedan fijos y no se pueden cambiar.</em></p><div><button class="sv-undo">Deshacer</button><button class="sv-ok">${invAttr.ask ? 'Sí, confirmar' : 'Confirmar'}</button></div></div>` : ''}
    <div class="sv-bulk"><span>Sumar de a</span>${[1, 5, 10].map(n => `<button data-n="${n}" class="${(S.bulk || 1) === n ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${(S.hx ? [['__h', 'Frutos del Espíritu · Gálatas 5:22-23']].concat(FRUITS.map(x => [x[0], x[1], x[2]]), [['__h', 'Sabiduría'], [SABI[0], SABI[1], SABI[2]], ['__h', 'Cuerpo']], BODY) : ATTRK).map(([k, n, d]) => k === '__h' ? `<h4 class="sv-sec">${n}</h4>` : `<div class="sv-attr"><div><b>${n} <em>${a[k] + axLv(k)}</em>${AP[k] ? `<span class="sv-pend">+${AP[k]}</span>` : ''}${axLv(k) ? `<span class="sv-axlv">(+${axLv(k)} por práctica)</span>` : ''}</b><small>${d}</small>${S.hx ? perksHtml(k) : ''}<span class="sv-axbar" title="Experiencia de ${n}"><i style="width:${Math.min(100, ((axP().xp[k] || 0) / axNeed(axLv(k))) * 100).toFixed(0)}%"></i></span><span class="sv-pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.floor(a[k] / 5) ? 'on' : ''}"></i>`).join('')}</span></div><button data-k="${k}" ${free > 0 && a[k] + (AP[k] || 0) < ATTR_MAX ? '' : 'disabled'} aria-label="Subir ${n}">+</button></div>`).join('')}
    <div class="sv-attr sv-hum"><div><b>Humildad <em>${h}</em></b><small>Es la única que no se compra con puntos: crece solo cuando le das puntos tuyos a otros en una sala con amigos. Jesús enseñó que el que se humilla será enaltecido (Lucas 14:11).</small></div></div>
    <ul class="sv-perks">${HUM_PERKS.map(([n, t, d]) => `<li class="${h >= n ? 'on' : ''}"><b>${n} · ${t}</b><small>${d}</small></li>`).join('')}</ul>
    <div class="sv-attr sv-hum"><div><b>Servicio <em>${a.serv || 0}</em></b><small>También es único: crece solo haciendo obras para los demás, como ayudar a los mendigos del camino o cumplir misiones.</small></div></div>
    <ul class="sv-perks">${SERV_PERKS.map(([n, t, d]) => `<li class="${(a.serv || 0) >= n ? 'on' : ''}"><b>${n} · ${t}</b><small>${d}</small></li>`).join('')}</ul></div>`;
  body.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { S.bulk = +b.dataset.n; invAttr(body); });
  // el + solo reserva: los puntos se fijan para siempre recién al confirmar
  body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k, n = Math.min(S.bulk || 1, free, ATTR_MAX - a[k] - (AP[k] || 0)); if (n <= 0) return; AP[k] = (AP[k] || 0) + n; invAttr.ask = false; invAttr(body); });
  const un = body.querySelector('.sv-undo'), ok = body.querySelector('.sv-ok');
  if (un) un.onclick = () => { invAttr.pend = {}; invAttr.ask = false; invAttr(body); };
  if (ok) ok.onclick = () => { if (!invAttr.ask) { invAttr.ask = true; invAttr(body); return; } const real = ptsFree(); let used = 0; ATTR.forEach(([k]) => { const n = Math.max(0, Math.min(AP[k] || 0, real - used, ATTR_MAX - a[k])); if (n) { a[k] += n; used += n; } }); a.spent = (a.spent || 0) + used; invAttr.pend = {}; invAttr.ask = false; G().save(); invAttr(body); attrSync(); try { G().toast('✅ Puntos confirmados. Quedan guardados para siempre.'); } catch (e) {} };
}


/* =====================================================================
   SALA: intercambio, humildad y espadeo bíblico
   Mensajes { t:'x', k, to?, id } que el anfitrión reenvía al destinatario (o a todos).
   ===================================================================== */
const HUM = { DAYMAX: 3 };
function myId() { return MP.peer && MP.peer.id; }
function pName(id) { return id === myId() ? meInfo().name : (MP.players[id] ? MP.players[id].info.name : 'Alguien'); }
function xSend(m) { m.t = 'x'; m.id = myId(); if (MP.host) { if (m.to) { if (MP.conns[m.to] && MP.conns[m.to].open) MP.conns[m.to].send(m); } else mpSend(m); } else if (MP.conn && MP.conn.open) MP.conn.send(m); }
function xRelay(c, m) { m.id = c.peer; if (!m.to || m.to === myId()) { mpX(m); if (!m.to) mpSend(m, c.peer); } else if (MP.conns[m.to] && MP.conns[m.to].open) MP.conns[m.to].send(m); }
function mpX(m) {
  if (m.k === 'offer') return xOfferIn(m);
  if (m.k === 'offerOk') return xOfferOk(m);
  if (m.k === 'offerNo') { const s = svP(); Object.entries(m.give || {}).forEach(([k, n]) => svAdd(k, n)); G().save(); svUI && svUI(); G().toast(pName(m.id) + ' no aceptó el intercambio. Te devolvimos tus cosas.'); return; }
  if (m.k === 'gift') return xGiftIn(m);
  if (m.k === 'esp') return espIn(m);
  if (m.k === 'g') return gmIn(m);
  if (m.k === 'share' && svOn() && !S.down && (S.av.position.x - m.x) ** 2 + (S.av.position.z - m.z) ** 2 < 100) { const s = svP(); s.sat = Math.min(SV.FULL, s.sat + 300); G().save(); svUI(); G().toast('🍞 ' + m.by + ' compartió su comida: +5 minutos de alimento.'); }
}
function playerPick(title, onPick) {
  const el = document.getElementById('v3sheet'), ids = Object.keys(MP.players); if (!ids.length) { G().toast('Todavía no hay nadie más en la sala.'); return; }
  el.innerHTML = `<div class="inv${S.hx ? ' hx' : ''}"><div class="inv-h"><b>${esc(title)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><div class="x-list">${ids.map(id => `<button data-id="${id}">${esc(pName(id))}</button>`).join('')}</div></div>`;
  el.hidden = false; el.querySelector('.bag-x').onclick = () => { el.hidden = true; }; el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => onPick(b.dataset.id));
}

/* ---------- intercambio de materiales y comida (Hero) ---------- */
const XRES = ['money', 'wood', 'stone', 'plank', 'block', 'fruit', 'bread', 'fish', 'cooked'];
function xTrade() {
  playerPick('¿Con quién querés intercambiar?', to => {
    const el = document.getElementById('v3sheet'), s = svP(), give = {}, want = {};
    const row = (k, side) => { const o = side === 'g' ? give : want, max = side === 'g' ? (s.inv[k] || 0) : 99; return `<div class="x-row"><span>${RES[k][1]} ${RES[k][0]}${side === 'g' ? ` <small>(tenés ${s.inv[k] || 0})</small>` : ''}</span><button data-s="${side}" data-k="${k}" data-d="-1">−</button><b>${o[k] || 0}</b><button data-s="${side}" data-k="${k}" data-d="1" ${(o[k] || 0) >= max ? 'disabled' : ''}>+</button></div>`; };
    const draw = () => { el.innerHTML = `<div class="inv hx"><div class="inv-h"><b>Intercambio con ${esc(pName(to))}</b><button class="bag-x" aria-label="Cerrar">✕</button></div>
      <h4 class="x-h">Lo que das</h4>${XRES.map(k => row(k, 'g')).join('')}<h4 class="x-h">Lo que pedís (podés dejarlo vacío para regalar)</h4>${XRES.map(k => row(k, 'w')).join('')}
      <div class="sv-row"><button class="x-send">Enviar propuesta</button></div><p class="sv-tip">Lo que das queda reservado hasta que la otra persona responda.</p></div>`;
      el.querySelector('.bag-x').onclick = () => { el.hidden = true; };
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const o = b.dataset.s === 'g' ? give : want, k = b.dataset.k, mx = b.dataset.s === 'g' ? (s.inv[k] || 0) : 99; o[k] = Math.max(0, Math.min(mx, (o[k] || 0) + +b.dataset.d)); if (!o[k]) delete o[k]; draw(); });
      el.querySelector('.x-send').onclick = () => { if (!Object.keys(give).length && !Object.keys(want).length) { G().toast('Elegí algo para dar o pedir.'); return; } if (!svHas(give)) return; svPay(give); G().save(); svUI(); xSend({ k: 'offer', to, give, want }); el.hidden = true; G().toast('Propuesta enviada a ' + pName(to) + '.'); }; };
    draw();
  });
}
const lst = o => Object.entries(o || {}).map(([k, n]) => RES[k][1] + ' ' + n + ' ' + RES[k][0].toLowerCase()).join(', ') || 'nada';
function xOfferIn(m) {
  if (!svOn()) { xSend({ k: 'offerNo', to: m.id, give: m.give }); return; }
  const el = document.getElementById('v3sheet'), gift = !Object.keys(m.want || {}).length;
  el.innerHTML = `<div class="inv hx"><div class="inv-h"><b>${gift ? 'Un regalo' : 'Propuesta de intercambio'}</b></div><p class="sv-tip"><b>${esc(pName(m.id))}</b> te ${gift ? 'regala' : 'ofrece'}: ${esc(lst(m.give))}.</p>${gift ? '' : `<p class="sv-tip">A cambio te pide: ${esc(lst(m.want))}.</p>`}<div class="sv-row"><button class="x-ok">${gift ? 'Recibir' : 'Aceptar'}</button><button class="x-no">No, gracias</button></div></div>`;
  el.hidden = false;
  el.querySelector('.x-ok').onclick = () => { if (!svHas(m.want || {})) { G().toast('No tenés lo que te piden.'); return; } svPay(m.want || {}); Object.entries(m.give || {}).forEach(([k, n]) => svAdd(k, n)); G().save(); svUI(); xSend({ k: 'offerOk', to: m.id, want: m.want }); el.hidden = true; G().toast(gift ? '¡Recibiste el regalo!' : '¡Intercambio hecho!'); };
  el.querySelector('.x-no').onclick = () => { xSend({ k: 'offerNo', to: m.id, give: m.give }); el.hidden = true; };
}
function xOfferOk(m) { Object.entries(m.want || {}).forEach(([k, n]) => svAdd(k, n)); G().save(); svUI(); G().toast(pName(m.id) + ' aceptó. ' + (Object.keys(m.want || {}).length ? 'Recibiste ' + lst(m.want) + '.' : '¡Gracias por tu generosidad!')); }

/* ---------- humildad: dar puntos de tus atributos ---------- */
function humToday() { const s = svP(), a = atP(), day = Math.floor(s.play / SV.DAY); if (a.hDay !== day) { a.hDay = day; a.hN = 0; a.hTo = []; } return a; }
function xGift() {
  const a = humToday(); if (a.hN >= HUM.DAYMAX) { G().toast('Hoy ya diste ' + HUM.DAYMAX + ' puntos. Mañana (en el juego) vas a poder dar más.'); return; }
  playerPick('¿A quién le querés dar un punto?', to => {
    if ((a.hTo || []).includes(to)) { G().toast('Hoy ya le diste un punto a ' + pName(to) + '. Probá con otra persona.'); return; }
    const el = document.getElementById('v3sheet');
    el.innerHTML = `<div class="inv hx"><div class="inv-h"><b>Dar a ${esc(pName(to))}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="sv-tip">Le pasás 1 punto de un atributo tuyo: a vos te resta y a ${esc(pName(to))} le suma. Por dar, crecés 1 en <b>Humildad</b>. Podés dar hasta ${HUM.DAYMAX} puntos por día, uno por persona.</p>
      ${ATTR.map(([k, n]) => `<div class="sv-attr"><div><b>${n}</b><small>Tenés ${a[k]}</small></div><button data-k="${k}" ${a[k] > 0 ? '' : 'disabled'} aria-label="Dar ${n}">→</button></div>`).join('')}</div>`;
    el.hidden = false; el.querySelector('.bag-x').onclick = () => { el.hidden = true; };
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; if (a[k] <= 0) return; a[k]--; a.hum = (a.hum || 0) + 1; a.hN++; a.hTo = (a.hTo || []).concat(to); G().save(); xSend({ k: 'gift', to, attr: k }); el.hidden = true; humCheck(); G().toast('Le diste 1 de ' + ATTR.find(x => x[0] === k)[1] + ' a ' + pName(to) + '. Tu humildad creció a ' + a.hum + '.'); });
  });
}
function xGiftIn(m) { if (!svOn()) return; const a = atP(), k = m.attr; if (!ATTR.some(x => x[0] === k)) return; a[k] = Math.min(50, (a[k] || 0) + 1); G().save(); misPop('Un regalo de ' + pName(m.id), '+1 de ' + ATTR.find(x => x[0] === k)[1]); }
const HUM_PERKS = [
  [1, 'Pan compartido', 'Cuando comés, los que están cerca tuyo en la sala también recuperan 5 minutos de alimento.'],
  [5, 'Lo que no se pierde', 'Por cada 5 de humildad, un objeto más que nunca se pierde si te quedás sin fuerzas.'],
  [10, 'Siervo de todos', 'Una luz dorada te acompaña y todos en la sala la ven.'],
  [20, 'Sandalias del siervo', 'Una prenda única, que nunca se pierde: recuerda que Jesús lavó los pies de sus discípulos (Juan 13:14-15).'],
  [30, 'Primero los demás', 'En el espadeo bíblico ganás el doble de puntos de experiencia.']
];
function humV() { return svOn() ? (atP().hum || 0) : 0; }
function humCheck() { const h = humV(); if (h >= 20 && GBY['siervo'] && !gearState().own.includes('siervo')) gearGive(GBY['siervo'], 'Por tu humildad'); }

/* ---------- espadeo bíblico: preguntas rápidas, 1 contra 1 o todos contra todos ---------- */
const ESP = { on: null };
function espPool() { const E = G().EXAMS || {}, out = []; G().REGIONS.forEach(R => (E[R.id] || []).forEach(q => { if (q.t === 'mc') out.push({ q: q.q, o: q.o.slice(), a: q.a, exp: q.exp, ref: q.ref }); else if (q.t === 'tf') out.push({ q: q.q, o: ['Verdadero', 'Falso'], a: q.a ? 0 : 1, exp: q.exp, ref: q.ref }); })); return out; }
function espStart(mode) {
  const ids = Object.keys(MP.players); if (!ids.length) { G().toast('Hace falta al menos otra persona en la sala.'); return; }
  const go = to => { const pool = espPool().sort(() => Math.random() - .5).slice(0, 7).map(q => { const ord = q.o.map((_, i) => i).sort(() => Math.random() - .5); return { q: q.q, o: ord.map(i => q.o[i]), a: ord.indexOf(q.a), exp: q.exp, ref: q.ref }; });
    ESP.on = { host: true, qs: pool, who: [myId()], inv: to ? [to] : ids, n: -1, ans: {}, score: { [myId()]: 0 }, mode };
    ESP.on.inv.forEach(id => xSend({ k: 'esp', ev: 'inv', to: id, mode, n: pool.length }));
    espSheet(`<p class="sv-tip">Esperando que acepten… (10 segundos)</p>`); setTimeout(() => { const E = ESP.on; if (!E || !E.host) return; if (E.who.length < 2) { ESP.on = null; espSheet('<p class="sv-tip">Nadie aceptó esta vez. Probá de nuevo en un ratito.</p>', true); return; } espNext(); }, 10000); };
  if (mode === '1v1') playerPick('¿A quién desafiás?', id => go(id)); else go(null);
}
function espSheet(html, closable) { const el = document.getElementById('v3sheet'); el.innerHTML = `<div class="inv${S.hx ? ' hx' : ''} esp"><div class="inv-h"><b>Espadeo bíblico</b>${closable ? '<button class="bag-x" aria-label="Cerrar">✕</button>' : ''}</div>${html}</div>`; el.hidden = false; el.onclick = null; const x = el.querySelector('.bag-x'); if (x) x.onclick = () => { el.hidden = true; }; return el; }
function espTo(m) { ESP.on.who.forEach(id => { if (id !== myId()) xSend(Object.assign({}, m, { to: id })); }); espIn(Object.assign({ id: myId() }, m)); }
function espNext() { const E = ESP.on; E.n++; if (E.n >= E.qs.length) { espTo({ k: 'esp', ev: 'end', score: E.score, names: Object.fromEntries(E.who.map(id => [id, pName(id)])) }); return; } E.ans = {}; espTo({ k: 'esp', ev: 'q', i: E.n, tot: E.qs.length, q: E.qs[E.n].q, o: E.qs[E.n].o }); E.timer = setTimeout(espReveal, 15500); }
function espReveal() { const E = ESP.on; if (!E || !E.host || E.revealed === E.n) return; E.revealed = E.n; clearTimeout(E.timer); const Q = E.qs[E.n]; const right = Object.entries(E.ans).filter(([, v]) => v.a === Q.a).sort((x, y) => x[1].ms - y[1].ms);
  right.forEach(([id], i) => { E.score[id] = (E.score[id] || 0) + (i === 0 ? 3 : 2); });
  espTo({ k: 'esp', ev: 'res', a: Q.a, exp: Q.exp, ref: Q.ref, first: right[0] ? pName(right[0][0]) : null, score: E.score, names: Object.fromEntries(E.who.map(id => [id, pName(id)])) }); setTimeout(espNext, 5500); }
function espIn(m) {
  if (m.ev === 'inv') { const el = espSheet(`<p class="sv-tip"><b>${esc(pName(m.id))}</b> te invita a un espadeo bíblico ${m.mode === '1v1' ? 'mano a mano' : 'de todos contra todos'}: ${m.n} preguntas, gana quien responde bien y primero.</p><div class="sv-row"><button class="x-ok">¡Juego!</button><button class="x-no">Ahora no</button></div>`);
    el.querySelector('.x-ok').onclick = () => { ESP.on = { host: false, from: m.id }; xSend({ k: 'esp', ev: 'yes', to: m.id }); espSheet('<p class="sv-tip">¡Listo! Esperando la primera pregunta…</p>'); }; el.querySelector('.x-no').onclick = () => { document.getElementById('v3sheet').hidden = true; }; return; }
  if (m.ev === 'yes' && ESP.on && ESP.on.host && ESP.on.n < 0) { if (!ESP.on.who.includes(m.id)) { ESP.on.who.push(m.id); ESP.on.score[m.id] = 0; } return; }
  if (m.ev === 'ans' && ESP.on && ESP.on.host) { if (m.i === ESP.on.n && !ESP.on.ans[m.id]) { ESP.on.ans[m.id] = { a: m.a, ms: m.ms }; if (ESP.on.who.every(id => ESP.on.ans[id])) espReveal(); } return; }
  if (m.ev === 'q') { const t0 = performance.now(); let done = false; const el = espSheet(`<div class="esp-top"><span>Pregunta ${m.i + 1} de ${m.tot}</span><i class="esp-bar"><b></b></i></div><h3 class="esp-q">${esc(m.q)}</h3><div class="esp-o">${m.o.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join('')}</div>`);
    const bar = el.querySelector('.esp-bar b'); bar.style.transition = 'width 15s linear'; requestAnimationFrame(() => { bar.style.width = '0%'; });
    el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if (done) return; done = true; b.classList.add('pick'); const msg = { k: 'esp', ev: 'ans', i: m.i, a: +b.dataset.i, ms: performance.now() - t0 }; if (ESP.on && ESP.on.host) espIn(Object.assign({ id: myId() }, msg)); else xSend(Object.assign({ to: ESP.on && ESP.on.from }, msg)); }); return; }
  if (m.ev === 'res') { const el = document.getElementById('v3sheet'); el.querySelectorAll('.esp-o button').forEach((b, i) => { b.disabled = true; b.classList.toggle('ok', i === m.a); }); const box = document.createElement('div'); box.className = 'esp-exp'; box.innerHTML = `${m.first ? `<p><b>${esc(m.first)}</b> respondió bien primero.</p>` : '<p>Nadie acertó esta vez.</p>'}<p>${esc(m.exp || '')}</p><p class="esp-ref">${esc(m.ref || '')}</p>`; el.querySelector('.esp') && el.querySelector('.esp').appendChild(box); return; }
  if (m.ev === 'end') { const rows = Object.entries(m.score).sort((a, b) => b[1] - a[1]); const mine = m.score[myId()] || 0, xp = mine * 4 * (humV() >= 30 ? 2 : 1); const p = G().P(); p.bonus = (p.bonus || 0) + xp; G().save(); G().refreshHud && G().refreshHud(); ESP.on = null;
    espSheet(`<p class="sv-tip">¡Terminó el espadeo! Cada respuesta te ayuda a conocer más la Palabra.</p><ol class="esp-rank">${rows.map(([id, n]) => `<li><span>${esc(m.names[id] || 'Alguien')}</span><b>${n}</b></li>`).join('')}</ol><p class="sv-tip">Ganaste <b>${xp}</b> puntos de experiencia.</p>`, true); return; }
}


/* =====================================================================
   MÁS JUEGOS EN LA SALA
   ¿Quién soy? (carrera de pistas) · Versículo en cadena (en equipo) · Carrera a un lugar · Orar juntos
   El que invita hace de anfitrión del juego; los demás aceptan la invitación.
   ===================================================================== */
const QUIEN = [
  ['Zaqueo', ['Cobraba impuestos en Jericó', 'Era bajito', 'Se subió a un árbol para ver a Jesús', 'Devolvió lo que había robado'], 'Lucas 19:1-10'],
  ['Pedro', ['Era pescador en Galilea', 'Caminó sobre el agua un momento', 'Negó a Jesús tres veces', 'Jesús resucitado le pidió que cuidara a sus ovejas'], 'Mateo 14:28-29 · Juan 21:15-17'],
  ['María, la madre de Jesús', ['Vivía en Nazaret', 'Un ángel le dio una noticia', 'Dio a luz en Belén', 'Estuvo al pie de la cruz'], 'Lucas 1–2 · Juan 19:25'],
  ['Juan el Bautista', ['Vivía en el desierto', 'Comía langostas y miel silvestre', 'Preparó el camino del Señor', 'Bautizó a Jesús en el Jordán'], 'Mateo 3'],
  ['Bartimeo', ['Era ciego', 'Pedía limosna junto al camino de Jericó', 'Gritó más fuerte cuando lo mandaron callar', 'Jesús le devolvió la vista'], 'Marcos 10:46-52'],
  ['Simón de Cirene', ['Venía del campo', 'Estaba en Jerusalén para la Pascua', 'Los soldados lo obligaron a ayudar', 'Llevó la cruz detrás de Jesús'], 'Lucas 23:26'],
  ['La mujer samaritana', ['Fue a buscar agua al mediodía', 'Habló con Jesús junto a un pozo', 'Jesús le habló del agua viva', 'Corrió a contarle a su pueblo'], 'Juan 4'],
  ['Nicodemo', ['Era fariseo y maestro', 'Fue a ver a Jesús de noche', 'Jesús le habló de nacer de nuevo', 'Llevó especias para la sepultura de Jesús'], 'Juan 3 · Juan 19:39'],
  ['José de Arimatea', ['Era un hombre rico', 'Era miembro del concilio', 'Le pidió a Pilato el cuerpo de Jesús', 'Lo puso en una tumba nueva'], 'Mateo 27:57-60'],
  ['Lázaro', ['Vivía en Betania', 'Tenía dos hermanas, Marta y María', 'Jesús lloró cerca de su tumba', 'Salió vivo de la tumba'], 'Juan 11'],
  ['Simeón', ['Vivía en Jerusalén', 'Esperaba al Mesías', 'El Espíritu le prometió que lo vería', 'Tomó al bebé Jesús en brazos en el templo'], 'Lucas 2:25-35'],
  ['Marta', ['Vivía en Betania', 'Estaba muy ocupada atendiendo', 'Se quejó de que su hermana no la ayudaba', 'Jesús le dijo que su hermana eligió lo mejor'], 'Lucas 10:38-42'],
  ['Mateo', ['Cobraba impuestos', 'Estaba sentado en su puesto de trabajo', 'Jesús lo llamó a seguirlo', 'Hizo una comida con Jesús en su casa'], 'Mateo 9:9-10'],
  ['Pilato', ['Era gobernador romano', 'Interrogó a Jesús', 'No encontró delito en él', 'Se lavó las manos delante de la gente'], 'Mateo 27:11-24']
];
const GM = { on: null };
function gmInvite(game, label, setup) {
  const ids = Object.keys(MP.players); if (!ids.length) { G().toast('Hace falta al menos otra persona en la sala.'); return; }
  GM.on = Object.assign({ host: true, game, who: [myId()], score: { [myId()]: 0 }, started: false }, setup || {});
  ids.forEach(id => xSend({ k: 'g', ev: 'inv', to: id, game, label }));
  gmSheet(`<p class="sv-tip">Invitaste a la sala a <b>${esc(label)}</b>. Esperando que acepten… (10 segundos)</p>`);
  setTimeout(() => { const E = GM.on; if (!E || !E.host || E.started) return; if (E.who.length < 2) { GM.on = null; gmSheet('<p class="sv-tip">Nadie aceptó esta vez. Probá en un ratito.</p>', true); return; } E.started = true; GMH[game].start(E); }, 10000);
}
function gmSheet(html, closable, title) { const el = document.getElementById('v3sheet'); el.innerHTML = `<div class="inv${S.hx ? ' hx' : ''} esp"><div class="inv-h"><b>${esc(title || 'Juegos en la sala')}</b>${closable ? '<button class="bag-x" aria-label="Cerrar">✕</button>' : ''}</div>${html}</div>`; el.hidden = false; el.onclick = null; const x = el.querySelector('.bag-x'); if (x) x.onclick = () => { el.hidden = true; }; return el; }
function gmTo(m) { m.k = 'g'; GM.on.who.forEach(id => { if (id !== myId()) xSend(Object.assign({}, m, { to: id })); }); gmIn(Object.assign({ id: myId() }, m)); }
function gmUp(m) { m.k = 'g'; if (GM.on && GM.on.host) gmIn(Object.assign({ id: myId() }, m)); else xSend(Object.assign({ to: GM.on && GM.on.from }, m)); }
function gmXP(n) { const p = G().P(); p.bonus = (p.bonus || 0) + n; G().save(); G().refreshHud && G().refreshHud(); }
function gmRank(score, names) { return `<ol class="esp-rank">${Object.entries(score).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<li><span>${esc(names[id] || 'Alguien')}</span><b>${n}</b></li>`).join('')}</ol>`; }
function gmNames() { return Object.fromEntries(GM.on.who.map(id => [id, pName(id)])); }
function gmIn(m) {
  if (m.ev === 'inv') { const el = gmSheet(`<p class="sv-tip"><b>${esc(pName(m.id))}</b> te invita a jugar <b>${esc(m.label)}</b>.</p><div class="sv-row"><button class="x-ok">¡Juego!</button><button class="x-no">Ahora no</button></div>`);
    el.querySelector('.x-ok').onclick = () => { GM.on = { host: false, from: m.id, game: m.game }; xSend({ k: 'g', ev: 'yes', to: m.id }); gmSheet('<p class="sv-tip">¡Listo! Esperando que empiece…</p>'); }; el.querySelector('.x-no').onclick = () => { document.getElementById('v3sheet').hidden = true; }; return; }
  if (m.ev === 'yes' && GM.on && GM.on.host && !GM.on.started) { if (!GM.on.who.includes(m.id)) { GM.on.who.push(m.id); GM.on.score[m.id] = 0; } return; }
  const H = GMH[(GM.on && GM.on.game) || m.game]; if (H) H.on(m);
}
const GMH = {
  /* ¿Quién soy? las pistas aparecen de a una: cuanto antes adivinás, más sumás */
  quien: {
    start(E) { E.rounds = QUIEN.slice().sort(() => Math.random() - .5).slice(0, 5); E.r = -1; this.next(E); },
    next(E) { E.r++; if (E.r >= E.rounds.length) { gmTo({ ev: 'end', score: E.score, names: gmNames() }); return; } const [who, clues, ref] = E.rounds[E.r], opts = [who].concat(QUIEN.filter(q => q[0] !== who).sort(() => Math.random() - .5).slice(0, 3).map(q => q[0])).sort(() => Math.random() - .5);
      E.cur = { who, ref, clues, k: 1, out: {}, won: null }; gmTo({ ev: 'q', i: E.r, tot: E.rounds.length, opts, clues: clues.slice(0, 1) }); E.tm = setInterval(() => { const c = E.cur; if (c.won) return; c.k++; if (c.k > 4) { clearInterval(E.tm); this.reveal(E); return; } gmTo({ ev: 'clue', clues: c.clues.slice(0, c.k) }); }, 6000); },
    reveal(E) { clearInterval(E.tm); const c = E.cur; gmTo({ ev: 'res', who: c.who, ref: c.ref, first: c.won ? pName(c.won) : null, score: E.score, names: gmNames() }); setTimeout(() => this.next(E), 5000); },
    on(m) { const E = GM.on;
      if (m.ev === 'q' || m.ev === 'clue') { if (m.ev === 'q') { E.mine = null; E.opts = m.opts; E.i = m.i; E.tot = m.tot; } const el = gmSheet(`<div class="esp-top"><span>Personaje ${E.i + 1} de ${E.tot}</span></div><h3 class="esp-q">¿Quién soy?</h3><ol class="qs-clues">${m.clues.map(c => `<li>${esc(c)}</li>`).join('')}</ol><div class="esp-o">${E.opts.map(o => `<button data-o="${esc(o)}" ${E.mine ? 'disabled' : ''} class="${E.mine === o ? 'pick' : ''}">${esc(o)}</button>`).join('')}</div>`, false, '¿Quién soy?');
        el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { if (E.mine) return; E.mine = b.dataset.o; el.querySelectorAll('[data-o]').forEach(x => { x.disabled = true; }); b.classList.add('pick'); gmUp({ ev: 'guess', o: E.mine }); }); return; }
      if (m.ev === 'guess' && E.host) { const c = E.cur; if (!c || c.out[m.id]) return; c.out[m.id] = 1; if (m.o === c.who) { E.score[m.id] = (E.score[m.id] || 0) + (c.won ? 1 : 5 - c.k); if (!c.won) c.won = m.id; } if (E.who.every(id => c.out[id])) this.reveal(E); return; }
      if (m.ev === 'res') { const el = document.getElementById('v3sheet'); el.querySelectorAll('[data-o]').forEach(b => b.classList.toggle('ok', b.dataset.o === m.who)); const box = document.createElement('div'); box.className = 'esp-exp'; box.innerHTML = `<p>Era <b>${esc(m.who)}</b>. ${m.first ? esc(m.first) + ' lo adivinó primero.' : 'Nadie lo adivinó.'}</p><p class="esp-ref">Leelo en ${esc(m.ref)}</p>`; el.querySelector('.esp').appendChild(box); return; }
      if (m.ev === 'end') { const xp = (m.score[myId()] || 0) * 4; gmXP(xp); GM.on = null; gmSheet(`<p class="sv-tip">¡Terminó ¿Quién soy?! Ahora conocés mejor a las personas que se encontraron con Jesús.</p>${gmRank(m.score, m.names)}<p class="sv-tip">Ganaste <b>${xp}</b> puntos de experiencia.</p>`, true, '¿Quién soy?'); } }
  },
  /* Versículo en cadena: en equipo, cada uno a su turno toca la palabra que sigue */
  cadena: {
    start(E) { const vs = []; G().REGIONS.forEach(R => ((G().EXAMS || {})[R.id] || []).forEach(q => { if (q.t === 'verse') vs.push({ txt: q.parts.map(x => typeof x === 'number' ? q.blanks[x] : x).join('').replace(/\s+/g, ' ').trim(), ref: q.ref }); }));
      E.vs = vs.filter(v => v.txt.split(' ').length <= 22).sort(() => Math.random() - .5).slice(0, 3); E.v = -1; E.errs = 0; E.turn = 0; this.next(E); },
    next(E) { E.v++; if (E.v >= E.vs.length) { gmTo({ ev: 'end', errs: E.errs, n: E.vs.length }); return; } const w = E.vs[E.v].txt.split(' '); E.words = w; E.done = 0; E.bank = w.map((t, i) => ({ i, t })).sort(() => Math.random() - .5); this.push(E); },
    push(E) { gmTo({ ev: 'st', v: E.v, tot: E.vs.length, bank: E.bank.map(b => ({ i: b.i, t: b.t, u: b.i < E.done })), done: E.words.slice(0, E.done).join(' '), turn: E.who[E.turn % E.who.length], tname: pName(E.who[E.turn % E.who.length]), errs: E.errs, ref: E.done >= E.words.length ? E.vs[E.v].ref : null }); },
    on(m) { const E = GM.on;
      if (m.ev === 'st') { const mine = m.turn === myId() && !m.ref; const el = gmSheet(`<div class="esp-top"><span>Versículo ${m.v + 1} de ${m.tot} · errores del equipo: ${m.errs}</span></div><p class="vc-done">${esc(m.done) || '<i>Empiecen por la primera palabra…</i>'}</p>${m.ref ? `<p class="esp-ref">${esc(m.ref)} · ¡Lo armaron juntos!</p>` : `<p class="sv-tip">${mine ? '<b>¡Es tu turno!</b> Tocá la palabra que sigue.' : 'Turno de <b>' + esc(m.tname) + '</b>.'}</p>`}<div class="vc-bank">${m.bank.map(b => `<button data-i="${b.i}" ${b.u || !mine ? 'disabled' : ''} class="${b.u ? 'used' : ''}">${esc(b.t)}</button>`).join('')}</div>`, false, 'Versículo en cadena');
        el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { gmUp({ ev: 'pick', i: +b.dataset.i }); el.querySelectorAll('[data-i]').forEach(x => { x.disabled = true; }); }); return; }
      if (m.ev === 'pick' && E.host) { if (m.id !== E.who[E.turn % E.who.length]) return; const want = E.words[E.done], got = E.bank.find(b => b.i === m.i); if (got && (got.i === E.done || got.t === want)) { if (got.i !== E.done) { const real = E.bank.find(b => b.i === E.done); real.i = got.i; got.i = E.done; } E.done++; } else E.errs++; E.turn++; this.push(E); if (E.done >= E.words.length) setTimeout(() => this.next(E), 4500); return; }
      if (m.ev === 'end') { const xp = Math.max(10, 40 * m.n - m.errs * 5); gmXP(xp); GM.on = null; gmSheet(`<p class="sv-tip">¡Armaron ${m.n} versículos en equipo! Repetir la Palabra juntos ayuda a guardarla en el corazón.</p><p class="sv-tip">Errores del equipo: ${m.errs}. Cada uno ganó <b>${xp}</b> puntos de experiencia.</p>`, true, 'Versículo en cadena'); } }
  },
  /* Carrera a un lugar: todos ven el destino con la flecha del piso */
  carrera: {
    start(E) { const g = G(), ok = (S.pois || []).filter(q => q.k !== 'river' && regionOpen(q.r)), a = S.av.position; const near = ok.filter(q => Math.hypot(q.x - a.x, q.z - a.z) > 30 && Math.hypot(q.x - a.x, q.z - a.z) < 220); const q = (near.length ? near : ok)[Math.floor(Math.random() * (near.length || ok.length))]; if (!q) { GM.on = null; G().toast('No hay un lugar para correr.'); return; }
      E.goal = q; E.arr = {}; gmTo({ ev: 'go', x: q.x, z: q.z, name: q.name }); E.tm = setTimeout(() => this.finish(E), 150000); },
    finish(E) { if (E.fin) return; E.fin = 1; clearTimeout(E.tm); const order = Object.entries(E.arr).sort((a, b) => a[1] - b[1]); order.forEach(([id], i) => { E.score[id] = [5, 3, 2][i] || 1; }); gmTo({ ev: 'end', score: E.score, names: gmNames(), name: E.goal.name, trade: E.goal.k }); },
    on(m) { const E = GM.on;
      if (m.ev === 'go') { E.goal = { x: m.x, z: m.z, name: m.name }; E.t0 = performance.now(); E.sent = 0; S.wp = { x: m.x, z: m.z, name: m.name }; wpSync(); document.getElementById('v3sheet').hidden = true; G().toast('🏁 ¡Carrera hasta ' + m.name + '! Seguí la flecha del piso.'); clearInterval(E.ck); E.ck = setInterval(() => { if (!GM.on || E.sent) { clearInterval(E.ck); return; } const a = S.av.position; if (Math.hypot(a.x - m.x, a.z - m.z) < 9) { E.sent = 1; clearInterval(E.ck); gmUp({ ev: 'arr', ms: performance.now() - E.t0 }); G().toast('¡Llegaste a ' + m.name + '! Esperá a los demás.'); } }, 300); return; }
      if (m.ev === 'arr' && E.host) { if (E.arr[m.id] == null) E.arr[m.id] = m.ms; if (E.who.every(id => E.arr[id] != null)) this.finish(E); return; }
      if (m.ev === 'end') { const xp = (m.score[myId()] || 0) * 4; gmXP(xp); GM.on = null; gmSheet(`<p class="sv-tip">Carrera hasta <b>${esc(m.name)}</b>.</p>${gmRank(m.score, m.names)}<p class="sv-tip">Ganaste <b>${xp}</b> puntos de experiencia. Mirá la tarjeta del lugar para saber qué pasó ahí.</p>`, true, 'Carrera'); } }
  }
};
/* Orar juntos: si dos o más de la sala se arrodillan cerca, reciben una bendición (una vez por día de juego) */
function prayTogetherTick(dt) {
  if (!S || !MP.code || S.pose !== 'pray') { if (S) S.prayTog = 0; return; }
  const a = S.av.position, near = Object.values(MP.players).filter(p => p.st.pose === 'pray' && (p.av.position.x - a.x) ** 2 + (p.av.position.z - a.z) ** 2 < 100).length;
  if (!near) { S.prayTog = 0; return; } S.prayTog = (S.prayTog || 0) + dt; if (S.prayTog < 6) return;
  const p = G().P(), day = Math.floor(((p.surv && p.surv.play) || 0) / 900) + ':' + new Date().toDateString(); if (p.prayDay === day) return; p.prayDay = day; gmXP(30);
  misPop('Oración en grupo · +30', 'Jesús prometió estar presente donde dos o tres se reúnen en su nombre (Mateo 18:20).');
}


/* =====================================================================
   DENARIOS, MERCADOS Y MENDIGOS (Hero)
   - Se gana dinero vendiendo en los oficios y en los puestos del mercado, y con las misiones.
   - Se compra pan, herramientas, materiales y ropa.
   - A los mendigos del camino se les puede dar dinero o comida: suma experiencia y Servicio.
   - Servicio: atributo único que solo crece haciendo obras para los demás.
   ===================================================================== */
RES.money = ['Denarios', '🪙']; RES.bread = ['Pan', '🥖']; FOOD.bread = 15 * 60;
const SELL = { wood: 1, stone: 1, plank: 3, block: 3, fruit: 1, fish: 2, cooked: 3, bread: 1 };
const SHOPS = {
  carpintero: { name: 'La carpintería', buy: [['t', 'axe', 15], ['t', 'pick', 18], ['r', 'plank', 4]], sell: ['wood', 'plank'] },
  alfarero: { name: 'El alfarero', buy: [['r', 'block', 4], ['t', 'flint', 6]], sell: ['stone', 'block'] },
  panadero: { name: 'La panadería', buy: [['r', 'bread', 2]], sell: ['fruit'] },
  pescador: { name: 'La casa del pescador', buy: [['t', 'rod', 12], ['t', 'net', 20], ['r', 'cooked', 4]], sell: ['fish', 'cooked'] },
  tejedora: { name: 'La tejedora', buy: [['g', 'c', 10], ['g', 'r', 30]], sell: [] },
  posada: { name: 'La posada', buy: [['r', 'bread', 2], ['r', 'cooked', 4]], sell: ['fruit', 'fish'] },
  mercado: { name: 'Puesto del mercado', buy: [['r', 'bread', 2], ['r', 'fruit', 2], ['t', 'flint', 6]], sell: ['wood', 'stone', 'plank', 'block', 'fruit', 'fish', 'cooked'] }
};
const SERV_PERKS = [
  [3, 'Te conocen en el mercado', 'Los comerciantes te hacen precio: todo cuesta un 10% menos.'],
  [8, 'Manos abiertas', 'Cada misión cumplida te deja 5 denarios más.'],
  [15, 'Pañuelo del servidor', 'Una prenda única que nunca se pierde. Recuerda que Jesús estuvo entre sus discípulos como el que sirve (Lucas 22:27).'],
  [25, 'Tesoro en el cielo', 'Cada vez que das a alguien que lo necesita, ganás el doble de experiencia.']
];
function servV() { return svOn() ? (atP().serv || 0) : 0; }
function servAdd(n, why) { const a = atP(); a.serv = (a.serv || 0) + n; G().save(); if (a.serv >= 15 && GBY.servidor && !gearState().own.includes('servidor')) gearGive(GBY.servidor, 'Por tu servicio'); }
function price(n) { let f = servV() >= 3 ? .9 : 1; if (S && S.hx) { f *= [1, .95, .95, .9, .9, .9][ft('gent')]; const v = vilNearest(60); if (v && repStars(v.name) >= 4) f *= .95; if (S.haggle) f *= .8; } return Math.max(1, Math.round(n * f)); }
function money() { return svP().inv.money || 0; }

/* puestos del mercado y mendigos a lo largo del camino */
function econBuild(scene, W) {
  const g = G(), R = rng(2027), st = S.sv; st.stalls = []; st.beggars = [];
  const regNodes = r => Object.keys(g.NODES).filter(id => id.startsWith(g.REGIONS[r].id + '-') && !/gate|fA|fB/.test(id)).map(id => S.markers[id]).filter(Boolean).sort((a, b) => b.position.z - a.position.z);
  g.REGIONS.forEach((Rg, r) => { const ns = regNodes(r); if (ns.length < 4) return;
    // puesto del mercado
    { const m = ns[2], side = r % 2 ? 1 : -1, x = m.position.x + side * 5.5, z = m.position.z + 1.5; if (!blockedAt(x, z)) { const y = W.hAt(x, z), gr = new THREE.Group(), cloth = ['#8E2E22', '#3E5A8A', '#C9A04A', '#66763E'][r % 4];
      bx(2.4, .1, 1.1, WOODL(), 0, .85, 0, gr); [[-1.1, -.45], [1.1, -.45], [-1.1, .45], [1.1, .45]].forEach(([a, b]) => cy(.05, .05, 2.2, WOOD(), a, 1.1, b, gr, 6)); const roof = bx(2.7, .06, 1.5, tm('awn' + r, cloth, { side: THREE.DoubleSide }), 0, 2.2, 0, gr); roof.rotation.x = .12;
      for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), tm('fr' + (i % 3), ['#C0392B', '#E9A52C', '#66763E'][i % 3])); f.position.set(-.9 + i * .36, .97, (i % 2 - .5) * .3); gr.add(f); } jar(gr, .9, .2, .95, '#B4704A', .7);
      gr.position.set(x, y, z); gr.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; gr.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(gr); S.cols.push({ x0: x - .7, x1: x + .7, z0: z - 1.3, z1: z + 1.3 });
      const sell = buildHeroAvatar({ g: R() < .5 ? 'chico' : 'chica', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: cloth, anim: ['M_Standing_Idle', 'M_Holding_Idle', 'M_Box_Idle'] }); const sx = x + side * 1.2; sell.position.set(sx, W.hAt(sx, z), z); sell.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(sell);
      const lb = textSprite('Mercado', true); lb.scale.multiplyScalar(.7); lb.position.set(x, y + 2.9, z); scene.add(lb); st.stalls.push({ x, z }); } }
    // mendigo junto al camino
    { const m = ns[Math.min(ns.length - 1, 4)], side = r % 2 ? -1 : 1, x = m.position.x + side * 3.2, z = m.position.z - 2; if (!blockedAt(x, z)) {
      const o = buildHeroAvatar({ g: R() < .6 ? 'chico' : 'chica', age: 18, skin: '#B98A62', hair: '#6A6A6A', outfit: '#7A6A5A', anim: ['M_Kneeling_Idle', 'Crouch_Idle_Loop', 'M_Sad_Idle'] }); o.position.set(x, W.hAt(x, z), z); o.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(o);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), tm('clay', '#A8784A')); bowl.position.set(x - side * .55, W.hAt(x, z) + .16, z); scene.add(bowl);
      st.beggars.push({ x, z, r, id: 'beg' + r, o, bowl, bx: x - side * .55, bz: z }); } }
  });
}


/* ===================== ALDEAS (Hero): saludar, charlas, ayudas, testigos, decisiones y reputación ===================== */
const VIL = { mod: null, npcs: [], list: [], cur: null, t: 0, greetT: {} };
const vday = () => new Date().toISOString().slice(0, 10);
function repP() { const p = G().P(); p.rep = p.rep || {}; return p.rep; }
const repOf = name => { const r = repP(); return r[name] == null ? 45 : r[name]; };
const repStars = name => Math.max(1, Math.min(5, 1 + Math.floor(repOf(name) / 20)));
function repAdd(name, n) { if (!name) return; const r = repP(); let k = n; if (n > 0 && fv('amor') >= 40) k += 1; r[name] = Math.max(0, Math.min(100, repOf(name) + k)); G().save(); }
function vilNearest(maxD) { const a = S.av.position; let best = null, bd = (maxD || 40) ** 2; for (const v of VIL.list) { const d = (v.x - a.x) ** 2 + (v.z - a.z) ** 2; if (d < bd) { bd = d; best = v; } } return best; }
/* ===== Conversaciones cinemáticas: plano y contraplano sobre el hombro, sin salir del mundo =====
   cine({ cast: { id: { name, sub, o | look, voice, pitch, rate } }, steps: [ { who: id|'me'|'nar', t, g } | { who, ask: q, o: [ { t, fn, then: [steps], quiet } ] } ], onDone }) */
const CINE = { on: false, side: 1 };
const CMP_CAST = {
  esc: { name: 'Eleazar', sub: 'anciano escriba', voice: 'esc', pitch: .78, rate: .92, look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#CFCFCF', outfit: '#D8CBA8', tintK: 0, anim: ['M_Holding_Idle', 'M_Standing_Idle'] } },
  zel: { name: 'Asher', sub: 'tu amigo zelote', voice: 'zel', pitch: 1.1, rate: 1.05, look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1A120C', outfit: '#6E2F22', tintK: 0, anim: ['M_Standing_Idle', 'M_Idle'] } },
  rom: { name: 'Lucio', sub: 'soldado romano', voice: 'rom', pitch: .9, rate: 1, look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#9A2418', tintK: 0, anim: ['M_Standing_Idle'] } }
};
function cineBusy() { return !!(S && (CINE.on || S.walking)); }
function cineOk() { return !!(S && S.hx && H3.ok && !CINE.on && !S.walking && document.getElementById('view3d') && !document.getElementById('view3d').hidden); }
const cineEye = o => o.position.y + (o.userData && o.userData.h3 ? 1.6 * o.scale.y : 1.45);
function cineSpawn(ids) {
  // ubica a los compañeros delante del jugador, en semicírculo, mirándolo; prueba varias direcciones hasta encontrar lugar libre
  const a = S.av.position, n = ids.length, ok = (x, z) => !blockedAt(x, z) && waterWet(x, z, null) < .05; let best = null;
  for (const dy of [0, .5, -.5, 1, -1, 1.6, -1.6, 2.4, -2.4, 3.14]) { const y = S.yaw + dy, fx = Math.sin(y), fz = Math.cos(y), rx = fz, rz = -fx;
    const ps = ids.map((id, i) => { const off = (i - (n - 1) / 2) * 1.3, dep = 2.5 + Math.abs(off) * .2; return [a.x + fx * dep + rx * off, a.z + fz * dep + rz * off]; });
    if (ps.every(([x, z]) => ok(x, z))) { best = { ps, y }; break; } }
  if (!best) { const y = S.yaw; best = { y, ps: ids.map((id, i) => [a.x + Math.sin(y) * 2.5 + Math.cos(y) * (i - (n - 1) / 2) * 1.3, a.z + Math.cos(y) * 2.5 - Math.sin(y) * (i - (n - 1) / 2) * 1.3]) }; }
  S.yaw = best.y; S.camYaw = 0; S.av.rotation.y = S.yaw;
  return ids.map((id, i) => { const [x, z] = best.ps[i], o = buildHeroAvatar(Object.assign({}, CMP_CAST[id].look)); o.position.set(x, Math.max(0, S.W ? S.W.hAt(x, z) : 0), z); o.rotation.y = Math.atan2(a.x - x, a.z - z); S.scene.add(o); return o; });
}
function cineEl() {
  let el = document.querySelector('.cine-ui'); if (el) return el;
  el = document.createElement('div'); el.className = 'cine-ui'; el.innerHTML = '<i class="cine-bar t"></i><i class="cine-bar b"></i><div class="cine-dof"></div><button class="cine-skip" type="button">Saltar ›</button><div class="cine-sub"><b class="cine-who"></b><p class="cine-t"></p><div class="cine-opts"></div><span class="cine-next" aria-hidden="true">▸</span></div>';
  document.body.appendChild(el); return el;
}
function cine(sc) {
  if (!cineOk()) return false;
  const ids = Object.keys(sc.cast || {}), spawnIds = ids.filter(k => !sc.cast[k].o && CMP_CAST[k]);
  const spawned = spawnIds.length ? cineSpawn(spawnIds) : []; spawnIds.forEach((k, i) => { sc.cast[k] = Object.assign({}, CMP_CAST[k], sc.cast[k], { o: spawned[i] }); });
  ids.forEach(k => { if (!sc.cast[k].o) delete sc.cast[k]; });
  const actors = Object.keys(sc.cast); if (!actors.length && !sc.steps.some(s => s.who === 'nar')) return false;
  // el jugador mira al grupo; los personajes se giran para mirarse
  CINE.on = true; CINE.sc = sc; CINE.q = sc.steps.slice(); CINE.spawned = spawned; CINE.fov0 = S.camera.fov; CINE.side = Math.random() < .5 ? 1 : -1; CINE.face = null;
  S.joy.x = 0; S.joy.y = 0; S.keys = {}; S.sprint = false;
  const el = cineEl(); el.classList.toggle('dof', QUAL.lv >= 1); document.body.classList.add('v3talk'); requestAnimationFrame(() => el.classList.add('on'));
  const from = { p: S.camera.position.toArray(), l: (S.camL || [S.av.position.x, S.av.position.y + 1.2, S.av.position.z]).slice(), f: S.camera.fov };
  CINE.cam = { from, to: from, t: 0, dur: .95 };
  el.querySelector('.cine-skip').onclick = e => { e.stopPropagation(); cineSkip(); };
  el.onclick = e => { if (e.target.closest('.cine-opts button,.cine-skip')) return; cineNext(); };
  setTimeout(() => cineStep(), 120);
  return true;
}
function cinePose(kind, spk, ask) {
  // devuelve {p,l,f}: 'ots' sobre el hombro del que escucha hacia el que habla; 'wide' plano de dos/grupo de costado
  const pl = S.av, cast = CINE.sc.cast, os = Object.keys(cast).map(k => cast[k].o);
  const c = os.length ? os.reduce((m, o) => (m[0] += o.position.x / os.length, m[1] += o.position.z / os.length, m), [0, 0]) : [pl.position.x + Math.sin(S.yaw) * 2.5, pl.position.z + Math.cos(S.yaw) * 2.5];
  const N = spk && spk !== pl ? spk : os[0];
  let dx = (N ? N.position.x : c[0]) - pl.position.x, dz = (N ? N.position.z : c[1]) - pl.position.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L; const s = CINE.side, rx = dz * s, rz = -dx * s;
  const ph = innerHeight > innerWidth ? .7 : 1, f = innerHeight > innerWidth ? 46 : 36;
  if (kind === 'wide' || !N) { const mx = (pl.position.x + c[0]) / 2, mz = (pl.position.z + c[1]) / 2, my = pl.position.y; return { p: [mx + rx * 3.6 - dx * .8, my + 1.75, mz + rz * 3.6 - dz * .8], l: [mx, my + 1.25, mz], f: f + 8 }; }
  if (spk === pl) { const e = cineEye(N), ep = cineEye(pl), sh = ask ? .8 : 0; return { p: [N.position.x + dx * .95 * ph + rx * .55, e + .06, N.position.z + dz * .95 * ph + rz * .55], l: [pl.position.x - rx * .1 + dz * sh, ep - .04, pl.position.z - rz * .1 - dx * sh], f }; }
  const e = cineEye(pl), en = cineEye(spk); return { p: [pl.position.x - dx * .95 * ph + rx * .55, e + .06, pl.position.z - dz * .95 * ph + rz * .55], l: [spk.position.x - rx * .1, en - .04, spk.position.z - rz * .1], f };
}
// la cámara no puede quedar dentro de una casa ni con una pared en medio: prueba el otro hombro, más cerca, o un plano general
function cineClear(P) { const [x, y, z] = P.p, [lx, ly, lz] = P.l, H = (X, Z) => S.W ? Math.max(0, S.W.hAt(X, Z)) : 0; if (blockedAt(x, z) || H(x, z) + .45 > y) return false; for (let i = 1; i < 6; i++) { const k = i / 6 * .85, X = x + (lx - x) * k, Z = z + (lz - z) * k; if (blockedAt(X, Z) || H(X, Z) + .2 > y + (ly - y) * k) return false; } return true; }
function cinePoseSafe(kind, spk, ask) { let P = cinePose(kind, spk, ask); if (cineClear(P)) return P; CINE.side = -CINE.side; P = cinePose(kind, spk, ask); if (cineClear(P)) return P; CINE.side = -CINE.side;
  for (const k of [.6, .35]) { const Q = cinePose(kind, spk, ask), c = [(Q.l[0] - Q.p[0]) * (1 - k), (Q.l[2] - Q.p[2]) * (1 - k)]; Q.p = [Q.p[0] + c[0], Q.p[1], Q.p[2] + c[1]]; if (cineClear(Q)) return Q; }
  const a = S.av.position, L = [a.x, cineEye(S.av) - .2, a.z]; for (let i = 0; i < 12; i++) { const ang = i / 12 * 6.283, Q = { p: [a.x + Math.sin(ang) * 3.2, L[1] + .7, a.z + Math.cos(ang) * 3.2], l: L, f: 44 }; if (cineClear(Q)) return Q; }
  return P; }
function cineShot(kind, spk, dur, ask) { const C = CINE.cam || {}; const cur = C.cur || C.from; CINE.cam = { from: cur, to: cinePoseSafe(kind, spk, ask), t: 0, dur: dur || .7, kind, spk }; }
function cineWho(w) { if (w === 'me') return S.av; if (w === 'nar') return null; const c = CINE.sc.cast[w]; return c ? c.o : null; }
function cineStep() {
  if (!CINE.on) return; const el = cineEl(), st = CINE.q.shift(); CINE.st = st; clearTimeout(CINE.autoT); try { G().voStop(); } catch (e) {}
  if (!st) return cineEnd();
  const sub = el.querySelector('.cine-sub'), who = el.querySelector('.cine-who'), tx = el.querySelector('.cine-t'), op = el.querySelector('.cine-opts'), nm = G().P().name || '';
  let t = String(st.ask || st.t || '').replace(/^\{name\},\s*/, nm ? nm + ', ' : '').replace(/\{name\}/g, nm); t = t.charAt(0).toUpperCase() + t.slice(1); const ttxt = t, spkO = cineWho(st.who), c = CINE.sc.cast[st.who];
  sub.classList.toggle('nar', st.who === 'nar'); sub.classList.toggle('ask', !!st.o); who.textContent = st.who === 'me' ? (nm || 'Vos') : c ? c.name : ''; who.hidden = st.who === 'nar'; tx.textContent = t;
  sub.classList.remove('in'); void sub.offsetWidth; sub.classList.add('in'); op.innerHTML = ''; CINE.ready = false; setTimeout(() => { CINE.ready = true; }, 450);
  // cámara: narrador → plano general; habla un personaje → sobre el hombro del jugador; habla el jugador o elige → contraplano
  const first = !CINE.cam.kind; if (st.cam) { const C = CINE.cam || {}; CINE.cam = { from: C.cur || C.from, to: st.cam, t: 0, dur: st.dur || 2.5, kind: 'fix' }; } else if (st.o) { if (spkO && spkO !== S.av) { cineShot('ots', spkO, first ? .95 : .7); clearTimeout(CINE.askT); CINE.askT = setTimeout(() => { if (CINE.st === st) cineShot('ots', S.av, .8, true); }, 2000); } else cineShot('ots', S.av, first ? .95 : .75, true); } else if (st.who === 'nar') cineShot('wide', null, first ? .95 : 1.1); else cineShot('ots', spkO, first ? .95 : .7);
  CINE.face = spkO && spkO !== S.av ? spkO : null; if (st.quiet && !st.o) { sub.classList.remove('in'); CINE.autoT = setTimeout(() => { if (CINE.st === st) cineStep(); }, 2600); return; }
  const secs = Math.max(2.2, Math.min(9, t.length / 15));
  if (spkO && spkO !== S.av) { talkGo(spkO, secs, st.g); if (Math.random() < .5) h3do(['M_Lengthy_Head_Nod', 'M_Thinking'], 2.2); }
  else if (spkO === S.av) talkGo(S.av, secs);
  Object.keys(CINE.sc.cast).forEach(k => { const o = CINE.sc.cast[k].o; if (o !== spkO && Math.random() < .35) h3npcPlay(o, ['M_Lengthy_Head_Nod', 'M_Thinking'], 2); });
  if (st.o) { op.innerHTML = st.o.map((x, i) => `<button type="button" data-i="${i}">${esc(x.t)}</button>`).join(''); op.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); const x = st.o[+b.dataset.i]; try { x.fn && x.fn(); } catch (er) {} CINE.q = (x.quiet ? [] : [{ who: 'me', t: x.t }]).concat(x.then || [], CINE.q); cineStep(); }); try { op.querySelector('button').focus({ preventScroll: true }); } catch (e) {} }
  const t0 = performance.now();
  const vc = st.who === 'me' ? ((G().P().avatar || {}).g === 'chica' ? 'mujer' : 'varon') : st.who === 'nar' ? 'narrador' : (c && c.voice) || 'varon';
  try { if (G().voOn && G().voOn()) G().vo(t, vc, { pitch: c && c.pitch, rate: c && c.rate, onend: () => { const el = performance.now() - t0; if (CINE.st === st && !st.o && el > 1500) CINE.autoT = setTimeout(() => { if (CINE.st === st) cineStep(); }, 1000); } }); } catch (e) {}
}
function cineNext() { if (!CINE.on || !CINE.ready || (CINE.st && CINE.st.o)) return; cineStep(); }
function cineSkip() { if (!CINE.on) return; const i = CINE.q.findIndex(s => s.o); if (CINE.st && CINE.st.o) return; CINE.q = i >= 0 ? CINE.q.slice(i) : []; cineStep(); }
function cineEnd() {
  const el = cineEl(); el.classList.remove('on'); document.body.classList.remove('v3talk'); try { G().voStop(); } catch (e) {}
  S.camYaw = 0; CINE.cam = { from: CINE.cam.cur || CINE.cam.from, to: null, t: 0, dur: .95, release: true }; CINE.face = null;
  const sc = CINE.sc, sp = CINE.spawned; setTimeout(() => { sp.forEach(o => { S && S.scene.remove(o); const i = H3.npcs.indexOf(o); if (i >= 0) H3.npcs.splice(i, 1); }); }, 950);
  CINE.on = false; CINE.sc = null; try { sc.onDone && sc.onDone(); } catch (e) {}
}
function cineTick(dt) {
  const C = CINE.cam; if (!C) return;
  if (C.release) C.to = { p: S.camI || C.from.p, l: S.camL || C.from.l, f: CINE.fov0 };
  C.t = Math.min(1, C.t + dt / C.dur); const k = (1 - Math.cos(Math.PI * C.t)) / 2, L = (a, b) => a.map((v, i) => v + (b[i] - v) * k);
  const cur = { p: L(C.from.p, C.to.p), l: L(C.from.l, C.to.l), f: C.from.f + (C.to.f - C.from.f) * k };
  if (!C.release && C.kind === 'wide' && C.t >= 1) { C.drift = (C.drift || 0) + dt; const d = Math.min(1.2, C.drift * .06); cur.p = cur.p.map((v, i) => v + (cur.l[i] - v) * d * .12); }
  C.cur = cur; S.camera.position.set(cur.p[0], cur.p[1], cur.p[2]); S.camera.lookAt(cur.l[0], cur.l[1], cur.l[2]); if (Math.abs(S.camera.fov - cur.f) > .01) { S.camera.fov = cur.f; S.camera.updateProjectionMatrix(); }
  if (S.W) S.W.sky.position.copy(S.camera.position);
  // los que escuchan miran al que habla; el jugador gira suave hacia quien le habla
  if (CINE.on && CINE.sc) { const sp = CINE.face, turn = (o, tx, tz) => { let d = Math.atan2(tx - o.position.x, tz - o.position.z) - o.rotation.y; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; o.rotation.y += d * Math.min(1, dt * 5); };
    for (const k in CINE.sc.cast) { const o = CINE.sc.cast[k].o; const tg = sp && sp !== o ? sp : S.av; turn(o, tg.position.x, tg.position.z); }
    if (sp) { turn(S.av, sp.position.x, sp.position.z); S.yaw = S.av.rotation.y; } }
  if (C.release && C.t >= 1) { CINE.cam = null; S.camera.fov = CINE.fov0; S.camera.updateProjectionMatrix(); }
}
addEventListener('keydown', e => { if (!CINE.on) return; const k = e.key; if (k === ' ' || k === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); if (!(CINE.st && CINE.st.o)) cineNext(); } else if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cineSkip(); } else if (/^[1-3]$/.test(k) && CINE.st && CINE.st.o) { const b = document.querySelectorAll('.cine-opts button')[+k - 1]; if (b) b.click(); e.stopImmediatePropagation(); } else e.stopImmediatePropagation(); }, true);
/* ===== Parte 3: la cruz (reverente; en Kids suave y sin sangre) y el tercer día ===== */
const P3 = {};
function p3Dark(k, secs) { let el = document.getElementById('v3dark'); if (!el) { el = document.createElement('div'); el.id = 'v3dark'; el.className = 'v3dark'; document.body.appendChild(el); } el.style.transition = `opacity ${secs || 4}s ease`; requestAnimationFrame(() => { el.style.opacity = String(k); }); }
function p3Poi(k) { return (S.pois || []).find(q => q.k === k); }
// figura en la cruz del medio: postura de brazos abiertos (pose de reposo del esqueleto), cabeza inclinada; vista siempre de lejos
function p3Figure(kids) {
  const p = p3Poi('golgota'); if (!p) return null; const y = S.W ? S.W.hAt(p.x, p.z) : 0, face = p.x < 0 ? Math.PI / 2 : -Math.PI / 2;
  const o = buildHeroAvatar({ g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#E8DDC6', tintK: .2, anim: ['Idle_Loop'] });
  const i = H3.npcs.indexOf(o); if (i >= 0) H3.npcs.splice(i, 1); // sin animación: queda en la postura de reposo del modelo, con los brazos abiertos
  const B = (o.userData.h3 || {}).bones || {}; if (B.Head) B.Head.rotation.x += .45; if (B.neck_01) B.neck_01.rotation.x += .12;
  o.position.set(p.x + Math.sin(face) * .22, y + 3.75, p.z); o.rotation.y = face; o.userData.keep = 1; S.scene.add(o);
  { const H = o.userData.h3; if (H && H.mixer) H.mixer.stopAllAction(); // brazos abiertos sobre el travesaño
    const aim = (bn, cn, sx) => { const b = B[bn], c = B[cn]; if (!b || !c || !b.parent) return; o.updateMatrixWorld(true); const p0 = b.getWorldPosition(new THREE.Vector3()), cur = c.getWorldPosition(new THREE.Vector3()).sub(p0).normalize(), want = new THREE.Vector3(sx, .2, 0).normalize().applyQuaternion(o.quaternion), dq = new THREE.Quaternion().setFromUnitVectors(cur, want), bw = b.getWorldQuaternion(new THREE.Quaternion()), pw = b.parent.getWorldQuaternion(new THREE.Quaternion()); b.quaternion.copy(pw.invert().multiply(dq.multiply(bw))); };
    aim('upperarm_l', 'lowerarm_l', 1); aim('lowerarm_l', 'hand_l', 1); aim('upperarm_r', 'lowerarm_r', -1); aim('lowerarm_r', 'hand_r', -1); o.updateMatrixWorld(true); }
  if (B.Head) { // corona de espinas
    const cr = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#4A3A22', roughness: .9 }); const ring = new THREE.Mesh(new THREE.TorusGeometry(.105, .014, 5, 18), m); ring.rotation.x = Math.PI / 2; cr.add(ring);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, sp = new THREE.Mesh(new THREE.ConeGeometry(.006, .04, 4), m); sp.position.set(Math.cos(a) * .105, 0, Math.sin(a) * .105); sp.rotation.z = Math.cos(a) * 1.2; sp.rotation.x = -Math.sin(a) * 1.2; cr.add(sp); }
    B.Head.add(cr); cr.position.set(0, .14, .01); cr.scale.setScalar(1 / (o.scale.x || 1)); }
  if (!kids) { const wm = new THREE.MeshStandardMaterial({ color: '#5A0E0A', roughness: .6 }); ['hand_l', 'hand_r', 'foot_l', 'foot_r'].forEach(n => { const b = B[n]; if (!b) return; const d = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), wm); b.add(d); d.position.set(0, .03, 0); }); }
  return o;
}
function p3Shot(kind) { // planos contemplativos y lejanos
  const p = p3Poi('golgota'); if (!p) return null; const y = S.W ? S.W.hAt(p.x, p.z) : 0, sx = p.x < 0 ? 1 : -1;
  if (kind === 'far') return { p: [p.x + sx * 34, y + 4, p.z - 14], l: [p.x, y + 4.6, p.z], f: 30 };
  if (kind === 'low') return { p: [p.x + sx * 16, y + 1.2, p.z + 9], l: [p.x, y + 5, p.z], f: 34 };
  if (kind === 'sky') return { p: [p.x + sx * 22, y + 2, p.z + 2], l: [p.x - sx * 10, y + 14, p.z], f: 40 };
  return { p: [p.x + sx * 24, y + 3, p.z + 5], l: [p.x, y + 4.4, p.z], f: 32 };
}
function crossScene(kids) {
  return new Promise(res => {
    if (!S || !cineOk2() || !p3Poi('golgota')) return res(false);
    const M = P3.mod; const L = M ? (kids ? M.CROSS.kids : M.CROSS.hero) : ['Al mediodía, una oscuridad cubrió toda la tierra.'];
    const fig = p3Figure(kids); S.solemn = 1; setTimeout(() => { if (S && S.solemn === 1) S.solemn = 2; }, 3500); p3Dark(kids ? .45 : .62, 5);
    const shots = ['far', 'low', 'mid', 'sky'], steps = L.map((t, i) => ({ who: 'nar', t, cam: p3Shot(shots[i % shots.length]), dur: i ? 3.5 : 2.5 }));
    steps.unshift({ who: 'nar', t: '…', cam: p3Shot('far'), dur: 2.5, quiet: 1 });
    const ok = cine({ cast: {}, steps, solemn: 1, onDone: () => { p3Dark(0, 6); setTimeout(() => { if (S) S.solemn = 0; }, 4000); if (fig) setTimeout(() => S && S.scene.remove(fig), 1200); res(true); } });
    if (!ok) { p3Dark(0, 1); S.solemn = 0; if (fig) S.scene.remove(fig); res(false); }
  });
}
function cineOk2() { return !!(S && H3.ok && !CINE.on && !S.walking && document.getElementById('view3d') && !document.getElementById('view3d').hidden); }
// el tercer día: amanecer, flores por todo el camino, luz cálida y gente corriendo hacia la ciudad
function dawnBuild() {
  if (P3.dawn || !S) return; const g = G(), ids = Object.keys(g.NODES).filter(k => k.startsWith('resurreccion-')), pts = ids.map(k => S.npos && S.npos[k] ? S.npos[k] : toV(g.NODES[k].x, g.NODES[k].y)); if (!pts.length) return;
  const cols = ['#F4F0E2', '#F2C14E', '#E86A8A', '#B98AFF', '#FF9A4A', '#FFFFFF'], N = QUAL.lv >= 2 ? 2600 : QUAL.lv ? 1400 : 600, R = rng(333);
  const geo = new THREE.SphereGeometry(.09, 6, 4), mat = new THREE.MeshStandardMaterial({ roughness: .6, emissive: '#3A2A10', emissiveIntensity: .25 }), im = new THREE.InstancedMesh(geo, mat, N), m = new THREE.Matrix4(), c = new THREE.Color();
  let n = 0; for (let i = 0; i < N * 3 && n < N; i++) { const q = pts[Math.floor(R() * pts.length)], a = R() * 6.283, r = 2 + R() * 34, x = q[0] + Math.cos(a) * r, z = q[1] + Math.sin(a) * r; if (blockedAt(x, z) || waterWet(x, z, null) > .05) continue; const y = (S.W ? S.W.hAt(x, z) : 0) + .12 + R() * .1, s = .7 + R() * .9; m.makeScale(s, s * .7, s); m.setPosition(x, y, z); im.setMatrixAt(n, m); im.setColorAt(n, c.set(cols[Math.floor(R() * cols.length)])); n++; }
  im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.userData.keep = 1; S.scene.add(im); P3.dawn = im;
  if (S.renderer) S.renderer.toneMappingExposure *= 1.12;
}
function dawnRunners() {
  const t = p3Poi('tomb'), a = S.av.position; if (!t) return; const list = [];
  for (let i = 0; i < 5; i++) { const g2 = i % 2 ? 'chica' : 'chico', o = buildHeroAvatar({ g: g2, age: 18, skin: ['#C99A72', '#B98A62', '#D6A57C'][i % 3], hair: '#2A1B14', outfit: ['#8A5A6A', '#6A5A44', '#3E5A6A', '#7A6A4A', '#5A6A7A'][i], anim: ['Jog_Fwd_Loop'] }); const x = t.x + (i - 2) * 1.6, z = t.z + 2 + i * .8; o.position.set(x, S.W ? S.W.hAt(x, z) : 0, z); S.scene.add(o); list.push({ o, tx: a.x + (i - 2) * 3, tz: a.z + 6 + i, life: 14 }); }
  P3.run = list;
}
function dawnTick(dt) { if (!P3.run) return; P3.run = P3.run.filter(r => { r.life -= dt; const o = r.o, dx = r.tx - o.position.x, dz = r.tz - o.position.z, d = Math.hypot(dx, dz); if (r.life <= 0 || d < 1) { S.scene.remove(o); const i = H3.npcs.indexOf(o); if (i >= 0) H3.npcs.splice(i, 1); return false; } const sp = Math.min(d, 4.2 * dt); o.position.x += dx / d * sp; o.position.z += dz / d * sp; o.position.y = S.W ? Math.max(0, S.W.hAt(o.position.x, o.position.z)) : 0; o.rotation.y = Math.atan2(dx, dz); return true; }); if (!P3.run.length) P3.run = null; }
function dawnScene() {
  return new Promise(res => { if (!S || !cineOk2()) return res(false); const M = P3.mod, L = M ? M.CROSS.dawn : []; dawnBuild(); dawnRunners(); p3Dark(0, 1);
    const t = p3Poi('tomb'), y = t && S.W ? S.W.hAt(t.x, t.z) : 0, a = S.av.position;
    const steps = L.map((tx, i) => ({ who: 'nar', t: tx, cam: i === 0 && t ? { p: [t.x + 10, y + 3, t.z + 14], l: [t.x, y + 1.6, t.z + 2], f: 38 } : i === 1 && t ? { p: [t.x + 3, y + 1.8, t.z + 7], l: [t.x, y + 1.1, t.z + 2.2], f: 40 } : { p: [a.x + 9, a.y + 5, a.z - 6], l: [a.x, a.y + 1, a.z + 8], f: 50 }, dur: 3 }));
    if (!cine({ cast: {}, steps, onDone: () => res(true) })) res(false); });
}
function diaryOpen(id, html) {
  const el = document.getElementById('v3sheet'); el.innerHTML = `<div class="inv hx sv-sheet diary"><div class="inv-h"><b>📔 Mi diario</b><button class="bag-x" aria-label="Cerrar">✕</button></div>${html}<div class="dia-b"><a class="dia-go" href="https://www.habitat-cfm.org/diario.html" target="_blank" rel="noopener">✍️ Escribir lo mío</a><button class="dia-ok" type="button">Seguir</button></div></div>`; el.hidden = false; S.joy.x = 0; S.joy.y = 0;
  return new Promise(res => { const close = () => { el.hidden = true; res(); }; el.querySelector('.bag-x').onclick = close; el.querySelector('.dia-ok').onclick = close; el.querySelector('.dia-go').onclick = () => { try { const p = G().P(); p.story = p.story || {}; p.story.diary = (p.story.diary || []).concat(id); G().save(); } catch (e) {} }; });
}
import('./story/hero_story.js').then(m => { P3.mod = m; }).catch(() => {});
async function vilBuild(scene, W) {
  if (!S.hx) return; const M = VIL.mod = await import('./story/villages.js').catch(() => null); import('./story/hero_story.js').then(m => { VIL.wask = m.WASK; }).catch(() => {}); if (!M || !S) return; const g = G(), R = rng(5150);
  const VN = { village: null, taller: 'Nazaret', roofhouse: 'Capernaúm', inn: 'Jericó', upper: 'Jerusalén' };
  VIL.list = (S.pois || []).filter(q => q.k in VN).map(q => ({ name: VN[q.k] || q.name || 'Aldea', x: q.x + (q.k === 'village' ? 0 : (q.side || 1) * -4), z: q.z, r: q.r })); VIL.npcs = [];
  const free = (x, z) => !blockedAt(x, z) && waterWet(x, z, null) < .05 && Math.abs(x) < XB * .9;
  const put = (look, x, z, face, role, extra) => { for (let t = 0; t < 30 && !free(x, z); t++) { x += (R() - .5) * 4; z += (R() - .5) * 4; } if (!free(x, z)) return null; const o = buildHeroAvatar(look); o.position.set(x, Math.max(0, W.hAt(x, z)), z); o.rotation.y = face; scene.add(o); const v = Object.assign({ id: role + '-' + VIL.npcs.length, o, x, z, role, name: M.VNAMES[Math.floor(R() * M.VNAMES.length)] }, extra || {}); VIL.npcs.push(v); return v; };
  const helpers = ['aguatera', 'pescador', 'vendedor'], margs = ['leproso', 'cobrador', 'mendiga'];
  VIL.list.forEach((vl, i) => { const ang = R() * 6.28, sk = ['#C99A72', '#B98A62', '#D6A57C'][i % 3];
    put({ g: 'chica', age: 18, skin: sk, hair: '#BDBDBD', outfit: '#6A5A7A', anim: ['M_Standing_Idle', 'M_Idle'] }, vl.x + Math.cos(ang) * 6, vl.z + Math.sin(ang) * 6, ang + Math.PI, 'anciana', { vil: vl.name, talk: i % M.TALKS.length });
    const h = helpers[i % 3]; put({ g: h === 'aguatera' ? 'chica' : 'chico', age: 18, skin: sk, hair: '#2A1B14', outfit: ['#8A6A44', '#5A6A7A', '#8E2E22'][i % 3], anim: ['M_Holding_Idle', 'M_Box_Idle'] }, vl.x + Math.cos(ang + 2) * 7, vl.z + Math.sin(ang + 2) * 7, ang + 2 + Math.PI, 'help', { vil: vl.name, help: h });
    const mg = margs[i % 3]; put({ g: mg === 'mendiga' ? 'chica' : 'chico', age: 18, skin: '#B98A62', hair: '#6A6A6A', outfit: '#8A8478', anim: ['M_Sad_Idle', 'Crouch_Idle_Loop', 'M_Kneeling_Idle'] }, vl.x + Math.cos(ang + 4) * 16, vl.z + Math.sin(ang + 4) * 16, ang + 4 + Math.PI, 'marg', { vil: vl.name, marg: mg }); });
  // testigos: uno o dos por etapa, cerca de una aldea de esa etapa (o del camino)
  g.REGIONS.forEach((Rg, r) => { const W2 = M.WITNESS[Rg.id]; if (!W2) return; const vl = VIL.list.find(v => v.r === r); const ns = Object.keys(g.NODES).filter(id => id.startsWith(Rg.id + '-n')).map(id => S.markers[id]).filter(Boolean); const base = vl ? [vl.x, vl.z] : ns.length ? [ns[0].position.x + 8, ns[0].position.z] : null; if (!base) return;
    W2.forEach((w, j) => { const ang = R() * 6.28, look = { mujer: { g: 'chica', outfit: '#8A5A6A' }, pastor: { g: 'chico', outfit: '#7A6A4A' }, pescador: { g: 'chico', outfit: '#3E5A6A' }, rico: { g: 'chico', outfit: '#6A2E5A' }, hombre: { g: 'chico', outfit: '#6A5A44' } }[w.look] || { g: 'chico', outfit: '#6A5A44' };
      put(Object.assign({ age: 18, skin: '#C99A72', hair: '#2A1B14', anim: ['M_Standing_Idle', 'M_Idle'] }, look), base[0] + Math.cos(ang) * (10 + j * 4), base[1] + Math.sin(ang) * (10 + j * 4), ang + Math.PI, 'wit', { vil: vl ? vl.name : null, wit: w, region: r, wid: Rg.id + j }); }); });
  // tensión hacia Jerusalén: más soldados en las últimas etapas
  ['jerusalen', 'cruz'].forEach(id => { const r = g.REGIONS.findIndex(x => x.id === id); if (r < 0) return; Object.keys(g.NODES).filter(k => k.startsWith(id + '-n')).forEach((k, j) => { const [x, z] = toV(g.NODES[k].x, g.NODES[k].y), sd = j % 2 ? 1 : -1; put({ g: 'chico', age: 18, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#8E2E22', anim: ['M_Standing_Idle', 'M_Holding_Idle'] }, x + sd * 5, z - 2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, 'sold', { vil: null }); }); });
}
function vilNearNpc() { if (!VIL.npcs.length) return null; const a = S.av.position; let best = null, bd = 2.4 * 2.4; for (const v of VIL.npcs) { const d = (v.x - a.x) ** 2 + (v.z - a.z) ** 2; if (d < bd) { bd = d; best = v; } } return best; }
function vilState() { const p = G().P(); p.vil = p.vil || { greet: {}, help: {}, talk: {}, dec: {}, wit: {} }; ['greet', 'help', 'talk', 'dec', 'wit'].forEach(k => p.vil[k] = p.vil[k] || {}); return p.vil; }
function vilLabel(v) { const st = vilState(), d = vday(); if (v.role === 'sold') return 'Saludar'; if (v.role === 'wit') return st.wit[v.wid] ? 'Volver a escuchar' : 'Escuchar su historia'; if (st.greet[v.id] !== d) return 'Saludar · Shalom';
  if (v.role === 'anciana') return st.talk[v.id] ? 'Charlar' : 'Escucharla'; if (v.role === 'help') { const h = st.help[v.id]; return h && h !== d ? 'Ver cómo sigue' : h === d ? 'Charlar' : VIL.mod.HELPS[v.help][0]; } if (v.role === 'marg') return st.dec[v.id] ? 'Charlar' : 'Acercarte'; return 'Charlar'; }
function vilSheet(html, after) { const el = document.getElementById('v3sheet'); el.innerHTML = `<div class="inv hx sv-sheet vil">${html}</div>`; el.hidden = false; S.joy.x = 0; S.joy.y = 0; const x = el.querySelector('.bag-x'); if (x) x.onclick = () => { el.hidden = true; }; after && after(el); return el; }
function vilAct(v) {
  const M = VIL.mod; if (!M) return; const st = vilState(), d = vday(), nm = G().P().name || '', look = v.o; try { look.lookAt(S.av.position.x, look.position.y, S.av.position.z); } catch (e) {}
  if (v.role === 'sold') { h3npcPlay(v.o, ['M_Lengthy_Head_Nod'], 2); svToast('🛡️ Soldado: ' + M.SOLDIER_LINES[Math.floor(Math.random() * M.SOLDIER_LINES.length)]); behav('saludos'); return; }
  if (v.role === 'wit') { const w = v.wit, first = !st.wit[v.wid]; st.wit[v.wid] = d; if (first) { axGain('gent', 2); axGain('sab', 1); behav('testigos'); } G().save(); talkGo(v.o, 4);
    if (cineWit(v, w, first)) return;
    vilSheet(`<div class="inv-h"><b>${esc(w.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">Testigo · cuenta lo que vivió</small>${w.t.map(t => `<p class="vil-p">${esc(t)}</p>`).join('')}`); try { G().vo(w.t.join(' '), w.look === 'mujer' ? 'mujer' : 'varon'); } catch (e) {} return; }
  if (st.greet[v.id] !== d) { st.greet[v.id] = d; const marg = v.role === 'marg'; repAdd(v.vil, marg ? 3 : 1); axGain('gent', marg ? 2 : 1); behav('saludos'); if (marg) behav('saludosMarginados'); glowAdd(marg ? 3 : 1, 'saludo'); G().save(); h3do(['M_Waving', 'Waving'], 2, .4); h3npcPlay(v.o, ['M_Waving', 'M_Thankful'], 2.5);
    svToast(marg ? `👋 Shalom. ${M.MARGINAL[v.marg].name}: ${M.MARGINAL[v.marg].greet}` : `👋 Shalom, ${v.name}. ${repStars(v.vil) >= 4 ? '¡Qué alegría verte, ' + nm + '!' : 'Te devuelve el saludo.'}`); return; }
  if (v.role === 'anciana') { const T = M.TALKS[v.talk]; if (cineTalk(v, T, st, d)) return; const el = vilSheet(`<div class="inv-h"><b>${esc(v.name)}, una anciana de ${esc(v.vil)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p">${esc(T[0])}</p><div class="vil-o"><button data-r="kind">Escucharla hasta el final</button><button data-r="mid">Decirle que estás apurado</button><button data-r="cold">Seguir de largo</button></div>`);
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const r = b.dataset.r; el.hidden = true; if (r === 'kind') { if (st.talk[v.id] !== d) { repAdd(v.vil, 3); axGain('gent', 3); axGain('pac', 1); behav('charlasCompletas'); } st.talk[v.id] = d; svToast('👵 ' + v.name + ': ' + T[1]); } else if (r === 'mid') { svToast(v.name + ' asiente: «Andá tranquilo, otro día seguimos».'); } else { repAdd(v.vil, -1); svToast(v.name + ' se queda mirando cómo te vas.'); } G().save(); }); return; }
  if (v.role === 'help') { const H = M.HELPS[v.help], h = st.help[v.id]; if (h && h !== d) { st.help[v.id] = d; repAdd(v.vil, 2); axGain('amor', 1); behav('revisitas'); G().save(); svToast(`🤝 Volviste a ver a ${v.name}: «¡Te acordaste de mí! Estoy mejor, gracias por volver».`); return; } if (h === d) { svToast(`${v.name}: ${H[2]}`); return; }
    if (S.vilBusy) return; S.vilBusy = 1; svToast('⏳ ' + H[0] + '…'); h3do(['M_Reaching_Out', 'PickUp_Table', 'M_Picking_Up'], 2.6, .8); setTimeout(() => { S.vilBusy = 0; if (!S) return; const a = S.av.position; if ((v.x - a.x) ** 2 + (v.z - a.z) ** 2 > 16) { svToast('Te alejaste antes de terminar.'); return; } st.help[v.id] = d; repAdd(v.vil, 2); axGain('amor', 2); axGain('gent', 1); behav('ayudas'); glowAdd(3, 'ayuda'); G().save(); h3npcPlay(v.o, ['M_Thankful', 'M_Cheering'], 2.5); svToast('🤝 ' + H[1] + ' ' + v.name + ': ' + H[2]); }, 2600); return; }
  if (v.role === 'marg') { const D = M.DECIDE[v.marg], info = M.MARGINAL[v.marg]; if (st.dec[v.id]) { svToast(`${info.name}: ${st.dec[v.id] === 'kind' ? 'Desde que te sentaste conmigo, la gente del pueblo me saluda.' : 'Gracias por pasar.'}`); return; }
    if (cineMarg(v, D, info, st)) return;
    const el = vilSheet(`<div class="inv-h"><b>${esc(info.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">${esc(info.note)}</small><p class="vil-p">${esc(D.q)}</p><div class="vil-o">${D.o.map(([t, r]) => `<button data-r="${r}">${esc(t)}</button>`).join('')}</div>`);
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const r = b.dataset.r, s2 = svP(); el.hidden = true; st.dec[v.id] = r; const sp = G().P(); sp.story = sp.story || {}; sp.story.att = sp.story.att || { esc: 0, zel: 0, rom: 0 };
      if (r === 'kind') { if (v.marg === 'leproso' && (s2.inv.bread || 0) > 0) svAdd('bread', -1); repAdd(v.vil, fv('gen') >= 10 ? 8 : 4); axGain('amor', 3); axGain('gen', 2); glowAdd(8, 'compasion'); sp.story.att.zel++; sp.story.att.esc++; behav('compasion'); svToast('💛 Elegiste la compasión. Tus compañeros lo notaron.'); }
      else if (r === 'mid') { repAdd(v.vil, 1); axGain('gen', 1); svToast('Le dejaste algo. Es un comienzo.'); }
      else { repAdd(v.vil, -2); sp.story.att.zel--; svToast('Seguiste de largo. Asher se quedó callado.'); }
      G().save(); }); return; }
}

// testigos, ancianas y decisiones en formato cinemático (estándar de la parte 2)
// dones: se miden solo con elecciones de rol (respuestas en conversaciones y preguntas de la fogata), nunca con acciones
const DONL = { maestro: 'Maestro', pastor: 'Pastor', evangelista: 'Evangelista', profeta: 'Profeta', apostol: 'Apóstol', misericordia: 'Misericordia', servicio: 'Servicio' };
function INCL(k) { try { const p = G().P(); p.dones = p.dones || {}; p.dones[k] = (p.dones[k] || 0) + 1; G().save(); } catch (e) {} }
function donTop() { const d = G().P().dones || {}; let b = null; for (const k in d) if (DONL[k] && (!b || d[k] > d[b])) b = k; return b; }
function cineWit(v, w, first) {
  const steps = w.t.map((t, i) => ({ who: 'w', t, g: i === 1 ? 'point' : null }));
  if (first) steps.push({ who: 'w', ask: '¿Querés decirme algo?', o: (VIL.wask || []).map(([t, k, r]) => ({ t, fn: () => INCL(k), then: [{ who: 'w', t: r, g: 'nod' }] })) });
  return cine({ cast: { w: { o: v.o, name: w.name, voice: w.look === 'mujer' ? 'mujer' : 'varon' } }, steps });
}
function cineTalk(v, T, st, d) {
  const kind = () => { if (st.talk[v.id] !== d) { repAdd(v.vil, 3); axGain('gent', 3); axGain('pac', 1); behav('charlasCompletas'); } st.talk[v.id] = d; G().save(); };
  return cine({ cast: { a: { o: v.o, name: v.name, sub: 'anciana de ' + v.vil, voice: 'mujer', pitch: .85, rate: .9 } }, steps: [{ who: 'a', t: T[0] }, { who: 'a', ask: '…', o: [
    { t: 'Me quedo a escucharla hasta el final.', quiet: true, fn: kind, then: [{ who: 'a', t: T[1], g: 'nod' }] },
    { t: 'Perdón, estoy apurado.', then: [{ who: 'a', t: 'Andá tranquilo, otro día seguimos.' }] },
    { t: 'Seguir de largo.', quiet: true, fn: () => { repAdd(v.vil, -1); G().save(); }, then: [{ who: 'nar', t: v.name + ' se queda mirando cómo te vas.' }] }] }] });
}
const MARG_R = { leproso: 'Hace años que nadie se sienta conmigo. Que Dios te bendiga.', cobrador: 'Todos me cobran a mí con la mirada. Vos no. Gracias.', mendiga: 'Mi casa es humilde, pero pasá a tomar un poco de agua.' };
function cineMarg(v, D, info, st) {
  const pick = r => () => { const s2 = svP(); st.dec[v.id] = r; const sp = G().P(); sp.story = sp.story || {}; sp.story.att = sp.story.att || { esc: 0, zel: 0, rom: 0 };
    if (r === 'kind') { if (v.marg === 'leproso' && (s2.inv.bread || 0) > 0) svAdd('bread', -1); repAdd(v.vil, fv('gen') >= 10 ? 8 : 4); axGain('amor', 3); axGain('gen', 2); glowAdd(8, 'compasion'); sp.story.att.zel++; sp.story.att.esc++; behav('compasion'); }
    else if (r === 'mid') { repAdd(v.vil, 1); axGain('gen', 1); } else { repAdd(v.vil, -2); sp.story.att.zel--; } G().save(); };
  const R = { kind: [{ who: 'm', t: MARG_R[v.marg] || 'Gracias.', g: 'nod' }, { who: 'nar', t: 'Elegiste la compasión. Tus compañeros lo notaron.' }], mid: [{ who: 'm', t: 'Gracias. Es más de lo que me dan muchos.' }], cold: [{ who: 'nar', t: 'Seguiste de largo. Asher se quedó callado.' }] };
  return cine({ cast: { m: { o: v.o, name: info.name, voice: v.marg === 'mendiga' ? 'mujer' : 'varon', pitch: .9 } }, steps: [{ who: 'nar', t: info.note }, { who: 'm', t: info.greet }, { who: 'nar', ask: D.q, o: D.o.map(([t, r]) => ({ t, fn: pick(r), quiet: r === 'cold', then: R[r] })) }] });
}

// pregunta de la fogata: una por día de juego; los compañeros se sientan con vos junto al fuego
async function fireTalk() {
  try { if (!S || !S.hx || !cineOk() || sheetUp()) return; const p = G().P(), d = vday(); p.story = p.story || {}; const st = p.story; if (st.fireDay === d) return;
    const M = await import('./story/hero_story.js'); const Q = M.FIREQ, done = st.fireQ || [], i = Q.findIndex((q, j) => !done.includes(j)); if (i < 0) return;
    const [who, q, opts, rep] = Q[i]; st.fireDay = d;
    cine({ cast: { [who]: {} }, steps: [{ who: 'nar', t: 'Se hace de noche. Tus compañeros se sientan con vos junto al fuego.' }, { who, ask: q, o: opts.map(([t, k]) => ({ t, fn: () => { INCL(k); st.fireQ = (st.fireQ || []).concat(i); G().save(); }, then: [{ who, t: rep, g: 'nod' }] })) }] });
  } catch (e) { console.warn('fogata', e); }
}
function vilTick(dt) {
  if (!S || !S.hx || !VIL.list.length) return; VIL.t -= dt; if (VIL.t > 0) return; VIL.t = .5; const v = vilNearest(24), nm = v ? v.name : null;
  if (nm !== VIL.cur) { VIL.cur = nm; if (v && VIL.mod) vilBanner(v); }
  // con reputación alta te saludan primero (una vez por día)
  const n = vilNearNpc(); if (n && n.vil && n.role !== 'sold' && repStars(n.vil) >= 4) { const st = vilState(), d = vday(); if (VIL.greetT[n.id] !== d) { VIL.greetT[n.id] = d; svToast(`👋 ${n.role === 'marg' ? VIL.mod.MARGINAL[n.marg].name : n.name}: ¡Shalom, ${G().P().name || 'amigo'}!`); if (fv('gent') >= 40 && Math.random() < .3) { svAdd('bread', 1); setTimeout(() => svToast('🍞 Te regalaron un pan.'), 1800); } if ((repStars(n.vil) >= 5 || fv('gent') >= 50) && Math.random() < .35) setTimeout(() => secretHint(), 3200); } }
}
function vilBanner(v) { let el = document.getElementById('v3vil'); if (!el) { el = document.createElement('div'); el.id = 'v3vil'; el.className = 'v3vil'; document.body.appendChild(el); } const st = repStars(v.name); el.innerHTML = `<b>${esc(v.name)}</b><span>${esc(VIL.mod.STARS_TXT[st - 1])}</span><i>${'★'.repeat(st)}${'☆'.repeat(5 - st)}</i>`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(vilBanner.t); vilBanner.t = setTimeout(() => el.classList.remove('on'), 3800); behav('visitasAldea'); }

/* ===================== LUGARES SECRETOS (Hero): 12, con entrada disimulada y objetos únicos ===================== */
/* ---------- el material del alumno en el mundo (canales 1 y 2): objetos para mirar y gente con segunda charla ---------- */
const MAT = { mod: null, objs: [], npcs: [] };
function matP() { const p = G().P(); p.mat = p.mat || {}; p.mat.seen = p.mat.seen || {}; p.mat.talk = p.mat.talk || {}; p.mat.sabi = p.mat.sabi || 0; return p.mat; }
// Sabiduría del material: se guarda aparte hasta que se publique el atributo Sabiduría separado de Alegría
function matSab(n) { const pm = matP(); pm.sabi += n; pm.sabiM = (pm.sabiM || 0) + n; axGain('sab', n); }
function matMesh(k) {
  const g = new THREE.Group(), M = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r ?? .92, metalness: 0 }), st = M('#9A9282'), wd = M('#6E5034');
  const add = (geo, m, x, y, z, s) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (s) o.scale.set(...s); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  if (k === 'manger') { add(new THREE.BoxGeometry(1.3, .5, .6), st, 0, .25, 0); add(new THREE.BoxGeometry(1.1, .12, .42), M('#3A3026'), 0, .47, 0); for (let i = 0; i < 9; i++) { const h = add(new THREE.CylinderGeometry(.012, .012, .5, 3), M('#D9B866'), (Math.random() - .5) * .9, .52, (Math.random() - .5) * .3); h.rotation.z = 1.4 + Math.random() * .3; } }
  else if (k === 'oven') { add(new THREE.SphereGeometry(.7, 16, 10, 0, 6.29, 0, 1.6), M('#B08A60'), 0, 0, 0); add(new THREE.CircleGeometry(.22, 12), M('#2A1E14'), 0, .28, .66).rotation.y = 0; }
  else if (k === 'milestone') { add(new THREE.CylinderGeometry(.22, .28, 1.3, 10), st, 0, .65, 0); add(new THREE.BoxGeometry(.5, .08, .5), st, 0, .02, 0); }
  else if (k === 'mill') { add(new THREE.CylinderGeometry(.42, .45, .16, 18), M('#7A746A'), 0, .08, 0); add(new THREE.CylinderGeometry(.4, .4, .14, 18), M('#857E72'), 0, .24, 0); add(new THREE.CylinderGeometry(.03, .03, .34, 6), wd, .26, .42, 0); }
  else if (k === 'doves') { add(new THREE.BoxGeometry(1.2, .7, .6), wd, 0, .35, 0); for (let i = 0; i < 3; i++) { add(new THREE.SphereGeometry(.09, 10, 8), M('#D8D2C8'), -.35 + i * .35, .8, 0, [1, .8, 1.5]); } add(new THREE.BoxGeometry(1.4, .06, .8), M('#B89A6A'), 0, 1.2, 0); [-.6, .6].forEach(x => add(new THREE.CylinderGeometry(.03, .03, 1.2, 6), wd, x, .6, .35)); }
  else if (k === 'mezuza') { add(new THREE.BoxGeometry(.12, 1.8, .12), wd, 0, .9, 0); add(new THREE.BoxGeometry(.07, .22, .05), M('#C9A060', .5), .02, 1.35, .08); }
  else if (k === 'lamb') { add(new THREE.SphereGeometry(.32, 12, 10), M('#F2EEE4', 1), 0, .5, 0, [1.3, .9, .9]); add(new THREE.SphereGeometry(.14, 10, 8), M('#3A3026'), .42, .62, 0); [[-.22, -.14], [-.22, .14], [.22, -.14], [.22, .14]].forEach(([x, z]) => add(new THREE.CylinderGeometry(.035, .035, .32, 5), M('#3A3026'), x, .16, z)); }
  else if (k === 'cairn') { for (let i = 0; i < 7; i++) add(new THREE.DodecahedronGeometry(.22 - i * .02, 0), st, (Math.random() - .5) * .2, .15 + i * .2, (Math.random() - .5) * .2); }
  else if (k === 'loaves') { for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(.16, 10, 8), M('#B8A486'), Math.cos(i * 1.3) * .35, .08, Math.sin(i * 1.3) * .35, [1.1, .55, 1]); }
  else if (k === 'boat') { const h = add(new THREE.CylinderGeometry(.9, .9, 4.2, 14, 1, true, 0, Math.PI), wd, 0, .55, 0); h.rotation.z = Math.PI / 2; h.rotation.y = Math.PI / 2; h.scale.set(1, 1, .55); h.material = h.material.clone(); h.material.side = THREE.DoubleSide; add(new THREE.BoxGeometry(.06, .06, 3.6), wd, 0, .5, 0); }
  else if (k === 'nets') { [-.6, .6].forEach(x => add(new THREE.CylinderGeometry(.04, .04, 1.5, 6), wd, x, .75, 0)); const n = add(new THREE.PlaneGeometry(1.2, 1.1, 8, 8), new THREE.MeshStandardMaterial({ color: '#C9B48A', wireframe: true }), 0, .85, 0); n.material.side = THREE.DoubleSide; }
  else if (k === 'jars') { for (let i = 0; i < 6; i++) { const j = add(new THREE.CylinderGeometry(.22, .17, .75, 12), st, (i % 3 - 1) * .55, .38, (i < 3 ? -.3 : .3)); add(new THREE.TorusGeometry(.2, .03, 6, 14), st, j.position.x, .76, j.position.z).rotation.x = Math.PI / 2; } }
  else if (k === 'roof') { add(new THREE.BoxGeometry(2.2, .14, 2.2), M('#8A6A44'), 0, 2.2, 0); add(new THREE.CylinderGeometry(.42, .42, .18, 12), M('#2A1E14'), .2, 2.22, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => add(new THREE.BoxGeometry(.18, 2.2, .18), M('#9A8A70'), x, 1.1, z)); }
  else if (k === 'baskets') { for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; add(new THREE.CylinderGeometry(.18, .13, .22, 10, 1, true), M('#A8864E'), Math.cos(a) * .9, .11, Math.sin(a) * .9); add(new THREE.SphereGeometry(.1, 8, 6), M('#C8A060'), Math.cos(a) * .9, .2, Math.sin(a) * .9, [1, .6, 1]); } }
  else if (k === 'soils') { [['#B8A486', .1], ['#8E877A', .2], ['#5E6A3A', .25], ['#5A4030', .1]].forEach(([c, h], i) => { add(new THREE.BoxGeometry(.9, h, 1.1), M(c), (i - 1.5) * .95, h / 2, 0); }); for (let i = 0; i < 6; i++) add(new THREE.ConeGeometry(.05, .35, 5), M('#7A9A3A'), 1.2 + (i % 3) * .2 - .2, .4, (i < 3 ? -.25 : .25)); }
  else if (k === 'tree') { add(new THREE.CylinderGeometry(.22, .32, 2.6, 8), M('#6E5A44'), 0, 1.3, 0); for (let i = 0; i < 5; i++) add(new THREE.IcosahedronGeometry(.9, 1), M('#5E7A3A'), Math.cos(i * 1.3) * .8, 2.9 + (i % 2) * .4, Math.sin(i * 1.3) * .8); }
  else if (k === 'table') { add(new THREE.BoxGeometry(1.6, .08, .8), wd, 0, .45, 0); [[-.7, -.3], [.7, -.3], [-.7, .3], [.7, .3]].forEach(([x, z]) => add(new THREE.BoxGeometry(.06, .45, .06), wd, x, .22, z)); add(new THREE.CylinderGeometry(.18, .18, .03, 14), M('#E8D2A0'), -.4, .5, 0); add(new THREE.CylinderGeometry(.06, .04, .16, 10), M('#B88A3A', .4), .35, .57, 0); add(new THREE.ConeGeometry(.12, .1, 8), M('#5E8A3A'), 0, .53, .2); }
  else if (k === 'press') { add(new THREE.CylinderGeometry(.9, .95, .5, 20), st, 0, .25, 0); add(new THREE.CylinderGeometry(.4, .4, .35, 16), M('#857E72'), .1, .65, 0).rotation.z = Math.PI / 2; add(new THREE.BoxGeometry(2.2, .12, .12), wd, .1, .65, 0); }
  else if (k === 'sign') { add(new THREE.BoxGeometry(.08, 1.6, .08), wd, 0, .8, 0); add(new THREE.BoxGeometry(1.1, .5, .04), M('#E8DCC0'), 0, 1.45, .05); [0, 1, 2].forEach(i => add(new THREE.BoxGeometry(.9, .03, .01), M('#3A2A1A'), 0, 1.6 - i * .14, .075)); }
  else if (k === 'curtain') { const c = add(new THREE.PlaneGeometry(1.4, 2.2, 6, 10), new THREE.MeshStandardMaterial({ color: '#6A1E2E', roughness: .9, side: THREE.DoubleSide }), 0, 1.3, 0); const c2 = add(new THREE.PlaneGeometry(1.4, 2.2, 6, 10), c.material, .25, 1.3, .1); c.rotation.z = .05; c2.rotation.z = -.12; add(new THREE.BoxGeometry(1.8, .1, .1), M('#C9A060', .4), 0, 2.45, 0); }
  else if (k === 'linens') { add(new THREE.BoxGeometry(1.8, .4, .7), st, 0, .2, 0); const l = add(new THREE.BoxGeometry(1.4, .06, .4), M('#EEE6D6'), -.1, .43, 0); l.rotation.y = .1; add(new THREE.BoxGeometry(.3, .08, .22), M('#F4EEE2'), .7, .44, .1); }
  else if (k === 'embers') { for (let i = 0; i < 8; i++) add(new THREE.DodecahedronGeometry(.14, 0), st, Math.cos(i / 8 * 6.28) * .5, .07, Math.sin(i / 8 * 6.28) * .5); add(new THREE.SphereGeometry(.28, 10, 6), new THREE.MeshStandardMaterial({ color: '#3A1A0A', emissive: '#FF5A1A', emissiveIntensity: .9, roughness: 1 }), 0, .05, 0, [1, .35, 1]); add(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(.05, .3, 4, 8) : new THREE.CylinderGeometry(.05, .05, .4, 8), M('#B8C4CC', .4), .15, .2, 0).rotation.z = Math.PI / 2; }
  return g;
}
async function matBuild(scene, W) {
  if (!S.hx) return; const M = MAT.mod = await import('./story/material.js').catch(() => null); if (!M || !S) return; MAT.objs = []; MAT.npcs = []; const R = rng(8800), pm = matP();
  const used = VIL.npcs.map(v => [v.x, v.z]).concat(SEC.list.map(e => [e.x, e.z]));
  const ok = (x, z) => !blockedAt(x, z) && waterWet(x, z, null) < .05 && Math.abs(x) < XB * .9 && W.dAt(x, z) > 2.2 && !used.some(([a, b]) => (a - x) ** 2 + (b - z) ** 2 < 16);
  const spot = d => { const poi = (S.pois || []).find(q => q.r === d.r && q.k === d.near); if (!poi) return null; for (let t = 0; t < 220; t++) { const q = poi.k === 'river' ? poi.pts[Math.floor(R() * poi.pts.length)] : [poi.x, poi.z], a = R() * 6.283, rr = poi.k === 'lake' ? 33 + R() * 16 : (poi.k === 'river' ? 4 : 8) + R() * (t < 60 ? 12 : 26), x = q[0] + Math.cos(a) * rr, z = q[1] + Math.sin(a) * rr; if (ok(x, z)) { used.push([x, z]); return [x, z]; } } return null; };
  M.OBJS.forEach(d => { const p = spot(d); if (!p) return; const [x, z] = p, g = matMesh(d.k); g.position.set(x, Math.max(0, W.hAt(x, z)), z); g.rotation.y = R() * 6.28;
    const ring = new THREE.Mesh(new THREE.RingGeometry(.8, .9, 32), new THREE.MeshBasicMaterial({ color: '#FFE39A', transparent: true, opacity: .45, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.visible = !pm.seen[d.id]; g.add(ring);
    g.userData.keep = 1; scene.add(g); MAT.objs.push({ d, x, z, g, ring }); phCyl(x, z, .45); });
  try { teoBuild(scene, W, R, ok, used); } catch (e) { console.warn('teofilo', e); }
  try { pergBuild(scene, W, rng(8811), used); } catch (e) { console.warn('pergaminos', e); }
  try { memBuild(scene, W, rng(8822), ok, used); } catch (e) { console.warn('versículos', e); }
  try { vidaButton(); } catch (e) {}
  try { jueBuild(scene, W, spot); sieteBuild(scene, W, spot); senBuild(scene, W, rng(8833), used); } catch (e) { console.warn('minijuegos', e); }
  (M.ESC || []).forEach(d => { const p = spot(d); if (!p) return; const [x, z] = p, o = buildHeroAvatar(Object.assign({ anim: ['M_Standing_Idle', 'M_Idle'] }, d.look)); o.position.set(x, Math.max(0, W.hAt(x, z)), z); o.rotation.y = R() * 6.28; scene.add(o); const lb = textSprite('!', true); lb.scale.multiplyScalar(.35); lb.position.set(0, 2.25, 0); lb.visible = !(pm.esc && pm.esc[d.id] != null); o.add(lb); MAT.npcs.push({ d: { id: 'esc-' + d.id, name: d.name, sub: d.sub, esc: d }, x, z, o, lb }); });
  M.GENTE.forEach(d => { const p = spot(d); if (!p) return; const [x, z] = p, o = buildHeroAvatar(Object.assign({ anim: ['M_Standing_Idle', 'M_Idle'] }, d.look)); o.position.set(x, Math.max(0, W.hAt(x, z)), z); o.rotation.y = R() * 6.28; scene.add(o); MAT.npcs.push({ d, x, z, o }); });
}
function matNear() { const a = S.av.position, r2 = 2.4 * 2.4; for (const e of MAT.npcs) if ((e.x - a.x) ** 2 + (e.z - a.z) ** 2 < r2) return e.d.esc ? { k: 'mates', e, label: 'Hablar · ' + e.d.name } : e.d.teo ? { k: 'mateo', e, label: 'Hablar · Teófilo' } : { k: 'matp', e, label: 'Hablar · ' + e.d.name };
  for (const e of MAT.objs) if ((e.x - a.x) ** 2 + (e.z - a.z) ** 2 < r2) return { k: 'mato', e, label: 'Mirar' }; return jueNear() || memNear() || pergNear(); }
function matObj(e) {
  const pm = matP(), d = e.d, first = !pm.seen[d.id]; pm.seen[d.id] = vday(); if (e.ring) e.ring.visible = false;
  if (first) { matSab(1); glowAdd(1, 'mirar'); behav('objetos'); G().save(); }
  vilSheet(`<div class="inv-h"><b>${esc(d.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p">${esc(d.t)}</p><small class="vil-k mat-src">📖 Del material · ${esc(d.src)}</small>${first ? '<small class="vil-k">+1 Sabiduría</small>' : ''}`);
  h3do(['M_Kneeling_Inspecting', 'M_Looking', 'M_Thinking'], 2.4);
}
function matTalk(e) {
  const pm = matP(), d = e.d, n = pm.talk[d.id] || 0, lines = n === 0 ? d.t1 : d.t2; pm.talk[d.id] = Math.min(2, n + 1);
  if (n === 1) { matSab(2); behav('segundasCharlas'); } G().save(); try { e.o.lookAt(S.av.position.x, e.o.position.y, S.av.position.z); } catch (er) {}
  const done = () => { if (n === 0) svToast('💬 Si volvés a hablarle, te va a contar algo más.'); else if (n === 1) svToast('📖 +2 Sabiduría · ' + d.src); };
  if (cineOk() && e.o.userData && e.o.userData.h3) { try { cine({ cast: { m: { name: d.name.replace(/^(Un|Una) /, ''), sub: d.sub, o: e.o } }, steps: lines.map(t => ({ who: 'm', t })), onDone: done }); return; } catch (er) {} }
  vilSheet(`<div class="inv-h"><b>${esc(d.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">${esc(d.sub)}</small>${lines.map(t => `<p class="vil-p">${esc(t)}</p>`).join('')}`); talkGo(e.o, 4); done();
}
/* ---------- Teófilo, el viajero preguntón (canal 8), y la fogata de reflexión con diario privado (canal 7) ---------- */
function matStageAt(z) { const g = G(); for (let r = 0; r < g.REGIONS.length; r++) { const [a, b] = regionZ(g, r); if (z <= a + 20 && z >= b - 20) return r; } return 0; }
function teoBuild(scene, W, R, ok, used) {
  const M = MAT.mod; if (!M.TEO) return;
  M.TEO.forEach(d => { const cands = (S.pois || []).filter(q => q.r === d.r).sort((a, b) => (/lake|shore|river/.test(a.k) ? 1 : 0) - (/lake|shore|river/.test(b.k) ? 1 : 0)); let p = null;
    for (const poi of cands) for (let t = 0; t < 200 && !p; t++) { const q = poi.k === 'river' ? poi.pts[Math.floor(R() * poi.pts.length)] : [poi.x, poi.z], a = R() * 6.283, rr = 6 + R() * (t < 80 ? 10 : 22), x = q[0] + Math.cos(a) * rr, z = q[1] + Math.sin(a) * rr; if (ok(x, z)) p = [x, z]; }
    if (!p) return; used.push(p); const [x, z] = p, o = buildHeroAvatar({ g: 'chico', age: 18, skin: '#D6A57C', hair: '#3A2412', outfit: '#E8E2D2', anim: ['M_Standing_Idle', 'M_Idle'] }); o.position.set(x, Math.max(0, W.hAt(x, z)), z); o.rotation.y = R() * 6.28; scene.add(o);
    const lb = textSprite('Teófilo', true); lb.scale.multiplyScalar(.4); lb.position.set(0, 2.2, 0); o.add(lb); MAT.npcs.push({ d: { id: 'teo' + d.r, name: 'Teófilo', sub: 'un griego que investiga', teo: d }, x, z, o }); });
}
function matTeo(e) {
  const M = MAT.mod, pm = matP(), d = e.d.teo; pm.teo = pm.teo || {}; const first = !Object.keys(pm.teo).length, seen = pm.teo[d.r] != null;
  try { e.o.lookAt(S.av.position.x, e.o.position.y, S.av.position.z); } catch (er) {}
  const cast = { t: { name: 'Teófilo', sub: 'un griego que investiga', o: e.o } };
  if (seen) { if (cineOk()) cine({ cast, steps: [{ who: 't', t: d.r === 8 ? M.TEO_END[1] : 'Sigo pensando en lo que me contaste. Nos vemos en la próxima etapa.' }] }); else svToast('Teófilo: sigo pensando en lo que me contaste.'); return; }
  const intro = first ? M.TEO_INTRO.map(t => ({ who: 't', t })) : [{ who: 't', t: '¡Otra vez nos cruzamos! Tengo una pregunta nueva.' }];
  const after = (ok, i) => () => { pm.teo[d.r] = i; matSab(ok ? 3 : 1); behav('teofilo'); G().save(); };
  const expl = ok => [{ who: 't', t: ok ? 'Tiene sentido. Lo voy a anotar.' : 'Mmm, no me cierra del todo. Te cuento lo que encontré yo.' }].concat(d.e.map(t => ({ who: 't', t })), d.r === 8 ? M.TEO_END.map(t => ({ who: 't', t })) : [], [{ who: 'nar', t: '📖 ' + d.src + (ok ? ' · +3 Sabiduría' : ' · +1 Sabiduría') }]);
  const opts = d.o.map(([t, ok], i) => ({ t, fn: after(ok, i), then: expl(!!ok) }));
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  if (cineOk()) { cine({ cast, steps: intro.concat([{ who: 't', ask: d.q, o: opts }]) }); return; }
  vilSheet(`<div class="inv-h"><b>Teófilo</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p">${esc(d.q)}</p><div class="vil-o">${opts.map((o, i) => `<button data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`, el => el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const o = opts[+b.dataset.i]; o.fn(); vilSheet(`<div class="inv-h"><b>Teófilo</b><button class="bag-x" aria-label="Cerrar">✕</button></div>${o.then.map(s => `<p class="vil-p">${esc(s.t)}</p>`).join('')}`); }));
}
// diario privado: queda solo en este aparato (localStorage); no se sube al perfil ni lo ve nadie
function diaryKey() { return 'tsp:diario:' + ((G().P() || {}).id || 'p'); }
function diaryGet() { try { return JSON.parse(localStorage.getItem(diaryKey()) || '[]'); } catch (e) { return []; } }
function diaryPut(L) { try { localStorage.setItem(diaryKey(), JSON.stringify(L.slice(-200))); return true; } catch (e) { return false; } }
function matReflex() {
  const M = MAT.mod; if (!M || !M.FOGATA) return; const r = matStageAt(S.av.position.z), d = M.FOGATA.find(x => x.r === r) || M.FOGATA[0], pm = matP(), day = vday(), L = diaryGet();
  S.sit = true; S.joy.x = 0; S.joy.y = 0; const rn = (G().REGIONS[r] || {}).name || '';
  const reward = () => { pm.fire = pm.fire || {}; if (pm.fire[r] !== day) { pm.fire[r] = day; axGain('paz', 1); glowAdd(2, 'fogata'); behav('fogataReflexion'); G().save(); return true; } return false; };
  const past = L.filter(x => x.r === r).slice(-5).reverse();
  vilSheet(`<div class="inv-h"><b>🔥 Junto al fuego</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">Para pensar a solas con Dios · ${esc(rn)}</small><p class="vil-p">${esc(d.q)}</p>
    <textarea class="diary-t" rows="4" maxlength="1200" placeholder="Si querés, escribilo acá. Es tu diario privado: queda solo en este aparato y nadie lo lee."></textarea>
    <div class="vil-o"><button data-a="save">Guardar en mi diario</button><button data-a="quiet">Quedarme en silencio</button></div>
    ${past.length ? `<details class="diary-past"><summary>Lo que escribiste antes (${past.length})</summary>${past.map(x => `<p class="vil-p"><small>${esc(x.d)}</small><br>${esc(x.t)}</p>`).join('')}</details>` : ''}<small class="vil-k mat-src">📖 Del material · ${esc(d.src)}</small>`, el => {
    const close = () => { S.sit = false; }; const x = el.querySelector('.bag-x'); if (x) x.addEventListener('click', close);
    el.querySelector('[data-a="save"]').onclick = () => { const t = el.querySelector('.diary-t').value.trim(); if (!t) { svToast('Escribí algo o elegí quedarte en silencio.'); return; } L.push({ r, d: day, t }); const okS = diaryPut(L); el.hidden = true; close(); const got = reward(); svToast(okS ? '📓 Lo guardaste en tu diario.' + (got ? ' +1 Paz' : '') : 'No se pudo guardar en este aparato.'); };
    el.querySelector('[data-a="quiet"]').onclick = () => { el.hidden = true; const got = reward(); svToast('🤫 Te quedás en silencio junto al fuego.' + (got ? ' +1 Paz' : '')); setTimeout(() => { if (S) S.sit = false; }, 20000); };
  });
}
/* ---------- pergaminos del Antiguo Testamento (canal 6): escondidos lejos del camino, con un brillo apenas visible ---------- */
function pergBuild(scene, W, R, used) {
  const M = MAT.mod; if (!M.PERG) return; MAT.perg = []; const g = G(), pm = matP(); pm.perg = pm.perg || {};
  const ok = (x, z) => !blockedAt(x, z) && waterWet(x, z, null) < .05 && Math.abs(x) < XB * .88 && W.dAt(x, z) > 7 && !used.some(([a, b]) => (a - x) ** 2 + (b - z) ** 2 < 25);
  M.PERG.forEach(d => { if (d.r >= g.REGIONS.length) return; const [za, zb] = regionZ(g, d.r); let p = null; for (let t = 0; t < 160 && !p; t++) { const x = (R() * 2 - 1) * XB * .8, z = zb + (za - zb) * (.08 + R() * .84); if (ok(x, z)) p = [x, z]; } if (!p) return; used.push(p);
    const [x, z] = p, o = itemMesh('scroll'); o.position.set(x, Math.max(0, W.hAt(x, z)) + .35, z); o.scale.setScalar(.8); o.visible = !pm.perg[d.id]; o.userData.keep = 1; scene.add(o); MAT.perg.push({ d, x, z, o }); });
}
function pergNear() { if (!MAT.perg) return null; const a = S.av.position, pm = matP(); for (const e of MAT.perg) if (!pm.perg[e.d.id] && (e.x - a.x) ** 2 + (e.z - a.z) ** 2 < 2.4 * 2.4) return { k: 'matg', e, label: 'Abrir el pergamino' }; return null; }
function pergOpen(e) {
  const M = MAT.mod, pm = matP(), d = e.d; pm.perg[d.id] = vday(); e.o.visible = false; matSab(2); behav('pergaminos'); h3do(['M_Picking_Up', 'PickUp_Table'], 1.8, .6);
  const all = M.PERG.filter(x => x.r === d.r), got = all.filter(x => pm.perg[x.id]).length, rn = (G().REGIONS[d.r] || {}).name || '', full = got === all.length;
  if (full) { glowAdd(10, 'pergaminos'); behav('pergaminosEtapa'); } G().save(); tone3d();
  vilSheet(`<div class="inv-h"><b>📜 ${esc(d.ref)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">Pergamino del Antiguo Testamento · ${esc(rn)} · ${got} de ${all.length}</small><p class="vil-p">${esc(d.t)}</p>${full ? '<p class="vil-p"><b>✨ Juntaste todos los pergaminos de esta etapa: se encendió un brillo de Resplandor.</b></p>' : ''}<small class="vil-k mat-src">📖 Del material · Conectá los puntos · +2 Sabiduría</small>`);
}
/* ---------- desafíos de la vida real (canal 4): botón 📝, se marcan como hechos con una reflexión corta que queda en el perfil ---------- */
function vidaOpen() {
  const M = MAT.mod; if (!M || !M.VIDA || !S) return; const p = G().P(); p.vida = p.vida || {}; const r = matStageAt(S.av.position.z), rn = (G().REGIONS[r] || {}).name || '';
  const L = M.VIDA.filter(v => v.r === r), prev = M.VIDA.filter(v => v.r < r && !p.vida[v.id]).slice(-2);
  const row = v => { const d = p.vida[v.id]; return `<div class="sv-rec${d ? ' done' : ''}"><div><b>${esc(v.t)}</b>${d ? `<small>✔ ${esc(d.d)}${d.t ? ' · ' + esc(d.t) : ''}</small>` : ''}</div>${d ? '' : `<button data-v="${v.id}">Lo hice</button>`}</div>`; };
  vilSheet(`<div class="inv-h"><b>📝 Desafíos de la vida real</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">Etapa ${esc(rn)} · son opcionales: hacelos fuera de la pantalla y marcalos cuando los hayas vivido</small>${L.map(row).join('')}${prev.length ? '<h4 class="x-h">Te quedaron de antes</h4>' + prev.map(row).join('') : ''}<small class="vil-k mat-src">📖 Del material · Desafío de la semana · lo que escribas acá lo puede ver tu tutor</small>`, el => {
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const v = M.VIDA.find(x => x.id === b.dataset.v);
      vilSheet(`<div class="inv-h"><b>📝 ¿Cómo te fue?</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p">${esc(v.t)}</p><textarea class="diary-t" rows="3" maxlength="280" placeholder="Contalo en una o dos frases (opcional). Esto lo puede leer tu tutor."></textarea><div class="vil-o"><button data-ok>Marcar como hecho</button></div>`, el2 => {
        el2.querySelector('[data-ok]').onclick = () => { p.vida[v.id] = { d: vday(), t: el2.querySelector('.diary-t').value.trim().slice(0, 280) }; matSab(2); axGain('fid', 1); glowAdd(4, 'vida'); behav('vidaReal'); G().save(); el2.hidden = true; svToast('✔ ¡Bien! Lo marcaste como hecho. +2 Sabiduría'); }; }); }); });
}
function vidaButton() {
  if (!S || !S.hx) return; const box = document.getElementById('v3acts'); if (!box || box.querySelector('[data-a="vida"]')) return;
  box.insertAdjacentHTML('beforeend', '<button data-a="vida" aria-label="Desafíos de la vida real" title="Desafíos de la vida real">📝</button>');
  box.querySelector('[data-a="vida"]').onpointerdown = e => { e.preventDefault(); e.stopPropagation(); if (!MAT.mod) { svToast('Cargando los desafíos…'); return; } vidaOpen(); };
}
/* ---------- versículos de memoria atados a un lugar (canal 3): una piedra grabada por versículo; cada visita avanza un paso
   como enseña el material: leerlo en voz alta, completar las últimas palabras y después completarlo con varias palabras tapadas ---------- */
function memBuild(scene, W, R, ok, used) {
  const M = MAT.mod; if (!M.MEM) return; MAT.mem = []; const pm = matP(); pm.mem = pm.mem || {};
  M.MEM.forEach(d => { const poi = (S.pois || []).find(q => q.r === d.r && q.k === d.near); if (!poi) return; let p = null;
    for (let t = 0; t < 200 && !p; t++) { const q = poi.k === 'river' ? poi.pts[Math.floor(R() * poi.pts.length)] : [poi.x, poi.z], a = R() * 6.283, rr = poi.k === 'lake' ? 33 + R() * 16 : (poi.k === 'river' ? 4 : 7) + R() * (t < 80 ? 12 : 24), x = q[0] + Math.cos(a) * rr, z = q[1] + Math.sin(a) * rr; if (ok(x, z)) p = [x, z]; }
    if (!p) return; used.push(p); const [x, z] = p, g = new THREE.Group(), st = new THREE.MeshStandardMaterial({ color: '#B8B0A0', roughness: .95 });
    const sl = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.4, .22), st); sl.position.y = .7; sl.castShadow = true; g.add(sl); const top = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .22, 16, 1, false, 0, Math.PI), st); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.position.y = 1.4; g.add(top);
    for (let i = 0; i < 5; i++) { const ln = new THREE.Mesh(new THREE.BoxGeometry(.6 - (i % 2) * .12, .03, .01), new THREE.MeshStandardMaterial({ color: '#5A5246' })); ln.position.set(0, 1.25 - i * .14, .115); g.add(ln); }
    const glow = new THREE.Mesh(new THREE.RingGeometry(.7, .8, 28), new THREE.MeshBasicMaterial({ color: '#BFE3FF', transparent: true, opacity: .45, depthWrite: false, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.y = .03; glow.visible = (pm.mem[d.id] || 0) < 3; g.add(glow);
    g.position.set(x, Math.max(0, W.hAt(x, z)), z); g.rotation.y = R() * 6.28; g.userData.keep = 1; scene.add(g); MAT.mem.push({ d, x, z, g, glow }); phCyl(x, z, .55); });
}
function memNear() { if (!MAT.mem) return null; const a = S.av.position, pm = matP(); for (const e of MAT.mem) if ((e.x - a.x) ** 2 + (e.z - a.z) ** 2 < 2.4 * 2.4) { const l = (pm.mem || {})[e.d.id] || 0; return { k: 'matv', e, label: l >= 3 ? 'Repasar el versículo' : l ? 'Seguir memorizando' : 'Leer el versículo' }; } return null; }
function memWords(t) { return t.split(/\s+/); }
function memOpen(e) {
  const M = MAT.mod, pm = matP(), d = e.d; pm.mem = pm.mem || {}; const lv = pm.mem[d.id] || 0, total = M.MEM.length;
  const done = () => Object.values(pm.mem).filter(v => v >= 3).length;
  const up = () => { pm.mem[d.id] = lv + 1; if (lv + 1 >= 3) { matSab(3); glowAdd(5, 'versiculo'); behav('versiculosMemoria'); if (e.glow) e.glow.visible = false; tone3d(); } else matSab(1); G().save(); };
  const head = `<div class="inv-h"><b>📖 ${esc(d.ref)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div>`;
  if (!d.t) { vilSheet(head + `<p class="vil-p">${esc(d.look)}</p><div class="vil-o"><button data-ok>Ya lo busqué y lo leí</button></div><small class="vil-k">Versículos de memoria: ${done()} de ${total}</small>`, el => { el.querySelector('[data-ok]').onclick = () => { pm.mem[d.id] = 3; matSab(3); glowAdd(5, 'versiculo'); if (e.glow) e.glow.visible = false; G().save(); el.hidden = true; svToast(`📖 ${d.ref} · versículos de memoria: ${done()} de ${total}`); }; }); return; }
  const W = memWords(d.t);
  if (lv === 0 || lv >= 3) { vilSheet(head + `<p class="vil-p mem-v">${esc(d.t)}</p><small class="vil-k">${lv >= 3 ? '✔ Ya lo tenés en el corazón. Decilo de memoria antes de mirarlo.' : 'Paso 1 de 3 · Leelo en voz alta tres veces, con la cita.'}</small><div class="vil-o">${lv >= 3 ? '' : '<button data-ok>Ya lo leí tres veces</button>'}</div><small class="vil-k">Versículos de memoria: ${done()} de ${total} · NTV</small>`, el => { const b = el.querySelector('[data-ok]'); if (b) b.onclick = () => { up(); el.hidden = true; svToast('📖 Bien. Volvé a esta piedra para el paso 2.'); }; }); return; }
  // pasos 2 y 3: palabras tapadas (las últimas, o varias repartidas) y se eligen en orden desde un banco de palabras
  const clean = w => w.replace(/[¡!¿?.,;:«»—()]/g, '');
  let hide = []; if (lv === 1) hide = [W.length - 2, W.length - 1]; else { const cand = W.map((w, i) => i).filter(i => clean(W[i]).length > 3); for (let k = 0; k < cand.length && hide.length < Math.min(5, cand.length); k += Math.max(1, Math.floor(cand.length / 5))) hide.push(cand[k]); }
  const bank = hide.map(i => clean(W[i])).concat(lv === 2 ? ['camino', 'corazón', 'tierra'].filter(x => !hide.some(i => clean(W[i]) === x)).slice(0, 2) : []).sort(() => Math.random() - .5);
  let pos = 0; const draw = el => { el.querySelector('.mem-v').innerHTML = W.map((w, i) => { const h = hide.indexOf(i); if (h < 0) return esc(w); return h < pos ? `<b class="mem-ok">${esc(w)}</b>` : `<span class="mem-gap">${'＿'.repeat(Math.max(3, clean(w).length))}</span>${esc(w.replace(clean(w), ''))}`; }).join(' '); };
  vilSheet(head + `<p class="vil-p mem-v"></p><small class="vil-k">Paso ${lv + 1} de 3 · Tocá las palabras que faltan, en orden.</small><div class="vil-o mem-bank">${bank.map((w, i) => `<button data-w="${i}">${esc(w)}</button>`).join('')}</div>`, el => { draw(el);
    el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { if (pos >= hide.length) return; const w = bank[+b.dataset.w]; if (w === clean(W[hide[pos]])) { b.disabled = true; pos++; draw(el); if (pos >= hide.length) { up(); setTimeout(() => { el.hidden = true; svToast(lv + 1 >= 3 ? `✨ ¡Memorizaste ${d.ref}! Versículos de memoria: ${done()} de ${total}` : '📖 Muy bien. Volvé a esta piedra para el último paso.'); }, 900); } } else { b.classList.add('mem-no'); setTimeout(() => b.classList.remove('mem-no'), 500); } }); });
}
/* ---------- minijuegos por concepto (canal 5): un puesto por etapa que abre su juego; etapa V se juega caminando (las siete señales) y la VIII es una pausa sin puntaje ---------- */
function jueMesh(kind) {
  const g = new THREE.Group(), M = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? .9 : r }), add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; }, wd = M('#7A5532');
  if (kind === 'sign') { add(new THREE.CylinderGeometry(.06, .07, 1.9, 8), wd, 0, .95, 0); const ar = add(new THREE.BoxGeometry(1.2, .34, .06), M('#E8DCC0'), .3, 1.6, 0); const tip = add(new THREE.ConeGeometry(.24, .34, 3), ar.material, .98, 1.6, 0); tip.rotation.z = -Math.PI / 2; g.userData.lit = [ar, tip]; return g; }
  if (kind === 'seat') { add(new THREE.BoxGeometry(1.5, .42, .55), M('#9A9286', .97), 0, .21, 0); add(new THREE.DodecahedronGeometry(.22, 0), M('#8A8274', 1), .95, .12, .2); const c = add(new THREE.CylinderGeometry(.05, .06, .18, 10), M('#E8DCC0'), -.5, .5, 0); add(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFC870' }), -.5, .63, 0); g.userData.flame = g.children[g.children.length - 1]; return g; }
  add(new THREE.BoxGeometry(1.3, .08, .8), wd, 0, .72, 0); [[-.55, -.32], [.55, -.32], [-.55, .32], [.55, .32]].forEach(([x, z]) => add(new THREE.BoxGeometry(.08, .7, .08), wd, x, .35, z));
  add(new THREE.BoxGeometry(1.36, .02, .5), M('#7A2E2A'), 0, .77, 0); add(new THREE.BoxGeometry(.6, .03, .4), M('#D9C8A0'), -.15, .79, 0);
  for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(.04, .04, .05, 10), M(['#C9A060', '#3A2A1A'][i % 2], .5), -.33 + i * .09, .82, .05 * (i % 2));
  add(new THREE.CylinderGeometry(.07, .09, .2, 10), M('#B88A50', .6), .45, .88, -.1); const fl = add(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFC870' }), .45, 1.02, -.1); g.userData.flame = fl;
  return g;
}
function jueBuild(scene, W, spot) {
  const M = MAT.mod, pm = matP(); pm.jue = pm.jue || {}; MAT.jue = [];
  (M.JUEGOS || []).forEach(d => { const p = spot(d); if (!p) return; const [x, z] = p, g = jueMesh('stand'); g.position.set(x, Math.max(0, W.hAt(x, z)), z); g.rotation.y = Math.atan2(S.av ? S.av.position.x - x : 0, 1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.1, 32), new THREE.MeshBasicMaterial({ color: '#FFD27A', transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.visible = !pm.jue[d.type]; g.add(ring);
    const lb = textSprite('🎲', true); lb.scale.multiplyScalar(.3); lb.position.set(0, 1.55, 0); g.add(lb); g.userData.keep = 1; scene.add(g); MAT.jue.push({ d, x, z, g, ring }); phCyl(x, z, .7); });
}
function senBuild(scene, W, R, used) {
  const M = MAT.mod, g = G(), pm = matP(); pm.sen = pm.sen || {}; MAT.sen = []; if (!M.SENALES || g.REGIONS.length < 5) return; const [za, zb] = regionZ(g, 4);
  const ok = (x, z) => !blockedAt(x, z) && waterWet(x, z, null) < .05 && Math.abs(x) < XB * .85 && W.dAt(x, z) > 4 && !used.some(([a, b]) => (a - x) ** 2 + (b - z) ** 2 < 36);
  M.SENALES.forEach((d, i) => { let p = null; for (let t = 0; t < 200 && !p; t++) { const x = (R() * 2 - 1) * XB * .78, z = za - (za - zb) * ((i + .2 + R() * .6) / M.SENALES.length); if (ok(x, z)) p = [x, z]; } if (!p) return; used.push(p);
    const [x, z] = p, o = jueMesh('sign'); o.position.set(x, Math.max(0, W.hAt(x, z)), z); o.userData.keep = 1; scene.add(o); MAT.sen.push({ d, i, x, z, o }); phCyl(x, z, .25); });
  // cada cartel apunta al siguiente, como dice el material: no te quedes mirando el cartel, seguí hacia donde apunta
  MAT.sen.forEach((e, k) => { const n = MAT.sen[k + 1] || MAT.sen[k - 1]; if (n) e.o.rotation.y = Math.atan2(-(n.z - e.z), n.x - e.x); senLit(e, !!pm.sen[e.d.id]); });
}
function senLit(e, on) { (e.o.userData.lit || []).forEach(m => { m.material = m.material.clone(); m.material.emissive = new THREE.Color(on ? '#FFC870' : '#000'); m.material.emissiveIntensity = on ? .7 : 0; }); }
function sieteBuild(scene, W, spot) {
  const M = MAT.mod; MAT.siete = null; if (!M.SIETE) return; const p = spot({ r: 7, near: 'golgota' }); if (!p) return; const [x, z] = p, g = jueMesh('seat'); g.position.set(x, Math.max(0, W.hAt(x, z)), z); g.userData.keep = 1; scene.add(g); MAT.siete = { x, z, g }; phCyl(x, z, .8);
}
function jueNear() {
  const a = S.av.position, d2 = (e, r) => (e.x - a.x) ** 2 + (e.z - a.z) ** 2 < r * r, pm = matP();
  for (const e of MAT.jue || []) if (d2(e, 2.6)) return { k: 'matj', e, label: 'Jugar · ' + e.d.title };
  for (const e of MAT.sen || []) if (d2(e, 2.4)) return { k: 'matn', e, label: pm.sen && pm.sen[e.d.id] ? 'Releer la señal' : 'Leer el cartel' };
  if (MAT.siete && d2(MAT.siete, 2.6)) return { k: 'mat7', e: MAT.siete, label: 'Sentarse un momento' }; return null;
}
function jueOpen(e) {
  const g = G(), pm = matP(), d = e.d; if (!g.playMat) return; S.joy.x = 0; S.joy.y = 0;
  g.playMat(d, () => { if (!pm.jue[d.type]) { pm.jue[d.type] = vday(); matSab(2); glowAdd(3, 'minijuego'); behav('minijuegosMaterial'); if (e.ring) e.ring.visible = false; g.save(); svToast('🎲 ' + d.title + ' · +2 Sabiduría'); } });
}
function senOpen(e) {
  const M = MAT.mod, pm = matP(), d = e.d, first = !pm.sen[d.id]; pm.sen[d.id] = pm.sen[d.id] || vday(); senLit(e, true);
  const got = M.SENALES.filter(x => pm.sen[x.id]).length, all = got === M.SENALES.length;
  if (first) { matSab(1); behav('senales'); if (all) { matSab(4); glowAdd(8, 'senales'); behav('senalesTodas'); tone3d(); } G().save(); }
  vilSheet(`<div class="inv-h"><b>🪧 Señal ${e.i + 1} de ${M.SENALES.length} · ${esc(d.t)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p">${esc(d.s)}</p><small class="vil-k">${esc(d.ref)} · encontraste ${got} de ${M.SENALES.length}${got < M.SENALES.length ? ' · la flecha apunta hacia la próxima' : ''}</small>${first && all ? (M.SENALES_FIN || []).map(t => `<p class="vil-p"><b>${esc(t)}</b></p>`).join('') : ''}<small class="vil-k mat-src">📖 Del material · Etapa V · Más profundo: las señales</small>`);
}
function sieteOpen() {
  const M = MAT.mod, pm = matP(), L = M.SIETE; let i = -1; S.joy.x = 0; S.joy.y = 0; h3do(['M_Sitting_Idle', 'Sitting_Idle', 'M_Standing_Idle'], 3, 0);
  const el = vilSheet('', null), step = () => { i++; if (i >= L.length) { const first = !pm.siete; pm.siete = pm.siete || vday(); if (first) { behav('sietePalabras'); G().save(); }
      vilSheet(`<div class="inv-h"><b>✝ Las siete palabras</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p">Jesús dijo siete frases desde la cruz. Quedate en silencio un momento antes de seguir caminando.</p><small class="vil-k">Esto no tiene puntaje. Si querés, escribí algo en tu diario junto al fuego.</small><small class="vil-k mat-src">📖 Del material · Etapa VIII · Las siete palabras · NTV</small>`); return; }
    const [t, ref, s] = L[i]; vilSheet(`<div class="inv-h"><b>✝ ${i + 1} de ${L.length}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="vil-p mem-v">«${esc(t)}»</p><small class="vil-k">${esc(ref)}</small><p class="vil-p">${esc(s)}</p><div class="vil-o"><button data-n disabled>Quedate un momento…</button></div>`, el2 => { const b = el2.querySelector('[data-n]'); setTimeout(() => { if (!b.isConnected) return; b.disabled = false; b.textContent = i + 1 < L.length ? 'Seguir' : 'Terminar'; }, 5000); b.onclick = step; }); };
  step();
}
/* ---------- misiones de escena con decisiones (canal 4) ---------- */
function escAct(e) {
  const pm = matP(), d = e.d.esc; pm.esc = pm.esc || {}; try { e.o.lookAt(S.av.position.x, e.o.position.y, S.av.position.z); } catch (er) {}
  const cast = { m: { name: d.name, sub: d.sub, o: e.o, voice: d.g === 'mujer' ? 'mujer' : 'varon' } }, st = x => x.map(([who, t]) => ({ who, t }));
  if (pm.esc[d.id] != null) { if (cineOk()) cine({ cast, steps: [{ who: 'm', t: 'Gracias por estar acá.' }] }); return; }
  const opts = d.o.map(([t, gain, then], i) => ({ t, fn: () => { pm.esc[d.id] = i; gain.forEach(([k, n]) => k === 'sab' ? matSab(n) : axGain(k, n)); if (gain.length) glowAdd(3, 'escena'); behav('escenas'); G().save(); }, then: st(then).concat([{ who: 'nar', t: '📖 ' + d.src }]) }));
  if (cineOk()) { cine({ cast, steps: st(d.pre).concat([{ who: 'm', ask: d.ask, o: opts }]) }); return; }
  vilSheet(`<div class="inv-h"><b>${esc(d.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div>${d.pre.map(([, t]) => `<p class="vil-p">${esc(t)}</p>`).join('')}<p class="vil-p"><b>${esc(d.ask)}</b></p><div class="vil-o">${opts.map((o, i) => `<button data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`, el => el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const o = opts[+b.dataset.i]; o.fn(); vilSheet(`<div class="inv-h"><b>${esc(d.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div>${o.then.map(s => `<p class="vil-p">${esc(s.t)}</p>`).join('')}`); }));
}
const SEC = { mod: null, list: [] };
function secP() { const p = G().P(); p.secrets = p.secrets || {}; p.relics = p.relics || []; return p; }
async function secBuild(scene, W) {
  if (!S.hx) return; const M = SEC.mod = await import('./story/secrets.js').catch(() => null); if (!M || !S) return; const g = G(); SEC.list = [];
  const used = Object.values(S.npos || {}).map(q => q.slice()).concat(VIL.npcs.map(v => [v.x, v.z]), Object.values(S.mis || {}).flatMap(m => [m.gp, m.tp, m.pp].filter(Boolean)));
  const ok = (x, z, wetOk) => { if (Math.abs(x) > Math.min(XB * .9, (W.X1 || XB) - 5)) return false; if (W.dAt(x, z) < 14) return false; if (!wetOk && waterWet(x, z, null) > .04) return false; for (const B of WATER.basins) if (Math.hypot(x - B.x, z - B.z) < B.r * 1.15 + 1) return false; const sl = Math.hypot(W.hAt(x + 1, z) - W.hAt(x - 1, z), W.hAt(x, z + 1) - W.hAt(x, z - 1)) / 2; if (sl > .4) return false; for (let k = 0; k < 8; k++) { const an = k / 8 * 6.283; if (blockedAt(x + Math.cos(an) * 1.6, z + Math.sin(an) * 1.6)) return false; } for (const u of used) if (Math.hypot(x - u[0], z - u[1]) < 10) return false; return true; };
  M.SECRETS.forEach((d, i) => { const r = g.REGIONS.findIndex(x => x.id === d.r); if (r < 0) return; const [za, zb] = regionZ(g, r), R = rng(7700 + i * 31), poi = d.near ? (S.pois || []).find(q => q.r === r && q.k === d.near) : null;
    let best = null; for (let t = 0; t < 200 && !best; t++) { let x, z; if (poi && t < 80) { const q = poi.k === 'river' ? poi.pts[Math.floor(R() * poi.pts.length)] : [poi.x, poi.z], a = R() * 6.283, rr = (poi.k === 'river' ? 5 : 14) + R() * 14; x = q[0] + Math.cos(a) * rr; z = q[1] + Math.sin(a) * rr; } else { x = (R() * 2 - 1) * XB * .85; z = zb + (za - zb) * (.1 + R() * .8); } if (ok(x, z, d.id === 'manantial')) best = [x, z]; }
    if (!best) return; used.push(best); const [x, z] = best, y = Math.max(0, W.hAt(x, z)), grp = new THREE.Group();
    if (d.entry === 'rock') { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.95, 1), new THREE.MeshStandardMaterial({ color: '#8C8374', roughness: 1, flatShading: true })); m.scale.set(1.1, .8, 1); m.position.y = .55; m.castShadow = true; grp.add(m); }
    else if (d.entry === 'lid') { const m = new THREE.Mesh(new THREE.CylinderGeometry(.85, .9, .14, 18), new THREE.MeshStandardMaterial({ color: '#7E7466', roughness: 1 })); m.position.y = .06; grp.add(m); for (let k = 0; k < 5; k++) { const pb = new THREE.Mesh(new THREE.DodecahedronGeometry(.12, 0), new THREE.MeshStandardMaterial({ color: '#6E665A', roughness: 1 })); pb.position.set(Math.cos(k) * .7, .14, Math.sin(k * 1.3) * .6); grp.add(pb); } }
    else { for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.55 + (k % 2) * .2, 1), new THREE.MeshStandardMaterial({ color: ['#55663A', '#4C5E30', '#66763E'][k % 3], roughness: 1, flatShading: true })); b.position.set(Math.cos(k * 1.26) * .6, .45, Math.sin(k * 1.26) * .6); b.scale.y = .8; grp.add(b); } }
    grp.position.set(x, y, z); grp.userData.keep = 1; scene.add(grp); SEC.list.push({ d, x, z, g: grp, r }); });
}
function secNear() { if (!SEC.list.length) return null; const a = S.av.position, p = secP(); for (const e of SEC.list) { if ((e.x - a.x) ** 2 + (e.z - a.z) ** 2 < 2.6 * 2.6) return e; } return null; }
function secOpen(e) {
  const p = secP(), d = e.d, first = !p.secrets[d.id], M = SEC.mod; if (S.secBusy) return;
  const show = () => { const n = Object.keys(p.secrets).length, el = document.getElementById('v3sheet');
    el.innerHTML = `<div class="inv hx sv-sheet vil sec"><div class="inv-h"><b>${M.ENTRY[d.entry][1]} ${esc(d.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><small class="vil-k">${first ? '¡Descubriste un lugar secreto!' : 'Lugar secreto'} · ${n} de ${M.SECRETS.length}</small><p class="vil-p">${esc(d.t)}</p>
      <h4 class="x-h">Lo que guarda (único en todo el juego)</h4>${d.items.map(([nm, ic, ds, ref]) => `<div class="sec-it"><span>${ic}</span><div><b>${esc(nm)}</b><small>${esc(ds)}</small><em>${esc(ref)}</em></div></div>`).join('')}</div>`;
    el.hidden = false; el.querySelector('.bag-x').onclick = () => { el.hidden = true; }; };
  if (!first) { show(); return; }
  S.secBusy = 1; svToast('⏳ ' + M.ENTRY[d.entry][0] + '…'); h3do(['M_Reaching_Out', 'PickUp_Table', 'M_Picking_Up'], 2.6, .8);
  setTimeout(() => { S.secBusy = 0; if (!S) return; const a = S.av.position; if ((e.x - a.x) ** 2 + (e.z - a.z) ** 2 > 16) { svToast('Te alejaste antes de terminar.'); return; }
    p.secrets[d.id] = vday(); d.items.forEach(([nm, ic, ds, ref]) => { if (!p.relics.some(x => x.n === nm)) p.relics.push({ n: nm, i: ic, d: ds, ref, from: d.name }); }); axGain('sab', 3); glowAdd(6, 'secreto'); behav('secretos'); G().save(); tone3d(); show(); }, 2600);
}
function secretHint() { const M = SEC.mod; if (!M || !SEC.list.length) return; const p = secP(), left = SEC.list.filter(e => !p.secrets[e.d.id]); if (!left.length) return; const e = left[Math.floor(Math.random() * left.length)], rn = G().REGIONS[e.r] ? G().REGIONS[e.r].name : '';
  svToast(`🧭 Te cuentan un secreto: en la etapa ${rn} hay ${e.d.hint}.`); behav('pistas'); }
/* tienda */
function svShop(kind) {
  const sh = SHOPS[kind]; if (!sh) return; const el = document.getElementById('v3sheet'), s = svP(); S.joy.x = 0; S.joy.y = 0; h3do(['M_Lengthy_Head_Nod'], 1.7);
  const draw = () => {
    const rows = sh.buy.map(([t, k, p], i) => { const cost = price(p); let label = '', ico = '', owned = false;
      if (t === 't') { label = TOOLS[k][0]; ico = TOOLS[k][1]; owned = s.tools.includes(k); }
      else if (t === 'r') { label = RES[k][0]; ico = RES[k][1]; }
      else { const left = GEAR.filter(x => x.r === k && !gearState().own.includes(x.id)); owned = !left.length; label = 'Prenda ' + RAR[k][0].toLowerCase() + (left.length ? ' (al azar)' : ''); ico = '🧵'; }
      return `<div class="sv-rec${owned || money() < cost ? ' off' : ''}"><div><b>${ico} ${esc(label)}</b><small>${owned ? 'Ya lo tenés' : cost + ' denarios'}</small></div><button data-b="${i}" ${owned || money() < cost ? 'disabled' : ''}>Comprar</button></div>`; }).join('');
    const sells = sh.sell.filter(k => (s.inv[k] || 0) > 0).map(k => `<div class="sv-rec"><div><b>${RES[k][1]} ${RES[k][0]}</b><small>Tenés ${s.inv[k]} · ${SELL[k]} denario${SELL[k] > 1 ? 's' : ''} cada uno</small></div><button data-s="${k}">Vender 1</button><button data-sa="${k}">Todo</button></div>`).join('');
    el.innerHTML = `<div class="inv hx sv-sheet"><div class="inv-h"><b>${esc(sh.name)}</b><button class="bag-x" aria-label="Cerrar">✕</button></div><div class="sv-have"><span class="sv-chip">🪙 ${money()} denarios</span>${servV() >= 3 ? '<span class="sv-chip">10% menos por tu servicio</span>' : ''}</div>${S.hx && kind === 'mercado' ? `<div class="vil-hag"><button data-h="0" class="${S.haggle ? '' : 'on'}">Pagar lo justo</button><button data-h="1" class="${S.haggle ? 'on' : ''}">Regatear duro (−20%)</button><small>${S.haggle ? 'Regatear te ahorra denarios, pero en la aldea lo notan.' : 'Pagar lo justo suma Gentileza y reputación.'}</small></div>` : ''}
      <h4 class="x-h">Comprar</h4>${rows}${sh.sell.length ? `<h4 class="x-h">Vender</h4>${sells || '<p class="sv-tip">No tenés nada que te compren acá.</p>'}` : ''}<p class="sv-tip">En tiempos de Jesús se pagaba con denarios: un denario era el jornal de un día de trabajo (Mateo 20:2).</p></div>`;
    el.querySelector('.bag-x').onclick = () => { el.hidden = true; };
    el.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { S.haggle = b.dataset.h === '1'; draw(); });
    el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const [t, k, p] = sh.buy[+b.dataset.b], cost = price(p); if (money() < cost) return; if (S.hx && kind === 'mercado') { const vv = vilNearest(60); if (S.haggle) { if (vv) repAdd(vv.name, -1); behav('regateos'); } else { if (vv) repAdd(vv.name, 1); axGain('gent', 1); behav('pagoJusto'); } }
      if (t === 't') { if (s.tools.includes(k)) return; svAdd('money', -cost); svGiveTool(k, 'Compraste'); }
      else if (t === 'r') { svAdd('money', -cost); svAdd(k, 1); }
      else { const left = GEAR.filter(x => x.r === k && !gearState().own.includes(x.id)); if (!left.length) return; svAdd('money', -cost); gearGive(left[Math.floor(Math.random() * left.length)], 'Compraste'); }
      tone3d(); G().save(); svUI(); draw(); });
    const sell = (k, n) => { n = Math.min(n, s.inv[k] || 0); if (!n) return; svAdd(k, -n); svAdd('money', n * SELL[k]); G().save(); svUI(); draw(); };
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => sell(b.dataset.s, 1)); el.querySelectorAll('[data-sa]').forEach(b => b.onclick = () => sell(b.dataset.sa, 999));
  };
  el.hidden = false; el.onclick = e => { if (e.target === el) el.hidden = true; }; draw();
}

/* dar a quien lo necesita */
function svGive(bg) {
  const el = document.getElementById('v3sheet'), s = svP(), a = atP(), day = Math.floor(s.play / SV.DAY); a.alms = a.alms || {}; S.joy.x = 0; S.joy.y = 0;
  if (a.alms[bg.id] === day) { svToast('Hoy ya ayudaste a esta persona. Mañana (en el juego) vas a poder volver a ayudarla.'); return; }
  const opts = [['money', 1], ['money', 5], ['bread', 1], ['fruit', 1], ['cooked', 1]].filter(([k, n]) => (s.inv[k] || 0) >= n);
  el.innerHTML = `<div class="inv hx sv-sheet"><div class="inv-h"><b>Alguien que necesita ayuda</b><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="sv-tip">«Por favor… ¿tenés algo para darme? Hoy no comí nada.»</p>
    ${opts.length ? `<div class="x-list">${opts.map(([k, n], i) => `<button data-i="${i}">${RES[k][1]} Dar ${n} ${RES[k][0].toLowerCase()}</button>`).join('')}</div>` : '<p class="sv-tip">No tenés dinero ni comida para dar. Podés vender algo en el mercado o recoger granadas.</p>'}
    <p class="sv-tip">Jesús enseñó que lo que hacemos por el que tiene hambre, lo hacemos por él (Mateo 25:35-40).</p></div>`;
  el.hidden = false; el.querySelector('.bag-x').onclick = () => { el.hidden = true; };
  el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const [k, n] = opts[+b.dataset.i]; if ((s.inv[k] || 0) < n) return; svAdd(k, -n); a.alms[bg.id] = day; const mult = servV() >= 25 ? 2 : 1; svXP((k === 'money' ? 4 + n * 2 : 10) * mult); servAdd(1); axGain('gen', 3); if (S.hx) { axGain('amor', 2); if (fv('gen') >= 40) axGain('ale', 1); if (fv('gen') >= 20 && Math.random() < .25) setTimeout(() => { svAdd('fruit', 2); svToast('🎁 Lo que compartiste volvió como regalo: 2 frutos.'); }, 4000); if (fv('gen') >= 50 && Math.random() < .3) setTimeout(() => { svAdd('bread', 2); svToast('🧺 Apareció una canasta extra de pan.'); }, 6000); if (fv('gen') >= 30) setTimeout(() => secretHint(), 2500); behav('compartir'); } glowAdd(8, 'compartir'); h3do(['M_Reaching_Out', 'PickUp_Table'], 2.6, 1.2); h3npcPlay(bg.o, ['M_Thankful', 'M_Lengthy_Head_Nod'], 3); tone3d(); svUI();
    el.innerHTML = `<div class="inv hx sv-sheet sv-faint"><h3>¡Gracias! Que Dios te bendiga.</h3><p>Tu Servicio creció a <b>${atP().serv}</b> y ganaste experiencia.</p><p class="sv-verse">El que ayuda al pobre le presta al Señor, y él se lo va a recompensar (Proverbios 19:17).</p><button class="sv-up">Seguir el camino</button></div>`; el.querySelector('.sv-up').onclick = () => { el.hidden = true; }; });
}

addEventListener('keyup', e => { if ((e.key || '').toLowerCase() === 'e') axHold(false); });
addEventListener('touchstart', () => document.body.classList.add('v3touch'), { once: true, passive: true });
window.W3 = { dbgHero: () => ({ VIL, SEC, MAT, AU, SND, MIX, svAct, svNear, fv, ft, openBag, CINE, svFaint, fireTalk, openMap }), cine, cineOk, cineOk2, cineBusy, crossScene, dawnScene, dawnBuild, diaryOpen, fvOf: k => { try { return fv(k); } catch (e) { return 0; } }, fruitVals: () => { try { return Object.fromEntries(FRUITS.map(f => [f[1], fv(f[0])])); } catch (e) { return {}; } }, qProf, axGain, enter, MP, qLabel, qFpsToggle, fpsOn: () => { try { return localStorage.getItem('tsp:fps') === '1'; } catch (e) { return false; } }, dlWorld, attrSync, attrOpen, ptsFree: () => { try { return ptsFree(); } catch (e) { return 0; } }, avSprites, stageShots, qCycle, qSet, qStats, get quality() { return QN[QUAL.mode]; }, room: () => { if (S) mpPanel(); }, get state() { return S; }, AU, sv: { act: svAct, eat: svEat, craft: svCraft, P: svP, give: svGiveTool, faint: svFaint, near: svNear, FLORA, mpX, espIn, espPool, gmIn, GM, svShop: k => svShop(k), svGive: b => svGive(b) }, openBag, gearGive: id => id === 'tsp' ? insGive('tsp') : gearGive(GBY[id], 'Regalo'), insGive: id => insGive(id), insMigrate, PH, glowAdd: (n, w) => glowAdd(n, w), glowLv: () => glowLv(glowState().pts), poseSet: id => poseSet(id), poseMenu: () => poseMenu(true), kidsShine: () => kidsShine(), mpAdd: (id, info) => mpAdd(id, info), GEAR, reLook };
