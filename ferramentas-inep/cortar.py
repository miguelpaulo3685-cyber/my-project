# Recorta (200 dpi, sem margem branca) as figuras e as alternativas em desenho do extraido.json.
import json, sys, subprocess, os
from PIL import Image, ImageChops
ext, pdf, dest = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dest, exist_ok=True)
d = json.load(open(ext)); DPI = 200; e = DPI / 72
def cortar(r, nome, extra_esq=0):
    base = f'{dest}/_tmp'
    subprocess.run(['pdftoppm', '-f', str(r['pag'] + 1), '-l', str(r['pag'] + 1), '-r', str(DPI), '-png', '-singlefile',
                    '-x', str(int((r['x0'] + extra_esq) * e)), '-y', str(int(r['y0'] * e)), '-W', str(int((r['x1'] - r['x0'] - extra_esq) * e)),
                    '-H', str(max(2, int((r['y1'] - r['y0']) * e))), pdf, base], check=True)
    im = Image.open(base + '.png').convert('RGB')
    cx = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda v: 255 if v > 30 else 0).getbbox()
    if cx:
        m = 10; im = im.crop((max(0, cx[0] - m), max(0, cx[1] - m), min(im.width, cx[2] + m), min(im.height, cx[3] + m)))
    im.save(f'{dest}/{nome}.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
n = 0
for chave, q in d.items():
    for f in q['figuras']:
        suf = '' if f['nome'] == 'fig' else '-' + f['nome'][3:]
        cortar(f, chave + suf); n += 1
    for i, a in enumerate(q['alt_img']):
        if a: cortar(a, f'{chave}-alt{"ABCDE"[i]}'); n += 1
print(n, 'imagens')
