# Junta correções (JSON na entrada) ao revisao.json. Chaves por questão: contexto, alternativas, figuras_extra, alt_manual, remover.
import json, sys, os
arq = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'revisao.json')
rev = json.load(open(arq)) if os.path.exists(arq) else {}
novo = json.load(sys.stdin)
for k, v in novo.items(): rev.setdefault(k, {}).update(v)
json.dump(rev, open(arq, 'w'), ensure_ascii=False, indent=1)
print(len(novo), 'correções; total', len(rev))
