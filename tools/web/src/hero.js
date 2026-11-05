/* Hero: polvo en la luz, brasas, bruma, parallax de la foto y expediciones. */
(function(){
var view=document.getElementById('adosView');if(!view)return;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var IMG='/bg.png';
var IMG_S='/bg.png';
document.documentElement.style.setProperty('--hx-img','url("'+(innerWidth<700?IMG_S:IMG)+'")');
function rnd(a,b){return a+Math.random()*(b-a);}
function seeded(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}

/* ---- canvas: polvo, brasas y bruma ---- */
var cv=document.getElementById('heroFx');
if(cv){
  var ctx=cv.getContext('2d'),W=0,H=0,dpr=1,raf=0,vis=true,t0=performance.now(),dust=[],embers=[];
  var size=function(){dpr=Math.min(2,devicePixelRatio||1);var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    dust=[];for(var i=0;i<Math.round(W*H/5200);i++)dust.push({x:Math.random()*W,y:Math.random()*H,r:rnd(.4,1.6),vx:rnd(-6,6),vy:rnd(-4,3),p:rnd(0,7)});
    embers=[];for(var j=0;j<Math.round(W/26);j++)embers.push({x:rnd(-.1,1.1)*W,y:H*rnd(.6,1.1),r:rnd(.8,2),v:rnd(18,46),p:rnd(0,7)});};
  var draw=function(now){
    raf=0;if(!vis||view.hidden)return;var t=(now-t0)/1000;ctx.clearRect(0,0,W,H);
    // haz de luz central que "respira"
    var cx=W*(W<700?.66:.6),cy=H*.3,g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.55);
    g.addColorStop(0,'rgba(255,214,150,'+(.10+.04*Math.sin(t*.8))+')');g.addColorStop(1,'rgba(255,214,150,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(var i=0;i<dust.length;i++){var d=dust[i];d.x+=d.vx*.016+Math.sin(t*.7+d.p)*.12;d.y+=d.vy*.016;if(d.x<-5)d.x=W+5;if(d.x>W+5)d.x=-5;if(d.y<-5)d.y=H+5;if(d.y>H+5)d.y=-5;
      var inBeam=Math.max(0,1-Math.abs(d.x-cx)/(W*.32))*Math.max(0,1-Math.abs(d.y-cy)/(H*.6));
      var a=(.12+.75*inBeam)*(.6+.4*Math.sin(t*2+d.p));ctx.fillStyle='rgba(255,236,200,'+a.toFixed(3)+')';ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,7);ctx.fill();}
    for(var e=0;e<embers.length;e++){var q=embers[e];q.y-=q.v*.016;q.x+=Math.sin(t*1.3+q.p)*.5;if(q.y<H*.35){q.y=H*rnd(.95,1.1);q.x=rnd(-.1,1.1)*W;}
      var fl=.45+.55*Math.abs(Math.sin(t*4+q.p)),fade=Math.min(1,(q.y-H*.35)/(H*.25));
      var gr=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r*5);gr.addColorStop(0,'rgba(255,170,70,'+(.9*fl*fade).toFixed(3)+')');gr.addColorStop(1,'rgba(255,110,40,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(q.x,q.y,q.r*5,0,7);ctx.fill();}
    ctx.globalCompositeOperation='source-over';
    // bruma baja que se desliza
    for(var f=0;f<3;f++){var fy=H*(.72+f*.09),fx=((t*(8+f*4)+f*420)%(W+800))-400,fg=ctx.createRadialGradient(fx,fy,0,fx,fy,W*.55);fg.addColorStop(0,'rgba(200,170,130,.07)');fg.addColorStop(1,'rgba(200,170,130,0)');ctx.fillStyle=fg;ctx.fillRect(0,fy-W*.55,W,W*1.1);}
    // antorcha fuera de cuadro, abajo a la izquierda
    var fl2=.18+.06*Math.sin(t*9)+.04*Math.sin(t*23),tg=ctx.createRadialGradient(-W*.05,H*1.02,0,-W*.05,H*1.02,Math.max(W,H)*.6);
    tg.addColorStop(0,'rgba(255,140,50,'+fl2.toFixed(3)+')');tg.addColorStop(1,'rgba(255,140,50,0)');ctx.fillStyle=tg;ctx.fillRect(0,0,W,H);
    if(!reduce)raf=requestAnimationFrame(draw);
  };
  var kick=function(){if(!raf&&vis&&!view.hidden)raf=requestAnimationFrame(draw);};
  size();addEventListener('resize',function(){size();kick();});
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;kick();}).observe(cv);
  new MutationObserver(function(){if(!view.hidden){size();kick();}}).observe(view,{attributes:true,attributeFilter:['hidden']});
  kick();
}

/* ---- parallax de la foto ---- */
var ph=view.querySelector('.hx-photo');
function setP(x,y){if(!ph)return;ph.style.setProperty('--px',(x*-18).toFixed(1)+'px');ph.style.setProperty('--py',(y*-12).toFixed(1)+'px');}
if(!reduce){
  addEventListener('pointermove',function(e){if(view.hidden)return;setP(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);},{passive:true});
  addEventListener('deviceorientation',function(e){if(view.hidden||e.gamma==null)return;setP(Math.max(-.5,Math.min(.5,e.gamma/50)),Math.max(-.5,Math.min(.5,(e.beta-45)/70)));},{passive:true});
}
var more=view.querySelector('[data-scroll]');
if(more)more.addEventListener('click',function(){var d=document.getElementById(more.dataset.scroll);if(d)d.scrollIntoView({behavior:reduce?'auto':'smooth'});});

/* ---- expediciones ---- */
var LOCK='<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5.5" width="8" height="6" rx="1.2" fill="currentColor"/><path d="M3.8 5.5V4a2.2 2.2 0 0 1 4.4 0v1.5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';
var OPEN='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function scene(k){
  // pinturas de fondo por expedición (gradientes, sin fotos externas)
  var S={
    jesus:"url('"+IMG_S+"') 64% 30%/cover",
    genesis:"url('https://static.wixstatic.com/media/43ca3b_381edc8e4ac54b50a607c1c4412da369~mv2.png/v1/fill/w_640,h_860,al_c,q_82/e.jpg') center/cover",
    exodo:"url('https://static.wixstatic.com/media/43ca3b_10454b8b8e1b4e0e9f5e177c06c1e13a~mv2.png/v1/fill/w_640,h_860,al_c,q_82/e.jpg') center/cover",
    david:"url('https://static.wixstatic.com/media/43ca3b_3b6bc9afaa844f79af14003e253e0716~mv2.png/v1/fill/w_640,h_860,al_c,q_82/e.jpg') center/cover",
    daniel:"url('https://static.wixstatic.com/media/43ca3b_4f8bfa7877244031822cad7d4ce7be8f~mv2.png/v1/fill/w_640,h_860,al_c,q_82/e.jpg') center/cover",
    hechos:"url('https://static.wixstatic.com/media/43ca3b_f35d178b971a42c09527b4e8523f6d25~mv2.png/v1/fill/w_640,h_860,al_c,q_82/e.jpg') center/cover",
    apoc:"url('https://static.wixstatic.com/media/43ca3b_810adf3b57cf45b394ad1f6e88501d70~mv2.png/v1/fill/w_640,h_860,al_c,q_82/e.jpg') center/cover"
  };return S[k];
}
var EXP=[
  {k:'jesus',n:'I',t:'Tras Sus Pasos',s:'La vida de Jesús, de Belén a la tumba vacía.',on:1},
  {k:'hechos',n:'II',t:'Fuego',s:'Hechos: la iglesia que salió a la calle.'},
  {k:'apoc',n:'III',t:'Maranata',s:'¡Cristo viene! Apocalipsis contado para adolescentes.'},
  {k:'genesis',n:'IV',t:'El Origen',s:'Génesis: la luz, el jardín y la promesa.'},
  {k:'exodo',n:'V',t:'El Éxodo',s:'Un pueblo libre cruzando el mar.'},
  {k:'david',n:'VI',t:'El Rey Pastor',s:'David, de las ovejas al trono.'},
  {k:'daniel',n:'VII',t:'Fieles en Babilonia',s:'Daniel y sus amigos frente al imperio.'}
];
var box=document.getElementById('heroExp');
if(box)box.innerHTML=EXP.map(function(e){return '<article class="hx-card '+(e.on?'on':'off')+'"'+(e.on?' data-play="ados"':'')+'><div class="bg" style="background:'+scene(e.k)+'"></div><span class="n">Expedición '+e.n+'</span><b>'+e.t+'</b><span class="s">'+e.s+'</span><span class="st">'+(e.on?OPEN+'Abierta':LOCK+'Sellada')+'</span></article>';}).join('');
})();
