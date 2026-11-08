#!/usr/bin/env python3
"""Panel de profesores: próximas clases, material, calendario, gratitud y reflexión después de cada clase."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="tt-top"><div class="wrap">
  <div class="tt-hi"><p class="tt-k">Panel de profesores</p><h1 id="pHola">Hola</h1><p id="pWho">Cargando…</p><figure class="tt-word" id="ttWord" hidden><blockquote id="ttWordT"></blockquote><figcaption><span id="ttWordR"></span><button type="button" id="ttWordN">Otra palabra</button></figcaption></figure></div>
  <div class="tt-act"><a class="tt-ln" href="/campus.html">Campus</a></div>
</div></section>
<div class="tt-main"><div class="wrap tt-v" id="pMain">
  <div class="tt-card pf-next" id="pNext"><p class="tt-empty">Cargando tus clases…</p></div>
  <div class="tt-card pf-refl" id="pRefl" hidden></div>
  <div class="pf-row">
    <div class="tt-card pf-seed" id="pSeed"></div>
    <div class="tt-card vs-cal"><h2 class="tt-h">Tus clases en tu calendario</h2><p class="tt-tip">Sumalo una vez y tus clases aparecen solas, con aviso una semana antes y el día anterior. Además te llega un mail una semana antes. Si cambia algo, se actualiza solo.</p><div class="tt-wa"><a class="tt-btn" id="pIcs" href="#">Sumar a mi teléfono</a><a class="tt-btn s" id="pGcal" href="#" target="_blank" rel="noopener">Google Calendar</a></div></div>
  </div>
  <div class="tt-card pf-thanks" id="pThanks" hidden></div>
  <h2 class="tt-h">Tus próximas clases</h2>
  <div class="pf-list" id="pList"></div>
  <h2 class="tt-h">Clases que diste</h2>
  <p class="tt-tip">Tu reflexión y lo que dijeron los alumnos, sin nombres. Tocá una clase para verla.</p>
  <div class="pf-list" id="pPast"></div>
</div></div>
<div class="tt-drawer" id="ttDrawer" hidden><div class="tt-dr-bg" data-x></div><aside class="tt-dr" role="dialog" aria-modal="true" aria-labelledby="drT"><button class="tt-x" type="button" data-x aria-label="Cerrar">✕</button><div id="drBody"></div></aside></div>
<input type="file" id="pFile" hidden multiple accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.jpg,.jpeg,.png,.mp3,.m4a">
<div class="tt-toast" id="ttToast" role="status" aria-live="polite"></div>
'''
js = r'''<script src="/assets/auth.js"></script>
<script src="/assets/aliento.js"></script>
<script>
(async function(){
var A=window.HabitatAuth,$=function(s,r){return (r||document).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var DL=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],MS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function pd(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function larga(s){var d=pd(s);return DL[d.getDay()]+' '+d.getDate()+' de '+MS[d.getMonth()];}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function hora(s){return pd(s).getDay()===6?'10:00':'19:30';}
function toast(t){var e=$('#ttToast');e.textContent=t;e.classList.add('on');setTimeout(function(){e.classList.remove('on');},2800);}
var CARAS=[['1','😣','Me costó'],['2','😕','Regular'],['3','🙂','Bien'],['4','😊','Muy bien'],['5','🤩','Increíble']];
function cara(v){var c=CARAS.filter(function(x){return x[0]===String(v);})[0];return c?c[1]:'';}
function ico(m){return /pdf/.test(m)?'📄':/presentation|powerpoint|keynote/.test(m)?'🖥️':/image/.test(m)?'🖼️':/audio/.test(m)?'🎧':/word|document/.test(m)?'📝':'📎';}
function palabra(){var w=window.HabitatAliento('vol');$('#ttWordT').textContent=w.t;$('#ttWordR').textContent=w.r||'Para vos, hoy';$('#ttWord').hidden=false;}
$('#ttWordN').onclick=palabra;palabra();
if(!A.loggedIn()){try{sessionStorage.setItem('habitat:ret','/profesor.html');}catch(e){}location.replace('/ingresar.html');return;}
var tk='';try{await A.api('GET','/members/v1/members/my');tk=JSON.parse(localStorage.getItem('habitat:mtok')).a;}catch(e){}
function api(m,b){return fetch('/api/profe',{method:m,headers:{'content-type':'application/json','x-habitat-auth':tk},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json();});}
var R={},hoy=new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
async function load(){try{R=await api('GET');}catch(e){R={};}draw();}
var DEST=null;
$('#pFile').onchange=function(){var fs=Array.prototype.slice.call(this.files||[]);this.value='';if(DEST&&fs.length)subir(DEST,fs);};
function elegir(id){DEST=id;$('#pFile').click();}
async function subir(id,fs){for(var i=0;i<fs.length;i++){var f=fs[i];if(f.size>25e6){toast(f.name+' pesa más de 25 MB. Probá exportarlo a PDF.');continue;}
 toast('Subiendo '+f.name+'…');var drop=$('[data-drop="'+id+'"]');if(drop)drop.classList.add('busy');
 try{var mime=f.type||'application/octet-stream',u=await api('POST',{op:'subir',claseId:id,nombre:f.name,mime:mime});if(!u.ok)throw new Error(u.error);
  var up=await fetch(u.uploadUrl+(u.uploadUrl.indexOf('?')>=0?'&':'?')+'filename='+encodeURIComponent(f.name),{method:'PUT',headers:{'Content-Type':mime},body:f});var j=await up.json();var url=j.file&&j.file.url;if(!url)throw new Error('sin url');
  var m=await api('POST',{op:'material',claseId:id,nombre:f.name,url:url,mime:mime});if(!m.ok)throw new Error(m.error);toast('Listo: '+f.name+' ya está en el Campus de tus alumnos.');}
 catch(e){toast('No se pudo subir '+f.name+'. '+(e.message&&e.message!=='sin url'?e.message:'Probá de nuevo.'));}}
 await load();}
function mats(c,edit){var M=c.materiales||[];return '<div class="pf-mats">'+M.map(function(m){return '<span class="pf-mat"><a href="'+esc(m.url)+'" target="_blank" rel="noopener">'+ico(m.mime||'')+' '+esc(m.title)+'</a>'+(edit?'<button type="button" data-q="'+esc(m._id)+'" aria-label="Quitar '+esc(m.title)+'">✕</button>':'')+'</span>';}).join('')+'</div>';}
function drop(c){return '<div class="pf-drop" data-drop="'+esc(c._id)+'" role="button" tabindex="0"><b>Subí tu material</b><span>Arrastrá acá tus diapositivas, PDF o lecturas, o tocá para elegirlos. Les aparecen a los alumnos en el Campus, en esta clase.</span></div>';}
function bindMat(root){$$('[data-drop]',root).forEach(function(d){var id=d.dataset.drop;d.onclick=function(){elegir(id);};d.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();elegir(id);}};
 d.ondragover=function(e){e.preventDefault();d.classList.add('over');};d.ondragleave=function(){d.classList.remove('over');};d.ondrop=function(e){e.preventDefault();d.classList.remove('over');subir(id,Array.prototype.slice.call(e.dataTransfer.files||[]));};});
 $$('[data-q]',root).forEach(function(b){b.onclick=async function(){b.disabled=true;var r=await api('POST',{op:'quitar',id:b.dataset.q});toast(r.ok?'Material quitado.':(r.error||'No se pudo quitar.'));load();};});}
function opin(c){var O=c.opiniones||[];if(!O.length)return '<p class="tt-tip">Todavía no hay opiniones de los alumnos sobre esta clase.</p>';
 var cnt={};O.forEach(function(o){if(o.animo)cnt[o.animo]=(cnt[o.animo]||0)+1;});
 return '<div class="pf-op"><p class="tt-lbl">Lo que dijeron '+O.length+(O.length===1?' alumno':' alumnos')+'</p><div class="pf-faces">'+CARAS.map(function(x){return cnt[x[0]]?'<span>'+x[1]+' <b>'+cnt[x[0]]+'</b></span>':'';}).join('')+'</div>'+
  O.filter(function(o){return o.gusto;}).map(function(o){return '<blockquote class="pf-q ok">'+esc(o.gusto)+'</blockquote>';}).join('')+O.filter(function(o){return o.mejora;}).map(function(o){return '<blockquote class="pf-q up">'+esc(o.mejora)+'</blockquote>';}).join('')+'</div>';}
var PASOS=[['animo','¿Cómo te fuiste de la clase?'],['bien','¿Qué salió bien?','Un momento, una pregunta, algo que conectó con el grupo.'],['mejorar','¿Qué harías distinto la próxima?','Tiempos, recursos, algo para explicar mejor.'],['grupo','¿Cómo viste al grupo?','Alguien para acompañar, preguntas que quedaron.'],['aprendi','¿Qué te enseñó Dios a vos?','Enseñar también nos forma.'],['oracion','¿Algo por lo que oremos?','Opcional. Lo lee solo la dirección.']];
function reflexion(c,box,done){var V=Object.assign({},c.reflexion||{}),i=0;
 function paso(){var P=PASOS[i];box.innerHTML='<p class="tt-lbl">Después de la clase · '+cap(larga(c.fecha))+' · '+esc(c.title||'')+'</p><div class="pf-steps">'+PASOS.map(function(x,j){return '<i class="'+(j<i?'ok':j===i?'on':'')+'"></i>';}).join('')+'</div><h2 class="pf-qh">'+P[1]+'</h2>'+(P[2]?'<p class="tt-tip">'+P[2]+'</p>':'')+
  (P[0]==='animo'?'<div class="pf-pick">'+CARAS.map(function(x){return '<button type="button" data-v="'+x[0]+'" class="'+(V.animo===x[0]?'on':'')+'"><em>'+x[1]+'</em>'+x[2]+'</button>';}).join('')+'</div>':'<textarea id="rT" rows="4">'+esc(V[P[0]]||'')+'</textarea>')+
  '<div class="pf-nav">'+(i?'<button type="button" class="tt-btn s" id="rB">Atrás</button>':'<span></span>')+'<button type="button" class="tt-btn" id="rN">'+(i===PASOS.length-1?'Guardar reflexión':'Seguir')+'</button></div>';
  $$('.pf-pick button',box).forEach(function(b){b.onclick=function(){V.animo=b.dataset.v;i++;paso();};});
  var t=$('#rT',box);if(t)t.focus();
  function grab(){if(t)V[P[0]]=t.value;}
  if($('#rB',box))$('#rB',box).onclick=function(){grab();i--;paso();};
  $('#rN',box).onclick=async function(){grab();if(i<PASOS.length-1){i++;paso();return;}this.disabled=true;var r=await api('POST',Object.assign({op:'reflexion',claseId:c._id},V));if(r.ok){box.innerHTML='<div class="pf-done"><em>🌱</em><h2 class="pf-qh">Gracias por tomarte este momento</h2><p class="tt-tip">Tu reflexión queda guardada para vos y para la dirección. Lo que hoy sembraste, Dios lo hace crecer (1 Corintios 3:7).</p></div>';setTimeout(function(){done&&done();},2600);}else{toast(r.error||'No se guardó.');this.disabled=false;}};}
 paso();}
function drawer(c){var b=$('#drBody');var fut=c.fecha>=hoy;b.innerHTML='<p class="tt-lbl">'+esc(c.programa||'')+(c.bloque?' · '+esc(c.bloque):'')+'</p><h2 id="drT" class="pf-qh">'+cap(larga(c.fecha))+'</h2><p>'+esc(c.title||'Clase')+' · '+hora(c.fecha)+' h</p>'+(c.nota?'<p class="tt-tip">'+esc(c.nota)+'</p>':'')+
 '<h3 class="tt-h">Material</h3>'+mats(c,true)+drop(c)+(fut?'':'<h3 class="tt-h">Tu reflexión</h3>'+(c.reflexion?'<div class="pf-rv">'+(c.reflexion.animo?'<p class="pf-big">'+cara(c.reflexion.animo)+'</p>':'')+PASOS.slice(1).map(function(P){return c.reflexion[P[0]]?'<p><b>'+P[1]+'</b><br>'+esc(c.reflexion[P[0]])+'</p>':'';}).join('')+'<button type="button" class="tt-btn s" id="drR">Editar reflexión</button></div>':'<div id="drRbox"><button type="button" class="tt-btn" id="drR">Escribir mi reflexión</button></div>')+'<h3 class="tt-h">Los alumnos</h3><p class="tt-tip">'+(c.presentes?c.presentes+' alumnos en la lista de esa clase.':'')+'</p>'+opin(c));
 $('#ttDrawer').hidden=false;bindMat(b);var rb=$('#drR');if(rb)rb.onclick=function(){var box=document.createElement('div');box.className='pf-refl in';rb.parentNode.replaceWith(box);reflexion(c,box,function(){$('#ttDrawer').hidden=true;load();});};}
$$('[data-x]').forEach(function(x){x.onclick=function(){$('#ttDrawer').hidden=true;};});
document.addEventListener('keydown',function(e){if(e.key==='Escape')$('#ttDrawer').hidden=true;});
function draw(){
 if(!R.profe){$('#pHola').textContent='Este panel es para los profes de Habitat';$('#pWho').textContent='Si enseñás en Habitat, pedile a la dirección que sume el email con el que entrás al Campus.';$('#pMain').innerHTML='';return;}
 var P=R.profe,h=new Date().getHours(),nom=String(P.nombre||'').split(' ')[0];
 $('#pHola').textContent=(h<12?'Buen día':h<20?'Buenas tardes':'Buenas noches')+', '+nom;
 var N=R.proximas||[],Pa=R.pasadas||[];
 $('#pWho').textContent=N.length?'Tenés '+N.length+(N.length===1?' clase':' clases')+' por delante. Gracias por enseñar.':'Por ahora no tenés clases asignadas.';
 if(N.length){var n=N[0],dd=Math.round((pd(n.fecha)-pd(hoy))/864e5);
  $('#pNext').innerHTML='<div class="pf-nh"><div><p class="tt-lbl">'+(dd===0?'Hoy':dd===1?'Mañana':'En '+dd+' días')+' · '+esc(n.programa||'')+(n.bloque?' · '+esc(n.bloque):'')+'</p><h2>'+cap(larga(n.fecha))+'</h2><p class="vs-time">'+esc(n.title||'Clase')+' · empieza a las <b>'+hora(n.fecha)+'</b></p>'+(n.nota?'<p class="tt-tip">'+esc(n.nota)+'</p>':'')+'</div><div class="pf-count" aria-hidden="true"><b>'+dd+'</b><span>'+(dd===1?'día':'días')+'</span></div></div>'+mats(n,true)+drop(n);bindMat($('#pNext'));}
 else $('#pNext').innerHTML='<h2>Sin clases por delante</h2><p class="tt-tip">Cuando la dirección te asigne una clase, la vas a ver acá con su material.</p>';
 var pend=Pa.filter(function(c){return !c.reflexion&&(pd(hoy)-pd(c.fecha))/864e5<=14;})[0];
 var rf=$('#pRefl');if(pend){rf.hidden=false;reflexion(pend,rf,function(){rf.hidden=true;load();});}else rf.hidden=true;
 var S=R.siembra||{};$('#pSeed').innerHTML='<h2 class="tt-h">Tu siembra este año</h2><div class="tt-stats">'+[[S.clases,'clases que diste',4,'var(--gold)'],[S.horas,'horas enseñando',2],[S.alumnos,'alumnos en tus clases',.5],[S.comentarios,'mensajes de alumnos',3]].map(function(x){return '<div class="tt-stat"><span class="tt-ring" style="--p:'+Math.min(100,(x[0]||0)*x[2])+(x[3]?';--col:'+x[3]:'')+'"><span>'+(x[0]||0)+'</span></span><small>'+x[1]+'</small></div>';}).join('')+'</div><p class="tt-tip">'+esc(R.animo||'')+'</p>';
 var G=R.gustos||[];if(P.gracias||G.length){var th=$('#pThanks');th.hidden=false;th.innerHTML=(P.gracias?'<div class="pf-letter"><p class="tt-lbl">Un mensaje de la dirección</p><p>'+esc(P.gracias).replace(/\n/g,'<br>')+'</p></div>':'')+(G.length?'<div><p class="tt-lbl">Lo que se llevaron tus alumnos</p><div class="pf-quotes">'+G.map(function(g){return '<blockquote class="pf-q ok">'+esc(g)+'</blockquote>';}).join('')+'</div></div>':'');}
 function fila(c){var M=(c.materiales||[]).length,O=(c.opiniones||[]).length,fut=c.fecha>=hoy;return '<button type="button" class="pf-it" data-c="'+esc(c._id)+'"><span class="pf-d"><b>'+pd(c.fecha).getDate()+'</b>'+MS[pd(c.fecha).getMonth()].slice(0,3)+'</span><span class="pf-t"><b>'+esc(c.title||'Clase')+'</b><small>'+esc(c.programa||'')+' · '+DL[pd(c.fecha).getDay()]+' '+hora(c.fecha)+' h</small></span><span class="pf-tags">'+(M?'<i>📎 '+M+'</i>':fut?'<i class="warn">Sin material</i>':'')+(fut?'':(c.reflexion?'<i>'+cara(c.reflexion.animo)+' Reflexión</i>':'<i class="warn">Sin reflexión</i>')+(O?'<i>💬 '+O+'</i>':''))+'</span></button>';}
 $('#pList').innerHTML=N.map(fila).join('')||'<p class="tt-empty">No tenés clases por delante.</p>';
 $('#pPast').innerHTML=Pa.map(fila).join('')||'<p class="tt-empty">Acá vas a ver las clases que ya diste.</p>';
 var all=N.concat(Pa);$$('[data-c]').forEach(function(b){b.onclick=function(){drawer(all.filter(function(c){return c._id===b.dataset.c;})[0]);};});
 var ics=P.ics;$('#pIcs').href=ics.replace(/^https:/,'webcal:');$('#pGcal').href='https://calendar.google.com/calendar/r?cid='+encodeURIComponent(ics.replace(/^https:/,'webcal:'));}
load();
})();
</script>
'''
css = '''<style>
.pf-next{display:grid;gap:14px;padding:26px}
.pf-nh{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
.pf-next h2{font-size:clamp(1.9rem,4vw,2.6rem);line-height:1.05}
.pf-count{flex:0 0 auto;display:grid;place-items:center;width:96px;height:96px;border-radius:50%;background:var(--ink);color:var(--paper);text-align:center;line-height:1}
.pf-count b{font:500 2.2rem/1 var(--serif);color:var(--gold-2)}.pf-count span{font-size:.8rem}
.pf-drop{border:2px dashed var(--line);border-radius:16px;padding:18px;display:grid;gap:4px;cursor:pointer;transition:border-color .2s,background .2s}
.pf-drop:hover,.pf-drop:focus-visible,.pf-drop.over{border-color:var(--gold);background:var(--soft);outline:none}
.pf-drop.busy{opacity:.6;pointer-events:none}.pf-drop span{color:var(--muted);font-size:.92rem}
.pf-mats{display:flex;flex-wrap:wrap;gap:8px}.pf-mats:empty{display:none}
.pf-mat{display:inline-flex;align-items:center;gap:6px;background:var(--soft);border-radius:999px;padding:8px 8px 8px 14px;font-size:.92rem}
.pf-mat a{color:inherit;text-decoration:none;font-weight:600}.pf-mat button{border:0;background:transparent;cursor:pointer;color:var(--muted);width:26px;height:26px;border-radius:50%}
.pf-mat button:hover{background:var(--line)}
.pf-row{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:start}
.pf-seed,.vs-cal{display:grid;gap:12px}
.pf-refl{display:grid;gap:12px;padding:24px;border-color:var(--gold);box-shadow:inset 0 0 0 1px var(--gold)}
.pf-refl.in{border:1px solid var(--gold);border-radius:16px;padding:18px}
.pf-steps{display:flex;gap:6px}.pf-steps i{flex:1;height:5px;border-radius:9px;background:var(--line)}.pf-steps i.on{background:var(--gold)}.pf-steps i.ok{background:var(--ink)}
.pf-qh{font:500 clamp(1.4rem,3vw,1.9rem)/1.15 var(--serif)}
.pf-refl textarea{width:100%;font:inherit;padding:12px;border:1px solid var(--line);border-radius:12px;min-height:110px}
.pf-pick{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.pf-pick button{display:grid;gap:4px;justify-items:center;padding:12px 4px;border:1px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;font:600 .8rem var(--sans);color:var(--ink)}
.pf-pick button em{font-style:normal;font-size:1.9rem}.pf-pick button.on,.pf-pick button:hover{border-color:var(--gold);background:var(--soft)}
.pf-nav{display:flex;justify-content:space-between;gap:10px}
.pf-done{display:grid;gap:8px;justify-items:center;text-align:center;padding:12px}.pf-done em{font-style:normal;font-size:2.6rem}
.pf-thanks{display:grid;grid-template-columns:1fr 1.3fr;gap:20px;padding:24px;background:var(--ink);color:var(--paper);border-color:var(--ink)}
.pf-thanks .tt-lbl{color:var(--gold-2)}
.pf-letter p:last-child{font:italic 1.2rem/1.55 var(--serif)}
.pf-quotes{display:grid;gap:8px;max-height:260px;overflow:auto}
.pf-q{margin:0;padding:10px 14px;border-radius:12px;font-size:.95rem;line-height:1.5}
.pf-q.ok{background:rgba(184,144,79,.14)}.pf-q.up{background:var(--soft);border-left:3px solid var(--muted)}
.pf-thanks .pf-q.ok{background:rgba(251,248,242,.08);color:var(--paper)}
.pf-list{display:grid;gap:8px}
.pf-it{display:grid;grid-template-columns:62px 1fr auto;gap:14px;align-items:center;text-align:left;background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px 14px;cursor:pointer;font:inherit;color:inherit}
.pf-it:hover,.pf-it:focus-visible{border-color:var(--gold);outline:none}
.pf-d{display:grid;justify-items:center;font-size:.75rem;text-transform:uppercase;color:var(--muted)}.pf-d b{font:500 1.7rem/1 var(--serif);color:var(--ink)}
.pf-t{display:grid;gap:2px;min-width:0}.pf-t small{color:var(--muted)}
.pf-tags{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.pf-tags i{font-style:normal;font-size:.78rem;background:var(--soft);border-radius:999px;padding:4px 10px;white-space:nowrap}
.pf-tags i.warn{background:var(--yb);color:var(--y)}
.pf-op{display:grid;gap:8px}.pf-faces{display:flex;gap:12px;font-size:1.3rem}.pf-faces b{font-size:.9rem}
.pf-rv{display:grid;gap:8px}.pf-big{font-size:2.2rem}
#drBody{display:grid;gap:10px}
@media (max-width:760px){.pf-row,.pf-thanks{grid-template-columns:1fr}.pf-it{grid-template-columns:52px 1fr}.pf-tags{grid-column:2;justify-content:flex-start}.pf-pick{grid-template-columns:repeat(5,minmax(0,1fr))}.pf-pick button{font-size:.66rem}.pf-count{width:76px;height:76px}}
</style>
'''
html = B.head('Profesores · Habitat', 'Panel de los profesores de Habitat CFM.', 'profesor.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n<link rel="stylesheet" href="/assets/tutor.css">\n' + css + '</head>')
html = html.replace('<body>', '<body data-solid="1" class="campus tutor">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'profesor.html'), 'w', encoding='utf-8').write(html)
print('profesor ok')
