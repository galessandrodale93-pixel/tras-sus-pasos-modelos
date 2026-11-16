#!/usr/bin/env python3
"""Panel «Juego» (dirección y Cristian Castriota): estadísticas de Kids & Hero para decidir qué mejorar."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Kids &amp; Hero · Dirección</p><h1 id="ttHola">Hola</h1><p id="ttWho">Cargando…</p></div>
  <div class="tt-act"><a class="tt-ln" href="/kids-hero.html" target="_blank" rel="noopener">Página del juego</a><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<div class="tt-main"><div class="wrap">
  <div class="tt-bar kj-bar">
    <div class="kj-seg" id="kDias" role="group" aria-label="Período"><button data-d="7">7 días</button><button data-d="30" class="on">30 días</button><button data-d="90">90 días</button><button data-d="0">Todo</button></div>
    <label class="kj-ck"><input type="checkbox" id="kTester"> Incluir a los testers</label>
    <span class="kj-upd" id="kUpd"></span>
  </div>
  <div id="kOut"><p class="tt-empty">Cargando…</p></div>
  <p class="tt-tip">Cada sesión de juego se anota sola (sin nombres ni mails) y se actualiza cada minuto y medio. Una sesión es cada vez que alguien entra al juego y camina; los jugadores se cuentan por cuenta o, si no tienen, por aparato.</p>
</div></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
css = '''<style>
.kj-bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:18px}
.kj-seg{display:inline-flex;background:var(--soft);border-radius:999px;padding:3px}
.kj-seg button{font:600 .85rem var(--sans);border:0;background:none;padding:7px 14px;border-radius:999px;cursor:pointer;color:var(--muted)}
.kj-seg button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.kj-ck{display:flex;gap:6px;align-items:center;font-size:.88rem;color:var(--muted)}
.kj-upd{margin-left:auto;font-size:.8rem;color:var(--muted)}
.kj-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px}
.kj-kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;display:grid;gap:2px}
.kj-kpi b{font-family:var(--serif);font-size:1.7rem;font-weight:500;font-variant-numeric:tabular-nums;line-height:1.1}
.kj-kpi span{font-size:.84rem;color:var(--muted)}
.kj-kpi small{font-size:.76rem;color:var(--muted)}
.kj-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-bottom:14px}
.kj-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;display:grid;gap:10px;align-content:start}
.kj-card h3{margin:0;font-family:var(--serif);font-weight:500;font-size:1.25rem}
.kj-card > p{margin:0;font-size:.85rem;color:var(--muted)}
.kj-cols{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:3px;align-items:end;height:130px;padding-top:6px}
.kj-col{display:grid;align-content:end;justify-items:center;gap:4px;height:100%}
.kj-col i{display:block;width:100%;min-height:2px;border-radius:4px 4px 1px 1px;background:var(--g,#2f6b4f)}
.kj-col i.hi{background:#b58a3a}
.kj-col small{font-size:.66rem;color:var(--muted);font-variant-numeric:tabular-nums}
.kj-rows{display:grid;gap:7px}
.kj-row{display:grid;grid-template-columns:minmax(0,1.3fr) 2fr auto;gap:10px;align-items:center;font-size:.88rem}
.kj-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kj-row div{height:10px;border-radius:999px;background:var(--soft);overflow:hidden}
.kj-row div i{display:block;height:100%;border-radius:999px;background:var(--g,#2f6b4f)}
.kj-row b{font-variant-numeric:tabular-nums;font-weight:600;min-width:2.5em;text-align:right}
.kj-big{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.kj-big div{background:var(--soft);border-radius:14px;padding:12px 14px;display:grid;gap:2px}
.kj-big b{font-family:var(--serif);font-size:1.5rem;font-weight:500}
.kj-big span{font-size:.8rem;color:var(--muted)}
.kj-none{color:var(--muted);font-size:.88rem;margin:0}
</style>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/aliento.js"></script>
<script src="/assets/panel-ui.js"></script>
<script src="/assets/juego.js"></script>
'''
html = B.head('Juego · Habitat', 'Estadísticas de Kids & Hero.', 'juego.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
os.makedirs(B.OUT, exist_ok=True)
open(os.path.join(B.OUT, 'juego.html'), 'w', encoding='utf-8').write(html)
print('juego ok')
