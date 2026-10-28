// Dupla de estudo e conquistas para comemorar junto.
//
// Dupla: duas pessoas se acompanham. Uma convida, a outra aceita (cada um tem
// uma dupla por vez). Ao aceitar, as duas passam a se seguir, o que libera as
// mensagens. No painel da dupla cada um vê como o outro está hoje (questões,
// meta, sequência) e pode "chamar para estudar" (vira notificação).
//
// Comemorar: conquistas recentes de quem você segue, da sua dupla e da sua
// escola (sequência, nota TRI subindo, Arena, desafio...) aparecem juntas para
// um 👏 de um toque. A reação já avisa quem conquistou.

const imagens = require('./imagens');
const { notificar } = require('./social');
const { registrarAtividade, sequenciaDe } = require('./comunidade');

const CONVITES_PENDENTES = 5;
const ONLINE = "INTERVAL '3 minutes'";
const INICIO_DE_HOJE = "(date_trunc('day', NOW() - INTERVAL '3 hours') + INTERVAL '3 hours')";
const bloqueio = (a, b) => `EXISTS (SELECT 1 FROM bloqueios x WHERE (x.usuario_id = ${a} AND x.bloqueado_id = ${b}) OR (x.usuario_id = ${b} AND x.bloqueado_id = ${a}))`;
const TIPOS_DE_CONQUISTA = ['sequencia', 'tri', 'arena', 'desafio', 'melhor_resposta', 'pomodoros', 'correcoes', 'dupla'];
const SUBIDA_QUE_CONTA = 15; // pontos de TRI a mais para virar conquista
const NOME_DA_AREA = { linguagens: 'Linguagens', 'ciencias-humanas': 'Humanas', 'ciencias-natureza': 'Natureza', matematica: 'Matemática' };

// Nota TRI nova: a primeira de uma área ou um recorde 15 pontos acima do
// anterior vira conquista. Chamado depois de calcular as notas do aluno.
async function registrarRecordesTri(pool, usuarioId, notas) {
  for (const [area, n] of Object.entries(notas || {})) {
    if (!n || n.nota === null || n.nota === undefined || !NOME_DA_AREA[area]) continue;
    const nota = Math.round(n.nota);
    try {
      const antes = (await pool.query('SELECT nota FROM tri_recordes WHERE usuario_id = $1 AND area = $2', [usuarioId, area])).rows[0];
      if (antes && nota <= antes.nota) continue;
      await pool.query(
        `INSERT INTO tri_recordes (usuario_id, area, nota) VALUES ($1, $2, $3)
         ON CONFLICT (usuario_id, area) DO UPDATE SET nota = EXCLUDED.nota, updated_at = NOW()`, [usuarioId, area, nota]);
      if (!antes || nota - antes.nota >= SUBIDA_QUE_CONTA) {
        await registrarAtividade(pool, { usuarioId, tipo: 'tri', texto: `${NOME_DA_AREA[area]}${antes ? `|${antes.nota}` : ''}`, alvoId: nota });
      }
    } catch (erro) {
      console.error('Erro no recorde de TRI:', erro.message);
    }
  }
}

function registrarDuplas(app, { pool, auth, limitar, exigirLogin }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioConvite = limitar(auth.criarFreio(15, 24 * 60 * 60 * 1000), 'Muitos convites hoje. Tente amanhã 🙂', porConta);
  const freioToque = limitar(auth.criarFreio(4, 3 * 60 * 60 * 1000), 'Você já chamou sua dupla agora há pouco. Dê um tempinho 🙂', porConta);
  const idValido = v => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
  const pessoa = (id, nome, fotoId) => ({ id, nome, foto: imagens.urlAssinada(fotoId) });

  const duplaAtiva = async id => (await pool.query(
    `SELECT * FROM duplas WHERE status = 'ativa' AND (convidou_id = $1 OR convidado_id = $1) LIMIT 1`, [id])).rows[0] || null;

  async function resumoDe(id) {
    const [hoje, meta, seq, u] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE acertou)::int AS certas FROM respostas WHERE usuario_id = $1 AND created_at >= ${INICIO_DE_HOJE}`, [id]),
      pool.query(`SELECT texto, feito FROM atividades WHERE usuario_id = $1 AND tipo = 'meta' AND NOT oculto AND created_at >= ${INICIO_DE_HOJE} ORDER BY id DESC LIMIT 1`, [id]),
      sequenciaDe(pool, id),
      pool.query(`SELECT u.username, u.foto_id, EXISTS (SELECT 1 FROM presenca p WHERE p.usuario_id = u.id AND p.visto_em > NOW() - ${ONLINE}) AS online FROM usuarios u WHERE u.id = $1`, [id])
    ]);
    return { ...pessoa(id, u.rows[0]?.username, u.rows[0]?.foto_id), online: Boolean(u.rows[0]?.online),
      questoes_hoje: hoje.rows[0].n, certas_hoje: hoje.rows[0].certas, meta: meta.rows[0] || null,
      sequencia: seq.dias, estudou_hoje: Boolean(seq.hoje) };
  }

  app.get('/api/dupla', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const d = await duplaAtiva(eu);
      if (d) {
        const parceiro = d.convidou_id === eu ? d.convidado_id : d.convidou_id;
        const [minha, dele] = await Promise.all([resumoDe(eu), resumoDe(parceiro)]);
        return res.json({ dupla: { id: d.id, desde: d.aceita_em, eu: minha, parceiro: dele } });
      }
      const convites = await pool.query(
        `SELECT d.id, d.convidou_id, d.convidado_id, d.created_at, u.id AS uid, u.username, u.foto_id
           FROM duplas d JOIN usuarios u ON u.id = CASE WHEN d.convidou_id = $1 THEN d.convidado_id ELSE d.convidou_id END
          WHERE d.status = 'pendente' AND (d.convidou_id = $1 OR d.convidado_id = $1)
          ORDER BY d.created_at DESC LIMIT 20`, [eu]);
      // Sugestões: mesma escola ou mesmo grupo do objetivo, sem dupla e ativo nas últimas 2 semanas.
      const sugestoes = await pool.query(
        `SELECT * FROM (SELECT u.id, u.username, u.foto_id,
                (u.escola_chave IS NOT NULL AND u.escola_chave = (SELECT escola_chave FROM usuarios WHERE id = $1)) AS mesma_escola,
                (SELECT g.nome FROM grupo_membros a JOIN grupo_membros b ON b.grupo_id = a.grupo_id JOIN grupos g ON g.id = a.grupo_id
                  WHERE a.usuario_id = $1 AND b.usuario_id = u.id AND g.tipo = 'objetivo' LIMIT 1) AS grupo_comum,
                u.ultimo_acesso
           FROM usuarios u
          WHERE u.id <> $1 AND u.ultimo_acesso > NOW() - INTERVAL '14 days' AND NOT ${bloqueio('$1', 'u.id')}
            AND NOT EXISTS (SELECT 1 FROM duplas d WHERE (d.status = 'ativa' AND (d.convidou_id = u.id OR d.convidado_id = u.id))
                                                   OR (d.convidou_id = $1 AND d.convidado_id = u.id) OR (d.convidou_id = u.id AND d.convidado_id = $1))) s
          WHERE s.mesma_escola OR s.grupo_comum IS NOT NULL
          ORDER BY s.mesma_escola DESC, (s.grupo_comum IS NOT NULL) DESC, s.ultimo_acesso DESC LIMIT 6`, [eu]);
      res.json({
        dupla: null,
        recebidos: convites.rows.filter(c => c.convidado_id === eu).map(c => ({ id: c.id, de: pessoa(c.uid, c.username, c.foto_id) })),
        enviados: convites.rows.filter(c => c.convidou_id === eu).map(c => ({ id: c.id, para: pessoa(c.uid, c.username, c.foto_id) })),
        sugestoes: sugestoes.rows.map(s => ({ ...pessoa(s.id, s.username, s.foto_id), motivo: s.mesma_escola ? 'Da sua escola' : `Também quer ${s.grupo_comum}` }))
      });
    } catch (erro) {
      console.error('Erro ao ler a dupla:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar a dupla agora.' });
    }
  });

  app.post('/api/dupla/convidar/:id', exigirLogin, freioConvite, async (req, res) => {
    const eu = req.usuario.id, outro = idValido(req.params.id);
    if (!outro || outro === eu) return res.status(400).json({ error: 'Não dá para convidar essa pessoa.' });
    try {
      if (await duplaAtiva(eu)) return res.status(409).json({ error: 'Você já tem uma dupla. Para trocar, desfaça a atual primeiro.' });
      const existe = (await pool.query(`SELECT 1 FROM usuarios u WHERE u.id = $2 AND NOT ${bloqueio('$1', 'u.id')}`, [eu, outro])).rowCount;
      if (!existe) return res.status(404).json({ error: 'Não dá para convidar essa pessoa.' });
      if (await duplaAtiva(outro)) return res.status(409).json({ error: 'Essa pessoa já tem uma dupla de estudo.' });
      // Ela já tinha me convidado: vira dupla na hora.
      const inverso = (await pool.query(`SELECT id FROM duplas WHERE status = 'pendente' AND convidou_id = $2 AND convidado_id = $1`, [eu, outro])).rows[0];
      if (inverso) return res.json(await aceitar(inverso.id, eu));
      const pendentes = (await pool.query(`SELECT COUNT(*)::int AS n FROM duplas WHERE status = 'pendente' AND convidou_id = $1`, [eu])).rows[0].n;
      if (pendentes >= CONVITES_PENDENTES) return res.status(429).json({ error: `Você tem ${CONVITES_PENDENTES} convites esperando resposta. Espere alguém responder.` });
      const r = await pool.query(
        `INSERT INTO duplas (convidou_id, convidado_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`, [eu, outro]);
      if (r.rowCount) await notificar(pool, { usuarioId: outro, atorId: eu, tipo: 'dupla_convite', alvoTipo: 'dupla', alvoId: r.rows[0].id });
      res.json({ message: 'Convite enviado 🤝 Quando a pessoa aceitar, vocês viram dupla.' });
    } catch (erro) {
      console.error('Erro ao convidar para dupla:', erro.message);
      res.status(500).json({ error: 'Não consegui enviar o convite agora.' });
    }
  });

  async function aceitar(duplaId, eu) {
    const d = (await pool.query(`SELECT * FROM duplas WHERE id = $1 AND status = 'pendente' AND convidado_id = $2`, [duplaId, eu])).rows[0];
    if (!d) return { erro: 404, error: 'Esse convite não existe mais.' };
    if (await duplaAtiva(eu) || await duplaAtiva(d.convidou_id)) return { erro: 409, error: 'Uma de vocês já tem dupla agora.' };
    await pool.query(`UPDATE duplas SET status = 'ativa', aceita_em = NOW() WHERE id = $1`, [d.id]);
    // Os outros convites das duas pessoas perdem o sentido.
    await pool.query(`DELETE FROM duplas WHERE status = 'pendente' AND (convidou_id IN ($1, $2) OR convidado_id IN ($1, $2))`, [d.convidou_id, d.convidado_id]);
    await pool.query(
      `INSERT INTO seguidores (seguidor_id, seguido_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING`, [d.convidou_id, d.convidado_id]);
    await notificar(pool, { usuarioId: d.convidou_id, atorId: eu, tipo: 'dupla_aceita', alvoTipo: 'dupla', alvoId: d.id });
    const nome = (await pool.query('SELECT username FROM usuarios WHERE id = $1', [d.convidou_id])).rows[0]?.username;
    await registrarAtividade(pool, { usuarioId: eu, tipo: 'dupla', texto: nome, alvoId: d.convidou_id });
    return { message: 'Agora vocês são dupla de estudo 🤝' };
  }

  app.post('/api/dupla/:id/aceitar', exigirLogin, async (req, res) => {
    try {
      const r = await aceitar(idValido(req.params.id), req.usuario.id);
      if (r.erro) return res.status(r.erro).json({ error: r.error });
      res.json(r);
    } catch (erro) {
      console.error('Erro ao aceitar dupla:', erro.message);
      res.status(500).json({ error: 'Não consegui aceitar agora.' });
    }
  });

  // Recusar (quem foi convidado) ou cancelar (quem convidou), sem avisar ninguém.
  app.post('/api/dupla/:id/recusar', exigirLogin, async (req, res) => {
    try {
      await pool.query(`DELETE FROM duplas WHERE id = $1 AND status = 'pendente' AND (convidou_id = $2 OR convidado_id = $2)`, [idValido(req.params.id), req.usuario.id]);
      res.json({ message: 'Pronto.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.post('/api/dupla/toque', exigirLogin, freioToque, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const d = await duplaAtiva(eu);
      if (!d) return res.status(404).json({ error: 'Você ainda não tem dupla.' });
      await notificar(pool, { usuarioId: d.convidou_id === eu ? d.convidado_id : d.convidou_id, atorId: eu, tipo: 'dupla_toque', alvoTipo: 'dupla', alvoId: d.id });
      res.json({ message: 'Chamado enviado 👊' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui chamar agora.' });
    }
  });

  // Desfazer é silencioso: ninguém recebe aviso de que a dupla acabou.
  app.post('/api/dupla/desfazer', exigirLogin, async (req, res) => {
    try {
      await pool.query(`DELETE FROM duplas WHERE status = 'ativa' AND (convidou_id = $1 OR convidado_id = $1)`, [req.usuario.id]);
      res.json({ message: 'Dupla desfeita.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // Conquistas das últimas 48 h de quem você segue, da sua dupla e da sua escola,
  // que você ainda não comemorou.
  app.get('/api/comunidade/comemorar', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const { rows } = await pool.query(
        `SELECT a.id, a.tipo, a.texto, a.alvo_id, a.created_at, u.id AS autor_id, u.username AS autor, u.foto_id
           FROM atividades a JOIN usuarios u ON u.id = a.usuario_id
          WHERE a.tipo = ANY($2::text[]) AND NOT a.oculto AND a.created_at > NOW() - INTERVAL '48 hours' AND a.usuario_id <> $1
            AND NOT ${bloqueio('$1', 'u.id')} AND NOT (a.tipo = 'dupla' AND a.alvo_id = $1)
            AND NOT EXISTS (SELECT 1 FROM atividades_reacoes r WHERE r.atividade_id = a.id AND r.usuario_id = $1)
            AND (EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = $1 AND s.seguido_id = u.id)
                 OR (u.escola_chave IS NOT NULL AND u.escola_chave = (SELECT escola_chave FROM usuarios WHERE id = $1))
                 OR EXISTS (SELECT 1 FROM grupo_membros a JOIN grupo_membros b ON b.grupo_id = a.grupo_id JOIN grupos g ON g.id = a.grupo_id
                             WHERE a.usuario_id = $1 AND b.usuario_id = u.id AND g.tipo = 'objetivo')
                 OR EXISTS (SELECT 1 FROM duplas d WHERE d.status = 'ativa' AND ((d.convidou_id = $1 AND d.convidado_id = u.id) OR (d.convidado_id = $1 AND d.convidou_id = u.id))))
          ORDER BY a.created_at DESC LIMIT 6`, [eu, TIPOS_DE_CONQUISTA]);
      res.json({ conquistas: rows.map(a => ({ id: a.id, tipo: a.tipo, texto: a.texto, alvo_id: a.alvo_id, created_at: a.created_at,
        autor: pessoa(a.autor_id, a.autor, a.foto_id) })) });
    } catch (erro) {
      console.error('Erro ao listar conquistas:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar agora.' });
    }
  });
}

module.exports = registrarDuplas;
module.exports.registrarRecordesTri = registrarRecordesTri;
module.exports.SUBIDA_QUE_CONTA = SUBIDA_QUE_CONTA;
