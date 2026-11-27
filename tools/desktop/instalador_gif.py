# arma desktop/build/instalando.gif: la animación que se ve mientras se instala Kids & Hero en Windows
# (necesita las fuentes en ttf: se convierten de desktop/assets/f con fontTools + brotli)
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
import numpy as np, math, os, sys
A = 'desktop/assets/'
def ttf(n):
    p = '/tmp/' + n + '.ttf'
    if not os.path.exists(p): f = TTFont(A + 'f/' + n + '.woff2'); f.flavor = None; f.save(p)
    return p
W, H = 560, 340
bg = Image.open(A + 'hero1.jpg').convert('RGB')
r = max(W / bg.width, H / bg.height); bg = bg.resize((int(bg.width * r * 1.05), int(bg.height * r * 1.05)), Image.LANCZOS)
ox, oy = (bg.width - W) // 2, (bg.height - H) // 2; bg = bg.crop((ox, oy, ox + W, oy + H))
yy, xx = np.mgrid[0:H, 0:W]; d = np.sqrt(((xx - W / 2) / (W / 1.6)) ** 2 + ((yy - H / 2.3) / (H / 1.4)) ** 2)
shade = np.clip(0.42 + 0.55 * d, 0, 0.9)
a = np.asarray(bg).astype(float) * (1 - shade[..., None]); base = Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert('RGBA')
kids = Image.open(A + 'kids.png'); hero = Image.open(A + 'hero.png')
kh = 86; kids = kids.resize((int(kids.width * kh / kids.height), kh), Image.LANCZOS).rotate(4, resample=Image.BICUBIC, expand=True)
hh = 58; hero = hero.resize((int(hero.width * hh / hero.height), hh), Image.LANCZOS)
cz = ImageFont.truetype(ttf('cinzel-latin-600-normal'), 30); czs = ImageFont.truetype(ttf('cinzel-latin-600-normal'), 12)
f2 = ImageFont.truetype(ttf('fraunces-latin-500-italic'), 13)
amp_w = 26; total = kids.width + amp_w + 12 + hero.width; x0 = (W - total) // 2; y = 88
hx, hy = x0 + kids.width + amp_w + 12, y + 18
base.alpha_composite(kids, (x0, y - 8)); dr = ImageDraw.Draw(base)
dr.text((x0 + kids.width + 4, y + 28), '&', font=cz, fill=(233, 201, 138))
t1 = 'I N S T A L A N D O   ·   I N S T A L L I N G'; dr.text(((W - dr.textlength(t1, font=czs)) / 2, 206), t1, font=czs, fill=(233, 201, 138))
t2 = 'Tras sus pasos  ·  In His Steps  ·  Nos Seus Passos'; dr.text(((W - dr.textlength(t2, font=f2)) / 2, 270), t2, font=f2, fill=(200, 180, 140))
lx0, lx1, ly = 110, W - 110, 240
dr.line((lx0, ly, lx1, ly), fill=(80, 64, 38), width=2); dr.rectangle((0, 0, W - 1, H - 1), outline=(120, 98, 60))
N = 36; frames = []
ha0 = np.asarray(hero).astype(float); cols = np.arange(hero.width)[None, :] + np.arange(hero.height)[:, None] * 0.35
for f in range(N):
    t = f / N; fr = base.copy()
    p = (t * 1.6 - 0.3) * (hero.width + 200) - 100; g = np.clip(1 - np.abs(cols - p) / 26, 0, 1) * 0.75
    ha = ha0.copy(); ha[..., :3] += (255 - ha[..., :3]) * g[..., None]
    fr.alpha_composite(Image.fromarray(ha.clip(0, 255).astype(np.uint8), 'RGBA'), (hx, hy))
    gx = lx0 + (lx1 - lx0) * t; glow = Image.new('RGBA', (W, H)); gd = ImageDraw.Draw(glow)
    for k in range(lx0, lx1):
        v = max(0, 1 - abs(k - gx) / 70)
        if v > 0: gd.line((k, ly, k, ly + 1), fill=(255, 224, 154, int(255 * v)))
    gd.ellipse((gx - 4, ly - 3, gx + 4, ly + 5), fill=(255, 244, 210, 255))
    fr.alpha_composite(glow.filter(ImageFilter.GaussianBlur(4))); fr.alpha_composite(glow)
    frames.append(fr.convert('RGB'))
pal = frames[0].quantize(colors=255, method=Image.Quantize.MEDIANCUT)
q = [fr.quantize(palette=pal, dither=Image.Dither.NONE) for fr in frames]
q[0].save('desktop/build/instalando.gif', save_all=True, append_images=q[1:], duration=55, loop=0)
print(os.path.getsize('desktop/build/instalando.gif'))
