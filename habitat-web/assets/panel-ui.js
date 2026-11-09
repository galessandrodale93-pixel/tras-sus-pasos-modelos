/* Encabezado común de los paneles (saludo según la hora, fecha y una palabra para empezar),
   igual que en Tutores, Organización y Mi servicio. */
(function () {
  var PAL = ['#5f7f6e', '#8a6d4b', '#4f6d8a', '#8a4f5f', '#6b5f8a', '#4f8a85', '#8a7a4f', '#7a5f4f', '#55707e', '#7d6a8e'];
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Avatar con iniciales, mismo color por persona que en Tutores y Organización.
  function av(name, cls) { var n = String(name || '?').trim(), h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; var ini = n.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); return '<span class="tt-av ' + (cls || 'sm') + '" style="--c:' + PAL[h % PAL.length] + '" aria-hidden="true">' + esc(ini || '?') + '</span>'; }
  // Grupo de pastillas para elegir una opción (en lugar de un desplegable).
  function pills(name, opts, val) { return '<div class="tt-pills" role="radiogroup" data-pills="' + esc(name) + '">' + opts.map(function (o) { return '<button type="button" class="tt-pill' + (String(o[0]) === String(val) ? ' on' : '') + '" role="radio" aria-checked="' + (String(o[0]) === String(val)) + '" data-v="' + esc(o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function onPills(root, fn) { Array.prototype.forEach.call(root.querySelectorAll('[data-pills] .tt-pill'), function (b) { b.onclick = function () { var g = b.parentNode; Array.prototype.forEach.call(g.children, function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); if (fn) fn(g.dataset.pills, b.dataset.v, b); }; }); }
  function val(root, name) { var b = root.querySelector('[data-pills="' + name + '"] .tt-pill.on'); return b ? b.dataset.v : ''; }
  window.HabUI = { av: av, pills: pills, onPills: onPills, val: val };
  var $ = function (s) { return document.querySelector(s); };
  var hi = $('.tt-top .tt-hi'); if (!hi) return;
  var DL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], MS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var d = new Date(), FECHA = DL[d.getDay()] + ' ' + d.getDate() + ' de ' + MS[d.getMonth()];
  if (!$('#ttWord')) {
    var f = document.createElement('figure'); f.className = 'tt-word'; f.id = 'ttWord'; f.hidden = true;
    f.innerHTML = '<blockquote id="ttWordT"></blockquote><figcaption><span id="ttWordR"></span><button type="button" id="ttWordN">Otra palabra</button></figcaption>';
    hi.appendChild(f);
    var pal = function () { if (!window.HabitatAliento) return; var w = window.HabitatAliento(document.body.dataset.aliento || 'tutor'); $('#ttWordT').textContent = w.t; $('#ttWordR').textContent = w.r || 'Para vos, hoy'; f.hidden = false; };
    $('#ttWordN').onclick = pal; pal();
  }
  var H = $('#ttHola'), W = $('#ttWho'), busy = false;
  function fix() {
    if (busy) return; busy = true;
    var t = H.textContent, m = /^Hola,\s*(.+)$/.exec(t), h = d.getHours();
    if (m) H.textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + m[1];
    var w = W.textContent;
    if (/^(Buen|Hola,)/.test(H.textContent) && w && w.indexOf('Cargando') < 0 && w.indexOf(FECHA) < 0) W.textContent = w.replace(/[.\s]+$/, '') + ' · ' + FECHA;
    busy = false;
  }
  if (H && W) { new MutationObserver(fix).observe(H, { childList: true, characterData: true, subtree: true }); new MutationObserver(fix).observe(W, { childList: true, characterData: true, subtree: true }); }
})();
/* Desplegables cortos (hasta 5 opciones) se muestran como pastillas tocables, igual que los filtros del panel.
   El <select> queda oculto y sincronizado, así los formularios siguen funcionando igual. */
(function () {
  function pillify(sel) {
    if (sel.dataset.pill || sel.multiple || sel.options.length < 2 || sel.options.length > 5 || sel.closest('[data-nopill]')) return;
    sel.dataset.pill = '1';
    var g = document.createElement('div'); g.className = 'tt-pills hb-pills'; g.setAttribute('role', 'radiogroup');
    if (sel.getAttribute('aria-label')) g.setAttribute('aria-label', sel.getAttribute('aria-label'));
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.value === '' && /elegí|seleccion/i.test(o.text)) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tt-pill' + (o.selected ? ' on' : ''); b.textContent = o.text; b.dataset.v = o.value;
      b.onclick = function () { sel.value = o.value; Array.prototype.forEach.call(g.children, function (x) { x.classList.toggle('on', x === b); }); sel.dispatchEvent(new Event('change', { bubbles: true })); };
      g.appendChild(b);
    });
    sel.hidden = true; sel.style.display = 'none'; sel.parentNode.insertBefore(g, sel.nextSibling);
  }
  function scan(root) { Array.prototype.forEach.call((root.querySelectorAll ? root : document).querySelectorAll('main select'), pillify); }
  scan(document);
  new MutationObserver(function (ms) { ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { if (n.tagName === 'SELECT') pillify(n); else if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll('select'), pillify); } }); }); }).observe(document.body, { childList: true, subtree: true });
})();
