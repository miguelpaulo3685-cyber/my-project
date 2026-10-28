// Arena: questões do ENEM ao vivo, todo mundo respondendo ao mesmo tempo.
//
// As salas ficam na memória do servidor (o Render roda um processo só) e
// cada celular recebe o estado da sala por um fluxo de eventos (SSE). No fim
// da partida grava o resultado: as respostas contam no progresso de verdade
// (estatísticas, TRI, dias seguidos), dá XP com limite diário, abre um baú
// com um emblema, e as questões erradas voltam dias depois.
//
// Todo dia às 19h30 (Brasília) abre a Arena da noite, aberta a todos.

const crypto = require('crypto');
const tri = require('./tri');
const imagens = require('./imagens');
const { registrarAtividade, hojeEmBrasilia } = require('./comunidade');
const { questaoCompletaSql } = require('./provas');

// ---------- regras ----------
const AREAS = {
  linguagens: { nome: 'Linguagens', minimo: 30 },
  'ciencias-humanas': { nome: 'Humanas', minimo: 30 },
  'ciencias-natureza': { nome: 'Natureza', minimo: 40 },
  matematica: { nome: 'Matemática', minimo: 60 }
};
const NIVEIS_DA_SALA = { aquecimento: [1], normal: [1, 2], desafio: [2, 3, 4] };
const PESO_DO_NIVEL = { 1: 1, 2: 1.25, 3: 1.5, 4: 1.75 };
const RITMOS = { tranquilo: 1.5, normal: 1, relampago: 0.6 };
const QUANTIDADES = [5, 10, 15];
const MAX_JOGADORES = 60;

const DURACAO = { resultado: 4500, placar: 6000 };
const XP_ARENA = { participar: 10, acerto: 3, podio: [20, 12, 6], limite_dia: 80 };
const BAUS_POR_DIA = 3;
const REVANCHE_DIAS = 2;

// Tempo para responder: o mínimo da área (Matemática precisa de conta), o
// tempo de ler o texto e as alternativas, o peso do nível e o ritmo da sala.
// Fica entre 20 s e 3 min, em múltiplos de 5.
function tempoDaQuestao({ disciplina, contexto, alternativas, nivel }, ritmo = 'normal') {
  const area = AREAS[disciplina] || { minimo: 40 };
  const leitura = (String(contexto || '').length + (alternativas || []).join('').length) / 40;
  const s = (area.minimo + leitura) * (PESO_DO_NIVEL[nivel] || 1.25) * (RITMOS[ritmo] || 1);
  return Math.min(180, Math.max(20, Math.round(s / 5) * 5));
}

// Leitura antes de liberar as alternativas: ninguém sai na frente só por ler rápido.
const tempoDeLeitura = contexto => Math.min(15, Math.max(5, Math.round(String(contexto || '').length / 30)));

// Acertar vale mais que ser rápido: 600 garantidos e até 400 pela rapidez,
// mais 100 por acerto seguido a partir do segundo (até 500).
function pontosDoAcerto(segundos, tempo, seguidas) {
  const rapidez = Math.max(0, 1 - segundos / tempo);
  return Math.round(600 + 400 * rapidez) + Math.min(500, 100 * Math.max(0, seguidas - 1));
}

function xpDaPartida({ respondeu, acertos, posicao, jogadores }, xpHoje) {
  if (!respondeu) return 0;
  let xp = XP_ARENA.participar + XP_ARENA.acerto * acertos;
  if (jogadores >= 3 && posicao <= 3) xp += XP_ARENA.podio[posicao - 1];
  else if (jogadores === 2 && posicao === 1) xp += XP_ARENA.podio[2];
  return Math.max(0, Math.min(xp, XP_ARENA.limite_dia - xpHoje));
}

// Emblemas do baú: só visuais, nada que se compre ou valha alguma coisa.
const ITENS = [
  ['caderno', '📘', 'Caderno', 'comum'], ['lapis', '✏️', 'Lápis', 'comum'], ['tubo', '🧪', 'Tubo de ensaio', 'comum'],
  ['esquadro', '📐', 'Esquadro', 'comum'], ['globo', '🌎', 'Globo', 'comum'], ['livros', '📚', 'Pilha de livros', 'comum'],
  ['cerebro', '🧠', 'Cérebro', 'comum'], ['cafe', '☕', 'Café', 'comum'], ['fone', '🎧', 'Fone', 'comum'], ['vela', '🕯️', 'Vela da madrugada', 'comum'],
  ['coruja', '🦉', 'Coruja', 'raro'], ['foguete', '🚀', 'Foguete', 'raro'], ['raio', '⚡', 'Raio', 'raro'],
  ['telescopio', '🔭', 'Telescópio', 'raro'], ['dna', '🧬', 'DNA', 'raro'], ['alvo', '🎯', 'Alvo', 'raro'],
  ['coroa', '👑', 'Coroa', 'epico'], ['dragao', '🐉', 'Dragão', 'epico'], ['galaxia', '🌌', 'Galáxia', 'epico'], ['diamante', '💎', 'Diamante', 'epico'],
  // Só por convite (crescimento.js): nunca saem do baú.
  ['convite', '🤝', 'Chamou um amigo', 'convite'], ['turma', '📣', 'Trouxe a turma', 'convite']
].map(([id, emoji, nome, raridade]) => ({ id, emoji, nome, raridade }));
const ITEM_POR_ID = new Map(ITENS.map(i => [i.id, i]));
const PESO_RARIDADE = { comum: 70, raro: 25, epico: 5 };

// Sorteia a raridade pelo peso e, dentro dela, prefere o que a pessoa ainda não tem.
function sortearItem(tem = new Set(), aleatorio = Math.random) {
  let r = aleatorio() * 100, raridade = 'comum';
  for (const [nome, peso] of Object.entries(PESO_RARIDADE)) { if (r < peso) { raridade = nome; break; } r -= peso; }
  const da = ITENS.filter(i => i.raridade === raridade);
  const novos = da.filter(i => !tem.has(i.id));
  const lista = novos.length ? novos : da;
  return lista[Math.floor(aleatorio() * lista.length)];
}

// Destaques da partida: o que vale contar para a sala inteira.
function destaquesDaPartida(jogadores, rodadas) {
  const d = [];
  const invictos = jogadores.filter(j => rodadas.length && j.acertos === rodadas.length);
  for (const j of invictos) d.push({ tipo: 'invicto', usuario_id: j.id, texto: `${j.nome} acertou todas` });
  // Jogada da partida: o acerto mais rápido na questão em que a sala mais errou.
  let jogada = null;
  rodadas.forEach((r, i) => {
    const certos = jogadores.filter(j => j.respostas[i] && j.respostas[i].acertou);
    if (!certos.length) return;
    const taxa = certos.length / jogadores.length;
    const rapido = certos.reduce((a, b) => (b.respostas[i].segundos < a.respostas[i].segundos ? b : a));
    if (!jogada || taxa < jogada.taxa || (taxa === jogada.taxa && rapido.respostas[i].segundos < jogada.segundos)) {
      jogada = { taxa, segundos: rapido.respostas[i].segundos, usuario_id: rapido.id, nome: rapido.nome, rodada: i };
    }
  });
  if (jogada && jogada.taxa < 1) {
    d.push({ tipo: 'jogada', usuario_id: jogada.usuario_id,
      texto: `Jogada da partida: ${jogada.nome} acertou a questão ${jogada.rodada + 1} em ${Math.max(1, Math.round(jogada.segundos))} s, quando só ${Math.round(jogada.taxa * 100)}% da sala acertou` });
  }
  // Virada: quem mais subiu entre a primeira rodada e o fim.
  const virada = jogadores.filter(j => j.posicaoInicial).map(j => ({ j, subiu: j.posicaoInicial - j.posicao }))
    .sort((a, b) => b.subiu - a.subiu)[0];
  if (virada && virada.subiu >= 2) d.push({ tipo: 'virada', usuario_id: virada.j.id, texto: `Virada: ${virada.j.nome} subiu ${virada.subiu} posições` });
  return d;
}

// Vitórias pessoais: todo mundo sai com alguma coisa, não só o pódio.
function vitoriasPessoais(j, { anterior, total, jogadores }) {
  const v = [];
  if (j.posicao === 1 && jogadores >= 2) v.push(anterior.vitorias ? `${anterior.vitorias + 1}ª vitória na Arena 🏆` : 'Sua primeira vitória na Arena! 🏆');
  if (total && j.acertos === total) v.push('Gabaritou a partida! 💯');
  if (anterior.partidas === 0) v.push('Primeira partida na Arena 🎉');
  else {
    if (j.pontos > anterior.recorde_pontos) v.push(`Novo recorde de pontos: ${j.pontos} ⚡`);
    if (j.melhorSequencia >= 2 && j.melhorSequencia > anterior.recorde_sequencia) v.push(`Novo recorde: ${j.melhorSequencia} acertos seguidos 🔥`);
  }
  if (j.posicaoInicial && j.posicaoInicial - j.posicao >= 2) v.push(`Subiu ${j.posicaoInicial - j.posicao} posições até o fim 📈`);
  if (!v.length && j.acertos > 0) v.push(`${j.acertos} ${j.acertos === 1 ? 'acerto' : 'acertos'} e ${j.respostas.filter(Boolean).length} questões treinadas`);
  if (!v.length) v.push('Cada partida é treino. A próxima é sua! 💪');
  return v;
}

// Sorteia as questões da sala: sem língua estrangeira, sem figura (difícil
// de ler no celular), sem as incompletas da fonte, com nível da TRI e, se forem todas as áreas, uma de cada vez.
async function sortearQuestoes(pool, cortes, { nivel, area, quantidade }) {
  const niveis = NIVEIS_DA_SALA[nivel] || NIVEIS_DA_SALA.normal;
  const { rows } = await pool.query(
    `SELECT id, disciplina, ano, contexto, alternativas, correta, tri_b FROM questoes
      WHERE lingua IS NULL AND tri_b IS NOT NULL AND ($1::text IS NULL OR disciplina = $1)
        AND contexto NOT LIKE '%![](%' AND alternativas::text NOT LIKE '%![](%' AND length(contexto) < 1300
        AND ${questaoCompletaSql()}
      ORDER BY RANDOM() LIMIT 600`, [area || null]);
  const comNivel = rows.map(q => ({ ...q, nivel: tri.nivelPelaTri(cortes, q.disciplina, q.tri_b) }));
  let boas = comNivel.filter(q => niveis.includes(q.nivel));
  if (boas.length < quantidade) boas = boas.concat(comNivel.filter(q => !boas.includes(q)).sort((a, b) => a.tri_b - b.tri_b));
  if (area) return boas.slice(0, quantidade);
  const porArea = Object.keys(AREAS).map(a => boas.filter(q => q.disciplina === a));
  const escolhidas = [];
  for (let i = 0; escolhidas.length < quantidade && porArea.some(l => l.length); i++) {
    const lista = porArea[i % porArea.length];
    if (lista.length) escolhidas.push(lista.shift());
  }
  return escolhidas;
}

// ---------- salas na memória ----------
const salas = new Map(); // codigo -> sala

function novoCodigo() {
  for (;;) {
    const c = String(crypto.randomInt(100000, 1000000));
    if (!salas.has(c)) return c;
  }
}

const enviar = (res, dados) => { try { res.write(`data: ${JSON.stringify(dados)}\n\n`); } catch (e) { /* conexão caiu */ } };
const conectados = sala => [...sala.jogadores.values()].filter(j => j.conexoes.size > 0);
// Desempate: mais acertos; depois menos tempo somado nas questões que acertou;
// por último, quem entrou primeiro na sala.
const acertosDe = j => Object.values(j.respostas).filter(r => r.acertou).length;
const tempoDosAcertos = j => Object.values(j.respostas).reduce((t, r) => t + (r.acertou ? r.segundos : 0), 0);
const compararJogadores = (a, b) => b.pontos - a.pontos || acertosDe(b) - acertosDe(a)
  || tempoDosAcertos(a) - tempoDosAcertos(b) || a.entrou - b.entrou;
const ordenar = sala => [...sala.jogadores.values()].sort(compararJogadores);

function questaoPublica(sala, comGabarito) {
  const q = sala.questoes[sala.rodada];
  if (!q) return null;
  return {
    id: q.id, ano: q.ano, disciplina: q.disciplina, area: (AREAS[q.disciplina] || {}).nome, nivel: q.nivel,
    contexto: q.contexto, alternativas: q.alternativas, tempo: q.tempo, ...(comGabarito ? { correta: q.correta } : {})
  };
}

function estadoPara(sala, usuarioId) {
  const eu = sala.jogadores.get(usuarioId);
  const r = sala.rodada;
  const mostrarGabarito = ['resultado', 'placar'].includes(sala.estado);
  const lista = ordenar(sala).map((j, i) => ({
    id: j.id, nome: j.nome, emblema: j.emblema, pontos: j.pontos, seguidas: j.seguidas, eu: j.id === usuarioId,
    ausente: j.conexoes.size === 0, posicao: i + 1,
    subiu: mostrarGabarito && j.posicaoAnterior ? j.posicaoAnterior - (i + 1) : 0,
    respondeu: sala.estado === 'resposta' ? Boolean(j.respostas[r]) : undefined,
    ganhou: mostrarGabarito && j.respostas[r] ? j.respostas[r].ganhou : undefined
  }));
  const estado = {
    codigo: sala.codigo, publica: sala.publica, titulo: sala.titulo, criador: sala.criadorId === usuarioId,
    criador_nome: sala.criadorNome, criador_joga: sala.criadorJoga,
    config: sala.config, estado: sala.estado, rodada: r, total: sala.questoes.length || sala.config.quantidade,
    fim_da_fase: sala.fimDaFase, agora: Date.now(), comeca_em: sala.comecaEm || null,
    jogadores: lista, jogando: Boolean(eu)
  };
  if (['leitura', 'resposta', 'resultado', 'placar'].includes(sala.estado)) {
    estado.questao = questaoPublica(sala, mostrarGabarito);
    if (sala.estado === 'leitura') delete estado.questao.alternativas;
    if (eu && eu.respostas[r]) estado.minha = { alternativa: eu.respostas[r].alternativa, ...(mostrarGabarito ? { acertou: eu.respostas[r].acertou, ganhou: eu.respostas[r].ganhou } : {}) };
    if (mostrarGabarito) {
      const votos = [0, 0, 0, 0, 0];
      for (const j of sala.jogadores.values()) if (j.respostas[r]) votos[j.respostas[r].alternativa]++;
      estado.votos = votos;
    }
  }
  if (sala.estado === 'fim' && sala.final) {
    estado.final = { podio: sala.final.podio, destaques: sala.final.destaques, meu: sala.final.porJogador.get(usuarioId) || null };
  }
  return estado;
}

function transmitir(sala) {
  for (const j of sala.jogadores.values()) for (const res of j.conexoes) enviar(res, estadoPara(sala, j.id));
  for (const [id, conexoes] of sala.espectadores) for (const res of conexoes) enviar(res, estadoPara(sala, id));
  sala.ultimaAtividade = Date.now();
}

function mudarFase(sala, estado, duracao, depois) {
  clearTimeout(sala.relogio);
  sala.estado = estado;
  sala.fimDaFase = duracao ? Date.now() + duracao : null;
  if (duracao) sala.relogio = setTimeout(depois, duracao);
  transmitir(sala);
}

function registrarArena(app, { pool, auth, limitar, exigirLogin, cortes, enviarPush }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioCriar = limitar(auth.criarFreio(12, 60 * 60 * 1000), 'Muitas salas criadas. Espere um pouco.', porConta);
  const freioEntrar = limitar(auth.criarFreio(40, 60 * 1000), 'Calma! Muitas tentativas de entrar.', porConta);

  async function jogadorDe(usuario) {
    const { rows } = await pool.query('SELECT emblema FROM usuarios WHERE id = $1', [usuario.id]);
    const item = ITEM_POR_ID.get(rows[0]?.emblema);
    return {
      id: usuario.id, nome: usuario.username, emblema: item ? item.emoji : null, entrou: Date.now(),
      pontos: 0, seguidas: 0, melhorSequencia: 0, acertos: 0, respostas: [], conexoes: new Set(),
      posicaoAnterior: null, posicaoInicial: null
    };
  }

  function criarSala({ criador, publica = false, titulo = null, config, criadorJoga = true }) {
    const sala = {
      codigo: novoCodigo(), publica, titulo, criadorId: criador ? criador.id : null, criadorNome: criador ? criador.username : 'M&M Estudos',
      criadorJoga, config, estado: 'espera', rodada: -1, questoes: [], jogadores: new Map(), espectadores: new Map(),
      removidos: new Set(), fimDaFase: null, relogio: null, criada: Date.now(), ultimaAtividade: Date.now(), final: null
    };
    salas.set(sala.codigo, sala);
    return sala;
  }

  async function comecar(sala) {
    if (sala.estado !== 'espera' && sala.estado !== 'fim') return;
    const sorteadas = await sortearQuestoes(pool, cortes, { nivel: sala.config.nivel, area: sala.config.area, quantidade: sala.config.quantidade });
    if (!sorteadas.length) throw new Error('sem questões');
    sala.questoes = sorteadas.map(q => ({ ...q, tempo: tempoDaQuestao(q, sala.config.ritmo), leitura: tempoDeLeitura(q.contexto) }));
    sala.final = null;
    for (const j of sala.jogadores.values()) Object.assign(j, { pontos: 0, seguidas: 0, melhorSequencia: 0, acertos: 0, respostas: [], posicaoAnterior: null, posicaoInicial: null });
    sala.rodada = -1;
    proximaRodada(sala);
  }

  function proximaRodada(sala) {
    sala.rodada++;
    if (sala.rodada >= sala.questoes.length) return encerrar(sala).catch(erro => console.error('Erro ao encerrar Arena:', erro.message));
    ordenar(sala).forEach((j, i) => { j.posicaoAnterior = i + 1; });
    const q = sala.questoes[sala.rodada];
    mudarFase(sala, 'leitura', q.leitura * 1000, () => {
      sala.inicioResposta = Date.now();
      mudarFase(sala, 'resposta', q.tempo * 1000, () => fecharRodada(sala));
    });
  }

  function fecharRodada(sala) {
    if (sala.estado !== 'resposta') return;
    const q = sala.questoes[sala.rodada];
    for (const j of sala.jogadores.values()) {
      const r = j.respostas[sala.rodada];
      if (r && r.acertou) {
        j.seguidas++; j.acertos++;
        j.melhorSequencia = Math.max(j.melhorSequencia, j.seguidas);
        r.ganhou = pontosDoAcerto(r.segundos, q.tempo, j.seguidas);
        j.pontos += r.ganhou;
      } else {
        j.seguidas = 0;
        if (r) r.ganhou = 0;
      }
    }
    if (sala.rodada === 0) ordenar(sala).forEach((j, i) => { j.posicaoInicial = i + 1; });
    mudarFase(sala, 'resultado', DURACAO.resultado, () =>
      mudarFase(sala, 'placar', DURACAO.placar, () => proximaRodada(sala)));
  }

  // Grava tudo e monta o fim de cada jogador. Um erro aqui não pode travar a sala.
  async function encerrar(sala) {
    clearTimeout(sala.relogio);
    const lista = ordenar(sala);
    lista.forEach((j, i) => { j.posicao = i + 1; });
    const total = sala.questoes.length;
    const porJogador = new Map();
    const destaques = destaquesDaPartida(lista, sala.questoes);
    const podio = lista.slice(0, 3).map(j => ({ id: j.id, nome: j.nome, emblema: j.emblema, pontos: j.pontos, posicao: j.posicao }));
    try {
      const jogaram = lista.filter(j => j.respostas.some(Boolean));
      const partida = (await pool.query(
        `INSERT INTO arena_partidas (codigo, criador_id, publica, nivel, ritmo, area, jogadores, questoes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [sala.codigo, sala.criadorId, sala.publica, sala.config.nivel, sala.config.ritmo, sala.config.area, jogaram.length, total])).rows[0].id;
      for (const j of lista) {
        const respondeu = j.respostas.some(Boolean);
        const anterior = (await pool.query(
          `SELECT COUNT(*)::int AS partidas, COUNT(*) FILTER (WHERE posicao = 1 AND (SELECT jogadores FROM arena_partidas p WHERE p.id = partida_id) >= 2)::int AS vitorias,
                  COALESCE(MAX(pontos), 0)::int AS recorde_pontos, COALESCE(MAX(melhor_sequencia), 0)::int AS recorde_sequencia,
                  COALESCE(SUM(xp) FILTER (WHERE created_at >= date_trunc('day', NOW() - INTERVAL '3 hours') + INTERVAL '3 hours'), 0)::int AS xp_hoje
             FROM arena_resultados WHERE usuario_id = $1`, [j.id])).rows[0];
        const meu = { posicao: j.posicao, pontos: j.pontos, acertos: j.acertos, total, xp: 0, vitorias: [], bau: null, erradas: [] };
        if (respondeu) {
          meu.xp = xpDaPartida({ respondeu, acertos: j.acertos, posicao: j.posicao, jogadores: jogaram.length }, anterior.xp_hoje);
          meu.xp_limite = anterior.xp_hoje + meu.xp >= XP_ARENA.limite_dia;
          meu.vitorias = vitoriasPessoais(j, { anterior, total, jogadores: jogaram.length });
          await pool.query(
            `INSERT INTO arena_resultados (partida_id, usuario_id, posicao, pontos, acertos, total, melhor_sequencia, xp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
            [partida, j.id, j.posicao, j.pontos, j.acertos, total, j.melhorSequencia, meu.xp]);
          // As respostas contam no progresso, na TRI e nos dias seguidos, como no treino.
          for (let i = 0; i < total; i++) {
            const r = j.respostas[i];
            if (!r) continue;
            await pool.query('INSERT INTO respostas (questao_id, usuario_id, acertou, segundos) VALUES ($1, $2, $3, $4)',
              [sala.questoes[i].id, j.id, r.acertou, Math.round(r.segundos)]);
            if (!r.acertou) {
              meu.erradas.push({ id: sala.questoes[i].id, ano: sala.questoes[i].ano, area: (AREAS[sala.questoes[i].disciplina] || {}).nome, correta: sala.questoes[i].correta });
              await pool.query(
                `INSERT INTO arena_revanche (usuario_id, questao_id, volta_em) VALUES ($1, $2, NOW() + INTERVAL '${REVANCHE_DIAS} days')
                 ON CONFLICT (usuario_id, questao_id) DO UPDATE SET volta_em = EXCLUDED.volta_em, feito = FALSE`, [j.id, sala.questoes[i].id]);
            }
          }
          if (jogaram.length >= 2) meu.bau = await abrirBau(j.id);
        }
        porJogador.set(j.id, meu);
      }
      const vencedor = lista[0];
      if (jogaram.length >= 2 && vencedor && vencedor.respostas.some(Boolean)) {
        await registrarAtividade(pool, { usuarioId: vencedor.id, tipo: 'arena', texto: sala.publica ? 'a Arena da noite' : null, alvoId: jogaram.length });
      }
    } catch (erro) {
      console.error('Erro ao gravar a partida da Arena:', erro.message);
    }
    sala.final = { podio, destaques, porJogador };
    mudarFase(sala, 'fim', null);
  }

  // Um baú por partida, até 3 por dia (com 2 jogadores ou mais).
  async function abrirBau(usuarioId) {
    const hoje = (await pool.query(
      `SELECT COUNT(*)::int AS n FROM arena_baus WHERE usuario_id = $1 AND created_at >= date_trunc('day', NOW() - INTERVAL '3 hours') + INTERVAL '3 hours'`,
      [usuarioId])).rows[0].n;
    if (hoje >= BAUS_POR_DIA) return { fechado: true, motivo: `Você já abriu os ${BAUS_POR_DIA} baús de hoje. Amanhã tem mais!` };
    const tem = new Set((await pool.query('SELECT item FROM arena_itens WHERE usuario_id = $1', [usuarioId])).rows.map(r => r.item));
    const item = sortearItem(tem);
    const novo = (await pool.query('INSERT INTO arena_itens (usuario_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING', [usuarioId, item.id])).rowCount > 0;
    await pool.query('INSERT INTO arena_baus (usuario_id, item, repetido) VALUES ($1, $2, $3)', [usuarioId, item.id, !novo]);
    return { item, novo };
  }

  function salaOuErro(req, res) {
    const sala = salas.get(String(req.params.codigo || ''));
    if (!sala) { res.status(404).json({ error: 'Essa sala não existe ou já acabou. Confira o código.' }); return null; }
    return sala;
  }

  const lerConfig = c => ({
    nivel: NIVEIS_DA_SALA[c?.nivel] ? c.nivel : 'aquecimento',
    ritmo: RITMOS[c?.ritmo] ? c.ritmo : 'normal',
    area: AREAS[c?.area] ? c.area : null,
    quantidade: QUANTIDADES.includes(Number(c?.quantidade)) ? Number(c.quantidade) : 5
  });

  app.post('/api/arena/salas', exigirLogin, freioCriar, async (req, res) => {
    const criadorJoga = req.body?.criador_joga !== false;
    const sala = criarSala({ criador: req.usuario, config: lerConfig(req.body), criadorJoga });
    if (criadorJoga) sala.jogadores.set(req.usuario.id, await jogadorDe(req.usuario));
    res.status(201).json({ codigo: sala.codigo });
  });

  app.post('/api/arena/salas/:codigo/entrar', exigirLogin, freioEntrar, async (req, res) => {
    const sala = salaOuErro(req, res); if (!sala) return;
    const id = req.usuario.id;
    if (sala.removidos.has(id)) return res.status(403).json({ error: 'Você foi removido dessa sala.' });
    if (sala.jogadores.has(id) || (sala.criadorId === id && !sala.criadorJoga)) return res.json({ codigo: sala.codigo });
    if (sala.estado !== 'espera') return res.status(409).json({ error: 'Essa partida já começou. Espere a próxima!' });
    if (sala.jogadores.size >= MAX_JOGADORES) return res.status(409).json({ error: 'A sala está cheia.' });
    sala.jogadores.set(id, await jogadorDe(req.usuario));
    transmitir(sala);
    res.json({ codigo: sala.codigo });
  });

  // Fluxo de eventos: manda o estado da sala na hora e a cada mudança.
  app.get('/api/arena/salas/:codigo/eventos', exigirLogin, (req, res) => {
    const sala = salaOuErro(req, res); if (!sala) return;
    const id = req.usuario.id;
    const j = sala.jogadores.get(id);
    const apresentador = sala.criadorId === id && !sala.criadorJoga;
    if (!j && !apresentador) return res.status(403).json({ error: 'Entre na sala primeiro.' });
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const conexoes = j ? j.conexoes : (sala.espectadores.get(id) || sala.espectadores.set(id, new Set()).get(id));
    conexoes.add(res);
    enviar(res, estadoPara(sala, id));
    if (j && conexoes.size === 1) transmitir(sala);
    const batida = setInterval(() => { try { res.write(': ok\n\n'); } catch (e) { /* caiu */ } }, 20000);
    req.on('close', () => {
      clearInterval(batida);
      conexoes.delete(res);
      if (j && conexoes.size === 0) transmitir(sala);
    });
  });

  app.post('/api/arena/salas/:codigo/comecar', exigirLogin, async (req, res) => {
    const sala = salaOuErro(req, res); if (!sala) return;
    if (sala.criadorId !== req.usuario.id) return res.status(403).json({ error: 'Só quem criou a sala pode começar.' });
    if (!['espera', 'fim'].includes(sala.estado)) return res.status(409).json({ error: 'A partida já está rolando.' });
    if (sala.jogadores.size < 1) return res.status(409).json({ error: 'Espere alguém entrar na sala.' });
    try {
      await comecar(sala);
      res.json({ ok: true });
    } catch (erro) {
      console.error('Erro ao começar Arena:', erro.message);
      res.status(500).json({ error: 'Não consegui sortear as questões agora. Tente de novo.' });
    }
  });

  app.post('/api/arena/salas/:codigo/responder', exigirLogin, (req, res) => {
    const sala = salaOuErro(req, res); if (!sala) return;
    const j = sala.jogadores.get(req.usuario.id);
    const alternativa = Number(req.body?.alternativa);
    if (!j) return res.status(403).json({ error: 'Você não está nessa sala.' });
    if (sala.estado !== 'resposta' || Number(req.body?.rodada) !== sala.rodada) return res.status(409).json({ error: 'Essa rodada já fechou.' });
    if (!Number.isInteger(alternativa) || alternativa < 0 || alternativa > 4) return res.status(400).json({ error: 'Alternativa inválida.' });
    if (j.respostas[sala.rodada]) return res.status(409).json({ error: 'Você já respondeu.' });
    const q = sala.questoes[sala.rodada];
    j.respostas[sala.rodada] = { alternativa, acertou: alternativa === q.correta, segundos: (Date.now() - sala.inicioResposta) / 1000, ganhou: 0 };
    res.json({ ok: true });
    // Todos que estão conectados já responderam: não precisa esperar o relógio.
    const faltam = conectados(sala).filter(x => !x.respostas[sala.rodada]);
    if (!faltam.length) setTimeout(() => fecharRodada(sala), 700);
    transmitir(sala);
  });

  app.post('/api/arena/salas/:codigo/remover', exigirLogin, (req, res) => {
    const sala = salaOuErro(req, res); if (!sala) return;
    const alvo = Number(req.body?.usuario_id);
    if (sala.criadorId !== req.usuario.id) return res.status(403).json({ error: 'Só quem criou a sala pode remover alguém.' });
    if (alvo === req.usuario.id) return res.status(400).json({ error: 'Você não pode remover a si mesmo.' });
    const j = sala.jogadores.get(alvo);
    if (j) {
      for (const c of j.conexoes) { enviar(c, { removido: true }); try { c.end(); } catch (e) { /* já fechou */ } }
      sala.jogadores.delete(alvo);
      sala.removidos.add(alvo);
      transmitir(sala);
    }
    res.json({ ok: true });
  });

  app.post('/api/arena/salas/:codigo/sair', exigirLogin, (req, res) => {
    const sala = salaOuErro(req, res); if (!sala) return;
    const j = sala.jogadores.get(req.usuario.id);
    // Durante a partida, quem sai fica no placar com o que já fez.
    if (j && ['espera', 'fim'].includes(sala.estado)) {
      for (const c of j.conexoes) try { c.end(); } catch (e) { /* já fechou */ }
      sala.jogadores.delete(req.usuario.id);
      transmitir(sala);
    }
    res.json({ ok: true });
  });

  // ---------- Arena da noite ----------
  // ARENA_HORA (ex.: "19:30", horário de Brasília) muda o horário; serve para testar.
  const [hora, minuto] = /^\d{1,2}:\d{2}$/.test(process.env.ARENA_HORA || '') ? process.env.ARENA_HORA.split(':').map(Number) : [19, 30];
  const HORA_DA_NOITE = { hora, minuto };
  const ABRE_ANTES = 10 * 60 * 1000;
  const ESPERA_MAXIMA = 15 * 60 * 1000;
  let daNoite = null; // { dia, codigo }

  function horarioDaNoite(dia = hojeEmBrasilia()) {
    // Brasília é UTC-3 (sem horário de verão desde 2019).
    return Date.parse(`${dia}T00:00:00Z`) + ((HORA_DA_NOITE.hora + 3) * 60 + HORA_DA_NOITE.minuto) * 60000;
  }

  async function cuidarDaNoite() {
    const dia = hojeEmBrasilia();
    const comeca = horarioDaNoite(dia);
    const agora = Date.now();
    if (agora >= comeca - ABRE_ANTES && agora < comeca + ESPERA_MAXIMA && (!daNoite || daNoite.dia !== dia)) {
      const sala = criarSala({ criador: null, publica: true, titulo: 'Arena da noite', criadorJoga: false,
        config: { nivel: 'normal', ritmo: 'normal', area: null, quantidade: 10 } });
      sala.comecaEm = comeca;
      daNoite = { dia, codigo: sala.codigo };
    }
    const sala = daNoite && daNoite.dia === dia ? salas.get(daNoite.codigo) : null;
    if (!sala || sala.estado !== 'espera' || agora < comeca) return;
    if (sala.jogadores.size >= 2) {
      await comecar(sala).catch(erro => console.error('Erro ao começar a Arena da noite:', erro.message));
    } else if (agora >= comeca + ESPERA_MAXIMA) {
      for (const j of sala.jogadores.values()) for (const c of j.conexoes) { enviar(c, { cancelada: true }); try { c.end(); } catch (e) { /* já fechou */ } }
      salas.delete(sala.codigo);
    } else if (!sala.avisouEspera) {
      sala.avisouEspera = true;
      transmitir(sala);
    }
  }

  app.get('/api/arena/agenda', (req, res) => {
    const dia = hojeEmBrasilia();
    let comeca = horarioDaNoite(dia);
    const sala = daNoite && daNoite.dia === dia ? salas.get(daNoite.codigo) : null;
    if (!sala && Date.now() > comeca + ESPERA_MAXIMA) comeca += 86400000;
    res.json({
      comeca_em: new Date(comeca).toISOString(), agora: Date.now(),
      aberta: Boolean(sala && sala.estado === 'espera'), rolando: Boolean(sala && !['espera', 'fim'].includes(sala.estado)),
      codigo: sala && sala.estado === 'espera' ? sala.codigo : null, jogadores: sala ? sala.jogadores.size : 0
    });
  });

  app.post('/api/arena/noite/entrar', exigirLogin, freioEntrar, async (req, res) => {
    const sala = daNoite && daNoite.dia === hojeEmBrasilia() ? salas.get(daNoite.codigo) : null;
    if (!sala) return res.status(404).json({ error: 'A Arena da noite abre às 19h20. Volte um pouco antes das 19h30!' });
    if (!sala.jogadores.has(req.usuario.id)) {
      if (sala.estado !== 'espera') return res.status(409).json({ error: 'A Arena da noite já começou. Amanhã tem de novo, às 19h30!' });
      if (sala.jogadores.size >= MAX_JOGADORES) return res.status(409).json({ error: 'A Arena da noite está cheia hoje.' });
      sala.jogadores.set(req.usuario.id, await jogadorDe(req.usuario));
      transmitir(sala);
    }
    res.json({ codigo: sala.codigo });
  });

  // Aviso no celular 5 minutos antes, para quem não desligou.
  async function lembrarArena() {
    if (!enviarPush) return;
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id FROM usuarios u JOIN push_inscricoes p ON p.usuario_id = u.id WHERE COALESCE(u.aviso_arena, TRUE) LIMIT 5000`);
    for (const { id } of rows) {
      await enviarPush(pool, id, { titulo: 'A Arena da noite começa em 5 minutos ⚔️', corpo: '10 questões ao vivo contra a comunidade. Vem!', abrir: 'arena', tag: 'arena' });
    }
  }

  // ---------- coleção, emblema e revanche ----------
  app.get('/api/arena/eu', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const [itens, emblema, numeros, revanche, convidados] = await Promise.all([
        pool.query('SELECT item FROM arena_itens WHERE usuario_id = $1', [eu]),
        pool.query('SELECT emblema FROM usuarios WHERE id = $1', [eu]),
        pool.query(
          `SELECT COUNT(*)::int AS partidas, COUNT(*) FILTER (WHERE r.posicao = 1 AND p.jogadores >= 2)::int AS vitorias,
                  COALESCE(MAX(r.pontos), 0)::int AS recorde,
                  COALESCE(SUM(r.xp) FILTER (WHERE r.created_at >= date_trunc('day', NOW() - INTERVAL '3 hours') + INTERVAL '3 hours'), 0)::int AS xp_hoje
             FROM arena_resultados r JOIN arena_partidas p ON p.id = r.partida_id WHERE r.usuario_id = $1`, [eu]),
        pool.query('SELECT COUNT(*)::int AS n FROM arena_revanche WHERE usuario_id = $1 AND NOT feito AND volta_em <= NOW()', [eu]),
        pool.query('SELECT COUNT(*)::int AS n FROM usuarios WHERE convidado_por = $1', [eu])
      ]);
      const tem = new Set(itens.rows.map(r => r.item));
      res.json({
        ...numeros.rows[0], xp_limite: XP_ARENA.limite_dia, revanche: revanche.rows[0].n, convidados: convidados.rows[0].n,
        emblema: emblema.rows[0]?.emblema || null,
        colecao: ITENS.map(i => ({ ...i, tem: tem.has(i.id) }))
      });
    } catch (erro) {
      console.error('Erro ao ler a Arena da pessoa:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });

  app.post('/api/arena/emblema', exigirLogin, async (req, res) => {
    const item = req.body?.item === null ? null : String(req.body?.item || '');
    if (item !== null && !ITEM_POR_ID.has(item)) return res.status(400).json({ error: 'Emblema inválido.' });
    if (item) {
      const tem = await pool.query('SELECT 1 FROM arena_itens WHERE usuario_id = $1 AND item = $2', [req.usuario.id, item]);
      if (!tem.rowCount) return res.status(403).json({ error: 'Você ainda não tem esse emblema.' });
    }
    await pool.query('UPDATE usuarios SET emblema = $1 WHERE id = $2', [item, req.usuario.id]);
    res.json({ emblema: item });
  });

  app.get('/api/arena/revanche', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT q.id, q.ano, q.disciplina, q.contexto, q.alternativas, q.correta
           FROM arena_revanche r JOIN questoes q ON q.id = r.questao_id
          WHERE r.usuario_id = $1 AND NOT r.feito AND r.volta_em <= NOW() ORDER BY r.volta_em LIMIT 5`, [req.usuario.id]);
      res.json({ questoes: rows.map(q => ({ ...q, area: (AREAS[q.disciplina] || {}).nome })) });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });

  // Acertou: sai da lista. Errou de novo: volta em 3 dias.
  app.post('/api/arena/revanche/:id', exigirLogin, async (req, res) => {
    const id = Number(req.params.id);
    const alternativa = Number(req.body?.alternativa);
    if (!Number.isInteger(id) || !Number.isInteger(alternativa) || alternativa < 0 || alternativa > 4) return res.status(400).json({ error: 'Dados inválidos.' });
    try {
      const q = (await pool.query(
        `SELECT q.correta FROM arena_revanche r JOIN questoes q ON q.id = r.questao_id
          WHERE r.usuario_id = $1 AND r.questao_id = $2 AND NOT r.feito`, [req.usuario.id, id])).rows[0];
      if (!q) return res.status(404).json({ error: 'Essa revanche já foi feita.' });
      const acertou = alternativa === q.correta;
      await pool.query('INSERT INTO respostas (questao_id, usuario_id, acertou) VALUES ($1, $2, $3)', [id, req.usuario.id, acertou]);
      await pool.query(
        `UPDATE arena_revanche SET feito = $3, volta_em = CASE WHEN $3 THEN volta_em ELSE NOW() + INTERVAL '3 days' END
          WHERE usuario_id = $1 AND questao_id = $2`, [req.usuario.id, id, acertou]);
      res.json({ acertou, correta: q.correta });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui registrar agora.' });
    }
  });

  // Faxina: sala parada some da memória.
  const faxina = setInterval(() => {
    const agora = Date.now();
    for (const [codigo, sala] of salas) {
      const parada = agora - sala.ultimaAtividade;
      const ninguem = [...sala.jogadores.values()].every(j => j.conexoes.size === 0) && sala.espectadores.size === 0;
      if ((sala.estado === 'fim' && parada > 30 * 60 * 1000) || (ninguem && parada > 10 * 60 * 1000) || parada > 3 * 3600 * 1000) {
        clearTimeout(sala.relogio);
        salas.delete(codigo);
      }
    }
  }, 60 * 1000);
  const noite = setInterval(() => cuidarDaNoite().catch(erro => console.error('Erro na Arena da noite:', erro.message)), 15 * 1000);
  faxina.unref(); noite.unref();

  return { lembrarArena, cuidarDaNoite };
}

module.exports = registrarArena;
Object.assign(module.exports, {
  tempoDaQuestao, tempoDeLeitura, pontosDoAcerto, compararJogadores, xpDaPartida, sortearItem, destaquesDaPartida, vitoriasPessoais,
  ITENS, ITEM_POR_ID, XP_ARENA, AREAS, salas
});
