// Turmas e grupos: onde a comunidade começa pequena.
//
// Grupos por objetivo (Medicina, Direito...) são abertos: qualquer um com
// conta entra. Turmas são criadas pelos alunos (a sala da escola, o grupo do
// cursinho) e só entra quem tem o código de convite. Cada grupo tem o próprio
// feed (posts com grupo_id) e o próprio ranking do desafio da semana.

const crypto = require('crypto');
const imagens = require('./imagens');

const LETRAS_DO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I, que confundem
const MAXIMO_DE_TURMAS_CRIADAS = 10;

function novoCodigo() {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, b => LETRAS_DO_CODIGO[b % LETRAS_DO_CODIGO.length]).join('');
}

// Pode ver e postar no feed do grupo? Turma: só membros. Objetivo: ler é
// para quem tem conta; postar, só membros.
async function acessoAoGrupo(pool, grupoId, usuario) {
  const g = await pool.query('SELECT tipo FROM grupos WHERE id = $1', [grupoId]);
  if (!g.rows[0]) return { existe: false };
  const membro = usuario
    ? (await pool.query('SELECT papel FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2', [grupoId, usuario.id])).rows[0]
    : null;
  const admin = Boolean(usuario && usuario.admin);
  return {
    existe: true, tipo: g.rows[0].tipo, membro: Boolean(membro), papel: membro ? membro.papel : null,
    ler: admin || Boolean(membro) || (g.rows[0].tipo === 'objetivo' && Boolean(usuario)),
    postar: Boolean(membro)
  };
}

function registrarGrupos(app, { pool, auth, limitar, exigirLogin }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioCriar = limitar(auth.criarFreio(5, 24 * 60 * 60 * 1000), 'Você criou muitas turmas hoje. Tente amanhã.', porConta);
  const freioEntrar = limitar(auth.criarFreio(30, 60 * 60 * 1000), 'Muitas tentativas. Espere um pouco.', porConta);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };

  const resumo = (g, eu) => ({
    id: g.id, nome: g.nome, descricao: g.descricao, tipo: g.tipo, membros: g.membros,
    sou_membro: Boolean(g.papel), papel: g.papel || null,
    // O código só aparece para quem já está na turma (para convidar os colegas).
    ...(g.tipo === 'turma' && g.papel ? { codigo: g.codigo } : {})
  });

  app.get('/api/grupos', async (req, res) => {
    const eu = req.usuario;
    try {
      const { rows } = await pool.query(
        `SELECT g.id, g.nome, g.descricao, g.tipo, g.codigo,
                (SELECT COUNT(*)::int FROM grupo_membros m WHERE m.grupo_id = g.id) AS membros,
                (SELECT papel FROM grupo_membros m WHERE m.grupo_id = g.id AND m.usuario_id = $1) AS papel
           FROM grupos g
          WHERE g.tipo = 'objetivo' OR EXISTS (SELECT 1 FROM grupo_membros m WHERE m.grupo_id = g.id AND m.usuario_id = $1)
          ORDER BY g.tipo DESC, g.id`, [eu ? eu.id : null]
      );
      res.json({ grupos: rows.map(g => resumo(g, eu)) });
    } catch (erro) {
      console.error('Erro ao listar grupos:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os grupos agora.' });
    }
  });

  app.get('/api/grupos/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Grupo não encontrado.' });
    try {
      const acesso = await acessoAoGrupo(pool, id, req.usuario);
      if (!acesso.existe) return res.status(404).json({ error: 'Grupo não encontrado.' });
      if (!acesso.ler) return res.status(403).json({ error: 'Essa turma é só para quem tem o convite.' });
      const g = (await pool.query(
        `SELECT g.id, g.nome, g.descricao, g.tipo, g.codigo, (SELECT COUNT(*)::int FROM grupo_membros m WHERE m.grupo_id = g.id) AS membros,
                $2::text AS papel FROM grupos g WHERE g.id = $1`, [id, acesso.papel]
      )).rows[0];
      const membros = await pool.query(
        `SELECT u.id, u.username AS nome, u.foto_id, m.papel FROM grupo_membros m JOIN usuarios u ON u.id = m.usuario_id
          WHERE m.grupo_id = $1 ORDER BY (m.papel = 'dono') DESC, m.created_at LIMIT 100`, [id]
      );
      res.json({
        grupo: resumo(g, req.usuario),
        membros: membros.rows.map(m => ({ id: m.id, nome: m.nome, papel: m.papel, foto: imagens.urlAssinada(m.foto_id) })),
        pode_postar: acesso.postar
      });
    } catch (erro) {
      console.error('Erro ao abrir grupo:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir o grupo agora.' });
    }
  });

  app.post('/api/grupos', exigirLogin, freioCriar, async (req, res) => {
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    const descricao = typeof req.body?.descricao === 'string' ? req.body.descricao.trim() : '';
    if (nome.length < 3 || nome.length > 60) return res.status(400).json({ error: 'O nome da turma precisa ter de 3 a 60 caracteres.' });
    if (descricao.length > 300) return res.status(400).json({ error: 'A descrição pode ter até 300 caracteres.' });
    try {
      const criadas = await pool.query(`SELECT COUNT(*)::int AS n FROM grupos WHERE criador_id = $1 AND tipo = 'turma'`, [req.usuario.id]);
      if (criadas.rows[0].n >= MAXIMO_DE_TURMAS_CRIADAS) return res.status(400).json({ error: `Você já criou ${MAXIMO_DE_TURMAS_CRIADAS} turmas.` });
      let grupo;
      for (let tentativa = 0; tentativa < 5 && !grupo; tentativa++) {
        try {
          grupo = (await pool.query(
            `INSERT INTO grupos (nome, descricao, tipo, codigo, criador_id) VALUES ($1, $2, 'turma', $3, $4) RETURNING id, codigo`,
            [nome, descricao, novoCodigo(), req.usuario.id]
          )).rows[0];
        } catch (erro) { if (erro.code !== '23505') throw erro; } // código repetido: sorteia outro
      }
      await pool.query(`INSERT INTO grupo_membros (grupo_id, usuario_id, papel) VALUES ($1, $2, 'dono')`, [grupo.id, req.usuario.id]);
      res.status(201).json({ id: grupo.id, codigo: grupo.codigo });
    } catch (erro) {
      console.error('Erro ao criar turma:', erro.message);
      res.status(500).json({ error: 'Não consegui criar a turma agora.' });
    }
  });

  // Entrar numa turma pelo código de convite.
  app.post('/api/grupos/entrar', exigirLogin, freioEntrar, async (req, res) => {
    const codigo = String(req.body?.codigo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (codigo.length !== 6) return res.status(400).json({ error: 'O código tem 6 letras e números.' });
    try {
      const g = await pool.query(`SELECT id FROM grupos WHERE codigo = $1 AND tipo = 'turma'`, [codigo]);
      if (!g.rows[0]) return res.status(404).json({ error: 'Nenhuma turma com esse código. Confira com quem te convidou.' });
      await pool.query('INSERT INTO grupo_membros (grupo_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [g.rows[0].id, req.usuario.id]);
      res.json({ id: g.rows[0].id });
    } catch (erro) {
      console.error('Erro ao entrar na turma:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // Entrar num grupo por objetivo (aberto).
  app.post('/api/grupos/:id/entrar', exigirLogin, freioEntrar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Grupo não encontrado.' });
    try {
      const r = await pool.query(
        `INSERT INTO grupo_membros (grupo_id, usuario_id) SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM grupos WHERE id = $1 AND tipo = 'objetivo')
         ON CONFLICT DO NOTHING`, [id, req.usuario.id]
      );
      const existe = await pool.query(`SELECT tipo FROM grupos WHERE id = $1`, [id]);
      if (!existe.rows[0]) return res.status(404).json({ error: 'Grupo não encontrado.' });
      if (existe.rows[0].tipo !== 'objetivo') return res.status(403).json({ error: 'Para entrar numa turma você precisa do código de convite.' });
      res.json({ entrou: r.rowCount > 0 });
    } catch (erro) {
      console.error('Erro ao entrar no grupo:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // Sair. Se o dono sai, a turma passa para o membro mais antigo; se ninguém
  // sobra, a turma é apagada junto com o feed dela.
  app.post('/api/grupos/:id/sair', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Grupo não encontrado.' });
    try {
      const saiu = await pool.query('DELETE FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2 RETURNING papel', [id, req.usuario.id]);
      if (!saiu.rowCount) return res.status(404).json({ error: 'Você não está nesse grupo.' });
      const g = (await pool.query('SELECT tipo FROM grupos WHERE id = $1', [id])).rows[0];
      if (g && g.tipo === 'turma') {
        const restantes = await pool.query('SELECT usuario_id FROM grupo_membros WHERE grupo_id = $1 ORDER BY created_at LIMIT 1', [id]);
        if (!restantes.rowCount) await pool.query('DELETE FROM grupos WHERE id = $1', [id]);
        else if (saiu.rows[0].papel === 'dono') {
          await pool.query(`UPDATE grupo_membros SET papel = 'dono' WHERE grupo_id = $1 AND usuario_id = $2`, [id, restantes.rows[0].usuario_id]);
        }
      }
      res.json({ message: 'Você saiu do grupo.' });
    } catch (erro) {
      console.error('Erro ao sair do grupo:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // O dono da turma ou um administrador apaga a turma inteira.
  app.delete('/api/grupos/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Grupo não encontrado.' });
    try {
      const r = await pool.query(
        `DELETE FROM grupos WHERE id = $1 AND tipo = 'turma'
            AND ($3 OR EXISTS (SELECT 1 FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2 AND papel = 'dono'))`,
        [id, req.usuario.id, Boolean(req.usuario.admin)]
      );
      if (!r.rowCount) return res.status(403).json({ error: 'Só o dono da turma pode apagá-la.' });
      res.json({ message: 'Turma apagada.' });
    } catch (erro) {
      console.error('Erro ao apagar turma:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });
}

module.exports = registrarGrupos;
module.exports.acessoAoGrupo = acessoAoGrupo;
module.exports.novoCodigo = novoCodigo;
