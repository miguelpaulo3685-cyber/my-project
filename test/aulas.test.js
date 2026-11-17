const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const pagina = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const lista = pagina.match(/const AULAS = \[([\s\S]*?)\];/)[1];
// Aulas soltas (AULAS no index.html) e as aulas prontas das trilhas (trilhas/indice.js).
global.window = {};
require(path.join(raiz, 'trilhas', 'indice.js'));
const trilhas = global.window.TRILHAS_MM;
const ids = [...new Set([...[...lista.matchAll(/id: '([a-z-]+)'/g)].map(m => m[1]), ...trilhas.prontas])];

test('trilhas: toda aula pronta está em algum módulo, ids não se repetem e cada teste existe e é válido', () => {
  const todas = [];
  for (const materia of Object.values(trilhas.materias)) for (const m of materia.modulos) {
    for (const [id] of m.aulas) todas.push(id);
    if (m.teste) {
      require(path.join(raiz, 'trilhas', `teste-${m.id}.js`));
      const q = global.window.TESTES_MM[m.id];
      assert.strictEqual(q.length, 10, `${m.id}: o teste precisa de 10 questões`);
      for (const [enun, alts, certa, porque] of q) assert.ok(enun && alts.length >= 3 && certa < alts.length && porque, `${m.id}: questão incompleta: ${enun}`);
    }
  }
  assert.strictEqual(new Set(todas).size, todas.length, 'aula repetida entre módulos');
  for (const id of trilhas.prontas) assert.ok(todas.includes(id), `${id} está pronta mas não aparece em nenhum módulo`);
});

test('aulas: cada aula da lista tem os dois arquivos e se registra com o mesmo nome', () => {
  assert.ok(ids.length >= 1);
  for (const id of ids) {
    const html = fs.readFileSync(path.join(raiz, 'aulas', `${id}.html`), 'utf8');
    const js = fs.readFileSync(path.join(raiz, 'aulas', `${id}.js`), 'utf8');
    assert.ok(js.includes(`aulasMM.aulas['${id}'] = raiz =>`), `${id}.js não registra a aula`);
    assert.match(html, /<h1>/);
    assert.match(html, /data-treinar="(linguagens|humanas|natureza|matematica)"/, `${id}: falta o botão de treinar`);
  }
});

test('aulas: nomes começam com "au-" para não bater com o resto do site', () => {
  for (const id of ids) {
    const html = fs.readFileSync(path.join(raiz, 'aulas', `${id}.html`), 'utf8');
    for (const m of html.matchAll(/\b(id|for)="([^"]+)"/g)) assert.ok(m[2].startsWith('au-'), `${id}: ${m[1]}="${m[2]}"`);
    for (const m of html.matchAll(/\bclass="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) assert.ok(c.startsWith('au-'), `${id}: class "${c}"`);
    const js = fs.readFileSync(path.join(raiz, 'aulas', `${id}.js`), 'utf8');
    assert.doesNotMatch(js, /document\.(getElementById|querySelector)/, `${id}.js procura fora da aula`);
  }
});

test('aulas: o teste rápido aponta para uma alternativa que existe', () => {
  for (const id of ids) {
    const html = fs.readFileSync(path.join(raiz, 'aulas', `${id}.html`), 'utf8');
    for (const bloco of html.split('class="au-pergunta"').slice(1)) {
      const certa = Number(bloco.match(/data-certa="(\d+)"/)[1]);
      const alternativas = bloco.split('</div>\n')[0].match(/class="au-alt"/g).length;
      assert.ok(certa < alternativas, `${id}: resposta certa fora das alternativas`);
    }
  }
});
