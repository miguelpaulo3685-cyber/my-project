# Lê o gabarito oficial do INEP (caderno azul) -> {"1-ingles": "C", "1-espanhol": "C", "6": "E", ...}
import re, subprocess, sys, json
def ler(pdf):
    t = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    g = {}
    for linha in t.splitlines():
        toks = linha.split()
        i = 0
        while i < len(toks):
            if toks[i].isdigit() and 1 <= int(toks[i]) <= 180:
                n = int(toks[i])
                if n <= 5 and i + 2 < len(toks) and re.fullmatch(r'[A-EX]', toks[i + 1]) and re.fullmatch(r'[A-EX]', toks[i + 2]):
                    g[f'{n}-ingles'], g[f'{n}-espanhol'] = toks[i + 1], toks[i + 2]; i += 3; continue
                if i + 1 < len(toks) and re.fullmatch(r'[A-EX]', toks[i + 1]):
                    g[str(n)] = toks[i + 1]; i += 2; continue
            i += 1
    return g
if __name__ == '__main__':
    out = {}
    for pdf in sys.argv[1:]: out.update(ler(pdf))
    print(json.dumps(out))
