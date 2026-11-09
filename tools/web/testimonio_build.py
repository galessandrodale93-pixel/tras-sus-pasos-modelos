#!/usr/bin/env python3
"""Página personal del alumno para su video testimonio (entra con la clave del mail o desde el Campus)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="pf-hero"><div class="wrap pf-in">
  <div class="av" id="tAv">🎥</div>
  <div><span class="kick">Tu testimonio</span><h1 id="tH">Queremos escuchar tu historia</h1><p id="tL">Cargando…</p></div>
  <a class="btn btn-line" href="/campus.html">Mi campus</a>
</div></section>
<section class="cx-sec" id="tBox" hidden><div class="wrap ts-wrap">
  <div class="cx-h"><h2>En tres pasos</h2><span class="sub" id="tLim"></span></div>
  <ol class="ts-steps" id="tSteps">
    <li class="ts-st on" data-s="1"><button type="button"><b>1</b><span>Prepará el lugar</span></button></li>
    <li class="ts-st" data-s="2"><button type="button"><b>2</b><span>Pensá tus respuestas</span></button></li>
    <li class="ts-st" data-s="3"><button type="button"><b>3</b><span>Subí tu video</span></button></li>
  </ol>
  <div class="tr-card ts-p" data-p="1">
    <h3>Cómo filmarlo</h3>
    <div class="ts-tips">
      <div><i>📱</i><b>En vertical</b><span>Celular parado, como un Reel.</span></div>
      <div><i>💡</i><b>Buena luz</b><span>Mirá hacia una ventana o una lámpara, con la luz de frente.</span></div>
      <div><i>🤫</i><b>Lugar tranquilo</b><span>Sin ruido, con el encuadre de la cadera para arriba.</span></div>
      <div><i>😊</i><b>Con naturalidad</b><span>Como si se lo contaras a un amigo. Uno o dos minutos alcanza.</span></div>
    </div>
    <button class="btn btn-gold ts-next" type="button" data-go="2">Listo, sigamos</button>
  </div>
  <div class="tr-card ts-p" data-p="2" hidden>
    <h3>Las 5 preguntas</h3>
    <p class="ts-hint">Tocá cada una a medida que la pensás. Respondé en tus palabras, en el orden que te salga.</p>
    <ol class="ts-q" id="tQ"></ol>
    <button class="btn btn-gold ts-next" type="button" data-go="3">Ya las tengo, a filmar</button>
  </div>
  <div class="tr-card ts-p" data-p="3" hidden id="tUp">
    <h3>Subí tu video</h3>
    <label class="ts-drop" id="tDrop"><input type="file" id="tF" accept="video/*" hidden><i>⬆️</i><b>Elegí tu video</b><span>Desde la galería del celular o la computadora</span></label>
    <div class="ts-prog" id="tProg" hidden><i id="tBar"></i></div>
    <p class="ts-hint" id="tMsg"></p>
  </div>
  <div class="ts-alt" id="tBtns">
    <p class="ts-hint">¿Preferís de otra forma?</p>
    <div class="ts-alts">
      <button type="button" data-r="alla"><i>🎬</i><b>Prefiero filmarlo en Habitat</b><span>Lo filmamos juntos en una clase.</span></button>
      <button type="button" data-r="ayuda"><i>🙋</i><b>Necesito ayuda</b><span>Alguien del equipo te escribe para darte una mano.</span></button>
    </div>
  </div>
</div></section>
'''
css = '''<style>
.ts-wrap{max-width:820px}
.ts-p[hidden],.ts-alt[hidden],.ts-steps[hidden]{display:none!important}
.ts-next{justify-self:start;width:auto}
.ts-tips div{align-content:start}
.ts-steps{list-style:none;padding:0;margin:0 0 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ts-st button{width:100%;display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:16px;border:1px solid var(--line);background:#fff;font:600 .9rem var(--sans);color:var(--ink);cursor:pointer;text-align:left;transition:border-color .2s,background .2s}
.ts-st b{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--sand);font:500 1.1rem var(--serif)}
.ts-st.on button{background:var(--ink);color:var(--cream);border-color:var(--ink)}.ts-st.on b{background:var(--gold-2);color:var(--ink)}
.ts-st.ok b{background:#2f7a4f;color:#fff}
.ts-p h3{font:500 1.6rem var(--serif);margin:0 0 14px}
.ts-tips{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
.ts-tips div{display:grid;gap:2px;padding:14px;border-radius:14px;background:var(--paper);border:1px solid var(--line)}
.ts-tips i{font-style:normal;font-size:1.4rem}.ts-tips span{color:var(--muted);font-size:.9rem}
.ts-hint{color:var(--muted);font-size:.92rem;margin:0 0 12px}
.ts-q{list-style:none;counter-reset:q;padding:0;margin:0 0 20px;display:grid;gap:8px}
.ts-q li{counter-increment:q;display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:14px;border:1px solid var(--line);background:#fff;cursor:pointer;transition:border-color .2s,background .2s;font-size:1rem}
.ts-q li:before{content:counter(q);flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--sand);font:500 1.1rem var(--serif)}
.ts-q li:hover{border-color:var(--gold)}
.ts-q li.ok{background:#eef5f0;border-color:#b9d8c4}.ts-q li.ok:before{content:"✓";background:#2f7a4f;color:#fff;font-family:var(--sans);font-size:.9rem}
.ts-drop{display:grid;justify-items:center;gap:4px;padding:34px 20px;border:2px dashed var(--gold-2);border-radius:18px;background:var(--paper);cursor:pointer;text-align:center;transition:background .2s}
.ts-drop:hover,.ts-drop.drag{background:#f4ecdc}.ts-drop i{font-style:normal;font-size:1.8rem}.ts-drop b{font:500 1.3rem var(--serif)}.ts-drop span{color:var(--muted);font-size:.9rem}
.ts-prog{height:10px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;margin:14px 0 8px}.ts-prog i{display:block;height:100%;width:0;background:var(--gold);transition:width .3s}
.ts-alt{margin-top:26px}
.ts-alts{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ts-alts button{display:grid;gap:2px;justify-items:start;text-align:left;padding:16px;border-radius:16px;border:1px solid var(--line);background:#fff;cursor:pointer;font:inherit;color:inherit;transition:transform .2s,border-color .2s}
.ts-alts button:hover{transform:translateY(-2px);border-color:var(--gold)}.ts-alts i{font-style:normal;font-size:1.4rem}.ts-alts b{font-weight:600}.ts-alts span{color:var(--muted);font-size:.88rem}
.ts-done{text-align:center;padding:30px 20px}.ts-done i{font-style:normal;font-size:2.4rem}
@media(max-width:640px){.ts-steps{grid-template-columns:1fr}.ts-tips,.ts-alts{grid-template-columns:1fr}}
</style>
'''
js = r'''<script>
(function(){
var $=function(s){return document.querySelector(s);};
var P=new URLSearchParams(location.search),K=P.get('k')||'',V=null;
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function larga(f){var d=new Date(f+'T12:00:00');return d.getDate()+' de '+['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getMonth()];}
async function post(b){b.k=K;var r=await fetch('/api/testimonio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});var j={};try{j=await r.json();}catch(e){}if(!r.ok)throw new Error(j.error||'No se pudo guardar.');return j;}
var MSG={'Necesita ayuda':'Listo, le avisamos al equipo: alguien te va a escribir para darte una mano. 🙌🏽','Filmar en Habitat':'¡Genial! Lo filmamos juntos en Habitat. Tu tutor o alguien de la dirección te va a coordinar el día. 🙌🏽','Ya lo subió (revisar)':'Gracias por avisar. Le pedimos al equipo que lo revise; si no lo encontramos, te escribimos.','Subido':'¡Recibimos tu video! Gracias por animarte a contar tu historia. 🙌🏽'};
function pintar(){
  $('#tH').innerHTML='Hola, <em>'+esc(V.nombre)+'</em>';$('#tAv').textContent=String(V.nombre||'·').slice(0,1).toUpperCase();
  $('#tQ').innerHTML=['¿Quién sos y qué estudiás en Habitat?','¿Cómo llegaste a Habitat?','¿Qué cambió en tu vida desde que estudiás acá?',V.becado?'¿Qué significa para vos la beca que recibiste?':'¿Qué significa para vos estudiar en Habitat?','Un mensaje para quien siembra en tu formación.'].map(function(q){return '<li tabindex="0">'+q+'</li>';}).join('');
  document.querySelectorAll('#tQ li').forEach(function(li){li.onclick=li.onkeydown=function(e){if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;e.preventDefault&&e.type==='keydown'&&e.preventDefault();li.classList.toggle('ok');};});
  $('#tLim').textContent=V.limite?'Tenés tiempo hasta el '+larga(V.limite):'';
  $('#tL').textContent=MSG[V.estado]||(V.becado?'Tu beca existe gracias a personas que siembran en esta generación. Contales en un video corto qué significa para vos.':'Tu compromiso con la formación se nota. Contá tu historia en un video corto para quienes siembran en Habitat.');
  $('#tBox').hidden=false;
  if(V.estado==='Subido'){$('#tSteps').hidden=true;document.querySelectorAll('.ts-p').forEach(function(p){p.hidden=p.dataset.p!=='3';});$('#tUp').innerHTML='<div class="ts-done"><i>🙌🏽</i><h3>¡Recibimos tu video!</h3><p class="ts-hint">Gracias por contar tu historia. Si querés mandar otra versión, avisanos.</p></div>';$('#tBtns').hidden=true;}
}
async function responder(r){try{var j=await post({op:'responder',r:r});V=Object.assign(V,j);pintar();window.scrollTo({top:0,behavior:'smooth'});}catch(e){$('#tL').textContent=e.message;}}
function paso(n){document.querySelectorAll('.ts-st').forEach(function(x){var k=+x.dataset.s;x.classList.toggle('on',k===n);x.classList.toggle('ok',k<n);});document.querySelectorAll('.ts-p').forEach(function(p){p.hidden=+p.dataset.p!==n;});}
document.querySelectorAll('.ts-st button').forEach(function(b){b.onclick=function(){paso(+b.parentNode.dataset.s);};});
document.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){paso(+b.dataset.go);$('#tSteps').scrollIntoView({behavior:'smooth',block:'start'});};});
var dr=$('#tDrop');['dragover','dragenter'].forEach(function(t){dr.addEventListener(t,function(e){e.preventDefault();dr.classList.add('drag');});});['dragleave','drop'].forEach(function(t){dr.addEventListener(t,function(e){e.preventDefault();dr.classList.remove('drag');});});dr.addEventListener('drop',function(e){if(e.dataTransfer.files[0]){var dt=new DataTransfer();dt.items.add(e.dataTransfer.files[0]);$('#tF').files=dt.files;$('#tF').onchange();}});
document.querySelectorAll('[data-r]').forEach(function(b){b.onclick=function(){responder(b.dataset.r);};});
$('#tF').onchange=async function(){
  var inp=$('#tF'),f=inp.files[0];if(!f)return;
  var mime=f.type||'video/mp4';if(!/^video\//.test(mime)){$('#tMsg').textContent='Elegí un archivo de video.';return;}
  $('#tMsg').textContent='Subiendo… no cierres esta página.';$('#tProg').hidden=false;inp.disabled=true;$('#tDrop').querySelector('b').textContent=f.name;
  try{
    var u=await post({op:'subir',mime:mime,nombre:f.name});
    var url=await new Promise(function(ok,ko){var x=new XMLHttpRequest();x.open('PUT',u.uploadUrl+(u.uploadUrl.indexOf('?')>=0?'&':'?')+'filename='+encodeURIComponent(f.name));x.setRequestHeader('Content-Type',mime);x.upload.onprogress=function(e){if(e.lengthComputable)$('#tBar').style.width=(100*e.loaded/e.total)+'%';};x.onload=function(){try{var j=JSON.parse(x.responseText);j.file&&j.file.url?ok(j.file.url):ko(new Error('sin url'));}catch(e){ko(e);}};x.onerror=function(){ko(new Error('red'));};x.send(f);});
    var j=await post({op:'video',url:url});V=Object.assign(V,j);pintar();
  }catch(e){$('#tMsg').textContent='No se pudo subir. Revisá tu conexión y probá de nuevo, o tocá «Necesito ayuda».';inp.disabled=false;}
};
(async function(){
  if(!K){$('#tL').innerHTML='Entrá desde el link de tu mail o desde el <a href="/campus.html">Campus</a>.';return;}
  try{var r=await fetch('/api/testimonio?k='+encodeURIComponent(K));V=await r.json();if(!r.ok)throw new Error(V.error);}catch(e){$('#tL').textContent=e.message||'Este link ya no es válido.';return;}
  pintar();
  var rr=P.get('r');if(rr&&/^(subi|ayuda|alla)$/.test(rr)&&V.estado!=='Subido'){history.replaceState(null,'','?k='+K);responder(rr);}
})();
})();
</script>
'''
html = B.head('Tu testimonio · Habitat', 'Tu video testimonio para Habitat CFM.', 'testimonio.html')
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/assets/campus.css">\n' + css + '</head>').replace('<body>', '<body data-solid="1" class="campus">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'testimonio.html'), 'w', encoding='utf-8').write(html)
print('testimonio ok')
