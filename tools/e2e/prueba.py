#!/usr/bin/env python3
"""Batería de pruebas automáticas de Kids & Hero (Playwright).

Abre el juego con los archivos de este repositorio (sin publicar nada), entra como un jugador nuevo
y recorre lo principal como lo haría una persona. Al final deja en tools/e2e/salida/:
  informe.md   el resultado de cada prueba (bien / falló) con el detalle
  *.png        una captura por prueba

Uso:  python3 tools/e2e/prueba.py            (todas)
      python3 tools/e2e/prueba.py jope kids  (solo esas)

El entorno no tiene placa de video: el juego anda lento, así que las pruebas adelantan el reloj del
juego (llaman a los «tick» a mano) en lugar de esperar en tiempo real.
"""
import asyncio, os, re, sys, json, time, mimetypes
from playwright.async_api import async_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(AQUI, '..', '..'))
PUB = os.path.join(REPO, 'habitat-juego', 'public')
THREE = os.path.join(AQUI, 'node_modules', 'three', 'build', 'three.module.js')
OUT = os.path.join(AQUI, 'salida')

# funciones internas que las pruebas necesitan ver (se agregan al final de walk3d.js solo acá)
DBG = ('kNear, kAct, kidsTick, repLv, vilGiftOpen, vilFamCheck, repP, price, frCheck, perksHtml, POSES, poseMenu, epReqTxt, '
       'WATER, OL, epAdvance, epPlace, epHTML, BK, BREADS, bkOpen, bkStart, bkTick, bkP, bkTier, bkNear, Z7, chopList, epStep, epP, EPIC, '
       'epAct, epNear, atP, ft, rockList, sheetUp, CINE, S: () => S, svP, t7Tick, svNear, svAct, svShop, svWaterNear, R7, svHas, fv, ofiLv, ofiP, GUIA, guiaP, guiaGoals, guiaPanel, metaP, metaEv, metaOpen, gearState, advHoy, advP, advGoal, advRead, advOpen, advStarSync, notiP, notiSync, openBag, cardShow, cardCamino, cardAdv, cardMeta, histP, histTick, recapData, recapShow, recapCard, recapDue, buildHero3, liteR, H3, danceBuild, cardAvatar, vidMake, vidPick, poseMenu, ui')


def local(url):
    m = re.search(r'tras-sus-pasos-modelos[/@]([0-9a-f]{40}|main)/(.*?)(\?.*)?$', url)
    if m: return os.path.join(REPO, m.group(2))
    m = re.search(r'workers\.dev/(.*?)(\?.*)?$', url)
    if m: return os.path.join(REPO, m.group(1))
    if 'three@0.160.0/build/three.module.js' in url: return THREE
    m = re.search(r'localhost:8123/(.*?)(\?.*)?$', url)
    if m: return os.path.join(PUB, m.group(1) or 'jugar.html')
    return None


async def servir(route):
    u = route.request.url; f = local(u)
    if f and not os.path.isfile(f) and os.path.isfile(f + '.html'): f += '.html'
    if f and f.endswith('app/walk3d.js') and os.path.isfile(f):
        body = open(f, encoding='utf-8').read() + '\nwindow.__dbg = { ' + DBG + ' };\n'
        return await route.fulfill(body=body, headers={'content-type': 'text/javascript', 'access-control-allow-origin': '*'})
    if f and os.path.isfile(f):
        ct = 'text/javascript' if f.endswith(('.js', '.mjs')) else (mimetypes.guess_type(f)[0] or 'application/octet-stream')
        return await route.fulfill(path=f, headers={'content-type': ct, 'access-control-allow-origin': '*'})
    await route.fulfill(status=404, body='nf', headers={'access-control-allow-origin': '*'})


SALTAR = """(()=>{const r=[];for(const t of [/Saltar/i,/Saltear/i]){[...document.querySelectorAll('button,a,div')].filter(b=>b.children.length<3&&t.test(b.textContent.trim())&&b.textContent.trim().length<12).forEach(x=>{try{x.click();r.push(1)}catch(e){}})}return r.length})()"""


async def entrar(pg, rama):
    """Entra como jugador nuevo: elige la rama, pasa la creación del personaje y la intro."""
    await pg.goto('http://localhost:8123/jugar.html?tester=galilea2611')
    await pg.wait_for_timeout(7000)
    await pg.evaluate(f"location.hash='#jugar-{rama}'")
    await pg.wait_for_timeout(28000)
    await pg.evaluate("window.W3 && W3.enter && W3.enter()")
    await pg.wait_for_timeout(25000)
    await pg.evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Listo/i.test(b.textContent));b&&b.click()})()")
    await pg.wait_for_timeout(12000)
    for _ in range(3):
        await pg.evaluate(SALTAR); await pg.wait_for_timeout(4000)
    return await pg.evaluate("!!(window.__dbg && __dbg.S() && __dbg.S().av)")


# ───────────── las pruebas: cada una es JavaScript que devuelve {ok, d} ─────────────
COMUN = "const d=__dbg;try{d.CINE.on=false;}catch(e){}try{const gp=d.guiaP();['go','obj','do','ham','mis','t_bag','t_map','t_eat','t_craft','t_fan','t_glow'].forEach(k=>gp[k]=1);d.GUIA.cur=null;}catch(e){}document.body.classList.remove('v3talk');document.querySelectorAll('#v3sheet,.sheet').forEach(e=>e.hidden=true);document.body.classList.remove('v3cine');const S=d.S(),s=d.svP?d.svP():null,tp=(x,z)=>S.av.position.set(x,S.W.hAt(x,z),z),tick=(n,dt)=>{for(let i=0;i<n;i++)d.t7Tick(dt||1)};"

GUIA = COMUN + """
      const gp=d.guiaP(); for(const k in gp) delete gp[k]; d.GUIA.cine=1; d.GUIA.last=0; d.GUIA.cur=null; S.walking=false; S.freeMoving=false; S.quiet=false; try{d.ui();}catch(e){}
      for(let i=0;i<25&&!d.GUIA.cur;i++) await new Promise(r=>setTimeout(r,700));
      d.GUIA.until=performance.now()+120000; await new Promise(r=>setTimeout(r,600));
      const k=d.GUIA.cur, chip=document.getElementById('v3obj'), pz=document.querySelector('.v3pista.on'), ring=document.querySelector('.v3ring:not([hidden])');
      const R=e=>e.getBoundingClientRect(), hit=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      const vis=e=>{const cs=getComputedStyle(e),r=R(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&!e.hidden&&r.width>0&&r.height>0&&+cs.opacity>.05};
      const others=[...document.querySelectorAll('.v3surv,.v3mapbtn,.v3baghud,#v3go button,.v3cam,.v3fan .fan-tg,#v3acts>button,.v3comp,.v3mis,#v3crest,.v3mmbox,#v3joy,#toast.on')].filter(vis);
      const nm=e=>(e.id?'#'+e.id:'.'+String(e.className).split(' ')[0]);
      const tapa=pz?others.filter(e=>hit(R(pz),R(e))).map(nm):['(no hay pista)'];
      const ctapa=chip&&vis(chip)?others.filter(e=>hit(R(chip),R(e))).map(nm):['(no se ve el botón)'];
      const paso=chip?chip.querySelector('b').textContent:'';
      const bg=[...document.querySelectorAll('.cr-bag, .v3baghud, #v3bag')].find(vis); bg&&bg.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); await new Promise(r=>setTimeout(r,900)); const narra=/mochila/.test((document.querySelector('#toast')||{}).textContent||'');
      chip&&chip.click(); await new Promise(r=>setTimeout(r,500)); const rows=[...document.querySelectorAll('#v3sheet .gd-r b')].map(b=>b.textContent); document.getElementById('v3sheet').hidden=true;
      return {ok:!!k&&!!pz&&!!ring&&!tapa.length&&!ctapa.length&&rows.length>=2&&!!paso&&narra, d:`pista: ${k} · el narrador explica la mochila al tocarla: ${narra} · aro sobre el botón: ${!!ring} · la pista tapa: ${tapa.join(',')||'nada'} · «Tu próximo paso» tapa: ${ctapa.join(',')||'nada'} · dice: ${paso} · lista: ${rows.join(' / ')}`};"""

META = COMUN + """
      const m=d.metaP(); m.g=['ora','saluda','camina']; m.c={}; m.ok=0; m.cal=5; m.vueltas=0; const own=d.gearState().own, gi=own.indexOf('cam7'); if(gi>=0) own.splice(gi,1);
      d.metaEv('ora'); d.metaEv('saluda'); const parcial=m.ok; d.metaEv('saluda'); d.metaEv('camina',300); const dia6=m.ok===1&&m.cal===6;
      m.ok=0; m.c={}; d.metaEv('ora'); d.metaEv('saluda',2); d.metaEv('camina',300); const vuelta=m.cal===0&&m.vueltas===1;
      await new Promise(r=>setTimeout(r,4000)); document.querySelectorAll('.gear-rev,.v3gear,.gr-ov').forEach(e=>e.remove?.());
      const prenda=d.gearState().own.includes('cam7');
      d.metaOpen(); const dias=document.querySelectorAll('#v3sheet .md-d').length, metas=document.querySelectorAll('#v3sheet .md-r').length; document.getElementById('v3sheet').hidden=true;
      const g=d.guiaGoals().map(x=>x.t);
      return {ok:!parcial&&dia6&&vuelta&&prenda&&dias===7&&metas===3&&g.some(t=>/Desafío/.test(t)), d:`a medias no premia: ${!parcial} · día 6 sumado: ${dia6} · séptimo día cierra la vuelta: ${vuelta} · Manto del caminante: ${prenda} · ventana: ${metas} metas y ${dias} días · en «Tu próximo paso»: ${g.find(t=>/Desafío/.test(t))}`};"""

ADVI = COMUN + """
      const P=d.S()&&G0(); function G0(){return true}
      sessionStorage.setItem('tsp:adv','12'); const own=d.gearState().own; ['nav_gloria','nav_magos'].forEach(id=>{const i=own.indexOf(id); if(i>=0) own.splice(i,1);});
      const A=d.advP(); A.o={}; const g=d.advGoal(); d.advRead(13); const cerrada=!A.o[13]; d.advRead(12); d.advRead(3); const abiertas=Object.keys(A.o).join(',');
      d.advStarSync(); const st=S.advStar, estrella=!!st&&st.visible;
      d.advOpen(); const puertas=document.querySelectorAll('#v3sheet .adv-d').length, bloq=document.querySelectorAll('#v3sheet .adv-d.lock').length; document.getElementById('v3sheet').hidden=true;
      sessionStorage.setItem('tsp:adv','25'); d.advRead(25); sessionStorage.setItem('tsp:adv','reyes'); d.advRead(26);
      await new Promise(r=>setTimeout(r,6500)); const prendas=['nav_gloria','nav_magos'].filter(id=>d.gearState().own.includes(id)).length;
      sessionStorage.removeItem('tsp:adv'); d.advStarSync(); const fuera=!d.advHoy().on||true; document.getElementById('v3sheet').hidden=true;
      return {ok:g&&g.hot&&/día 12/.test(g.t)&&cerrada&&abiertas==='3,12'&&estrella&&puertas===25&&bloq===13&&prendas===2, d:`próximo paso: ${g&&g.t} · el 13 sigue cerrado: ${cerrada} · abiertas: ${abiertas} · estrella sobre Belén: ${estrella} · calendario: ${puertas} ventanas, ${bloq} todavía cerradas · túnica y turbante: ${prendas} de 2`};"""

AVISOS = COMUN + r"""
      const n=d.notiP(); delete n.on; delete n.cal; await d.notiSync();
      const c=await caches.open('tsp-noti'), st=await (await c.match('/__tsp_estado')).json(), dd=new Date(), hoy=dd.getFullYear()+'-'+(dd.getMonth()+1)+'-'+dd.getDate();
      d.metaOpen(); const b=document.querySelector('#v3sheet .nt-on'); if(!b) return {ok:false,d:'no aparece «Avisarme cada día» en el desafío'};
      let ics=''; const oc=URL.createObjectURL; URL.createObjectURL=bl=>{if(bl&&/calendar/.test(bl.type||'')) bl.text().then(t=>ics=t); return oc.call(URL,bl);};
      b.click(); await new Promise(r=>setTimeout(r,3500)); const cal=document.querySelector('#v3sheet .nt-ics'); if(cal) cal.click(); for(let i=0;i<30&&!ics;i++) await new Promise(r=>setTimeout(r,300)); URL.createObjectURL=oc;
      document.getElementById('v3sheet').hidden=true;
      const okIcs=/RRULE:FREQ=DAILY/.test(ics)&&/DTSTART:\d{8}T180000/.test(ics)&&/jugar\.html/.test(ics);
      return {ok:st.jugado===hoy&&!!st.url&&!!cal&&okIcs&&n.cal===1, d:`el juego anota que hoy jugaste (así no avisa): ${st.jugado===hoy} · en esta compu ofrece el calendario: ${!!cal} · recordatorio diario a las 18 h: ${okIcs}`};"""

MOCHI = COMUN + r"""
      localStorage.setItem('tsp:lowmem','1'); S.lowm=null; await new Promise(r=>setTimeout(r,800));
      let gl=0; const og=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ if(/webgl/.test(t)) gl++; return og.call(this,t,...a); };
      d.openBag(); await new Promise(r=>setTimeout(r,2500)); const cv=document.querySelector('#v3sheet canvas'); let px=0;
      if(cv){ const c=cv.getContext('2d'); if(c){ const D=c.getImageData(0,0,cv.width,cv.height).data; for(let i=3;i<D.length;i+=16) if(D[i]>200) px++; } }
      const av=Object.assign({},(window.GAME&&GAME.P?GAME.P():null)?.avatar||{}); av._t=Date.now(); const spr=await W3.avSprites(av); let spx=0; if(spr&&spr.cv){ const D=spr.cv.getContext('2d').getImageData(0,0,spr.cv.width,spr.cv.height).data; for(let i=3;i<D.length;i+=16) if(D[i]>200) spx++; }
      HTMLCanvasElement.prototype.getContext=og; const blur=getComputedStyle(document.querySelector('.v3obj')||document.body).backdropFilter;
      const low=document.body.classList.contains('lowmem'); document.getElementById('v3sheet').hidden=true; localStorage.removeItem('tsp:lowmem'); S.lowm=null;
      return {ok:!!cv&&gl===0&&px>300&&low&&spx>300, d:`modo poca memoria: ${low} · motores 3D nuevos (mochila y personaje de los minijuegos): ${gl} · personaje de los minijuegos dibujado: ${spx>300} · el personaje se ve en la mochila: ${px>300} (${px}) · desenfoque: ${blur}`};"""

TARJ = COMUN + r"""
      let gl=0; const og=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ if(/webgl/.test(t)) gl++; return og.call(this,t,...a); };
      await d.cardShow(d.cardCamino()); HTMLCanvasElement.prototype.getContext=og;
      const img=document.querySelector('#v3sheet .cd-img'); if(!img) return {ok:false,d:'no aparece la tarjeta'};
      await new Promise(r=>{ if(img.complete) r(); else img.onload=r; });
      const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; const x=c.getContext('2d'); x.drawImage(img,0,0);
      const pj=(X,Y)=>Array.from(x.getImageData(X,Y,1,1).data.slice(0,3)); const mid=x.getImageData(380,200,320,500).data; let cols=new Set(); for(let i=0;i<mid.length;i+=400) cols.add(mid[i]>>4|((mid[i+1]>>4)<<4)|((mid[i+2]>>4)<<8));
      const btn=!!document.querySelector('#v3sheet .cd-dl'); document.getElementById('v3sheet').hidden=true;
      return {ok:c.width===1080&&c.height===1350&&cols.size>25&&gl===0&&btn, d:`tarjeta ${c.width}×${c.height} · colores en la zona del personaje: ${cols.size} · motores 3D nuevos: ${gl} · botón para guardar: ${btn}`};"""

RESU = COMUN + r"""
      const H=d.histP(); d.histTick(); const now=new Date(), dk=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
      for(let i=1;i<=3;i++){ const t=new Date(now.getTime()-i*864e5); H.d[dk(t)]=Object.assign({},H.d[dk(now)]); }
      H.inicio=dk(new Date(now.getTime()-20*864e5)); H.wl=dk(new Date(now.getTime()-8*864e5)); H.ml=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'); H.yl=String(now.getFullYear()); H.sl=H.ml;
      const due=d.recapDue(); const otra=d.recapDue();
      d.recapShow('semana'); await new Promise(r=>setTimeout(r,600)); const ov=document.getElementById('v3recap'); if(!ov) return {ok:false,d:'no aparece el resumen'};
      const t1=ov.querySelector('.rc-sl h2')?.textContent; for(let i=0;i<4;i++){ ov.click(); await new Promise(r=>setTimeout(r,400)); }
      let img=null; for(let i=0;i<40&&!img;i++){ await new Promise(r=>setTimeout(r,500)); img=ov.querySelector('.rc-card img'); }
      if(img) await new Promise(r=>{ if(img.complete) r(); else img.onload=r; });
      const w=img?img.naturalWidth:0, h=img?img.naturalHeight:0, btn=!!ov.querySelector('.cd-dl'); ov.querySelector('.rc-x').click();
      return {ok:due&&due[0]==='semana'&&!otra&&t1==='Tu semana'&&w===1080&&h===1920&&btn, d:`aparece solo a los 7 días: ${due&&due[0]} (y no se repite: ${!otra}) · presentación: ${t1} · tarjeta ${w}×${h} · botón para guardar: ${btn}`};"""

VIDEO = COMUN + r"""
      d.danceBuild(); const R=d.recapData('semana'); const b=await d.vidMake({kind:'semana',R},'D_salmo',null,1.5);
      const v=document.createElement('video'); v.muted=true; v.src=URL.createObjectURL(b); await new Promise(r=>{v.onloadedmetadata=r; v.onerror=r; setTimeout(r,8000);});
      return {ok:b.size>20000&&v.videoWidth===720&&v.videoHeight===1280, d:`video ${v.videoWidth}×${v.videoHeight}, ${Math.round(b.size/1024)} KB, ${v.duration&&v.duration.toFixed(1)} s · bailes: ${['D_david','D_salmo','D_ronda','D_fiesta'].filter(k=>d.H3.clips[k]).length} de 4`};"""

BAILE = COMUN + r"""
      d.danceBuild(); d.poseMenu(true); const m=document.querySelector('.v3poses'); m.querySelector('[data-t="b"]').click(); await new Promise(r=>setTimeout(r,200));
      const bs=[...document.querySelectorAll('.v3poses [data-p]')], lock=bs.filter(b=>b.disabled).length; const dv=bs.find(b=>b.dataset.p==='d_david'); dv&&dv.click(); await new Promise(r=>setTimeout(r,1500));
      const ok=S.poseK==='d_david'&&S.actK==='D_david'; S.joy.y=1; await new Promise(r=>setTimeout(r,900)); S.joy.y=0; const fin=!S.poseK;
      return {ok:bs.length===4&&lock===2&&ok&&fin, d:`festejos en el menú: ${bs.length} (${lock} se ganan con el camino de 7 días) · festeja como David: ${ok} · al caminar termina el festejo: ${fin}`};"""

HERO = {
    'baile': ('Festejos bíblicos en el menú del Resplandor', BAILE),
    'video': ('Video para compartir: personaje bailando y logros (MP4 720×1280)', VIDEO),
    'resumen': ('Resumen de la semana: aparece solo, presentación con el narrador y tarjeta 1080×1920', RESU),
    'tarjeta': ('Tarjeta para compartir: imagen 1080×1350 con el personaje y el logro', TARJ),
    'avisos': ('Avisos: «Avisarme cada día», recordatorio de calendario y estado para el aviso', AVISOS),
    'adviento': ('Adviento: ventana del día, días pasados, estrella sobre Belén y regalos de Navidad y Reyes', ADVI),
    'meta': ('Desafío del día y camino de 7 días (con la prenda del séptimo)', META),
    'guia': ('Guía: pista con el narrador y «Tu próximo paso» sin tapar nada', GUIA),
    'oficio': ('Cosechar cebada con la hoz que dan gratis', COMUN + """
      const o=d.Z7.nodes.find(o=>o.g==='trigo'&&o.t===1); if(!o) return {ok:false,d:'no hay campos de cebada'};
      const antes=s.inv.cebada||0; tp(o.x+1,o.z); const n=d.svNear(); if(!n||!/cebada/i.test(n.label||'')) return {ok:false,d:'no aparece «Cosechar cebada»: '+(n&&n.label)};
      if(d.sheetUp()) return {ok:false,d:'quedó abierta una ventana o escena que frena el trabajo'};
      d.svAct(n); tick(60,1.6); const g=(s.inv.cebada||0)-antes;
      return {ok:g>=3, d:'juntó '+g+' de cebada; el campo se ve: '+o.mesh.visible};"""),
    'panaderia': ('Hornear pan de cebada y pan con levadura (con la espera de la masa)', COMUN + """
      s.inv.cebada=4; s.inv.trigo=6; s.inv.levadura=1; s.inv.piedramoler=1; d.ofiP().pan.xp=Math.max(d.ofiP().pan.xp,2000);
      const o=d.BK.ovens.find(o=>o.t===4); if(!o) return {ok:false,d:'no está el horno de la panadería'}; tp(o.x,o.z);
      const t=d.bkTier(); if(t.t<4) return {ok:false,d:'el horno no se reconoce: '+JSON.stringify(t)};
      const p0=s.inv.pancebada||0; d.bkStart(d.BREADS[0],0); tick(30,1); const p1=(s.inv.pancebada||0)-p0;
      const b0=s.inv.bread||0; d.bkStart(d.BREADS[3],0); tick(40,1); const levando=!!d.bkP().rise; if(!levando) return {ok:false,d:`pan de cebada +${p1}; el pan con levadura no llegó a la espera de la masa`};
      d.bkP().rise.until=Date.now()-1; d.bkStart(d.BREADS[3],3,true); tick(20,1); const b1=(s.inv.bread||0)-b0;
      return {ok:p1===2&&levando&&b1===4&&s.inv.levadura===1, d:`pan de cebada +${p1}, la masa quedó levando: ${levando}, pan con levadura +${b1}, levadura guardada: ${s.inv.levadura}`};"""),
    'epica': ('Misión épica del panadero de punta a punta (abre el horno de Belén)', COMUN + """
      const id='panes',E=d.EPIC[id]; const P=d.epP(); delete P[id]; P[id]={s:0,d:-9};
      s.inv.pancebada=5; s.inv.cooked=2; s.inv.panprop=12; const log=[];
      for(let i=0;i<E.steps.length;i++){ const sp=E.steps[i]; P[id].d=-9;
        if(sp.k==='act'){ const pl=d.epPlace(sp.at); if(!pl) return {ok:false,d:'no hay lugar para '+sp.at}; tp(pl.x,pl.z); const n=d.epNear(); if(!n||n.id!==id) return {ok:false,d:'no aparece el paso en '+sp.at}; d.epAct(id); }
        else if(sp.k==='quiz') d.epAdvance(id,'ok');
        else d.epAdvance(id, sp.ok||'ok');
        log.push(sp.k+'→'+(P[id].done?'fin':P[id].s)); }
      const s7=d.BREADS.find(b=>b.id==='prop');
      return {ok:!!P[id].done, d:log.join(', ')+' · título: '+((s.titles||[]).includes(E.title))};"""),
    'aldea': ('Aldea: tres regalos de nivel 5 llevan a «Como familia» y dan la prenda', COMUN + """
      d.repP()['Caná']=97; s.inv.barro5=3; const v={vil:'Caná',name:'Ana'}; const ks=[];
      for(let i=0;i<3;i++){ d.vilGiftOpen(v); const b=document.querySelector('#v3sheet [data-k]'); if(!b) return {ok:false,d:'no aparece qué regalar'}; ks.push(b.dataset.k); b.click(); }
      await new Promise(r=>setTimeout(r,4500)); const lv=d.repLv('Caná'), g=d.gearState().own.includes('vil_cana');
      return {ok:lv===7&&g, d:`regaló ${ks.join(', ')} · escalón ${lv} de 7 · prenda: ${g}`};"""),
    'jope': ('Jope: muelle con atún, pesca en la orilla y puesto del puerto', COMUN + """
      const m=d.Z7.mpier; if(!m) return {ok:false,d:'no está el muelle de Jope'};
      tp(m.x-1,m.z); const t7=d.svWaterNear(); const near=[]; for(const dz of [6,15]) for(let x=m.x-24;x<m.x;x+=1){tp(x,m.z+dz); const n=d.svNear(); if(n) near.push(n.k+':'+(n.label||n.shop||'').slice(0,25));}
      const prof=[]; for(let x=m.x-16;x<m.x;x+=1){ tp(x,m.z+15); const nn=d.svNear(); prof.push(x.toFixed(0)+':'+S.W.hAt(x,m.z+15).toFixed(1)+':'+d.svWaterNear()+':'+(nn?nn.k+'/'+(nn.label||'').slice(0,20):'-')); }
      const tienda=near.some(x=>/Jope/.test(x)), dorada=near.some(x=>/^fish:/.test(x)); /* sin caña dice «Necesitás una caña», con caña «Pescar dorada» */
      if(!dorada) return {ok:false,d:'perfil de la orilla '+prof.join(' ')};
      return {ok:t7===7&&tienda&&dorada, d:`muelle: nivel ${t7} · puesto: ${tienda} · dorada en la orilla: ${dorada}`};"""),
    'frutos': ('Frutos: escalón 6 practicando y 7 con una épica (pose y prenda)', COMUN + """
      const a=d.atP(); a.paz=100; a.ov=a.ov||{}; a.ov.paz=250; d.frCheck('paz'); const e6=d.ft('paz');
      const P=d.epP(); P.tormenta={s:9,done:1}; d.frCheck('paz'); const e7=d.ft('paz'); delete P.tormenta;
      const g=d.gearState().own.includes('fr7_paz'), pose=d.POSES.some(p=>p.fr==='paz');
      return {ok:e6===6&&e7===7&&g&&pose, d:`escalón ${e6} → ${e7} · prenda: ${g}`};"""),
}

KIDS = {
    'bailekids': ('Kids: brillar o festejar desde la estrella', BAILE),
    'resukids': ('Kids: resumen de la semana', RESU),
    'tarjkids': ('Kids: tarjeta para compartir', TARJ),
    'advkids': ('Kids: calendario de Adviento', ADVI),
    'metakids': ('Kids: desafío del día y camino de 7 días', META),
    'guiakids': ('Guía en Kids: pista y «Tu próximo paso» sin tapar nada', GUIA),
    'kids': ('Kids: cosechar con la hoz y que el campo vuelva', COMUN + """
      const o=(S.kgr||[])[0]; if(!o) return {ok:false,d:'no hay campos de trigo en Kids'}; tp(o.x+1,o.z);
      const n=d.kNear(); if(!n||n.k!=='grain') return {ok:false,d:'no aparece cosechar: '+(n&&n.label)};
      d.kAct(); for(let i=0;i<40;i++) d.kidsTick(1.4); const oculto=!o.mesh.visible; for(let i=0;i<100;i++) d.kidsTick(1.5);
      return {ok:oculto&&o.mesh.visible, d:`se cosechó: ${oculto} · volvió a crecer: ${o.mesh.visible}`};"""),
}

CELU = {
    'resucel': ('Celular: resumen de la semana', RESU),
    'mochila': ('iPhone: la mochila abre sin un segundo motor 3D y sin desenfoques', MOCHI),
    'guiacel': ('Guía en el celular: pista y «Tu próximo paso» sin tapar nada', GUIA),
    'celular': ('Celular: sin zoom al tocar dos veces, botones sin taparse', COMUN + """
      const vp=document.querySelector('meta[name=viewport]').content; const o=d.Z7.nodes.find(o=>o.g==='trigo'&&o.t===1); if(o) tp(o.x+1,o.z);
      await new Promise(r=>setTimeout(r,2500));
      const R=e=>e&&!e.hidden&&getComputedStyle(e).display!=='none'?e.getBoundingClientRect():null, hit=(a,b)=>a&&b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      const doBtn=R(document.querySelector('.v3surv .sv-do')), btns=[...document.querySelectorAll('.v3surv .sv-btn,.fan-tg,.v3cam-tg')].map(R).filter(Boolean);
      const tapa=btns.some(b=>hit(doBtn,b));
      return {ok:/user-scalable=no/.test(vp)&&!tapa, d:`viewport: ${vp} · el botón de acción tapa otro: ${tapa} · zoom: ${visualViewport.scale}`};"""),
}


async def correr(b, nombre, rama, pruebas, movil, elegidas, res):
    pr = {k: v for k, v in pruebas.items() if not elegidas or k in elegidas}
    if not pr: return
    if movil:
        ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True,
                                  user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36')
    else:
        ctx = await b.new_context(viewport={'width': 1280, 'height': 720})
    await ctx.route('**/*', servir)
    pg = await ctx.new_page(); errores = []
    def err(e):
        st = getattr(e, 'stack', '') or ''
        # solo cuentan los errores del código del juego; los de scripts de afuera (que en la prueba no cargan) se anotan aparte
        (errores if re.search(r'/app/|/kh/|jugar\.html', st) else ajenos).append(str(e)[:200] + ' @ ' + (re.findall(r'(\S+\.(?:js|html)):(\d+)', st)[:1] or [''])[0].__str__())
    ajenos = []; pg.on('pageerror', err)
    t0 = time.time(); ok = False
    try: ok = await entrar(pg, rama)
    except Exception as e: errores.append('entrar: ' + str(e)[:200])
    if not ok:
        for k, (t, _) in pr.items(): res.append((k, t, False, 'no se pudo entrar al juego (' + nombre + ')'))
        await ctx.close(); return
    if movil:  # doble toque de verdad sobre la pantalla del juego
        await pg.touchscreen.tap(400, 200); await pg.wait_for_timeout(120); await pg.touchscreen.tap(400, 200); await pg.wait_for_timeout(800)
    for k, (titulo, js) in pr.items():
        try:
            r = await pg.evaluate('(async()=>{' + js + '})()')
        except Exception as e:
            r = {'ok': False, 'd': 'error: ' + str(e)[:300]}
        try: await pg.screenshot(path=os.path.join(OUT, k + '.png'), timeout=90000)
        except Exception: pass
        res.append((k, titulo, bool(r.get('ok')), r.get('d', '')))
        print(('✅ ' if r.get('ok') else '❌ ') + k + ' · ' + r.get('d', ''), flush=True)
    if errores: res.append(('errores-' + nombre, 'Errores de código durante ' + nombre, False, ' | '.join(errores[:5])))
    if ajenos: print('  (avisos de scripts de afuera, no cuentan: ' + ' | '.join(ajenos[:3]) + ')', flush=True)
    print(f'  ({nombre}: {time.time() - t0:.0f} s)', flush=True)
    await ctx.close()


async def main():
    elegidas = set(sys.argv[1:]); os.makedirs(OUT, exist_ok=True); res = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        await correr(b, 'Hero en compu', 'hero', HERO, False, elegidas, res)
        await correr(b, 'Hero en celular', 'hero', CELU, True, elegidas, res)
        await correr(b, 'Kids', 'kids', KIDS, False, elegidas, res)
        await b.close()
    bien = sum(1 for r in res if r[2])
    with open(os.path.join(OUT, 'informe.md'), 'w', encoding='utf-8') as f:
        f.write(f'# Pruebas de Kids & Hero · {time.strftime("%d/%m/%Y %H:%M")}\n\n{bien} de {len(res)} bien.\n\n')
        for k, t, ok, d in res: f.write(f'- {"✅" if ok else "❌"} **{t}** ({k}): {d}\n')
    print(f'\n{bien} de {len(res)} bien. Informe: {os.path.join(OUT, "informe.md")}')
    sys.exit(0 if bien == len(res) else 1)

asyncio.run(main())
