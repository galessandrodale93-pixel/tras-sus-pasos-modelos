#!/usr/bin/env python3
"""Campus Habitat (prototipo): Mis cursos, reproductor de clases, perfil e ingreso.
Usa datos reales de un programa (Los atributos de Dios) leídos del sitio actual."""
import os, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

W = 'https://static.wixstatic.com/media/'
COV = {
    'atributos': ('Los atributos de Dios', '43ca3b_be6b10cf02b74221b884495e0c0f03cd~mv2.jpg', 'Curso online'),
    'caracter': ('Carácter, identidad y propósito', '43ca3b_42ba2eb465294789a25d05a88c677cc4~mv2.jpg', 'Curso online'),
    'maranata': ('Escuela Maranata', '43ca3b_7b3fe0d3404b4c269c5c9b1bce87d2ca~mv2.jpg', 'Escuela anual'),
    'adoracion': ('Carrera de Adoración', '43ca3b_ee131f8d5f1846b4808690276d369b35~mv2.jpg', 'Carrera · CMA'),
    'liderazgo': ('Liderazgo', '43ca3b_d4dfb3e1124b48ca962f701714c8d2fe~mv2.jpg', 'Curso online'),
    'plan': ('El plan de Dios', '43ca3b_38407e07a36c4f59b1338ba1ca9537c2~mv2.jpg', 'Curso online'),
    'intensiva': ('Escuela Intensiva de Liderazgo', '43ca3b_638e22dd5be64c46a38c0f4d576fa4b6~mv2.jpg', 'Escuela'),
    'desierto': ('Escuela del Desierto', '43ca3b_56d2b89cf2ad416c91137a75aafeeb68~mv2.jpg', 'Escuela'),
    'dones': ('Dones, ministerios y operaciones', '43ca3b_6a11e886a2364f2dba1dfdd32f5dccf9~mv2.jpg', 'Curso'),
    'carreralid': ('Carrera de Liderazgo', '43ca3b_7701e58b26ce4707a029eeb417bc7002~mv2.jpg', 'Carrera · CML'),
    'emo': ('Escuela Ministerial Online', '43ca3b_a81ca8cf5d684a80a99677cf34726d84~mv2.jpg', 'Escuela online'),
    'predicas': ('Prédicas y Presentaciones', '43ca3b_a709704ae4a84d57bd2575c290124a33~mv2.jpg', 'Taller'),
}
def cov(k, w=800, h=450):
    return f'{W}{COV[k][1]}/v1/fill/w_{w},h_{h},al_c,q_82,enc_auto/c.jpg'

V = 'https://video.wixstatic.com/video/{}/720p/mp4/file.mp4'
COURSE = {
    'id': 'atributos', 'title': 'Los atributos de Dios', 'cover': cov('atributos', 1600, 900),
    'details': 'En este programa estaremos viendo los atributos de Dios y cómo los mismos nos edifican para un crecimiento integral y una amplitud en cuanto al conocimiento de Su persona.',
    'sections': [
        {'title': 'La santidad y el temor de Dios', 'steps': [
            {'id': 's1', 't': 'Material en PDF completo', 'type': 'pdf', 'file': 'https://static.wixstatic.com/ugd/43ca3b_0b8d765f40104bd8b7b8b968779b754a.pdf', 'fname': 'Madurez Espiritual II - Cápsula 1 · Material.pdf', 'size': '22,8 MB'},
            {'id': 's2', 't': 'Parte 1', 'type': 'video', 'src': V.format('43ca3b_4a260105df2f429da96e1001a3ee9d91'), 'min': 24},
            {'id': 's3', 't': 'Parte 2', 'type': 'video', 'src': V.format('43ca3b_549ccfdec84745d6b3b037d1f88960c3'), 'min': 24},
            {'id': 's4', 't': 'Parte 3', 'type': 'video', 'src': V.format('43ca3b_c4a90d6e12ac42a7b6303872efe2f5df'), 'min': 14},
        ]},
        {'title': 'El amor y la gracia de Dios', 'steps': [
            {'id': 's5', 't': 'Material en PDF completo', 'type': 'pdf', 'file': '', 'fname': 'Material de la sección', 'size': ''},
            {'id': 's6', 't': 'Parte 1', 'type': 'video', 'src': '', 'min': 32},
            {'id': 's7', 't': 'Parte 2', 'type': 'video', 'src': '', 'min': 31},
            {'id': 's8', 't': 'Parte 3', 'type': 'video', 'src': '', 'min': 35},
        ]},
    ],
}
MINE = [('atributos', 38, 'La santidad y el temor de Dios · Parte 2'), ('maranata', 64, 'Los siete sellos · Clase 12'), ('adoracion', 56, 'Adoración en el tabernáculo · Clase 5')]
MORE = ['caracter', 'plan', 'liderazgo', 'intensiva', 'desierto', 'dones']

CSS = '''<link rel="stylesheet" href="/assets/campus.css">'''
BADGE = '<div class="proto">Prototipo del Campus · los datos de progreso son de ejemplo</div>'


def page(fn, title, body, js=''):
    html = B.head(title, 'Campus Habitat: tus cursos, clases y progreso.', fn).replace('</head>', CSS + '\n</head>')
    html = html.replace('<body>', '<body data-solid="1" class="campus">')
    html += '' + body + B.FOOT + js + '</body>\n</html>\n'
    open(os.path.join(B.OUT, fn), 'w', encoding='utf-8').write(html)


# ---------- Mis cursos (datos reales) ----------
campus = '''
<section class="cx-hero"><div class="wrap">
  <div class="hi rv in"><span class="kick">Campus Habitat</span><h1>Hola<em id="hiName"></em></h1><p id="hiLine">Cargando tus cursos…</p><div class="hi-act"><a class="out" href="#agenda" id="bell">Avisos<span class="bd" id="bellN" hidden></span></a><a class="out" href="/biblia.html">Biblia</a><a class="out" href="/diario.html">Mi diario</a><a class="out" href="/perfil.html">Mi perfil</a><button class="out gold eq-btn" type="button" id="lnGes" hidden aria-expanded="false" aria-controls="equipo">Gestión Habitat<span class="bd" id="gesN" hidden></span></button><a class="out gold" href="/testimonio.html" id="lnTes" hidden>Mi testimonio 🎥</a><button class="out-txt" type="button" id="outBtn">Cerrar sesión</button></div></div>
  <a class="resume rv in" id="resume" href="#" hidden>
    <div class="rimg"><img id="rImg" src="" alt=""><span class="play" aria-hidden="true">▶</span></div>
    <div class="rtx"><span class="kick">Continuar</span><b id="rStep"></b><small id="rProg"></small><div class="bar"><i id="rBar"></i></div></div>
  </a>
</div></section>
<section class="cx-stats"><div class="wrap">
  <div class="st"><b id="sCur">–</b><span>cursos en curso</span></div>
  <div class="st"><b id="sDone">–</b><span>clases vistas</span></div>
  <div class="st"><b id="sHrs">–</b><span>de formación</span></div>
  <div class="st"><b id="sFin">–</b><span>programas completos</span></div>
</div></section>
<section class="cx-sec eq-sec" id="equipo" hidden><div class="wrap">
  <div class="cx-h"><h2>Gestión Habitat</h2><span class="sub">Lo que te toca en el equipo</span></div>
  <nav class="eq-tabs" id="eqTabs" role="tablist"></nav>
  <div id="eqGrupos"></div>
</div></section>
<style>
.eq-sec{padding-bottom:10px;animation:eqIn .35s cubic-bezier(.2,.8,.2,1)}
@keyframes eqIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.eq-tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin:-6px 0 22px}
.eq-tabs:empty{display:none}
.eq-tabs button{border:0;background:none;padding:12px 14px;font:600 .92rem var(--sans);color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:inline-flex;gap:8px;align-items:center}
.eq-tabs button.on{color:var(--ink);border-bottom-color:var(--gold)}
.eq-tabs button i{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:99px;background:var(--gold-2);color:var(--ink);font:700 .7rem/20px var(--sans);text-align:center}
.eq-g[hidden]{display:none}
.eq-btn{position:relative}.eq-btn[aria-expanded=true]{box-shadow:0 0 0 3px rgba(217,184,120,.35)}
.eq-btn .bd{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:99px;background:#b7442f;color:#fff;font:700 .66rem/18px var(--sans);text-align:center;padding:0 5px}
.eq-cs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.eq-c{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;align-items:start;padding:18px;border-radius:20px;border:1px solid var(--line);background:#fff;color:inherit;text-decoration:none;transition:transform .25s cubic-bezier(.2,.8,.2,1),border-color .25s,box-shadow .25s}
.eq-c:hover,.eq-c:focus-visible{transform:translateY(-3px);border-color:var(--gold);box-shadow:0 10px 26px -18px rgba(16,37,29,.45)}
.eq-c i{grid-row:span 3;font-style:normal;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:1.35rem;background:var(--paper);border:1px solid var(--line)}
.eq-c b{font:500 1.3rem/1.15 var(--serif);color:var(--ink)}
.eq-c small{color:var(--muted);font-size:.86rem;line-height:1.4}
.eq-c em{font-style:normal;justify-self:start;margin-top:6px;font:600 .76rem var(--sans);padding:5px 10px;border-radius:999px;background:var(--sand);color:var(--ink)}
.eq-c em:empty{display:none}
.eq-c.hot{background:var(--ink);border-color:var(--ink)}
.eq-c.hot b{color:var(--cream)}.eq-c.hot small{color:rgba(246,240,228,.72)}.eq-c.hot i{background:rgba(246,240,228,.1);border-color:rgba(246,240,228,.18)}
.eq-c.hot em{background:var(--gold-2);color:var(--ink)}
.out-txt{border:0;background:none;color:rgba(246,240,228,.6);font:500 .82rem var(--sans);text-decoration:underline;cursor:pointer;padding:8px 4px;align-self:center}
.out-txt:hover{color:var(--cream)}
</style>
<section class="cx-sec" id="opina" hidden><div class="wrap">
  <div class="cx-h"><h2>¿Cómo estuvo la clase?</h2></div>
  <div id="opList"></div>
</div></section>
<section class="cx-sec" id="matSec" hidden><div class="wrap">
  <div class="cx-h"><h2>Material de tus clases</h2></div>
  <div class="op-mats" id="matList"></div>
</div></section>
<section class="cx-sec" id="agenda"><div class="wrap">
  <div class="cx-h"><h2>Agenda y avisos</h2><span class="cal-act"><a id="calG" href="#" target="_blank" rel="noopener">+ Google Calendar</a><a id="calI" href="#">+ iPhone / Outlook</a></span></div>
  <div class="ag" id="agList"><p class="cx-empty">Cargando la agenda…</p></div>
  <p class="ag-tip">Sumá el calendario de Habitat a tu teléfono y te llegan los recordatorios de cada clase en vivo: un día antes y una hora antes.</p>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Mis cursos</h2><a href="/perfil.html">Ver mi progreso →</a></div>
  <div class="cx-grid" id="mine"><p class="cx-empty">Cargando…</p></div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="op-box" id="buzon"><div><h2>Buzón de ideas</h2><p>¿Viste algo para mejorar en Habitat o algo que te encantó? Contanos. Lo lee la dirección.</p></div><button type="button" class="op-btn" id="buzBtn">Escribir</button><form class="op-f" id="buzF" hidden><label>Lo que me gustó<textarea name="gusto" rows="3"></textarea></label><label>Algo para mejorar<textarea name="mejora" rows="3"></textarea></label><button type="submit" class="op-btn">Enviar</button></form></div>
</div></section>
<section class="cx-sec alt"><div class="wrap">
  <div class="cx-h"><h2>Seguí creciendo</h2><a href="/formacion.html">Toda la formación →</a></div>
  <div class="cx-more" id="more"></div>
</div></section>
'''
campus_js = '''<script src="/assets/auth.js"></script>
<script src="/assets/opina.js" defer></script>
<script src="/assets/campus-data.js"></script>
<script src="/assets/campus-extra.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,D=window.CampusData;
if(!A.loggedIn()){location.replace('/ingresar.html');return;}
document.getElementById('outBtn').onclick=function(){A.logout();};
var X=window.CampusExtra;
(async function(){try{await A.api('GET','/members/v1/members/my');var tk=JSON.parse(localStorage.getItem('habitat:mtok')).a;
 fetch('/api/rol?resumen=1',{headers:{'x-habitat-auth':tk}}).then(function(r){return r.json();}).then(function(r){
 var d=r.datos||{},DL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],hoy=new Date(Date.now()-3*3600e3).toISOString().slice(0,10),man=new Date(Date.now()+21*3600e3).toISOString().slice(0,10);
 var cuando=function(f){if(!f)return '';if(f===hoy)return 'hoy';if(f===man)return 'mañana';var x=new Date(f+'T12:00:00');return 'el '+DL[x.getDay()]+' '+x.getDate()+'/'+(x.getMonth()+1);};
 var oraT=d.oracion?'Te toca orar y ayunar '+cuando(d.oracion):'',ed=d.edicion,edT=ed?(r.tutor==='director'?(ed.entregar?ed.entregar+' para entregar':'')+(ed.editadas?(ed.entregar?' · ':'')+ed.editadas+' para subir':''):(ed.edicion?ed.edicion+' en edición':'')+(ed.editadas?(ed.edicion?' · ':'')+ed.editadas+' para subir':'')):'';
 var dir=r.tutor==='director',SV=[],AC=[],DI=[];
 var C=function(L,ok,id,href,ic,t,dsc,dato,hot){if(ok)L.push([id,href,ic,t,dsc,dato,hot]);};
 C(SV,r.voluntario,'vol','/voluntario.html','🙌🏽','Mi servicio','Tus turnos, avisos y el equipo del mes','');
 C(SV,r.intercesion,'ora','/intercesion.html','🙏','Intercesión y ayuno','El foco del día, los pedidos y tu turno',oraT,d.oracion===hoy||d.oracion===man);
 C(dir?DI:SV,r.org,'org','/organizacion.html','🗓️','Organización','Calendario, clases, servicio y equipo','');
 C(dir?DI:SV,r.finanzas,'fin','/finanzas.html','💰','Finanzas','Cobros, ingresos, salidas y Debi',d.porClasificar>0?d.porClasificar+' por clasificar':'');
 C(DI,r.sembradores,'sem','/sembradores-panel.html','🌱','Sembradores','Quienes siembran, testimonios e informes',d.sembradores>0?d.sembradores+' sembrador'+(d.sembradores===1?'':'es'):'');
 C(dir?DI:SV,r.edicion,'ed','/edicion.html','🎬','Edición de videos','Las clases grabadas, de la entrega al Campus',edT);
 C(AC,r.tutor,'tut','/tutor.html','🤝','Panel de tutores','Seguimiento, lista y tiempo de mesa','');
 C(AC,r.profe,'prof','/profesor.html','🎓','Profesores','Tus clases, el material y tu reflexión','');
 var equipo=SV.length||AC.length||DI.length;if(!equipo)return;
 C(SV,true,'mat','/materiales.html','📘','Tutoriales','Cómo se usa cada panel, paso a paso','');
 var G=[['sv','Mi servicio',SV],['ac','Acompañar alumnos',AC],['di','Dirección',DI]].filter(function(g){return g[2].length;});
 var card=function(c){return '<a class="eq-c'+(c[6]?' hot':'')+'" id="eq-'+c[0]+'" href="'+c[1]+'"><i aria-hidden="true">'+c[2]+'</i><b>'+c[3]+'</b><small>'+c[4]+'</small><em>'+X.esc(c[5])+'</em></a>';};
 var nG=function(g){return g[2].filter(function(c){return c[6];}).length;};
 document.getElementById('eqTabs').innerHTML=G.length>1?G.map(function(g){var n=nG(g);return '<button type="button" role="tab" data-g="'+g[0]+'">'+g[1]+(n?'<i>'+n+'</i>':'')+'</button>';}).join(''):'';
 document.getElementById('eqGrupos').innerHTML=G.map(function(g){return '<div class="eq-g" data-g="'+g[0]+'" role="tabpanel"><div class="eq-cs">'+g[2].map(card).join('')+'</div></div>';}).join('');
 var ls=function(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}};
 var tab=function(id){if(!G.some(function(g){return g[0]===id;}))id=G[0][0];document.querySelectorAll('#eqTabs button').forEach(function(b){b.classList.toggle('on',b.dataset.g===id);b.setAttribute('aria-selected',b.dataset.g===id);});document.querySelectorAll('#eqGrupos .eq-g').forEach(function(p){p.hidden=p.dataset.g!==id;});ls('cx:eqTab',id);};
 document.querySelectorAll('#eqTabs button').forEach(function(b){b.onclick=function(){tab(b.dataset.g);};});
 var hotG=G.filter(nG)[0];tab(ls('cx:eqTab')||(hotG?hotG[0]:G[0][0]));
 var sec=document.getElementById('equipo'),btn=document.getElementById('lnGes'),tot=G.reduce(function(a,g){return a+nG(g);},0);
 btn.hidden=false;if(tot){var bn=document.getElementById('gesN');bn.textContent=tot;bn.hidden=false;}
 var abrir=function(o,sc){sec.hidden=!o;btn.setAttribute('aria-expanded',o);ls('cx:eqOpen',o?'1':'0');if(o&&sc)sec.scrollIntoView({behavior:'smooth',block:'start'});};
 btn.onclick=function(){abrir(sec.hidden,true);};
 abrir(location.hash==='#gestion'||ls('cx:eqOpen')==='1',location.hash==='#gestion');
 window.__eqVol&&window.__eqVol();
}).catch(function(){});fetch('/api/testimonio',{headers:{'x-habitat-auth':tk}}).then(function(r){return r.json();}).then(function(t){if(t&&t.clave&&t.estado!=='Subido'){var a=document.getElementById('lnTes');a.href='/testimonio.html?k='+t.clave;a.hidden=false;}}).catch(function(){});var r=await fetch('/api/voluntario',{headers:{'x-habitat-auth':tk}}).then(function(r){return r.json();});
 if(!r.voluntario||!r.turnos||!r.turnos.length)return;var hoy=new Date(Date.now()-3*3600e3).toISOString().slice(0,10),man=new Date(Date.now()+21*3600e3).toISOString().slice(0,10);window.__eqVol=function(){var c=document.querySelector('#eq-vol em');if(!c)return;var t=r.turnos[0],x=new Date(t.fecha+'T12:00:00-03:00');c.textContent=(t.fecha===hoy?'Servís hoy':t.fecha===man?'Servís mañana':'Tu próximo turno: '+['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][x.getDay()]+' '+x.getDate()+'/'+(x.getMonth()+1));if(t.fecha===hoy||t.fecha===man)c.parentNode.classList.add('hot');};window.__eqVol();
}catch(e){}})();
function agenda(pids){X.agenda(pids).then(function(L){
 var now=Date.now(),up=L.filter(function(e){return (e.end||e.ini).getTime()>=now-3600e3;}),av=L.filter(function(e){return /aviso/i.test(e.tipo||'')&&e.ini.getTime()<=now;}).reverse().slice(0,4);
 var n=X.unseen(L);var bn=document.getElementById('bellN');if(n){bn.textContent=n;bn.hidden=false;}
 document.getElementById('bell').addEventListener('click',function(){X.markSeen();bn.hidden=true;});
 var it=function(e){var live=/vivo|encuentro/i.test(e.tipo||'');return '<div class="ag-it'+(e.destacado?' hot':'')+'"><div class="ag-d"><b>'+e.ini.getDate()+'</b><small>'+X.fecha(e.ini).split(' ')[0]+' · '+X.fecha(e.ini).split(' ')[2]+'</small></div><div class="ag-t"><span class="ag-k">'+X.esc(e.tipo||'Aviso')+(e.curso?' · '+X.esc(e.curso):'')+'</span><b>'+X.esc(e.title)+'</b>'+(e.descripcion?'<p>'+X.esc(e.descripcion)+'</p>':'')+'<small>'+(/aviso/i.test(e.tipo||'')?'':X.hora(e.ini)+' h'+(e.lugar?' · '+X.esc(e.lugar):''))+'</small></div>'+(e.link&&live?'<a class="ag-go" href="'+X.esc(e.link)+'" target="_blank" rel="noopener">Entrar</a>':e.link?'<a class="ag-go s" href="'+X.esc(e.link)+'" target="_blank" rel="noopener">Ver</a>':'')+'</div>';};
 var h=up.filter(function(e){return !/aviso/i.test(e.tipo||'');}).slice(0,6).map(it).join('');
 var ha=av.map(it).join('');
 document.getElementById('agList').innerHTML=(ha?'<h3 class="ag-h">Avisos</h3>'+ha:'')+(h?'<h3 class="ag-h">Próximamente</h3>'+h:'')||'<p class="cx-empty">No hay clases en vivo ni avisos por ahora. Cuando haya, te aparecen acá y en tu calendario.</p>';
}).catch(function(){document.getElementById('agList').innerHTML='<p class="cx-empty">No pudimos cargar la agenda.</p>';});
 document.getElementById('calG').href=X.google();document.getElementById('calI').href=X.webcal();}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var K={curso:'Curso online',escuela:'Escuela',carrera:'Carrera'};
try{
 var me=await D.me();
 document.getElementById('hiName').textContent=me.first?', '+me.first:'';
 var parts=await D.participations(me.id);
 var progs=await Promise.all(parts.map(function(p){return D.program(p.programId).catch(function(){return null;});}));
 var rows=[];
 for(var i=0;i<parts.length;i++){ if(!progs[i])continue;
   var rs=await D.resolved(parts[i].id).catch(function(){return[];});
   var done=rs.filter(function(r){return r.status!=='FAILED';}).length;
   var tot=(progs[i].contentSummary&&progs[i].contentSummary.stepCount)||0;
   rows.push({part:parts[i],prog:progs[i],done:done,tot:tot,pct:tot?Math.min(100,Math.round(done*100/tot)):0,last:parts[i].lastActivityDate||parts[i].createdDate||''});
 }
 rows.sort(function(a,b){return (b.last||'').localeCompare(a.last||'');});
 agenda(rows.map(function(r){return r.prog.id;}));
 var totalDone=rows.reduce(function(a,r){return a+r.done;},0);
 document.getElementById('sCur').textContent=rows.filter(function(r){return r.pct<100;}).length;
 document.getElementById('sDone').textContent=totalDone;
 document.getElementById('sFin').textContent=rows.filter(function(r){return r.pct>=100;}).length;
 document.getElementById('sHrs').textContent='…';
 document.getElementById('hiLine').textContent=rows.length?'Qué bueno verte. Retomá donde lo dejaste.':'Todavía no estás inscripto en ningún curso.';
 var mine=document.getElementById('mine');
 mine.innerHTML=rows.length?rows.map(function(r){var p=r.prog,t=p.description&&p.description.title||'';var im=p.description&&p.description.image&&p.description.image.id;
  return '<a class="cc" href="/clase.html?p='+p.id+'"><div class="cv">'+(im?'<img loading="lazy" src="'+D.img(im,800,450)+'" alt="">':'')+'<span class="pc">'+r.pct+'%</span></div><div class="cb"><span class="ck">'+K[D.kind(t)]+'</span><b>'+esc(t)+'</b><div class="bar"><i style="width:'+r.pct+'%"></i></div><span class="nx">'+r.done+' de '+r.tot+' clases</span><span class="go">'+(r.pct>=100?'Repasar →':r.done?'Continuar →':'Empezar →')+'</span></div></a>';}).join(''):'<p class="cx-empty">Cuando te inscribas en un curso, va a aparecer acá.</p>';
 if(rows.length){var r0=rows.find(function(r){return r.pct<100;})||rows[0];var p0=r0.prog;
  var o=await D.outline(p0.id).catch(function(){return[];});var rs0=await D.resolved(r0.part.id).catch(function(){return[];});var dn={};rs0.forEach(function(x){dn[x.programStepId]=1;});
  var nx=null;o.some(function(s){return s.steps.some(function(st){if(!dn[st.id]){nx={s:s,st:st};return true;}});});
  var R=document.getElementById('resume');R.href='/clase.html?p='+p0.id+(nx?'&s='+nx.st.id:'');R.hidden=false;
  var im0=p0.description&&p0.description.image&&p0.description.image.id;document.getElementById('rImg').src=im0?D.img(im0,900,506):'';
  document.getElementById('rStep').textContent=nx?(nx.st.description&&nx.st.description.title||''):'Curso completo';
  document.getElementById('rProg').textContent=(p0.description&&p0.description.title||'')+' · '+r0.done+' de '+r0.tot+' clases';
  document.getElementById('rBar').style.width=r0.pct+'%';}
 // horas: suma de videos vistos
 var mins=0;for(var j=0;j<rows.length;j++){if(!rows[j].done)continue;var oo=await D.outline(rows[j].prog.id).catch(function(){return[];});var rr=await D.resolved(rows[j].part.id).catch(function(){return[];});var dd={};rr.forEach(function(x){dd[x.programStepId]=1;});oo.forEach(function(s){s.steps.forEach(function(st){if(dd[st.id])mins+=D.stepMinutes(st);});});}
 document.getElementById('sHrs').textContent=mins>=60?Math.round(mins/60)+' h':mins+' min';
 var all=await D.allPrograms().catch(function(){return[];});var mineIds={};rows.forEach(function(r){mineIds[r.prog.id]=1;});
 document.getElementById('more').innerHTML=all.filter(function(p){return !mineIds[p.id]&&!/adri|business plan/i.test(p.description&&p.description.title||'');}).slice(0,6).map(function(p){var t=p.description&&p.description.title||'';var im=p.description&&p.description.image&&p.description.image.id;return '<a class="cm" href="/curso.html?p='+p.id+'"><img loading="lazy" src="'+(im?D.img(im,600,338):'')+'" alt=""><span><small>'+K[D.kind(t)]+'</small><b>'+esc(t)+'</b></span></a>';}).join('');
}catch(e){console.log(e);document.getElementById('hiLine').textContent='No pudimos cargar tus cursos. Probá de nuevo en un momento.';}
})();
</script>'''
page('campus.html', 'Campus · Habitat', campus, campus_js)

# ---------- Reproductor de clases (datos reales) ----------
clase = '''
<div class="pl">
  <aside class="pl-side" id="side">
    <div class="ps-top">
      <a class="back" href="/campus.html">← Mis cursos</a>
      <h2 id="pTitle">Cargando…</h2>
      <div class="ps-prog"><div class="bar"><i id="pbar"></i></div><span id="ptxt"></span></div>
    </div>
    <nav class="ps-list" id="list" aria-label="Clases del curso"></nav>
  </aside>
  <main class="pl-main">
    <div class="pm-head"><button class="tg-side" id="tgs" type="button">☰ Clases</button><span class="crumb" id="crumb"></span></div>
    <div class="stage" id="stage"></div>
    <div class="pm-bar">
      <button class="btn-s" id="prev" type="button">← Anterior</button>
      <button class="btn-done" id="done" type="button">✓ Marcar como vista</button>
      <button class="btn-s" id="next" type="button">Siguiente →</button>
    </div>
    <div class="pm-tabs" role="tablist"><button class="on" data-t="desc" type="button">Sobre la clase</button><button data-t="mat" type="button">Materiales</button><button data-t="ask" type="button">Preguntas</button><button data-t="notes" type="button">Mi diario</button></div>
    <div class="pm-pane rich" id="pane"></div>
  </main>
</div>
'''
js = '''<script src="/assets/auth.js"></script>
<script src="/assets/campus-data.js"></script>
<script src="/assets/campus-extra.js"></script>
<script src="/assets/hls.light.min.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,D=window.CampusData,X=window.CampusExtra;
if(!A.loggedIn()){location.replace('/ingresar.html');return;}
var Q=new URLSearchParams(location.search),PID=Q.get('p');
if(!PID){location.replace('/campus.html');return;}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var prog,secs,steps=[],done={},part=null,cur=0,tab='desc',hls=null;
try{
 var me=await D.me();
 prog=await D.program(PID);
 var ps=await D.participations(me.id);part=ps.find(function(p){return p.programId===PID;})||null;
 secs=await D.outline(PID);
 if(part){(await D.resolved(part.id)).forEach(function(r){if(r.status!=='FAILED')done[r.programStepId]=1;});}
}catch(e){document.getElementById('stage').innerHTML='<div class="ph"><span>No tenés acceso a este curso o no pudimos cargarlo.</span></div>';return;}
document.title=(prog.description&&prog.description.title||'Curso')+' · Campus Habitat';
document.getElementById('pTitle').textContent=prog.description&&prog.description.title||'';
secs.forEach(function(s,si){s.steps.forEach(function(x){x._sec=s.title;steps.push(x);});});
var want=Q.get('s');cur=Math.max(0,steps.findIndex(function(x){return x.id===want;}));
if(!want){var f=steps.findIndex(function(x){return !done[x.id];});cur=f<0?0:f;}
var cover=prog.description&&prog.description.image&&prog.description.image.id?D.img(prog.description.image.id,1600,900):'';
function ic(x){return x.stepType==='VIDEO'?'▶':(x.stepType==='QUIZ'?'?':'⎙');}
function list(){var h='';secs.forEach(function(s){var n=s.steps.filter(function(x){return done[x.id]}).length;
 h+='<div class="sec"><div class="sh"><b>'+esc(s.title)+'</b><small>'+n+' de '+s.steps.length+' clases</small></div>';
 s.steps.forEach(function(x){var i=steps.indexOf(x),m=D.stepMinutes(x);h+='<button type="button" class="it'+(i===cur?' on':'')+(done[x.id]?' ok':'')+'" data-i="'+i+'"><span class="ico">'+(done[x.id]?'✓':ic(x))+'</span><span class="tt">'+esc(x.description&&x.description.title)+'</span><small>'+(m?m+' min':(x.stepType==='QUIZ'?'Cuestionario':'Material'))+'</small></button>';});h+='</div>';});
 document.getElementById('list').innerHTML=h;
 var tot=steps.length,d=steps.filter(function(x){return done[x.id]}).length,p=tot?Math.round(d*100/tot):0;
 document.getElementById('pbar').style.width=p+'%';document.getElementById('ptxt').textContent=p+'% completado · '+d+' de '+tot+' clases';}
async function stage(){var x=steps[cur];if(!x)return;var st=document.getElementById('stage');
 if(hls){try{hls.destroy();}catch(e){}hls=null;}
 if(x.stepType==='VIDEO'){
  st.innerHTML='<video controls playsinline preload="metadata" poster="'+cover+'"></video><div class="v-msg" id="vmsg">Preparando el video…</div>';
  var v=st.querySelector('video');
  try{var u=await D.videoUrl(x.id);document.getElementById('vmsg').remove();
   if(v.canPlayType('application/vnd.apple.mpegurl'))v.src=u;else if(window.Hls&&Hls.isSupported()){hls=new Hls();hls.loadSource(u);hls.attachMedia(v);}else v.src=u;
   v.addEventListener('ended',function(){if(!done[x.id])mark(x);},{once:true});
  }catch(e){document.getElementById('vmsg').textContent=part?'No pudimos cargar el video. Probá de nuevo en un momento.':'Inscribite en el curso para ver los videos.';}
 }else if(x.stepType==='QUIZ'){
  st.innerHTML='<div class="doc"><div class="pdf">?</div><div><b>'+esc(x.description&&x.description.title)+'</b><small>Cuestionario del curso</small></div><span class="soonx">Muy pronto en el Campus</span></div>';
 }else{
  var r=D.rich(x.description&&x.description.details);
  st.innerHTML='<div class="art rich">'+(r||'<p>Esta clase no tiene contenido escrito.</p>')+'</div>';
 }
 document.getElementById('crumb').textContent=x._sec+' · '+(x.description&&x.description.title||'');
 var b=document.getElementById('done');b.disabled=!part;b.classList.toggle('is',!!done[x.id]);b.textContent=done[x.id]?'✓ Vista':'✓ Marcar como vista';
 document.getElementById('prev').disabled=cur===0;document.getElementById('next').disabled=cur===steps.length-1;pane();list();
 history.replaceState(null,'','/clase.html?p='+PID+'&s='+x.id);}
function pane(){var x=steps[cur],h='';
 if(tab==='desc')h='<h3>'+esc(x.description&&x.description.title)+'</h3>'+(x.stepType==='VIDEO'?D.rich(x.description&&x.description.details):'')+'<p class="muted">'+esc(prog.description&&prog.description.details||'')+'</p>';
 if(tab==='mat'){var ms=[];steps.forEach(function(y){var r=D.rich(y.description&&y.description.details);var m=r.match(/<div class="mt">[\\s\\S]*?<\\/div><\\/div>|<div class="mt">[\\s\\S]*?<\\/a><\\/div>/g);if(m)ms=ms.concat(m);});h='<div class="mats">'+(ms.join('')||'<p>Este curso no tiene materiales para descargar.</p>')+'</div>';}
 if(tab==='notes'){var v='';try{v=localStorage.getItem('campus:n:'+x.id)||''}catch(e){}h='<textarea id="nt" placeholder="Escribí lo que Dios te habló en esta clase…">'+esc(v)+'</textarea><small class="hint" id="nth">Se guarda en tu diario espiritual. <a href="/diario.html">Ver mi diario →</a></small>';}
 if(tab==='ask'){h='<form class="qa-f" id="qf"><textarea id="qt" maxlength="1500" placeholder="¿Te quedó una duda de esta clase? Escribila y un docente te responde acá." required></textarea><div class="qa-r"><small>Tu pregunta y su respuesta las ven los demás alumnos del curso.</small><button class="btn-done" type="submit">Enviar pregunta</button></div><p class="qa-m" id="qm" role="status"></p></form><div class="qa-l" id="ql"><p class="muted">Cargando preguntas…</p></div>';}
 var p=document.getElementById('pane');p.innerHTML=h;
 var t=document.getElementById('nt');if(t){var ent=null,tm=null;X.diaryFor(x.id).then(function(e){if(e){ent=e;if(!t.value)t.value=e.texto||'';}}).catch(function(){});
  t.addEventListener('input',function(){try{localStorage.setItem('campus:n:'+x.id,t.value)}catch(e){}clearTimeout(tm);tm=setTimeout(async function(){var hh=document.getElementById('nth');try{var id=await X.saveEntry({_id:ent&&ent._id,title:(x.description&&x.description.title)||'Clase',texto:t.value,programId:PID,stepId:x.id,clase:(prog.description&&prog.description.title||'')+' · '+(x.description&&x.description.title||''),f:ent&&ent.f});ent=ent||{};ent._id=id;if(hh)hh.firstChild.textContent='Guardado en tu diario espiritual. ';}catch(e){if(hh)hh.firstChild.textContent='No se pudo guardar en el diario (quedó en este dispositivo). ';}},1200);});}
 var qf=document.getElementById('qf');if(qf){var ql=document.getElementById('ql');
  var load=function(){X.questions(x.id).then(function(L){ql.innerHTML=L.length?L.map(function(q){return '<div class="qa-i"><div class="qa-q"><b>'+esc(q.nombre||'Alumno')+'</b><p>'+esc(q.title)+'</p></div>'+(q.respuesta?'<div class="qa-a"><b>'+esc(q.respondidoPor||'Habitat')+'</b><p>'+esc(q.respuesta)+'</p></div>':'<small class="qa-p">Esperando respuesta de un docente</small>')+'</div>';}).join(''):'<p class="muted">Todavía no hay preguntas en esta clase. ¡Hacé la primera!</p>';}).catch(function(){ql.innerHTML='<p class="muted">No pudimos cargar las preguntas.</p>';});};load();
  qf.addEventListener('submit',async function(ev){ev.preventDefault();var qm=document.getElementById('qm'),qt=document.getElementById('qt'),bt=qf.querySelector('button');if(!part){qm.textContent='Inscribite en el curso para hacer preguntas.';return;}bt.disabled=true;qm.textContent='Enviando…';
   try{await X.ask({stepId:x.id,programId:PID,texto:qt.value,curso:prog.description&&prog.description.title||'',clase:x.description&&x.description.title||''});qt.value='';qm.textContent='¡Listo! Tu pregunta quedó publicada. Te avisamos cuando tenga respuesta.';load();}catch(e){qm.textContent=e.message||'No pudimos enviar la pregunta.';}bt.disabled=false;});}
}
async function mark(x){if(!part||done[x.id])return;try{await D.complete(part.id,x.id);done[x.id]=1;list();var b=document.getElementById('done');b.classList.add('is');b.textContent='✓ Vista';}catch(e){var bb=document.getElementById('done');bb.textContent='No se pudo guardar';}}
document.getElementById('list').addEventListener('click',function(e){var b=e.target.closest('.it');if(!b)return;cur=+b.dataset.i;stage();if(innerWidth<900)document.body.classList.remove('side-open');window.scrollTo({top:0,behavior:'smooth'});});
document.getElementById('prev').onclick=function(){if(cur>0){cur--;stage();}};
document.getElementById('next').onclick=function(){if(cur<steps.length-1){cur++;stage();}};
document.getElementById('done').onclick=function(){mark(steps[cur]);};
document.getElementById('tgs').onclick=function(){document.body.classList.toggle('side-open');};
document.querySelectorAll('.pm-tabs button').forEach(function(b){b.onclick=function(){tab=b.dataset.t;document.querySelectorAll('.pm-tabs button').forEach(function(z){z.classList.toggle('on',z===b)});pane();};});
if(!steps.length){document.getElementById('stage').innerHTML='<div class="ph"><span>Este curso todavía no tiene clases.</span></div>';return;}
stage();
})();
</script>
'''
page('clase.html', 'Clase · Campus Habitat', clase, js)

# ---------- Perfil y progreso (datos reales) ----------
import math
def seal(lbl, n=24):
    pts = []
    for i in range(n * 2):
        r = 56 if i % 2 == 0 else 51
        t = math.pi * i / n
        pts.append(f'{60 + r * math.cos(t):.1f},{60 + r * math.sin(t):.1f}')
    return (f'<svg viewBox="0 0 120 120" aria-hidden="true"><polygon class="s0" points="{" ".join(pts)}"/>'
            f'<circle cx="60" cy="60" r="43" class="s1"/><circle cx="60" cy="60" r="38" class="s2"/>'
            f'<text x="60" y="68" text-anchor="middle">{lbl}</text></svg>')
SEAL_TPL = seal('@@')

perfil = '''
<section class="pf-hero"><div class="wrap pf-in">
  <div class="av" id="av">·</div>
  <div><span class="kick">Mi perfil</span><h1 id="pfName">Cargando…</h1><p id="pfLine"></p></div>
  <a class="btn btn-line" href="/campus.html">Mis cursos</a>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Mi recorrido en Habitat</h2><span class="sub">Cursos · Escuelas · Carreras</span></div>
  <div class="tr-card">
    <ol class="tr-path p4" id="gen"></ol>
    <div class="tr-nums">
      <div><b id="nH">–</b><span>de formación acumuladas entre todos tus programas</span></div>
      <div><b id="nC">–</b><span>completados</span></div>
      <div><b id="nE">–</b><span>completadas</span></div>
      <div class="cons"><span>Constancia · últimas 12 semanas</span><div class="strip" id="strip"></div></div>
    </div>
  </div>
</div></section>
<div id="prog"></div>
<section class="cx-sec alt" id="cursosSec" hidden><div class="wrap">
  <div class="cx-h"><h2>Cursos</h2><span class="sub">Programas cortos</span></div>
  <div class="rings" id="rings"></div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Distinciones</h2><span class="sub" id="dCount"></span></div>
  <ul class="seals" id="seals"></ul>
</div></section>
<section class="cx-sec alt"><div class="wrap">
  <div class="cx-h"><h2>Certificados</h2></div>
  <div class="dips" id="dips"></div>
</div></section>
<section class="cx-sec" id="ajustes"><div class="wrap">
  <div class="panel"><h3>Mis datos</h3><div class="fx two-col">
    <div class="row"><label>Nombre</label><input type="text" id="fN" disabled></div>
    <div class="row"><label>Apellido</label><input type="text" id="fA" disabled></div>
    <div class="row"><label>Email</label><input type="email" id="fE" disabled></div>
  </div><p class="hint">Para cambiar tus datos, escribinos y lo actualizamos.</p></div>
</div></section>
'''
perfil_js = '''<script src="/assets/auth.js"></script>
<script src="/assets/campus-data.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,D=window.CampusData,SEAL=''' + __import__('json').dumps(SEAL_TPL) + ''';
if(!A.loggedIn()){location.replace('/ingresar.html');return;}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function seal(l){return SEAL.replace('@@',esc(l));}
var MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fecha(d){if(!d)return'';var x=new Date(d);return MES[x.getMonth()]+' '+x.getFullYear();}
try{
 var me=await D.me();
 document.getElementById('pfName').textContent=(me.first+' '+me.last).trim()||me.nick||'Alumno';
 document.getElementById('av').textContent=(me.first||me.nick||'·').charAt(0).toUpperCase();
 if(me.photo){document.getElementById('av').innerHTML='<img src="'+esc(me.photo)+'" alt="">';}
 document.getElementById('fN').value=me.first;document.getElementById('fA').value=me.last;document.getElementById('fE').value=me.email;
 var parts=await D.participations(me.id);
 var rows=[];
 for(var i=0;i<parts.length;i++){var p=await D.program(parts[i].programId).catch(function(){return null;});if(!p)continue;
  var o=await D.outline(p.id).catch(function(){return[];});var rs=await D.resolved(parts[i].id).catch(function(){return[];});
  var dn={},dates=[];rs.forEach(function(r){if(r.status!=='FAILED'){dn[r.programStepId]=1;dates.push(r.createdDate);}});
  var tot=0,dc=0,mins=0;o.forEach(function(s){s.steps.forEach(function(st){tot++;if(dn[st.id]){dc++;mins+=D.stepMinutes(st);}});});
  var t=p.description&&p.description.title||'';
  rows.push({p:p,t:t,k:D.kind(t),o:o,dn:dn,tot:tot,dc:dc,pct:tot?Math.round(dc*100/tot):0,mins:mins,dates:dates,start:parts[i].createdDate});}
 var since=rows.map(function(r){return r.start;}).filter(Boolean).sort()[0];
 var car=rows.filter(function(r){return r.k==='carrera';}),esc_=rows.filter(function(r){return r.k==='escuela';}),cur=rows.filter(function(r){return r.k==='curso';});
 document.getElementById('pfLine').textContent=(since?'Alumno de Habitat desde '+new Date(since).getFullYear():'Alumno de Habitat')+(car[0]?' · '+car[0].t:'');
 var mins=rows.reduce(function(a,r){return a+r.mins;},0),hrs=Math.round(mins/60);
 var cDone=cur.filter(function(r){return r.pct>=100;}),eDone=esc_.filter(function(r){return r.pct>=100;}),kDone=car.filter(function(r){return r.pct>=100;});
 document.getElementById('nH').innerHTML=(mins>=60?hrs+'<small> h</small>':mins+'<small> min</small>');
 document.getElementById('nC').innerHTML=cDone.length+'<small> '+(cDone.length===1?'curso':'cursos')+'</small>';
 document.getElementById('nE').innerHTML=eDone.length+'<small> '+(eDone.length===1?'escuela':'escuelas')+'</small>';
 // constancia
 var now=Date.now(),W=[0,0,0,0,0,0,0,0,0,0,0,0];rows.forEach(function(r){r.dates.forEach(function(d){var w=Math.floor((now-new Date(d).getTime())/(7*864e5));if(w>=0&&w<12)W[11-w]++;});});
 document.getElementById('strip').innerHTML=W.map(function(v){return '<i class="w'+Math.min(v,3)+'" title="'+v+' clases"></i>';}).join('');
 var streak=0;for(var j=11;j>=0;j--){if(W[j])streak++;else if(j<11)break;}
 // recorrido general
 var G=[[cDone.length?'done':'', 'Primer curso', cDone[0]?cDone[0].t:'Al completar un curso'],[eDone.length?'done':'', 'Primera escuela', eDone[0]?eDone[0].t:'Al completar una escuela'],[kDone.length?'done':(car.length?'now':''), car.length?'Carrera en curso':'Carrera', car[0]?car[0].t:'Al inscribirte en una carrera'],[kDone.length?'done':'', 'Egresado', kDone[0]?kDone[0].t:'Al terminar una carrera']];
 var lastDone=-1;G.forEach(function(g,i){if(g[0]==='done')lastDone=i;});if(!G.some(function(g){return g[0]==='now';})&&lastDone<3&&rows.length)G[lastDone+1][0]=G[lastDone+1][0]||'';
 document.getElementById('gen').innerHTML=G.map(function(g){return '<li class="'+g[0]+'"><span class="dot"></span><b>'+esc(g[1])+'</b><small>'+esc(g[2])+'</small></li>';}).join('');
 var lit=G.filter(function(g){return g[0]==='done'||g[0]==='now';}).length;var gp=document.getElementById('gen');gp.style.setProperty('--fill',Math.max(0,(lit-1)/3*75)+'%');
 // carreras y escuelas: secciones como materias o módulos
 var H='';
 car.concat(esc_).forEach(function(r){var isC=r.k==='carrera';
  var items=r.o.map(function(s){var n=s.steps.length,d=s.steps.filter(function(x){return r.dn[x.id];}).length,pc=n?Math.round(d*100/n):0;return {t:s.title,pc:pc,st:pc>=100?'ok':(pc>0?'cur':'pen')};});
  H+='<section class="cx-sec'+(isC?' alt':'')+'"><div class="wrap"><div class="cx-h"><h2>'+esc(r.t)+'</h2><span class="sub">'+(isC?'Carrera · 2 años':'Escuela · 1 año')+' · '+r.pct+'% completada</span></div>';
  H+='<div class="tr-card"><div class="tr-nums n3"><div><b>'+items.filter(function(x){return x.st==='ok';}).length+'<small> de '+items.length+'</small></b><span>'+(isC?'materias aprobadas':'módulos completos')+'</span></div><div><b>'+r.pct+'%</b><span>completado</span><div class="bar"><i style="width:'+r.pct+'%"></i></div></div><div><b>'+r.dc+'<small> de '+r.tot+'</small></b><span>clases vistas</span></div></div></div>';
  H+='<div class="mds" style="margin-top:20px">'+items.map(function(x){return '<div class="md'+(x.st==='ok'?' ok':(x.st==='cur'?' cur':''))+'"><span class="kick">'+(x.st==='ok'?'Completo':(x.st==='cur'?'Cursando':'Pendiente'))+'</span><b>'+esc(x.t)+'</b><div class="bar"><i style="width:'+x.pc+'%"></i></div><small>'+x.pc+'%</small></div>';}).join('')+'</div>';
  H+='<p style="margin-top:18px"><a class="btn btn-gold" href="/clase.html?p='+r.p.id+'">'+(r.dc?'Continuar':'Empezar')+'</a></p></div></section>';});
 document.getElementById('prog').innerHTML=H;
 if(cur.length){document.getElementById('cursosSec').hidden=false;document.getElementById('rings').innerHTML=cur.map(function(r){return '<a class="rg" href="/clase.html?p='+r.p.id+'"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="r0"/><circle cx="60" cy="60" r="52" class="r1" style="stroke-dasharray:'+Math.round(r.pct*3.267)+' 327"/></svg><b>'+(r.pct>=100?'✓':r.pct+'%')+'</b><span>'+esc(r.t)+'</span><small>'+(r.pct>=100?'Completo':(r.dc?'En curso':'Sin empezar'))+'</small></a>';}).join('');}
 // distinciones
 var DI=[['I','Primer curso completado',cDone.length,cDone[0]&&cDone[0].t],['✦','Primera escuela completada',eDone.length,eDone[0]&&eDone[0].t],['50 h','50 horas de formación',hrs>=50,hrs<50?'Te faltan '+(50-hrs)+' h':''],['100 h','100 horas de formación',hrs>=100,hrs<100?'Te faltan '+(100-hrs)+' h':''],['4','Cuatro semanas seguidas',streak>=4,streak<4?'Vas por la semana '+streak:'Viste clases cada semana'],['12','Doce semanas seguidas',streak>=12,streak<12?'Vas por la semana '+streak:'Viste clases cada semana'],['200 h','200 horas de formación',hrs>=200,hrs<200?'Te faltan '+(200-hrs)+' h':''],['★','Egresado',kDone.length,kDone[0]?kDone[0].t:'Al terminar una carrera']];
 document.getElementById('seals').innerHTML=DI.map(function(d){return '<li class="sl'+(d[2]?'':' off')+'">'+seal(d[0])+'<b>'+esc(d[1])+'</b><small>'+esc(d[3]||'')+'</small></li>';}).join('');
 document.getElementById('dCount').textContent=DI.filter(function(d){return d[2];}).length+' de '+DI.length+' obtenidas';
 // certificados
 var fin=rows.filter(function(r){return r.pct>=100;});
 var C=fin.map(function(r){return '<div class="dip"><div class="dp-in"><span class="kick">'+(r.k==='carrera'?'Diploma':'Certificado de '+(r.k==='escuela'?'escuela':'curso'))+'</span><b>'+esc(r.t)+'</b><small>Completado</small><span class="dp-seal">'+seal(r.k==='carrera'?'★':(r.k==='escuela'?'✦':'I'))+'</span></div></div>';});
 car.filter(function(r){return r.pct<100;}).forEach(function(r){C.push('<div class="dip lock"><div class="dp-in"><span class="kick">Diploma</span><b>'+esc(r.t)+'</b><small>Se habilita al completar la carrera</small></div></div>');});
 document.getElementById('dips').innerHTML=C.join('')||'<p class="cx-empty">Cuando completes un programa, tu certificado va a aparecer acá.</p>';
}catch(e){console.log(e);document.getElementById('pfName').textContent='No pudimos cargar tu perfil';}
})();
</script>'''

page('perfil.html', 'Mi perfil · Campus Habitat', perfil, perfil_js)


# ---------- Página de cada curso ----------
curso = '''
<section class="cs-hero"><div class="cs-bg" id="csBg"></div><div class="wrap cs-in">
  <div class="cs-tx"><span class="kick" id="csKind">Formación</span><h1 id="csTitle">Cargando…</h1><p id="csDesc"></p>
    <div class="cs-meta" id="csMeta"></div>
    <div class="cs-cta"><button class="btn btn-gold" type="button" id="csGo" disabled>Cargando…</button><span class="cs-price" id="csPrice"></span></div>
    <p class="cs-msg" id="csMsg" role="status" aria-live="polite"></p>
  </div>
  <div class="cs-img"><img id="csImg" src="" alt=""></div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Qué vas a ver</h2><span class="sub" id="csCount"></span></div>
  <div class="cs-out" id="csOut"><p class="cx-empty">Cargando el contenido…</p></div>
</div></section>
'''
curso_js = '''<script src="/assets/auth.js"></script>
<script src="/assets/campus-data.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,D=window.CampusData,PID=new URLSearchParams(location.search).get('p');
if(!PID){location.replace('/formacion.html');return;}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var go=document.getElementById('csGo'),msg=document.getElementById('csMsg');
var K={curso:'Curso online',escuela:'Escuela',carrera:'Carrera'};
var WA='https://wa.me/5491171637995?text=';
try{
 var p=await D.program(PID),t=p.description&&p.description.title||'';
 document.title=t+' · Habitat';
 document.getElementById('csTitle').textContent=t;document.getElementById('csKind').textContent=K[D.kind(t)];
 document.getElementById('csDesc').textContent=p.description&&p.description.details||'';
 var im=p.description&&p.description.image&&p.description.image.id;
 if(im){document.getElementById('csImg').src=D.img(im,1200,675);document.getElementById('csBg').style.backgroundImage='url('+D.img(im,1600,900)+')';}
 var cs=p.contentSummary||{},price=p.price&&+p.price.value;
 document.getElementById('csMeta').innerHTML=[cs.sectionCount?cs.sectionCount+' secciones':'',cs.stepCount?cs.stepCount+' clases':'',p.timeline&&p.timeline.selfPaced?'A tu ritmo':'','Online'].filter(Boolean).map(function(x){return '<span>'+x+'</span>';}).join('');
 if(price)document.getElementById('csPrice').textContent='$'+price.toLocaleString('es-AR');
 var acc=p.restrictions&&p.restrictions.accessType;
 // contenido (títulos; los alumnos inscriptos ven todo en la clase)
 D.outline(PID).then(function(o){var n=0;document.getElementById('csOut').innerHTML=o.map(function(s){n+=s.steps.length;return '<div class="cs-sec"><b>'+esc(s.title)+'</b><ol>'+s.steps.map(function(x){var m=D.stepMinutes(x);return '<li><span>'+esc(x.description&&x.description.title)+'</span><small>'+(m?m+' min':(x.stepType==='QUIZ'?'Cuestionario':'Material'))+'</small></li>';}).join('')+'</ol></div>';}).join('')||'<p class="cx-empty">El contenido se ve al inscribirte.</p>';document.getElementById('csCount').textContent=n?n+' clases':'';}).catch(function(){document.getElementById('csOut').innerHTML='<p class="cx-empty">El contenido se ve al inscribirte.</p>';});
 function setGo(label,fn){go.textContent=label;go.disabled=false;go.onclick=fn;}
 if(!A.loggedIn()){setGo(price?'Ingresá para comprarlo':'Ingresá para inscribirte',function(){try{sessionStorage.setItem('habitat:ret',location.pathname+location.search);}catch(e){}location.href='/ingresar.html';});return;}
 var me=await D.me();var parts=await D.participations(me.id);
 if(parts.some(function(x){return x.programId===PID;})){setGo('Ir a la clase →',function(){location.href='/clase.html?p='+PID;});return;}
 var PLAN={'5e3b050b-53ed-48c3-8cf7-4ba4d99833bc':'c225ca6b-2c02-440a-95d5-a1ddd38373a8','a371e43a-e432-4164-9e15-350e2d3d21bb':'f9f6f3e8-d9aa-44b9-bc4d-fb603184ac43','e02af77c-c23e-4ba2-a177-1dd030385bda':'a05f560b-4e59-4e51-a3f8-be6d1e5d21d2'};
 var JA='/online-programs/participants/v3/join-applications';
 async function curJA(){try{var r=await A.api('GET',JA+'/current/'+PID);return r.joinApplication||null;}catch(e){return null;}}
 function inside(ja){return ja&&(ja.participantId||(ja.status==='APPROVED'&&/NO_PAYMENT_REQUIRED|PAYMENT_SUCCESSFUL/.test(ja.paymentStatus||'')));}
 function waBuy(){location.href=WA+encodeURIComponent('Hola Habitat, quiero comprar el curso "'+t+'". Mi email es '+me.email+'.');}
 async function buy(){go.disabled=true;go.textContent='Preparando el pago…';msg.textContent='';
  try{
   var ja=await curJA();
   if(!ja){var c=await A.api('POST',JA,{joinApplication:{programId:PID}});ja=c.joinApplication;}
   if(inside(ja)){location.href='/clase.html?p='+PID;return;}
   var pp=await A.api('POST',JA+'/'+ja.id+'/prepare-payment',{paymentType:'PAID_PLANS'});ja=pp.joinApplication||ja;
   if(inside(ja)){location.href='/clase.html?p='+PID;return;}
   var ids=ja.paymentInfo&&ja.paymentInfo.paidPlanIds||[];var plan=PLAN[PID]||ids[0];
   if(!plan)throw new Error('sin plan');
   var back=location.origin+'/curso.html?p='+PID+'&pago=1';
   var rs=await A.api('POST','/_api/redirects-api/v1/redirect-session',{paidPlansCheckout:{planId:plan},callbacks:{postFlowUrl:back,thankYouPageUrl:back}});
   var u=rs.redirectSession&&rs.redirectSession.fullUrl;if(!u)throw new Error('sin url');
   location.href=u;
  }catch(e){console.log(e);go.disabled=false;setGo('Comprar por WhatsApp',waBuy);msg.textContent='No pudimos abrir el pago en este momento. Escribinos y te habilitamos el curso.';}
 }
 if(price){
  if(new URLSearchParams(location.search).get('pago')){
   go.disabled=true;go.textContent='Confirmando tu pago…';msg.textContent='Estamos confirmando tu compra. Esto tarda unos segundos.';
   for(var i=0;i<8;i++){var ja=await curJA();
    if(ja&&!inside(ja)&&ja.status!=='DECLINED'){try{var q=await A.api('POST',JA+'/'+ja.id+'/prepare-payment',{paymentType:'PAID_PLANS'});ja=q.joinApplication||ja;}catch(e){}}
    if(inside(ja)){msg.textContent='¡Listo! Ya tenés el curso.';setTimeout(function(){location.href='/clase.html?p='+PID;},900);return;}
    await new Promise(function(r){setTimeout(r,2500);});}
   msg.textContent='Si ya pagaste, en unos minutos se habilita. Si no, podés intentar de nuevo.';
  }
  setGo('Comprar',buy);return;}
 if(acc==='SECRET'){setGo('Consultar inscripción',function(){location.href=WA+encodeURIComponent('Hola Habitat, quiero inscribirme en "'+t+'".');});return;}
 setGo(acc==='PRIVATE'?'Solicitar inscripción':'Inscribirme',async function(){go.disabled=true;go.textContent='Un momento…';
  try{var r=await A.api('POST','/online-programs/participants/v3/join-applications',{joinApplication:{programId:PID}});var ja=r.joinApplication||{};
   if(ja.status==='APPROVED'){msg.textContent='¡Listo! Ya estás inscripto.';setTimeout(function(){location.href='/clase.html?p='+PID;},900);}
   else{msg.textContent='Tu solicitud quedó enviada. Te avisamos cuando esté aprobada.';go.textContent='Solicitud enviada';}
  }catch(e){go.disabled=false;go.textContent='Probar de nuevo';msg.textContent='No pudimos completar la inscripción. Probá de nuevo o escribinos.';}});
}catch(e){console.log(e);document.getElementById('csTitle').textContent='No encontramos este curso';go.textContent='Ver la formación';go.disabled=false;go.onclick=function(){location.href='/formacion.html';};}
})();
</script>'''
page('curso.html', 'Curso · Habitat', curso, curso_js)

# ---------- Diario espiritual ----------
diario = """
<section class="cx-hero dy-hero"><div class="wrap">
  <div class="hi rv in"><span class="kick">Campus Habitat</span><h1>Mi diario espiritual</h1><p>Lo que Dios te va hablando en cada clase y en tu tiempo con la Palabra. Solo lo ves vos.</p><div class="hi-act"><a class="out" href="/campus.html">← Mis cursos</a><a class="out" href="/biblia.html">Biblia</a><button class="out" type="button" id="dlBtn">Descargar mi diario</button></div></div>
</div></section>
<section class="cx-sec"><div class="wrap dy">
  <form class="dy-new" id="dyF">
    <h2 id="dyH">Nueva entrada</h2>
    <input id="dyT" maxlength="160" placeholder="Título (por ejemplo: Lo que aprendí hoy)">
    <div class="dy-row"><input id="dyC" maxlength="80" placeholder="Cita bíblica (ej. Juan 15:5)"><input id="dyV" maxlength="600" placeholder="Versículo o frase que te marcó"></div>
    <textarea id="dyX" placeholder="Escribí con libertad…" required></textarea>
    <div class="qa-r"><small id="dyM" role="status"></small><span><button class="btn-s" type="button" id="dyCancel" hidden>Cancelar</button> <button class="btn-done" type="submit">Guardar</button></span></div>
  </form>
  <div class="dy-side"><input id="dyS" type="search" placeholder="Buscar en mi diario…"><div id="dyL"><p class="cx-empty">Cargando tu diario…</p></div></div>
</div></section>
"""
diario_js = """<script src="/assets/auth.js"></script>
<script src="/assets/campus-extra.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,X=window.CampusExtra,esc=X.esc;
if(!A.loggedIn()){try{sessionStorage.setItem('habitat:ret','/diario.html');}catch(e){}location.replace('/ingresar.html');return;}
var L=[],edit=null,$=function(i){return document.getElementById(i);};
function card(e){var f=e.f?X.fecha(e.f)+' '+e.f.getFullYear():'';return '<article class="dy-it" data-id="'+esc(e._id)+'"><small>'+esc(f)+(e.clase?' · '+esc(e.clase):'')+'</small><b>'+esc(e.title||'Sin título')+'</b>'+(e.cita||e.versiculo?'<blockquote>'+esc(e.versiculo||'')+(e.cita?' <cite>'+esc(e.cita)+'</cite>':'')+'</blockquote>':'')+'<p>'+esc(e.texto||'').replace(/\\n/g,'<br>')+'</p><div class="dy-a"><button type="button" data-a="e">Editar</button><button type="button" data-a="d">Borrar</button></div></article>';}
function draw(){var t=($('dyS').value||'').toLowerCase();var F=L.filter(function(e){return !t||[e.title,e.texto,e.cita,e.versiculo,e.clase].join(' ').toLowerCase().indexOf(t)>=0;});$('dyL').innerHTML=F.length?F.map(card).join(''):'<p class="cx-empty">'+(L.length?'No encontramos entradas con esa búsqueda.':'Tu diario está vacío. Escribí tu primera entrada, o anotá algo en la pestaña “Mi diario” de cualquier clase.')+'</p>';}
async function load(){try{L=await X.diary(200);}catch(e){$('dyL').innerHTML='<p class="cx-empty">No pudimos cargar tu diario.</p>';return;}draw();}
function reset(){edit=null;$('dyF').reset();$('dyH').textContent='Nueva entrada';$('dyCancel').hidden=true;}
$('dyS').addEventListener('input',draw);
$('dyCancel').onclick=reset;
$('dyF').addEventListener('submit',async function(ev){ev.preventDefault();$('dyM').textContent='Guardando…';
 try{await X.saveEntry({_id:edit&&edit._id,title:$('dyT').value,cita:$('dyC').value,versiculo:$('dyV').value,texto:$('dyX').value,programId:edit&&edit.programId,stepId:edit&&edit.stepId,clase:edit&&edit.clase,f:edit&&edit.f});$('dyM').textContent='Guardado.';reset();load();}catch(e){$('dyM').textContent='No se pudo guardar. Probá de nuevo.';}});
$('dyL').addEventListener('click',async function(ev){var b=ev.target.closest('button');if(!b)return;var id=b.closest('.dy-it').dataset.id,e=L.find(function(x){return x._id===id;});if(!e)return;
 if(b.dataset.a==='e'){edit=e;$('dyT').value=e.title||'';$('dyC').value=e.cita||'';$('dyV').value=e.versiculo||'';$('dyX').value=e.texto||'';$('dyH').textContent='Editar entrada';$('dyCancel').hidden=false;window.scrollTo({top:$('dyF').offsetTop-90,behavior:'smooth'});}
 if(b.dataset.a==='d'){if(b.dataset.ok!=='1'){b.dataset.ok='1';b.textContent='¿Seguro? Tocá de nuevo';return;}try{await X.removeEntry(id);L=L.filter(function(x){return x._id!==id;});draw();}catch(e){b.textContent='No se pudo borrar';}}});
$('dlBtn').onclick=function(){var t='MI DIARIO ESPIRITUAL · HABITAT\\n\\n'+L.slice().reverse().map(function(e){return (e.f?X.fecha(e.f)+' '+e.f.getFullYear():'')+(e.clase?' · '+e.clase:'')+'\\n'+(e.title||'')+'\\n'+(e.versiculo?'«'+e.versiculo+'» '+(e.cita||'')+'\\n':e.cita?e.cita+'\\n':'')+'\\n'+(e.texto||'')+'\\n\\n— — —\\n';}).join('\\n');
 var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/plain;charset=utf-8'}));a.download='mi-diario-habitat.txt';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);};
load();
})();
</script>"""
page('diario.html', 'Mi diario espiritual · Campus Habitat', diario, diario_js)

# ---------- Biblia + diario ----------
biblia = """
<section class="cx-hero dy-hero"><div class="wrap">
  <div class="hi rv in"><span class="kick">Campus Habitat</span><h1>Biblia</h1><p>Leé, marcá lo que te habla y guardalo en tu diario espiritual.</p><div class="hi-act"><a class="out" href="/campus.html">← Mis cursos</a><a class="out" href="/diario.html">Mi diario</a></div></div>
</div></section>
<section class="cx-sec"><div class="wrap bb">
  <div class="bb-main">
    <div class="bb-bar">
      <select id="bB" aria-label="Libro"></select><select id="bC" aria-label="Capítulo"></select>
      <select id="bV" aria-label="Traducción"><option value="rv1909">Reina-Valera 1909</option><option value="rv1865">Reina-Valera 1865</option></select>
    </div>
    <div class="bb-ext">Leer este capítulo en otras traducciones: <a id="xNTV" target="_blank" rel="noopener">NTV</a> · <a id="xNVI" target="_blank" rel="noopener">NVI</a> · <a id="xRVR" target="_blank" rel="noopener">RVR 1960</a></div>
    <h2 id="bT"></h2>
    <div class="bb-tx" id="bX"><p class="cx-empty">Cargando…</p></div>
    <div class="bb-nav"><button class="btn-s" type="button" id="bP">← Capítulo anterior</button><button class="btn-s" type="button" id="bN">Capítulo siguiente →</button></div>
  </div>
  <aside class="bb-side" id="bS">
    <h3>Mi diario</h3>
    <p class="muted" id="bHint">Tocá uno o varios versículos para guardarlos con lo que Dios te habló.</p>
    <form id="bF" hidden><blockquote id="bQ"></blockquote><textarea id="bR" placeholder="¿Qué te habló Dios con esto?"></textarea><div class="qa-r"><button class="btn-s" type="button" id="bClr">Limpiar</button><button class="btn-done" type="submit">Guardar en mi diario</button></div><small id="bM" role="status"></small></form>
  </aside>
</div></section>
"""
biblia_js = """<script src="/assets/auth.js"></script>
<script src="/assets/campus-extra.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,X=window.CampusExtra,esc=X.esc,$=function(i){return document.getElementById(i);};
var U=['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
var st={v:'rv1909',b:43,c:1};try{var sv=JSON.parse(localStorage.getItem('campus:bib')||'null');if(sv)st=sv;}catch(e){}
var q=new URLSearchParams(location.search);if(q.get('b'))st.b=+q.get('b');if(q.get('c'))st.c=+q.get('c');
var IDX=null,cache={},sel=[];
async function idx(){if(!IDX)IDX=await fetch('/assets/biblia/'+st.v+'/index.json').then(function(r){return r.json();});return IDX;}
async function book(v,b){var k=v+b;if(!cache[k])cache[k]=fetch('/assets/biblia/'+v+'/'+('0'+b).slice(-2)+'.json').then(function(r){return r.json();});return cache[k];}
function save(){try{localStorage.setItem('campus:bib',JSON.stringify(st));}catch(e){}}
async function draw(){var I=await idx();st.b=Math.min(66,Math.max(1,st.b));var nc=I.chapters[st.b-1];st.c=Math.min(nc,Math.max(1,st.c));save();
 $('bB').innerHTML=I.books.map(function(n,i){return '<option value="'+(i+1)+'"'+(i+1===st.b?' selected':'')+'>'+n+'</option>';}).join('');
 var o='';for(var i=1;i<=nc;i++)o+='<option value="'+i+'"'+(i===st.c?' selected':'')+'>Capítulo '+i+'</option>';$('bC').innerHTML=o;$('bV').value=st.v;
 var name=I.books[st.b-1];$('bT').textContent=name+' '+st.c;
 var u=function(id,code){return 'https://www.bible.com/bible/'+id+'/'+U[st.b-1]+'.'+st.c+'.'+code;};$('xNTV').href=u(127,'NTV');$('xNVI').href=u(128,'NVI');$('xRVR').href=u(149,'RVR1960');
 $('bX').innerHTML='<p class="cx-empty">Cargando…</p>';var B=await book(st.v,st.b);var vs=B[st.c-1]||[];
 $('bX').innerHTML=vs.map(function(t,i){return '<span class="vs" data-n="'+(i+1)+'"><sup>'+(i+1)+'</sup>'+esc(t)+' </span>';}).join('');
 sel=[];side();$('bP').disabled=st.b===1&&st.c===1;$('bN').disabled=st.b===66&&st.c===I.chapters[65];window.scrollTo({top:0});}
function ref(){if(!sel.length)return '';var I=IDX,a=sel.slice().sort(function(x,y){return x-y;}),r=[],s=a[0],p=a[0];for(var i=1;i<=a.length;i++){if(a[i]===p+1){p=a[i];continue;}r.push(s===p?s:s+'-'+p);s=p=a[i];}return I.books[st.b-1]+' '+st.c+':'+r.join(',')+' ('+(st.v==='rv1909'?'RV1909':'RV1865')+')';}
function side(){var on=sel.length>0;$('bS').classList.toggle('sel',on);$('bF').hidden=!on;$('bHint').hidden=on;document.querySelectorAll('.vs').forEach(function(e){e.classList.toggle('on',sel.indexOf(+e.dataset.n)>=0);});
 if(on){var t=sel.slice().sort(function(x,y){return x-y;}).map(function(n){return document.querySelector('.vs[data-n="'+n+'"]').textContent.replace(/^\\d+/,'').trim();}).join(' ');$('bQ').innerHTML=esc(t)+' <cite>'+esc(ref())+'</cite>';$('bQ').dataset.t=t;}}
$('bX').addEventListener('click',function(e){var v=e.target.closest('.vs');if(!v)return;var n=+v.dataset.n,i=sel.indexOf(n);if(i>=0)sel.splice(i,1);else sel.push(n);side();});
$('bB').onchange=function(){st.b=+this.value;st.c=1;draw();};$('bC').onchange=function(){st.c=+this.value;draw();};
$('bV').onchange=function(){st.v=this.value;IDX=null;draw();};
$('bP').onclick=function(){if(st.c>1)st.c--;else if(st.b>1){st.b--;st.c=IDX.chapters[st.b-1];}draw();};
$('bN').onclick=function(){if(st.c<IDX.chapters[st.b-1])st.c++;else if(st.b<66){st.b++;st.c=1;}draw();};
$('bClr').onclick=function(){sel=[];$('bR').value='';side();};
$('bF').addEventListener('submit',async function(ev){ev.preventDefault();if(!A.loggedIn()){$('bM').innerHTML='Para guardar en tu diario <a href="/ingresar.html">ingresá al Campus</a>.';try{sessionStorage.setItem('habitat:ret','/biblia.html');}catch(e){}return;}
 $('bM').textContent='Guardando…';try{await X.saveEntry({title:ref().replace(/ \\(.*\\)$/,''),cita:ref(),versiculo:$('bQ').dataset.t,texto:$('bR').value});$('bM').innerHTML='Guardado. <a href="/diario.html">Ver mi diario →</a>';sel=[];$('bR').value='';side();}catch(e){$('bM').textContent='No se pudo guardar. Probá de nuevo.';}});
draw();
})();
</script>"""
page('biblia.html', 'Biblia · Campus Habitat', biblia, biblia_js)

# ---------- Ingreso ----------
ingresar = f'''
<section class="lg-wrap"><div class="lg-bg" style="background-image:url('{B.im('ocean', 1800)}')"></div>
  <div class="lg-card rv">
    <img class="lg-logo" src="{B.im('logo', 160, 160)}" alt="Habitat">
    <h1>Campus Habitat</h1><p>Entrá con la misma cuenta que usás hoy para tus cursos.</p>
    <button class="g-btn" type="button" id="gBtn"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Continuar con Google</button>
    <div class="or"><span>o con tu email</span></div>
    <form class="fx" id="lgForm" novalidate>
      <div class="row"><label for="lgEmail">Email</label><input id="lgEmail" type="email" autocomplete="email" placeholder="tu@email.com" required></div>
      <div class="row" id="pwRow"><label for="lgPw">Contraseña</label><input id="lgPw" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
      <p class="lg-msg" id="lgMsg" role="status" aria-live="polite"></p>
      <button class="btn btn-gold" type="submit" id="lgGo">Entrar al Campus</button>
    </form>
    <button class="fg" type="button" id="lgForgot">¿Olvidaste tu contraseña?</button>
  </div>
</section>
'''
ingresar_js = """<script src="/assets/auth.js"></script>
<script>
(function(){
var A=window.HabitatAuth,f=document.getElementById('lgForm'),m=document.getElementById('lgMsg'),go=document.getElementById('lgGo'),fg=document.getElementById('lgForgot'),pw=document.getElementById('pwRow'),rec=false;
function msg(t,ok){m.textContent=t||'';m.className='lg-msg'+(ok?' ok':'');}
function busy(b,t){go.disabled=b;go.textContent=b?'Entrando…':(t||'Entrar al Campus');}
function ret(){var r='/campus.html';try{r=sessionStorage.getItem('habitat:ret')||r;sessionStorage.removeItem('habitat:ret');}catch(e){}location.replace(r);}
A.callback().then(function(done){if(done||A.loggedIn())ret();}).catch(function(x){msg('No pudimos completar el ingreso'+(x&&x.message&&x.message!=='state'?' ('+x.message+')':'')+'. Probá de nuevo.');});
document.getElementById('gBtn').onclick=function(){msg('');A.loginGoogle().catch(function(){msg('No pudimos abrir Google. Probá de nuevo en un momento.');});};
fg.onclick=function(){rec=!rec;pw.hidden=rec;go.textContent=rec?'Enviarme el link':'Entrar al Campus';fg.textContent=rec?'Volver a ingresar':'¿Olvidaste tu contraseña?';msg(rec?'Te mandamos un mail con un link para crear una contraseña nueva.':'',rec);};
f.onsubmit=async function(e){e.preventDefault();var em=document.getElementById('lgEmail').value.trim(),p=document.getElementById('lgPw').value;
 if(!/^\\S+@\\S+\\.\\S+$/.test(em)){msg('Revisá el email.');return;}
 if(rec){busy(true);try{await A.recover(em);msg('Listo. Revisá tu correo (y la carpeta de spam).',true);}catch(x){msg('No pudimos enviar el mail. Revisá el email.');}busy(false,'Enviarme el link');return;}
 if(!p){msg('Escribí tu contraseña.');return;}
 busy(true);msg('');
 try{var st=await A.loginEmail(em,p);if(st==='REQUIRE_OWNER_APPROVAL')msg('Tu cuenta está esperando aprobación de Habitat.');else if(st==='REQUIRE_EMAIL_VERIFICATION')msg('Tenés que verificar tu email. Te mandamos un código.');else if(st)msg('No pudimos ingresar ('+st+').');busy(false);}
 catch(x){var t=JSON.stringify(x.body||{});msg(/password|credential|not.?found|-19976|-19999|19958/i.test(t)?'El email o la contraseña no coinciden.':'No pudimos ingresar. Probá de nuevo en un momento.');busy(false);}
};
})();
</script>
"""
page('ingresar.html', 'Ingresar · Campus Habitat', ingresar, ingresar_js)
print('campus ok')
