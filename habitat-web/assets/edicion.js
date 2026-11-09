/* Edición de videos: cola de la más vieja a la más nueva, entrega del material, subida y plan para ponerse al día. */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fc(f) { if (!f) return ''; var p = f.split('-'); return +p[2] + ' ' + MC[+p[1] - 1]; }
  var T = new Date(), HOY = T.getFullYear() + '-' + ('0' + (T.getMonth() + 1)).slice(-2) + '-' + ('0' + T.getDate()).slice(-2);
  function toast(t) { var e = $('#ttToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 3000); }
  async function token() { await A.api('GET', '/members/v1/members/my'); try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } }
  async function api(method, body) {
    var r = await fetch('/api/edicion', { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await token() }, body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No se guardó. Probá de nuevo.'); er.status = r.status; throw er; }
    return j;
  }
  var D = null, F = '', SEL = {};
  function upd(L) { (L || []).forEach(function (v) { var i = D.videos.findIndex(function (x) { return x._id === v._id; }); if (i >= 0) D.videos[i] = v; }); }
  function st(v) {
    if (v.estado === 'Subida') return '<span class="ed-st g">Subida</span>';
    if (v.estado !== 'Para entregar' && v.limite && v.limite < HOY) return '<span class="ed-st r">Atrasada · ' + esc(v.estado) + '</span>';
    return '<span class="ed-st ' + ({ 'En edición': 'y', 'Editada': 'b' }[v.estado] || '') + '">' + esc(v.estado) + '</span>';
  }

  function renderCola() {
    var V = D.videos.filter(function (v) { return v.estado !== 'Subida'; }), n = function (e) { return V.filter(function (v) { return v.estado === e; }).length; };
    var atr = V.filter(function (v) { return v.estado !== 'Para entregar' && v.limite && v.limite < HOY; }).length;
    $('#eKpi').innerHTML = '<div class="ed-kpi"><b>' + n('Para entregar') + '</b><span>para entregar a Cris</span></div><div class="ed-kpi"><b>' + n('En edición') + '</b><span>en edición</span></div><div class="ed-kpi"><b>' + n('Editada') + '</b><span>editadas, falta subir</span></div><div class="ed-kpi' + (atr ? ' r' : '') + '"><b>' + atr + '</b><span>pasaron los 7 días</span></div>';
    $('#ePills').innerHTML = [['', 'Todas']].concat(D.programas.map(function (p) { return [p, p]; })).map(function (p) { return '<button type="button" class="tt-pill' + (F === p[0] ? ' on' : '') + '" data-p="' + esc(p[0]) + '">' + esc(p[1]) + '</button>'; }).join('');
    $$('#ePills button').forEach(function (b) { b.onclick = function () { F = b.dataset.p; renderCola(); }; });
    var L = V.filter(function (v) { return !F || v.programa === F; });
    $('#eList').innerHTML = L.length ? L.map(function (v) {
      var acts = '';
      if (D.me.ed || D.me.dir) {
        if (v.estado === 'En edición') acts += '<button class="tt-btn s" type="button" data-ed="' + esc(v._id) + '">Ya la edité</button>';
        if (v.estado !== 'Para entregar') acts += '<label class="tt-btn" style="cursor:pointer">Subir video<input type="file" accept="video/*" data-up="' + esc(v._id) + '" hidden></label>';
      }
      return '<div class="ed-row">' + (D.me.dir && v.estado === 'Para entregar' ? '<input type="checkbox" data-s="' + esc(v._id) + '"' + (SEL[v._id] ? ' checked' : '') + ' aria-label="Elegir">' : '<span></span>') +
        '<div class="w"><b>' + esc(v.title) + '</b><small>' + esc(v.programa) + ' · clase del ' + fc(v.fecha) + (v.entregado ? ' · entregada el ' + fc(v.entregado) + ' (' + esc(v.fuente || '') + ') · hasta el ' + fc(v.limite) : '') + '</small><div class="ed-prog" data-pg="' + esc(v._id) + '" hidden><i></i></div></div>' +
        '<div class="ed-acts">' + st(v) + acts + '</div></div>';
    }).join('') : '<p class="tt-empty">¡No hay nada pendiente! 🙌🏽</p>';
    $$('#eList [data-s]').forEach(function (c) { c.onchange = function () { if (c.checked) SEL[c.dataset.s] = 1; else delete SEL[c.dataset.s]; bulk(); }; });
    $$('#eList [data-ed]').forEach(function (b) { b.onclick = function () { api('POST', { op: 'estado', ids: [b.dataset.ed], estado: 'Editada' }).then(function (r) { upd(r.items); toast('Marcada como editada. Ahora subila.'); renderCola(); }).catch(function (e) { toast(e.message); }); }; });
    $$('#eList [data-up]').forEach(function (i) { i.onchange = function () { subir(i.dataset.up, i.files[0]); }; });
    bulk();
  }
  function bulk() {
    var k = Object.keys(SEL);
    $('#eBulk').hidden = !D.me.dir || !k.length;
    $('#eSel').textContent = k.length + ' clase' + (k.length === 1 ? '' : 's') + ' elegida' + (k.length === 1 ? '' : 's');
  }
  async function subir(id, f) {
    if (!f) return;
    var pg = $('[data-pg="' + id + '"]'); pg.hidden = false;
    try {
      var mime = f.type || 'video/mp4', u = await api('POST', { op: 'subir', ids: [id], mime: mime });
      var url = await new Promise(function (ok, ko) { var x = new XMLHttpRequest(); x.open('PUT', u.uploadUrl + (u.uploadUrl.indexOf('?') >= 0 ? '&' : '?') + 'filename=' + encodeURIComponent(f.name)); x.setRequestHeader('Content-Type', mime); x.upload.onprogress = function (e) { if (e.lengthComputable) $('i', pg).style.width = (100 * e.loaded / e.total) + '%'; }; x.onload = function () { try { var j = JSON.parse(x.responseText); j.file && j.file.url ? ok(j.file.url) : ko(new Error('sin url')); } catch (e) { ko(e); } }; x.onerror = function () { ko(new Error('red')); }; x.send(f); });
      var r = await api('POST', { op: 'video', ids: [id], url: url }); upd([r.item]);
      toast('¡Subido! Ya está en el Campus y avisamos a la dirección 🎬'); renderCola();
    } catch (e) { pg.hidden = true; toast('No se pudo subir. Revisá la conexión y probá de nuevo.'); }
  }
  $('#eEnt').onclick = function () { var k = Object.keys(SEL); api('POST', { op: 'entregar', ids: k, fuente: $('#eFuente').value, fecha: $('#eFecha').value }).then(function (r) { upd(r.items); SEL = {}; toast('Listo: ' + k.length + ' clase' + (k.length === 1 ? '' : 's') + ' para Cris. Le avisamos por mail.'); renderCola(); }).catch(function (e) { toast(e.message); }); };
  $('#eYa').onclick = function () { var k = Object.keys(SEL); api('POST', { op: 'estado', ids: k, estado: 'Subida' }).then(function (r) { upd(r.items); SEL = {}; toast(k.length + ' marcadas como ya subidas.'); renderCola(); }).catch(function (e) { toast(e.message); }); };

  function renderPlan() {
    var P = D.plan;
    $('#ePlan').innerHTML = '<div><p class="tt-tip">Quedan por subir</p><p class="big">' + P.pendientes + ' videos</p><p class="tt-tip">' + P.atrasados + ' son de hace más de una semana. Por semana se suman unas ' + P.nuevasSemana + ' clases nuevas.</p></div>' +
      '<div><p class="tt-tip">Ritmo sugerido</p><p class="big">' + P.ritmo + ' por semana</p><p class="tt-tip">' + (P.fechaEstimada ? 'A este ritmo quedamos al día cerca del <b>' + fc(P.fechaEstimada) + '</b> (' + P.semanas + ' semanas).' : 'Con este ritmo solo se cubre lo nuevo de cada semana.') + '</p></div>' +
      (D.me.dir ? '<div class="tt-bar"><label>Fijar ritmo semanal <input type="number" min="0" max="30" id="eR" value="' + (D.ritmoFijo || '') + '" placeholder="automático" style="width:110px"></label><button class="tt-btn s" type="button" id="eRS">Guardar</button></div>' : '') +
      '<p class="tt-tip">Los lunes, Cris recibe un resumen con lo que tiene en edición, lo que se subió y este ritmo.</p>';
    var b = $('#eRS'); if (b) b.onclick = function () { api('POST', { op: 'ritmo', ritmo: $('#eR').value }).then(function (r) { D.plan = r.plan; D.ritmoFijo = r.ritmoFijo; toast('Ritmo guardado.'); renderPlan(); }).catch(function (e) { toast(e.message); }); };
  }
  function renderSub() {
    var L = D.videos.filter(function (v) { return v.estado === 'Subida'; }).sort(function (a, b) { return String(b.subido || b.fecha).localeCompare(String(a.subido || a.fecha)); });
    $('#eSub').innerHTML = L.length ? L.map(function (v) { return '<div class="ed-row"><span></span><div class="w"><b>' + esc(v.title) + '</b><small>' + esc(v.programa) + ' · clase del ' + fc(v.fecha) + (v.subido ? ' · subida el ' + fc(v.subido) : '') + (v.url ? '' : ' · sin video en la web') + '</small></div><div class="ed-acts">' + (v.url ? '<a class="tt-btn s" href="' + esc(v.url) + '" target="_blank" rel="noopener">Ver</a>' : '') + (D.me.dir && v.url ? '<button class="tt-btn s" type="button" data-q="' + esc(v._id) + '">Quitar</button>' : '') + '</div></div>'; }).join('') : '<p class="tt-empty">Todavía no se subió ningún video.</p>';
    $$('#eSub [data-q]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Quitar este video del Campus?')) return; api('POST', { op: 'quitarVideo', ids: [b.dataset.q] }).then(function (r) { upd([r.item]); toast('Quitado.'); renderSub(); }); }; });
  }
  function cur() { var b = $('#ttTabs .on'); return b ? b.dataset.t : 'cola'; }
  function refresh() { ({ cola: renderCola, plan: renderPlan, subidas: renderSub }[cur()] || renderCola)(); }
  function tab(t) { var b = $('#ttTabs [data-t="' + t + '"]'); if (!b) return; $$('#ttTabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tt-v').forEach(function (v) { v.hidden = v.id !== 'v-' + t; }); refresh(); }
  $$('#ttTabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.t); }; });

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/edicion.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { D = await api('GET'); }
    catch (e) { $('#ttHola').textContent = 'Este panel es de edición de videos'; $('#ttWho').textContent = e.status === 403 ? 'Lo ven Cris y la dirección de Habitat.' : 'Revisá tu conexión y recargá la página.'; $('.tt-main').innerHTML = ''; return; }
    var h = new Date().getHours();
    $('#ttHola').textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + String(D.me.title || '').split(' ')[0];
    $('#ttWho').textContent = 'Videos de las clases de Adoración, Liderazgo y Maranata';
    $('#eFuente').innerHTML = D.fuentes.map(function (f) { return '<option>' + esc(f) + '</option>'; }).join('');
    $('#eFecha').value = HOY;
    var hh = location.hash.replace('#', ''); if (hh && $('#ttTabs [data-t="' + hh + '"]')) tab(hh); else renderCola();
  })();
})();
