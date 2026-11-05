import json,urllib.request,os,sys,concurrent.futures as cf
R='/tmp/claude-0/ph/raw'
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'tras-sus-pasos-assets/1.0'}),timeout=180).read()
def one(i):
    d=json.loads(get('https://api.polyhaven.com/files/'+i))
    res='1k'
    g=d['gltf'][res]['gltf']; out=os.path.join(R,i); os.makedirs(out,exist_ok=True)
    open(os.path.join(out,i+'.gltf'),'wb').write(get(g['url']))
    tot=0
    for p,f in g['include'].items():
        if '_arm_' in p or '_ao_' in p or 'rough' in p and False: pass
        fp=os.path.join(out,p); os.makedirs(os.path.dirname(fp),exist_ok=True)
        if not os.path.exists(fp): open(fp,'wb').write(get(f['url']))
        tot+=f['size']
    return i,tot
ids=[l.strip() for l in open('/tmp/claude-0/ph/ids.txt') if l.strip()]
with cf.ThreadPoolExecutor(8) as ex:
    for r in ex.map(lambda i: (lambda: one(i))() , ids):
        print(r[0],r[1]//1024,'KB',flush=True)
