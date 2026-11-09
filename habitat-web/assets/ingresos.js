/* Finanzas · Ingresos: Mercado Pago, efectivo y "Por clasificar", con gráfico mes a mes por tipo. */
(function () {
  var F = window.HabFin;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plata(n) { return '$ ' + (Number(n) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 }); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], MC = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var T = new Date(), HOY = T.getFullYear() + '-' + ('0' + (T.getMonth() + 1)).slice(-2) + '-' + ('0' + T.getDate()).slice(-2), MES = HOY.slice(0, 7);
  function addM(m, n) { var y = +m.slice(0, 4), k = +m.slice(5, 7) - 1 + n; y += Math.floor(k / 12); k = ((k % 12) + 12) % 12; return y + '-' + ('0' + (k + 1)).slice(-2); }
  var COL = { 'Siembra automática': '#2f6b4f', 'Siembra puntual': '#6fa585', 'Libros': '#b8904f', 'Efectivo': '#8a6a2f', 'Cuota de alumno (MP)': '#3e6690', 'Otro': '#9aa3a0', 'Transferencia entre cuentas propias': '#d9d2c3', 'Aporte de la familia': '#a07cc5', 'Por clasificar': '#c96a5a', 'Cuotas (Debi/Payway)': '#cfd8d3' };
  var I = null, cargando = null;
  var NO_SUMA = ['Transferencia entre cuentas propias', 'Aporte de la familia'];
  function suma(x) { return NO_SUMA.indexOf(x.tipo) < 0; }
  var GUIA = {
    'Siembra automática': 'Un sembrador que aporta todos los meses con suscripción de Mercado Pago.',
    'Siembra puntual': 'Una ofrenda o donación de una vez, por link, transferencia o QR.',
    'Libros': 'Venta de libros (Asombro u otros).',
    'Efectivo': 'Plata en mano: se carga con «Cargar efectivo u otro ingreso».',
    'Cuota de alumno (MP)': 'Cuotas y suscripciones a clases pagadas por Mercado Pago en lugar de Debi. Si el alumno está en la lista, elegilo; si es una cuota de un curso, registrala también en Cobros.',
    'Transferencia entre cuentas propias': 'Plata que pasa de la cuenta de Agustina (donde caen Debi y Payway) a esta cuenta. Ya está contada en Cobros, así que acá no suma.',
    'Aporte de la familia': 'Lo que la familia siembra para cubrir lo que falta (por ejemplo, el alquiler en efectivo). Se muestra aparte, en el balance del mes.',
    'Otro': 'Un ingreso de Habitat que no entra en ningún tipo anterior. Anotá en la nota qué fue.',
    'Por clasificar': 'Todavía sin revisar.'
  };
  async function api(method, body) {
    var r = await fetch('/api/ingresos', { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await F.token() }, body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(j.error || 'No se guardó. Probá de nuevo.');
    return j;
  }
  function upd(it) { var at = I.ingresos.findIndex(function (x) { return x._id === it._id; }); if (at >= 0) I.ingresos[at] = it; else I.ingresos.push(it); }
  function nombres() { var NM = {}; (F.data().alumnos || []).forEach(function (a) { NM[a._id] = a.title; }); return NM; }
  // las cuotas normales (Débito/Payway y demás cobros registrados) quedan aparte
  function cuotas(m) { return (F.data().cobros || []).filter(function (c) { return c.fecha && c.fecha.slice(0, 7) === m && (c.estado || 'Aprobado') === 'Aprobado'; }).reduce(function (a, c) { return a + (+c.monto || 0); }, 0); }

  function render() {
    if (!I) { if (!cargando) cargando = api('GET').then(function (d) { I = d; cargando = null; render(); }).catch(function (e) { $('#iList').innerHTML = '<p class="tt-empty">' + esc(e.message) + '</p>'; cargando = null; }); return; }
    var NM = nombres();
    $('#iTit').textContent = MESES[+MES.slice(5, 7) - 1] + ' ' + MES.slice(0, 4);
    $('#iMp').innerHTML = I.mp ? '✅ Mercado Pago conectado: los pagos entran solos.' : '⚠️ Mercado Pago todavía sin conectar: falta cargar la clave <b>MP_ACCESS_TOKEN</b> en el gestor de claves de Wix.';
    var todo = I.ingresos.filter(function (x) { return x.mes === MES; }), del = todo.filter(suma);
    var por = {}; del.forEach(function (x) { por[x.tipo] = (por[x.tipo] || 0) + (+x.monto || 0); });
    var tot = del.reduce(function (a, x) { return a + (+x.monto || 0); }, 0), cq = cuotas(MES), prop = todo.filter(function (x) { return !suma(x); }).reduce(function (a, x) { return a + (+x.monto || 0); }, 0);
    $('#iTot').innerHTML = '<div class="fn-kpi g"><b>' + plata(tot) + '</b><span>ingresos del mes (sin cuotas Debi)</span></div>' + I.tipos.filter(function (t) { return por[t]; }).map(function (t) { return '<div class="fn-kpi"><b>' + plata(por[t]) + '</b><span>' + esc(t) + '</span></div>'; }).join('') + '<div class="fn-kpi"><b>' + plata(cq) + '</b><span>cuotas registradas en Cobros (aparte)</span></div>' + (prop ? '<div class="fn-kpi"><b>' + plata(prop) + '</b><span>entre cuentas propias (no suma)</span></div>' : '');
    // por clasificar, agrupado por persona: una decisión por persona clasifica todos sus pagos
    var P = I.ingresos.filter(function (x) { return x.tipo === 'Por clasificar'; });
    var G = {}; P.forEach(function (x) { var k = x.pagador || x._id; (G[k] = G[k] || { k: k, L: [], t: 0 }).L.push(x); G[k].t += +x.monto || 0; });
    var GL = Object.keys(G).map(function (k) { var g = G[k]; g.L.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }); return g; }).sort(function (a, b) { return b.t - a.t; });
    $('#iPend').hidden = !P.length;
    $('#iPend').innerHTML = '<h2 class="tt-h">Por clasificar · ' + GL.length + ' persona' + (GL.length === 1 ? '' : 's') + ' · ' + P.length + ' pagos</h2><p class="tt-tip">Ordenadas de mayor a menor. Elegí qué es cada persona y se clasifican todos sus pagos, también los que vengan.</p>' + GL.map(function (g) {
      var x = g.L[0], desc = {}; g.L.forEach(function (y) { if (y.descripcion) desc[y.descripcion.slice(0, 40)] = 1; });
      return '<div class="fn-pr" data-k="' + esc(g.k) + '"><div class="w"><b>' + esc(x.title) + '</b><small>' + g.L.length + ' pago' + (g.L.length === 1 ? '' : 's') + ' · ' + plata(g.t) + ' · ' + esc(g.L[g.L.length - 1].fecha) + (g.L.length > 1 ? ' a ' + esc(x.fecha) : '') + ' · ' + esc(x.origen) + '</small><small>' + esc(Object.keys(desc).slice(0, 3).join(' · ')) + '</small></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><select aria-label="Tipo">' + F.opts([['', 'Elegí qué es']].concat(I.tipos.filter(function (t) { return t !== 'Efectivo' && t !== 'Por clasificar'; }).map(function (t) { return [t, t]; })), '') + '</select><button class="tt-btn s" type="button">Aplicar</button></div></div>';
    }).join('');
    $$('#iPend .fn-pr').forEach(function (r) {
      var g = G[r.dataset.k], sel = $('select', r);
      $('button', r).onclick = function () {
        if (!sel.value) { F.toast('Elegí qué es.'); return; }
        if (sel.value === 'Cuota de alumno (MP)') { clasificar(Object.assign({}, g.L[0], { tipo: sel.value })); return; }
        var b = this; b.disabled = true;
        api('POST', { op: 'clasificar', id: g.L[0]._id, tipo: sel.value, alumnoId: '', recordar: true }).then(function () { g.L.forEach(function (y) { y.tipo = sel.value; }); F.toast(g.L.length + ' pago' + (g.L.length === 1 ? '' : 's') + ' clasificado' + (g.L.length === 1 ? '' : 's') + ' como ' + sel.value + '.'); render(); }).catch(function (e) { b.disabled = false; F.toast(e.message); });
      };
    });
    // gráfico: últimos 12 meses apilado por tipo, y las cuotas Debi en una barra aparte
    var ms = []; for (var i = 11; i >= 0; i--) ms.push(addM(MES, -i));
    var tipos = I.tipos.filter(function (t) { return NO_SUMA.indexOf(t) < 0 && I.ingresos.some(function (x) { return x.tipo === t; }); });
    var data = ms.map(function (m) { var o = { m: m, c: cuotas(m), t: {} }; I.ingresos.forEach(function (x) { if (x.mes === m) o.t[x.tipo] = (o.t[x.tipo] || 0) + (+x.monto || 0); }); o.s = Object.keys(o.t).reduce(function (a, k) { return a + o.t[k]; }, 0); return o; });
    var mx = Math.max.apply(null, data.map(function (d) { return Math.max(d.s, d.c); }).concat([1]));
    $('#iLeg').innerHTML = tipos.concat(['Cuotas (Debi/Payway)']).map(function (t) { return '<span style="--c:' + COL[t] + '"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:' + COL[t] + ';margin-right:6px"></i>' + esc(t) + '</span>'; }).join('');
    $('#iBars').style.gridTemplateColumns = 'repeat(12,1fr)';
    $('#iBars').innerHTML = data.map(function (d) {
      var stk = tipos.map(function (t) { return d.t[t] ? '<i style="height:' + (100 * d.t[t] / mx) + '%;background:' + COL[t] + '" title="' + esc(t) + ': ' + plata(d.t[t]) + '"></i>' : ''; }).join('');
      return '<div class="fn-bar' + (d.m === MES ? ' cur' : '') + '"><div class="fn-bb"><span class="fn-stk">' + stk + '</span><i style="width:30%;height:' + (100 * d.c / mx) + '%;background:' + COL['Cuotas (Debi/Payway)'] + '" title="Cuotas en Cobros: ' + plata(d.c) + '"></i></div><b>' + MC[+d.m.slice(5, 7) - 1] + '</b></div>';
    }).join('');
    // lista del mes
    var L = todo.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    $('#iList').innerHTML = L.length ? L.map(function (x) { return '<div class="fn-g"><span class="sm-dot" style="width:10px;height:10px;border-radius:50%;background:' + (COL[x.tipo] || '#999') + '"></span><div class="w" data-id="' + esc(x._id) + '"><b>' + esc(x.title) + (x.alumnoId && NM[x.alumnoId] && NM[x.alumnoId] !== x.title ? ' → ' + esc(NM[x.alumnoId]) : '') + '</b><small>' + esc([x.fecha, x.tipo, x.origen, x.nota].filter(Boolean).join(' · ')) + '</small></div><b>' + plata(x.monto) + '</b></div>'; }).join('') : '<p class="tt-empty">Sin ingresos cargados en este mes.</p>';
    $$('#iList .w').forEach(function (w) { w.onclick = function () { var x = I.ingresos.find(function (y) { return y._id === w.dataset.id; }); if (x.origen === 'A mano') manual(x); else clasificar(x); }; });
  }

  function clasificar(x) {
    var al = (F.data().alumnos || []).slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    F.modal('<form class="tt-form"><h2 class="w">' + esc(x.title) + ' · ' + plata(x.monto) + '</h2><p class="w tt-tip">' + esc([x.fecha, x.email, x.descripcion].filter(Boolean).join(' · ')) + '</p>' +
      '<label class="w">Tipo<select name="tipo">' + F.opts(I.tipos.filter(function (t) { return t !== 'Efectivo'; }), x.tipo) + '</select></label><p class="w tt-tip" data-g></p>' +
      '<label class="w" data-al>Alumno<select name="alumnoId">' + F.opts([['', 'Elegí al alumno']].concat(al.map(function (a) { return [a._id, a.title]; })), x.alumnoId) + '</select></label>' +
      '<label class="w" style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="rec" checked style="width:auto"> Recordar a esta persona: sus próximos pagos se clasifican igual</label>' +
      '<p class="w tt-tip">Si es siembra, la persona se suma sola a la lista de Sembradores y le llega la bienvenida. Si es cuota de un alumno, registrala también en Cobros con su escuela y mes.</p>' +
      '<div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) {
      var f = $('form', m), sh = function () { $('[data-al]', m).hidden = f.tipo.value !== 'Cuota de alumno (MP)'; $('[data-g]', m).textContent = GUIA[f.tipo.value] || ''; }; sh(); f.tipo.onchange = sh;
      f.onsubmit = function (e) { e.preventDefault(); api('POST', { op: 'clasificar', id: x._id, tipo: f.tipo.value, alumnoId: f.alumnoId.value, recordar: f.rec.checked }).then(function (r) { upd(r.item); if (f.rec.checked) I.ingresos.forEach(function (y) { if (y.pagador && y.pagador === x.pagador) { y.tipo = r.item.tipo; y.alumnoId = r.item.alumnoId; } }); close(); F.toast('Clasificado.'); render(); }).catch(function (e) { F.toast(e.message); }); };
    });
  }
  function manual(x) {
    x = x || {}; var nuevo = !x._id;
    F.modal('<form class="tt-form"><h2 class="w">' + (nuevo ? 'Cargar un ingreso' : 'Editar ingreso') + '</h2>' +
      '<label>Fecha<input type="date" name="fecha" required value="' + esc(x.fecha || HOY) + '"></label><label>Monto<input name="monto" inputmode="decimal" required value="' + esc(x.monto || '') + '"></label>' +
      '<label>Tipo<select name="tipo">' + F.opts(I.tipos.filter(function (t) { return t !== 'Por clasificar'; }), x.tipo || 'Efectivo') + '</select></label><label>De quién<input name="title" value="' + esc(x.title || '') + '" placeholder="Opcional"></label>' +
      '<label class="w">Nota<input name="nota" value="' + esc(x.nota || '') + '"></label>' +
      '<div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (nuevo ? '' : '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar</button>') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); api('POST', { op: 'manual', id: x._id || '', fecha: f.fecha.value, monto: f.monto.value, tipo: f.tipo.value, title: f.title.value, nota: f.nota.value }).then(function (r) { upd(r.item); close(); F.toast('Ingreso guardado.'); render(); }).catch(function (e) { F.toast(e.message); }); };
      var d = $('[data-del]', m); if (d) d.onclick = function () { api('POST', { op: 'manual', borrar: true, id: x._id }).then(function () { I.ingresos = I.ingresos.filter(function (y) { return y._id !== x._id; }); close(); F.toast('Borrado.'); render(); }); };
    });
  }
  $('#iPrev').onclick = function () { MES = addM(MES, -1); render(); };
  $('#iNext').onclick = function () { MES = addM(MES, 1); render(); };
  $('#iAdd').onclick = function () { manual(null); };
  $('#iTraer').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Trayendo…'; api('POST', { op: 'traer', dias: 90 }).then(function (r) { F.toast('Revisamos ' + r.vistos + ' movimientos de los últimos 90 días · ' + r.nuevos + ' ingresos nuevos · ' + (r.salidas || 0) + ' salidas.'); return api('GET'); }).then(function (d) { I = d; render(); }).catch(function (e) { F.toast(e.message); }).finally(function () { b.disabled = false; b.textContent = 'Traer pagos de Mercado Pago'; }); };
  var gd = document.getElementById('iGuia'); if (gd) gd.innerHTML = Object.keys(GUIA).filter(function (k) { return k !== 'Por clasificar'; }).map(function (k) { return '<p style="margin:6px 0"><b>' + esc(k) + '.</b> ' + esc(GUIA[k]) + '</p>'; }).join('') + '<p style="margin:10px 0 0"><b>Lo que sale de la cuenta</b> no aparece acá: si se pagó algo de Habitat, se carga en Gastos; si fue un gasto personal, queda afuera del panel.</p>';

  /* ---------- Salidas y balance ---------- */
  var SM = MES;
  function gastosMes(m) {
    var d = F.data(), g = (d.gastos || []).filter(function (x) { return x.mes === m && (x.moneda || 'ARS') === 'ARS'; });
    var tot = g.reduce(function (a, x) { return a + (+x.monto || 0); }, 0), con = {}; g.forEach(function (x) { con[String(x.concepto || '').toLowerCase()] = 1; });
    (d.fijos || []).forEach(function (f) { if ((f.moneda || 'ARS') === 'ARS' && !con[String(f.concepto || '').toLowerCase()]) tot += +f.monto || 0; });
    return tot;
  }
  function salidas() {
    if (!I) { if (!cargando) cargando = api('GET').then(function (d) { I = d; cargando = null; salidas(); }).catch(function (e) { $('#sList').innerHTML = '<p class="tt-empty">' + esc(e.message) + '</p>'; cargando = null; }); return; }
    var S = I.salidas || [];
    $('#sTit').textContent = MESES[+SM.slice(5, 7) - 1] + ' ' + SM.slice(0, 4);
    var ing = I.ingresos.filter(function (x) { return x.mes === SM && suma(x); }).reduce(function (a, x) { return a + (+x.monto || 0); }, 0) + cuotas(SM);
    var fam = I.ingresos.filter(function (x) { return x.mes === SM && x.tipo === 'Aporte de la familia'; }).reduce(function (a, x) { return a + (+x.monto || 0); }, 0);
    var gas = gastosMes(SM), dif = ing - gas;
    $('#sBal').innerHTML = '<div class="fn-kpi g"><b>' + plata(ing) + '</b><span>entró para Habitat (cuotas, siembras, libros)</span></div><div class="fn-kpi"><b>' + plata(gas) + '</b><span>gastos de Habitat (incluye fijos)</span></div><div class="fn-kpi ' + (dif < 0 ? 'r' : 'g') + '"><b>' + plata(dif) + '</b><span>' + (dif < 0 ? 'faltó para cubrir los gastos' : 'sobró este mes') + '</span></div><div class="fn-kpi"><b>' + plata(fam) + '</b><span>aporte de la familia registrado</span></div>';
    $('#sBalT').textContent = dif < 0 ? (fam >= -dif ? 'Lo que faltó lo cubrió el aporte de la familia.' : 'Faltan ' + plata(-dif - fam) + ' por explicar: si lo pusieron ustedes, cargalo en Ingresos como «Aporte de la familia».') : '';
    // por clasificar, agrupado por destino
    var P = S.filter(function (x) { return x.tipo === 'Por clasificar'; });
    var G = {}; P.forEach(function (x) { var k = x.destino || x._id; (G[k] = G[k] || { k: k, L: [], t: 0 }).L.push(x); G[k].t += +x.monto || 0; });
    var GL = Object.keys(G).map(function (k) { return G[k]; }).sort(function (a, b) { return b.t - a.t; });
    $('#sPend').hidden = !P.length;
    $('#sPend').innerHTML = '<h2 class="tt-h">Salidas por clasificar · ' + GL.length + ' destino' + (GL.length === 1 ? '' : 's') + ' · ' + P.length + ' pagos</h2><p class="tt-tip">Elegí qué fue cada destino: se clasifican todos sus pagos y los próximos.</p>' + GL.map(function (g) {
      var x = g.L[0];
      return '<div class="fn-pr" data-k="' + esc(g.k) + '"><div class="w"><b>' + esc(x.title) + '</b><small>' + g.L.length + ' pago' + (g.L.length === 1 ? '' : 's') + ' · ' + plata(g.t) + ' · ' + esc(x.origen) + '</small></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><select data-t aria-label="Tipo">' + F.opts([['', 'Elegí qué fue']].concat(I.tiposSal.filter(function (t) { return t !== 'Por clasificar'; }).map(function (t) { return [t, t]; })), '') + '</select><select data-c aria-label="Categoría" hidden>' + F.opts(I.cats, 'Otros') + '</select><button class="tt-btn s" type="button">Aplicar</button></div></div>';
    }).join('');
    $$('#sPend .fn-pr').forEach(function (r) {
      var g = G[r.dataset.k], st = $('[data-t]', r), sc = $('[data-c]', r);
      st.onchange = function () { sc.hidden = st.value !== 'Gasto de Habitat'; };
      $('button', r).onclick = function () {
        if (!st.value) { F.toast('Elegí qué fue.'); return; }
        var b = this; b.disabled = true;
        api('POST', { op: 'salida', id: g.L[0]._id, tipo: st.value, categoria: sc.value, recordar: true }).then(function () { g.L.forEach(function (y) { y.tipo = st.value; y.categoria = sc.value; }); F.toast(g.L.length + ' pago' + (g.L.length === 1 ? '' : 's') + ' como ' + st.value + (st.value === 'Gasto de Habitat' ? ' (ya están en Gastos)' : '') + '.'); salidas(); }).catch(function (e) { b.disabled = false; F.toast(e.message); });
      };
    });
    var del = S.filter(function (x) { return x.mes === SM; }), por = {};
    del.forEach(function (x) { por[x.tipo] = (por[x.tipo] || 0) + (+x.monto || 0); });
    $('#sTot').innerHTML = I.tiposSal.filter(function (t) { return por[t]; }).map(function (t) { return '<div class="fn-kpi' + (t === 'Personal' ? '' : t === 'Gasto de Habitat' ? ' r' : '') + '"><b>' + plata(por[t]) + '</b><span>salidas · ' + esc(t) + '</span></div>'; }).join('');
    $('#sList').innerHTML = del.length ? del.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).map(function (x) { return '<div class="fn-g"><span style="width:10px;height:10px;border-radius:50%;background:' + ({ 'Gasto de Habitat': '#c96a5a', 'Personal': '#a07cc5', 'Entre cuentas propias': '#d9d2c3' }[x.tipo] || '#999') + '"></span><div class="w" data-id="' + esc(x._id) + '"><b>' + esc(x.title) + '</b><small>' + esc([x.fecha, x.tipo, x.tipo === 'Gasto de Habitat' ? x.categoria : '', x.origen].filter(Boolean).join(' · ')) + '</small></div><b>' + plata(x.monto) + '</b></div>'; }).join('') : '<p class="tt-empty">Sin salidas de Mercado Pago en este mes.</p>';
    $$('#sList .w').forEach(function (w) { w.onclick = function () { var x = S.find(function (y) { return y._id === w.dataset.id; }); salModal(x); }; });
  }
  function salModal(x) {
    F.modal('<form class="tt-form"><h2 class="w">' + esc(x.title) + ' · ' + plata(x.monto) + '</h2><p class="w tt-tip">' + esc([x.fecha, x.origen].join(' · ')) + '</p><label>Qué fue<select name="tipo">' + F.opts(I.tiposSal, x.tipo) + '</select></label><label>Categoría (si es de Habitat)<select name="cat">' + F.opts(I.cats, x.categoria || 'Otros') + '</select></label><label class="w" style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="rec" checked style="width:auto"> Aplicar a todos los pagos a este destino y recordar</label><div class="w tt-wa"><button class="tt-btn" type="submit">Guardar</button><button class="tt-btn s" type="button" data-close>Cancelar</button></div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) { e.preventDefault(); api('POST', { op: 'salida', id: x._id, tipo: f.tipo.value, categoria: f.cat.value, recordar: f.rec.checked }).then(function () { (I.salidas || []).forEach(function (y) { if (y._id === x._id || (f.rec.checked && y.destino && y.destino === x.destino)) { y.tipo = f.tipo.value; y.categoria = f.cat.value; } }); close(); F.toast('Guardado.'); salidas(); }).catch(function (e) { F.toast(e.message); }); };
    });
  }
  $('#sPrev').onclick = function () { SM = addM(SM, -1); salidas(); };
  $('#sNext').onclick = function () { SM = addM(SM, 1); salidas(); };

  /* ---------- Debi: pagó (Debi) y llegó (banco) ---------- */
  function fl(f) { if (!f) return '—'; var d = new Date(f + 'T12:00:00'); return d.getDate() + ' de ' + MESES[d.getMonth()]; }
  // Teléfono argentino → formato de wa.me (549 + área + número, sin 0 ni 15)
  function waNum(t) {
    var d = String(t || '').replace(/\D/g, ''); if (!d) return '';
    if (d.indexOf('549') === 0) return d;
    if (d.indexOf('54') === 0) d = d.slice(2);
    d = d.replace(/^0/, '');
    if (d.length === 12) { var m = d.match(/^(\d{2,4})15(\d{6,8})$/); if (m && (m[1] + m[2]).length === 10) d = m[1] + m[2]; }
    return d.length === 10 ? '549' + d : '';
  }
  function waLink(x, NM) {
    var a = (F.data().alumnos || []).find(function (y) { return y._id === x.alumnoId; }), n = a && waNum(a.telefono); if (!n) return '';
    var nom = String(NM[x.alumnoId] || x.title || '').split(/\s+/)[0], mes = MESES[+String(x.mes || x.fecha).slice(5, 7) - 1] || '';
    var t = 'Hola ' + nom + '! Te escribimos de Habitat 🙌🏽 El débito automático de tu cuota de ' + mes + ' por ' + plata(x.monto) + ' fue rechazado. Suele pasar cuando la tarjeta venció, se cambió o no tenía saldo ese día. ¿Lo podés revisar? Si cambiaste la tarjeta o la cuenta, avisanos y te ayudamos a actualizarla. Un abrazo';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(t);
  }
  function debi() {
    if (!I) { if (!cargando) cargando = api('GET').then(function (d) { I = d; cargando = null; debi(); }).catch(function (e) { $('#dLotes').innerHTML = '<p class="tt-empty">' + esc(e.message) + '</p>'; cargando = null; }); return; }
    var L = (I.debi || []).filter(function (x) { return x.estado === 'approved'; }), NM = nombres();
    $('#dOk').innerHTML = I.debiOk ? '✅ Debi conectado.' : '⚠️ Falta cargar la clave <b>DEBI_SECRET_KEY</b> en el gestor de claves de Wix.';
    var sum = function (A) { return A.reduce(function (a, x) { return a + (+x.monto || 0); }, 0); };
    var camino = L.filter(function (x) { return !x.llego && !(x.acreditacion && x.acreditacion < HOY); }), dem = L.filter(function (x) { return !x.llego && x.acreditacion && x.acreditacion < HOY; });
    var mesC = L.filter(function (x) { return x.mes === MES; }), lleg = L.filter(function (x) { return x.llego && x.llego.slice(0, 7) === MES; });
    var R = (I.debi || []).filter(function (x) { return x.estado === 'rejected' && x.fecha >= addM(MES, -2) + '-01' && !(I.debi || []).some(function (y) { return y.cliente === x.cliente && y.estado === 'approved' && y.fecha >= x.fecha; }); });
    var RG = {}; R.forEach(function (x) { var k = x.cliente || x._id; if (!RG[k] || RG[k].fecha < x.fecha) RG[k] = x; });
    var rk = Object.keys(RG);
    $('#dRech').hidden = !rk.length;
    $('#dRech').innerHTML = '<h2 class="tt-h">Débitos rechazados sin cobro posterior · ' + rk.length + '</h2><p class="tt-tip">También les aparece como alerta a los tutores de cada alumno.</p>' + rk.map(function (k) { var x = RG[k]; var wa = waLink(x, NM); return '<div class="fn-pr"><div class="w"><b>' + esc(NM[x.alumnoId] || x.title) + '</b><small>' + esc(fl(x.fecha)) + ' · ' + plata(x.monto) + (x.alumnoId ? '' : ' · sin alumno asociado') + (x.alumnoId && !wa ? ' · sin teléfono en Tutores' : '') + '</small></div><div style="display:flex;gap:6px;align-items:center"><span class="fn-st r">Rechazado</span>' + (wa ? '<a class="tt-btn s" href="' + esc(wa) + '" target="_blank" rel="noopener">Avisar por WhatsApp</a>' : '') + '</div></div>'; }).join('');
    $('#dKpi').innerHTML = '<div class="fn-kpi g"><b>' + plata(sum(mesC)) + '</b><span>cobrado por Debi este mes</span></div><div class="fn-kpi"><b>' + plata(sum(camino)) + '</b><span>en camino al banco</span></div><div class="fn-kpi ' + (dem.length ? 'r' : '') + '"><b>' + plata(sum(dem)) + '</b><span>demorado (pasó la fecha estimada)</span></div><div class="fn-kpi"><b>' + plata(sum(lleg)) + '</b><span>llegó al banco este mes</span></div>';
    // lotes por fecha estimada
    var G = {}; L.forEach(function (x) { var k = x.acreditacion || 'sin fecha'; (G[k] = G[k] || []).push(x); });
    var ks = Object.keys(G).sort().reverse().slice(0, 24);
    $('#dLotes').innerHTML = ks.length ? ks.map(function (k) {
      var A = G[k], ok = A.every(function (x) { return x.llego; }), late = !ok && k !== 'sin fecha' && k < HOY;
      return '<div class="fn-pr"><div class="w"><b>' + (k === 'sin fecha' ? 'Sin fecha estimada' : 'Lote del ' + fl(k)) + ' · ' + plata(sum(A)) + '</b><small>' + A.length + ' cobro' + (A.length === 1 ? '' : 's') + ' · ' + esc(A.slice(0, 6).map(function (x) { return NM[x.alumnoId] || x.title; }).join(', ')) + (A.length > 6 ? '…' : '') + '</small></div>' + (ok ? '<span class="fn-st g">Llegó el ' + esc(fl(A[0].llego)) + '</span>' : (late ? '<span class="fn-st r">Demorado</span> ' : '<span class="fn-st">En camino</span> ') + (k === 'sin fecha' ? '' : '<button class="tt-btn s" type="button" data-l="' + esc(k) + '">Llegó al banco</button>')) + '</div>';
    }).join('') : '<p class="tt-empty">Todavía no hay cobros de Debi. Tocá «Traer cobros de Debi».</p>';
    $$('#dLotes [data-l]').forEach(function (b) { b.onclick = function () { b.disabled = true; api('POST', { op: 'debi', accion: 'llego', lote: b.dataset.l, fecha: HOY }).then(function (r) { (I.debi || []).forEach(function (x) { if (x.acreditacion === b.dataset.l && x.estado === 'approved') x.llego = HOY; }); F.toast('Lote marcado: ' + r.cambiados + ' cobros llegaron al banco.'); debi(); }).catch(function (e) { b.disabled = false; F.toast(e.message); }); }; });
    // sin asociar a un alumno
    var S = {}; L.forEach(function (x) { if (!x.alumnoId) (S[x.cliente || x._id] = S[x.cliente || x._id] || []).push(x); });
    var sk = Object.keys(S), al = (F.data().alumnos || []).slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    $('#dSin').hidden = !sk.length;
    $('#dSin').innerHTML = '<h2 class="tt-h">Clientes de Debi sin alumno · ' + sk.length + '</h2><p class="tt-tip">No encontramos al alumno por nombre o email. Elegilo una vez y queda recordado; sus cuotas pasan a Cobros.</p>' + sk.map(function (k) { var A = S[k], x = A[0]; return '<div class="fn-pr" data-k="' + esc(x._id) + '"><div class="w"><b>' + esc(x.title) + '</b><small>' + esc(x.email || '') + ' · ' + A.length + ' cobro' + (A.length === 1 ? '' : 's') + ' · ' + plata(sum(A)) + '</small></div><div style="display:flex;gap:6px"><select aria-label="Alumno">' + F.opts([['', 'Elegí al alumno']].concat(al.map(function (a) { return [a._id, a.title]; })), '') + '</select><button class="tt-btn s" type="button">Asociar</button></div></div>'; }).join('');
    $$('#dSin .fn-pr').forEach(function (r) { var sel = $('select', r); $('button', r).onclick = function () { if (!sel.value) { F.toast('Elegí al alumno.'); return; } api('POST', { op: 'debi', accion: 'asociar', id: r.dataset.k, alumnoId: sel.value }).then(function () { return api('GET'); }).then(function (d) { I = d; F.toast('Asociado.'); debi(); }).catch(function (e) { F.toast(e.message); }); }; });
  }
  $('#dTraer').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Trayendo…'; api('POST', { op: 'debi', accion: 'traer', dias: 120 }).then(function (r) { F.toast('Revisamos ' + r.vistos + ' cobros de Debi · ' + r.nuevos + ' nuevos · ' + r.aCobros + ' cargados en Cobros.'); return api('GET'); }).then(function (d) { I = d; debi(); }).catch(function (e) { F.toast(e.message); }).finally(function () { b.disabled = false; b.textContent = 'Traer cobros de Debi'; }); };
  window.HabIngresos = { render: render, salidas: salidas, debi: debi };
})();
