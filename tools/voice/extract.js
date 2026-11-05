// Junta todo el texto que el juego muestra y que se puede pregrabar: [voz, texto]
const {lit,load}=require('./lib');const G=load('/home/claude/tras-sus-pasos/app/game.js'),W=load('/home/claude/tras-sus-pasos/walk3d.js');
const out=new Map();const FEM=/^(María|Elisabet|Ana|Marta|la viuda|una viuda|una vecina|la vecina|Una vecina|María Magdalena|la mujer|una mujer|Una vendedora|Juana|Susana|Lidia|Dorcas|Priscila|Rut|Ester|Sara|Rebeca|Raquel|Débora|Miriam|Noemí|Ana la profetisa)/i;
const norm=t=>String(t).replace(/\s+/g,' ').trim();
const add=(v,t)=>{if(t==null)return;t=norm(t);if(!t||t.length<2)return;if(/\{|\$\{/.test(t)){t=t.replace(/^\{name\}[,!]?\s*/,'');t=t.charAt(0).toUpperCase()+t.slice(1);if(/\{|\$\{/.test(t))return;}if(!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(t))return;const k=v+'|'+t;if(!out.has(k))out.set(k,{v,t});};
const verse=c=>{if(!c.parts||!c.blanks)return null;let i=0;return c.parts.map(p=>typeof p==='number'?c.blanks[p]:p).join('');};
const STORY=eval('('+lit(G,'const STORY=')+')'),EXAMS=eval('('+lit(G,'const EXAMS=')+')');
for(const r in STORY)for(const n in STORY[r]){const s=STORY[r][n];if(!s)continue;add('narrador',s.title);add('narrador',s.text);if(s.game){add('narrador',s.game.title);add('narrador',s.game.how);}
 const c=s.ch;if(c){add('narrador',c.q);if(c.quote)add(FEM.test(c.answer||'')?'mujer':'varon',c.quote);(c.options||[]).forEach(o=>add('narrador',o));add('narrador',c.exp);const v=verse(c);if(v)add('narrador',v);}
 if(s.fork){const f=s.fork;Object.values(f).forEach(x=>{if(typeof x==='string')add('narrador',x);else if(x&&typeof x==='object')Object.values(x).forEach(y=>typeof y==='string'&&add('narrador',y));});}}
for(const r in EXAMS)EXAMS[r].forEach(q=>{add('narrador',q.q);(q.o||[]).forEach(o=>add('narrador',o));add('narrador',q.exp);const v=verse(q);if(v)add('narrador',v);});
// instrucciones de minijuegos y frases de juego en game.js
for(const m of G.matchAll(/\b(?:how|hint|tip|help|intro|goal|instr|msg|lead)\s*:\s*'((?:[^'\\]|\\.){12,400})'/g))add('narrador',m[1].replace(/\\'/g,"'"));
const TF=eval(lit(G,'const TF ='));TF.forEach(([t])=>add('narrador',t));
// mundo 3D: lugares, versículos, pensamientos, tutorial, misiones
const TI=eval('('+lit(W,'const TRADE_INFO =')+')');Object.values(TI).forEach(([a,b,c])=>{add('narrador',a);add('narrador',b);});
const VS=eval('('+lit(W,'const VERSOS =')+')');Object.values(VS).forEach(t=>t.v.forEach(([a,ref])=>add('narrador',a)));
eval(lit(W,'const PASO =')).forEach(([a])=>add('narrador',a));
const TH=eval('('+lit(W,'const THINK =')+')');Object.values(TH).flat().forEach(t=>add('narrador',t));
const tut=W.slice(W.indexOf('function tutSteps'),W.indexOf('function tutOpen'));for(const m of tut.matchAll(/'((?:[^'\\]|\\.){4,})'/g))if(!/^[#.]/.test(m[1]))add('narrador',m[1]);
const MIS=eval(lit(W,'export const MISSIONS ='));MIS.forEach(d=>{const gv=d.giver&&d.giver.look&&d.giver.look.g==='chica'?'mujer':'varon',tv=d.target&&d.target.look&&d.target.look.g==='chica'?'mujer':'varon';['ask','got','hint'].forEach(k=>d[k]&&add(gv,d[k]));['done','thanks','say'].forEach(k=>d[k]&&add(d.target?tv:gv,d[k]));});
for(const m of W.matchAll(/(?:svToast|toast)\('((?:[^'\\$]|\\.){10,})'\)/g))add('narrador',m[1].replace(/\\'/g,"'"));
for(const m of G.matchAll(/\blab\(c, th, '((?:[^'\\]|\\.){14,})'/g))add('narrador',m[1].replace(/\\'/g,"'"));
for(const m of G.matchAll(/\btoast\('((?:[^'\\$]|\\.){10,})'/g))add('narrador',m[1].replace(/\\'/g,"'"));
['¡Correcto!','Casi','No es esa','Completá el versículo','Elegí las palabras que faltan','Verdadero','Falso','¡Muy bien!','Todavía no','¡Etapa aprobada!'].forEach(t=>add('narrador',t));
const arr=[...out.values()];require('fs').writeFileSync('texts.json',JSON.stringify(arr,null,0));
const by={};arr.forEach(x=>by[x.v]=(by[x.v]||0)+1);console.log(arr.length,by,arr.reduce((a,x)=>a+x.t.length,0),'chars');
