const test = require('node:test');
const assert = require('node:assert');
const e = require('../erros');

test('limpar: tira e-mail, token e o que vem depois do "?"', () => {
  const t = e.limpar('Falhou para joao@gmail.com em /api/x?token=abc com 6d3fcf1d61a4987013dbd168298c81672c5b45');
  assert.ok(!t.includes('joao@gmail.com') && !t.includes('abc') && !t.includes('6d3fcf1d'), t);
  assert.ok(t.includes('[e-mail]') && t.includes('?…'));
  assert.strictEqual(e.limpar('ab '.repeat(200)).length, 300);
});

test('chave: números diferentes contam como o mesmo erro', () => {
  assert.strictEqual(e.chaveDo('servidor', 'Erro no post 12', ''), e.chaveDo('servidor', 'Erro no post 13', ''));
  assert.strictEqual(e.chaveDo('site', 'x is undefined', 'index.html:100'), e.chaveDo('site', 'x is undefined', 'index.html:101'));
  assert.notStrictEqual(e.chaveDo('site', 'a', ''), e.chaveDo('servidor', 'a', ''));
});

test('ignora barulho: internet caindo, extensão do navegador', () => {
  assert.ok(e.deveIgnorar('TypeError: Failed to fetch', ''));
  assert.ok(e.deveIgnorar('Script error.', ''));
  assert.ok(e.deveIgnorar('algo', 'chrome-extension://abc/x.js:1'));
  assert.ok(!e.deveIgnorar('x is not a function', 'index.html:10'));
});

function bancoFalso({ novos = true, alertaLivre = true } = {}) {
  const feitas = [];
  return {
    feitas,
    async query(sql, valores) {
      feitas.push({ sql, valores });
      if (sql.includes('INSERT INTO erros_site')) return { rows: [{ novo: novos }] };
      if (sql.includes('alerta_erros_em')) return { rowCount: alertaLivre ? 1 : 0 };
      return { rows: [], rowCount: 0 };
    }
  };
}

test('vigia: junta os iguais e avisa uma vez quando aparece erro novo', async () => {
  const banco = bancoFalso();
  const avisos = [];
  const v = e.criarVigia(banco, { avisarAdmins: async a => avisos.push(a), logOriginal: () => {} });
  v.registrar('servidor', 'Erro ao listar 1');
  v.registrar('servidor', 'Erro ao listar 2');
  v.registrar('site', 'Failed to fetch');
  const r = await v.gravar();
  assert.strictEqual(r.total, 2);
  assert.strictEqual(banco.feitas.filter(f => f.sql.includes('INSERT INTO erros_site')).length, 1);
  assert.strictEqual(avisos.length, 1);
  assert.match(avisos[0].linhas[0], /Erro ao listar/);
  // Segundo erro novo logo depois: dentro das 3 horas, sem outro aviso.
  v.registrar('site', 'outro erro');
  await v.gravar();
  assert.strictEqual(avisos.length, 1);
});

test('vigia: erro já conhecido e poucos não avisam; outro servidor já avisou também não', async () => {
  const conhecido = e.criarVigia(bancoFalso({ novos: false }), { avisarAdmins: async () => assert.fail('não devia avisar'), logOriginal: () => {} });
  conhecido.registrar('servidor', 'velho');
  await conhecido.gravar();
  const avisos = [];
  const recente = e.criarVigia(bancoFalso({ alertaLivre: false }), { avisarAdmins: async a => avisos.push(a), logOriginal: () => {} });
  recente.registrar('servidor', 'novo');
  await recente.gravar();
  assert.strictEqual(avisos.length, 0);
});

test('vigia: banco fora do ar não vira erro em laço', async () => {
  let logs = 0;
  const v = e.criarVigia({ query: async () => { throw new Error('caiu'); } }, { logOriginal: () => logs++ });
  v.registrar('servidor', 'x');
  await v.gravar();
  assert.strictEqual(logs, 1);
  assert.strictEqual(v.buffer.size, 0);
});

test('textoDoLog junta argumentos e erros', () => {
  assert.strictEqual(e.textoDoLog(['Erro ao salvar:', new Error('timeout')]), 'Erro ao salvar: timeout');
});
