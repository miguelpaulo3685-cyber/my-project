# Extrai uma prova inteira de um caderno do INEP (duas colunas) para revisão:
# texto em parágrafos, alternativas A-E, figuras recortadas e imagem de cada
# questão. Uso: extrair.py caderno.pdf ano dia pasta_saida pasta_figuras
import re, sys, os, json, html, subprocess
from PIL import Image, ImageChops, ImageDraw

pdf, ano, dia, saida, figdir = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
os.makedirs(saida, exist_ok=True); os.makedirs(figdir, exist_ok=True)
DPI = 100; ESC = DPI / 72
CAB0 = re.compile(r'^((?i:quest[ãa]o))\s*0*(\d+)\b')
class _Cab:
    def match(self, t): return CAB0.match(re.sub(r'\*\*|(?<!\w)_|_(?!\w)', '', t).strip())
CAB = _Cab()

SUB = str.maketrans('0123456789+-−–=()naehijklmoprstuvx', '₀₁₂₃₄₅₆₇₈₉₊₋₋₋₌₍₎ₙₐₑₕᵢⱼₖₗₘₒₚᵣₛₜᵤᵥₓ')
SUP = str.maketrans('0123456789+-−–=()n', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁻⁼⁽⁾ⁿ')

def texto_de(ws):
    # junta os trechos de uma linha; índice gruda no anterior; sinais de operação ganham espaço
    t = ''; ant = None
    for r in ws:
        txt = r['t']
        if r.get('indice'): txt = re.sub(r'\*\*|_', '', txt).strip().translate(SUB if r['indice'] == 'sub' else SUP)
        if ant is None: t = txt
        else:
            espaco = ant.get('bruto', '').endswith(' ') or r.get('bruto', '').startswith(' ')
            gruda = r.get('indice') or (not espaco and (r['x0'] - ant['x1']) < 0.6 and not re.match(r'[+→=←↔⇌]', txt) and not re.search(r'[+→=←↔⇌]$', t))
            t += ('' if gruda else ' ') + txt
        ant = r
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'(?<=[\w)⁺⁻₀-₉⁰-⁹])\+(?=[\w(])', ' + ', t)
    # carga com número: "Ca2 + (aq)" -> "Ca²⁺ (aq)"
    t = re.sub(r'(?<=[A-Z])([a-z]?)(\d) ?([+−-]) ?(?=\((aq|g|s|l)\))', lambda m: m.group(1) + m.group(2).translate(SUP) + ('⁺' if m.group(3) == '+' else '⁻') + ' ', t)
    # carga de íon que veio do tamanho do texto: "H + (aq)", "COO −(aq)", "8 e−"
    t = re.sub(r'(?<=[A-Za-z₀-₉]) ?([+−-])(?= ?\((aq|g|s|l)\))', lambda m: '⁺' if m.group(1) == '+' else '⁻', t)
    t = re.sub(r'(?<=\d e)[−-](?=$|[\s,.;])', '⁻', t)
    t = re.sub(r'(H₂O|[A-Z][a-z]?[₀-₉]+[A-Za-z₀-₉]*) ?\(I\)', r'\1 (l)', t)
    # variável de uma letra em itálico (f, x, N): sem itálico, colada no índice
    t = re.sub(r'(?<![A-Za-z0-9*])_([A-Za-z])_(?![A-Za-z0-9*])', r'\1', t)
    t = re.sub(r'(?<=[₀-₉ₐ-ₜᵢ-ᵥⱼ⁰-⁹⁺⁻]) +(?=[.,;:])', '', t)
    return t

def ler():
    # Tamanho de cada página em pontos (bbox) e texto com estilo (pdftohtml -xml).
    bb = subprocess.run(['pdftotext', '-bbox-layout', pdf, '-'], capture_output=True, text=True).stdout
    tamanhos = [(float(a), float(b)) for a, b in re.findall(r'<page width="([\d.]+)" height="([\d.]+)">', bb)]
    xml = subprocess.run(['pdftohtml', '-xml', '-i', '-stdout', pdf], capture_output=True, text=True).stdout
    fontes = {m.group(1): float(m.group(2)) for m in re.finditer(r'<fontspec id="(\d+)" size="([\d.]+)"', xml)}
    familias = {m.group(1): m.group(2) for m in re.finditer(r'<fontspec id="(\d+)" size="[\d.]+" family="([^"]*)"', xml)}
    paginas = []
    for k, pg in enumerate(re.finditer(r'<page number="\d+"[^>]*height="(\d+)" width="(\d+)">(.*?)</page>', xml, re.S)):
        w, h = tamanhos[k]
        z = float(pg.group(2)) / w
        runs = []
        for m in re.finditer(r'<text top="(-?\d+)" left="(-?\d+)" width="(\d+)" height="(\d+)" font="(\d+)">(.*?)</text>', pg.group(3), re.S):
            top, left, wd, ht, f, corpo = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4)), m.group(5), m.group(6)
            tam = fontes.get(f, 10)
            if tam <= 5: continue
            def estilo(mm):
                dentro = mm.group(2); fim = ' ' if dentro.endswith(' ') else ''; ini = ' ' if dentro.startswith(' ') else ''
                d = dentro.strip()
                if not d: return dentro
                marca = '**' if mm.group(1) == 'b' else '_'
                return f'{ini}{marca}{d}{marca}{fim}'
            t = corpo
            for _ in range(2): t = re.sub(r'<(b|i)>(.*?)</\1>', estilo, t, flags=re.S)
            t = html.unescape(re.sub(r'<[^>]+>', '', t))
            if not t.strip() or re.fullmatch(r'\s*(ENEM\d{4})+\S*\s*', t) or re.search(r'(ENEM\d{4}){2,}', t): continue
            runs.append(dict(x0=left / z, y0=top / z, x1=(left + wd) / z, y1=(top + ht) / z, t=t, tam=tam, fam=familias.get(f, '')))
        # junta os trechos em linhas: mesma base, mesma coluna, um depois do outro.
        # Trecho pequeno e curto (2, +, −) colado em outro vira índice: subscrito ou sobrescrito.
        INDICE = re.compile(r'(?=.*[0-9+\-−–])[0-9+\-−–=()n]{1,4}|[→←↔⇌⇄]|[a-z]{1,2}')
        limpo = lambda t: re.sub(r'\*\*|_', '', t).strip()
        normais = [r for r in runs if not INDICE.fullmatch(limpo(r['t']))]
        candidatos = [r for r in runs if INDICE.fullmatch(limpo(r['t']))]
        linhas = []
        def juntar(r, alvo):
            alvo['ws'].append(dict(r, t=r['t'].strip(), bruto=r['t']))
            alvo['x0'] = min(alvo['x0'], r['x0']); alvo['x1'] = max(alvo['x1'], r['x1'])
            if not r.get('indice'):
                alvo['y0'] = min(alvo['y0'], r['y0']); alvo['y1'] = max(alvo['y1'], r['y1']) if abs(alvo['y1'] - r['y1']) < 3.2 else alvo['y1']
                alvo['tam'] = max(alvo['tam'], r['tam'])
        def nova(r):
            linhas.append(dict(x0=r['x0'], y0=r['y0'], x1=r['x1'], y1=r['y1'], tam=r['tam'], ws=[dict(r, t=r['t'].strip(), bruto=r['t'])]))
        for r in sorted(normais, key=lambda r: (r['y1'], r['x0'])):
            col = r['x0'] >= w / 2
            alvo = None
            for l in linhas[-6:]:
                sobre = min(l['y1'], r['y1']) - max(l['y0'], r['y0'])
                livre = all(r['x0'] >= x['x1'] - 3 or r['x1'] <= x['x0'] + 3 for x in l['ws'])
                if (abs(l['y1'] - r['y1']) < 3.2 or sobre > 0.6 * min(l['y1'] - l['y0'], r['y1'] - r['y0'])) and (l['x0'] >= w / 2) == col and livre and l['x0'] - 40 < r['x0'] < l['x1'] + 40:
                    alvo = l
            if alvo: juntar(r, alvo)
            else: nova(r)
        for r in candidatos:
            cy = (r['y0'] + r['y1']) / 2
            melhor = None
            for l in linhas:
                lh = l['y1'] - l['y0']
                if not (l['y0'] - 0.6 * lh <= cy <= l['y1'] + 0.45 * lh): continue
                if not (l['x0'] - 3 <= r['x0'] <= l['x1'] + 4): continue
                seta = limpo(r['t']) in '→←↔⇌⇄'
                if not seta and r['tam'] > 0.86 * l['tam'] and abs(l['y1'] - r['y1']) >= 3.2: continue
                d = abs(cy - (l['y0'] + l['y1']) / 2)
                if melhor is None or d < melhor[0]: melhor = (d, l)
            if melhor:
                l = melhor[1]; lh = l['y1'] - l['y0']; meio = (l['y0'] + l['y1']) / 2
                if r['tam'] <= 0.86 * l['tam'] and not seta:
                    r = dict(r, indice='sub' if cy > meio + 0.12 * lh else 'sup' if cy < meio - 0.12 * lh else None)
                juntar(r, l)
            else: nova(r)
        for l in linhas:
            l['ws'].sort(key=lambda r: r['x0'])
            l['t'] = texto_de(l['ws'])
        linhas.sort(key=lambda l: (l['y0'], l['x0']))
        pagina = dict(w=w, h=h, linhas=linhas)
        pagina['cols'] = []
        for c in (0, 1):
            ls = [l for l in linhas if (l['x0'] < w / 2) == (c == 0) and len(l['t']) > 25]
            if ls:
                xs0 = sorted(l['x0'] for l in ls); xs1 = sorted(l['x1'] for l in ls)
                pagina['cols'].append((xs0[len(xs0) // 2] - 1, xs1[-1 - len(xs1) // 20]))
                pagina.setdefault('filtro', []).append((xs0[len(xs0) // 20], xs1[-1 - len(xs1) // 20]))
                ls40 = [l for l in ls if len(l['t']) > 40] or ls
                a10 = sorted(l['x0'] for l in ls40); b10 = sorted(l['x1'] for l in ls40)
                pagina.setdefault('recorte', []).append((a10[len(a10) // 10], b10[-1 - len(b10) // 10]))
            else:
                pagina['cols'].append((w / 2 * c + 40, w / 2 * (c + 1) - 20))
                pagina.setdefault('filtro', []).append(pagina['cols'][-1])
                pagina.setdefault('recorte', []).append(pagina['cols'][-1])
        pagina['linhas'] = [l for l in linhas if any(a - 30 <= l['x0'] and l['x1'] <= b + 30 for a, b in pagina['filtro'])]
        paginas.append(pagina)
    return paginas

pgs = ler()
# margens úteis: cabeçalho/rodapé da página ficam de fora
TOPO, BASE = 62, None

def coluna(pg, x):
    return 0 if x < pg['w'] / 2 else 1

cabs = []
for i, pg in enumerate(pgs):
    for ln in pg['linhas']:
        m = CAB.match(ln['t'])
        if m: cabs.append(dict(pag=i, col=coluna(pg, ln['x0']), y=ln['y0'], n=int(m.group(2)), x0=ln['x0']))
cabs.sort(key=lambda c: (c['pag'], c['col'], c['y']))

def rodape(pg):
    # rodapé: a linha "... • 1º DIA • CADERNO 1 • AZUL •" perto do fim da página
    ys = [l['y0'] for l in pg['linhas'] if re.search(r'CADERNO\s+\d|P1_|\d{2}/\d{2}/\d{4}', l['t'])]
    return min(ys) - 4 if ys else pg['h'] - 50

SECAO = re.compile(r'Questões de \d+ a \d+|PROPOSTA DE REDAÇÃO|INSTRUÇÕES PARA A REDAÇÃO|RASCUNHO', re.I)

def largura_inteira(c):
    # questão que ocupa a página toda: logo abaixo do título há linhas que cruzam o meio da página
    pg = pgs[c['pag']]; meio = pg['w'] / 2
    if c['col'] != 0: return False
    abaixo = [x['y'] for x in cabs if x['pag'] == c['pag'] and x['col'] == 0 and x['y'] > c['y'] + 5]
    fim = min(abaixo) if abaixo else rodape(pg)
    return any(c['y'] < l['y0'] < fim and l['x0'] < meio - 10 and l['x1'] > meio + 30 for l in pg['linhas'])

for c in cabs: c['inteira'] = largura_inteira(c)

def proximo_na_pagina(pag, y, col):
    # o que encerra a região: título seguinte na mesma coluna ou uma questão de largura inteira abaixo
    ys = [c['y'] for c in cabs if c['pag'] == pag and c['y'] > y + 5 and (c['col'] == col or c['inteira'] or col == 2)]
    return min(ys) - 3 if ys else None

def topo_pagina(pg):
    ys = [l['y1'] for l in pg['linhas'] if l['y0'] < 140 and re.search(r'Exame Nacional do Ensino|^\*?\d{6,}', l['t'])]
    return max(ys) + 6 if ys else TOPO

def pedacos_de(k):
    c = cabs[k]
    pag = c['pag']; y = c['y'] - 3
    col = 2 if c['inteira'] else c['col']
    peds = []
    while pag < len(pgs) and len(peds) < 4:
        pg = pgs[pag]; meio = pg['w'] / 2
        if peds:
            topo = [l['t'] for l in pg['linhas'] if y <= l['y0'] < y + 70 and (col == 2 or (l['x0'] < meio) == (col == 0))]
            if any(SECAO.search(t) for t in topo): break
        fim = proximo_na_pagina(pag, y, col)
        x0, x1 = {0: (0, meio), 1: (meio, pg['w']), 2: (0, pg['w'])}[col]
        peds.append(dict(pag=pag, col=col, y0=y, y1=fim if fim else rodape(pg), x0=x0, x1=x1))
        if fim: break
        if col == 0: col = 1
        elif col == 1: pag, col = pag + 1, 0
        else: pag += 1
        y = topo_pagina(pgs[pag]) if pag < len(pgs) else TOPO
    return peds

def linhas_em(p):
    pg = pgs[p['pag']]
    return [l for l in pg['linhas'] if p['x0'] <= l['x0'] < p['x1'] and p['y0'] <= l['y0'] < p['y1']]

def render(p, dpi=DPI):
    e = dpi / 72
    base = f'{saida}/_tmp'
    subprocess.run(['pdftoppm', '-f', str(p['pag'] + 1), '-l', str(p['pag'] + 1), '-r', str(dpi), '-png', '-singlefile',
                    '-x', str(int(p['x0'] * e)), '-y', str(int(p['y0'] * e)), '-W', str(max(1, int((p['x1'] - p['x0']) * e))),
                    '-H', str(max(1, int((p['y1'] - p['y0']) * e))), pdf, base], check=True)
    return Image.open(base + '.png').convert('RGB')

def faixas_de_figura(p, linhas, minimo=3):
    # Tinta que não é texto: pinta de branco a caixa de cada linha e olha o que sobra.
    im = render(p).convert('L')
    d = ImageDraw.Draw(im)
    for l in linhas:
        d.rectangle([(l['x0'] - p['x0'] - 1.5) * ESC, (l['y0'] - p['y0'] - 1.5) * ESC, (l['x1'] - p['x0'] + 1.5) * ESC, (l['y1'] - p['y0'] + 1.5) * ESC], fill=255)
    px = im.load(); W, H = im.size
    # só dentro da largura do texto da coluna (fora dela ficam tarjas e faixas de segurança)
    cols = pgs[p['pag']]['cols']
    a, b = (cols[0][0], cols[1][1]) if p['col'] == 2 else cols[p['col']]
    xa = max(0, int((a - 3 - p['x0']) * ESC)); xb = min(W, int((b + 3 - p['x0']) * ESC))
    cab = [l for l in linhas if CAB.match(l['t']) and abs(l['y0'] - p['y0'] - 3) < 6]
    pula = int((cab[0]['y1'] - p['y0'] + 3) * ESC) if cab else 0
    linhas_tinta = []
    for yy in range(H):
        if yy < pula: linhas_tinta.append(0); continue
        n = sum(1 for xx in range(xa, xb, 2) if px[xx, yy] < 238)
        linhas_tinta.append(n)
    faixas = []; ini = None; vazio = 0
    for yy, n in enumerate(linhas_tinta + [0] * 30):
        if n >= minimo:
            if ini is None: ini = yy
            vazio = 0; ult = yy
        elif ini is not None:
            vazio += 1
            if vazio > 12 * ESC:
                if (ult - ini) / ESC >= 16: faixas.append([p['y0'] + ini / ESC, p['y0'] + ult / ESC])
                ini = None
    return faixas

def limites(p):
    # largura útil para recortar: do começo do texto da coluna até o fim (sem tarjas nem faixas)
    cols = pgs[p['pag']]['recorte']
    a, b = (cols[0][0], cols[1][1]) if p['col'] == 2 else cols[p['col']]
    return max(p['x0'], a - 10), min(p['x1'], b + 10)

def _marcador():
    # fonte dos círculos das alternativas: a mais comum entre letras A-E sozinhas
    from collections import Counter
    c = Counter(w.get('fam', '') for pg in pgs for l in pg['linhas'] for w in l['ws'] if len(w['t']) == 1 and w['t'] in 'ABCDE')
    return c.most_common(1)[0][0] if c else ''
MARCADOR = None

def alternativas(linhas_todas):
    # Letras A-E sozinhas (o círculo da alternativa) numa coluna, de cima para baixo.
    letras = []
    for pi, ls in linhas_todas:
        for l in ls:
            w = l['ws'][0]
            if w['t'] in 'ABCDE' and len(w['t']) == 1 and (not MARCADOR or w.get('fam', '') == MARCADOR):
                letras.append(dict(pi=pi, l=l, w=w, letra=w['t']))
    # procura a última sequência A,B,C,D,E em ordem
    for i in range(len(letras) - 4):
        cand = letras[i:i + 5]
        if [c['letra'] for c in cand] == list('ABCDE') and max(c['w']['x0'] for c in cand) - min(c['w']['x0'] for c in cand) < 6:
            return cand
    for i in range(len(letras) - 4):
        cand = letras[i:i + 5]
        if [c['letra'] for c in cand] == list('ABCDE'): return cand
    return None

def para_texto(ls, x_esq):
    # junta linhas em parágrafos: recuo, espaço maior, letra menor (fonte) ou item de lista
    if not ls: return ''
    tams = sorted(l['tam'] for l in ls); tam = tams[len(tams) // 2]
    alturas = sorted(l['y1'] - l['y0'] for l in ls); h = alturas[len(alturas) // 2]
    passos = sorted(b['y1'] - a['y1'] for a, b in zip(ls, ls[1:]) if 0 < b['y1'] - a['y1'] < 3 * h)
    passo = passos[len(passos) // 2] if passos else h * 1.2
    out = ''; ant = None
    x_dir = max(l['x1'] for l in ls)
    # verso: 3 ou mais linhas seguidas que não chegam à margem direita (prosa é justificada)
    solta = [l['x1'] < x_dir - 6 and l['tam'] >= TAM_CORPO - 1 for l in ls]
    em_verso = [False] * len(ls)
    i = 0
    while i < len(ls):
        j = i
        while j < len(ls) and solta[j]: j += 1
        if j - i >= 3:
            for m in range(i, j): em_verso[m] = True
            if j < len(ls) and (ls[j]['y1'] - ls[j - 1]['y1']) <= 1.3 * passo and ls[j]['x0'] <= ls[j - 1]['x0'] + 3: em_verso[j] = True
        i = max(j, i + 1)
    idx = {id(l): n for n, l in enumerate(ls)}
    for l in ls:
        t = l['t'].strip()
        if not t: continue
        recuo = l['x0'] - x_esq
        centrada = recuo > 15 and (x_dir - l['x1']) > 15 and abs(recuo - (x_dir - l['x1'])) < 14 and l['tam'] >= TAM_CORPO - 1
        novo = ant is None or (l['y1'] - ant['y1']) > 1.3 * passo or 6 < recuo < 40 or t.startswith('•') \
            or ant['t'].lstrip().startswith('•') and l['x0'] < ant['x0'] - 3 or abs(l['tam'] - ant['tam']) >= 1.5
        n_ = idx[id(l)]
        verso = ant is not None and em_verso[n_] and em_verso[idx[id(ant)]] and (l['y1'] - ant['y1']) <= 1.3 * passo and abs(l['tam'] - ant['tam']) < 1.5
        fonte_seguida = ant is not None and l['tam'] < TAM_CORPO - 1 and abs(l['tam'] - ant['tam']) < 1 and (l['y1'] - ant['y1']) <= 1.6 * passo
        if ant is None: out = t
        elif centrada and not fonte_seguida: out += ('\n' if (l['y1'] - ant['y1']) <= 1.3 * passo else '\n\n') + t
        elif fonte_seguida: out += ' ' + t
        elif verso: out += '\n' + t
        elif novo: out += '\n\n' + t
        elif out.endswith('-') and t[:1].islower(): out = out[:-1] + t
        else: out += ' ' + t
        ant = l
    # itálico/negrito que continua na linha seguinte vira um trecho só
    out = re.sub(r'_ _', ' ', out); out = re.sub(r'\*\* \*\*', ' ', out)
    out = re.sub(r'(_|\*\*) ([.,;:!?)])', r'\1\2', out)
    out = re.sub(r'([“(]) +', r'\1', out); out = re.sub(r' +([”)])', r'\1', out)
    return out

MARCADOR = _marcador()
resultado = {}
ocorr = {}
for k, c in enumerate(cabs):
    n = c['n']; ocorr[n] = ocorr.get(n, 0) + 1
    lingua = None
    if (ano >= 2017 and dia == 1 and n <= 5): lingua = 'ingles' if ocorr[n] == 1 else 'espanhol'
    chave = f'{ano}-{n}' + (f'-{lingua}' if lingua else '')
    peds = pedacos_de(k)
    todas = [(i, sorted([l for l in linhas_em(p) if not CAB.match(l['t'])], key=lambda l: (round(l['y0']), l['x0']))) for i, p in enumerate(peds)]
    seq = alternativas(todas)
    _t = sorted(l['tam'] for _, ls in todas for l in ls if len(l['t']) > 30) or [10]
    TAM_CORPO = _t[len(_t) // 2]
    figs = []; texto_partes = []; alts = [''] * 5; alt_img = [None] * 5
    lim = (seq[0]['pi'], seq[0]['l']['y0'] - 2) if seq else (len(peds), 0)
    nfig = 0
    for i, ls in todas:
        p = peds[i]
        faixas = faixas_de_figura(p, linhas_em(p))
        # parte do enunciado (antes das alternativas)
        y_lim = lim[1] if i == lim[0] else (p['y1'] if i < lim[0] else p['y0'])
        corpo = [l for l in ls if l['y0'] < y_lim]
        tams = sorted(l['tam'] for l in ls) or [10]; tam_corpo = tams[len(tams) // 2]
        e_corpo = lambda l: len(l['t']) >= 40 and abs(l['tam'] - tam_corpo) < 1
        unidas = []
        for f in faixas:
            if unidas and f[0] - unidas[-1][1] < 60 and not any(e_corpo(l) for l in corpo if unidas[-1][1] < l['y0'] < f[0]):
                unidas[-1][1] = f[1]
            else: unidas.append(list(f))
        faixas = unidas
        itens = []
        for f in faixas:
            if f[0] >= y_lim: continue
            dentro = [l for l in corpo if f[0] - 2 <= (l['y0'] + l['y1']) / 2 <= f[1] + 2]
            a = min([f[0]] + [l['y0'] for l in dentro]); b = min(y_lim - 1, max([f[1]] + [l['y1'] for l in dentro]))
            nfig += 1; nome = 'fig' if nfig == 1 else f'fig{nfig}'
            cx0, cx1 = limites(p)
            figs.append(dict(nome=nome, pag=p['pag'], x0=cx0, x1=cx1, y0=a - 1, y1=b + 1))
            itens.append((a, '{' + nome + '}'))
            corpo = [l for l in corpo if l not in dentro]
        x_esq = min([l['x0'] for l in corpo] or [p['x0']])
        # texto em blocos separados pelas figuras
        cortes = sorted(itens)
        blocos = []; atual = []
        for l in corpo:
            while cortes and cortes[0][0] < l['y0']:
                if atual: blocos.append(para_texto(atual, x_esq)); atual = []
                blocos.append(cortes.pop(0)[1])
            atual.append(l)
        if atual: blocos.append(para_texto(atual, x_esq))
        blocos += [x[1] for x in cortes]
        texto_partes += [b for b in blocos if b]
    if seq:
        for j, s in enumerate(seq):
            p = peds[s['pi']]
            ini = s['l']['y0'] - 2
            if j < 4 and seq[j + 1]['pi'] == s['pi']: fim = seq[j + 1]['l']['y0'] - 2
            else:
                passo = seq[j]['l']['y0'] - seq[j - 1]['l']['y0'] if j and seq[j - 1]['pi'] == s['pi'] else 60
                fim = min(p['y1'], ini + max(passo, 18))
            ls = [l for l in dict(todas)[s['pi']] if ini <= l['y0'] < fim]
            palavras = []
            for l in ls:
                ws = [w for w in l['ws'] if not (w is s['w'])]
                if ws: palavras.append(texto_de(ws))
            alts[j] = re.sub(r'\s+', ' ', ' '.join(palavras)).strip()
            if j == 4: fim_e = fim
            # alternativa com desenho: tinta fora do texto na faixa da alternativa
            sub = dict(p, y0=ini, y1=fim, x0=s['w']['x1'] + 6)
            sub['x0'] = max(sub['x0'], p['x0'])
            fx = faixas_de_figura(sub, [l for l in linhas_em(sub)], minimo=14)
            desenho = any(b - a >= 24 for a, b in fx)
            letras = sum(ch.isalpha() for ch in alts[j]); digitos = sum(ch.isdigit() for ch in alts[j])
            if not alts[j] or desenho and (len(alts[j]) < 40 or digitos > letras):
                # desenho fica centrado na letra: corta no meio do caminho entre as letras
                cy = lambda q: (q['w']['y0'] + q['w']['y1']) / 2
                mesmo = lambda q: q['pi'] == s['pi']
                acima = (cy(seq[j - 1]) + cy(s)) / 2 if j and mesmo(seq[j - 1]) else max(p['y0'], cy(s) - (cy(seq[j + 1]) - cy(s)) / 2 if j < 4 and mesmo(seq[j + 1]) else ini)
                abaixo = (cy(s) + cy(seq[j + 1])) / 2 if j < 4 and mesmo(seq[j + 1]) else min(p['y1'], cy(s) + (cy(s) - cy(seq[j - 1])) / 2 if j and mesmo(seq[j - 1]) else fim)
                alt_img[j] = dict(pag=p['pag'], x0=s['w']['x1'] + 3, x1=limites(p)[1], y0=acima, y1=abaixo)
    # imagem da questão para revisão
    ims = [render(p, 80) for p in peds]
    W = max(i.width for i in ims); H = sum(i.height for i in ims)
    junta = Image.new('RGB', (W, H), 'white'); y = 0
    for i in ims: junta.paste(i, (0, y)); y += i.height
    junta.save(f'{saida}/{chave}.png')
    # alternativas em desenho: separa os desenhos pela tinta e dá cada um à letra mais próxima
    if seq and any(alt_img) and len({x['pi'] for x in seq}) == 1:
        p = peds[seq[0]['pi']]
        cy = [(x['w']['y0'] + x['w']['y1']) / 2 for x in seq]
        topo_z = max(p['y0'], cy[0] - (cy[1] - cy[0]) / 2); base_z = min(p['y1'], cy[4] + (cy[4] - cy[3]) / 2)
        x0z = seq[0]['w']['x1'] + 3; x1z = limites(p)[1]
        zona = dict(p, y0=topo_z, y1=base_z, x0=x0z, x1=x1z)
        im = render(zona).convert('L'); px = im.load(); W, H = im.size
        tinta = [sum(1 for xx in range(0, W, 2) if px[xx, yy] < 200) for yy in range(H)]
        grupos = []; ini = None
        for yy, qt in enumerate(tinta + [0] * 5):
            if qt > 0 and ini is None: ini = yy
            if qt == 0 and ini is not None: grupos.append((ini, yy)); ini = None
        faixa = {j: None for j in range(5)}
        for a0, a1 in grupos:
            ya, yb = topo_z + a0 / ESC, topo_z + a1 / ESC
            j = min(range(5), key=lambda j: abs(cy[j] - (ya + yb) / 2))
            faixa[j] = (ya, yb) if faixa[j] is None else (min(faixa[j][0], ya), max(faixa[j][1], yb))
        for j in range(5):
            if alt_img[j] and faixa[j]:
                alt_img[j] = dict(pag=p['pag'], x0=x0z, x1=x1z, y0=faixa[j][0] - 2, y1=faixa[j][1] + 2)
    juntos = []
    for parte in texto_partes:
        if juntos and not juntos[-1].startswith('{') and not parte.startswith('{') and not re.search(r'[.:;!?”")]\s*$', juntos[-1]) and parte[:1].islower():
            juntos[-1] += ' ' + parte
        else: juntos.append(parte)
    resultado[chave] = dict(ano=ano, numero=n, lingua=lingua, contexto='\n\n'.join(juntos), alternativas=alts,
                            figuras=figs, alt_img=alt_img, pedacos=peds, achou_alternativas=bool(seq),
                            fim_e=[peds[seq[4]['pi']]['pag'], fim_e] if seq else None,
                            letras=[dict(pi=x['pi'], y0=x['l']['y0'], x1=x['w']['x1']) for x in seq] if seq else None)
json.dump(resultado, open(f'{saida}/extraido.json', 'w'), ensure_ascii=False, indent=1)
print(len(resultado), 'questões;', sum(1 for r in resultado.values() if not r['achou_alternativas']), 'sem alternativas achadas;',
      sum(len(r['figuras']) for r in resultado.values()), 'figuras;', sum(1 for r in resultado.values() for a in r['alt_img'] if a), 'alternativas em imagem')
