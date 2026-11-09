/* Campus: opinar sobre la última clase, ver el material que subieron los profes y el buzón de ideas. */
(function () {
  var A = window.HabitatAuth; if (!A || !A.loggedIn()) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var DL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], MS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function pd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function larga(s) { var d = pd(s); return DL[d.getDay()] + ' ' + d.getDate() + ' de ' + MS[d.getMonth()]; }
  var CARAS = [['1', '😣', 'Me costó'], ['2', '😕', 'Regular'], ['3', '🙂', 'Bien'], ['4', '😊', 'Muy buena'], ['5', '🤩', 'Increíble']];
  function ico(m) { m = m || ''; return /pdf/.test(m) ? '📄' : /presentation|powerpoint|keynote/.test(m) ? '🖥️' : /image/.test(m) ? '🖼️' : /audio/.test(m) ? '🎧' : '📎'; }
  var tk = '';
  function post(b) { return fetch('/api/opina', { method: 'POST', headers: { 'content-type': 'application/json', 'x-habitat-auth': tk }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function gracias(el, t) { el.innerHTML = '<div class="op-ok"><em>🙌🏽</em><b>¡Gracias!</b><p>' + t + '</p></div>'; }
  function card(c) {
    var el = document.createElement('div'); el.className = 'op-card'; var V = { animo: '' };
    el.innerHTML = '<span class="ck">' + esc(c.programa || '') + ' · ' + larga(c.fecha) + '</span><h3>' + esc(c.title || 'Clase') + (c.profe ? ' · ' + esc(c.profe) : '') + '</h3>' +
      '<div class="op-faces" role="group" aria-label="¿Cómo te fue?">' + CARAS.map(function (x) { return '<button type="button" data-v="' + x[0] + '"><em>' + x[1] + '</em>' + x[2] + '</button>'; }).join('') + '</div>' +
      '<form class="op-f" hidden><label>¿Qué te llevás de esta clase?<textarea name="gusto" rows="3" placeholder="Algo que te gustó, que te habló o que te sirvió."></textarea></label><label>¿Algo para mejorar?<textarea name="mejora" rows="2" placeholder="Opcional."></textarea></label><button type="submit" class="op-btn">Enviar</button><small style="color:var(--muted)">El profe lo lee sin tu nombre.</small></form>';
    $$('.op-faces button', el).forEach(function (b) { b.onclick = function () { V.animo = b.dataset.v; $$('.op-faces button', el).forEach(function (x) { x.classList.toggle('on', x === b); }); var f = $('form', el); f.hidden = false; f.gusto.focus(); }; });
    $('form', el).onsubmit = async function (e) { e.preventDefault(); var f = e.target, bt = $('button[type=submit]', f); bt.disabled = true;
      var r = await post({ tipo: 'clase', claseId: c.id, animo: V.animo, gusto: f.gusto.value, mejora: f.mejora.value }).catch(function () { return {}; });
      if (r.ok) gracias(el, 'Tu opinión ayuda a que cada clase sea mejor.'); else { bt.disabled = false; bt.textContent = r.error || 'Probá de nuevo'; } };
    return el;
  }
  (async function () {
    try { await A.api('GET', '/members/v1/members/my'); tk = JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return; }
    var bz = $('#buzBtn'), bf = $('#buzF');
    if (bz && bf) { bz.onclick = function () { bf.hidden = false; bz.hidden = true; bf.gusto.focus(); };
      bf.onsubmit = async function (e) { e.preventDefault(); var b = $('button', bf); b.disabled = true; var r = await post({ tipo: 'buzon', gusto: bf.gusto.value, mejora: bf.mejora.value }).catch(function () { return {}; });
        if (r.ok) gracias($('#buzon'), 'Lo recibió la dirección. Gracias por ayudarnos a crecer.'); else { b.disabled = false; b.textContent = r.error || 'Probá de nuevo'; } }; }
    var R = await fetch('/api/opina', { headers: { 'x-habitat-auth': tk } }).then(function (r) { return r.json(); }).catch(function () { return {}; });
    if (!R.ok) return;
    if ((R.pendientes || []).length) { var L = $('#opList'); R.pendientes.forEach(function (c) { L.appendChild(card(c)); }); $('#opina').hidden = false; }
    if ((R.materiales || []).length) {
      $('#matList').innerHTML = R.materiales.map(function (c) { return '<div class="op-m"><b>' + esc(c.title || 'Clase') + '</b><small>' + esc(c.programa || '') + ' · ' + larga(c.fecha) + (c.profe ? ' · ' + esc(c.profe) : '') + '</small>' + c.items.map(function (m) { if (/^video/.test(m.mime || '')) return '<video src="' + esc(m.url) + '" controls playsinline preload="metadata" style="width:100%;max-height:60vh;border-radius:12px;background:#10251d;margin:6px 0"></video>'; return '<a href="' + esc(m.url) + '" target="_blank" rel="noopener">' + ico(m.mime) + ' ' + esc(m.title) + '</a>'; }).join('') + '</div>'; }).join('');
      $('#matSec').hidden = false;
    }
  })();
})();
