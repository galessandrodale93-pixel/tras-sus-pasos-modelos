# Genera los MP3 de narración: voice/<hash>.mp3 con hash FNV-1a (UTF-16) de "voz|texto" (igual que en el juego)
import json,os,sys,struct,time
sys.path.insert(0,'/tmp/claude-0/tts'); import tts_say
O='/tmp/claude-0/vo/mp3'
def h(s):
    x=0x811c9dc5
    b=s.encode('utf-16-le')
    for i in range(0,len(b),2):
        x^=b[i]|(b[i+1]<<8); x=(x*0x01000193)&0xffffffff
    return '%08x'%x
arr=json.load(open('/tmp/claude-0/vo/texts.json'))
part=int(sys.argv[1]) if len(sys.argv)>1 else 0; parts=int(sys.argv[2]) if len(sys.argv)>2 else 1
man={}
for i,e in enumerate(arr):
    k=h(e['v']+'|'+e['t']); man[k]=e
    if i%parts!=part: continue
    f=os.path.join(O,k+'.mp3')
    if os.path.exists(f) and os.path.getsize(f)>500: continue
    t0=time.time()
    try: tts_say.say(e['v'],e['t'],f)
    except Exception as ex: print('ERR',k,str(ex)[:120],flush=True); continue
    print(i,k,e['v'],round(time.time()-t0,1),flush=True)
if part==0: json.dump(sorted(man.keys()),open('/tmp/claude-0/vo/index.json','w'))
