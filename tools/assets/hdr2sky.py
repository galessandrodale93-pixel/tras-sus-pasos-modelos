# convierte un HDRI equirectangular (.hdr RGBE) a cielo LDR (webp) con tono ACES, y calcula la dirección del sol
import sys,numpy as np
from PIL import Image
def read_hdr(p):
    f=open(p,'rb');
    while True:
        l=f.readline().strip()
        if not l: break
    dims=f.readline().split();H=int(dims[1]);W=int(dims[3]);img=np.zeros((H,W,4),np.uint8)
    data=f.read();pos=0
    for y in range(H):
        if data[pos]==2 and data[pos+1]==2:
            pos+=4
            for c in range(4):
                x=0;row=img[y,:,c]
                while x<W:
                    n=data[pos];pos+=1
                    if n>128:
                        n-=128;row[x:x+n]=data[pos];pos+=1;x+=n
                    else:
                        row[x:x+n]=np.frombuffer(data[pos:pos+n],np.uint8);pos+=n;x+=n
        else:
            img[y]=np.frombuffer(data[pos:pos+W*4],np.uint8).reshape(W,4);pos+=W*4
    e=img[:,:,3].astype(np.int32);m=(e>0)
    sc=np.where(m,np.ldexp(1.0,e-136),0.0)
    return img[:,:,:3].astype(np.float32)*sc[:,:,None]
def aces(x):
    a,b,c,d,e=2.51,.03,2.43,.59,.14; return np.clip((x*(a*x+b))/(x*(c*x+d)+e),0,1)
src,out,exp=sys.argv[1],sys.argv[2],float(sys.argv[3])
L=read_hdr(src);H,W,_=L.shape
lum=L@np.array([.2126,.7152,.0722],np.float32);j,i=np.unravel_index(np.argmax(lum),lum.shape)
u=(i+.5)/W;v=(j+.5)/H;phi=u*2*np.pi;th=v*np.pi
# convención de three.js para equirect: dir=(-cos(phi)... ) se resuelve en el juego; acá se guarda u,v
s=aces(L*exp);s=np.where(s<=.0031308,s*12.92,1.055*np.power(s,1/2.4)-.055)
Image.fromarray((np.clip(s,0,1)*255+.5).astype(np.uint8)).save(out,quality=88,method=6)
print(f'{out} sun_uv=({u:.4f},{v:.4f}) peak={lum.max():.1f}')
