// Como as questões da fonte (api.enem.dev e o repositório dela no GitHub) se
// encaixam na prova: número, idioma e o que ainda falta buscar.

function numeroDaQuestao(q) {
  if (Number.isInteger(q.index)) return q.index;
  const m = String(q.title || '').match(/quest[aã]o\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

// Língua estrangeira: questões 1 a 5 desde 2017; 91 a 95 de 2010 a 2016.
const ehDeLingua = (ano, n) => (ano >= 2017 ? n <= 5 : ano >= 2010 && n >= 91 && n <= 95);

// Anuladas pelo INEP (gabarito "X" nos microdados): não têm resposta certa e
// nenhuma fonte as tem, então não contam como faltando.
const ANULADAS = new Set(['2009:101']);
const foiAnulada = (ano, n) => ANULADAS.has(`${ano}:${n}`);

// A fonte às vezes grava uma questão de língua sem dizer o idioma (2020 Q5,
// 2012 Q94 e 2011 Q95 são de espanhol; 2015 Q95 é de inglês). Se a outra
// versão do mesmo número tem idioma, esta é a que falta; senão, decide pelo
// texto de apoio (o enunciado e as alternativas são em português).
const PALAVRAS_DA_LINGUA = {
  espanhol: /\b(el|los|las|del|una|muy|pero|hay|y|es)\b/gi,
  ingles: /\b(the|and|of|to|is|that|with|you|it|for)\b/gi
};
function linguaPeloTexto(texto) {
  const conta = l => (String(texto || '').match(PALAVRAS_DA_LINGUA[l]) || []).length;
  const es = conta('espanhol'), en = conta('ingles');
  return es === en ? null : es > en ? 'espanhol' : 'ingles';
}

function completarLinguas(questoes) {
  const rotuladas = new Set(questoes.filter(q => q.language).map(q => `${q.year}:${numeroDaQuestao(q)}:${q.language}`));
  return questoes.map(q => {
    const n = numeroDaQuestao(q);
    if (q.language || !ehDeLingua(q.year, n)) return q;
    const ingles = rotuladas.has(`${q.year}:${n}:ingles`), espanhol = rotuladas.has(`${q.year}:${n}:espanhol`);
    const language = ingles !== espanhol ? (ingles ? 'espanhol' : 'ingles') : linguaPeloTexto(q.context);
    return language ? { ...q, language } : q;
  });
}

// Pastas do GitHub ("91", "1-ingles", "1-espanhol") das questões que faltam.
// Questão de língua sem idioma fica na pasta só com o número.
function pastasQueFaltam(ano, questoes) {
  const tem = new Set(questoes.map(q => `${numeroDaQuestao(q)}${q.language ? '-' + q.language : ''}`));
  const pastas = [];
  for (let n = 1; n <= 180; n++) {
    if (!ehDeLingua(ano, n)) { if (!tem.has(String(n))) pastas.push(String(n)); continue; }
    const sem = ['ingles', 'espanhol'].filter(l => !tem.has(`${n}-${l}`));
    if (sem.length) pastas.push(...sem.map(l => `${n}-${l}`), String(n));
  }
  return pastas;
}

// Questão incompleta: a fonte perdeu o texto de apoio ou a figura. Sem
// imagem, ou o texto é só a pergunta final (menos de 220 letras), ou ele
// aponta para algo visual que não está lá ("da tabela", "no gráfico").
// O sorteio do treino, do desafio e da Arena pula essas.
const PALAVRAS_VISUAIS = 'figura|gr[aá]fico|tabela|charge|tirinha|cartum|quadrinhos?|infogr[aá]fico|imagem|imagens|fotografia|ilustra[cç][aã]o|esquema|diagrama|histograma|mapa';
const ANTES_DA_PALAVRA = 'd[aoe]s?|n[ao]s?|pel[ao]s?|conforme [ao]s?';
const REFERENCIA_VISUAL = new RegExp(`(?<![\\p{L}])(?:${ANTES_DA_PALAVRA}) (?:${PALAVRAS_VISUAIS})s?(?![\\p{L}])`, 'iu');
const MINIMO_DE_TEXTO = 220;

// Conferidas no caderno do INEP: a regra acima as pega ("percepção da imagem",
// pergunta curta), mas estão inteiras. As transcritas do INEP também.
const CONFERIDAS = require('./questoes-manuais.json').map(q => [q.ano, q.numero]).concat([
  [2009, 37], [2010, 11], [2010, 26], [2010, 128], [2010, 133], [2010, 139], [2011, 74], [2011, 152],
  [2012, 23], [2012, 125], [2012, 170], [2014, 50], [2014, 107], [2015, 86], [2017, 18], [2017, 38],
  [2017, 82], [2017, 86], [2017, 108], [2017, 128], [2018, 79], [2019, 9], [2019, 15], [2020, 54],
  [2020, 93], [2020, 151], [2021, 45], [2021, 129], [2022, 53], [2022, 130], [2023, 50], [2023, 178]
]);
const foiConferida = (ano, numero) => CONFERIDAS.some(([a, n]) => a === ano && n === numero);

function questaoIncompleta(contexto, ano, numero) {
  const texto = String(contexto || '');
  if (texto.includes('![](') || foiConferida(ano, numero)) return false;
  return texto.length < MINIMO_DE_TEXTO || REFERENCIA_VISUAL.test(texto);
}

// A mesma regra para o WHERE do banco (\y é a borda de palavra do Postgres).
// 'q.contexto' usa q.ano e q.numero para as conferidas.
const questaoCompletaSql = (coluna = 'contexto') => {
  const tabela = coluna.includes('.') ? coluna.slice(0, coluna.lastIndexOf('.') + 1) : '';
  const conferidas = CONFERIDAS.map(([a, n]) => `(${a},${n})`).join(',');
  return `(${coluna} LIKE '%![](%' OR (${tabela}ano, ${tabela}numero) IN (${conferidas})` +
    ` OR (length(${coluna}) >= ${MINIMO_DE_TEXTO} AND ${coluna} !~* '\\y(${ANTES_DA_PALAVRA}) (${PALAVRAS_VISUAIS})s?\\y'))`;
};

const semRepetir = questoes => [...new Map(questoes.map(q => [`${numeroDaQuestao(q)}|${q.language || ''}`, q])).values()];

module.exports = {
  numeroDaQuestao, ehDeLingua, foiAnulada, linguaPeloTexto, completarLinguas, pastasQueFaltam, semRepetir,
  questaoIncompleta, questaoCompletaSql
};
