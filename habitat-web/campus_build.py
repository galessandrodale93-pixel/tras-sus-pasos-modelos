#!/usr/bin/env python3
"""Campus Habitat (prototipo): Mis cursos, reproductor de clases, perfil e ingreso.
Usa datos reales de un programa (Los atributos de Dios) leídos del sitio actual."""
import os, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

W = 'https://static.wixstatic.com/media/'
COV = {
    'atributos': ('Los atributos de Dios', '43ca3b_be6b10cf02b74221b884495e0c0f03cd~mv2.jpg', 'Curso online'),
    'caracter': ('Carácter, identidad y propósito', '43ca3b_42ba2eb465294789a25d05a88c677cc4~mv2.jpg', 'Curso online'),
    'maranata': ('Escuela Maranata', '43ca3b_7b3fe0d3404b4c269c5c9b1bce87d2ca~mv2.jpg', 'Escuela anual'),
    'adoracion': ('Carrera de Adoración', '43ca3b_ee131f8d5f1846b4808690276d369b35~mv2.jpg', 'Carrera · CMA'),
    'liderazgo': ('Liderazgo', '43ca3b_d4dfb3e1124b48ca962f701714c8d2fe~mv2.jpg', 'Curso online'),
    'plan': ('El plan de Dios', '43ca3b_38407e07a36c4f59b1338ba1ca9537c2~mv2.jpg', 'Curso online'),
    'intensiva': ('Escuela Intensiva de Liderazgo', '43ca3b_638e22dd5be64c46a38c0f4d576fa4b6~mv2.jpg', 'Escuela'),
    'desierto': ('Escuela del Desierto', '43ca3b_56d2b89cf2ad416c91137a75aafeeb68~mv2.jpg', 'Escuela'),
    'dones': ('Dones, ministerios y operaciones', '43ca3b_6a11e886a2364f2dba1dfdd32f5dccf9~mv2.jpg', 'Curso'),
    'carreralid': ('Carrera de Liderazgo', '43ca3b_7701e58b26ce4707a029eeb417bc7002~mv2.jpg', 'Carrera · CML'),
    'emo': ('Escuela Ministerial Online', '43ca3b_a81ca8cf5d684a80a99677cf34726d84~mv2.jpg', 'Escuela online'),
    'predicas': ('Prédicas y Presentaciones', '43ca3b_a709704ae4a84d57bd2575c290124a33~mv2.jpg', 'Taller'),
}
def cov(k, w=800, h=450):
    return f'{W}{COV[k][1]}/v1/fill/w_{w},h_{h},al_c,q_82,enc_auto/c.jpg'

V = 'https://video.wixstatic.com/video/{}/720p/mp4/file.mp4'
COURSE = {
    'id': 'atributos', 'title': 'Los atributos de Dios', 'cover': cov('atributos', 1600, 900),
    'details': 'En este programa estaremos viendo los atributos de Dios y cómo los mismos nos edifican para un crecimiento integral y una amplitud en cuanto al conocimiento de Su persona.',
    'sections': [
        {'title': 'La santidad y el temor de Dios', 'steps': [
            {'id': 's1', 't': 'Material en PDF completo', 'type': 'pdf', 'file': 'https://static.wixstatic.com/ugd/43ca3b_0b8d765f40104bd8b7b8b968779b754a.pdf', 'fname': 'Madurez Espiritual II - Cápsula 1 · Material.pdf', 'size': '22,8 MB'},
            {'id': 's2', 't': 'Parte 1', 'type': 'video', 'src': V.format('43ca3b_4a260105df2f429da96e1001a3ee9d91'), 'min': 24},
            {'id': 's3', 't': 'Parte 2', 'type': 'video', 'src': V.format('43ca3b_549ccfdec84745d6b3b037d1f88960c3'), 'min': 24},
            {'id': 's4', 't': 'Parte 3', 'type': 'video', 'src': V.format('43ca3b_c4a90d6e12ac42a7b6303872efe2f5df'), 'min': 14},
        ]},
        {'title': 'El amor y la gracia de Dios', 'steps': [
            {'id': 's5', 't': 'Material en PDF completo', 'type': 'pdf', 'file': '', 'fname': 'Material de la sección', 'size': ''},
            {'id': 's6', 't': 'Parte 1', 'type': 'video', 'src': '', 'min': 32},
            {'id': 's7', 't': 'Parte 2', 'type': 'video', 'src': '', 'min': 31},
            {'id': 's8', 't': 'Parte 3', 'type': 'video', 'src': '', 'min': 35},
        ]},
    ],
}
MINE = [('atributos', 38, 'La santidad y el temor de Dios · Parte 2'), ('maranata', 64, 'Los siete sellos · Clase 12'), ('adoracion', 56, 'Adoración en el tabernáculo · Clase 5')]
MORE = ['caracter', 'plan', 'liderazgo', 'intensiva', 'desierto', 'dones']

CSS = '''<link rel="stylesheet" href="/assets/campus.css">'''
BADGE = '<div class="proto">Prototipo del Campus · los datos de progreso son de ejemplo</div>'


def page(fn, title, body, js=''):
    html = B.head(title, 'Campus Habitat: tus cursos, clases y progreso.', fn).replace('</head>', CSS + '\n</head>')
    html = html.replace('<body>', '<body data-solid="1" class="campus">')
    html += ('' if fn == 'ingresar.html' else BADGE) + body + B.FOOT + js + '</body>\n</html>\n'
    open(os.path.join(B.OUT, fn), 'w', encoding='utf-8').write(html)


# ---------- Mis cursos ----------
cards = ''.join(f'''<a class="cc rv" href="/clase.html"><div class="cv"><img loading="lazy" src="{cov(k)}" alt=""><span class="pc">{p}%</span></div>
<div class="cb"><span class="ck">{COV[k][2]}</span><b>{COV[k][0]}</b><div class="bar"><i style="width:{p}%"></i></div><span class="nx">Seguís con: {nx}</span><span class="go">Continuar →</span></div></a>''' for k, p, nx in MINE)
more = ''.join(f'''<a class="cm rv" href="/formacion.html"><img loading="lazy" src="{cov(k, 600, 338)}" alt=""><span><small>{COV[k][2]}</small><b>{COV[k][0]}</b></span></a>''' for k in MORE)
campus = f'''
<section class="cx-hero"><div class="wrap">
  <div class="hi rv"><span class="kick">Campus Habitat</span><h1>Hola, <em>Gui</em></h1><p>Qué bueno verte de nuevo. Retomá donde lo dejaste.</p></div>
  <a class="resume rv" href="/clase.html">
    <div class="rimg"><img src="{cov('atributos', 900, 506)}" alt=""><span class="play" aria-hidden="true">▶</span></div>
    <div class="rtx"><span class="kick">Continuar</span><b>La santidad y el temor de Dios · Parte 2</b><small>Los atributos de Dios · quedan 14 min</small><div class="bar"><i style="width:38%"></i></div></div>
  </a>
</div></section>
<section class="cx-stats"><div class="wrap">
  <div class="st rv"><b>3</b><span>cursos en curso</span></div>
  <div class="st rv"><b>27</b><span>clases vistas</span></div>
  <div class="st rv"><b>14 h</b><span>de formación</span></div>
  <div class="st rv"><b>1</b><span>certificado</span></div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Mis cursos</h2><a href="/perfil.html">Ver mi progreso →</a></div>
  <div class="cx-grid">{cards}</div>
</div></section>
<section class="cx-sec alt"><div class="wrap">
  <div class="cx-h"><h2>Seguí creciendo</h2><a href="/formacion.html">Toda la formación →</a></div>
  <div class="cx-more">{more}</div>
</div></section>
'''
campus_js = '''<script src="/assets/auth.js"></script>
<script>
(async function(){var A=window.HabitatAuth;if(!A.loggedIn())return;
try{var r=await A.api('GET','/members/v1/members/my?fieldsets=FULL');var m=r.member||{};var c=m.contact||{};var n=c.firstName||(m.profile&&m.profile.nickname)||'';
 var h=document.querySelector('.cx-hero h1 em');if(h&&n)h.textContent=n;
 var hi=document.querySelector('.cx-hero .hi');if(hi){var b=document.createElement('button');b.type='button';b.className='out';b.textContent='Cerrar sesión';b.onclick=function(){A.logout();};hi.appendChild(b);}
 window.__member=m;
}catch(e){console.log('campus',e.status,e.body);}
})();
</script>'''
page('campus.html', 'Campus · Habitat', campus, campus_js)

# ---------- Reproductor de clases ----------
data = json.dumps(COURSE, ensure_ascii=False)
clase = f'''
<div class="pl">
  <aside class="pl-side" id="side">
    <div class="ps-top">
      <a class="back" href="/campus.html">← Mis cursos</a>
      <h2>{COURSE['title']}</h2>
      <div class="ps-prog"><div class="bar"><i id="pbar"></i></div><span id="ptxt"></span></div>
    </div>
    <nav class="ps-list" id="list" aria-label="Clases del curso"></nav>
  </aside>
  <main class="pl-main">
    <div class="pm-head"><button class="tg-side" id="tgs" type="button">☰ Clases</button><span class="crumb" id="crumb"></span></div>
    <div class="stage" id="stage"></div>
    <div class="pm-bar">
      <button class="btn-s" id="prev" type="button">← Anterior</button>
      <button class="btn-done" id="done" type="button">✓ Marcar como vista</button>
      <button class="btn-s" id="next" type="button">Siguiente →</button>
    </div>
    <div class="pm-tabs" role="tablist"><button class="on" data-t="desc" type="button">Sobre la clase</button><button data-t="mat" type="button">Materiales</button><button data-t="notes" type="button">Mis notas</button></div>
    <div class="pm-pane" id="pane"></div>
  </main>
</div>
'''
js = '''<script>
(function(){
var C=''' + data + ''';
var steps=[];C.sections.forEach(function(s,si){s.steps.forEach(function(x){x.sec=s.title;x.si=si;steps.push(x);});});
var done={};try{done=JSON.parse(localStorage.getItem('campus:done')||'{"s1":1}')}catch(e){done={s1:1};}
var cur=1,tab='desc';
function save(){try{localStorage.setItem('campus:done',JSON.stringify(done))}catch(e){}}
function ic(x){return x.type==='video'?'▶':'⎙';}
function list(){var h='';C.sections.forEach(function(s,si){var n=s.steps.filter(function(x){return done[x.id]}).length;
h+='<div class="sec"><div class="sh"><b>'+s.title+'</b><small>'+n+' de '+s.steps.length+' clases</small></div>';
s.steps.forEach(function(x){var i=steps.indexOf(x);h+='<button type="button" class="it'+(i===cur?' on':'')+(done[x.id]?' ok':'')+'" data-i="'+i+'"><span class="ico">'+(done[x.id]?'✓':ic(x))+'</span><span class="tt">'+x.t+'</span><small>'+(x.type==='video'?x.min+' min':'PDF')+'</small></button>';});h+='</div>';});
document.getElementById('list').innerHTML=h;
var tot=steps.length,d=steps.filter(function(x){return done[x.id]}).length,p=Math.round(d*100/tot);
document.getElementById('pbar').style.width=p+'%';document.getElementById('ptxt').textContent=p+'% completado · '+d+' de '+tot+' clases';}
function stage(){var x=steps[cur],h='';
if(x.type==='video'){h=x.src?'<video controls playsinline preload="metadata" poster="'+C.cover+'" src="'+x.src+'"></video>':'<div class="ph"><img src="'+C.cover+'" alt=""><span>Video de ejemplo del prototipo</span></div>';}
else{h='<div class="doc"><div class="pdf">PDF</div><div><b>'+x.fname+'</b><small>'+(x.size||'')+'</small></div>'+(x.file?'<a class="btn btn-gold" href="'+x.file+'" target="_blank" rel="noopener">Abrir material</a>':'<span class="soonx">Disponible en el Campus</span>')+'</div>';}
document.getElementById('stage').innerHTML=h;
document.getElementById('crumb').textContent=x.sec+' · '+x.t;
var b=document.getElementById('done');b.classList.toggle('is',!!done[x.id]);b.textContent=done[x.id]?'✓ Vista':'✓ Marcar como vista';
document.getElementById('prev').disabled=cur===0;document.getElementById('next').disabled=cur===steps.length-1;pane();list();}
function pane(){var x=steps[cur],h='';
if(tab==='desc')h='<h3>'+x.sec+' · '+x.t+'</h3><p>'+C.details+'</p>';
if(tab==='mat')h='<div class="mats">'+steps.filter(function(y){return y.type==='pdf'}).map(function(y){return '<div class="mt"><span class="pdf">PDF</span><div><b>'+y.fname+'</b><small>'+y.sec+'</small></div>'+(y.file?'<a href="'+y.file+'" target="_blank" rel="noopener">Descargar</a>':'')+'</div>';}).join('')+'</div>';
if(tab==='notes'){var v='';try{v=localStorage.getItem('campus:n:'+x.id)||''}catch(e){}h='<textarea id="nt" placeholder="Escribí lo que Dios te habló en esta clase…">'+v.replace(/</g,'&lt;')+'</textarea><small class="hint">Tus notas se guardan solo para vos.</small>';}
var p=document.getElementById('pane');p.innerHTML=h;var t=document.getElementById('nt');if(t)t.addEventListener('input',function(){try{localStorage.setItem('campus:n:'+x.id,t.value)}catch(e){}});}
document.getElementById('list').addEventListener('click',function(e){var b=e.target.closest('.it');if(!b)return;cur=+b.dataset.i;stage();if(innerWidth<900)document.body.classList.remove('side-open');window.scrollTo({top:0,behavior:'smooth'});});
document.getElementById('prev').onclick=function(){if(cur>0){cur--;stage();}};
document.getElementById('next').onclick=function(){if(cur<steps.length-1){cur++;stage();}};
document.getElementById('done').onclick=function(){var x=steps[cur];if(done[x.id])delete done[x.id];else done[x.id]=1;save();stage();};
document.getElementById('tgs').onclick=function(){document.body.classList.toggle('side-open');};
document.querySelectorAll('.pm-tabs button').forEach(function(b){b.onclick=function(){tab=b.dataset.t;document.querySelectorAll('.pm-tabs button').forEach(function(z){z.classList.toggle('on',z===b)});pane();};});
stage();
})();
</script>
'''
page('clase.html', 'Los atributos de Dios · Campus Habitat', clase, js)

# ---------- Perfil y progreso ----------
import math
def seal(lbl, n=24):
    pts = []
    for i in range(n * 2):
        r = 56 if i % 2 == 0 else 51
        t = math.pi * i / n
        pts.append(f'{60 + r * math.cos(t):.1f},{60 + r * math.sin(t):.1f}')
    return (f'<svg viewBox="0 0 120 120" aria-hidden="true"><polygon class="s0" points="{" ".join(pts)}"/>'
            f'<circle cx="60" cy="60" r="43" class="s1"/><circle cx="60" cy="60" r="38" class="s2"/>'
            f'<text x="60" y="68" text-anchor="middle">{lbl}</text></svg>')


def trail(items):
    return ''.join(f'<li class="{cl}"><span class="dot"></span><b>{t}</b><small>{d}</small></li>' for cl, t, d in items)


ST = {'ok': 'Aprobada', 'cur': 'Cursando', 'pen': 'Pendiente'}


def mat(n, st, pc):
    extra = f'<div class="bar"><i style="width:{pc}%"></i></div>' if st == 'cur' else ''
    ic = {'ok': '✓', 'cur': '◔', 'pen': ''}[st]
    lab = ST[st] + (f' · {pc}%' if st == 'cur' else '')
    return f'<li class="m {st}"><span class="mi">{ic}</span><div><b>{n}</b><small>{lab}</small>{extra}</div></li>'


# --- Recorrido general en Habitat (suma cursos, escuelas y carreras)
GEN = [('done', 'Primer curso', 'Liderazgo · 2025'), ('done', 'Primera escuela', 'Escuela del Desierto · 2025'),
       ('now', 'Carrera en curso', 'Carrera de Adoración'), ('', 'Egresado', 'Al terminar una carrera')]
HRS = 132
WEEKS = [3, 2, 0, 1, 2, 4, 2, 3, 1, 2, 3, 2]
strip = ''.join(f'<i class="w{min(v, 3)}" title="{v} clases"></i>' for v in WEEKS)

# --- Carrera (2 años · 4 cuatrimestres) · datos de ejemplo
CAR = [
    ('1.er año', [('1.er cuatrimestre', [('Fundamentos de la adoración', 'ok', 100), ('Los atributos de Dios', 'ok', 100), ('Vida devocional', 'ok', 100)]),
                  ('2.º cuatrimestre', [('Carácter, identidad y propósito', 'ok', 100), ('El plan de Dios', 'ok', 100), ('Música y ministerio I', 'ok', 100)])]),
    ('2.º año', [('3.er cuatrimestre', [('Adoración en el tabernáculo', 'cur', 40), ('Dones, ministerios y operaciones', 'ok', 100), ('Música y ministerio II', 'cur', 25)]),
                 ('4.º cuatrimestre', [('Liderazgo de equipos de alabanza', 'pen', 0), ('Prédicas y Presentaciones', 'pen', 0), ('Práctica ministerial', 'pen', 0)])]),
]
ALL = [x for _, cs in CAR for _, ms in cs for x in ms]
TOT, APR = len(ALL), sum(1 for x in ALL if x[1] == 'ok')
CPCT = round(sum(x[2] for x in ALL) / TOT)
ctrail = trail([('done', 'Ingreso', 'Marzo 2025'), ('done', '1.er cuatrimestre', 'Aprobado'), ('done', '2.º cuatrimestre', 'Aprobado'),
                ('now', '3.er cuatrimestre', 'En curso'), ('', '4.º cuatrimestre', 'Próximo'), ('', 'Egreso', 'Diploma de la carrera')])


def year(y, cs, now):
    cols = ''.join(f'<div class="cu"><span class="cu-h">{c}{"<em>Estás acá</em>" if now and i == 0 else ""}</span><ul>{"".join(mat(*m) for m in ms)}</ul></div>' for i, (c, ms) in enumerate(cs))
    return f'<div class="yr rv{" now" if now else ""}"><div class="yr-h"><b>{y}</b></div><div class="yr-c">{cols}</div></div>'


years = ''.join(year(y, cs, i == 1) for i, (y, cs) in enumerate(CAR))

# --- Escuela (1 año · módulos) · datos de ejemplo
MOD = [('Módulo 1', 'Introducción a los últimos tiempos', 100), ('Módulo 2', 'Daniel y las setenta semanas', 100),
       ('Módulo 3', 'Los siete sellos', 56), ('Módulo 4', 'Las trompetas y las copas', 0)]
mods = ''.join(f'<div class="md rv{" ok" if p == 100 else (" cur" if p else "")}"><span class="kick">{n}</span><b>{t}</b><div class="bar"><i style="width:{p}%"></i></div><small>{"Completo" if p == 100 else (str(p) + "%" if p else "Pendiente")}</small></div>' for n, t, p in MOD)
EPCT = round(sum(p for *_, p in MOD) / len(MOD))

# --- Cursos
CUR = [('atributos', 38), ('liderazgo', 100), ('caracter', 100)]
rings = ''.join(f'<div class="rg rv"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="r0"/><circle cx="60" cy="60" r="52" class="r1" style="stroke-dasharray:{p*3.267:.0f} 327"/></svg><b>{"✓" if p == 100 else str(p) + "%"}</b><span>{COV[k][0]}</span><small>{"Completo" if p == 100 else "En curso"}</small></div>' for k, p in CUR)

DIST = [('I', 'Primer curso completado', 'Liderazgo · 2025', True), ('✦', 'Primera escuela completada', 'Escuela del Desierto · 2025', True),
        ('50 h', '50 horas de formación', 'Agosto 2025', True), ('100 h', '100 horas de formación', 'Marzo 2026', True),
        ('1.º', 'Primer año de carrera', 'Carrera de Adoración', True), ('6', 'Seis semanas seguidas', 'Viste clases cada semana', True),
        ('200 h', '200 horas de formación', f'Te faltan {200 - HRS} h', False), ('★', 'Egresado', 'Al terminar la carrera', False)]
dist = ''.join(f'<li class="sl rv{"" if on else " off"}">{seal(l)}<b>{t}</b><small>{d}</small></li>' for l, t, d, on in DIST)
NDIST = sum(1 for d in DIST if d[3])
S1, S2 = seal('I'), seal('✦')

perfil = f'''
<section class="pf-hero"><div class="wrap pf-in">
  <div class="av rv">G</div>
  <div class="rv"><span class="kick">Mi perfil</span><h1>Guido Dalé</h1><p>Alumno de Habitat desde 2025 · <span class="reg">Alumno regular</span></p></div>
  <a class="btn btn-line rv" href="#ajustes">Editar perfil</a>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Mi recorrido en Habitat</h2><span class="sub">Cursos · Escuelas · Carreras</span></div>
  <div class="tr-card rv">
    <ol class="tr-path p4">{trail(GEN)}</ol>
    <div class="tr-nums">
      <div><b>{HRS}<small> h</small></b><span>de formación acumuladas entre todos tus programas</span></div>
      <div><b>2<small> cursos</small></b><span>completados</span></div>
      <div><b>1<small> escuela</small></b><span>completada</span></div>
      <div class="cons"><span>Constancia · últimas 12 semanas</span><div class="strip">{strip}</div></div>
    </div>
  </div>
</div></section>
<section class="cx-sec alt"><div class="wrap">
  <div class="cx-h"><h2>Carrera de Adoración</h2><span class="sub">Carrera · 2 años</span></div>
  <div class="tr-card rv">
    <ol class="tr-path p6">{ctrail}</ol>
    <div class="tr-nums n3">
      <div><b>{APR}<small> de {TOT}</small></b><span>materias aprobadas</span></div>
      <div><b>{CPCT}%</b><span>de la carrera completada</span><div class="bar"><i style="width:{CPCT}%"></i></div></div>
      <div><b>2.º<small> año</small></b><span>3.er cuatrimestre en curso</span></div>
    </div>
  </div>
  <div class="cx-h sm"><h3>Plan de estudios</h3><div class="lgd"><span class="ok">Aprobada</span><span class="cur">Cursando</span><span class="pen">Pendiente</span></div></div>
  <div class="yrs">{years}</div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Escuela Maranata</h2><span class="sub">Escuela · 1 año · {EPCT}% completada</span></div>
  <div class="mds">{mods}</div>
</div></section>
<section class="cx-sec alt"><div class="wrap">
  <div class="cx-h"><h2>Cursos</h2><span class="sub">Programas cortos</span></div>
  <div class="rings">{rings}</div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="cx-h"><h2>Distinciones</h2><span class="sub">{NDIST} de {len(DIST)} obtenidas</span></div>
  <ul class="seals">{dist}</ul>
</div></section>
<section class="cx-sec alt"><div class="wrap">
  <div class="cx-h"><h2>Certificados</h2></div>
  <div class="dips">
    <div class="dip rv"><div class="dp-in"><span class="kick">Certificado de curso</span><b>Liderazgo</b><small>Curso online · 2025</small><span class="dp-seal">{S1}</span></div><button class="btn-line-d" type="button" disabled>Descargar PDF</button></div>
    <div class="dip rv"><div class="dp-in"><span class="kick">Certificado de escuela</span><b>Escuela del Desierto</b><small>Escuela anual · 2025</small><span class="dp-seal">{S2}</span></div><button class="btn-line-d" type="button" disabled>Descargar PDF</button></div>
    <div class="dip rv lock"><div class="dp-in"><span class="kick">Diploma</span><b>Carrera de Adoración</b><small>Se habilita al aprobar las {TOT} materias</small></div></div>
  </div>
</div></section>
<section class="cx-sec"><div class="wrap">
  <div class="panel rv"><h3>Actividad reciente</h3>
    <ol class="tl"><li><b>Viste</b> La santidad y el temor de Dios · Parte 1<small>Hace 2 días</small></li>
    <li><b>Descargaste</b> el material de La santidad y el temor de Dios<small>Hace 2 días</small></li>
    <li><b>Completaste</b> Los siete sellos · Clase 11<small>Hace 5 días</small></li>
    <li><b>Obtuviste</b> la distinción Primer año de carrera<small>Diciembre 2025</small></li></ol></div>
</div></section>
<section class="cx-sec alt" id="ajustes"><div class="wrap">
  <div class="panel rv"><h3>Mis datos</h3><div class="fx two-col">
    <div class="row"><label>Nombre</label><input type="text" value="Guido" disabled></div>
    <div class="row"><label>Apellido</label><input type="text" value="Dalé" disabled></div>
    <div class="row"><label>Email</label><input type="email" value="tu correo de siempre" disabled></div>
    <div class="row"><label>Iglesia</label><input type="text" value="" placeholder="¿A qué iglesia vas?" disabled></div>
  </div><p class="hint">En el Campus real vas a poder editar tus datos y tu foto desde acá.</p></div>
</div></section>
'''
page('perfil.html', 'Mi perfil · Campus Habitat', perfil)

# ---------- Ingreso ----------
ingresar = f'''
<section class="lg-wrap"><div class="lg-bg" style="background-image:url('{B.im('ocean', 1800)}')"></div>
  <div class="lg-card rv">
    <img class="lg-logo" src="{B.im('logo', 160, 160)}" alt="Habitat">
    <h1>Campus Habitat</h1><p>Entrá con la misma cuenta que usás hoy para tus cursos.</p>
    <button class="g-btn" type="button" id="gBtn"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Continuar con Google</button>
    <div class="or"><span>o con tu email</span></div>
    <form class="fx" id="lgForm" novalidate>
      <div class="row"><label for="lgEmail">Email</label><input id="lgEmail" type="email" autocomplete="email" placeholder="tu@email.com" required></div>
      <div class="row" id="pwRow"><label for="lgPw">Contraseña</label><input id="lgPw" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
      <p class="lg-msg" id="lgMsg" role="status" aria-live="polite"></p>
      <button class="btn btn-gold" type="submit" id="lgGo">Entrar al Campus</button>
    </form>
    <button class="fg" type="button" id="lgForgot">¿Olvidaste tu contraseña?</button>
  </div>
</section>
'''
ingresar_js = """<script src="/assets/auth.js"></script>
<script>
(function(){
var A=window.HabitatAuth,f=document.getElementById('lgForm'),m=document.getElementById('lgMsg'),go=document.getElementById('lgGo'),fg=document.getElementById('lgForgot'),pw=document.getElementById('pwRow'),rec=false;
function msg(t,ok){m.textContent=t||'';m.className='lg-msg'+(ok?' ok':'');}
function busy(b,t){go.disabled=b;go.textContent=b?'Entrando…':(t||'Entrar al Campus');}
A.callback().then(function(done){if(done)location.replace('/campus.html');else if(A.loggedIn())location.replace('/campus.html');}).catch(function(){msg('No pudimos completar el ingreso. Probá de nuevo.');});
document.getElementById('gBtn').onclick=function(){msg('');A.loginGoogle().catch(function(){msg('No pudimos abrir Google. Probá de nuevo en un momento.');});};
fg.onclick=function(){rec=!rec;pw.hidden=rec;go.textContent=rec?'Enviarme el link':'Entrar al Campus';fg.textContent=rec?'Volver a ingresar':'¿Olvidaste tu contraseña?';msg(rec?'Te mandamos un mail con un link para crear una contraseña nueva.':'',rec);};
f.onsubmit=async function(e){e.preventDefault();var em=document.getElementById('lgEmail').value.trim(),p=document.getElementById('lgPw').value;
 if(!/^\\S+@\\S+\\.\\S+$/.test(em)){msg('Revisá el email.');return;}
 if(rec){busy(true);try{await A.recover(em);msg('Listo. Revisá tu correo (y la carpeta de spam).',true);}catch(x){msg('No pudimos enviar el mail. Revisá el email.');}busy(false,'Enviarme el link');return;}
 if(!p){msg('Escribí tu contraseña.');return;}
 busy(true);msg('');
 try{var st=await A.loginEmail(em,p);if(st==='REQUIRE_OWNER_APPROVAL')msg('Tu cuenta está esperando aprobación de Habitat.');else if(st==='REQUIRE_EMAIL_VERIFICATION')msg('Tenés que verificar tu email. Te mandamos un código.');else if(st)msg('No pudimos ingresar ('+st+').');busy(false);}
 catch(x){var t=JSON.stringify(x.body||{});msg(/password|credential|not.?found|-19976|-19999|19958/i.test(t)?'El email o la contraseña no coinciden.':'No pudimos ingresar. Probá de nuevo en un momento.');busy(false);}
};
})();
</script>
"""
page('ingresar.html', 'Ingresar · Campus Habitat', ingresar, ingresar_js)
print('campus ok')
