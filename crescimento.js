// Crescimento: de onde vêm as contas, quem volta e os convites.
//
// O painel só mostra números somados, nunca quem é quem. A origem é uma
// palavra de uma lista fechada (nada de endereço de página ou texto livre),
// e quem convidou quem só serve para dar o emblema de convite.

const { notificar } = require('./social');

const ORIGENS = ['tiktok', 'tiktok2', 'tiktok_pago', 'instagram', 'whatsapp', 'youtube', 'busca', 'story', 'escola', 'indicacao', 'outro', 'direto'];
const NOMES_ORIGEM = {
  tiktok: 'TikTok', tiktok2: 'TikTok (2ª conta)', tiktok_pago: 'TikTok (anúncio)', instagram: 'Instagram', whatsapp: 'WhatsApp',
  youtube: 'YouTube', busca: 'Google e buscas', story: 'Cartão da nota (stories)', escola: 'Escola parceira',
  indicacao: 'Convite de amigo', outro: 'Outro site', direto: 'Direto (digitou ou salvou)', sem_registro: 'Antes do registro de origem'
};

// Emblemas de convite: só visuais, como os do baú. Um amigo dá o primeiro,
// cinco dão o segundo. Conta falsa não rende nada além disso.
const EMBLEMAS_CONVITE = [
  { item: 'convite', amigos: 1 },
  { item: 'turma', amigos: 5 }
];

// Uso de cada parte do site (painel "Quem usa cada parte"). Lista fechada, como as origens.
const PARTES = ['treinar', 'aulas', 'comunidade', 'simulado', 'arena', 'redacao', 'reels', 'mensagens', 'desafio'];
const NOMES_PARTE = {
  treinar: 'Treinar (fez questões)', aulas: 'O que cai no ENEM (aulas)', comunidade: 'Comunidade', simulado: 'Simulado',
  arena: 'Arena', redacao: 'Redação', reels: 'Reels', mensagens: 'Mensagens', desafio: 'Desafio da semana'
};
const lerParte = valor => (PARTES.includes(valor) ? valor : null);
// Visitante sem conta: o site manda um código sorteado no aparelho; aqui ele vira um resumo (hash),
// para o banco não guardar nem o código.
const visitanteValido = visitante => typeof visitante === 'string' && /^[a-z0-9]{12,40}$/.test(visitante);
const resumo = texto => require('crypto').createHash('sha256').update(texto).digest('hex');
const quemUsou = (usuario, visitante) => {
  if (usuario) return { quem: `u${usuario.id}`, conta: true };
  if (!visitanteValido(visitante)) return null;
  return { quem: 'v' + resumo(visitante).slice(0, 20), conta: false };
};

// Questões respondidas sem conta: cada resposta guarda um resumo do código do aparelho
// (com outro tempero, para não bater com o do painel de uso). Quando a pessoa cria a conta
// nesse aparelho, as respostas passam para ela e a nota TRI não começa do zero.
const marcaDoVisitante = visitante => (visitanteValido(visitante) ? resumo('respostas:' + visitante).slice(0, 32) : null);

// Só para conta recém-criada: assim ninguém junta respostas de outro aparelho numa conta antiga.
async function juntarRespostasDoVisitante(pool, usuarioId, visitante) {
  const marca = marcaDoVisitante(visitante);
  if (!marca) return 0;
  try {
    const r = await pool.query(
      'UPDATE respostas SET usuario_id = $1, visitante = NULL WHERE visitante = $2 AND usuario_id IS NULL',
      [usuarioId, marca]
    );
    return r.rowCount || 0;
  } catch (erro) {
    console.error('Erro ao juntar as respostas do visitante:', erro.message);
    return 0;
  }
}
const HOJE = "(NOW() - INTERVAL '3 hours')::date";
const SQL_USO = `
  SELECT parte,
    COUNT(DISTINCT quem)::int AS pessoas_7,
    COUNT(DISTINCT quem) FILTER (WHERE conta)::int AS contas_7,
    COUNT(DISTINCT quem) FILTER (WHERE dia = ${HOJE})::int AS hoje
  FROM uso_partes WHERE dia > ${HOJE} - 7 GROUP BY parte`;

const lerOrigem = valor => (ORIGENS.includes(valor) ? valor : null);
const lerConvite = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

// Grava de onde veio a conta nova e, se veio por convite, dá o emblema a quem
// convidou. Nunca atrapalha o cadastro: qualquer erro só vai para o log.
async function registrarOrigem(pool, novoId, { origem, convite } = {}) {
  try {
    let convidou = lerConvite(convite);
    if (convidou === novoId) convidou = null;
    if (convidou && !(await pool.query('SELECT 1 FROM usuarios WHERE id = $1', [convidou])).rowCount) convidou = null;
    const deOnde = convidou ? 'indicacao' : (lerOrigem(origem) || 'direto');
    await pool.query('UPDATE usuarios SET origem = $1, convidado_por = $2 WHERE id = $3', [deOnde, convidou, novoId]);
    if (!convidou) return;

    const amigos = (await pool.query('SELECT COUNT(*)::int AS n FROM usuarios WHERE convidado_por = $1', [convidou])).rows[0].n;
    for (const e of EMBLEMAS_CONVITE) {
      if (amigos >= e.amigos) await pool.query('INSERT INTO arena_itens (usuario_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING', [convidou, e.item]);
    }
    await notificar(pool, { usuarioId: convidou, atorId: novoId, tipo: 'convite', texto: String(amigos) });
  } catch (erro) {
    console.error('Erro ao registrar a origem da conta:', erro.message);
  }
}

// Brasília: o servidor guarda em UTC, o dia do aluno vira 3 horas depois.
const DIA = "(created_at - INTERVAL '3 hours')::date";

// Comunidade: das contas criadas nos últimos 30 dias, quantas criaram algum laço
// na primeira semana, e se quem criou laço volta mais do que quem não criou.
// "Voltou" é o mesmo do painel de cima: respondeu questão num dos 7 dias seguintes ao cadastro.
const SQL_COMUNIDADE = `
  WITH u AS (
    SELECT id, created_at, ${DIA} AS dia FROM usuarios WHERE created_at > NOW() - INTERVAL '30 days'
  ), l AS (
    SELECT u.id, u.dia,
      EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = u.id AND s.created_at < u.created_at + INTERVAL '7 days') AS seguiu,
      EXISTS (SELECT 1 FROM grupo_membros g WHERE g.usuario_id = u.id AND g.created_at < u.created_at + INTERVAL '7 days') AS grupo,
      EXISTS (SELECT 1 FROM boas_vindas b WHERE (b.novo_id = u.id OR b.quem_id = u.id) AND b.created_at < u.created_at + INTERVAL '7 days') AS boas_vindas,
      EXISTS (SELECT 1 FROM duplas d WHERE (d.convidou_id = u.id OR d.convidado_id = u.id) AND d.aceita_em IS NOT NULL
                 AND d.aceita_em < u.created_at + INTERVAL '7 days') AS dupla,
      (EXISTS (SELECT 1 FROM mensagens m WHERE m.de_id = u.id AND m.created_at < u.created_at + INTERVAL '7 days')
        OR EXISTS (SELECT 1 FROM questoes_comentarios c WHERE c.usuario_id = u.id AND c.created_at < u.created_at + INTERVAL '7 days')) AS conversou,
      EXISTS (SELECT 1 FROM respostas r WHERE r.usuario_id = u.id
                 AND r.created_at >= u.dia + INTERVAL '1 day 3 hours' AND r.created_at < u.dia + INTERVAL '8 days 3 hours') AS voltou,
      u.dia <= (NOW() - INTERVAL '3 hours')::date - 8 AS teve_7_dias
    FROM u
  )
  SELECT COUNT(*)::int AS novos,
    COUNT(*) FILTER (WHERE seguiu)::int AS seguiu,
    COUNT(*) FILTER (WHERE grupo)::int AS grupo,
    COUNT(*) FILTER (WHERE boas_vindas)::int AS boas_vindas,
    COUNT(*) FILTER (WHERE dupla)::int AS dupla,
    COUNT(*) FILTER (WHERE conversou)::int AS conversou,
    COUNT(*) FILTER (WHERE seguiu OR grupo OR boas_vindas OR dupla OR conversou)::int AS com_laco,
    COUNT(*) FILTER (WHERE teve_7_dias AND (seguiu OR grupo OR boas_vindas OR dupla OR conversou))::int AS laco_7,
    COUNT(*) FILTER (WHERE teve_7_dias AND (seguiu OR grupo OR boas_vindas OR dupla OR conversou) AND voltou)::int AS laco_voltou,
    COUNT(*) FILTER (WHERE teve_7_dias AND NOT (seguiu OR grupo OR boas_vindas OR dupla OR conversou))::int AS sem_laco_7,
    COUNT(*) FILTER (WHERE teve_7_dias AND NOT (seguiu OR grupo OR boas_vindas OR dupla OR conversou) AND voltou)::int AS sem_laco_voltou
  FROM l`;

// Metas (PLANO PRO, 25/11/2026): 5.000 contas até 31/08/2027 e as condições para lançar o PRO.
// Contas ativas = contas diferentes que responderam ao menos uma questão na semana (segunda a domingo, Brasília).
const SQL_METAS_SEMANAS = `
  WITH s AS (
    SELECT generate_series(date_trunc('week', (NOW() - INTERVAL '3 hours')::date) - INTERVAL '7 weeks',
                           date_trunc('week', (NOW() - INTERVAL '3 hours')::date), INTERVAL '1 week')::date AS ini
  )
  SELECT to_char(s.ini, 'YYYY-MM-DD') AS semana,
    (SELECT COUNT(*)::int FROM usuarios u
      WHERE (u.created_at - INTERVAL '3 hours')::date >= s.ini AND (u.created_at - INTERVAL '3 hours')::date < s.ini + 7) AS cadastros,
    (SELECT COUNT(DISTINCT r.usuario_id)::int FROM respostas r
      WHERE r.usuario_id IS NOT NULL
        AND r.created_at >= s.ini + INTERVAL '3 hours' AND r.created_at < s.ini + INTERVAL '7 days 3 hours') AS ativos
  FROM s ORDER BY s.ini`;

// Pontos de controle da meta de contas (total acumulado em cada data).
const MARCOS_CONTAS = [
  ['2026-11-25', 18], ['2026-12-31', 300], ['2027-03-31', 2650], ['2027-07-31', 4350], ['2027-08-31', 5000]
];
// Meta de contas novas por semana, conforme o período do ano do ENEM.
function metaDaSemana(iso) {
  const d = String(iso).slice(0, 10);
  if (d < '2027-01-01') return 60;
  if (d < '2027-04-01') return 180;
  if (d < '2027-08-01') return 100;
  return 140;
}
// Quantas contas o plano espera ter numa data (linha reta entre os pontos de controle).
function contasPrevistas(iso) {
  const t = Date.parse(String(iso).slice(0, 10));
  const pontos = MARCOS_CONTAS.map(([d, n]) => [Date.parse(d), n]);
  if (t <= pontos[0][0]) return pontos[0][1];
  for (let i = 1; i < pontos.length; i++) {
    const [t0, n0] = pontos[i - 1], [t1, n1] = pontos[i];
    if (t <= t1) return Math.round(n0 + (n1 - n0) * (t - t0) / (t1 - t0));
  }
  return pontos[pontos.length - 1][1];
}
// Condições do PLANO PRO a partir das semanas fechadas (a semana atual ainda está correndo).
function condicoesPro(semanas, contas) {
  const fechadas = semanas.slice(0, -1).map(s => s.ativos);
  const seguidas = min => { let n = 0; for (let i = fechadas.length - 1; i >= 0 && fechadas[i] >= min; i--) n++; return n; };
  return {
    lista_espera: { liberada: seguidas(100) >= 2, semanas_com_100: seguidas(100) },
    lancar: { contas_ok: contas >= 1000, semanas_com_200: seguidas(200), ativos_ok: seguidas(200) >= 3 }
  };
}

function registrarCrescimento(app, { pool, exigirModerador }) {
  // O site avisa quando alguém abre uma parte (uma vez por parte e por dia em cada aparelho).
  app.post('/api/uso', async (req, res) => {
    const parte = lerParte(req.body?.parte), q = quemUsou(req.usuario, req.body?.visitante);
    if (!parte || !q) return res.status(400).json({ error: 'Pedido inválido.' });
    try {
      await pool.query(`INSERT INTO uso_partes (dia, parte, quem, conta) VALUES (${HOJE}, $1, $2, $3) ON CONFLICT DO NOTHING`, [parte, q.quem, q.conta]);
    } catch (erro) { console.error('Erro ao registrar uso:', erro.message); }
    res.json({ ok: true });
  });

  app.get('/api/admin/crescimento', exigirModerador, async (req, res) => {
    try {
      const [porDia, semanas, origens, convites] = await Promise.all([
        // Cadastros de cada um dos últimos 30 dias, com zero nos dias sem cadastro.
        pool.query(
          `SELECT to_char(d, 'YYYY-MM-DD') AS dia, COUNT(u.id)::int AS cadastros
             FROM generate_series((NOW() - INTERVAL '3 hours')::date - 29, (NOW() - INTERVAL '3 hours')::date, INTERVAL '1 day') d
             LEFT JOIN usuarios u ON (u.created_at - INTERVAL '3 hours')::date = d::date
            GROUP BY d ORDER BY d`),
        // Voltou em 7 dias: respondeu alguma questão (treino, simulado ou Arena)
        // num dos 7 dias depois do dia do cadastro. Só entra quem já teve os 7 dias.
        pool.query(
          `WITH u AS (SELECT id, ${DIA} AS dia FROM usuarios
                       WHERE ${DIA} <= (NOW() - INTERVAL '3 hours')::date - 8
                         AND ${DIA} > (NOW() - INTERVAL '3 hours')::date - 8 - 42)
           SELECT to_char(date_trunc('week', u.dia), 'YYYY-MM-DD') AS semana, COUNT(*)::int AS cadastros,
                  COUNT(*) FILTER (WHERE EXISTS (
                    SELECT 1 FROM respostas r WHERE r.usuario_id = u.id
                       AND r.created_at >= u.dia + INTERVAL '1 day 3 hours'
                       AND r.created_at < u.dia + INTERVAL '8 days 3 hours'))::int AS voltaram
             FROM u GROUP BY 1 ORDER BY 1`),
        pool.query(
          `SELECT COALESCE(origem, 'sem_registro') AS origem, COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS mes
             FROM usuarios GROUP BY 1 ORDER BY 3 DESC, 2 DESC`),
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE convidado_por IS NOT NULL)::int AS total,
                  COUNT(*) FILTER (WHERE convidado_por IS NOT NULL AND created_at > NOW() - INTERVAL '30 days')::int AS mes,
                  COUNT(DISTINCT convidado_por)::int AS quem_convidou
             FROM usuarios`)
      ]);
      // À parte: se esta conta der erro, o resto do painel continua aparecendo.
      const uso = await pool.query(SQL_USO).then(r => PARTES.map(p => {
        const linha = r.rows.find(x => x.parte === p) || { pessoas_7: 0, contas_7: 0, hoje: 0 };
        return { parte: p, nome: NOMES_PARTE[p], pessoas_7: linha.pessoas_7, contas_7: linha.contas_7, hoje: linha.hoje };
      }).sort((a, b) => b.pessoas_7 - a.pessoas_7)).catch(erro => { console.error('Erro nos números de uso:', erro.message); return null; });
      const metas = await Promise.all([pool.query(SQL_METAS_SEMANAS), pool.query('SELECT COUNT(*)::int AS n FROM usuarios')])
        .then(([sem, tot]) => {
          const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
          const semanas = sem.rows.map(x => ({ ...x, meta: metaDaSemana(x.semana) }));
          const contas = tot.rows[0].n;
          return { hoje, contas, previstas_hoje: contasPrevistas(hoje), meta_final: 5000, semanas, pro: condicoesPro(semanas, contas) };
        }).catch(erro => { console.error('Erro nas metas:', erro.message); return null; });
      const comunidade = await pool.query(SQL_COMUNIDADE).then(r => r.rows[0]).catch(erro => { console.error('Erro nos números da comunidade:', erro.message); return null; });
      res.json({
        metas,
        uso,
        comunidade,
        por_dia: porDia.rows,
        semanas: semanas.rows,
        origens: origens.rows.map(o => ({ ...o, nome: NOMES_ORIGEM[o.origem] || o.origem })),
        convites: convites.rows[0]
      });
    } catch (erro) {
      console.error('Erro no painel de crescimento:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os números agora.' });
    }
  });
}

module.exports = registrarCrescimento;
Object.assign(module.exports, { SQL_METAS_SEMANAS, metaDaSemana, contasPrevistas, condicoesPro, SQL_USO, PARTES, lerParte, quemUsou, marcaDoVisitante, juntarRespostasDoVisitante, SQL_COMUNIDADE, ORIGENS, NOMES_ORIGEM, EMBLEMAS_CONVITE, lerOrigem, lerConvite, registrarOrigem });
