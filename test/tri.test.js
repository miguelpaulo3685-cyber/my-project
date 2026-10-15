const test = require('node:test');
const assert = require('node:assert');
const tri = require('../tri');

const porAno = tri.carregar();
const AREA = { LC: 'linguagens', CH: 'ciencias-humanas', CN: 'ciencias-natureza', MT: 'matematica' };

// Um caderno real do INEP, para montar "questões do banco" de mentira.
function caderno(ano, cor, area) {
  const linhas = porAno.get(ano).filter(l => l.area === area && l.cor.toUpperCase().startsWith(cor));
  return linhas.filter(l => l.prova === linhas[0].prova);
}

test('carrega os 15 anos dos microdados', () => {
  for (let ano = 2009; ano <= 2023; ano++) assert.ok(porAno.get(ano)?.length > 0, `faltou ${ano}`);
});

// Prova inteira de um ano como a api.enem.dev entrega (1 a 180), a partir dos
// cadernos azuis. Títulos repetidos (inglês/espanhol) ficam só uma vez.
function provaApi(ano, numerar, { semLingua = false } = {}) {
  const linhas = porAno.get(ano).filter(l => l.cor.toUpperCase().startsWith('AZUL'));
  const qs = [];
  const vistos = new Set();
  for (const area of ['LC', 'CH', 'CN', 'MT']) {
    const daArea = linhas.filter(l => l.area === area);
    for (const l of daArea.filter(x => x.prova === daArea[0].prova)) {
      const numero = numerar(area, l.pos);
      if (vistos.has(numero) || !'ABCDE'.includes(l.gab) || !l.gab) continue;
      vistos.add(numero);
      qs.push({ id: qs.length + 1, ano, numero, lingua: semLingua ? null : l.lingua,
        correta: 'ABCDE'.indexOf(l.gab), disciplina: AREA[area], esperado: l.item, areaReal: area });
    }
  }
  return qs;
}

function conferir(qs, minimo) {
  const { casadas } = tri.casar(qs, porAno);
  assert.ok(casadas.length >= minimo, `casou só ${casadas.length}/${qs.length}`);
  for (const c of casadas) {
    const q = qs.find(x => x.id === c.id);
    assert.strictEqual(c.item, q.esperado, `questão ${q.numero}: item errado`);
    assert.strictEqual(c.disciplina, AREA[q.areaReal], `questão ${q.numero}: área errada`);
  }
  return casadas;
}

test('casamento: anos com numeração 1-180 igual à do INEP', () => {
  for (const ano of [2009, 2012, 2015, 2020, 2023]) conferir(provaApi(ano, (a, pos) => pos), 170);
});

test('casamento: 2017, em que o INEP numera cada área de 1 a 45 e o espanhol de 6 a 10', () => {
  const numerar = (a, pos) => a === 'LC' ? (pos <= 10 ? ((pos - 1) % 5) + 1 : pos - 5) : ({ CH: 45, CN: 90, MT: 135 })[a] + pos;
  conferir(provaApi(2017, numerar), 178);
  conferir(provaApi(2017, numerar, { semLingua: true }), 170);
});

test('casamento: ordem das áreas diferente da do INEP', () => {
  const numerar = (a, pos) => ({ LC: pos + 90, CH: pos - 45, CN: pos - 45, MT: pos })[a];
  conferir(provaApi(2016, numerar), 170);
});

test('casamento: questão na área errada é corrigida para a área do INEP', () => {
  const qs = provaApi(2010, (a, pos) => pos);
  let trocadas = 0;
  for (const q of qs) if (q.areaReal === 'LC' && trocadas < 30) { q.disciplina = 'ciencias-humanas'; trocadas++; }
  const casadas = conferir(qs, 160);
  const corrigidas = casadas.filter(c => qs.find(q => q.id === c.id).disciplina !== c.disciplina);
  assert.ok(corrigidas.length >= 25, `corrigiu só ${corrigidas.length} de 30`);
});

test('casamento: gabaritos aleatórios não casam com nada', () => {
  const qs = Array.from({ length: 180 }, (_, i) => ({
    id: i + 1, ano: 2022, disciplina: 'matematica', numero: i + 1, lingua: null, correta: (i * 7 + 3) % 5
  }));
  assert.strictEqual(tri.casar(qs, porAno).casadas.length, 0);
});

test('nível: as 4 faixas existem e seguem a dificuldade', () => {
  const cortes = tri.calcularCortes(porAno);
  const [c1, c2, c3] = cortes.MT;
  assert.ok(c1 < c2 && c2 < c3);
  assert.strictEqual(tri.nivelPelaTri(cortes, 'matematica', c1 - 1), 1);
  assert.strictEqual(tri.nivelPelaTri(cortes, 'matematica', (c1 + c2) / 2), 2);
  assert.strictEqual(tri.nivelPelaTri(cortes, 'matematica', (c2 + c3) / 2), 3);
  assert.strictEqual(tri.nivelPelaTri(cortes, 'matematica', c3 + 1), 4);
  assert.strictEqual(tri.nivelPelaTri(cortes, 'matematica', null), null);
});

test('nota: mais acertos, nota maior; errar fácil pesa mais que errar difícil', () => {
  const prova = caderno(2023, 'AZUL', 'MT').filter(l => l.b !== null).sort((a, b) => a.b - b.b);
  const faceis = prova.slice(0, 5);
  const dificeis = prova.slice(-5);
  const responder = (lista, acertou) => lista.map(q => ({ ...q, acertou }));

  const tudoCerto = tri.estimarNota(responder(prova, true)).nota;
  const tudoErrado = tri.estimarNota(responder(prova, false)).nota;
  assert.ok(tudoCerto > 800 && tudoErrado < 450, `${tudoCerto} / ${tudoErrado}`);

  // Mesmo número de acertos: padrão coerente vale mais que acertar só as difíceis.
  const coerente = tri.estimarNota([...responder(faceis, true), ...responder(dificeis, false)]).nota;
  const chute = tri.estimarNota([...responder(faceis, false), ...responder(dificeis, true)]).nota;
  assert.ok(coerente > chute + 100, `coerente ${coerente}, chute ${chute}`);
});

test('nota: estimativa se aproxima da nota real com a prova inteira', () => {
  const prova = caderno(2023, 'AZUL', 'MT').filter(l => l.b !== null);
  // Aluno de nota 650 (theta 1.5) que responde exatamente como o modelo espera.
  const real = 1.5;
  const respostas = prova.map(q => ({ ...q, acertou: tri.chanceDeAcertar(real, q) >= 0.5 }));
  const { nota } = tri.estimarNota(respostas);
  assert.ok(Math.abs(nota - 650) < 60, `estimou ${nota}`);
});

test('nota por área: só aparece a partir de 5 questões', () => {
  const prova = caderno(2023, 'AZUL', 'CH').filter(l => l.b !== null);
  const mapa = { 'ciencias-humanas': 'humanas' };
  const com = n => prova.slice(0, n).map(q => ({ ...q, disciplina: 'ciencias-humanas', acertou: true }));

  const quatro = tri.notasPorArea(com(4), mapa).humanas;
  assert.strictEqual(quatro.nota, null);
  assert.strictEqual(quatro.faltam, 1);

  const cinco = tri.notasPorArea(com(5), mapa).humanas;
  assert.ok(Number.isInteger(cinco.nota) && cinco.margem > 0);
});
