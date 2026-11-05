(function(){
  var top=document.querySelector('.top'),nav=document.querySelector('.nav'),bg=document.querySelector('.burger');
  function onS(){if(top)top.classList.toggle('solid',window.scrollY>40||document.body.classList.contains('menu')||document.body.dataset.solid==='1');}
  window.addEventListener('scroll',onS,{passive:true});onS();
  if(bg)bg.addEventListener('click',function(){var o=nav.classList.toggle('open');document.body.classList.toggle('menu',o);bg.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':'';onS();});
  if(nav)nav.addEventListener('click',function(e){if(e.target.closest('a')&&nav.classList.contains('open')){nav.classList.remove('open');document.body.classList.remove('menu');document.body.style.overflow='';onS();}});
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});els.forEach(function(el){io.observe(el);});}
  else els.forEach(function(el){el.classList.add('in');});
  if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))document.querySelectorAll('.bgv').forEach(function(v){v.src=window.innerWidth>900?v.dataset.hd:v.dataset.sd;v.addEventListener('playing',function(){v.classList.add('on');});var p=v.play();if(p&&p.catch)p.catch(function(){});});
  var car=document.querySelector('[data-car]');if(car){var sl=car.querySelectorAll('.tslide'),nv=document.querySelector('[data-nav]'),ix=0,tmr;
    function go(n){ix=(n+sl.length)%sl.length;sl.forEach(function(e,i){e.classList.toggle('on',i===ix);});if(nv)nv.querySelectorAll('button').forEach(function(b,i){b.classList.toggle('on',i===ix);});}
    if(sl.length>1&&nv){sl.forEach(function(_,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Testimonio '+(i+1));b.addEventListener('click',function(){go(i);clearInterval(tmr);tmr=setInterval(function(){go(ix+1)},7000);});nv.appendChild(b);});tmr=setInterval(function(){go(ix+1)},7000);}
    go(0);}
  var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
/* Con sesión iniciada, el botón "Ingresar" pasa a "Mi cuenta" y lleva al Campus. */
(function(){
  var on=false;try{var t=JSON.parse(localStorage.getItem('habitat:mtok')||'null');on=!!(t&&t.r);}catch(e){}
  if(!on)return;
  document.querySelectorAll('a[href="/ingresar.html"]').forEach(function(a){
    a.setAttribute('href','/campus.html');
    if(a.classList.contains('in'))a.textContent='Mi cuenta';
    else if(/ingres|campus de alumnos/i.test(a.textContent))a.textContent='Mi campus';
  });
})();
