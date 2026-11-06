/* Finanzas de Habitat: cobros de alumnos por escuela y mes, registro de cobros, gastos y resumen. */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MC = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var ESC = ['Maranata', 'Liderazgo', 'Adoración'];
  var FORMAS = ['Débito automático', 'Transferencia', 'Efectivo', 'Mercado Pago', 'Becado', 'Sin registro'];
  var ESPECIALES = ['', 'Pagó anual', 'Abonó semestral', 'Baja', 'Becado'];
  var MEDIOS = ['Plataforma', 'Transferencia', 'Efectivo', 'Mercado Pago', 'Débito'];
  var CATS = ['Edificio', 'Herramientas digitales', 'Comisiones', 'Materiales', 'Eventos', 'Otros'];
  var TODAY = new Date(); var YEAR = TODAY.getFullYear();
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var HOY = iso(TODAY), CUR_M = HOY.slice(0, 7);
  function mk(m) { return YEAR + '-' + ('0' + m).slice(-2); }
  function addM(m, n) { var y = +m.slice(0, 4), k = +m.slice(5, 7) - 1 + n; y += Math.floor(k / 12); k = ((k % 12) + 12) % 12; return y + '-' + ('0' + (k + 1)).slice(-2); }
  function mesTxt(m) { return MESES[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4); }
  function plata(n, mon) { n = Number(n) || 0; return (mon === 'USD' ? 'US$ ' : '$ ') + n.toLocaleString('es-AR', { maximumFractionDigits: 2 }); }
  function corto(n) { n = Number(n) || 0; return n >= 1e6 ? '$' + (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'M' : n >= 1000 ? '$' + Math.round(n / 1000) + 'k' : '$' + n; }
  function fcorta(s) { var p = s.split('-'); return +p[2] + ' ' + MC[+p[1] - 1].toLowerCase(); }
  function nrm(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function toast(t) { var e = $('#ttToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  async function token() { await A.api('GET', '/members/v1/members/my'); try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } }
  async function api(method, body) {
    var r = await fetch('/api/finanzas', { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await token() }, body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No se guardó. Revisá la conexión y probá de nuevo.'); er.status = r.status; throw er; }
    return j;
  }
  var D = null, NM = {};
  async function send(body, col, key) {
    try {
      var r = await api('POST', body);
      if (col) { var L = D[col], id = r.item ? r.item._id : key, at = L.findIndex(function (x) { return x._id === id; }); if (r.item) { if (at >= 0) L[at] = r.item; else L.push(r.item); } else if (at >= 0) L.splice(at, 1); }
      return r;
    } catch (e) { toast(e.message); throw e; }
  }
  function modal(html, onOpen) { var m = document.createElement('div'); m.className = 'tt-modal'; m.innerHTML = '<div class="tt-card">' + html + '</div>'; document.body.appendChild(m); var close = function () { m.remove(); }; m.onclick = function (e) { if (e.target === m || e.target.closest('[data-close]')) close(); }; onOpen(m, close); return m; }
  function opts(L, v) { return L.map(function (o) { var val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o || '—'; return '<option value="' + esc(val) + '"' + (String(v == null ? '' : v) === String(val) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join(''); }

  /* reglas del mes (iguales al Excel de Raquel) */
  function estado(p, m) {
    var n = +m.slice(5, 7), esp = nrm(p.especial);
    if (/becad/.test(nrm(p.formaPago)) || esp.indexOf('becad') >= 0) return { k: 'becado', t: 'Becado' };
    if (n < (p.inicio || 3)) return { k: 'nada', t: '—' };
    var dentro = p.desde != null && n >= p.desde && n <= (p.hasta || 12);
    if (esp.indexOf('baja') >= 0 && dentro) return { k: 'baja', t: 'Baja' };
    if (esp && dentro) return { k: 'esp', t: /anual/.test(esp) ? 'Anual' : /semes/.test(esp) ? 'Semestral' : 'Especial' };
    var c = D.cobros.filter(function (x) { return x.alumnoId === p.alumnoId && x.escuela === p.escuela && x.mes === m && (x.estado || 'Aprobado') === 'Aprobado'; });
    var s = c.reduce(function (a, x) { return a + (+x.monto || 0); }, 0);
    if (s > 0) return { k: 'pago', t: corto(s), monto: s };
    return m < CUR_M ? { k: 'debe', t: 'Debe' } : m === CUR_M ? { k: 'pend', t: 'Pendiente' } : { k: 'fut', t: '' };
  }
  function resumenPlan(p) {
    var deb = [], tot = 0;
    for (var i = 3; i <= 12; i++) { var e = estado(p, mk(i)); if (e.k === 'debe') deb.push(mk(i)); }
    D.cobros.forEach(function (x) { if (x.alumnoId === p.alumnoId && x.escuela === p.escuela && (x.estado || 'Aprobado') === 'Aprobado') tot += +x.monto || 0; });
    var est = /becad/.test(nrm(p.formaPago)) || nrm(p.especial).indexOf('becad') >= 0 ? 'Becado' : nrm(p.especial).indexOf('baja') >= 0 ? 'Baja' : deb.length ? 'Debe ' + deb.length + (deb.length === 1 ? ' mes' : ' meses') : 'Al día';
    return { deb: deb, tot: tot, est: est };
  }

  /* Cobros por alumno */
  var F = { esc: '', q: '', est: '' };
  function renderCobros() {
    $('#cPills').innerHTML = [['', 'Todas']].concat(ESC.map(function (e) { return [e, e]; })).map(function (x) { return '<button class="tt-pill' + (F.esc === x[0] ? ' on' : '') + '" data-e="' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '<span class="tt-sep"></span>' + [['', 'Todos'], ['debe', 'Deben'], ['ok', 'Al día']].map(function (x) { return '<button class="tt-pill' + (F.est === x[0] ? ' on' : '') + '" data-s="' + x[0] + '">' + x[1] + '</button>'; }).join('');
    $$('#cPills [data-e]').forEach(function (b) { b.onclick = function () { F.esc = b.dataset.e; renderCobros(); }; });
    $$('#cPills [data-s]').forEach(function (b) { b.onclick = function () { F.est = b.dataset.s; renderCobros(); }; });
    var L = D.planes.filter(function (p) { if (F.esc && p.escuela !== F.esc) return false; if (F.q && nrm(NM[p.alumnoId] || p.title).indexOf(nrm(F.q)) < 0) return false; var r = resumenPlan(p); if (F.est === 'debe' && !r.deb.length) return false; if (F.est === 'ok' && r.deb.length) return false; return true; })
      .sort(function (a, b) { return ESC.indexOf(a.escuela) - ESC.indexOf(b.escuela) || nrm(NM[a.alumnoId]).localeCompare(nrm(NM[b.alumnoId])); });
    var meses = []; for (var i = 3; i <= 12; i++) meses.push(mk(i));
    var deben = 0, total = 0; L.forEach(function (p) { var r = resumenPlan(p); if (r.deb.length) deben++; total += r.tot; });
    $('#cSum').innerHTML = '<div class="fn-kpi"><b>' + L.length + '</b><span>inscripciones</span></div><div class="fn-kpi r"><b>' + deben + '</b><span>deben algún mes</span></div><div class="fn-kpi g"><b>' + plata(total) + '</b><span>cobrado en el año</span></div>';
    $('#cTable').innerHTML = '<table class="fn-t"><thead><tr><th>Alumno</th><th>Escuela</th><th>Forma de pago</th>' + meses.map(function (m) { return '<th class="' + (m === CUR_M ? 'cur' : '') + '">' + MC[+m.slice(5, 7) - 1] + '</th>'; }).join('') + '<th>Total</th><th>Estado</th></tr></thead><tbody>' +
      (L.map(function (p) { var r = resumenPlan(p); return '<tr data-a="' + esc(p.alumnoId) + '"><td class="n">' + esc(NM[p.alumnoId] || p.title) + '</td><td>' + esc(p.escuela) + '</td><td class="m">' + esc(p.formaPago || '—') + '</td>' + meses.map(function (m) { var e = estado(p, m); return '<td><span class="fn-c ' + e.k + '">' + esc(e.t) + '</span></td>'; }).join('') + '<td class="t">' + plata(r.tot) + '</td><td><span class="fn-st ' + (r.deb.length ? 'r' : r.est === 'Al día' ? 'g' : '') + '">' + esc(r.est) + '</span></td></tr>'; }).join('') || '<tr><td colspan="15" class="fn-empty">No hay inscripciones con ese filtro.</td></tr>') + '</tbody></table>';
    $$('#cTable tr[data-a]').forEach(function (tr) { tr.onclick = function () { ficha(tr.dataset.a); }; });
  }

  /* Ficha del alumno: planes por escuela y sus cobros */
  function ficha(id) {
    var a = D.alumnos.filter(function (x) { return x._id === id; })[0] || { _id: id, title: id };
    var ps = D.planes.filter(function (p) { return p.alumnoId === id; });
    var cs = D.cobros.filter(function (c) { return c.alumnoId === id; }).sort(function (x, y) { return x.fecha < y.fecha ? 1 : -1; });
    $('#drBody').innerHTML = '<h2 id="drName">' + esc(a.title) + '</h2><p class="tt-tip">' + esc([a.carreras, a.modalidad, a.tutores ? 'Tutores: ' + a.tutores : ''].filter(Boolean).join(' · ')) + '</p>' +
      ps.map(function (p) { var meses = []; for (var i = 3; i <= 12; i++) meses.push(mk(i)); var r = resumenPlan(p); return '<div class="tt-card fn-plan"><div class="fn-ph"><h3>' + esc(p.escuela) + '</h3><span class="fn-st ' + (r.deb.length ? 'r' : r.est === 'Al día' ? 'g' : '') + '">' + esc(r.est) + '</span><button class="tt-btn s" data-plan="' + esc(p.escuela) + '">Editar plan</button></div><div class="fn-months">' + meses.map(function (m) { var e = estado(p, m); return '<span class="fn-c ' + e.k + '"><small>' + MC[+m.slice(5, 7) - 1] + '</small>' + esc(e.t || '·') + '</span>'; }).join('') + '</div><p class="tt-tip">' + esc(p.formaPago || 'Forma de pago sin cargar') + ' · empezó en ' + MESES[(p.inicio || 3) - 1] + (p.especial ? ' · ' + esc(p.especial) + (p.desde ? ' (' + MESES[p.desde - 1] + ' a ' + MESES[(p.hasta || 12) - 1] + ')' : '') : '') + (p.nota ? '<br>' + esc(p.nota) : '') + '</p></div>'; }).join('') +
      '<div class="tt-wa"><button class="tt-btn" id="drCobro">Registrar un cobro</button>' + (ps.length < 3 ? '<button class="tt-btn s" id="drPlan">Sumar escuela</button>' : '') + '</div>' +
      '<h3 class="tt-lbl" style="margin-top:18px">Cobros</h3><div class="fn-log">' + (cs.map(rowCobro).join('') || '<p class="tt-tip">Todavía no tiene cobros cargados.</p>') + '</div>';
    $('#ttDrawer').hidden = false;
    $$('#drBody [data-plan]').forEach(function (b) { b.onclick = function () { planModal(id, b.dataset.plan); }; });
    if ($('#drPlan')) $('#drPlan').onclick = function () { planModal(id, ''); };
    $('#drCobro').onclick = function () { cobroModal({ alumnoId: id, escuela: ps.length === 1 ? ps[0].escuela : '' }); };
    bindLog($('#drBody'), function () { ficha(id); });
  }
  function rowCobro(c) { return '<div class="fn-row ' + (c.estado === 'Rechazado' ? 'no' : '') + '" data-c="' + esc(c._id) + '"><span class="d">' + esc(c.fecha ? fcorta(c.fecha) : '') + '</span><span class="w"><b>' + esc(NM[c.alumnoId] || c.title) + '</b><small>' + esc(c.escuela) + ' · cuenta para ' + esc(c.mes ? MESES[+c.mes.slice(5, 7) - 1] : '—') + ' · ' + esc(c.medio || '') + (c.compartido ? ' · compartido con ' + esc(c.compartido) : '') + (c.estado && c.estado !== 'Aprobado' ? ' · ' + esc(c.estado) + (c.respuesta ? ': ' + esc(c.respuesta) : '') : '') + (c.nota ? ' · ' + esc(c.nota) : '') + '</small></span><span class="p">' + plata(c.monto) + '</span></div>'; }
  function bindLog(box, after) { $$('[data-c]', box).forEach(function (r) { r.onclick = function () { var c = D.cobros.filter(function (x) { return x._id === r.dataset.c; })[0]; if (c) cobroModal(c, after); }; }); }
  $$('#ttDrawer [data-x]').forEach(function (b) { b.onclick = function () { $('#ttDrawer').hidden = true; refresh(); }; });

  function planModal(id, escuela) {
    var p = D.planes.filter(function (x) { return x.alumnoId === id && x.escuela === escuela; })[0] || { alumnoId: id, escuela: escuela, inicio: TODAY.getMonth() + 1 };
    var mm = [['', '—']].concat(MESES.map(function (m, i) { return [i + 1, m]; }).slice(2));
    modal('<form class="tt-form"><h2 class="w">' + esc(NM[id] || id) + (escuela ? ' · ' + esc(escuela) : '') + '</h2>' + (escuela ? '' : '<label>Escuela<select name="escuela">' + opts(ESC.filter(function (e) { return !D.planes.some(function (x) { return x.alumnoId === id && x.escuela === e; }); })) + '</select></label>') +
      '<label>Forma de pago<select name="formaPago">' + opts([''].concat(FORMAS), p.formaPago) + '</select></label><label>Empezó a pagar en<select name="inicio">' + opts(mm.slice(1), p.inicio) + '</select></label>' +
      '<label>Pago especial<select name="especial">' + opts(ESPECIALES, p.especial) + '</select></label><label>Desde<select name="desde">' + opts(mm, p.desde) + '</select></label><label>Hasta<select name="hasta">' + opts(mm, p.hasta) + '</select></label>' +
      '<label class="w">Nota<textarea name="nota">' + esc(p.nota || '') + '</textarea></label><p class="tt-tip w">El pago especial cubre los meses del rango: anual o semestral los da por pagos, «Baja» deja de cobrar desde ese mes.</p>' +
      '<div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'plan', alumnoId: id, title: NM[id] || id, escuela: escuela || f.escuela.value, formaPago: f.formaPago.value, inicio: f.inicio.value, especial: f.especial.value, desde: f.desde.value, hasta: f.hasta.value, nota: f.nota.value }, 'planes').then(function () { close(); toast('Plan guardado.'); ficha(id); }); };
    });
  }
  function cobroModal(c, after) {
    c = c || {}; var nuevo = !c._id;
    var al = D.alumnos.slice().sort(function (a, b) { return nrm(a.title).localeCompare(nrm(b.title)); });
    var mm = []; for (var i = 1; i <= 12; i++) mm.push([mk(i), MESES[i - 1]]);
    modal('<form class="tt-form"><h2 class="w">' + (nuevo ? 'Registrar un cobro' : 'Editar cobro') + '</h2>' +
      '<label class="w">Alumno<select name="alumnoId" required>' + opts([['', 'Elegí al alumno']].concat(al.map(function (a) { return [a._id, a.title]; })), c.alumnoId) + '</select></label>' +
      '<label>Escuela<select name="escuela" required>' + opts([['', 'Elegí']].concat(ESC.map(function (e) { return [e, e]; })), c.escuela) + '</select></label>' +
      '<label>Cuenta para el mes<select name="mes">' + opts(mm, c.mes || CUR_M) + '</select></label>' +
      '<label>Fecha del pago<input type="date" name="fecha" required value="' + esc(c.fecha || HOY) + '"></label><label>Monto<input name="monto" inputmode="decimal" required value="' + esc(c.monto || '') + '" placeholder="25000"></label>' +
      '<label>Medio<select name="medio">' + opts(MEDIOS, c.medio || 'Transferencia') + '</select></label><label>Concepto<select name="concepto">' + opts(['Cuota', 'Pago especial', 'Matrícula', 'Recargo por faltas', 'Libro', 'Otro'], c.concepto || 'Cuota') + '</select></label>' +
      '<label>Estado<select name="estado">' + opts(['Aprobado', 'Rechazado', 'Pendiente'], c.estado || 'Aprobado') + '</select></label><label>Pago compartido con<input name="compartido" value="' + esc(c.compartido || '') + '" placeholder="Si lo pagó junto con otra persona"></label>' +
      '<label class="w">Nota<input name="nota" value="' + esc(c.nota || '') + '"></label>' +
      '<div class="w tt-wa"><button class="tt-btn" type="submit">' + (nuevo ? 'Registrar' : 'Guardar cambios') + '</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (nuevo ? '' : '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar</button>') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.alumnoId.onchange = function () { var ps = D.planes.filter(function (p) { return p.alumnoId === f.alumnoId.value; }); if (ps.length === 1) f.escuela.value = ps[0].escuela; };
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'cobro', id: c._id || '', alumnoId: f.alumnoId.value, title: NM[f.alumnoId.value] || '', escuela: f.escuela.value, mes: f.mes.value, fecha: f.fecha.value, monto: f.monto.value, medio: f.medio.value, concepto: f.concepto.value, estado: f.estado.value, compartido: f.compartido.value, nota: f.nota.value, respuesta: c.respuesta || '', montoTotal: c.montoTotal || '' }, 'cobros').then(function () { close(); toast(nuevo ? 'Cobro registrado.' : 'Cobro guardado.'); (after || refresh)(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { send({ op: 'cobro', borrar: true, id: c._id }, 'cobros', c._id).then(function () { close(); toast('Cobro borrado.'); (after || refresh)(); }); };
    });
  }

  /* Registro de cobros */
  var RF = { mes: '', est: '' };
  function renderRegistro() {
    var ms = {}; D.cobros.forEach(function (c) { if (c.mes) ms[c.mes] = 1; });
    $('#rMes').innerHTML = opts([['', 'Todos los meses']].concat(Object.keys(ms).sort().reverse().map(function (m) { return [m, mesTxt(m)]; })), RF.mes);
    $('#rEst').innerHTML = opts([['', 'Todos los estados'], 'Aprobado', 'Rechazado', 'Pendiente'], RF.est);
    var L = D.cobros.filter(function (c) { return (!RF.mes || c.mes === RF.mes) && (!RF.est || (c.estado || 'Aprobado') === RF.est); }).sort(function (a, b) { return (a.fecha || '') < (b.fecha || '') ? 1 : -1; });
    var ok = L.filter(function (c) { return (c.estado || 'Aprobado') === 'Aprobado'; }).reduce(function (a, c) { return a + (+c.monto || 0); }, 0);
    $('#rSum').textContent = L.length + ' cobros · ' + plata(ok) + ' aprobados';
    $('#rLog').innerHTML = L.slice(0, 400).map(rowCobro).join('') || '<p class="tt-tip">No hay cobros con ese filtro.</p>';
    bindLog($('#rLog'));
  }
  $('#rMes').onchange = function () { RF.mes = this.value; renderRegistro(); };
  $('#rEst').onchange = function () { RF.est = this.value; renderRegistro(); };
  $('#rAdd').onclick = function () { cobroModal(null); };

  /* Gastos */
  var GM = CUR_M;
  function renderGastos() {
    $('#gTit').textContent = mesTxt(GM)[0].toUpperCase() + mesTxt(GM).slice(1);
    var del = D.gastos.filter(function (g) { return g.mes === GM; }), rows = [];
    (D.fijos || []).forEach(function (f) { var g = del.filter(function (x) { return nrm(x.concepto) === nrm(f.concepto); })[0]; rows.push({ fijo: true, f: f, g: g }); });
    del.forEach(function (g) { if (!(D.fijos || []).some(function (f) { return nrm(f.concepto) === nrm(g.concepto); })) rows.push({ fijo: false, g: g }); });
    var tot = { ARS: 0, USD: 0 }, pend = 0;
    $('#gList').innerHTML = rows.map(function (r, i) {
      var g = r.g || {}, f = r.f || {}, monto = g._id ? g.monto : f.monto, mon = g.moneda || f.moneda || 'ARS', pag = !!g.pagado;
      if (pag) tot[mon] += +monto || 0; else pend++;
      return '<div class="fn-g' + (pag ? ' ok' : '') + '" data-i="' + i + '"><label class="fn-chk"><input type="checkbox"' + (pag ? ' checked' : '') + ' aria-label="Pagado"></label><span class="w"><b>' + esc(g.concepto || f.concepto) + '</b><small>' + esc(g.categoria || f.categoria || 'Otros') + (r.fijo ? ' · fijo' : '') + (g.nota ? ' · ' + esc(g.nota) : '') + '</small></span><span class="fn-amt"><select aria-label="Moneda">' + opts(['ARS', 'USD'], mon) + '</select><input inputmode="decimal" value="' + esc(monto || '') + '" aria-label="Monto"></span></div>';
    }).join('') || '<p class="tt-tip">Sin gastos cargados para este mes.</p>';
    $('#gTot').innerHTML = '<div class="fn-kpi"><b>' + plata(tot.ARS) + '</b><span>pagado en pesos</span></div><div class="fn-kpi"><b>' + plata(tot.USD, 'USD') + '</b><span>pagado en dólares</span></div><div class="fn-kpi ' + (pend ? 'r' : 'g') + '"><b>' + pend + '</b><span>sin pagar</span></div>';
    $$('#gList .fn-g').forEach(function (el) {
      var r = rows[+el.dataset.i], g = r.g || {}, f = r.f || {};
      var save = function () { var inp = $('input[inputmode]', el), sel = $('select', el), chk = $('input[type=checkbox]', el); send({ op: 'gasto', id: g._id || '', concepto: g.concepto || f.concepto, categoria: g.categoria || f.categoria, mes: GM, monto: inp.value, moneda: sel.value, fijo: r.fijo, pagado: chk.checked, nota: g.nota || '' }, 'gastos').then(function () { renderGastos(); }); };
      $('input[type=checkbox]', el).onchange = function () { save(); toast(this.checked ? 'Marcado como pagado.' : 'Marcado sin pagar.'); };
      $('input[inputmode]', el).onchange = save; $('select', el).onchange = save;
      $('.w', el).onclick = function () { gastoModal(g._id ? g : { concepto: f.concepto, categoria: f.categoria, monto: f.monto, moneda: f.moneda, fijo: true }); };
    });
  }
  function gastoModal(g) {
    g = g || {}; var nuevo = !g._id;
    modal('<form class="tt-form"><h2 class="w">' + (nuevo ? 'Sumar un gasto de ' + esc(mesTxt(GM)) : esc(g.concepto)) + '</h2><label class="w">Concepto<input name="concepto" required value="' + esc(g.concepto || '') + '" placeholder="Ej.: Arreglo del aire"></label><label>Categoría<select name="categoria">' + opts(CATS, g.categoria || 'Otros') + '</select></label><label>Moneda<select name="moneda">' + opts(['ARS', 'USD'], g.moneda || 'ARS') + '</select></label><label>Monto<input name="monto" inputmode="decimal" value="' + esc(g.monto || '') + '"></label><label class="tt-inl"><input type="checkbox" name="pagado"' + (g.pagado || nuevo ? ' checked' : '') + '> Ya está pagado</label><label class="w">Nota<input name="nota" value="' + esc(g.nota || '') + '"></label><div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (nuevo ? '' : '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar de este mes</button>') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'gasto', id: g._id || '', concepto: f.concepto.value, categoria: f.categoria.value, mes: GM, monto: f.monto.value, moneda: f.moneda.value, fijo: !!g.fijo, pagado: f.pagado.checked, nota: f.nota.value }, 'gastos').then(function () { close(); toast('Gasto guardado.'); renderGastos(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { send({ op: 'gasto', borrar: true, id: g._id, mes: GM }, 'gastos', g._id).then(function () { close(); renderGastos(); }); };
    });
  }
  function fijosModal() {
    var L = (D.fijos || []).slice();
    var row = function (f) { return '<div class="fn-fx"><input name="c" value="' + esc(f.concepto || '') + '" placeholder="Concepto" aria-label="Concepto"><select name="k" aria-label="Categoría">' + opts(CATS, f.categoria || 'Otros') + '</select><select name="m" aria-label="Moneda">' + opts(['ARS', 'USD'], f.moneda || 'ARS') + '</select><input name="v" inputmode="decimal" value="' + esc(f.monto || '') + '" placeholder="Monto" aria-label="Monto"><button type="button" class="tt-btn s" data-rm aria-label="Quitar">✕</button></div>'; };
    modal('<form class="tt-form"><h2 class="w">Gastos fijos de cada mes</h2><p class="tt-tip w">Aparecen solos en todos los meses con este monto de referencia. Cada mes marcás si se pagó y ajustás el monto real.</p><div class="w fn-fxs">' + L.map(row).join('') + '</div><button type="button" class="tt-btn s w" id="fxAdd">Sumar un gasto fijo</button><div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) {
      var box = $('.fn-fxs', m); var bind = function () { $$('[data-rm]', box).forEach(function (b) { b.onclick = function () { b.parentNode.remove(); }; }); }; bind();
      $('#fxAdd', m).onclick = function () { box.insertAdjacentHTML('beforeend', row({})); bind(); };
      $('form', m).onsubmit = function (e) { e.preventDefault(); var fx = $$('.fn-fx', box).map(function (r) { return { concepto: $('[name=c]', r).value, categoria: $('[name=k]', r).value, moneda: $('[name=m]', r).value, monto: $('[name=v]', r).value }; }).filter(function (x) { return x.concepto.trim(); }); api('POST', { op: 'fijos', fijos: fx }).then(function (r) { D.fijos = r.fijos; close(); toast('Gastos fijos guardados.'); renderGastos(); }).catch(function (er) { toast(er.message); }); };
    });
  }
  $('#gPrev').onclick = function () { GM = addM(GM, -1); renderGastos(); };
  $('#gNext').onclick = function () { GM = addM(GM, 1); renderGastos(); };
  $('#gAdd').onclick = function () { gastoModal(null); };
  $('#gFix').onclick = fijosModal;

  /* Resumen */
  function renderResumen() {
    var meses = []; for (var i = 3; i <= 12; i++) meses.push(mk(i));
    var data = meses.map(function (m) {
      var ing = D.cobros.filter(function (c) { return c.mes === m && (c.estado || 'Aprobado') === 'Aprobado'; }).reduce(function (a, c) { return a + (+c.monto || 0); }, 0);
      var gas = D.gastos.filter(function (g) { return g.mes === m && g.pagado && (g.moneda || 'ARS') === 'ARS'; }).reduce(function (a, g) { return a + (+g.monto || 0); }, 0);
      var usd = D.gastos.filter(function (g) { return g.mes === m && g.pagado && g.moneda === 'USD'; }).reduce(function (a, g) { return a + (+g.monto || 0); }, 0);
      var deb = D.planes.filter(function (p) { return estado(p, m).k === 'debe'; }).length;
      return { m: m, ing: ing, gas: gas, usd: usd, deb: deb };
    });
    var mx = Math.max.apply(null, data.map(function (d) { return Math.max(d.ing, d.gas); }).concat([1]));
    $('#sBars').innerHTML = data.map(function (d) { return '<div class="fn-bar' + (d.m === CUR_M ? ' cur' : '') + '"><div class="fn-bb"><i class="in" style="height:' + (100 * d.ing / mx) + '%" title="Cobrado ' + plata(d.ing) + '"></i><i class="out" style="height:' + (100 * d.gas / mx) + '%" title="Gastos ' + plata(d.gas) + '"></i></div><b>' + MC[+d.m.slice(5, 7) - 1] + '</b></div>'; }).join('');
    $('#sTable').innerHTML = '<table class="fn-t s"><thead><tr><th>Mes</th><th>Cobrado</th><th>Gastos en pesos</th><th>Gastos en dólares</th><th>Saldo en pesos</th><th>Deben</th></tr></thead><tbody>' + data.map(function (d) { var sal = d.ing - d.gas; return '<tr><td class="n">' + MESES[+d.m.slice(5, 7) - 1] + '</td><td>' + plata(d.ing) + '</td><td>' + plata(d.gas) + '</td><td>' + (d.usd ? plata(d.usd, 'USD') : '—') + '</td><td class="' + (sal < 0 ? 'neg' : '') + '">' + plata(sal) + '</td><td>' + (d.deb || '—') + '</td></tr>'; }).join('') + '</tbody></table>';
    var porEsc = ESC.map(function (e) { var t = D.cobros.filter(function (c) { return c.escuela === e && (c.estado || 'Aprobado') === 'Aprobado'; }).reduce(function (a, c) { return a + (+c.monto || 0); }, 0); var n = D.planes.filter(function (p) { return p.escuela === e; }).length; return '<div class="fn-kpi"><b>' + plata(t) + '</b><span>' + e + ' · ' + n + ' alumnos</span></div>'; }).join('');
    var rech = D.cobros.filter(function (c) { return c.estado === 'Rechazado'; }).length;
    $('#sEsc').innerHTML = porEsc + '<div class="fn-kpi r"><b>' + rech + '</b><span>cobros rechazados en el año</span></div>';
  }

  function cur() { var b = $('#ttTabs .on'); return b ? b.dataset.t : 'cobros'; }
  function refresh() { ({ cobros: renderCobros, registro: renderRegistro, gastos: renderGastos, resumen: renderResumen }[cur()] || renderCobros)(); }
  function tab(t) { var b = $('#ttTabs [data-t="' + t + '"]'); if (!b) return; $$('#ttTabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tt-v').forEach(function (v) { v.hidden = v.id !== 'v-' + t; }); try { history.replaceState(null, '', '#' + t); } catch (e) {} refresh(); }
  $$('#ttTabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.t); }; });
  $('#cQ').oninput = function () { F.q = this.value.trim(); renderCobros(); };
  $('#cAdd').onclick = function () { cobroModal(null); };

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/finanzas.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { D = await api('GET'); }
    catch (e) { $('#ttHola').textContent = e.status === 403 ? 'Tu cuenta no tiene acceso a Finanzas' : 'No se pudo cargar Finanzas'; $('#ttWho').textContent = e.status === 403 ? 'Este panel es para quienes llevan los pagos y los gastos de Habitat.' : 'Revisá tu conexión y recargá la página.'; $('.tt-main').innerHTML = ''; return; }
    D.alumnos.forEach(function (a) { NM[a._id] = a.title; });
    var h = new Date().getHours();
    $('#ttHola').textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + String(D.me.title || '').split(' ')[0];
    $('#ttWho').textContent = 'Cobros y gastos de Habitat · ' + MESES[TODAY.getMonth()] + ' ' + YEAR;
    var hh = location.hash.replace('#', ''); if (hh && $('#ttTabs [data-t="' + hh + '"]')) tab(hh); else if (hh) { tab('cobros'); var id = hh.replace(/^a-/, ''); if (NM[id]) ficha(id); } else renderCobros();
  })();
})();
