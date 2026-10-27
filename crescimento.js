// Crescimento: de onde vêm as contas, quem volta e os convites.
//
// O painel só mostra números somados, nunca quem é quem. A origem é uma
// palavra de uma lista fechada (nada de endereço de página ou texto livre),
// e quem convidou quem só serve para dar o emblema de convite.

const { notificar } = require('./social');

const ORIGENS = ['tiktok', 'instagram', 'whatsapp', 'youtube', 'busca', 'indicacao', 'outro', 'direto'];
const NOMES_ORIGEM = {
  tiktok: 'TikTok', instagram: 'Instagram', whatsapp: 'WhatsApp', youtube: 'YouTube', busca: 'Google e buscas',
  indicacao: 'Convite de amigo', outro: 'Outro site', direto: 'Direto (digitou ou salvou)', sem_registro: 'Antes do registro de origem'
};

// Emblemas de convite: só visuais, como os do baú. Um amigo dá o primeiro,
// cinco dão o segundo. Conta falsa não rende nada além disso.
const EMBLEMAS_CONVITE = [
  { item: 'convite', amigos: 1 },
  { item: 'turma', amigos: 5 }
];

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

function registrarCrescimento(app, { pool, exigirModerador }) {
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
      res.json({
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
Object.assign(module.exports, { ORIGENS, NOMES_ORIGEM, EMBLEMAS_CONVITE, lerOrigem, lerConvite, registrarOrigem });
