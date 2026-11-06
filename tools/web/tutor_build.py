#!/usr/bin/env python3
"""Panel del tutor: seguimiento de alumnos (asistencia, pagos, exámenes, grupo y contacto individual)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><span class="kick">Habitat · Tutores</span><h1>Seguimiento de alumnos</h1><p id="ttWho">Cargando…</p></div>
  <div class="tt-act">
    <button class="tt-bell" type="button" id="ttBell" aria-label="Notificaciones">Notificaciones<span id="ttBellN" hidden></span></button>
    <a class="tt-ln" href="/campus.html">Campus</a>
  </div>
</div></section>
<div class="tt-noti" id="ttNoti" hidden></div>
<nav class="tt-tabs" id="ttTabs"><div class="wrap">
  <button data-t="alumnos" class="on">Alumnos</button><button data-t="lista">Pasar lista</button><button data-t="seg">Seguimientos</button><button data-t="equipo" hidden id="tabEq">Equipo</button>
</div></nav>
<div class="tt-main"><div class="wrap">
  <section id="v-alumnos" class="tt-v">
    <div class="tt-sum" id="ttSum"></div>
    <div class="tt-fil">
      <input id="fQ" type="search" placeholder="Buscar alumno">
      <select id="fPar"><option value="">Todos los tutores</option></select>
      <select id="fCar"><option value="">Todas las carreras</option><option>Maranata</option><option>Liderazgo</option><option>Adoración</option></select>
      <select id="fMod"><option value="">Toda modalidad</option><option>Presencial</option><option>Zoom</option><option>Asincrónico</option></select>
      <select id="fEst"><option value="">Todos los estados</option><option value="r">🔴 Para seguimiento</option><option value="y">🟡 Para mirar</option><option value="g">🟢 Al día</option></select>
      <button class="tt-add" type="button" id="addAlu">+ Alumno</button>
    </div>
    <div class="tt-list" id="ttList"><p class="tt-empty">Cargando alumnos…</p></div>
  </section>
  <section id="v-lista" class="tt-v" hidden>
    <div class="tt-fil">
      <label class="tt-date">Clase del <input id="lDate" type="date"></label>
      <select id="lCar"><option value="">Todas las carreras</option><option>Maranata</option><option>Liderazgo</option><option>Adoración</option></select>
      <select id="lMod"><option value="">Presencial y Zoom</option><option>Presencial</option><option>Zoom</option></select>
      <select id="lPar"><option value="">Todos los tutores</option></select>
    </div>
    <p class="tt-tip">Tocá el estado de cada alumno. Se guarda solo. «Tarde» y «Mesa» (si se quedó al tiempo de mesa) se marcan aparte.</p>
    <div class="tt-roll" id="ttRoll"></div>
  </section>
  <section id="v-seg" class="tt-v" hidden>
    <h2 class="tt-h">Para contactar</h2>
    <p class="tt-tip">Alumnos en rojo o amarillo que nadie contactó en forma individual en las últimas dos semanas.</p>
    <div class="tt-list" id="ttTodo"></div>
    <h2 class="tt-h">Últimos seguimientos individuales</h2>
    <div class="tt-log" id="ttLog"></div>
  </section>
  <section id="v-equipo" class="tt-v" hidden>
    <h2 class="tt-h">Equipo de tutores</h2>
    <p class="tt-tip">Cada persona entra con el email de su cuenta de Habitat. Rol «Pagos» puede marcar pagos; «Director» además administra el equipo.</p>
    <div class="tt-team" id="ttTeam"></div>
    <form class="tt-tform" id="tForm">
      <input name="title" placeholder="Nombre" required><input name="email" type="email" placeholder="Email de su cuenta" required>
      <input name="pareja" placeholder="Pareja de tutores (ej. Cris y Raque)" list="parejas"><datalist id="parejas"></datalist>
      <select name="rol"><option value="tutor">Tutor</option><option value="pagos">Pagos</option><option value="director">Director</option></select>
      <button type="submit">Agregar</button>
    </form>
  </section>
</div></div>
<div class="tt-drawer" id="ttDrawer" hidden><div class="tt-dr-bg" data-x></div><aside class="tt-dr" role="dialog" aria-modal="true" aria-labelledby="drName"><button class="tt-x" type="button" data-x aria-label="Cerrar">✕</button><div id="drBody"></div></aside></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/tutor.js"></script>
'''
html = B.head('Panel de tutores · Habitat', 'Seguimiento de alumnos de Habitat CFM.', 'tutor.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'tutor.html'), 'w', encoding='utf-8').write(html)
print('tutor ok')
