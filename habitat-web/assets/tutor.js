/* Panel de tutores de Habitat: semáforo, pasar lista, ficha del alumno, seguimientos y equipo. */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function pd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function fcorta(s) { var d = pd(s); return d.getDate() + ' ' + MC[d.getMonth()]; }
  function mesTxt(m) { return MESES[+m.slice(5, 7) - 1]; }
  function monday(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function lastSat() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); return d; }
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  var CUR_M = iso(TODAY).slice(0, 7);
  function addM(m, n) { var d = pd(m + '-01'); d.setMonth(d.getMonth() + n); return iso(d).slice(0, 7); }
  var PROG = { Maranata: ['Módulo 1', 'Módulo 2', 'Módulo 3', 'Módulo 4', 'Módulo 5', 'Módulo 6', 'TP'], Liderazgo: [], 'Adoración': [] };
  for (var i = 1; i <= 12; i++) { PROG.Liderazgo.push('Bloque ' + i); PROG['Adoración'].push('Bloque ' + i); }
  PROG.Liderazgo.push('TP'); PROG['Adoración'].push('TP');
  function progs(a) { var c = (a.carreras || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); return ['Maranata', 'Liderazgo', 'Adoración'].filter(function (p) { return c.indexOf(p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()) >= 0; }); }
  function async_(a) { return /asinc/i.test(a.modalidad || ''); }
  function becado(a) { return /becad/i.test(a.formaPago || ''); }

  var D = null, ME = null, IX = {};
  function toast(t) { var e = $('#ttToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2400); }

  async function token() {
    await A.api('GET', '/members/v1/members/my');
    try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; }
  }
  async function api(method, body) {
    var r = await fetch('/api/tutor', { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await token() }, body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No pudimos guardar.'); er.status = r.status; throw er; }
    return j;
  }
  async function send(body, item, col) {
    try {
      var r = await api('POST', body);
      if (col) {
        var L = D[col], k = item;
        var at = L.findIndex(function (x) { return x._id === (r.item && r.item._id || k); });
        if (r.item) { if (at >= 0) L[at] = r.item; else L.push(r.item); } else if (at >= 0) L.splice(at, 1);
        index();
      }
      return r;
    } catch (e) { toast(e.message); throw e; }
  }

  function index() {
    IX = { asis: {}, pago: {}, ev: {}, gr: {}, seg: {}, alu: {} };
    D.alumnos.forEach(function (a) { IX.alu[a._id] = a; });
    D.asistencia.forEach(function (x) { (IX.asis[x.alumnoId] = IX.asis[x.alumnoId] || []).push(x); });
    Object.keys(IX.asis).forEach(function (k) { IX.asis[k].sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }); });
    D.pagos.forEach(function (x) { (IX.pago[x.alumnoId] = IX.pago[x.alumnoId] || {})[x.mes] = x.pagado; });
    D.evaluaciones.forEach(function (x) { (IX.ev[x.alumnoId] = IX.ev[x.alumnoId] || {})[x.programa + '|' + x.item] = true; });
    D.grupo.forEach(function (x) { (IX.gr[x.alumnoId] = IX.gr[x.alumnoId] || {})[x.semana] = x.nivel; });
    D.seguimientos.forEach(function (x) { (IX.seg[x.alumnoId] = IX.seg[x.alumnoId] || []).push(x); });
    Object.keys(IX.seg).forEach(function (k) { IX.seg[k].sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }); });
    // mediana de exámenes por carrera, para ver quién va atrasado respecto de su grupo
    IX.med = {};
    Object.keys(PROG).forEach(function (p) {
      var c = D.alumnos.filter(function (a) { return a.activo !== false && progs(a).indexOf(p) >= 0; }).map(function (a) { return nEv(a, p); }).sort(function (x, y) { return x - y; });
      IX.med[p] = c.length ? c[Math.floor(c.length / 2)] : 0;
    });
  }
  function nEv(a, p) { var e = IX.ev[a._id] || {}; return PROG[p].filter(function (it) { return e[p + '|' + it]; }).length; }
  function startM(a) { var p = IX.pago[a._id]; var ks = p ? Object.keys(p).sort() : []; return ks[0] || (progs(a).indexOf('Maranata') >= 0 ? '2026-03' : '2026-08'); }

  /* Semáforo */
  function estado(a) {
    var why = [];
    if (!becado(a)) {
      var p = IX.pago[a._id] || {}, deb = [];
      for (var m = startM(a); m < CUR_M; m = addM(m, 1)) if (!p[m]) deb.push(m);
      if (deb.length >= 2) why.push(['r', 'Debe ' + deb.length + ' meses']);
      else if (deb.length === 1) why.push(['y', 'Debe ' + mesTxt(deb[0])]);
      if (!p[CUR_M] && TODAY.getDate() > 10) why.push(['y', 'Falta pagar ' + mesTxt(CUR_M)]);
    }
    if (!async_(a)) {
      var L = (IX.asis[a._id] || []).slice(0, 4), ab = L.filter(function (x) { return x.estado === 'A'; }).length;
      if (L.length >= 2 && L[0].estado === 'A' && L[1].estado === 'A') why.push(['r', 'Faltó las últimas ' + (L.length >= 3 && L[2].estado === 'A' ? 3 : 2) + ' clases']);
      else if (ab >= 2) why.push(['y', 'Faltó ' + ab + ' de las últimas ' + L.length]);
      var td = L.filter(function (x) { return x.tarde; }).length; if (td >= 2) why.push(['y', 'Llega tarde']);
    }
    progs(a).forEach(function (p) { var d = IX.med[p] - nEv(a, p); if (d >= 2) why.push(['r', 'Atrasado en exámenes de ' + p]); else if (d === 1) why.push(['y', 'Le falta un examen de ' + p]); });
    var g = IX.gr[a._id] || {}, w0 = iso(monday(TODAY)), w1 = iso(new Date(monday(TODAY).getTime() - 7 * 864e5)), w2 = iso(new Date(monday(TODAY).getTime() - 14 * 864e5));
    if ((g[w0] || g[w1]) === 'nada' && (g[w1] === 'nada' || g[w2] === 'nada')) why.push(['y', 'No participa en el grupo']);
    var r = why.filter(function (x) { return x[0] === 'r'; }).length, y = why.length - r;
    return { lvl: r || y >= 2 ? 'r' : y ? 'y' : 'g', why: why };
  }
  function ultSeg(a) { var s = IX.seg[a._id]; return s && s[0]; }

  /* Vista: alumnos */
  var F = { q: '', par: '', car: '', mod: '', est: '' };
  function match(a) {
    if (a.activo === false) return false;
    if (F.q && (a.title || '').toLowerCase().indexOf(F.q) < 0) return false;
    if (F.par && a.tutores !== F.par) return false;
    if (F.car && progs(a).indexOf(F.car) < 0) return false;
    if (F.mod && !new RegExp(F.mod.slice(0, 5), 'i').test(a.modalidad || '')) return false;
    return true;
  }
  function chips(st) { return st.why.length ? st.why.map(function (w) { return '<span class="tt-ch ' + w[0] + '">' + esc(w[1]) + '</span>'; }).join('') : '<span class="tt-ch">Al día</span>'; }
  function renderAlumnos() {
    var L = D.alumnos.filter(match).map(function (a) { return { a: a, s: estado(a) }; });
    var cnt = { r: 0, y: 0, g: 0 }; L.forEach(function (x) { cnt[x.s.lvl]++; });
    $('#ttSum').innerHTML = '<div data-e=""><b>' + L.length + '</b><span>alumnos</span></div><div data-e="r"><b>' + cnt.r + '</b><span>🔴 para seguimiento</span></div><div data-e="y"><b>' + cnt.y + '</b><span>🟡 para mirar</span></div><div data-e="g"><b>' + cnt.g + '</b><span>🟢 al día</span></div>';
    $$('#ttSum [data-e]').forEach(function (e) { e.onclick = function () { $('#fEst').value = F.est = e.dataset.e; renderAlumnos(); }; });
    if (F.est) L = L.filter(function (x) { return x.s.lvl === F.est; });
    var ord = { r: 0, y: 1, g: 2 };
    L.sort(function (x, y) { return ord[x.s.lvl] - ord[y.s.lvl] || (x.a.title || '').localeCompare(y.a.title || ''); });
    $('#ttList').innerHTML = L.length ? L.map(function (x) {
      var a = x.a, u = ultSeg(a), as = (IX.asis[a._id] || []).slice(0, 8), pr = as.length ? Math.round(100 * as.filter(function (z) { return z.estado !== 'A'; }).length / as.length) : null;
      return '<button class="tt-row" data-id="' + esc(a._id) + '"><span class="tt-dot ' + x.s.lvl + '"></span><span class="tt-nm"><b>' + esc(a.title) + '</b><small>' + esc([a.carreras, a.modalidad, a.tutores].filter(Boolean).join(' · ')) + '</small></span><span class="tt-why">' + chips(x.s) + '</span><span class="tt-meta">' + (pr == null ? '' : '<span>' + pr + '% asist.</span>') + '<span>' + (u ? 'Contacto ' + fcorta(u.fecha) : 'Sin contacto') + '</span></span></button>';
    }).join('') : '<p class="tt-empty">No hay alumnos con esos filtros.</p>';
    $$('#ttList .tt-row').forEach(function (b) { b.onclick = function () { ficha(b.dataset.id); }; });
  }

  /* Vista: pasar lista */
  function renderLista() {
    var f = $('#lDate').value, car = $('#lCar').value, mod = $('#lMod').value, par = $('#lPar').value;
    var L = D.alumnos.filter(function (a) { return a.activo !== false && !async_(a) && (!car || progs(a).indexOf(car) >= 0) && (!mod || (a.modalidad || '') === mod) && (!par || a.tutores === par); })
      .sort(function (x, y) { return (x.title || '').localeCompare(y.title || ''); });
    var by = {}; D.asistencia.forEach(function (x) { if (x.fecha === f) by[x.alumnoId] = x; });
    var dn = L.filter(function (a) { return by[a._id]; }).length;
    $('#ttRoll').innerHTML = '<p class="tt-tip">' + dn + ' de ' + L.length + ' marcados.</p>' + L.map(function (a) {
      var x = by[a._id] || {}, e = x.estado || '', on = e && e !== 'A' && e !== 'J';
      var B = [['P', 'Presente'], ['Z', 'Zoom'], ['A', 'Ausente'], ['J', 'Justificó']].map(function (b) { return '<button type="button" data-v="' + b[0] + '"' + (e === b[0] ? ' class="on"' : '') + '>' + b[1] + '</button>'; }).join('');
      return '<div class="tt-rl" data-id="' + esc(a._id) + '"><span class="tt-nm"><b>' + esc(a.title) + '</b><small>' + esc((a.modalidad || '') + ' · ' + (a.tutores || '')) + '</small></span><span class="tt-seg">' + B + '</span><span class="tt-tg"><label><input type="checkbox" data-k="tarde"' + (x.tarde ? ' checked' : '') + (on ? '' : ' disabled') + '>Tarde</label><label><input type="checkbox" data-k="mesa"' + (x.mesa ? ' checked' : '') + (on ? '' : ' disabled') + '>Mesa</label></span></div>';
    }).join('');
    $$('#ttRoll .tt-rl').forEach(function (row) {
      var id = row.dataset.id;
      function cur() { return by[id] || {}; }
      function put(o) {
        var x = Object.assign({ estado: cur().estado || '', tarde: !!cur().tarde, mesa: !!cur().mesa }, o);
        if (x.estado === 'A' || x.estado === 'J' || !x.estado) { x.tarde = false; x.mesa = false; }
        send({ op: 'asis', alumnoId: id, fecha: f, estado: x.estado, tarde: x.tarde, mesa: x.mesa }, id + '|' + f, 'asistencia').then(renderLista).catch(renderLista);
      }
      $$('.tt-seg button', row).forEach(function (b) { b.onclick = function () { put({ estado: cur().estado === b.dataset.v ? '' : b.dataset.v }); }; });
      $$('.tt-tg input', row).forEach(function (c) { c.onchange = function () { var o = {}; o[c.dataset.k] = c.checked; put(o); }; });
    });
  }

  /* Vista: seguimientos */
  function renderSeg() {
    var lim = iso(new Date(TODAY.getTime() - 14 * 864e5));
    var T = D.alumnos.filter(function (a) { return a.activo !== false; }).map(function (a) { return { a: a, s: estado(a) }; })
      .filter(function (x) { var u = ultSeg(x.a); return x.s.lvl !== 'g' && (!u || u.fecha < lim); })
      .sort(function (x, y) { return (x.s.lvl === 'r' ? 0 : 1) - (y.s.lvl === 'r' ? 0 : 1); });
    $('#ttTodo').innerHTML = T.length ? T.map(function (x) { return '<button class="tt-row" data-id="' + esc(x.a._id) + '"><span class="tt-dot ' + x.s.lvl + '"></span><span class="tt-nm"><b>' + esc(x.a.title) + '</b><small>' + esc(x.a.tutores || '') + '</small></span><span class="tt-why">' + chips(x.s) + '</span><span class="tt-meta">' + (ultSeg(x.a) ? 'Último ' + fcorta(ultSeg(x.a).fecha) : 'Sin contacto') + '</span></button>'; }).join('') : '<p class="tt-empty">Nadie pendiente. 🙌🏽</p>';
    $$('#ttTodo .tt-row').forEach(function (b) { b.onclick = function () { ficha(b.dataset.id); }; });
    var S = D.seguimientos.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).slice(0, 40);
    $('#ttLog').innerHTML = S.length ? S.map(function (s) { var a = IX.alu[s.alumnoId] || {}; return '<div class="tt-li"><b>' + esc(a.title || s.alumnoId) + ' · ' + esc(s.motivo || '') + '</b><span>' + esc(s.nota) + '</span><small>' + fcorta(s.fecha) + ' · ' + esc(s.tutor || '') + (s.respondio ? ' · respondió' : '') + '</small></div>'; }).join('') : '<p class="tt-empty">Todavía no hay seguimientos.</p>';
  }

  /* Vista: equipo */
  function renderEquipo() {
    var R = { director: 'Director', tutor: 'Tutor', pagos: 'Pagos' };
    $('#ttTeam').innerHTML = D.tutores.map(function (t) { return '<div class="tt-tm"><span><b>' + esc(t.title || t.email) + '</b><br><small>' + esc((t.email || '') + (t.pareja ? ' · ' + t.pareja : '')) + '</small></span><span class="tt-ch">' + (R[t.rol] || 'Tutor') + '</span>' + (t._id !== ME._id ? '<button class="tt-btn s" data-del="' + esc(t._id) + '" data-em="' + esc(t.email || '') + '">Quitar</button>' : '<span></span>') + '</div>'; }).join('');
    $$('#ttTeam [data-del]').forEach(function (b) { b.onclick = function () {
      if (b.dataset.ok) { send({ op: 'tutor', borrar: true, id: b.dataset.del, email: b.dataset.em }, b.dataset.del, 'tutores').then(renderEquipo); }
      else { b.dataset.ok = 1; b.textContent = '¿Seguro?'; }
    }; });
  }
  $('#tForm').onsubmit = function (e) {
    e.preventDefault(); var f = e.target, o = { op: 'tutor', title: f.title.value, email: f.email.value, pareja: f.pareja.value, rol: f.rol.value };
    send(o, null, 'tutores').then(function () { f.reset(); renderEquipo(); toast('Listo, ya tiene acceso.'); });
  };

  /* Ficha */
  var WA = {
    Faltas: 'Hola {n}! ¿Cómo estás? Te extrañamos en las últimas clases. ¿Está todo bien? Contanos si te podemos ayudar en algo 🙌🏽',
    'Exámenes': 'Hola {n}! ¿Cómo venís? Vimos que tenés exámenes pendientes. ¿Querés que te ayudemos a organizarte para rendirlos?',
    Grupo: 'Hola {n}! Hace un tiempito que no te leemos en el grupo y queríamos saber cómo estás. ¿Todo bien?',
    'Acompañamiento': 'Hola {n}! ¿Cómo estás? Pasaba a saludarte y a preguntarte cómo venís con la cursada.',
    Pagos: 'Hola {n}! ¿Cómo estás? Te escribo de Habitat porque nos figura pendiente la cuota de {m}. Cualquier cosa avisame y lo vemos juntos.'
  };
  function waLink(a, k) {
    var tel = String(a.telefono || '').replace(/\D/g, ''); if (!tel) return '';
    if (tel.length === 10) tel = '549' + tel; else if (/^0/.test(tel)) tel = '549' + tel.replace(/^0/, '');
    var n = (a.title || '').split(' ')[0];
    return 'https://wa.me/' + tel + '?text=' + encodeURIComponent(WA[k].replace('{n}', n).replace('{m}', mesTxt(CUR_M)));
  }
  function ficha(id) {
    var a = IX.alu[id]; if (!a) return;
    var st = estado(a), pagos = ME.rol === 'pagos';
    var as = IX.asis[id] || [], pres = as.filter(function (x) { return x.estado !== 'A'; }).length;
    var segs = IX.seg[id] || [];
    var motivos = ['Faltas', 'Exámenes', 'Grupo', 'Acompañamiento'].concat(pagos ? ['Pagos'] : []);
    var h = '<div><span class="kick">' + esc([a.carreras, a.modalidad].filter(Boolean).join(' · ')) + '</span><h2 id="drName">' + esc(a.title) + '</h2><p class="tt-tip">Tutores: ' + esc(a.tutores || '—') + (a.ciudad ? ' · ' + esc(a.ciudad) : '') + '</p><div class="tt-why" style="margin-top:10px">' + chips(st) + '</div></div>';
    h += '<div class="tt-blk"><h3>Contacto individual</h3>' + (a.telefono ? '<div class="tt-wa">' + motivos.map(function (k) { return '<a class="tt-btn wa" target="_blank" rel="noopener" data-m="' + k + '" href="' + esc(waLink(a, k)) + '">WhatsApp · ' + k + '</a>'; }).join('') + '</div><p class="tt-tip">Abre WhatsApp con un mensaje listo para revisar y mandar vos. Después anotalo abajo.</p>' : '<p class="tt-tip">Cargá su teléfono en «Datos» para escribirle por WhatsApp desde acá.</p>') +
      '<form class="tt-form" id="segF"><label>Motivo<select name="motivo">' + motivos.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label><label>Fecha<input type="date" name="fecha" value="' + iso(TODAY) + '"></label><label class="w">Qué hablaron<textarea name="nota" placeholder="Ej.: le escribí por las faltas, está con mucho trabajo y vuelve el sábado."></textarea></label><label class="w" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="respondio" style="width:auto"> Respondió</label><button class="tt-btn" type="submit">Guardar seguimiento</button></form>' +
      (segs.length ? '<div class="tt-log">' + segs.map(function (s) { return '<div class="tt-li"><b>' + esc(s.motivo || 'Seguimiento') + ' · ' + fcorta(s.fecha) + '</b><span>' + esc(s.nota) + '</span><small>' + esc(s.tutor || '') + (s.respondio ? ' · respondió' : '') + ' · <a href="#" data-sd="' + esc(s._id) + '">borrar</a></small></div>'; }).join('') + '</div>' : '') + '</div>';
    h += '<div class="tt-blk"><h3>Asistencia</h3>' + (async_(a) ? '<p class="tt-tip">Cursa en modalidad asincrónica: su avance se ve en el Campus.</p>' : '<p class="tt-tip">' + (as.length ? pres + ' de ' + as.length + ' clases (' + Math.round(100 * pres / as.length) + '%) · tarde ' + as.filter(function (x) { return x.tarde; }).length + ' · tiempo de mesa ' + as.filter(function (x) { return x.mesa; }).length : 'Sin clases registradas') + '</p><div class="tt-dots">' + as.slice().reverse().map(function (x) { return '<i class="' + x.estado + '" title="' + fcorta(x.fecha) + '">' + (x.estado === 'A' ? '✕' : x.estado === 'J' ? 'J' : x.tarde ? 'T' : '✓') + '</i>'; }).join('') + '</div>') + '</div>';
    if (becado(a)) h += '<div class="tt-blk"><h3>Pagos</h3><p class="tt-tip">Becado.</p></div>';
    else {
      var p = IX.pago[id] || {}, ms = []; for (var m = startM(a); m <= addM(CUR_M, 1) && ms.length < 24; m = addM(m, 1)) ms.push(m);
      h += '<div class="tt-blk"><h3>Pagos' + (a.formaPago ? ' · ' + esc(a.formaPago) : '') + (a.matricula ? ' · matrícula paga' : '') + '</h3><div class="tt-grid" id="pgG">' + ms.map(function (m) { var v = p[m]; return '<button type="button" data-m="' + m + '" class="' + (v ? 'ok' : m < CUR_M || (m === CUR_M && TODAY.getDate() > 10) ? 'no' : '') + '"' + (pagos ? '' : ' disabled') + '>' + MC[+m.slice(5) - 1] + (v ? ' ✓' : '') + '</button>'; }).join('') + '</div>' + (pagos ? '<p class="tt-tip">Tocá un mes para marcarlo como pagado o pendiente.</p>' : '<p class="tt-tip">Los pagos los marca Raquel.</p>') + '</div>';
    }
    progs(a).forEach(function (pg) { var e = IX.ev[id] || {}; h += '<div class="tt-blk"><h3>Exámenes y TP · ' + pg + '</h3><div class="tt-grid" data-pg="' + pg + '">' + PROG[pg].map(function (it) { return '<button type="button" data-it="' + it + '" class="' + (e[pg + '|' + it] ? 'ok' : '') + '">' + it.replace('Módulo', 'Mód.').replace('Bloque', 'Bl.') + (e[pg + '|' + it] ? ' ✓' : '') + '</button>'; }).join('') + '</div></div>'; });
    var g = IX.gr[id] || {}, wk = []; for (var k = 0; k < 6; k++) wk.push(iso(new Date(monday(TODAY).getTime() - k * 7 * 864e5)));
    h += '<div class="tt-blk"><h3>Grupo de WhatsApp</h3><div class="tt-wk">' + wk.map(function (w) { var v = g[w] || ''; return '<div><span>Semana del ' + fcorta(w) + '</span><select data-w="' + w + '"><option value="">—</option><option value="activo"' + (v === 'activo' ? ' selected' : '') + '>Participa</option><option value="poco"' + (v === 'poco' ? ' selected' : '') + '>Poco</option><option value="nada"' + (v === 'nada' ? ' selected' : '') + '>No participa</option></select></div>'; }).join('') + '</div></div>';
    h += '<div class="tt-blk"><h3>Kids &amp; Hero</h3><p class="tt-tip">Muy pronto vas a ver acá sus horas de juego, nivel, insignias y los dones que va descubriendo.</p></div>';
    h += '<div class="tt-blk"><h3>Datos</h3><form class="tt-form" id="aluF">' + aluFields(a, pagos) + '<button class="tt-btn" type="submit">Guardar datos</button></form></div>';
    $('#drBody').innerHTML = h; $('#ttDrawer').hidden = false; document.body.style.overflow = 'hidden'; $('.tt-dr').scrollTop = 0;
    var sf = $('#segF');
    $$('.tt-wa a').forEach(function (l) { l.addEventListener('click', function () { sf.motivo.value = l.dataset.m; sf.nota.focus(); }); });
    sf.onsubmit = function (e) { e.preventDefault(); send({ op: 'seg', alumnoId: id, motivo: sf.motivo.value, fecha: sf.fecha.value, nota: sf.nota.value, respondio: sf.respondio.checked }, null, 'seguimientos').then(function () { toast('Seguimiento guardado.'); ficha(id); refresh(); }); };
    $$('[data-sd]').forEach(function (l) { l.onclick = function (e) { e.preventDefault(); if (!l.dataset.ok) { l.dataset.ok = 1; l.textContent = '¿seguro?'; return; } send({ op: 'seg-del', id: l.dataset.sd }, l.dataset.sd, 'seguimientos').then(function () { ficha(id); refresh(); }); }; });
    $$('#pgG button').forEach(function (b) { b.onclick = function () { var m = b.dataset.m; send({ op: 'pago', alumnoId: id, mes: m, pagado: !(IX.pago[id] || {})[m] }, id + '|' + m, 'pagos').then(function () { ficha(id); refresh(); }); }; });
    $$('[data-pg]').forEach(function (gr) { $$('button', gr).forEach(function (b) { b.onclick = function () { var pg = gr.dataset.pg, it = b.dataset.it; send({ op: 'eval', alumnoId: id, programa: pg, item: it, ok: !(IX.ev[id] || {})[pg + '|' + it] }, null, null).then(function (r) { var k = id + '|' + pg + '|' + it; if (r.item) D.evaluaciones.push(r.item); else D.evaluaciones = D.evaluaciones.filter(function (x) { return !(x.alumnoId === id && x.programa === pg && x.item === it); }); index(); ficha(id); refresh(); }); }; }); });
    $$('[data-w]').forEach(function (s) { s.onchange = function () { send({ op: 'grupo', alumnoId: id, semana: s.dataset.w, nivel: s.value }, id + '|' + s.dataset.w, 'grupo').then(refresh); }; });
    $('#aluF').onsubmit = function (e) { e.preventDefault(); saveAlu(e.target, id); };
  }
  function aluFields(a, pagos) {
    var f = function (k, l, t, w) { return '<label' + (w ? ' class="w"' : '') + '>' + l + '<input name="' + k + '" type="' + (t || 'text') + '" value="' + esc(a[k] || '') + '"></label>'; };
    var pars = parejas();
    return f('title', 'Nombre', 'text', 1) + f('carreras', 'Carreras (ej. Maranata y Liderazgo)') +
      '<label>Modalidad<select name="modalidad">' + ['Presencial', 'Zoom', 'Asincrónico'].map(function (m) { return '<option' + (a.modalidad === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>' +
      '<label>Tutores<input name="tutores" list="parejasA" value="' + esc(a.tutores || '') + '"><datalist id="parejasA">' + pars.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</datalist></label>' +
      f('ciudad', 'Ciudad') + f('telefono', 'WhatsApp', 'tel') + f('email', 'Email', 'email') + f('cumple', 'Cumpleaños', 'date') +
      (pagos ? '<label>Forma de pago<select name="formaPago">' + ['', 'Débito automático', 'Transferencia', 'Efectivo', 'Becado'].map(function (m) { return '<option' + ((a.formaPago || '') === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="matricula" style="width:auto"' + (a.matricula ? ' checked' : '') + '> Matrícula paga</label>' : '') +
      '<label class="w">Notas<textarea name="notas">' + esc(a.notas || '') + '</textarea></label>' +
      (a._id ? '<label class="w" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="baja" style="width:auto"' + (a.activo === false ? ' checked' : '') + '> Dejó de cursar (no aparece en las listas)</label>' : '');
  }
  function saveAlu(f, id) {
    var o = { op: 'alumno', alumnoId: id || '', title: f.title.value, carreras: f.carreras.value, modalidad: f.modalidad.value, tutores: f.tutores.value, ciudad: f.ciudad.value, telefono: f.telefono.value, email: f.email.value, cumple: f.cumple.value, notas: f.notas.value, activo: !(f.baja && f.baja.checked) };
    if (f.formaPago) { o.formaPago = f.formaPago.value; o.matricula = f.matricula.checked; }
    send(o, id, 'alumnos').then(function (r) { toast('Datos guardados.'); refresh(); ficha(r.item._id); });
  }
  function nuevo() {
    $('#drBody').innerHTML = '<div><span class="kick">Nuevo alumno</span><h2 id="drName">Sumar alumno</h2></div><div class="tt-blk"><form class="tt-form" id="aluF">' + aluFields({ modalidad: 'Presencial', tutores: ME.pareja || '' }, ME.rol === 'pagos') + '<button class="tt-btn" type="submit">Crear</button></form></div>';
    $('#ttDrawer').hidden = false; document.body.style.overflow = 'hidden';
    $('#aluF').onsubmit = function (e) { e.preventDefault(); saveAlu(e.target, ''); };
  }
  function closeDr() { $('#ttDrawer').hidden = true; document.body.style.overflow = ''; }
  $$('[data-x]').forEach(function (e) { e.onclick = closeDr; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDr(); });

  function parejas() { var s = {}; D.alumnos.forEach(function (a) { if (a.tutores) s[a.tutores] = 1; }); D.tutores.forEach(function (t) { if (t.pareja) s[t.pareja] = 1; }); return Object.keys(s).sort(); }

  /* Notificaciones: cada dos semanas, recordatorio para el grupo y resumen de la quincena */
  var ANCHOR = new Date(2026, 10, 2);
  function notis() {
    var per = Math.floor((TODAY - ANCHOR) / (14 * 864e5)), seen = ls('tt:n') || '';
    var ini = new Date(ANCHOR.getTime() + per * 14 * 864e5), desde = iso(new Date(ini.getTime() - 14 * 864e5));
    var mine = D.alumnos.filter(function (a) { return a.activo !== false && (!ME.pareja || a.tutores === ME.pareja); });
    var E = mine.map(function (a) { return { a: a, s: estado(a) }; });
    var r = E.filter(function (x) { return x.s.lvl === 'r'; }), y = E.filter(function (x) { return x.s.lvl === 'y'; });
    var segQ = D.seguimientos.filter(function (s) { return s.fecha >= desde && mine.some(function (a) { return a._id === s.alumnoId; }); }).length;
    var cls = D.asistencia.filter(function (x) { return x.fecha >= desde && mine.some(function (a) { return a._id === x.alumnoId; }); });
    var pct = cls.length ? Math.round(100 * cls.filter(function (x) { return x.estado !== 'A'; }).length / cls.length) : null;
    var N = [
      { k: 'g' + per, t: 'Toca escribir en el grupo', h: '<p>Cada dos semanas, un mensaje al grupo de WhatsApp de tus alumnos: una palabra, una pregunta sobre la última clase, un aviso o simplemente un saludo. Mantiene vivo el grupo y ayuda a ver quién se está alejando.</p>' },
      { k: 'r' + per, t: 'Resumen de la quincena' + (ME.pareja ? ' · ' + ME.pareja : ''), h: '<ul><li>' + mine.length + ' alumnos · 🔴 ' + r.length + ' para seguimiento · 🟡 ' + y.length + ' para mirar</li>' + (pct != null ? '<li>Asistencia de las últimas dos semanas: ' + pct + '%</li>' : '') + '<li>Seguimientos individuales en la quincena: ' + segQ + '</li>' + r.slice(0, 6).map(function (x) { return '<li><b>' + esc(x.a.title) + '</b>: ' + esc(x.s.why.map(function (w) { return w[1]; }).join(', ')) + '</li>'; }).join('') + '</ul>' }
    ];
    var un = N.filter(function (n) { return seen.indexOf('|' + n.k) < 0; });
    $('#ttBellN').textContent = un.length; $('#ttBellN').hidden = !un.length;
    var box = $('#ttNoti');
    function draw() { box.innerHTML = '<div class="wrap">' + N.map(function (n) { return '<div class="tt-n"><b>' + n.t + '</b>' + n.h + '<button class="nx" data-k="' + n.k + '">Marcar como leída</button></div>'; }).join('') + '</div>'; $$('.nx', box).forEach(function (b) { b.onclick = function () { ls('tt:n', (ls('tt:n') || '') + '|' + b.dataset.k); b.closest('.tt-n').remove(); notis(); if (!box.querySelector('.tt-n')) box.hidden = true; }; }); }
    $('#ttBell').onclick = function () { box.hidden = !box.hidden; if (!box.hidden) draw(); };
    if (un.length && !notis.shown) { notis.shown = 1; box.hidden = false; draw(); }
  }

  function refresh() { var t = (document.querySelector('.tt-tabs .on') || {}).dataset; t = t ? t.t : 'alumnos'; if (t === 'alumnos') renderAlumnos(); if (t === 'lista') renderLista(); if (t === 'seg') renderSeg(); if (t === 'equipo') renderEquipo(); }
  $$('#ttTabs button').forEach(function (b) { b.onclick = function () { $$('#ttTabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tt-v').forEach(function (v) { v.hidden = v.id !== 'v-' + b.dataset.t; }); refresh(); }; });

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/tutor.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { D = await api('GET'); }
    catch (e) { $('#ttWho').textContent = e.status === 403 ? 'Tu cuenta todavía no tiene acceso al panel de tutores. Pedíselo a la dirección de Habitat.' : 'No pudimos cargar el panel. Probá de nuevo en un momento.'; $('#ttList').innerHTML = ''; return; }
    ME = D.me; index();
    var R = { director: 'Director', tutor: 'Tutor', pagos: 'Pagos' };
    $('#ttWho').textContent = 'Hola ' + (ME.title || '') + ' · ' + (R[ME.rol] || 'Tutor') + (ME.pareja ? ' · ' + ME.pareja : '');
    $('#tabEq').hidden = ME.rol !== 'director';
    var opts = parejas().map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
    $('#fPar').insertAdjacentHTML('beforeend', opts); $('#lPar').insertAdjacentHTML('beforeend', opts); $('#parejas').innerHTML = opts;
    if (ME.pareja && parejas().indexOf(ME.pareja) >= 0) { $('#fPar').value = F.par = ME.pareja; $('#lPar').value = ME.pareja; }
    $('#fQ').oninput = function () { F.q = this.value.trim().toLowerCase(); renderAlumnos(); };
    $('#fPar').onchange = function () { F.par = this.value; renderAlumnos(); };
    $('#fCar').onchange = function () { F.car = this.value; renderAlumnos(); };
    $('#fMod').onchange = function () { F.mod = this.value; renderAlumnos(); };
    $('#fEst').onchange = function () { F.est = this.value; renderAlumnos(); };
    $('#addAlu').onclick = nuevo;
    $('#lDate').value = iso(lastSat());
    ['#lDate', '#lCar', '#lMod', '#lPar'].forEach(function (s) { $(s).onchange = renderLista; });
    renderAlumnos(); notis();
    var h = location.hash.replace('#', ''); if (h) { var b = document.querySelector('#ttTabs [data-t="' + h + '"]'); if (b && !b.hidden) b.click(); }
  })();
})();
