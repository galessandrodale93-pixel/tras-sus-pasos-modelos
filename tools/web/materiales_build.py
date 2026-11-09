#!/usr/bin/env python3
"""Materiales del equipo: tutoriales en PDF y guía completa de Kids & Hero (enlazada por QR desde las presentaciones)."""
import os, sys, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B
SRC = '/home/claude/reportes/tutoriales/'
DST = os.path.join(B.OUT, 'materiales'); os.makedirs(DST, exist_ok=True)
docs = [
 ('1-la-web-y-el-campus.pdf', 'La web y el Campus', 'Cómo se entra, qué ve cada alumno y cómo se usa cada herramienta del Campus.'),
 ('3-mi-servicio-voluntarios.pdf', 'Mi servicio · voluntarios', 'Turnos, asistencia, avisos en el teléfono y el equipo del mes.'),
 ('6-intercesion-y-ayuno.pdf', 'Intercesión y ayuno', 'El turno diario de oración, el foco del día, los pedidos, la rueda del ayuno y la guía de tipos de ayuno.'),
 ('5-panel-de-profesores.pdf', 'Panel de profesores', 'Las clases de cada profe, su material, la reflexión y lo que se llevaron los alumnos.'),
 ('2-panel-de-tutores.pdf', 'Panel de tutores', 'La quincena, el semáforo, la ficha de cada alumno, pasar lista, tiempo de mesa, exámenes y TP.'),
]
docs2 = [
 ('4-herramientas-de-direccion.pdf', 'Herramientas de dirección', 'Calendario, clases y profes, armado del voluntariado y permisos del equipo.'),
 ('8-panel-de-sembradores.pdf', 'Panel de sembradores', 'La lista de sembradores, la bienvenida, los testimonios y el informe trimestral.'),
 ('7-testimonios-en-video.pdf', 'Testimonios en video', 'La propuesta de alumnos, la invitación, los recordatorios y la aprobación de cada video.'),
 ('9-finanzas-ingresos-salidas-debi.pdf', 'Finanzas · ingresos, salidas y Debi', 'Mercado Pago, cómo se clasifica cada movimiento, los débitos automáticos y los rechazos.'),
 ('10-edicion-de-videos.pdf', 'Edición de videos', 'Los estados de cada clase grabada, el plazo de siete días y el plan para ponernos al día.'),
]
for f,_,_ in docs+docs2:
    if os.path.exists(SRC+f): shutil.copy(SRC+f, DST)
game = 'kids-hero-guia-completa.pdf'
has_game = os.path.exists(os.path.join(DST, game))
it = lambda L, o: ''.join(f'<a class="mt-it" href="/materiales/{f}" target="_blank" rel="noopener"><span class="mt-n">{i+1+o}</span><span><b>{t}</b><small>{d}</small></span><span class="mt-go">PDF</span></a>' for i,(f,t,d) in enumerate(L))
items = it(docs, 0); items2 = it(docs2, len(docs))
gitem = f'<a class="mt-it mt-g" href="/materiales/{game}" target="_blank" rel="noopener"><span class="mt-n">★</span><span><b>Kids &amp; Hero · guía completa del juego</b><small>Todo el juego en detalle: controles, etapas, frutos, dones, aldeas, lugares secretos, conversaciones y más.</small></span><span class="mt-go">PDF</span></a>' if has_game else ''
body = f'''
<section class="mt"><div class="wrap">
<p class="mt-k">Materiales del equipo</p>
<h1>Tutoriales y playbooks</h1>
<p class="mt-l">Dónde está cada cosa en la web, el Campus y los paneles, y cómo se usa. Tocá un tutorial para abrirlo o descargarlo.</p>
<h2 class="mt-h">Para todo el equipo</h2>
<div class="mt-list">{items}</div>
<h2 class="mt-h">Dirección y áreas</h2>
<div class="mt-list">{items2}</div>
<h2 class="mt-h">Kids &amp; Hero</h2>
<div class="mt-list">{gitem}</div>
</div></section>
'''
css = '''<style>
.mt{padding:150px 0 90px;background:var(--paper,#fbf8f2)}
.mt .wrap{max-width:820px}
.mt-k{font:600 .8rem var(--sans);letter-spacing:.16em;text-transform:uppercase;color:#a07a3f}
.mt h1{font-family:var(--serif);font-size:clamp(2.4rem,6vw,3.6rem);line-height:1.05;margin:.3em 0 .4em}
.mt-l{color:#4d5c55;max-width:60ch;margin-bottom:28px}
.mt-list{display:grid;gap:12px}
.mt-h{font-family:var(--serif);font-weight:500;font-size:1.6rem;margin:36px 0 14px}
.mt-it{display:flex;gap:18px;align-items:center;padding:18px 20px;border:1px solid #e4dccd;border-radius:16px;background:#fff;color:inherit;text-decoration:none;transition:border-color .2s}
.mt-it:hover,.mt-it:focus-visible{border-color:#b0874a}
.mt-it b{display:block;font-size:1.05rem}
.mt-it small{display:block;color:#5d6b64;font-size:.9rem;margin-top:2px}
.mt-n{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#12241c;color:#f4ecdc;font-family:var(--serif);font-size:1.3rem}
.mt-go{margin-left:auto;font:700 .75rem var(--sans);letter-spacing:.1em;color:#a07a3f}
.mt-g{background:#12241c;color:#f4ecdc;border-color:#12241c}
.mt-g small{color:#cdbf9f}.mt-g .mt-n{background:#d6b277;color:#12241c}
</style>
'''
html = B.head('Tutoriales y playbooks · Habitat', 'Materiales del equipo de Habitat CFM.', 'materiales.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1">')
html += body + B.FOOT + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'materiales.html'), 'w', encoding='utf-8').write(html)
print('materiales ok', has_game)
