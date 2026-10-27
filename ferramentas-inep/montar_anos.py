# Monta questoes-inep/ANO.json e copia as figuras para img/questoes.
import json, sys, os, shutil, re, subprocess
S, REPO = sys.argv[1], sys.argv[2]
sys.path.insert(0, S + '/ferramentas')
IMG = 'https://miguelpaulo3685-cyber.github.io/my-project/img/questoes'
rev = json.load(open(f'{S}/revisao.json'))
revisadas = set('2024-1-ingles 2024-3-ingles 2024-5-ingles 2024-21 2024-25 2024-33 2024-35 2024-36 2024-43 2024-44 2024-53 2024-69 2024-77 2024-86'.split()
               + [f'2024-{n}' for n in (91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 103, 104, 106, 110, 112, 113, 114, 115, 116, 118, 119, 121)]) | set(rev)
ORIGINAL = json.load(open(f'{S}/original.json')) if os.path.exists(f'{S}/original.json') else {}
ORIGINAL.pop('2024-172', None); ORIGINAL.pop('2025-130', None)  # alternativas em linha / circuitos: ficam em revisão
if os.path.exists(f'{S}/liberar.json'): revisadas |= set(json.load(open(f'{S}/liberar.json')))
ANULADAS = {'2024-129', '2025-123', '2025-132', '2025-174'}
os.makedirs(f'{REPO}/questoes-inep', exist_ok=True)
resumo = {}
for ano in (2024, 2025):
    g = json.load(open(f'{S}/gab{ano}.json'))
    saida = []; fora = []; em_rev = 0
    for dia in (1, 2):
        d = json.load(open(f'{S}/x{ano}d{dia}/extraido.json'))
        visual = set(subprocess.run(['python3', '-I', f'{S}/ferramentas/lista_visual.py', S, f'{ano}d{dia}'], capture_output=True, text=True).stdout.split())
        for k, q in d.items():
            q = {**q, **rev.get(k, {})}
            n = q['numero']
            if f'{ano}-{n}' in ANULADAS: continue
            if not q['achou_alternativas']: fora.append(k); continue
            gab = g.get(f"{n}-{q['lingua']}" if q['lingua'] else str(n))
            if gab not in list('ABCDE'): fora.append(k); continue
            def figura(nome):
                orig = f'{S}/figs{ano}/{nome}.jpg'
                if not os.path.exists(orig): raise SystemExit(f'figura faltando: {nome}')
                shutil.copy(orig, f'{REPO}/img/questoes/{nome}.jpg')
                return f'![]({IMG}/{nome}.jpg)'
            if k in ORIGINAL:
                # enunciado e alternativas recortados do caderno (questões com fórmula difícil)
                usa = lambda t: re.sub(r'!\[\]\([^)]*/([^/)]+)\.jpg\)', lambda m: figura(m.group(1)), t)
                contexto = usa(ORIGINAL[k]['contexto']); alts = [usa(a) for a in ORIGINAL[k]['alternativas']]
            else:
                contexto = re.sub(r'\{fig(\d*)\}', lambda m: figura(k + ('-' + m.group(1) if m.group(1) else '')), q['contexto'])
                alts = [figura(f'{k}-alt{"ABCDE"[i]}') if q['alt_img'][i] else a for i, a in enumerate(q['alternativas'])]
            if any(not a for a in alts): fora.append(k); continue
            revisar = k in visual and k not in revisadas
            em_rev += revisar
            item = dict(ano=ano, numero=n, lingua=q['lingua'], contexto=contexto, alternativas=alts, correta='ABCDE'.index(gab),
                        pagina=q['pedacos'][0]['pag'] + 1, dia=dia)
            if revisar: item['em_revisao'] = True
            saida.append(item)
    saida.sort(key=lambda x: (x['numero'], x['lingua'] or ''))
    json.dump(saida, open(f'{REPO}/questoes-inep/{ano}.json', 'w'), ensure_ascii=False, indent=1)
    resumo[ano] = dict(total=len(saida), liberadas=len(saida) - em_rev, em_revisao=em_rev, fora=fora)
print(json.dumps(resumo, ensure_ascii=False, indent=1))
