const test = require('node:test');
const assert = require('node:assert');
const { chaveDaEscola, lerEscola } = require('../acolhimento');

test('acolhimento: o mesmo nome de escola, escrito de jeitos diferentes, vira a mesma chave', () => {
  assert.strictEqual(chaveDaEscola('Colégio Estadual São José'), chaveDaEscola('  colegio  ESTADUAL sao josé. '));
  assert.strictEqual(chaveDaEscola('E.E. Dom Pedro II'), 'e e dom pedro ii');
});

test('acolhimento: escola é opcional, com limite de tamanho', () => {
  assert.deepStrictEqual(lerEscola(undefined), { mudou: false });
  assert.deepStrictEqual(lerEscola(''), { mudou: true, escola: null, chave: null });
  assert.deepStrictEqual(lerEscola(null), { mudou: true, escola: null, chave: null });
  assert.strictEqual(lerEscola('  Colégio   Alfa ').escola, 'Colégio Alfa');
  assert.ok(lerEscola('x'.repeat(81)).erro);
  assert.ok(lerEscola('!!').erro);
  assert.ok(lerEscola(42).erro);
});
