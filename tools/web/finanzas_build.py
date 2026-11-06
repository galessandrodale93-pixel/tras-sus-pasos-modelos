#!/usr/bin/env python3
"""Finanzas: cobros de alumnos por escuela y mes, registro de cobros, gastos y resumen (reemplaza el Excel de pagos)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Finanzas</p><h1 id="ttHola">Hola</h1><p id="ttWho">Cargando…</p></div>
  <div class="tt-act"><a class="tt-ln" href="/tutor.html">Panel de tutores</a><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<nav class="tt-tabs" id="ttTabs"><div class="wrap">
  <button data-t="cobros" class="on">Cobros</button><button data-t="registro">Registro</button><button data-t="gastos">Gastos</button><button data-t="resumen">Resumen</button>
</div></nav>
<div class="tt-main"><div class="wrap">
  <section id="v-cobros" class="tt-v">
    <div class="fn-kpis" id="cSum"></div>
    <div class="tt-bar"><input id="cQ" type="search" placeholder="Buscar por nombre" aria-label="Buscar alumno"><button class="tt-btn" type="button" id="cAdd">Registrar un cobro</button></div>
    <div class="tt-pills" id="cPills"></div>
    <div class="fn-scroll" id="cTable"><p class="tt-empty">Cargando cobros…</p></div>
    <p class="tt-tip">Cada fila es un alumno en una escuela. El mes se completa solo con los cobros aprobados de esa escuela; el pago anual o semestral cubre su rango. Tocá una fila para ver su ficha, editar el plan o cargar un pago.</p>
  </section>
  <section id="v-registro" class="tt-v" hidden>
    <div class="tt-bar"><select id="rMes" aria-label="Mes"></select><select id="rEst" aria-label="Estado"></select><span class="tt-tip" id="rSum"></span><button class="tt-btn" type="button" id="rAdd">Registrar un cobro</button></div>
    <div class="fn-log tt-card" id="rLog"></div>
  </section>
  <section id="v-gastos" class="tt-v" hidden>
    <div class="tt-calh"><button class="tt-arrow" type="button" id="gPrev" aria-label="Mes anterior">‹</button><h2 id="gTit"></h2><button class="tt-arrow" type="button" id="gNext" aria-label="Mes siguiente">›</button></div>
    <div class="fn-kpis" id="gTot"></div>
    <div class="tt-card fn-gl" id="gList"></div>
    <div class="tt-wa"><button class="tt-btn" type="button" id="gAdd">Sumar un gasto</button><button class="tt-btn s" type="button" id="gFix">Editar gastos fijos</button></div>
    <p class="tt-tip">Los gastos fijos aparecen en todos los meses. Marcá cada uno cuando se paga y ajustá el monto si cambió.</p>
  </section>
  <section id="v-resumen" class="tt-v" hidden>
    <div class="fn-kpis" id="sEsc"></div>
    <div class="tt-card"><h2 class="tt-h">Cobrado y gastado en pesos, mes a mes</h2><div class="fn-leg"><span class="in">Cobrado</span><span class="out">Gastos</span></div><div class="fn-bars" id="sBars"></div></div>
    <div class="fn-scroll" id="sTable"></div>
  </section>
</div></div>
<div class="tt-drawer" id="ttDrawer" hidden><div class="tt-dr-bg" data-x></div><aside class="tt-dr" role="dialog" aria-modal="true" aria-labelledby="drName"><button class="tt-x" type="button" data-x aria-label="Cerrar">✕</button><div id="drBody"></div></aside></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
css = '''<style>
.fn-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:16px}
.fn-kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;display:grid;gap:2px}
.fn-kpi b{font-family:var(--serif);font-size:1.6rem;font-weight:500;font-variant-numeric:tabular-nums}
.fn-kpi span{font-size:.85rem;color:var(--muted)}
.fn-kpi.r b{color:var(--r)}.fn-kpi.g b{color:var(--g)}
.fn-sep{width:1px;background:var(--line);margin:0 6px}
.fn-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:var(--card);margin:12px 0}
.fn-t{border-collapse:collapse;width:100%;font-size:.86rem;font-variant-numeric:tabular-nums}
.fn-t th{position:sticky;top:0;background:var(--soft);text-align:left;font:600 .74rem var(--sans);color:var(--muted);padding:10px 8px;white-space:nowrap}
.fn-t th.cur{color:var(--ink)}
.fn-t td{padding:8px;border-top:1px solid var(--line);white-space:nowrap}
.fn-t tbody tr{cursor:pointer}.fn-t tbody tr:hover{background:var(--soft)}
.fn-t td.n{font-weight:600}.fn-t td.m{color:var(--muted)}.fn-t td.t{font-weight:600}.fn-t td.neg{color:var(--r);font-weight:600}
.fn-t.s tbody tr{cursor:default}
.fn-empty{text-align:center;color:var(--muted);padding:24px}
.fn-c{display:inline-grid;place-items:center;min-width:54px;padding:3px 6px;border-radius:8px;font:600 .76rem var(--sans);background:var(--soft);color:var(--muted)}
.fn-c.pago{background:var(--gb);color:var(--g)}.fn-c.debe{background:var(--rb);color:var(--r)}.fn-c.pend{background:var(--yb);color:var(--y)}
.fn-c.esp{background:#e3ecf6;color:#3e6690}.fn-c.becado{background:#eee8f5;color:#6b5f8a}.fn-c.baja{background:#ececec;color:#8a8a8a}.fn-c.fut{background:transparent}
.fn-c small{display:block;font-weight:500;font-size:.66rem;opacity:.8}
.fn-st{font:600 .8rem var(--sans);padding:3px 10px;border-radius:999px;background:var(--soft)}
.fn-st.g{background:var(--gb);color:var(--g)}.fn-st.r{background:var(--rb);color:var(--r)}
.fn-plan{display:grid;gap:10px;margin:12px 0}
.fn-ph{display:flex;gap:10px;align-items:center}.fn-ph h3{font-family:var(--serif);font-size:1.4rem;flex:1}
.fn-months{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.fn-months .fn-c{min-width:0;padding:6px 4px}
.fn-log{display:grid}
.fn-row{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;padding:10px 4px;border-top:1px solid var(--line);cursor:pointer}
.fn-row:first-child{border-top:0}.fn-row:hover{background:var(--soft)}
.fn-row .d{font-size:.8rem;color:var(--muted)}.fn-row .w{display:grid;min-width:0}.fn-row small{color:var(--muted);font-size:.78rem}
.fn-row .p{font-weight:600;font-variant-numeric:tabular-nums}.fn-row.no .p{color:var(--r);text-decoration:line-through}
.fn-gl{display:grid;padding:6px 14px}
.fn-g{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--line)}
.fn-g:first-child{border-top:0}.fn-g .w{display:grid;cursor:pointer;min-width:0}.fn-g small{color:var(--muted);font-size:.78rem}
.fn-g.ok b{color:var(--g)}
.fn-chk input{width:20px;height:20px;accent-color:var(--g)}
.fn-amt{display:flex;gap:6px}.fn-amt input{width:110px;text-align:right}.fn-amt select,.fn-amt input{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.fn-fxs{display:grid;gap:8px;max-height:46vh;overflow:auto}
.fn-fx{display:grid;grid-template-columns:1.4fr 1fr 80px 110px auto;gap:6px}
.fn-fx input,.fn-fx select{font:inherit;padding:8px;border:1px solid var(--line);border-radius:10px;min-width:0}
.fn-leg{display:flex;gap:16px;font-size:.85rem;color:var(--muted);margin:4px 0 10px}
.fn-leg span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.fn-leg .in::before{background:var(--g)}.fn-leg .out::before{background:var(--gold)}
.fn-bars{display:grid;grid-template-columns:repeat(10,1fr);gap:8px;height:220px;align-items:end}
.fn-bar{display:grid;grid-template-rows:1fr auto;height:100%;gap:6px;text-align:center}
.fn-bar b{font:600 .74rem var(--sans);color:var(--muted)}.fn-bar.cur b{color:var(--ink)}
.fn-bb{display:flex;gap:3px;align-items:flex-end;justify-content:center}
.fn-bb i{display:block;width:40%;border-radius:6px 6px 0 0;min-height:2px}.fn-bb .in{background:var(--g)}.fn-bb .out{background:var(--gold)}
@media (max-width:760px){.fn-fx{grid-template-columns:1fr 1fr}.fn-months{grid-template-columns:repeat(4,1fr)}.fn-bars{height:160px}}
</style>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/finanzas.js"></script>
'''
html = B.head('Finanzas · Habitat', 'Cobros y gastos de Habitat CFM.', 'finanzas.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'finanzas.html'), 'w', encoding='utf-8').write(html)
print('finanzas ok')
