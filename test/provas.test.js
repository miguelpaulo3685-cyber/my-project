const test = require('node:test');
const assert = require('node:assert');
const { ehDeLingua, linguaPeloTexto, completarLinguas, pastasQueFaltam, semRepetir } = require('../provas');

const q = (year, index, language = null, context = '') => ({ year, index, language, context, title: `Questão ${index} - ENEM ${year}` });

test('questões de língua estrangeira pela posição na prova', () => {
  assert.ok(ehDeLingua(2023, 1) && ehDeLingua(2023, 5) && !ehDeLingua(2023, 6) && !ehDeLingua(2023, 91));
  assert.ok(ehDeLingua(2012, 91) && ehDeLingua(2012, 95) && !ehDeLingua(2012, 1));
  assert.ok(!ehDeLingua(2009, 91));
});

test('questão sem idioma vira a versão que falta', () => {
  const [ingles, semIdioma] = completarLinguas([q(2020, 5, 'ingles'), q(2020, 5)]);
  assert.strictEqual(ingles.language, 'ingles');
  assert.strictEqual(semIdioma.language, 'espanhol');
  assert.strictEqual(completarLinguas([q(2011, 91, 'espanhol'), q(2011, 91)])[1].language, 'ingles');
});

test('sem a outra versão, o idioma sai do texto de apoio', () => {
  assert.strictEqual(linguaPeloTexto('En México se producen más de 10 millones de m3 de basura y es un problema'), 'espanhol');
  assert.strictEqual(linguaPeloTexto('Going to university seems to reduce the risk of dying from heart disease'), 'ingles');
  assert.strictEqual(linguaPeloTexto('![](https://enem.dev/x.png)'), null);
  assert.strictEqual(completarLinguas([q(2011, 95, null, 'Es posible reducir la basura en el país')])[0].language, 'espanhol');
});

test('questões que não são de língua ficam como estão', () => {
  const fora = q(2023, 40);
  assert.strictEqual(completarLinguas([fora])[0], fora);
});

test('pastas do GitHub que ainda faltam buscar', () => {
  const tem = [];
  for (let n = 1; n <= 180; n++) {
    if (!ehDeLingua(2023, n)) tem.push(q(2023, n));
    else tem.push(q(2023, n, 'ingles'), q(2023, n, 'espanhol'));
  }
  assert.deepStrictEqual(pastasQueFaltam(2023, tem), []);
  const semAlgumas = tem.filter(x => !(x.index === 34 || (x.index === 2 && x.language === 'espanhol')));
  assert.deepStrictEqual(pastasQueFaltam(2023, semAlgumas), ['2-espanhol', '2', '34']);
});

test('não repete a mesma questão', () => {
  assert.strictEqual(semRepetir([q(2023, 1, 'ingles'), q(2023, 1, 'ingles'), q(2023, 1, 'espanhol'), q(2023, 7), q(2023, 7)]).length, 3);
});
