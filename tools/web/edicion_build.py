#!/usr/bin/env python3
"""Panel de edición de videos (Cris y la dirección): clases para entregar, en edición, editadas y subidas."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Edición de videos</p><h1 id="ttHola">Hola</h1><p id="ttWho">Cargando…</p></div>
  <div class="tt-act"><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<nav class="tt-tabs" id="ttTabs"><div class="wrap">
  <button data-t="cola" class="on">Para hacer</button><button data-t="plan">Ponernos al día</button><button data-t="subidas">Subidas</button>
</div></nav>
<div class="tt-main"><div class="wrap">
  <section id="v-cola" class="tt-v">
    <div class="ed-kpis" id="eKpi"></div>
    <div class="tt-pills" id="ePills"></div>
    <div class="tt-bar" id="eBulk" hidden><span class="tt-tip" id="eSel"></span><select id="eFuente" aria-label="Dónde está la grabación"></select><input type="date" id="eFecha" aria-label="Fecha de entrega"><button class="tt-btn" type="button" id="eEnt">Marcar como entregadas a Cris</button><button class="tt-btn s" type="button" id="eYa">Ya estaban subidas</button></div>
    <div class="tt-card ed-list" id="eList"><p class="tt-empty">Cargando…</p></div>
    <p class="tt-tip">De la más vieja a la más nueva. Los 7 días de cada video cuentan desde que Gui marca que entregó el material. Al subir el video, aparece en el Campus de los alumnos y les llega un aviso a los directores.</p>
  </section>
  <section id="v-plan" class="tt-v" hidden><div class="tt-card ed-plan" id="ePlan"></div></section>
  <section id="v-subidas" class="tt-v" hidden><div class="tt-card ed-list" id="eSub"></div></section>
</div></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
css = '''<style>
.ed-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.ed-kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;display:grid;gap:2px}
.ed-kpi b{font-family:var(--serif);font-size:1.6rem;font-weight:500}.ed-kpi span{font-size:.85rem;color:var(--muted)}.ed-kpi.r b{color:var(--r)}
.ed-list{display:grid;padding:4px 14px}
.ed-row{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.ed-row:first-child{border-top:0}.ed-row .w{display:grid;min-width:0}.ed-row small{color:var(--muted);font-size:.8rem}
.ed-row input[type=checkbox]{width:20px;height:20px;accent-color:var(--g)}
.ed-acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
.ed-st{font:600 .76rem var(--sans);padding:3px 10px;border-radius:999px;background:var(--soft);color:var(--muted);white-space:nowrap}
.ed-st.y{background:var(--yb);color:var(--y)}.ed-st.g{background:var(--gb);color:var(--g)}.ed-st.r{background:var(--rb);color:var(--r)}.ed-st.b{background:#e3ecf6;color:#3e6690}
.ed-prog{height:8px;border-radius:99px;background:var(--soft);overflow:hidden;margin-top:6px}.ed-prog i{display:block;height:100%;background:var(--gold);width:0}
.ed-plan{display:grid;gap:14px;padding:18px}.ed-plan .big{font-family:var(--serif);font-size:2rem}
</style>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/edicion.js"></script>
'''
html = B.head('Edición de videos · Habitat', 'Edición de las clases grabadas de Habitat CFM.', 'edicion.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'edicion.html'), 'w', encoding='utf-8').write(html)
print('edicion ok')
