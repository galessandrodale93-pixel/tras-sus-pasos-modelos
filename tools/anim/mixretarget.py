# Retarget de clips Mixamo (FBX) al esqueleto de hero_m.glb -> glb solo con nodos + animaciones
import bpy,sys,json,struct,os,re,math
from mathutils import Quaternion,Matrix,Vector
args=sys.argv[sys.argv.index('--')+1:]
MAXD={'M_Sitting_Talking':12.0}
OUT=args[0]; FPS=float(args[1]); items=json.loads(open(args[2]).read())  # [[fbxpath, clipname, mode]]
b=open('/home/claude/tras-sus-pasos-modelos/hero/hero_m.glb','rb').read()
n=struct.unpack('<I',b[12:16])[0]; G=json.loads(b[20:20+n]); GN=G['nodes']; NAMES=[x.get('name') for x in GN]
par={c:i for i,x in enumerate(GN) for c in x.get('children',[])}
def q(x): r=x.get('rotation',[0,0,0,1]); return Quaternion((r[3],r[0],r[1],r[2]))
def t(x): return Vector(x.get('translation',[0,0,0]))
# nodos del esqueleto: desde 'root'
ROOT=NAMES.index('root')
skel=[]; 
def walk(i):
    skel.append(i)
    for c in GN[i].get('children',[]): walk(c)
walk(ROOT)
# mundo en reposo (rot + pos) en marco glTF; asumimos que el padre de root (Armature) es identidad
Wq={}; Wp={}
for i in skel:
    p=par.get(i)
    if i==ROOT or p not in Wq: Wq[i]=q(GN[i]); Wp[i]=t(GN[i])
    else: Wq[i]=Wq[p]@q(GN[i]); Wp[i]=Wp[p]+Wq[p]@t(GN[i])
M={'Hips':'pelvis','Spine':'spine_01','Spine1':'spine_02','Spine2':'spine_03','Neck':'neck_01','Head':'Head'}
for s,d in (('Left','l'),('Right','r')):
    M.update({s+'Shoulder':'clavicle_'+d,s+'Arm':'upperarm_'+d,s+'ForeArm':'lowerarm_'+d,s+'Hand':'hand_'+d,s+'UpLeg':'thigh_'+d,s+'Leg':'calf_'+d,s+'Foot':'foot_'+d,s+'ToeBase':'ball_'+d})
    for f,ff in (('Thumb','thumb'),('Index','index'),('Middle','middle'),('Ring','ring'),('Pinky','pinky')):
        for k in (1,2,3): M[f'{s}Hand{f}{k}']=f'{ff}_0{k}_{d}'
C=Quaternion((1,0,0),-math.pi/2)  # Blender Z-up -> glTF Y-up
Ci=C.inverted()
def cv(v): return Vector((v.x,v.z,-v.y))
PEL=NAMES.index('pelvis')
anims=[]; blob=bytearray(); bvs=[]; accs=[]
def addacc(vals,typ,minmax=False):
    raw=struct.pack('<%df'%len(vals),*vals)
    while len(blob)%4: blob.append(0)
    bvs.append({'buffer':0,'byteOffset':len(blob),'byteLength':len(raw)}); blob.extend(raw)
    nc={'SCALAR':1,'VEC3':3,'VEC4':4}[typ]; a={'bufferView':len(bvs)-1,'componentType':5126,'count':len(vals)//nc,'type':typ}
    if minmax: a['min']=[min(vals)]; a['max']=[max(vals)]
    accs.append(a); return len(accs)-1
log=[]
def addq(vals):
    raw=struct.pack('<%dh'%len(vals),*vals)
    while len(blob)%4: blob.append(0)
    bvs.append({'buffer':0,'byteOffset':len(blob),'byteLength':len(raw)}); blob.extend(raw)
    accs.append({'bufferView':len(bvs)-1,'componentType':5122,'normalized':True,'count':len(vals)//4,'type':'VEC4'}); return len(accs)-1
for path,clip,mode in items:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try: bpy.ops.import_scene.fbx(filepath=path,automatic_bone_orientation=False)
    except Exception as e: log.append((clip,'ERR import '+str(e)[:80])); continue
    arm=[o for o in bpy.data.objects if o.type=='ARMATURE']
    if not arm or not arm[0].animation_data or not arm[0].animation_data.action: log.append((clip,'sin accion')); continue
    A=arm[0]; act=A.animation_data.action; f0,f1=act.frame_range; sc=bpy.context.scene
    srcfps=sc.render.fps/sc.render.fps_base
    pre=lambda nm: nm.split(':')[-1]
    pb={pre(p.name):p for p in A.pose.bones}
    rest={k:(A.matrix_world@A.data.bones[p.name].matrix_local) for k,p in pb.items()}
    restq={k:m.to_quaternion() for k,m in rest.items()}
    hip_rest=cv(rest['Hips'].to_translation())
    ratio=Wp[PEL].y/ max(1e-6,hip_rest.y)
    dur=min((f1-f0)/srcfps,MAXD.get(clip,16.0)); nfr=max(2,int(round(dur*FPS))+1)
    times=[]; R={}; P=[]
    tgt={M[k]:NAMES.index(M[k]) for k in M if k in pb and M[k] in NAMES}
    order=[i for i in skel if i in tgt.values()]
    inv={v:k for k,v in M.items()}
    for fi in range(nfr):
        tt=fi/FPS; fr=f0+tt*srcfps; sc.frame_set(int(math.floor(fr)),subframe=fr-math.floor(fr)); times.append(tt)
        Wt={}
        for i in order:
            src=inv[NAMES[i]]; m=A.matrix_world@pb[src].matrix
            D=m.to_quaternion()@restq[src].inverted(); D=C@D@Ci
            Wt[i]=D@Wq[i]
        for i in order:
            p=par.get(i); pq=Wt[p] if p in Wt else (Wq[p] if p in Wq else Quaternion())
            # el padre puede ser un hueso no mapeado: su mundo = mundo(abuelo)*local reposo
            if p not in Wt and p in Wq:
                gp=par.get(p); pq=(Wt[gp] if gp in Wt else Wq[gp])@q(GN[p]) if gp in Wq else Wq[p]
            L=pq.inverted()@Wt[i]; L.normalize()
            R.setdefault(i,[]).append(L)
        hp=cv((A.matrix_world@pb['Hips'].matrix).to_translation())
        P.append(hip_rest*0+ (hp-hip_rest)*ratio)
    # posición pelvis: local = rootq^-1 * (mundo - rootpos)
    if mode=='walk':
        a0,a1=P[0].copy(),P[-1].copy()
        P=[Vector((p.x-(a0.x+(a1.x-a0.x)*k/(len(P)-1)),p.y,p.z-(a0.z+(a1.z-a0.z)*k/(len(P)-1)))) for k,p in enumerate(P)]
    elif mode=='place':
        P=[Vector((p.x-P[0].x,p.y,p.z-P[0].z)) for p in P]
    rq=Wq[ROOT]; rp=Wp[ROOT]
    PL=[rq.inverted()@((Wp[PEL]+p)-rp) for p in P]
    tin=addacc(times,'SCALAR',True); ch=[]; sm=[]
    for i,qs in R.items():
        # continuidad de signo y descartar canales casi constantes
        for k in range(1,len(qs)):
            if qs[k].dot(qs[k-1])<0: qs[k].negate()
        if max(1-abs(x.dot(qs[0])) for x in qs)<1e-6 and abs(qs[0].dot(q(GN[i])))>0.99999: continue
        vals=[max(-32767,min(32767,int(round(c*32767)))) for x in qs for c in (x.x,x.y,x.z,x.w)]
        sm.append({'input':tin,'output':addq(vals),'interpolation':'LINEAR'}); ch.append({'sampler':len(sm)-1,'target':{'node':i,'path':'rotation'}})
    vals=[c for v in PL for c in (v.x,v.y,v.z)]
    sm.append({'input':tin,'output':addacc(vals,'VEC3'),'interpolation':'LINEAR'}); ch.append({'sampler':len(sm)-1,'target':{'node':PEL,'path':'translation'}})
    anims.append({'name':clip,'channels':ch,'samplers':sm}); log.append((clip,'%.2fs %dfr %dch'%(dur,nfr,len(ch))))
# salida: solo el esqueleto
idx={i:k for k,i in enumerate(skel)}
nodes=[]
for i in skel:
    x=GN[i]; nn={'name':x['name']}
    for k in ('translation','rotation','scale'):
        if k in x: nn[k]=x[k]
    ch=[idx[c] for c in x.get('children',[]) if c in idx]
    if ch: nn['children']=ch
    nodes.append(nn)
for a in anims:
    for c in a['channels']: c['target']['node']=idx[c['target']['node']]
out={'asset':{'version':'2.0','generator':'tras-sus-pasos mixretarget'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':nodes,'animations':anims,'accessors':accs,'bufferViews':bvs,'buffers':[{'byteLength':len(blob)}]}
js=json.dumps(out,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4); blob+=b'\0'*((4-len(blob)%4)%4)
glb=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(blob))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(blob),0x004E4942)+bytes(blob)
open(OUT,'wb').write(glb); print('OUT',len(glb)//1024,'KB')
for l in log: print('CLIP',*l)
