const fs = require('fs');
const path = require('path');

// Arquivos ITENS_PROVA_<ano>.csv dos microdados do ENEM (INEP). Cada linha é
// uma questão dentro de um caderno: posição, gabarito e os parâmetros da TRI
// (A = discriminação, B = dificuldade, C = acerto ao acaso).
const PASTA = path.join(__dirname, 'TRI');

const SIGLA_DA_DISCIPLINA = {
  'linguagens': 'LC',
  'ciencias-humanas': 'CH',
  'ciencias-natureza': 'CN',
  'matematica': 'MT'
};
const LINGUA_DO_INEP = { '0': 'ingles', '1': 'espanhol' };
const LETRAS = 'ABCDE';

// Abaixo disso o "melhor caderno" pode ter vencido por acaso: não usamos.
const CONCORDANCIA_MINIMA = 0.7;

function numero(texto) {
  const t = String(texto || '').trim().replace(',', '.');
  return t === '' ? null : Number(t);
}

function lerArquivo(arquivo) {
  // O INEP grava em latin-1; ler como UTF-8 estragaria os acentos.
  const linhas = fs.readFileSync(arquivo).toString('latin1').split(/\r?\n/).filter(Boolean);
  const cab = linhas[0].split(';').map(c => c.trim());
  const col = nome => cab.indexOf(nome);
  const i = {
    pos: col('CO_POSICAO'), area: col('SG_AREA'), item: col('CO_ITEM'), gab: col('TX_GABARITO'),
    aban: col('IN_ITEM_ABAN'), a: col('NU_PARAM_A'), b: col('NU_PARAM_B'), c: col('NU_PARAM_C'),
    cor: col('TX_COR'), prova: col('CO_PROVA'), lingua: col('TP_LINGUA')
  };

  return linhas.slice(1).map(linha => {
    const v = linha.split(';');
    const anulado = i.aban >= 0 && v[i.aban] === '1';
    const b = anulado ? null : numero(v[i.b]);
    return {
      pos: Number(v[i.pos]),
      area: v[i.area],
      item: Number(v[i.item]),
      gab: (v[i.gab] || '').trim().toUpperCase(),
      a: b === null ? null : numero(v[i.a]),
      b,
      c: b === null ? null : numero(v[i.c]),
      cor: i.cor >= 0 ? v[i.cor] : '',
      prova: v[i.prova],
      lingua: i.lingua >= 0 ? (LINGUA_DO_INEP[(v[i.lingua] || '').trim()] || null) : null
    };
  });
}

function carregar(pasta = PASTA) {
  const porAno = new Map();
  if (!fs.existsSync(pasta)) return porAno;
  for (const nome of fs.readdirSync(pasta)) {
    const m = nome.match(/^itens_prova_(\d{4})\.csv$/i);
    if (m) porAno.set(Number(m[1]), lerArquivo(path.join(pasta, nome)));
  }
  return porAno;
}

// Cortes por área, porque cada área tem a sua própria escala: uma questão
// "média" de Matemática vale bem mais pontos que uma "média" de Linguagens.
// Nível 1 = 25% mais fáceis; 2 = até 60%; 3 = até 85%; 4 (Desafio) = 15% mais difíceis.
function calcularCortes(porAno) {
  const porArea = {};
  for (const itens of porAno.values()) {
    for (const it of itens) {
      if (it.b === null) continue;
      (porArea[it.area] = porArea[it.area] || new Map()).set(it.item, it.b);
    }
  }
  const cortes = {};
  for (const [area, mapa] of Object.entries(porArea)) {
    const bs = [...mapa.values()].sort((x, y) => x - y);
    const q = p => bs[Math.floor(p * (bs.length - 1))];
    cortes[area] = [q(0.25), q(0.60), q(0.85)];
  }
  return cortes;
}

function nivelPelaTri(cortes, disciplina, b) {
  const c = cortes[SIGLA_DA_DISCIPLINA[disciplina]];
  if (!c || b === null || b === undefined) return null;
  if (b <= c[0]) return 1;
  if (b <= c[1]) return 2;
  if (b <= c[2]) return 3;
  return 4;
}

// Cada ano do INEP numera de um jeito: em 2009 Natureza vem antes de Humanas,
// a partir de 2016 Linguagens vem primeiro, em 2017 cada área vai de 1 a 45 e
// o espanhol tem posições próprias. A api.enem.dev numera de 1 a 180 e às vezes
// põe a questão na área errada. Por isso o casamento não confia nem na
// numeração nem na área: testa cada caderno com cada deslocamento possível.
const DESLOCAMENTOS = [];
for (let blocos = -4; blocos <= 4; blocos++) {
  for (const ajuste of [-5, 0, 5]) DESLOCAMENTOS.push(blocos * 45 + ajuste);
}
const MINIMO_DE_ACERTOS = 5;

const SIGLA_PARA_DISCIPLINA = Object.fromEntries(
  Object.entries(SIGLA_DA_DISCIPLINA).map(([disc, sigla]) => [sigla, disc])
);

// Linhas do caderno que servem para a questão: se sabemos o idioma, só a
// versão dele; se não, qualquer uma.
function candidatas(posicoes, posicao, q) {
  const linhas = posicoes.get(posicao) || [];
  return q.lingua ? linhas.filter(l => !l.lingua || l.lingua === q.lingua) : linhas;
}

// O item do INEP que corresponde à questão, ou null se não dá para ter certeza.
function itemDaQuestao(posicoes, posicao, q) {
  const linhas = candidatas(posicoes, posicao, q);
  const certas = linhas.filter(l => l.gab === LETRAS[q.correta]);
  const itens = new Map(certas.map(l => [l.item, l]));
  // Duas versões (inglês e espanhol) com o mesmo gabarito: não dá para saber qual.
  if (itens.size !== 1) return null;
  const it = [...itens.values()][0];
  // Questão de idioma sem saber o idioma, num caderno em que a outra versão
  // fica em outra posição (2017): poderia ser a versão errada.
  if (!q.lingua && it.lingua && !linhas.some(l => l.lingua && l.lingua !== it.lingua)) return null;
  return it.b === null ? null : it;
}

// questoes: [{ id, ano, disciplina, numero, lingua, correta }]
// Para cada ano, escolhe repetidamente o par (caderno, deslocamento) que mais
// acerta gabaritos entre as questões ainda sem par. Num par errado a
// concordância fica perto de 20% (chute entre 5 letras); só aceitamos com
// pelo menos 70% e 5 acertos. Cada questão casada leva a área do INEP.
function casar(questoes, porAno) {
  const porAnoQ = new Map();
  for (const q of questoes) {
    if (!Number.isInteger(q.numero) || !Number.isInteger(q.correta)) continue;
    if (!porAnoQ.has(q.ano)) porAnoQ.set(q.ano, []);
    porAnoQ.get(q.ano).push(q);
  }

  const casadas = [];
  const relatorio = [];

  for (const [ano, grupo] of porAnoQ) {
    const cadernos = new Map();
    for (const it of porAno.get(Number(ano)) || []) {
      if (!cadernos.has(it.prova)) cadernos.set(it.prova, { prova: it.prova, area: it.area, cor: it.cor, posicoes: new Map() });
      const pos = cadernos.get(it.prova).posicoes;
      if (!pos.has(it.pos)) pos.set(it.pos, []);
      pos.get(it.pos).push(it);
    }

    const linha = { ano: Number(ano), questoes: grupo.length, casadas: 0, cadernos: [] };
    relatorio.push(linha);
    let pendentes = grupo.slice();

    while (pendentes.length >= MINIMO_DE_ACERTOS) {
      let melhor = null;
      for (const cad of cadernos.values()) {
        for (const desl of DESLOCAMENTOS) {
          let cobertas = 0, acertos = 0;
          for (const q of pendentes) {
            const linhas = candidatas(cad.posicoes, q.numero + desl, q);
            if (linhas.length === 0) continue;
            cobertas++;
            if (linhas.some(l => l.gab === LETRAS[q.correta])) acertos++;
          }
          if (acertos >= MINIMO_DE_ACERTOS && acertos / cobertas >= CONCORDANCIA_MINIMA &&
              (!melhor || acertos > melhor.acertos)) {
            melhor = { cad, desl, cobertas, acertos };
          }
        }
      }
      if (!melhor) break;

      const { cad, desl } = melhor;
      linha.cadernos.push(`${cad.area} ${cad.cor || '?'} (${cad.prova}) desl ${desl}: ${melhor.acertos}/${melhor.cobertas}`);
      const restantes = [];
      for (const q of pendentes) {
        // Toda questão que cai na faixa deste caderno é explicada por ele,
        // casando ou não; assim ela não sobra para um par errado depois.
        if (candidatas(cad.posicoes, q.numero + desl, q).length === 0) { restantes.push(q); continue; }
        const it = itemDaQuestao(cad.posicoes, q.numero + desl, q);
        if (!it) continue;
        casadas.push({ id: q.id, item: it.item, a: it.a, b: it.b, c: it.c, disciplina: SIGLA_PARA_DISCIPLINA[cad.area] });
        linha.casadas++;
      }
      pendentes = restantes;
    }
  }

  relatorio.sort((x, y) => x.ano - y.ano);
  return { casadas, relatorio };
}

// ================== NOTA DO ALUNO ==================
// Modelo de 3 parâmetros, o mesmo do ENEM: a chance de acertar sobe com a
// proficiência (theta), a partir do piso C (chute), com inclinação A, e
// passa da metade do caminho em theta = B. Os parâmetros do INEP já estão na
// métrica logística, então não há fator D.
function chanceDeAcertar(theta, { a, b, c }) {
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

// Estimativa EAP (média da distribuição a posteriori), como o INEP faz, com
// a mesma referência: normal(0, 1) na escala em que nota = 500 + 100 * theta.
// Com poucas questões a nota fica perto de 500 e a margem é grande; cada
// resposta puxa para cima ou para baixo conforme a dificuldade da questão.
const PASSO = 0.02;
const GRADE = Array.from({ length: Math.round(9 / PASSO) + 1 }, (_, i) => -4 + i * PASSO);
const MINIMO_PARA_NOTA = 5;

function estimarNota(respostas) {
  const logPost = GRADE.map(theta => {
    let soma = -theta * theta / 2;
    for (const r of respostas) {
      const p = Math.min(Math.max(chanceDeAcertar(theta, r), 1e-9), 1 - 1e-9);
      soma += Math.log(r.acertou ? p : 1 - p);
    }
    return soma;
  });
  const maior = Math.max(...logPost);
  const pesos = logPost.map(l => Math.exp(l - maior));
  const total = pesos.reduce((s, w) => s + w, 0);
  const media = GRADE.reduce((s, t, i) => s + t * pesos[i], 0) / total;
  const variancia = GRADE.reduce((s, t, i) => s + (t - media) ** 2 * pesos[i], 0) / total;
  return {
    nota: Math.round(500 + 100 * media),
    margem: Math.round(100 * Math.sqrt(variancia)),
    questoes: respostas.length
  };
}

// respostas: [{ disciplina, a, b, c, acertou }] -> { matematica: {...}, ... }
// usando as chaves curtas do site (linguagens, humanas, natureza, matematica).
function notasPorArea(respostas, areaDaDisciplina) {
  const grupos = {};
  for (const r of respostas) {
    const area = areaDaDisciplina[r.disciplina];
    if (area && r.b !== null && r.b !== undefined) (grupos[area] = grupos[area] || []).push(r);
  }
  const notas = {};
  for (const [area, lista] of Object.entries(grupos)) {
    notas[area] = lista.length >= MINIMO_PARA_NOTA
      ? estimarNota(lista)
      : { nota: null, questoes: lista.length, faltam: MINIMO_PARA_NOTA - lista.length };
  }
  return notas;
}

module.exports = {
  carregar, calcularCortes, nivelPelaTri, casar, SIGLA_DA_DISCIPLINA,
  chanceDeAcertar, estimarNota, notasPorArea, MINIMO_PARA_NOTA
};
