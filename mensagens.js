// Mensagens diretas entre perfis.
//
// Muita gente aqui é menor de idade, então a conversa vem com freios:
// - cada pessoa escolhe quem pode mandar mensagem (todos, quem eu sigo, ninguém);
// - bloquear corta a conversa nos dois sentidos;
// - links não passam (é o caminho mais comum para levar alguém para fora do site);
// - limite de mensagens e de conversas novas por dia;
// - denúncia leva a mensagem para a administração ler.

const imagens = require('./imagens');
const { notificar } = require('./social');

const TAMANHO_MAXIMO = 1000;
const CONVERSAS_NOVAS_POR_DIA = 20;
const QUEM_PODE = ['todos', 'seguindo', 'ninguem'];
const TEM_LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|br|me|io|gg|app|xyz|site|link|ly)\b)/i;

const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

function registrarMensagens(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  const freioEnviar = limitar(auth.criarFreio(30, 60 * 1000), 'Calma! Muitas mensagens seguidas. Espere um pouco.', req => `m${req.usuario.id}`);
  const freioDia = limitar(auth.criarFreio(300, 24 * 3600 * 1000), 'Você chegou ao limite de mensagens de hoje.', req => `md${req.usuario.id}`);

  const bloqueado = async (a, b) => (await pool.query(
    'SELECT 1 FROM bloqueios WHERE (usuario_id = $1 AND bloqueado_id = $2) OR (usuario_id = $2 AND bloqueado_id = $1) LIMIT 1', [a, b])).rowCount > 0;

  // Lista de conversas: a última mensagem de cada uma e quantas não lidas.
  app.get('/api/mensagens', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `WITH minhas AS (
           SELECT m.*, CASE WHEN m.de_id = $1 THEN m.para_id ELSE m.de_id END AS outro_id
             FROM mensagens m WHERE m.de_id = $1 OR m.para_id = $1)
         SELECT DISTINCT ON (outro_id) outro_id, texto, created_at, de_id = $1 AS minha,
                (SELECT COUNT(*)::int FROM minhas x WHERE x.outro_id = minhas.outro_id AND x.para_id = $1 AND NOT x.lida) AS nao_lidas
           FROM minhas ORDER BY outro_id, id DESC`, [req.usuario.id]);
      const ids = rows.map(r => r.outro_id);
      const pessoas = ids.length ? (await pool.query('SELECT id, username, foto_id FROM usuarios WHERE id = ANY($1)', [ids])).rows : [];
      const porId = new Map(pessoas.map(p => [p.id, p]));
      const conversas = rows.filter(r => porId.has(r.outro_id)).map(r => {
        const p = porId.get(r.outro_id);
        return { id: p.id, nome: p.username, foto: imagens.urlAssinada(p.foto_id), texto: r.texto, minha: r.minha, quando: r.created_at, nao_lidas: r.nao_lidas };
      }).sort((a, b) => new Date(b.quando) - new Date(a.quando));
      res.json({ conversas });
    } catch (erro) {
      console.error('Erro ao listar conversas:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar as mensagens agora.' });
    }
  });

  app.get('/api/mensagens/nao-lidas', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM mensagens WHERE para_id = $1 AND NOT lida', [req.usuario.id]);
      res.json({ nao_lidas: rows[0].n });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui contar as mensagens.' });
    }
  });

  app.put('/api/mensagens/preferencia', exigirLogin, async (req, res) => {
    const quem = String((req.body || {}).quem || '');
    if (!QUEM_PODE.includes(quem)) return res.status(400).json({ error: 'Escolha inválida.' });
    try {
      await pool.query('UPDATE usuarios SET quem_mensagem = $1 WHERE id = $2', [quem, req.usuario.id]);
      res.json({ quem });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui salvar agora.' });
    }
  });

  app.get('/api/mensagens/preferencia', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT COALESCE(u.quem_mensagem, 'todos') AS quem,
                COALESCE((SELECT json_agg(json_build_object('id', b.bloqueado_id, 'nome', x.username) ORDER BY b.created_at DESC)
                            FROM bloqueios b JOIN usuarios x ON x.id = b.bloqueado_id WHERE b.usuario_id = u.id), '[]') AS bloqueados
           FROM usuarios u WHERE u.id = $1`, [req.usuario.id]);
      res.json(rows[0]);
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });

  // Uma conversa (as últimas 200) e marca como lidas as que chegaram.
  app.get('/api/mensagens/:id', exigirLogin, async (req, res) => {
    const outro = idValido(req.params.id);
    if (!outro || outro === req.usuario.id) return res.status(404).json({ error: 'Conversa não encontrada.' });
    try {
      const pessoa = (await pool.query('SELECT id, username, foto_id FROM usuarios WHERE id = $1', [outro])).rows[0];
      if (!pessoa) return res.status(404).json({ error: 'Perfil não encontrado.' });
      const { rows } = await pool.query(
        `SELECT * FROM (SELECT id, de_id = $1 AS minha, texto, created_at, denunciada FROM mensagens
                          WHERE (de_id = $1 AND para_id = $2) OR (de_id = $2 AND para_id = $1)
                          ORDER BY id DESC LIMIT 200) x ORDER BY id`, [req.usuario.id, outro]);
      await pool.query('UPDATE mensagens SET lida = TRUE WHERE para_id = $1 AND de_id = $2 AND NOT lida', [req.usuario.id, outro]);
      const eu = await pool.query('SELECT 1 FROM bloqueios WHERE usuario_id = $1 AND bloqueado_id = $2', [req.usuario.id, outro]);
      res.json({
        pessoa: { id: pessoa.id, nome: pessoa.username, foto: imagens.urlAssinada(pessoa.foto_id) },
        mensagens: rows, bloqueei: eu.rowCount > 0
      });
    } catch (erro) {
      console.error('Erro ao abrir conversa:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir a conversa agora.' });
    }
  });

  app.post('/api/mensagens/:id', exigirLogin, freioEnviar, freioDia, async (req, res) => {
    const outro = idValido(req.params.id);
    const texto = String((req.body || {}).texto || '').trim();
    if (!outro || outro === req.usuario.id) return res.status(400).json({ error: 'Não dá para mandar mensagem para esse perfil.' });
    if (!texto) return res.status(400).json({ error: 'Escreva alguma coisa.' });
    if (texto.length > TAMANHO_MAXIMO) return res.status(400).json({ error: `Mensagem grande demais (máximo de ${TAMANHO_MAXIMO} letras).` });
    if (TEM_LINK.test(texto)) return res.status(400).json({ error: 'Links não são permitidos nas mensagens.' });
    try {
      const pessoa = (await pool.query(`SELECT id, COALESCE(quem_mensagem, 'todos') AS quem FROM usuarios WHERE id = $1`, [outro])).rows[0];
      if (!pessoa) return res.status(404).json({ error: 'Perfil não encontrado.' });
      if (await bloqueado(req.usuario.id, outro)) return res.status(403).json({ error: 'Não dá para conversar com esse perfil.' });
      const jaConversam = (await pool.query(
        'SELECT 1 FROM mensagens WHERE (de_id = $1 AND para_id = $2) OR (de_id = $2 AND para_id = $1) LIMIT 1', [req.usuario.id, outro])).rowCount > 0;
      if (!jaConversam) {
        if (pessoa.quem === 'ninguem') return res.status(403).json({ error: 'Esse perfil não recebe mensagens.' });
        if (pessoa.quem === 'seguindo') {
          const segue = await pool.query('SELECT 1 FROM seguidores WHERE seguidor_id = $1 AND seguido_id = $2', [outro, req.usuario.id]);
          if (!segue.rowCount) return res.status(403).json({ error: 'Esse perfil só recebe mensagens de quem ele segue.' });
        }
        const novas = await pool.query(
          `SELECT COUNT(DISTINCT para_id)::int AS n FROM mensagens m
            WHERE de_id = $1 AND created_at > NOW() - INTERVAL '1 day'
              AND NOT EXISTS (SELECT 1 FROM mensagens a WHERE a.de_id = m.para_id AND a.para_id = $1)
              AND NOT EXISTS (SELECT 1 FROM mensagens a WHERE a.de_id = $1 AND a.para_id = m.para_id AND a.created_at <= NOW() - INTERVAL '1 day')`,
          [req.usuario.id]);
        if (novas.rows[0].n >= CONVERSAS_NOVAS_POR_DIA) return res.status(429).json({ error: 'Você começou muitas conversas hoje. Tente amanhã.' });
      }
      const { rows } = await pool.query(
        'INSERT INTO mensagens (de_id, para_id, texto) VALUES ($1, $2, $3) RETURNING id, TRUE AS minha, texto, created_at, denunciada',
        [req.usuario.id, outro, texto]);
      await notificar(pool, { usuarioId: outro, atorId: req.usuario.id, tipo: 'mensagem', alvoTipo: 'conversa', alvoId: req.usuario.id, texto });
      res.status(201).json({ mensagem: rows[0] });
    } catch (erro) {
      console.error('Erro ao mandar mensagem:', erro.message);
      res.status(500).json({ error: 'Não consegui mandar agora. Tente de novo.' });
    }
  });

  // Bloquear funciona como interruptor.
  app.post('/api/mensagens/:id/bloquear', exigirLogin, async (req, res) => {
    const outro = idValido(req.params.id);
    if (!outro || outro === req.usuario.id) return res.status(400).json({ error: 'Perfil inválido.' });
    try {
      const saiu = await pool.query('DELETE FROM bloqueios WHERE usuario_id = $1 AND bloqueado_id = $2', [req.usuario.id, outro]);
      if (!saiu.rowCount) {
        await pool.query(`INSERT INTO bloqueios (usuario_id, bloqueado_id) SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM usuarios WHERE id = $2)
                          ON CONFLICT DO NOTHING`, [req.usuario.id, outro]);
      }
      res.json({ bloqueei: !saiu.rowCount });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.post('/api/mensagens/denunciar/:mensagemId', exigirLogin, async (req, res) => {
    const id = idValido(req.params.mensagemId);
    try {
      const r = await pool.query('UPDATE mensagens SET denunciada = TRUE WHERE id = $1 AND para_id = $2', [id, req.usuario.id]);
      if (!r.rowCount) return res.status(404).json({ error: 'Mensagem não encontrada.' });
      res.json({ message: 'Denúncia enviada. A equipe vai ler essa mensagem.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  // Administração: só as mensagens denunciadas, com a conversa em volta.
  app.get('/api/admin/mensagens-denunciadas', exigirModerador, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT m.id, m.texto, m.created_at, m.de_id, d.username AS de, m.para_id, p.username AS para
           FROM mensagens m JOIN usuarios d ON d.id = m.de_id JOIN usuarios p ON p.id = m.para_id
          WHERE m.denunciada ORDER BY m.id DESC LIMIT 100`);
      res.json({ mensagens: rows });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });

  app.delete('/api/admin/mensagens/:mensagemId', exigirModerador, async (req, res) => {
    try {
      await pool.query('DELETE FROM mensagens WHERE id = $1', [idValido(req.params.mensagemId)]);
      res.json({ ok: true });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });
}

module.exports = registrarMensagens;
Object.assign(module.exports, { TEM_LINK, QUEM_PODE });
