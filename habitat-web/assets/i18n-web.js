/* Idiomas de la web de Habitat (español, English, Português).
   La web está escrita en español; assets/i18n/web-<idioma>.json trae las traducciones con el texto en español como clave
   (con {*} para las partes que cambian y {n} para los números). El idioma elegido se guarda en el aparato y es el mismo
   que usa el juego Kids & Hero. Lo que viene cargado desde el Campus (nombres de cursos, clases, materiales) queda como está.
   Se carga en el <head> de las páginas públicas y del Campus; los paneles del equipo quedan en español. */
(function () {
  var SUP = { es: 'ES', en: 'EN', pt: 'PT' };
  var q = null; try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (q && SUP[q]) { try { localStorage.setItem('tsp:lang', q); } catch (e) {} }
  var LANG = 'es'; try { var s = localStorage.getItem('tsp:lang'); if (SUP[s]) LANG = s; } catch (e) {}
  window.HAB_LANG = LANG;
  function setLang(l) { try { localStorage.setItem('tsp:lang', l); } catch (e) {} try { var u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.href); } catch (e) { location.reload(); } }
  var AVISO = {
    en: 'For now, apart from Kids & Hero, our classes, videos and other audiovisual materials are only available in Spanish.',
    pt: 'Por enquanto, além do Kids & Hero, nossas aulas, vídeos e demais materiais audiovisuais estão disponíveis só em espanhol.'
  };
  var css = '.lang-sw{display:inline-flex;gap:2px;align-items:center;border:1px solid currentColor;border-radius:999px;padding:2px;margin-left:10px;font:700 11px/1 system-ui,sans-serif;opacity:.85}' +
    '.lang-sw button{all:unset;cursor:pointer;padding:5px 7px;border-radius:999px;letter-spacing:.04em;opacity:.55}.lang-sw button:hover{opacity:.85}.lang-sw button[aria-pressed=true]{opacity:1;text-decoration:underline;text-underline-offset:3px}' +
    '.lang-sw.flot{position:fixed;left:12px;bottom:12px;z-index:9999;background:rgba(20,16,30,.82);color:#fff;border-color:rgba(255,255,255,.4)}' +
    '.lang-aviso{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9998;max-width:min(560px,calc(100vw - 120px));background:rgba(32,24,48,.94);color:#f3ead6;font:500 13px/1.45 system-ui,sans-serif;padding:10px 38px 10px 14px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.3)}' +
    '.lang-aviso button{all:unset;cursor:pointer;position:absolute;right:10px;top:8px;font-size:15px;opacity:.7}' +
    '@media (max-width:600px){.lang-aviso{left:12px;right:12px;transform:none;max-width:none;bottom:56px}}' +
    '.lang-es{display:inline-block;margin:6px 0 10px;padding:4px 10px;border-radius:999px;background:rgba(200,160,80,.18);border:1px solid rgba(200,160,80,.55);font:600 12px/1.3 system-ui,sans-serif;letter-spacing:.02em}' +
    'html.i18n-wait body{opacity:0}html body{transition:opacity .15s}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  function selector() {
    if (document.querySelector('.lang-sw')) return;
    var w = document.createElement('div'); w.className = 'lang-sw'; w.setAttribute('data-notr', ''); w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Idioma / Language');
    Object.keys(SUP).forEach(function (l) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', l === LANG ? 'true' : 'false'); b.title = { es: 'Español', en: 'English', pt: 'Português' }[l]; b.innerHTML = '<span>' + SUP[l] + '</span>'; b.onclick = function () { if (l !== LANG) setLang(l); }; w.appendChild(b); });
    w.classList.add('flot'); document.body.appendChild(w);
  }
  function aviso() {
    if (!AVISO[LANG] || document.querySelector('.lang-aviso')) return;
    try { if (sessionStorage.getItem('hab:aviso-idioma')) return; } catch (e) {}
    var a = document.createElement('div'); a.className = 'lang-aviso'; a.setAttribute('data-notr', ''); a.setAttribute('role', 'note'); a.textContent = AVISO[LANG];
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', LANG === 'pt' ? 'Fechar' : 'Close'); x.textContent = '✕';
    x.onclick = function () { a.remove(); try { sessionStorage.setItem('hab:aviso-idioma', '1'); } catch (e) {} }; a.appendChild(x); document.body.appendChild(a);
  }
  /* en la página de un curso o de una clase: el curso se dicta en español */
  var ENES = { en: 'Taught in Spanish', pt: 'Curso em espanhol' };
  function cursoEs() {
    if (!ENES[LANG] || document.querySelector('.lang-es')) return;
    var h = document.getElementById('csTitle') || document.getElementById('pTitle'); if (!h) return;
    var b = document.createElement('span'); b.className = 'lang-es'; b.setAttribute('data-notr', ''); b.textContent = '🇪🇸 ' + ENES[LANG];
    h.parentNode.insertBefore(b, h.nextSibling);
  }
  function onReady(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', f); else f(); }
  onReady(selector);
  if (LANG === 'es') return;
  document.documentElement.classList.add('i18n-wait');
  var show = function () { document.documentElement.classList.remove('i18n-wait'); };
  setTimeout(show, 2500);

  var D = null, LOW = null, P = [], CACHE = {}, OUT = {}, MISS = {};
  var STOP = { de: 1, del: 1, y: 1, e: 1, a: 1, al: 1, en: 1, con: 1, o: 1, u: 1, el: 1, la: 1, los: 1, las: 1, lo: 1, por: 1, para: 1, que: 1, un: 1, una: 1 };
  var Y = { en: 'and', pt: 'e' }[LANG];
  var rx = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };
  var NAME = /^[A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿ'’-]*$/;
  function look(k) {
    if (Object.prototype.hasOwnProperty.call(CACHE, k)) return CACHE[k];
    var r = D[k], m, i, g;
    if (r == null) { var nums = [], kn = k.replace(/\d+(?:[.,]\d+)*/g, function (x) { nums.push(x); return '{n}'; }); if (nums.length && D[kn] != null) { i = 0; r = D[kn].replace(/\{n\}/g, function () { return nums[i++] || ''; }); } }
    if (r == null) { var ps = k.split(/(?<=[.!?…»)])\s+(?=[¡¿«"“(A-ZÁÉÍÓÚÑ0-9])/); if (ps.length > 1) { g = ps.map(look); if (g.indexOf(null) < 0) r = g.join(' '); } }
    if (r == null) for (var j = 0; j < P.length; j++) { var p = P[j]; m = k.match(p[1]); if (!m) continue; g = m.slice(1).map(function (x) { var y = norm(x); if (!/[A-Za-zÀ-ÿ]/.test(y)) return x; var z0 = p[0] ? null : look(y); return z0 == null ? (NAME.test(y) ? y : null) : x.match(/^\s*/)[0] + z0 + x.match(/\s*$/)[0]; }); if (g.indexOf(null) >= 0) continue; i = 0; r = p[2].replace(/\{\*\}|\{n\}/g, function () { return g[i++] || ''; }); break; }
    if (r == null && k === k.toUpperCase() && k !== k.toLowerCase()) { var x1 = LOW[k.toLowerCase()]; if (x1 != null) r = x1.toUpperCase(); }
    if (r == null) { m = k.match(/^([^A-Za-zÀ-ÿ¡¿«"“]*)(.*?)([^A-Za-zÀ-ÿ.!?»"”)…]*)$/); if (m && (m[1] || m[3]) && m[2]) { var z = look(m[2]); if (z != null) r = m[1] + z + m[3]; } }
    if (r == null && k.indexOf(' · ') >= 0) { var any = false; g = k.split(' · ').map(function (x) { if (!/[A-Za-zÀ-ÿ]{2}/.test(x)) return x; var z = look(x); if (z != null) { any = true; return z; } return NAME.test(x) ? x : null; }); if (any && g.indexOf(null) < 0) r = g.join(' · '); }
    if (r == null) { var x2 = LOW[k.toLowerCase()]; if (x2 != null) r = /^[a-záéíóúñ]/.test(k) && /^[A-Z]/.test(x2) ? x2.charAt(0).toLowerCase() + x2.slice(1) : x2; }
    if (r == null && /, | y /.test(k) && !/[.!?¿¡:]/.test(k)) { var it = k.split(/, | y /); if (it.length > 1 && it.length < 12) { g = it.map(look); if (g.indexOf(null) < 0) r = g.slice(0, -1).join(', ') + ' ' + Y + ' ' + g[g.length - 1]; } }
    CACHE[k] = r; return r;
  }
  function t(s) {
    if (!D || !s || typeof s !== 'string') return s;
    var k = norm(s); if (!k || !/[A-Za-zÀ-ÿ]/.test(k)) return s;
    var r = look(k); if (r == null) { if (!OUT[k]) MISS[k] = 1; return s; }
    return s.match(/^\s*/)[0] + r + s.match(/\s*$/)[0];
  }
  window.HAB_T = t; window.__webMiss = MISS;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, SELECT: 0, CODE: 1, CANVAS: 1, svg: 1, NOSCRIPT: 1 };
  var ATT = ['title', 'aria-label', 'placeholder', 'alt'];
  function tn(n) { var v = n.nodeValue; if (!v || n.__tr === v) return; var r = t(v); n.__tr = r; if (r !== v) n.nodeValue = r; }
  function walk(el) {
    if (el.nodeType === 3) return tn(el);
    if (el.nodeType !== 1 || SKIP[el.tagName] || el.hasAttribute('data-notr')) return;
    for (var a = 0; a < ATT.length; a++) if (el.hasAttribute(ATT[a])) { var v = el.getAttribute(ATT[a]), r = t(v); if (r !== v) el.setAttribute(ATT[a], r); }
    if (el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type) && el.value) { var w = t(el.value); if (w !== el.value) el.value = w; }
    for (var c = el.firstChild; c; c = c.nextSibling) walk(c);
  }
  fetch('/assets/i18n/web-' + LANG + '.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (j) {
    D = {}; LOW = {};
    for (var k in j) { if (k.indexOf('{*}') >= 0) P.push([((k.replace(/\{\*\}|\{n\}/g, ' ').match(/[A-Za-zÀ-ÿ]+/g) || []).every(function (w) { return STOP[w.toLowerCase()]; })), new RegExp('^' + k.split('{*}').map(function (s) { return rx(s).replace(/\\\{n\\\}/g, '(\\d+(?:[.,]\\d+)*)'); }).join('(.+?)') + '$'), j[k], k]); else { D[k] = j[k]; LOW[k.toLowerCase()] = j[k]; } OUT[norm(String(j[k]).replace(/\{\*\}|\{n\}/g, ''))] = 1; }
    P.sort(function (a, b) { return b[3].length - a[3].length; });
    onReady(function () {
      document.documentElement.lang = LANG; document.title = t(document.title);
      var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', t(md.getAttribute('content') || ''));
      walk(document.body); aviso(); cursoEs(); show();
      new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.type === 'characterData') tn(m.target); else if (m.type === 'attributes') { var v = m.target.getAttribute(m.attributeName), r = t(v); if (r !== v) m.target.setAttribute(m.attributeName, r); } else m.addedNodes.forEach(walk); }); })
        .observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATT });
    });
  });
})();
