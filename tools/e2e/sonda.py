import asyncio, os, sys
sys.argv=['x']
src=open('prueba.py',encoding='utf-8').read(); src=src[:src.rfind('asyncio.run(main())')]
exec(compile(src,'prueba.py','exec'))
async def go():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':1280,'height':720}); await ctx.route('**/*',servir); pg=await ctx.new_page()
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type in ('warning','error') else None)
        await entrar(pg, os.environ.get('R','hero'))
        r=await pg.evaluate("""(async()=>{const S=__dbg.S();const q=S.pois.find(p=>p.name==='Caná');const a=S.av.position;a.x=q.x;a.z=q.z+3;a.y=S.W.hAt(a.x,a.z);await new Promise(r=>setTimeout(r,12000));
          const out=['av '+a.x.toFixed(1)+','+a.z.toFixed(1)+' poi '+q.x.toFixed(1)+','+q.z.toFixed(1)];let vis=0,inv=0,ex=[];
          S.scene.traverse(o=>{if(o.userData&&o.userData.merged){const v=new o.position.constructor();o.getWorldPosition(v);const d=Math.hypot(v.x-q.x,v.z-q.z);if(d<40){let on=true;for(let p=o;p;p=p.parent)if(!p.visible)on=false;on?vis++:inv++;}}});
          out.push('merged cerca vis '+vis+' ocultos '+inv);
          let hidden=[];S.scene.children.forEach(c=>{if(!c.visible){const v=c.position;hidden.push((c.name||c.type)+'@'+v.x.toFixed(0)+','+v.z.toFixed(0));}});out.push('hijos ocultos: '+hidden.length+' '+hidden.slice(0,15).join(' '));
          const c=S.camera,r=S.renderer;c.position.set(q.x+40,S.W.hAt(q.x,q.z)+45,q.z+40);c.lookAt(q.x,S.W.hAt(q.x,q.z),q.z);c.updateProjectionMatrix();r.render(S.scene,c);out.push(r.domElement.toDataURL('image/jpeg',.8));
          const v=new c.position.constructor();const L=[];S.scene.traverse(o=>{if(o.userData&&o.userData.merged){o.getWorldPosition(v);const d=Math.hypot(v.x-q.x,v.z-q.z);if(d<40)L.push(o.parent&&o.parent.parent===S.scene?'top':'deep');}});out.push(L.join(','));
          return out.join(' | ');})()""")
        import base64
        parts=r.split(' | ');open('/tmp/cana.jpg','wb').write(base64.b64decode([p for p in parts if p.startswith('data:')][0].split(',',1)[1]));print([p for p in parts if not p.startswith('data:')])
        for l in logs:
            if 'isReady' not in l: print(l)
        await b.close()
asyncio.run(go())
