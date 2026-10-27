// Reels: vídeos curtos de resolução de questões e dicas, no estilo TikTok.
// O vídeo fica no YouTube ou no TikTok (de qualquer canal); o site guarda só
// o código dele e mostra tudo num feed vertical, com o nome do canal como
// crédito. Administradores publicam direto; alunos enviam e o reel só
// aparece depois que um administrador aprovar.
//
// Séries: um administrador junta reels em episódios numerados (1, 2, 3...).
// Quem tem conta vê "continuar assistindo" com o próximo episódio. Série com
// o selo "Original M&M" é a que vocês mesmos gravaram. Vídeo de outro canal
// continua só incorporado do YouTube ou do TikTok, nunca baixado.
//
// A coluna youtube_id guarda o código do vídeo nas duas plataformas (o nome
// ficou da primeira versão); a coluna plataforma diz de onde ele é.

const fs = require('fs');
const path = require('path');
const imagens = require('./imagens');
const { notificar } = require('./social');

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

// Link do TikTok: tiktok.com/@perfil/video/ID (ID com 15 a 22 dígitos) ou
// os links curtos vt.tiktok.com/..., vm.tiktok.com/... e tiktok.com/t/...,
// que só o próprio TikTok sabe a que vídeo levam.
function lerLinkTiktok(link) {
  if (typeof link !== 'string' || link.length > 300) return null;
  let url;
  try { url = new URL(link.trim()); } catch (e) { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  if (host === 'vt.tiktok.com' || host === 'vm.tiktok.com' || (host === 'tiktok.com' && url.pathname.startsWith('/t/'))) {
    return /^\/(t\/)?[A-Za-z0-9]{5,20}\/?$/.test(url.pathname) ? { curto: true, url: `https://${url.hostname}${url.pathname}` } : null;
  }
  if (host !== 'tiktok.com') return null;
  const m = url.pathname.match(/^\/(?:@[\w.-]+\/video|embed\/v2|player\/v1)\/(\d{15,22})/);
  return m ? { id: m[1], url: `https://www.tiktok.com${url.pathname}` } : null;
}

// Pelo oEmbed do TikTok (público, sem chave): código do vídeo (resolve os
// links curtos), legenda e criador. Vídeo apagado ou privado responde erro.
async function infoDoTiktok(link, buscar = fetch) {
  const lido = lerLinkTiktok(link);
  if (!lido) return null;
  try {
    const r = await buscar(`https://www.tiktok.com/oembed?url=${encodeURIComponent(lido.url)}`, { signal: AbortSignal.timeout(8000) });
    if (r.status === 400 || r.status === 403 || r.status === 404) return { indisponivel: true };
    if (!r.ok) throw new Error('oEmbed ' + r.status);
    const d = await r.json();
    const id = /^\d{15,22}$/.test(String(d.embed_product_id)) ? String(d.embed_product_id) : lido.id;
    if (!id) return { indisponivel: true };
    const perfil = typeof d.author_url === 'string' && /^https:\/\/www\.tiktok\.com\/@[\w.-]+$/.test(d.author_url) ? d.author_url : null;
    return {
      plataforma: 'tiktok', id,
      titulo: typeof d.title === 'string' && d.title.trim() ? d.title.trim().slice(0, 100) : undefined,
      canal: typeof d.author_name === 'string' ? d.author_name.trim().slice(0, 100) : undefined,
      link: perfil ? `${perfil}/video/${id}` : lido.url
    };
  } catch (e) {
    // Sem rede agora: com o link completo dá para publicar sem os dados
    // automáticos; o link curto precisa do TikTok para saber o vídeo.
    return lido.id ? { plataforma: 'tiktok', id: lido.id, link: lido.url } : {};
  }
}

// Qualquer link aceito (YouTube ou TikTok): { plataforma, id, titulo, canal,
// link }, { indisponivel: true } ou null se o link não é de nenhum dos dois.
async function infoDoVideo(link, buscar = fetch) {
  const youtube = idDoYoutube(link);
  if (youtube) return { plataforma: 'youtube', id: youtube, link: `https://youtube.com/shorts/${youtube}`, ...await infoDoYoutube(youtube, buscar) };
  return infoDoTiktok(link, buscar);
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
    // Link completo já diz o código: dá para pular sem perguntar à plataforma.
    const direto = idDoYoutube(item.link) || lerLinkTiktok(item.link)?.id;
    if (direto && await jaConhecido(pool, direto)) continue;
    const info = await infoDoVideo(item.link);
    if (!info) { console.warn('🎬 Link inválido em reels-iniciais.json:', item.link); continue; }
    if (info.indisponivel) { console.warn('🎬 Vídeo indisponível fora da plataforma, pulei:', item.link); continue; }
    if (!info.id) { console.warn('🎬 Não consegui ler o link agora, tento na próxima vez:', item.link); continue; }
    if (await jaConhecido(pool, info.id)) continue;
    await pool.query(
      `INSERT INTO reels (youtube_id, plataforma, link, titulo, descricao, tipo, area, canal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [info.id, info.plataforma, info.link, String(item.titulo || info.titulo || 'Vídeo').slice(0, 100), String(item.descricao || '').slice(0, 500),
       TIPOS.includes(item.tipo) ? item.tipo : 'dica', AREAS.includes(item.area) ? item.area : null, info.canal || null]
    );
    novos++;
  }
  if (novos) console.log(`🎬 ${novos} reels publicados a partir de reels-iniciais.json`);
  return novos;
}

async function jaConhecido(pool, id) {
  const r = await pool.query('SELECT 1 FROM reels WHERE youtube_id = $1 UNION ALL SELECT 1 FROM reels_ignorados WHERE youtube_id = $1', [id]);
  return r.rowCount > 0;
}

function registrarReels(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  const freioCurtir = limitar(auth.criarFreio(300, 60 * 60 * 1000), 'Calma! Muitas curtidas em pouco tempo.', req => `u${req.usuario.id}`);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  const ENVIADOS_POR_DIA = 5;
  const freioEnviar = limitar(auth.criarFreio(ENVIADOS_POR_DIA, 24 * 60 * 60 * 1000), `Você pode enviar até ${ENVIADOS_POR_DIA} reels por dia.`, req => `u${req.usuario.id}`);
  const soAdminSemFreio = (req, res, next) => (req.usuario && req.usuario.admin ? next() : freioEnviar(req, res, next));

  async function listar(req, res, { salvos, pendentes = false }) {
    const eu = req.usuario;
    const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : null;
    const area = AREAS.includes(req.query.area) ? req.query.area : null;
    const antesDe = idValido(req.query.antes); // paginação: reels mais antigos que este id
    const serie = idValido(req.query.serie);  // uma série inteira, na ordem dos episódios
    try {
      const { rows } = await pool.query(
        `SELECT r.id, r.youtube_id, COALESCE(r.plataforma, 'youtube') AS plataforma, r.link, r.titulo, r.descricao, r.tipo, r.area, r.canal, r.created_at,
                (SELECT COUNT(*)::int FROM reels_curtidas c WHERE c.reel_id = r.id) AS curtidas,
                EXISTS (SELECT 1 FROM reels_curtidas c WHERE c.reel_id = r.id AND c.usuario_id = $1) AS curti,
                EXISTS (SELECT 1 FROM reels_salvos s WHERE s.reel_id = r.id AND s.usuario_id = $1) AS salvei,
                (SELECT COUNT(*)::int FROM reels_comentarios m WHERE m.reel_id = r.id AND NOT m.oculto) AS comentarios,
                r.status, a.username AS enviado_por,
                r.serie_id, r.episodio, se.titulo AS serie_titulo, COALESCE(se.original, FALSE) AS original,
                EXISTS (SELECT 1 FROM reels_assistidos v WHERE v.reel_id = r.id AND v.usuario_id = $1) AS assistido
           FROM reels r LEFT JOIN usuarios a ON a.id = r.autor_id LEFT JOIN reels_series se ON se.id = r.serie_id
          WHERE r.status = $6 AND ($2::text IS NULL OR r.tipo = $2) AND ($3::text IS NULL OR r.area = $3)
            AND ($4::int IS NULL OR r.id < $4)
            AND (NOT $5 OR EXISTS (SELECT 1 FROM reels_salvos s WHERE s.reel_id = r.id AND s.usuario_id = $1))
            AND ($7::int IS NULL OR r.serie_id = $7)
          ORDER BY ${serie ? 'r.episodio, r.id' : 'r.id DESC'}
          LIMIT ${serie ? 200 : POR_PAGINA}`,
        [eu ? eu.id : null, tipo, area, serie ? null : antesDe, salvos, pendentes ? 'pendente' : 'aprovado', serie]
      );
      const admin = Boolean(eu && eu.admin);
      const naFila = admin ? (await pool.query(`SELECT COUNT(*)::int AS n FROM reels WHERE status = 'pendente'`)).rows[0].n : 0;
      // Quem enviou só aparece para administradores (na fila de aprovação).
      res.json({ reels: rows.map(r => (admin ? r : { ...r, enviado_por: undefined })), mais: !serie && rows.length === POR_PAGINA, moderador: admin, pendentes: naFila });
    } catch (erro) {
      console.error('Erro ao listar reels:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os reels agora.' });
    }
  }

  app.get('/api/reels', (req, res) => listar(req, res, { salvos: false }));
  app.get('/api/reels/salvos', exigirLogin, (req, res) => listar(req, res, { salvos: true }));
  app.get('/api/reels/pendentes', exigirModerador, (req, res) => listar(req, res, { salvos: false, pendentes: true }));

  // Aprovar põe o reel no ar; recusar apaga. Nos dois casos, quem enviou é avisado.
  for (const acao of ['aprovar', 'recusar']) {
    app.post(`/api/reels/:id/${acao}`, exigirModerador, async (req, res) => {
      const id = idValido(req.params.id);
      if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
      try {
        const r = acao === 'aprovar'
          ? await pool.query(`UPDATE reels SET status = 'aprovado', created_at = NOW() WHERE id = $1 AND status = 'pendente' RETURNING autor_id, titulo`, [id])
          : await pool.query(`DELETE FROM reels WHERE id = $1 AND status = 'pendente' RETURNING autor_id, titulo`, [id]);
        if (!r.rowCount) return res.status(404).json({ error: 'Esse reel não está esperando aprovação.' });
        await notificar(pool, { usuarioId: r.rows[0].autor_id, atorId: req.usuario.id, tipo: acao === 'aprovar' ? 'reel_aprovado' : 'reel_recusado',
          alvoTipo: 'reel', alvoId: acao === 'aprovar' ? id : null, texto: r.rows[0].titulo });
        res.json({ message: acao === 'aprovar' ? 'Reel aprovado e no ar!' : 'Reel recusado.' });
      } catch (erro) {
        console.error(`Erro ao ${acao} reel:`, erro.message);
        res.status(500).json({ error: 'Não deu certo agora.' });
      }
    });
  }

  // Para o formulário preencher título e canal sozinho ao colar o link.
  const INDISPONIVEL = 'Esse vídeo não pode ser mostrado fora da plataforma (é privado, foi apagado ou o dono não deixa).';
  const LINK_INVALIDO = 'Cole o link de um vídeo do YouTube ou do TikTok.';

  app.get('/api/reels/info', exigirLogin, async (req, res) => {
    const info = await infoDoVideo(req.query.link);
    if (!info) return res.status(400).json({ error: LINK_INVALIDO });
    if (info.indisponivel) return res.status(422).json({ error: INDISPONIVEL });
    res.json(info);
  });

  app.post('/api/reels', exigirLogin, soAdminSemFreio, async (req, res) => {
    const c = req.body || {};
    const info = await infoDoVideo(c.link);
    if (!info) return res.status(400).json({ error: LINK_INVALIDO });
    if (info.indisponivel) return res.status(422).json({ error: INDISPONIVEL });
    if (!info.id) return res.status(502).json({ error: 'Não consegui falar com o TikTok para ler esse link. Tente de novo ou use o link completo do vídeo.' });
    const titulo = (typeof c.titulo === 'string' && c.titulo.trim()) || info.titulo || '';
    const descricao = typeof c.descricao === 'string' ? c.descricao.trim() : '';
    if (!titulo || titulo.length > 100) return res.status(400).json({ error: 'Escreva um título (até 100 caracteres).' });
    if (descricao.length > 500) return res.status(400).json({ error: 'A descrição pode ter até 500 caracteres.' });
    if (!TIPOS.includes(c.tipo)) return res.status(400).json({ error: 'Escolha se é resolução ou dica.' });
    if (c.area && !AREAS.includes(c.area)) return res.status(400).json({ error: 'Área inválida.' });
    try {
      const { rows } = await pool.query(
        `INSERT INTO reels (autor_id, youtube_id, plataforma, link, titulo, descricao, tipo, area, canal, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [req.usuario.id, info.id, info.plataforma, info.link, titulo, descricao, c.tipo, c.area || null, info.canal || null,
         req.usuario.admin ? 'aprovado' : 'pendente']
      );
      res.status(201).json({ id: rows[0].id, pendente: !req.usuario.admin,
        message: req.usuario.admin ? 'Reel publicado!' : 'Enviado! O reel aparece assim que um administrador aprovar.' });
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

  // ---------- comentários ----------
  // Conversa dos alunos sobre o vídeo. Ler é livre, como no feed; escrever
  // exige conta. Com 3 denúncias o comentário some até um administrador ver.
  const DENUNCIAS_PARA_ESCONDER = 3;
  const freioComentar = limitar(auth.criarFreio(15, 10 * 60 * 1000), 'Você comentou muito em pouco tempo. Espere uns minutos.', req => `u${req.usuario.id}`);
  const freioDenunciar = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', req => `u${req.usuario.id}`);

  app.get('/api/reels/:id/comentarios', async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
    const eu = req.usuario;
    const admin = Boolean(eu && eu.admin);
    try {
      const { rows } = await pool.query(
        `SELECT m.id, m.texto, m.created_at, m.oculto, u.id AS autor_id, u.username AS autor, u.foto_id,
                EXISTS (SELECT 1 FROM reels_comentarios_denuncias d WHERE d.comentario_id = m.id AND d.usuario_id = $2) AS denunciei
           FROM reels_comentarios m JOIN usuarios u ON u.id = m.usuario_id
          WHERE m.reel_id = $1 AND (NOT m.oculto OR $3)
          ORDER BY m.id DESC LIMIT 200`,
        [id, eu ? eu.id : null, admin]
      );
      res.json({
        comentarios: rows.map(m => ({
          id: m.id, texto: m.texto, created_at: m.created_at, autor_id: m.autor_id, autor: m.autor,
          // A foto do perfil só vai para quem está logado, como no perfil.
          foto: eu ? imagens.urlAssinada(m.foto_id) : null,
          meu: Boolean(eu && eu.id === m.autor_id), pode_apagar: Boolean(eu && (eu.id === m.autor_id || admin)),
          denunciei: m.denunciei, ...(admin ? { oculto: m.oculto } : {})
        })),
        moderador: admin
      });
    } catch (erro) {
      console.error('Erro ao listar comentários:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os comentários agora.' });
    }
  });

  app.post('/api/reels/:id/comentarios', exigirLogin, freioComentar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto) return res.status(400).json({ error: 'Escreva alguma coisa.' });
    if (texto.length > 500) return res.status(400).json({ error: 'O comentário pode ter até 500 caracteres.' });
    try {
      const r = await pool.query(
        `INSERT INTO reels_comentarios (reel_id, usuario_id, texto)
         SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM reels WHERE id = $1) RETURNING id`,
        [id, req.usuario.id, texto]
      );
      if (r.rowCount === 0) return res.status(404).json({ error: 'Reel não encontrado.' });
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao comentar:', erro.message);
      res.status(500).json({ error: 'Não consegui publicar o comentário agora.' });
    }
  });

  app.delete('/api/reels/comentarios/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      const r = await pool.query('DELETE FROM reels_comentarios WHERE id = $1 AND (usuario_id = $2 OR $3)',
        [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Comentário não encontrado ou não é seu.' });
      res.json({ message: 'Comentário apagado.' });
    } catch (erro) {
      console.error('Erro ao apagar comentário:', erro.message);
      res.status(500).json({ error: 'Não consegui apagar agora.' });
    }
  });

  app.post('/api/reels/comentarios/:id/denunciar', exigirLogin, freioDenunciar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      const c = await pool.query('SELECT usuario_id FROM reels_comentarios WHERE id = $1', [id]);
      if (!c.rows[0]) return res.status(404).json({ error: 'Comentário não encontrado.' });
      if (c.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar o próprio comentário.' });
      await pool.query('INSERT INTO reels_comentarios_denuncias (comentario_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.usuario.id]);
      await pool.query(
        `UPDATE reels_comentarios SET oculto = TRUE
          WHERE id = $1 AND (SELECT COUNT(*) FROM reels_comentarios_denuncias WHERE comentario_id = $1) >= $2`,
        [id, DENUNCIAS_PARA_ESCONDER]
      );
      res.json({ message: 'Obrigado! A denúncia foi registrada.' });
    } catch (erro) {
      console.error('Erro ao denunciar comentário:', erro.message);
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  // ---------- séries ----------
  // Lista das séries com quantos episódios têm e, com conta, quantos a
  // pessoa já viu e qual é o próximo (o primeiro da ordem que ela não viu).
  app.get('/api/reels/series', async (req, res) => {
    const eu = req.usuario ? req.usuario.id : null;
    try {
      const { rows } = await pool.query(
        `SELECT s.id, s.titulo, s.descricao, s.original, s.area,
                COUNT(r.id)::int AS episodios,
                COUNT(v.reel_id)::int AS assistidos,
                MAX(v.assistido_em) AS visto_em,
                (ARRAY_AGG(r.id ORDER BY r.episodio, r.id) FILTER (WHERE v.reel_id IS NULL))[1] AS proximo_id,
                (ARRAY_AGG(r.episodio ORDER BY r.episodio, r.id) FILTER (WHERE v.reel_id IS NULL))[1] AS proximo_episodio,
                (ARRAY_AGG(r.youtube_id ORDER BY r.episodio, r.id))[1] AS capa_id,
                (ARRAY_AGG(COALESCE(r.plataforma, 'youtube') ORDER BY r.episodio, r.id))[1] AS capa_plataforma
           FROM reels_series s
           LEFT JOIN reels r ON r.serie_id = s.id AND r.status = 'aprovado'
           LEFT JOIN reels_assistidos v ON v.reel_id = r.id AND v.usuario_id = $1
          GROUP BY s.id
          ORDER BY s.original DESC, s.id DESC`, [eu]);
      const series = rows.filter(s => s.episodios > 0 || (req.usuario && req.usuario.admin));
      const continuar = series.filter(s => s.assistidos > 0 && s.proximo_id).sort((a, b) => new Date(b.visto_em) - new Date(a.visto_em));
      res.json({ series, continuar });
    } catch (erro) {
      console.error('Erro ao listar séries:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar as séries agora.' });
    }
  });

  const lerSerie = c => {
    const titulo = typeof c.titulo === 'string' ? c.titulo.trim() : '';
    const descricao = typeof c.descricao === 'string' ? c.descricao.trim() : '';
    if (!titulo || titulo.length > 80) return { erro: 'Dê um nome para a série (até 80 caracteres).' };
    if (descricao.length > 300) return { erro: 'A descrição pode ter até 300 caracteres.' };
    if (c.area && !AREAS.includes(c.area)) return { erro: 'Área inválida.' };
    return { titulo, descricao, original: c.original === true, area: c.area || null };
  };

  app.post('/api/reels/series', exigirModerador, async (req, res) => {
    const s = lerSerie(req.body || {});
    if (s.erro) return res.status(400).json({ error: s.erro });
    try {
      const { rows } = await pool.query(
        'INSERT INTO reels_series (titulo, descricao, original, area, criador_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [s.titulo, s.descricao, s.original, s.area, req.usuario.id]);
      res.status(201).json({ id: rows[0].id, message: 'Série criada!' });
    } catch (erro) {
      console.error('Erro ao criar série:', erro.message);
      res.status(500).json({ error: 'Não consegui criar a série agora.' });
    }
  });

  app.put('/api/reels/series/:id', exigirModerador, async (req, res) => {
    const s = lerSerie(req.body || {});
    if (s.erro) return res.status(400).json({ error: s.erro });
    try {
      const r = await pool.query('UPDATE reels_series SET titulo = $1, descricao = $2, original = $3, area = $4 WHERE id = $5',
        [s.titulo, s.descricao, s.original, s.area, idValido(req.params.id)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Série não encontrada.' });
      res.json({ message: 'Série atualizada.' });
    } catch (erro) {
      console.error('Erro ao editar série:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar agora.' });
    }
  });

  // Apagar a série não apaga os vídeos: eles voltam a ser reels avulsos.
  app.delete('/api/reels/series/:id', exigirModerador, async (req, res) => {
    try {
      const r = await pool.query('DELETE FROM reels_series WHERE id = $1', [idValido(req.params.id)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Série não encontrada.' });
      res.json({ message: 'Série apagada. Os vídeos continuam como reels avulsos.' });
    } catch (erro) {
      console.error('Erro ao apagar série:', erro.message);
      res.status(500).json({ error: 'Não consegui apagar agora.' });
    }
  });

  // Põe um reel numa série (sem número, vira o último episódio) ou tira dela.
  app.put('/api/reels/:id/serie', exigirModerador, async (req, res) => {
    const id = idValido(req.params.id);
    const serie = req.body?.serie_id === null ? null : idValido(req.body?.serie_id);
    if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
    if (req.body?.serie_id !== null && !serie) return res.status(400).json({ error: 'Escolha a série.' });
    let episodio = req.body?.episodio == null || req.body.episodio === '' ? null : Number(req.body.episodio);
    if (episodio !== null && !(Number.isInteger(episodio) && episodio >= 1 && episodio <= 999)) return res.status(400).json({ error: 'O episódio é um número de 1 a 999.' });
    try {
      if (serie) {
        if (!(await pool.query('SELECT 1 FROM reels_series WHERE id = $1', [serie])).rowCount) return res.status(404).json({ error: 'Série não encontrada.' });
        if (episodio === null) {
          episodio = (await pool.query('SELECT COALESCE(MAX(episodio), 0)::int + 1 AS n FROM reels WHERE serie_id = $1 AND id <> $2', [serie, id])).rows[0].n;
        }
      }
      const r = await pool.query('UPDATE reels SET serie_id = $1, episodio = $2 WHERE id = $3', [serie, serie ? episodio : null, id]);
      if (!r.rowCount) return res.status(404).json({ error: 'Reel não encontrado.' });
      res.json({ serie_id: serie, episodio: serie ? episodio : null, message: serie ? `Agora é o episódio ${episodio}.` : 'O reel saiu da série.' });
    } catch (erro) {
      console.error('Erro ao pôr reel na série:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar agora.' });
    }
  });

  // O site avisa depois de alguns segundos do vídeo tocando.
  app.post('/api/reels/:id/assistido', exigirLogin, freioCurtir, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Reel não encontrado.' });
    try {
      await pool.query(
        `INSERT INTO reels_assistidos (reel_id, usuario_id) SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM reels WHERE id = $1)
         ON CONFLICT (reel_id, usuario_id) DO UPDATE SET assistido_em = NOW()`, [id, req.usuario.id]);
      res.status(204).end();
    } catch (erro) {
      console.error('Erro ao marcar reel assistido:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
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
module.exports.lerLinkTiktok = lerLinkTiktok;
module.exports.infoDoTiktok = infoDoTiktok;
module.exports.infoDoVideo = infoDoVideo;
module.exports.publicarReelsIniciais = publicarReelsIniciais;
