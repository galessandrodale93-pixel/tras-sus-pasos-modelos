/* Panel de tutores de Habitat: hoy, alumnos, lista, tiempo de mesa, calendario, voluntarios y equipo. */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var DD = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], DL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function pd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function fcorta(s) { var d = pd(s); return d.getDate() + ' ' + MC[d.getMonth()]; }
  function flarga(s) { var d = pd(s); return DL[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function mesTxt(m) { return MESES[+m.slice(5, 7) - 1]; }
  function monday(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function addD(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  var CUR_M = iso(TODAY).slice(0, 7);
  function addM(m, n) { var d = pd(m + '-01'); d.setMonth(d.getMonth() + n); return iso(d).slice(0, 7); }
  // la última clase (miércoles, jueves o sábado) hasta hoy
  function lastClass() { var d = new Date(TODAY); for (var i = 0; i < 7; i++) { if ([3, 4, 6].indexOf(d.getDay()) >= 0) return d; d = addD(d, -1); } return TODAY; }
  var PROG = { Maranata: ['Módulo 1', 'Módulo 2', 'Módulo 3', 'Módulo 4', 'Módulo 5', 'Módulo 6', 'TP 1', 'TP 2'], Liderazgo: [], 'Adoración': [] };
  for (var i = 1; i <= 12; i++) { PROG.Liderazgo.push('Bloque ' + i); PROG['Adoración'].push('Bloque ' + i); }
  PROG.Liderazgo.push('TP'); PROG['Adoración'].push('TP');
  function nrm(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function progs(a) { var c = nrm(a.carreras); return ['Maranata', 'Liderazgo', 'Adoración'].filter(function (p) { return c.indexOf(nrm(p)) >= 0; }); }
  function async_(a) { return /asinc/i.test(a.modalidad || ''); }
  function becado(a) { return /becad/i.test(a.formaPago || ''); }
  var PAL = ['#5f7f6e', '#8a6d4b', '#4f6d8a', '#8a4f5f', '#6b5f8a', '#4f8a85', '#8a7a4f', '#7a5f4f', '#55707e', '#7d6a8e'];
  function av(name, lvl, cls) { var n = String(name || '?').trim(), h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; var ini = n.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); return '<span class="tt-av ' + (lvl || '') + ' ' + (cls || '') + '" style="--c:' + PAL[h % PAL.length] + '" aria-hidden="true">' + esc(ini) + '</span>'; }
  function ring(p, label, col) { return '<span class="tt-ring" style="--p:' + Math.max(0, Math.min(100, p)) + ';--col:' + (col || 'var(--g)') + '"><span>' + label + '</span></span>'; }

  var D = null, ME = null, IX = {};
  function toast(t) { var e = $('#ttToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2400); }
  async function token() { await A.api('GET', '/members/v1/members/my'); try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } }
  async function api(method, body) {
    var r = await fetch('/api/tutor', { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await token() }, body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No se guardó. Revisá la conexión y probá de nuevo.'); er.status = r.status; throw er; }
    return j;
  }
  // guarda y actualiza la lista local `col` (reemplaza por _id, o borra `key` si no vuelve item)
  async function send(body, key, col) {
    try {
      var r = await api('POST', body);
      if (col) { var L = D[col] = D[col] || [], id = r.item && r.item._id || key, at = L.findIndex(function (x) { return x._id === id; }); if (r.item) { if (at >= 0) L[at] = r.item; else L.push(r.item); } else if (at >= 0) L.splice(at, 1); index(); }
      return r;
    } catch (e) { toast(e.message); throw e; }
  }

  function index() {
    IX = { asis: {}, pago: {}, ev: {}, nota: {}, gr: {}, seg: {}, alu: {} };
    D.alumnos.forEach(function (a) { IX.alu[a._id] = a; });
    D.asistencia.forEach(function (x) { (IX.asis[x.alumnoId] = IX.asis[x.alumnoId] || []).push(x); });
    Object.keys(IX.asis).forEach(function (k) { IX.asis[k].sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }); });
    D.pagos.forEach(function (x) { (IX.pago[x.alumnoId] = IX.pago[x.alumnoId] || {})[x.mes] = x.pagado; });
    D.evaluaciones.forEach(function (x) { var k = x.programa + '|' + x.item; (IX.ev[x.alumnoId] = IX.ev[x.alumnoId] || {})[k] = x.ok !== false; (IX.nota[x.alumnoId] = IX.nota[x.alumnoId] || {})[k] = x; });
    D.grupo.forEach(function (x) { (IX.gr[x.alumnoId] = IX.gr[x.alumnoId] || {})[x.semana] = x.nivel; });
    D.seguimientos.forEach(function (x) { (IX.seg[x.alumnoId] = IX.seg[x.alumnoId] || []).push(x); });
    Object.keys(IX.seg).forEach(function (k) { IX.seg[k].sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }); });
    IX.med = {};
    Object.keys(PROG).forEach(function (p) {
      var c = D.alumnos.filter(function (a) { return a.activo !== false && progs(a).indexOf(p) >= 0; }).map(function (a) { return nEv(a, p); }).sort(function (x, y) { return x - y; });
      IX.med[p] = c.length ? c[Math.floor(c.length / 2)] : 0;
    });
  }
  function nEv(a, p) { var e = IX.ev[a._id] || {}; return PROG[p].filter(function (it) { return e[p + '|' + it]; }).length; }
  function startM(a) { var p = IX.pago[a._id]; var ks = p ? Object.keys(p).sort() : []; return ks[0] || (progs(a).indexOf('Maranata') >= 0 ? '2026-03' : '2026-08'); }
  function activos() { return D.alumnos.filter(function (a) { return a.activo !== false; }); }

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
      if (L.filter(function (x) { return x.tarde; }).length >= 2) why.push(['y', 'Llega tarde']);
    }
    var dr = (D.debiRech || {})[a._id]; if (dr) why.push(['r', 'Debi rechazó su débito' + (dr.veces > 1 ? ' (' + dr.veces + ' veces)' : '')]);
    progs(a).forEach(function (p) { var d = IX.med[p] - nEv(a, p); if (d >= 2) why.push(['r', 'Atrasado en exámenes de ' + p]); else if (d === 1) why.push(['y', 'Le falta un examen de ' + p]); });
    var nn = IX.nota[a._id] || {}; Object.keys(nn).forEach(function (k) { if (nn[k].ok === false) why.push(['y', 'Recupera ' + k.split('|')[1]]); });
    var g = IX.gr[a._id] || {}, w0 = iso(monday(TODAY)), w1 = iso(addD(monday(TODAY), -7)), w2 = iso(addD(monday(TODAY), -14));
    if ((g[w0] || g[w1]) === 'nada' && (g[w1] === 'nada' || g[w2] === 'nada')) why.push(['y', 'No participa en el grupo']);
    var r = why.filter(function (x) { return x[0] === 'r'; }).length, y = why.length - r;
    return { lvl: r || y >= 2 ? 'r' : y ? 'y' : 'g', why: why };
  }
  function ultSeg(a) { var s = IX.seg[a._id]; return s && s[0]; }
  function chips(st) { return st.why.length ? st.why.map(function (w) { return '<span class="tt-ch ' + w[0] + '">' + esc(w[1]) + '</span>'; }).join('') : '<span class="tt-ch">Al día</span>'; }
  function porContactar() { var lim = iso(addD(TODAY, -14)); return activos().map(function (a) { return { a: a, s: estado(a) }; }).filter(function (x) { var u = ultSeg(x.a); return x.s.lvl !== 'g' && (!u || u.fecha < lim) && (!F.par || x.a.tutores === F.par); }).sort(function (x, y) { return (x.s.lvl === 'r' ? 0 : 1) - (y.s.lvl === 'r' ? 0 : 1); }); }
  function asisPct(L) { return L.length ? Math.round(100 * L.filter(function (z) { return z.estado !== 'A'; }).length / L.length) : null; }

  /* Hoy */
  function renderHoy() {
    var T = [], pc = porContactar(), lc = iso(lastClass());
    var mine = activos().filter(function (a) { return !async_(a) && (!F.par || a.tutores === F.par); });
    var marc = D.asistencia.filter(function (x) { return x.fecha === lc && mine.some(function (a) { return a._id === x.alumnoId; }); }).length;
    if (pc.length) T.push('<button class="tt-task hot" data-go="contactar"><b>' + pc.length + '</b><h3>' + (pc.length === 1 ? 'persona para acompañar' : 'personas para acompañar') + '</h3><div class="tt-faces">' + pc.slice(0, 7).map(function (x) { return av(x.a.title, x.s.lvl, 'sm'); }).join('') + '</div><p>Están en rojo o amarillo y nadie les escribió en estas dos semanas. Un mensaje a tiempo hace la diferencia.</p></button>');
    var rech = mine.filter(function (a) { return (D.debiRech || {})[a._id]; });
    if (rech.length) T.push('<button class="tt-task hot" data-go="contactar"><b>' + rech.length + '</b><h3>' + (rech.length === 1 ? 'débito rechazado' : 'débitos rechazados') + ' en Debi</h3><div class="tt-faces">' + rech.slice(0, 7).map(function (a) { return av(a.title, 'r', 'sm'); }).join('') + '</div><p>La tarjeta o cuenta no tuvo fondos, venció o se dio de baja. Un mensaje con cariño ayuda a que lo actualicen.</p></button>');
    if (marc < mine.length) T.push('<button class="tt-task" data-go="lista"><b>' + marc + '/' + mine.length + '</b><h3>Lista del ' + flarga(lc) + '</h3><p>' + (marc ? 'Faltan marcar ' + (mine.length - marc) + ' alumnos.' : 'Todavía no se pasó lista de esa clase.') + '</p></button>');
    var exm = (D.eventos || []).filter(function (e) { var f = iso(evDate(e)); return e.mesa && f <= iso(TODAY) && f >= iso(addD(TODAY, -10)) && !(D.mesa || []).some(function (m) { return m.fecha === f; }); });
    if (exm.length) T.push('<button class="tt-task" data-go="mesa"><b>🍽️</b><h3>Tiempo de mesa del ' + fcorta(iso(evDate(exm[0]))) + '</h3><p>Contá quiénes estuvieron, de qué se habló y qué notaste.</p></button>');
    var prox = (D.eventos || []).filter(function (e) { return e.mesa && iso(evDate(e)) > iso(TODAY); })[0];
    if (prox) T.push('<button class="tt-task" data-go="cal"><b>' + evDate(prox).getDate() + ' ' + MC[evDate(prox).getMonth()] + '</b><h3>' + esc(prox.title) + (prox.curso ? ' · ' + esc(prox.curso) : '') + '</h3><p>Próximo examen, con tiempo de mesa después.</p></button>');
    if ((D.tally || []).length) T.push('<button class="tt-task" data-go="tally"><b>' + D.tally.length + '</b><h3>Exámenes sin asignar</h3><p>Llegaron de Tally con un nombre que no reconocemos. Elegí a quién corresponden.</p></button>');
    if (ME.rol === 'director') {
      var w = monday(TODAY), dias = [2, 3, 5].map(function (n) { return iso(addD(w, n)); }), libres = 0;
      dias.forEach(function (f) { TAREAS.forEach(function (t) { if (!(D.turnos || []).some(function (x) { return x.fecha === f && x.tarea === t[0]; })) libres++; }); });
      T.push('<button class="tt-task" data-go="vol"><b>' + (18 - libres) + '/18</b><h3>Servicio de esta semana</h3><p>' + (libres ? libres + ' tareas sin voluntario.' : 'Todas las tareas tienen a alguien. Gracias a Dios por cada uno.') + '</p></button>');
    }
    if (!T.length) T.push('<div class="tt-task"><b>🙌🏽</b><h3>Todo en orden</h3><p>No hay nada pendiente para hoy.</p></div>');
    var all = mine.length ? mine : activos(), g = 0, asis = [], pag = 0, pagN = 0;
    all.forEach(function (a) { var s = estado(a); if (s.lvl === 'g') g++; asis = asis.concat((IX.asis[a._id] || []).filter(function (x) { return x.fecha >= iso(addD(TODAY, -30)); })); if (!becado(a)) { pagN++; if ((IX.pago[a._id] || {})[addM(CUR_M, -1)]) pag++; } });
    var pa = asisPct(asis) || 0, ppag = pagN ? Math.round(100 * pag / pagN) : 0, pg = all.length ? Math.round(100 * g / all.length) : 0;
    var S = D.seguimientos.slice().filter(function (s) { return !/Excel/.test(s.nota || ''); }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).slice(0, 8);
    $('#v-hoy').innerHTML = '<div class="tt-today">' + T.join('') + '</div>' +
      renderQuincena() + '<div class="tt-card tt-stats"><div class="tt-stat">' + ring(pa, pa + '%') + '<small>de asistencia en el último mes</small></div><div class="tt-stat">' + ring(pg, pg + '%', 'var(--gold)') + '<small>de tus alumnos al día</small></div><div class="tt-stat">' + ring(ppag, ppag + '%', '#4f6d8a') + '<small>pagó ' + mesTxt(addM(CUR_M, -1)) + '</small></div></div>' +
      '<div id="tallyBox"></div><h2 class="tt-h">Últimos contactos individuales</h2><div class="tt-tl">' + (S.length ? S.map(function (s) { var a = IX.alu[s.alumnoId] || {}; return '<div><b>' + esc(a.title || s.alumnoId) + ' · ' + esc(s.motivo || '') + '</b><span>' + esc(s.nota) + '</span><small>' + fcorta(s.fecha) + ' · ' + esc(s.tutor || '') + (s.respondio ? ' · respondió 🙌🏽' : '') + '</small></div>'; }).join('') : '<div><span>Todavía no hay contactos registrados. Cuando le escribas a alguien, anotalo en su ficha.</span></div>') + '</div>';
    $$('#v-hoy [data-go]').forEach(function (b) { b.onclick = function () { var g = b.dataset.go; if (g === 'contactar') { F.est = 'c'; tab('alumnos'); } else if (g === 'tally') $('#tallyBox').scrollIntoView({ behavior: 'smooth' }); else tab(g); }; });
    bindPairPills('hoy', renderHoy);
    bindQuincena($('#v-hoy'));
    renderTally();
  }
  function pairPills(k) { return ['<button class="tt-pill' + (!F.par ? ' on' : '') + '" data-pp="">Todos</button>'].concat(parejas().map(function (p) { return '<button class="tt-pill' + (F.par === p ? ' on' : '') + '" data-pp="' + esc(p) + '">' + esc(p) + '</button>'; })).join(''); }
  function bindPairPills(scope, fn) { $$('#v-' + scope + ' [data-pp]').forEach(function (b) { b.onclick = function () { F.par = b.dataset.pp; fn(); }; }); }

  function renderTally() {
    var P = D.tally || [], box = $('#tallyBox'); if (!box) return;
    box.innerHTML = P.length ? '<h2 class="tt-h">Exámenes sin asignar</h2><div class="tt-team">' + P.map(function (p) { return '<div class="tt-tm">' + av(p.title, '', 'sm') + '<span><b>«' + esc(p.title) + '»</b><br><small>' + esc((p.programa || '') + ' · ' + (p.item || '') + (p.nota != null ? ' · nota ' + p.nota : '') + (p.fecha ? ' · ' + fcorta(p.fecha) : '')) + '</small></span><select data-ta="' + esc(p._id) + '" aria-label="Elegir alumno"><option value="">Es de…</option>' + D.alumnos.filter(function (a) { return progs(a).indexOf(p.programa) >= 0; }).map(function (a) { return '<option value="' + esc(a._id) + '">' + esc(a.title) + '</option>'; }).join('') + '</select><button class="tt-btn s" data-td="' + esc(p._id) + '">Descartar</button></div>'; }).join('') + '</div>' : '';
    $$('[data-ta]').forEach(function (s) { s.onchange = function () { if (!s.value) return; send({ op: 'tally', id: s.dataset.ta, alumnoId: s.value }).then(reload).then(function () { toast('Examen asignado.'); }); }; });
    $$('[data-td]').forEach(function (b) { b.onclick = function () { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = '¿Descartar?'; return; } send({ op: 'tally', id: b.dataset.td, descartar: true }).then(reload); }; });
  }
  async function reload() { D = await api('GET'); ME = D.me; index(); refresh(); }

  /* Alumnos */
  var F = { q: '', par: '', car: '', mod: '', est: '' };
  function renderAlumnos() {
    var base = activos().filter(function (a) { return (!F.q || nrm(a.title).indexOf(nrm(F.q)) >= 0) && (!F.par || a.tutores === F.par) && (!F.car || progs(a).indexOf(F.car) >= 0) && (!F.mod || (a.modalidad || '') === F.mod); });
    var L = base.map(function (a) { return { a: a, s: estado(a) }; }), cnt = { r: 0, y: 0, g: 0 }; L.forEach(function (x) { cnt[x.s.lvl]++; });
    var pc = porContactar().map(function (x) { return x.a._id; });
    var pill = function (k, v, t, dot) { return '<button class="tt-pill' + (F[k] === v ? ' on' : '') + '" data-k="' + k + '" data-v="' + esc(v) + '">' + (dot ? '<i style="background:' + dot + '"></i>' : '') + t + '</button>'; };
    $('#fPills').innerHTML = pill('est', '', 'Todos · ' + L.length) + pill('est', 'c', 'Para contactar · ' + pc.length) + pill('est', 'r', 'Seguimiento · ' + cnt.r, 'var(--r)') + pill('est', 'y', 'Para mirar · ' + cnt.y, 'var(--y)') + pill('est', 'g', 'Al día · ' + cnt.g, 'var(--g)') + '<span class="tt-sep"></span>' +
      pill('car', '', 'Todas las carreras') + ['Maranata', 'Liderazgo', 'Adoración'].map(function (c) { return pill('car', c, c); }).join('') + '<span class="tt-sep"></span>' + pill('mod', '', 'Toda modalidad') + ['Presencial', 'Zoom', 'Asincrónico'].map(function (c) { return pill('mod', c, c); }).join('') + '<span class="tt-sep"></span>' + pill('par', '', 'Todos los tutores') + parejas().map(function (p) { return pill('par', p, p); }).join('');
    $$('#fPills [data-k]').forEach(function (b) { b.onclick = function () { F[b.dataset.k] = b.dataset.v; renderAlumnos(); }; });
    if (F.est === 'c') L = L.filter(function (x) { return pc.indexOf(x.a._id) >= 0; }); else if (F.est) L = L.filter(function (x) { return x.s.lvl === F.est; });
    var ord = { r: 0, y: 1, g: 2 };
    L.sort(function (x, y) { return ord[x.s.lvl] - ord[y.s.lvl] || (x.a.title || '').localeCompare(y.a.title || ''); });
    $('#ttList').innerHTML = L.length ? L.map(function (x) {
      var a = x.a, u = ultSeg(a), as = (IX.asis[a._id] || []).slice(0, 10).reverse(), tot = progs(a).reduce(function (s, p) { return s + PROG[p].length; }, 0), done = progs(a).reduce(function (s, p) { return s + nEv(a, p); }, 0);
      return '<button class="tt-person" data-id="' + esc(a._id) + '"><span class="tt-ph">' + av(a.title, x.s.lvl) + '<div><b>' + esc(a.title) + '</b><small>' + esc([a.carreras, a.modalidad].filter(Boolean).join(' · ')) + '</small></div></span><span class="tt-why">' + chips(x.s) + '</span>' +
        '<span class="tt-meta"><span class="tt-strip" title="Últimas clases">' + (async_(a) ? '<small>Asincrónico</small>' : as.map(function (z) { return '<i class="' + z.estado + '"></i>'; }).join('') || '<small>Sin clases</small>') + '</span><span class="tt-mini" title="' + done + ' de ' + tot + ' exámenes y TP"><i style="width:' + (tot ? Math.round(100 * done / tot) : 0) + '%"></i></span></span>' +
        '<span class="tt-meta"><span>' + esc(a.tutores || '') + '</span><span>' + (u ? 'Contacto ' + fcorta(u.fecha) : 'Sin contacto') + '</span></span></button>';
    }).join('') : '<p class="tt-empty">No hay alumnos con estos filtros.</p>';
    $$('#ttList .tt-person').forEach(function (b) { b.onclick = function () { ficha(b.dataset.id); }; });
  }

  /* Pasar lista */
  var LF = { car: '', mod: '' }, CYC = ['P', 'Z', 'A', 'J', ''], STN = { P: 'Presente', Z: 'Zoom', A: 'Ausente', J: 'Justificó', '': 'Sin marcar' };
  function listaAl() { return activos().filter(function (a) { return !async_(a) && (!LF.car || progs(a).indexOf(LF.car) >= 0) && (!LF.mod || a.modalidad === LF.mod) && (!F.par || a.tutores === F.par); }).sort(function (x, y) { return (x.title || '').localeCompare(y.title || ''); }); }
  function renderLista() {
    var puede = !!ME.lista; $('#lAll').hidden = !puede; $('#lTip').textContent = puede ? 'Tocá a cada alumno para marcar cómo vino. Cada toque pasa al estado siguiente: presente, Zoom, ausente, justificó. Si vino, abajo podés marcar si llegó tarde o si se quedó al tiempo de mesa. Se guarda solo.' : 'La lista la pasa quien tiene ese permiso (Raquel). Acá ves cómo quedó cada clase.';
    var f = $('#lDate').value, L = listaAl(), by = {}; D.asistencia.forEach(function (x) { if (x.fecha === f) by[x.alumnoId] = x; });
    var pill = function (k, v, t) { return '<button class="tt-pill' + (LF[k] === v ? ' on' : '') + '" data-k="' + k + '" data-v="' + v + '">' + t + '</button>'; };
    $('#lPills').innerHTML = pill('car', '', 'Todas') + ['Maranata', 'Liderazgo', 'Adoración'].map(function (c) { return pill('car', c, c); }).join('') + '<span class="tt-sep"></span>' + pill('mod', '', 'Presencial y Zoom') + pill('mod', 'Presencial', 'Presencial') + pill('mod', 'Zoom', 'Zoom') + '<span class="tt-sep"></span>' + pairPills();
    $$('#lPills [data-k]').forEach(function (b) { b.onclick = function () { LF[b.dataset.k] = b.dataset.v; renderLista(); }; });
    $$('#lPills [data-pp]').forEach(function (b) { b.onclick = function () { F.par = b.dataset.pp; renderLista(); }; });
    var dn = L.filter(function (a) { return by[a._id]; }).length;
    $('#lBar').style.width = (L.length ? 100 * dn / L.length : 0) + '%'; $('#lCnt').textContent = dn + ' de ' + L.length + ' marcados';
    $('#ttRoll').innerHTML = L.map(function (a) {
      var x = by[a._id] || {}, e = x.estado || '', on = e === 'P' || e === 'Z';
      return '<div class="tt-tile ' + e + '" role="button" tabindex="0" data-id="' + esc(a._id) + '">' + av(a.title) + '<b>' + esc(a.title) + '</b><span class="st">' + STN[e] + '</span><span class="tg"><button type="button" data-k="tarde" title="Llegó tarde"' + (x.tarde ? ' class="on"' : '') + (on ? '' : ' disabled') + '>⏰ Llegó tarde</button><button type="button" data-k="mesa" title="Se quedó al tiempo de mesa"' + (x.mesa ? ' class="on"' : '') + (on ? '' : ' disabled') + '>🍽️ Se quedó a la mesa</button></span></div>';
    }).join('') || '<p class="tt-empty">No hay alumnos para esta clase con estos filtros.</p>';
    $$('#ttRoll .tt-tile').forEach(function (t) {
      var id = t.dataset.id, cur = function () { return by[id] || {}; };
      var put = function (o) {
        var x = Object.assign({ estado: cur().estado || '', tarde: !!cur().tarde, mesa: !!cur().mesa }, o);
        if (x.estado !== 'P' && x.estado !== 'Z') { x.tarde = false; x.mesa = false; }
        by[id] = Object.assign({}, cur(), x); paint(t, by[id]);
        send({ op: 'asis', alumnoId: id, fecha: f, estado: x.estado, tarde: x.tarde, mesa: x.mesa }, id + '|' + f, 'asistencia').then(function () { var d2 = L.filter(function (a) { return by[a._id] && by[a._id].estado; }).length; $('#lBar').style.width = (100 * d2 / L.length) + '%'; $('#lCnt').textContent = d2 + ' de ' + L.length + ' marcados'; }).catch(renderLista);
      };
      var a = IX.alu[id];
      var next = function () { var e = cur().estado || ''; var n = CYC[(CYC.indexOf(e) + 1) % CYC.length]; if (n === 'P' && a && a.modalidad === 'Zoom') n = 'Z'; else if (n === 'Z' && a && a.modalidad === 'Zoom' && e === 'Z') n = 'A'; put({ estado: n }); };
      if (!ME.lista) { $$('.tg button', t).forEach(function (b) { b.disabled = true; }); return; }
      t.onclick = function (ev) { if (ev.target.closest('.tg')) return; next(); };
      t.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); next(); } };
      $$('.tg button', t).forEach(function (b) { b.onclick = function () { var o = {}; o[b.dataset.k] = !cur()[b.dataset.k]; put(o); }; });
    });
  }
  function paint(t, x) { t.className = 'tt-tile pop ' + (x.estado || ''); $('.st', t).textContent = STN[x.estado || '']; var on = x.estado === 'P' || x.estado === 'Z'; $$('.tg button', t).forEach(function (b) { b.disabled = !on; b.classList.toggle('on', !!x[b.dataset.k]); }); }
  $('#lAll').onclick = function () {
    var f = $('#lDate').value, by = {}; D.asistencia.forEach(function (x) { if (x.fecha === f) by[x.alumnoId] = x; });
    var L = listaAl().filter(function (a) { return !by[a._id]; });
    if (!L.length) { toast('Todos tienen un estado marcado.'); return; }
    Promise.all(L.map(function (a) { return send({ op: 'asis', alumnoId: a._id, fecha: f, estado: a.modalidad === 'Zoom' ? 'Z' : 'P', tarde: false, mesa: false }, a._id + '|' + f, 'asistencia'); })).then(function () { renderLista(); toast('Marcados ' + L.length + ' presentes. Ajustá a los que faltaron.'); });
  };

  /* Tiempo de mesa */
  var MESA_SEL = {};
  function renderMesa() {
    var f = $('#mesaF');
    if (!f.fecha.value) { var ex = (D.eventos || []).filter(function (e) { return e.mesa && iso(evDate(e)) <= iso(TODAY); }).pop(); f.fecha.value = ex ? iso(evDate(ex)) : iso(lastClass()); f.tutor.value = ME.title || ''; }
    var pg = f.programa.value, L = activos().filter(function (a) { return pg === 'General' || progs(a).indexOf(pg) >= 0; }).sort(function (x, y) { return (x.title || '').localeCompare(y.title || ''); });
    $('#mesaAl').innerHTML = L.map(function (a) { return '<button type="button" class="tt-face' + (MESA_SEL[a._id] ? ' on' : '') + '" data-id="' + esc(a._id) + '" aria-pressed="' + !!MESA_SEL[a._id] + '">' + av(a.title) + '<span>' + esc((a.title || '').split(' ')[0]) + '</span></button>'; }).join('');
    $('#mesaN').textContent = '· ' + Object.keys(MESA_SEL).length;
    $$('#mesaAl .tt-face').forEach(function (b) { b.onclick = function () { var id = b.dataset.id; if (MESA_SEL[id]) delete MESA_SEL[id]; else MESA_SEL[id] = 1; b.classList.toggle('on', !!MESA_SEL[id]); b.setAttribute('aria-pressed', !!MESA_SEL[id]); $('#mesaN').textContent = '· ' + Object.keys(MESA_SEL).length; }; });
    var M = (D.mesa || []).slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
    $('#mesaLog').innerHTML = M.length ? M.map(function (m) { var as = (m.asistentes || '').split(',').filter(Boolean); return '<div class="tt-li"><b>' + flarga(m.fecha) + ' · ' + esc(m.programa || '') + '</b><small>Coordinó ' + esc(m.tutor || '') + ' · ' + as.length + ' personas</small><div class="tt-faces" style="gap:0">' + as.slice(0, 12).map(function (i) { return av((IX.alu[i] || {}).title || i, '', 'sm'); }).join('') + '</div>' + (m.temas ? '<span><b>Se charló:</b> ' + esc(m.temas) + '</span>' : '') + (m.observaciones ? '<span><b>Notó:</b> ' + esc(m.observaciones) + '</span>' : '') + '</div>'; }).join('') : '<p class="tt-empty">Cuando registres el primer tiempo de mesa, va a aparecer acá.</p>';
  }
  $('#mesaF').programa.onchange = renderMesa;
  $('#mesaF').onsubmit = function (e) {
    e.preventDefault(); var f = e.target, ids = Object.keys(MESA_SEL);
    send({ op: 'mesa', fecha: f.fecha.value, programa: f.programa.value, tutor: f.tutor.value, asistentes: ids.join(','), temas: f.temas.value, observaciones: f.observaciones.value }, null, 'mesa').then(function () {
      ids.forEach(function (id) { var x = D.asistencia.filter(function (z) { return z.alumnoId === id && z.fecha === f.fecha.value; })[0]; if (x && x.estado !== 'A' && !x.mesa) send({ op: 'asis', alumnoId: id, fecha: x.fecha, estado: x.estado, tarde: !!x.tarde, mesa: true }, id + '|' + x.fecha, 'asistencia'); });
      f.temas.value = ''; f.observaciones.value = ''; MESA_SEL = {}; toast('Tiempo de mesa guardado. ¡Gracias!'); renderMesa();
    });
  };

  /* Calendario */
  var CM = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  function evDate(e) { return new Date(e.inicio && e.inicio.$date || e.inicio); }
  function renderCal() {
    $('#calTit').textContent = MESES[CM.getMonth()][0].toUpperCase() + MESES[CM.getMonth()].slice(1) + ' ' + CM.getFullYear();
    var st = monday(CM), h = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(function (d) { return '<div class="tt-dow">' + d + '</div>'; }).join('');
    for (var i = 0; i < 42; i++) {
      var d = addD(st, i), f = iso(d); if (i >= 35 && d.getMonth() !== CM.getMonth()) break;
      var E = (D.eventos || []).filter(function (e) { return iso(evDate(e)) === f; }).sort(function (a, b) { return evDate(a) - evDate(b); });
      var vt = (D.turnos || []).filter(function (x) { return x.fecha === f; }).length;
      var CL = (D.clases || []).filter(function (c) { return c.fecha === f; });
      h += '<div class="tt-day' + (d.getMonth() !== CM.getMonth() ? ' out' : '') + (f === iso(TODAY) ? ' today' : '') + '" data-f="' + f + '" role="button" tabindex="0"><b>' + d.getDate() + '</b>' + E.map(function (e) { return '<button type="button" class="tt-ev ' + esc(String(e.tipo || '').split(' ')[0]) + '" data-e="' + esc(e._id) + '" title="' + esc(e.title) + '">' + (e.mesa ? '🍽️ ' : '') + esc(e.title) + '</button>';  }).join('') + CL.map(function (c) { return '<button type="button" class="tt-ev cl ' + esc(c.tipo) + '" data-cl="' + esc(c._id) + '" title="' + esc(c.programa + ': ' + c.title + (c.profe ? ' (' + c.profe + ')' : '')) + '">' + esc(c.programa.slice(0, 3)) + ' · ' + esc(c.tipo === 'Clase' ? (c.profe || c.title) : c.title) + '</button>'; }).join('') + (vt ? '<small class="tt-lbl" style="font-size:.66rem">🙌🏽 ' + vt + ' tareas</small>' : '') + '</div>';
    }
    $('#calGrid').innerHTML = h;
    $$('#calGrid .tt-day').forEach(function (c) { c.onclick = function (ev) { var cl = ev.target.closest('[data-cl]'); if (cl) { claseModal((D.clases || []).filter(function (x) { return x._id === cl.dataset.cl; })[0]); return; } var b = ev.target.closest('[data-e]'); if (b) evModal(D.eventos.filter(function (x) { return x._id === b.dataset.e; })[0]); else evModal(null, c.dataset.f); }; c.onkeydown = function (ev) { if (ev.key === 'Enter') evModal(null, c.dataset.f); }; });
  }
  function dtl(d) { return iso(d) + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function modal(html, onOpen) { var m = document.createElement('div'); m.className = 'tt-modal'; m.innerHTML = '<div class="tt-card">' + html + '</div>'; document.body.appendChild(m); var close = function () { m.remove(); }; m.onclick = function (e) { if (e.target === m || e.target.closest('[data-close]')) close(); }; onOpen(m, close); var f = m.querySelector('input,select,textarea'); if (f) f.focus(); return m; }
  function evModal(e, fecha) {
    var d = e ? evDate(e) : pd(fecha), dow = d.getDay();
    if (!e) d.setHours(dow === 6 ? 10 : 19, dow === 6 ? 0 : 30);
    var tipos = ['Clase', 'Examen', 'Clase en vivo', 'Encuentro', 'Aviso', 'Feriado'];
    modal('<form class="tt-form"><h2 class="w">' + (e ? 'Editar' : 'Nuevo en el ' + flarga(fecha)) + '</h2><label class="w">Título<input name="title" required value="' + esc(e ? e.title : '') + '" placeholder="Ej.: Examen Bloque 3"></label><label>Tipo<select name="tipo">' + tipos.map(function (t) { return '<option' + (e && e.tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label><label>Carrera<select name="curso"><option value="">Todas</option>' + ['Maranata', 'Liderazgo', 'Adoración'].map(function (c) { return '<option' + (e && e.curso === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label><label>Empieza<input type="datetime-local" name="inicio" required value="' + dtl(d) + '"></label><label>Lugar<input name="lugar" value="' + esc(e ? e.lugar : '') + '" placeholder="Sede, Zoom…"></label><label class="w">Detalle<textarea name="descripcion">' + esc(e ? e.descripcion : '') + '</textarea></label><label class="w">Link<input name="link" value="' + esc(e ? e.link : '') + '" placeholder="https://"></label><label class="w tt-inl"><input type="checkbox" name="mesa"' + (e && e.mesa ? ' checked' : '') + '> Tiempo de mesa después</label><div class="w tt-wa"><button class="tt-btn" type="submit">' + (e ? 'Guardar cambios' : 'Agregar al calendario') + '</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (e ? '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar</button>' : '') + '</div></form>', function (m, close) {
      var f = $('form', m); f.tipo.onchange = function () { if (f.tipo.value === 'Examen') f.mesa.checked = true; };
      f.onsubmit = function (ev) { ev.preventDefault(); send({ op: 'evento', id: e ? e._id : '', title: f.title.value, tipo: f.tipo.value, curso: f.curso.value, inicio: new Date(f.inicio.value).toISOString(), descripcion: f.descripcion.value, lugar: f.lugar.value, link: f.link.value, mesa: f.mesa.checked }, e && e._id, 'eventos').then(function () { close(); toast(e ? 'Cambios guardados.' : 'Agregado al calendario.'); renderCal(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { if (!del.dataset.ok) { del.dataset.ok = 1; del.textContent = '¿Borrar de verdad?'; return; } send({ op: 'evento', borrar: true, id: e._id }, e._id, 'eventos').then(function () { close(); renderCal(); }); };
    });
  }
  $('#calPrev').onclick = function () { CM.setMonth(CM.getMonth() - 1); renderCal(); };
  $('#calNext').onclick = function () { CM.setMonth(CM.getMonth() + 1); renderCal(); };

  /* Clases y profes */
  var CP = 'Maranata', CPROF = '', CVIEJ = false;
  function renderClases() {
    var P = ['Maranata', 'Liderazgo', 'Adoración'], L = (D.clases || []).filter(function (c) { return c.programa === CP; }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    $('#cProg').innerHTML = P.map(function (p) { return '<button class="tt-pill' + (CP === p ? ' on' : '') + '" data-p="' + p + '">' + p + '</button>'; }).join('');
    $$('#cProg [data-p]').forEach(function (b) { b.onclick = function () { CP = b.dataset.p; CPROF = ''; CVIEJ = false; renderClases(); }; });
    var cnt = {}; L.forEach(function (c) { String(c.profe || '').split(/,| y | · /).map(function (x) { return x.replace(/\(.*\)/, '').trim(); }).filter(Boolean).forEach(function (p) { cnt[p] = (cnt[p] || 0) + 1; }); });
    $('#cProfes').innerHTML = '<button class="tt-pill' + (!CPROF ? ' on' : '') + '" data-pr="">Todos los profes</button>' + Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).map(function (p) { return '<button class="tt-pill' + (CPROF === p ? ' on' : '') + '" data-pr="' + esc(p) + '">' + av(p, '', 'xs') + esc(p) + ' · ' + cnt[p] + '</button>'; }).join('');
    $$('#cProfes [data-pr]').forEach(function (b) { b.onclick = function () { CPROF = b.dataset.pr; renderClases(); }; });
    if (CPROF) L = L.filter(function (c) { return String(c.profe || '').indexOf(CPROF) >= 0; });
    var hoy = iso(TODAY), next = L.filter(function (c) { return c.fecha >= hoy; })[0], grp = {}, ord = [];
    L.forEach(function (c) { var k = c.bloque || MESES[pd(c.fecha).getMonth()][0].toUpperCase() + MESES[pd(c.fecha).getMonth()].slice(1); if (!grp[k]) { grp[k] = []; ord.push(k); } grp[k].push(c); });
    var IC = { Clase: '📖', Examen: '📝', Intro: '✨', Receso: '☕' };
    var nPast = ord.filter(function (k) { return grp[k].every(function (c) { return c.fecha < hoy; }); }).length;
    $('#cList').innerHTML = (nPast && !CVIEJ ? '<button type="button" class="tt-btn s cl-old" id="cOld">Ver ' + nPast + (nPast === 1 ? ' tramo que ya pasó' : ' tramos que ya pasaron') + '</button>' : '') + (ord.length ? ord.filter(function (k) { return CVIEJ || !grp[k].every(function (c) { return c.fecha < hoy; }); }).map(function (k) { return '<div class="tt-card cl-g"><h3>' + esc(k) + '</h3>' + grp[k].map(function (c) { var d = pd(c.fecha); return '<button type="button" class="cl-r' + (c.fecha < hoy ? ' past' : '') + (next && c._id === next._id ? ' next' : '') + '" data-cl="' + esc(c._id) + '"><span class="cl-d"><b>' + d.getDate() + '</b><small>' + MC[d.getMonth()] + '</small></span><span class="cl-t"><b>' + IC[c.tipo || 'Clase'] + ' ' + esc(c.title) + '</b>' + (c.profe ? '<small>' + esc(c.profe) + '</small>' : '') + (c.nota ? '<small>' + esc(c.nota) + '</small>' : '') + '</span>' + (next && c._id === next._id ? '<span class="tt-ch">Próxima</span>' : '') + (c.profe ? '<span class="cl-av">' + String(c.profe).split(/,| y | · /).slice(0, 3).map(function (p) { return av(p.replace(/\(.*\)/, '').trim(), '', 'sm'); }).join('') + '</span>' : '') + '</button>'; }).join('') + '</div>'; }).join('') : '<p class="tt-empty">No hay clases cargadas.</p>');
    if ($('#cOld')) $('#cOld').onclick = function () { CVIEJ = true; renderClases(); };
    $$('#cList [data-cl]').forEach(function (b) { b.onclick = function () { claseModal((D.clases || []).filter(function (x) { return x._id === b.dataset.cl; })[0]); }; });
    var PL = (D.plan || []).filter(function (p) { return p.programa === CP; }).sort(function (a, b) { return a.orden - b.orden; }), sem = {}, so = [];
    PL.forEach(function (p) { if (!sem[p.semestre]) { sem[p.semestre] = []; so.push(p.semestre); } sem[p.semestre].push(p); });
    $('#cPlan').innerHTML = CP === 'Maranata' ? '<p class="tt-tip">Maranata se organiza por módulos dentro del calendario de arriba.</p>' : so.map(function (k) { return '<details class="tt-card cl-s"' + (k.indexOf(String(TODAY.getFullYear())) >= 0 ? ' open' : '') + '><summary>' + esc(k) + '</summary>' + sem[k].map(function (p) { return '<button type="button" class="cl-b" data-pl="' + esc(p._id) + '"><b>' + esc(p.title) + '</b><span>' + String(p.temas || '').split('/').map(function (t) { return '<i>' + esc(t.trim()) + '</i>'; }).join('') + '</span></button>'; }).join('') + '</details>'; }).join('');
    $$('#cPlan [data-pl]').forEach(function (b) { b.onclick = function () { planModal((D.plan || []).filter(function (x) { return x._id === b.dataset.pl; })[0]); }; });
  }
  function claseModal(c) {
    c = c || { programa: CP, tipo: 'Clase', fecha: iso(TODAY) };
    var bl = {}; (D.clases || []).forEach(function (x) { if (x.programa === c.programa && x.bloque) bl[x.bloque] = 1; });
    modal('<form class="tt-form"><h2 class="w">' + (c._id ? 'Editar clase' : 'Nueva clase') + '</h2><label>Fecha<input type="date" name="fecha" required value="' + esc(c.fecha) + '"></label><label>Carrera<select name="programa">' + ['Maranata', 'Liderazgo', 'Adoración'].map(function (p) { return '<option' + (c.programa === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label><label class="w">Tema<input name="title" required value="' + esc(c.title || '') + '"></label><label>Profe<input name="profe" list="profesL" value="' + esc(c.profe || '') + '"><datalist id="profesL">' + Object.keys((D.clases || []).reduce(function (o, x) { if (x.profe) o[x.profe] = 1; return o; }, {})).sort().map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</datalist></label><label>Tipo<select name="tipo">' + ['Clase', 'Examen', 'Intro', 'Receso'].map(function (t) { return '<option' + (c.tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label><label class="w">Bloque<input name="bloque" list="bloquesL" value="' + esc(c.bloque || '') + '"><datalist id="bloquesL">' + Object.keys(bl).map(function (b) { return '<option>' + esc(b) + '</option>'; }).join('') + '</datalist></label><label class="w">Nota<input name="nota" value="' + esc(c.nota || '') + '" placeholder="Ej.: preparar material, a confirmar…"></label><div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (c._id ? '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar</button>' : '') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'clase', id: c._id || '', fecha: f.fecha.value, programa: f.programa.value, title: f.title.value, profe: f.profe.value, tipo: f.tipo.value, bloque: f.bloque.value, nota: f.nota.value }, c._id, 'clases').then(function () { close(); toast('Clase guardada.'); refresh(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { if (!del.dataset.ok) { del.dataset.ok = 1; del.textContent = '¿Borrar de verdad?'; return; } send({ op: 'clase', borrar: true, id: c._id }, c._id, 'clases').then(function () { close(); refresh(); }); };
    });
  }
  function planModal(p) {
    p = p || { programa: CP };
    modal('<form class="tt-form"><h2 class="w">Bloque del plan</h2><label class="w">Semestre<input name="semestre" value="' + esc(p.semestre || '') + '"></label><label class="w">Bloque<input name="title" required value="' + esc(p.title || '') + '"></label><label class="w">Temas (separados por /)<textarea name="temas">' + esc(p.temas || '') + '</textarea></label><div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'plan', id: p._id || '', programa: p.programa, orden: p.orden, semestre: f.semestre.value, title: f.title.value, temas: f.temas.value }, p._id, 'plan').then(function () { close(); toast('Plan actualizado.'); renderClases(); }); };
    });
  }
  $('#cAdd').onclick = function () { claseModal(null); };

  /* Voluntarios */
  var TAREAS = [['Limpieza y sillas', '🧹'], ['Audio', '🎚️'], ['Diapositivas', '🖥️'], ['Zoom', '🎥'], ['Asistencia presencial', '📋'], ['Asistencia online', '💻']];
  var VW = monday(TODAY), SEL = null;
  function vols() { return (D.voluntarios || []).filter(function (v) { return v.activo !== false; }); }
  function renderVol() {
    var dias = [2, 3, 5].map(function (n) { return iso(addD(VW, n)); }), T = D.turnos || [], nm = {};
    (D.voluntarios || []).forEach(function (v) { nm[v._id] = v.title; });
    $('#volTit').textContent = 'Semana del ' + fcorta(iso(VW));
    var semana = {}; T.forEach(function (x) { if (dias.indexOf(x.fecha) >= 0) semana[x.voluntarioId] = (semana[x.voluntarioId] || 0) + 1; });
    $('#volRoster').innerHTML = vols().map(function (v) { return '<button type="button" class="tt-vp' + (SEL === v._id ? ' sel' : '') + '" draggable="true" data-v="' + esc(v._id) + '">' + av(v.title, '', 'sm') + '<span><span class="n">' + esc(v.title) + '</span><small>' + (semana[v._id] ? semana[v._id] + ' tareas esta semana' : 'Libre esta semana') + (v.email ? '' : ' · sin email') + '</small></span></button>'; }).join('');
    $('#volGrid').innerHTML = dias.map(function (f) {
      var d = pd(f), sab = d.getDay() === 6;
      return '<div class="tt-col"><h3>' + DL[d.getDay()][0].toUpperCase() + DL[d.getDay()].slice(1) + ' ' + d.getDate() + '<small>Llegada ' + (sab ? '9:30 · clase 10:00' : '19:00 · clase 19:30') + '</small></h3>' + TAREAS.map(function (t) {
        var who = T.filter(function (x) { return x.fecha === f && x.tarea === t[0]; });
        return '<div class="tt-slot' + (who.length ? '' : ' empty') + (SEL ? ' can' : '') + '" data-f="' + f + '" data-t="' + esc(t[0]) + '"><span>' + t[1] + ' ' + t[0] + '</span><div class="who">' + who.map(function (x) { return '<button type="button" class="tt-chip" data-vx="' + esc(x._id) + '" data-v="' + esc(x.voluntarioId) + '" title="Quitar">' + av(nm[x.voluntarioId] || x.voluntarioId) + esc(String(nm[x.voluntarioId] || x.voluntarioId).split(' ')[0]) + ' ✕</button>'; }).join('') + '</div></div>';
      }).join('') + '</div>';
    }).join('');
    // cobertura del mes
    var m0 = iso(VW).slice(0, 7), fechas = [], d0 = pd(m0 + '-01');
    for (var d = new Date(d0); d.getMonth() === d0.getMonth(); d = addD(d, 1)) if ([3, 4, 6].indexOf(d.getDay()) >= 0) fechas.push(iso(d));
    var cub = 0; fechas.forEach(function (f) { TAREAS.forEach(function (t) { if (T.some(function (x) { return x.fecha === f && x.tarea === t[0]; })) cub++; }); });
    var cnt = {}; T.forEach(function (x) { if (x.fecha.slice(0, 7) === m0) cnt[x.voluntarioId] = (cnt[x.voluntarioId] || 0) + 1; });
    var tot = fechas.length * TAREAS.length;
    $('#volMonth').innerHTML = '<h2 class="tt-h">' + mesTxt(m0)[0].toUpperCase() + mesTxt(m0).slice(1) + ': ' + cub + ' de ' + tot + ' tareas cubiertas</h2><div class="tt-prog" style="margin-top:4px"><i style="width:' + (tot ? 100 * cub / tot : 0) + '%"></i></div>' + vols().filter(function (v) { return cnt[v._id]; }).sort(function (a, b) { return cnt[b._id] - cnt[a._id]; }).map(function (v) { return '<div class="tt-cbar">' + av(v.title, '', 'sm') + '<span style="width:140px">' + esc(v.title) + '</span><span class="tt-mini"><i style="width:' + Math.min(100, 100 * cnt[v._id] / 20) + '%"></i></span><span>' + cnt[v._id] + '</span></div>'; }).join('');
    var assign = function (f, t, v) { if ((D.turnos || []).some(function (x) { return x.fecha === f && x.tarea === t && x.voluntarioId === v; })) return; send({ op: 'turno', fecha: f, tarea: t, voluntarioId: v }, null, 'turnos').then(function () { toast((nm[v] || '').split(' ')[0] + ' sirve en ' + t.toLowerCase() + ' el ' + flarga(f) + '.'); renderVol(); }); };
    $$('#volRoster .tt-vp').forEach(function (b) {
      b.ondragstart = function (e) { e.dataTransfer.setData('text/plain', b.dataset.v); e.dataTransfer.effectAllowed = 'copy'; };
      b.onclick = function () { SEL = SEL === b.dataset.v ? null : b.dataset.v; renderVol(); if (SEL) toast('Ahora tocá la tarea donde va a servir.'); };
      b.ondblclick = function () { volModal((D.voluntarios || []).filter(function (x) { return x._id === b.dataset.v; })[0]); };
    });
    $$('#volGrid .tt-slot').forEach(function (s) {
      s.ondragover = function (e) { e.preventDefault(); s.classList.add('over'); };
      s.ondragleave = function () { s.classList.remove('over'); };
      s.ondrop = function (e) { e.preventDefault(); s.classList.remove('over'); var v = e.dataTransfer.getData('text/plain'); if (v) assign(s.dataset.f, s.dataset.t, v); };
      s.onclick = function (e) { if (e.target.closest('.tt-chip')) return; if (SEL) { assign(s.dataset.f, s.dataset.t, SEL); } else toast('Elegí primero a alguien del equipo.'); };
    });
    $$('#volGrid .tt-chip').forEach(function (b) { b.onclick = function () { var s = b.closest('.tt-slot'); send({ op: 'turno', borrar: true, fecha: s.dataset.f, tarea: s.dataset.t, voluntarioId: b.dataset.v }, b.dataset.vx, 'turnos').then(renderVol); }; });
    renderEsp();
  }
  function volModal(v) {
    v = v || {};
    modal('<form class="tt-form"><div class="w tt-fh">' + av(v.title || '?', '', 'lg') + '<div><h2>' + (v._id ? esc(v.title) : 'Sumar voluntario') + '</h2><p>Con su email le llegan los avisos de cada servicio.</p></div></div><label>Nombre<input name="title" required value="' + esc(v.title || '') + '"></label><label>Email<input name="email" type="email" value="' + esc(v.email || '') + '"></label><label>WhatsApp<input name="telefono" value="' + esc(v.telefono || '') + '"></label><label>Disponibilidad<input name="disponibilidad" value="' + esc(v.disponibilidad || '') + '"></label>' + (v.clave ? '<p class="tt-tip w">Calendario con avisos para su teléfono: <a href="https://www.habitat-cfm.org/api/voluntario.ics?v=' + esc(v._id) + '&amp;k=' + esc(v.clave) + '">copiar link</a> (también lo puede sumar desde «Mi servicio» en el Campus).</p>' : '') + '<div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'vol', id: v._id || '', title: f.title.value, email: f.email.value, telefono: f.telefono.value, disponibilidad: f.disponibilidad.value }, v._id, 'voluntarios').then(function () { close(); toast('Guardado.'); renderVol(); }); };
    });
  }
  /* Fechas especiales: Zarza, tiempo de mesa por Zoom y Selah */
  var ESP = { zarza: { t: 'Zarza', e: '🎶', slots: [['Zarza', 'Músicos']] }, mesa: { t: 'Tiempo de mesa por Zoom', e: '🍽️', slots: [['Tiempo de mesa · Maranata', 'Maranata'], ['Tiempo de mesa · Liderazgo', 'Liderazgo'], ['Tiempo de mesa · Adoración', 'Adoración']] }, selah: { t: 'Selah', e: '📖', slots: [['Selah · Encargado', 'Encargado'], ['Selah', 'Voluntarios']] } };
  function renderEsp() {
    var hoy = iso(TODAY), E = (D.eventos_servicio || []).filter(function (e) { return e.fecha >= hoy; }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }), T = D.turnos || [], nm = {};
    (D.voluntarios || []).forEach(function (v) { nm[v._id] = v.title; });
    $('#espList').innerHTML = E.map(function (e) {
      var X = ESP[e.tipo] || ESP.zarza;
      return '<div class="tt-espc" data-id="' + esc(e._id) + '"><div class="tt-esph"><em>' + X.e + '</em><div><h3>' + esc(e.title || X.t) + '</h3><small>' + esc(flarga(e.fecha)) + (e.hora ? ' · ' + esc(e.hora) : ' · horario a confirmar') + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</small></div><button class="tt-btn s" type="button" data-ed>Editar</button></div>' +
        X.slots.map(function (sl) { var who = T.filter(function (x) { return x.fecha === e.fecha && x.tarea === sl[0]; }); return '<div class="tt-slot' + (who.length ? '' : ' empty') + (SEL ? ' can' : '') + '" data-f="' + e.fecha + '" data-t="' + esc(sl[0]) + '"><span>' + esc(sl[1]) + '</span><div class="who">' + who.map(function (x) { return '<button type="button" class="tt-chip" data-vx="' + esc(x._id) + '" data-v="' + esc(x.voluntarioId) + '" title="Quitar">' + av(nm[x.voluntarioId] || x.voluntarioId) + esc(String(nm[x.voluntarioId] || x.voluntarioId).split(' ')[0]) + (x.nota ? ' · ' + esc(x.nota) : '') + ' ✕</button>'; }).join('') + '</div></div>'; }).join('') +
        (e.tipo === 'selah' ? '<label class="tt-lbl">Versículos para los voluntarios<textarea data-vs placeholder="Los carga el encargado desde Mi servicio, o acá.">' + esc(e.versiculos || '') + '</textarea></label><button class="tt-btn s" type="button" data-vsok>Guardar versículos</button>' : '') + '</div>';
    }).join('') || '<p class="tt-empty">No hay fechas especiales cargadas. Sumá la próxima Zarza, un tiempo de mesa por Zoom o un Selah.</p>';
    $$('#espList .tt-espc').forEach(function (c) {
      var e = (D.eventos_servicio || []).filter(function (x) { return x._id === c.dataset.id; })[0];
      $('[data-ed]', c).onclick = function () { espModal(e); };
      var vb = $('[data-vsok]', c); if (vb) vb.onclick = function () { send(Object.assign({}, e, { op: 'vevento', versiculos: $('[data-vs]', c).value }), e._id, 'eventos_servicio').then(function () { toast('Versículos guardados. Les llegan a los voluntarios de Selah.'); }); };
    });
    $$('#espList .tt-slot').forEach(function (s) {
      s.ondragover = function (ev) { ev.preventDefault(); s.classList.add('over'); };
      s.ondragleave = function () { s.classList.remove('over'); };
      var go = function (v) { if (!v) return; var t = s.dataset.t, f = s.dataset.f; if ((D.turnos || []).some(function (x) { return x.fecha === f && x.tarea === t && x.voluntarioId === v; })) return; var fin = function (nota) { send({ op: 'turno', fecha: f, tarea: t, voluntarioId: v, nota: nota || '' }, null, 'turnos').then(function () { toast((nm[v] || '').split(' ')[0] + ' quedó en ' + t + '.'); renderEsp(); renderVol(); }); }; if (t === 'Zarza') modal('<form class="tt-form"><h2 class="w">' + esc(nm[v] || '') + ' en Zarza</h2><label class="w">¿Qué hace?<input name="n" list="instL" placeholder="Voz, guitarra, teclado…"><datalist id="instL"><option>Voz</option><option>Guitarra</option><option>Teclado</option><option>Bajo</option><option>Batería</option><option>Violín</option></datalist></label><div class="w tt-wa"><button class="tt-btn" type="submit">Sumar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) { $('form', m).onsubmit = function (ev) { ev.preventDefault(); close(); fin($('[name=n]', m).value); }; }); else fin(''); };
      s.ondrop = function (ev) { ev.preventDefault(); s.classList.remove('over'); go(ev.dataTransfer.getData('text/plain')); };
      s.onclick = function (ev) { if (ev.target.closest('.tt-chip')) return; if (SEL) go(SEL); else toast('Elegí primero a alguien del equipo.'); };
    });
    $$('#espList .tt-chip').forEach(function (b) { b.onclick = function () { var s = b.closest('.tt-slot'); send({ op: 'turno', borrar: true, fecha: s.dataset.f, tarea: s.dataset.t, voluntarioId: b.dataset.v }, b.dataset.vx, 'turnos').then(function () { renderEsp(); }); }; });
  }
  function espModal(e) {
    e = e || { tipo: 'zarza', fecha: iso(TODAY) };
    modal('<form class="tt-form"><h2 class="w">' + (e._id ? 'Editar fecha' : 'Nueva fecha especial') + '</h2><label>Qué es<select name="tipo"' + (e._id ? ' disabled' : '') + '>' + Object.keys(ESP).map(function (k) { return '<option value="' + k + '"' + (e.tipo === k ? ' selected' : '') + '>' + ESP[k].t + '</option>'; }).join('') + '</select></label><label>Fecha<input type="date" name="fecha" required value="' + esc(e.fecha) + '"' + (e._id ? ' disabled' : '') + '></label><label>Hora<input type="time" name="hora" value="' + esc(e.hora || '') + '"></label><label>Lugar<input name="lugar" value="' + esc(e.lugar || '') + '" placeholder="Sede, Zoom…"></label><label class="w">Link (Zoom u otro)<input name="link" value="' + esc(e.link || '') + '" placeholder="https://"></label><label class="w">Nota para los voluntarios<input name="nota" value="' + esc(e.nota || '') + '"></label><div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (e._id ? '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar fecha</button>' : '') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (ev) { ev.preventDefault(); var tipo = e._id ? e.tipo : f.tipo.value, fe = e._id ? e.fecha : f.fecha.value; send({ op: 'vevento', tipo: tipo, fecha: fe, title: e.title || '', hora: f.hora.value, lugar: f.lugar.value, link: f.link.value, nota: f.nota.value, versiculos: e.versiculos || '' }, null, 'eventos_servicio').then(function () { close(); toast('Fecha guardada.'); renderEsp(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { if (!del.dataset.ok) { del.dataset.ok = 1; del.textContent = '¿Borrar con sus turnos?'; return; } send({ op: 'vevento', borrar: true, tipo: e.tipo, fecha: e.fecha }, e._id, 'eventos_servicio').then(function () { D.turnos = (D.turnos || []).filter(function (x) { return !(x.fecha === e.fecha && x.tarea.indexOf(ESP[e.tipo].slots[0][0].split(' ·')[0]) === 0); }); close(); renderEsp(); }); };
    });
  }
  $('#espAdd').onclick = function () { espModal(null); };
  $('#volAdd').onclick = function () { volModal(null); };
  $('#volPrev').onclick = function () { VW = addD(VW, -7); renderVol(); };
  $('#volNext').onclick = function () { VW = addD(VW, 7); renderVol(); };

  /* Equipo */
  function renderEquipo() {
    var R = { director: 'Director', tutor: 'Tutor', pagos: 'Tutor' };
    $('#ttTeam').innerHTML = D.tutores.map(function (t) { var pl = !!t.lista || t.rol === 'director', pp = !!t.pagos || t.rol === 'pagos'; return '<div class="tt-tm">' + av(t.title || t.email, '', 'sm') + '<span><b>' + esc(t.title || t.email) + '</b><br><small>' + esc((t.email || '') + (t.pareja ? ' · ' + t.pareja : '')) + '</small></span><span class="tt-ch">' + (R[t.rol] || 'Tutor') + '</span><label class="tt-perm"><input type="checkbox" data-pl="' + esc(t._id) + '"' + (pl ? ' checked' : '') + (t.rol === 'director' ? ' disabled' : '') + '> Pasa lista</label><label class="tt-perm"><input type="checkbox" data-pg="' + esc(t._id) + '"' + (pp ? ' checked' : '') + '> Marca pagos</label><label class="tt-perm"><input type="checkbox" data-po="' + esc(t._id) + '"' + (t.org ? ' checked' : '') + '> Organiza el servicio</label><label class="tt-perm"><input type="checkbox" data-pf="' + esc(t._id) + '"' + (t.gastos ? ' checked' : '') + '> Finanzas</label>' + (t._id !== ME._id ? '<button class="tt-btn s" data-del="' + esc(t._id) + '" data-em="' + esc(t.email || '') + '">Quitar acceso</button>' : '') + '</div>'; }).join('');
    var perm = function (id, k, v) { var t = D.tutores.filter(function (x) { return x._id === id; })[0]; var o = { op: 'tutor', id: t._id, title: t.title, email: t.email, pareja: t.pareja, rol: t.rol === 'director' ? 'director' : 'tutor', lista: !!t.lista, pagos: !!t.pagos || t.rol === 'pagos', org: !!t.org, gastos: !!t.gastos }; o[k] = v; send(o, t._id, 'tutores').then(function () { toast(v ? 'Permiso dado.' : 'Permiso quitado.'); renderEquipo(); }); };
    $$('#ttTeam [data-pl]').forEach(function (c) { c.onchange = function () { perm(c.dataset.pl, 'lista', c.checked); }; });
    $$('#ttTeam [data-pg]').forEach(function (c) { c.onchange = function () { perm(c.dataset.pg, 'pagos', c.checked); }; });
    $$('#ttTeam [data-po]').forEach(function (c) { c.onchange = function () { perm(c.dataset.po, 'org', c.checked); }; });
    $$('#ttTeam [data-pf]').forEach(function (c) { c.onchange = function () { perm(c.dataset.pf, 'gastos', c.checked); }; });
    $$('#ttTeam [data-del]').forEach(function (b) { b.onclick = function () { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = '¿Quitar?'; return; } send({ op: 'tutor', borrar: true, id: b.dataset.del, email: b.dataset.em }, b.dataset.del, 'tutores').then(renderEquipo); }; });
  }
  $('#tForm').onsubmit = function (e) { e.preventDefault(); var f = e.target; send({ op: 'tutor', title: f.title.value, email: f.email.value, pareja: f.pareja.value, rol: f.rol.value, lista: f.lista.checked, pagos: f.pagos.checked, org: f.org.checked, gastos: f.gastos.checked }, null, 'tutores').then(function () { f.reset(); renderEquipo(); toast('Listo, ya puede entrar al panel.'); }); };

  /* Ficha del alumno */
  var WA = {
    Faltas: 'Hola {n}! ¿Cómo estás? Te extrañamos en las últimas clases. ¿Está todo bien? Contanos si te podemos ayudar en algo 🙌🏽',
    'Exámenes': 'Hola {n}! ¿Cómo venís? Vimos que tenés exámenes pendientes. ¿Querés que te ayudemos a organizarte para rendirlos?',
    Grupo: 'Hola {n}! Hace un tiempito que no te leemos en el grupo y queríamos saber cómo estás. ¿Todo bien?',
    'Acompañamiento': 'Hola {n}! ¿Cómo estás? Pasaba a saludarte y a preguntarte cómo venís con la cursada.',
    Pagos: 'Hola {n}! ¿Cómo estás? Te escribo de Habitat porque nos figura pendiente la cuota de {m}. Cualquier cosa avisame y lo vemos juntos.'
  };
  function waLink(a, k) { var tel = String(a.telefono || '').replace(/\D/g, ''); if (!tel) return ''; if (tel.length === 10) tel = '549' + tel; else if (/^0/.test(tel)) tel = '549' + tel.replace(/^0/, ''); return 'https://wa.me/' + tel + '?text=' + encodeURIComponent(WA[k].replace('{n}', (a.title || '').split(' ')[0]).replace('{m}', mesTxt(CUR_M))); }
  var FT = 'seg';
  function ficha(id, keepTab) {
    var a = IX.alu[id]; if (!a) return; if (!keepTab) FT = 'seg';
    var st = estado(a), as = IX.asis[id] || [], pa = asisPct(as);
    var tot = progs(a).reduce(function (s, p) { return s + PROG[p].length; }, 0), done = progs(a).reduce(function (s, p) { return s + nEv(a, p); }, 0);
    var p = IX.pago[id] || {}, ms = []; for (var m = startM(a); m <= CUR_M && ms.length < 24; m = addM(m, 1)) ms.push(m);
    var paid = ms.filter(function (x) { return p[x]; }).length;
    var h = '<div class="tt-fh">' + av(a.title, st.lvl, 'lg') + '<div><h2 id="drName">' + esc(a.title) + '</h2><p>' + esc([a.carreras, a.modalidad, a.tutores ? 'tutores ' + a.tutores : '', a.ciudad].filter(Boolean).join(' · ')) + '</p></div></div><div class="tt-why">' + chips(st) + '</div>' +
      '<div class="tt-kpis"><div class="tt-kpi">' + (async_(a) ? ring(0, '—') + 'Cursa asincrónico' : ring(pa || 0, pa == null ? '—' : pa + '%') + 'Asistencia') + '</div><div class="tt-kpi">' + ring(tot ? 100 * done / tot : 0, done + '/' + tot, 'var(--gold)') + 'Exámenes y TP</div><div class="tt-kpi">' + (becado(a) ? ring(100, '🎓', '#4f6d8a') + 'Becado' : ring(ms.length ? 100 * paid / ms.length : 0, paid + '/' + ms.length, '#4f6d8a') + 'Meses pagos') + '</div></div>';
    var tabs = [['seg', 'Seguimiento'], ['asis', 'Asistencia'], ['ex', 'Exámenes'], ['pag', 'Pagos'], ['gr', 'Grupo'], ['dat', 'Datos']];
    h += '<div class="tt-ftabs">' + tabs.map(function (t) { return '<button data-ft="' + t[0] + '"' + (FT === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><div class="tt-fp" id="fp"></div>';
    $('#drBody').innerHTML = h; $('#ttDrawer').hidden = false; document.body.style.overflow = 'hidden';
    $$('[data-ft]').forEach(function (b) { b.onclick = function () { FT = b.dataset.ft; $$('[data-ft]').forEach(function (x) { x.classList.toggle('on', x === b); }); pane(a); }; });
    pane(a);
  }
  function pane(a) {
    var id = a._id, box = $('#fp'), pagos = !!ME.pagos;
    if (FT === 'seg') {
      var motivos = ['Faltas', 'Exámenes', 'Grupo', 'Acompañamiento'].concat(pagos ? ['Pagos'] : []), segs = IX.seg[id] || [];
      box.innerHTML = (a.telefono ? '<div class="tt-wa">' + motivos.map(function (k) { return '<a class="tt-btn wa" target="_blank" rel="noopener" data-m="' + k + '" href="' + esc(waLink(a, k)) + '">WhatsApp · ' + k + '</a>'; }).join('') + '</div><p class="tt-tip">Abre WhatsApp con un mensaje listo para revisar y mandar vos. Después anotalo acá abajo.</p>' : '<p class="tt-tip">Cargá su WhatsApp en «Datos» para escribirle desde acá con un mensaje ya armado.</p>') +
        '<form class="tt-card tt-form" id="segF"><label>Motivo<select name="motivo">' + motivos.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label><label>Fecha<input type="date" name="fecha" value="' + iso(TODAY) + '"></label><label class="w">Qué hablaron<textarea name="nota" placeholder="Ej.: le escribí por las faltas, está con mucho trabajo y vuelve el sábado."></textarea></label><label class="w tt-inl"><input type="checkbox" name="respondio"> Respondió</label><button class="tt-btn w" type="submit">Guardar contacto</button></form>' +
        '<div class="tt-tl">' + (segs.length ? segs.map(function (s) { return '<div><b>' + esc(s.motivo || 'Seguimiento') + ' · ' + fcorta(s.fecha) + '</b><span>' + esc(s.nota) + '</span><small>' + esc(s.tutor || '') + (s.respondio ? ' · respondió 🙌🏽' : '') + ' · <a href="#" data-sd="' + esc(s._id) + '">borrar</a></small></div>'; }).join('') : '<div><span>Sin contactos individuales todavía.</span></div>') + '</div>';
      var sf = $('#segF');
      $$('.tt-wa a', box).forEach(function (l) { l.addEventListener('click', function () { sf.motivo.value = l.dataset.m; sf.nota.focus(); }); });
      sf.onsubmit = function (e) { e.preventDefault(); send({ op: 'seg', alumnoId: id, motivo: sf.motivo.value, fecha: sf.fecha.value, nota: sf.nota.value, respondio: sf.respondio.checked }, null, 'seguimientos').then(function () { toast('Contacto guardado.'); ficha(id, 1); refresh(); }); };
      $$('[data-sd]', box).forEach(function (l) { l.onclick = function (e) { e.preventDefault(); if (!l.dataset.ok) { l.dataset.ok = 1; l.textContent = '¿seguro?'; return; } send({ op: 'seg-del', id: l.dataset.sd }, l.dataset.sd, 'seguimientos').then(function () { ficha(id, 1); refresh(); }); }; });
    }
    if (FT === 'asis') {
      var as = IX.asis[id] || [];
      box.innerHTML = async_(a) ? '<p class="tt-tip">Cursa en modalidad asincrónica: su avance se ve en el Campus.</p>' : '<p class="tt-tip">' + (as.length ? as.filter(function (x) { return x.estado !== 'A'; }).length + ' de ' + as.length + ' clases · llegó tarde ' + as.filter(function (x) { return x.tarde; }).length + ' veces · se quedó a la mesa ' + as.filter(function (x) { return x.mesa; }).length + ' veces' : 'Sin clases registradas.') + '</p><div class="tt-grid">' + as.map(function (x) { return '<button type="button" disabled class="' + (x.estado === 'A' ? 'no' : x.estado === 'J' ? '' : 'ok') + '">' + fcorta(x.fecha) + '<small>' + STN[x.estado] + (x.tarde ? ' · tarde' : '') + (x.mesa ? ' · mesa' : '') + '</small></button>'; }).join('') + '</div>';
    }
    if (FT === 'ex') {
      box.innerHTML = progs(a).map(function (pg) { var e = IX.ev[id] || {}, nn = IX.nota[id] || {}; return '<h3 class="tt-lbl">' + pg + '</h3><div class="tt-grid" data-pg="' + pg + '">' + PROG[pg].map(function (it) { var k = pg + '|' + it, x = nn[k]; return '<button type="button" data-it="' + it + '" class="' + (e[k] ? 'ok' : x ? 'no' : '') + '">' + it.replace('Módulo', 'Mód.').replace('Bloque', 'Bl.') + '<small>' + (x && x.nota != null ? 'nota ' + x.nota : e[k] ? 'hecho' : x ? 'recupera' : '—') + '</small></button>'; }).join('') + '</div>' + PROG[pg].filter(function (it) { return nn[pg + '|' + it] && nn[pg + '|' + it].archivo; }).map(function (it) { return '<a class="tt-file" target="_blank" rel="noopener" href="' + esc(nn[pg + '|' + it].archivo) + '">📄 Ver PDF del ' + it + '</a>'; }).join(' '); }).join('') + '<p class="tt-tip">Las notas de Tally llegan solas. En rojo: rindió con menos de 60 y vuelve a rendir. Tocá un casillero para marcarlo a mano.</p>';
      $$('[data-pg]', box).forEach(function (gr) { $$('button', gr).forEach(function (b) { b.onclick = function () { var pg = gr.dataset.pg, it = b.dataset.it; send({ op: 'eval', alumnoId: id, programa: pg, item: it, ok: !(IX.ev[id] || {})[pg + '|' + it] }).then(function (r) { D.evaluaciones = D.evaluaciones.filter(function (x) { return !(x.alumnoId === id && x.programa === pg && x.item === it); }); if (r.item) D.evaluaciones.push(r.item); index(); ficha(id, 1); refresh(); }); }; }); });
    }
    if (FT === 'pag') {
      if (becado(a)) { box.innerHTML = '<p class="tt-tip">Becado: no paga cuota.</p>'; return; }
      var p = IX.pago[id] || {}, ms = []; for (var m = startM(a); m <= addM(CUR_M, 1) && ms.length < 24; m = addM(m, 1)) ms.push(m);
      box.innerHTML = '<p class="tt-tip">' + esc(a.formaPago || 'Forma de pago sin cargar') + (a.matricula ? ' · matrícula paga' : '') + '</p><div class="tt-grid">' + ms.map(function (m) { var v = p[m], late = m < CUR_M || (m === CUR_M && TODAY.getDate() > 10); return '<button type="button" data-m="' + m + '" class="' + (v ? 'ok' : late ? 'no' : '') + '"' + (pagos ? '' : ' disabled') + '>' + MC[+m.slice(5) - 1] + '<small>' + (v ? 'pagó' : late ? 'pendiente' : '—') + '</small></button>'; }).join('') + '</div><p class="tt-tip">' + (pagos ? 'Tocá un mes para marcarlo como pagado o pendiente.' : 'Los pagos los marca Raquel.') + '</p>';
      $$('[data-m]', box).forEach(function (b) { b.onclick = function () { if (D.fin) { if (ME.gastos) location.href = '/finanzas.html#a-' + id; else toast('Los pagos los carga Raquel en Finanzas.'); return; } var m = b.dataset.m; send({ op: 'pago', alumnoId: id, mes: m, pagado: !(IX.pago[id] || {})[m] }, id + '|' + m, 'pagos').then(function () { ficha(id, 1); refresh(); }); }; });
    }
    if (FT === 'gr') {
      var g = IX.gr[id] || {}, wk = []; for (var k = 5; k >= 0; k--) wk.push(iso(addD(monday(TODAY), -7 * k)));
      var G = { '': ['—', 'Sin marcar'], activo: ['💬', 'Participa'], poco: ['🙂', 'Poco'], nada: ['🔇', 'No participa'] }, ORD = ['', 'activo', 'poco', 'nada'];
      box.innerHTML = '<p class="tt-tip">¿Cómo participó en el grupo de WhatsApp cada semana? Tocá para cambiar.</p><div class="tt-wk">' + wk.map(function (w) { var v = g[w] || ''; return '<button type="button" data-w="' + w + '" data-v="' + v + '"><em>' + G[v][0] + '</em>' + fcorta(w) + '<small>' + G[v][1] + '</small></button>'; }).join('') + '</div>';
      $$('[data-w]', box).forEach(function (b) { b.onclick = function () { var n = ORD[(ORD.indexOf(b.dataset.v) + 1) % ORD.length]; send({ op: 'grupo', alumnoId: id, semana: b.dataset.w, nivel: n }, id + '|' + b.dataset.w, 'grupo').then(function () { pane(a); refresh(); }); }; });
    }
    if (FT === 'dat') {
      box.innerHTML = '<form class="tt-card tt-form" id="aluF">' + aluFields(a, pagos) + '<button class="tt-btn w" type="submit">Guardar datos</button></form><div class="tt-card"><p class="tt-lbl">Kids &amp; Hero</p><p class="tt-tip">Muy pronto vas a ver acá sus horas de juego, nivel, insignias y los dones que va descubriendo.</p></div>';
      $('#aluF').onsubmit = function (e) { e.preventDefault(); saveAlu(e.target, id); };
    }
  }
  function aluFields(a, pagos) {
    var f = function (k, l, t, w) { return '<label' + (w ? ' class="w"' : '') + '>' + l + '<input name="' + k + '" type="' + (t || 'text') + '" value="' + esc(a[k] || '') + '"></label>'; };
    return f('title', 'Nombre', 'text', 1) + f('carreras', 'Carreras (ej. Maranata y Liderazgo)') +
      '<label>Modalidad<select name="modalidad">' + ['Presencial', 'Zoom', 'Asincrónico'].map(function (m) { return '<option' + (a.modalidad === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>' +
      '<label>Tutores<input name="tutores" list="parejasA" value="' + esc(a.tutores || '') + '"><datalist id="parejasA">' + parejas().map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</datalist></label>' +
      f('ciudad', 'Ciudad') + f('telefono', 'WhatsApp', 'tel') + f('email', 'Email', 'email') + f('cumple', 'Cumpleaños', 'date') +
      (pagos ? '<label>Forma de pago<select name="formaPago">' + ['', 'Débito automático', 'Transferencia', 'Efectivo', 'Becado'].map(function (m) { return '<option' + ((a.formaPago || '') === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label><label class="tt-inl"><input type="checkbox" name="matricula"' + (a.matricula ? ' checked' : '') + '> Matrícula paga</label>' : '') +
      '<label class="w">Notas<textarea name="notas">' + esc(a.notas || '') + '</textarea></label>' + (a._id ? '<label class="w tt-inl"><input type="checkbox" name="baja"' + (a.activo === false ? ' checked' : '') + '> Dejó de cursar (no aparece en las listas)</label>' : '');
  }
  function saveAlu(f, id) {
    var o = { op: 'alumno', alumnoId: id || '', title: f.title.value, carreras: f.carreras.value, modalidad: f.modalidad.value, tutores: f.tutores.value, ciudad: f.ciudad.value, telefono: f.telefono.value, email: f.email.value, cumple: f.cumple.value, notas: f.notas.value, activo: !(f.baja && f.baja.checked) };
    if (f.formaPago) { o.formaPago = f.formaPago.value; o.matricula = f.matricula.checked; }
    send(o, id, 'alumnos').then(function (r) { toast('Datos guardados.'); refresh(); FT = 'dat'; ficha(r.item._id, 1); });
  }
  function nuevo() { $('#drBody').innerHTML = '<div class="tt-fh">' + av('+', '', 'lg') + '<div><h2 id="drName">Sumar alumno</h2><p>Con nombre, carrera y tutores ya aparece en las listas.</p></div></div><form class="tt-card tt-form" id="aluF">' + aluFields({ modalidad: 'Presencial', tutores: ME.pareja || '' }, !!ME.pagos) + '<button class="tt-btn w" type="submit">Sumar</button></form>'; $('#ttDrawer').hidden = false; document.body.style.overflow = 'hidden'; $('#aluF').onsubmit = function (e) { e.preventDefault(); saveAlu(e.target, ''); }; }
  function closeDr() { $('#ttDrawer').hidden = true; document.body.style.overflow = ''; }
  $$('[data-x]').forEach(function (e) { e.onclick = closeDr; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDr(); var m = $('.tt-modal'); if (m) m.remove(); } });
  function parejas() { var s = {}; D.alumnos.forEach(function (a) { if (a.tutores) s[a.tutores] = 1; }); D.tutores.forEach(function (t) { if (t.pareja) s[t.pareja] = 1; }); return Object.keys(s).sort(); }

  /* Quincena y notificaciones */
  var ANCHOR = new Date(2026, 10, 2);
  function quincena() { var per = Math.floor((TODAY - ANCHOR) / (14 * 864e5)), ini = addD(ANCHOR, per * 14); return { per: per, ini: ini, fin: addD(ini, 13) }; }
  function quinData() {
    var Q = quincena(), desde = iso(Q.ini), hasta = iso(Q.fin);
    var mine = activos().filter(function (a) { return !F.par || a.tutores === F.par; });
    var E = mine.map(function (a) { return { a: a, s: estado(a) }; }), rojos = E.filter(function (x) { return x.s.lvl !== 'g'; });
    var hecho = function (a) { return (IX.seg[a._id] || []).some(function (s) { return s.fecha >= desde && s.fecha <= hasta; }); };
    var clases = []; for (var d = new Date(Q.ini); d <= TODAY && d <= Q.fin; d = addD(d, 1)) if ([3, 4, 6].indexOf(d.getDay()) >= 0) clases.push(iso(d));
    var pres = mine.filter(function (a) { return !async_(a); });
    var listas = clases.map(function (f) { var n = D.asistencia.filter(function (x) { return x.fecha === f && pres.some(function (a) { return a._id === x.alumnoId; }); }).length; return { f: f, n: n }; }).filter(function (c) { return c.n > 0 || c.f >= iso(addD(TODAY, -2)); });
    return { Q: Q, mine: mine, rojos: rojos, hecho: hecho, grupo: (ME.grupoUlt || '') >= desde, listas: listas, pres: pres.length };
  }
  function renderQuincena() {
    var q = quinData(), dias = Math.round((q.Q.fin - TODAY) / 864e5), cont = q.rojos.filter(function (x) { return q.hecho(x.a); }).length;
    var listasOk = q.listas.every(function (c) { return c.n >= q.pres; });
    var it = function (done, title, sub, extra, act) { return '<div class="tt-qi' + (done ? ' done' : '') + '"><span class="tt-ck" aria-hidden="true">' + (done ? '✓' : '') + '</span><div><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + (extra || '') + '</div>' + (act || '') + '</div>'; };
    return '<div class="tt-card tt-q"><div class="tt-qh"><div><h2>Tu quincena</h2><small>Del ' + fcorta(iso(q.Q.ini)) + ' al ' + fcorta(iso(q.Q.fin)) + ' · ' + (dias > 0 ? 'quedan ' + dias + ' días' : 'último día') + '</small></div><div class="tt-pills">' + pairPills() + '</div></div>' +
      it(q.grupo, 'Escribir en el grupo de WhatsApp', q.grupo ? 'Hecho el ' + fcorta(ME.grupoUlt) + '. ¡Gracias!' : 'Una palabra, una pregunta sobre la última clase o un saludo. Ayuda a ver quién se está alejando.', '', q.grupo ? '' : '<button class="tt-btn s" type="button" id="gListo">Ya escribí</button>') +
      it(q.rojos.length && cont === q.rojos.length, 'Acompañar a los que están en rojo o amarillo', q.rojos.length ? cont + ' de ' + q.rojos.length + ' contactados esta quincena. Tocá una cara para abrir su ficha.' : 'Nadie necesita seguimiento por ahora.', q.rojos.length ? '<div class="tt-mini" style="max-width:none"><i style="width:' + Math.round(100 * cont / q.rojos.length) + '%"></i></div><div class="tt-faces">' + q.rojos.map(function (x) { return '<button type="button" data-id="' + esc(x.a._id) + '" class="' + (q.hecho(x.a) ? 'ok' : '') + '" title="' + esc(x.a.title) + '">' + av(x.a.title, x.s.lvl, 'sm') + '</button>'; }).join('') + '</div>' : '') +
      it(q.listas.length && listasOk, 'Pasar lista en cada clase', q.listas.length ? q.listas.map(function (c) { return fcorta(c.f) + ': ' + c.n + '/' + q.pres; }).join(' · ') : 'Todavía no hubo clases en esta quincena.', '', q.listas.length && !listasOk ? '<button class="tt-btn s" type="button" data-go="lista">Pasar lista</button>' : '') + '</div>';
  }
  function bindQuincena(root) {
    var g = $('#gListo', root); if (g) g.onclick = function () { send({ op: 'grupo-listo' }).then(function (r) { ME.grupoUlt = r.item.grupoUlt; toast('¡Bien! Quedó registrado.'); refresh(); notis(); }); };
    $$('.tt-q .tt-faces button', root).forEach(function (b) { b.onclick = function () { ficha(b.dataset.id); }; });
    $$('.tt-q [data-go]', root).forEach(function (b) { b.onclick = function () { tab(b.dataset.go); }; });
    $$('.tt-q [data-pp]', root).forEach(function (b) { b.onclick = function () { F.par = b.dataset.pp; refresh(); }; });
  }
  function notis() {
    var q = quinData(), seen = ls('tt:seen') || '', N = [];
    if (!q.grupo) N.push({ k: 'g' + q.Q.per, e: '💬', t: 'Toca escribir en el grupo', s: 'Esta quincena todavía no registraste un mensaje al grupo.', go: 'hoy' });
    var pc = porContactar(); if (pc.length) N.push({ k: 'c' + q.Q.per + '-' + pc.length, e: '🤝', t: pc.length + (pc.length === 1 ? ' persona para acompañar' : ' personas para acompañar'), s: pc.slice(0, 3).map(function (x) { return x.a.title; }).join(', ') + (pc.length > 3 ? '…' : ''), go: 'contactar' });
    if ((D.tally || []).length) N.push({ k: 't' + D.tally.length, e: '📝', t: 'Exámenes sin asignar', s: 'Llegaron de Tally y hay que elegir de quién son.', go: 'hoy' });
    var exm = (D.eventos || []).filter(function (e) { var f = iso(evDate(e)); return e.mesa && f <= iso(TODAY) && f >= iso(addD(TODAY, -10)) && !(D.mesa || []).some(function (m) { return m.fecha === f; }); });
    if (exm.length) N.push({ k: 'm' + exm[0]._id, e: '🍽️', t: 'Registrar el tiempo de mesa', s: 'Del ' + fcorta(iso(evDate(exm[0]))) + '.', go: 'mesa' });
    var un = N.filter(function (n) { return seen.indexOf('|' + n.k) < 0; });
    $('#ttBellN').textContent = un.length; $('#ttBellN').hidden = !un.length;
    var box = $('#ttNoti');
    var draw = function () { box.innerHTML = '<h3>Notificaciones</h3>' + (N.length ? N.map(function (n) { return '<button class="tt-ni' + (seen.indexOf('|' + n.k) < 0 ? ' new' : '') + '" data-go="' + n.go + '"><em>' + n.e + '</em><span><b>' + n.t + '</b><small>' + esc(n.s) + '</small></span></button>'; }).join('') : '<p class="tt-tip" style="padding:12px">No tenés nada pendiente. 🙌🏽</p>'); $$('[data-go]', box).forEach(function (b) { b.onclick = function () { box.hidden = true; var g = b.dataset.go; if (g === 'contactar') { F.est = 'c'; tab('alumnos'); } else tab(g); }; }); };
    $('#ttBell').onclick = function (e) { e.stopPropagation(); box.hidden = !box.hidden; if (!box.hidden) { draw(); ls('tt:seen', seen + N.map(function (n) { return '|' + n.k; }).join('')); $('#ttBellN').hidden = true; } };
    document.addEventListener('click', function (e) { if (!box.hidden && !box.contains(e.target)) box.hidden = true; });
  }
  function palabra() { if (!window.HabitatAliento) return; var w = window.HabitatAliento('tutor'); $('#ttWordT').textContent = w.t; $('#ttWordR').textContent = w.r || 'Para vos, hoy'; $('#ttWord').hidden = false; }
  $('#ttWordN').onclick = palabra;

  function cur() { var b = $('.tt-tabs .on'); return b ? b.dataset.t : 'hoy'; }
  function refresh() { var t = cur(); ({ hoy: renderHoy, alumnos: renderAlumnos, lista: renderLista, mesa: renderMesa, cal: renderCal, vol: renderVol, equipo: renderEquipo, clases: renderClases }[t] || renderHoy)(); }
  var ORGM = document.body.dataset.mode === 'org', ORGT = ['cal', 'clases', 'vol', 'equipo'];
  function tab(t) { var b = $('#ttTabs [data-t="' + t + '"]'); if ((!b || b.hidden) && ME && ME.org && !ORGM && ORGT.indexOf(t) >= 0) { location.href = '/organizacion.html#' + t; return; } if ((!b || b.hidden) && ORGM && ORGT.indexOf(t) < 0) { location.href = '/tutor.html#' + t; return; } if (!b || b.hidden) return; $$('#ttTabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tt-v').forEach(function (v) { v.hidden = v.id !== 'v-' + t; }); try { history.replaceState(null, '', '#' + t); } catch (e) {} refresh(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  $$('#ttTabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.t); }; });

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', ORGM ? '/organizacion.html' : '/tutor.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { D = await api('GET'); }
    catch (e) { $('#ttHola').textContent = e.status === 403 ? 'Tu cuenta todavía no tiene acceso' : 'No se pudo cargar el panel'; $('#ttWho').textContent = e.status === 403 ? 'Pedile acceso a la dirección de Habitat con el email con el que entrás al Campus.' : 'Revisá tu conexión y recargá la página.'; $('#v-hoy').innerHTML = ''; return; }
    ME = D.me; index();
    var R = { director: 'Director', tutor: 'Tutor', pagos: 'Tutor' }, h = new Date().getHours();
    $('#ttHola').textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + (ME.title || '').split(' ')[0];
    $('#ttWho').textContent = (R[ME.rol] || 'Tutor') + (ME.lista && ME.rol !== 'director' ? ' · pasa lista' : '') + (ME.pagos ? ' · pagos' : '') + (ME.org ? ' · organiza' : '') + (ME.pareja ? ' · ' + ME.pareja : '') + ' · ' + DL[TODAY.getDay()] + ' ' + TODAY.getDate() + ' de ' + MESES[TODAY.getMonth()];
    // tres paneles: tutores (seguimiento), organización (calendario, clases, servicio y equipo) y finanzas
    $('#toFin').hidden = !ME.gastos; if ($('#toOrg')) $('#toOrg').hidden = !ME.org || ORGM; if ($('#toTut')) $('#toTut').hidden = !ORGM;
    ['tabEq', 'tabCal', 'tabVol', 'tabCla'].forEach(function (k) { $('#' + k).hidden = !ORGM; });
    if (ORGM && !ME.org) { $('#ttHola').textContent = 'Este panel es para quienes organizan'; $('#ttWho').textContent = 'Desde acá se arma el calendario, las clases, el servicio de voluntarios y el equipo. Si te toca organizar, pedile acceso a la dirección.'; $('.tt-main').innerHTML = ''; $('#ttTabs').hidden = true; return; }
    $('#parejas').innerHTML = parejas().map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
    if (ME.pareja && parejas().indexOf(ME.pareja) >= 0) F.par = ME.pareja;
    $('#fQ').oninput = function () { F.q = this.value.trim(); renderAlumnos(); };
    $('#addAlu').onclick = nuevo;
    $('#lDate').value = iso(lastClass()); $('#lDate').onchange = renderLista;
    notis(); palabra();
    try { var tk = await token(); fetch('/api/rol', { headers: { 'x-habitat-auth': tk } }).then(function (r) { return r.json(); }).then(function (r) { if (r.voluntario) $('#toVol').hidden = false; }); } catch (e) {}
    var hh = location.hash.replace('#', ''); if (hh && $('#ttTabs [data-t="' + hh + '"]') && !$('#ttTabs [data-t="' + hh + '"]').hidden) tab(hh); else if (ORGM) tab('vol'); else renderHoy();
  })();
})();
