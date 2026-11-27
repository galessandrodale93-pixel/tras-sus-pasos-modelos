# arma desktop/build/background.png (+@2x): el fondo de la ventana del .dmg de Mac, donde se arrastra el juego a Aplicaciones
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
import numpy as np, os
A = 'desktop/assets/'
def ttf(n):
    p = '/tmp/' + n + '.ttf'
    if not os.path.exists(p): f = TTFont(A + 'f/' + n + '.woff2'); f.flavor = None; f.save(p)
    return p
def fondo(s):
    W, H = 540 * s, 380 * s
    bg = Image.open(A + 'hero3.jpg').convert('RGB'); r = max(W / bg.width, H / bg.height)
    bg = bg.resize((int(bg.width * r) + 1, int(bg.height * r) + 1), Image.LANCZOS); ox = (bg.width - W) // 2; bg = bg.crop((ox, 0, ox + W, H))
    yy, xx = np.mgrid[0:H, 0:W]; d = np.sqrt(((xx - W / 2) / (W / 1.5)) ** 2 + ((yy - H * .45) / (H / 1.3)) ** 2)
    sh = np.clip(.64 + .35 * d, 0, .92); a = np.asarray(bg).astype(float) * (1 - sh[..., None])
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert('RGBA')
    kids = Image.open(A + 'kids.png'); hero = Image.open(A + 'hero.png')
    kh = 62 * s; kids = kids.resize((int(kids.width * kh / kids.height), kh), Image.LANCZOS).rotate(4, resample=Image.BICUBIC, expand=True)
    hh = 42 * s; hero = hero.resize((int(hero.width * hh / hero.height), hh), Image.LANCZOS)
    cz = ImageFont.truetype(ttf('cinzel-latin-600-normal'), 22 * s); cs = ImageFont.truetype(ttf('cinzel-latin-600-normal'), 10 * s)
    fr = ImageFont.truetype(ttf('fraunces-latin-500-italic'), 12 * s)
    aw = 20 * s; tot = kids.width + aw + 8 * s + hero.width; x0 = (W - tot) // 2; y = 26 * s
    im.alpha_composite(kids, (x0, y)); dr = ImageDraw.Draw(im)
    dr.text((x0 + kids.width + 2 * s, y + 22 * s), '&', font=cz, fill=(233, 201, 138))
    im.alpha_composite(hero, (x0 + kids.width + aw + 8 * s, y + 13 * s))
    t = 'T R A S   S U S   P A S O S'; dr.text(((W - dr.textlength(t, font=cs)) / 2, 108 * s), t, font=cs, fill=(233, 201, 138))
    # flecha dorada entre el juego (140,230) y Aplicaciones (400,230)
    ax0, ax1, ay = 205 * s, 335 * s, 222 * s
    gl = Image.new('RGBA', (W, H)); g = ImageDraw.Draw(gl)
    for k in range(3): g.line((ax0 + k * 46 * s, ay, ax0 + k * 46 * s + 30 * s, ay), fill=(255, 224, 154, 255), width=2 * s)
    g.polygon([(ax1 + 8 * s, ay), (ax1 - 4 * s, ay - 7 * s), (ax1 - 4 * s, ay + 7 * s)], fill=(255, 224, 154, 255))
    im.alpha_composite(gl.filter(ImageFilter.GaussianBlur(3 * s))); im.alpha_composite(gl)
    t2 = 'Arrastrá el juego a Aplicaciones  ·  Drag to Applications  ·  Arraste para Aplicativos'
    dr.text(((W - dr.textlength(t2, font=fr)) / 2, 334 * s), t2, font=fr, fill=(214, 194, 150))
    return im.convert('RGB')
fondo(1).save('desktop/build/background.png'); fondo(2).save('desktop/build/background@2x.png')
print('ok')
