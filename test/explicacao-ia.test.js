const test = require('node:test');
const assert = require('node:assert');
const ex = require('../explicacao-ia');

const questao = {
  ano: 2019, numero: 140, correta: 2,
  contexto: 'Observe o gráfico.\n\n![](https://enem.dev/g.png)\n\nQual é o valor?',
  alternativas: ['10', '20', '30', '![](https://enem.dev/alt-d.png)', '50']
};

test('explicação: monta a questão sem as imagens no texto e com o gabarito', () => {
  const p = ex.montarPergunta(questao);
  assert.match(p, /ENEM 2019, questão 140/);
  assert.match(p, /\[figura\]/);
  assert.match(p, /D\) \[figura\]/);
  assert.match(p, /Gabarito: C$/);
  assert.doesNotMatch(p, /enem\.dev/);
});

test('explicação: manda as figuras para a IA e lê a resposta', async () => {
  process.env.GEMINI_API_KEY = 'teste';
  const pedidos = [];
  const http = {
    get: async url => ({ headers: { 'content-type': 'image/png' }, data: Buffer.from('png:' + url) }),
    post: async (url, corpo, opcoes) => { pedidos.push({ url, corpo, opcoes });
      return { data: { candidates: [{ content: { parts: [{ text: 'Passo 1... **Resposta: C**' }] } }] } }; }
  };
  const texto = await ex.explicarQuestao(questao, http);
  assert.equal(texto, 'Passo 1... **Resposta: C**');
  const partes = pedidos[0].corpo.contents[0].parts;
  assert.equal(partes.filter(p => p.inline_data).length, 2); // figura do texto e da alternativa D
  assert.equal(pedidos[0].opcoes.headers['x-goog-api-key'], 'teste');
  assert.match(pedidos[0].url, /generateContent$/);
  delete process.env.GEMINI_API_KEY;
});

test('explicação: resposta vazia vira erro; desligada sem chave', async () => {
  const http = { get: async () => { throw new Error('sem rede'); }, post: async () => ({ data: { candidates: [{ finishReason: 'SAFETY' }] } }) };
  await assert.rejects(ex.explicarQuestao(questao, http), /SAFETY/);
  assert.equal(ex.ligada(), false);
});

test('por que errei: acha a linha da alternativa que o aluno marcou', () => {
  const texto = 'A questão pede a área.\n\n1. Conta...\n\nA) Somou em vez de multiplicar.\n**B)** Esqueceu de converter cm em m.\n- C: usou o raio no lugar do diâmetro.\n\n**Resposta: D**';
  assert.equal(ex.trechoDaAlternativa(texto, 0), 'Somou em vez de multiplicar.');
  assert.equal(ex.trechoDaAlternativa(texto, 1), 'Esqueceu de converter cm em m.');
  assert.equal(ex.trechoDaAlternativa(texto, 2), 'usou o raio no lugar do diâmetro.');
  assert.equal(ex.trechoDaAlternativa(texto, 4), null, 'sem linha para a letra, não inventa');
  assert.equal(ex.trechoDaAlternativa(texto, -1), null);
});
