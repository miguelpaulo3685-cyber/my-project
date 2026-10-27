# Ferramentas para tirar provas dos cadernos do INEP

Usadas para as provas de 2024 e 2025 (`questoes-inep/ANO.json`). Rodam numa pasta de trabalho fora do
repositório (os PDFs não ficam aqui), com Python 3 + Pillow, `pdftotext`/`pdftohtml`/`pdftoppm` (poppler) e Node com Playwright.

1. **Baixar os PDFs** (caderno 1 azul do dia 1, caderno 7 azul do dia 2 e os dois gabaritos) de
   `https://download.inep.gov.br/enem/provas_e_gabaritos/ANO_PV_impresso_D1_CD1.pdf` (troque PV por GB para o gabarito).
   O servidor do INEP não manda o certificado intermediário: junte o da RNP
   (`https://secure.globalsign.com/cacert/rnpicpedugr46ovtlsca2025.crt`, convertido para PEM) ao `--cacert` do curl.
2. `extrair.py caderno.pdf ANO DIA pasta_saida pasta_figuras`: texto em parágrafos (itálico, negrito, versos,
   subscritos), alternativas A-E, figuras e uma imagem de cada questão para revisar.
3. `cortar.py extraido.json caderno.pdf pasta_figuras`: recorta figuras e alternativas em desenho (200 dpi).
4. `gabarito.py gab-d1.pdf gab-d2.pdf > gabANO.json`: gabarito oficial (anuladas ficam de fora).
5. `conferir_palavras.py caderno.pdf extraido.json`: aponta questão com palavra do PDF que não chegou ao texto.
6. `lista_visual.py PASTA ANOdDIA`: questões que precisam de olho humano (figura, fórmula, alternativa em desenho).
7. `folha.js saida.png ANO DIA chave...`: folha de revisão, original do caderno ao lado de como fica no site.
   Correções vão para `revisao.json` com `corrigir.py` (contexto ou alternativas de uma questão).
8. `montar_anos.py PASTA REPO`: grava `questoes-inep/ANO.json` e copia as figuras para `img/questoes/`.
   Questão de `lista_visual` que ainda não foi conferida sai com `"em_revisao": true`.
