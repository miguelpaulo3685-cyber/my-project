# Mostra questões para revisão: texto, alternativas, gabarito e figuras.
import json, sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
from linhas import embaralhada, dec
ano, dia = sys.argv[1], sys.argv[2]
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f'{S}/x{ano}d{dia}/extraido.json'))
g = json.load(open(f'{S}/gab{ano}.json'))
for k in sys.argv[3:]:
    q = d[k]; n = q['numero']
    gab = g.get(f"{n}-{q['lingua']}" if q['lingua'] else str(n), '?')
    figs = [f['nome'] for f in q['figuras']] + [f'alt{"ABCDE"[i]}' for i, a in enumerate(q['alt_img']) if a]
    print(f'===== {k}  gabarito {gab}  figuras {figs}')
    for par in q['contexto'].split('\n\n'):
        print('  ' + (par if len(par) < 260 else par[:200] + ' […] ' + par[-50:]))
        if embaralhada(par): print('  ≈ ' + dec(par))
    for i, a in enumerate(q['alternativas']):
        print(f'  ({"ABCDE"[i]}) {a}')
