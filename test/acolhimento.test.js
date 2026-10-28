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

test('acolhimento: cidade e estado são opcionais e o estado precisa ser uma sigla válida', () => {
  const { lerCidade } = require('../acolhimento');
  assert.deepStrictEqual(lerCidade(undefined, undefined), {});
  assert.deepStrictEqual(lerCidade('  São  Paulo ', 'sp'), { cidade: 'São Paulo', uf: 'SP' });
  assert.deepStrictEqual(lerCidade('', ''), { cidade: null, uf: null });
  assert.ok(lerCidade('x', 'XX').erro);
  assert.ok(lerCidade('x'.repeat(61), 'SP').erro);
});
