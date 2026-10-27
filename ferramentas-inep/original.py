# Para questões com fórmula difícil: enunciado e alternativas recortados do caderno (fiel ao original).
# Uso: original.py extraido.json caderno.pdf pasta_figuras saida.json chave...
import json, sys, subprocess
from PIL import Image, ImageChops
ext, pdf, dest, saida, *chaves = sys.argv[1:]
d = json.load(open(ext)); DPI = 200; e = DPI / 72
IMG = 'https://miguelpaulo3685-cyber.github.io/my-project/img/questoes'
def cortar(pag, x0, x1, y0, y1, nome):
    if y1 - y0 < 4 or x1 - x0 < 10: return None
    base = f'{dest}/_tmp'
    subprocess.run(['pdftoppm', '-f', str(pag + 1), '-l', str(pag + 1), '-r', str(DPI), '-png', '-singlefile', '-x', str(int(x0 * e)),
                    '-y', str(int(y0 * e)), '-W', str(int((x1 - x0) * e)), '-H', str(int((y1 - y0) * e)), pdf, base], check=True)
    im = Image.open(base + '.png').convert('RGB')
    cx = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda v: 255 if v > 30 else 0).getbbox()
    if not cx: return None
    im = im.crop((max(0, cx[0] - 8), max(0, cx[1] - 8), min(im.width, cx[2] + 8), min(im.height, cx[3] + 8)))
    im.save(f'{dest}/{nome}.jpg', 'JPEG', quality=85, optimize=True)
    return f'![]({IMG}/{nome}.jpg)'
out = {}
for k in chaves:
    q = d[k]; L = q['letras']; P = q['pedacos']
    lim_pi, lim_y = L[0]['pi'], L[0]['y0'] - 3
    # largura útil: a mesma das figuras (sem tarjas da página)
    def xs(p):
        f = [x for x in q['figuras'] if x['pag'] == p['pag'] and p['x0'] - 1 <= x['x0'] and x['x1'] <= p['x1'] + 1]
        if f: return f[0]['x0'], f[0]['x1']
        return (p['x0'] + (40 if p['col'] in (0, 2) else 8)), (p['x1'] - (8 if p['col'] == 0 else 40))
    # faixas de cada alternativa pela tinta (fração passa acima e abaixo da letra)
    faixa = [None] * 5
    if len({l['pi'] for l in L}) == 1:
        p = P[L[0]['pi']]; x0, x1 = xs(p)
        cy = [l['y0'] + 5 for l in L]
        topo = max(p['y0'], cy[0] - (cy[1] - cy[0]) / 2); base = min(p['y1'], q['fim_e'][1] + 60)
        r = 100 / 72
        subprocess.run(['pdftoppm', '-f', str(p['pag'] + 1), '-l', str(p['pag'] + 1), '-r', '100', '-gray', '-singlefile', '-x', str(int((L[0]['x1'] - 3) * r)),
                        '-y', str(int(topo * r)), '-W', str(int((x1 - L[0]['x1'] + 3) * r)), '-H', str(int((base - topo) * r)), pdf, f'{dest}/_z'], check=True)
        z = Image.open(f'{dest}/_z.pgm'); px = z.load(); W, H = z.size
        # fio vertical (borda de coluna ou de tabela) tem 1-2 pontos por linha: não conta como tinta
        tinta = [sum(1 for xx in range(W) if px[xx, yy] < 200) >= 3 for yy in range(H)] + [False]
        ini = None; grupos = []
        for yy, t in enumerate(tinta):
            if t and ini is None: ini = yy
            if not t and ini is not None: grupos.append((topo + ini / r, topo + yy / r)); ini = None
        for a0, a1 in grupos:
            atravessa = [j for j in range(5) if a0 - 2 <= cy[j] <= a1 + 2]
            meio = (a0 + a1) / 2
            j = atravessa[0] if atravessa else max([j for j in range(5) if cy[j] - 6 <= meio] or [0])
            if a0 > cy[4] + 3 and j == 4:
                # depois da E só entra o que vem colado (a segunda linha), não o fio do fim da questão
                if faixa[4] is None or a0 - faixa[4][1] > 6 or a1 - a0 < 4: continue
            faixa[j] = (a0, a1) if faixa[j] is None else (min(faixa[j][0], a0), max(faixa[j][1], a1))
        if faixa[0]: lim_y = min(lim_y, faixa[0][0] - 3)
    partes = []
    for i, p in enumerate(P[:lim_pi + 1]):
        y0 = p['y0'] + (18 if i == 0 else 0)
        y1 = lim_y if i == lim_pi else p['y1']
        x0, x1 = xs(p)
        img = cortar(p['pag'], x0, x1, y0, y1, f'{k}-orig{i + 1}')
        if img: partes.append(img)
    alts = []
    for j, l in enumerate(L):
        p = P[l['pi']]; x0, x1 = xs(p)
        fim = L[j + 1]['y0'] - 2 if j < 4 and L[j + 1]['pi'] == l['pi'] else (q['fim_e'][1] if j == 4 else p['y1'])
        a0, a1 = (faixa[j][0] - 2, faixa[j][1] + 2) if faixa[j] else (l['y0'] - 2, fim)
        alts.append(cortar(p['pag'], l['x1'] - 1.5, x1, a0, a1, f'{k}-alt{"ABCDE"[j]}'))
    if all(alts) and partes:
        out[k] = dict(contexto='\n\n'.join(partes), alternativas=alts)
json.dump(out, open(saida, 'w'), ensure_ascii=False, indent=1)
print(len(out), 'de', len(chaves))
