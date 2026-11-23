// Frases nuevas para grabar con Kokoro: caminos de la historia, «Tu primer camino», pueblos y puertas de misiones.
// Uso: node tools/voice/caminos_lines.js > /tmp/lineas.json
const {lit,load}=require('./lib');const W=load(__dirname+'/../../app/walk3d.js');
const CMP={esc:'esc',zel:'zel',rom:'rom'};const out=new Map();const add=(v,t)=>{if(!t)return;t=String(t).replace(/\s+/g,' ').trim();if(t.length<2)return;out.set(v+'|'+t,{v,t});};
const CAMS=eval('('+lit(W,'const CAMS =')+')');
for(const rid in CAMS){const C=CAMS[rid];if(C.kids){add('narrador',C.kids.t);add('narrador',C.kids.ask);}
 for(const b in C.br){const d=C.br[b];const pv=typeof d.who==='string'?CMP[d.who]:d.who.voice;const V=k=>k==='nar'?'narrador':k==='p'?pv:CMP[k]||'varon';
  add('narrador','Elegiste un camino. '+d.goal+'.');add(pv,'¡Gracias otra vez!');
  (d.hi||[]).forEach(([k,t])=>add(V(k),t));add(V(d.ask[0]),d.ask[1]);
  for(const r of ['good','meh']){const R=d[r];if(!R)continue;(R.then||[]).forEach(([k,t])=>add(V(k),t));(R.arrive||[]).forEach(([k,t])=>add(V(k),t));add('narrador',R.done);}
  if(d.eco)for(const r in d.eco)d.eco[r].forEach(([k,t])=>add(V(k),t));if(d.ecoK)for(const r in d.ecoK)add('narrador',d.ecoK[r]);}}
// la pregunta del capítulo cuando se hace en hoja (Hero): ya está grabada en el capítulo, no hace falta
// «Tu primer camino»
['¡Bienvenido al camino! Este regalo es para vos: unas sandalias para tu primer paso.','¡Primera victoria! Ya sos parte del camino. Ahora llegás al nivel dos.','¡Ya casi! Te falta un paso de tu primer camino.','Primer paso hecho.'].forEach(t=>add('narrador',t));
// pueblos
['Belén','Nazaret','Caná','Capernaúm','Jericó','Jerusalén','Emaús','Aldea'].forEach(n=>add('narrador','Gracias a lo que hiciste, '+n+' está cambiando.'));
// puertas de las misiones
const MIS=eval(lit(W,'export const MISSIONS ='));const PU=eval(lit(W,'const MIS_PUERTA ='));PU.flat().forEach(id=>{const m=MIS.find(x=>x.id===id);if(m)add('narrador',m.giver.name+' te necesita. Ayudalo y se abre la próxima parada.');});
add('narrador','¡Tu equipo cumplió el desafío de la semana! Cobrá tu premio.');add('narrador','¡A tu equipo le falta poco para cumplir el desafío de la semana!');
// el final de los caminos
const FIN=eval('('+lit(W,'const CAM_FIN =')+')');for(const k in FIN)FIN[k].forEach(t=>add(CMP[k],t));
eval(lit(W,'const CAM_TIER =')).forEach(t=>add('narrador',t[2]));
['Llegaste al final de este camino. Mirás hacia atrás: Belén, Nazaret, el Jordán, Galilea… y la tumba vacía.','¡Llegaste al final del camino de Jesús! Lo acompañaste desde Belén hasta la tumba vacía.','Mirá a cuántos amigos ayudaste en el camino.'].forEach(t=>add('narrador',t));
console.log(JSON.stringify([...out.values()]));
