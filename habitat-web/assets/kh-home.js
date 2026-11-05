/* Lámpara Kids: cielo animado, mundos flotantes y arte de las puertas. */
(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== Cielo del hero ===== */
var cv=document.getElementById('heroSky');
if(cv){
  var ctx=cv.getContext('2d'),W=0,H=0,dpr=1,clouds=[],motes=[],stars=[],running=true,last=0,t=0,scrollY0=0;
  function rnd(a,b){return a+Math.random()*(b-a);}
  function size(){var r=cv.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);W=r.width||360;H=r.height||640;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  function seed(){
    clouds=[];motes=[];stars=[];
    var L=[{n:6,y:[.30,.52],w:[110,210],a:.32,s:5,p:.08},{n:6,y:[.56,.76],w:[190,330],a:.55,s:10,p:.18},{n:6,y:[.86,1.08],w:[300,480],a:.96,s:18,p:.32}];
    L.forEach(function(l,li){for(var i=0;i<l.n;i++)clouds.push({l:li,x:rnd(-.2,1.2),y:rnd(l.y[0],l.y[1]),w:rnd(l.w[0],l.w[1]),a:l.a,s:l.s,p:l.p});});
    for(var i=0;i<80;i++)motes.push({x:Math.random(),y:Math.random(),r:rnd(.8,2.6),v:rnd(.012,.04),ph:rnd(0,6.28)});
    for(var j=0;j<70;j++)stars.push({x:Math.random(),y:rnd(0,.42),r:rnd(.5,1.6),ph:rnd(0,6.28)});
  }
  function puff(x,y,w,a,warm){
    var g=ctx.createLinearGradient(0,y-w*.4,0,y+w*.25);
    g.addColorStop(0,'rgba(255,255,255,'+a+')');g.addColorStop(1,warm?'rgba(255,200,170,'+a*.9+')':'rgba(214,226,255,'+a*.9+')');
    ctx.fillStyle=g;ctx.beginPath();
    ctx.ellipse(x,y+w*.08,w*.5,w*.17,0,0,7);
    ctx.moveTo(x-w*.06,y);ctx.arc(x-w*.22,y,w*.2,0,7);
    ctx.moveTo(x+w*.33,y-w*.1);ctx.arc(x+w*.03,y-w*.1,w*.29,0,7);
    ctx.moveTo(x+w*.46,y);ctx.arc(x+w*.28,y+w*.01,w*.18,0,7);
    ctx.fill();
  }
  function draw(dt){
    t+=dt;
    var sy=window.scrollY||0;
    var g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#142058');g.addColorStop(.32,'#33479F');g.addColorStop(.58,'#9C83C6');g.addColorStop(.78,'#FFAE86');g.addColorStop(1,'#FFE4B3');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(var i=0;i<stars.length;i++){var s=stars[i];ctx.globalAlpha=(.35+.6*(.5+.5*Math.sin(t*1.6+s.ph)))*(1-s.y/.45);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W,s.y*H-sy*.05,s.r,0,7);ctx.fill();}
    ctx.globalAlpha=1;
    var cx=W/2,cy=H*.9-sy*.12;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*.03);
    for(var k=0;k<16;k++){ctx.rotate(Math.PI*2/16);var gr=ctx.createLinearGradient(0,0,0,-H*1.3);gr.addColorStop(0,'rgba(255,240,200,.16)');gr.addColorStop(1,'rgba(255,240,200,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-H*.11,-H*1.3);ctx.lineTo(H*.11,-H*1.3);ctx.lineTo(6,0);ctx.fill();}
    ctx.restore();
    var R=Math.max(W,H)*.75,gl=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    gl.addColorStop(0,'rgba(255,248,222,.95)');gl.addColorStop(.12,'rgba(255,226,160,.7)');gl.addColorStop(.4,'rgba(255,190,140,.22)');gl.addColorStop(1,'rgba(255,190,140,0)');
    ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#FFF8E4';ctx.beginPath();ctx.arc(cx,cy,Math.min(W,H)*.075*(1+.03*Math.sin(t*2)),0,7);ctx.fill();
    for(var l=0;l<3;l++){
      for(var c=0;c<clouds.length;c++){var o=clouds[c];if(o.l!==l)continue;
        o.x+=o.s*dt/W*(l===1?-1:1);if(o.x>1.35)o.x=-.35;if(o.x<-.35)o.x=1.35;
        puff(o.x*W,o.y*H-sy*o.p,o.w*(W<600?.8:1),o.a,l>0);}
    }
    for(var m=0;m<motes.length;m++){var p=motes[m];p.y-=p.v*dt;if(p.y<-.05){p.y=1.05;p.x=Math.random();}
      var px=p.x*W+Math.sin(t+p.ph)*12,py=p.y*H;var a=.5+.5*Math.sin(t*3+p.ph);
      var gg=ctx.createRadialGradient(px,py,0,px,py,p.r*5);gg.addColorStop(0,'rgba(255,226,140,'+(.9*a)+')');gg.addColorStop(1,'rgba(255,226,140,0)');
      ctx.fillStyle=gg;ctx.beginPath();ctx.arc(px,py,p.r*5,0,7);ctx.fill();}
  }
  function frame(now){
    if(!running){last=0;return;}
    var dt=last?Math.min(.05,(now-last)/1000):.016;last=now;
    ctx.setTransform(dpr,0,0,dpr,0,0);draw(dt);
    requestAnimationFrame(frame);
  }
  size();seed();ctx.setTransform(dpr,0,0,dpr,0,0);draw(0);
  window.addEventListener('resize',function(){size();ctx.setTransform(dpr,0,0,dpr,0,0);draw(0);});
  if('ResizeObserver' in window)new ResizeObserver(function(){var r=cv.getBoundingClientRect();if(!r.width||!r.height)return;if(Math.abs(r.width-W)<1&&Math.abs(r.height-H)<1)return;size();ctx.setTransform(dpr,0,0,dpr,0,0);draw(0);}).observe(cv);
  if(!reduce){
    var vis=true,home=document.getElementById('homeView');
    var check=function(){var on=vis&&!document.hidden&&home&&!home.hidden;if(on&&!running){running=true;requestAnimationFrame(frame);}if(!on)running=false;};
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;check();}).observe(cv);
    document.addEventListener('visibilitychange',check);
    if(home)new MutationObserver(check).observe(home,{attributes:true,attributeFilter:['hidden']});
    requestAnimationFrame(frame);
    cv.parentElement.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();for(var i=0;i<2;i++)motes.push({x:(e.clientX-r.left)/W+rnd(-.01,.01),y:(e.clientY-r.top)/H,r:rnd(1,2.4),v:rnd(.04,.09),ph:rnd(0,6)});if(motes.length>160)motes.splice(80,motes.length-160);});
  }else running=false;
}


/* ===== Personajes de las puertas ===== */
function kid(x,y,s,o){
  var leg=o.leg,bh=o.bh,hr=o.hr,top=-(leg+bh),hy=top-hr+2.5;
  return '<g transform="translate('+x+','+y+') scale('+s+')"><ellipse rx="15" ry="3.8" fill="#22407F" opacity=".18"/>'+
  '<rect x="-7" y="'+(-leg)+'" width="5.6" height="'+leg+'" rx="2.8" fill="#34426E"/><rect x="1.4" y="'+(-leg)+'" width="5.6" height="'+leg+'" rx="2.8" fill="#34426E"/>'+
  (o.girl?'<path d="M'+(-hr-2)+' '+(hy-2)+' Q'+(-hr-4)+' '+(hy+hr+10)+' '+(-hr+1)+' '+(hy+hr+12)+' L'+(hr-1)+' '+(hy+hr+12)+' Q'+(hr+4)+' '+(hy+hr+10)+' '+(hr+2)+' '+(hy-2)+'Z" fill="'+o.hair+'"/>':'')+
  '<rect x="-15.5" y="'+(top+3)+'" width="5.2" height="'+(bh-6)+'" rx="2.6" fill="'+o.dark+'" transform="rotate('+(o.wave?150:0)+' -12.9 '+(top+4)+')"/><rect x="10.3" y="'+(top+3)+'" width="5.2" height="'+(bh-6)+'" rx="2.6" fill="'+o.dark+'"/>'+
  '<rect x="-11" y="'+top+'" width="22" height="'+(bh+3)+'" rx="9" fill="'+o.shirt+'"/>'+
  '<circle cy="'+hy+'" r="'+hr+'" fill="'+o.skin+'"/>'+
  (o.girl?'<path d="M'+(-hr-1)+' '+(hy+2)+' Q'+(-hr-1)+' '+(hy-hr-4)+' 0 '+(hy-hr-1.5)+' Q'+(hr+1)+' '+(hy-hr-4)+' '+(hr+1)+' '+(hy+2)+' Q'+(hr-2)+' '+(hy-5)+' 3 '+(hy-6.5)+' Q-4 '+(hy-5)+' '+(-hr-1)+' '+(hy+2)+'Z" fill="'+o.hair+'"/><circle cx="'+(hr-1.5)+'" cy="'+(hy-6.5)+'" r="2.6" fill="#FFCF5C"/>'
   :'<path d="M'+(-hr-.6)+' '+(hy+.5)+' Q'+(-hr-1.5)+' '+(hy-hr-5)+' 1 '+(hy-hr-2.5)+' Q'+(hr+2)+' '+(hy-hr-4)+' '+(hr+.6)+' '+(hy+.5)+' L'+(hr-1.2)+' '+(hy-3.5)+' Q3 '+(hy-9)+' '+(-hr+1.4)+' '+(hy-3.8)+'Z" fill="'+o.hair+'"/>')+
  '<ellipse cx="-4" cy="'+(hy+1.6)+'" rx="1.6" ry="2" fill="#1A2B57"/><ellipse cx="4" cy="'+(hy+1.6)+'" rx="1.6" ry="2" fill="#1A2B57"/>'+
  '<circle cx="-6.8" cy="'+(hy+5.2)+'" r="2" fill="#EF6F61" opacity=".3"/><circle cx="6.8" cy="'+(hy+5.2)+'" r="2" fill="#EF6F61" opacity=".3"/>'+
  '<path d="M-2.8 '+(hy+5.4)+' Q0 '+(hy+7.8)+' 2.8 '+(hy+5.4)+'" stroke="#1A2B57" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>';
}
function cloud(x,y,w,f){var r=w/4;return '<g fill="'+(f||'#fff')+'"><ellipse cx="'+x+'" cy="'+(y+r*.4)+'" rx="'+(w*.5)+'" ry="'+(r*.72)+'"/><circle cx="'+(x-w*.22)+'" cy="'+(y+r*.1)+'" r="'+(r*.92)+'"/><circle cx="'+(x+w*.04)+'" cy="'+(y-r*.4)+'" r="'+(r*1.22)+'"/><circle cx="'+(x+w*.28)+'" cy="'+(y+r*.12)+'" r="'+(r*.84)+'"/></g>';}
function spark(x,y,s,c){return '<path transform="translate('+x+','+y+')" d="M0 '+(-s*2)+' Q'+(s*.25)+' '+(-s*.25)+' '+(s*2)+' 0 Q'+(s*.25)+' '+(s*.25)+' 0 '+(s*2)+' Q'+(-s*.25)+' '+(s*.25)+' '+(-s*2)+' 0 Q'+(-s*.25)+' '+(-s*.25)+' 0 '+(-s*2)+'Z" fill="'+(c||'#fff')+'"/>';}
window.LAMP={kid:kid,cloud:cloud,spark:spark};

/* ===== Mundos flotantes ===== */
var W_=[
 {k:'jesus',t:'La vida de Jesús',s:'Del pesebre al Jordán',on:1},
 {k:'genesis',t:'Génesis',s:'El principio de todo'},
 {k:'exodo',t:'Éxodo',s:'El mar se abre'},
 {k:'david',t:'David',s:'Del campo al trono'},
 {k:'daniel',t:'Daniel',s:'Fe en Babilonia'},
 {k:'hechos',t:'Hechos',s:'El fuego de Pentecostés'},
 {k:'apoc',t:'Apocalipsis',s:'El Rey que vuelve'}
];
function land(k){
  if(k==='jesus')return '<path d="M70 64 Q110 40 150 64Z" fill="#A27447"/><rect x="76" y="64" width="68" height="34" fill="#4A3A66"/><rect x="74" y="64" width="5" height="34" fill="#7E5634"/><rect x="141" y="64" width="5" height="34" fill="#7E5634"/><circle cx="110" cy="86" r="16" fill="#FFE9A8" opacity=".7"/><path d="M98 90 h24 l-4 8 h-16z" fill="#C38E58"/>'+spark(110,26,6,'#FFE39A')+'<path d="M110 30 L92 64 L128 64Z" fill="#FFF3C4" opacity=".25"/>';
  if(k==='genesis')return '<rect x="105" y="54" width="9" height="44" rx="4" fill="#8B5B32"/><circle cx="110" cy="44" r="28" fill="#4E9A52"/><circle cx="90" cy="56" r="16" fill="#6FB062"/><circle cx="130" cy="56" r="16" fill="#6FB062"/><circle cx="98" cy="40" r="4.5" fill="#EF4F4F"/><circle cx="122" cy="48" r="4.5" fill="#EF4F4F"/><circle cx="112" cy="30" r="4.5" fill="#EF4F4F"/><path d="M60 98 Q90 90 110 98 T160 96" stroke="#7FC4F0" stroke-width="5" fill="none"/>';
  if(k==='exodo')return '<path d="M62 98 Q66 40 92 30 L96 98Z" fill="#5FA8E6"/><path d="M158 98 Q154 40 128 30 L124 98Z" fill="#5FA8E6"/><path d="M70 92 Q78 52 92 40" stroke="#CDEBFF" stroke-width="3" fill="none"/><path d="M150 92 Q142 52 128 40" stroke="#CDEBFF" stroke-width="3" fill="none"/><path d="M96 98 L124 98 L118 60 L102 60Z" fill="#E9CF9C"/><circle cx="110" cy="70" r="5" fill="#9B7650"/><rect x="107" y="74" width="6" height="12" rx="3" fill="#9B7650"/>';
  if(k==='david')return '<path d="M86 60 l8 -18 l9 12 l7 -16 l7 16 l9 -12 l8 18Z" fill="#F2B33D" stroke="#C47F14" stroke-width="2"/><rect x="86" y="60" width="48" height="10" rx="3" fill="#F2B33D"/><circle cx="110" cy="65" r="3.5" fill="#EF4F4F"/><g transform="translate(78 82)"><ellipse cx="0" cy="0" rx="12" ry="7" fill="#FBF8F2"/><ellipse cx="11" cy="-3" rx="4.5" ry="4" fill="#4B4440"/></g><g transform="translate(140 86)"><ellipse cx="0" cy="0" rx="11" ry="6.5" fill="#FBF8F2"/><ellipse cx="-10" cy="-3" rx="4.5" ry="4" fill="#4B4440"/></g>';
  if(k==='daniel')return '<g transform="translate(110 76)"><circle r="24" fill="#D9862E"/><circle r="16" fill="#F2B866"/><circle cx="-6" cy="-3" r="2.4" fill="#3A2A1A"/><circle cx="6" cy="-3" r="2.4" fill="#3A2A1A"/><path d="M-4 6 Q0 10 4 6" stroke="#3A2A1A" stroke-width="2" fill="none"/><ellipse cx="0" cy="3" rx="4" ry="3" fill="#8B5B32"/></g><path d="M70 98 L70 54 L80 54 L80 98Z M140 98 L140 54 L150 54 L150 98Z" fill="#E7D7B3"/>';
  if(k==='hechos')return '<g transform="translate(110 70)"><path d="M0 -40 Q18 -14 10 4 Q20 -4 18 -18 Q30 6 14 22 L-14 22 Q-30 6 -18 -18 Q-20 -4 -10 4 Q-18 -14 0 -40Z" fill="#FF8A3D"/><path d="M0 -20 Q10 -2 5 10 Q9 4 9 -4 Q16 10 7 22 L-7 22 Q-16 10 -9 -4 Q-9 4 -5 10 Q-10 -2 0 -20Z" fill="#FFD25E"/></g>'+spark(76,40,3,'#FFE39A')+spark(146,34,3,'#FFE39A');
  return '<circle cx="110" cy="62" r="34" fill="none" stroke="#7FD3A6" stroke-width="5" opacity=".9"/><circle cx="110" cy="62" r="40" fill="none" stroke="#9FCBF2" stroke-width="3" opacity=".7"/><rect x="92" y="54" width="36" height="44" rx="18" fill="#FFF6D8"/><path d="M98 98 V70 a12 12 0 0 1 24 0 V98Z" fill="#FFD25E"/>'+spark(110,20,5,'#FFE39A');
}
function island(w,i){
  var id='is'+i;
  return '<svg viewBox="0 0 220 190" role="img" aria-label="'+w.t+'"><defs><linearGradient id="'+id+'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9935C"/><stop offset="1" stop-color="#7A5534"/></linearGradient><radialGradient id="'+id+'g"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".9"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient></defs>'+
  (w.on?'<circle cx="110" cy="80" r="90" fill="url(#'+id+'g)"/>':'')+
  cloud(110,150,190,'rgba(255,255,255,.9)')+
  '<path d="M40 100 Q110 92 180 100 Q170 128 140 146 Q118 176 108 170 Q92 150 74 140 Q50 124 40 100Z" fill="url(#'+id+'r)"/>'+
  '<path d="M60 112 Q90 124 120 118" stroke="#6B4A2C" stroke-width="2" fill="none" opacity=".5"/>'+
  '<ellipse cx="110" cy="100" rx="72" ry="12" fill="#7DBE6A"/><ellipse cx="110" cy="97" rx="66" ry="8" fill="#9AD27E"/>'+
  land(w.k)+'</svg>';
}
var box=document.getElementById('worlds');
if(box){
  box.innerHTML=W_.map(function(w,i){return '<article class="world '+(w.on?'on':'off')+'">'+island(w,i)+'<h3>'+w.t+'</h3><p>'+w.s+'</p><span class="st">'+(w.on?'Disponible':'Próximamente')+'</span></article>';}).join('');
  var first=box.querySelector('.world.on');
  if(first){first.setAttribute('data-play','kids');first.style.cursor='pointer';}
}
})();
