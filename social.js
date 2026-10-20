// Seguir pessoas e notificações: o que faz o aluno voltar ao site.
//
// As notificações ficam numa tabela simples. Quem gera é cada parte do
// site (resposta a comentário, comentário útil, novo seguidor, publicação de
// quem você segue, reel aprovado) chamando notificar().

const imagens = require('./imagens');

const DIAS_GUARDADAS = 60;

// Ninguém é notificado das próprias ações, e a mesma notificação não se
// repete enquanto não for lida (curtir e descurtir dez vezes vira uma só).
async function notificar(pool, { usuarioId, atorId = null, tipo, alvoTipo = null, alvoId = null, texto = null }) {
  if (!usuarioId || usuarioId === atorId) return;
  try {
    const r = await pool.query(
      // Tipos explícitos: no INSERT ... SELECT o Postgres não deduz sozinho.
      `INSERT INTO notificacoes (usuario_id, ator_id, tipo, alvo_tipo, alvo_id, texto)
       SELECT $1::int, $2::int, $3::varchar, $4::varchar, $5::int, $6::varchar
        WHERE NOT EXISTS (SELECT 1 FROM notificacoes WHERE usuario_id = $1 AND ator_id IS NOT DISTINCT FROM $2
                            AND tipo = $3 AND alvo_tipo IS NOT DISTINCT FROM $4 AND alvo_id IS NOT DISTINCT FROM $5 AND NOT lida)`,
      [usuarioId, atorId, tipo, alvoTipo, alvoId, texto ? String(texto).slice(0, 200) : null]
    );
    // Também no celular, para quem ativou os avisos (sem esperar o envio).
    if (r.rowCount) require('./avisos').avisarNotificacao(pool, { usuarioId, atorId, tipo, alvoTipo, alvoId, texto });
  } catch (erro) {
    // Notificação nunca pode atrapalhar a ação principal.
    console.error('Erro ao notificar:', erro.message);
  }
}

// Avisa todos os seguidores de alguém (por exemplo, publicação nova).
async function notificarSeguidores(pool, { atorId, tipo, alvoTipo, alvoId, texto }) {
  try {
    await pool.query(
      `INSERT INTO notificacoes (usuario_id, ator_id, tipo, alvo_tipo, alvo_id, texto)
       SELECT seguidor_id, $1::int, $2::varchar, $3::varchar, $4::int, $5::varchar FROM seguidores WHERE seguido_id = $1::int`,
      [atorId, tipo, alvoTipo, alvoId, texto ? String(texto).slice(0, 200) : null]
    );
  } catch (erro) {
    console.error('Erro ao notificar seguidores:', erro.message);
  }
}

function registrarSocial(app, { pool, auth, limitar, exigirLogin }) {
  const freioSeguir = limitar(auth.criarFreio(60, 60 * 60 * 1000), 'Calma! Muitas ações de seguir em pouco tempo.', req => `u${req.usuario.id}`);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  // Seguir funciona como interruptor: chamar de novo deixa de seguir.
  app.post('/api/perfil/:id/seguir', exigirLogin, freioSeguir, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id || id === req.usuario.id) return res.status(400).json({ error: 'Não dá para seguir esse perfil.' });
    try {
      const saiu = await pool.query('DELETE FROM seguidores WHERE seguidor_id = $1 AND seguido_id = $2', [req.usuario.id, id]);
      let sigo = false;
      if (saiu.rowCount === 0) {
        const r = await pool.query(
          `INSERT INTO seguidores (seguidor_id, seguido_id) SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM usuarios WHERE id = $2)
           ON CONFLICT DO NOTHING`, [req.usuario.id, id]
        );
        if (r.rowCount === 0) return res.status(404).json({ error: 'Perfil não encontrado.' });
        sigo = true;
        await notificar(pool, { usuarioId: id, atorId: req.usuario.id, tipo: 'seguidor', alvoTipo: 'perfil', alvoId: req.usuario.id });
      }
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM seguidores WHERE seguido_id = $1', [id]);
      res.json({ sigo, seguidores: rows[0].n });
    } catch (erro) {
      console.error('Erro ao seguir:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora. Tente de novo.' });
    }
  });

  // Lista de quem segue ou é seguido (só para quem tem conta, como os perfis).
  app.get('/api/perfil/:id/:lista(seguidores|seguindo)', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Perfil não encontrado.' });
    const [quem, filtro] = req.params.lista === 'seguidores' ? ['seguidor_id', 'seguido_id'] : ['seguido_id', 'seguidor_id'];
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.username AS nome, u.foto_id FROM seguidores s JOIN usuarios u ON u.id = s.${quem}
          WHERE s.${filtro} = $1 ORDER BY s.created_at DESC LIMIT 200`, [id]
      );
      res.json({ pessoas: rows.map(p => ({ id: p.id, nome: p.nome, foto: imagens.urlAssinada(p.foto_id) })) });
    } catch (erro) {
      console.error('Erro ao listar seguidores:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar a lista agora.' });
    }
  });

  app.get('/api/notificacoes', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT n.id, n.tipo, n.alvo_tipo, n.alvo_id, n.texto, n.lida, n.created_at,
                u.id AS ator_id, u.username AS ator, u.foto_id
           FROM notificacoes n LEFT JOIN usuarios u ON u.id = n.ator_id
          WHERE n.usuario_id = $1 ORDER BY n.id DESC LIMIT 40`, [req.usuario.id]
      );
      const naoLidas = await pool.query('SELECT COUNT(*)::int AS n FROM notificacoes WHERE usuario_id = $1 AND NOT lida', [req.usuario.id]);
      res.json({
        notificacoes: rows.map(n => ({ ...n, foto: imagens.urlAssinada(n.foto_id), foto_id: undefined })),
        nao_lidas: naoLidas.rows[0].n
      });
    } catch (erro) {
      console.error('Erro ao listar notificações:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar as notificações agora.' });
    }
  });

  // Só a contagem, para o sino do topo (consulta leve).
  app.get('/api/notificacoes/contagem', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM notificacoes WHERE usuario_id = $1 AND NOT lida', [req.usuario.id]);
      res.json({ nao_lidas: rows[0].n });
    } catch (erro) {
      res.status(500).json({ error: 'Falhou.' });
    }
  });

  app.post('/api/notificacoes/lidas', exigirLogin, async (req, res) => {
    try {
      await pool.query('UPDATE notificacoes SET lida = TRUE WHERE usuario_id = $1 AND NOT lida', [req.usuario.id]);
      res.json({ ok: true });
    } catch (erro) {
      res.status(500).json({ error: 'Falhou.' });
    }
  });
}

module.exports = registrarSocial;
module.exports.notificar = notificar;
module.exports.notificarSeguidores = notificarSeguidores;
module.exports.DIAS_GUARDADAS = DIAS_GUARDADAS;
