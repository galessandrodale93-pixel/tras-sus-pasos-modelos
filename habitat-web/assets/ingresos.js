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
  var COL = { 'Siembra automática': '#2f6b4f', 'Siembra puntual': '#6fa585', 'Libros': '#b8904f', 'Efectivo': '#8a6a2f', 'Cuota de alumno (MP)': '#3e6690', 'Otro': '#9aa3a0', 'Transferencia entre cuentas propias': '#d9d2c3', 'Por clasificar': '#c96a5a', 'Cuotas (Debi/Payway)': '#cfd8d3' };
  var I = null, cargando = null;
  var NO_SUMA = ['Transferencia entre cuentas propias'];
  function suma(x) { return NO_SUMA.indexOf(x.tipo) < 0; }
  var GUIA = {
    'Siembra automática': 'Un sembrador que aporta todos los meses con suscripción de Mercado Pago.',
    'Siembra puntual': 'Una ofrenda o donación de una vez, por link, transferencia o QR.',
    'Libros': 'Venta de libros (Asombro u otros).',
    'Efectivo': 'Plata en mano: se carga con «Cargar efectivo u otro ingreso».',
    'Cuota de alumno (MP)': 'Un alumno que pagó su cuota por Mercado Pago en lugar de Debi. Además registrala en Cobros con su escuela y mes.',
    'Transferencia entre cuentas propias': 'Plata que pasa de la cuenta de Agustina (donde caen Debi y Payway) a esta cuenta. Ya está contada en Cobros, así que acá no suma.',
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
    // por clasificar
    var P = I.ingresos.filter(function (x) { return x.tipo === 'Por clasificar'; }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    $('#iPend').hidden = !P.length;
    $('#iPend').innerHTML = '<h2 class="tt-h">Por clasificar · ' + P.length + '</h2>' + P.map(function (x) { return '<div class="fn-pr" data-id="' + esc(x._id) + '"><div class="w"><b>' + esc(x.title) + ' · ' + plata(x.monto) + '</b><small>' + esc([x.fecha, x.email, x.descripcion].filter(Boolean).join(' · ')) + '</small></div><button class="tt-btn s" type="button">Clasificar</button></div>'; }).join('');
    $$('#iPend .fn-pr').forEach(function (r) { $('button', r).onclick = function () { clasificar(I.ingresos.find(function (x) { return x._id === r.dataset.id; })); }; });
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
      f.onsubmit = function (e) { e.preventDefault(); api('POST', { op: 'clasificar', id: x._id, tipo: f.tipo.value, alumnoId: f.alumnoId.value, recordar: f.rec.checked }).then(function (r) { upd(r.item); if (f.rec.checked) I.ingresos.forEach(function (y) { if (y.pagador && y.pagador === x.pagador && y.tipo === 'Por clasificar') { y.tipo = r.item.tipo; y.alumnoId = r.item.alumnoId; } }); close(); F.toast('Clasificado.'); render(); }).catch(function (e) { F.toast(e.message); }); };
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
  $('#iTraer').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Trayendo…'; api('POST', { op: 'traer', dias: 90 }).then(function (r) { F.toast('Revisamos ' + r.vistos + ' pagos de los últimos 90 días · ' + r.nuevos + ' nuevos.'); return api('GET'); }).then(function (d) { I = d; render(); }).catch(function (e) { F.toast(e.message); }).finally(function () { b.disabled = false; b.textContent = 'Traer pagos de Mercado Pago'; }); };
  var gd = document.getElementById('iGuia'); if (gd) gd.innerHTML = Object.keys(GUIA).filter(function (k) { return k !== 'Por clasificar'; }).map(function (k) { return '<p style="margin:6px 0"><b>' + esc(k) + '.</b> ' + esc(GUIA[k]) + '</p>'; }).join('') + '<p style="margin:10px 0 0"><b>Lo que sale de la cuenta</b> no aparece acá: si se pagó algo de Habitat, se carga en Gastos; si fue un gasto personal, queda afuera del panel.</p>';
  window.HabIngresos = { render: render };
})();
