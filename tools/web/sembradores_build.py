#!/usr/bin/env python3
"""Panel Sembradores (solo dirección): lista de sembradores, testimonios, informe trimestral y mails enviados."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Proyecto Sembradores · Dirección</p><h1 id="ttHola">Hola</h1><p id="ttWho">Cargando…</p></div>
  <div class="tt-act"><a class="tt-ln" href="/sembradores.html" target="_blank" rel="noopener">Página pública</a><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<nav class="tt-tabs" id="ttTabs"><div class="wrap">
  <button data-t="lista" class="on">Sembradores</button><button data-t="testimonios">Testimonios</button><button data-t="informe">Informe trimestral</button><button data-t="mails">Mails enviados</button>
</div></nav>
<div class="tt-main"><div class="wrap">
  <section id="v-lista" class="tt-v">
    <div class="sm-kpis" id="sKpi"></div>
    <div class="tt-bar"><input id="sQ" type="search" placeholder="Buscar por nombre o email" aria-label="Buscar sembrador"><button class="tt-btn" type="button" id="sAdd">Sumar un sembrador</button><button class="tt-btn s" type="button" id="sSync">Traer del formulario</button></div>
    <div class="tt-pills" id="sPills"></div>
    <div class="tt-card sm-list" id="sList"><p class="tt-empty">Cargando…</p></div>
    <p class="tt-tip">La lista se arma sola con el formulario «Quiero sembrar» de la web y con los pagos de Mercado Pago; también podés sumar a alguien a mano. Cuando alguien tiene email, le llega el mail de bienvenida automáticamente.</p>
  </section>
  <section id="v-testimonios" class="tt-v" hidden>
    <div class="tt-bar"><button class="tt-btn" type="button" id="tAdd">Sumar un testimonio</button></div>
    <div class="tt-pills" id="tPills"></div>
    <div class="sm-tgrid" id="tList"></div>
    <p class="tt-tip">Al aprobar un testimonio, les llega a los sembradores de ese foco (los de Becas reciben los de alumnos becados). Los de foco general lo reciben dentro del informe trimestral.</p>
  </section>
  <section id="v-informe" class="tt-v" hidden>
    <div class="tt-card sm-inf" id="iBox"></div>
  </section>
  <section id="v-mails" class="tt-v" hidden>
    <div class="tt-card sm-list" id="mList"></div>
  </section>
</div></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
css = '''<style>
.sm-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}
.sm-kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;display:grid;gap:2px}
.sm-kpi b{font-family:var(--serif);font-size:1.6rem;font-weight:500;font-variant-numeric:tabular-nums}
.sm-kpi span{font-size:.85rem;color:var(--muted)}
.sm-list{display:grid;padding:4px 14px}
.sm-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px 0;border-top:1px solid var(--line);cursor:pointer}
.sm-row:first-child{border-top:0}.sm-row:hover{background:var(--soft)}
.sm-row .w{display:grid;min-width:0}.sm-row small{color:var(--muted);font-size:.8rem}
.sm-tags{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.sm-tag{font:600 .74rem var(--sans);padding:3px 9px;border-radius:999px;background:var(--soft);color:var(--muted);white-space:nowrap}
.sm-tag.g{background:var(--gb);color:var(--g)}.sm-tag.y{background:var(--yb);color:var(--y)}.sm-tag.r{background:var(--rb);color:var(--r)}.sm-tag.o{background:#f3ead8;color:#8a6a2f}
.sm-tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.sm-t{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;display:grid;gap:8px;cursor:pointer}
.sm-t q{font-family:var(--serif);font-style:italic;color:var(--ink);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.sm-inf{display:grid;gap:14px;padding:18px}
.sm-inf textarea{font:inherit;width:100%;min-height:200px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.sm-pick{display:grid;gap:8px}.sm-pick label{display:flex;gap:10px;align-items:flex-start;font-weight:400}
.sm-prev{width:100%;height:620px;border:1px solid var(--line);border-radius:16px;background:#fff}
.sm-st{font:600 .82rem var(--sans);padding:4px 12px;border-radius:999px;background:var(--soft)}
.sm-st.g{background:var(--gb);color:var(--g)}.sm-st.y{background:var(--yb);color:var(--y)}
</style>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/sembradores.js"></script>
'''
html = B.head('Sembradores · Habitat', 'Panel de Proyecto Sembradores.', 'sembradores-panel.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'sembradores-panel.html'), 'w', encoding='utf-8').write(html)
print('sembradores-panel ok')
