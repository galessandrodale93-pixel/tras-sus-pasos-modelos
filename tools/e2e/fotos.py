#!/usr/bin/env python3
"""Fotos de escenarios para la recorrida: python3 fotos.py temple river desert
Entra en Hero y en Kids, lleva al jugador a cada lugar y saca 5 fotos (4 rumbos + una alta). Deja los .jpg en salida/fotos/."""
import asyncio, os, sys
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prueba.py'), encoding='utf-8').read()
src = src[:src.rfind('asyncio.run(main())')]
exec(compile(src, 'prueba.py', 'exec'))
DEST = os.path.join(OUT, os.environ.get('FDIR','fotos2'))
VISTAS = [(0, 9, .42), (1.57, 9, .42), (3.14, 9, .42), (4.71, 9, .42), (0.8, 24, 1.05)]

async def rama_fotos(b, rama, keys, ramas_ok):
    ctx = await b.new_context(viewport={'width': 1280, 'height': 720}); await ctx.route('**/*', servir)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    if not await entrar(pg, rama): print('no entró', rama); await ctx.close(); return
    await pg.evaluate(COMUN.split('d\n')[0] if False else "(()=>{try{__dbg.CINE.on=false}catch(e){}})()")
    for _ in range(6):
        await pg.evaluate(SALTAR); await pg.wait_for_timeout(1500)
    for k in keys:
        info = await pg.evaluate(f"(()=>{{const S=__dbg.S();const p=S.pois.filter(q=>q.k==='{k}');return p.map(q=>({{x:q.k==='river'?q.pts[Math.floor(q.pts.length/2)][0]:q.x,z:q.z,n:q.name,sd:q.side||1}}))}})()")
        for j, p in enumerate(info):
            await pg.evaluate(f"(()=>{{const S=__dbg.S();const a=S.av.position;a.x={p['x']};a.z={p['z']}+3;a.y=S.W.hAt(a.x,a.z);}})()")
            await pg.wait_for_timeout(14000)
            for _ in range(3):
                await pg.evaluate(SALTAR); await pg.wait_for_timeout(800)
            shots = await pg.evaluate(f"""(()=>{{const S=__dbg.S(),c=S.camera,r=S.renderer,tx={p['x']},tz={p['z']},ty=S.W.hAt(tx,tz),out=[];
              const V=[[0,14,4.5,1.5],[1.57,14,4.5,1.5],[3.14,14,4.5,1.5],[4.71,14,4.5,1.5],[.8,38,26,0],[2.4,6,2.2,1.4],[5.5,6,2.2,1.4]];
              for(const [a,d,h,ly] of V){{const px=tx+Math.sin(a)*d,pz=tz+Math.cos(a)*d,gy=S.W.hAt(px,pz);c.position.set(px,Math.max(gy+1.2,ty+h),pz);c.fov=50;c.updateProjectionMatrix();c.lookAt(tx,ty+ly,tz);r.shadowMap.needsUpdate=true;if(S.fx)S.fx.render(0);else r.render(S.scene,c);out.push(r.domElement.toDataURL('image/jpeg',.8));}}
              return out;}})()""")
            import base64
            for i, u in enumerate(shots):
                open(os.path.join(DEST, f'{rama}-{k}{j or ""}-{i}.jpg'), 'wb').write(base64.b64decode(u.split(',', 1)[1]))
            print(rama, p['n'], 'listo')
    if errs: print('errores', rama, errs[:5])
    await ctx.close()

async def fotos():
    keys = sys.argv[1:]; os.makedirs(DEST, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for rama in (os.environ.get('RAMAS') or 'hero kids').split():
            await rama_fotos(b, rama, keys, None)
        await b.close()
asyncio.run(fotos())
