import json, sys, re
sys.path.insert(0, sys.argv[1] + '/ferramentas')
from linhas import embaralhada
d = json.load(open(f'{sys.argv[1]}/x{sys.argv[2]}/extraido.json'))
print(' '.join(k for k, r in d.items() if r['figuras'] or any(r['alt_img']) or not r['achou_alternativas']
      or any(embaralhada(p) for p in r['contexto'].split('\n\n') + r['alternativas'])
      or re.search(r'\b[A-Z][a-z]? \d\b|\d \d\b|[=+×÷√∑π]', r['contexto'] + ' '.join(r['alternativas']))))
