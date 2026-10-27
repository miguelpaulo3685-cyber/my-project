# Mostra as linhas numeradas de cada questão (pedaço.linha, altura, texto).
# Linha com a fonte deslocada do INEP ganha a versão decodificada embaixo.
import json, sys, re

def dec(s):
    out = ''
    for ch in s:
        o = ord(ch)
        if ch == ' ': out += ' '
        elif ch == '¿': out += 'fi'
        elif ch == '¾': out += 'fl'
        elif o < 128:
            k = o + 29
            try: out += bytes([k if k < 128 else k + 1]).decode('mac_roman')
            except Exception: out += '?'
        else: out += ch
    return out

def embaralhada(s):
    letras = re.sub(r'[^A-Za-z]', '', s)
    if len(letras) < 6: return False
    maius = sum(c.isupper() for c in letras) / len(letras)
    return maius > 0.55 and not re.search(r'\b(QUESTÃO|TEXTO|Questão)\b', s)

if __name__ != "__main__": pass
else:
  t = json.load(open(sys.argv[1]))
  for k in sys.argv[2:] or t.keys():
      print('=====', k)
      for i, p in enumerate(t[k]['pedacos']):
          for j, (l, (a, b)) in enumerate(zip(p['linhas'], p['pos'])):
              print(f'{i}.{j:<3} {a:6.1f} {l}')
              if embaralhada(l): print(f'{"":11}≈ {dec(l)}')
