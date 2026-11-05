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
function mat(color, opts) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0 }, opts || {})); }
function textSprite(txt, hx) {
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
function house(R, hx) {
  const g = new THREE.Group(), w = 1.1 + R() * .5;
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, .9, w * .9), mat(hx ? '#B49A74' : '#F4E3C3')); b.position.y = .45; g.add(b);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + .12, .08, w * .9 + .12), mat(hx ? '#8A7356' : '#D9C29A')); roof.position.y = .94; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(.26, .44, .02), mat('#6B4A2C')); door.position.set(0, .22, w * .45 + .01); g.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(.18, .16, .02), new THREE.MeshBasicMaterial({ color: hx ? '#FFC870' : '#FFE9A8' })); win.position.set(w * .28, .56, w * .45 + .01); g.add(win);
  return g;
}
function palm(R) { const g = new THREE.Group(), h = 2 + R(); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, h / 6, 7), mat('#8B6A44')); s.position.set(Math.sin(i * .3) * .1, h / 12 + i * h / 6, 0); g.add(s); } const lm = mat('#3E8E4A', { side: THREE.DoubleSide }); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.35, 1.3), lm); l.position.y = h; l.rotation.set(-1.0, i / 6 * Math.PI * 2, 0, 'YXZ'); l.translateY(.55); g.add(l); } return g; }
function pillar(R) { const g = new THREE.Group(), h = 1 + R() * 1.6; const p = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, h, 10), mat('#7D7461')); p.position.y = h / 2; p.rotation.z = (R() - .5) * .15; g.add(p); const top = new THREE.Mesh(new THREE.BoxGeometry(.55, .14, .55), mat('#6E6553')); top.position.y = h; g.add(top); return g; }

/* ---------- mundo Hero: luz de atardecer, cielo, relieve y vegetación ---------- */
const hsh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = hsh(xi, yi), b = hsh(xi + 1, yi), c = hsh(xi, yi + 1), d = hsh(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y) => vnoise(x, y) * .5 + vnoise(x * 2.07, y * 2.07) * .25 + vnoise(x * 4.13, y * 4.13) * .125 + vnoise(x * 8.3, y * 8.3) * .0625;
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function noiseTex(size, fn, rep) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), im = x.createImageData(size, size); for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const v = fn(i, j), k = (j * size + i) * 4; im.data[k] = v[0]; im.data[k + 1] = v[1]; im.data[k + 2] = v[2]; im.data[k + 3] = 255; } x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = matchMedia('(pointer: coarse)').matches ? 8 : 12; return t; }
function heroWorld(scene, g, allPts, flatSpots, zMax, Q) {
  // campo de distancias al camino (para dejarlo plano y ubicar la vegetación)
  const X0 = -XB - 40, X1 = XB + 40, Z0 = zMax - 50, Z1 = 50, CS = 1.5, NX = Math.ceil((X1 - X0) / CS) + 1, NZ = Math.ceil((Z1 - Z0) / CS) + 1, DF = new Float32Array(NX * NZ);
  const pts = allPts.filter((p, i) => i % 2 === 0).concat(flatSpots), buckets = new Map(), bk = z => Math.floor(z / 6);
  pts.forEach(p => { const k = bk(p[1]); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(p); });
  for (let j = 0; j < NZ; j++) { const z = Z0 + j * CS, b0 = bk(z); for (let i = 0; i < NX; i++) { const x = X0 + i * CS; let d = 400; for (let b = b0 - 3; b <= b0 + 3; b++) { const L = buckets.get(b); if (!L) continue; for (const p of L) { const q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } } DF[j * NX + i] = Math.min(20, Math.sqrt(d)); } }
  const dAt = (x, z) => { const fx = Math.max(0, Math.min(NX - 1.001, (x - X0) / CS)), fz = Math.max(0, Math.min(NZ - 1.001, (z - Z0) / CS)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = DF[j * NX + i], b = DF[j * NX + i + 1], c = DF[(j + 1) * NX + i], d = DF[(j + 1) * NX + i + 1]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const hAt = (x, z) => { const d = dAt(x, z), m = sstep(2.6, 10, d), side = sstep(16 * WS, 44 * WS, Math.abs(x)); return m * (fbm(x * .07 + 3, z * .07) * 3.4 - .9 + side * (4 + fbm(x * .025, z * .025) * 14)); };
  // cielo de atardecer
  const sunDir = new THREE.Vector3(-.42, .17, -.89).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#16203C') }, mid: { value: new THREE.Color('#5B5A7A') }, hor: { value: new THREE.Color('#F0A35E') }, gnd: { value: new THREE.Color('#2B2118') }, sun: { value: sunDir }, sunC: { value: new THREE.Color('#FFD39A') }, t: { value: 0 }, stars: { value: 1 }, inv: { value: 0 }, ex: { value: 1 } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top,mid,hor,gnd,sun,sunC;uniform float t,stars,inv,ex;varying vec3 vP;vec3 unTone(vec3 d){d=clamp(d,0.,.985);vec3 L=mix(d/12.92,pow((d+.055)/1.055,vec3(2.4)),step(.04045,d));L=min(L,vec3(.975));vec3 A=1.-.983729*L,B=.0245786-.432951*L,C=-(.000090537+.238081*L);vec3 v=(-B+sqrt(B*B-4.*A*C))/(2.*A);return v*.6/ex;}float h2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){float h=vP.y;vec3 c=mix(hor,mid,smoothstep(0.,.22,h));c=mix(c,top,smoothstep(.18,.75,h));c=mix(c,gnd,smoothstep(0.,-.12,h));float s=max(dot(vP,sun),0.);c+=sunC*(pow(s,900.)*6.+pow(s,24.)*.45+pow(s,4.)*.18);float az=atan(vP.x,vP.z);float cl=smoothstep(.55,.85,sin(az*3.+h*14.+t*.02)*.5+.5+h2(floor(vec2(az*20.,h*60.)))*.08)*smoothstep(.05,.14,h)*smoothstep(.34,.16,h);c=mix(c,mix(vec3(.42,.3,.32),sunC,pow(s,6.)*.8),cl*.45);if(h>.3){vec2 g=floor(vP.xz/(h+.3)*180.);float st=step(.9975,h2(g));c+=st*smoothstep(.3,.6,h)*.7*stars;}if(inv>.5)c=unTone(c);gl_FragColor=vec4(c,1.);}' }));
  sky.renderOrder = -1; scene.add(sky);
  scene.background = new THREE.Color('#2B2118');
  scene.fog = new THREE.FogExp2('#94705A', .0105);
  // luces
  const hemi = new THREE.HemisphereLight('#9EAACB', '#4A3826', .62); scene.add(hemi);
  const sunL = new THREE.DirectionalLight('#FFC788', 2.7); sunL.castShadow = true; sunL.shadow.mapSize.set(Q.sh, Q.sh);
  const sc = sunL.shadow.camera; sc.left = -Q.ext; sc.right = Q.ext; sc.top = Q.ext; sc.bottom = -Q.ext; sc.near = 1; sc.far = 90; sunL.shadow.bias = -.0005; sunL.shadow.normalBias = .025; sunL.shadow.radius = 3; scene.add(sunL); scene.add(sunL.target);
  // terreno
  const L = Z1 - Z0, geo = new THREE.PlaneGeometry(X1 - X0, L, Math.round((X1 - X0) / Q.tg), Math.round(L / Q.tg)); geo.rotateX(-Math.PI / 2); geo.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), C = new THREE.Color(), G1 = new THREE.Color('#4E6A2C'), G2 = new THREE.Color('#7C8238'), DRY = new THREE.Color('#9C8448'), DIRT = new THREE.Color('#7C5F3E'), ROCK = new THREE.Color('#6E665A');
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), d = dAt(x, z), h = hAt(x, z); P.setY(i, h); const n = fbm(x * .15, z * .15), n2 = vnoise(x * .04 + 7, z * .04);
    C.copy(G1).lerp(G2, n); C.lerp(DRY, sstep(.45, .8, n2) * .7); C.lerp(DIRT, 1 - sstep(1.4, 4.2, d)); C.lerp(ROCK, sstep(4, 10, h) * .75); C.multiplyScalar(.85 + n * .3); col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const detail = noiseTex(256, (i, j) => { const v = 150 + (fbm(i * .09, j * .09) - .5) * 160 + (hsh(i, j) - .5) * 60; return [v, v, v]; }, 34);
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: detail, roughness: .96 })); terrain.receiveShadow = true; scene.add(terrain);
  // montañas a lo lejos
  const mm = new THREE.MeshStandardMaterial({ color: '#4A4248', roughness: 1, flatShading: true });
  for (let i = 0; i < 40; i++) { const side = i % 2 ? 1 : -1, z = 30 - (i / 40) * (30 - zMax + 40), hgt = 26 + hsh(i, 3) * 40, m = new THREE.Mesh(new THREE.ConeGeometry(14 + hsh(i, 9) * 14, hgt, 6 + (i % 3)), mm); m.position.set(side * (XB + 40 + hsh(i, 5) * 30), hgt / 2 - 3, z); m.rotation.y = hsh(i, 1) * 6; scene.add(m); }
  return { hAt, dAt, sunL, sunDir, sky, terrain, hemi };
}
function heroFlora(scene, W, allPts, zMax, R, Q) {
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SV = new THREE.Vector3(), CL = new THREE.Color();
  const put = (x, y, z, rx, ry, rz, sx, sy, sz) => { E.set(rx, ry, rz, 'YXZ'); Q4.setFromEuler(E); V.set(x, y, z); SV.set(sx, sy ?? sx, sz ?? sx); M4.compose(V, Q4, SV); };
  const inst = (geo, m, list, fn, shadow) => { const im = new THREE.InstancedMesh(geo, m, list.length); list.forEach((o, i) => { const c = fn(o, i); im.setMatrixAt(i, M4); if (c) im.setColorAt(i, CL.set(c)); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = !!shadow; im.receiveShadow = true; scene.add(im); return im; };
  const olive = [], cyp = [], bush = [], rock = [];
  for (let i = 0; i < Q.trees; i++) { const x = (R() - .5) * (XB * 2 + 50), z = 40 + R() * (zMax - 70); const d = W.dAt(x, z); if (d < 2.6 + R() * 2) continue; const y = W.hAt(x, z), r = R(), o = { x, y, z, s: .75 + R() * .6, rot: R() * 6.28, v: R() };
    if (Math.abs(x) > XB * .8 && r < .5) continue; (r < .42 ? olive : r < .62 ? cyp : r < .9 ? bush : rock).push(o); }
  const trunkM = new THREE.MeshStandardMaterial({ color: '#5A4430', roughness: 1, flatShading: true });
  const leafM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .9, flatShading: true });
  // olivos: tronco torcido y copa de varias masas
  inst(new THREE.CylinderGeometry(.12, .22, 1, 6), trunkM, olive, o => { const h = 1.5 * o.s; put(o.x, o.y + h / 2, o.z, (o.v - .5) * .3, o.rot, (o.v - .5) * .25, o.s, h, o.s); }, true);
  const blobs = []; olive.forEach(o => { for (let j = 0; j < 6; j++) { const a = j / 6 * 6.28 + o.rot, r = j ? .55 : 0; blobs.push({ o, x: Math.cos(a) * r, z: Math.sin(a) * r, y: 1.55 + (j ? -.1 + hsh(j, o.x) * .35 : .35), s: .55 + hsh(o.z, j) * .3 }); } });
  inst(new THREE.IcosahedronGeometry(1, 1), leafM, blobs, b => { const o = b.o; put(o.x + b.x * o.s, o.y + b.y * o.s, o.z + b.z * o.s, b.x, o.rot + b.z, 0, b.s * o.s * 1.15, b.s * o.s * .8, b.s * o.s * 1.15); return ['#5E7140', '#6F7E4A', '#526638', '#7A8A55'][Math.floor(hsh(b.x * 9, b.y * 7 + o.z) * 4)]; }, true);
  // cipreses
  inst(new THREE.CylinderGeometry(.06, .1, 1, 5), trunkM, cyp, o => put(o.x, o.y + .4 * o.s, o.z, 0, 0, 0, o.s, .8 * o.s, o.s), false);
  inst(new THREE.ConeGeometry(.6, 1, 8, 3), leafM, cyp, o => { const h = (3.4 + o.v * 2.4) * o.s; put(o.x, o.y + .5 * o.s + h / 2, o.z, 0, o.rot, 0, o.s * .9, h, o.s * .9); return o.v < .5 ? '#2F4429' : '#3A5230'; }, true);
  // arbustos y piedras
  const bb = []; bush.forEach(o => { for (let j = 0; j < 3; j++) bb.push({ o, dx: (hsh(j, o.x) - .5) * .9, dz: (hsh(o.z, j) - .5) * .9, r: .35 + hsh(j + 3, o.z) * .3 }); });
  inst(new THREE.IcosahedronGeometry(1, 1), leafM, bb, ({ o, dx, dz, r }) => { put(o.x + dx * o.s, o.y + r * .55 * o.s, o.z + dz * o.s, 0, o.rot, 0, r * o.s * 1.2, r * o.s * .8, r * o.s * 1.2); return ['#4C5E30', '#5D6B3A', '#6B6A3C'][Math.floor(o.v * 3)]; }, true);
  inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .95, flatShading: true }), rock, o => { put(o.x, o.y + .1, o.z, o.rot, o.rot * 2, o.v, (.35 + o.v * .7) * o.s, (.25 + o.v * .4) * o.s, (.35 + o.v * .6) * o.s); return ['#7B7266', '#8A8072', '#6A635A'][Math.floor(o.v * 3)]; }, true);
  // pasto con viento
  const bl = new THREE.BufferGeometry(); bl.setAttribute('position', new THREE.Float32BufferAttribute([-.045, 0, 0, .045, 0, 0, -.025, .5, .01, .025, .5, .01, 0, 1, .03], 3)); bl.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  bl.setAttribute('color', new THREE.Float32BufferAttribute([.2, .27, .1, .2, .27, .1, .42, .48, .2, .42, .48, .2, .78, .74, .4], 3)); bl.computeVertexNormals();
  const gm = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), uT = { value: 0 };
  gm.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <project_vertex>', 'vec4 mvPosition=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nmvPosition=instanceMatrix*mvPosition;\n#endif\nfloat k=position.y*position.y;mvPosition.x+=sin(uT*1.8+mvPosition.x*.35+mvPosition.z*.28)*.16*k;mvPosition.z+=cos(uT*1.3+mvPosition.x*.22)*.08*k;\nmvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;'); };
  const gl = []; for (let i = 0; i < Q.grass; i++) { const p = allPts[Math.floor(R() * allPts.length)], a = R() * 6.28, wide = R() < .35, r = 1.05 + Math.pow(R(), 1.6) * 13, x = wide ? (R() - .5) * XB * 2 : p[0] + Math.cos(a) * r, z = wide ? p[1] + (R() - .5) * 8 : p[1] + Math.sin(a) * r; if (W.dAt(x, z) < 1.05) continue; gl.push({ x, z, h: .22 + R() * .42, w: .8 + R() * .7, rot: R() * 6.28 }); }
  const gim = new THREE.InstancedMesh(bl, gm, gl.length); gl.forEach((o, i) => { put(o.x, W.hAt(o.x, o.z) - .02, o.z, 0, o.rot, (hsh(o.x, o.z) - .5) * .4, o.w, o.h, 1); gim.setMatrixAt(i, M4); }); gim.instanceMatrix.needsUpdate = true; gim.frustumCulled = false; scene.add(gim);
  return uT;
}

/* ---------- construcción ---------- */
async function build() {
  H3.npcs = []; if (G().branch === 'ados') await heroLoad();
  const g = G(), hx = g.branch === 'ados', root = document.getElementById('view3d'), _c = root.classList.toggle('hx', hx), cv = document.getElementById('c3d');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = hx ? 1.0 : 1.05;
  S_poiPts = planPois(g).flatMap(q => q.flat).concat(planDoors(g).flatMap(q => q.flat));
  const coarse = matchMedia('(pointer: coarse)').matches, QL = coarse ? { sh: 2048, grass: 30000, trees: 2900, tg: 2, ext: 22 } : { sh: 4096, grass: 62000, trees: 4300, tg: 1.6, ext: 26 };
  if (hx) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setPixelRatio(Math.min(coarse ? 1.75 : 2, devicePixelRatio || 1)); }
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
  g.EDGES.forEach(([a, b]) => { const A = g.NODES[a], B = g.NODES[b], pts = []; for (let i = 0; i <= 100; i++) { const p = bez(A, B, i / 100); pts.push(toV(p.x, p.y)); } edgePts[a + '>' + b] = pts; if (!hx) { scene.add(ribbon(pts, 1.9, edgeM, .015)); scene.add(ribbon(pts, 1.45, pathM, .03));  } });
  // vegetación y rocas, lejos del camino (instanciadas para que ande fluido en el celular)
  const allPts = Object.values(edgePts).flat(), near = (x, z, d) => allPts.some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < d * d) || (S_poiPts || []).some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < (d + 4) * (d + 4));
  const zMax = -totalY * SC;
  let HW = null, uGrass = null;
  const pois = planPois(g), doors = planDoors(g), poiPts = pois.flatMap(q => q.flat).concat(doors.flatMap(q => q.flat));
  if (hx) { const flat = g.VIGN.map(([r, x, y]) => toV(x, g.TOP + r * g.RH + y)).concat(poiPts); HW = heroWorld(scene, g, allPts, flat, zMax, QL); uGrass = heroFlora(scene, HW, allPts, zMax, R, QL); }
  const spots = { tree: [], bush: [], rock: [] };
  for (let i = 0; i < (hx ? 0 : 1500); i++) {
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
  g.VIGN.forEach(([r, x, y, k]) => { const [vx, vz] = toV(x, g.TOP + r * g.RH + y); if (k === 'house' || k === 'stable' || k === 'temple') { for (let i = 0; i < 3; i++) { const h = house(R, hx); h.position.set(vx + (i - 1) * 1.6, 0, vz + (R() - .5) * 1.4); h.rotation.y = (R() - .5) * .6; addV(h); } } if (k === 'palms' || k === 'tree') { for (let i = 0; i < 3; i++) { const p = palm(R); p.position.set(vx + (R() - .5) * 3, 0, vz + (R() - .5) * 2); addV(p); } } if (k === 'riv') { const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), mat(hx ? '#3B6266' : '#7FC4F0', { roughness: hx ? .08 : .2, metalness: hx ? .35 : .1 })); w.rotation.x = -Math.PI / 2; w.position.set(vx, .02, vz); scene.add(w); } });
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
  const av = hx ? buildHeroAvatar(lookOf(g.P())) : buildAvatar(lookOf(g.P()), hx); if (hx) av.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(av);
  const n0 = g.NODES[g.P().pos], [ax, az] = toV(n0.x, n0.y); av.position.set(ax, 0, az);
  S = { renderer, scene, camera, hx, av, markers, edgePts, allPts, items, joy: { x: 0, y: 0 }, keys: {}, flies, ground, yaw: Math.PI, camYaw: 0, camDist: 6.6, camPitch: .4, walking: false, moving: false, t: 0, root, cv, sig: '', onStop: g.P().pos, W: HW, uGrass, KL };
  // orientar al personaje hacia la próxima parada
  buildPois(scene, pois, hx, HW, rng(77), ribbon); S.pois = pois; buildTowns(scene, g, hx, HW, pois); S_stair = null; S.doors = buildDoors(scene, doors, hx, HW); S.stair = S_stair; setTimeout(() => tutOpen(), 1500); setTimeout(() => { if (MP.code) { const keep = Object.entries(MP.players).map(([id, p]) => [id, p.info]); MP.players = {}; keep.forEach(([id, info]) => mpAdd(id, info)); } mpUI(); mpAuto(); }, 0);
  S0 = S; S.mis = buildMissions(scene, g, hx, HW); { const pm = misState(); if (pm.mact && S.mis[pm.mact.id]) misCarry(S.mis[pm.mact.id], pm.mact.has); }
  const nx = nextList()[0]; if (nx) { const N = g.NODES[nx], [bx, bz] = toV(N.x, N.y); S.yaw = Math.atan2(bx - ax, bz - az); }
  av.rotation.y = S.yaw;
  camera.position.set(ax - Math.sin(S.yaw) * 6.6, 3.3, az - Math.cos(S.yaw) * 6.6);
  S.fill = new THREE.DirectionalLight(hx ? '#FFD9B0' : '#FFFFFF', hx ? .5 : .5); scene.add(S.fill); scene.add(S.fill.target);
  wireInput(); wireJoy(); if (!window.__acts) { window.__acts = 1; wireActs(); auButtons(); } resize(); addEventListener('resize', resize);
  fxInit();
  const me = S, run = n => { if (S !== me) return; requestAnimationFrame(run); loop(n); }; requestAnimationFrame(run);
}
function resize() { if (!S) return; const r = S.root.getBoundingClientRect(); const w = r.width || innerWidth, h = r.height || innerHeight; S.renderer.setSize(w, h, false); S.camera.aspect = w / h; S.camera.updateProjectionMatrix(); if (S.fx) { S.fx.setPixelRatio(S.renderer.getPixelRatio()); S.fx.setSize(w, h); } }
/* gráficos altos en PC: resplandor suave (bloom) con antialias; si la compu no da, se apaga solo */
const FX_BASE = window.FX_BASE || 'https://cdn.jsdelivr.net/gh/galessandrodale93-pixel/tras-sus-pasos-modelos@e0b87f5a4571e880bb1dc582776f6bc2daf46f04/hero/';
let FXM = null;
async function fxInit() {
  try { globalThis.__THREE = THREE; FXM = FXM || await import(FX_BASE + 'fx.js'); } catch (e) { return; }
  if (!S || S.fx || !S.renderer.capabilities.isWebGL2) return;
  const mob = matchMedia('(pointer: coarse)').matches, r = S.renderer, sz = r.getDrawingBufferSize(new THREE.Vector2()), rt = new THREE.WebGLRenderTarget(sz.x, sz.y, { type: THREE.HalfFloatType, samples: mob ? 2 : 4 });
  const c = new FXM.EffectComposer(r, rt); c.addPass(new FXM.RenderPass(S.scene, S.camera));
  c.addPass(new FXM.UnrealBloomPass(new THREE.Vector2(sz.x / 2, sz.y / 2), S.hx ? .2 : .14, .4, 1.0)); c.addPass(new FXM.OutputPass());
  S.fx = c; S.fxW = { t0: 0, n: 0, k: 0, min: mob ? 28 : 34 }; resize();
}
function fxWatch(now) {
  const w = S.fxW; if (!w || w.done || window.__fxKeep) return; if (!w.t0) { w.t0 = now; w.n = 0; return; } w.n++;
  if (now - w.t0 < 5000) return; const fps = w.n * 1000 / (now - w.t0); w.t0 = now; w.n = 0; if (w.k++ === 0) return;
  if (fps >= w.min) return;
  if (S.fx) { S.fx = null; return; } // primero se apaga el resplandor
  if (S.renderer.getPixelRatio() > 1.3) { S.renderer.setPixelRatio(1.3); resize(); } w.done = 1; // después baja la resolución
}

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
      const k = Math.min(1, (now - t0) / dur), f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
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
function bagBtn() { const b = document.getElementById('v3bag'); if (!b) return; b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 7V6a4 4 0 0 1 8 0v1h2.5a1 1 0 0 1 1 1l-1 12H5.5l-1-12a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'; b.setAttribute('aria-label', 'Abrir mochila'); }
function openBag() {
  const el = document.getElementById('v3sheet'); if (!el) return; S.joy.x = 0; S.joy.y = 0;
  el.innerHTML = `<div class="inv${S.hx ? ' hx' : ''}"><div class="inv-h"><b>Mochila</b><button class="bag-x" aria-label="Cerrar">✕</button></div>
    <div class="inv-tabs" role="tablist"><button data-t="eq" class="on">Equipo</button><button data-t="ob">Objetos</button><button data-t="me">Recuerdos</button></div>
    <div class="inv-body"></div></div>`;
  el.hidden = false; const close = () => { el.hidden = true; }; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  const tabs = el.querySelectorAll('.inv-tabs button'), body = el.querySelector('.inv-body');
  const show = t => { tabs.forEach(b => b.classList.toggle('on', b.dataset.t === t)); body.innerHTML = ''; if (t === 'eq') invEquip(body); else if (t === 'ob') invItems(body); else invMemories(body); };
  tabs.forEach(b => b.onclick = () => show(b.dataset.t)); show('eq');
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
  const set = () => { if (av) sc.remove(av); const look = lookOf(G().P()); av = S.hx ? buildHeroAvatar(look) : buildAvatar(look, false); av.traverse(o => { if (o.isPointLight) o.intensity = 0; }); if (av.userData.h3) av.userData.h3.lamp.visible = false; av.position.set(0, 0, 0); sc.add(av);
    const h = S.hx ? 1.85 * av.scale.y : 2.1; cam.position.set(0, h * .55, h * 2.75); cam.lookAt(0, h * .5, 0); };
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
  const npc = (look, x, z, face) => { const o = hx ? buildHeroAvatar(look) : buildAvatar(look, false); if (!hx) o.scale.setScalar(1.08); o.position.set(x, yAt(x, z), z); o.rotation.y = face; if (hx) o.traverse(q => { if (q.isMesh) q.castShadow = true; }); o.traverse(q => { if (q.isPointLight) q.intensity = 0; }); scene.add(o); return o; };
  const ring = (x, z) => { const m = new THREE.Mesh(new THREE.RingGeometry(.55, .7, 36), new THREE.MeshBasicMaterial({ color: '#FFD873', transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, yAt(x, z) + .05, z); m.visible = false; scene.add(m); return m; };
  const per = [0, 0, 0, 0, 0, 0, 0, 0];
  MISSIONS.forEach((d, i) => {
    const R = rng(900 + i), ns = regNodes(d.r); if (ns.length < 3) return; const slot = per[d.r]++, side = slot % 2 ? 1 : -1;
    const a = ns[Math.min(ns.length - 1, 1 + slot)], b = ns[Math.min(ns.length - 1, 3 + slot)];
    const gx = a.position.x + side * 8, gz = a.position.z - .6, giver = npc(d.giver.look, gx, gz, -side * Math.PI / 2);
    const bang = bangSprite(); bang.position.set(gx, yAt(gx, gz) + 2.35, gz); scene.add(bang);
    const m = { d, giver, bang, gp: [gx, gz] };
    if (d.kind === 'act') { const poi = (S0.pois || []).find(q => q.k === (d.place || 'temple')); let tx = poi ? poi.x : b.position.x - side * 8, tz = poi ? poi.z : b.position.z; if (poi && poi.k === 'river') { const q = poi.pts[Math.floor(poi.pts.length / 2)]; tx = q[0] - 3.3; tz = q[1]; } if (poi && poi.k === 'temple') { tx = poi.x - poi.side * 6.5; tz = poi.z; } if (poi && poi.k === 'lake') { tx = poi.x - poi.side * 33; tz = poi.z + 9; } if (poi && poi.k === 'roofhouse') { tx = poi.x - poi.side * 6; tz = poi.z + 1.5; } if (poi && poi.k === 'village') { tx = poi.x - poi.side * 1.6; tz = poi.z + 1.6; }
      if (d.target) { m.target = npc(d.target.look, tx, tz, poi ? -poi.side * Math.PI / 2 : 0); } m.tp = [tx, tz]; m.ring = ring(tx, tz); }
    else if (d.kind === 'deliver') { const tx = b.position.x - side * 8, tz = b.position.z - .4; m.target = npc(d.target.look, tx, tz, side * Math.PI / 2); m.tp = [tx, tz]; m.ring = ring(tx, tz); }
    else { const px = b.position.x - side * (12 + R() * 6), pz = b.position.z + 3 + R() * 6; m.pp = [px, pz]; m.pick = misMesh(d.item); m.pick.position.set(px, yAt(px, pz) + (d.item.k === 'jar' || d.item.k === 'honey' ? .5 : 0), pz); m.pick.visible = false; scene.add(m.pick); m.ring = ring(px, pz);
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
  el.innerHTML = `<div class="bag-in mis-in"><div class="bag-h"><b>${esc(d.giver.name)}</b><span>Misión · +${MIS_PTS} puntos</span><button class="bag-x" aria-label="Cerrar">✕</button></div><p class="mis-ask">“${esc(d.ask)}”</p><small class="mis-ref">${esc(d.ref)}</small><div class="mis-btns"><button class="mis-yes">¡Dale!</button><button class="mis-no">Ahora no</button></div></div>`;
  el.hidden = false; const close = () => { el.hidden = true; S.misSkip = d.id; };
  el.querySelector('.bag-x').onclick = close; el.querySelector('.mis-no').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  el.querySelector('.mis-yes').onclick = () => { const p = misState(); p.mact = { id: d.id, has: d.kind !== 'fetch' }; G().save(); el.hidden = true; misCarry(m, p.mact.has); if (d.kind === 'record' || d.kind === 'photo') setTimeout(() => openCapture(m), 250); };
}
function misCarry(m, on) {
  if (S.carry) { S.av.remove(S.carry); S.carry = null; }
  if (on && !['act', 'record', 'photo'].includes(m.d.kind)) { const c = misMesh(m.d.item); c.scale.setScalar(.7); c.position.y = 2.25; S.av.add(c); S.carry = c; }
  if (m.pick) m.pick.visible = !on && !!misState().mact; 
}
function misDone(m) {
  const p = misState(), d = m.d; p.missions[d.id] = true; p.mact = null; G().save(); G().refreshHud && G().refreshHud(); misCarry(m, false); if (m.ring) m.ring.visible = false; if (m.pick) m.pick.visible = false;
  misPop('¡Misión cumplida! +' + MIS_PTS, d.done); tone3d();
  if (Math.random() < .5) setTimeout(() => gearGive(gearRoll(), 'Recompensa de la misión'), 3400);
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
  { r: 4, k: 'feeding', name: 'La colina de los cinco mil', side: 1, f: .62, dx: 20 * WS }
];
function regionZ(g, r) { let a = -Infinity, b = Infinity; for (const id in g.NODES) if (id.startsWith(g.REGIONS[r].id + '-')) { const [, z] = toV(g.NODES[id].x, g.NODES[id].y); a = Math.max(a, z); b = Math.min(b, z); } return [a, b]; }
function planPois(g) {
  return POIS.filter(p => p.r < g.REGIONS.length).map(p => { const [a, b] = regionZ(g, p.r), z = a + (b - a) * p.f, x = p.side * p.dx, q = { ...p, x, z, a, b, pts: [] };
    if (p.k === 'river') { for (let zz = a + 4; zz >= b - 4; zz -= 1.5) q.pts.push([x + Math.sin(zz * .04) * 9, zz]); q.flat = q.pts; }
    else if (p.k === 'taller' || p.k === 'temple' || p.k === 'lake' || p.k === 'roofhouse' || p.k === 'feeding') { const rx = p.k === 'temple' ? 21 : p.k === 'lake' ? 40 : 19, rz = p.k === 'temple' ? 23 : p.k === 'lake' ? 36 : 17, cx2 = p.k === 'lake' ? x - p.side * 4 : x; q.flat = []; for (let u = -rx; u <= rx; u += 3) for (let v = -rz; v <= rz; v += 3) q.flat.push([cx2 + u, z + v]); }
    else { q.flat = [[x, z]]; for (let i = 0; i < 10; i++) { const an = i / 10 * 6.28; q.flat.push([x + Math.cos(an) * 5, z + Math.sin(an) * 5]); } }
    return q; });
}
function buildPois(scene, pois, hx, HW, R, ribbon) {
  const yAt = (x, z) => HW ? HW.hAt(x, z) : 0, M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: !!hx }, o || {}));
  const add = (o, x, z, ry) => { o.position.set(x, yAt(x, z), z); if (ry) o.rotation.y = ry; if (hx) o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); scene.add(o); return o; };
  const sign = (p) => { const s = new THREE.Group(); const post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 1.6, 6), M('#6A4A2C')); post.position.y = .8; s.add(post); const lb = textSprite(p.name, hx); lb.position.y = 2.1; lb.scale.multiplyScalar(1.15); s.add(lb); const sx = p.k === 'river' ? p.x - p.side * 4.5 : p.x - p.side * 4.2; add(s, sx, p.z + 3); };
  for (const p of pois) {
    if (p.k === 'village') { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + .3, r = 3 + R() * 2.5, h = house(R, hx); h.scale.setScalar(1.15 + R() * .3); add(h, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, -a + Math.PI / 2); } const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .55, 12), M('#8C8374')); w.position.y = .27; const gw = new THREE.Group(); gw.add(w); add(gw, p.x, p.z); }
    if (p.k === 'pastores') { const f = new THREE.Group(); for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(.16, 0), M('#6E665A')); const a = i / 9 * 6.28; st.position.set(Math.cos(a) * .55, .08, Math.sin(a) * .55); f.add(st); } [0, 1.2].forEach(a => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 6), M('#5A3E24')); l.rotation.set(Math.PI / 2, a, 0); l.position.y = .1; f.add(l); });
      const fl = new THREE.Mesh(new THREE.ConeGeometry(.25, .7, 7), new THREE.MeshBasicMaterial({ color: '#FFB347' })); fl.position.y = .4; f.add(fl); if (hx) { const pl = new THREE.PointLight('#FF9A3C', 6, 9, 1.6); pl.position.y = .8; f.add(pl); } add(f, p.x, p.z);
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
    if (p.k === 'river') { const water = M(hx ? '#3B6266' : '#7FC4F0', { roughness: .08, metalness: hx ? .35 : .1, flatShading: false }); const r = ribbon(p.pts, 5, water, .06); scene.add(r);
      const reed = new THREE.InstancedMesh(new THREE.CylinderGeometry(.015, .02, 1, 4), M('#6E8A44'), 160), m4 = new THREE.Matrix4(); let n = 0; for (let i = 0; i < 160; i++) { const q = p.pts[Math.floor(R() * p.pts.length)], s = R() < .5 ? -1 : 1, x = q[0] + s * (2.4 + R() * .8), z = q[1] + (R() - .5); m4.makeScale(1, .6 + R() * .7, 1); m4.setPosition(x, yAt(x, z) + .4, z); reed.setMatrixAt(n++, m4); } reed.instanceMatrix.needsUpdate = true; scene.add(reed); }
    if (p.k === 'desert') { const sand = new THREE.Mesh(new THREE.CircleGeometry(7, 28), M('#C9A86E', { flatShading: false })); sand.rotation.x = -Math.PI / 2; sand.position.set(p.x, yAt(p.x, p.z) + .03, p.z); sand.receiveShadow = true; scene.add(sand);
      for (let i = 0; i < 9; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(.6 + R() * 1.1, 0), M('#A88E66')); rk.scale.y = .6 + R() * .5; const a = R() * 6.28, r = 2 + R() * 4.5; const gr = new THREE.Group(); rk.position.y = .3; gr.add(rk); add(gr, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, R() * 6); } }
    if (!['taller', 'temple', 'lake', 'roofhouse', 'feeding'].includes(p.k)) sign(p);
  }
}
/* ---------- pueblos de la época: casas grandes con oficios, el templo y el lago ---------- */
// cajas de choque (paredes) y pisos elevados (plataforma del templo, muelle); se llenan al armar el mundo
function rotXZ(lx, lz, r) { const c = Math.cos(r), s = Math.sin(r); return [lx * c + lz * s, -lx * s + lz * c]; }
function wBox(x, z, r, lx0, lx1, lz0, lz1) { const P = [[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1]].map(([a, b]) => rotXZ(a, b, r)); return { x0: x + Math.min(...P.map(p => p[0])), x1: x + Math.max(...P.map(p => p[0])), z0: z + Math.min(...P.map(p => p[1])), z1: z + Math.max(...P.map(p => p[1])) }; }
function blockedAt(x, z) { const L = S && S.cols; if (!L) return false; const r = .34; for (const b of L) if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true; return false; }
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
  techo: ['La casa del techo abierto', 'La casa estaba tan llena que cuatro amigos subieron al techo, abrieron un hueco y bajaron a su amigo paralítico en una camilla. Jesús vio la fe de ellos, le perdonó los pecados y lo sanó.', 'Marcos 2:1-12'],
  cestas: ['La colina de los cinco mil', 'Acá comieron miles de personas con cinco panes y dos pescados que un muchachito compartió. Todos quedaron satisfechos y con lo que sobró llenaron doce canastas.', 'Juan 6:5-13'],
  carpintero: ['Carpintería', 'Acá se hacían puertas, mesas, arados y yugos para los bueyes. José era carpintero y Jesús aprendió el oficio en Nazaret. Por eso la gente lo conocía como «el carpintero».', 'Mateo 13:55 · Marcos 6:3'],
  alfarero: ['Alfarería', 'Con barro, agua y un torno se hacían las vasijas para el agua, el aceite y la harina. Dios usa esta imagen: como el barro en las manos del alfarero, así somos nosotros en sus manos.', 'Jeremías 18:1-6'],
  panadero: ['Panadería', 'El pan se horneaba todos los días en hornos de barro. Jesús dijo de sí mismo que él es el pan de vida: el que va a él nunca más tendrá hambre.', 'Juan 6:35'],
  tejedora: ['Casa de la tejedora', 'En el telar se tejía la lana y el lino para hacer túnicas y mantos. La túnica de Jesús era sin costura, tejida de una sola pieza de arriba abajo.', 'Juan 19:23'],
  pescador: ['Casa del pescador', 'Redes, canastos y remos: así trabajaban Pedro, Andrés, Santiago y Juan en el lago. Jesús los llamó a dejar las redes y seguirlo.', 'Mateo 4:18-22']
};
// casa grande en la que se puede entrar: muros con puerta, techo plano con vigas y el interior del oficio
function bigHouse(trade, hx) {
  const T = townTex(), g = new THREE.Group(), w = 7.4, d = 6.2, h = 3.3, t = .34, dw = 1.9;
  const wm = new THREE.MeshStandardMaterial({ map: T.wall, color: hx ? '#E4D2B4' : '#FFF6E6', roughness: .95 }), wmIn = new THREE.MeshStandardMaterial({ color: hx ? '#D8C6A4' : '#FFF1DA', roughness: 1 });
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
  const ld = new THREE.Group(); [-.3, .3].forEach(a => bx(.08, h + .5, .08, WOOD(), a, (h + .5) / 2, 0, ld)); for (let i = 0; i < 7; i++) bx(.6, .06, .06, WOOD(), 0, .4 + i * .5, 0, ld); ld.position.set(w / 2 + .45, 0, d / 2 - 1.2); ld.rotation.z = -.18; g.add(ld); roof.push(...ld.children);
  if (TRADES[trade]) TRADES[trade](g, w, d);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), tm('lmp', '#FFD27A', { emissive: '#FFB347', emissiveIntensity: 2.5 })); lamp.position.set(0, 2.1, -d / 2 + t + .08); g.add(lamp);
  const info = TRADE_INFO[trade]; if (info) { const lb = textSprite(info[0], hx); lb.position.set(0, h + 1.4, d / 2 + .3); lb.scale.multiplyScalar(1.05); g.add(lb); }
  const cols = [[-w / 2, w / 2, -d / 2, -d / 2 + t], [-w / 2, -w / 2 + t, -d / 2, d / 2], [w / 2 - t, w / 2, -d / 2, d / 2], [-w / 2, -dw / 2, d / 2 - t, d / 2], [dw / 2, w / 2, d / 2 - t, d / 2], [w / 2 + .1, w / 2 + .8, d / 2 - 1.6, d / 2 - .8]];
  const solid = { techo: [], carpintero: [[-w / 2 + 1, -w / 2 + 3.4, -d / 2 + 1.1, -d / 2 + 2.1], [w / 2 - 3.1, w / 2 - .5, -d / 2 + .8, -d / 2 + 1.5]], alfarero: [[-w / 2 + 1.4, -w / 2 + 2.6, -d / 2 + 1.4, -d / 2 + 2.6], [w / 2 - 3.1, w / 2 - .5, -d / 2 + .2, -d / 2 + .7], [w / 2 - 2.2, w / 2 - .4, d / 2 - 2.4, d / 2 - .6]], panadero: [[-w / 2 + .6, -w / 2 + 2.6, -d / 2 + .6, -d / 2 + 2.6], [w / 2 - 2.9, w / 2 - .7, -d / 2 + 1.1, -d / 2 + 1.9]], tejedora: [[-w / 2 + .6, -w / 2 + 3, -d / 2 + .7, -d / 2 + 1.1]], pescador: [] }[trade] || [];
  return { g, cols: cols.concat(solid), roof, room: [-w / 2 + t, w / 2 - t, -d / 2 + t, d / 2 - t], trade, w, d };
}
// coloca una casa en el mundo: rot en múltiplos de 90° para que las cajas de choque sigan alineadas
function placeHouse(scene, H, x, z, rot, y) {
  H.g.position.set(x, y, z); H.g.rotation.y = rot; scene.add(H.g);
  H.cols.forEach(c => S.cols.push(wBox(x, z, rot, ...c)));
  const r = wBox(x, z, rot, ...H.room); r.roof = H.roof; r.trade = H.trade; r.y = y; S.rooms.push(r);
}
// pozo de la plaza
function well(hx) { const w = new THREE.Group(), st = tm('st', '#8C8374'); const wall = new THREE.Mesh(new THREE.CylinderGeometry(.9, .95, .8, 18, 1, true), st); wall.material.side = THREE.DoubleSide; wall.position.y = .4; w.add(wall); const lip = new THREE.Mesh(new THREE.TorusGeometry(.92, .1, 6, 20), st); lip.rotation.x = Math.PI / 2; lip.position.y = .8; w.add(lip); [-1, 1].forEach(s => cy(.06, .06, 1.6, WOOD(), s * .85, 1.4, 0, w)); const bar = cy(.05, .05, 1.9, WOOD(), 0, 2.15, 0, w); bar.rotation.z = Math.PI / 2; cy(.15, .12, .25, WOOD(), 0, 1.5, 0, w); const water = new THREE.Mesh(new THREE.CircleGeometry(.85, 18), tm('wa', '#2E5A66', { roughness: .1, metalness: .3 })); water.rotation.x = -Math.PI / 2; water.position.y = .25; w.add(water); return w; }
// el templo de Jerusalén: atrio con pórticos, altar, fuente y el santuario con el Lugar Santo para recorrer
function bigTemple(scene, x, z, side, hx, yAt) {
  const T = townTex(), g = new THREE.Group(), rot = side > 0 ? -Math.PI / 2 : Math.PI / 2, y0 = yAt(x, z);
  const st = new THREE.MeshStandardMaterial({ map: T.wallT, color: '#FFFFFF', roughness: .85 }), stD = tm('std', hx ? '#CDBB96' : '#EADBBB'), gold = tm('gold', '#E6B84A', { metalness: .85, roughness: .3, emissive: '#5A3A08', emissiveIntensity: .25 });
  const W = 36, D = 32, P = .9; // plataforma (x local = ancho, z local: +z mira al camino)
  const plat = new THREE.Mesh(new THREE.BoxGeometry(W, P + 5, D), [stD, stD, new THREE.MeshStandardMaterial({ map: T.pave, roughness: .95 }), stD, stD, stD]); plat.position.y = P / 2 - 2.5; plat.receiveShadow = true; plat.castShadow = true; g.add(plat);
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
  const R = 30, y0 = yAt(cx, cz) - .25;
  const shore = new THREE.Mesh(new THREE.CircleGeometry(R + 4, 64), tm('sand', hx ? '#B49A6E' : '#EED9A8')); shore.rotation.x = -Math.PI / 2; shore.position.set(cx, y0 + .27, cz); shore.receiveShadow = true; scene.add(shore);
  const uni = { t: { value: 0 } }, wm = new THREE.MeshStandardMaterial({ color: hx ? '#3E7E90' : '#5FB4E6', roughness: .18, metalness: hx ? .25 : .15, transparent: true, opacity: .92 });
  wm.onBeforeCompile = sh => { sh.uniforms.wt = uni.t; sh.vertexShader = 'uniform float wt;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(position.x*.45+wt*1.4)*.035+cos(position.y*.38+wt*1.1)*.035;'); };
  const water = new THREE.Mesh(new THREE.RingGeometry(.05, R, 96, 30), wm); water.rotation.x = -Math.PI / 2; water.position.set(cx, y0 + .42, cz); water.receiveShadow = true; scene.add(water);
  // muelle de tablas que entra al agua
  const dock = new THREE.Group(), dx = cx + side * (R - 9), len = 12; for (let i = 0; i < 24; i++) bx(.48, .1, 2.2, WOODL(), -len / 2 + i * .5, 0, 0, dock).rotation.y = (i % 3 - 1) * .02; for (let i = 0; i < 7; i++) [-1, 1].forEach(s => cy(.1, .1, 1.6, WOOD(), -len / 2 + i * 2, -.6, s * 1.05, dock, 7));
  dock.position.set(dx, y0 + .62, cz + 4); scene.add(dock); const df = { x0: dx - len / 2, x1: dx + len / 2, z0: cz + 4 - 1.1, z1: cz + 4 + 1.1, y: y0 + .67 }; S.floors.push(df);
  const boat = (bx2, bz, ry) => { const b = new THREE.Group(); const hull = new THREE.Mesh(new THREE.CylinderGeometry(1, .6, 5, 14, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#7A5234', roughness: .9, side: THREE.DoubleSide })); hull.rotation.set(Math.PI / 2, 0, Math.PI); hull.scale.set(1, 1, .7); b.add(hull); [-1.2, 0, 1.2].forEach(q => bx(1.7, .08, .3, WOODL(), 0, -.15, q, b)); const mast = cy(.06, .07, 4, WOOD(), 0, 1.8, -.6, b, 7); const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), tm('sail', '#EFE6D2', { side: THREE.DoubleSide })); sail.position.set(0, 2.3, -.4); sail.rotation.y = .3; b.add(sail); [-1, 1].forEach(s => { const o = bx(.07, .05, 2.6, WOODL(), s * .9, .2, .8, b); o.rotation.x = .5; }); b.position.set(bx2, y0 + .45, bz); b.rotation.y = ry; b.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(b); return b; };
  const boats = [boat(dx - side * 5, cz + 8, .2), boat(cx - side * 6, cz - 10, 1.4), boat(cx + side * 4, cz + 14, -.8)];
  // juncos en la orilla
  const reed = new THREE.InstancedMesh(new THREE.CylinderGeometry(.015, .02, 1, 4), tm('reed', '#6E8A44'), 260), m4 = new THREE.Matrix4(), rr = rng(31); for (let i = 0; i < 260; i++) { const a = rr() * 6.28, r = R - .5 + rr() * 2.5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; m4.makeScale(1, .6 + rr() * .9, 1); m4.setPosition(x, y0 + .85, z); reed.setMatrixAt(i, m4); } scene.add(reed);
  // el agua no se camina: un anillo de cajas finas alrededor (dejando libre el muelle)
  for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, a2 = (i + 1) / 48 * 6.283, x1 = cx + Math.cos(a) * (R - 1.5), z1 = cz + Math.sin(a) * (R - 1.5), x2 = cx + Math.cos(a2) * (R - 1.5), z2 = cz + Math.sin(a2) * (R - 1.5); const b = { x0: Math.min(x1, x2) - .3, x1: Math.max(x1, x2) + .3, z0: Math.min(z1, z2) - .3, z1: Math.max(z1, z2) + .3 }; if (b.x1 > df.x0 - .5 && b.x0 < df.x1 + .5 && b.z1 > df.z0 - .5 && b.z0 < df.z1 + .5) continue; S.cols.push(b); }
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
  el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); el.querySelector('button').onclick = () => { el.hidden = true; };
  clearTimeout(placeCard.t); placeCard.t = setTimeout(() => { el.hidden = true; }, 14000); tone3d();
}
// arma todo: Nazaret con sus talleres, el templo y el lago (si existe la etapa de Galilea)
function buildTowns(scene, g, hx, HW, pois) {
  S.cols = []; S.floors = []; S.rooms = []; const yAt = (x, z) => HW ? HW.hAt(x, z) : 0;
  for (const p of pois) {
    if (p.k === 'taller') { // Nazaret: cuatro talleres alrededor de una plaza con pozo
      const pv = new THREE.Mesh(new THREE.CircleGeometry(15, 40), new THREE.MeshStandardMaterial({ map: townTex().pave, color: hx ? '#BFAE8E' : '#FFFFFF', roughness: 1 })); pv.rotation.x = -Math.PI / 2; pv.position.set(p.x, yAt(p.x, p.z) + .03, p.z); pv.receiveShadow = true; scene.add(pv);
      const w = well(hx); w.position.set(p.x, yAt(p.x, p.z), p.z); w.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(w); S.cols.push({ x0: p.x - 1, x1: p.x + 1, z0: p.z - 1, z1: p.z + 1 });
      [['carpintero', -6, -8.5, 0], ['alfarero', 6, -8.5, 0], ['panadero', -6, 8.5, Math.PI], ['tejedora', 6, 8.5, Math.PI]].forEach(([k, ox, oz, rot]) => { const H = bigHouse(k, hx), x = p.x + ox * 1.25, z = p.z + oz, y = Math.max(yAt(x, z), yAt(x - 3, z - 3), yAt(x + 3, z + 3)) - .02; placeHouse(scene, H, x, z, rot, y); });
    }
    if (p.k === 'temple') S.temple = bigTemple(scene, p.x, p.z, p.side, hx, yAt);
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
    const sh = new THREE.Shape(); sh.moveTo(0, .9); sh.lineTo(.55, .1); sh.lineTo(.2, .1); sh.lineTo(.2, -.6); sh.lineTo(-.2, -.6); sh.lineTo(-.2, .1); sh.lineTo(-.55, .1); sh.closePath(); const ag = new THREE.ShapeGeometry(sh); ag.rotateX(-Math.PI / 2); const ar = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: '#FFD25E', transparent: true, opacity: .9, depthWrite: false, side: THREE.DoubleSide })); const ap = new THREE.Group(); ar.scale.setScalar(1.5); ap.add(ar); ar.position.z = 0; S.scene.add(ap); S.wpArrow = ap; }
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
function drawMap(cv) {
  const g = G(), p = g.P(), hx = S.hx, C = mapColors(hx), dpr = Math.min(2, devicePixelRatio || 1), sc = cv.parentElement, MR = 80, zoom = S.mapZoom || 1;
  let zTop = 20, zBot = 0; for (const id in S.markers) zBot = Math.min(zBot, S.markers[id].position.z); zBot -= 20;
  const W = Math.round(sc.clientWidth * zoom), s = W / (MR * 2), H = Math.round((zTop - zBot) * s); cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const XB = MR, ox = W / 2, oy = 0, X = wx => ox + wx * s, Y = wz => oy + (zTop - wz) * s; cv._toWorld = (px, py) => [(px - ox) / s, zTop - (py - oy) / s]; cv._X = X; cv._Y = Y;
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  g.REGIONS.forEach((Rg, r) => { const [a, b] = regionZ(g, r), top = r === 0 ? zTop : (a + regionZ(g, r - 1)[1]) / 2, bot = r === g.REGIONS.length - 1 ? zBot : (b + regionZ(g, r + 1)[0]) / 2; x.fillStyle = C.land[r % 3]; x.beginPath(); x.roundRect(X(-XB), Y(top), XB * 2 * s, (top - bot) * s, 14); x.fill();
    x.fillStyle = C.ink2; x.font = '900 10px Nunito, sans-serif'; x.fillText('ETAPA ' + (r + 1), X(-XB) + 10, Y(top) + 18); x.fillStyle = C.ink; x.font = `700 ${hx ? 17 : 18}px ${hx ? 'Cinzel, Georgia' : 'Fraunces, Georgia'}, serif`; x.fillText(Rg.name, X(-XB) + 10, Y(top) + 38);
    if (!regionOpen(r)) { x.fillStyle = C.lock; x.beginPath(); x.roundRect(X(-XB), Y(top), XB * 2 * s, (top - bot) * s, 14); x.fill(); x.fillStyle = '#FFFFFF'; x.font = '800 13px Nunito, sans-serif'; x.textAlign = 'center'; x.textAlign = 'left'; x.font = '800 11px Nunito, sans-serif'; x.fillText('🔒 Se abre al terminar la etapa anterior', X(-XB) + 10, Y(top) + 56); } });
  for (const q of S.pois || []) { if (q.k === 'lake') { x.fillStyle = C.water; x.beginPath(); x.arc(X(q.x), Y(q.z), 30 * s, 0, 7); x.fill(); } if (q.k === 'river') { x.strokeStyle = C.water; x.lineWidth = 5 * s * .9; x.lineCap = 'round'; x.beginPath(); q.pts.forEach((pt, i) => i ? x.lineTo(X(pt[0]), Y(pt[1])) : x.moveTo(X(pt[0]), Y(pt[1]))); x.stroke(); } }
  x.strokeStyle = C.path; x.lineWidth = 3; x.setLineDash([6, 6]); for (const k in S.edgePts) { const pts = S.edgePts[k]; x.beginPath(); pts.forEach((pt, i) => i ? x.lineTo(X(pt[0]), Y(pt[1])) : x.moveTo(X(pt[0]), Y(pt[1]))); x.stroke(); } x.setLineDash([]);
  for (const q of S.pois || []) { const open = regionOpen(q.r); x.fillStyle = hx ? '#E9C37A' : '#FF9636'; x.globalAlpha = open ? 1 : .35; x.beginPath(); x.arc(X(q.k === 'river' ? q.pts[Math.floor(q.pts.length / 2)][0] : q.x), Y(q.z), 6, 0, 7); x.fill(); const lx = Math.max(64, Math.min(W - 64, X(q.k === 'river' ? q.pts[Math.floor(q.pts.length / 2)][0] : q.x))); x.font = '800 11px Nunito, sans-serif'; x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = C.bg; x.strokeText(q.name, lx, Y(q.z) + 19); x.fillStyle = C.ink; x.fillText(q.name, lx, Y(q.z) + 19); x.textAlign = 'left'; x.globalAlpha = 1; }
  for (const id in S.markers) { const m = S.markers[id], n = g.NODES[id], done = n.kind === 'ch' && g.isDone(id), reach = g.reachable(id); x.fillStyle = done ? '#5FD39A' : reach ? (hx ? '#FFD873' : '#FFC23D') : 'rgba(140,138,132,.7)'; x.strokeStyle = hx ? '#1A1610' : '#FFFFFF'; x.lineWidth = 2; x.beginPath(); x.arc(X(m.position.x), Y(m.position.z), 5, 0, 7); x.fill(); x.stroke(); }
  if (S.mis) for (const id in S.mis) { const m = S.mis[id]; if (p.missions && p.missions[id] || !regionOpen(m.d.r) || (p.mact && p.mact.id === id)) continue; x.fillStyle = '#FFD25E'; x.beginPath(); x.arc(X(m.gp[0]), Y(m.gp[1]), 7, 0, 7); x.fill(); x.fillStyle = '#5A3608'; x.font = '900 11px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('!', X(m.gp[0]), Y(m.gp[1]) + 4); x.textAlign = 'left'; }
  if (p.mact && S.mis && S.mis[p.mact.id]) { const m = S.mis[p.mact.id], d = m.d, goal = d.kind === 'deliver' ? m.tp : (p.mact.has ? m.gp : m.pp); x.strokeStyle = '#FFD25E'; x.lineWidth = 2.5; x.beginPath(); x.arc(X(goal[0]), Y(goal[1]), 9, 0, 7); x.stroke(); x.fillStyle = '#FFD25E'; x.beginPath(); x.arc(X(goal[0]), Y(goal[1]), 3.5, 0, 7); x.fill(); }
  const a = S.av.position, px = X(a.x), py = Y(a.z), hd = S.yaw; x.save(); x.translate(px, py); x.rotate(hd); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(0, 0, 14, 0, 7); x.fill(); x.fillStyle = hx ? '#FFFFFF' : '#2E4CB0'; x.strokeStyle = hx ? '#1A1610' : '#FFFFFF'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -11); x.lineTo(8, 8); x.lineTo(0, 4); x.lineTo(-8, 8); x.closePath(); x.fill(); x.stroke(); x.restore();
  x.fillStyle = C.ink; x.font = '900 11px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('Estás acá', px, py + 26); x.textAlign = 'left';
  if (S.wp) { const wx = X(S.wp.x), wy = Y(S.wp.z); x.fillStyle = '#E8473B'; x.beginPath(); x.arc(wx, wy - 16, 9, Math.PI * .85, Math.PI * .15); x.lineTo(wx, wy); x.closePath(); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(wx, wy - 16, 3.5, 0, 7); x.fill(); }
  if (!cv._scrolled) { cv._scrolled = 1; sc.scrollTop = Math.max(0, py - sc.clientHeight / 2); sc.scrollLeft = Math.max(0, px - sc.clientWidth / 2); }
}
function openMap() {
  let ov = document.getElementById('v3map');
  if (!ov) { ov = document.createElement('div'); ov.id = 'v3map'; ov.className = 'v3map'; ov.innerHTML = '<div class="v3map-in"><div class="v3map-h"><b>Mapa</b><span>Tocá un lugar para marcarlo como destino</span><button class="v3map-z" aria-label="Acercar o alejar">＋</button><button class="bag-x" aria-label="Cerrar mapa">✕</button></div><div class="v3map-sc"><canvas></canvas></div><div class="v3map-f"><span><i class="k1"></i>Paradas</span><span><i class="k2"></i>Misiones</span><span><i class="k3"></i>Lugares</span><button class="v3map-classic">Vista clásica</button></div></div>'; document.body.appendChild(ov);
    ov.querySelector('.bag-x').onclick = () => { ov.hidden = true; }; ov.onclick = e => { if (e.target === ov) ov.hidden = true; }; ov.querySelector('.v3map-classic').onclick = () => { ov.hidden = true; show3d(false); };
    ov.querySelector('.v3map-z').onclick = () => { const cv = ov.querySelector('canvas'), sc = cv.parentElement, cx = (sc.scrollLeft + sc.clientWidth / 2) / cv.clientWidth, cy = (sc.scrollTop + sc.clientHeight / 2) / cv.clientHeight; S.mapZoom = (S.mapZoom || 1) === 1 ? 2 : 1; ov.querySelector('.v3map-z').textContent = S.mapZoom === 1 ? '＋' : '－'; drawMap(cv); sc.scrollLeft = cx * cv.clientWidth - sc.clientWidth / 2; sc.scrollTop = cy * cv.clientHeight - sc.clientHeight / 2; };
    const cvm = ov.querySelector('canvas'); let dn = null; cvm.onpointerdown = e => { dn = [e.clientX, e.clientY]; }; cvm.onpointerup = e => { if (!dn || Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) > 8) return; dn = null; const r = cvm.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let [wx, wz] = cvm._toWorld(px, py), name = 'Destino marcado', bd = 22 * 22;
      const cand = []; (S.pois || []).forEach(q => cand.push([q.k === 'river' ? q.pts[Math.floor(q.pts.length / 2)][0] : q.x, q.z, q.name])); for (const id in S.markers) cand.push([S.markers[id].position.x, S.markers[id].position.z, G().NODES[id].label]); for (const id in (S.mis || {})) cand.push([S.mis[id].gp[0], S.mis[id].gp[1], S.mis[id].d.giver.name]);
      cand.forEach(([cx, cz, n]) => { const d = (cvm._X(cx) - px) ** 2 + (cvm._Y(cz) - py) ** 2; if (d < bd) { bd = d; wx = cx; wz = cz; name = n; } });
      if (S.wp && Math.hypot(S.wp.x - wx, S.wp.z - wz) < 3) { S.wp = null; drawMap(cvm); wpSync(); return; }
      S.wp = { x: wx, z: wz, name }; wpSync(); drawMap(cvm); setTimeout(() => { ov.hidden = true; }, 450); G().toast('Destino: ' + name + '. Seguí la flecha.'); }; }
  ov.classList.toggle('hx', !!S.hx); ov.hidden = false; ov.querySelector('canvas')._scrolled = 0; requestAnimationFrame(() => drawMap(ov.querySelector('canvas')));
}

/* ---------- movimientos: saltar, orar y saludar ---------- */
function doJump() { if (!S || S.walking || sheetUp()) return; if (S.pose === 'pray') { S.pose = null; return; } if (S.jy > .01) return; S.jv = 6.2; S.jy = .001; wake(); }
function doPray() { if (!S || S.walking || sheetUp()) return; S.pose = S.pose === 'pray' ? null : 'pray'; S.prayT = 0; S.joy.x = 0; S.joy.y = 0; wake(); actUI(); }
function doWave() { if (!S || S.walking || sheetUp()) return; if (S.pose === 'pray') S.pose = null; S.waveT = 2.2; wake(); actUI(); }
function actUI() { const b = document.querySelector('#v3acts [data-a="pray"]'); if (b) b.classList.toggle('on', S && S.pose === 'pray'); document.body.classList.toggle('v3pray', !!(S && S.pose === 'pray')); }
function wireActs() {
  let box = document.getElementById('v3acts');
  if (!box) { box = document.createElement('div'); box.id = 'v3acts'; box.className = 'v3acts';
    box.innerHTML = '<button data-a="jump" aria-label="Saltar" title="Saltar (barra espaciadora)"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 4l7 7h-4v6H9v-6H5Z" fill="currentColor"/><path d="M6 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button data-a="pray" aria-label="Arrodillarse a orar" title="Orar (tecla O)">🙏</button><button data-a="wave" aria-label="Saludar" title="Saludar (tecla H)">👋</button><button data-a="room" aria-label="Jugar con amigos" title="Jugar con amigos">👥</button><button data-a="help" aria-label="Cómo se juega" title="Cómo se juega">❔</button>';
    document.body.appendChild(box); box.querySelectorAll('button').forEach(b => b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); ({ jump: doJump, pray: doPray, wave: doWave, room: mpPanel, help: () => tutOpen(true) })[b.dataset.a](); }); }
  addEventListener('keydown', e => { if (!S || document.getElementById('view3d').hidden || e.repeat || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return; const k = e.key.toLowerCase(); if (k === ' ') { e.preventDefault(); doJump(); } else if (k === 'o') doPray(); else if (k === 'h') doWave(); else if (k === 't' && MP.code) talkStart(); });
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
  hero: ['https://music.wixstatic.com/mp3/43ca3b_db5aa7127fb44e1dbb606560c6b664fa.mp3', 'https://music.wixstatic.com/mp3/43ca3b_f4826634d6a64fa0ba1931ec39552189.mp3', 'https://music.wixstatic.com/mp3/43ca3b_7ff55051d17349809d8966f973c6e7d3.mp3', 'https://music.wixstatic.com/mp3/43ca3b_72fbdb514edb4baf80ece16dafe7e8c1.mp3'],
  kids: ['https://music.wixstatic.com/mp3/43ca3b_d7081c84642a4f9785d7acc74dbcceee.mp3', 'https://music.wixstatic.com/mp3/43ca3b_9aad181d11764abc8134acebda29167c.mp3', 'https://music.wixstatic.com/mp3/43ca3b_7bf0fa95563e49a495e3106aec385f8b.mp3', 'https://music.wixstatic.com/mp3/43ca3b_1d6feb9892734a2a9e73d38860ffe0ad.mp3'],
  orar: ['https://music.wixstatic.com/mp3/43ca3b_538f7365d7e248f1bf574404060d1d65.mp3', 'https://music.wixstatic.com/mp3/43ca3b_b29f4283091e41ebb259f0338ad83024.mp3', 'https://music.wixstatic.com/mp3/43ca3b_0ec4648425c24a579ef24a9a0b7caa81.mp3', 'https://music.wixstatic.com/mp3/43ca3b_c88f06c8392149c2a87c327e80823a50.mp3']
};
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function musTrack(list) {
  const t = { list, i: Math.floor(Math.random() * list.length), el: new Audio(), v: 0, ok: true, primed: false }; t.el.preload = 'auto'; t.el.volume = 0;
  t.el.src = list[t.i]; t.el.onended = () => { t.i = (t.i + 1) % list.length; t.el.src = list[t.i]; t.el.play().catch(() => {}); };
  t.el.onerror = () => { t.err = (t.err || 0) + 1; if (t.err > 3) { t.ok = false; return; } t.i = (t.i + 1) % list.length; t.el.src = list[t.i]; };
  return t;
}
function musInit() {
  if (AU.mus || !MUS.orar.length) return; const br = S && S.hx ? 'hero' : 'kids'; if (!MUS[br].length) return;
  AU.mus = { br, adv: musTrack(MUS[br]), pray: musTrack(MUS.orar) };
}
function musGesture() { // en un toque del usuario: habilita la reproducción (iPhone/Safari lo exigen)
  const m = AU.mus; if (!m) return;
  [m.adv, m.pray].forEach(t => { if (t.primed) return; t.primed = true; const p = t.el.play(); if (p) p.then(() => { if (t.want <= 0) t.el.pause(); }).catch(() => { t.primed = false; }); });
}
function musTick() {
  const m = AU.mus; if (!m) return false; if (S && (S.hx ? 'hero' : 'kids') !== m.br) { m.adv.el.pause(); m.adv = musTrack(MUS[S.hx ? 'hero' : 'kids']); m.br = S.hx ? 'hero' : 'kids'; m.adv.primed = false; }
  if (!m.adv.ok && !m.pray.ok) return false;
  const shown = !document.getElementById('view3d').hidden && document.getElementById('arcade').hidden, pray = S && S.pose === 'pray', on = AU.on && shown;
  m.adv.want = on && !pray ? (AU.speaking ? .22 : .55) : 0; m.pray.want = on && pray ? (AU.speaking ? .35 : .7) : 0;
  for (const t of [m.adv, m.pray]) {
    if (!t.ok) continue; const step = t.want > t.v ? .045 : .07; t.v += Math.max(-step, Math.min(step, t.want - t.v));
    try { t.el.volume = Math.max(0, Math.min(1, t.v)); } catch (e) {}
    if (t.want > 0 && t.el.paused && t.primed) t.el.play().catch(() => {});
    if (t.want <= 0 && !t.el.paused && (t.v < .01 || IOS)) t.el.pause();
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
  const c = AU.ctx; if (!c || !S) return;
  const shown = !document.getElementById('view3d').hidden && document.getElementById('arcade').hidden;
  const pray = S.pose === 'pray', tm = c.currentTime + .35;
  if (musTick()) { AU.master.gain.setTargetAtTime(0, c.currentTime, .2); AU.next = c.currentTime + .1; AU.snext = c.currentTime + .1; return; }
  if (AU.mus && !AU.bank) Object.keys(SMP).forEach(loadInst); // si la música grabada falla, vuelve la orquesta sintetizada
  AU.master.gain.setTargetAtTime(AU.on && shown ? .9 : 0, c.currentTime, .4);
  AU.adv.gain.setTargetAtTime(pray ? 0 : (AU.speaking ? .45 : 1), c.currentTime, pray ? .8 : 1.6);
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
  if (!AU.voice || !('speechSynthesis' in window)) { caption(txt, ref, 9); onend && setTimeout(onend, 9000); return; }
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt.replace(/SEÑOR/g, 'Señor') + '. ' + ref.replace(/(\d+):(\d+)-(\d+)/, '$1, versículos $2 al $3').replace(/(\d+):(\d+)/, '$1, versículo $2')); const v = esVoice(); if (v) u.voice = v; u.lang = v ? v.lang : 'es-419'; u.rate = 1.06; u.pitch = .96; u.volume = .85;
    AU.speaking = true; caption(txt, ref, 60); const t0 = performance.now(), minMs = 2500 + txt.length * 55; u.onend = u.onerror = () => { setTimeout(() => { AU.speaking = false; caption(null); onend && onend(); }, Math.max(0, minMs - (performance.now() - t0))); }; speechSynthesis.speak(u); } catch (e) { AU.speaking = false; }
}
function caption(txt, ref, secs) {
  let el = document.getElementById('v3say'); if (!el) { el = document.createElement('div'); el.id = 'v3say'; el.className = 'v3say'; document.body.appendChild(el); }
  clearTimeout(caption.t); if (!txt) { el.classList.remove('on'); return; }
  el.innerHTML = `<p>${esc(txt)}</p><small>${esc(ref)} · NTV</small>`; el.classList.add('on'); caption.t = setTimeout(() => el.classList.remove('on'), secs * 1000);
}
function stopVoice() { try { speechSynthesis.cancel(); } catch (e) {} AU.speaking = false; caption(null); }
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
  if (pray) { if (AU.speaking) return; AU.nextSay -= dt; if (AU.nextSay <= 0) { const T = VERSOS[AU.topic] || VERSOS.paz, v = T.v[(AU.vi = (AU.vi ?? -1) + 1) % T.v.length]; AU.prayVoice = true; AU.nextSay = 99; say(v[0], v[1], () => { AU.nextSay = 5; }); } return; }
  if (S.moving || S.freeMoving) AU.walkT = (AU.walkT || 0) + dt;
  if (AU.walkT > 75 && !AU.speaking) { AU.walkT = 0; const all = PASO.concat(...Object.values(VERSOS).map(t => t.v)), v = all[Math.floor(Math.random() * all.length)]; say(v[0], v[1]); }
}
function auButtons() {
  const box = document.getElementById('v3acts'); if (!box || box.querySelector('[data-a="music"]')) return;
  box.insertAdjacentHTML('afterbegin', '<button data-a="music" aria-label="Música" title="Música"></button><button data-a="voice" aria-label="Voz que lee versículos" title="Voz"></button>');
  const paint = () => { box.querySelector('[data-a="music"]').textContent = AU.on ? '🎵' : '🔇'; box.querySelector('[data-a="voice"]').textContent = AU.voice ? '🗣️' : '🤐'; box.querySelector('[data-a="music"]').classList.toggle('off', !AU.on); box.querySelector('[data-a="voice"]').classList.toggle('off', !AU.voice); };
  box.querySelector('[data-a="music"]').onpointerdown = e => { e.preventDefault(); e.stopPropagation(); AU.on = !AU.on; pref2('music', AU.on ? '1' : '0'); auStart(); paint(); };
  box.querySelector('[data-a="voice"]').onpointerdown = e => { e.preventDefault(); e.stopPropagation(); AU.voice = !AU.voice; pref2('voice', AU.voice ? '1' : '0'); if (!AU.voice) stopVoice(); paint(); };
  paint();
  const unlock = () => { auStart(); }; addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);
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
const meInfo = () => { const p = G().P(); return { name: (p.name || 'Invitado').slice(0, 16), avatar: lookOf(p), branch: G().branch }; };
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
  if (!S || MP.players[id]) return; const hx = S.hx, av = hx ? buildHeroAvatar(info.avatar || {}) : buildAvatar(info.avatar || {}, false); av.traverse(o => { if (o.isPointLight) o.intensity = 2; if (o.isMesh && hx) o.castShadow = true; });
  const tag = textSprite(info.name, hx); tag.scale.multiplyScalar(.42); tag.position.y = 2.55; av.add(tag); av.position.copy(S.av.position); av.position.x += 1.5; S.scene.add(av);
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
    <div class="mis-btns"><button class="mis-yes r-share">📨 Invitar con el link</button><button class="mis-no r-leave">Salir de la sala</button></div>
    <p class="cap-note">Mandá el link solo a personas que conocés. Para hablar mantené apretado 🎙️${matchMedia('(pointer: coarse)').matches ? '' : ' o la tecla T'}; al soltar se apaga el micrófono. ${MP.host ? 'Si salís, la sala se cierra para todos.' : ''}</p></div>`;
  el.hidden = false; el.querySelector('.bag-x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
  el.querySelector('.r-leave').onclick = () => { close(); mpLeave(); };
  el.querySelector('.r-share').onclick = async () => { const url = roomLink(), text = `¡Sumate a mi sala en Tras Sus Pasos! Código ${MP.code}`; try { if (navigator.share) { await navigator.share({ title: 'Tras Sus Pasos', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText(text + ' ' + url); G().toast('Link copiado. Pegalo en WhatsApp para invitar.'); } catch (e) { G().toast(url); } };
}
function mpAuto() { let j = null; try { j = sessionStorage.getItem('tsp:join'); sessionStorage.removeItem('tsp:join'); } catch (e) {} if (j) setTimeout(() => mpJoin(j), 800); }

/* ---------- amanecer, mediodía y atardecer: cambia solo cada 5 minutos (igual para todos en una sala) ---------- */
const DAYP = 5 * 60e3, DAYX = 50e3, DAYN = ['Amanecer', 'Mediodía', 'Atardecer'];
const DAYH = [
  { top: '#2C3C6E', mid: '#A493B8', hor: '#F8B88E', sunC: '#FFD0AE', dir: [.55, .16, -.82], sunL: '#FFC4A0', sI: 2.3, hs: '#B9BFE0', hg: '#4C3D33', hI: .62, fog: '#B19C9E', fd: .0096, st: .35, ex: 1.02 },
  { top: '#2E6CC0', mid: '#7DB1E4', hor: '#DDE8F0', sunC: '#FFF6E2', dir: [-.25, .82, -.5], sunL: '#FFF2DA', sI: 3.0, hs: '#C2D8F2', hg: '#5C4C34', hI: .85, fog: '#B7C6CF', fd: .0072, st: 0, ex: 1.0 },
  { top: '#16203C', mid: '#5B5A7A', hor: '#F0A35E', sunC: '#FFD39A', dir: [-.42, .17, -.89], sunL: '#FFC788', sI: 2.7, hs: '#9EAACB', hg: '#4A3826', hI: .62, fog: '#94705A', fd: .0105, st: 1, ex: 1.0 }];
const DAYK = [
  { top: '#F4B6A6', bot: '#FFE4C6', sun: '#FFD9B8', sI: 1.4, hs: '#F2D9E6', hg: '#C9B27A', hI: 1.0, fog: '#F6E0D2' },
  { top: '#7FB6FF', bot: '#FFE6C9', sun: '#FFF4DC', sI: 1.6, hs: '#DDEBFF', hg: '#C9B27A', hI: 1.1, fog: '#F3E6D6' },
  { top: '#6C71BC', bot: '#FFBC8C', sun: '#FFC890', sI: 1.35, hs: '#E6CFE8', hg: '#B89A6A', hI: .95, fog: '#F2D2BC' }];
let _c1 = null, _c2 = null;
const mixC = (a, b, k) => { if (!_c1) { _c1 = new THREE.Color(); _c2 = new THREE.Color(); } return _c1.set(a).lerp(_c2.set(b), k); };
function dayNow() { const n = Date.now(), i = Math.floor(n / DAYP) % 3, f = n % DAYP, k = f < DAYX ? f / DAYX : 1; return { i, prev: (i + 2) % 3, k: k * k * (3 - 2 * k) }; }
function dayTick(dt) {
  if (!S) return; S.dayAcc = (S.dayAcc || 9) + dt; if (S.dayAcc < .5) return; S.dayAcc = 0;
  const d = dayNow(), sig = d.i + ':' + d.k.toFixed(3); if (sig === S.daySig) return; S.daySig = sig;
  if (S.dayI !== undefined && S.dayI !== d.i && d.k < .5) G().toast(['🌅 Está amaneciendo…', '☀️ Llegó el mediodía.', '🌇 Empieza a atardecer…'][d.i]);
  S.dayI = d.i;
  if (S.hx && S.W) {
    const A = DAYH[d.prev], B = DAYH[d.i], k = d.k, u = S.W.sky.material.uniforms;
    ['top', 'mid', 'hor', 'sunC'].forEach(n => u[n].value.copy(mixC(A[n], B[n], k)));
    u.stars.value = A.st + (B.st - A.st) * k;
    S.W.sunDir.set(A.dir[0] + (B.dir[0] - A.dir[0]) * k, A.dir[1] + (B.dir[1] - A.dir[1]) * k, A.dir[2] + (B.dir[2] - A.dir[2]) * k).normalize();
    S.W.sunL.color.copy(mixC(A.sunL, B.sunL, k)); S.W.sunL.intensity = A.sI + (B.sI - A.sI) * k;
    S.W.hemi.color.copy(mixC(A.hs, B.hs, k)); S.W.hemi.groundColor.copy(mixC(A.hg, B.hg, k)); S.W.hemi.intensity = A.hI + (B.hI - A.hI) * k;
    S.scene.fog.color.copy(mixC(A.fog, B.fog, k)); S.scene.fog.density = A.fd + (B.fd - A.fd) * k;
    S.renderer.toneMappingExposure = A.ex + (B.ex - A.ex) * k;
  } else if (S.KL && S.KL.cv) {
    const A = DAYK[d.prev], B = DAYK[d.i], k = d.k, L = S.KL, x = L.cv.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256), top = '#' + mixC(A.top, B.top, k).getHexString(), bot = '#' + mixC(A.bot, B.bot, k).getHexString();
    gr.addColorStop(0, top); gr.addColorStop(.62, bot); gr.addColorStop(1, bot); x.fillStyle = gr; x.fillRect(0, 0, 4, 256); L.tex.needsUpdate = true;
    L.sun.color.copy(mixC(A.sun, B.sun, k)); L.sun.intensity = A.sI + (B.sI - A.sI) * k;
    if (L.hemi) { L.hemi.color.copy(mixC(A.hs, B.hs, k)); L.hemi.groundColor.copy(mixC(A.hg, B.hg, k)); L.hemi.intensity = A.hI + (B.hI - A.hI) * k; }
    if (S.scene.fog) S.scene.fog.color.copy(mixC(A.fog, B.fog, k));
  }
}

/* ---------- vestimenta de la época: se encuentra rara vez en el camino o como premio de misión ---------- */
const SLOTS = [['hat', 'Sombrero'], ['shirt', 'Camiseta'], ['pants', 'Pantalones'], ['boots', 'Botas'], ['gloves', 'Guantes']];
const RAR = { c: ['Común', '#C9C2B4', 60], r: ['Rara', '#6FB6FF', 28], e: ['Épica', '#C77DFF', 9], l: ['Legendaria', '#FFB13B', 2.5] };
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
  { id: 'evangelio', s: 'boots', r: 'l', t: 'sandal', c: '#FFF2C8', name: 'Sandalias del evangelio', desc: 'Calzados con la disposición de anunciar el evangelio de la paz (Efesios 6:15).' },
  { id: 'vendaslino', s: 'gloves', r: 'c', t: 'wrap', c: '#D8CCB0', name: 'Vendas de lino', desc: 'Para proteger las manos al cosechar.' },
  { id: 'plata', s: 'gloves', r: 'r', t: 'bracer', c: '#5A4A3A', c2: '#C8CCD4', name: 'Brazaletes de plata', desc: 'Trabajados por un platero, con dibujos de vid.' },
  { id: 'oro', s: 'gloves', r: 'e', t: 'bracer', c: '#5A3A22', c2: '#E6B84A', name: 'Brazaletes de oro', desc: 'Un regalo de valor, como los que llevaba Rebeca (Génesis 24:22).' }
];
const GBY = Object.fromEntries(GEAR.map(x => [x.id, x]));
function gearState() { const p = G().P(); p.gear = p.gear || { own: [], eq: {} }; p.gear.own = p.gear.own || []; p.gear.eq = p.gear.eq || {}; return p.gear; }
function lookOf(p) { const gs = p.gear || {}, eq = {}; for (const k in (gs.eq || {})) if (GBY[gs.eq[k]]) eq[k] = gs.eq[k]; return Object.assign({}, p.avatar || {}, { gear: eq }); }
function gearOn(av) { const o = {}, e = (av && av.gear) || {}; SLOTS.forEach(([s]) => { if (GBY[e[s]]) o[s] = GBY[e[s]]; }); return o; }
function gearRoll() {
  const st = gearState(), left = GEAR.filter(x => !st.own.includes(x.id)); if (!left.length) return null;
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
  if (!S) return; const p = G().P(), look = lookOf(p), old = S.av, av = S.hx ? buildHeroAvatar(look) : buildAvatar(look, S.hx); if (S.hx) av.traverse(o => { if (o.isMesh) o.castShadow = true; });
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
    if (d.k === 'door') { const y = yAt(d.x, d.z), g = sh(portal(d, 12)); g.position.set(d.x, y, d.z); g.rotation.y = -d.side * Math.PI / 2; scene.add(g); out.push({ d, g, anim: g.userData.anim, fx: d.x - d.side * 4.5, fz: d.z }); continue; }
    // escalera al cielo
    const y0 = yAt(d.x, d.z), g = new THREE.Group(); g.position.set(d.x, y0, d.z); g.rotation.y = d.side > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g);
    const stepM = M(hx ? '#E8DFC8' : '#FFFFFF', { emissive: '#FFF2CC', emissiveIntensity: hx ? .08 : .15 }), dep = ST.L / ST.N;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(ST.W * 2, 1, dep), stepM, ST.N), M4 = new THREE.Matrix4();
    for (let i = 0; i < ST.N; i++) { const top = (i + 1) * ST.H / ST.N, hh = Math.min(top, 3); M4.compose(new THREE.Vector3(0, top - hh / 2, (i + .5) * dep), new THREE.Quaternion(), new THREE.Vector3(1, hh, 1)); im.setMatrixAt(i, M4); }
    im.receiveShadow = true; im.castShadow = !!hx; g.add(im);
    const railM = new THREE.MeshBasicMaterial({ color: '#FFE7A0', transparent: true, opacity: .8 }), len = Math.hypot(ST.L, ST.H), ang = Math.atan2(ST.H, ST.L);
    [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, len, 8), railM); r.rotation.x = Math.PI / 2 - ang; r.position.set(s * (ST.W + .1), ST.H / 2 + 1.1, ST.L / 2); g.add(r); for (let i = 0; i <= 10; i++) { const u = i / 10, p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.1, 6), railM); p.position.set(s * (ST.W + .1), u * ST.H + .55, u * ST.L); g.add(p); } });
    const plat = new THREE.Mesh(new THREE.BoxGeometry(8.4, 1.2, ST.P), stepM); plat.position.set(0, ST.H - .6, ST.L + ST.P / 2); g.add(plat);
    const pt = portal(d, 11); pt.position.set(0, ST.H - 1.35, ST.L + ST.P - 1.2); pt.rotation.y = Math.PI; pt.scale.setScalar(.62); g.add(pt);
    const cloudM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, transparent: true, opacity: .88, emissive: '#FFF4E0', emissiveIntensity: .35 });
    for (let i = 0; i < 26; i++) { const a = i / 26 * 6.28, r = 6 + hsh(i, 2) * 6, c = new THREE.Mesh(new THREE.SphereGeometry(1.4 + hsh(i, 5) * 1.8, 12, 10), cloudM); c.scale.y = .55; c.position.set(Math.cos(a) * r, ST.H - 1.6 + hsh(i, 7) * 1.4, ST.L + ST.P / 2 + Math.sin(a) * r * .8); g.add(c); }
    for (let i = 0; i < 9; i++) { const u = i / 9, c = new THREE.Mesh(new THREE.SphereGeometry(1.2 + hsh(i, 3), 10, 8), cloudM); c.scale.y = .5; c.position.set((i % 2 ? 1 : -1) * (ST.W + 1.5 + hsh(i, 4) * 2), u * ST.H + .2, u * ST.L); g.add(c); }
    const beamM = new THREE.MeshBasicMaterial({ color: '#FFF1C2', transparent: true, opacity: .14, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, 90, 24, 1, true), beamM); beam.position.set(0, ST.H + 45, ST.L + ST.P / 2); g.add(beam);
    const up = textSprite('☁️ Subí acá', hx); up.scale.multiplyScalar(2.2); up.position.set(0, 3.6, -1.5); g.add(up);
    const ar = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.2, 4), new THREE.MeshBasicMaterial({ color: '#FFD25E' })); ar.rotation.x = Math.PI; ar.position.set(0, 2.2, -1.5); g.add(ar); up.userData.ar = ar;
    if (hx) { const pl = new THREE.PointLight('#FFE7A0', 30, 26, 1.4); pl.position.set(0, ST.H + 4, ST.L + 2); g.add(pl); }
    S_stair = { x: d.x, z: d.z, side: d.side, y0 }; out.push({ d, g, top: true, ar, anim: pt.userData.anim, fx: d.x + d.side * (ST.L + ST.P * .6), fz: d.z });
  }
  return out;
}
let S_stair = null;
function doorTick(t) {
  if (!S || !S.doors || document.getElementById('view3d').hidden) return; const a = S.av.position;
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
    el.hidden = false; el.querySelector('.tut-next').onclick = () => { if (++i >= steps.length) el.hidden = true; else draw(); };
    const pv = el.querySelector('.tut-prev'); if (pv) pv.onclick = () => { i--; draw(); }; el.querySelector('.tut-skip').onclick = () => { el.hidden = true; }; };
  draw();
}

/* ---------- personajes 3D de Hero: modelos esculpidos con esqueleto y animaciones (Quaternius, CC0) ---------- */
const H3 = { ok: false, fail: false, sex: {}, clips: null, skClone: null, npcs: [] };
const H3_BASE = window.H3_BASE || 'https://cdn.jsdelivr.net/gh/galessandrodale93-pixel/tras-sus-pasos-modelos@a8074e269e9cf4c327692e2d3303e0bbf17c7ed0/hero/';
async function heroLoad() {
  if (H3.ok || H3.fail) return;
  try {
    globalThis.__THREE = THREE; const mod = await import(H3_BASE + 'gltf.js'), L = new mod.GLTFLoader();
    const ld = u => new Promise((r, j) => L.load(H3_BASE + u, r, undefined, j));
    const [m, f, an] = await Promise.race([Promise.all([ld('hero_m.glb'), ld('hero_f.glb'), ld('hero_anims.glb')]), new Promise((_, j) => setTimeout(() => j(new Error('tiempo')), 45000))]);
    H3.skClone = mod.skClone; const all = gl => { const r = new THREE.Group(); gl.scenes.forEach(x => r.add(x)); return r; }; H3.sex.m = h3Template(all(m)); H3.sex.f = h3Template(all(f));
    H3.clips = Object.fromEntries(an.animations.map(c => [c.name, c])); H3.ok = true;
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
function buildHero3(av) {
  const sx = av.g === 'chica' ? 'f' : 'm', tpl = H3.sex[sx], o = H3.skClone(tpl.T), D = gearOn(av), npc = !('gear' in av), hx = (it) => it && H3_GEAR[it.id];
  const pick = { body: (hx(D.shirt) || {}).p || 'Peasant', legs: (hx(D.pants) || {}).p || 'Peasant', feet: (hx(D.boots) || {}).p || 'Peasant' };
  const tint = { body: (hx(D.shirt) || {}).t || (npc && av.outfit ? new THREE.Color(av.outfit).lerp(new THREE.Color('#FFFFFF'), .35).getStyle() : null), legs: (hx(D.pants) || {}).t, feet: (hx(D.boots) || {}).t, bracer: (hx(D.gloves) || {}).t, hood: (hx(D.hat) || {}).hood };
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
  const age = Math.max(12, Math.min(18, av.age || 16)); o.scale.setScalar(npc ? 1 : .9 + (age - 12) / 6 * .1);
  const mixer = new THREE.AnimationMixer(o), act = {}; for (const k in H3.clips) act[k] = mixer.clipAction(H3.clips[k]);
  act.Idle_Loop.play(); mixer.update(Math.random() * 3);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.36, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .3, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; o.add(shadow);
  o.userData = { hero: true, h3: { mixer, act, cur: 'Idle_Loop', bones, lamp, npc } };
  if (npc) H3.npcs.push(o);
  return o;
}
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
  const want = st.pose === 'pray' ? 'Fixing_Kneeling' : air ? 'Jump_Loop' : u.moving ? (u.run === false ? 'Walk_Loop' : 'Jog_Fwd_Loop') : 'Idle_Loop';
  if (want !== u.cur) { const a = u.act[want], o = u.act[u.cur]; a.reset(); a.timeScale = 1; if (want === 'Fixing_Kneeling') { a.time = a.getClip().duration * .3; a.timeScale = 0; } a.play(); if (o) a.crossFadeFrom(o, .28, false); u.cur = want; }
  if (u.cur === 'Jog_Fwd_Loop') u.act.Jog_Fwd_Loop.timeScale = 1.15;
  u.mixer.update(dt); av.updateMatrixWorld(true);
  if (p > .01) { // de rodillas con las dos rodillas en el piso
    ['l', 'r'].forEach(sd => { const sx = sd === 'l' ? .1 : -.1; h3aim(av, B, 'thigh_' + sd, 'calf_' + sd, sx, -1, .32, p); h3aim(av, B, 'calf_' + sd, 'foot_' + sd, sx * .4, -.1, -1, p); h3aim(av, B, 'foot_' + sd, 'ball_' + sd, 0, -.12, -1, p); });
    const V = h3vec(), pv = B.pelvis, kl = B.calf_l, kr = B.calf_r;
    if (pv && kl && kr) { kl.getWorldPosition(V.a); kr.getWorldPosition(V.b); const knee = Math.min(V.a.y, V.b.y); av.getWorldPosition(V.d); const dy = (V.d.y + .07 * av.scale.y - knee) * Math.min(1, p);
      pv.getWorldPosition(V.a); V.a.y += dy; pv.parent.worldToLocal(V.a); pv.position.copy(V.a); pv.updateMatrixWorld(true); }
  }
  if (p > .01) { h3aim(av, B, 'spine_01', 'spine_02', 0, 1, .05, p); h3aim(av, B, 'spine_02', 'spine_03', 0, 1, .05, p); h3aim(av, B, 'spine_03', 'neck_01', 0, 1, .08, p); h3aim(av, B, 'neck_01', 'Head', 0, 1, .3, p);
    h3aim(av, B, 'upperarm_r', 'lowerarm_r', .18, -.88, .48, p); h3aim(av, B, 'lowerarm_r', 'hand_r', .38, .8, .45, p); h3aim(av, B, 'upperarm_l', 'lowerarm_l', -.18, -.88, .48, p); h3aim(av, B, 'lowerarm_l', 'hand_l', -.38, .8, .45, p); }
  if (q > .01) { h3aim(av, B, 'upperarm_r', 'lowerarm_r', -.85, .38, .18, q); h3aim(av, B, 'lowerarm_r', 'hand_r', -.15 + Math.sin(t * 11) * .38, 1, .15, q); }
  if (u.lamp.visible) { const V = h3vec(); B.hand_r.getWorldPosition(V.a); av.worldToLocal(V.a); u.lamp.position.copy(V.a); u.lamp.position.y -= .1 / av.scale.y; }
}
function h3npcTick(dt) {
  if (!S || !H3.npcs.length) return; const a = S.av.position;
  for (const o of H3.npcs) { if (!o.parent) continue; const d = (o.position.x - a.x) ** 2 + (o.position.z - a.z) ** 2; if (d < 1600) o.userData.h3.mixer.update(dt); }
}

/* ---------- caminar libre ---------- */
function nearestPath(x, z) { let d = Infinity; for (const p of S.allPts) { const q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } return Math.sqrt(d); }
function frontier() { const g = G(), regs = new Set(); for (const id in S.markers) if (g.reachable(id)) regs.add(g.REGIONS.findIndex(R => id.startsWith(R.id))); let m = 0; for (const id in S.markers) if (regs.has(g.REGIONS.findIndex(R => id.startsWith(R.id)))) m = Math.min(m, S.markers[id].position.z); return m - 2; }
function sheetUp() { const v = document.getElementById('v3sheet'); return (v && !v.hidden) || !!document.querySelector('.sheet:not([hidden])') || !document.getElementById('arcade').hidden; }
function autoEnter() {
  const g = G(), p = g.P(), a = S.av.position; let best = null, bd = .95 * .95;
  for (const id in S.markers) { const m = S.markers[id], d = (m.position.x - a.x) ** 2 + (m.position.z - a.z) ** 2; if (d < bd) { bd = d; best = id; } }
  if (!best) { if (S.onStop) { const m = S.markers[S.onStop]; if ((m.position.x - a.x) ** 2 + (m.position.z - a.z) ** 2 > 2.4) S.onStop = null; } return; }
  if (best === S.onStop) return;
  S.onStop = best; const n = g.NODES[best];
  if (!g.reachable(best)) return;
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
  const mag = Math.min(1, Math.hypot(jx, jy)); if (mag >= .12 && S.pose === 'pray') { S.pose = null; actUI(); } if (mag < .12) { if (S.freeMoving) { S.freeMoving = false; snapToStop(); } return; }
  const C = S.yaw + S.camYaw, fx = Math.sin(C), fz = Math.cos(C), rx = -Math.cos(C), rz = Math.sin(C);
  let mx = fx * -jy + rx * jx, mz = fz * -jy + rz * jx; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
  const sp = 5 * mag * dt, a = S.av.position, fr = frontier(), z0 = 6;
  const ok = (x, z) => Math.abs(x) < XB && z > fr && z < z0 && !blockedAt(x, z);
  let nx = a.x + mx * sp, nz = a.z + mz * sp;
  if (!ok(nx, nz)) { if (nz <= fr && performance.now() - (S.wallT || 0) > 6000) { S.wallT = performance.now(); G().toast('Para seguir explorando, terminá esta etapa.'); } if (ok(nx, a.z)) nz = a.z; else if (ok(a.x, nz)) nx = a.x; else { nx = a.x; nz = a.z; } }
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
  addEventListener('keydown', e => { if (!S || document.getElementById('view3d').hidden) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(k)) { S.keys[k] = true; e.preventDefault(); } });
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
    S.camYaw = down.yaw - dx * .008; S.camPitch = Math.max(-.18, Math.min(1.2, down.pitch + dy * .005)); };
  cv.onpointercancel = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; down = null; };
  cv.onwheel = e => { e.preventDefault(); wake(); S.camDist = Z(S.camDist * Math.exp(e.deltaY * .0012)); };
  // botones de cámara: acercar, alejar y volver atrás del personaje
  const cb = document.createElement('div'); cb.className = 'v3cam'; cb.innerHTML = '<button data-z="-1" aria-label="Acercar cámara">+</button><button data-z="1" aria-label="Alejar cámara">−</button><button data-z="0" aria-label="Centrar cámara">⌖</button>';
  cb.onpointerdown = e => e.stopPropagation(); cb.onclick = e => { const z = e.target.closest('button'); if (!z) return; wake(); const k = +z.dataset.z; if (k) S.camDist = Z(S.camDist * (k > 0 ? 1.3 : 1 / 1.3)); else { S.camYaw = 0; S.camPitch = .4; S.camDist = 6.6; } };
  S.root.querySelectorAll('.v3cam').forEach(x => x.remove()); S.root.appendChild(cb);
  if (!window.__camKeys) window.__camKeys = 1, addEventListener('keydown', e => { if (!S || document.getElementById('view3d').hidden || sheetUp() || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return; const k = e.key.toLowerCase();
    if (k === '+' || k === '=') S.camDist = Z(S.camDist / 1.2); else if (k === '-' || k === '_') S.camDist = Z(S.camDist * 1.2); else if (k === 'q') S.camYaw += .12; else if (k === 'e') S.camYaw -= .12; else if (k === 'r') S.camPitch = Math.max(-.18, S.camPitch - .08); else if (k === 'f') S.camPitch = Math.min(1.2, S.camPitch + .08); });
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
  const root = S.root; if (!root || root.hidden || root.closest('main').hidden || document.hidden) return;
  const t = now / 1000, dt = Math.min(.05, (now - (S.last || now)) / 1000); S.last = now; S.t = t;
  freeWalk(dt); refresh(); animAvatar(S.av, t, (S.moving || S.freeMoving) && !(S.jy > .02), dt); applyPose(S.av, t, dt);
  for (const [id, m] of Object.entries(S.items)) {
    if (m.userData.gone) { m.userData.gone += dt; const k = m.userData.gone / .5; m.scale.setScalar(1 + k); m.position.y += dt * 2; m.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - k); } }); if (k >= 1) { S.scene.remove(m); delete S.items[id]; } continue; }
    m.rotation.y = t * 1.6; m.position.y = (m.userData.by || 0) + .85 + Math.sin(t * 2.4 + id.length) * .12;
    if ((m.position.x - S.av.position.x) ** 2 + (m.position.z - S.av.position.z) ** 2 < 2.6) collect(id, m);
  }
  const yaw = S.yaw + S.camYaw, a = S.av.position, ph = S.camPitch ?? .4, back = S.camDist * Math.cos(ph), up = 1.3 + S.camDist * Math.sin(ph);
  { const gnd = Math.max(S.W ? Math.max(0, S.W.hAt(a.x, a.z)) : 0, stairH(a.x, a.z), floorH(a.x, a.z)); S.gy = (S.gy ?? gnd) + (gnd - (S.gy ?? gnd)) * Math.min(1, dt * 12); if (S.jy > 0) { S.jv -= 17 * dt; S.jy = Math.max(0, S.jy + S.jv * dt); } a.y = S.gy + (S.jy || 0); }
  if (S.W) { S.W.sunL.position.set(a.x + S.W.sunDir.x * 40, a.y + 11, a.z + S.W.sunDir.z * 40); S.W.sunL.target.position.copy(a); S.uGrass.value = t; S.W.sky.material.uniforms.t.value = t; }
  const cx = a.x - Math.sin(yaw) * back, cz = a.z - Math.cos(yaw) * back;
  S.camera.position.x += (cx - S.camera.position.x) * .08; S.camera.position.z += (cz - S.camera.position.z) * .08; { const cg = S.W ? S.W.hAt(S.camera.position.x, S.camera.position.z) : 0; S.camera.position.y += (Math.max(a.y + up, cg + .45) - S.camera.position.y) * .08; }
  { const la = Math.min(4.5, 1.2 + S.camDist * .5) * Math.max(.15, 1 - Math.max(0, ph - .4) * 1.2); S.camera.lookAt(a.x + Math.sin(yaw) * la, a.y + 1.2 + Math.max(0, .3 - ph) * 4, a.z + Math.cos(yaw) * la); } if (S.W) S.W.sky.position.copy(S.camera.position);
  S.fill.position.copy(S.camera.position); S.fill.target.position.copy(a);
  Object.values(S.markers).forEach((m, i) => { m.userData.orb.rotation.y = t * 1.4 + i; m.userData.orb.position.y = (m.userData.orb.geometry.type === 'TorusGeometry' ? .2 : 1.05 + Math.sin(t * 2 + i) * .08); });
  if (S.flies) { S.flies.material.opacity = .6 + Math.sin(t * 3) * .3; S.flies.rotation.y = Math.sin(t * .05) * .02; }
  if (window.__camFix) { const f = window.__camFix; S.camera.position.set(...f.p); S.camera.lookAt(...f.l); }
  fxWatch(now); if (S.W) { const u = S.W.sky.material.uniforms; u.inv.value = S.fx ? 1 : 0; u.ex.value = S.renderer.toneMappingExposure; }
  if (S.fx) S.fx.render(dt); else S.renderer.render(S.scene, S.camera);
  idle(dt); misTick(t); voiceTick(dt); wpTick(t); mpTick(t, dt); dayTick(dt); gearDropTick(dt, t); doorTick(t); h3npcTick(dt); roomTick(dt);
}

/* ---------- cuando el jugador se queda quieto ---------- */
const THINK = {
  kids: ['¿A dónde seguimos?', '¿Qué habrá más adelante?', '¡Vamos, que el camino sigue!', '¿Y si busco algún objeto escondido?', 'Mmm… ¿por dónde era?'],
  hx: ['¿A dónde seguimos?', 'Algo me dice que hay más por descubrir…', '¿Qué habrá detrás de esos árboles?', 'El camino sigue. ¿Vamos?', 'Siento que me falta encontrar algo…']
};
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
  if (S.idleT > 30 && !S.think.classList.contains('on')) { const L = S.hx ? THINK.hx : THINK.kids; S.think.firstChild.textContent = L[Math.floor(Math.random() * L.length)]; S.think.classList.add('on'); }
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
  if (!on) { root.hidden = true; btn.innerHTML = '<span>Vista 3D</span>'; document.body.classList.remove('v3on'); G().syncMap(); return; }
  root.hidden = false; document.body.classList.add('v3on'); btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Mapa</span>';
  const g = G(), key = g.branch + '|' + g.P().id + '|' + JSON.stringify(g.P().avatar);
  if (!THREE) { if (!loading) loading = import(THREE_URL); try { THREE = await loading; } catch (e) { root.hidden = true; document.body.classList.remove('v3on'); btn.hidden = true; return; } }
  if (builtFor !== key || !S) { if (S) { S.renderer.dispose(); S = null; } builtFor = key; await build(); }
  else { const n = g.NODES[g.P().pos], [x, z] = toV(n.x, n.y); S.av.position.set(x, 0, z); S.sig = ''; S.onStop = g.P().pos; S.quiet = false; }
  resize(); refresh(); bagBtn();
}
export function enter() {
  const btn = document.getElementById('viewToggle'); if (!btn) return;
  btn.hidden = false; btn.onclick = () => { if (document.getElementById('view3d').hidden) show3d(true); else if (S) openMap(); };
  const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!ok) { btn.hidden = true; return; }
  show3d(pref() === '3d');
}
window.W3 = { enter, get state() { return S; }, AU, gearGive: id => gearGive(GBY[id], 'Prueba'), GEAR, reLook };
