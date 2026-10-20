// Reels: vídeos curtos de resolução de questões e dicas, no estilo TikTok.
// O vídeo fica no YouTube (de qualquer canal); o site guarda só o código
// dele e mostra tudo num feed vertical, com o nome do canal como crédito.
// Só administradores publicam; alunos curtem e salvam.

const fs = require('fs');
const path = require('path');

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

// Título e canal do vídeo, pelo oEmbed do YouTube (público, sem chave).
// Vídeo privado, apagado ou com a incorporação desligada responde 401/404:
// esses não tocariam no site, então nem entram.
async function infoDoYoutube(id, buscar = fetch) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`;
  try {
    const r = await buscar(url, { signal: AbortSignal.timeout(6000) });
    if (r.status === 401 || r.status === 403 || r.status === 404) return { indisponivel: true };
    if (!r.ok) return {};
    const d = await r.json();
    return {
      titulo: typeof d.title === 'string' ? d.title.trim().slice(0, 100) : undefined,
      canal: typeof d.author_name === 'string' ? d.author_name.trim().slice(0, 100) : undefined
    };
  } catch (e) {
    return {}; // sem rede agora: publica mesmo assim, sem os dados automáticos
  }
}

// reels-iniciais.json: lista de links que a equipe manda. Ao subir, o servidor
// publica os que ainda não estão no site; apagar um reel no site não o traz
// de volta porque o código fica em reels_ignorados.
async function publicarReelsIniciais(pool, arquivo = path.join(__dirname, 'reels-iniciais.json')) {
  let lista;
  try { lista = JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch (e) { return 0; }
  let novos = 0;
  for (const item of Array.isArray(lista) ? lista : []) {
    const id = idDoYoutube(item.link);
    if (!id) { console.warn('🎬 Link inválido em reels-iniciais.json:', item.link); continue; }
    const ja = await pool.query(
      'SELECT 1 FROM reels WHERE youtube_id = $1 UNION ALL SELECT 1 FROM reels_ignorados WHERE youtube_id = $1', [id]
    );
    if (ja.rowCount) continue;
    const info = await infoDoYoutube(id);
    if (info.indisponivel) { console.warn('🎬 Vídeo indisponível fora do YouTube, pulei:', item.link); continue; }
    await pool.query(
      `INSERT INTO reels (youtube_id, titulo, descricao, tipo, area, canal) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, String(item.titulo || info.titulo || 'Vídeo').slice(0, 100), String(item.descricao || '').slice(0, 500),
       TIPOS.includes(item.tipo) ? item.tipo : 'dica', AREAS.includes(item.area) ? item.area : null, info.canal || null]
    );
    novos++;
  }
  if (novos) console.log(`🎬 ${novos} reels publicados a partir de reels-iniciais.json`);
  return novos;
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
        `SELECT r.id, r.youtube_id, r.titulo, r.descricao, r.tipo, r.area, r.canal, r.created_at,
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

  // Para o formulário preencher título e canal sozinho ao colar o link.
  app.get('/api/reels/info', exigirModerador, async (req, res) => {
    const id = idDoYoutube(req.query.link);
    if (!id) return res.status(400).json({ error: 'Link inválido.' });
    const info = await infoDoYoutube(id);
    if (info.indisponivel) return res.status(422).json({ error: 'Esse vídeo não pode ser mostrado fora do YouTube (é privado ou o dono não deixa).' });
    res.json({ youtube_id: id, ...info });
  });

  app.post('/api/reels', exigirModerador, async (req, res) => {
    const c = req.body || {};
    const youtubeId = idDoYoutube(c.link);
    if (!youtubeId) return res.status(400).json({ error: 'Cole o link de um vídeo do YouTube (Shorts ou normal).' });
    const info = await infoDoYoutube(youtubeId);
    if (info.indisponivel) return res.status(422).json({ error: 'Esse vídeo não pode ser mostrado fora do YouTube (é privado ou o dono não deixa).' });
    const titulo = (typeof c.titulo === 'string' && c.titulo.trim()) || info.titulo || '';
    const descricao = typeof c.descricao === 'string' ? c.descricao.trim() : '';
    if (!titulo || titulo.length > 100) return res.status(400).json({ error: 'Escreva um título (até 100 caracteres).' });
    if (descricao.length > 500) return res.status(400).json({ error: 'A descrição pode ter até 500 caracteres.' });
    if (!TIPOS.includes(c.tipo)) return res.status(400).json({ error: 'Escolha se é resolução ou dica.' });
    if (c.area && !AREAS.includes(c.area)) return res.status(400).json({ error: 'Área inválida.' });
    try {
      const { rows } = await pool.query(
        `INSERT INTO reels (autor_id, youtube_id, titulo, descricao, tipo, area, canal)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [req.usuario.id, youtubeId, titulo, descricao, c.tipo, c.area || null, info.canal || null]
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
      const r = await pool.query('DELETE FROM reels WHERE id = $1 RETURNING youtube_id', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Reel não encontrado.' });
      // Não volta pela lista de reels iniciais na próxima vez que o servidor subir.
      await pool.query('INSERT INTO reels_ignorados (youtube_id) VALUES ($1) ON CONFLICT DO NOTHING', [r.rows[0].youtube_id]);
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
module.exports.infoDoYoutube = infoDoYoutube;
module.exports.publicarReelsIniciais = publicarReelsIniciais;
