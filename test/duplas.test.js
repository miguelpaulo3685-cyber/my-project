const test = require('node:test');
const assert = require('node:assert');
const { registrarRecordesTri, SUBIDA_QUE_CONTA } = require('../duplas');

// Banco de mentira: guarda recordes e as conquistas registradas.
function bancoFalso(recordes = {}) {
  const atividades = [];
  return { atividades, recordes, query: async (sql, p) => {
    if (sql.startsWith('SELECT nota FROM tri_recordes')) return { rows: recordes[p[1]] !== undefined ? [{ nota: recordes[p[1]] }] : [] };
    if (sql.includes('INSERT INTO tri_recordes')) { recordes[p[1]] = p[2]; return {}; }
    if (sql.includes('INSERT INTO atividades')) { atividades.push({ tipo: p[1], texto: p[2], nota: p[3] }); return {}; }
    return { rows: [] };
  } };
}

test('duplas: primeira nota TRI de uma área vira conquista', async () => {
  const b = bancoFalso();
  await registrarRecordesTri(b, 1, { matematica: { nota: 612.4 }, linguagens: { nota: null, faltam: 2 } });
  assert.deepStrictEqual(b.atividades, [{ tipo: 'tri', texto: 'Matemática', nota: 612 }]);
});

test('duplas: recorde só vira conquista quando sobe bastante; nota menor não conta', async () => {
  const b = bancoFalso({ matematica: 600 });
  await registrarRecordesTri(b, 1, { matematica: { nota: 600 + SUBIDA_QUE_CONTA - 1 } });
  assert.strictEqual(b.atividades.length, 0, 'subiu pouco: só atualiza o recorde');
  assert.strictEqual(b.recordes.matematica, 600 + SUBIDA_QUE_CONTA - 1);
  await registrarRecordesTri(b, 1, { matematica: { nota: 580 } });
  assert.strictEqual(b.recordes.matematica, 600 + SUBIDA_QUE_CONTA - 1, 'nota menor não derruba o recorde');
  await registrarRecordesTri(b, 1, { matematica: { nota: 650 } });
  assert.deepStrictEqual(b.atividades, [{ tipo: 'tri', texto: `Matemática|${600 + SUBIDA_QUE_CONTA - 1}`, nota: 650 }]);
});
