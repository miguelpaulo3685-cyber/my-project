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

test('respostas sem conta: marca é um resumo, não o código; código inválido não marca', () => {
  const m = c.marcaDoVisitante('abc123def456ghi7');
  assert.match(m, /^[0-9a-f]{32}$/);
  assert.ok(!m.includes('abc123'));
  assert.strictEqual(c.marcaDoVisitante('abc123def456ghi7'), m);
  assert.notStrictEqual(m, c.quemUsou(null, 'abc123def456ghi7').quem.slice(1)); // outro tempero que o painel de uso
  assert.strictEqual(c.marcaDoVisitante('curto'), null);
  assert.strictEqual(c.marcaDoVisitante("x' OR 1=1 --"), null);
  assert.strictEqual(c.marcaDoVisitante(undefined), null);
});

test('conta nova leva as respostas feitas sem conta no aparelho', async () => {
  const banco = bancoFalso();
  const n = await c.juntarRespostasDoVisitante(banco, 42, 'abc123def456ghi7');
  assert.strictEqual(n, 1);
  const f = banco.feitas[0];
  assert.match(f.sql, /UPDATE respostas SET usuario_id = \$1, visitante = NULL WHERE visitante = \$2 AND usuario_id IS NULL/);
  assert.deepStrictEqual(f.valores, [42, c.marcaDoVisitante('abc123def456ghi7')]);
});

test('sem código válido nada é juntado; erro no banco não quebra o cadastro', async () => {
  const banco = bancoFalso();
  assert.strictEqual(await c.juntarRespostasDoVisitante(banco, 42, null), 0);
  assert.strictEqual(banco.feitas.length, 0);
  const quebrado = { async query() { throw new Error('caiu'); } };
  const erro = console.error; console.error = () => {};
  assert.strictEqual(await c.juntarRespostasDoVisitante(quebrado, 42, 'abc123def456ghi7'), 0);
  console.error = erro;
});

test('metas: meta semanal por período e contas previstas pelos pontos de controle', () => {
  assert.strictEqual(c.metaDaSemana('2026-12-07'), 60);
  assert.strictEqual(c.metaDaSemana('2027-02-01'), 180);
  assert.strictEqual(c.metaDaSemana('2027-05-03'), 100);
  assert.strictEqual(c.metaDaSemana('2027-08-02'), 140);
  assert.strictEqual(c.contasPrevistas('2026-11-01'), 18);
  assert.strictEqual(c.contasPrevistas('2026-12-31'), 300);
  assert.strictEqual(c.contasPrevistas('2027-08-31'), 5000);
  assert.strictEqual(c.contasPrevistas('2028-01-01'), 5000);
});

test('metas: condições do PRO contam só semanas fechadas e seguidas', () => {
  const s = ativos => ativos.map(a => ({ ativos: a }));
  // a última semana (corrente) não conta, mesmo com 999
  const p = c.condicoesPro(s([50, 210, 220, 90, 230, 240, 250, 999]), 1200);
  assert.strictEqual(p.lancar.semanas_com_200, 3);
  assert.strictEqual(p.lancar.ativos_ok, true);
  assert.strictEqual(p.lancar.contas_ok, true);
  assert.strictEqual(p.lista_espera.liberada, true);
  const q = c.condicoesPro(s([120, 80, 150, 10]), 300);
  assert.strictEqual(q.lista_espera.semanas_com_100, 1);
  assert.strictEqual(q.lista_espera.liberada, false);
  assert.strictEqual(q.lancar.contas_ok, false);
});

test('origem: aceita as marcas novas (2ª conta, anúncio, stories, escola)', () => {
  for (const o of ['tiktok2', 'tiktok_pago', 'story', 'escola']) assert.strictEqual(c.lerOrigem(o), o);
});

test('pessoas por dia: 14 dias, com e sem conta, contando cada aparelho uma vez', () => {
  assert.match(c.SQL_PESSOAS, /COUNT\(DISTINCT p\.quem\)::int AS pessoas/);
  assert.match(c.SQL_PESSOAS, /FILTER \(WHERE NOT p\.conta\)::int AS sem_conta/);
  assert.match(c.SQL_PESSOAS, /- 13/);
  assert.match(c.SQL_PESSOAS, /LEFT JOIN uso_partes/);
});
