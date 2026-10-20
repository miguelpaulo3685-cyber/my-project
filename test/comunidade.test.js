const test = require('node:test');
const assert = require('node:assert');
const { faseDoPomodoro, contarSequencia, nivelDoXp, hojeEmBrasilia } = require('../comunidade');

test('comunidade: pomodoro coletivo alinhado à hora cheia e à meia hora', () => {
  const foco = faseDoPomodoro(Date.parse('2026-10-20T17:10:00Z'));
  assert.strictEqual(foco.foco, true);
  assert.strictEqual(foco.inicio, '2026-10-20T17:00:00.000Z');
  assert.strictEqual(foco.termina_em, '2026-10-20T17:25:00.000Z');
  const pausa = faseDoPomodoro(Date.parse('2026-10-20T17:27:00Z'));
  assert.strictEqual(pausa.foco, false);
  assert.strictEqual(pausa.ciclo, foco.ciclo, 'a pausa é do mesmo ciclo do foco');
  assert.strictEqual(pausa.termina_em, '2026-10-20T17:30:00.000Z');
  assert.strictEqual(faseDoPomodoro(Date.parse('2026-10-20T17:30:00Z')).ciclo, foco.ciclo + 1);
});

test('comunidade: dia de Brasília vira à meia-noite de lá', () => {
  assert.strictEqual(hojeEmBrasilia(Date.parse('2026-10-21T02:59:00Z')), '2026-10-20');
  assert.strictEqual(hojeEmBrasilia(Date.parse('2026-10-21T03:00:00Z')), '2026-10-21');
});

test('comunidade: sequência de dias seguidos', () => {
  const hoje = '2026-10-20';
  assert.deepStrictEqual(contarSequencia(['2026-10-20', '2026-10-19', '2026-10-18'], hoje), { dias: 3, hoje: true, maior: 3 });
  // Ainda não estudou hoje: a sequência de ontem continua valendo.
  assert.deepStrictEqual(contarSequencia(['2026-10-19', '2026-10-18'], hoje), { dias: 2, hoje: false, maior: 2 });
  // Pulou ontem: zerou, mas a maior fica guardada.
  assert.deepStrictEqual(contarSequencia(['2026-10-17', '2026-10-16', '2026-10-15', '2026-10-14'], hoje), { dias: 0, hoje: false, maior: 4 });
  assert.deepStrictEqual(contarSequencia([], hoje), { dias: 0, hoje: false, maior: 0 });
  assert.strictEqual(contarSequencia(['2026-03-01', '2026-02-28'], '2026-03-01').dias, 2, 'virada de mês');
});

test('comunidade: níveis por XP', () => {
  assert.strictEqual(nivelDoXp(0).nivel, 1);
  assert.strictEqual(nivelDoXp(49).nivel, 1);
  assert.strictEqual(nivelDoXp(50).nivel, 2);
  assert.strictEqual(nivelDoXp(150).nivel, 3);
  assert.strictEqual(nivelDoXp(150).titulo, 'Estudante');
  const n = nivelDoXp(320);
  assert.strictEqual(n.nivel, 4);
  assert.ok(n.xp_do_nivel <= 320 && 320 < n.xp_do_proximo);
});
