const test = require('node:test');
const assert = require('node:assert');
const { semanaDe, fimDaSemana } = require('../desafio');

test('desafio: semana ISO no horário de Brasília', () => {
  assert.strictEqual(semanaDe(new Date('2026-10-20T15:00:00Z')), '2026-W43');
  assert.strictEqual(semanaDe(new Date('2021-01-03T15:00:00Z')), '2020-W53', 'domingo no começo de janeiro ainda é do ano anterior');
  assert.strictEqual(semanaDe(new Date('2024-12-30T15:00:00Z')), '2025-W01', 'segunda no fim de dezembro já é do ano seguinte');
  // Domingo 23h30 em Brasília (segunda 02h30 UTC) ainda é a semana anterior.
  assert.strictEqual(semanaDe(new Date('2026-10-26T02:30:00Z')), '2026-W43');
  assert.strictEqual(semanaDe(new Date('2026-10-26T03:00:00Z')), '2026-W44', 'segunda 00h em Brasília vira a semana');
});

test('desafio: termina na segunda seguinte, 00h de Brasília', () => {
  assert.strictEqual(fimDaSemana(new Date('2026-10-20T15:00:00Z')).toISOString(), '2026-10-26T03:00:00.000Z');
  assert.strictEqual(fimDaSemana(new Date('2026-10-26T02:30:00Z')).toISOString(), '2026-10-26T03:00:00.000Z');
});
