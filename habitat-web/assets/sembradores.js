/* Panel Sembradores (dirección): lista, testimonios, informe trimestral con vista previa y aprobación, y mails enviados. */
(function () {
  var A = window.HabitatAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nrm(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function plata(n) { return '$ ' + (Number(n) || 0).toLocaleString('es-AR'); }
  var MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fcorta(s) { if (!s) return ''; var p = String(s).slice(0, 10).split('-'); return +p[2] + ' ' + MC[+p[1] - 1] + ' ' + p[0]; }
  function toast(t) { var e = $('#ttToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 3000); }
  async function token() { await A.api('GET', '/members/v1/members/my'); try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } }
  async function api(method, body, qs) {
    var r = await fetch('/api/sembradores' + (qs || ''), { method: method, headers: { 'content-type': 'application/json', 'x-habitat-auth': await token() }, body: body ? JSON.stringify(body) : undefined });
    if (qs && r.ok) return r.text();
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var er = new Error(j.error || 'No se guardó. Revisá la conexión y probá de nuevo.'); er.status = r.status; throw er; }
    return j;
  }
  var D = null;
  async function send(body, col) {
    try {
      var r = await api('POST', body);
      if (col) { var L = D[col], id = r.item ? r.item._id : body.id, at = L.findIndex(function (x) { return x._id === id; }); if (r.item) { if (at >= 0) L[at] = r.item; else L.push(r.item); } else if (at >= 0) L.splice(at, 1); }
      return r;
    } catch (e) { toast(e.message); throw e; }
  }
  function modal(html, onOpen) { var m = document.createElement('div'); m.className = 'tt-modal'; m.innerHTML = '<div class="tt-card">' + html + '</div>'; document.body.appendChild(m); var close = function () { m.remove(); }; m.onclick = function (e) { if (e.target === m || e.target.closest('[data-close]')) close(); }; onOpen(m, close); return m; }
  function opts(L, v) { return L.map(function (o) { var val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(val) + '"' + (String(v == null ? '' : v) === String(val) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join(''); }
  async function preview(qs, title) {
    modal('<h2 class="w" style="margin-bottom:10px">' + esc(title) + '</h2><iframe class="sm-prev" title="Vista previa del mail"></iframe><div class="tt-wa"><button class="tt-btn s" type="button" data-close>Cerrar</button></div>', async function (m) {
      try { $('iframe', m).srcdoc = await api('GET', null, qs); } catch (e) { toast('No se pudo armar la vista previa.'); }
    });
  }

  /* ---------- Sembradores ---------- */
  var F = { q: '', foco: '' };
  function renderLista() {
    var L = D.sembradores, act = L.filter(function (s) { return s.activo !== false; });
    var men = act.filter(function (s) { return s.tipo === 'Mensual'; });
    $('#sKpi').innerHTML = '<div class="sm-kpi"><b>' + act.length + '</b><span>sembradores activos</span></div>' +
      '<div class="sm-kpi"><b>' + men.length + '</b><span>siembran todos los meses</span></div>' +
      '<div class="sm-kpi"><b>' + plata(men.reduce(function (a, s) { return a + (+s.monto || 0); }, 0)) + '</b><span>siembra mensual comprometida</span></div>' +
      '<div class="sm-kpi"><b>' + act.filter(function (s) { return s.email && !s.bienvenida; }).length + '</b><span>bienvenidas por salir</span></div>';
    var cnt = {}; act.forEach(function (s) { cnt[s.foco || 'General'] = (cnt[s.foco || 'General'] || 0) + 1; });
    $('#sPills').innerHTML = [['', 'Todos']].concat(D.focos.map(function (f) { return [f, f + (cnt[f] ? ' · ' + cnt[f] : '')]; })).map(function (p) { return '<button type="button" class="tt-pill' + (F.foco === p[0] ? ' on' : '') + '" data-f="' + esc(p[0]) + '">' + esc(p[1]) + '</button>'; }).join('');
    $$('#sPills button').forEach(function (b) { b.onclick = function () { F.foco = b.dataset.f; renderLista(); }; });
    var q = nrm(F.q), V = L.filter(function (s) { return (!F.foco || (s.foco || 'General') === F.foco) && (!q || nrm(s.title + ' ' + s.email).indexOf(q) >= 0); })
      .sort(function (a, b) { return (a.activo === false) - (b.activo === false) || (b.tipo === 'Mensual') - (a.tipo === 'Mensual') || nrm(a.title).localeCompare(nrm(b.title)); });
    $('#sList').innerHTML = V.length ? V.map(function (s) {
      var tags = '<span class="sm-tag o">' + esc(s.foco || 'General') + '</span>' +
        '<span class="sm-tag' + (s.tipo === 'Mensual' ? ' g' : '') + '">' + esc(s.tipo || 'Interesado') + (s.monto ? ' · ' + plata(s.monto) : '') + '</span>' +
        (s.activo === false ? '<span class="sm-tag r">Inactivo</span>' : !s.email ? '<span class="sm-tag y">Falta email</span>' : s.bienvenida ? '' : '<span class="sm-tag y">Bienvenida pendiente</span>');
      return '<div class="sm-row" data-id="' + esc(s._id) + '"><div class="w"><b>' + esc(s.title) + '</b><small>' + esc([s.email, s.origen, s.alta ? 'desde ' + fcorta(s.alta) : ''].filter(Boolean).join(' · ')) + '</small></div><div class="sm-tags">' + tags + '</div></div>';
    }).join('') : '<p class="tt-empty">' + (L.length ? 'Nadie coincide con el filtro.' : 'Todavía no hay sembradores cargados.') + '</p>';
    $$('#sList .sm-row').forEach(function (r) { r.onclick = function () { semModal(D.sembradores.find(function (x) { return x._id === r.dataset.id; })); }; });
  }
  function semModal(s) {
    s = s || {}; var nuevo = !s._id;
    var envs = D.envios.filter(function (e) { return e.tipo === 'testimonio' && e.destinatarios === s._id; });
    var aprob = D.testimonios.filter(function (t) { return t.estado === 'Aprobado'; });
    modal('<form class="tt-form"><h2 class="w">' + (nuevo ? 'Sumar un sembrador' : esc(s.title)) + '</h2>' +
      '<label class="w">Nombre y apellido<input name="title" required value="' + esc(s.title || '') + '"></label>' +
      '<label>Email<input name="email" type="email" value="' + esc(s.email || '') + '"></label><label>Teléfono<input name="telefono" value="' + esc(s.telefono || '') + '"></label>' +
      '<label>Foco de su siembra<select name="foco">' + opts(D.focos, s.foco || 'General') + '</select></label>' +
      '<label>Tipo<select name="tipo">' + opts(D.tipos, s.tipo || 'Interesado') + '</select></label>' +
      '<label>Monto (pesos)<input name="monto" inputmode="numeric" value="' + esc(s.monto || '') + '" placeholder="25000"></label>' +
      '<label>Estado<select name="activo">' + opts([['1', 'Activo'], ['0', 'Inactivo']], s.activo === false ? '0' : '1') + '</select></label>' +
      '<label class="w">Nota<input name="nota" value="' + esc(s.nota || '') + '"></label>' +
      (s.bienvenida ? '<p class="w tt-tip">Bienvenida enviada el ' + fcorta(s.bienvenida) + '.</p>' : '<label class="w" style="flex-direction:row;gap:8px;align-items:center;display:flex"><input type="checkbox" name="ya" checked style="width:auto"> Mandar la bienvenida apenas guarde (si tiene email)</label>') +
      (nuevo ? '' : '<div class="w"><p class="tt-lbl">Testimonios recibidos</p><p class="tt-tip">' + (envs.length ? envs.map(function (e) { return esc(e.title) + ' (' + fcorta(e.fecha) + ')'; }).join(' · ') : 'Todavía ninguno.') + '</p>' +
        (aprob.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><select name="tsel" style="flex:1">' + opts(aprob.map(function (t) { return [t._id, t.title + (t.becado ? ' · becado' : '') + ' · ' + (t.foco || 'General')]; })) + '</select><button class="tt-btn s" type="button" data-tprev>Ver</button><button class="tt-btn s" type="button" data-tsend>Mandárselo</button></div>' : '') + '</div>') +
      '<div class="w tt-wa"><button class="tt-btn" type="submit">' + (nuevo ? 'Sumar' : 'Guardar cambios') + '</button><button class="tt-btn s" type="button" data-bprev>Ver bienvenida</button>' + (!nuevo && s.bienvenida && s.email ? '<button class="tt-btn s" type="button" data-bre>Reenviar bienvenida</button>' : '') + '<button class="tt-btn s" type="button" data-close>Cancelar</button>' + (nuevo ? '' : '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar</button>') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.onsubmit = function (e) {
        e.preventDefault();
        send({ op: 'sembrador', id: s._id || '', title: f.title.value, email: f.email.value, telefono: f.telefono.value, foco: f.foco.value, tipo: f.tipo.value, monto: f.monto.value, activo: f.activo.value === '1', nota: f.nota.value, bienvenidaYa: f.ya ? f.ya.checked : false }, 'sembradores').then(function (r) {
          close(); toast(r.mail && r.mail.ok ? 'Guardado. Le mandamos la bienvenida 🌱' : r.mail ? 'Guardado, pero la bienvenida no salió. Probá reenviarla.' : 'Guardado.'); renderLista();
        });
      };
      $('[data-bprev]', m).onclick = function () { preview('?ver=bienvenida&s=' + encodeURIComponent(s._id || '') + '&foco=' + encodeURIComponent(f.foco.value), 'Así le llega la bienvenida'); };
      var bre = $('[data-bre]', m); if (bre) bre.onclick = function () { send({ op: 'bienvenida', id: s._id }, 'sembradores').then(function (r) { toast(r.ok ? 'Bienvenida reenviada.' : 'No salió el mail.'); }); };
      var tp = $('[data-tprev]', m); if (tp) tp.onclick = function () { preview('?ver=testimonio&s=' + encodeURIComponent(s._id) + '&t=' + encodeURIComponent(f.tsel.value), 'Así le llega el testimonio'); };
      var ts = $('[data-tsend]', m); if (ts) ts.onclick = function () { send({ op: 'mandarTestimonio', s: s._id, t: f.tsel.value }).then(function (r) { if (r.ok) { D.envios.push({ _id: 'test|' + f.tsel.value + '|' + s._id, tipo: 'testimonio', destinatarios: s._id, title: (D.testimonios.find(function (t) { return t._id === f.tsel.value; }) || {}).title, fecha: new Date().toISOString().slice(0, 10) }); } toast(r.ok ? 'Testimonio enviado.' : r.ya ? 'Ese testimonio ya le llegó.' : 'No salió el mail.'); close(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { if (!confirm('¿Borrar a ' + s.title + ' de la lista?')) return; send({ op: 'sembrador', borrar: true, id: s._id }, 'sembradores').then(function () { close(); toast('Borrado.'); renderLista(); }); };
    });
  }

  /* ---------- Testimonios ---------- */
  var TF = '';
  function renderTest() {
    var est = ['', 'Pendiente', 'Aprobado', 'Archivado'];
    $('#tPills').innerHTML = est.map(function (e) { var n = D.testimonios.filter(function (t) { return !e || t.estado === e; }).length; return '<button type="button" class="tt-pill' + (TF === e ? ' on' : '') + '" data-e="' + e + '">' + (e || 'Todos') + ' · ' + n + '</button>'; }).join('');
    $$('#tPills button').forEach(function (b) { b.onclick = function () { TF = b.dataset.e; renderTest(); }; });
    var V = D.testimonios.filter(function (t) { return !TF || t.estado === TF; }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    $('#tList').innerHTML = V.length ? V.map(function (t) {
      return '<div class="sm-t" data-id="' + esc(t._id) + '"><div class="sm-tags" style="justify-content:flex-start"><span class="sm-tag ' + (t.estado === 'Aprobado' ? 'g' : t.estado === 'Archivado' ? '' : 'y') + '">' + esc(t.estado) + '</span><span class="sm-tag o">' + esc(t.foco || 'General') + '</span>' + (t.becado ? '<span class="sm-tag">Becado</span>' : '') + (t.permiso ? '<span class="sm-tag g">Se puede publicar</span>' : '') + (t.video ? '<span class="sm-tag">▶ Video</span>' : '') + '</div><b>' + esc(t.title) + '</b>' + (t.texto ? '<q>' + esc(t.texto) + '</q>' : '') + '<small class="tt-tip">' + fcorta(t.fecha) + '</small></div>';
    }).join('') : '<p class="tt-empty">' + (D.testimonios.length ? 'No hay testimonios en este estado.' : 'Todavía no hay testimonios. Podés cargar uno a mano; los videos de los alumnos van a llegar acá solos.') + '</p>';
    $$('#tList .sm-t').forEach(function (c) { c.onclick = function () { testModal(D.testimonios.find(function (x) { return x._id === c.dataset.id; })); }; });
  }
  function testModal(t) {
    t = t || {}; var nuevo = !t._id;
    modal('<form class="tt-form"><h2 class="w">' + (nuevo ? 'Sumar un testimonio' : 'Testimonio de ' + esc(t.title)) + '</h2>' +
      '<label class="w">Alumno<input name="title" required value="' + esc(t.title || '') + '"></label>' +
      '<label class="w">Lo que cuenta (texto o resumen)<textarea name="texto" rows="5">' + esc(t.texto || '') + '</textarea></label>' +
      '<label class="w">Link del video<input name="video" type="url" value="' + esc(t.video || '') + '" placeholder="https://"></label>' +
      '<label>Foco<select name="foco">' + opts(D.focos, t.foco || (t.becado ? 'Becas' : 'General')) + '</select></label>' +
      '<label>Estado<select name="estado">' + opts(['Pendiente', 'Aprobado', 'Archivado'], t.estado || 'Pendiente') + '</select></label>' +
      '<label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="becado" style="width:auto"' + (t.becado ? ' checked' : '') + '> Alumno becado</label>' +
      '<label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="permiso" style="width:auto"' + (t.permiso ? ' checked' : '') + '> Hay permiso para publicarlo en la web</label>' +
      '<p class="w tt-tip">Al pasarlo a «Aprobado», en el próximo aviso diario les llega a los sembradores de su foco.</p>' +
      '<div class="w tt-wa"><button class="tt-btn" type="submit">' + (nuevo ? 'Sumar' : 'Guardar') + '</button><button class="tt-btn s" type="button" data-close>Cancelar</button>' + (nuevo ? '' : '<button class="tt-btn s" type="button" data-del style="margin-left:auto;color:var(--r)">Borrar</button>') + '</div></form>', function (m, close) {
      var f = $('form', m);
      f.becado.onchange = function () { if (f.becado.checked && f.foco.value === 'General') f.foco.value = 'Becas'; };
      f.onsubmit = function (e) { e.preventDefault(); send({ op: 'testimonio', id: t._id || '', alumnoId: t.alumnoId || '', fecha: t.fecha || '', title: f.title.value, texto: f.texto.value, video: f.video.value, foco: f.foco.value, estado: f.estado.value, becado: f.becado.checked, permiso: f.permiso.checked }, 'testimonios').then(function () { close(); toast('Testimonio guardado.'); renderTest(); }); };
      var del = $('[data-del]', m); if (del) del.onclick = function () { if (!confirm('¿Borrar este testimonio?')) return; send({ op: 'testimonio', borrar: true, id: t._id }, 'testimonios').then(function () { close(); toast('Borrado.'); renderTest(); }); };
    });
  }

  /* ---------- Informe trimestral ---------- */
  var TRI = '';
  function triTxt(t) { var p = t.split('-T'); return ['', 'Primer', 'Segundo', 'Tercer', 'Cuarto'][+p[1]] + ' trimestre ' + p[0]; }
  function renderInf() {
    TRI = TRI || D.trimestre;
    var e = D.envios.find(function (x) { return x._id === 'tri|' + TRI; });
    var sel = []; try { sel = JSON.parse((e && e.testimonios) || '[]'); } catch (x) {}
    var aprob = D.testimonios.filter(function (t) { return t.estado === 'Aprobado'; });
    var tris = {}; tris[D.trimestre] = 1; D.envios.forEach(function (x) { if (x.tipo === 'trimestral') tris[x._id.slice(4)] = 1; });
    var enviado = e && e.estado !== 'borrador', n = D.sembradores.filter(function (s) { return s.activo !== false && s.email; }).length;
    $('#iBox').innerHTML = '<div class="tt-bar"><select id="iTri" aria-label="Trimestre">' + opts(Object.keys(tris).sort().reverse().map(function (t) { return [t, triTxt(t)]; }), TRI) + '</select><span class="sm-st ' + (enviado ? 'g' : e ? 'y' : '') + '">' + (enviado ? 'Enviado el ' + fcorta(e.fecha) + (e.por ? ' · aprobó ' + esc(e.por) : '') : e ? 'Borrador para aprobar' : 'Sin armar todavía') + '</span></div>' +
      '<div><p class="tt-lbl">Testimonios de este informe (hasta 3 por sembrador, según su foco)</p><div class="sm-pick" id="iPick">' + (aprob.length ? aprob.map(function (t) { return '<label><input type="checkbox" value="' + esc(t._id) + '"' + (sel.indexOf(t._id) >= 0 ? ' checked' : '') + (enviado ? ' disabled' : '') + '> <span><b>' + esc(t.title) + '</b> · ' + esc(t.foco || 'General') + (t.becado ? ' · becado' : '') + ' <small class="tt-tip">' + fcorta(t.fecha) + '</small></span></label>'; }).join('') : '<p class="tt-tip">Todavía no hay testimonios aprobados. El informe puede salir solo con el texto.</p>') + '</div></div>' +
      '<details><summary class="tt-lbl" style="cursor:pointer">Texto fijo del informe (es el mismo cada trimestre)</summary><textarea id="iTxt">' + esc(D.texto) + '</textarea><div class="tt-wa"><button class="tt-btn s" type="button" id="iTxtS">Guardar texto</button></div></details>' +
      '<div class="tt-wa">' + (enviado ? '' : '<button class="tt-btn s" type="button" id="iSave">Guardar selección</button>') + '<button class="tt-btn s" type="button" id="iPrev">Ver cómo llega</button>' + (enviado ? '' : '<button class="tt-btn" type="button" id="iOk">Aprobar y enviar a ' + n + ' sembradores</button>') + '</div>' +
      '<p class="tt-tip">Al empezar cada trimestre (enero, abril, julio y octubre) la web arma el borrador y les avisa por mail a los directores. Nada sale hasta que alguien de la dirección lo aprueba acá.</p>';
    $('#iTri').onchange = function () { TRI = this.value; renderInf(); };
    function picks() { return $$('#iPick input:checked').map(function (i) { return i.value; }); }
    $('#iPrev').onclick = function () { preview('?ver=trimestral&tri=' + TRI + '&ts=' + encodeURIComponent(JSON.stringify(picks())), 'Así llega el informe (ejemplo con foco general)'); };
    $('#iTxtS').onclick = function () { send({ op: 'texto', texto: $('#iTxt').value }).then(function (r) { D.texto = r.texto; toast('Texto guardado.'); }); };
    function guardarSel() { return send({ op: 'borrador', tri: TRI, testimonios: picks() }, 'envios'); }
    var sv = $('#iSave'); if (sv) sv.onclick = function () { guardarSel().then(function () { toast('Selección guardada.'); renderInf(); }); };
    var ok = $('#iOk'); if (ok) ok.onclick = function () {
      if (!confirm('¿Aprobar el informe y mandarlo ahora a ' + n + ' sembradores?')) return;
      ok.disabled = true; ok.textContent = 'Enviando…';
      guardarSel().then(function () { return send({ op: 'aprobar', tri: TRI }); }).then(function (r) { toast('Informe enviado a ' + r.enviados + (r.fallas ? ' · ' + r.fallas + ' no salieron (podés reintentar)' : '') + '.'); return api('GET'); }).then(function (d) { D = d; renderInf(); }).catch(function () { ok.disabled = false; ok.textContent = 'Reintentar envío'; });
    };
  }

  /* ---------- Mails enviados ---------- */
  function renderMails() {
    var NM = {}; D.sembradores.forEach(function (s) { NM[s._id] = s.title; });
    var L = D.envios.map(function (e) { return { f: e.fecha, t: e.tipo === 'trimestral' ? '📬 ' + esc(triTxt(e._id.slice(4))) + ' · ' + esc(e.estado) : '🌾 Testimonio de ' + esc(e.title) + ' → ' + esc(NM[e.destinatarios] || ''), s: e.tipo === 'trimestral' ? (JSON.parse(e.destinatarios || '[]').length + ' sembradores') : '' }; })
      .concat(D.sembradores.filter(function (s) { return s.bienvenida; }).map(function (s) { return { f: s.bienvenida, t: '🌱 Bienvenida a ' + esc(s.title), s: '' }; }))
      .sort(function (a, b) { return String(b.f).localeCompare(String(a.f)); });
    $('#mList').innerHTML = L.length ? L.map(function (x) { return '<div class="sm-row" style="cursor:default"><div class="w"><b>' + x.t + '</b><small>' + esc(x.s) + '</small></div><small class="tt-tip">' + fcorta(x.f) + '</small></div>'; }).join('') : '<p class="tt-empty">Todavía no salió ningún mail.</p>';
  }

  function cur() { var b = $('#ttTabs .on'); return b ? b.dataset.t : 'lista'; }
  function refresh() { ({ lista: renderLista, testimonios: renderTest, informe: renderInf, mails: renderMails }[cur()] || renderLista)(); }
  function tab(t) { var b = $('#ttTabs [data-t="' + t + '"]'); if (!b) return; $$('#ttTabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); $$('.tt-v').forEach(function (v) { v.hidden = v.id !== 'v-' + t; }); try { history.replaceState(null, '', '#' + t); } catch (e) {} refresh(); }
  $$('#ttTabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.t); }; });
  $('#sQ').oninput = function () { F.q = this.value.trim(); renderLista(); };
  $('#sAdd').onclick = function () { semModal(null); };
  $('#tAdd').onclick = function () { testModal(null); };
  $('#sSync').onclick = function () { var b = this; b.disabled = true; send({ op: 'sync' }).then(function (r) { toast(r.nuevos ? 'Sumamos ' + r.nuevos + ' del formulario.' : 'No hay respuestas nuevas en el formulario.'); return api('GET'); }).then(function (d) { D = d; refresh(); }).finally(function () { b.disabled = false; }); };

  (async function init() {
    if (!A.loggedIn()) { try { sessionStorage.setItem('habitat:ret', '/sembradores-panel.html'); } catch (e) {} location.replace('/ingresar.html'); return; }
    try { D = await api('GET'); }
    catch (e) { $('#ttHola').textContent = e.status === 403 ? 'Este panel es de la dirección' : 'No se pudo cargar el panel'; $('#ttWho').textContent = e.status === 403 ? 'Proyecto Sembradores lo ven solo los directores de Habitat.' : 'Revisá tu conexión y recargá la página.'; $('.tt-main').innerHTML = ''; return; }
    var h = new Date().getHours();
    $('#ttHola').textContent = (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + String(D.me.title || '').split(' ')[0];
    $('#ttWho').textContent = 'Proyecto Sembradores · ' + D.sembradores.filter(function (s) { return s.activo !== false; }).length + ' sembradores';
    var hh = location.hash.replace('#', ''); if (hh && $('#ttTabs [data-t="' + hh + '"]')) tab(hh); else renderLista();
  })();
})();
