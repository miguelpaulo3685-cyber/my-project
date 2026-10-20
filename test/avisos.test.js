const test = require('node:test');
const assert = require('node:assert');

process.env.SEGREDO_IMAGENS = process.env.SEGREDO_IMAGENS || 'segredo-de-teste';
const { assinarDescadastro, resumoSemanal } = require('../avisos');

test('avisos: link de sair do e-mail é assinado e muda por pessoa', () => {
  const a = assinarDescadastro(7), b = assinarDescadastro(8);
  assert.strictEqual(a.length, 32);
  assert.notStrictEqual(a, b);
  assert.strictEqual(assinarDescadastro(7), a, 'o mesmo link vale sempre');
});

test('avisos: resumo semanal traz a semana e o link de sair', () => {
  const m = resumoSemanal({ id: 7, username: 'Lia <b>', questoes: 10, acertos: 7 }, { dias: 4 }, { pessoas: 3, questoes: 50, sem_resposta: 0 });
  assert.match(m.subject, /4 dias seguidos/);
  assert.match(m.text, /10 questões e acertou 7 \(70%\)/);
  assert.match(m.text, new RegExp(`descadastrar=7\\.${assinarDescadastro(7)}`));
  assert.ok(!m.html.includes('Lia <b>'), 'o nome vai escapado no HTML');
  assert.ok(!/esperando ajuda/.test(m.text), 'sem perguntas pendentes, não fala delas');
});
