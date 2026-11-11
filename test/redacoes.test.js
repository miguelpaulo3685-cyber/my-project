const test = require('node:test');
const assert = require('node:assert');
const { resultadoDaRedacao, discrepantes } = require('../redacoes');

test('redação: espera 2 correções, com prévia na primeira', () => {
  assert.deepStrictEqual(resultadoDaRedacao([]), { situacao: 'aguardando', faltam: 2, nota: null, competencias: null });
  const uma = resultadoDaRedacao([[160, 160, 120, 160, 120]]);
  assert.strictEqual(uma.situacao, 'parcial');
  assert.strictEqual(uma.nota, 720);
});

test('redação: duas correções parecidas dão a média', () => {
  const r = resultadoDaRedacao([[160, 160, 120, 160, 120], [160, 120, 160, 160, 160]]);
  assert.strictEqual(r.situacao, 'corrigida');
  assert.strictEqual(r.nota, 740);
  assert.deepStrictEqual(r.competencias, [160, 140, 140, 160, 140]);
});

test('redação: discrepância como no ENEM (mais de 100 no total ou de 80 numa competência)', () => {
  assert.ok(discrepantes([200, 200, 200, 200, 200], [120, 160, 160, 160, 160]), '1000 x 760');
  assert.ok(discrepantes([200, 120, 120, 120, 120], [80, 120, 120, 160, 160]), '120 de diferença na C1');
  assert.ok(!discrepantes([160, 160, 160, 160, 160], [120, 120, 160, 160, 160]), '80 no total e 40 por competência');
  const r = resultadoDaRedacao([[200, 200, 200, 200, 200], [120, 120, 120, 120, 120]]);
  assert.strictEqual(r.situacao, 'discrepante');
  assert.strictEqual(r.faltam, 1);
});

test('redação: a terceira correção faz média com a mais próxima', () => {
  const r = resultadoDaRedacao([[200, 200, 200, 200, 200], [120, 120, 120, 120, 120], [160, 160, 160, 160, 120]]);
  assert.strictEqual(r.situacao, 'corrigida');
  assert.strictEqual(r.nota, (760 + 600) / 2, 'a 3ª (760) fica mais perto de 600 que de 1000');
  assert.deepStrictEqual(r.usadas, [1, 2]);
});

test('prova de corretor: perto da nota é a mesma regra da 3ª correção', () => {
  const { pertoDaNota } = require('../redacoes');
  assert.equal(pertoDaNota([160, 120, 120, 160, 120], [160, 120, 120, 160, 120]), true);
  assert.equal(pertoDaNota([160, 120, 200, 160, 120], [160, 120, 120, 160, 120]), true);  // 80 numa competência: ainda passa
  assert.equal(pertoDaNota([40, 40, 40, 40, 40], [160, 120, 120, 160, 120]), false);      // longe no total
  assert.equal(pertoDaNota([200, 120, 120, 160, 120], [100, 120, 120, 160, 120]), false); // 100 numa competência
});

test('professor: a correção dele fecha a nota sozinha', () => {
  const { resultadoDasCorrecoes } = require('../redacoes');
  const comunidade = [{ notas: [160, 160, 120, 160, 120] }, { notas: [160, 120, 160, 160, 160] }];
  assert.strictEqual(resultadoDasCorrecoes(comunidade).nota, 740, 'sem professor, vale a média');
  const r = resultadoDasCorrecoes([...comunidade, { notas: [120, 120, 120, 160, 120], professor: true }]);
  assert.strictEqual(r.situacao, 'corrigida');
  assert.strictEqual(r.nota, 640);
  assert.strictEqual(r.professor, true);
  assert.deepStrictEqual(r.usadas, [2]);
  const so = resultadoDasCorrecoes([{ notas: [200, 200, 160, 200, 160], professor: true }]);
  assert.strictEqual(so.faltam, 0, 'não precisa esperar a comunidade');
});

test('professor: notas sugeridas vêm da comunidade (arredondadas) ou da IA', () => {
  const { sugestaoDeNotas, resultadoDasCorrecoes } = require('../redacoes');
  const media = resultadoDasCorrecoes([{ notas: [160, 160, 120, 160, 120] }, { notas: [160, 120, 160, 160, 160] }]);
  const s = sugestaoDeNotas(media, [200, 200, 200, 200, 200]);
  assert.strictEqual(s.origem, 'comunidade');
  assert.ok(s.notas.every(n => [0, 40, 80, 120, 160, 200].includes(n)), 'só níveis válidos');
  assert.strictEqual(s.notas[0], 160);
  assert.deepStrictEqual(sugestaoDeNotas(resultadoDasCorrecoes([]), [160, 120, 120, 160, 80]), { origem: 'ia', notas: [160, 120, 120, 160, 80] });
  assert.deepStrictEqual(sugestaoDeNotas(resultadoDasCorrecoes([]), null), { origem: null, notas: [null, null, null, null, null] });
});

test('professor: urgente é discrepante ou esperando há mais de 3 dias', () => {
  const { urgenteParaProfessor } = require('../redacoes');
  const agora = Date.parse('2026-11-20T12:00:00Z');
  assert.equal(urgenteParaProfessor('discrepante', '2026-11-20T10:00:00Z', agora), true);
  assert.equal(urgenteParaProfessor('aguardando', '2026-11-19T12:00:00Z', agora), false);
  assert.equal(urgenteParaProfessor('parcial', '2026-11-16T11:00:00Z', agora), true);
});
