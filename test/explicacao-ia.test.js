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

test('explicação: escolhe o flash mais novo e o flash-lite mais novo, sem prévias', () => {
  const m = (name, metodos = ['generateContent']) => ({ name: `models/${name}`, supportedGenerationMethods: metodos });
  const lista = [m('gemini-2.5-flash'), m('gemini-3.8-flash'), m('gemini-3.5-flash-lite'), m('gemini-2.5-flash-lite'),
    m('gemini-4.0-flash-preview'), m('gemini-3.8-flash-image'), m('gemini-3.8-pro'), m('gemini-9.0-flash', ['embedContent'])];
  assert.deepEqual(ex.escolherModelos(lista), ['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
  assert.deepEqual(ex.escolherModelos(undefined), []);
});

test('explicação: modelo aposentado ou sem cota passa para o próximo e guarda o motivo', async () => {
  process.env.GEMINI_API_KEY = 'teste';
  const tentados = [];
  const http = {
    get: async url => {
      if (/\/models\?/.test(url)) return { data: { models: [
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] }] } };
      throw new Error('sem figura');
    },
    post: async url => {
      const modelo = url.match(/models\/([^:]+):/)[1];
      tentados.push(modelo);
      if (modelo === 'gemini-3.8-flash') throw Object.assign(new Error('falhou'), { response: { status: 429, data: { error: { message: 'Quota exceeded' } } } });
      return { data: { candidates: [{ content: { parts: [{ text: '**Resposta: C**' }] } }] } };
    }
  };
  const r = await ex.explicarComModelo(questao, http);
  assert.deepEqual(tentados, ['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
  assert.equal(r.modelo, 'gemini-3.5-flash-lite');
  assert.equal(ex.estado.ok, true);

  const semNada = { get: http.get, post: async () => { throw Object.assign(new Error('x'), { response: { status: 404, data: { error: { message: 'model not found' } } } }); } };
  await assert.rejects(ex.explicarComModelo(questao, semNada));
  assert.equal(ex.estado.ok, false);
  assert.match(ex.estado.erro, /^404 model not found/);
  delete process.env.GEMINI_API_KEY;
});

test('trava: acha a conta que não fecha e deixa passar as certas', () => {
  assert.deepEqual(ex.contasErradas('Multiplicando: $4 \\times 3 \\times 2 \\times 2 \\times 2 =$ **972 maneiras**.'), ['4 × 3 × 2 × 2 × 2 = 972']);
  const certas = [
    '4 × 3 × 3 × 3 × 3 × 3 = 972', '10 ÷ 16 = 0,625', '0,625 - 0,1 = 0,525', '2 500 000 ÷ 6 000 = 416,7 min', '450 × 65 + 50 × 130 = 35 750',
    '2,8 × 58,5 / 23 = 7,1 g', '15 − 12 = 3 s', '1/16 − 0,01 = 0,0625 − 0,01 = 0,0525', 'h = 2 × 3 = 6', '20% × 50 = 10', '4 × 3⁵ = 972', '2^3 × 4 = 32',
    '(10 − 2) × 3 = 24', '2 × (3 + 4) = 14', '3,1 × 9 × 0,3 = 8,37 cm³', '20 000 + 300 = 20 300 L'
  ];
  for (const c of certas) assert.deepEqual(ex.contasErradas(c), [], c);
  assert.equal(ex.contasErradas('Logo, 20 000 + 300 = 20 400 L.').length, 1);
  assert.deepEqual(ex.contasErradas('(Conferindo: 40 × 75 + 30 × 100 = 6 000.) Total: 450 × 65 + 50 × 130 = 29 250 + 6 500 = 35 750. Mas 12 × 60 = 730.'), ['12 × 60 = 730']);
});

test('trava: recusa quando a IA se corrige, não chega ao gabarito ou termina na letra errada', () => {
  const q = { correta: 3 };
  assert.equal(ex.problemaNaExplicacao('1. Conta: 20 ÷ 1,15 = 17,4.\n\n**Resposta: D**', q), null);
  assert.match(ex.problemaNaExplicacao('10 ÷ 0,525 dá 19... Opa, o gabarito oficial da questão é D.\n**Resposta: D**', q), /se corrigiu/);
  assert.match(ex.problemaNaExplicacao('NAO_BATE: minha conta dá 19,0 e o gabarito é 17,4.', q), /não chegou ao gabarito/);
  assert.match(ex.problemaNaExplicacao('Tudo certo.\n**Resposta: B**', q), /não é a do gabarito/);
  assert.match(ex.problemaNaExplicacao('4 × 3 × 2 = 972.\n**Resposta: D**', q), /conta que não fecha/);
  assert.equal(ex.problemaNaExplicacao('A alternativa A) está errada porque somou.\n**Resposta: D**.', q), null);
});

test('trava: explicação recusada não é devolvida e fica anotada para a equipe', async () => {
  process.env.GEMINI_API_KEY = 'teste';
  const http = { get: async () => { throw new Error('sem lista'); },
    post: async () => ({ data: { candidates: [{ content: { parts: [{ text: '4 × 3 × 2 = 972.\n**Resposta: C**' }] } }] } }) };
  await assert.rejects(ex.explicarComModelo(questao, http), e => Boolean(e.recusada));
  assert.equal(ex.estado.recusadas[0].questao, '2019-140');
  delete process.env.GEMINI_API_KEY;
});
