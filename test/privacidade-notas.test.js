const test = require('node:test');
const assert = require('node:assert');
const p = require('../privacidade-notas');

test('notas: padrão é só amigos, e a regra usa seguir nos dois sentidos', () => {
  assert.equal(p.PADRAO_NOTAS, 'amigos');
  assert.deepEqual(p.OPCOES_NOTAS, ['todos', 'amigos', 'eu']);
  const sql = p.podeVerNotasSql('$1', 'u');
  assert.match(sql, /seguidor_id = \$1 AND sv1\.seguido_id = u\.id/);
  assert.match(sql, /seguidor_id = u\.id AND sv2\.seguido_id = \$1/);
});

test('notas: só atividades com nota passam pela regra', () => {
  const sql = p.atividadeVisivelSql('$1', 'a', 'u');
  assert.match(sql, /a\.tipo NOT IN \('tri', 'desafio'\)/);
});
