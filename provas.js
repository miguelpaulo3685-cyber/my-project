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

const semRepetir = questoes => [...new Map(questoes.map(q => [`${numeroDaQuestao(q)}|${q.language || ''}`, q])).values()];

module.exports = { numeroDaQuestao, ehDeLingua, foiAnulada, linguaPeloTexto, completarLinguas, pastasQueFaltam, semRepetir };
