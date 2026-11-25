import re, html, base64, os, asyncio
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__)); F='/tmp/fnt'  # fuentes: npm pack @fontsource/cinzel @fontsource/nunito-sans @fontsource/cormorant-garamond, descomprimidas en /tmp/fnt
VERSION='Versión del 24 de noviembre de 2026'
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
def font(fam,file,w,st='normal'): return f"@font-face{{font-family:'{fam}';src:url(data:font/woff2;base64,{b64(file)}) format('woff2');font-weight:{w};font-style:{st}}}"
fonts=''.join([font('Cinzel',f'{F}/fontsource-cinzel-5.3.0/files/cinzel-latin-{w}-normal.woff2',w) for w in (500,600,700)]+
  [font('Nunito Sans',f'{F}/fontsource-nunito-sans-5.3.0/files/nunito-sans-latin-{w}-{st}.woff2',w,st) for w in (300,400,600,700,800) for st in ('normal','italic')]+
  [font('Cormorant',f'{F}/cormorant/files/cormorant-garamond-latin-500-italic.woff2',500,'italic')])
def img(name):
    for ext in ('png','jpg'):
        p=f'{D}/img/{name}.{ext}'
        if os.path.exists(p): return f"data:image/{'png' if ext=='png' else 'jpeg'};base64,{b64(p)}"
    raise SystemExit('falta imagen '+name)
def inl(t):
    t=html.escape(t,quote=False)
    # entrada en negrita: «Algo:» o «Algo.» corto al principio, si sigue texto
    m=re.match(r'^([^:.!?]{2,38}?[:.])(\s+\S.*)$',t)
    if m and len(m.group(1).split())<=6 and not re.match(r'^\d',m.group(1)): t='<b>'+m.group(1)+'</b>'+m.group(2)
    t=re.sub(r'(Kids|Hero) \((\d+ a \d+ años)\)',r'<b>\1</b> (\2)',t)
    return t
sec=[]; cur=None
for line in open(f'{D}/guia.md').read().split('\n'):
    if line.startswith('# '): cur={'t':line[2:].strip(),'L':[]}; sec.append(cur)
    elif cur is not None: cur['L'].append(line)
NUEVOS={'Tu primer camino','Los caminos de la historia','Los pueblos que crecen','Volver cada día','Amigos, regalos y equipos'}
def body(L):
    out=[]; i=0
    while i<len(L):
        l=L[i]
        if not l.strip(): i+=1; continue
        if l.startswith('|'):
            rows=[]
            while i<len(L) and L[i].startswith('|'): rows.append([c.strip() for c in L[i][1:].split(' | ')]); i+=1
            h=rows[0]; n=len(h)
            t='<table><thead><tr>'+''.join(f'<th>{html.escape(c)}</th>' for c in h)+'</tr></thead><tbody>'
            for r in rows[1:]: t+='<tr>'+''.join(f'<td>{html.escape(c)}</td>' for c in (r+['']*n)[:n])+'</tr>'
            out.append(t+'</tbody></table>'); continue
        if l.startswith('- '):
            items=[]
            while i<len(L) and L[i].startswith('- '): items.append(L[i][2:]); i+=1
            out.append('<ul>'+''.join(f'<li>{inl(x)}</li>' for x in items)+'</ul>'); continue
        if re.match(r'^\d+\. ',l):
            items=[]
            while i<len(L) and re.match(r'^\d+\. ',L[i]): items.append(re.sub(r'^\d+\. ','',L[i])); i+=1
            out.append('<ol>'+''.join(f'<li>{inl(x)}</li>' for x in items)+'</ol>'); continue
        if l.startswith('> '):
            t=l[2:]
            if t.startswith('«'): out.append(f'<blockquote class="cita">{html.escape(t)}</blockquote>')
            else: out.append(f'<div class="nota">{inl(t)}</div>')
            i+=1; continue
        if l.startswith('## '): out.append(f'<h3>{html.escape(l[3:])}</h3>'); i+=1; continue
        if l.startswith('!img '):
            n,cap=l[5:].split(' | ',1); out.append(f'<figure><img src="{img(n.strip())}"><figcaption>{html.escape(cap)}</figcaption></figure>'); i+=1; continue
        out.append(f'<p>{inl(l)}</p>'); i+=1
    return ''.join(out)
toc=''.join(f'<li><span>{k+1:02d}</span>{html.escape(s["t"])}{" <em>nuevo</em>" if s["t"] in NUEVOS else ""}</li>' for k,s in enumerate(sec))
pages=''.join(f'<section class="cap"><div class="num">{k+1:02d}{" · <em>nuevo</em>" if s["t"] in NUEVOS else ""}</div><h2>{html.escape(s["t"])}</h2>{body(s["L"])}</section>' for k,s in enumerate(sec))
css=fonts+"""
@page{size:A4;margin:16mm 17mm 18mm}
*{box-sizing:border-box}
body{margin:0;font-family:'Nunito Sans',sans-serif;font-size:9.6pt;line-height:1.55;color:#2b2622}
.portada{page-break-after:always;height:263mm;margin:-16mm -17mm 0;padding:0;background:#16120e;color:#f2e7d0;position:relative;overflow:hidden}
.portada .bg{position:absolute;inset:0;height:80mm;background:url(PORTADA) center/cover;opacity:.85}
.portada .bg:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,18,14,.1),#16120e)}
.portada .in{position:relative;padding:54mm 18mm 0}
.portada .kick{letter-spacing:.32em;font-size:7.4pt;color:#d6b25e;font-weight:700}
.portada h1{font-family:Cinzel;font-weight:600;font-size:30pt;color:#e9c46a;margin:4mm 0 3mm;line-height:1.1}
.portada .sub{font-family:Cormorant;font-style:italic;font-size:13.5pt;line-height:1.35;color:#e8dcc4;max-width:150mm}
.portada ol{columns:2;column-gap:10mm;list-style:none;padding:0;margin:7mm 0 0;font-size:7.1pt}
.portada li{display:flex;gap:4mm;padding:.55mm 0;line-height:1.25;border-bottom:.2mm solid rgba(233,196,106,.18);break-inside:avoid}
.portada li span{color:#e9c46a;font-weight:800;min-width:6mm}
.portada li em{font-style:normal;color:#16120e;background:#e9c46a;border-radius:2mm;padding:0 1.4mm;font-size:6pt;font-weight:800;margin-left:1.5mm;align-self:center}
.portada .pie{position:absolute;left:18mm;right:18mm;bottom:10mm;display:flex;justify-content:space-between;letter-spacing:.25em;font-size:6.6pt;color:#d6b25e;font-weight:700}
.cap{page-break-before:always}
.num{color:#c08a2b;font-weight:800;font-size:8pt;letter-spacing:.08em}
.num em{font-style:normal;background:#f3e7c9;color:#8a5a12;border-radius:2mm;padding:0 1.6mm}
h2{font-family:Cinzel;font-weight:700;font-variant:small-caps;font-size:17pt;margin:1mm 0 4mm;color:#1f1b17;letter-spacing:.01em}
h3{font-family:Cinzel;font-weight:700;font-variant:small-caps;font-size:10.5pt;margin:6mm 0 2mm}
p{margin:0 0 2.6mm}
ul,ol{margin:0 0 3mm;padding-left:6mm} li{margin:0 0 1.4mm}
b{font-weight:800}
table{width:100%;border-collapse:collapse;margin:2mm 0 4mm;font-size:8.4pt;page-break-inside:auto}
tr{page-break-inside:avoid}
th{background:#f1e6cc;text-align:left;padding:2mm 2.6mm;font-weight:800}
td{padding:2mm 2.6mm;border-bottom:.25mm solid #e8dfcf;vertical-align:top}
.nota{background:#fbf5e8;border:.3mm solid #ecd9ad;border-left:1.2mm solid #d8a13d;border-radius:1.5mm;padding:3mm 4mm;margin:4mm 0;font-size:9pt}
.cita{font-family:Cormorant;font-style:italic;font-size:12.5pt;margin:3mm 0 4mm;padding-left:4mm;border-left:.8mm solid #d8a13d;color:#3c332b}
figure{margin:3mm 0 4mm;page-break-inside:avoid} figure img{width:100%;max-height:78mm;object-fit:cover;border-radius:2mm;display:block}
figcaption{font-size:7.8pt;color:#7a6f63;margin-top:1.4mm;font-style:italic}
"""
css=css.replace('PORTADA',img('portada'))
doc=f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="portada"><div class="bg"></div><div class="in"><div class="kick">KIDS &amp; HERO · TRAS SUS PASOS</div><h1>Guía completa del juego</h1>
<div class="sub">Todo lo que hay que saber para jugar, enseñar y probar Tras sus pasos: controles, mundo y tierras de afuera, oficios, construcción, álbum y huerta de Kids, etapas vivas, caminos de la historia, amigos y equipos, frutos del Espíritu, prendas, lugares secretos, desafíos y cuánto dura la cursada.</div>
<ol>{toc}</ol></div><div class="pie"><span>HABITAT · CENTRO DE FORMACIÓN MINISTERIAL</span><span>{VERSION.upper()}</span></div></div>
{pages}</body></html>"""
open(f'{D}/guia.html','w').write(doc)
async def pdf():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(); await pg.goto('file://'+D+'/guia.html'); await pg.wait_for_timeout(800)
        foot='<div style="width:100%;font-family:sans-serif;font-size:7px;color:#9a8f82;padding:0 17mm;display:flex;justify-content:space-between"><span>Kids &amp; Hero · Guía completa del juego</span><span class="pageNumber"></span></div>'
        await pg.pdf(path=f'{D}/kids-hero-guia-completa.pdf',format='A4',print_background=True,display_header_footer=True,header_template='<span></span>',footer_template=foot,margin={'top':'16mm','bottom':'18mm','left':'17mm','right':'17mm'})
        await b.close()
asyncio.run(pdf())
print('ok', len(sec))
