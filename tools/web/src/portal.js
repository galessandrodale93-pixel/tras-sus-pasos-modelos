/* Lámpara: portada principal (portales Kids / Ados) y página Ados (noche épica). */
(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var L=window.LAMP||{};
function rnd(a,b){return a+Math.random()*(b-a);}
function seeded(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}

/* ---------- utilidades de canvas ---------- */
function stage(cv,host,draw){
  if(!cv)return;
  var ctx=cv.getContext('2d'),W=0,H=0,dpr=1,raf=0,vis=true,t0=performance.now();
  function size(){dpr=Math.min(2,window.devicePixelRatio||1);var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw.resize&&draw.resize(W,H);}
  function frame(now){raf=0;if(!vis||host.hidden)return;draw(ctx,W,H,(now-t0)/1000);if(!reduce)raf=requestAnimationFrame(frame);}
  function kick(){if(!raf&&vis&&!host.hidden)raf=requestAnimationFrame(frame);}
  size();addEventListener('resize',function(){size();kick();});
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;kick();}).observe(cv);
  new MutationObserver(function(){if(!host.hidden){size();kick();}}).observe(host,{attributes:true,attributeFilter:['hidden']});
  kick();
}

/* ---------- Portada: cielo de la noche al amanecer ---------- */
var hub=document.getElementById('hubView');
(function(){
  var cv=document.getElementById('hubSky');if(!cv||!hub)return;
  var stars=[],motes=[];
  function draw(c,W,H,t){
    c.clearRect(0,0,W,H);
    // halo de la lámpara
    var cx=W/2,cy=Math.min(H*.2,150),rg=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.6);
    rg.addColorStop(0,'rgba(255,190,100,'+(.30+.05*Math.sin(t*1.7))+')');rg.addColorStop(.35,'rgba(200,120,160,.12)');rg.addColorStop(1,'rgba(30,29,85,0)');c.fillStyle=rg;c.fillRect(0,0,W,H);
    // rayos
    c.save();c.translate(cx,cy);c.rotate(t*.03);c.globalCompositeOperation='lighter';
    for(var i=0;i<14;i++){c.rotate(Math.PI*2/14);c.fillStyle='rgba(255,210,140,.035)';c.beginPath();c.moveTo(0,0);c.lineTo(-34,Math.max(W,H));c.lineTo(34,Math.max(W,H));c.fill();}
    c.restore();
    for(var s=0;s<stars.length;s++){var p=stars[s],a=p.a*(.55+.45*Math.sin(t*p.f+p.p));c.fillStyle='rgba(255,248,230,'+a+')';c.beginPath();c.arc(p.x*W,p.y*H,p.r,0,7);c.fill();}
    c.globalCompositeOperation='lighter';
    for(var m=0;m<motes.length;m++){var q=motes[m];q.y-=q.v*.016;q.x+=Math.sin(t*q.f+q.p)*.15;if(q.y<-10){q.y=H+10;q.x=Math.random()*W;}
      var al=.5+.5*Math.sin(t*2+q.p);var gg=c.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r*4);gg.addColorStop(0,'rgba(255,214,140,'+(.7*al)+')');gg.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=gg;c.beginPath();c.arc(q.x,q.y,q.r*4,0,7);c.fill();}
    c.globalCompositeOperation='source-over';
  }
  draw.resize=function(W,H){
    stars=[];var n=Math.round(W*H/2600);for(var i=0;i<n;i++)stars.push({x:Math.random(),y:Math.pow(Math.random(),1.4)*.9,r:rnd(.4,1.5),a:rnd(.35,1),f:rnd(.6,2.4),p:rnd(0,7)});
    motes=[];for(var j=0;j<Math.round(W/22);j++)motes.push({x:Math.random()*W,y:Math.random()*H,r:rnd(1,2.6),v:rnd(10,30),f:rnd(.4,1.2),p:rnd(0,7)});
  };
  stage(cv,hub,draw);
})();

/* ---------- Arte de los portales ---------- */
function kidsPortal(){
  var cloud=L.cloud||function(){return '';},spark=L.spark||function(){return '';},kid=L.kid||function(){return '';};
  var r=seeded(4),st='';for(var i=0;i<26;i++)st+='<circle cx="'+(r()*360).toFixed(1)+'" cy="'+(r()*120).toFixed(1)+'" r="'+(r()<.2?1.3:.7)+'" fill="#fff" opacity="'+(.3+r()*.5).toFixed(2)+'"/>';
  return '<svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'+
  '<linearGradient id="pk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22327E"/><stop offset=".34" stop-color="#4C5FB8"/><stop offset=".6" stop-color="#B48BC9"/><stop offset=".8" stop-color="#FFB089"/><stop offset="1" stop-color="#FFE2B4"/></linearGradient>'+
  '<radialGradient id="pk2"><stop offset="0" stop-color="#FFF8E0"/><stop offset=".25" stop-color="#FFE3A0" stop-opacity=".8"/><stop offset="1" stop-color="#FFB98A" stop-opacity="0"/></radialGradient>'+
  '<linearGradient id="pk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFD9C2"/></linearGradient></defs>'+
  '<rect width="360" height="440" fill="url(#pk1)"/>'+st+
  '<circle cx="180" cy="300" r="190" fill="url(#pk2)"/><circle cx="180" cy="300" r="34" fill="#FFF6DA"/>'+
  '<g opacity=".18" fill="#FFF3D0">'+[ -70,-45,-20,0,20,45,70].map(function(a){return '<path d="M180 300 L'+(180+Math.sin((a-4)*Math.PI/180)*520).toFixed(0)+' '+(300-Math.cos((a-4)*Math.PI/180)*520).toFixed(0)+' L'+(180+Math.sin((a+4)*Math.PI/180)*520).toFixed(0)+' '+(300-Math.cos((a+4)*Math.PI/180)*520).toFixed(0)+'Z"/>';}).join('')+'</g>'+
  spark(60,70,5)+spark(300,110,4)+spark(250,50,3)+spark(96,160,3,'#FFF3C8')+
  cloud(70,190,150,'rgba(214,220,255,.55)')+cloud(300,170,170,'rgba(214,220,255,.5)')+
  cloud(40,300,200,'rgba(255,226,214,.8)')+cloud(330,310,220,'rgba(255,226,214,.8)')+
  kid(146,322,2.2,{leg:14,bh:18,hr:12.5,girl:1,hair:'#5B3521',skin:'#E6B691',shirt:'#FF8A2B',dark:'#D9661A',wave:1})+
  kid(216,326,2.1,{leg:14,bh:18,hr:12.5,hair:'#2A1B14',skin:'#C08559',shirt:'#5B8DEF',dark:'#3F6CC8'})+
  '<g fill="url(#pk3)">'+cloud(50,440,260,'url(#pk3)')+cloud(310,446,280,'url(#pk3)')+cloud(180,468,380,'url(#pk3)')+'</g></svg>';
}
function adosPortal(){
  var r=seeded(7),st='';for(var i=0;i<60;i++){var x=r()*360,y=r()*260;st+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r()<.15?1.4:.7)+'" fill="#fff" opacity="'+(.4+r()*.6).toFixed(2)+'"/>';}
  return '<svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'+
  '<linearGradient id="pa1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061A"/><stop offset=".55" stop-color="#1B1748"/><stop offset="1" stop-color="#3B1F4A"/></linearGradient>'+
  '<radialGradient id="pa2"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset=".4" stop-color="#E58A4A" stop-opacity=".35"/><stop offset="1" stop-color="#E58A4A" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="pa3" cx=".3" cy=".3"><stop offset="0" stop-color="#7B5BD6" stop-opacity=".45"/><stop offset="1" stop-color="#7B5BD6" stop-opacity="0"/></radialGradient>'+
  '<linearGradient id="pa4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7AE"/><stop offset="1" stop-color="#FF9E4A"/></linearGradient></defs>'+
  '<rect width="360" height="440" fill="url(#pa1)"/><g transform="translate(0,-70)"><ellipse cx="90" cy="90" rx="200" ry="120" fill="url(#pa3)"/>'+st+
  '<path d="M40 60 L84 44 L120 70 L168 52" stroke="#C9C0FF" stroke-width=".8" fill="none" opacity=".45"/>'+
  '<path d="M0 270 L50 200 L90 236 L140 160 L190 226 L240 176 L300 238 L360 196 L360 440 L0 440Z" fill="#231C4E"/>'+
  '<circle cx="180" cy="224" r="120" fill="url(#pa2)"/>'+
  '<path d="M140 296 L140 224 Q140 178 180 178 Q220 178 220 224 L220 296Z" fill="#1A133A"/>'+
  '<path d="M152 296 L152 226 Q152 192 180 192 Q208 192 208 226 L208 296Z" fill="url(#pa4)" opacity=".92"/>'+
  '<path d="M134 296 L134 222 Q134 170 180 170 Q226 170 226 222 L226 296 L216 296 L216 224 Q216 182 180 182 Q144 182 144 224 L144 296Z" fill="#140F2E"/>'+
  '<path d="M0 320 L60 268 L110 300 L150 280 L180 296 L210 280 L260 304 L310 262 L360 300 L360 440 L0 440Z" fill="#120E2C"/>'+
  '<path d="M152 296 L208 296 L250 440 L110 440Z" fill="#FFD98A" opacity=".10"/>'+
  '<g transform="translate(180 352)"><circle cx="8" cy="-26" r="16" fill="#FFB860" opacity=".35"/><path d="M-6 0 L-4 -22 Q-4 -30 0 -32 Q4 -30 4 -22 L6 0Z" fill="#07061A"/><circle cy="-36" r="5" fill="#07061A"/><path d="M4 -24 L10 -18" stroke="#07061A" stroke-width="2.4"/><circle cx="10" cy="-17" r="2.6" fill="#FFE2A0"/></g>'+
  '<path d="M0 360 Q90 340 180 356 T360 350 L360 440 L0 440Z" fill="#0A0820"/>'+
  '<ellipse cx="180" cy="370" rx="220" ry="18" fill="#C9C0FF" opacity=".06"/></g><rect y="360" width="360" height="80" fill="#0A0820"/></svg>';
}
var pk=document.querySelector('.pt.kids .art'),pa=document.querySelector('.pt.ados .art');
if(pk)pk.innerHTML=kidsPortal();if(pa)pa.innerHTML=adosPortal();

/* ---------- Ados: noche épica ---------- */
var ados=document.getElementById('adosView');
(function(){
  var cv=document.getElementById('adosSky');if(!cv||!ados)return;
  var stars=[],embers=[],ridges=[],consts=[],px=0,py=0,tx=0,ty=0,txTop=0;
  var kick=ados.querySelector('.ados-kicker');
  function ridge(seed,base,amp,step){var r=seeded(seed),pts=[],y=base;for(var x=-40;x<=2400;x+=step){y=base+(r()-.5)*amp;pts.push([x,y+(r()<.25?-amp*.6*r():0)]);}return pts;}
  draw.resize=function(W,H){
    stars=[];var n=Math.round(W*H/1800);for(var i=0;i<n;i++)stars.push({x:Math.random(),y:Math.pow(Math.random(),1.3)*.7,r:rnd(.3,1.5),a:rnd(.3,1),f:rnd(.5,2.5),p:rnd(0,7)});
    embers=[];for(var j=0;j<Math.round(W/14);j++)embers.push({x:Math.random()*W,y:H*rnd(.4,1.1),r:rnd(.8,2.2),v:rnd(14,40),d:rnd(-8,8),p:rnd(0,7)});
    txTop=kick?kick.getBoundingClientRect().top-cv.getBoundingClientRect().top:H*.5;
    var u=Math.min(H/800,1.2);
    var ry=(Math.min(H*.47,(txTop>80?txTop:H*.5)-18))/H;
    ridges=[{p:ridge(11,0,90*u,70),y:ry+.02,c:'#211A4B',k:.25},{p:ridge(23,0,70*u,55),y:ry+.09,c:'#171238',k:.5},{p:ridge(37,0,50*u,40),y:ry+.2,c:'#0D0A26',k:.9}];
    var r=seeded(5);consts=[];for(var c=0;c<3;c++){var ox=r()*.8+.1,oy=r()*.28+.05,pts=[];for(var k=0;k<5;k++)pts.push([ox+(r()-.5)*.22,oy+(r()-.5)*.12]);consts.push(pts);}
  };
  function draw(c,W,H,t){
    tx+=(px-tx)*.05;ty+=(py-ty)*.05;
    var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#05061A');g.addColorStop(.45,'#14123A');g.addColorStop(.75,'#2A1B4A');g.addColorStop(1,'#07081A');c.fillStyle=g;c.fillRect(0,0,W,H);
    // nebulosas
    c.globalCompositeOperation='lighter';
    [[.22,.18,.55,'110,80,220',.22],[.8,.12,.45,'200,80,160',.14],[.6,.32,.5,'70,120,230',.12]].forEach(function(n,i){var x=(n[0]+Math.sin(t*.05+i)*.03)*W,y=n[1]*H,R=n[2]*Math.max(W,H*.7);var rg=c.createRadialGradient(x,y,0,x,y,R);rg.addColorStop(0,'rgba('+n[3]+','+n[4]+')');rg.addColorStop(1,'rgba('+n[3]+',0)');c.fillStyle=rg;c.fillRect(0,0,W,H);});
    c.globalCompositeOperation='source-over';
    for(var s=0;s<stars.length;s++){var p=stars[s],a=p.a*(.5+.5*Math.sin(t*p.f+p.p));c.fillStyle='rgba(240,236,255,'+a+')';c.beginPath();c.arc(p.x*W-tx*6,p.y*H-ty*4,p.r,0,7);c.fill();}
    // constelaciones
    c.strokeStyle='rgba(201,192,255,.22)';c.lineWidth=.8;
    consts.forEach(function(pts,i){var al=.5+.5*Math.sin(t*.5+i*2);c.globalAlpha=.4+.6*al;c.beginPath();pts.forEach(function(q,k){var x=q[0]*W-tx*6,y=q[1]*H-ty*4;k?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();pts.forEach(function(q){c.fillStyle='rgba(255,240,210,.9)';c.beginPath();c.arc(q[0]*W-tx*6,q[1]*H-ty*4,1.6,0,7);c.fill();});});
    c.globalAlpha=1;
    // estrella fugaz
    var sh=(t%9)/9;if(sh<.12){var k2=sh/.12,sx=W*(.15+.6*k2),sy=H*(.08+.12*k2);var lg=c.createLinearGradient(sx,sy,sx-90,sy-30);lg.addColorStop(0,'rgba(255,255,255,'+(1-k2)+')');lg.addColorStop(1,'rgba(255,255,255,0)');c.strokeStyle=lg;c.lineWidth=1.6;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx-90,sy-30);c.stroke();}
    // portal en el horizonte
    var ay=Math.min(H*.47,(txTop>80?txTop:H*.5)-18),ax=W/2-tx*14,aw=Math.max(40,Math.min(W*.2,120,(ay-70)/1.5)),ah=aw*1.5,pul=.8+.2*Math.sin(t*1.3);
    var halo=c.createRadialGradient(ax,ay-ah*.3,0,ax,ay-ah*.3,ah*2.4);halo.addColorStop(0,'rgba(255,200,120,'+(.55*pul)+')');halo.addColorStop(.3,'rgba(230,120,90,'+(.22*pul)+')');halo.addColorStop(1,'rgba(120,60,140,0)');c.fillStyle=halo;c.fillRect(0,0,W,H);
    c.save();c.globalCompositeOperation='lighter';c.translate(ax,ay-ah*.4);
    for(var b=0;b<9;b++){var an=-Math.PI/2+(b-4)*.16+Math.sin(t*.4+b)*.03;c.rotate(0);c.fillStyle='rgba(255,215,150,'+(.05*pul)+')';c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(an-.03)*H,Math.sin(an-.03)*H);c.lineTo(Math.cos(an+.03)*H,Math.sin(an+.03)*H);c.fill();}
    c.restore();
    // monte medio + arco
    drawRidge(c,W,H,ridges[0],tx,ty);
    c.save();c.translate(ax,ay);
    var ig=c.createLinearGradient(0,-ah,0,0);ig.addColorStop(0,'#FFF0C4');ig.addColorStop(1,'#FF9E4A');c.globalAlpha=.85+.15*pul;c.fillStyle=ig;c.beginPath();
    archPath(c,aw*.36,ah*.86);c.fill();c.globalAlpha=1;
    c.fillStyle='#120D2C';c.beginPath();archPath(c,aw*.5,ah);archPath(c,aw*.36,ah*.86,true);c.fill('evenodd');
    c.fillRect(-aw*.62,-ah*1.04,aw*1.24,ah*.06);
    c.restore();
    drawRidge(c,W,H,ridges[1],tx,ty);
    // caminante con lámpara
    var wx=W/2-tx*26+Math.sin(t*.2)*4,wy=ay-2;
    var lg2=c.createRadialGradient(wx+7,wy-22,0,wx+7,wy-22,40);lg2.addColorStop(0,'rgba(255,200,120,'+(.55+.15*Math.sin(t*6))+')');lg2.addColorStop(1,'rgba(255,200,120,0)');c.fillStyle=lg2;c.beginPath();c.arc(wx+7,wy-22,40,0,7);c.fill();
    c.fillStyle='#05041A';c.beginPath();c.moveTo(wx-6,wy);c.lineTo(wx-4,wy-24);c.quadraticCurveTo(wx,wy-32,wx+4,wy-24);c.lineTo(wx+6,wy);c.fill();c.beginPath();c.arc(wx,wy-35,5,0,7);c.fill();
    c.strokeStyle='#05041A';c.lineWidth=2.2;c.beginPath();c.moveTo(wx+3,wy-24);c.lineTo(wx+8,wy-18);c.stroke();
    c.fillStyle='#FFE6A8';c.beginPath();c.arc(wx+8,wy-16,2.4,0,7);c.fill();
    drawRidge(c,W,H,ridges[2],tx,ty);
    // niebla
    for(var f=0;f<4;f++){var fy=H*(.6+f*.09),fx=((t*(6+f*3)+f*300)%(W+600))-300;var fg=c.createRadialGradient(fx,fy,0,fx,fy,W*.5);fg.addColorStop(0,'rgba(170,150,230,.10)');fg.addColorStop(1,'rgba(170,150,230,0)');c.fillStyle=fg;c.fillRect(0,fy-W*.5,W,W);}
    // brasas
    c.globalCompositeOperation='lighter';
    for(var e=0;e<embers.length;e++){var q=embers[e];q.y-=q.v*.016;q.x+=Math.sin(t+q.p)*.3+q.d*.004;if(q.y<H*.2){q.y=H*rnd(.9,1.1);q.x=Math.random()*W;}
      var fl=.5+.5*Math.sin(t*5+q.p),gr=c.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r*4);gr.addColorStop(0,'rgba(255,170,80,'+(.85*fl)+')');gr.addColorStop(1,'rgba(255,120,60,0)');c.fillStyle=gr;c.beginPath();c.arc(q.x,q.y,q.r*4,0,7);c.fill();}
    c.globalCompositeOperation='source-over';
    var bg=c.createLinearGradient(0,H*.8,0,H);bg.addColorStop(0,'rgba(7,8,26,0)');bg.addColorStop(1,'#07081A');c.fillStyle=bg;c.fillRect(0,H*.8,W,H*.2);
  }
  function archPath(c,w,h,rev){c.moveTo(-w,0);c.lineTo(-w,-h+w);c.arc(0,-h+w,w,Math.PI,0);c.lineTo(w,0);c.closePath();}
  function drawRidge(c,W,H,r,tx,ty){var off=tx*30*r.k,y0=H*r.y-ty*8*r.k;c.fillStyle=r.c;c.beginPath();c.moveTo(-40,H);r.p.forEach(function(q){if(q[0]-off<W+80)c.lineTo(q[0]-off,y0+q[1]);});c.lineTo(W+80,H);c.closePath();c.fill();}
  stage(cv,ados,draw);
  addEventListener('pointermove',function(e){if(ados.hidden)return;px=(e.clientX/innerWidth-.5);py=(e.clientY/innerHeight-.5);},{passive:true});
  addEventListener('deviceorientation',function(e){if(ados.hidden||e.gamma==null)return;px=Math.max(-.5,Math.min(.5,e.gamma/60));py=Math.max(-.5,Math.min(.5,(e.beta-45)/80));},{passive:true});
})();

/* ---------- Ados: expediciones ---------- */
var SIG={
  jesus:'<circle cx="60" cy="60" r="44" fill="none" stroke="#FFD98A" stroke-width="1.5" opacity=".6"/><path d="M60 22 V98 M34 50 H86" stroke="#FFD98A" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="50" r="18" fill="#FFD98A" opacity=".15"/>',
  genesis:'<circle cx="60" cy="60" r="44" fill="none" stroke="#C9C0FF" stroke-width="1.5" opacity=".6"/><circle cx="60" cy="60" r="16" fill="none" stroke="#C9C0FF" stroke-width="3"/><path d="M60 20v14M60 86v14M20 60h14M86 60h14M32 32l10 10M78 78l10 10M88 32L78 42M42 78L32 88" stroke="#C9C0FF" stroke-width="3" stroke-linecap="round"/>',
  exodo:'<circle cx="60" cy="60" r="44" fill="none" stroke="#C9C0FF" stroke-width="1.5" opacity=".6"/><path d="M30 90 Q40 40 52 30 L52 90Z M90 90 Q80 40 68 30 L68 90Z" fill="none" stroke="#C9C0FF" stroke-width="3" stroke-linejoin="round"/><path d="M60 34 V92" stroke="#C9C0FF" stroke-width="2" stroke-dasharray="3 5"/>',
  david:'<circle cx="60" cy="60" r="44" fill="none" stroke="#C9C0FF" stroke-width="1.5" opacity=".6"/><path d="M34 82 L40 44 L52 60 L60 36 L68 60 L80 44 L86 82Z" fill="none" stroke="#C9C0FF" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="70" r="4" fill="#C9C0FF"/>',
  daniel:'<circle cx="60" cy="60" r="44" fill="none" stroke="#C9C0FF" stroke-width="1.5" opacity=".6"/><path d="M60 28 L68 50 L92 50 L72 64 L80 88 L60 74 L40 88 L48 64 L28 50 L52 50Z" fill="none" stroke="#C9C0FF" stroke-width="3" stroke-linejoin="round"/>',
  hechos:'<circle cx="60" cy="60" r="44" fill="none" stroke="#C9C0FF" stroke-width="1.5" opacity=".6"/><path d="M60 30 Q76 50 68 66 Q64 76 60 90 Q56 76 52 66 Q44 50 60 30Z" fill="none" stroke="#C9C0FF" stroke-width="3"/><path d="M60 58 Q66 66 60 80 Q54 66 60 58Z" fill="#C9C0FF" opacity=".5"/>',
  apoc:'<circle cx="60" cy="60" r="44" fill="none" stroke="#C9C0FF" stroke-width="1.5" opacity=".6"/><circle cx="60" cy="60" r="30" fill="none" stroke="#C9C0FF" stroke-width="2" stroke-dasharray="2 6"/><path d="M60 42 V78 M48 54 H72" stroke="#C9C0FF" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="6" fill="#C9C0FF"/>'
};
var EXP=[
  {k:'jesus',n:'I',t:'Tras Sus Pasos',s:'La vida de Jesús, de Belén a la tumba vacía.',on:1},
  {k:'hechos',n:'II',t:'Fuego',s:'Hechos: la iglesia que salió a la calle.'},
  {k:'apoc',n:'III',t:'Maranata',s:'¡Cristo viene! Apocalipsis contado para adolescentes.'},
  {k:'genesis',n:'IV',t:'El Origen',s:'Génesis: la luz, el jardín y la promesa.'},
  {k:'exodo',n:'V',t:'El Éxodo',s:'Un pueblo libre cruzando el mar.'},
  {k:'david',n:'VI',t:'El Rey Pastor',s:'David, de las ovejas al trono.'},
  {k:'daniel',n:'VII',t:'Fieles en Babilonia',s:'Daniel y sus amigos frente al imperio.'}
];
var box=document.getElementById('adosExp');
if(box){box.innerHTML=EXP.map(function(e){return '<article class="ex '+(e.on?'on':'off')+'"'+(e.on?' data-play="ados"':'')+'><svg class="sig" viewBox="0 0 120 120" aria-hidden="true">'+SIG[e.k]+'</svg><span class="n">Expedición '+e.n+'</span><b>'+e.t+'</b><span>'+e.s+'</span><span class="st">'+(e.on?'Abierta':'Sellada')+'</span></article>';}).join('');}
})();
