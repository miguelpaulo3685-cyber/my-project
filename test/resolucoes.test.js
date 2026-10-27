const test = require('node:test');
const assert = require('node:assert');
const { lerChave } = require('../resolucoes');

test('chave da resolução: ano, número e língua', () => {
  assert.deepStrictEqual(lerChave('2024-150'), { ano: 2024, numero: 150, lingua: null });
  assert.deepStrictEqual(lerChave('2023-3-ingles'), { ano: 2023, numero: 3, lingua: 'ingles' });
  assert.strictEqual(lerChave('2024-150-frances'), null);
});

test('resoluções do arquivo: chave válida, texto e resposta indicada', () => {
  for (const [k, t] of Object.entries(require('../resolucoes.json'))) {
    assert.ok(lerChave(k), k);
    assert.match(t, /\*\*Resposta: [A-E]\*\*/, k);
  }
});
