/* Panel «Juego»: estadísticas de Kids & Hero para la dirección (cuánto juegan, a qué hora, por dónde arrancan, qué hacen, con quién y el pase). */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { return (Number(n) || 0).toLocaleString('es-AR'); }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '–'; }
  function hs(h) { h = Number(h) || 0; if (h < 1) return Math.round(h * 60) + ' min'; if (h < 48) return (Math.round(h * 10) / 10).toString().replace('.', ',') + ' h'; return Math.round(h / 24) + ' días'; }
  function mins(m) { m = Number(m) || 0; return m < 60 ? (Math.round(m * 10) / 10).toString().replace('.', ',') + ' min' : hs(m / 60); }
  async function token() { await A.api('GET', '/members/v1/members/my'); try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } }
  var F = { dias: 30, tester: false }, ME = null;

  function kpi(v, l, s) { return '<div class="kj-kpi"><b>' + v + '</b><span>' + esc(l) + '</span>' + (s ? '<small>' + esc(s) + '</small>' : '') + '</div>'; }
  function card(t, sub, inner) { return '<section class="kj-card"><h3>' + esc(t) + '</h3>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + inner + '</section>'; }
  function rows(L, fmt) {
    if (!L || !L.length) return '<p class="kj-none">Todavía no hay datos.</p>';
    var mx = Math.max.apply(null, L.map(function (x) { return x[1]; })) || 1;
    return '<div class="kj-rows">' + L.map(function (x) { return '<div class="kj-row"><span title="' + esc(x[0]) + '">' + esc(x[0]) + '</span><div><i style="width:' + Math.max(2, x[1] / mx * 100) + '%"></i></div><b>' + (fmt ? fmt(x[1]) : num(x[1])) + '</b></div>'; }).join('') + '</div>';
  }
  function cols(V, labels, fmt) {
    var mx = Math.max.apply(null, V) || 1, hi = V.indexOf(Math.max.apply(null, V));
    return '<div class="kj-cols">' + V.map(function (v, i) { return '<div class="kj-col" title="' + esc(labels[i]) + ': ' + esc(fmt ? fmt(v) : v) + '"><i class="' + (i === hi && v ? 'hi' : '') + '" style="height:' + Math.max(1, v / mx * 100) + '%"></i><small>' + esc(labels[i]) + '</small></div>'; }).join('') + '</div>';
  }

  function render(D) {
    var R = D.resumen, P = D.pase;
    var out = '<div class="kj-kpis">' +
      kpi(num(R.jugadores), 'Jugadores', R.conCuenta + ' con cuenta') +
      kpi(num(R.sesiones), 'Sesiones', R.sesPorJugador.toString().replace('.', ',') + ' por jugador') +
      kpi(hs(R.horas), 'Tiempo total jugado', '') +
      kpi(mins(R.minProm), 'Por sesión, en promedio', 'la mitad juega menos de ' + mins(R.minMed)) +
      kpi(hs(R.horasJugadorMed), 'Juego acumulado (mediana)', 'por jugador, desde que empezó') +
      kpi(pct(R.vuelven, R.jugadores), 'Vuelven otro día', R.diasProm.toString().replace('.', ',') + ' días distintos en promedio') +
      kpi(pct(R.conAmigos, R.sesiones), 'Sesiones con amigos', R.amigosMax ? 'hasta ' + R.amigosMax + ' en una sala' : 'en una sala') +
      kpi(pct(R.hero, R.sesiones), 'Hero', pct(R.kids, R.sesiones) + ' Kids') + '</div>';

    out += '<div class="kj-grid">' +
      card('A qué hora juegan', 'Minutos jugados según la hora del día (hora de Argentina).', cols(D.horas, D.horas.map(function (_, i) { return i % 3 ? '' : String(i); }), mins)) +
      card('Qué días juegan', 'Minutos jugados por día de la semana.', cols(D.dias, ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], mins)) +
      card('Día a día', 'Sesiones por día en el período.', cols(D.fechas.map(function (f) { return f[1]; }), D.fechas.map(function (f, i, L) { return i === 0 || i === L.length - 1 ? f[0].slice(8, 10) + '/' + f[0].slice(5, 7) : ''; }), num)) +
      '</div>';

    out += '<div class="kj-grid">' +
      card('El cierre del pase', 'Quienes llegaron a las 6 horas gratis o terminaron la etapa 6, y qué hicieron después.',
        '<div class="kj-big"><div><b>' + num(P.llegaron) + '</b><span>llegaron al cierre</span></div><div><b>' + num(P.pagaron) + '</b><span>pagaron (' + pct(P.pagaron, P.llegaron) + ')</span></div><div><b>' + (P.pagaron ? hs(P.horasHastaPagarMed) : '–') + '</b><span>tardan en pagar (mediana)</span></div><div><b>' + num(P.pagaronEn24h) + '</b><span>pagaron el mismo día</span></div><div><b>' + num(P.dejaron) + '</b><span>no volvieron en 7 días</span></div><div><b>' + num(P.esperando) + '</b><span>volvieron hace poco, sin pagar</span></div><div><b>' + String(P.vistasProm).replace('.', ',') + '</b><span>veces que ven el cartel</span></div></div>') +
      card('Hasta dónde llegan', 'Jugadores que llegaron a cada etapa.', rows(D.embudo)) +
      card('Niveles', 'Nivel más alto de cada jugador.', rows(D.niveles)) +
      '</div>';

    out += '<div class="kj-grid">' +
      card('Por dónde arrancan', 'Etapa de la primera sesión de cada jugador.', rows(D.arranque.etapa)) +
      card('El primer lugar que visitan', 'Primer escenario al que se acercan en su primera sesión.', rows(D.arranque.lugar)) +
      card('Lugares más visitados', 'Sesiones en las que se acercaron a cada escenario.', rows(D.lugares)) +
      '</div>';

    out += '<div class="kj-grid">' +
      card('Misiones cumplidas', 'Las que más hacen.', rows(D.misiones)) +
      card('Minijuegos', 'Veces que jugaron cada uno.', rows(D.juegos)) +
      card('Exámenes aprobados', 'Por etapa.', rows(D.examenes)) +
      '</div>';

    var fps = Object.keys(D.aparatos.fps || {}).map(function (k) { return [k === 'pc' ? 'Computadora' : k === 'celular' ? 'Celular o tablet' : k, D.aparatos.fps[k]]; });
    out += '<div class="kj-grid">' +
      card('Desde dónde juegan', '', rows(D.aparatos.disp.map(function (x) { return [x[0] === 'pc' ? 'Computadora' : x[0] === 'celular' ? 'Celular o tablet' : x[0], x[1]]; })) + rows(D.aparatos.so)) +
      card('Cómo les anda', 'Cuadros por segundo (mediana) y calidad gráfica que elige el juego.', rows(fps, function (v) { return v + ' fps'; }) + rows(D.aparatos.calidad)) +
      '</div>';
    var M = D.modelos || [];
    var ap = !M.length ? '<p class="kj-none">Todavía no hay datos de aparatos (se juntan solos desde esta versión del juego).</p>' :
      '<div class="kj-ap"><div class="kj-ap-r kj-h"><span>Aparato</span><span class="kj-x">Sistema y navegador</span><b>Cuadros</b><b>Sesiones</b><span>Cómo le anda</span></div>' +
      M.map(function (a) {
        var st = (a.cortes || a.caidas) ? '<span class="kj-mal">Se cortó ' + (a.cortes + a.caidas) + (a.cortes + a.caidas === 1 ? ' vez' : ' veces') + '</span>' : !a.fps ? '<span>–</span>' : a.fps < 20 ? '<span class="kj-lento">Lento</span>' : '<span class="kj-ok">Anda bien</span>';
        return '<div class="kj-ap-r"><span>' + esc(a.modelo) + '<small>' + esc([a.placa, a.mem ? a.mem + ' GB' : ''].filter(Boolean).join(' · ')) + '</small></span><span class="kj-x">' + esc(a.so || '–') + '<small>' + esc(a.nav || '') + '</small></span><b>' + (a.fps ? a.fps + ' fps' : '–') + '</b><b>' + num(a.ses) + '</b>' + st + '</div>';
      }).join('') + '</div>';
    var Z = D.zonas || [];
    out += card('Dónde se pone lento', 'Cuadros por segundo en cada lugar del mapa, sumando todas las sesiones (primero los más lentos). «Lento» es la parte del tiempo que anduvo por debajo de 20 cuadros.', !Z.length ? '<p class="kj-none">Todavía no hay datos por lugar (se juntan solos desde esta versión del juego).</p>' :
      '<div class="kj-ap"><div class="kj-ap-r kj-h"><span>Lugar</span><b>Cuadros</b><b>Lento</b><b>Sesiones</b><span>En celular</span></div>' + Z.map(function (z) { return '<div class="kj-ap-r"><span>' + esc(z.z) + '</span><b>' + z.fps + ' fps</b><b>' + z.lento + '%</b><b>' + num(z.ses) + '</b><span>' + num(z.cel) + '</span></div>'; }).join('') + '</div>');
    out += card('Cada aparato', 'Lo manda el juego solo, sin preguntar nada: modelo, sistema, placa de video y cuadros por segundo. «Se cortó» cuenta las veces que la pantalla se reinició o el juego se cerró de golpe.', ap);
    $('#kOut').innerHTML = out;
    $('#kUpd').textContent = 'Actualizado ' + new Date(D.actualizado).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  async function load() {
    $('#kOut').innerHTML = '<p class="tt-empty">Cargando…</p>';
    var r = await fetch('/api/kh-stats?dias=' + F.dias + (F.tester ? '&tester=1' : ''), { headers: { 'x-habitat-auth': await token() } });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No se pudo cargar.'); er.status = r.status; throw er; }
    ME = j.me; render(j); return j;
  }

  $$('#kDias button').forEach(function (b) { b.onclick = function () { $$('#kDias button').forEach(function (x) { x.classList.toggle('on', x === b); }); F.dias = +b.dataset.d; load().catch(function (e) { $('#kOut').innerHTML = '<p class="tt-empty">' + esc(e.message) + '</p>'; }); }; });
  $('#kTester').onchange = function () { F.tester = this.checked; load().catch(function (e) { $('#kOut').innerHTML = '<p class="tt-empty">' + esc(e.message) + '</p>'; }); };


  /* reportes de los testers (página reportar.html) */
  var RF = 'Pendiente', REP = [];
  function fdate(t) { var d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
  function renderRep() {
    var L = REP.filter(function (r) { return !RF || r.estado === RF; }), pend = REP.filter(function (r) { return r.estado !== 'Resuelto'; }).length;
    $('#krF button').textContent = 'Pendientes' + (pend ? ' (' + pend + ')' : '');
    $('#krOut').innerHTML = L.length ? '<div class="kr-l">' + L.map(function (r) {
      var ok = r.estado === 'Resuelto';
      return '<article class="kr-it' + (ok ? ' res' : '') + '"><div class="kr-m"><b>' + esc(r.nombre || 'Sin nombre') + '</b>' + (r.rama ? '<span class="kr-tag">' + (r.rama === 'hero' ? 'Hero' : 'Kids') + '</span>' : '') + (r.donde ? '<span>📍 ' + esc(r.donde) + '</span>' : '') + '<span>' + esc(fdate(r.fecha)) + '</span>' + (r.contacto ? '<span>✉️ ' + esc(r.contacto) + '</span>' : '') + '</div>' +
        '<button class="kr-b' + (ok ? '' : ' ok') + '" data-id="' + esc(r.id) + '" data-e="' + (ok ? 'Pendiente' : 'Resuelto') + '">' + (ok ? 'Volver a pendiente' : '✓ Resuelto') + '</button>' +
        '<p class="kr-t">' + esc(r.texto) + '</p>' + (r.captura ? '<div class="kr-c"><img src="' + esc(r.captura) + '" alt="Captura"></div>' : '') + '<div class="kr-d" title="' + esc(r.disp) + '">' + esc(r.disp) + '</div></article>';
    }).join('') + '</div>' : '<p class="tt-empty">' + (RF === 'Pendiente' ? 'No hay reportes pendientes. 🙌' : 'Todavía no hay reportes.') + '</p>';
    $$('#krOut .kr-b').forEach(function (b) { b.onclick = async function () { b.disabled = true; var r = await fetch('/api/kh-reporte', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-habitat-auth': await token() }, body: JSON.stringify({ id: b.dataset.id, estado: b.dataset.e }) }); if (r.ok) { REP.forEach(function (x) { if (x.id === b.dataset.id) x.estado = b.dataset.e; }); renderRep(); } else b.disabled = false; }; });
    $$('#krOut .kr-c img').forEach(function (im) { im.onclick = function () { var d = document.createElement('div'); d.className = 'kr-big'; d.innerHTML = '<img src="' + im.src + '" alt="">'; d.onclick = function () { d.remove(); }; document.body.appendChild(d); }; });
  }
  async function loadRep() {
    $('#reportes').hidden = false;
    try { var r = await fetch('/api/kh-reporte', { headers: { 'x-habitat-auth': await token() } }); var j = await r.json(); if (!r.ok) throw new Error(j.error || 'No se pudo cargar.'); REP = j.items || []; renderRep(); }
    catch (e) { $('#krOut').innerHTML = '<p class="tt-empty">' + esc(e.message) + '</p>'; }
  }
  $$('#krF button').forEach(function (b) { b.onclick = function () { $$('#krF button').forEach(function (x) { x.classList.toggle('on', x === b); }); RF = b.dataset.f; renderRep(); }; });

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/juego.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { await load(); loadRep(); if (location.hash === '#reportes') setTimeout(function () { $('#reportes').scrollIntoView({ behavior: 'smooth' }); }, 300); }
    catch (e) { $('#ttHola').textContent = e.status === 403 ? 'Este panel es de la dirección' : 'No se pudo cargar el panel'; $('#ttWho').textContent = e.status === 403 ? 'Las estadísticas del juego las ven los directores de Habitat.' : 'Revisá tu conexión y recargá la página.'; $('.tt-main').innerHTML = ''; return; }
    var h = new Date().getHours();
    $('#ttHola').textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + String((ME && ME.title) || '').split(' ')[0];
    $('#ttWho').textContent = 'Estadísticas del juego Kids & Hero';
  })();
})();
