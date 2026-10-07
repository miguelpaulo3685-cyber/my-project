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
const QUESTOES_MINIMAS = 5;

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

// Linhas do caderno naquela posição que servem para a questão: se sabemos o
// idioma, só a versão dele; se não, qualquer uma.
function candidatas(caderno, q) {
  const linhas = caderno.get(q.numero) || [];
  return q.lingua ? linhas.filter(l => !l.lingua || l.lingua === q.lingua) : linhas;
}

function bate(caderno, q) {
  return candidatas(caderno, q).some(l => l.gab === LETRAS[q.correta]);
}

// questoes: [{ id, ano, disciplina, numero, lingua, correta }]
// A numeração das nossas questões segue um dos cadernos do INEP, mas não
// sabemos qual (muda a cor, a aplicação, o idioma). Para cada ano e área,
// testamos todos os cadernos e ficamos com o que mais concorda nos gabaritos.
// Num caderno errado a concordância fica perto de 20% (chute entre 5 letras).
function casar(questoes, porAno) {
  const grupos = new Map();
  for (const q of questoes) {
    const area = SIGLA_DA_DISCIPLINA[q.disciplina];
    if (!area || !Number.isInteger(q.numero) || !Number.isInteger(q.correta)) continue;
    const chave = `${q.ano}|${area}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(q);
  }

  const casadas = [];
  const relatorio = [];

  for (const [chave, grupo] of grupos) {
    const [ano, area] = chave.split('|');
    const cadernos = new Map();
    for (const it of porAno.get(Number(ano)) || []) {
      if (it.area !== area) continue;
      if (!cadernos.has(it.prova)) cadernos.set(it.prova, { cor: it.cor, posicoes: new Map() });
      const pos = cadernos.get(it.prova).posicoes;
      if (!pos.has(it.pos)) pos.set(it.pos, []);
      pos.get(it.pos).push(it);
    }

    let melhor = null;
    for (const [prova, cad] of cadernos) {
      const acertos = grupo.filter(q => bate(cad.posicoes, q)).length;
      if (!melhor || acertos > melhor.acertos) melhor = { prova, cor: cad.cor, posicoes: cad.posicoes, acertos };
    }

    const linha = {
      ano: Number(ano), area, questoes: grupo.length, casadas: 0,
      caderno: melhor ? `${melhor.cor || '?'} (${melhor.prova})` : 'nenhum',
      concordancia: melhor ? Math.round(100 * melhor.acertos / grupo.length) : 0
    };
    relatorio.push(linha);

    if (!melhor || grupo.length < QUESTOES_MINIMAS || melhor.acertos / grupo.length < CONCORDANCIA_MINIMA) continue;

    for (const q of grupo) {
      const certas = candidatas(melhor.posicoes, q).filter(l => l.gab === LETRAS[q.correta]);
      const itens = new Map(certas.map(l => [l.item, l]));
      // Duas versões (inglês e espanhol) com o mesmo gabarito e sem saber o
      // idioma: não dá para dizer qual é. Melhor sem nível do que com o errado.
      if (itens.size !== 1) continue;
      const it = [...itens.values()][0];
      if (it.b === null) continue;
      casadas.push({ id: q.id, item: it.item, a: it.a, b: it.b, c: it.c });
      linha.casadas++;
    }
  }

  relatorio.sort((x, y) => x.ano - y.ano || x.area.localeCompare(y.area));
  return { casadas, relatorio };
}

module.exports = { carregar, calcularCortes, nivelPelaTri, casar, SIGLA_DA_DISCIPLINA };
