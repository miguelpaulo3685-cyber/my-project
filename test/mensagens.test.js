const test = require('node:test');
const assert = require('node:assert');
const { TEM_LINK } = require('../mensagens');

test('mensagens não deixam passar links', () => {
  for (const t of ['me chama em https://wa.me/55', 'www.site.com', 'olha instagram.com/fulano', 'meu.link.br']) assert.ok(TEM_LINK.test(t), t);
  for (const t of ['bora estudar matemática às 19h?', 'a resposta é 3,5 m. confere!', 'Valeu, tmj']) assert.ok(!TEM_LINK.test(t), t);
});
