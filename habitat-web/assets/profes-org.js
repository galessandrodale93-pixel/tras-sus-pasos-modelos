/* Organización · Profes y opiniones: dar acceso a los profes, escribirles un agradecimiento y leer todo el feedback. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var box = $('#v-prof'); if (!box) return;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function corta(s) { var p = String(s || '').split('-'); return p.length < 3 ? '' : +p[2] + ' ' + MS[+p[1] - 1]; }
  var CARA = { '1': '😣', '2': '😕', '3': '🙂', '4': '😊', '5': '🤩' };
  function toast(t) { var e = $('#ttToast'); if (!e) return; e.textContent = t; e.classList.add('on'); setTimeout(function () { e.classList.remove('on'); }, 2600); }
  var tk = '', D = null, F = 'clase';
  async function api(m, b) { if (!tk) { try { await window.HabitatAuth.api('GET', '/members/v1/members/my'); tk = JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) {} }
    return fetch('/api/profe' + (m === 'GET' ? '?admin=1' : ''), { method: m, headers: { 'content-type': 'application/json', 'x-habitat-auth': tk }, body: b ? JSON.stringify(b) : undefined }).then(function (r) { return r.json(); }); }
  async function load() { box.innerHTML = '<p class="tt-empty">Cargando profes…</p>'; try { D = await api('GET'); } catch (e) { D = { error: 'Sin conexión.' }; } draw(); }
  function draw() {
    if (D.error) { box.innerHTML = '<p class="tt-empty">' + esc(D.error) + '</p>'; return; }
    var P = D.profes || [], con = P.map(function (p) { return String(p.title || '').toLowerCase(); });
    var sin = (D.nombres || []).filter(function (n) { return !con.some(function (c) { return c && n.toLowerCase().indexOf(c) >= 0; }); });
    var C = D.clases || {}, O = D.opiniones || [], Rf = D.reflexiones || [];
    var ops = O.filter(function (o) { return F === 'buzon' ? o.tipo === 'buzon' : o.tipo !== 'buzon'; });
    box.innerHTML =
      '<div class="tt-card po-sec"><div class="tt-bar"><div><h2 class="tt-h">Profesores</h2><p class="tt-tip">Cada profe entra al panel de profesores con el email de su cuenta de Habitat. El nombre tiene que ser el mismo que figura en «Clases y profes». Ahí ve sus clases, sube el material, suma sus clases a su calendario y recibe un mail una semana antes.</p></div><button class="tt-btn" type="button" id="poAdd">Sumar profe</button></div>' +
      (sin.length ? '<p class="tt-lbl">Figuran en las clases y todavía no tienen acceso</p><div class="tt-pills">' + sin.map(function (n) { return '<button type="button" class="tt-pill" data-nuevo="' + esc(n) + '">+ ' + esc(n) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="po-grid">' + (P.map(function (p) { return '<button type="button" class="po-card' + (p.activo === 'no' ? ' off' : '') + '" data-id="' + esc(p._id) + '"><b>' + esc(p.title) + '</b><small>' + esc(p.email || 'Sin email') + '</small><small>' + p.clases + ' clases' + (p.proxima ? ' · próxima ' + corta(p.proxima.fecha) : '') + '</small>' + (p.gracias ? '<i>💌 Tiene mensaje</i>' : '') + '</button>'; }).join('') || '<p class="tt-empty">Todavía no sumaste profes.</p>') + '</div></div>' +
      '<div class="tt-card po-sec"><div class="tt-bar"><h2 class="tt-h">Lo que dicen los alumnos</h2><div class="tt-pills"><button type="button" class="tt-pill' + (F === 'clase' ? ' on' : '') + '" data-f="clase">Sobre las clases</button><button type="button" class="tt-pill' + (F === 'buzon' ? ' on' : '') + '" data-f="buzon">Buzón de ideas</button></div></div>' +
      '<p class="tt-tip">Acá ves quién escribió. El profe ve los comentarios de su clase sin nombre.</p><div class="po-ops">' +
      (ops.map(function (o) { var c = C[o.claseId] || {}; return '<div class="po-op"><span class="po-f">' + (CARA[o.animo] || '💬') + '</span><div><p class="tt-lbl">' + esc(o.nombre || o.email || 'Alumno') + ' · ' + corta(o.fecha) + (c.title ? ' · ' + esc(c.title) + (c.profe ? ' (' + esc(c.profe) + ')' : '') : o.programa ? ' · ' + esc(o.programa) : '') + '</p>' + (o.gusto ? '<p>💛 ' + esc(o.gusto) + '</p>' : '') + (o.mejora ? '<p>🔧 ' + esc(o.mejora) + '</p>' : '') + '</div></div>'; }).join('') || '<p class="tt-empty">Todavía no llegaron opiniones.</p>') + '</div></div>' +
      '<div class="tt-card po-sec"><h2 class="tt-h">Reflexiones de los profes</h2><div class="po-ops">' +
      (Rf.map(function (r) { var c = C[r.claseId] || {}, p = P.filter(function (x) { return x._id === r.profeId; })[0] || {}; return '<details class="po-op"><summary><span class="po-f">' + (CARA[r.animo] || '📝') + '</span><span><b>' + esc(p.title || c.profe || 'Profe') + '</b> · ' + corta(r.fecha) + ' · ' + esc(c.title || r.title || '') + '</span></summary>' +
        [['bien', 'Qué salió bien'], ['mejorar', 'Qué haría distinto'], ['grupo', 'Cómo vio al grupo'], ['aprendi', 'Qué le enseñó Dios'], ['oracion', 'Pedido de oración']].map(function (k) { return r[k[0]] ? '<p><b>' + k[1] + ':</b> ' + esc(r[k[0]]) + '</p>' : ''; }).join('') + '</details>'; }).join('') || '<p class="tt-empty">Todavía no hay reflexiones.</p>') + '</div></div>';
    $$('[data-f]', box).forEach(function (b) { b.onclick = function () { F = b.dataset.f; draw(); }; });
    $('#poAdd').onclick = function () { form({}); };
    $$('[data-nuevo]', box).forEach(function (b) { b.onclick = function () { form({ title: b.dataset.nuevo }); }; });
    $$('.po-card', box).forEach(function (b) { b.onclick = function () { form(P.filter(function (p) { return p._id === b.dataset.id; })[0]); }; });
  }
  function form(p) {
    var dr = $('#ttDrawer'), b = $('#drBody'); if (!dr || !b) return;
    b.innerHTML = '<form class="tt-form po-form" id="poF"><h2 class="tt-h" id="drName">' + (p._id ? 'Editar profe' : 'Sumar profe') + '</h2>' +
      '<label class="w">Nombre (igual que en las clases)<input name="title" required value="' + esc(p.title || '') + '"></label>' +
      '<label class="w">Email de su cuenta de Habitat<input name="email" type="email" required value="' + esc(p.email || '') + '"></label>' +
      '<label class="w">Mensaje de agradecimiento<textarea name="gracias" rows="5" placeholder="Lo ve en su panel. Por ejemplo: gracias por tu entrega en el bloque de Apocalipsis…">' + esc(p.gracias || '') + '</textarea></label>' +
      '<label class="tt-inl"><input type="checkbox" name="activo"' + (p.activo === 'no' ? '' : ' checked') + '> Tiene acceso</label>' +
      '<div class="pf-nav">' + (p._id ? '<button type="button" class="tt-btn s" id="poDel">Quitar</button>' : '<span></span>') + '<button class="tt-btn" type="submit">' + (p._id ? 'Guardar' : 'Dar acceso') + '</button></div></form>';
    dr.hidden = false;
    $('#poF').onsubmit = async function (e) { e.preventDefault(); var f = e.target; var r = await api('POST', { op: 'guardarProfe', id: p._id || '', title: f.title.value, email: f.email.value, gracias: f.gracias.value, activo: f.activo.checked ? 'si' : 'no' }); toast(r.ok ? 'Listo. Ya puede entrar a su panel.' : (r.error || 'No se guardó.')); if (r.ok) { dr.hidden = true; load(); } };
    var del = $('#poDel'); if (del) { var armed = false; del.onclick = async function () { if (!armed) { armed = true; del.textContent = 'Tocá de nuevo para quitar'; return; } var r = await api('POST', { op: 'borrarProfe', id: p._id }); toast(r.ok ? 'Profe quitado.' : 'No se pudo quitar.'); dr.hidden = true; load(); }; }
  }
  var started = false;
  function maybe() { if (!box.hidden && !started) { started = true; load(); } }
  new MutationObserver(maybe).observe(box, { attributes: true, attributeFilter: ['hidden'] });
  maybe();
})();
