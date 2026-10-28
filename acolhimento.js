// Acolhimento: o que faz o aluno achar a sua turma e se sentir recebido.
//
// - Escola no perfil (opcional): "colegas da sua escola" junta quem estudou
//   no mesmo lugar. O nome é comparado sem acento, maiúscula ou pontuação.
// - Boas-vindas: quem chegou nos últimos 7 dias aparece para os outros, e um
//   toque manda "boas-vindas 👋" (vira notificação para quem chegou).
// - Estudando junto: quantos colegas da escola e do grupo do objetivo
//   estudaram hoje, para o treino não parecer solitário.
//
// Tudo só para quem está logado, e sempre fora quem bloqueou ou foi bloqueado.

const imagens = require('./imagens');
const { notificar } = require('./social');

const TAMANHO_ESCOLA = 80;
const DIAS_DE_NOVATO = 7;
const ONLINE = "INTERVAL '3 minutes'";
const INICIO_DE_HOJE = "(date_trunc('day', NOW() - INTERVAL '3 hours') + INTERVAL '3 hours')";
const SEM_BLOQUEIO = `NOT EXISTS (SELECT 1 FROM bloqueios b WHERE (b.usuario_id = $1 AND b.bloqueado_id = u.id) OR (b.usuario_id = u.id AND b.bloqueado_id = $1))`;

// "Colégio Estadual São José " e "colegio estadual sao jose" são a mesma escola.
function chaveDaEscola(nome) {
  return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function lerEscola(valor) {
  if (valor === undefined) return { mudou: false };
  if (valor === null || (typeof valor === 'string' && !valor.trim())) return { mudou: true, escola: null, chave: null };
  if (typeof valor !== 'string') return { erro: 'Escola inválida.' };
  const escola = valor.trim().replace(/\s+/g, ' ');
  if (escola.length > TAMANHO_ESCOLA) return { erro: `O nome da escola pode ter até ${TAMANHO_ESCOLA} caracteres.` };
  const chave = chaveDaEscola(escola);
  if (chave.length < 3) return { erro: 'Escreva o nome da escola.' };
  return { mudou: true, escola, chave };
}

function registrarAcolhimento(app, { pool, auth, limitar, exigirLogin }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioBoasVindas = limitar(auth.criarFreio(60, 60 * 60 * 1000), 'Muitas boas-vindas em pouco tempo. Espere um pouco 🙂', porConta);
  const idValido = v => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
  const pessoa = r => ({ id: r.id, nome: r.nome, foto: imagens.urlAssinada(r.foto_id) });

  // Sugestões para o campo de escola: os nomes que mais gente já escreveu.
  app.get('/api/escolas', exigirLogin, async (req, res) => {
    const busca = chaveDaEscola(req.query.q);
    if (busca.length < 2) return res.json({ escolas: [] });
    try {
      const { rows } = await pool.query(
        `SELECT MODE() WITHIN GROUP (ORDER BY escola) AS nome, COUNT(*)::int AS alunos
           FROM usuarios WHERE escola_chave LIKE '%' || $1 || '%'
          GROUP BY escola_chave ORDER BY COUNT(*) DESC, 1 LIMIT 8`, [busca]);
      res.json({ escolas: rows });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui buscar as escolas agora.' });
    }
  });

  app.get('/api/comunidade/colegas', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const minha = (await pool.query('SELECT escola, escola_chave FROM usuarios WHERE id = $1', [eu])).rows[0] || {};
      if (!minha.escola_chave) return res.json({ escola: null, colegas: [] });
      const { rows } = await pool.query(
        `SELECT u.id, u.username AS nome, u.foto_id,
                EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = $1 AND s.seguido_id = u.id) AS sigo,
                EXISTS (SELECT 1 FROM presenca p WHERE p.usuario_id = u.id AND p.visto_em > NOW() - ${ONLINE}) AS online,
                EXISTS (SELECT 1 FROM respostas r WHERE r.usuario_id = u.id AND r.created_at >= ${INICIO_DE_HOJE}) AS estudou_hoje
           FROM usuarios u
          WHERE u.escola_chave = $2 AND u.id <> $1 AND ${SEM_BLOQUEIO}
          ORDER BY online DESC, estudou_hoje DESC, u.ultimo_acesso DESC NULLS LAST
          LIMIT 30`, [eu, minha.escola_chave]);
      const total = (await pool.query('SELECT COUNT(*)::int AS n FROM usuarios WHERE escola_chave = $1 AND id <> $2', [minha.escola_chave, eu])).rows[0].n;
      res.json({ escola: minha.escola, total,
        colegas: rows.map(r => ({ ...pessoa(r), sigo: r.sigo, online: r.online, estudou_hoje: r.estudou_hoje })) });
    } catch (erro) {
      console.error('Erro ao listar colegas:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar os colegas agora.' });
    }
  });

  // Quem chegou nesta semana: primeiro os da sua escola, depois os do seu grupo.
  app.get('/api/comunidade/chegaram', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const { rows } = await pool.query(
        `SELECT * FROM (SELECT u.id, u.username AS nome, u.foto_id, u.escola, u.created_at,
                (u.escola_chave IS NOT NULL AND u.escola_chave = (SELECT escola_chave FROM usuarios WHERE id = $1)) AS mesma_escola,
                (SELECT g.nome FROM grupo_membros a JOIN grupo_membros b ON b.grupo_id = a.grupo_id JOIN grupos g ON g.id = a.grupo_id
                  WHERE a.usuario_id = $1 AND b.usuario_id = u.id AND g.tipo = 'objetivo' LIMIT 1) AS grupo_comum,
                EXISTS (SELECT 1 FROM boas_vindas w WHERE w.novo_id = u.id AND w.quem_id = $1) AS dei,
                (SELECT COUNT(*)::int FROM boas_vindas w WHERE w.novo_id = u.id) AS recebeu
           FROM usuarios u
          WHERE u.created_at > NOW() - INTERVAL '${DIAS_DE_NOVATO} days' AND u.id <> $1 AND ${SEM_BLOQUEIO}) n
          ORDER BY n.dei, n.mesma_escola DESC, (n.grupo_comum IS NOT NULL) DESC, n.created_at DESC
          LIMIT 8`, [eu]);
      res.json({ chegaram: rows.map(r => ({ ...pessoa(r), dei: r.dei, recebeu: r.recebeu,
        motivo: r.mesma_escola ? `Da sua escola${r.escola ? `: ${r.escola}` : ''}` : r.grupo_comum ? `Também quer ${r.grupo_comum}` : 'Chegou esta semana' })) });
    } catch (erro) {
      console.error('Erro ao listar quem chegou:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });

  app.post('/api/comunidade/boas-vindas/:id', exigirLogin, freioBoasVindas, async (req, res) => {
    const eu = req.usuario.id, id = idValido(req.params.id);
    if (!id || id === eu) return res.status(400).json({ error: 'Não dá para dar boas-vindas para essa pessoa.' });
    try {
      const novo = (await pool.query(
        `SELECT u.id FROM usuarios u WHERE u.id = $2 AND u.created_at > NOW() - INTERVAL '30 days' AND ${SEM_BLOQUEIO}`, [eu, id])).rows[0];
      if (!novo) return res.status(404).json({ error: 'Essa pessoa já não é nova por aqui 🙂' });
      const r = await pool.query('INSERT INTO boas_vindas (novo_id, quem_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, eu]);
      if (r.rowCount) await notificar(pool, { usuarioId: id, atorId: eu, tipo: 'boas_vindas', alvoTipo: 'perfil', alvoId: eu });
      res.json({ message: 'Boas-vindas enviadas 👋' });
    } catch (erro) {
      console.error('Erro nas boas-vindas:', erro.message);
      res.status(500).json({ error: 'Não consegui enviar agora.' });
    }
  });

  // Para o Treinar e o fim do bloco: quem da sua escola e do seu grupo estudou hoje.
  app.get('/api/comunidade/junto', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const minha = (await pool.query(
        `SELECT u.escola, u.escola_chave,
                (SELECT g.id FROM grupo_membros m JOIN grupos g ON g.id = m.grupo_id WHERE m.usuario_id = u.id AND g.tipo = 'objetivo' ORDER BY m.created_at LIMIT 1) AS grupo_id
           FROM usuarios u WHERE u.id = $1`, [eu])).rows[0] || {};
      const contar = async (filtro, valor) => {
        const { rows } = await pool.query(
          `SELECT u.id, u.username AS nome, u.foto_id,
                  EXISTS (SELECT 1 FROM presenca p WHERE p.usuario_id = u.id AND p.visto_em > NOW() - ${ONLINE}) AS online
             FROM usuarios u
            WHERE u.id <> $1 AND ${filtro} AND ${SEM_BLOQUEIO}
              AND EXISTS (SELECT 1 FROM respostas r WHERE r.usuario_id = u.id AND r.created_at >= ${INICIO_DE_HOJE})
            ORDER BY online DESC, u.ultimo_acesso DESC NULLS LAST LIMIT 50`, [eu, valor]);
        return { estudaram_hoje: rows.length, pessoas: rows.slice(0, 3).map(r => ({ ...pessoa(r), online: r.online })) };
      };
      const escola = minha.escola_chave ? { nome: minha.escola, ...await contar('u.escola_chave = $2', minha.escola_chave) } : null;
      const grupo = minha.grupo_id ? {
        nome: (await pool.query('SELECT nome FROM grupos WHERE id = $1', [minha.grupo_id])).rows[0]?.nome,
        ...await contar('EXISTS (SELECT 1 FROM grupo_membros m WHERE m.usuario_id = u.id AND m.grupo_id = $2)', minha.grupo_id)
      } : null;
      res.json({ escola, grupo });
    } catch (erro) {
      console.error('Erro no estudando junto:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });
}

module.exports = registrarAcolhimento;
module.exports.chaveDaEscola = chaveDaEscola;
module.exports.lerEscola = lerEscola;
