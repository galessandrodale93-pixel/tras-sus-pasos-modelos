#!/usr/bin/env python3
"""Panel del voluntario: mis turnos de servicio, el equipo del mes y avisos en el teléfono."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Mi servicio en Habitat</p><h1 id="vHola">Hola</h1><p id="vWho">Cargando…</p><figure class="tt-word" id="ttWord" hidden><blockquote id="ttWordT"></blockquote><figcaption><span id="ttWordR"></span><button type="button" id="ttWordN">Otra palabra</button></figcaption></figure></div>
  <div class="tt-act"><a class="tt-ln" href="/tutor.html" id="toTut" hidden>Panel de tutores</a><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<div class="tt-main"><div class="wrap tt-v" id="vMain">
  <div class="vs-next tt-card" id="vNext"><p class="tt-empty">Cargando tus turnos…</p></div>
  <div class="vs-row">
    <div class="tt-card"><h2 class="tt-h">Tus próximos turnos</h2><div class="tt-tl" id="vList"></div></div>
    <div class="tt-card vs-cal"><h2 class="tt-h">Avisos en tu teléfono</h2><p class="tt-tip">Sumá tu calendario de servicio y te llega el recordatorio el mismo día los miércoles y jueves, y el viernes para el sábado. Si cambian los turnos, se actualiza solo.</p><div class="tt-wa"><a class="tt-btn" id="vIcs" href="#">Sumar a mi teléfono</a><a class="tt-btn s" id="vGcal" href="#" target="_blank" rel="noopener">Google Calendar</a></div><div class="tt-stats" id="vStats"></div></div>
  </div>
  <h2 class="tt-h">El equipo este mes</h2>
  <p class="tt-tip">Quién sirve en cada tarea. Lo tuyo aparece resaltado.</p>
  <div class="vs-weeks" id="vTeam"></div>
</div></div>
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/aliento.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,$=function(s){return document.querySelector(s);};
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var DL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],MS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var IC={'Limpieza y sillas':'🧹','Audio':'🎚️','Diapositivas':'🖥️','Zoom':'🎥','Asistencia presencial':'📋','Asistencia online':'💻'};
function pd(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function larga(s){var d=pd(s);return DL[d.getDay()]+' '+d.getDate()+' de '+MS[d.getMonth()];}
function palabra(){var w=window.HabitatAliento('vol');$('#ttWordT').textContent=w.t;$('#ttWordR').textContent=w.r||'Para vos, hoy';$('#ttWord').hidden=false;}
$('#ttWordN').onclick=palabra;palabra();
if(!A.loggedIn()){try{sessionStorage.setItem('habitat:ret','/voluntario.html');}catch(e){}location.replace('/ingresar.html');return;}
var h=new Date().getHours(),tk='';
try{await A.api('GET','/members/v1/members/my');tk=JSON.parse(localStorage.getItem('habitat:mtok')).a;}catch(e){}
fetch('/api/rol',{headers:{'x-habitat-auth':tk}}).then(function(r){return r.json();}).then(function(r){if(r.tutor)$('#toTut').hidden=false;}).catch(function(){});
var r={};try{r=await fetch('/api/voluntario',{headers:{'x-habitat-auth':tk}}).then(function(x){return x.json();});}catch(e){}
if(!r.voluntario){$('#vHola').textContent='Todavía no estás en el equipo de voluntarios';$('#vWho').textContent='Si servís en Habitat, pedile a la dirección que sume el email con el que entrás al Campus.';$('#vMain').innerHTML='';return;}
var nom=(r.voluntario.nombre||'').replace(/\\(.*\\)/,'').trim().split(' ')[0];
$('#vHola').textContent=(h<12?'Buen día':h<20?'Buenas tardes':'Buenas noches')+', '+nom;
var hoy=new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
var T=r.turnos||[];
$('#vWho').textContent=T.length?'Tenés '+T.length+(T.length===1?' turno':' turnos')+' por delante. Gracias por servir.':'No tenés turnos asignados por ahora.';
if(T.length){var n=T[0],dd=Math.round((pd(n.fecha)-pd(hoy))/864e5);
 $('#vNext').innerHTML='<p class="tt-lbl">'+(dd===0?'Hoy':dd===1?'Mañana':'En '+dd+' días')+'</p><h2>'+larga(n.fecha)[0].toUpperCase()+larga(n.fecha).slice(1)+'</h2><div class="vs-tasks">'+n.tareas.map(function(t){return '<span class="vs-task"><em>'+(IC[t]||'🙌🏽')+'</em>'+esc(t)+'</span>';}).join('')+'</div><p class="vs-time">Llegá a las <b>'+n.llegada+'</b> · la clase empieza a las '+n.clase+'</p><p class="tt-tip">'+esc(r.animo||'')+'</p>';}
else $('#vNext').innerHTML='<h2>Por ahora no tenés turnos</h2><p class="tt-tip">'+esc(r.animo||'')+'</p>';
$('#vList').innerHTML=T.map(function(t){return '<div><b>'+larga(t.fecha)+'</b><span>'+t.tareas.map(function(x){return (IC[x]||'')+' '+esc(x);}).join(' · ')+'</span><small>Llegada '+t.llegada+'</small></div>';}).join('')||'<div><span>Sin turnos por delante.</span></div>';
var ics=r.voluntario.ics;$('#vIcs').href=ics.replace(/^https:/,'webcal:');$('#vGcal').href='https://calendar.google.com/calendar/r?cid='+encodeURIComponent(ics.replace(/^https:/,'webcal:'));
var sv=r.servido||{};$('#vStats').innerHTML='<div class="tt-stat"><span class="tt-ring" style="--p:'+Math.min(100,(sv.dias||0)*4)+';--col:var(--gold)"><span>'+(sv.dias||0)+'</span></span><small>días que serviste este año</small></div><div class="tt-stat"><span class="tt-ring" style="--p:'+Math.min(100,(sv.tareas||0)*2)+'"><span>'+(sv.tareas||0)+'</span></span><small>tareas cumplidas</small></div>';
var E=r.equipo||[],by={};E.forEach(function(t){(by[t.fecha]=by[t.fecha]||[]).push(t);});
var fs=Object.keys(by).sort();
$('#vTeam').innerHTML=fs.length?fs.map(function(f){var L=by[f],tasks={};L.forEach(function(t){(tasks[t.tarea]=tasks[t.tarea]||[]).push(t);});return '<div class="tt-card vs-day'+(L.some(function(t){return t.yo;})?' mine':'')+(f<hoy?' past':'')+'"><h3>'+larga(f)+'</h3>'+Object.keys(IC).filter(function(k){return tasks[k];}).map(function(k){return '<div class="vs-l"><span>'+IC[k]+' '+k+'</span><span>'+tasks[k].map(function(t){return '<b class="'+(t.yo?'yo':'')+'">'+esc(String(t.quien).replace(/\\(.*\\)/,'').trim())+'</b>';}).join(', ')+'</span></div>';}).join('')+'</div>';}).join(''):'<p class="tt-empty">Todavía no se armó el servicio del mes.</p>';
})();
</script>
'''
css = '''<style>
.vs-next{display:grid;gap:10px;padding:26px}
.vs-next h2{font-size:clamp(1.9rem,4vw,2.6rem);line-height:1.05}
.vs-tasks{display:flex;flex-wrap:wrap;gap:10px}
.vs-task{display:inline-flex;gap:8px;align-items:center;font:600 1rem var(--sans);background:var(--soft);border-radius:999px;padding:10px 16px}
.vs-task em{font-style:normal;font-size:1.2rem}
.vs-time{font-size:1.05rem}
.vs-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.vs-cal{display:grid;gap:12px}
.vs-weeks{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.vs-day{display:grid;gap:6px;padding:14px}
.vs-day h3{font-family:var(--serif);font-size:1.25rem}.vs-day h3::first-letter{text-transform:uppercase}
.vs-day.mine{border-color:var(--gold);box-shadow:inset 0 0 0 1px var(--gold)}
.vs-day.past{opacity:.55}
.vs-l{display:flex;justify-content:space-between;gap:10px;font-size:.86rem;padding:4px 0;border-top:1px solid var(--line)}
.vs-l span:first-child{color:var(--muted)}
.vs-l b{font-weight:600}
.vs-l b.yo{background:var(--yb);color:var(--y);padding:1px 8px;border-radius:999px}
@media (max-width:760px){.vs-row{grid-template-columns:1fr}}
</style>
'''
html = B.head('Mi servicio · Habitat', 'Turnos de servicio de los voluntarios de Habitat CFM.', 'voluntario.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'voluntario.html'), 'w', encoding='utf-8').write(html)
print('voluntario ok')
