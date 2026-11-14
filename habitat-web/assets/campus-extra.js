/* Campus Habitat · agenda, avisos, preguntas por clase y diario espiritual. */
(function () {
  var A = window.HabitatAuth;
  var CAL = 'https://www.habitat-cfm.org/api/calendario.ics';
  function q(col, query) { return A.api('POST', '/wix-data/v2/items/query', { dataCollectionId: col, query: query }); }
  function rows(r) { return (r.dataItems || []).map(function (d) { var x = d.data || {}; x._id = d.id || x._id; return x; }); }
  function d(v) { if (!v) return null; if (v.$date) v = v.$date; var x = new Date(v); return isNaN(x) ? null : x; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fecha(x) { return DIAS[x.getDay()] + ' ' + x.getDate() + ' ' + MESES[x.getMonth()]; }
  function hora(x) { return ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var X = {
    esc: esc, fecha: fecha, hora: hora, date: d,
    calUrl: function (pid) { return CAL + (pid ? '?p=' + encodeURIComponent(pid) : ''); },
    webcal: function (pid) { return X.calUrl(pid).replace(/^https:/, 'webcal:'); },
    google: function (pid) { return 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(X.webcal(pid)); },

    /* Agenda: eventos que vienen (y avisos recientes). */
    async agenda(pids, carreras) {
      var desde = new Date(Date.now() - 21 * 864e5).toISOString();
      var r = await q('CampusEventos', { filter: { inicio: { $gte: { $date: desde } } }, sort: [{ fieldName: 'inicio', order: 'ASC' }], paging: { limit: 100 } });
      var mine = {}; (pids || []).forEach(function (p) { mine[p] = 1; });
      var L = rows(r).filter(function (e) { return !e.programId || mine[e.programId]; });
      // sus clases (por carrera) y la Zarza y el Selah
      try { var tk = ''; try { await A.api('GET', '/members/v1/members/my'); tk = JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) {} var x = await fetch('/api/agenda?c=' + encodeURIComponent((carreras || []).join(',')), { headers: tk ? { 'x-habitat-auth': tk } : {} }).then(function (y) { return y.json(); }); L = L.concat(x.eventos || []); } catch (e) {}
      return L.map(function (e) { e.ini = d(e.inicio); e.end = d(e.fin); return e; }).filter(function (e) { return e.ini; }).sort(function (a, b) { return a.ini - b.ini; });
    },
    unseen: function (list) { var t = +(lsGet('campus:seen') || 0); return list.filter(function (e) { return /aviso/i.test(e.tipo || '') && e.ini && e.ini.getTime() > t; }).length; },
    markSeen: function () { lsSet('campus:seen', String(Date.now())); },

    /* Preguntas por clase. */
    async questions(stepId) {
      var r = await q('CampusPreguntas', { filter: { stepId: { $eq: stepId }, visible: { $eq: true } }, sort: [{ fieldName: '_createdDate', order: 'DESC' }], paging: { limit: 100 } });
      return rows(r);
    },
    async ask(o) {
      var tok = await A.api('GET', '/members/v1/members/my').then(function () { try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } });
      var r = await fetch('/api/preguntas', { method: 'POST', headers: { 'content-type': 'application/json', 'x-habitat-auth': tok }, body: JSON.stringify(o) });
      var j = {}; try { j = await r.json(); } catch (e) {}
      if (!r.ok) throw new Error(j.error || 'No pudimos enviar la pregunta.');
      return j;
    },

    /* Diario espiritual (cada alumno ve solo lo suyo). */
    async diary(limit) {
      var r = await q('CampusDiario', { sort: [{ fieldName: 'fecha', order: 'DESC' }], paging: { limit: limit || 100 } });
      return rows(r).map(function (e) { e.f = d(e.fecha) || d(e._createdDate); return e; });
    },
    async diaryFor(stepId) {
      var r = await q('CampusDiario', { filter: { stepId: { $eq: stepId } }, paging: { limit: 1 } });
      return rows(r)[0] || null;
    },
    async saveEntry(e) {
      var data = { title: e.title || '', texto: e.texto || '', cita: e.cita || '', versiculo: e.versiculo || '', programId: e.programId || '', stepId: e.stepId || '', clase: e.clase || '', fecha: { $date: (e.f || new Date()).toISOString() } };
      if (e._id) { data._id = e._id; var u = await A.api('PUT', '/wix-data/v2/items/' + encodeURIComponent(e._id), { dataCollectionId: 'CampusDiario', dataItem: { id: e._id, data: data } }); return (u.dataItem && u.dataItem.id) || e._id; }
      var r = await A.api('POST', '/wix-data/v2/items', { dataCollectionId: 'CampusDiario', dataItem: { data: data } });
      return r.dataItem && r.dataItem.id;
    },
    async removeEntry(id) { return A.api('DELETE', '/wix-data/v2/items/' + encodeURIComponent(id) + '?dataCollectionId=CampusDiario'); }
  };
  window.CampusExtra = X;
})();
