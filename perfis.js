// Perfil do aluno: foto, bio, números de estudo e publicações em galeria
// (cartões com capa opcional, como a galeria do Notion).
//
// Perfis, publicações e fotos aparecem só para quem tem conta e está logado:
// muita gente aqui é menor de idade. Valem as regras do feed: denúncias
// escondem a publicação e administradores revisam.

const imagens = require('./imagens');

const DENUNCIAS_PARA_ESCONDER = 3;
const MAXIMO_DE_PUBLICACOES = 60; // por pessoa: o banco grátis tem pouco espaço
const TAMANHO = { titulo: 80, texto: 2000, bio: 300 };

module.exports = function registrarPerfis(app, { pool, auth, limitar, exigirLogin, exigirModerador }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioFotos = limitar(auth.criarFreio(30, 60 * 60 * 1000), 'Você enviou muitas fotos agora. Espere um pouco.', porConta);
  const freioPublicar = limitar(auth.criarFreio(15, 60 * 60 * 1000), 'Você publicou muito em pouco tempo. Espere um pouco.', porConta);
  const freioDenuncias = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', porConta);

  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };
  const urlDaImagem = id => imagens.urlAssinada(id);

  async function guardarImagem(donoId, dataUrl) {
    const { dados, erro } = imagens.lerImagem(dataUrl);
    if (erro) return { erro };
    const { rows } = await pool.query('INSERT INTO imagens (dono_id, dados) VALUES ($1, $2) RETURNING id', [donoId, dados]);
    return { id: rows[0].id };
  }

  // Foto trocada ou removida não é usada por mais ninguém: sai do banco.
  const apagarImagem = id => (id ? pool.query('DELETE FROM imagens WHERE id = $1', [id]) : null);

  // ---------- imagens ----------
  // Só com link assinado (veja imagens.urlAssinada). O id muda a cada foto
  // nova, então dá para guardar em cache até o link vencer; "private" evita
  // que proxies no caminho guardem a foto.
  app.get('/api/imagens/:id', async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).end();
    if (!imagens.assinaturaValida(id, req.query.ate, req.query.ass)) return res.status(403).end();
    try {
      const { rows } = await pool.query('SELECT dados FROM imagens WHERE id = $1', [id]);
      if (!rows[0]) return res.status(404).end();
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': `private, max-age=${Math.max(0, Number(req.query.ate) - Math.floor(Date.now() / 1000))}`,
        'Cross-Origin-Resource-Policy': 'cross-origin', // o site (GitHub Pages) está em outro endereço
        'Content-Security-Policy': "default-src 'none'"
      });
      res.send(rows[0].dados);
    } catch (erro) {
      console.error('Erro ao ler imagem:', erro.message);
      res.status(500).end();
    }
  });

  // ---------- perfil ----------
  app.get('/api/perfil/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Perfil não encontrado.' });
    const eu = req.usuario;
    const admin = Boolean(eu && eu.admin);
    const dono = Boolean(eu && eu.id === id);
    try {
      const perfil = await pool.query(
        `SELECT u.id, u.username, COALESCE(u.bio, '') AS bio, u.foto_id, u.created_at,
                (SELECT COUNT(*)::int FROM respostas r WHERE r.usuario_id = u.id) AS questoes,
                (SELECT COUNT(*)::int FROM respostas r WHERE r.usuario_id = u.id AND r.acertou) AS acertos
           FROM usuarios u WHERE u.id = $1`, [id]
      );
      const u = perfil.rows[0];
      if (!u) return res.status(404).json({ error: 'Perfil não encontrado.' });

      const pubs = await pool.query(
        `SELECT p.id, p.titulo, p.texto, p.capa_id, p.capa_posicao, p.oculto, p.created_at,
                (SELECT COUNT(*)::int FROM denuncias_publicacoes d WHERE d.publicacao_id = p.id) AS denuncias,
                EXISTS (SELECT 1 FROM denuncias_publicacoes d WHERE d.publicacao_id = p.id AND d.usuario_id = $2) AS denunciei
           FROM publicacoes p
          WHERE p.autor_id = $1 AND (NOT p.oculto OR $3)
          ORDER BY p.created_at DESC`,
        [id, eu ? eu.id : null, dono || admin]
      );

      res.json({
        perfil: {
          id: u.id, nome: u.username, bio: u.bio, foto: urlDaImagem(u.foto_id), desde: u.created_at,
          questoes: u.questoes, acerto: u.questoes ? Math.round(100 * u.acertos / u.questoes) : null,
          publicacoes: pubs.rowCount, meu: dono
        },
        publicacoes: pubs.rows.map(p => {
          const pub = {
            id: p.id, titulo: p.titulo, texto: p.texto, capa: urlDaImagem(p.capa_id),
            capa_posicao: p.capa_posicao, created_at: p.created_at,
            meu: dono, pode_apagar: dono || admin, denunciei: p.denunciei
          };
          if (dono || admin) Object.assign(pub, { oculto: p.oculto, denuncias: p.denuncias });
          return pub;
        }),
        moderador: admin
      });
    } catch (erro) {
      console.error('Erro ao abrir perfil:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir o perfil agora.' });
    }
  });

  // Bio e foto. "foto": undefined mantém, null remove, data URL troca.
  app.put('/api/perfil', exigirLogin, freioFotos, async (req, res) => {
    const { bio, foto } = req.body || {};
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > TAMANHO.bio)) {
      return res.status(400).json({ error: `A bio pode ter até ${TAMANHO.bio} caracteres.` });
    }
    try {
      const atual = await pool.query('SELECT foto_id FROM usuarios WHERE id = $1', [req.usuario.id]);
      let fotoId = atual.rows[0]?.foto_id ?? null;
      const antiga = fotoId;
      if (foto === null) fotoId = null;
      else if (foto !== undefined) {
        const nova = await guardarImagem(req.usuario.id, foto);
        if (nova.erro) return res.status(400).json({ error: nova.erro });
        fotoId = nova.id;
      }
      await pool.query(
        'UPDATE usuarios SET bio = COALESCE($1, bio), foto_id = $2, updated_at = NOW() WHERE id = $3',
        [bio === undefined ? null : bio.trim(), fotoId, req.usuario.id]
      );
      if (antiga && antiga !== fotoId) await apagarImagem(antiga);
      res.json({ message: 'Perfil salvo.', foto: urlDaImagem(fotoId) });
    } catch (erro) {
      console.error('Erro ao salvar perfil:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar o perfil agora.' });
    }
  });

  // ---------- publicações ----------
  function lerCampos(corpo, exigirTitulo) {
    const titulo = typeof corpo.titulo === 'string' ? corpo.titulo.trim() : undefined;
    const texto = typeof corpo.texto === 'string' ? corpo.texto.trim() : undefined;
    if (exigirTitulo && !titulo) return { erro: 'Dê um título para a publicação.' };
    if (titulo !== undefined && (titulo.length === 0 || titulo.length > TAMANHO.titulo)) {
      return { erro: `O título precisa ter de 1 a ${TAMANHO.titulo} caracteres.` };
    }
    if (texto !== undefined && texto.length > TAMANHO.texto) return { erro: `O texto pode ter até ${TAMANHO.texto} caracteres.` };
    let posicao;
    if (corpo.capa_posicao !== undefined) {
      posicao = Math.round(Number(corpo.capa_posicao));
      if (!(posicao >= 0 && posicao <= 100)) return { erro: 'Posição da capa inválida.' };
    }
    return { titulo, texto, posicao };
  }

  app.post('/api/publicacoes', exigirLogin, freioPublicar, async (req, res) => {
    const corpo = req.body || {};
    const campos = lerCampos(corpo, true);
    if (campos.erro) return res.status(400).json({ error: campos.erro });
    try {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM publicacoes WHERE autor_id = $1', [req.usuario.id]);
      if (rows[0].n >= MAXIMO_DE_PUBLICACOES) {
        return res.status(400).json({ error: `Você chegou ao limite de ${MAXIMO_DE_PUBLICACOES} publicações. Apague alguma para publicar outra.` });
      }
      let capaId = null;
      if (corpo.capa) {
        const capa = await guardarImagem(req.usuario.id, corpo.capa);
        if (capa.erro) return res.status(400).json({ error: capa.erro });
        capaId = capa.id;
      }
      const nova = await pool.query(
        `INSERT INTO publicacoes (autor_id, titulo, texto, capa_id, capa_posicao)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [req.usuario.id, campos.titulo, campos.texto || '', capaId, campos.posicao ?? 50]
      );
      res.status(201).json({ id: nova.rows[0].id, message: 'Publicado!' });
    } catch (erro) {
      console.error('Erro ao publicar:', erro.message);
      res.status(500).json({ error: 'Não consegui publicar agora.' });
    }
  });

  // Só o autor edita. "capa": undefined mantém, null remove, data URL troca.
  app.put('/api/publicacoes/:id', exigirLogin, freioFotos, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Publicação não encontrada.' });
    const corpo = req.body || {};
    const campos = lerCampos(corpo, false);
    if (campos.erro) return res.status(400).json({ error: campos.erro });
    try {
      const atual = await pool.query('SELECT capa_id FROM publicacoes WHERE id = $1 AND autor_id = $2', [id, req.usuario.id]);
      if (!atual.rows[0]) return res.status(404).json({ error: 'Publicação não encontrada ou não é sua.' });
      const antiga = atual.rows[0].capa_id;
      let capaId = antiga;
      if (corpo.capa === null) capaId = null;
      else if (corpo.capa !== undefined) {
        const capa = await guardarImagem(req.usuario.id, corpo.capa);
        if (capa.erro) return res.status(400).json({ error: capa.erro });
        capaId = capa.id;
      }
      await pool.query(
        `UPDATE publicacoes SET titulo = COALESCE($1, titulo), texto = COALESCE($2, texto),
                capa_id = $3, capa_posicao = COALESCE($4, capa_posicao), updated_at = NOW()
          WHERE id = $5`,
        [campos.titulo ?? null, campos.texto ?? null, capaId, campos.posicao ?? null, id]
      );
      if (antiga && antiga !== capaId) await apagarImagem(antiga);
      res.json({ message: 'Publicação salva.' });
    } catch (erro) {
      console.error('Erro ao editar publicação:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar agora.' });
    }
  });

  app.delete('/api/publicacoes/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Publicação não encontrada.' });
    try {
      const r = await pool.query(
        'DELETE FROM publicacoes WHERE id = $1 AND (autor_id = $2 OR $3) RETURNING capa_id',
        [id, req.usuario.id, Boolean(req.usuario.admin)]
      );
      if (r.rowCount === 0) return res.status(404).json({ error: 'Publicação não encontrada ou não é sua.' });
      await apagarImagem(r.rows[0].capa_id);
      if (req.usuario.admin) console.log(`🛡️ Publicação ${id} apagada pelo administrador ${req.usuario.id}`);
      res.json({ message: 'Publicação apagada.' });
    } catch (erro) {
      console.error('Erro ao apagar publicação:', erro.message);
      res.status(500).json({ error: 'Não consegui apagar agora.' });
    }
  });

  app.post('/api/publicacoes/:id/denunciar', exigirLogin, freioDenuncias, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Publicação não encontrada.' });
    const motivo = String(req.body?.motivo || '').trim().slice(0, 200) || null;
    try {
      const pub = await pool.query('SELECT autor_id FROM publicacoes WHERE id = $1', [id]);
      if (!pub.rows[0]) return res.status(404).json({ error: 'Publicação não encontrada.' });
      if (pub.rows[0].autor_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar a própria publicação.' });
      await pool.query(
        'INSERT INTO denuncias_publicacoes (publicacao_id, usuario_id, motivo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [id, req.usuario.id, motivo]
      );
      const { rows } = await pool.query(
        `UPDATE publicacoes SET oculto = TRUE
          WHERE id = $1 AND (SELECT COUNT(*) FROM denuncias_publicacoes WHERE publicacao_id = $1) >= $2
          RETURNING id`,
        [id, DENUNCIAS_PARA_ESCONDER]
      );
      if (rows[0]) console.log(`🛡️ Publicação ${id} escondida por denúncias`);
      res.json({ message: 'Obrigado! A denúncia foi registrada e vai ser revisada.' });
    } catch (erro) {
      console.error('Erro ao denunciar publicação:', erro.message);
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  app.post('/api/publicacoes/:id/restaurar', exigirModerador, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Publicação não encontrada.' });
    try {
      await pool.query('DELETE FROM denuncias_publicacoes WHERE publicacao_id = $1', [id]);
      const r = await pool.query('UPDATE publicacoes SET oculto = FALSE WHERE id = $1', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Publicação não encontrada.' });
      res.json({ message: 'Publicação restaurada.' });
    } catch (erro) {
      console.error('Erro ao restaurar publicação:', erro.message);
      res.status(500).json({ error: 'Não consegui restaurar agora.' });
    }
  });
};
