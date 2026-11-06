#!/usr/bin/env python3
"""Panel del tutor: seguimiento pastoral de alumnos, lista, tiempo de mesa, calendario y voluntarios."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Panel de tutores</p><h1 id="ttHola">Hola</h1><p id="ttWho">Cargando…</p><figure class="tt-word" id="ttWord" hidden><blockquote id="ttWordT"></blockquote><figcaption><span id="ttWordR"></span><button type="button" id="ttWordN">Otra palabra</button></figcaption></figure></div>
  <div class="tt-act">
    <button class="tt-bell" type="button" id="ttBell" aria-label="Notificaciones"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1Z" fill="currentColor"/></svg><span id="ttBellN" hidden></span></button>
    <a class="tt-ln" href="/finanzas.html" id="toFin" hidden>Finanzas</a>
    <a class="tt-ln" href="/voluntario.html" id="toVol" hidden>Mi servicio</a>
    <a class="tt-ln" href="/campus.html">Campus</a>
  </div>
</div></section>
<div class="tt-pop" id="ttNoti" hidden role="dialog" aria-label="Notificaciones"></div>
<nav class="tt-tabs" id="ttTabs"><div class="wrap">
  <button data-t="hoy" class="on">Hoy</button><button data-t="alumnos">Alumnos</button><button data-t="lista">Pasar lista</button><button data-t="mesa">Tiempo de mesa</button><button data-t="cal" hidden id="tabCal">Calendario</button><button data-t="clases" hidden id="tabCla">Clases y profes</button><button data-t="vol" hidden id="tabVol">Voluntarios</button><button data-t="equipo" hidden id="tabEq">Equipo</button>
</div></nav>
<div class="tt-main"><div class="wrap">
  <section id="v-hoy" class="tt-v"></section>
  <section id="v-alumnos" class="tt-v" hidden>
    <div class="tt-bar">
      <input id="fQ" type="search" placeholder="Buscar por nombre" aria-label="Buscar alumno">
      <button class="tt-btn" type="button" id="addAlu">Sumar alumno</button>
    </div>
    <div class="tt-pills" id="fPills"></div>
    <div class="tt-people" id="ttList"><p class="tt-empty">Cargando alumnos…</p></div>
  </section>
  <section id="v-lista" class="tt-v" hidden>
    <div class="tt-bar">
      <label class="tt-date">Clase del <input id="lDate" type="date"></label>
      <button class="tt-btn s" type="button" id="lAll">Marcar todos presentes</button>
    </div>
    <div class="tt-pills" id="lPills"></div>
    <div class="tt-prog"><i id="lBar"></i><span id="lCnt"></span></div>
    <p class="tt-tip" id="lTip">Tocá a cada alumno para marcar cómo vino. Cada toque pasa al estado siguiente: presente, Zoom, ausente, justificó. Si vino, abajo podés marcar si llegó tarde o si se quedó al tiempo de mesa. Se guarda solo.</p>
    <div class="tt-roll" id="ttRoll"></div>
  </section>
  <section id="v-mesa" class="tt-v" hidden>
    <div class="tt-mesa">
      <form class="tt-card tt-form" id="mesaF">
        <h2 class="w">Registrar un tiempo de mesa</h2>
        <label>Fecha<input type="date" name="fecha" required></label>
        <label>Carrera<select name="programa"><option>Maranata</option><option>Liderazgo</option><option>Adoración</option><option>General</option></select></label>
        <label class="w">Quién coordinó<input name="tutor"></label>
        <div class="w"><p class="tt-lbl">Quiénes estuvieron <span id="mesaN"></span></p><div class="tt-faces" id="mesaAl"></div></div>
        <label class="w">De qué se charló<textarea name="temas" placeholder="Temas, preguntas que surgieron, testimonios…"></textarea></label>
        <label class="w">Qué notaste<textarea name="observaciones" placeholder="Cómo viste al grupo, alguien para acompañar, pedidos de oración…"></textarea></label>
        <button class="tt-btn" type="submit">Guardar tiempo de mesa</button>
      </form>
      <div><h2 class="tt-h">Mesas anteriores</h2><div class="tt-log" id="mesaLog"></div></div>
    </div>
  </section>
  <section id="v-cal" class="tt-v" hidden>
    <div class="tt-calh"><button class="tt-arrow" type="button" id="calPrev" aria-label="Mes anterior">‹</button><h2 id="calTit"></h2><button class="tt-arrow" type="button" id="calNext" aria-label="Mes siguiente">›</button></div>
    <div class="tt-month" id="calGrid"></div>
    <p class="tt-tip">Tocá un día para agregar una clase, un examen o un aviso. Todo lo que cargues aparece en la agenda del Campus y en el teléfono de los alumnos.</p>
  </section>
  <section id="v-clases" class="tt-v" hidden>
    <div class="tt-bar"><div class="tt-pills" id="cProg"></div><button class="tt-btn" type="button" id="cAdd">Sumar clase</button></div>
    <div class="tt-pills" id="cProfes"></div>
    <div id="cList"></div>
    <h2 class="tt-h">Plan de bloques</h2>
    <div id="cPlan"></div>
  </section>
  <section id="v-vol" class="tt-v" hidden>
    <div class="tt-calh"><button class="tt-arrow" type="button" id="volPrev" aria-label="Semana anterior">‹</button><h2 id="volTit"></h2><button class="tt-arrow" type="button" id="volNext" aria-label="Semana siguiente">›</button></div>
    <div class="tt-vwrap">
      <aside class="tt-roster"><p class="tt-lbl">Equipo</p><div id="volRoster"></div><button class="tt-btn s" type="button" id="volAdd">Sumar voluntario</button><p class="tt-tip">Arrastrá a una persona hasta la tarea. En el teléfono: tocá a la persona y después la tarea.</p></aside>
      <div class="tt-board" id="volGrid"></div>
    </div>
    <div class="tt-cover" id="volMonth"></div>
    <div class="tt-card tt-esp" id="volEsp"><div class="tt-bar"><div><h2 class="tt-h">Zarza, tiempo de mesa y Selah</h2><p class="tt-tip">Las fechas especiales con sus músicos, encargados y voluntarios. A cada uno le llega el aviso igual que al servicio de las clases.</p></div><button class="tt-btn" type="button" id="espAdd">Nueva fecha</button></div><div id="espList"></div></div>
  </section>
  <section id="v-equipo" class="tt-v" hidden>
    <h2 class="tt-h">Equipo de tutores</h2>
    <p class="tt-tip">Cada persona entra con el email de su cuenta de Habitat. Todos ven todo. Además, cada uno puede tener permiso para pasar lista o marcar pagos. Los directores organizan el calendario, las clases y el equipo; quienes organizan arman el servicio de voluntarios, Zarza, el tiempo de mesa por Zoom y Selah; Finanzas es para quienes llevan cobros y gastos.</p>
    <div class="tt-team" id="ttTeam"></div>
    <form class="tt-card tt-form" id="tForm">
      <label>Nombre<input name="title" required></label><label>Email de su cuenta<input name="email" type="email" required></label>
      <label>Pareja de tutores<input name="pareja" list="parejas" placeholder="Ej.: Cris y Raque"><datalist id="parejas"></datalist></label>
      <label>Rol<select name="rol"><option value="tutor">Tutor</option><option value="director">Director</option></select></label>
      <label class="tt-inl"><input type="checkbox" name="lista"> Pasa lista</label><label class="tt-inl"><input type="checkbox" name="pagos"> Marca pagos</label><label class="tt-inl"><input type="checkbox" name="org"> Organiza el servicio</label><label class="tt-inl"><input type="checkbox" name="gastos"> Finanzas</label>
      <button class="tt-btn" type="submit">Dar acceso</button>
    </form>
  </section>
</div></div>
<div class="tt-drawer" id="ttDrawer" hidden><div class="tt-dr-bg" data-x></div><aside class="tt-dr" role="dialog" aria-modal="true" aria-labelledby="drName"><button class="tt-x" type="button" data-x aria-label="Cerrar">✕</button><div id="drBody"></div></aside></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/aliento.js"></script>
<script src="/assets/tutor.js"></script>
'''
html = B.head('Panel de tutores · Habitat', 'Seguimiento de alumnos de Habitat CFM.', 'tutor.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'tutor.html'), 'w', encoding='utf-8').write(html)
print('tutor ok')
