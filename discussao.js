// Discussão de cada questão: os alunos explicam como resolveram, tiram
// dúvidas e marcam as explicações mais úteis. O site só mostra a discussão
// depois que a pessoa responde, para não entregar o gabarito.
//
// Comentário pode ter respostas (um nível, como no YouTube). Os mais úteis
// sobem; administradores fixam uma explicação no topo.

const imagens = require('./imagens');
const { notificar } = require('./social');

const DENUNCIAS_PARA_ESCONDER = 3;
const TAMANHO = 1000;

function registrarDiscussao(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioComentar = limitar(auth.criarFreio(20, 10 * 60 * 1000), 'Você comentou muito em pouco tempo. Espere uns minutos.', porConta);
  const freioVotar = limitar(auth.criarFreio(200, 60 * 60 * 1000), 'Calma! Muitos votos em pouco tempo.', porConta);
  const freioDenunciar = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', porConta);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  // Quantos comentários cada questão tem (para o botão "Discussão (N)").
  app.get('/api/discussao/contagem', async (req, res) => {
    const ids = String(req.query.questoes || '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 100);
    if (!ids.length) return res.json({ contagem: {} });
    try {
      const { rows } = await pool.query(
        `SELECT questao_id, COUNT(*)::int AS n FROM questoes_comentarios
          WHERE questao_id = ANY($1::int[]) AND NOT oculto GROUP BY questao_id`, [ids]
      );
      res.json({ contagem: Object.fromEntries(rows.map(r => [r.questao_id, r.n])) });
    } catch (erro) {
      res.status(500).json({ error: 'Falhou.' });
    }
  });

  app.get('/api/questoes/:id/discussao', async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Questão não encontrada.' });
    const eu = req.usuario;
    const admin = Boolean(eu && eu.admin);
    try {
      const { rows } = await pool.query(
        `SELECT c.id, c.resposta_a, c.texto, c.fixado, c.oculto, c.created_at,
                u.id AS autor_id, u.username AS autor, u.foto_id, COALESCE(u.admin, FALSE) AS autor_admin,
                (SELECT COUNT(*)::int FROM questoes_comentarios_uteis v WHERE v.comentario_id = c.id) AS uteis,
                EXISTS (SELECT 1 FROM questoes_comentarios_uteis v WHERE v.comentario_id = c.id AND v.usuario_id = $2) AS achei_util,
                EXISTS (SELECT 1 FROM questoes_comentarios_denuncias d WHERE d.comentario_id = c.id AND d.usuario_id = $2) AS denunciei
           FROM questoes_comentarios c JOIN usuarios u ON u.id = c.usuario_id
          WHERE c.questao_id = $1 AND (NOT c.oculto OR $3)
          ORDER BY c.id`,
        [id, eu ? eu.id : null, admin]
      );
      const mapa = c => ({
        id: c.id, texto: c.texto, created_at: c.created_at, fixado: c.fixado, uteis: c.uteis,
        autor_id: c.autor_id, autor: c.autor, autor_admin: c.autor_admin,
        foto: eu ? imagens.urlAssinada(c.foto_id) : null,
        meu: Boolean(eu && eu.id === c.autor_id), pode_apagar: Boolean(eu && (eu.id === c.autor_id || admin)),
        achei_util: c.achei_util, denunciei: c.denunciei, ...(admin ? { oculto: c.oculto } : {}), respostas: []
      });
      const principais = [];
      const porId = new Map();
      for (const c of rows) {
        const item = mapa(c);
        porId.set(c.id, item);
        if (!c.resposta_a) principais.push(item);
      }
      for (const c of rows) if (c.resposta_a && porId.has(c.resposta_a)) porId.get(c.resposta_a).respostas.push(porId.get(c.id));
      // Fixado primeiro; depois os mais úteis; empate, o mais antigo.
      principais.sort((a, b) => (b.fixado - a.fixado) || (b.uteis - a.uteis) || (a.id - b.id));
      res.json({ comentarios: principais, total: rows.filter(c => !c.oculto).length, moderador: admin });
    } catch (erro) {
      console.error('Erro ao carregar discussão:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar a discussão agora.' });
    }
  });

  app.post('/api/questoes/:id/discussao', exigirLogin, freioComentar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Questão não encontrada.' });
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto) return res.status(400).json({ error: 'Escreva alguma coisa.' });
    if (texto.length > TAMANHO) return res.status(400).json({ error: `O comentário pode ter até ${TAMANHO} caracteres.` });
    const respostaA = req.body?.resposta_a ? idValido(req.body.resposta_a) : null;
    try {
      let paiAutor = null;
      if (respostaA) {
        // Resposta sempre fica no comentário principal (um nível só).
        const pai = await pool.query('SELECT usuario_id, resposta_a FROM questoes_comentarios WHERE id = $1 AND questao_id = $2', [respostaA, id]);
        if (!pai.rows[0]) return res.status(404).json({ error: 'Comentário não encontrado.' });
        if (pai.rows[0].resposta_a) return res.status(400).json({ error: 'Responda ao comentário principal.' });
        paiAutor = pai.rows[0].usuario_id;
      }
      const r = await pool.query(
        `INSERT INTO questoes_comentarios (questao_id, usuario_id, resposta_a, texto)
         SELECT $1, $2, $3, $4 WHERE EXISTS (SELECT 1 FROM questoes WHERE id = $1) RETURNING id`,
        [id, req.usuario.id, respostaA, texto]
      );
      if (r.rowCount === 0) return res.status(404).json({ error: 'Questão não encontrada.' });
      if (paiAutor) {
        await notificar(pool, { usuarioId: paiAutor, atorId: req.usuario.id, tipo: 'resposta', alvoTipo: 'questao', alvoId: id, texto });
      }
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao comentar questão:', erro.message);
      res.status(500).json({ error: 'Não consegui publicar o comentário agora.' });
    }
  });

  app.delete('/api/discussao/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      const r = await pool.query('DELETE FROM questoes_comentarios WHERE id = $1 AND (usuario_id = $2 OR $3)',
        [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Comentário não encontrado ou não é seu.' });
      res.json({ message: 'Comentário apagado.' });
    } catch (erro) {
      console.error('Erro ao apagar comentário da questão:', erro.message);
      res.status(500).json({ error: 'Não consegui apagar agora.' });
    }
  });

  // "Útil" é interruptor e avisa o autor (uma vez, até ele ver).
  app.post('/api/discussao/:id/util', exigirLogin, freioVotar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      const c = await pool.query('SELECT usuario_id, questao_id FROM questoes_comentarios WHERE id = $1', [id]);
      if (!c.rows[0]) return res.status(404).json({ error: 'Comentário não encontrado.' });
      if (c.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Não dá para votar no próprio comentário.' });
      const saiu = await pool.query('DELETE FROM questoes_comentarios_uteis WHERE comentario_id = $1 AND usuario_id = $2', [id, req.usuario.id]);
      if (saiu.rowCount === 0) {
        await pool.query('INSERT INTO questoes_comentarios_uteis (comentario_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.usuario.id]);
        await notificar(pool, { usuarioId: c.rows[0].usuario_id, atorId: req.usuario.id, tipo: 'util', alvoTipo: 'questao', alvoId: c.rows[0].questao_id });
      }
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM questoes_comentarios_uteis WHERE comentario_id = $1', [id]);
      res.json({ util: saiu.rowCount === 0, uteis: rows[0].n });
    } catch (erro) {
      console.error('Erro ao votar:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // Administrador fixa a melhor explicação no topo (só uma por questão).
  app.post('/api/discussao/:id/fixar', exigirModerador, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      const c = await pool.query('SELECT questao_id, fixado, resposta_a, usuario_id FROM questoes_comentarios WHERE id = $1', [id]);
      if (!c.rows[0]) return res.status(404).json({ error: 'Comentário não encontrado.' });
      if (c.rows[0].resposta_a) return res.status(400).json({ error: 'Só dá para fixar um comentário principal.' });
      await pool.query('UPDATE questoes_comentarios SET fixado = FALSE WHERE questao_id = $1', [c.rows[0].questao_id]);
      if (!c.rows[0].fixado) {
        await pool.query('UPDATE questoes_comentarios SET fixado = TRUE WHERE id = $1', [id]);
        await notificar(pool, { usuarioId: c.rows[0].usuario_id, atorId: req.usuario.id, tipo: 'fixado', alvoTipo: 'questao', alvoId: c.rows[0].questao_id });
      }
      res.json({ fixado: !c.rows[0].fixado });
    } catch (erro) {
      console.error('Erro ao fixar:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.post('/api/discussao/:id/denunciar', exigirLogin, freioDenunciar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      const c = await pool.query('SELECT usuario_id FROM questoes_comentarios WHERE id = $1', [id]);
      if (!c.rows[0]) return res.status(404).json({ error: 'Comentário não encontrado.' });
      if (c.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar o próprio comentário.' });
      await pool.query('INSERT INTO questoes_comentarios_denuncias (comentario_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.usuario.id]);
      await pool.query(
        `UPDATE questoes_comentarios SET oculto = TRUE
          WHERE id = $1 AND (SELECT COUNT(*) FROM questoes_comentarios_denuncias WHERE comentario_id = $1) >= $2`,
        [id, DENUNCIAS_PARA_ESCONDER]
      );
      res.json({ message: 'Obrigado! A denúncia foi registrada.' });
    } catch (erro) {
      console.error('Erro ao denunciar:', erro.message);
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  app.post('/api/discussao/:id/restaurar', exigirModerador, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Comentário não encontrado.' });
    try {
      await pool.query('DELETE FROM questoes_comentarios_denuncias WHERE comentario_id = $1', [id]);
      await pool.query('UPDATE questoes_comentarios SET oculto = FALSE WHERE id = $1', [id]);
      res.json({ message: 'Comentário restaurado.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });
}

module.exports = registrarDiscussao;
