const test = require('node:test');
const assert = require('node:assert');
const n = require('../noticias-redacao');
const { EIXOS } = require('../estatisticas-redacao');

test('notícias: classifica o título pelo eixo, sem acento e por palavra inteira', () => {
  assert.equal(n.classificar('Ministério amplia vacinação contra a dengue no SUS'), 'saude');
  assert.equal(n.classificar('Desmatamento na Amazônia cai pelo terceiro mês'), 'ambiente');
  assert.equal(n.classificar('Enem 2026: entenda como funciona a Teoria da Resposta ao Item'), 'educacao');
  assert.equal(n.classificar('Governo discute regras para inteligência artificial'), 'tecnologia');
  assert.equal(n.classificar('Dólar cai e fecha a R$ 5,56'), null, 'sem palavra-chave, não classifica');
  assert.equal(n.classificar('Copa do Mundo começa amanhã'), null, '"cop" não casa dentro de "copa"');
});

test('notícias: lê o feed e só aceita links da Agência Brasil', () => {
  const xml = `<rss><channel><title>Feed</title>
    <item><title>Vacina &amp; saúde</title><link>https://agenciabrasil.ebc.com.br/saude/noticia/x</link><pubDate>Wed, 11 Nov 2026 19:00:00 -0300</pubDate></item>
    <item><title>Outro site</title><link>https://exemplo.com/x</link></item></channel></rss>`;
  const itens = n.lerFeed(xml);
  assert.equal(itens.length, 1);
  assert.equal(itens[0].titulo, 'Vacina & saúde');
  assert.equal(itens[0].data.toISOString(), '2026-11-11T22:00:00.000Z');
});

test('notícias: o resumo só aparece com notícias suficientes e soma perto de 100%', () => {
  assert.equal(n.resumir([{ eixo: 'saude', n: 5, titulo: 't', link: 'l' }], EIXOS), null);
  const r = n.resumir([{ eixo: 'saude', n: 30, titulo: 'a', link: 'la' }, { eixo: 'ambiente', n: 10, titulo: 'b', link: 'lb' }], EIXOS);
  assert.equal(r.total, 40);
  assert.equal(r.eixos.length, 8);
  assert.equal(r.eixos.find(e => e.eixo === 'saude').parte, 75);
  assert.equal(r.eixos.find(e => e.eixo === 'educacao').exemplo, null);
});
