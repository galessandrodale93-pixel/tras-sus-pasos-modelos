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

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/juego.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { await load(); }
    catch (e) { $('#ttHola').textContent = e.status === 403 ? 'Este panel es de la dirección' : 'No se pudo cargar el panel'; $('#ttWho').textContent = e.status === 403 ? 'Las estadísticas del juego las ven los directores de Habitat.' : 'Revisá tu conexión y recargá la página.'; $('.tt-main').innerHTML = ''; return; }
    var h = new Date().getHours();
    $('#ttHola').textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + String((ME && ME.title) || '').split(' ')[0];
    $('#ttWho').textContent = 'Estadísticas del juego Kids & Hero';
  })();
})();
