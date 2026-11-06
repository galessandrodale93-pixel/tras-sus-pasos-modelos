import json,urllib.request,os,sys
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'tsp-builder/1.0'})))
IDS=sys.argv[1].split(',');D='/home/claude/assets-src/ph_tex/'
for k in IDS:
  f=get('https://api.polyhaven.com/files/'+k)
  for m,key in [('diff','Diffuse'),('nor','nor_gl'),('rough','Rough')]:
    if key not in f: print('missing',k,key);continue
    for r in ['1k','2k','4k']:
      fmts=f[key].get(r,{}); u=(fmts.get('jpg') or fmts.get('png'))['url']; out=f'{D}{k}_{m}_{r}.'+u.rsplit('.',1)[1]
      if not os.path.exists(out): urllib.request.urlretrieve(u,out)
  print('ok',k,flush=True)
