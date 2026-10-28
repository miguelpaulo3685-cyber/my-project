const test = require('node:test');
const assert = require('node:assert');
const a = require('../arena');

const questao = (disciplina, nivel, tamanho = 300) => ({ disciplina, nivel, contexto: 'x'.repeat(tamanho), alternativas: ['a', 'b', 'c', 'd', 'e'] });

test('tempo: Matemática ganha mais que Linguagens, e o nível pesa', () => {
  const mat = a.tempoDaQuestao(questao('matematica', 1));
  const lin = a.tempoDaQuestao(questao('linguagens', 1));
  assert.ok(mat >= 60 && mat > lin, `${mat} x ${lin}`);
  assert.ok(a.tempoDaQuestao(questao('matematica', 3)) > mat);
  assert.strictEqual(a.tempoDaQuestao(questao('matematica', 1)) % 5, 0);
});

test('tempo: ritmo e limites de 20 s a 3 min', () => {
  const q = questao('ciencias-natureza', 2);
  assert.ok(a.tempoDaQuestao(q, 'tranquilo') > a.tempoDaQuestao(q) && a.tempoDaQuestao(q) > a.tempoDaQuestao(q, 'relampago'));
  assert.strictEqual(a.tempoDaQuestao(questao('matematica', 4, 20000), 'tranquilo'), 180);
  assert.strictEqual(a.tempoDaQuestao(questao('linguagens', 1, 0), 'relampago'), 20);
});

test('leitura antes das alternativas fica entre 5 e 15 s', () => {
  assert.strictEqual(a.tempoDeLeitura(''), 5);
  assert.strictEqual(a.tempoDeLeitura('x'.repeat(5000)), 15);
});

test('pontos: acertar devagar vale mais que nada, e rapidez e sequência somam', () => {
  assert.strictEqual(a.pontosDoAcerto(60, 60, 1), 600);
  assert.strictEqual(a.pontosDoAcerto(0, 60, 1), 1000);
  assert.strictEqual(a.pontosDoAcerto(60, 60, 3), 800);
  assert.strictEqual(a.pontosDoAcerto(60, 60, 50), 1100); // bônus de sequência para em 500
});

test('XP: participação, acertos, pódio e limite do dia', () => {
  assert.strictEqual(a.xpDaPartida({ respondeu: false, acertos: 0, posicao: 1, jogadores: 5 }, 0), 0);
  assert.strictEqual(a.xpDaPartida({ respondeu: true, acertos: 2, posicao: 4, jogadores: 5 }, 0), 16);
  assert.strictEqual(a.xpDaPartida({ respondeu: true, acertos: 2, posicao: 1, jogadores: 5 }, 0), 36);
  assert.strictEqual(a.xpDaPartida({ respondeu: true, acertos: 2, posicao: 1, jogadores: 5 }, 70), 10);
  assert.strictEqual(a.xpDaPartida({ respondeu: true, acertos: 2, posicao: 1, jogadores: 5 }, 80), 0);
});

test('baú: prefere o emblema que a pessoa ainda não tem', () => {
  const comuns = a.ITENS.filter(i => i.raridade === 'comum');
  const tem = new Set(comuns.slice(1).map(i => i.id));
  for (let i = 0; i < 20; i++) assert.strictEqual(a.sortearItem(tem, () => 0.1).id, comuns[0].id);
  assert.strictEqual(a.sortearItem(new Set(), () => 0.99).raridade, 'epico');
});

const jogador = (id, nome, acertos, posicao, posicaoInicial) => ({
  id, nome, posicao, posicaoInicial, pontos: acertos * 800, acertos, melhorSequencia: acertos,
  respostas: [{ acertou: acertos > 0, segundos: 10 + id }, { acertou: acertos > 1, segundos: 5 }]
});

test('destaques: invicto, jogada da partida e virada', () => {
  const lista = [jogador(1, 'Ana', 2, 1, 4), jogador(2, 'Bia', 1, 2, 1), jogador(3, 'Caio', 0, 3, 2), jogador(4, 'Duda', 0, 4, 3)];
  const d = a.destaquesDaPartida(lista, [{}, {}]);
  assert.ok(d.some(x => x.tipo === 'invicto' && x.usuario_id === 1));
  assert.ok(d.some(x => x.tipo === 'jogada' && x.usuario_id === 1 && /questão 2/.test(x.texto)));
  assert.ok(d.some(x => x.tipo === 'virada' && x.usuario_id === 1 && /3 posições/.test(x.texto)));
});

test('vitórias pessoais: todo mundo sai com alguma coisa', () => {
  const novato = a.vitoriasPessoais(jogador(3, 'Caio', 0, 3, 3), { anterior: { partidas: 0 }, total: 2, jogadores: 3 });
  assert.ok(novato.length >= 1);
  const recorde = a.vitoriasPessoais(jogador(2, 'Bia', 1, 2, 2), { anterior: { partidas: 4, vitorias: 0, recorde_pontos: 100, recorde_sequencia: 3 }, total: 2, jogadores: 3 });
  assert.ok(recorde.some(v => /recorde de pontos/.test(v)));
  const campea = a.vitoriasPessoais(jogador(1, 'Ana', 2, 1, 1), { anterior: { partidas: 4, vitorias: 2, recorde_pontos: 9999, recorde_sequencia: 9 }, total: 2, jogadores: 3 });
  assert.ok(campea.some(v => /3ª vitória/.test(v)) && campea.some(v => /Gabaritou/.test(v)));
  const zero = a.vitoriasPessoais(jogador(4, 'Duda', 0, 4, 4), { anterior: { partidas: 2, vitorias: 0, recorde_pontos: 500, recorde_sequencia: 1 }, total: 2, jogadores: 4 });
  assert.strictEqual(zero.length, 1);
});

test('arena: empate em pontos vai para quem acertou mais e, depois, para quem foi mais rápido nos acertos', () => {
  const j = (pontos, respostas, entrou) => ({ pontos, respostas, entrou });
  const certa = segundos => ({ acertou: true, segundos }), errada = segundos => ({ acertou: false, segundos });
  const maisAcertos = j(1000, [certa(9), certa(9)], 2), menosAcertos = j(1000, [certa(1), errada(1)], 1);
  assert.ok(a.compararJogadores(maisAcertos, menosAcertos) < 0);
  const rapido = j(1000, [certa(4), certa(5)], 2), lento = j(1000, [certa(8), certa(9)], 1);
  assert.ok(a.compararJogadores(rapido, lento) < 0);
  assert.ok(a.compararJogadores(j(1000, [], 1), j(1000, [], 2)) < 0, 'tudo igual: quem entrou primeiro');
  assert.ok(a.compararJogadores(j(900, [certa(1)], 1), j(1000, [certa(9)], 2)) > 0, 'pontos vêm antes de tudo');
});
