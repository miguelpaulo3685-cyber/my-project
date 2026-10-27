# Para cada questão: palavras da região no PDF (fora das figuras) que não aparecem no texto extraído.
import json, sys, re, subprocess, html, unicodedata
from collections import Counter
pdf, ext = sys.argv[1], sys.argv[2]
d = json.load(open(ext))
bb = subprocess.run(['pdftotext', '-bbox-layout', pdf, '-'], capture_output=True, text=True).stdout
paginas = []
for pg in re.finditer(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', bb, re.S):
    paginas.append([(float(a), float(b), float(c), float(e), html.unescape(t)) for a, b, c, e, t in
                    re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', pg.group(3))])
norm = lambda w: re.sub(r'[^\w]|_', '', unicodedata.normalize('NFC', w).lower())
RUIDO = set('questão linguagens códigos suas tecnologias redação dia caderno azul ciências humanas natureza matemática transcreva sua para capa azu bra ver led'.split())
ruins = []
for k, q in d.items():
    pdfw = Counter()
    for p in q['pedacos']:
        for x0, y0, x1, y1, t in paginas[p['pag']]:
            if not (p['x0'] <= x0 < p['x1'] and p['y0'] <= y0 < p['y1']): continue
            fimE = q.get('fim_e')
            if fimE and (p['pag'], y0) > (fimE[0], fimE[1]): continue
            if any(f['pag'] == p['pag'] and f['y0'] - 1 <= y0 <= f['y1'] + 1 and f['x0'] <= x0 < f['x1'] for f in q['figuras']): continue
            if any(a and a['pag'] == p['pag'] and a['y0'] <= y0 <= a['y1'] and x0 >= a['x0'] - 5 for a in q['alt_img']): continue
            w = norm(t)
            if len(w) >= 3 and w not in RUIDO and not re.fullmatch(r'(enem\d{4})+\w*|\d+|\d+az\d+|\d+\w{0,3}', w) and 'enem20' not in w: pdfw[w] += 1
    saida = Counter(w for w in (norm(x) for x in re.split(r'\s+', q['contexto'] + ' ' + ' '.join(q['alternativas']))) if len(w) >= 3)
    falta = pdfw - saida
    total = sum(pdfw.values()) or 1
    if sum(falta.values()) > 2:
        ruins.append((k, sum(falta.values()), total, list(falta)[:8]))
for r in ruins: print(*r)
print(len(ruins), 'questões com palavras faltando de', len(d))
