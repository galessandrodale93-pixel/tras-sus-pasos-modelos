/* Idiomas del juego.
   El juego está escrito en español. Para otro idioma, app/i18n/<idioma>.json trae las traducciones con el texto en español como clave:
   - "Texto exacto": "Translation"
   - con números: "Nivel {n}": "Level {n}" (los números se copian en el mismo orden)
   - con partes que cambian: "{*} y todo lo de abajo": "{*} and everything below" (cada {*} se traduce aparte)
   Lo que se ve en pantalla se traduce solo, al aparecer. Lo que todavía no tiene traducción queda en español y se anota en window.__i18nMiss
   para sumarlo a la próxima tanda. Las voces del idioma están en app/voice/<idioma>/ con el mismo nombre de archivo que la voz en español. */
export const SUP = { es: 'Español', en: 'English', pt: 'Português' };
function pick() { try { const s = localStorage.getItem('tsp:lang'); if (SUP[s]) return s; } catch (e) {} return 'es'; }
export const LANG = pick();
export function setLang(l) { try { localStorage.setItem('tsp:lang', SUP[l] ? l : 'es'); } catch (e) {} location.reload(); }

const LIB = {
  en: { Lucas: 'Luke', Juan: 'John', Mateo: 'Matthew', Marcos: 'Mark', 'Isaías': 'Isaiah', Salmo: 'Psalm', Salmos: 'Psalms', 'Éxodo': 'Exodus', 'Génesis': 'Genesis', Deuteronomio: 'Deuteronomy', Hechos: 'Acts', 'Jeremías': 'Jeremiah', 'Números': 'Numbers', Proverbios: 'Proverbs', Hebreos: 'Hebrews', Samuel: 'Samuel', Apocalipsis: 'Revelation', Reyes: 'Kings', Rut: 'Ruth', 'Levítico': 'Leviticus', Ezequiel: 'Ezekiel', Romanos: 'Romans', Miqueas: 'Micah', Filipenses: 'Philippians', Corintios: 'Corinthians', Santiago: 'James', 'Josué': 'Joshua', 'Gálatas': 'Galatians', Efesios: 'Ephesians', Oseas: 'Hosea', 'Nehemías': 'Nehemiah', 'Jonás': 'Jonah', Colosenses: 'Colossians', 'Zacarías': 'Zechariah', 'Sofonías': 'Zephaniah', Jueces: 'Judges', Habacuc: 'Habakkuk', 'Eclesiastés': 'Ecclesiastes', Daniel: 'Daniel', Cantares: 'Song of Songs', 'Amós': 'Amos', Timoteo: 'Timothy', Pedro: 'Peter', 'Crónicas': 'Chronicles', 'Malaquías': 'Malachi' },
  pt: { Lucas: 'Lucas', Juan: 'João', Mateo: 'Mateus', Marcos: 'Marcos', 'Isaías': 'Isaías', Salmo: 'Salmo', Salmos: 'Salmos', 'Éxodo': 'Êxodo', 'Génesis': 'Gênesis', Deuteronomio: 'Deuteronômio', Hechos: 'Atos', 'Jeremías': 'Jeremias', 'Números': 'Números', Proverbios: 'Provérbios', Hebreos: 'Hebreus', Samuel: 'Samuel', Apocalipsis: 'Apocalipse', Reyes: 'Reis', Rut: 'Rute', 'Levítico': 'Levítico', Ezequiel: 'Ezequiel', Romanos: 'Romanos', Miqueas: 'Miqueias', Filipenses: 'Filipenses', Corintios: 'Coríntios', Santiago: 'Tiago', 'Josué': 'Josué', 'Gálatas': 'Gálatas', Efesios: 'Efésios', Oseas: 'Oseias', 'Nehemías': 'Neemias', 'Jonás': 'Jonas', Colosenses: 'Colossenses', 'Zacarías': 'Zacarias', 'Sofonías': 'Sofonias', Jueces: 'Juízes', Habacuc: 'Habacuque', 'Eclesiastés': 'Eclesiastes', Daniel: 'Daniel', Cantares: 'Cânticos', 'Amós': 'Amós', Timoteo: 'Timóteo', Pedro: 'Pedro', 'Crónicas': 'Crônicas', 'Malaquías': 'Malaquias' } };
/* citas bíblicas («Lucas 2:1-5 · Mateo 2:1»): solo cambia el nombre del libro */
function cita(k) { const B = LIB[LANG]; if (!B || !/\d/.test(k)) return null; let ok = true; const r = k.replace(/[A-Za-zÀ-ÿ]+/g, w => { if (B[w]) return B[w]; ok = false; return w; }); return ok ? r : null; }
const Y = { en: 'and', pt: 'e' }; const NOMBRE = /^$/;
let D = null, LOW = null; const P = [], CACHE = new Map(), OUT = new Set(), MISS = new Set();
const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = s => s.replace(/\s+/g, ' ').trim();
export const ready = LANG === 'es' ? Promise.resolve() :
  fetch(new URL(`./i18n/${LANG}.json`, import.meta.url).href).then(r => r.ok ? r.json() : {}).then(j => {
    D = new Map(); LOW = new Map();
    for (const k in j) { if (k.includes('{*}')) P.push([new RegExp('^' + k.split('{*}').map(s => rx(s).replace(/\\\{n\\\}/g, '(\\d+(?:[.,]\\d+)*)')).join('(.+?)') + '$'), j[k], k]); else { D.set(k, j[k]); LOW.set(k.toLowerCase(), j[k]); } OUT.add(norm(String(j[k]).replace(/\{\*\}|\{n\}/g, ''))); }
    P.sort((a, b) => b[2].length - a[2].length);
  }).catch(() => { D = new Map(); });

/* busca la traducción de un texto ya normalizado; null si no hay */
function look(k) {
  if (CACHE.has(k)) return CACHE.get(k);
  let r = D.get(k);
  if (r == null) { const nums = []; const kn = k.replace(/\d+(?:[.,]\d+)*/g, m => { nums.push(m); return '{n}'; }); if (nums.length) { const x = D.get(kn); if (x != null) { let i = 0; r = x.replace(/\{n\}/g, () => nums[i++] || ''); } } }
  /* con partes que cambian: solo vale si cada parte también se traduce (o es un número, o un nombre que no cambia) */
  if (r == null) for (const [re, v] of P) { const m = k.match(re); if (!m) continue; const g = m.slice(1).map(x => { const y = norm(x); if (!/[A-Za-zÀ-ÿ]/.test(y)) return x; const z0 = look(y); const z = z0 == null ? null : x.match(/^\s*/)[0] + z0 + x.match(/\s*$/)[0]; return z == null ? (/^[A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿ'’-]*$/.test(y) ? y : null) : z; }); if (g.includes(null)) continue; let i = 0; r = v.replace(/\{\*\}|\{n\}/g, () => g[i++] || ''); break; }
  if (r == null) r = cita(k);
  /* EN MAYÚSCULAS (carteles del mundo) */
  if (r == null && k === k.toUpperCase() && k !== k.toLowerCase()) { const x = LOW.get(k.toLowerCase()); if (x != null) r = x.toUpperCase(); }
  /* con símbolos alrededor: «← Tecoa», «🔥 Pedernal», «Jope →» */
  if (r == null) { const m = k.match(/^([^A-Za-zÀ-ÿ¡¿«"“]*)(.*?)([^A-Za-zÀ-ÿ.!?»"”)…]*)$/); if (m && (m[1] || m[3]) && m[2]) { const z = look(m[2]); if (z != null) r = m[1] + z + m[3]; } }
  /* partes separadas por « · »: «Nazaret · 64 m», «Tu primer camino · 0 de 3» */
  if (r == null && k.includes(' · ')) { let any = false; const g = k.split(' · ').map(x => { if (!/[A-Za-zÀ-ÿ]{2}/.test(x.replace(/\b\d+(?:[.,]\d+)?\s?(m|km|s|MB|min)\b/g, ''))) return x; const z = look(x); if (z != null) { any = true; return z; } return /^[A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿ'’-]*$/.test(x) ? x : null; }); if (any && !g.includes(null)) r = g.join(' · '); }
  /* mayúscula/minúscula distinta: «retama» → «Retama» */
  if (r == null) { const x = LOW.get(k.toLowerCase()); if (x != null) r = /^[a-záéíóúñ]/.test(k) && /^[A-Z]/.test(x) && !NOMBRE.test(k) ? x.charAt(0).toLowerCase() + x.slice(1) : x; }
  /* listas: «retama, higuera y sicómoro» */
  if (r == null && /, | y /.test(k) && !/[.!?¿¡:]/.test(k)) { const it = k.split(/, | y /); if (it.length > 1 && it.length < 12) { const g = it.map(x => look(x)); if (!g.includes(null)) r = g.slice(0, -1).join(', ') + ' ' + Y[LANG] + ' ' + g[g.length - 1]; } }
  /* varias oraciones juntas: se traduce cada una */
  if (r == null) { const ps = k.split(/(?<=[.!?…»)])\s+(?=[¡¿«"“(A-ZÁÉÍÓÚÑ0-9])/); if (ps.length > 1) { const g = ps.map(x => look(x)); if (!g.includes(null)) r = g.join(' '); } }
  if (r != null && CACHE.size < 30000) CACHE.set(k, r);
  return r;
}
export function t(s) {
  if (!D || !s || typeof s !== 'string') return s;
  const k = norm(s); if (!k || !/[A-Za-zÀ-ÿ]/.test(k)) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  let r = look(k);
  if (r == null) { if (!OUT.has(k)) MISS.add(k); return s; }
  return lead + r + trail;
}
window.TSP_T = t; window.TSP_LANG = LANG; window.__i18nMiss = MISS;

/* la pantalla: textos, títulos y ayudas de los botones */
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'CANVAS', 'svg']);
const ATT = ['title', 'aria-label', 'placeholder'];
function tn(n) { const v = n.nodeValue; if (!v || n.__tr === v) return; const cx = n.parentElement && n.parentElement.closest('[data-i18n-ctx]'); const kc = cx && D && D.get(cx.getAttribute('data-i18n-ctx') + '|' + norm(v)); const r = kc != null && kc !== false && kc !== undefined ? v.match(/^\s*/)[0] + kc + v.match(/\s*$/)[0] : t(v); n.__tr = r; if (r !== v) n.nodeValue = r; }
function walk(el) {
  if (el.nodeType === 3) return tn(el);
  if (el.nodeType !== 1 || SKIP.has(el.tagName) || (el.hasAttribute && el.hasAttribute('data-notr'))) return;
  for (const a of ATT) if (el.hasAttribute(a)) { const v = el.getAttribute(a), r = t(v); if (r !== v) el.setAttribute(a, r); }
  for (const c of el.childNodes) walk(c);
}
if (LANG !== 'es') ready.then(() => {
  document.documentElement.lang = LANG; walk(document.documentElement);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') tn(m.target); else if (m.type === 'attributes') { const v = m.target.getAttribute(m.attributeName), r = t(v); if (r !== v) m.target.setAttribute(m.attributeName, r); } else m.addedNodes.forEach(walk); } })
    .observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATT });
});
