(function(){
  var top=document.querySelector('.top'),nav=document.querySelector('.nav'),bg=document.querySelector('.burger');
  function onS(){if(top)top.classList.toggle('solid',window.scrollY>40||document.body.classList.contains('menu')||document.body.dataset.solid==='1');}
  window.addEventListener('scroll',onS,{passive:true});onS();
  if(bg)bg.addEventListener('click',function(){var o=nav.classList.toggle('open');document.body.classList.toggle('menu',o);bg.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':'';onS();});
  if(nav)nav.addEventListener('click',function(e){if(e.target.closest('a')&&nav.classList.contains('open')){nav.classList.remove('open');document.body.classList.remove('menu');document.body.style.overflow='';onS();}});
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});els.forEach(function(el){io.observe(el);});}
  else els.forEach(function(el){el.classList.add('in');});
  var v=document.querySelector('.bgv');if(v&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){v.src=window.innerWidth>900?v.dataset.hd:v.dataset.sd;v.addEventListener('playing',function(){v.classList.add('on');});var p=v.play();if(p&&p.catch)p.catch(function(){});}
  var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
