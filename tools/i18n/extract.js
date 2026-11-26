// Junta los textos en español del juego (los que se ven en pantalla) para traducirlos.
// Uso: node tools/i18n/extract.js > /tmp/es_keys.json
// Cada literal de texto o plantilla se parte por las etiquetas HTML (cada pedazo es un texto de la pantalla); lo que va entre ${...} queda como {*}.
const fs = require('fs'), path = require('path');
const APP = path.join(__dirname, '../../app');
const FILES = process.env.FILES ? process.env.FILES.split(',') : ['game.js', 'walk3d.js', ...fs.readdirSync(path.join(APP, 'story')).map(f => 'story/' + f)];
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
for (const f of FILES) {
  const src = fs.readFileSync(path.join(APP, f), 'utf8');
  for (const L of lits(src)) {
    for (let frag of L.split(/<[^>]*>/)) {
      frag = frag.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const plain = frag.replace(/\u0001/g, '');
      if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/.test(plain)) continue;
      if (codey(plain)) continue;
      if (!(/ [a-záéíóúñ]/i.test(plain) || /^[¡¿"«]?[A-ZÁÉÍÓÚÑ]/.test(plain) || /[áéíóúñ¿¡]/.test(plain))) continue;
      const k = frag.replace(/\u0001/g, '{*}');
      keys.set(k, (keys.get(k) || 0) + 1);
    }
  }
}
const L = [...keys.keys()];
process.stdout.write(JSON.stringify(L, null, 0));
process.stderr.write(`textos: ${L.length} · palabras: ${L.join(' ').split(/\s+/).length}\n`);
