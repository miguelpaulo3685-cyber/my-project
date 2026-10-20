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
