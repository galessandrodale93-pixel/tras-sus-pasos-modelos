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
  var css = '.lang-dd{position:relative;display:flex;align-items:center;margin-left:14px;color:var(--cream,#F3EAD6);z-index:60}' +
    '.lang-dd svg{width:20px;height:14px;border-radius:2px;flex:none;box-shadow:0 0 0 1px rgba(255,255,255,.25)}' +
    '.lang-b{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.28);color:inherit;border-radius:999px;padding:6px 10px;font:700 12px/1 system-ui,sans-serif;letter-spacing:.04em;cursor:pointer}' +
    '.lang-b:hover{background:rgba(255,255,255,.14)}.lang-b i{font-style:normal;opacity:.7;font-size:10px}' +
    '.lang-m{position:absolute;top:calc(100% + 8px);right:0;min-width:160px;background:#1E1830;border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.35);padding:6px;display:grid;gap:2px}' +
    '.lang-m:not([hidden]){animation:langIn .16s ease-out}@keyframes langIn{from{opacity:0;transform:translateY(-6px)}}.lang-b[aria-expanded=true] i{transform:rotate(180deg)}.lang-b i{transition:transform .15s}' +
    '.lang-m[hidden]{display:none}.lang-m button{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;color:#F3EAD6;font:600 14px/1.2 system-ui,sans-serif}' +
    '.lang-m button:hover{background:rgba(255,255,255,.08)}.lang-m button.on{background:rgba(233,195,122,.16);font-weight:800}' +
    '.lang-dd.abs{position:absolute;right:16px;top:50%;transform:translateY(-50%);margin:0}.lang-dd.flot{position:fixed;right:14px;top:14px;margin:0}' +
    '.lang-dd.mob{margin-left:auto;margin-right:4px}.top .wrap:has(.lang-dd.mob){display:flex;align-items:center}' +
    '.lang-aviso{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9998;max-width:min(560px,calc(100vw - 120px));background:rgba(32,24,48,.94);color:#f3ead6;font:500 13px/1.45 system-ui,sans-serif;padding:10px 38px 10px 14px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.3)}' +
    '.lang-aviso button{all:unset;cursor:pointer;position:absolute;right:10px;top:8px;font-size:15px;opacity:.7}' +
    '@media (max-width:600px){.lang-aviso{left:12px;right:12px;transform:none;max-width:none;bottom:56px}}' +
    '.lang-es{display:inline-block;margin:6px 0 10px;padding:4px 10px;border-radius:999px;background:rgba(200,160,80,.18);border:1px solid rgba(200,160,80,.55);font:600 12px/1.3 system-ui,sans-serif;letter-spacing:.02em}' +
    'html.i18n-wait body{opacity:0}html body{transition:opacity .15s}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  /* banderas dibujadas (los emojis de banderas no se ven en Windows) */
  var FLAG = {
    es: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/></svg>',
    en: '<svg viewBox="0 0 60 30" aria-hidden="true"><rect width="60" height="30" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 60,30M60,0 0,30" stroke="#C8102E" stroke-width="2.4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg>',
    pt: '<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" fill="#009C3B"/><path d="M10 1.6 18.4 7 10 12.4 1.6 7z" fill="#FFDF00"/><circle cx="10" cy="7" r="3.4" fill="#002776"/></svg>'
  };
  var NOMBRE = { es: 'Español', en: 'English', pt: 'Português' };
  function selector() {
    if (document.querySelector('.lang-dd')) return;
    var w = document.createElement('div'); w.className = 'lang-dd'; w.setAttribute('data-notr', '');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'lang-b'; b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Idioma · Language · Idioma');
    b.innerHTML = FLAG[LANG] + '<span>' + SUP[LANG] + '</span><i>▾</i>';
    var m = document.createElement('div'); m.className = 'lang-m'; m.hidden = true; m.setAttribute('role', 'menu');
    Object.keys(SUP).forEach(function (l) { var o = document.createElement('button'); o.type = 'button'; o.setAttribute('role', 'menuitem'); if (l === LANG) o.className = 'on'; o.innerHTML = FLAG[l] + '<span>' + NOMBRE[l] + '</span>'; o.onclick = function () { m.hidden = true; if (l !== LANG) setLang(l); }; m.appendChild(o); });
    b.onclick = function (e) { e.stopPropagation(); m.hidden = !m.hidden; b.setAttribute('aria-expanded', m.hidden ? 'false' : 'true'); };
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) { m.hidden = true; b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') m.hidden = true; });
    w.appendChild(b); w.appendChild(m);
    /* en compu va al final de la barra (después de «Ingresar»); en celu, al lado del menú ☰ */
    var hw = document.querySelector('header.top .wrap'), side = hw && hw.querySelector('.nav-side'), bur = hw && hw.querySelector('.burger'), top = document.querySelector('header.top');
    if (hw && side && bur) {
      var mq = window.matchMedia('(max-width:1020px)');
      var place = function () { if (mq.matches) { w.classList.add('mob'); hw.insertBefore(w, bur); } else { w.classList.remove('mob'); side.appendChild(w); } };
      place(); if (mq.addEventListener) mq.addEventListener('change', place); else if (mq.addListener) mq.addListener(place);
    }
    else if (top) { w.classList.add('abs'); top.appendChild(w); }
    else { w.classList.add('flot'); document.body.appendChild(w); }
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
