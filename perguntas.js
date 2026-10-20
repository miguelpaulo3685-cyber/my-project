// Pergunte à comunidade: o aluno posta uma dúvida, os colegas respondem e
// quem perguntou marca a melhor resposta. Quem ajuda ganha XP e selos.
//
// Tudo só para quem tem conta, como os perfis.

const imagens = require('./imagens');
const { notificar } = require('./social');
const { registrarAtividade } = require('./comunidade');

const AREAS = ['matematica', 'natureza', 'humanas', 'linguagens', 'redacao', 'geral'];
const FILTROS = ['recentes', 'sem_resposta', 'resolvidas', 'minhas'];
const DENUNCIAS_PARA_ESCONDER = 3;
const POR_PAGINA = 20;

function registrarPerguntas(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioPerguntar = limitar(auth.criarFreio(6, 60 * 60 * 1000), 'Você fez muitas perguntas agora. Espere um pouco.', porConta);
  const freioResponder = limitar(auth.criarFreio(20, 10 * 60 * 1000), 'Você respondeu muito em pouco tempo. Espere uns minutos.', porConta);
  const freioVotar = limitar(auth.criarFreio(200, 60 * 60 * 1000), 'Calma! Muitos votos em pouco tempo.', porConta);
  const freioDenunciar = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', porConta);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };
  const pessoa = (id, nome, fotoId) => ({ id, nome, foto: imagens.urlAssinada(fotoId) });

  app.get('/api/perguntas', exigirLogin, async (req, res) => {
    const eu = req.usuario;
    const area = AREAS.includes(req.query.area) ? req.query.area : null;
    const filtro = FILTROS.includes(req.query.filtro) ? req.query.filtro : 'recentes';
    const antes = idValido(req.query.antes);
    try {
      const { rows } = await pool.query(
        `SELECT p.id, p.area, p.titulo, LEFT(p.texto, 220) AS resumo, p.created_at, p.oculto,
                u.id AS autor_id, u.username AS autor, u.foto_id,
                (SELECT COUNT(*)::int FROM perguntas_respostas r WHERE r.pergunta_id = p.id AND NOT r.oculto) AS respostas,
                EXISTS (SELECT 1 FROM perguntas_respostas r WHERE r.id = p.melhor_resposta_id AND NOT r.oculto) AS resolvida
           FROM perguntas p JOIN usuarios u ON u.id = p.usuario_id
          WHERE (NOT p.oculto OR $1) AND ($2::text IS NULL OR p.area = $2) AND ($3::int IS NULL OR p.id < $3)
            AND ($4 <> 'minhas' OR p.usuario_id = $5)
            AND ($4 <> 'sem_resposta' OR NOT EXISTS (SELECT 1 FROM perguntas_respostas r WHERE r.pergunta_id = p.id AND NOT r.oculto))
            AND ($4 <> 'resolvidas' OR EXISTS (SELECT 1 FROM perguntas_respostas r WHERE r.id = p.melhor_resposta_id AND NOT r.oculto))
          ORDER BY p.id DESC LIMIT ${POR_PAGINA + 1}`,
        [Boolean(eu.admin), area, antes, filtro, eu.id]
      );
      res.json({
        perguntas: rows.slice(0, POR_PAGINA).map(p => ({
          id: p.id, area: p.area, titulo: p.titulo, resumo: p.resumo, created_at: p.created_at,
          autor: pessoa(p.autor_id, p.autor, p.foto_id), respostas: p.respostas, resolvida: p.resolvida,
          ...(eu.admin ? { oculto: p.oculto } : {})
        })),
        mais: rows.length > POR_PAGINA
      });
    } catch (erro) {
      console.error('Erro ao listar perguntas:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar as perguntas agora.' });
    }
  });

  app.get('/api/perguntas/:id(\\d+)', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    const eu = req.usuario;
    const admin = Boolean(eu.admin);
    try {
      const p = (await pool.query(
        `SELECT p.*, u.username AS autor, u.foto_id,
                EXISTS (SELECT 1 FROM perguntas_denuncias d WHERE d.alvo_tipo = 'pergunta' AND d.alvo_id = p.id AND d.usuario_id = $2) AS denunciei
           FROM perguntas p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = $1 AND (NOT p.oculto OR $3)`, [id, eu.id, admin]
      )).rows[0];
      if (!p) return res.status(404).json({ error: 'Pergunta não encontrada.' });
      const respostas = (await pool.query(
        `SELECT r.id, r.texto, r.created_at, r.oculto, u.id AS autor_id, u.username AS autor, u.foto_id, COALESCE(u.admin, FALSE) AS autor_admin,
                (SELECT COUNT(*)::int FROM perguntas_respostas_uteis v WHERE v.resposta_id = r.id) AS uteis,
                EXISTS (SELECT 1 FROM perguntas_respostas_uteis v WHERE v.resposta_id = r.id AND v.usuario_id = $2) AS achei_util,
                EXISTS (SELECT 1 FROM perguntas_denuncias d WHERE d.alvo_tipo = 'resposta' AND d.alvo_id = r.id AND d.usuario_id = $2) AS denunciei
           FROM perguntas_respostas r JOIN usuarios u ON u.id = r.usuario_id
          WHERE r.pergunta_id = $1 AND (NOT r.oculto OR $3) ORDER BY r.id`, [id, eu.id, admin]
      )).rows.map(r => ({
        id: r.id, texto: r.texto, created_at: r.created_at, autor: pessoa(r.autor_id, r.autor, r.foto_id), autor_admin: r.autor_admin,
        uteis: r.uteis, achei_util: r.achei_util, denunciei: r.denunciei, melhor: r.id === p.melhor_resposta_id,
        minha: r.autor_id === eu.id, pode_apagar: r.autor_id === eu.id || admin, ...(admin ? { oculto: r.oculto } : {})
      }));
      // A melhor primeiro; depois as mais úteis; empate, a mais antiga.
      respostas.sort((a, b) => (b.melhor - a.melhor) || (b.uteis - a.uteis) || (a.id - b.id));
      res.json({
        pergunta: {
          id: p.id, area: p.area, titulo: p.titulo, texto: p.texto, created_at: p.created_at,
          autor: pessoa(p.usuario_id, p.autor, p.foto_id), minha: p.usuario_id === eu.id,
          pode_apagar: p.usuario_id === eu.id || admin, denunciei: p.denunciei,
          resolvida: respostas.some(r => r.melhor), ...(admin ? { oculto: p.oculto } : {})
        },
        respostas,
        moderador: admin
      });
    } catch (erro) {
      console.error('Erro ao abrir pergunta:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir a pergunta agora.' });
    }
  });

  app.post('/api/perguntas', exigirLogin, freioPerguntar, async (req, res) => {
    const area = AREAS.includes(req.body?.area) ? req.body.area : null;
    const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim().replace(/\s+/g, ' ') : '';
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!area) return res.status(400).json({ error: 'Escolha a matéria da pergunta.' });
    if (titulo.length < 8 || titulo.length > 140) return res.status(400).json({ error: 'A pergunta precisa ter de 8 a 140 caracteres.' });
    if (texto.length > 2000) return res.status(400).json({ error: 'Os detalhes podem ter até 2000 caracteres.' });
    try {
      const r = await pool.query('INSERT INTO perguntas (usuario_id, area, titulo, texto) VALUES ($1, $2, $3, $4) RETURNING id',
        [req.usuario.id, area, titulo, texto]);
      await registrarAtividade(pool, { usuarioId: req.usuario.id, tipo: 'pergunta', texto: titulo, alvoId: r.rows[0].id });
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao perguntar:', erro.message);
      res.status(500).json({ error: 'Não consegui publicar a pergunta agora.' });
    }
  });

  app.post('/api/perguntas/:id(\\d+)/respostas', exigirLogin, freioResponder, async (req, res) => {
    const id = idValido(req.params.id);
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (texto.length < 2 || texto.length > 2000) return res.status(400).json({ error: 'A resposta precisa ter de 2 a 2000 caracteres.' });
    try {
      const p = await pool.query('SELECT usuario_id, titulo FROM perguntas WHERE id = $1 AND NOT oculto', [id]);
      if (!p.rows[0]) return res.status(404).json({ error: 'Pergunta não encontrada.' });
      const r = await pool.query('INSERT INTO perguntas_respostas (pergunta_id, usuario_id, texto) VALUES ($1, $2, $3) RETURNING id',
        [id, req.usuario.id, texto]);
      await notificar(pool, { usuarioId: p.rows[0].usuario_id, atorId: req.usuario.id, tipo: 'resposta_pergunta', alvoTipo: 'pergunta', alvoId: id, texto: p.rows[0].titulo });
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao responder pergunta:', erro.message);
      res.status(500).json({ error: 'Não consegui publicar a resposta agora.' });
    }
  });

  // Só quem perguntou escolhe a melhor (e pode trocar). A própria resposta
  // não vale: senão era um jeito fácil de ganhar XP.
  app.post('/api/perguntas/:id(\\d+)/melhor', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    const respostaId = idValido(req.body?.resposta_id);
    if (!respostaId) return res.status(400).json({ error: 'Escolha uma resposta.' });
    try {
      const p = await pool.query('SELECT usuario_id, titulo, melhor_resposta_id FROM perguntas WHERE id = $1', [id]);
      if (!p.rows[0]) return res.status(404).json({ error: 'Pergunta não encontrada.' });
      if (p.rows[0].usuario_id !== req.usuario.id) return res.status(403).json({ error: 'Só quem perguntou escolhe a melhor resposta.' });
      const r = await pool.query('SELECT usuario_id FROM perguntas_respostas WHERE id = $1 AND pergunta_id = $2 AND NOT oculto', [respostaId, id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Resposta não encontrada.' });
      if (r.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'A sua própria resposta não pode ser a melhor.' });
      const tirar = p.rows[0].melhor_resposta_id === respostaId;
      await pool.query('UPDATE perguntas SET melhor_resposta_id = $2 WHERE id = $1', [id, tirar ? null : respostaId]);
      if (!tirar) {
        await notificar(pool, { usuarioId: r.rows[0].usuario_id, atorId: req.usuario.id, tipo: 'melhor_resposta', alvoTipo: 'pergunta', alvoId: id, texto: p.rows[0].titulo });
        await pool.query(`DELETE FROM atividades WHERE tipo = 'melhor_resposta' AND alvo_id = $1`, [id]);
        await registrarAtividade(pool, { usuarioId: r.rows[0].usuario_id, tipo: 'melhor_resposta', texto: p.rows[0].titulo, alvoId: id });
      } else {
        await pool.query(`DELETE FROM atividades WHERE tipo = 'melhor_resposta' AND alvo_id = $1`, [id]);
      }
      res.json({ melhor: tirar ? null : respostaId });
    } catch (erro) {
      console.error('Erro ao marcar melhor resposta:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.post('/api/perguntas/respostas/:id(\\d+)/util', exigirLogin, freioVotar, async (req, res) => {
    const id = idValido(req.params.id);
    try {
      const r = await pool.query('SELECT usuario_id, pergunta_id FROM perguntas_respostas WHERE id = $1', [id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Resposta não encontrada.' });
      if (r.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Não dá para votar na própria resposta.' });
      const saiu = await pool.query('DELETE FROM perguntas_respostas_uteis WHERE resposta_id = $1 AND usuario_id = $2', [id, req.usuario.id]);
      if (!saiu.rowCount) {
        await pool.query('INSERT INTO perguntas_respostas_uteis (resposta_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.usuario.id]);
        await notificar(pool, { usuarioId: r.rows[0].usuario_id, atorId: req.usuario.id, tipo: 'util', alvoTipo: 'pergunta', alvoId: r.rows[0].pergunta_id });
      }
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM perguntas_respostas_uteis WHERE resposta_id = $1', [id]);
      res.json({ util: !saiu.rowCount, uteis: rows[0].n });
    } catch (erro) {
      console.error('Erro ao votar resposta:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.delete('/api/perguntas/:id(\\d+)', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    try {
      const r = await pool.query('DELETE FROM perguntas WHERE id = $1 AND (usuario_id = $2 OR $3)', [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Pergunta não encontrada ou não é sua.' });
      await pool.query(`DELETE FROM atividades WHERE tipo IN ('pergunta', 'melhor_resposta') AND alvo_id = $1`, [id]);
      res.json({ message: 'Pergunta apagada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.delete('/api/perguntas/respostas/:id(\\d+)', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    try {
      const r = await pool.query('DELETE FROM perguntas_respostas WHERE id = $1 AND (usuario_id = $2 OR $3) RETURNING pergunta_id',
        [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Resposta não encontrada ou não é sua.' });
      const tirou = await pool.query('UPDATE perguntas SET melhor_resposta_id = NULL WHERE melhor_resposta_id = $1 RETURNING id', [id]);
      if (tirou.rowCount) await pool.query(`DELETE FROM atividades WHERE tipo = 'melhor_resposta' AND alvo_id = $1`, [r.rows[0].pergunta_id]);
      res.json({ message: 'Resposta apagada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // Denúncia de pergunta ou resposta: com 3 pessoas diferentes, sai do ar até
  // um administrador revisar.
  const TABELA = { pergunta: 'perguntas', resposta: 'perguntas_respostas' };
  app.post('/api/perguntas/:tipo(pergunta|resposta)/:id(\\d+)/denunciar', exigirLogin, freioDenunciar, async (req, res) => {
    const { tipo } = req.params;
    const id = idValido(req.params.id);
    try {
      const alvo = await pool.query(`SELECT usuario_id FROM ${TABELA[tipo]} WHERE id = $1`, [id]);
      if (!alvo.rows[0]) return res.status(404).json({ error: 'Não encontrado.' });
      if (alvo.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar o que você mesmo escreveu.' });
      await pool.query('INSERT INTO perguntas_denuncias (alvo_tipo, alvo_id, usuario_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [tipo, id, req.usuario.id]);
      await pool.query(
        `UPDATE ${TABELA[tipo]} SET oculto = TRUE
          WHERE id = $1 AND (SELECT COUNT(*) FROM perguntas_denuncias WHERE alvo_tipo = $2 AND alvo_id = $1) >= $3`,
        [id, tipo, DENUNCIAS_PARA_ESCONDER]);
      res.json({ message: 'Obrigado! A denúncia foi registrada.' });
    } catch (erro) {
      console.error('Erro ao denunciar pergunta:', erro.message);
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  app.post('/api/perguntas/:tipo(pergunta|resposta)/:id(\\d+)/restaurar', exigirModerador, async (req, res) => {
    const { tipo } = req.params;
    const id = idValido(req.params.id);
    try {
      await pool.query('DELETE FROM perguntas_denuncias WHERE alvo_tipo = $1 AND alvo_id = $2', [tipo, id]);
      await pool.query(`UPDATE ${TABELA[tipo]} SET oculto = FALSE WHERE id = $1`, [id]);
      res.json({ message: 'Restaurado.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });
}

module.exports = registrarPerguntas;
module.exports.AREAS = AREAS;
