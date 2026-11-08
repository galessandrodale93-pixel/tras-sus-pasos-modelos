# genera app/assets.json: lista de archivos por calidad (para "Descargar mundo completo") y su peso
import os,json,glob,sys
R=sys.argv[1] if len(sys.argv)>1 else '.'
os.chdir(R)
def L(*pats): out=[]; [out.extend(sorted(glob.glob(p))) for p in pats]; return [p for p in out if os.path.isfile(p)]
core=L('app/game.js','app/walk3d.js','app/walk3d.css','hero/gltf.js','hero/fx.js','hero/basis/*','hero/hero_anims*.glb','hero/hero_m.glb','hero/hero_f.glb','app/lobby/*','app/flora/*','app/tex/*.jpg','app/tex/*.png','app/tex/pbr/*.webp','ph/*.glb')  # la voz (1452 mp3, 32 MB) se pide sola al hablar cada personaje: no va en la descarga inicial
lazy=[p for p in core if p.startswith('ph/')]
sky={'1k':L('app/sky/*_1k.webp'),'2k':L('app/sky/*_2k.webp'),'4k':L('app/sky/*_4k.webp')}
tex={'1k':L('tex/1k/*.ktx2'),'2k':L('tex/2k/*_diff.ktx2')+L('tex/1k/*_nor.ktx2')+L('tex/1k/*_rough.ktx2'),'4k':L('hd/4k/*.ktx2')}
hdav=L('hero/*_hd.glb')
T={'bajo':core+sky['1k']+tex['1k'],'medio':core+sky['2k']+tex['1k'],'alto':core+sky['2k']+tex['1k']+tex['2k'],'ultra':core+hdav+sky['1k']+sky['2k']+sky['4k']+tex['1k']+tex['2k']+tex['4k']}
T={k:sorted(set(v)) for k,v in T.items()}
size={p:os.path.getsize(p) for t in T.values() for p in t}
mb={k:sum(size[p] for p in v)/1048576 for k,v in T.items()}
initial={k:sum(size[p] for p in v if p not in lazy)/1048576 for k,v in T.items()}
abs_=[['https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',1250000]]
json.dump({'tiers':T,'size':size,'mb':mb,'initialMb':initial,'abs':abs_},open('app/assets.json','w'),separators=(',',':'))
print(json.dumps({'mb':{k:round(v,1) for k,v in mb.items()},'initialMb':{k:round(v,1) for k,v in initial.items()},'files':{k:len(v) for k,v in T.items()}},indent=1))
