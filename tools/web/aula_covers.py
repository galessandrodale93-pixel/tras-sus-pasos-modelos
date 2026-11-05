import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B  # reconstruye el sitio y expone MOTIF/_S/_G
_S, _G = B._S, B._G
M = dict(B.MOTIF)
M['compass'] = f'<g {_S}><circle cx="200" cy="200" r="120"/><circle cx="200" cy="200" r="90"/>' + ''.join(f'<line x1="{200+90*math.cos(a*math.pi/8):.1f}" y1="{200+90*math.sin(a*math.pi/8):.1f}" x2="{200+120*math.cos(a*math.pi/8):.1f}" y2="{200+120*math.sin(a*math.pi/8):.1f}"/>' for a in range(16)) + f'</g><path d="M200 95 L 218 200 L 200 305 L 182 200Z" {_G}/><path d="M95 200 L 200 186 L 305 200 L 200 214Z" {_S}/>'
M['flames'] = f'<g {_S}>' + ''.join(f'<path d="M{x} 330 C {x-34} 280, {x-10} 240, {x} {200-k*10} C {x+10} 240, {x+34} 280, {x} 330Z"/>' for k, x in enumerate([110, 200, 290])) + f'</g><path d="M200 330 C 166 280, 190 230, 200 180 C 210 230, 234 280, 200 330Z" {_G}/>'
M['voice'] = f'<g {_S}>' + ''.join(f'<path d="M{150+i*28} {200-60-i*22} A {70+i*28} {70+i*28} 0 0 1 {150+i*28} {200+60+i*22}"/>' for i in range(5)) + f'</g><circle cx="120" cy="200" r="26" {_G}/>'
M['stars'] = f'<g fill="rgba(246,240,228,.6)">' + ''.join(f'<circle cx="{(i*73)%380+10}" cy="{(i*137)%380+10}" r="{1.2+(i%4)*.8}"/>' for i in range(46)) + f'</g><path d="M200 150 L 212 188 L 252 188 L 220 212 L 232 250 L 200 226 L 168 250 L 180 212 L 148 188 L 188 188Z" {_G}/>'
M['arches'] = f'<g {_S}>' + ''.join(f'<path d="M{x} 340 L {x} 200 A 34 34 0 0 1 {x+68} 200 L {x+68} 340"/>' for x in [62, 166, 270]) + f'<line x1="40" y1="340" x2="360" y2="340"/></g><path d="M166 200 A 34 34 0 0 1 234 200" {_G}/>'
P = {
 '09f89b8a-7288-4ca3-8c04-d3237c3bff3e': ('#16281f', '#6b5a3a', 'arches', 'Escuela', 'Escuela Ministerial 2025'),
 '194669aa-4ec3-498e-936f-1bb4a6d25350': ('#4a3a24', '#c9a46a', 'dunes', 'Escuela', 'Escuela del Desierto'),
 '4447f7e4-1e6f-4ff1-aae0-071c4a56c9ee': ('#0f1730', '#a5683a', 'dawn', 'Escuela anual', 'Escuela Maranata'),
 '55d5464d-a5c2-407b-bab9-f01a448fc1a1': ('#3a1a14', '#b0613a', 'flames', 'Curso', 'Dones, ministerios y operaciones'),
 '5e3b050b-53ed-48c3-8cf7-4ba4d99833bc': ('#14233a', '#8a6a3a', 'rays', 'Curso online', 'Los atributos de Dios'),
 '7e3f3677-22ca-4364-954b-01f6be6871c2': ('#132a33', '#4e7f78', 'compass', 'Escuela online', 'Escuela Ministerial Online'),
 '8772c6ac-0b9a-41de-b418-1c77d0a678ec': ('#10251d', '#2f6f6a', 'arcs', 'Curso online', 'Liderazgo'),
 'a371e43a-e432-4164-9e15-350e2d3d21bb': ('#3b5b45', '#b8904f', 'rings', 'Curso online', 'Carácter, identidad y propósito'),
 'af84da5e-ce2a-4f8e-98df-d90b1fc8586c': ('#2a2f4a', '#7a6aa0', 'stars', 'Programa', 'Adri'),
 'b4d88036-4e71-4bce-a071-f46a89d2329d': ('#2c1630', '#9a5a63', 'lyre', 'Carrera · CMA', 'Carrera de Adoración'),
 'd0c2ccd4-e338-45f8-8657-81a55230a4a4': ('#0c1f18', '#56704a', 'peaks', 'Carrera · CML', 'Carrera de Liderazgo'),
 'e02af77c-c23e-4ba2-a177-1dd030385bda': ('#5a2f2a', '#c08a52', 'path', 'Curso online', 'El plan de Dios'),
 'f1476369-60f5-460e-a590-830388b1cae9': ('#0f2f36', '#3f8a85', 'waves', 'Escuela', 'Escuela Intensiva de Liderazgo'),
 'f2791834-983e-4acf-a795-a62434531afb': ('#22201c', '#8c7356', 'voice', 'Taller', 'Prédicas y Presentaciones'),
}
OUT = '/tmp/claude-0/aula'
for pid, (a, b, m, lab, t) in P.items():
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:"Cormorant Garamond";font-weight:500;src:url(file:///tmp/claude-0/fonts/x_fontsource-cormorant-garamond-5.3.0/package/files/cormorant-garamond-latin-500-normal.woff2)}}@font-face{{font-family:Raleway;font-weight:600;src:url(file:///tmp/claude-0/fonts/x_fontsource-raleway-5.0.17/package/files/raleway-latin-600-normal.woff2)}}
html,body{{margin:0;width:1600px;height:900px;overflow:hidden}}
.c{{position:relative;width:1600px;height:900px;background:linear-gradient(150deg,{a},{b});color:#f6f0e4;font-family:"Cormorant Garamond",Georgia,serif;overflow:hidden}}
.c svg{{position:absolute;right:-40px;top:50px;width:900px;height:900px;opacity:.95}}
.c::after{{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,0) 60%)}}
.t{{position:absolute;left:110px;bottom:130px;z-index:1;max-width:820px}}
.l{{font:600 26px/1 Raleway,Helvetica,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#d9b878}}
.h{{font-size:108px;line-height:1.02;font-weight:500;margin-top:26px}}
.m{{position:absolute;left:110px;top:90px;z-index:1;font-size:34px;letter-spacing:.55em}}
.r{{position:absolute;left:110px;bottom:96px;width:120px;height:2px;background:#d9b878;z-index:1}}
</style></head><body><div class="c"><svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">{M[m]}</svg><div class="m">HABITAT</div><div class="t"><div class="l">{lab}</div><div class="h">{t}</div></div><div class="r"></div></div></body></html>'''
    open(f'{OUT}/{pid}.html', 'w').write(html)
json.dump({k: v[4] for k, v in P.items()}, open(f'{OUT}/titles.json', 'w'), ensure_ascii=False)
print(len(P))
