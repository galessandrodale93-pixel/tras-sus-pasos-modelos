/* Campus Habitat · acceso en pausa por cuotas vencidas (3 o más meses sin pagar).
   En el campus queda solo «Mi cuota» para pagar; en las clases y cursos se tapa el contenido. Requiere /assets/auth.js */
(function () {
  var A = window.HabitatAuth;
  if (!A || !A.loggedIn || !A.loggedIn()) return;
  var MS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var css = '' +
    'body.cx-bloq main>section:not(.cx-hero):not(#cuotaSec),body.cx-bloq #deudaBox,body.cx-bloq #resume,body.cx-bloq .cx-stats{display:none!important}' +
    '.bq-card{max-width:640px;margin:18px auto;background:#fff;border:2px solid #c9a467;border-radius:20px;padding:24px 22px;color:#10251d;font:16px/1.55 Arial,sans-serif;box-shadow:0 10px 30px rgba(16,37,29,.08)}' +
    '.bq-card .k{font:700 12px Arial;letter-spacing:.14em;text-transform:uppercase;color:#8a6a35;margin:0 0 8px}' +
    '.bq-card h2{font:600 26px/1.2 Georgia,serif;margin:0 0 10px}' +
    '.bq-card p{margin:0 0 10px}' +
    '.bq-card .b{display:inline-block;background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none;margin:6px 8px 0 0;border:0;cursor:pointer}' +
    '.bq-card .b.s{background:#f1eadc;color:#10251d}' +
    '.bq-ov{position:fixed;inset:0;z-index:9999;background:rgba(16,37,29,.92);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}' +
    '.bq-ov .bq-card{margin:0}';
  function lista(L) {
    var t = L.map(function (m) { return MS[+m.slice(5, 7) - 1] || m; });
    return t.length > 1 ? t.slice(0, -1).join(', ') + ' y ' + t[t.length - 1] : t.join('');
  }
  function card(r, enCampus) {
    var d = document.createElement('div');
    d.className = 'bq-card';
    d.innerHTML = '<p class="k">Campus Habitat</p><h2>Tu acceso está en pausa</h2>' +
      '<p>Todavía no registramos el pago de <b>' + r.vencidos.length + ' cuotas</b> (' + lista(r.vencidos) + '). Para seguir viendo las clases, el material y rendir los exámenes, es necesario regularizar tu cuota.</p>' +
      '<p>Apenas se registre el pago, el acceso vuelve solo. Si ya pagaste, subí el comprobante y lo revisamos.</p>' +
      (enCampus ? '<a class="b" href="#cuotaSec">💳 Ver mi cuota y pagar</a>' : '<a class="b" href="/campus.html#cuotaSec">💳 Ver mi cuota y pagar</a><a class="b s" href="/campus.html">Volver al campus</a>') +
      '<p style="margin-top:14px;font-size:14px;color:#5d6b64">¿Ves algo que no coincide o necesitás hablarlo? Escribinos y lo vemos juntos.</p>';
    return d;
  }
  (async function () {
    try {
      await A.api('GET', '/members/v1/members/my');
      var tk = JSON.parse(localStorage.getItem('habitat:mtok')).a;
      var r = await fetch('/api/cuota', { headers: { 'x-habitat-auth': tk } }).then(function (x) { return x.json(); });
      if (!r || !r.bloqueado || !(r.vencidos || []).length) return;
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      var enCampus = !!document.getElementById('cuotaSec');
      if (enCampus) {
        document.body.classList.add('cx-bloq');
        var w = document.createElement('div'); w.className = 'wrap'; w.appendChild(card(r, true));
        var hero = document.querySelector('.cx-hero');
        if (hero && hero.parentNode) hero.parentNode.insertBefore(w, hero.nextSibling); else document.body.prepend(w);
      } else {
        var ov = document.createElement('div'); ov.className = 'bq-ov'; ov.appendChild(card(r, false));
        document.body.appendChild(ov);
        document.querySelectorAll('video,audio').forEach(function (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} });
      }
    } catch (e) { /* sin datos: no se bloquea */ }
  })();
})();
