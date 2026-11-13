#!/usr/bin/env python3
"""Genera las páginas del nuevo sitio de Habitat en out/."""
import os

OUT = os.path.join(os.path.dirname(__file__), 'out')
OLD = 'https://www.habitat-cfm.org'
CAMPUS = OLD  # luego: https://campus.habitat-cfm.org
FV, FS = '3ee92ba5-a9fc-45b7-a371-83d1ec66f7d9', 'd2efee89-ab87-4a18-9d0d-e4f1756b3a82'

M = {k: 'https://static.wixstatic.com/media/' + v for k, v in dict(
    mountains='43ca3b_ee037bfbf2be4130aab0698db817c3a5~mv2.jpg', logo='43ca3b_dbb2ca1106804e9b9271ee3989f69c9f~mv2.jpg',
    com1='43ca3b_5ebed5e3b3524ef9951ad632cc6f1663~mv2.jpeg', com2='43ca3b_9a7a88b48db04dc69f25f4153901b857~mv2.jpg',
    com3='43ca3b_24dbe14b7bb04b0ab38ccb86b120e0f8~mv2.png', com4='43ca3b_23f665ee02a448f794a9f3068805fc4e~mv2.png',
    com5='43ca3b_81788f1b5caa45c2acefc8b3f279252a~mv2.jpg', guido='43ca3b_c5d811960b1840da8fe9c2068164544d~mv2.jpeg',
    daiana='43ca3b_c6dac3a9420a41589ed25b01aa0f01b7~mv2.jpeg', libro1='43ca3b_b66aadccfe7f45f1af0b6d788d586bc8~mv2.png',
    libro2='43ca3b_47cb93874fee46ddb03043d78ec2b42e~mv2.png', liderazgo='43ca3b_d8b296ccde3f4b4bb19d28ee462261bb~mv2.png',
    caracter='43ca3b_d33531b7447746a6b43801f324fb919f~mv2.png', atributos='43ca3b_dfd17cfea73b4b6ba41a2337606df4e4~mv2.png',
    plan='43ca3b_8090d5b30d83477f80809ce8d65de8ef~mv2.png', adoracion='43ca3b_7ebdaee7617c416b810c51c56ac3b99f~mv2.png',
    carreralid='43ca3b_ffe84152be194674820da827a45a41b8~mv2.jpg', maranata='43ca3b_e30876a5528040408ef3952724630ba5~mv2.png',
    intensiva='43ca3b_8c986c4f86dd4e519324a2a527c07187~mv2.png', sky='43ca3b_80f9059568df4040a3be490520207e23~mv2.jpg',
    ocean='43ca3b_c6ce05ca60a14606ad9863e52d5d8e9d~mv2.jpg', ocean2='43ca3b_cce0c4a66cd94fb9aac9288a5003d9dc~mv2.jpg',
    candle='43ca3b_299dbf49ec23478fa1b91efccf2c01d3~mv2.jpg', sand='43ca3b_041b16ec9c274aef945d82174d9ef906~mv2.jpg',
    g_h0='43ca3b_03afacc334b94f28a5678deda935d374~mv2.jpg', g_h1='43ca3b_585709d428e848cf930f5fa5aab0c3e3~mv2.jpg',
    g_k1='43ca3b_98e5be72610e444d8ccc770144050f5f~mv2.jpg', g_m3='43ca3b_211c9ca3747245c1a8af2da5b42589a7~mv2.jpg',
    g_stone='43ca3b_ff843c913b79464ea39c922cd9f7d6e7~mv2.jpg', g_cadena='43ca3b_8244f24245ef4362bf6a5434ca03ec7d~mv2.jpg',
    g_quien='43ca3b_6c343b0ef2364b178f813b87a3227256~mv2.jpg').items()}


def im(k, w=1200, h=None):
    """URL de Wix con tamaño ajustado."""
    u = M[k]
    name = u.rsplit('/', 1)[1].split('~')[0] + '.jpg'
    if h:
        return f'{u}/v1/fill/w_{w},h_{h},al_c,q_82,enc_auto/{name}'
    return f'{u}/v1/fit/w_{w},h_{w * 2},q_82,enc_auto/{name}'


NAV = [('index.html', 'Inicio'), ('institucional.html', 'Institucional'), ('formacion.html', 'Formación'),
       ('libro.html', 'Libro'), ('sembradores.html', 'Sembradores'), ('ubicacion.html', 'Ubicación')]


def head(title, desc, page):
    def a(href, label):
        cur = ' aria-current="page"' if href == page else ''
        return f'<a href="/{href}"{cur}>{label}</a>'
    inst = ('<div class="dd"><a class="ddt" href="/institucional.html">Institucional</a><div class="dd-m">'
            '<a href="/institucional.html#historia">Nuestra historia</a><a href="/institucional.html#mision">Misión y visión</a>'
            '<a href="/institucional.html#valores">Nuestros valores</a><a href="/institucional.html#fe">Declaración de fe</a>'
            '<a href="/institucional.html#equipo">Equipo directivo</a><a href="/voluntarios.html">Sé parte del equipo</a></div></div>')
    form = ('<div class="dd"><a class="ddt" href="/formacion.html">Formación</a><div class="dd-m">'
            '<a href="/formacion.html#carreras">Carreras ministeriales</a><a href="/formacion.html#escuelas">Escuelas ministeriales</a>'
            '<a href="/formacion.html#cursos">Cursos online</a></div></div>')
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{im('ocean', 1200, 630)}">
<meta name="theme-color" content="#10251d">
<link rel="icon" type="image/png" href="https://static.wixstatic.com/media/43ca3b_2d985f94c5e04a82b1434561cce4cc35~mv2.png"><link rel="apple-touch-icon" href="https://static.wixstatic.com/media/43ca3b_2d985f94c5e04a82b1434561cce4cc35~mv2.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Raleway:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand brand-top" href="/index.html" aria-label="Habitat · Centro de Formación Ministerial"><img src="{im('logo', 120, 120)}" alt="Habitat"></a>
<button class="burger" aria-label="Menú" aria-expanded="false"><span></span><span></span><span></span></button>
<nav class="nav" aria-label="Principal">
<div class="nav-main">{a('index.html', 'Inicio')}{inst}{form}{a('libro.html', 'Libro')}{a('sembradores.html', 'Sembradores')}{a('ubicacion.html', 'Ubicación')}</div>
<div class="nav-side"><a class="kh" href="/kids-hero.html">Kids &amp; Hero</a><a class="in" href="/ingresar.html">Ingresar</a></div>
</nav></div></header>
<main>
'''


FOOT = f'''</main>
<footer class="foot"><div class="wrap">
<div class="g">
<div><a class="brand" href="/index.html"><img src="{im('logo', 120, 120)}" alt=""><span><b>HABITAT</b><small>CENTRO DE FORMACIÓN MINISTERIAL</small></span></a>
<p class="ver">“Yo amo la habitación de tu casa y el lugar dónde habita tu gloria”<span>Salmo 26:8</span></p></div>
<div><h4>Habitat</h4><a href="/institucional.html#historia">Nuestra historia</a><a href="/institucional.html#valores">Valores</a><a href="/institucional.html#fe">Declaración de fe</a><a href="/institucional.html#equipo">Equipo</a><a href="/voluntarios.html">Voluntarios</a></div>
<div><h4>Formación</h4><a href="/formacion.html#carreras">Carreras</a><a href="/formacion.html#escuelas">Escuelas</a><a href="/formacion.html#cursos">Cursos online</a><a href="/libro.html">Libro Asombro</a><a href="/kids-hero.html">Kids &amp; Hero</a></div>
<div><h4>Visitanos</h4><a href="/ubicacion.html">Av. Juan Bautista Justo 8177, CABA</a><a href="https://wa.me/5491171637995">+54 9 11 7163-7995</a><a href="https://www.instagram.com/habitat_cfm" target="_blank" rel="noopener">Instagram @habitat_cfm</a><a href="/ingresar.html">Campus de alumnos</a></div>
</div>
<div class="bt"><span>© <span id="yr">2026</span> Habitat · Centro de Formación Ministerial</span><span>Hecho con amor para Su presencia</span></div>
</div></footer>
<script src="/assets/site.js"></script>
'''


def page(fn, title, desc, body, extra=''):
    html = head(title, desc, fn) + body + FOOT + extra + '</body>\n</html>\n'
    html = html.replace(f'<a class="ddt" href="/{fn}">', f'<a class="ddt" href="/{fn}" aria-current="page">')
    with open(os.path.join(OUT, fn), 'w', encoding='utf-8') as f:
        f.write(html)


VID = {'sky': 'https://video.wixstatic.com/video/11062b_ed310367d9a64b75933e84fa3a9e19c5/{q}/mp4/file.mp4'}


def phero(bgk, kick, title, sub=''):
    s = f'<p class="lead" style="color:rgba(246,240,228,.85)">{sub}</p>' if sub else ''
    v = ''
    if bgk in VID:
        v = (f'<video class="bgv" autoplay muted loop playsinline preload="auto" poster="{im(bgk, 1600)}" '
             f'data-hd="{VID[bgk].format(q="1080p")}" data-sd="{VID[bgk].format(q="720p")}" aria-hidden="true"></video>')
    return (f'<section class="hero phero{" sky" if bgk in VID else ""}"><div class="bg" style="background-image:url(\'{im(bgk, 2000)}\')"></div>{v}'
            f'<div class="wrap"><span class="kick">{kick}</span><h1>{title}</h1>{s}</div></section>\n')


# ---------- Programas ----------
CURSOS = [
    ('liderazgo', 'Liderazgo', 'Un liderazgo auténtico, basado en el ejemplo de Jesús. Aprenderás a liderar con claridad, humildad y visión, impactando a otros y llevando el mensaje del Reino a cada área de tu vida.', ['Online', 'Gratis']),
    ('caracter', 'Carácter, identidad y propósito', 'Cómo un carácter probado, una identidad sana y un propósito firme hacen al caminar cristiano y a la perdurabilidad de la fe. Son los pilares de todo lo que trabajamos en Habitat.', ['Online', '$ 10.000']),
    ('atributos', 'Atributos de Dios', 'Los atributos de Dios y cómo nos edifican para un crecimiento integral y un conocimiento más amplio de Su persona.', ['Online', '$ 10.000']),
    ('plan', 'El plan de Dios', 'Cuál es el plan de Dios, cómo afecta nuestras vidas hoy, cómo alinearnos a Su voluntad en este tiempo y qué herramientas tenemos para vivir conforme a Su plan.', ['Online', '$ 10.000']),
]
ESCUELAS = [
    ('maranata', 'Escuela Maranata', 'Una introducción teológica a la escatología bíblica, con valor y criterio sobre las diferentes posturas. Todo el libro de Apocalipsis y los 150 capítulos que hablan de los últimos tiempos.', ['Escuela anual', 'Presencial', 'Zoom']),
    ('intensiva', 'Escuela Intensiva de Liderazgo', 'Los diseños de Dios, la iglesia local, la adoración, los dones espirituales, teología bíblica, nuestra identidad como hijos y nuestro propósito.', ['88 clases', 'Asincrónico']),
    ('mountains', 'Escuela del Desierto', 'El lugar donde Dios forja el carácter: el estancamiento espiritual, la sujeción y la autoridad, y las temporadas de desierto vistas desde la perspectiva de Dios.', ['14 clases', 'Asincrónico']),
]
CARRERAS = [
    ('carreralid', 'Carrera Ministerial de Liderazgo · CML', 'Modelar el carácter de Cristo en nosotros, profundizar en la cultura del Reino de los cielos y entrenarnos en los dones espirituales, desde una perspectiva bíblica y cristocéntrica.', ['2 años', 'Presencial', 'Zoom']),
    ('adoracion', 'Carrera Ministerial de Adoración · CMA', 'Desarrollar hijos de Dios conforme a Su corazón, que aprendan a oír Su voz y conozcan Sus deseos y diseños, para llevar a otros a contemplar al Señor.', ['2 años', 'Presencial', 'Zoom']),
]



# ---------- TAPAS DE LOS PROGRAMAS (diseñadas, una por programa) ----------
_S = 'fill="none" stroke="rgba(246,240,228,.55)" stroke-width="1.2"'
_G = 'fill="none" stroke="rgba(217,184,120,.85)" stroke-width="1.4"'
MOTIF = {
    'arcs': f'<g {_S}>' + ''.join(f'<circle cx="200" cy="420" r="{r}"/>' for r in range(60, 300, 34)) + f'</g><circle cx="200" cy="420" r="40" {_G}/>',
    'rings': f'<g {_S}><circle cx="160" cy="210" r="78"/><circle cx="240" cy="210" r="78"/><circle cx="200" cy="140" r="78"/></g><circle cx="200" cy="186" r="6" fill="rgba(217,184,120,.9)"/>',
    'rays': f'<g {_S}>' + ''.join(f'<line x1="200" y1="200" x2="{200 + 260 * __import__("math").cos(a / 18 * 3.14159):.1f}" y2="{200 + 260 * __import__("math").sin(a / 18 * 3.14159):.1f}"/>' for a in range(36)) + f'</g><circle cx="200" cy="200" r="46" fill="rgba(16,37,29,.35)" {_G}/>',
    'path': f'<path d="M-10 330 C 80 330, 90 230, 180 230 S 290 120, 410 110" {_S} stroke-dasharray="4 7"/>' + ''.join(f'<circle cx="{x}" cy="{y}" r="7" fill="rgba(217,184,120,.9)"/>' for x, y in [(40, 322), (180, 230), (330, 128)]),
    'dawn': f'<g {_S}>' + ''.join(f'<line x1="0" y1="{y}" x2="400" y2="{y}"/>' for y in range(300, 400, 14)) + f'</g><path d="M90 300 A110 110 0 0 1 310 300" {_G}/><g {_S}>' + ''.join(f'<line x1="200" y1="300" x2="{200 + 170 * __import__("math").cos(-a / 12 * 3.14159):.1f}" y2="{300 + 170 * __import__("math").sin(-a / 12 * 3.14159):.1f}"/>' for a in range(1, 12)) + '</g>',
    'waves': f'<g {_S}>' + ''.join(f'<path d="M-20 {y} Q 40 {y - 18}, 100 {y} T 220 {y} T 340 {y} T 460 {y}"/>' for y in range(150, 400, 22)) + '</g>',
    'dunes': f'<g {_S}><path d="M-20 300 Q 90 220 200 290 T 420 260"/><path d="M-20 340 Q 120 270 230 330 T 420 300"/><path d="M-20 380 Q 140 320 260 370 T 420 350"/></g><circle cx="300" cy="140" r="34" {_G}/>',
    'peaks': f'<g {_S}><path d="M-10 360 L 110 200 L 180 290 L 260 150 L 410 360"/><path d="M-10 390 L 80 300 L 150 360 L 240 250 L 410 390"/></g><path d="M245 168 L 260 150 L 275 168" {_G}/>',
    'lyre': f'<g {_S}><path d="M140 330 C 110 250, 120 170, 150 120 C 160 100, 170 96, 178 104"/><path d="M260 330 C 290 250, 280 170, 250 120 C 240 100, 230 96, 222 104"/><path d="M150 140 L 250 140"/><path d="M146 330 L 254 330"/></g><g {_G}>' + ''.join(f'<line x1="{x}" y1="140" x2="{x}" y2="330"/>' for x in range(164, 246, 14)) + '</g>' + f'<g {_S} opacity=".6">' + ''.join(f'<path d="M{30+k*6} {380-k*40} q 30 -14 60 0"/>' for k in range(0)) + '</g>',
}
COVER = {
    'liderazgo': ('#10251d', '#2f6f6a', 'arcs', 'Curso online corto', 'Liderazgo'),
    'caracter': ('#3b5b45', '#b8904f', 'rings', 'Curso online', 'Carácter, identidad y propósito'),
    'atributos': ('#14233a', '#8a6a3a', 'rays', 'Curso online', 'Atributos de Dios'),
    'plan': ('#5a2f2a', '#c08a52', 'path', 'Curso online', 'El plan de Dios'),
    'maranata': ('#0f1730', '#a5683a', 'dawn', 'Escuela · 1 año', 'Maranata'),
    'intensiva': ('#0f2f36', '#3f8a85', 'waves', 'Escuela', 'Intensiva de Liderazgo'),
    'mountains': ('#4a3a24', '#c9a46a', 'dunes', 'Escuela', 'Escuela del Desierto'),
    'carreralid': ('#0c1f18', '#56704a', 'peaks', 'Carrera ministerial · 2 años', 'Carrera de Liderazgo'),
    'adoracion': ('#2c1630', '#9a5a63', 'lyre', 'Carrera ministerial · 2 años', 'Carrera de Adoración'),
}


def cover(k):
    a, b, m, lab, t = COVER[k]
    return (f'<div class="cov" style="background:linear-gradient(150deg,{a},{b})">'
            f'<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{MOTIF[m]}</svg>'
            f'<span class="cl">{lab}</span><span class="ct">{t}</span><span class="cm">Habitat</span></div>')


PROG_ID = {'liderazgo': '8772c6ac-0b9a-41de-b418-1c77d0a678ec', 'caracter': 'a371e43a-e432-4164-9e15-350e2d3d21bb', 'atributos': '5e3b050b-53ed-48c3-8cf7-4ba4d99833bc', 'plan': 'e02af77c-c23e-4ba2-a177-1dd030385bda', 'maranata': '4447f7e4-1e6f-4ff1-aae0-071c4a56c9ee', 'intensiva': 'f1476369-60f5-460e-a590-830388b1cae9', 'mountains': '194669aa-4ec3-498e-936f-1bb4a6d25350', 'carreralid': 'd0c2ccd4-e338-45f8-8657-81a55230a4a4', 'adoracion': 'b4d88036-4e71-4bce-a071-f46a89d2329d'}


def cards(items, cta='Ver el curso', href=None):
    out = []
    for k, t, d, tg in items:
        tags = ''.join(f'<span class="tag{" g" if x in ("Gratis", "Online", "Asincrónico", "Zoom") else ""}">{x}</span>' for x in tg)
        out.append(f'<a class="card rv" href="{href or ('/curso.html?p=' + PROG_ID[k] if k in PROG_ID else '/formacion.html')}"><div class="im">{cover(k)}</div>'
                   f'<div class="bd"><div class="tags">{tags}</div><h3>{t}</h3><p>{d}</p><span class="go">{cta} →</span></div></a>')
    return '<div class="cards">' + ''.join(out) + '</div>'


# ---------- TESTIMONIOS (se agregan acá; con dos o más, pasan solos) ----------
TESTIMONIOS = [
    ('…Escudriñando cada clase, conociendo más de Su persona y muchas herramientas que recibimos como Hermenéutica, Sanidad Interior.', 'Familia Castriota · Iglesia ECO'),
    ('Dios ha sido bueno… nos ha enseñado la esencia de Su corazón. En lo personal me ayudó a encontrar mi verdadera identidad, que está basada en Él.', 'Candela Paez · Iglesia Comunidad Cristiana, Córdoba'),
    ('Impactaron en la manera de poder conocer a Dios desde otra perspectiva; eso también implicó poder comenzar a sanar mi identidad.', 'Ana Luz Llanes · Iglesia Centro Fuente de Vida, La Plata'),
]

# ---------- INICIO ----------
home = f'''<section class="hero"><div class="bg" style="background-image:url('{im('ocean', 2200)}')"></div>
<video class="bgv" autoplay muted loop playsinline preload="auto" poster="{im('ocean', 1600)}" data-hd="https://video.wixstatic.com/video/43ca3b_b472144f3d0a4dabba0c19334c1fdc66/1080p/mp4/file.mp4" data-sd="https://video.wixstatic.com/video/43ca3b_b472144f3d0a4dabba0c19334c1fdc66/720p/mp4/file.mp4" aria-hidden="true"></video>
<div class="wrap">
<span class="word">HABITAT</span>
<span class="sub">Centro de Formación Ministerial</span>
<blockquote>“Yo amo la habitación de tu casa y el lugar dónde habita tu gloria”<cite>Salmo 26:8</cite></blockquote>
<div class="acts"><a class="btn btn-gold" href="/formacion.html">Ver formación</a><a class="btn btn-line" style="color:var(--cream)" href="/institucional.html">Conocenos</a></div>
</div><span class="scroll" aria-hidden="true"></span></section>

<section class="sec" id="mision"><div class="wrap">
<div class="sec-h center rv"><span class="kick">Lo que nos mueve</span><h2>Habitar en Su presencia</h2></div>
<div class="mv">
<article class="rv"><div class="mv-h"><span class="kick">Nuestra misión</span><span class="n">01</span></div><p>Habitar en Su presencia, capacitando, activando y enviando a hijos de Dios para la obra del ministerio.</p></article>
<article class="rv"><div class="mv-h"><span class="kick">Nuestra visión</span><span class="n">02</span></div><p>Cultivar un avivamiento global sustentable por medio del hospedaje de Su presencia y la centralidad de Cristo en las iglesias locales, transformando culturas de manera integral desde cada hogar.</p></article>
</div></div></section>

<section class="sec" style="padding-top:0"><div class="wrap split">
<div class="ph rv"><img loading="lazy" src="{im('com1', 900, 1125)}" alt="Una estudiante en clase en Habitat"></div>
<div class="txt rv"><span class="kick">Capacitar · Activar · Enviar</span><h2>Un lugar para formarte y ser enviado</h2>
<p class="lead">Cursos online, escuelas y carreras ministeriales para pastores, líderes y todo hijo de Dios que quiera crecer y servir. Presencial, por Zoom o a tu ritmo.</p>
<div><a class="btn btn-line" href="/formacion.html">Explorar programas</a></div></div>
</div></section>

<section class="sec dark"><div class="wrap">
<div class="sec-h rv"><span class="kick">Formación</span><h2>Elegí tu camino</h2><p class="lead">Desde una carrera de dos años hasta un curso corto.</p></div>
{cards([CARRERAS[0], CARRERAS[1], ESCUELAS[0], CURSOS[0]], 'Conocer más', '/formacion.html')}
</div></section>

<section class="band-img sec" id="testimonios"><div class="bg" style="background-image:url('{im('sky', 2000)}')"></div><div class="wrap testi rv">
<span class="kick" style="color:var(--gold-2)">Testimonios</span>
<div class="tcar" data-car>{''.join(f'<figure class="tslide"><q>{q}</q><b>{w}</b></figure>' for q, w in TESTIMONIOS)}</div>
<div class="tnav" data-nav></div></div></section>

<section class="sec book"><div class="wrap split">
<div class="txt rv"><span class="kick">El libro</span><span class="word-s">ASOMBRO</span><h3 style="font-style:italic">Volviendo nuestro corazón a la belleza de Jesús</h3>
<p style="color:#4b3d2b">Una invitación a recuperar la capacidad de volver a mirar a Dios hasta quedar genuinamente rendidos ante Su belleza.</p>
<span class="by">Guido Alessandro Dalé</span>
<div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-gold" href="{OLD}/lead-collection-1">Comprar libro</a><a class="btn btn-line" href="/libro.html">Leer más</a></div></div>
<div class="ph rv" style="aspect-ratio:1/1"><img loading="lazy" src="{im('libro2', 1000, 1000)}" alt="Libro Asombro sobre una mesa"></div>
</div></section>

<section class="sec"><div class="wrap">
<div class="kht rv"><img loading="lazy" src="/assets/kh/home.jpg" alt="El mundo de Tras sus pasos">
<div class="in"><span class="kick" style="color:#f2d58a">Nuevo espacio de Habitat</span><h2>Kids &amp; Hero</h2>
<p>Formación bíblica para niños y adolescentes, con cursos que se juegan: Kids, de 6 a 11 años, y Hero, de 12 a 18. El primer curso es <b>Tras sus pasos</b>, la vida de Jesús de Belén a la tumba vacía. Después vienen Hechos y muchos más.</p>
<div><a class="btn btn-gold" href="/kids-hero.html">Conocé Kids &amp; Hero</a></div></div></div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
<div class="sec-h center rv"><span class="kick">Comunidad</span><h2>Amamos Su presencia</h2></div>
<div class="gal rv">
<img class="t" loading="lazy" src="{im('com5', 600, 900)}" alt="Tiempo de adoración">
<img class="w" loading="lazy" src="{im('com3', 1000, 500)}" alt="Clase en Habitat">
<img loading="lazy" src="{im('com2', 600, 600)}" alt="Oración en comunidad">
<img loading="lazy" src="{im('candle', 600, 600)}" alt="">
<img class="w" loading="lazy" src="{im('com1', 1000, 500)}" alt="Estudiante en clase en Habitat">
</div></div></section>

<section class="sec dark" id="sembradores"><div class="wrap split">
<div class="txt rv"><span class="kick">Proyecto Sembradores</span><h2>Sembrá en la extensión del Reino</h2>
<p class="lead">Una iniciativa para que cada persona sea parte activa de la visión de Habitat. Con tu siembra:</p>
<ul class="ticks" style="color:rgba(246,240,228,.85)"><li>Becamos a más estudiantes</li><li>Sostenemos misioneros</li><li>Enviamos ayuda humanitaria a lugares de catástrofe</li><li>Colaboramos con otros ministerios</li></ul>
<div class="on-dark" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-gold" href="/sembradores.html#sumate">Quiero sembrar</a><a class="btn btn-line" href="/sembradores.html">Conocer el proyecto</a></div>
<p style="color:rgba(246,240,228,.6);font-size:.95rem">¿Querés servir con tu tiempo? <a href="/voluntarios.html" style="color:var(--gold-2)">Sumate al equipo de voluntarios</a>.</p></div>
<div class="ph wide rv"><img loading="lazy" src="{im('com4', 1000, 750)}" alt="Estudiantes de Habitat en clase"></div>
</div></section>
'''
page('index.html', 'Habitat · Centro de Formación Ministerial', 'Habitar en Su presencia, capacitando, activando y enviando a hijos de Dios para la obra del ministerio.', home)

# ---------- INSTITUCIONAL ----------
FE = [('Creemos en la Biblia', 'La Biblia es la inspirada, infalible, inerrante y autoritaria Palabra de Dios.'),
      ('Creemos en la Trinidad de Dios', 'Hay un solo Dios, que existe eternamente en tres personas: Padre, Hijo y Espíritu Santo.'),
      ('Creemos en Jesucristo', 'Jesucristo es el eterno Hijo de Dios, completamente Dios y completamente humano. Nació de una virgen, vivió una vida sin pecado, murió como el sustituto sacrificial para pagar el castigo del pecado, resucitó físicamente de la muerte, ascendió a los cielos, y Él volverá de forma física nuevamente.'),
      ('Creemos en la humanidad', 'Dios creó al hombre y la mujer en Su perfecta imagen, con igualdad a través de las etnias.'),
      ('Creemos en el pecado', 'Toda la humanidad, excluyendo a Cristo, es pecadora tanto por nacimiento como por acción. La paga correspondiente del pecado es la muerte física y espiritual.'),
      ('Creemos en la salvación del pecado', 'La salvación del pecado viene solo como regalo de Dios a través de la fe en Jesucristo y Su sacrificio por el pecado.'),
      ('Creemos en la segunda venida de Cristo', 'Evento que manifestará Su regreso a la tierra de manera personal y visible con el propósito de consumar Su Reino. Creemos que la Iglesia será arrebatada y transformada, recibiendo un cuerpo glorificado para gobernar junto a Jesús sobre las naciones.')]
inst = phero('mountains', 'Institucional', 'Quiénes somos', 'Una familia que busca la presencia de Dios y forma líderes para Su obra.') + f'''
<nav class="subnav" aria-label="Secciones"><div class="wrap"><a href="#historia">Historia</a><a href="#mision">Misión y visión</a><a href="#valores">Valores</a><a href="#fe">Declaración de fe</a><a href="#equipo">Equipo</a></div></nav>

<section class="sec" id="historia"><div class="wrap split">
<div class="txt rv"><span class="kick">Nuestra historia</span><h2>Empezó en un “aposento alto”</h2>
<p>Habitat nace por el año 2022, en un lugar pequeño sobre la calle César Díaz 5475. Literalmente en ese “Aposento Alto”, porque quedaba en un segundo piso. Allí el corazón de varios jóvenes, con el acompañamiento pastoral de una iglesia local, se unieron en oración y adoración buscando sencillamente la presencia de Dios.</p>
<p>En el transcurso de los meses, muchas experiencias fueron confirmando que algo Dios quería hacer en medio nuestro. De a poco, Dios nos iba direccionando para el establecimiento de Habitat, un espacio de formación ministerial para pastores y líderes. Como todo comienzo, requirió mucho esfuerzo, empeño e incluso todos nuestros recursos, confiando en que Dios es el Señor de la obra y la misma no es nuestra.</p>
<p>Con el tiempo más estudiantes fueron sumándose, Dios multiplicó Su obra y en el año 2025 nos mudamos a un lugar más espacioso. Ese año, más de 100 estudiantes eligieron prepararse mediante nuestras carreras y Dios obró de manera sobrenatural sobre todos nosotros, trayendo herramientas, activación e impulso para que el Reino de los cielos siga avanzando.</p>
<p>¡Hoy podemos disfrutar de todo lo que Dios hizo, hace y seguirá haciendo! Contamos con tus oraciones también; sin eso, no se hubiera podido llegar hasta acá.</p>
<p class="sig">Guido Dalé, Director de Habitat</p></div>
<div class="ph rv"><img loading="lazy" src="{im('com5', 900, 1125)}" alt="Adoración en Habitat"></div>
</div></section>

<section class="sec dark" id="mision"><div class="wrap"><div class="mv">
<article class="rv" style="background:rgba(246,240,228,.06)"><div class="mv-h"><span class="kick">Misión</span><span class="n">01</span></div><p style="color:var(--cream)">Habitar en Su presencia, capacitando, activando y enviando a hijos de Dios para la obra del ministerio.</p></article>
<article class="rv" style="background:rgba(246,240,228,.06)"><div class="mv-h"><span class="kick">Visión</span><span class="n">02</span></div><p style="color:var(--cream)">Cultivar un avivamiento global sustentable por medio del hospedaje de Su presencia y la centralidad de Cristo en las iglesias locales, transformando culturas de manera integral desde cada hogar.</p></article>
</div></div></section>

<section class="sec" id="valores"><div class="wrap">
<div class="sec-h rv"><span class="kick">Nuestros valores</span><h2>Lo que cuidamos en cada paso</h2></div>
<div class="vals">
<article class="rv"><i>I</i><h3>Todos son bienvenidos</h3><p>Reconocemos el valor y la dignidad de cada persona. Así como Dios no hace acepción de personas, creemos que todo aquel que busca crecer, servir y ser transformado tiene un lugar en este espacio de formación.</p></article>
<article class="rv"><i>II</i><h3>Lavando pies</h3><p>Entendemos la formación ministerial como un camino de servicio. Siguiendo el ejemplo de Jesús, abrazamos la humildad como una disciplina del corazón y un signo de madurez espiritual: aprender a servir antes que ser servidos.</p></article>
<article class="rv"><i>III</i><h3>Pasión con compromiso</h3><p>Formamos personas apasionadas por Dios y Su propósito, y también comprometidas con perseverar en el proceso. Buscamos una pasión que se sostenga en la obediencia diaria.</p></article>
</div></div></section>

<section class="band-light sec" id="fe"><div class="bg" style="background-image:url('{im('ocean2', 2000)}')"></div>
<video class="bgv" autoplay muted loop playsinline preload="none" poster="{im('ocean2', 1600)}" data-hd="https://video.wixstatic.com/video/11062b_d9f4ac8a7019428d9cf5cefd98892d37/1080p/mp4/file.mp4" data-sd="https://video.wixstatic.com/video/11062b_d9f4ac8a7019428d9cf5cefd98892d37/720p/mp4/file.mp4" aria-hidden="true"></video><div class="wrap">
<div class="sec-h rv"><span class="kick">Declaración de fe</span><h2>Lo que creemos</h2></div>
<div class="faith">{''.join(f'<article class="rv"><h3>{t}</h3><p>{d}</p></article>' for t, d in FE)}</div>
</div></section>

<section class="sec" id="equipo"><div class="wrap split">
<div class="txt rv"><span class="kick">Equipo directivo</span><h2>Todo lo que Dios hace, lo hace en familia</h2>
<p class="lead">Nuestro equipo directivo está formado por el matrimonio de Guido Dalé y Agustina Griotto, junto con Daiana Nieto. Con corazones apasionados por servir y una determinación por la capacitación de los santos, cada uno se formó en diferentes seminarios bíblicos para tener herramientas para la gestión y formación de nuevos líderes.</p></div>
<div class="team">
<figure class="rv"><div class="ph"><img loading="lazy" src="{im('guido', 700, 875)}" alt="Guido Dalé y Agustina Griotto"></div><figcaption>Guido Dalé y Agustina Griotto<small>Dirección</small></figcaption></figure>
<figure class="rv"><div class="ph"><img loading="lazy" src="{im('daiana', 700, 875)}" alt="Daiana Nieto"></div><figcaption>Daiana Nieto<small>Dirección</small></figcaption></figure>
</div></div></section>
'''
page('institucional.html', 'Institucional · Habitat', 'Nuestra historia, misión, valores, declaración de fe y equipo directivo.', inst)

# ---------- FORMACION ----------
form = phero('sky', 'Entrenamiento ministerial', 'Formación', 'Capacitar, activar y enviar a hijos de Dios para la obra del ministerio.') + f'''
<nav class="subnav" aria-label="Secciones"><div class="wrap"><a href="#carreras">Carreras</a><a href="#escuelas">Escuelas</a><a href="#cursos">Cursos online</a><a href="#campus">Campus</a></div></nav>
<section class="sec" id="carreras"><div class="wrap">
<div class="sec-h rv"><span class="kick">Carreras ministeriales</span><h2>Dos años para ser formado y enviado</h2></div>
{cards(CARRERAS)}
</div></section>
<section class="sec dark" id="escuelas"><div class="wrap">
<div class="sec-h rv"><span class="kick">Escuelas ministeriales</span><h2>Escuelas</h2><p class="lead">Formación temática y profunda, presencial, por Zoom o asincrónica.</p></div>
{cards(ESCUELAS)}
</div></section>
<section class="sec" id="cursos"><div class="wrap">
<div class="sec-h rv"><span class="kick">Cursos online</span><h2>Aprendé a tu ritmo</h2><p class="lead">Programas cortos para profundizar en temas centrales de la fe y el ministerio. Te inscribís y empezás cuando quieras.</p></div>
{cards(CURSOS)}
</div></section>
<section class="band-img sec" id="campus"><div class="bg" style="background-image:url('{im('ocean', 2000)}')"></div><div class="wrap center rv" style="display:grid;gap:20px;justify-items:center;text-align:center">
<span class="kick" style="color:var(--gold-2)">Campus de alumnos</span><h2>¿Ya estás cursando?</h2>
<p class="lead" style="color:rgba(246,240,228,.85)">Entrá con tu usuario para ver tus clases, materiales y tu progreso.</p>
<a class="btn btn-gold" href="/ingresar.html">Ir a mis cursos</a></div></section>
'''
page('formacion.html', 'Formación · Habitat', 'Cursos online, escuelas y carreras ministeriales de Habitat.', form)

# ---------- LIBRO ----------
libro = f'''<section class="hero phero book" style="color:var(--ink)"><div class="wrap split" style="text-align:left;justify-items:stretch">
<div class="txt rv"><span class="kick">El libro</span><span class="word-s">ASOMBRO</span><h2 style="font-style:italic">Volviendo nuestro corazón a la belleza de Jesús</h2><span class="by">Guido Alessandro Dalé</span>
<div><a class="btn btn-gold" href="{OLD}/lead-collection-1">Comprar libro</a></div></div>
<div class="ph rv" style="aspect-ratio:1/1"><img src="{im('libro2', 1000, 1000)}" alt="Libro Asombro"></div></div></section>
<section class="sec"><div class="wrap split rev">
<div class="txt rv"><blockquote style="margin:0;font:400 clamp(1.3rem,2.4vw,1.75rem)/1.55 var(--serif);color:var(--ink)">“Por mucho tiempo hemos profundizado en la contemplación como una disciplina espiritual estática vinculada con la quietud, cuando la Biblia nos la muestra dinámica y llena de frutos en el carácter y en obras de justicia.”</blockquote>
<p class="lead">El libro <i>Asombro</i> es una invitación a recuperar eso que la religiosidad y el misticismo nos quitaron: la capacidad de volver a mirar a Dios hasta quedar genuinamente rendidos ante Su belleza por medio de Su persona y de todo lo que existe.</p>
<p class="lead">Entre testimonios y contemplación, estas páginas recorren la devoción a Cristo, Su belleza, Sus atributos y el valor incomparable de Su sacrificio hasta llegar al lugar más profundo de nuestros afectos, para ser heridos por Su amor.</p>
<div><a class="btn btn-line" href="{OLD}/lead-collection-1">Quiero mi ejemplar</a></div></div>
<div class="ph rv"><img loading="lazy" src="{im('libro1', 900, 1125)}" alt="Contratapa del libro Asombro"></div>
</div></section>
'''
page('libro.html', 'Asombro · Libro de Guido Dalé', 'Asombro: volviendo nuestro corazón a la belleza de Jesús. Un libro de Guido Alessandro Dalé.', libro)

# ---------- SEMBRADORES ----------
sem = phero('sand', 'Proyecto Sembradores', 'Sembrá en la extensión del Reino', 'Acompañar, preparar y equipar líderes y ministerios en nuestra generación.') + f'''
<section class="sec"><div class="wrap split">
<div class="txt rv"><span class="kick">Cómo nació</span><h2>Una siembra que da fruto</h2>
<p>Proyecto Sembradores nace desde la necesidad de ayudar y colaborar en el acompañamiento, la preparación y la equipación de líderes y ministerios en nuestra generación, para servir a Dios en las iglesias, ciudades y naciones.</p>
<p>A fines de 2024 vimos la catástrofe que surgió a partir de las inundaciones en España, y Dios movió nuestro corazón a juntar donaciones como equipo y estudiantes para enviar allí. Vimos Su mano de provisión para la ayuda humanitaria de una manera extraordinaria. Dios también puso en diferentes momentos de nuestra historia el sembrar en misioneros y ministerios por y para la extensión de Su Reino.</p>
<p>Con el tiempo también vimos necesidades económicas de estudiantes que no tenían el recurso para solventar su preparación, e incluso de infraestructura general. Por eso nació Proyecto Sembradores: una iniciativa que permite a cada persona ser parte activa de esta visión mediante una siembra.</p></div>
<div class="ph rv"><img loading="lazy" src="{im('sand', 900, 1125)}" alt="Manos que dejan caer arena"></div>
</div></section>
<section class="sec dark"><div class="wrap two">
<div class="panel rv" style="background:rgba(246,240,228,.06);border-color:rgba(246,240,228,.12)"><span class="kick">Con tu siembra</span><h3>Lo que vamos a hacer</h3>
<ul class="ticks" style="color:rgba(246,240,228,.85)"><li>Enviar ayuda humanitaria a lugares de catástrofe</li><li>Sostener misioneros</li><li>Colaborar con otros ministerios</li><li>Becar a más estudiantes</li><li>Ayudar a la extensión del Reino</li></ul></div>
<div class="panel rv" style="background:rgba(246,240,228,.06);border-color:rgba(246,240,228,.12)"><span class="kick">Qué recibís</span><h3>Vas a ser parte</h3>
<ul class="ticks" style="color:rgba(246,240,228,.85)"><li>Informes trimestrales con novedades y avances</li><li>Testimonios de impacto</li><li>Reuniones anuales de visión</li><li>Regalías</li></ul></div>
</div></section>
<section class="sec" id="voces" hidden><div class="wrap">
<div class="txt rv in" style="max-width:640px"><span class="kick">Voces de Habitat</span><h2>Lo que Dios hace con cada siembra</h2><p class="lead">Alumnos que hoy se están formando cuentan su historia.</p></div>
<div id="vocesG" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px;margin-top:24px"></div>
</div></section>
<section class="sec" id="sumate"><div class="wrap split">
<div class="txt rv"><span class="kick">Sumate</span><h2>Quiero sembrar</h2><p class="lead">Dejanos tus datos y te contactamos para contarte cómo sumarte.</p></div>
<div class="panel rv"><div data-form-id="{FS}" data-thanks="¡Gracias por sumarte! Pronto te vamos a contactar."></div></div>
</div></section>
'''
page('sembradores.html', 'Proyecto Sembradores · Habitat', 'Una iniciativa para sembrar en misioneros, ministerios, becas y ayuda humanitaria.', sem,
     '<script type="module" src="/assets/form.js"></script>\n<script>fetch("/api/testimonio?publicos=1").then(function(r){return r.json();}).then(function(L){if(!Array.isArray(L)||!L.length)return;var e=function(t){return String(t||"").replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c];});};document.getElementById("vocesG").innerHTML=L.map(function(t){return \'<figure class="panel" style="margin:0;display:grid;gap:10px">\'+(t.video?\'<video src="\'+e(t.video)+\'" controls playsinline preload="metadata" style="width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:14px;background:#10251d"></video>\':"")+(t.texto?\'<blockquote style="margin:0;font-style:italic">«\'+e(t.texto)+\'»</blockquote>\':"")+\'<figcaption><b>\'+e(t.nombre)+\'</b>\'+(t.becado?" · alumno becado":"")+\'</figcaption></figure>\';}).join("");document.getElementById("voces").hidden=false;}).catch(function(){});</script>\n')

# ---------- VOLUNTARIOS ----------
vol = phero('candle', 'Voluntarios', '¡Formá parte de nuestro equipo!', 'Nos alegra que quieras ser parte del equipo de voluntarios de Habitat.') + f'''
<section class="sec"><div class="wrap split">
<div class="txt rv"><span class="kick">Lavando pies</span>
<blockquote style="margin:0;font:italic 400 clamp(1.4rem,2.6vw,1.9rem)/1.45 var(--serif);color:var(--ink)">“Pues, si yo, el Señor y el Maestro, les he lavado los pies, también ustedes deben lavarse los pies los unos a los otros.”</blockquote>
<span class="kick" style="color:var(--muted)">Juan 13:14</span>
<p class="lead">Contanos qué te gustaría hacer y te escribimos para coordinar.</p>
<div class="ph wide"><img loading="lazy" src="{im('com2', 1000, 750)}" alt="Equipo de Habitat"></div></div>
<div class="panel rv"><div data-form-id="{FV}" data-thanks="¡Gracias por llenar el formulario! Te vamos a escribir pronto."></div></div>
</div></section>
'''
page('voluntarios.html', 'Voluntarios · Habitat', 'Sumate al equipo de voluntarios de Habitat.', vol,
     '<script type="module" src="/assets/form.js"></script>\n')

# ---------- UBICACION ----------
ubi = phero('mountains', 'Ubicación', 'Vení a visitarnos') + f'''
<section class="sec"><div class="wrap split">
<div class="info rv">
<div><b>Dirección</b><span>Avenida Juan Bautista Justo 8177<br>Ciudad Autónoma de Buenos Aires, Argentina</span></div>
<div><b>Teléfono / WhatsApp</b><a href="https://wa.me/5491171637995">+54 9 11 7163-7995</a></div>
<div><b>Redes</b><a href="https://www.instagram.com/habitat_cfm" target="_blank" rel="noopener">@habitat_cfm</a></div>
<div><a class="btn btn-gold" style="font:600 .82rem/1 var(--sans)" href="https://www.google.com/maps/search/?api=1&query=Av.+Juan+Bautista+Justo+8177,+CABA" target="_blank" rel="noopener">Cómo llegar</a></div>
</div>
<div class="map rv"><iframe loading="lazy" title="Mapa de Habitat" src="https://www.google.com/maps?q=Av.%20Juan%20Bautista%20Justo%208177%2C%20CABA%2C%20Argentina&output=embed"></iframe></div>
</div></section>
'''
page('ubicacion.html', 'Ubicación · Habitat', 'Avenida Juan Bautista Justo 8177, Ciudad Autónoma de Buenos Aires.', ubi)


# ---------- KIDS & HERO ----------
LEARN = [
 ('📜','Historias que se ven','Cada etapa recorre la vida de Jesús con escenas animadas y narración, de Belén hasta la tumba vacía.'),
 ('📖','La Palabra, palabra por palabra','Completan versículos de la Nueva Traducción Viviente y los escuchan en voz alta. Cada respuesta trae su cita para ir a buscarla en la Biblia.'),
 ('🧩','Desafíos en cada parada','Después de cada historia hay una pregunta para pensar: elegir, ordenar los hechos o completar el versículo.'),
 ('🎮','Minijuegos que nunca se repiten','Más de sesenta juegos distintos, cada uno nacido de su historia: llenar las tinajas de Caná, echar las redes, lavar los pies.'),
 ('📝','Exámenes por etapa','Para avanzar hay un examen de 12 preguntas. Si se equivocan, el juego explica la respuesta y muestra el pasaje.'),
 ('🗺️','Un mundo para explorar','Caminan libres por Nazaret, el templo, el mar de Galilea y el Gólgota. Cada lugar muestra cómo se vivía en tiempos de Jesús.'),
 ('🤝','Misiones de servicio','Ayudan a personajes bíblicos: llevar el pan, buscar la oveja perdida, orar en el huerto. Aprenden a servir haciendo.'),
 ('🪵','Oficios y supervivencia','Solo en Hero: pescan, talan, cocinan y construyen su casa con las herramientas de la época. Cuidar el cuerpo también es parte del camino.'),
 ('🌱','Virtudes que crecen','Solo en Hero: al subir de nivel reparten puntos en Fuerza, Agilidad, Paciencia, Dominio propio, Sabiduría y Generosidad. La Humildad crece solo dando, y el Servicio, solo haciendo obras por los demás.'),
 ('🪙','Denarios y obras de amor','Solo en Hero: venden lo que cosechan, compran en la carpintería o la panadería y comparten con quienes lo necesitan, como enseñó Jesús en Mateo 25.'),
 ('⚔️','Espadeo bíblico con amigos','En salas privadas juegan al Espadeo bíblico, a ¿Quién soy?, al Versículo en cadena y a carreras por la tierra de Jesús. Después de cada pregunta, todos leen la explicación y el pasaje.'),
 ('🏅','Progreso que se nota','Niveles, medallas, recuerdos y una prenda única para quienes terminan el curso. Los puntos se suman de un curso a otro.'),
]
ETAPAS = ['Nacimiento','Infancia','Bautismo','Galilea','Milagros','Parábolas','Jerusalén','La cruz','Resurrección']

khp = f'''<style>
.khp{{--kn:#14122a;--kg:#f2c45c;--kg2:#ffe3a3;--kv:#7b5cff}}
.khp .hero::after{{background:linear-gradient(180deg,rgba(20,18,42,.35),rgba(20,18,42,.2) 45%,rgba(20,18,42,.92))}}
.khp .logo-t{{font:600 clamp(3rem,9vw,6.4rem)/.95 var(--serif);color:#fff;text-shadow:0 6px 40px rgba(0,0,0,.4)}}
.khp .logo-t em{{display:block;font:600 clamp(.75rem,1.8vw,1rem)/1 var(--sans);letter-spacing:.5em;font-style:normal;color:var(--kg2);margin-bottom:14px}}
.soon{{position:relative;overflow:hidden;display:inline-grid;justify-items:center;gap:6px;padding:20px 46px;border-radius:22px;border:0;cursor:pointer;color:#3a2606;background:linear-gradient(135deg,#f7d27a,#e9a93a 55%,#f7d27a);box-shadow:0 14px 40px rgba(233,169,58,.45),inset 0 -4px 0 rgba(0,0,0,.15);font:700 1.15rem/1 var(--sans);letter-spacing:.06em;transition:transform .25s}}
.soon small{{font:600 .66rem/1 var(--sans);letter-spacing:.3em;text-transform:uppercase;opacity:.75}}
.soon::before{{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent);transform:skewX(-20deg);animation:shine 3.2s infinite}}
.soon:hover{{transform:translateY(-3px) scale(1.02)}}
.soon .lock{{display:inline-block;margin-right:8px}}
@keyframes shine{{0%{{left:-60%}}60%,100%{{left:130%}}}}
.soon-note{{min-height:1.4em;color:var(--kg2);font-size:.95rem;transition:opacity .3s}}
.khp .dk{{background:var(--kn);color:#fff}}
.khp .dk h2,.khp .dk h3{{color:#fff}}
.khp .dk .lead{{color:rgba(255,255,255,.75)}}
.khp .kick{{color:var(--kg)}}
.br{{display:grid;grid-template-columns:repeat(2,1fr);gap:26px}}
.br article{{border-radius:26px;overflow:hidden;background:#1f1c3d;display:grid;grid-template-rows:auto 1fr}}
.br .im{{aspect-ratio:16/10;overflow:hidden}}
.br .im img{{width:100%;height:100%;object-fit:cover}}
.br .bd{{padding:28px 30px 32px;display:grid;gap:12px;align-content:start}}
.br .age{{justify-self:start;font:700 .7rem/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;padding:8px 12px;border-radius:999px;background:var(--kg);color:#3a2606}}
.br .kids .age{{background:#8fe0c8;color:#0d3b30}}
.br p,.br li{{color:rgba(255,255,255,.78)}}
.br ul{{margin:0;padding-left:18px;display:grid;gap:6px}}
@media (max-width:820px){{.br{{grid-template-columns:1fr}}}}
.road{{display:flex;gap:0;overflow-x:auto;padding:30px 4px 10px;scrollbar-width:thin}}
.road div{{flex:1 0 92px;display:grid;justify-items:center;gap:10px;position:relative;text-align:center}}
.road div::before{{content:"";position:absolute;top:22px;left:-50%;right:50%;height:3px;background:linear-gradient(90deg,var(--kg),#e9a93a);z-index:0}}
.road div:first-child::before{{display:none}}
.road b{{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--kg);color:#3a2606;font:700 1rem/1 var(--sans);position:relative;z-index:1;box-shadow:0 0 0 6px rgba(242,196,92,.18)}}
.road span{{font:600 .8rem/1.3 var(--sans);color:#fff}}
.road .nx b{{background:transparent;border:2px dashed rgba(255,255,255,.4);color:rgba(255,255,255,.6);box-shadow:none}}
.road .nx::before{{background:repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px)}}
.road .nx span{{color:rgba(255,255,255,.55)}}
.lg{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}}
.lg article{{background:#fff;border-radius:20px;padding:26px;border:1px solid var(--line);display:grid;gap:8px;align-content:start}}
.lg i{{font-style:normal;font-size:2rem;line-height:1}}
.lg b{{font:600 1.35rem/1.2 var(--serif);color:var(--ink)}}
.lg p{{color:var(--muted);font-size:.95rem}}
.phones{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}}
.phones figure{{margin:0;display:grid;gap:12px;justify-items:center}}
.phones .fr{{border-radius:30px;padding:8px;background:#0b0a18;box-shadow:0 26px 60px rgba(0,0,0,.45);max-width:100%}}
.phones .fr img{{border-radius:22px;width:100%;aspect-ratio:420/780;object-fit:cover;object-position:top}}
.phones figcaption{{font:600 .8rem/1.3 var(--sans);color:rgba(255,255,255,.75);text-align:center}}
@media (max-width:820px){{.phones{{grid-template-columns:repeat(2,1fr)}}}}
.faq{{display:grid;gap:12px;max-width:820px}}
.faq details{{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 22px}}
.faq summary{{cursor:pointer;font:600 1.25rem/1.3 var(--serif);color:var(--ink);list-style:none}}
.faq summary::after{{content:"+";float:right;color:var(--gold);font-family:var(--sans)}}
.faq details[open] summary::after{{content:"–"}}
.faq p{{margin-top:10px;color:var(--muted)}}
.crs{{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}}
.crs article{{border-radius:22px;overflow:hidden;background:#fff;border:1px solid var(--line);display:grid;grid-template-rows:auto 1fr}}
.crs .im,.crs .ph0{{aspect-ratio:16/10}}
.crs .im img{{width:100%;height:100%;object-fit:cover}}
.crs .ph0{{display:grid;place-items:center;background:linear-gradient(135deg,#2a2550,#14122a)}}
.crs .ph0 span{{font:500 4.5rem/1 var(--serif);color:rgba(255,227,163,.55)}}
.crs .bd{{padding:22px 24px 26px;display:grid;gap:8px;align-content:start}}
.crs .st{{justify-self:start;font:700 .66rem/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;padding:7px 11px;border-radius:999px;background:var(--kg);color:#3a2606}}
.crs .st.off{{background:var(--cream);color:var(--muted)}}
.crs p{{color:var(--muted)}}
.crs .on{{box-shadow:0 20px 50px rgba(233,169,58,.25);border-color:rgba(233,169,58,.5)}}
@media (max-width:820px){{.crs{{grid-template-columns:1fr}}}}
</style>
<div class="khp">
<section class="hero"><div class="bg" style="background-image:url('{im('g_h1', 2000)}')"></div>
<div class="wrap">
<span class="kick" style="color:var(--kg2);letter-spacing:.4em">Un espacio de Habitat</span>
<h1 class="logo-t"><em>Formación bíblica que se juega</em>Kids &amp; Hero</h1>
<p class="lead" style="color:rgba(255,255,255,.88);max-width:50ch">Cursos para chicos y adolescentes que recorren la Biblia jugando: historias, versículos, misiones y desafíos. El primer curso es <b>Tras sus pasos</b>, la vida de Jesús.</p>
<button class="soon" type="button" data-soon><span><span class="lock" aria-hidden="true">🔒</span>Jugar</span><small>Muy pronto</small></button>
<p class="soon-note" aria-live="polite"></p>
</div><span class="scroll" aria-hidden="true"></span></section>

<section class="sec"><div class="wrap">
<div class="sec-h rv"><span class="kick" style="color:var(--gold)">Los cursos</span><h2>Toda la Biblia, curso por curso</h2><p class="lead">Kids &amp; Hero crece de a un curso por vez. Los puntos, niveles y logros se suman de un curso al siguiente.</p></div>
<div class="crs">
<article class="rv on"><div class="im"><img loading="lazy" src="{im('g_h1', 900, 560)}" alt="Tras sus pasos"></div><div class="bd"><span class="st">Curso 1 · Muy pronto</span><h3>Tras sus pasos</h3><p>La vida de Jesús en nueve etapas, de Belén a la tumba vacía.</p></div></article>
<article class="rv"><div class="ph0"><span>II</span></div><div class="bd"><span class="st off">Curso 2 · Próximamente</span><h3>Hechos</h3><p>Pentecostés y la iglesia que nace y llega hasta lo último de la tierra.</p></div></article>
<article class="rv"><div class="ph0"><span>+</span></div><div class="bd"><span class="st off">En preparación</span><h3>Y muchos más</h3><p>Nuevos cursos para seguir recorriendo la Palabra.</p></div></article>
</div></div></section>

<section class="sec dk"><div class="wrap">
<div class="sec-h rv"><span class="kick">Dos caminos según la edad</span><h2>Kids y Hero</h2><p class="lead">Cada curso se juega en dos versiones. Cada chico entra en la que va con su edad, con su propio perfil y su propio progreso.</p></div>
<div class="br">
<article class="kids rv"><div class="im"><img loading="lazy" src="{im('g_k1', 1000, 625)}" alt="Camino de Kids"></div><div class="bd"><span class="age">Kids · 6 a 11 años</span><h3>Un camino marcado y luminoso</h3><p>Colores vivos, un sendero que siempre muestra hacia dónde ir y juegos simples para los más chicos.</p><ul><li>Historias narradas y versículos en voz alta</li><li>Minijuegos cortos y desafíos para pensar</li><li>Misiones para ayudar a personajes bíblicos</li></ul></div></article>
<article class="hero-b rv"><div class="im"><img loading="lazy" src="{im('g_h0', 1000, 625)}" alt="Mundo abierto de Hero"></div><div class="bd"><span class="age">Hero · 12 a 18 años</span><h3>Un mundo abierto para explorar</h3><p>Todo lo de Kids, más un mundo libre con oficios, supervivencia y virtudes para hacer crecer.</p><ul><li>Pescar, talar, cocinar y construir su casa</li><li>Atributos, Humildad y Servicio</li><li>Mercados, denarios y salas con amigos</li></ul></div></article>
</div></div></section>

<section class="sec dk" style="padding-top:0"><div class="wrap">
<div class="sec-h rv"><span class="kick">Curso 1 · Tras sus pasos</span><h2>Nueve etapas por la vida de Jesús</h2><p class="lead">Cada etapa tiene historias, misiones, minijuegos y un examen final. Al terminar, el camino sigue en Hechos.</p></div>
<div class="road rv">{''.join(f'<div><b>{i+1}</b><span>{e}</span></div>' for i,e in enumerate(ETAPAS))}<div class="nx"><b>+</b><span>Hechos<br>próximo curso</span></div></div>
</div></section>

<section class="sec"><div class="wrap">
<div class="sec-h rv"><span class="kick" style="color:var(--gold)">Cómo se aprende jugando</span><h2>Cada juego es una puerta a la Palabra</h2><p class="lead">Todo está pensado para que salgan sabiendo más de la Biblia: historias, versículos, preguntas y desafíos que se repasan una y otra vez mientras juegan.</p></div>
<div class="lg">{''.join(f'<article class="rv"><i aria-hidden="true">{a}</i><b>{t}</b><p>{d}</p></article>' for a,t,d in LEARN)}</div>
</div></section>

<section class="sec dk"><div class="wrap">
<div class="sec-h rv"><span class="kick">Un vistazo</span><h2>Así se ve por dentro</h2></div>
<div class="phones">
<figure class="rv"><div class="fr"><img loading="lazy" src="{im('g_m3', 420)}" alt="Minijuego Partir el pan"></div><figcaption>Partir el pan · Lucas 24</figcaption></figure>
<figure class="rv"><div class="fr"><img loading="lazy" src="{im('g_stone', 420)}" alt="Minijuego Correr la piedra"></div><figcaption>Correr la piedra · Mateo 28</figcaption></figure>
<figure class="rv"><div class="fr"><img loading="lazy" src="{im('g_quien', 420)}" alt="Juego ¿Quién soy?"></div><figcaption>¿Quién soy? · con amigos</figcaption></figure>
<figure class="rv"><div class="fr"><img loading="lazy" src="{im('g_cadena', 420)}" alt="Versículo en cadena"></div><figcaption>Versículo en cadena · con amigos</figcaption></figure>
</div></div></section>

<section class="sec"><div class="wrap">
<div class="sec-h rv"><span class="kick" style="color:var(--gold)">Para madres, padres y líderes</span><h2>Preguntas frecuentes</h2></div>
<div class="faq rv">
<details><summary>¿Cuándo se puede jugar?</summary><p>Estamos terminando los últimos detalles de Tras sus pasos, el primer curso. Muy pronto vas a poder entrar desde esta misma página.</p></details>
<details><summary>¿En qué se juega?</summary><p>En el navegador, desde el celular, la tablet o la computadora. No hace falta instalar nada.</p></details>
<details><summary>¿Qué Biblia usa?</summary><p>Los versículos citados son de la Nueva Traducción Viviente (NTV). Cada respuesta muestra el pasaje para buscarlo en la Biblia.</p></details>
<details><summary>¿Es seguro para los chicos?</summary><p>Cada chico juega con su propio perfil. Las salas para jugar con amigos son privadas y solo entra quien tiene el código.</p></details>
<details><summary>¿Lo pueden usar las iglesias?</summary><p>Sí. Está pensado para acompañar a ministerios de niños y adolescentes, y para jugar en familia.</p></details>
</div></div></section>

<section class="band-img sec"><div class="bg" style="background-image:url('{im('g_h1', 2000)}')"></div><div class="wrap rv" style="display:grid;gap:20px;justify-items:center;text-align:center">
<span class="kick" style="color:#ffe3a3">Kids &amp; Hero · Tras sus pasos</span><h2>Preparate para caminar con Jesús</h2>
<button class="soon" type="button" data-soon><span><span class="lock" aria-hidden="true">🔒</span>Jugar</span><small>Muy pronto</small></button>
<p class="soon-note" aria-live="polite"></p>
</div></section>
</div>
'''
SOONJS = """<script>document.querySelectorAll('[data-soon]').forEach(function(b){b.addEventListener('click',function(){var n=b.parentNode.querySelector('.soon-note');if(n){n.textContent='¡Ya casi! Estamos preparando el lanzamiento. Muy pronto vas a poder jugar desde acá.';}b.animate&&b.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:320});});});</script>
"""
_unused = ('kids-hero.html', 'Kids & Hero · Habitat', 'Kids & Hero: formación bíblica que se juega, para chicos de 6 a 11 y adolescentes de 12 a 18. Primer curso: Tras sus pasos.', khp, SOONJS)

import subprocess, sys
subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'kh_build.py')], check=True)
print('ok', sorted(os.listdir(OUT)))
