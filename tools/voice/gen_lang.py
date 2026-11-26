# Voces del juego en otro idioma con Kokoro: app/voice/<idioma>/<hash>.mp3, donde <hash> es el de la voz en español
# (así el juego encuentra la voz traducida con el mismo nombre). La lista sale de tools/voice/lista_<idioma>.json: {k, v, t}.
# Uso: python3 -I tools/voice/gen_lang.py <idioma> <modelo.onnx> <voces.bin> [parte] [partes]
import json,os,re,sys,subprocess,tempfile
from kokoro_onnx import Kokoro
import soundfile as sf
lang,onnx,vb=sys.argv[1:4];part=int(sys.argv[4]) if len(sys.argv)>4 else 0;parts=int(sys.argv[5]) if len(sys.argv)>5 else 1
K=Kokoro(onnx,vb)
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
D=os.path.join(R,'app','voice',lang);os.makedirs(D,exist_ok=True)
# voz del juego → voz de Kokoro del idioma, velocidad y tono (los mismos ajustes que en español)
V={'en':{'narrador':'am_santa','varon':'am_michael','mujer':'af_heart'},'pt':{'narrador':'pm_santa','varon':'pm_alex','mujer':'pf_dora'}}[lang]
AJ={'narrador':(1,1),'varon':(1,1),'mujer':(1,1),'past':(.92,.9),'merc':(1,.965),'zel':(1.05,1.06),'esc':(.89,.98),'rom':(1,.97)}
KL={'en':'en-us','pt':'pt-br'}[lang]
L=json.load(open(os.path.join(R,'tools','voice','lista_'+lang+'.json')));n=0
# las que ya están grabadas (index.json del idioma) no se vuelven a grabar
try: YA=set(json.load(open(os.path.join(D,'index.json'))))
except Exception: YA=set()
L=[e for e in L if e['k'] not in YA]
for i,e in enumerate(L):
    if i%parts!=part: continue
    f=os.path.join(D,e['k']+'.mp3')
    if os.path.exists(f) and os.path.getsize(f)>500: continue
    kv=V.get(e['v'],V['mujer'] if e['v']=='mujer' else V['varon']);sp,pt=AJ.get(e['v'],(1,1))
    say=re.sub(r'[\U0001F000-\U0001FFFF☀-➿⬀-⯿️‍✔✖☁]','',e['t']).strip()
    if not re.search(r'\w',say): continue
    try: s,sr=K.create(say,voice=kv,speed=sp,lang=KL)
    except Exception as ex: print('ERR',e['k'],str(ex)[:120],flush=True); continue
    with tempfile.NamedTemporaryFile(suffix='.wav',delete=False) as t: sf.write(t.name,s,sr); w=t.name
    af='aresample=44100' if pt==1 else f'asetrate={int(sr*pt)},aresample=44100,atempo={1/pt:.4f}'
    subprocess.run(['ffmpeg','-v','error','-y','-i',w,'-af',af,'-ac','1','-b:a','64k',f],check=True); os.unlink(w)
    n+=1
    if n%25==0: print(part,n,flush=True)
print('listo',lang,part,n,'nuevas')
