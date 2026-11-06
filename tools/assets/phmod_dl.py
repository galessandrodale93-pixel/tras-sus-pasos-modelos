import json,urllib.request,os,sys
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'tsp-builder/1.0'})))
D='/home/claude/assets-src/ph_mod/'
for k in sys.argv[1].split(','):
  f=get('https://api.polyhaven.com/files/'+k); g=f['gltf']['1k']['gltf']; d=D+k+'/'; os.makedirs(d,exist_ok=True)
  urllib.request.urlretrieve(g['url'],d+k+'.gltf')
  for rel,v in g['include'].items():
    p=d+rel; os.makedirs(os.path.dirname(p),exist_ok=True)
    if not os.path.exists(p): urllib.request.urlretrieve(v['url'],p)
  print('ok',k,flush=True)
