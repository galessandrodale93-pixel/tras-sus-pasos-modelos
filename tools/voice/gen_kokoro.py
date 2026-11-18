import re
# Genera voces con Kokoro (kokoro-onnx) igual que las del juego: <hash>.mp3, hash FNV-1a (UTF-16) de "voz|texto".
# Uso: python3 -I tools/voice/gen_kokoro.py lista.json   (lista de {"v": voz, "t": texto})
import json,os,sys,subprocess,tempfile
sys.path.insert(0,'/tmp/kok')
from kokoro_onnx import Kokoro
import soundfile as sf
K=Kokoro('/tmp/kok/kokoro-v1.0.onnx','/tmp/kok/voices-v1.0.bin')
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','app','voice')
# voz del juego → voz de Kokoro, velocidad y tono (medido contra las grabaciones que ya están)
VOZ={'narrador':('em_santa',1,1),'varon':('em_alex',1,1),'mujer':('ef_dora',1,1),'past':('em_alex',.92,.9),'merc':('em_alex',1,.965),'zel':('em_alex',1.05,1.06),'esc':('em_alex',.89,.98),'rom':('em_alex',1,.97)}
def h(s):
    x=0x811c9dc5;b=s.encode('utf-16-le')
    for i in range(0,len(b),2): x^=b[i]|(b[i+1]<<8); x=(x*0x01000193)&0xffffffff
    return '%08x'%x
L=json.load(open(sys.argv[1])); idx=set(json.load(open(os.path.join(D,'index.json')))); n=0
for e in L:
    v,t=e['v'],' '.join(str(e['t']).split()); k=h(v+'|'+t)
    if k in idx: continue
    if os.path.exists(os.path.join(D,k+'.mp3')): idx.add(k); continue
    kv,sp,pt=VOZ.get(v,VOZ['varon'])
    say=re.sub(r'[\U0001F000-\U0001FFFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D]','',t).strip()
    s,sr=K.create(say,voice=kv,speed=sp,lang='es')
    with tempfile.NamedTemporaryFile(suffix='.wav',delete=False) as f: sf.write(f.name,s,sr); w=f.name
    af='aresample=44100' if pt==1 else f'asetrate={int(sr*pt)},aresample=44100,atempo={1/pt:.4f}'
    subprocess.run(['ffmpeg','-v','error','-y','-i',w,'-af',af,'-ac','1','-b:a','64k',os.path.join(D,k+'.mp3')],check=True); os.unlink(w)
    idx.add(k); n+=1; print(n,v,t[:60],flush=True)
    if n%10==0: json.dump(sorted(idx),open(os.path.join(D,'index.json'),'w'),separators=(',',':'))
json.dump(sorted(idx),open(os.path.join(D,'index.json'),'w'),separators=(',',':'))
print('listo',n,'nuevas')
