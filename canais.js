// Canais automáticos dos Reels: a equipe escolhe canais do YouTube e o servidor
// confere de 3 em 3 horas se eles postaram Shorts novos. Cada vídeo novo entra
// na fila de aprovação dos Reels (ou direto no ar, se o canal for marcado como
// confiável). Usa o feed público do canal: não precisa de chave do YouTube.
//
// O TikTok não tem feed público, então só o YouTube entra aqui.

const { infoDoVideo } = require('./reels');

const INTERVALO = 3 * 60 * 60 * 1000;
const POR_BUSCA = 5;         // no máximo 5 vídeos novos por canal a cada busca
const DIAS_ATRAS = 30;       // ao seguir um canal, traz os Shorts do último mês
const TIPOS = ['resolucao', 'dica'];
const AREAS = ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'];
// Sem isso, servidor na Europa recebe a página de consentimento de cookies.
const CABECALHOS = { 'User-Agent': 'Mozilla/5.0 (M&M Estudos)', Cookie: 'SOCS=CAI; CONSENT=YES+1', 'Accept-Language': 'pt-BR' };

const ID_CANAL = /^UC[\w-]{22}$/;

// youtube.com/channel/UC..., youtube.com/@nome (e /@nome/shorts), ou o código UC... sozinho.
function lerLinkCanal(link) {
  const texto = typeof link === 'string' ? link.trim() : '';
  if (ID_CANAL.test(texto)) return { id: texto };
  if (/^@[\w.-]{3,30}$/.test(texto)) return { handle: texto };
  let url;
  try { url = new URL(texto); } catch (e) { return null; }
  const host = url.hostname.replace(/^(www|m)\./, '');
  if (url.protocol !== 'https:' || host !== 'youtube.com') return null;
  const canal = url.pathname.match(/^\/channel\/(UC[\w-]{22})(\/|$)/);
  if (canal) return { id: canal[1] };
  const handle = url.pathname.match(/^\/(@[\w.-]{3,30})(\/|$)/);
  return handle ? { handle: handle[1] } : null;
}

// @nome -> UC...: o código aparece no HTML da página do canal.
async function idDoHandle(handle, buscar = fetch) {
  try {
    const r = await buscar(`https://www.youtube.com/${handle}`, { headers: CABECALHOS, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/channel_id=(UC[\w-]{22})/) || html.match(/"(?:externalId|channelId)":"(UC[\w-]{22})"/);
    return m ? m[1] : null;
  } catch (e) { return null; }
}

const desfazer = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// Feed do canal: os 15 vídeos mais recentes, com código, título e data.
function lerFeed(xml) {
  const nome = (xml.match(/<author>\s*<name>([^<]*)<\/name>/) || [])[1];
  const videos = [];
  for (const bloco of xml.split('<entry>').slice(1)) {
    const id = (bloco.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1];
    const titulo = (bloco.match(/<title>([^<]*)<\/title>/) || [])[1];
    const data = (bloco.match(/<published>([^<]+)<\/published>/) || [])[1];
    if (id) videos.push({ id, titulo: titulo ? desfazer(titulo).trim() : '', publicado: data ? new Date(data) : null });
  }
  return { nome: nome ? desfazer(nome).trim() : null, videos };
}

async function buscarFeed(canalId, buscar = fetch) {
  const r = await buscar(`https://www.youtube.com/feeds/videos.xml?channel_id=${canalId}`, { headers: CABECALHOS, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`feed respondeu ${r.status}`);
  return lerFeed(await r.text());
}

// Short abre em /shorts/ID; vídeo comum é mandado para /watch. Na dúvida, aceita
// (vai para a fila e um administrador decide).
async function ehShort(id, buscar = fetch) {
  try {
    const r = await buscar(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual', headers: CABECALHOS, signal: AbortSignal.timeout(8000) });
    if (r.status >= 300 && r.status < 400) return !/\/watch/.test(r.headers.get('location') || '');
    return true;
  } catch (e) { return true; }
}

async function buscarNovos(pool, buscar = fetch) {
  const { rows: canais } = await pool.query('SELECT * FROM reels_canais ORDER BY id');
  let novos = 0;
  for (const c of canais) {
    try {
      const feed = await buscarFeed(c.canal_id, buscar);
      let deste = 0;
      for (const v of feed.videos) {
        if (deste >= POR_BUSCA) break;
        if (v.publicado && v.publicado < new Date(c.desde)) continue;
        const ja = await pool.query('SELECT 1 FROM reels WHERE youtube_id = $1 UNION ALL SELECT 1 FROM reels_ignorados WHERE youtube_id = $1', [v.id]);
        if (ja.rowCount) continue;
        if (!await ehShort(v.id, buscar)) { await pool.query('INSERT INTO reels_ignorados (youtube_id) VALUES ($1) ON CONFLICT DO NOTHING', [v.id]); continue; }
        const info = await infoDoVideo(`https://youtube.com/shorts/${v.id}`, buscar);
        if (!info || info.indisponivel) { await pool.query('INSERT INTO reels_ignorados (youtube_id) VALUES ($1) ON CONFLICT DO NOTHING', [v.id]); continue; }
        await pool.query(
          `INSERT INTO reels (youtube_id, plataforma, link, titulo, descricao, tipo, area, canal, status)
           VALUES ($1, 'youtube', $2, $3, '', $4, $5, $6, $7)`,
          [v.id, `https://youtube.com/shorts/${v.id}`, (v.titulo || info.titulo || 'Vídeo').slice(0, 100), c.tipo, c.area,
           (feed.nome || c.nome || info.canal || '').slice(0, 100) || null, c.direto ? 'aprovado' : 'pendente']);
        deste++; novos++;
      }
      await pool.query('UPDATE reels_canais SET ultima_busca = NOW(), ultimo_erro = NULL, nome = COALESCE($2, nome) WHERE id = $1', [c.id, feed.nome]);
    } catch (erro) {
      await pool.query('UPDATE reels_canais SET ultima_busca = NOW(), ultimo_erro = $2 WHERE id = $1', [c.id, String(erro.message).slice(0, 200)]);
    }
  }
  if (novos) console.log(`📡 ${novos} reels novos dos canais automáticos`);
  return novos;
}

function registrarCanais(app, { pool, exigirModerador }) {
  const idValido = v => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

  app.get('/api/reels/canais', exigirModerador, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT c.id, c.canal_id, c.nome, c.area, c.tipo, c.direto, c.ultima_busca, c.ultimo_erro,
                (SELECT COUNT(*)::int FROM reels r WHERE r.canal = c.nome) AS reels
           FROM reels_canais c ORDER BY c.nome`);
      res.json({ canais: rows });
    } catch (erro) {
      console.error('Erro ao listar canais:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os canais agora.' });
    }
  });

  app.post('/api/reels/canais', exigirModerador, async (req, res) => {
    const c = req.body || {};
    const lido = lerLinkCanal(c.link);
    if (!lido) return res.status(400).json({ error: 'Cole o link do canal do YouTube (ex.: youtube.com/@nomedocanal).' });
    if (!TIPOS.includes(c.tipo)) return res.status(400).json({ error: 'Escolha se os vídeos são resoluções ou dicas.' });
    if (c.area && !AREAS.includes(c.area)) return res.status(400).json({ error: 'Área inválida.' });
    const canalId = lido.id || await idDoHandle(lido.handle);
    if (!canalId) return res.status(422).json({ error: 'Não achei esse canal no YouTube. Confira o link.' });
    let feed;
    try { feed = await buscarFeed(canalId); } catch (e) {
      return res.status(502).json({ error: 'O YouTube não respondeu agora. Tente de novo daqui a pouco.' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO reels_canais (canal_id, nome, area, tipo, direto, desde)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${DIAS_ATRAS} days')
         ON CONFLICT (canal_id) DO UPDATE SET area = EXCLUDED.area, tipo = EXCLUDED.tipo, direto = EXCLUDED.direto
         RETURNING id`,
        [canalId, (feed.nome || lido.handle || canalId).slice(0, 100), c.area || null, c.tipo, Boolean(c.direto)]);
      const novos = await buscarNovos(pool).catch(() => 0);
      res.status(201).json({ id: rows[0].id, novos,
        message: `Canal "${feed.nome || canalId}" adicionado. ${novos ? `${novos} vídeo(s) já ${c.direto ? 'no ar' : 'na fila de aprovação'}.` : 'Os próximos Shorts dele entram sozinhos.'}` });
    } catch (erro) {
      console.error('Erro ao adicionar canal:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar o canal agora.' });
    }
  });

  app.delete('/api/reels/canais/:id', exigirModerador, async (req, res) => {
    try {
      await pool.query('DELETE FROM reels_canais WHERE id = $1', [idValido(req.params.id)]);
      res.json({ message: 'Canal removido. Os vídeos que já entraram continuam no site.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui remover agora.' });
    }
  });

  app.post('/api/reels/canais/buscar', exigirModerador, async (req, res) => {
    try {
      const novos = await buscarNovos(pool);
      res.json({ novos, message: novos ? `${novos} vídeo(s) novo(s).` : 'Nenhum vídeo novo nos canais.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui buscar agora.' });
    }
  });
}

module.exports = registrarCanais;
module.exports.INTERVALO = INTERVALO;
module.exports.buscarNovos = buscarNovos;
module.exports.lerLinkCanal = lerLinkCanal;
module.exports.lerFeed = lerFeed;
module.exports.ehShort = ehShort;
module.exports.idDoHandle = idDoHandle;
