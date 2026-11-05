/* Campus Habitat · datos reales del alumno (Programas Online de la web de Habitat). Requiere /assets/auth.js */
(function () {
  var A = window.HabitatAuth;
  var FN = '/api/video';
  var MEDIA = 'https://static.wixstatic.com/media/';

  function img(id, w, h) {
    if (!id) return '';
    id = String(id).replace(/^wix:image:\/\/v1\//, '').split('/')[0].split('#')[0];
    return MEDIA + id + (w ? '/v1/fill/w_' + w + ',h_' + h + ',al_c,q_82,enc_auto/c.jpg' : '');
  }
  function kind(t) {
    t = (t || '').toLowerCase();
    if (/carrera/.test(t)) return 'carrera';
    if (/escuela/.test(t)) return 'escuela';
    return 'curso';
  }
  async function pages(url, body, key) {
    var out = [], cursor = null;
    for (var i = 0; i < 20; i++) {
      var b = JSON.parse(JSON.stringify(body));
      b.query.cursorPaging = cursor ? { limit: 100, cursor: cursor } : { limit: 100 };
      var r = await A.api('POST', url, b);
      (r[key] || []).forEach(function (x) { out.push(x); });
      cursor = r.pagingMetadata && r.pagingMetadata.cursors && r.pagingMetadata.cursors.next;
      if (!cursor) break;
    }
    return out;
  }

  var C = {
    async me() {
      var r = await A.api('GET', '/members/v1/members/my?fieldsets=FULL');
      var m = r.member || {}, c = m.contact || {};
      return { id: m.id, first: c.firstName || (m.profile && m.profile.nickname) || '', last: c.lastName || '', nick: m.profile && m.profile.nickname || '', email: m.loginEmail || '', photo: m.profile && m.profile.photo && m.profile.photo.url || '', since: m.createdDate || '' };
    },
    async program(id) {
      var r = await A.api('GET', '/online-programs/v3/programs/' + id);
      return r.program;
    },
    async allPrograms() {
      var r = await A.api('POST', '/online-programs/v3/programs/query', { query: { cursorPaging: { limit: 100 } } });
      return (r.programs || []).filter(function (p) { return p.status === 'PUBLISHED'; });
    },
    async participations(memberId) {
      var ps = await pages('/online-programs/v3/participants/query', { query: { filter: { memberId: memberId } } }, 'participants');
      return ps.filter(function (p) { return p.enrollmentStatus === 'JOINED' || p.enrollmentStatus === 'COMPLETED' || p.enrollmentStatus === 'PAUSED'; });
    },
    async resolved(participantId) {
      return pages('/online-programs/v3/resolved-steps/query', { query: { filter: { participantId: participantId } } }, 'resolvedSteps');
    },
    async outline(programId) {
      var secs = await pages('/online-programs/v3/sections/query', { query: { filter: { programId: programId } } }, 'sections');
      var steps = await pages('/online-programs/v3/steps/query?descriptionFieldSet=EXTENDED', { query: { filter: { programId: programId } } }, 'steps');
      secs.sort(function (a, b) { return (a.ordering || 0) - (b.ordering || 0); });
      var bySec = {};
      steps.forEach(function (s) { (bySec[s.sectionId] = bySec[s.sectionId] || []).push(s); });
      var out = secs.map(function (s) {
        var st = (bySec[s.id] || []).sort(function (a, b) { return (a.ordering || 0) - (b.ordering || 0); });
        return { id: s.id, title: s.description && s.description.title || '', steps: st };
      }).filter(function (s) { return s.steps.length; });
      var orphan = steps.filter(function (s) { return !secs.some(function (x) { return x.id === s.sectionId; }); });
      if (orphan.length) out.push({ id: 'otros', title: 'Clases', steps: orphan.sort(function (a, b) { return (a.ordering || 0) - (b.ordering || 0); }) });
      return out;
    },
    async complete(participantId, stepId) {
      return A.api('POST', '/online-programs/participants/v3/resolved-steps/upsert/participant/' + participantId + '/step/' + stepId, { resolvedStep: { participantId: participantId, programStepId: stepId } });
    },
    async videoUrl(stepId) {
      var tok = await (async function () { try { return JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) { return ''; } })();
      await A.api('GET', '/members/v1/members/my'); // refresca el token si venció
      try { tok = JSON.parse(localStorage.getItem('habitat:mtok')).a; } catch (e) {}
      var r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json', 'x-habitat-auth': tok }, body: JSON.stringify({ stepId: stepId }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.hls) throw new Error(j.error || ('HTTP ' + r.status));
      return j.hls;
    },
    img: img,
    kind: kind,
    stepMinutes: function (s) { var ms = s.videoOptions && s.videoOptions.durationInMilliseconds; return ms ? Math.max(1, Math.round(ms / 60000)) : 0; },
    rich: function (details) {
      var doc; try { doc = typeof details === 'string' ? JSON.parse(details) : details; } catch (e) { return details ? '<p>' + esc(details) + '</p>' : ''; }
      if (!doc || !doc.nodes) return '';
      return doc.nodes.map(node).join('');
    }
  };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function text(n) {
    var t = esc(n.textData && n.textData.text || '');
    (n.textData && n.textData.decorations || []).forEach(function (d) {
      if (d.type === 'BOLD') t = '<b>' + t + '</b>';
      else if (d.type === 'ITALIC') t = '<i>' + t + '</i>';
      else if (d.type === 'UNDERLINE') t = '<u>' + t + '</u>';
      else if (d.type === 'LINK' && d.linkData && d.linkData.link && d.linkData.link.url) t = '<a href="' + esc(d.linkData.link.url) + '" target="_blank" rel="noopener">' + t + '</a>';
    });
    return t;
  }
  function kids(n) { return (n.nodes || []).map(node).join(''); }
  function fileUrl(src) {
    if (!src) return '';
    if (src.url) return src.url;
    var id = src.id || '';
    if (/^ugd\//.test(id)) return 'https://static.wixstatic.com/' + id;
    return id ? 'https://static.wixstatic.com/ugd/' + id : '';
  }
  function node(n) {
    switch (n.type) {
      case 'TEXT': return text(n);
      case 'PARAGRAPH': var k = kids(n); return k ? '<p>' + k + '</p>' : '';
      case 'HEADING': var l = Math.min(4, Math.max(3, (n.headingData && n.headingData.level || 3))); return '<h' + l + '>' + kids(n) + '</h' + l + '>';
      case 'BULLETED_LIST': return '<ul>' + kids(n) + '</ul>';
      case 'ORDERED_LIST': return '<ol>' + kids(n) + '</ol>';
      case 'LIST_ITEM': return '<li>' + kids(n) + '</li>';
      case 'BLOCKQUOTE': return '<blockquote>' + kids(n) + '</blockquote>';
      case 'DIVIDER': return '<hr>';
      case 'IMAGE': var id = n.imageData && n.imageData.image && n.imageData.image.src && (n.imageData.image.src.id || n.imageData.image.src.url); return id ? '<img loading="lazy" src="' + esc(/^http/.test(id) ? id : img(id)) + '" alt="">' : '';
      case 'FILE':
        var f = n.fileData || {}, u = fileUrl(f.src), mb = f.size ? (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB' : '';
        return '<div class="mt"><span class="pdf">' + esc((f.type || 'PDF').toUpperCase()) + '</span><div><b>' + esc(f.name || 'Material') + '</b><small>' + mb + '</small></div>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">Abrir</a>' : '') + '</div>';
      default: return kids(n);
    }
  }
  window.CampusData = C;
})();
