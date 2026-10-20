// Reels: vídeos curtos de resolução de questões e dicas, no estilo TikTok.
// O vídeo fica no YouTube (Shorts); o site guarda só o código dele e mostra
// tudo num feed vertical. Só administradores publicam; alunos curtem e salvam.

const TIPOS = ['resolucao', 'dica'];
const AREAS = ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'];
const POR_PAGINA = 20;

// Aceita os formatos de link do YouTube e devolve o código de 11 caracteres:
// youtube.com/shorts/ID, youtu.be/ID, youtube.com/watch?v=ID, /embed/ID.
function idDoYoutube(link) {
  if (typeof link !== 'string' || link.length > 300) return null;
  let url;
  try { url = new URL(link.trim()); } catch (e) { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const m = url.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
    id = m ? m[2] : url.searchParams.get('v');
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

function registrarReels(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  const freioCurtir = limitar(auth.criarFreio(300, 60 * 60 * 1000), 'Calma! Muitas curtidas em pouco tempo.', req => `u${req.usuario.id}`);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  async function listar(req, res, { salvos }) {
    const eu = req.usuario;
    const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : null;
    const area = AREAS.includes(req.query.area) ? req.query.area : null;
    const antesDe = idValido(req.query.antes); // paginação: reels mais antigos que este id
    try {
      const { rows } = await pool.query(
        `SELECT r.id, r.youtube_id, r.titulo, r.descricao, r.tipo, r.area, r.created_at,
                (SELECT COUNT(*)::int FROM reels_curtidas c WHERE c.reel_id = r.id) AS curtidas,
                EXISTS (SELECT 1 FROM reels_curtidas c WHERE c.reel_id = r.id AND c.usuario_id = $1) AS curti,
                EXISTS (SELECT 1 FROM reels_salvos s WHERE s.reel_id = r.id AND s.usuario_id = $1) AS salvei
           FROM reels r
          WHERE ($2::text IS NULL OR r.tipo = $2) AND ($3::text IS NULL OR r.area = $3)
            AND ($4::int IS NULL OR r.id < $4)
            AND (NOT $5 OR EXISTS (SELECT 1 FROM reels_salvos s WHERE s.reel_id = r.id AND s.usuario_id = $1))
          ORDER BY r.id DESC
          LIMIT ${POR_PAGINA}`,
        [eu ? eu.id : null, tipo, area, antesDe, salvos]
      );
      res.json({ reels: rows, mais: rows.length === POR_PAGINA, moderador: Boolean(eu && eu.admin) });
    } catch (erro) {
      console.error('Erro ao listar reels:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os reels agora.' });
    }
  }

  app.get('/api/reels', (req, res) => listar(req, res, { salvos: false }));
  app.get('/api/reels/salvos', exigirLogin, (req, res) => listar(req, res, { salvos: true }));

  app.post('/api/reels', exigirModerador, async (req, res) => {
    const c = req.body || {};
    const youtubeId = idDoYoutube(c.link);
    if (!youtubeId) return res.status(400).json({ error: 'Cole o link de um vídeo do YouTube (Shorts ou normal).' });
    const titulo = typeof c.titulo === 'string' ? c.titulo.trim() : '';
    const descricao = typeof c.descricao === 'string' ? c.descricao.trim() : '';
    if (!titulo || titulo.length > 100) return res.status(400).json({ error: 'O título precisa ter de 1 a 100 caracteres.' });
    if (descricao.length > 500) return res.status(400).json({ error: 'A descrição pode ter até 500 caracteres.' });
    if (!TIPOS.includes(c.tipo)) return res.status(400).json({ error: 'Escolha se é resolução ou dica.' });
    if (c.area && !AREAS.includes(c.area)) return res.status(400).json({ error: 'Área inválida.' });
    try {
      const { rows } = await pool.query(
        `INSERT INTO reels (autor_id, youtube_id, titulo, descricao, tipo, area)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [req.usuario.id, youtubeId, titulo, descricao, c.tipo, c.area || null]
      );
      res.status(201).json({ id: rows[0].id, message: 'Reel publicado!' });
    } catch (erro) {
      console.error('Erro ao publicar reel:', erro.message);
      res.status(500).json({ error: 'Não consegui publicar o reel agora.' });
    }
  });

  app.delete('/api/reels/:id', exigirModerador, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
    try {
      const r = await pool.query('DELETE FROM reels WHERE id = $1', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Reel não encontrado.' });
      res.json({ message: 'Reel apagado.' });
    } catch (erro) {
      console.error('Erro ao apagar reel:', erro.message);
      res.status(500).json({ error: 'Não consegui apagar o reel agora.' });
    }
  });

  // Curtir e salvar funcionam como interruptor: chamar de novo desfaz.
  for (const [acao, tabela] of [['curtir', 'reels_curtidas'], ['salvar', 'reels_salvos']]) {
    app.post(`/api/reels/:id/${acao}`, exigirLogin, freioCurtir, async (req, res) => {
      const id = idValido(req.params.id);
      if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
      try {
        const apagou = await pool.query(`DELETE FROM ${tabela} WHERE reel_id = $1 AND usuario_id = $2`, [id, req.usuario.id]);
        let ligado = false;
        if (apagou.rowCount === 0) {
          const r = await pool.query(
            `INSERT INTO ${tabela} (reel_id, usuario_id) SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM reels WHERE id = $1)
             ON CONFLICT DO NOTHING`, [id, req.usuario.id]
          );
          if (r.rowCount === 0) return res.status(404).json({ error: 'Reel não encontrado.' });
          ligado = true;
        }
        const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM reels_curtidas WHERE reel_id = $1', [id]);
        res.json({ ligado, curtidas: rows[0].n });
      } catch (erro) {
        console.error(`Erro ao ${acao} reel:`, erro.message);
        res.status(500).json({ error: 'Não deu certo agora. Tente de novo.' });
      }
    });
  }
}

module.exports = registrarReels;
module.exports.idDoYoutube = idDoYoutube;
