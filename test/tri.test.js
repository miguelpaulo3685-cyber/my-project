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

function comoQuestoes(linhas, ano, area) {
  return linhas.map((l, i) => ({
    id: i + 1, ano, disciplina: AREA[area], numero: l.pos, lingua: l.lingua,
    correta: 'ABCDE'.indexOf(l.gab), esperado: l.item
  }));
}

test('carrega os 15 anos dos microdados', () => {
  for (let ano = 2009; ano <= 2023; ano++) assert.ok(porAno.get(ano)?.length > 0, `faltou ${ano}`);
});

test('casamento: acha o caderno certo e nunca atribui item errado', () => {
  for (const [ano, area] of [[2023, 'LC'], [2015, 'CH'], [2009, 'MT'], [2020, 'CN']]) {
    const qs = comoQuestoes(caderno(ano, 'AZUL', area), ano, area);
    const { casadas, relatorio } = tri.casar(qs, porAno);
    assert.ok(relatorio[0].concordancia >= 95, `${ano} ${area}: concordância ${relatorio[0].concordancia}%`);
    assert.ok(casadas.length >= qs.length - 5, `${ano} ${area}: casou só ${casadas.length}/${qs.length}`);
    for (const c of casadas) {
      assert.strictEqual(c.item, qs.find(q => q.id === c.id).esperado, `${ano} ${area}: item errado`);
    }
  }
});

test('casamento: gabaritos aleatórios não casam com nada', () => {
  const qs = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1, ano: 2022, disciplina: 'matematica', numero: 136 + i, lingua: null, correta: (i * 7) % 5
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
