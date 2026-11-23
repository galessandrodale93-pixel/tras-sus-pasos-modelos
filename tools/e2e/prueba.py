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
DBG = ('openMission, jueLock, jueLit, jueGoal, jueTick, jueOpen, MAT, kNear, kAct, kidsTick, repLv, vilGiftOpen, vilFamCheck, repP, price, frCheck, perksHtml, POSES, poseMenu, epReqTxt, '
       'WATER, OL, epAdvance, epPlace, epHTML, BK, BREADS, bkOpen, bkStart, bkTick, bkP, bkTier, bkNear, Z7, chopList, epStep, epP, EPIC, '
       'epAct, epNear, atP, ft, rockList, sheetUp, CINE, S: () => S, svP, t7Tick, svNear, svAct, svShop, svWaterNear, R7, svHas, fv, ofiLv, ofiP, GUIA, guiaP, guiaGoals, guiaPanel, metaP, metaEv, metaOpen, gearState, advHoy, advP, advGoal, advRead, advOpen, advStarSync, notiP, notiSync, openBag, cardShow, cardCamino, cardAdv, cardMeta, histP, histTick, recapData, recapShow, recapCard, recapDue, buildHero3, liteR, H3, danceBuild, cardAvatar, vidMake, vidPick, poseMenu, ui, poseSet, MP, mpUI, mpPanel, TALK, QUAL, txShrink, AM, amOpen, amSync, amEv, amGoals, amReqIn, amDraw, GBY, guiaGoals: () => guiaGoals(), puertaLock, puertaGoal, puertaTick, misOpen, misDone, MISSIONS, MIS_PUERTA, CASI, casiList, casiTick, casiGoal, metaP, META_POOL, PUE, pueTick, pueOpen, pueLv, pueSpot, blockedAt, waterWet, INI, iniTick, iniGoal, nodeActive, CAM, CAMS, camTick, camScene, camGoal, camEco, CINE, poseSet, camFinTick, camRecap')


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
      try{const pp=window.GAME.P();pp.inicio={fin:1};pp.cam=pp.cam||{};window.GAME.REGIONS.forEach(R=>{pp.cam[R.id]=Object.assign({},pp.cam[R.id],{ann:1});});document.getElementById('v3sheet').hidden=true;}catch(e){} /* las pistas esperan a que termine «Tu primer camino» */
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

FOTO = COMUN + r"""
      d.danceBuild(); S.walking=false; S.freeMoving=false; d.poseSet('d_salmo'); let b=null; for(let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,500)); b=document.getElementById('v3photo'); if(b&&!b.hidden) break; }
      const vis=!!b&&!b.hidden; if(vis) b.click(); for(let i=0;i<30&&!document.querySelector('#v3sheet .ph-img');i++) await new Promise(r=>setTimeout(r,500)); const img=document.querySelector('#v3sheet .ph-img'), dl=!!document.querySelector('#v3sheet .cd-dl');
      document.getElementById('v3sheet').hidden=true; S.joy.y=1; await new Promise(r=>setTimeout(r,700)); S.joy.y=0; S.freeMoving=false;
      return {ok:vis&&!!img&&dl, d:`momento de foto al festejar: ${vis} · la foto se ve y se puede guardar o compartir: ${!!img&&dl}`};"""

SALA = COMUN + r"""
      d.MP.code='PRUEBA'; d.mpUI(); await new Promise(r=>setTimeout(r,600));
      const top=document.getElementById('v3room'), m=document.querySelector('.v3mic'), rb=document.querySelector('#v3acts [data-a="room"]');
      const mr=m.getBoundingClientRect(), br=rb?rb.getBoundingClientRect():null, arriba=!!br&&mr.bottom<=br.top+2&&Math.abs((mr.left+mr.width/2)-(br.left+br.width/2))<6;
      d.mpPanel(); const modos=document.querySelectorAll('#v3sheet .r-mode button').length, frases=document.querySelectorAll('#v3sheet .r-phr2 button').length; document.getElementById('v3sheet').hidden=true;
      d.MP.code=null; d.mpUI(); const fuera=m.hidden;
      return {ok:!top&&arriba&&modos===2&&frases>3&&fuera, d:`barra de la sala arriba: ${top?'sigue':'no está'} · micrófono arriba del botón de amigos: ${arriba} · en la ventana de la sala: ${modos} modos de micrófono y ${frases} frases rápidas · sin sala se esconde: ${fuera}`};"""


AMIGOS = COMUN + """
      /* servidor de mentira con las mismas reglas básicas que /api/kh-amigos */
      const YO='perfil-yo-0001', LU='perfil-lu-0001', md=S.hx?'hx':'kids', SV={amig:{}, buz:[], env:[], eq:null};
      const sem=(()=>{const d=new Date(Date.now()-3*3600e3),k=(d.getUTCDay()+6)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-k)).toISOString().slice(0,10);})();
      const meta={k:'camina',ic:'🚶',t:'Caminen juntos por la tierra de Jesús',por:S.hx?1500:800,u:'metros'};
      const vista=()=>{if(!SV.eq)return null;const e=SV.eq,tot=meta.por*Math.max(2,e.mi.length),h=e.mi.reduce((a,m)=>a+Math.min(m.n,meta.por*2),0);return {id:'eq1',nombre:e.nombre,semana:sem,miembros:e.mi.map(m=>({...m})),meta:{...meta,total:tot},hecho:Math.min(h,tot),cumplido:h>=tot&&e.mi.length>=2,cobrado:e.cob.includes(YO),semanas:e.semanas};};
      const regs=S.hx?['canasta','denarios','pescado']:['estrella','luz','sobre'];
      const api=async b=>{ const k=b.k;
        if(k==='estado') return {ok:true,amigos:Object.entries(SV.amig).filter(([,v])=>v.a&&v.b).map(([id,v])=>({id,nom:v.nom})),buzon:SV.buz.filter(x=>!x.abierto),enviados:SV.env,maxReg:5,equipo:vista(),meta};
        if(k==='amigo'){const f=SV.amig[b.otro]||(SV.amig[b.otro]={nom:'Lucía',a:0,b:1});f.a=1;return {ok:true,mutuo:!!(f.a&&f.b)};}
        if(k==='regalo'){if(!regs.includes(b.regalo))return {error:'datos'};if(SV.env.includes(b.para))return {error:'hoy'};SV.env.push(b.para);return {ok:true};}
        if(k==='abrir'){const o=SV.buz.filter(x=>b.ids.includes(x.id)&&!x.abierto);o.forEach(x=>x.abierto=1);return {ok:true,abiertos:o.map(x=>({id:x.id,regalo:x.regalo,deNom:x.deNom,frase:x.frase,de:x.de}))};}
        if(k==='equipo-crear'){SV.eq={nombre:b.nombre,mi:[{id:YO,nom:'Yo',n:0}],cob:[],semanas:0};return {ok:true,equipo:vista()};}
        if(k==='equipo-invitar'){if(!SV.eq.mi.some(m=>m.id===b.para))SV.eq.mi.push({id:b.para,nom:'Lucía',n:0});return {ok:true};}
        if(k==='aporte'){const m=SV.eq.mi.find(x=>x.id===YO);if(b.ev===meta.k&&b.semana===sem)m.n=Math.min(meta.por*2,m.n+b.n);return {ok:true,equipo:vista()};}
        if(k==='cobrar'){const v=vista();if(!v.cumplido)return {error:'falta'};if(v.cobrado)return {error:'cobrado'};SV.eq.cob.push(YO);SV.eq.semanas=4;return {ok:true,todos:true,semanas:4,equipo:vista()};}
        return {error:'k'}; };
      const of=window.fetch; window.fetch=async(u,o)=>{ if(String(u).includes('/api/kh-amigos')){ const j=await api(JSON.parse(o.body)); return new Response(JSON.stringify(j),{status:j.ok?200:400}); } return of(u,o); };
      const G_=window.GAME; G_.amId=()=>({perfil:YO,socio:'socio-yo-0001'});
      const L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t); return !!c;}, wait=ms=>new Promise(r=>setTimeout(r,ms)), sheet=()=>document.getElementById('v3sheet'), until=async(f,ms)=>{for(let i=0;i<(ms||8000)/200;i++){if(f())return true;await wait(200);}return false;}, btn=sel=>{const b=sheet().querySelector(sel); if(b) b.click(); return !!b;};
      let todo=true; try {
      /* 1. sala: Lucía pide ser amiga y se acepta */
      d.MP.players['p-lu']={info:{name:'Lucía',pid:LU},av:null}; d.amReqIn({id:'p-lu'}); await wait(100);
      todo&=ok(/quiere ser tu amigo/.test(sheet().textContent),'pedido de amistad en la sala'); btn('.am-si'); await until(()=>d.AM.st&&d.AM.st.amigos.length);
      delete d.MP.players['p-lu'];
      todo&=ok(d.AM.st && d.AM.st.amigos.length===1,'quedan amigos (los dos aceptaron)');
      /* 2. ventana de amigos y equipo */
      await d.amOpen(); todo&=ok(/Crear mi equipo/.test(sheet().textContent),'sin equipo ofrece crear');
      btn('.am-crear'); await wait(50); sheet().querySelectorAll('[data-n]')[2].click(); await wait(30); btn('.am-ok2'); await until(()=>!!sheet().querySelector('.am-eq'));
      todo&=ok(/Los del techo abierto/.test((sheet().querySelector('.am-eq')||{}).textContent||''),'equipo creado con el nombre elegido');
      todo&=ok(!!sheet().querySelector('[data-eq]'),'botón para sumar al amigo al equipo'); btn('[data-eq]'); await wait(300); await d.amSync(true); todo&=ok(d.AM.st.equipo.miembros.length===2,'Lucía se suma al equipo'); await d.amOpen();
      /* 3. regalo */
      btn('[data-reg]'); await wait(50); todo&=ok(sheet().querySelectorAll('.am-pick button').length===3 && sheet().querySelectorAll('.am-fr button').length===8,'3 regalos y 8 frases fijas');
      btn('.am-env'); await until(()=>d.AM.st.enviados.includes(LU)&&sheet().querySelector('[data-reg]')); todo&=ok(d.AM.st.enviados.includes(LU) && sheet().querySelector('[data-reg]').disabled,'regalo enviado: hoy no se repite');
      /* 4. buzón */
      SV.buz.push({id:'r1',tipo:'regalo',de:LU,deNom:'Lucía',regalo:regs[0],frase:5,dia:'x'}); await d.amSync(true);
      const g1=d.guiaGoals(); todo&=ok(g1.some(x=>/regalo de Lucía/.test(x.t)),'«Tu próximo paso» avisa del regalo');
      todo&=ok(document.querySelector('#v3acts [data-a="room"]').dataset.n==='1','número en el botón de amigos');
      const snap=()=>JSON.stringify([s&&s.inv,G_.P().bonus,(G_.P().alb||{}).sob,JSON.stringify(G_.P()).length]),p0=snap(); await d.amOpen(); btn('.am-abrir'); await until(()=>/Regalos abiertos/.test(sheet().textContent));
      todo&=ok(/Regalos abiertos/.test(sheet().textContent) && /Un amigo es siempre leal/.test(sheet().textContent),'se abre el regalo con su frase');
      todo&=ok(snap()!==p0,'el regalo se suma');
      /* 5. desafío en equipo */
      const mine=()=>d.AM.st.equipo.miembros.find(m=>m.id===YO).n; d.amEv('camina', 300); todo&=ok(mine()===300,'caminar suma al equipo');
      d.amEv('ora', 1); todo&=ok(mine()===300,'lo que no pide la semana no suma');
      const st0=d.AM.st.equipo; d.amEv('camina', st0.meta.por*2); todo&=ok(d.AM.st.equipo.cumplido,'con lo de los dos se cumple');
      await wait(300); await d.amSync(true);
      const g2=d.guiaGoals(); todo&=ok(g2.some(x=>/cumplió el desafío/.test(x.t)),'«Tu próximo paso» avisa que hay premio');
      await d.amOpen(); btn('.am-cobrar'); await until(()=>d.AM.st.equipo.cobrado); await until(()=>d.gearState().own.includes('equipo4'),10000);
      todo&=ok(d.AM.st.equipo.cobrado,'premio cobrado');
      todo&=ok(d.gearState().own.includes('equipo4'),'a las 4 semanas, la prenda del equipo');
      document.querySelectorAll('#v3sheet').forEach(e=>e.hidden=false); await d.amOpen(); await wait(200);
      } catch(e) { L.push('ERROR '+e.message+' · '+sheet().textContent.slice(0,300)); todo=false; }
      window.fetch=of;
      return {ok:!!todo, d:L.join(' · ')};"""


PUERTAS = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true;
      const keep={done:{...P.done},missions:{...(P.missions||{})},visited:[...P.visited],pos:P.pos};
      try {
        P.done={}; P.missions={}; P.visited=['start']; P.pos='start';
        const R=G_.REGIONS[0].id, n=k=>R+'-'+k;
        P.done[n('n1')]={s:1}; P.pos=n('n1');
        todo&=ok(!G_.reachable(n('n2')),'después de la parada 1, la 2 espera una misión');
        const lk=d.puertaLock(n('n2')); todo&=ok(lk&&lk.mis==='posada','la puerta es la misión del posadero');
        todo&=ok(d.misOpen(S.mis.posada,P),'la misión se abrió al terminar la parada');
        todo&=ok(!d.misOpen(S.mis.oveja,P),'la misión de la puerta siguiente todavía no');
        const g1=d.puertaGoal(); todo&=ok(g1&&/Ayudá al posadero/.test(g1.t),'«Tu próximo paso» lleva a la misión');
        P.mact=null; d.misDone(S.mis.posada);
        todo&=ok(G_.reachable(n('n2')),'al cumplirla se abre la parada 2');
        P.done[n('n2')]={s:1}; P.pos=n('n2');
        todo&=ok(d.misOpen(S.mis.oveja,P) && !G_.reachable(n('n3')),'parada 2 → misión de la oveja → parada 3 cerrada');
        P.missions.oveja=true; P.done[n('n3')]={s:1}; P.pos=n('n3');
        todo&=ok(!G_.reachable(n('fA')) && !G_.reachable(n('fB')),'las dos del desvío esperan su misión');
        P.missions.adorar=true; todo&=ok(G_.reachable(n('fA')) && G_.reachable(n('fB')),'con la misión, se abren las dos');
        /* cadenas de 3 */
        P.missions.leche=true; todo&=ok(d.misOpen(S.mis.panbelen,P) && !d.misOpen(S.mis.pesebre,P),'cadena: leche → pan, el pesebre espera');
        P.missions.panbelen=true; todo&=ok(d.misOpen(S.mis.pesebre,P),'cadena de 3: se abre el pesebre');
        const ids=d.MISSIONS.map(x=>x.id); todo&=ok(new Set(ids).size===ids.length,'ningún id de misión repetido');
        const bad=d.MIS_PUERTA.flat().filter(id=>{const m=d.MISSIONS.find(x=>x.id===id);return !m||m.hum||['record','photo'].includes(m.kind)||!S.mis[id];});
        todo&=ok(!bad.length,'todas las puertas existen, sin Humildad ni grabar/foto '+bad.join(','));
        const nuevas=['pesebre','yugo','mantoseco','remo','muchacho','levadura','lampara','panbrasas'].filter(id=>!S.mis[id]);
        todo&=ok(!nuevas.length,'las misiones nuevas tienen su lugar en el mapa '+nuevas.join(','));
      } catch(e){ L.push('ERROR '+e.message); todo=false; }
      Object.assign(P,keep); G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""


JUEGOS3 = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true;
      const keep={done:{...P.done},missions:{...(P.missions||{})},visited:[...P.visited],pos:P.pos,mat:JSON.parse(JSON.stringify(P.mat||{}))};
      try {
        for(let i=0;i<40&&!(d.MAT.jue&&d.MAT.jue.length);i++) await new Promise(r=>setTimeout(r,500));
        const J=d.MAT.jue||[], tipos=J.map(e=>e.d.type).join(',');
        todo&=ok(J.filter(e=>e.d.r<=2).length===3,'los tres puestos de las etapas I a III: '+tipos);
        P.done={}; P.missions={}; P.visited=['start']; P.pos='start'; P.mat=P.mat||{}; P.mat.jue={};
        const R0=G_.REGIONS[0].id, e0=J.find(e=>e.d.r===0); d.jueLit(e0);
        todo&=ok(d.jueLock(e0.d)&&!e0.open&&e0.lk.visible&&!e0.ring.visible,'al empezar, la carpa está con candado');
        S.av.position.set(e0.x,S.av.position.y,e0.z); d.jueOpen(e0); await new Promise(r=>setTimeout(r,300));
        todo&=ok(document.getElementById('arcade').hidden!==false,'con candado no se abre el juego');
        P.done[R0+'-n1']={s:1}; P.visited.push(R0+'-n1'); P.missions.posada=true; d.jueTick();
        todo&=ok(e0.open&&e0.ring.visible&&!e0.lk.visible,'al ayudar al posadero se abre la carpa');
        P.pos=R0+'-n1'; const g=d.jueGoal(); todo&=ok(g&&/La carpa/.test(g.t),'«Tu próximo paso» la muestra: '+(g&&g.t));
        const e2=J.find(e=>e.d.r===2); P.done[G_.REGIONS[2].id+'-n2']={s:1}; d.jueTick(); todo&=ok(e2.open,'si ya pasaste la parada 2 (partida vieja) queda abierto');
        const e1=J.find(e=>e.d.r===1); todo&=ok(!e1.open,'la de la etapa II sigue esperando a José');
        /* jugar las tres voces y ver que se puedan sacar las tres estrellas */
        G_.playMat(e2.d); await new Promise(r=>setTimeout(r,500)); document.getElementById('arGo').click(); await new Promise(r=>setTimeout(r,300));
        todo&=ok(!document.getElementById('arcade').hidden,'se abre «Tres voces en el desierto»');
        document.querySelector('#arcade .ar-x, #arClose').click(); await new Promise(r=>setTimeout(r,400));
      } catch(e){ L.push('ERROR '+e.message); todo=false; }
      Object.assign(P,keep); G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""

PUNTOS = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const b0=P.bonus||0;
      try {
        todo&=ok(G_.PX===10&&G_.lvNeed(2)===1200&&G_.lvNeed(10)===54000,'nivel 2 pide 1.200 y el 10 pide 54.000');
        P.bonus=b0; const lv=G_.level(), t=G_.points(); todo&=ok(t%10===0,'los puntos van con una cifra más: '+t);
        P.bonus=b0+(G_.lvNeed(lv+1)-t)/10; G_.save(); todo&=ok(G_.level()===lv+1,'sumar lo justo por dentro sube exactamente un nivel');
        P.bonus=b0; G_.save(); todo&=ok(G_.level()===lv,'vuelve al nivel de antes');
        const txt=document.getElementById('score')?document.getElementById('score').textContent:''; todo&=ok(/\d/.test(txt),'el contador muestra '+txt);
        const m=d.MISSIONS[0]; d.openMission(S.mis[m.id]||m); await new Promise(r=>setTimeout(r,300)); const sh=document.getElementById('v3sheet'); const tx=sh?sh.textContent:'';
        todo&=ok(/\+500 puntos/.test(tx),'la misión dice +500 puntos'); if(sh) sh.hidden=true;
      } catch(e){ L.push('ERROR '+e.message); todo=false; }
      P.bonus=b0; G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""

CASI = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const b0=P.bonus||0, casi0=P.casi;
      try {
        P.casi={}; const lv=G_.level(), a=G_.lvNeed(lv), b=G_.lvNeed(lv+1); P.bonus=(P.bonus||0)+Math.ceil((a+.9*(b-a)-G_.points())/(G_.PX||1));
        const l1=d.casiList(); todo&=ok(l1.some(x=>/para el nivel/.test(x.t)),'cerca de subir de nivel: '+(l1[0]||{}).t);
        const m=d.metaP(); m.ok=0; m.c={}; m.g.slice(0,2).forEach(k=>m.c[k]=d.META_POOL[k][2]);
        const l2=d.casiList(); todo&=ok(l2.some(x=>/desafío del día|Manto/.test(x.t)),'falta una meta del desafío del día');
        d.CASI.t=0; d.CASI.last=0; document.getElementById('v3sheet').hidden=true; d.casiTick(performance.now()/1000);
        const el=document.getElementById('v3casi'); todo&=ok(el&&el.classList.contains('on')&&/Te falta poco/.test(el.textContent),'aparece el aviso «Te falta poco»');
        const k1=Object.keys(P.casi).length; d.CASI.t=0; d.CASI.last=0; d.casiTick(performance.now()/1000+20); todo&=ok(Object.keys(P.casi).length===k1+1,'sale el siguiente, y el primero no se repite');
        const gg=d.guiaGoals(); todo&=ok(gg.some(x=>/Te falta poco/.test(x.sub||'')),'queda en «Tu próximo paso»');
        const r=el.getBoundingClientRect(), o=document.querySelector('.v3obj'); todo&=ok(!o||getComputedStyle(o).display==='none'||o.hidden,'no se pisa con «Tu próximo paso»');
      } catch(e){ L.push('ERROR '+e.message); todo=false; }
      P.bonus=b0; P.casi=casi0||{}; G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""


PUEBLOS = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const keep={missions:{...(P.missions||{})},pue:{...(P.pue||{})}};
      try {
        todo&=ok(d.PUE.list.length>=5,'pueblos: '+d.PUE.list.map(v=>v.name).join(', '));
        const v=d.PUE.list.find(x=>x.name==='Belén')||d.PUE.list[0]; const n0=S.scene.children.length, l0=v.lv;
        d.MISSIONS.filter(m=>m.r===v.r).forEach(m=>P.missions[m.id]=true);
        d.PUE.t=0; d.pueTick(performance.now()/1000+100);
        todo&=ok(v.lv>l0 && v.lv>=3,'con las misiones de la etapa, '+v.name+' sube a '+v.lv);
        todo&=ok(S.scene.children.length>n0+5,'aparecen cosas nuevas en el pueblo ('+(S.scene.children.length-n0)+')');
        todo&=ok(P.pue[v.name]===v.lv,'queda guardado para avisar una sola vez');
        tp(v.x+3, v.z+3);
        d.pueOpen(); const sh=document.getElementById('v3sheet'); todo&=ok(/Los pueblos/.test(sh.textContent)&&new RegExp(v.name).test(sh.textContent),'ventana «Los pueblos»');
        sh.hidden=true;
      } catch(e){ L.push('ERROR '+e.message); todo=false; }
      P.missions=keep.missions; P.pue=keep.pue; G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""


INICIO = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const keep={done:{...P.done},inicio:P.inicio,bonus:P.bonus||0,pos:P.pos,visited:[...P.visited]};
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      try {
        P.done={}; P.visited=['start']; P.pos='start'; delete P.inicio; d.INI.gift=null; S.poseK=null; S.shineT=0;
        d.iniTick(1); todo&=ok(P.inicio&&P.inicio.on&&d.INI.gift,'jugador nuevo: aparece el regalo de bienvenida');
        const gd=Math.hypot(d.INI.gift.x-S.av.position.x,d.INI.gift.z-S.av.position.z); todo&=ok(gd>6&&gd<20,'está unos pasos adelante ('+gd.toFixed(1)+' m)');
        const g0=d.iniGoal(); todo&=ok(g0&&/0 de 3/.test(g0.t),'«Tu próximo paso»: '+(g0&&g0.t));
        tp(d.INI.gift.x, d.INI.gift.z); d.iniTick(2); todo&=ok(P.inicio.g&&!d.INI.gift,'al pasar por el regalo, se abre');
        await wait(2600); todo&=ok(d.gearState().own.includes('primerpaso'),'ganás las Sandalias del primer paso');
        S.poseK='x'; d.iniTick(3); S.poseK=null; todo&=ok(P.inicio.l,'Resplandor: paso 2');
        P.done[G_.REGIONS[0].id+'-n1']={s:1}; d.iniTick(4); todo&=ok(P.inicio.fin&&G_.level()>=2,'primera parada: primera victoria y nivel '+G_.level());
        await wait(3000); todo&=ok(/Primera victoria/.test(document.getElementById('v3sheet').textContent),'aparece «¡Primera victoria!»');
        P.done={a:1}; delete P.inicio; d.iniTick(5); todo&=ok(P.inicio.fin,'quien ya venía jugando no lo ve');
      } catch(e){ L.push('ERROR '+e.message); todo=false; }
      Object.assign(P,keep); G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""


CAMINOS = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
      const keep={cam:P.cam, story:JSON.parse(JSON.stringify(P.story||{})), done:{...P.done}, pos:P.pos, inicio:P.inicio};
      const sh=()=>document.getElementById('v3sheet');
      const talk=async(pick)=>{ for(let i=0;i<80;i++){ await wait(350);
          if(d.CINE.on){ const b=document.querySelectorAll('.cine-ui .cine-opts button'); if(b.length){ b[Math.min(pick,b.length-1)].click(); continue; } document.querySelector('.cine-ui').click(); continue; }
          const s0=sh(); if(s0&&!s0.hidden){ const o=s0.querySelectorAll('.vivo-o button'); if(o.length){ o[Math.min(pick,o.length-1)].click(); continue; } const g=s0.querySelector('.cam-go'); if(g){ g.click(); continue; } }
          return true; } return false; };
      const reset=()=>{ P.cam={}; Object.values(d.CAM.npc).forEach(n=>{S.scene.remove(n.o);S.scene.remove(n.bang);}); d.CAM.npc={}; if(d.CAM.ring){S.scene.remove(d.CAM.ring.m);d.CAM.ring=null;} if(d.CAM.carry){S.av.remove(d.CAM.carry);d.CAM.carry=null;} sh().hidden=true; };
      const tk=()=>{ d.CAM.t=0; d.camTick(performance.now()/1000+Math.random()); };
      try {
        reset(); P.story=P.story||{}; P.story.ans={}; P.story.att={esc:0,zel:0,rom:0}; P.inicio={fin:1};
        if (S.hx) {
          window.W3.camStart('nacimiento','misericordia'); tk();
          todo&=ok(P.cam.nacimiento&&P.cam.nacimiento.b==='B'&&d.CAM.npc.nacimiento,'la respuesta del capítulo abre el camino de la oveja y aparece Natán');
          const g1=d.camGoal(); todo&=ok(g1&&/oveja/.test(g1.t),'«Tu próximo paso»: '+(g1&&g1.t));
          d.camScene('nacimiento'); await talk(0);
          todo&=ok(P.cam.nacimiento.s==='task'&&d.CAM.carry&&d.CAM.ring,'elegís cargarla: llevás la oveja y aparece el aro del corral');
          tp(d.CAM.ring.x,d.CAM.ring.z); tk(); await talk(0); await wait(3200);
          todo&=ok(P.cam.nacimiento.s==='done'&&P.cam.nacimiento.r==='good','al llegar al corral, camino cumplido');
          todo&=ok(d.gearState().own.includes('lanapastor'),'premio: Guantes de lana de Natán');
          todo&=ok((P.story.att.zel||0)===1,'Asher te mira con buenos ojos');
          const e1=d.camEco('infancia'); todo&=ok(e1.length&&/oveja/.test(e1[0].t),'en el capítulo siguiente lo recuerdan');
          reset(); window.W3.camStart('nacimiento','evangelista'); tk(); d.camScene('nacimiento'); await talk(1); await wait(800);
          todo&=ok(P.cam.nacimiento.r==='meh'&&P.cam.nacimiento.s==='done','el mensaje sin pan: camino menos lindo');
          const e2=d.camEco('infancia'); todo&=ok(e2.length&&/se olvidó/.test(e2[0].t),'después: el arriero se olvidó del mensaje');
          reset(); P.story.ans={nacimiento:'maestro'}; tk(); todo&=ok(P.cam.nacimiento&&P.cam.nacimiento.b==='A','si ya habías respondido, el camino arranca igual (Eleazar)');
        } else {
          const R0=G_.REGIONS[0].id; P.done[R0+'-n1']={s:1}; tk(); await wait(300);
          todo&=ok(P.cam.nacimiento&&/Belén estaba llena|A quién querés ayudar/.test(sh().textContent),'Kids: después de la primera parada, el narrador pregunta');
          await talk(1); tk();
          todo&=ok(P.cam.nacimiento.b==='K'&&d.CAM.npc.nacimiento,'elegís la posada y aparece Rut');
          d.camScene('nacimiento'); await talk(0);
          todo&=ok(P.cam.nacimiento.s==='task'&&d.CAM.ring,'llevás la manta al establo');
          tp(d.CAM.ring.x,d.CAM.ring.z); tk(); await talk(0); await wait(3200);
          todo&=ok(P.cam.nacimiento.s==='done'&&d.gearState().own.includes('panueloposada'),'camino cumplido: Pañuelo de la posada');
          const n1=Object.keys(G_.NODES).find(k=>G_.NODES[k].r===1&&G_.NODES[k].kind==='ch'); P.pos=n1; tk(); await wait(100);
          todo&=ok(P.cam.nacimiento.eco===1,'en la etapa siguiente, el narrador lo recuerda');
        }
      } catch(e){ L.push('ERROR '+e.message+' '+(e.stack||'').split('\\n')[1]); todo=false; }
      reset(); Object.assign(P,keep); G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""


CAMINOS2 = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
      const keep={cam:P.cam, story:JSON.parse(JSON.stringify(P.story||{}))};
      const sh=()=>document.getElementById('v3sheet');
      const talk=async(pick)=>{ for(let i=0;i<90;i++){ await wait(300);
          if(d.CINE.on){ const b=document.querySelectorAll('.cine-ui .cine-opts button'); if(b.length){ b[Math.min(pick,b.length-1)].click(); continue; } document.querySelector('.cine-ui').click(); continue; }
          const s0=sh(); if(s0&&!s0.hidden){ const o=s0.querySelectorAll('.vivo-o button'); if(o.length){ o[Math.min(pick,o.length-1)].click(); continue; } const g=s0.querySelector('.cam-go'); if(g){ g.click(); continue; } }
          return true; } return false; };
      const reset=()=>{ P.cam={}; Object.values(d.CAM.npc).forEach(n=>{S.scene.remove(n.o);S.scene.remove(n.bang);}); d.CAM.npc={}; if(d.CAM.ring){S.scene.remove(d.CAM.ring.m);d.CAM.ring=null;} if(d.CAM.carry){S.av.remove(d.CAM.carry);d.CAM.carry=null;} sh().hidden=true; };
      const tk=()=>{ d.CAM.t=0; d.camTick(performance.now()/1000+Math.random()); };
      try {
        P.inicio={fin:1};
        for (const rid of (window.__CR||['infancia','bautismo','galilea'])) { const C=d.CAMS[rid];
          const keys=Object.keys(C.br).filter(k=>S.hx?!C.br[k].kids:!C.br[k].hx);
          for (const b of keys) { const D=C.br[b]; reset(); P.cam[rid]={b,s:'go'}; tk();
            if(!ok(d.CAM.npc[rid],rid+'/'+b+': aparece '+(typeof D.who==='string'?D.who:D.who.name))) { todo=false; continue; }
            d.camScene(rid); await talk(0);
            if (D.good.task) { for(let k=0;k<3&&d.CAM.ring;k++){ tp(d.CAM.ring.x,d.CAM.ring.z); tk(); await wait(200); } await talk(0); }
            await wait(600); tk(); await wait(2600);
            const st=P.cam[rid]; let g=true; if(D.good.prize.gear) g=d.gearState().own.includes(D.good.prize.gear);
            todo&=ok(st.s==='done'&&st.r==='good'&&g, rid+'/'+b+' «'+D.name+'» cumplido'+(D.good.prize.gear?' + prenda':'')); }
        }
        if (S.hx) { P.cam={nacimiento:{b:'C',s:'done',r:'good'},infancia:{b:'B',s:'done',r:'meh'}}; const e=d.camEco('bautismo'); todo&=ok(e.length&&/Séforis/.test(e[0].t),'el capítulo del Bautismo recuerda lo de Séforis'); }
      } catch(e){ L.push('ERROR '+e.message+' '+(e.stack||'').split('\\n')[1]); todo=false; }
      reset(); Object.assign(P,keep); G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""


CAMFIN = COMUN + """
      const G_=window.GAME, P=G_.P(), L=[], ok=(c,t)=>{L.push((c?'✓ ':'✗ ')+t);return !!c;}; let todo=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
      const keep={cam:P.cam, regions:JSON.parse(JSON.stringify(P.regions||{})), camFin:P.camFin, story:JSON.parse(JSON.stringify(P.story||{}))};
      const sh=()=>document.getElementById('v3sheet');
      const talk=async(pick)=>{ for(let i=0;i<60;i++){ await wait(300);
          if(d.CINE.on){ const b=document.querySelectorAll('.cine-ui .cine-opts button'); if(b.length){ b[0].click(); continue; } document.querySelector('.cine-ui').click(); continue; }
          const s0=sh(); if(s0&&!s0.hidden){ const g=s0.querySelector('.cam-go'); if(g){ g.click(); continue; } }
          return true; } return false; };
      try {
        P.inicio={fin:1}; delete P.camFin; P.cam={}; const ids=Object.keys(d.CAMS); ids.forEach((rid,i)=>{ const C=d.CAMS[rid]; const b=Object.keys(C.br).find(k=>S.hx?!C.br[k].kids:!C.br[k].hx); P.cam[rid]={b,s:'done',r:i<7?'good':'meh'}; });
        P.story=P.story||{}; P.story.att={esc:3,zel:1,rom:-1};
        P.regions=P.regions||{}; G_.REGIONS.forEach(R=>{P.regions[R.id]=Object.assign({},P.regions[R.id],{complete:true});});
        sh().hidden=true; d.camFinTick(); await talk(0); await wait(3200);
        todo&=ok(P.camFin&&P.camFin.n===7,'al terminar todas las etapas llega el final (7 de 9 caminos buenos)');
        todo&=ok(/Tu camino completo/.test(sh().textContent)&&/Discípulo del camino/.test(sh().textContent),'resumen final: Discípulo del camino');
        todo&=ok(d.gearState().own.includes('cintacamino'),'prenda: Cinta del camino completo');
        todo&=ok(sh().querySelectorAll('.sv-rec').length===9,'el resumen muestra las 9 etapas');
        sh().hidden=true; d.camFinTick(); todo&=ok(sh().hidden,'el final sale una sola vez');
      } catch(e){ L.push('ERROR '+e.message+' '+(e.stack||'').split('\\n')[1]); todo=false; }
      Object.assign(P,keep); if(!keep.camFin) delete P.camFin; G_.save();
      return {ok:!!todo, d:L.join(' · ')};"""

HERO = {
    'caminos4': ('Hero: caminos de la Cruz y la Resurrección', "window.__CR=['cruz','resurreccion'];"+CAMINOS2),
    'camfin': ('Hero: el final de los caminos', CAMFIN),
    'caminos3': ('Hero: caminos de Milagros, Parábolas y Jerusalén', "window.__CR=['milagros','parabolas','jerusalen'];"+CAMINOS2),
    'caminos2': ('Hero: caminos de Infancia, Bautismo y Galilea', CAMINOS2),
    'caminos': ('Hero: caminos de la historia (Nacimiento)', CAMINOS),
    'inicio': ('Hero: tu primer camino (primeros 5 minutos)', INICIO),
    'pueblos': ('Hero: pueblos que cambian con lo que hacés', PUEBLOS),
    'casi': ('Hero: «Te falta poco»', CASI),
    'puertas': ('Hero: minijuegos y misiones alternados, cadenas de 3', PUERTAS),
    'puntos': ('Hero: puntos con una cifra más, mismos niveles', PUNTOS),
    'juegos3': ('Hero: los juegos de las etapas I a III se abren con las misiones', JUEGOS3),
    'amigos': ('Hero: amigos del camino, regalos y desafío en equipo', AMIGOS),
    'sala': ('Sala: sin barra arriba, micrófono junto al botón de amigos, modos y frases en la ventana', SALA),
    'foto': ('Momento de foto épica al festejar, con la foto para compartir', FOTO),
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
    'caminos4kids': ('Kids: caminos de la Cruz y la Resurrección', "window.__CR=['cruz','resurreccion'];"+CAMINOS2),
    'camfinkids': ('Kids: el final de los caminos', CAMFIN),
    'caminos3kids': ('Kids: caminos de Milagros, Parábolas y Jerusalén', "window.__CR=['milagros','parabolas','jerusalen'];"+CAMINOS2),
    'caminos2kids': ('Kids: caminos de Infancia, Bautismo y Galilea', CAMINOS2),
    'caminoskids': ('Kids: caminos de la historia (Nacimiento)', CAMINOS),
    'iniciokids': ('Kids: tu primer camino (primeros 5 minutos)', INICIO),
    'pueblokids': ('Kids: pueblos que cambian con lo que hacés', PUEBLOS),
    'casikids': ('Kids: «Te falta poco»', CASI),
    'puertaskids': ('Kids: minijuegos y misiones alternados, cadenas de 3', PUERTAS),
    'puntoskids': ('Kids: puntos con una cifra más, mismos niveles', PUNTOS),
    'juegos3kids': ('Kids: los juegos de las etapas I a III se abren con las misiones', JUEGOS3),
    'amigoskids': ('Kids: amigos del camino, regalos y desafío en equipo', AMIGOS),
    'fotokids': ('Kids: momento de foto épica al festejar', FOTO),
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
    'salacel': ('Celular: micrófono de la sala junto al botón de amigos', SALA),
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
