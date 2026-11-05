# Copia los MP3 generados a app/voice/ y escribe index.json con los hashes disponibles
import json,os,shutil
S='/tmp/claude-0/vo/mp3'; D='/home/claude/tras-sus-pasos-modelos/app/voice'; os.makedirs(D,exist_ok=True)
ok=sorted(f[:-4] for f in os.listdir(S) if f.endswith('.mp3') and os.path.getsize(os.path.join(S,f))>500)
for h in ok:
    d=os.path.join(D,h+'.mp3')
    if not os.path.exists(d): shutil.copy(os.path.join(S,h+'.mp3'),d)
json.dump(ok,open(os.path.join(D,'index.json'),'w'),separators=(',',':'))
tot=sum(os.path.getsize(os.path.join(D,h+'.mp3')) for h in ok)
print(len(ok),'clips',round(tot/1e6,1),'MB')
