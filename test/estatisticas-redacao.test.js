const test = require('node:test');
const assert = require('node:assert');
const e = require('../estatisticas-redacao');

test('estatísticas da redação: um tema por ano, sem buracos, com eixos válidos', () => {
  e.TEMAS.forEach((t, i) => {
    assert.equal(t.ano, 1998 + i);
    assert.ok(e.EIXOS[t.principal], `eixo principal de ${t.ano}`);
    assert.ok(t.secundario === null || e.EIXOS[t.secundario], `eixo secundário de ${t.ano}`);
  });
  for (const eixo of Object.keys(e.EIXOS)) assert.equal(e.ASSUNTOS[eixo].length, 3);
});

test('estatísticas da redação: as chances somam 100% e só usam os anos anteriores', () => {
  for (const modelo of ['frequencia', 'recente', 'sem_repetir']) {
    const c = e.chances(2020, modelo);
    assert.ok(Math.abs(c.reduce((s, r) => s + r.chance, 0) - 1) < 1e-9);
    assert.ok(c.every(r => r.chance > 0), 'nenhum eixo com chance zero');
  }
  // Até 2019 a saúde só tinha aparecido como eixo secundário: não pode estar na frente.
  assert.ok(e.chances(2020, 'frequencia').findIndex(r => r.eixo === 'saude') >= 5);
});

test('estatísticas da redação: o eixo do ano anterior perde força no modelo sem repetir', () => {
  const com = e.chances(2027, 'recente').find(r => r.eixo === 'saude').chance;
  const sem = e.chances(2027, 'sem_repetir').find(r => r.eixo === 'saude').chance;
  assert.ok(sem < com);
});

test('estatísticas da redação: o resultado mostra o próximo ano e o teste honesto', () => {
  const s = e.estatisticas();
  assert.equal(s.alvo, e.TEMAS[e.TEMAS.length - 1].ano + 1);
  assert.equal(s.ranking.length, 8);
  assert.equal(s.teste.total, 10);
  assert.equal(s.teste.top3, e.melhorModelo().top3);
  assert.ok(s.teste.top3 >= 0 && s.teste.top3 <= 10);
  assert.equal(s.historico[0].ano, s.ate);
});
