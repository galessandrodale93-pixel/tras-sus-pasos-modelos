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
  <button data-t="alumnos" class="on">Alumnos</button><button data-t="lista">Pasar lista</button><button data-t="seg">Seguimientos</button><button data-t="mesa">Tiempo de mesa</button><button data-t="cal" hidden id="tabCal">Calendario</button><button data-t="vol" hidden id="tabVol">Voluntarios</button><button data-t="equipo" hidden id="tabEq">Equipo</button>
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
    <div id="tallyBox"></div>
    <h2 class="tt-h">Para contactar</h2>
    <p class="tt-tip">Alumnos en rojo o amarillo que nadie contactó en forma individual en las últimas dos semanas.</p>
    <div class="tt-list" id="ttTodo"></div>
    <h2 class="tt-h">Últimos seguimientos individuales</h2>
    <div class="tt-log" id="ttLog"></div>
  </section>
  <section id="v-mesa" class="tt-v" hidden>
    <h2 class="tt-h">Tiempo de mesa</h2>
    <p class="tt-tip">Después de cada tiempo de mesa, el tutor a cargo deja registrado quiénes estuvieron, de qué se habló y qué notó.</p>
    <form class="tt-blk tt-form" id="mesaF">
      <label>Fecha<input type="date" name="fecha" required></label>
      <label>Carrera<select name="programa"><option>Maranata</option><option>Liderazgo</option><option>Adoración</option><option>General</option></select></label>
      <label class="w">Tutor a cargo<input name="tutor" placeholder="Quién coordinó el espacio"></label>
      <div class="w"><b class="tt-lbl">¿Quiénes estuvieron?</b><div class="tt-chk" id="mesaAl"></div></div>
      <label class="w">¿De qué se charló?<textarea name="temas" placeholder="Temas, preguntas que surgieron, testimonios…"></textarea></label>
      <label class="w">¿Qué notaste?<textarea name="observaciones" placeholder="Cómo vio al grupo, alguien para acompañar, pedidos de oración…"></textarea></label>
      <button class="tt-btn" type="submit">Guardar tiempo de mesa</button>
    </form>
    <div class="tt-log" id="mesaLog"></div>
  </section>
  <section id="v-cal" class="tt-v" hidden>
    <div class="tt-calh"><button class="tt-btn s" type="button" id="calPrev">‹</button><h2 class="tt-h" id="calTit"></h2><button class="tt-btn s" type="button" id="calNext">›</button></div>
    <p class="tt-tip">Lo que cargues acá aparece en la agenda del Campus y en el calendario del teléfono de cada alumno. Marcá «Tiempo de mesa» en las fechas de examen.</p>
    <div class="tt-cal" id="calList"></div>
    <form class="tt-blk tt-form" id="evF">
      <h3 class="w">Nuevo evento o aviso</h3>
      <label class="w">Título<input name="title" required placeholder="Ej.: Examen Bloque 3"></label>
      <label>Tipo<select name="tipo"><option>Clase</option><option>Examen</option><option>Clase en vivo</option><option>Encuentro</option><option>Aviso</option><option>Feriado</option></select></label>
      <label>Carrera<input name="curso" placeholder="Maranata, Liderazgo, Adoración o vacío para todos"></label>
      <label>Día y hora<input type="datetime-local" name="inicio" required></label>
      <label>Termina<input type="datetime-local" name="fin"></label>
      <label class="w">Detalle<textarea name="descripcion"></textarea></label>
      <label>Lugar<input name="lugar" placeholder="Sede, Zoom…"></label>
      <label>Link<input name="link" placeholder="https://"></label>
      <label class="w tt-inl"><input type="checkbox" name="mesa"> Tiempo de mesa después</label>
      <button class="tt-btn" type="submit">Agregar al calendario</button>
    </form>
  </section>
  <section id="v-vol" class="tt-v" hidden>
    <div class="tt-calh"><button class="tt-btn s" type="button" id="volPrev">‹</button><h2 class="tt-h" id="volTit"></h2><button class="tt-btn s" type="button" id="volNext">›</button></div>
    <p class="tt-tip">Tocá una tarea y elegí quién la hace. Una persona puede tener varias. Cada voluntario recibe el aviso por mail y en su teléfono: miércoles y jueves el mismo día (llegada 19:00), sábados el viernes (llegada 9:30).</p>
    <div class="tt-vgrid" id="volGrid"></div>
    <h2 class="tt-h">Equipo de voluntarios</h2>
    <div class="tt-team" id="volTeam"></div>
    <form class="tt-tform" id="volF"><input name="title" placeholder="Nombre" required><input name="email" type="email" placeholder="Email"><input name="telefono" placeholder="WhatsApp"><input name="disponibilidad" placeholder="Disponibilidad"><button type="submit">Agregar</button></form>
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
