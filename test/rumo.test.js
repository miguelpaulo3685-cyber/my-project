const test = require('node:test');
const assert = require('node:assert');
const rumo = require('../rumo');
const { ITEM_POR_ID, sortearItem } = require('../arena');

test('rumo: nota só vale com 3 das 5 notas', () => {
  assert.deepStrictEqual(rumo.situacao(800, 2, 790), { valida: false, faltam_notas: 1 });
  assert.deepStrictEqual(rumo.situacao(null, 0, 790), { valida: false, faltam_notas: 3 });
  assert.deepStrictEqual(rumo.situacao(712, 3, 790), { valida: true, falta: 78, pct: 90, passou: false });
  assert.deepStrictEqual(rumo.situacao(800, 5, 790), { valida: true, falta: -10, pct: 100, passou: true });
});

test('rumo: marcos alcançados pela distância do corte', () => {
  assert.deepStrictEqual(rumo.marcosAlcancados(350), ['rumo_inicio']);
  assert.deepStrictEqual(rumo.marcosAlcancados(150), ['rumo_inicio', 'rumo_200']);
  assert.deepStrictEqual(rumo.marcosAlcancados(35), ['rumo_inicio', 'rumo_200', 'rumo_100', 'rumo_50']);
  assert.deepStrictEqual(rumo.marcosAlcancados(0), ['rumo_inicio', 'rumo_200', 'rumo_100', 'rumo_50', 'rumo_20', 'rumo_passou']);
  assert.deepStrictEqual(rumo.marcosAlcancados(null), []);
});

test('rumo: valida a meta escolhida', () => {
  assert.deepStrictEqual(rumo.validarMeta({ curso: 'medicina' }), { curso: 'medicina', faculdade: null, nota_corte: 790 });
  assert.deepStrictEqual(rumo.validarMeta({ curso: 'direito', faculdade: '  UFMG <b>  ', nota_corte: '771.4' }),
    { curso: 'direito', faculdade: 'UFMG b', nota_corte: 771 });
  assert.ok(rumo.validarMeta({ curso: 'astronauta' }).erro);
  assert.ok(rumo.validarMeta({ curso: 'medicina', nota_corte: 1200 }).erro);
  assert.ok(rumo.validarMeta({ curso: 'medicina', nota_corte: 'abc' }).erro);
  assert.strictEqual(rumo.validarMeta({ curso: 'medicina', faculdade: 'x'.repeat(100) }).faculdade.length, 60);
});

test('rumo: posições com empate', () => {
  const l = rumo.comPosicoes([{ f: 10 }, { f: 20 }, { f: 20 }, { f: 30 }], x => x.f);
  assert.deepStrictEqual(l.map(x => x.posicao), [1, 2, 2, 4]);
});

test('rumo: cursos com corte plausível e emblemas que nunca saem do baú', () => {
  for (const c of rumo.CURSOS) assert.ok(c.corte >= 500 && c.corte <= 900, c.id);
  assert.strictEqual(new Set(rumo.CURSOS.map(c => c.id)).size, rumo.CURSOS.length);
  const ids = [...rumo.MARCOS.map(m => m.id), ...Object.values(rumo.EMBLEMAS_DA_SEMANA)];
  for (const id of ids) assert.strictEqual(ITEM_POR_ID.get(id)?.raridade, 'rumo', id);
  for (let i = 0; i < 200; i++) assert.notStrictEqual(sortearItem(new Set(), Math.random).raridade, 'rumo');
});
