const test = require('node:test');
const assert = require('node:assert');
const { limparFeedback, TAMANHO } = require('../feedback');

test('feedback: limpa texto, tipo e tela', () => {
  const f = limparFeedback({ texto: '  muito   bom  ', tipo: 'xyz', tela: 'treinar<script>' });
  assert.strictEqual(f.texto, 'muito bom');
  assert.strictEqual(f.tipo, 'outro');
  assert.strictEqual(f.tela, 'treinarscript');
  assert.strictEqual(limparFeedback({ texto: 'a'.repeat(5000), tipo: 'ideia' }).texto.length, TAMANHO);
  assert.strictEqual(limparFeedback({}).texto, '');
});
