#!/usr/bin/env python3
"""Intercesión y ayuno semanal del equipo de voluntarios."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Intercesión y ayuno</p><h1 id="ttHola">Hola</h1><p id="ttWho">Cargando…</p></div>
  <div class="tt-act"><a class="tt-ln" href="/voluntario.html">Mi servicio</a><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<nav class="tt-tabs" id="ttTabs"><div class="wrap">
  <button data-t="hoy" class="on">Hoy</button><button data-t="turnos">Turnos</button><button data-t="pedidos">Pedidos</button><button data-t="ayuno">Ayuno</button>
</div></nav>
<div class="tt-main"><div class="wrap">
  <section id="v-hoy" class="tt-v"><div class="tt-card or-dia" id="oHoy"></div></section>
  <section id="v-turnos" class="tt-v" hidden><div class="tt-card or-list" id="oTur"></div><p class="tt-tip" id="oIcs"></p></section>
  <section id="v-pedidos" class="tt-v" hidden>
    <div class="tt-card"><form id="oPed" class="tt-form"><label class="w">Pedido de oración<textarea name="texto" rows="3" required placeholder="¿Por qué oramos?"></textarea></label><label>De parte de<input name="de" placeholder="Tu nombre o «anónimo»"></label><div class="w tt-wa"><button class="tt-btn" type="submit">Sumar pedido</button></div></form></div>
    <div class="tt-card or-list" id="oPeds"></div>
  </section>
  <section id="v-ayuno" class="tt-v" hidden>
    <div class="tt-card or-list" id="oMiAy"></div>
    <div class="tt-card" id="oPub" hidden></div>
    <div class="tt-card or-list" id="oAy"></div>
    <h2 class="tt-h" style="margin-top:22px">Guía de tipos de ayuno</h2>
    <div class="or-tipos" id="oTipos"></div>
    <p class="tt-tip" id="oSalud"></p>
  </section>
</div></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
css = '''<style>
.or-dia{display:grid;gap:14px;padding:22px}
.or-foco{font:600 .8rem var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
.or-v{font-family:var(--serif);font-size:1.35rem;line-height:1.5;font-style:italic;border-left:3px solid var(--gold);padding-left:16px;margin:0}
.or-v cite{display:block;font:600 .85rem var(--sans);font-style:normal;color:var(--muted);margin-top:6px}
.or-pasos{display:grid;gap:10px;counter-reset:p}
.or-paso{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:var(--card)}
.or-paso b{display:block;font:700 .82rem var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.or-paso.on{border-color:var(--gold);box-shadow:0 0 0 2px rgba(184,144,79,.15)}
.or-list{display:grid;padding:4px 14px}
.or-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.or-row:first-child{border-top:0}.or-row .w{display:grid;min-width:0}.or-row small{color:var(--muted);font-size:.8rem}
.or-row.mio{background:linear-gradient(90deg,rgba(184,144,79,.10),transparent)}
.or-tag{font:600 .74rem var(--sans);padding:3px 9px;border-radius:999px;background:var(--soft);color:var(--muted);white-space:nowrap}
.or-tag.g{background:var(--gb);color:var(--g)}.or-tag.o{background:#f3ead8;color:#8a6a2f}
.or-tipos{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.or-tipo{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;display:grid;gap:6px}
.or-tipo h3{font-family:var(--serif);font-size:1.2rem;margin:0}.or-tipo small{color:var(--muted)}
.or-ntv{font-size:.75rem;color:var(--muted)}
</style>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/intercesion.js"></script>
'''
html = B.head('Intercesión y ayuno · Habitat', 'Intercesión y ayuno del equipo de Habitat CFM.', 'intercesion.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'intercesion.html'), 'w', encoding='utf-8').write(html)
print('intercesion ok')
