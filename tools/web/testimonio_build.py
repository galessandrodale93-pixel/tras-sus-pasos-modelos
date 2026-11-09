#!/usr/bin/env python3
"""Página personal del alumno para su video testimonio (entra con la clave del mail o desde el Campus)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

body = '''
<section class="sec" style="padding-top:120px"><div class="wrap" style="max-width:720px">
  <span class="kick">Tu testimonio</span><h1 id="tH" style="margin:.2em 0 .4em">Queremos escuchar tu historia</h1>
  <p class="lead" id="tL">Cargando…</p>
  <div id="tBox" hidden>
    <div class="panel" style="margin:22px 0">
      <h3>Cómo filmarlo</h3>
      <ul class="ticks"><li>Celular en vertical, como un Reel.</li><li>Buena luz: mirá hacia una ventana o una lámpara, con la luz de frente.</li><li>Encuadre de la cadera para arriba, en un lugar tranquilo y sin ruido.</li><li>Hablá con naturalidad, como si se lo contaras a un amigo.</li></ul>
      <h3 style="margin-top:18px">Las 5 preguntas</h3>
      <ol id="tQ" style="line-height:1.8;padding-left:22px"></ol>
    </div>
    <div class="panel" id="tUp" style="margin:22px 0">
      <h3>Subí tu video</h3>
      <p class="hint" id="tLim"></p>
      <input type="file" id="tF" accept="video/*" style="margin:12px 0">
      <div id="tProg" hidden style="height:10px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;margin:8px 0"><i id="tBar" style="display:block;height:100%;width:0;background:#b8904f;transition:width .3s"></i></div>
      <p class="hint" id="tMsg"></p>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap" id="tBtns">
      <button class="btn btn-line" type="button" data-r="alla">Prefiero filmarlo en Habitat</button>
      <button class="btn btn-line" type="button" data-r="ayuda">Necesito ayuda</button>
    </div>
  </div>
</div></section>
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
  $('#tH').textContent='Hola '+V.nombre+'! Queremos escuchar tu historia';
  $('#tQ').innerHTML=['¿Quién sos y qué estudiás en Habitat?','¿Cómo llegaste a Habitat?','¿Qué cambió en tu vida desde que estudiás acá?',V.becado?'¿Qué significa para vos la beca que recibiste?':'¿Qué significa para vos estudiar en Habitat?','Un mensaje para quien siembra en tu formación.'].map(function(q){return '<li>'+q+'</li>';}).join('');
  $('#tLim').textContent=V.limite?'Tenés tiempo hasta el '+larga(V.limite)+'.':'';
  $('#tL').textContent=MSG[V.estado]||(V.becado?'Tu beca existe gracias a personas que siembran en esta generación. Contales en un video corto qué significa para vos.':'Tu compromiso con la formación se nota. Contá tu historia en un video corto para quienes siembran en Habitat.');
  $('#tBox').hidden=false;
  if(V.estado==='Subido'){$('#tUp').innerHTML='<h3>Tu video</h3><p class="hint">Ya lo recibimos. Si querés mandar otra versión, avisanos.</p>';$('#tBtns').hidden=true;}
}
async function responder(r){try{var j=await post({op:'responder',r:r});V=Object.assign(V,j);pintar();window.scrollTo({top:0,behavior:'smooth'});}catch(e){$('#tL').textContent=e.message;}}
document.querySelectorAll('[data-r]').forEach(function(b){b.onclick=function(){responder(b.dataset.r);};});
$('#tF').onchange=async function(){
  var f=this.files[0];if(!f)return;
  var mime=f.type||'video/mp4';if(!/^video\//.test(mime)){$('#tMsg').textContent='Elegí un archivo de video.';return;}
  $('#tMsg').textContent='Subiendo… no cierres esta página.';$('#tProg').hidden=false;this.disabled=true;
  try{
    var u=await post({op:'subir',mime:mime,nombre:f.name});
    var url=await new Promise(function(ok,ko){var x=new XMLHttpRequest();x.open('PUT',u.uploadUrl+(u.uploadUrl.indexOf('?')>=0?'&':'?')+'filename='+encodeURIComponent(f.name));x.setRequestHeader('Content-Type',mime);x.upload.onprogress=function(e){if(e.lengthComputable)$('#tBar').style.width=(100*e.loaded/e.total)+'%';};x.onload=function(){try{var j=JSON.parse(x.responseText);j.file&&j.file.url?ok(j.file.url):ko(new Error('sin url'));}catch(e){ko(e);}};x.onerror=function(){ko(new Error('red'));};x.send(f);});
    var j=await post({op:'video',url:url});V=Object.assign(V,j);pintar();
  }catch(e){$('#tMsg').textContent='No se pudo subir. Revisá tu conexión y probá de nuevo, o tocá «Necesito ayuda».';this.disabled=false;}
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
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n</head>').replace('<body>', '<body data-solid="1">')
html += body + B.FOOT + js + '</body>\n</html>\n'
open(os.path.join(B.OUT, 'testimonio.html'), 'w', encoding='utf-8').write(html)
print('testimonio ok')
