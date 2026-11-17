#!/usr/bin/env python3
"""Arma el juego Kids & Hero para la web de Habitat (habitat-cfm.org/jugar.html).
Toma la portada copiada del sitio viejo (src/) y los módulos de Wix (wix/), y deja todo en public/,
que el workflow «Publicar web Habitat» suma a la web. La versión del juego (commit) se lee al abrir
la página desde /api/kh-version (colección KhVersion), así actualizar el juego no pide publicar la web."""
import os, re, json, shutil
D = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(D, 'src'), os.path.join(D, 'public')
HAB_CLIENT = '5aef9a95-3bae-4199-b47d-0ef2db70dc76'  # cliente de Wix del sitio de Habitat
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(os.path.join(OUT, 'kh', 'wix'))
h = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
# script de Wix del sitio viejo (estadísticas y cartel): afuera
h = re.sub(r'<script id="wix-site-script"[^>]*></script>', '', h)
# archivos propios del juego: van en /kh/
for f in ['hero-game.css', 'hero.css', 'home.css', 'hub.css', 'portal.css', 'hero.js', 'home.js', 'portal.js', 'manifest.json']:
    assert f'"/{f}"' in h, f
    h = h.replace(f'"/{f}"', f'"/kh/{f}"')
    shutil.copy(os.path.join(SRC, f), os.path.join(OUT, 'kh', f))
# el juego (game.js) se carga con la versión publicada en KhVersion; si la consulta falla, usa la fijada acá
m = re.search(r'<script type="module" src="https://rawcdn\.githack\.com/galessandrodale93-pixel/tras-sus-pasos-modelos/([0-9a-f]{40})/app/game\.js"[^>]*></script>', h)
assert m, 'game.js'
pin = m.group(1)
vf = os.path.join(D, 'version.txt')
if os.path.exists(vf) and re.fullmatch(r'[0-9a-f]{40}', open(vf).read().strip()): pin = open(vf).read().strip()
loader = ('<script>window.TSP_WIX=location.origin+"/kh/wix";window.TSP_SW_SCOPE="/jugar";'
          '(function(){var R="https://rawcdn.githack.com/galessandrodale93-pixel/tras-sus-pasos-modelos/",F="https://raw.githack.com/galessandrodale93-pixel/tras-sus-pasos-modelos/",PIN="' + pin + '";'
          'function go(v){if(window.__tspGo)return;window.__tspGo=1;var s=document.createElement("script");s.type="module";s.src=R+v+"/app/game.js";'
          's.onerror=function(){var t=document.createElement("script");t.type="module";t.src=F+v+"/app/game.js";document.body.appendChild(t);};document.body.appendChild(s);}'
          'var to=setTimeout(function(){go(PIN);},2500);'
          'fetch("/api/kh-version",{cache:"no-store"}).then(function(r){return r.json();}).then(function(j){clearTimeout(to);go(/^[0-9a-f]{40}$/.test(j&&j.hash||"")?j.hash:PIN);}).catch(function(){clearTimeout(to);go(PIN);});'
          '})();</script>')
h = h.replace(m.group(0), loader)
# manifest: arranca en /jugar.html
mf = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
mf['start_url'] = '/jugar.html#jugar-hero'; mf['scope'] = '/jugar'
json.dump(mf, open(os.path.join(OUT, 'kh', 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(os.path.join(OUT, 'jugar.html'), 'w', encoding='utf-8').write(h)
# service worker en la raíz (con alcance /jugar, no toca el resto de la web)
sw = open(os.path.join(SRC, 'tsp-sw.js'), encoding='utf-8').read().replace("caches.match('/')", "caches.match('/jugar.html')")
open(os.path.join(OUT, 'tsp-sw.js'), 'w', encoding='utf-8').write(sw)
# módulos de Wix (kit headless) con el cliente de Habitat
for f in os.listdir(os.path.join(D, 'wix')):
    shutil.copy(os.path.join(D, 'wix', f), os.path.join(OUT, 'kh', 'wix', f))
open(os.path.join(OUT, 'kh', 'wix', 'config.js'), 'w').write(f'export const WIX_CLIENT_ID = "{HAB_CLIENT}";\n')
print('jugar.html listo; versión fijada', pin[:7])
