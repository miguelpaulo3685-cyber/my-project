const test = require('node:test');
const assert = require('node:assert');
const c = require('../crescimento');
const arena = require('../arena');

// Banco de mentira: guarda as consultas e responde pelo começo do SQL.
function bancoFalso({ existe = true, amigos = 1 } = {}) {
  const feitas = [];
  return {
    feitas,
    async query(sql, valores) {
      feitas.push({ sql, valores });
      if (sql.startsWith('SELECT 1 FROM usuarios')) return { rowCount: existe ? 1 : 0, rows: [] };
      if (sql.startsWith('SELECT COUNT(*)::int AS n FROM usuarios')) return { rows: [{ n: amigos }] };
      return { rowCount: 1, rows: [] };
    }
  };
}

const gravado = banco => banco.feitas.find(f => f.sql.startsWith('UPDATE usuarios SET origem')).valores;
const emblemas = banco => banco.feitas.filter(f => f.sql.includes('arena_itens')).map(f => f.valores[1]);

test('origem: só palavras da lista; o resto vira "direto"', async () => {
  assert.strictEqual(c.lerOrigem('tiktok'), 'tiktok');
  assert.strictEqual(c.lerOrigem('https://site.com/?x'), null);
  const banco = bancoFalso();
  await c.registrarOrigem(banco, 7, { origem: '<script>' });
  assert.deepStrictEqual(gravado(banco), ['direto', null, 7]);
});

test('convite: vira indicação, guarda quem convidou e dá o primeiro emblema', async () => {
  const banco = bancoFalso({ amigos: 1 });
  await c.registrarOrigem(banco, 8, { origem: 'whatsapp', convite: '3' });
  assert.deepStrictEqual(gravado(banco), ['indicacao', 3, 8]);
  assert.deepStrictEqual(emblemas(banco), ['convite']);
});

test('convite: cinco amigos dão também o emblema da turma', async () => {
  const banco = bancoFalso({ amigos: 5 });
  await c.registrarOrigem(banco, 9, { convite: 3 });
  assert.deepStrictEqual(emblemas(banco), ['convite', 'turma']);
});

test('convite de conta que não existe ou da própria pessoa não vale', async () => {
  const sumiu = bancoFalso({ existe: false });
  await c.registrarOrigem(sumiu, 10, { origem: 'instagram', convite: 99 });
  assert.deepStrictEqual(gravado(sumiu), ['instagram', null, 10]);
  assert.deepStrictEqual(emblemas(sumiu), []);
  const proprio = bancoFalso();
  await c.registrarOrigem(proprio, 11, { convite: 11 });
  assert.deepStrictEqual(gravado(proprio), ['direto', null, 11]);
});

test('erro no banco não derruba o cadastro', async () => {
  await c.registrarOrigem({ query: async () => { throw new Error('caiu'); } }, 12, { convite: 3 });
});

test('emblemas de convite existem na Arena e nunca saem do baú', () => {
  for (const e of c.EMBLEMAS_CONVITE) assert.ok(arena.ITEM_POR_ID.has(e.item), e.item);
  for (let i = 0; i < 200; i++) assert.notStrictEqual(arena.sortearItem(new Set(), Math.random).raridade, 'convite');
});

test('comunidade: a consulta conta os laços da primeira semana e separa quem voltou', () => {
  const sql = require('../crescimento').SQL_COMUNIDADE;
  for (const pedaco of ['seguidores', 'grupo_membros', 'boas_vindas', 'duplas', 'mensagens', 'questoes_comentarios', "INTERVAL '7 days'", 'laco_voltou', 'sem_laco_voltou'])
    assert.ok(sql.includes(pedaco), pedaco);
});

test('uso: só partes da lista; visitante vira resumo sem o código original', () => {
  assert.strictEqual(c.lerParte('arena'), 'arena');
  assert.strictEqual(c.lerParte('<script>'), null);
  assert.deepStrictEqual(c.quemUsou({ id: 42 }, 'qualquer'), { quem: 'u42', conta: true });
  const v = c.quemUsou(null, 'abc123def456ghi7');
  assert.strictEqual(v.conta, false);
  assert.match(v.quem, /^v[0-9a-f]{20}$/);
  assert.ok(!v.quem.includes('abc123'));
  assert.strictEqual(c.quemUsou(null, 'curto'), null);
  assert.strictEqual(c.quemUsou(null, 'TEM-MAIUSCULA-E-TRACO'), null);
  assert.strictEqual(c.quemUsou(null, undefined), null);
});

test('uso: as telas do site só mandam partes que o servidor aceita', () => {
  const pagina = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const mapa = pagina.match(/const PARTE_DA_TELA = \{([\s\S]*?)\};/)[1];
  const partes = [...mapa.matchAll(/'([a-z]+)'/g)].map(m => m[1]).concat('aulas');
  for (const p of partes) assert.ok(c.PARTES.includes(p), `parte desconhecida: ${p}`);
});
