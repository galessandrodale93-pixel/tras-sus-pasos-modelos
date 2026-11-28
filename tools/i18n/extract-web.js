// Cada literal de texto o plantilla se parte por las etiquetas HTML (cada pedazo es un texto de la pantalla); lo que va entre ${...} queda como {*}.
const fs = require('fs'), path = require('path');
const WEB = path.join(__dirname, "../../habitat-web");

const keys = new Map();
function lits(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); if (i < 0) break; i += 2; continue; }
    if (c === "'" || c === '"') { let j = i + 1, s = ''; while (j < src.length && src[j] !== c) { if (src[j] === '\\') { s += src[j + 1] === 'n' ? '\n' : src[j + 1]; j += 2; continue; } if (src[j] === '\n') break; s += src[j++]; } out.push(s); i = j + 1; continue; }
    if (c === '`') { let j = i + 1, s = '', d = 0; while (j < src.length) { if (src[j] === '\\') { s += src[j + 1]; j += 2; continue; } if (src[j] === '`') break; if (src[j] === '$' && src[j + 1] === '{') { let k = j + 2, dep = 1; while (k < src.length && dep) { if (src[k] === '{') dep++; else if (src[k] === '}') dep--; else if (src[k] === '`') { /* plantilla adentro: la salteo */ let q = k + 1; while (q < src.length && src[q] !== '`') q++; out.push(...lits(src.slice(k, q + 1))); k = q; } k++; } s += '\u0001'; j = k; continue; } s += src[j++]; } out.push(s); i = j + 1; continue; }
    i++;
  }
  return out;
}
const codey = f => /^[\w.#:\[\]\/\\-]+$/.test(f) && !/^[A-ZÁÉÍÓÚÑ¡¿]/.test(f) && !/[áéíóúñ]/.test(f) || /;(?! [a-záéíóúñ])|[{}]|=>|\b(px|rgba?|var\(|function|return|const|let)\b|\.(js|png|jpg|glb|mp3|json|webp)\b|^#|^\.|--|=\"|&&|\|\|/.test(f);
// Páginas públicas y del Campus de alumnos (los paneles del equipo quedan en español)
const PAGES = ['index','formacion','institucional','curso','clase','campus','ingresar','perfil','biblia','diario','intercesion','juego','kids-hero','libro','reportar','sembradores','testimonio','ubicacion','privacidad','voluntarios','examen'];
const JS = ['site.js','auth.js','campus-data.js','campus-extra.js','form.js','opina.js','juego.js','kh-home.js','kh-portal.js','kh-hero.js','bloqueo.js','intercesion.js','i18n-web.js'];
const add = frag => {
  frag = frag.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const plain = frag.replace(/\u0001/g, '');
  if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/.test(plain) || codey(plain)) return;
  if (!(/ [a-záéíóúñ]/i.test(plain) || /^[¡¿"«]?[A-ZÁÉÍÓÚÑ]/.test(plain) || /[áéíóúñ¿¡]/.test(plain))) return;
  const k = frag.replace(/\u0001/g, '{*}'); keys.set(k, (keys.get(k) || 0) + 1);
};
const doJS = src => { for (const L of lits(src)) for (const f of L.split(/<[^>]*>/)) add(f); for (const L of lits(src)) for (const m of L.matchAll(/(?:title|aria-label|placeholder|alt)="([^"]+)"/g)) add(m[1]); };
for (const p of PAGES) {
  let h = fs.readFileSync(path.join(WEB, p + '.html'), 'utf8').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  h = h.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (_, s) => { doJS(s); return ''; });
  for (const m of h.matchAll(/(?:title|aria-label|placeholder|alt)="([^"]+)"|<meta name="description" content="([^"]+)"/g)) add(m[1] || m[2]);
  h.replace(/<title>([^<]*)<\/title>/, (_, x) => add(x));
  for (const f of h.split(/<[^>]*>/)) add(f);
}
for (const j of JS) { const f = path.join(WEB, 'assets', j); if (fs.existsSync(f)) doJS(fs.readFileSync(f, 'utf8')); }
const L = [...keys.keys()];
process.stdout.write(JSON.stringify(L, null, 0));
process.stderr.write(`textos: ${L.length} · palabras: ${L.join(' ').split(/\s+/).length}\n`);
