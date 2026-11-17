const test = require('node:test');
const assert = require('node:assert');
const { limpar, juntar } = require('../trilha');

test('trilha: só guarda ids e números válidos', () => {
  const d = limpar({ aulas: { soma: 123, 'Errado!': 5, divisao: 'x' }, testes: { m1: 9, m2: 7.5, m3: -1, '<b>': 3 } });
  assert.deepStrictEqual(d, { aulas: { soma: 123 }, testes: { m1: 9 } });
  assert.deepStrictEqual(limpar(null), { aulas: {}, testes: {} });
});

test('trilha: juntar nunca perde progresso', () => {
  const a = { aulas: { soma: 100, divisao: 300 }, testes: { m1: 8 } };
  const b = { aulas: { soma: 200, potencia: 400 }, testes: { m1: 6, m2: 9 } };
  assert.deepStrictEqual(juntar(a, b), { aulas: { soma: 100, divisao: 300, potencia: 400 }, testes: { m1: 8, m2: 9 } });
});
