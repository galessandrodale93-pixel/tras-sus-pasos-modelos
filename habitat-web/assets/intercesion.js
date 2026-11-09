/* Intercesión y ayuno: el día (foco, versículo NTV, devocional y oración guiada), turnos, pedidos y ayuno. */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var DL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], MS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function larga(f) { var d = new Date(f + 'T12:00:00'); return DL[d.getDay()] + ' ' + d.getDate() + ' de ' + MS[d.getMonth()]; }
  var T = new Date(), HOY = T.getFullYear() + '-' + ('0' + (T.getMonth() + 1)).slice(-2) + '-' + ('0' + T.getDate()).slice(-2);
  function toast(t) { var e = $('#ttToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 3000); }
  async function token() { await A.api('GET', '/members/v1/members/my'); try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } }
  async function api(method, body) {
    var r = await fetch('/api/oracion', { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await token() }, body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No se guardó. Probá de nuevo.'); er.status = r.status; throw er; }
    return j;
  }
  var D = null;
  async function reload() { D = await api('GET'); refresh(); }

  function renderHoy() {
    var d = D.hoy, t = D.turnos.find(function (x) { return x.fecha === HOY; }) || {}, o = d.oracion;
    var yo = t.responsableId === D.me.id, sumado = (t.sumados || []).indexOf(D.me.nombre) >= 0;
    $('#oHoy').innerHTML = '<p class="or-foco">' + esc(larga(HOY)) + ' · ' + esc(d.foco) + '</p>' +
      '<p class="tt-tip">' + (yo ? '🙏 Hoy estás a cargo de la intercesión.' : t.responsable ? 'Hoy está a cargo <b>' + esc(t.responsable) + '</b>' + ((t.sumados || []).length ? ' · se suman: ' + esc(t.sumados.join(', ')) : '') + '.' : '') + '</p>' +
      '<blockquote class="or-v">«' + esc(d.verso.texto) + '»<cite>' + esc(d.verso.ref) + ' (NTV)</cite></blockquote>' +
      '<p>' + esc(d.devocional) + '</p>' +
      '<h2 class="tt-h" style="margin:6px 0 0">Oración guiada</h2><div class="or-pasos">' + [['Adoración', o.adoracion], ['Gratitud', o.gratitud], ['Intercesión', o.intercesion], ['Entrega', o.entrega]].map(function (p, i) { return '<div class="or-paso' + (i === 0 ? ' on' : '') + '" data-i="' + i + '"><b>' + (i + 1) + ' · ' + p[0] + '</b>' + esc(p[1]) + '</div>'; }).join('') + '</div>' +
      '<div class="tt-wa"><button class="tt-btn s" type="button" id="oSig">Siguiente paso</button>' + (yo || sumado ? '' : '<button class="tt-btn" type="button" id="oSumo">Me sumo hoy</button>') + '</div>' +
      '<p class="tt-tip">Mañana: ' + esc(D.manana.foco) + '. Tenés los pedidos del equipo y de los profes en la pestaña Pedidos.</p><p class="or-ntv">Texto bíblico: ' + esc(D.ntv) + '</p>';
    var k = 0; $('#oSig').onclick = function () { k = (k + 1) % 4; $$('.or-paso').forEach(function (e) { e.classList.toggle('on', +e.dataset.i === k); }); $('.or-paso.on').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    var b = $('#oSumo'); if (b) b.onclick = function () { api('POST', { op: 'sumarme', fecha: HOY }).then(function () { toast('¡Gracias por sumarte! 🙌🏽'); return reload(); }).catch(function (e) { toast(e.message); }); };
  }
  function renderTurnos() {
    var mios = D.turnos.filter(function (t) { return t.responsableId === D.me.id; });
    $('#oTur').innerHTML = D.turnos.map(function (t) {
      var mio = t.responsableId === D.me.id;
      return '<div class="or-row' + (mio ? ' mio' : '') + '"><div class="w"><b>' + esc(larga(t.fecha)) + ' · ' + esc(t.responsable || '—') + '</b><small>' + esc(t.foco) + ((t.sumados || []).length ? ' · se suman: ' + esc(t.sumados.join(', ')) : '') + '</small></div><div>' + (mio || D.me.admin ? '<select data-c="' + t.fecha + '" aria-label="Cambiar con"><option value="">' + (mio ? 'Cambiar mi turno…' : 'Cambiar…') + '</option>' + D.turnos.filter(function (x) { return x.fecha !== t.fecha && x.responsableId !== t.responsableId; }).map(function (x) { return '<option value="' + x.fecha + '">con ' + esc(x.responsable) + ' (' + esc(larga(x.fecha)) + ')</option>'; }).join('') + '</select>' : '') + '</div></div>';
    }).join('') || '<p class="tt-empty">Todavía no hay turnos.</p>';
    $$('#oTur [data-c]').forEach(function (s) { s.onchange = function () { if (!s.value) return; api('POST', { op: 'cambiar', fecha: s.dataset.c, con: s.value }).then(function () { toast('Turno cambiado. Le avisamos a la otra persona.'); return reload(); }).catch(function (e) { toast(e.message); }); }; });
    $('#oIcs').innerHTML = (mios.length ? 'Tus próximos turnos: ' + mios.map(function (t) { return larga(t.fecha); }).join(', ') + '. ' : '') + (D.me.ics ? 'Tus turnos y tus días de ayuno están en tu calendario de «Mi servicio», con recordatorio. <a href="' + esc(D.me.ics.replace('https://', 'webcal://')) + '">Agregar el calendario</a>' : '') + ' La noche anterior y esa mañana te llega un mail con el foco, el versículo y la oración.';
  }
  function renderPedidos() {
    $('#oPeds').innerHTML = D.pedidos.map(function (p) { var ok = p.estado === 'Respondida'; return '<div class="or-row"><div class="w"><b>' + esc(p.texto) + '</b><small>' + esc(p.title || '') + ' · ' + esc(p.fuente || '') + ' · ' + esc(p.fecha || '') + (ok ? ' · respondida el ' + esc(p.respondida) : '') + '</small></div><div>' + (ok ? '<span class="or-tag g">Respondida 🙌🏽</span>' : '<button class="tt-btn s" type="button" data-r="' + esc(p._id) + '">Respondida</button>') + '</div></div>'; }).join('') || '<p class="tt-empty">Todavía no hay pedidos.</p>';
    $$('#oPeds [data-r]').forEach(function (b) { b.onclick = function () { api('POST', { op: 'respondida', id: b.dataset.r }).then(function () { toast('¡Gloria a Dios! 🙌🏽'); return reload(); }); }; });
  }
  $('#oPed').onsubmit = function (e) { e.preventDefault(); var f = this; api('POST', { op: 'pedido', texto: f.texto.value, de: f.de.value }).then(function () { f.reset(); toast('Pedido sumado.'); return reload(); }).catch(function (er) { toast(er.message); }); };
  function renderAyuno() {
    var mios = D.ayuno.filter(function (a) { return a.voluntarioId === D.me.id && a.fecha >= HOY; });
    $('#oMiAy').innerHTML = '<h2 class="tt-h" style="margin:8px 0">Mis días de ayuno</h2>' + (mios.length ? mios.map(function (a) { return '<div class="or-row mio"><div class="w"><b>' + esc(larga(a.fecha)) + '</b><small>Te avisamos 3 días antes y está en tu calendario.</small></div><select data-t="' + esc(a.id) + '" aria-label="Tipo de ayuno"><option value="">Elegí el tipo (opcional)</option>' + D.tiposAyuno.map(function (t) { return '<option value="' + t.id + '"' + (a.tipo === t.id ? ' selected' : '') + '>' + esc(t.titulo) + '</option>'; }).join('') + '</select></div>'; }).join('') : '<p class="tt-tip">Todavía no tenés días asignados. La rotación se publica por adelantado.</p>');
    $$('#oMiAy [data-t]').forEach(function (s) { s.onchange = function () { api('POST', { op: 'tipoAyuno', id: s.dataset.t, tipo: s.value }).then(function () { toast('Guardado.'); }); }; });
    var G = {}; D.ayuno.forEach(function (a) { (G[a.mes] = G[a.mes] || []).push(a); });
    $('#oAy').innerHTML = Object.keys(G).sort().map(function (m) { return '<h2 class="tt-h" style="margin:10px 0 4px">Rotación de ' + MS[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4) + '</h2>' + G[m].map(function (a) { return '<div class="or-row' + (a.voluntarioId === D.me.id ? ' mio' : '') + '"><div class="w"><b>' + esc(larga(a.fecha)) + '</b><small>' + esc(a.nombre) + '</small></div><span></span></div>'; }).join(''); }).join('') || '<p class="tt-empty">Todavía no se publicó la rotación de ayuno.</p>';
    $('#oPub').hidden = !D.me.admin;
    if (D.me.admin) {
      var nm = new Date(T.getFullYear(), T.getMonth() + 1, 1), mv = nm.getFullYear() + '-' + ('0' + (nm.getMonth() + 1)).slice(-2);
      $('#oPub').innerHTML = '<div class="tt-bar"><label>Publicar desde <input type="month" id="oMes" value="' + mv + '"></label><select id="oMeses"><option value="1">1 mes</option><option value="3">3 meses</option></select><button class="tt-btn" type="button" id="oPubB">Publicar rotación de ayuno</button></div><p class="tt-tip">El ayuno va con el turno: el mismo día que a alguien le toca la intercesión, esa persona también ayuna. Con 10 personas, a cada uno le toca cada 10 días. Si se cambia un turno, el ayuno se mueve con él. Cada día queda en el calendario de quien le toca, con aviso 3 días antes.</p>';
      $('#oPubB').onclick = function () { api('POST', { op: 'publicarAyuno', mes: $('#oMes').value, meses: $('#oMeses').value }).then(function (r) { toast('Publicado: ' + r.resultado.join(' · ')); return reload(); }).catch(function (e) { toast(e.message); }); };
    }
    $('#oTipos').innerHTML = D.tiposAyuno.map(function (t) { return '<div class="or-tipo" id="t-' + t.id + '"><h3>' + esc(t.titulo) + '</h3><p>' + esc(t.como) + '</p><small><b>Base bíblica:</b> ' + esc(t.base) + '</small><small><b>Cuidados:</b> ' + esc(t.cuidado) + '</small></div>'; }).join('');
    $('#oSalud').textContent = D.salud;
  }
  function cur() { var b = $('#ttTabs .on'); return b ? b.dataset.t : 'hoy'; }
  function refresh() { ({ hoy: renderHoy, turnos: renderTurnos, pedidos: renderPedidos, ayuno: renderAyuno }[cur()] || renderHoy)(); }
  function tab(t) { var b = $('#ttTabs [data-t="' + t + '"]'); if (!b) return; $$('#ttTabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tt-v').forEach(function (v) { v.hidden = v.id !== 'v-' + t; }); refresh(); }
  $$('#ttTabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.t); }; });

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/intercesion.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { D = await api('GET'); }
    catch (e) { $('#ttHola').textContent = 'Intercesión y ayuno'; $('#ttWho').textContent = e.status === 403 ? 'Esta página es del equipo de voluntarios de Habitat.' : 'Revisá tu conexión y recargá la página.'; $('.tt-main').innerHTML = ''; return; }
    $('#ttHola').textContent = 'Hola, ' + String(D.me.nombre || '').split(' ')[0];
    $('#ttWho').textContent = 'Sostenemos a Habitat en oración, un día a la vez.';
    var hh = location.hash.replace('#', ''); if (hh && $('#ttTabs [data-t="' + hh + '"]')) tab(hh); else renderHoy();
  })();
})();
