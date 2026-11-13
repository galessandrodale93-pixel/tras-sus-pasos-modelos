#!/usr/bin/env python3
"""Kids & Hero en el sitio de Habitat, con el mismo diseño del frente del juego (sin poder jugar todavía)."""
import re, os
D = os.path.dirname(os.path.abspath(__file__))
h = open(os.path.join(D, 'src/hub_snap.html'), encoding='utf-8').read()
css = open(os.path.join(D, 'src/hub_css.css'), encoding='utf-8').read()
W = 'https://static.wixstatic.com/media/'
HEROBG = W + '43ca3b_f37cfa4de4704761b516348e5400c95b~mv2.png'
SH = {k: W + v for k, v in dict(h1='43ca3b_585709d428e848cf930f5fa5aab0c3e3~mv2.jpg', m3='43ca3b_211c9ca3747245c1a8af2da5b42589a7~mv2.jpg',
      stone='43ca3b_ff843c913b79464ea39c922cd9f7d6e7~mv2.jpg', quien='43ca3b_6c343b0ef2364b178f813b87a3227256~mv2.jpg',
      cadena='43ca3b_8244f24245ef4362bf6a5434ca03ec7d~mv2.jpg').items()}
PH = {k: W + v for k, v in dict(g_hechos='43ca3b_14f92fb043e84ca8b0d5483ee8cb31ff~mv2.jpg', g_maranata='43ca3b_97e26d33140043a8b9a4dfe387753182~mv2.jpg', candle='43ca3b_299dbf49ec23478fa1b91efccf2c01d3~mv2.jpg', sky='43ca3b_80f9059568df4040a3be490520207e23~mv2.jpg', mountains='43ca3b_ee037bfbf2be4130aab0698db817c3a5~mv2.jpg', ocean2='43ca3b_cce0c4a66cd94fb9aac9288a5003d9dc~mv2.jpg', k1='43ca3b_98e5be72610e444d8ccc770144050f5f~mv2.jpg', h0='43ca3b_03afacc334b94f28a5678deda935d374~mv2.jpg').items()}
LOGO = W + '43ca3b_dbb2ca1106804e9b9271ee3989f69c9f~mv2.jpg/v1/fill/w_96,h_96,al_c,q_82/logo.jpg'


# textos genéricos para todos los cursos
for a, b in [('Cada etapa recorre la vida de Jesús con escenas animadas y narración, de Belén hasta la cruz.', 'Cada curso recorre la Biblia con escenas animadas y narración, historia por historia.'), ('Más de sesenta juegos distintos, cada uno nacido de su historia: llenar las tinajas de Caná, echar las redes, lavar los pies.', 'Cada minijuego nace de su historia y ninguno se repite, ni dentro de un curso ni entre un curso y otro.'), ('Caminan libres por Nazaret, el templo, el mar de Galilea y el Gólgota. Cada lugar muestra cómo se vivía en tiempos de Jesús.', 'Cada curso tiene su propio mundo para recorrer libremente: los lugares donde pasó cada historia y cómo se vivía en esa época.'), ('Ayudan a personajes bíblicos: llevar el pan, buscar la oveja perdida, orar en el huerto. Aprenden a servir haciendo.', 'Ayudan a los personajes bíblicos de cada historia con misiones de servicio. Aprenden a servir haciendo.'), ('Venden lo que cosechan en los mercados y compran en la carpintería o la panadería. En el camino hay mendigos: compartir con ellos les enseña lo que Jesús dijo en Mateo 25.', 'Venden lo que cosechan en los mercados y compran lo que necesitan. En el camino hay personas necesitadas: compartir con ellas les enseña lo que Jesús dijo en Mateo 25.'), ('a ¿Quién soy?, al Versículo en cadena y a carreras por la tierra de Jesús.', 'a ¿Quién soy?, al Versículo en cadena y a carreras por los lugares de cada curso.'), ('Niveles, medallas, recuerdos y una prenda única para quienes terminan el curso. Los puntos se suman de un curso a otro.', 'Niveles, medallas, recuerdos y una insignia en el avatar por cada curso terminado, a la vista de todos. Los puntos se suman de un curso a otro.')]:
    assert a in h, a[:40]
    h = h.replace(a, b)
# cortar la parte de cuenta y familia
h = h[:h.index('<section class="fam2"')] + h[h.index('<footer class="home-foot">'):]
h = h.replace('Citas bíblicas: Nueva Traducción Viviente (NTV) · Versión de prueba', 'Citas bíblicas: Nueva Traducción Viviente (NTV)')
h = h.replace('Un proyecto de <b>Habitat CFM</b>', 'Un espacio de <a href="/index.html"><b>Habitat CFM</b></a>')
# encabezado con vuelta a Habitat
h = h.replace('<header class="top"><span class="mark">Habitat CFM</span></header>',
              f'<header class="top"><span class="mark">Kids &amp; Hero</span></header>')
h = h.replace('<section class="stage"><canvas id="hubSky" aria-hidden="true" width="1440" height="1187"></canvas>', f'<section class="stage"><canvas id="hubSky" aria-hidden="true" width="1440" height="1187"></canvas><a class="hbx-back" href="/index.html" aria-label="Volver a Habitat"><img src="{LOGO}" alt=""><span>Habitat</span></a>')
assert 'hbx-back' in h
# botón Muy pronto debajo del título
h = h.replace('<p>Entrenamiento bíblico jugando, para niños y adolescentes de 6 a 18 años.</p>\n    </section>',
              '<p>Entrenamiento bíblico jugando, para niños y adolescentes de 6 a 18 años.</p>\n'
              '<div class="hbx-cta"><button class="hbx-soon" type="button" data-soon><span>🔒 Jugar</span><small>Muy pronto</small></button></div>\n    </section>')
# tarjetas Kids / Hero: abren su portal (sin poder jugar)
assert 'data-go="kids"' in h and 'data-go="hero"' in h

CURSOS = [
    ('Curso 1 · Muy pronto', True, 'Tras sus pasos', 'La vida de Jesús, de Belén a la tumba vacía.', '/assets/kh/tras-v3.jpg',
     ['Nacimiento', 'Infancia', 'Bautismo', 'Galilea', 'Milagros', 'Parábolas', 'Jerusalén', 'La cruz', 'Resurrección']),
    ('Curso 2 · Próximamente', False, 'Hechos', 'El Espíritu llega y la iglesia nace y sale a las naciones.', W + '43ca3b_2aa79ffc3ca041f0aa2ff4c4ecfe94db~mv2.jpg',
     ['Pentecostés', 'La iglesia en Jerusalén', 'Esteban', 'Felipe y el etíope', 'Saulo en el camino', 'Pedro y Cornelio', 'Los viajes de Pablo', 'Pablo en Roma']),
    ('Curso 3 · Próximamente', False, 'Maranata', '¡Cristo viene! Apocalipsis contado para niños y adolescentes.', W + '43ca3b_5148a3d6f21141bea048547a3601460a~mv2.jpg',
     ['Jesús vuelve', 'Las siete iglesias', 'El trono de Dios', 'El Cordero y el rollo', 'Los sellos', 'El pueblo de Dios cuidado', 'La Nueva Jerusalén', 'Cielo nuevo y tierra nueva']),
    ('Curso 4 · En preparación', False, 'En el principio', 'Génesis: la creación y las familias que caminaron con Dios.', W + '43ca3b_e30197b7af2c4b9d8f24e6f87dc0c1ea~mv2.jpg',
     ['La creación', 'Adán y Eva', 'Noé', 'Babel', 'Abraham', 'Isaac', 'Jacob', 'José']),
    ('Curso 5 · En preparación', False, 'Héroes de la fe', 'Hombres y mujeres que confiaron en Dios cuando todo parecía imposible.', W + '43ca3b_a07237f8d1784d8f9e30b9216b415457~mv2.jpg',
     ['Moisés', 'El mar Rojo', 'Josué y Jericó', 'Débora', 'Gedeón', 'Samuel', 'David y Goliat', 'Daniel']),
]
def _card(st, on, t, d, img, hitos):
    chips = ''.join(f'<li><b>{i + 1}</b><span>{x}</span></li>' for i, x in enumerate(hitos))
    return (f'<article class="{"on open" if on else ""}" tabindex="0" role="button" aria-expanded="{"true" if on else "false"}"><div class="im" style="background-image:url(\'{img if img.startswith('/') else img + '/v1/fill/w_900,h_520,al_c,q_82/c.jpg'}\')"><span class="st{"" if on else " off"}">{st}</span></div>'
            f'<div class="bd"><div class="hd"><b>{t}</b><span class="tg" aria-hidden="true">+</span></div><p class="dsk">{d}</p><div class="more"><div class="in"><p>{d}</p><ol class="hbx-road">{chips}</ol></div></div></div></article>')
cursos = f"""
  <section class="hbx-courses"><div class="wrap">
    <span class="why-k">Los cursos</span>
    <h2 class="hbx-h">Toda la Biblia, <em>curso por curso</em></h2>
    <p class="hbx-l">Kids &amp; Hero crece de a un curso por vez. Cada curso se juega en las dos versiones, Kids y Hero, y los puntos, niveles y logros se suman de un curso al siguiente.</p>
    <div class="hbx-cg">{''.join(_card(*c) for c in CURSOS)}</div>
  </div></section>
"""
h = h.replace('<section class="learn"', cursos + '<section class="learn"', 1)
# "Por qué hacemos esto" justo debajo del título y el botón
wi = h.index('<div class="why">'); wj = h.index('</div>', h.index('<span class="why-s">', wi)) + len('</div>')
why = h[wi:wj]; h = h[:wi] + h[wj:]
h = h.replace('<section class="duo">', '<section class="hbx-why">' + why + '</section>\n    <section class="duo">', 1)
# galería después de "cómo se aprende"
VIDS = {}  # 'kids'/'hero': URL de video mp4 (si existe)
def _media(k, img):
    v = VIDS.get(k)
    if v:
        return f'<video autoplay muted loop playsinline preload="metadata" poster="{img if img.startswith('/') else img + '/v1/fill/w_960,h_540,al_c,q_82/p.jpg'}" src="{v}"></video>'
    return f'<img loading="lazy" src="{img if img.startswith('/') else img + '/v1/fill/w_960,h_540,al_c,q_82/w.jpg'}" alt="">'
KIDS_MEDIA = _media('kids', '/assets/kh/g-kids-v3.jpg')
HERO_MEDIA = _media('hero', '/assets/kh/g-hero-v3.jpg')
gal = f'''
  <section class="hbx-gal"><div class="wrap">
    <span class="why-k">Un vistazo</span>
    <h2 class="hbx-h">Así se ve <em>por dentro</em></h2>
    <div class="hbx-split">
      <div class="hbx-col kids">
        <div class="hbx-tag">Kids · 6 a 11 años</div>
        <div class="hbx-media">{KIDS_MEDIA}</div>
        <p>Un camino marcado y luminoso, historias narradas y juegos simples para los más chicos.</p>
        <div class="hbx-ph">
          <figure><img loading="lazy" src="{SH['m3']}/v1/fit/w_420,h_840,q_85/m3.jpg" alt="Minijuego Partir el pan"><figcaption>Partir el pan</figcaption></figure>
          <figure><img loading="lazy" src="{SH['stone']}/v1/fit/w_420,h_840,q_85/s.jpg" alt="Minijuego Correr la piedra"><figcaption>Correr la piedra</figcaption></figure>
        </div>
      </div>
      <div class="hbx-col hero">
        <div class="hbx-tag">Hero · 12 a 18 años</div>
        <div class="hbx-media">{HERO_MEDIA}</div>
        <p>Un mundo abierto para explorar: oficios, misiones, virtudes y salas para jugar con amigos.</p>
        <div class="hbx-ph">
          <figure><img loading="lazy" src="{SH['quien']}/v1/fit/w_420,h_840,q_85/q.jpg" alt="¿Quién soy?"><figcaption>¿Quién soy? · con amigos</figcaption></figure>
          <figure><img loading="lazy" src="{SH['cadena']}/v1/fit/w_420,h_840,q_85/c.jpg" alt="Versículo en cadena"><figcaption>Versículo en cadena</figcaption></figure>
        </div>
      </div>
    </div>
  </div></section>
'''
h = h.replace('<section class="mid">', gal + '<section class="mid">', 1)
# columna lateral: en vez de datos en vivo, "Muy pronto" + preguntas
i = h.index('<aside class="side">'); j = h.index('</aside>', i) + len('</aside>')
side = '''<aside class="side">
      <span class="hbx-badge">Muy pronto</span>
      <h2>Ya casi</h2>
      <p class="lede">Estamos terminando los últimos detalles de Tras sus pasos, el primer curso. Muy pronto se va a poder jugar desde acá.</p>
      <button class="hbx-soon wide" type="button" data-soon><span>🔒 Jugar</span><small>Muy pronto</small></button>
      <div class="hbx-faq">
        <details><summary>¿En qué se juega?</summary><p>En el navegador, desde el celular, la tablet o la computadora. No hace falta instalar nada.</p></details>
        <details><summary>¿Qué Biblia usa?</summary><p>Los versículos citados son de la Nueva Traducción Viviente (NTV). Cada respuesta muestra el pasaje para buscarlo en la Biblia.</p></details>
        <details><summary>¿Es seguro para los chicos?</summary><p>Cada chico juega con su propio perfil. Las salas para jugar con amigos son privadas y solo entra quien tiene el código.</p></details>
        <details><summary>¿Lo pueden usar las iglesias?</summary><p>Sí. Está pensado para acompañar a ministerios de niños y adolescentes, y para jugar en familia.</p></details>
      </div>
    </aside>'''
h = h[:i] + side + h[j:]
h = re.sub(r'<article><span class="learn-i" aria-hidden="true">🛡️</span><b>Un lugar cuidado</b>.*?</article>', '', h, flags=re.S)
assert 'fam-card' not in h

# portales Kids y Hero (vistas del juego, sin poder jugar)
SOONNOTE = '<span>🔒 Muy pronto · Estamos terminando el primer curso</span>'
FOOT = 'Un espacio de <a href="/index.html"><b>Habitat CFM</b></a> · Citas bíblicas: Nueva Traducción Viviente (NTV)'
def _view(fn):
    v = open(os.path.join(D, 'src', fn), encoding='utf-8').read()
    v = re.sub(r'<div class="session( glass)?" data-session><span>.*?</span></div>', lambda m: f'<div class="session{m.group(1) or ""}">{SOONNOTE}</div>', v)
    v = re.sub(r'(<footer class="(?:home|hx)-foot">).*?(</footer>)', lambda m: m.group(1) + FOOT + m.group(2), v, flags=re.S)
    for a in ['Empezar la aventura', 'Jugar ahora', 'Comenzar la expedición']:
        v = v.replace(f'>{a}</button>', f'>🔒 {a}</button>')
    v = v.replace('</svg>Inicio</button>', '</svg>Kids &amp; Hero</button>')
    for a, b in [('El primero ya está abierto y los demás se van sumando.', 'El primero está por abrirse y los demás se van sumando.'),
                 ('La primera ya está abierta. Las demás siguen selladas y se abren de a una.', 'La primera está por abrirse. Las demás siguen selladas y se abren de a una.'),
                 ('<span class="hx-label">Expedición I abierta</span>', '<span class="hx-label">Expedición I · Muy pronto</span>')]:
        v = v.replace(a, b)
    assert 'data-session' not in v and 'Versión de prueba' not in v
    return v
h = h + '\n' + _view('kids_view.html') + '\n' + _view('hero_view.html')

extra = f'''
:root{{--hx-img:url("{HEROBG}")}}
html,body{{background:#090b1c}}
body{{margin:0;font-family:Nunito,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
.hub3 .top{{position:relative;display:flex;justify-content:center;align-items:center;min-height:44px}}
.hbx-back{{position:absolute;left:0;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font:700 12px/1 Archivo,Nunito,sans-serif;letter-spacing:.28em;text-transform:uppercase;opacity:.85;padding:6px 14px 6px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);transition:opacity .2s,background .2s}}
.hbx-back:hover{{opacity:1;background:rgba(255,255,255,.1)}}
.hbx-back img{{width:28px;height:28px;border-radius:50%;object-fit:cover;background:#fff}}
@media (max-width:560px){{.hbx-back span{{display:none}}.hbx-back{{padding:4px}}}}
.hbx-cta{{display:flex;justify-content:center;margin-top:26px}}
.hbx-soon{{position:relative;overflow:hidden;display:inline-grid;justify-items:center;gap:6px;padding:18px 44px;border-radius:20px;border:0;cursor:pointer;color:#3a2606;background:linear-gradient(135deg,#ffe08a,#f2b23e 55%,#ffd76e);box-shadow:0 14px 40px rgba(242,178,62,.4),inset 0 -4px 0 rgba(0,0,0,.15);font:800 18px/1 Archivo,Nunito,sans-serif;letter-spacing:.04em;transition:transform .25s}}
.hbx-soon small{{font:800 10.5px/1 Nunito,sans-serif;letter-spacing:.3em;text-transform:uppercase;opacity:.75}}
.hbx-soon::before{{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-20deg);animation:hbxshine 3.2s infinite}}
.hbx-soon:hover{{transform:translateY(-3px) scale(1.02)}}
.hbx-soon.wide{{width:100%}}
@keyframes hbxshine{{0%{{left:-60%}}60%,100%{{left:130%}}}}
.hbx-toast{{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;z-index:99;max-width:min(92vw,460px);padding:16px 22px;border-radius:18px;background:rgba(20,22,48,.96);border:1px solid rgba(255,210,94,.35);color:#fff;font:700 15px/1.45 Nunito,sans-serif;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.45);transition:opacity .3s,transform .3s;pointer-events:none}}
.hbx-toast.on{{opacity:1;transform:translate(-50%,0)}}
.hbx-toast b{{color:#FFD25E}}
.hbx-courses,.hbx-gal{{padding:30px 0 70px}}
.hbx-h{{margin:8px 0 10px;font:800 clamp(28px,4.4vw,46px)/1.08 Archivo,Nunito,sans-serif;color:#fff;letter-spacing:-.01em}}
.hbx-h em{{font-style:normal;color:#FFD25E}}
.hbx-l{{max-width:620px;margin:0 0 30px;color:rgba(232,236,255,.72);font-size:16px;line-height:1.6}}
.hbx-cg{{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:18px}}
.hbx-cg article{{border-radius:22px;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);display:grid;grid-template-rows:auto 1fr}}
.hbx-cg article.on{{border-color:rgba(255,210,94,.45);box-shadow:0 24px 60px rgba(242,178,62,.15)}}
.hbx-cg .im{{aspect-ratio:16/9;background-size:cover;background-position:center}}
.hbx-cg .ph{{display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#2c2a66,#12132e)}}
.hbx-cg .ph span{{font:800 64px/1 Archivo,sans-serif;color:rgba(255,210,94,.45)}}
.hbx-cg .bd{{padding:20px 22px 24px;display:grid;gap:8px;align-content:start}}
.hbx-cg .bd b{{font:800 22px/1.15 Archivo,Nunito,sans-serif;color:#fff}}
.hbx-cg .bd p{{margin:0;color:rgba(232,236,255,.7);font-size:15px;line-height:1.55}}
.hbx-cg .st{{justify-self:start;font:800 10.5px/1 Nunito,sans-serif;letter-spacing:.18em;text-transform:uppercase;padding:7px 11px;border-radius:999px;background:#FFD25E;color:#3a2606}}
.hbx-cg .st.off{{background:rgba(255,255,255,.08);color:rgba(232,236,255,.7)}}
.hbx-road{{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}}
.hbx-road li{{display:flex;align-items:center;gap:7px;padding:6px 11px 6px 6px;border-radius:999px;background:rgba(255,255,255,.06);font:700 12.5px/1 Nunito,sans-serif;color:#e8ecff}}
.hbx-road b{{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#FFD25E;color:#3a2606;font:800 11px/1 Archivo,sans-serif}}
.hbx-road .nx{{border:1px dashed rgba(255,255,255,.3);background:none;color:rgba(232,236,255,.65)}}
.hbx-road .nx b{{background:rgba(255,255,255,.12);color:#fff}}
@media (max-width:900px){{.hbx-cg{{grid-template-columns:1fr}}}}
.hbx-ph{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:24px}}
.hbx-ph figure{{margin:0;display:grid;gap:12px;justify-items:center}}
.hbx-ph img{{width:100%;max-width:100%;aspect-ratio:420/780;object-fit:cover;object-position:top;border-radius:26px;border:7px solid #05060f;box-shadow:0 26px 60px rgba(0,0,0,.5)}}
.hbx-ph figcaption{{font:700 13px/1.3 Nunito,sans-serif;color:rgba(232,236,255,.7);text-align:center}}
@media (max-width:820px){{.hbx-ph{{grid-template-columns:repeat(2,1fr);gap:14px}}}}
.hbx-badge{{justify-self:start;font:800 10.5px/1 Nunito,sans-serif;letter-spacing:.2em;text-transform:uppercase;padding:7px 11px;border-radius:999px;background:rgba(255,210,94,.15);color:#FFD25E}}
.hbx-faq{{display:grid;gap:8px}}
.hbx-faq details{{border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:12px 14px}}
.hbx-faq summary{{cursor:pointer;font:800 14.5px/1.3 Nunito,sans-serif;color:#fff;list-style:none}}
.hbx-faq summary::after{{content:"+";float:right;color:#FFD25E}}
.hbx-faq details[open] summary::after{{content:"–"}}
.hbx-faq p{{margin:8px 0 0;color:rgba(232,236,255,.7);font-size:14px;line-height:1.5}}
.home-foot a{{color:inherit}} 
/* cursos: compactos, se abren al tocar */
.hbx-cg article{{cursor:pointer;outline:none;transition:border-color .25s,box-shadow .25s}}
.hbx-cg article:focus-visible{{border-color:rgba(255,210,94,.6)}}
.hbx-cg .hd{{display:flex;align-items:center;justify-content:space-between;gap:12px}}
.hbx-cg .tg{{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(255,210,94,.14);color:#FFD25E;font:800 16px/1 Nunito,sans-serif;transition:transform .3s}}
.hbx-cg article.open .tg{{transform:rotate(45deg)}}
.hbx-cg .more{{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}}
.hbx-cg .more>*{{min-height:0;overflow:hidden}}
.hbx-cg .dsk{{display:none}}
@media (min-width:901px){{.hbx-cg .dsk{{display:block}}.hbx-cg .more .in>p{{display:none}}}}
.hbx-cg .more{{gap:0}}
.hbx-cg article.open .more{{grid-template-rows:1fr}}
.hbx-cg .more p{{margin-top:8px}}
.hbx-cg .bd{{gap:0}}
.hbx-cg{{align-items:start}}
@media (max-width:900px){{
  html body .hbx-cg{{gap:12px;grid-template-columns:1fr}}
  html body .hbx-cg article.on{{grid-column:auto}}
  html body .hbx-cg article{{grid-template-columns:120px 1fr;grid-template-rows:auto}}
  html body .hbx-cg article .im{{aspect-ratio:auto;min-height:96px;height:100%}}
  html body .hbx-cg article .im .st{{left:8px;top:8px;font-size:9px;padding:5px 8px;max-width:calc(100% - 16px);white-space:normal;line-height:1.2}}
  html body .hbx-cg article.open{{grid-template-columns:1fr}}
  html body .hbx-cg article.open .im{{aspect-ratio:16/8;height:auto}}
  html body .hbx-cg .bd{{padding:14px 16px;align-content:center}}
  html body .hbx-cg .bd b{{font-size:18px}}
}}
 
.stage{{position:relative}}
.hbx-back{{position:absolute;left:max(14px,env(safe-area-inset-left,0px));top:calc(14px + env(safe-area-inset-top,0px));z-index:5;transform:none}}
.hub3 .top{{padding-top:30px}}
.hbx-why{{max-width:860px;margin:56px auto 64px}}
.hbx-cg{{grid-template-columns:repeat(3,1fr)}}
.hbx-cg article.on{{grid-column:span 2}}
.hbx-cg .im{{position:relative;aspect-ratio:16/8}}
.hbx-cg .im .st{{position:absolute;left:14px;top:14px}}
.hbx-cg .im::after{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,11,28,0) 40%,rgba(9,11,28,.55))}}
.hbx-cg .im .st{{z-index:1}}
.hbx-split{{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:26px}}
.hbx-col p,.hbx-col.hero p,.hbx-col.kids p{{max-width:none;margin:0}}
.hbx-col{{display:grid;gap:14px;align-content:start;padding:20px;border-radius:24px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}}
.hbx-col.kids{{background:linear-gradient(160deg,rgba(91,141,239,.14),rgba(255,176,137,.08))}}
.hbx-col.hero{{background:linear-gradient(160deg,rgba(226,172,85,.12),rgba(59,31,74,.18))}}
.hbx-tag{{justify-self:start;font:800 11px/1 Nunito,sans-serif;letter-spacing:.2em;text-transform:uppercase;padding:8px 12px;border-radius:999px;background:#8fe0c8;color:#0d3b30}}
.hbx-col.hero .hbx-tag{{background:#FFD25E;color:#3a2606}}
.hbx-media{{border-radius:16px;overflow:hidden;aspect-ratio:16/9;background:#0d0f22}}
.hbx-media img,.hbx-media video{{width:100%;height:100%;object-fit:cover;display:block}}
.hbx-col>p{{margin:0;color:rgba(232,236,255,.75);font-size:15px;line-height:1.55}}
.hbx-col .hbx-ph{{grid-template-columns:1fr 1fr;gap:14px;margin-top:4px}}
@media (max-width:900px){{.hbx-split{{grid-template-columns:1fr}}.hbx-cg article.on{{grid-column:auto}}}}
 
/* cómo se aprende: compacto, descripción al pasar el mouse */
.learn-g{{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}}
.learn-g article{{position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:default;outline:none;transition:border-color .25s,background .25s}}
.learn-g article:hover,.learn-g article:focus,.learn-g article.open{{border-color:rgba(255,210,94,.45);background:#151b33;z-index:6}}
.learn-g .learn-i{{font-size:22px;flex:none}}
.learn-g b{{font-size:15px}}
.learn-g p{{position:absolute;left:-1px;right:-1px;top:calc(100% - 6px);padding:12px 16px 14px;border-radius:0 0 18px 18px;background:#151b33;border:1px solid rgba(255,210,94,.45);border-top:0;box-shadow:0 18px 40px rgba(0,0,0,.45);opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .22s,transform .22s}}
.learn-g article:hover p,.learn-g article:focus p,.learn-g article.open p{{opacity:1;transform:none}}
.learn-g article::after{{content:"+";margin-left:auto;color:rgba(255,210,94,.7);font:800 16px/1 Nunito,sans-serif;transition:transform .25s}}
.learn-g article:hover::after,.learn-g article.open::after{{transform:rotate(45deg)}}
.learn .learn-l{{margin-bottom:18px}}

.hbx-courses .why-k,.hbx-gal .why-k{{display:block;font:800 12px/1 Nunito,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#FFD25E;margin-bottom:4px}}
'''

js = r'''<div class="hbx-toast" role="status" aria-live="polite"></div>
<script>
(function(){
var t=document.querySelector('.hbx-toast'),tm;
function soon(e){if(e)e.preventDefault();t.innerHTML='<b>¡Ya casi!</b> Estamos preparando el lanzamiento de Kids &amp; Hero. Muy pronto vas a poder jugar desde acá.';t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on')},4200);}
document.addEventListener('click',function(e){if(e.target.closest('[data-soon],[data-play]'))soon(e);},true);
var V={hub:document.getElementById('hubView'),kids:document.getElementById('homeView'),hero:document.getElementById('adosView')};
function show(k,top){if(!V[k])k='hub';Object.keys(V).forEach(function(x){if(V[x])V[x].hidden=x!==k;});if(top!==false)window.scrollTo(0,0);}
function fromHash(){var k=location.hash.replace('#','');show(V[k]?k:'hub');}
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){var k=b.dataset.go;if(location.hash!=='#'+k)location.hash=k;else show(k);});});
document.querySelectorAll('[data-hub]').forEach(function(b){b.addEventListener('click',function(){if(location.hash){history.pushState('',document.title,location.pathname);}show('hub');});});
window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);fromHash();
document.querySelectorAll('.hbx-cg article').forEach(function(a){function tg(){var o=a.classList.toggle('open');a.setAttribute('aria-expanded',o);}a.addEventListener('click',tg);a.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tg();}});});
document.querySelectorAll('.learn-g article').forEach(function(a){a.tabIndex=0;a.addEventListener('click',function(){var o=a.classList.contains('open');document.querySelectorAll('.learn-g article.open').forEach(function(x){x.classList.remove('open')});if(!o)a.classList.add('open');});});
document.addEventListener('click',function(e){if(!e.target.closest('.learn-g article'))document.querySelectorAll('.learn-g article.open').forEach(function(x){x.classList.remove('open')});});
})();
</script>
<script src="/assets/kh-home.js"></script>
<script src="/assets/kh-portal.js"></script>
<script src="/assets/kh-hero.js"></script>'''

page = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Kids &amp; Hero · Habitat</title>
<meta name="description" content="Kids &amp; Hero: entrenamiento bíblico jugando para niños y adolescentes de 6 a 18 años. Primer curso: Tras sus pasos. Muy pronto.">
<meta property="og:title" content="Kids &amp; Hero · Habitat">
<meta property="og:image" content="https://habitat-cfm.org/assets/kh/og-v3.jpg">
<meta name="theme-color" content="#090b1c">
<link rel="icon" type="image/png" href="https://static.wixstatic.com/media/43ca3b_2d985f94c5e04a82b1434561cce4cc35~mv2.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Nunito:wght@500;700;800;900&family=Baloo+2:wght@600;700;800&family=Cinzel:wght@600;700;800&family=Archivo:wght@600;800;900&family=Montserrat:wght@600;700&display=swap">
<style>
{css}
{extra}
</style>
</head>
<body>
{h}
{js}
</body>
</html>
'''
import shutil
hm = open(os.path.join(D, 'src/home.js'), encoding='utf-8').read()
assert "'Disponible'" in hm
open(os.path.join(D, 'out/assets/kh-home.js'), 'w', encoding='utf-8').write(hm.replace("'Disponible'", "'Muy pronto'"))
shutil.copy(os.path.join(D, 'src/portal.js'), os.path.join(D, 'out/assets/kh-portal.js'))
hj = open(os.path.join(D, 'src/hero.js'), encoding='utf-8').read()
assert "var IMG='/bg.png';" in hj
assert "OPEN+'Abierta'" in hj
hj = hj.replace("OPEN+'Abierta'", "LOCK+'Muy pronto'")
hj = hj.replace("var IMG='/bg.png';", f"var IMG='{HEROBG}/v1/fill/w_2000,h_1200,al_c,q_82/h.jpg';").replace("var IMG_S='/bg.png';", f"var IMG_S='{HEROBG}/v1/fill/w_900,h_1400,al_c,q_80/hs.jpg';")
open(os.path.join(D, 'out/assets/kh-hero.js'), 'w', encoding='utf-8').write(hj)
open(os.path.join(D, 'out/kids-hero.html'), 'w', encoding='utf-8').write(page)
print('kids-hero.html', len(page))
