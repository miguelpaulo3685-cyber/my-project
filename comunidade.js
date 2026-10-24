// Comunidade viva: o que faz o aluno sentir que não estuda sozinho.
//
// - Presença: quem está no site agora e em qual sala (um sinal por minuto).
// - Atividade: metas do dia (como os stories), desafio feito, sequência,
//   pergunta nova, melhor resposta, pomodoros. Dá para reagir com 👏 🔥 💡.
// - Salas de estudo: todo mundo no mesmo pomodoro (25 min de foco, 5 de
//   pausa), alinhado ao relógio, e o bate-papo só abre na pausa.
// - Sequência, XP, nível e selos: o progresso que aparece para os outros.
// - Boas-vindas: os primeiros passos que conectam quem acabou de chegar.

const imagens = require('./imagens');
const { notificar } = require('./social');

const SALAS = [
  { id: 'geral', nome: 'Sala geral', emoji: '☕', chat: true },
  { id: 'matematica', nome: 'Matemática', emoji: '📐', chat: true },
  { id: 'natureza', nome: 'Natureza', emoji: '🧪', chat: true },
  { id: 'humanas', nome: 'Humanas', emoji: '🌎', chat: true },
  { id: 'linguagens', nome: 'Linguagens', emoji: '📚', chat: true },
  { id: 'redacao', nome: 'Redação', emoji: '✍️', chat: true },
  { id: 'silenciosa', nome: 'Silenciosa', emoji: '🤫', chat: false }
];
const SALA_POR_ID = new Map(SALAS.map(s => [s.id, s]));

const CICLO = 30 * 60 * 1000; // começa sempre na hora cheia e na meia hora
const FOCO = 25 * 60 * 1000;
const ONLINE = "INTERVAL '3 minutes'";
const REACOES = ['👏', '🔥', '💡'];
const DENUNCIAS_PARA_ESCONDER = 3;
const MARCOS_DE_SEQUENCIA = [3, 7, 14, 30, 60, 100, 200, 365];

// Em que parte do pomodoro coletivo estamos. Igual para todo mundo, sem
// guardar nada: basta o relógio.
function faseDoPomodoro(agora = Date.now()) {
  const ciclo = Math.floor(agora / CICLO);
  const inicio = ciclo * CICLO;
  const foco = agora - inicio < FOCO;
  return { ciclo, foco, inicio: new Date(inicio).toISOString(), termina_em: new Date(inicio + (foco ? FOCO : CICLO)).toISOString() };
}

// Dia no horário de Brasília, como "2026-10-20".
const BRASILIA = 3 * 3600 * 1000;
const hojeEmBrasilia = (agora = Date.now()) => new Date(agora - BRASILIA).toISOString().slice(0, 10);
const diasAntes = (dia, n) => new Date(Date.parse(dia + 'T00:00:00Z') - n * 86400000).toISOString().slice(0, 10);

// Dias seguidos estudando. Se hoje ainda não estudou, a sequência de ontem
// continua valendo (está "em risco" até a meia-noite).
function contarSequencia(dias, hoje = hojeEmBrasilia()) {
  const tem = new Set(dias);
  const base = tem.has(hoje) ? hoje : diasAntes(hoje, 1);
  let atual = 0;
  while (tem.has(diasAntes(base, atual))) atual++;
  let maior = 0;
  for (const d of tem) {
    if (tem.has(diasAntes(d, 1))) continue; // só conta a partir do primeiro dia de cada sequência
    let n = 0;
    while (tem.has(diasAntes(d, -n))) n++;
    maior = Math.max(maior, n);
  }
  return { dias: atual, hoje: tem.has(hoje), maior: Math.max(maior, atual) };
}

// Dias (de Brasília) em que a pessoa estudou: treino, pomodoro, desafio ou simulado.
async function sequenciaDe(pool, usuarioId) {
  const { rows } = await pool.query(
    `SELECT to_char((created_at - INTERVAL '3 hours')::date, 'YYYY-MM-DD') AS d FROM respostas WHERE usuario_id = $1 AND created_at > NOW() - INTERVAL '400 days'
     UNION SELECT to_char(dia, 'YYYY-MM-DD') FROM pomodoros WHERE usuario_id = $1 AND n > 0
     UNION SELECT to_char((created_at - INTERVAL '3 hours')::date, 'YYYY-MM-DD') FROM desafio_resultados WHERE usuario_id = $1
     UNION SELECT to_char((created_at - INTERVAL '3 hours')::date, 'YYYY-MM-DD') FROM simulados WHERE usuario_id = $1`, [usuarioId]);
  return contarSequencia(rows.map(r => r.d));
}

// XP de cada coisa que a pessoa faz. Ajudar os outros vale mais que treinar sozinho.
const XP = { questao: 1, acerto: 1, pomodoro: 10, desafio: 20, ajuda: 5, melhor: 25, util: 3, correcao: 15, correcao_util: 5 };
const TITULOS = [[1, 'Calouro'], [3, 'Estudante'], [5, 'Focado'], [8, 'Dedicado'], [12, 'Veterano'], [16, 'Mestre'], [22, 'Lenda']];

// Nível n começa em 25·n·(n-1) XP: 0, 50, 150, 300, 500...
const xpDoNivel = n => 25 * n * (n - 1);
function nivelDoXp(xp) {
  const nivel = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 25)) / 2));
  const titulo = TITULOS.filter(([n]) => n <= nivel).pop()[1];
  return { nivel, titulo, xp, xp_do_nivel: xpDoNivel(nivel), xp_do_proximo: xpDoNivel(nivel + 1) };
}

const SELOS = [
  { id: 'sequencia7', emoji: '🔥', nome: '7 dias seguidos', vale: c => c.maior >= 7 },
  { id: 'sequencia30', emoji: '🌋', nome: '30 dias seguidos', vale: c => c.maior >= 30 },
  { id: 'questoes500', emoji: '🎯', nome: '500 questões', vale: c => c.questoes >= 500 },
  { id: 'ajudou10', emoji: '🤝', nome: 'Ajudou 10 pessoas', vale: c => c.ajudas >= 10 },
  { id: 'melhor', emoji: '🏅', nome: 'Melhor resposta', vale: c => c.melhores >= 1 },
  { id: 'melhor10', emoji: '🎓', nome: '10 melhores respostas', vale: c => c.melhores >= 10 },
  { id: 'pomodoro25', emoji: '⏱️', nome: '25 pomodoros', vale: c => c.pomodoros >= 25 },
  { id: 'corretor10', emoji: '✍️', nome: '10 redações corrigidas', vale: c => c.correcoes >= 10 },
  { id: 'desafio4', emoji: '🏆', nome: '4 desafios da semana', vale: c => c.desafios >= 4 },
  { id: 'arena1', emoji: '⚔️', nome: 'Venceu na Arena', vale: c => c.arena_vitorias >= 1 },
  { id: 'arena10', emoji: '👑', nome: '10 vitórias na Arena', vale: c => c.arena_vitorias >= 10 },
  { id: 'arena_invicto', emoji: '💯', nome: 'Gabaritou uma Arena', vale: c => c.arena_invicto }
];

// Registra algo na atividade da comunidade. Nunca atrapalha a ação principal.
async function registrarAtividade(pool, { usuarioId, tipo, texto = null, alvoId = null }) {
  try {
    await pool.query('INSERT INTO atividades (usuario_id, tipo, texto, alvo_id) VALUES ($1, $2, $3, $4)',
      [usuarioId, tipo, texto ? String(texto).slice(0, 200) : null, alvoId]);
  } catch (erro) {
    console.error('Erro ao registrar atividade:', erro.message);
  }
}

// Começo do dia de hoje em Brasília, no relógio do banco (UTC).
const INICIO_DE_HOJE = "(date_trunc('day', NOW() - INTERVAL '3 hours') + INTERVAL '3 hours')";

function registrarComunidade(app, { pool, auth, limitar, exigirLogin }) {
  const porConta = req => `u${req.usuario.id}`;
  const freioMeta = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Calma! Muitas mudanças na meta.', porConta);
  const freioReagir = limitar(auth.criarFreio(200, 60 * 60 * 1000), 'Calma! Muitas reações em pouco tempo.', porConta);
  const freioChat = limitar(auth.criarFreio(12, 60 * 1000), 'Devagar no chat 🙂', porConta);
  const freioDenunciar = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.', porConta);
  const idValido = valor => { const n = Number(valor); return Number.isInteger(n) && n > 0 ? n : null; };
  const pessoa = (id, nome, fotoId) => ({ id, nome, foto: imagens.urlAssinada(fotoId) });

  // ---------- presença ----------
  // Trocar de sala (ou ficar 3 minutos sem sinal) recomeça o "desde", que é
  // o que vale para contar o pomodoro.
  app.post('/api/presenca', exigirLogin, async (req, res) => {
    const sala = req.body?.sala && SALA_POR_ID.has(req.body.sala) ? req.body.sala : null;
    try {
      await pool.query(
        `INSERT INTO presenca (usuario_id, sala) VALUES ($1, $2)
         ON CONFLICT (usuario_id) DO UPDATE SET
           desde = CASE WHEN presenca.sala IS NOT DISTINCT FROM EXCLUDED.sala AND presenca.visto_em > NOW() - ${ONLINE}
                        THEN presenca.desde ELSE NOW() END,
           sala = EXCLUDED.sala, visto_em = NOW()`, [req.usuario.id, sala]
      );
      res.json({ ok: true });
    } catch (erro) {
      res.status(500).json({ error: 'Falhou.' });
    }
  });

  // ---------- agora no site ----------
  // Sem conta: só os números. Com conta: quem está, as metas e a atividade.
  app.get('/api/comunidade/agora', async (req, res) => {
    const eu = req.usuario;
    try {
      const numeros = (await pool.query(
        `SELECT (SELECT COUNT(*)::int FROM presenca WHERE visto_em > NOW() - ${ONLINE}) AS online,
                (SELECT COUNT(*)::int FROM presenca WHERE visto_em > NOW() - ${ONLINE} AND sala IS NOT NULL) AS em_salas,
                (SELECT COUNT(DISTINCT usuario_id)::int FROM respostas WHERE created_at >= ${INICIO_DE_HOJE} AND usuario_id IS NOT NULL) AS estudaram_hoje,
                (SELECT COUNT(*)::int FROM respostas WHERE created_at >= ${INICIO_DE_HOJE}) AS questoes_hoje`
      )).rows[0];
      const porSala = (await pool.query(
        `SELECT sala, COUNT(*)::int AS n FROM presenca WHERE visto_em > NOW() - ${ONLINE} AND sala IS NOT NULL GROUP BY sala`
      )).rows;
      const contagem = Object.fromEntries(porSala.map(s => [s.sala, s.n]));
      const salas = SALAS.map(s => ({ ...s, presentes: contagem[s.id] || 0 }));
      const base = { ...numeros, salas, pomodoro: faseDoPomodoro() };
      if (!eu) return res.json(base);

      const filtro = req.query.filtro === 'seguindo' ? 'seguindo' : 'todos';
      const [online, metas, atividades, perguntas] = await Promise.all([
        pool.query(
          `SELECT u.id, u.username AS nome, u.foto_id, p.sala
             FROM presenca p JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.visto_em > NOW() - ${ONLINE}
            ORDER BY (u.id = $1) DESC, EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = $1 AND s.seguido_id = u.id) DESC, p.visto_em DESC
            LIMIT 12`, [eu.id]),
        // A meta mais recente de cada pessoa nas últimas 24 horas: a sua
        // primeiro, depois de quem você segue.
        pool.query(
          `SELECT * FROM (
             SELECT DISTINCT ON (a.usuario_id) a.id, a.texto, a.feito, a.created_at, u.id AS autor_id, u.username AS autor, u.foto_id,
                    EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = $1 AND s.seguido_id = u.id) AS sigo
               FROM atividades a JOIN usuarios u ON u.id = a.usuario_id
              WHERE a.tipo = 'meta' AND NOT a.oculto AND a.created_at > NOW() - INTERVAL '24 hours'
              ORDER BY a.usuario_id, a.id DESC) m
            ORDER BY (m.autor_id = $1) DESC, m.sigo DESC, m.id DESC LIMIT 30`, [eu.id]),
        pool.query(
          `SELECT a.id, a.tipo, a.texto, a.alvo_id, a.feito, a.created_at, u.id AS autor_id, u.username AS autor, u.foto_id
             FROM atividades a JOIN usuarios u ON u.id = a.usuario_id
            WHERE NOT a.oculto AND a.tipo <> 'meta'
              AND ($2 <> 'seguindo' OR a.usuario_id = $1 OR a.usuario_id IN (SELECT seguido_id FROM seguidores WHERE seguidor_id = $1))
            ORDER BY a.created_at DESC, a.id DESC LIMIT 40`, [eu.id, filtro]),
        pool.query(
          `SELECT p.id, p.area, p.titulo, p.created_at, u.username AS autor
             FROM perguntas p JOIN usuarios u ON u.id = p.usuario_id
            WHERE NOT p.oculto AND NOT EXISTS (SELECT 1 FROM perguntas_respostas r WHERE r.pergunta_id = p.id AND NOT r.oculto)
            ORDER BY p.id DESC LIMIT 3`)
      ]);
      const ids = [...metas.rows, ...atividades.rows].map(a => a.id);
      const reacoes = ids.length ? (await pool.query(
        `SELECT atividade_id, emoji, COUNT(*)::int AS n, BOOL_OR(usuario_id = $2) AS minha
           FROM atividades_reacoes WHERE atividade_id = ANY($1::int[]) GROUP BY atividade_id, emoji`, [ids, eu.id]
      )).rows : [];
      const reacoesDe = id => {
        const contagem = [0, 0, 0];
        let minha = null;
        for (const r of reacoes) if (r.atividade_id === id) { contagem[r.emoji] = r.n; if (r.minha) minha = r.emoji; }
        return { reacoes: contagem, minha };
      };
      const item = a => ({
        id: a.id, tipo: a.tipo, texto: a.texto, alvo_id: a.alvo_id, feito: a.feito, created_at: a.created_at,
        autor: pessoa(a.autor_id, a.autor, a.foto_id), meu: a.autor_id === eu.id, ...reacoesDe(a.id)
      });
      res.json({
        ...base,
        pessoas_online: online.rows.map(p => ({ ...pessoa(p.id, p.nome, p.foto_id), sala: p.sala })),
        metas: metas.rows.map(item),
        atividades: atividades.rows.map(item),
        perguntas_sem_resposta: perguntas.rows,
        filtro
      });
    } catch (erro) {
      console.error('Erro ao montar o agora:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar a comunidade agora.' });
    }
  });

  // ---------- meta do dia ----------
  // Uma por dia: escrever de novo troca o texto.
  app.post('/api/comunidade/meta', exigirLogin, freioMeta, async (req, res) => {
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim().replace(/\s+/g, ' ') : '';
    if (texto.length < 3 || texto.length > 120) return res.status(400).json({ error: 'A meta precisa ter de 3 a 120 caracteres.' });
    try {
      const atual = await pool.query(
        `SELECT id FROM atividades WHERE usuario_id = $1 AND tipo = 'meta' AND created_at >= ${INICIO_DE_HOJE} ORDER BY id DESC LIMIT 1`, [req.usuario.id]);
      if (atual.rows[0]) {
        await pool.query('UPDATE atividades SET texto = $2, feito = FALSE, oculto = FALSE WHERE id = $1', [atual.rows[0].id, texto]);
        await pool.query('DELETE FROM atividades_denuncias WHERE atividade_id = $1', [atual.rows[0].id]);
        return res.json({ id: atual.rows[0].id });
      }
      const r = await pool.query(`INSERT INTO atividades (usuario_id, tipo, texto) VALUES ($1, 'meta', $2) RETURNING id`, [req.usuario.id, texto]);
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao salvar meta:', erro.message);
      res.status(500).json({ error: 'Não consegui salvar a meta agora.' });
    }
  });

  // Cumpriu a meta: quem apoiou fica sabendo.
  app.post('/api/comunidade/meta/feito', exigirLogin, async (req, res) => {
    try {
      const r = await pool.query(
        `UPDATE atividades SET feito = TRUE
          WHERE id = (SELECT id FROM atividades WHERE usuario_id = $1 AND tipo = 'meta' AND created_at >= ${INICIO_DE_HOJE} ORDER BY id DESC LIMIT 1)
            AND NOT feito RETURNING id, texto`, [req.usuario.id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Você ainda não tem meta hoje (ou já marcou como cumprida).' });
      const apoios = await pool.query('SELECT usuario_id FROM atividades_reacoes WHERE atividade_id = $1 LIMIT 50', [r.rows[0].id]);
      for (const a of apoios.rows) {
        await notificar(pool, { usuarioId: a.usuario_id, atorId: req.usuario.id, tipo: 'meta_cumprida', alvoTipo: 'atividade', alvoId: r.rows[0].id, texto: r.rows[0].texto });
      }
      res.json({ feito: true });
    } catch (erro) {
      console.error('Erro ao cumprir meta:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  // ---------- reações ----------
  // Mesma reação de novo tira; outra troca.
  app.post('/api/atividades/:id/reagir', exigirLogin, freioReagir, async (req, res) => {
    const id = idValido(req.params.id);
    const emoji = Number(req.body?.emoji);
    if (!id || ![0, 1, 2].includes(emoji)) return res.status(400).json({ error: 'Reação inválida.' });
    try {
      const a = await pool.query('SELECT usuario_id, tipo FROM atividades WHERE id = $1 AND NOT oculto', [id]);
      if (!a.rows[0]) return res.status(404).json({ error: 'Essa atividade não existe mais.' });
      const saiu = await pool.query('DELETE FROM atividades_reacoes WHERE atividade_id = $1 AND usuario_id = $2 AND emoji = $3', [id, req.usuario.id, emoji]);
      let minha = null;
      if (!saiu.rowCount) {
        await pool.query(
          `INSERT INTO atividades_reacoes (atividade_id, usuario_id, emoji) VALUES ($1, $2, $3)
           ON CONFLICT (atividade_id, usuario_id) DO UPDATE SET emoji = EXCLUDED.emoji`, [id, req.usuario.id, emoji]);
        minha = emoji;
        await notificar(pool, { usuarioId: a.rows[0].usuario_id, atorId: req.usuario.id, tipo: a.rows[0].tipo === 'meta' ? 'apoio' : 'reacao', alvoTipo: 'atividade', alvoId: id, texto: REACOES[emoji] });
      }
      const { rows } = await pool.query('SELECT emoji, COUNT(*)::int AS n FROM atividades_reacoes WHERE atividade_id = $1 GROUP BY emoji', [id]);
      const reacoes = [0, 0, 0];
      for (const r of rows) reacoes[r.emoji] = r.n;
      res.json({ reacoes, minha });
    } catch (erro) {
      console.error('Erro ao reagir:', erro.message);
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.delete('/api/atividades/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Atividade não encontrada.' });
    try {
      const r = await pool.query('DELETE FROM atividades WHERE id = $1 AND (usuario_id = $2 OR $3)', [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Atividade não encontrada ou não é sua.' });
      res.json({ message: 'Apagada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.post('/api/atividades/:id/denunciar', exigirLogin, freioDenunciar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Atividade não encontrada.' });
    try {
      const a = await pool.query('SELECT usuario_id FROM atividades WHERE id = $1', [id]);
      if (!a.rows[0]) return res.status(404).json({ error: 'Atividade não encontrada.' });
      if (a.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar a si mesmo.' });
      await pool.query('INSERT INTO atividades_denuncias (atividade_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.usuario.id]);
      await pool.query(
        `UPDATE atividades SET oculto = TRUE WHERE id = $1 AND (SELECT COUNT(*) FROM atividades_denuncias WHERE atividade_id = $1) >= $2`,
        [id, DENUNCIAS_PARA_ESCONDER]);
      res.json({ message: 'Obrigado! A denúncia foi registrada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  // ---------- meu progresso: sequência, XP, nível, selos e boas-vindas ----------
  app.get('/api/comunidade/eu', exigirLogin, async (req, res) => {
    const eu = req.usuario.id;
    try {
      const sequencia = await sequenciaDe(pool, eu);
      const c = (await pool.query(
        `SELECT (SELECT COUNT(*) FROM respostas WHERE usuario_id = $1)::int AS questoes,
                (SELECT COUNT(*) FROM respostas WHERE usuario_id = $1 AND acertou)::int AS acertos,
                (SELECT COALESCE(SUM(n), 0) FROM pomodoros WHERE usuario_id = $1)::int AS pomodoros,
                (SELECT COALESCE(SUM(n), 0) FROM pomodoros WHERE usuario_id = $1 AND dia = (NOW() - INTERVAL '3 hours')::date)::int AS pomodoros_hoje,
                (SELECT COUNT(*) FROM desafio_resultados WHERE usuario_id = $1)::int AS desafios,
                (SELECT COUNT(DISTINCT r.pergunta_id) FROM perguntas_respostas r JOIN perguntas p ON p.id = r.pergunta_id
                  WHERE r.usuario_id = $1 AND NOT r.oculto AND p.usuario_id <> $1)::int AS ajudas,
                (SELECT COUNT(*) FROM perguntas p JOIN perguntas_respostas r ON r.id = p.melhor_resposta_id
                  WHERE r.usuario_id = $1 AND p.usuario_id <> $1)::int AS melhores,
                ((SELECT COUNT(*) FROM perguntas_respostas_uteis v JOIN perguntas_respostas r ON r.id = v.resposta_id WHERE r.usuario_id = $1)
                 + (SELECT COUNT(*) FROM questoes_comentarios_uteis v JOIN questoes_comentarios q ON q.id = v.comentario_id WHERE q.usuario_id = $1))::int AS uteis,
                (SELECT COUNT(*) FROM redacoes_correcoes WHERE usuario_id = $1 AND NOT oculto)::int AS correcoes,
                (SELECT COUNT(*) FROM redacoes_correcoes WHERE usuario_id = $1 AND util AND NOT oculto)::int AS correcoes_uteis,
                (SELECT COALESCE(SUM(xp), 0) FROM arena_resultados WHERE usuario_id = $1)::int AS arena_xp,
                (SELECT COUNT(*) FROM arena_resultados r JOIN arena_partidas p ON p.id = r.partida_id
                  WHERE r.usuario_id = $1 AND r.posicao = 1 AND p.jogadores >= 2)::int AS arena_vitorias,
                EXISTS (SELECT 1 FROM arena_resultados WHERE usuario_id = $1 AND acertos = total AND total > 0) AS arena_invicto,
                EXISTS (SELECT 1 FROM grupo_membros WHERE usuario_id = $1) AS tem_grupo,
                (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = $1)::int AS seguindo,
                EXISTS (SELECT 1 FROM atividades WHERE usuario_id = $1 AND tipo = 'meta') AS fez_meta,
                (SELECT texto FROM atividades WHERE usuario_id = $1 AND tipo = 'meta' AND created_at >= ${INICIO_DE_HOJE} ORDER BY id DESC LIMIT 1) AS meta_hoje,
                (SELECT feito FROM atividades WHERE usuario_id = $1 AND tipo = 'meta' AND created_at >= ${INICIO_DE_HOJE} ORDER BY id DESC LIMIT 1) AS meta_feita`,
        [eu]
      )).rows[0];
      const xp = c.questoes * XP.questao + c.acertos * XP.acerto + c.pomodoros * XP.pomodoro + c.desafios * XP.desafio
        + c.ajudas * XP.ajuda + c.melhores * XP.melhor + c.uteis * XP.util
        + c.correcoes * XP.correcao + c.correcoes_uteis * XP.correcao_util + c.arena_xp;
      const contagem = { ...c, maior: sequencia.maior };

      // Marco de sequência vira atividade (uma vez por marco).
      if (sequencia.hoje && MARCOS_DE_SEQUENCIA.includes(sequencia.dias)) {
        await pool.query(
          `INSERT INTO atividades (usuario_id, tipo, alvo_id)
           SELECT $1, 'sequencia', $2 WHERE NOT EXISTS (
             SELECT 1 FROM atividades WHERE usuario_id = $1 AND tipo = 'sequencia' AND alvo_id = $2 AND created_at > NOW() - INTERVAL '2 days')`,
          [eu, sequencia.dias]);
      }

      const passos = [
        { id: 'grupo', feito: c.tem_grupo, titulo: 'Entre no grupo do seu objetivo', detalhe: 'Medicina, Direito, Engenharias…' },
        { id: 'seguir', feito: c.seguindo >= 3, titulo: 'Siga 3 pessoas', detalhe: `${Math.min(c.seguindo, 3)} de 3` },
        { id: 'questao', feito: c.questoes >= 1, titulo: 'Responda sua primeira questão', detalhe: 'Um bloco de 5 leva uns 10 minutos' },
        { id: 'meta', feito: c.fez_meta, titulo: 'Conte sua meta do dia', detalhe: 'Os outros podem apoiar 💪' }
      ];
      res.json({
        sequencia,
        ...nivelDoXp(xp),
        numeros: { correcoes: c.correcoes, questoes: c.questoes, acertos: c.acertos, pomodoros: c.pomodoros, pomodoros_hoje: c.pomodoros_hoje, desafios: c.desafios, ajudas: c.ajudas, melhores: c.melhores, uteis: c.uteis },
        selos: SELOS.map(s => ({ id: s.id, emoji: s.emoji, nome: s.nome, tem: s.vale(contagem) })),
        meta_hoje: c.meta_hoje ? { texto: c.meta_hoje, feito: c.meta_feita } : null,
        boas_vindas: { passos, completo: passos.every(p => p.feito) }
      });
    } catch (erro) {
      console.error('Erro ao calcular progresso da comunidade:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar seu progresso agora.' });
    }
  });

  // Pessoas para seguir: primeiro quem tem o mesmo objetivo, depois quem
  // está estudando de verdade nesta semana.
  app.get('/api/comunidade/sugestoes', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM (
           SELECT u.id, u.username AS nome, u.foto_id,
                  (SELECT g.nome FROM grupo_membros a JOIN grupo_membros b ON b.grupo_id = a.grupo_id JOIN grupos g ON g.id = a.grupo_id
                    WHERE a.usuario_id = $1 AND b.usuario_id = u.id AND g.tipo = 'objetivo' LIMIT 1) AS grupo_comum,
                  (SELECT COUNT(*) FROM respostas r WHERE r.usuario_id = u.id AND r.created_at > NOW() - INTERVAL '7 days')::int AS semana
             FROM usuarios u
            WHERE u.id <> $1 AND NOT EXISTS (SELECT 1 FROM seguidores s WHERE s.seguidor_id = $1 AND s.seguido_id = u.id)
            ORDER BY u.ultimo_acesso DESC NULLS LAST LIMIT 300) c
          ORDER BY (c.grupo_comum IS NOT NULL) DESC, c.semana DESC, c.id DESC LIMIT 6`, [req.usuario.id]);
      res.json({
        pessoas: rows.map(p => ({
          ...pessoa(p.id, p.nome, p.foto_id),
          motivo: p.grupo_comum ? `Também está em ${p.grupo_comum}` : p.semana ? `${p.semana} ${p.semana === 1 ? 'questão' : 'questões'} esta semana` : 'Novo por aqui'
        }))
      });
    } catch (erro) {
      console.error('Erro nas sugestões:', erro.message);
      res.status(500).json({ error: 'Não consegui carregar sugestões agora.' });
    }
  });

  // ---------- salas de estudo ----------
  app.get('/api/salas/:sala', exigirLogin, async (req, res) => {
    const sala = SALA_POR_ID.get(req.params.sala);
    if (!sala) return res.status(404).json({ error: 'Sala não encontrada.' });
    const depois = idValido(req.query.depois) || 0;
    try {
      const [presentes, mensagens, meus] = await Promise.all([
        pool.query(
          `SELECT u.id, u.username AS nome, u.foto_id, p.desde FROM presenca p JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.sala = $1 AND p.visto_em > NOW() - ${ONLINE} ORDER BY p.desde LIMIT 60`, [sala.id]),
        sala.chat ? pool.query(
          `SELECT * FROM (SELECT m.id, m.texto, m.created_at, u.id AS autor_id, u.username AS autor, u.foto_id,
                  EXISTS (SELECT 1 FROM sala_mensagens_denuncias d WHERE d.mensagem_id = m.id AND d.usuario_id = $3) AS denunciei
             FROM sala_mensagens m JOIN usuarios u ON u.id = m.usuario_id
            WHERE m.sala = $1 AND m.id > $2 AND NOT m.oculto AND m.created_at > NOW() - INTERVAL '12 hours'
            ORDER BY m.id DESC LIMIT 50) x ORDER BY id`, [sala.id, depois, req.usuario.id]) : { rows: [] },
        pool.query('SELECT n FROM pomodoros WHERE usuario_id = $1 AND dia = (NOW() - INTERVAL \'3 hours\')::date', [req.usuario.id])
      ]);
      res.json({
        sala, pomodoro: faseDoPomodoro(),
        presentes: presentes.rows.map(p => ({ ...pessoa(p.id, p.nome, p.foto_id), desde: p.desde })),
        mensagens: mensagens.rows.map(m => ({
          id: m.id, texto: m.texto, created_at: m.created_at, autor: pessoa(m.autor_id, m.autor, m.foto_id),
          minha: m.autor_id === req.usuario.id, denunciei: m.denunciei
        })),
        pomodoros_hoje: meus.rows[0] ? meus.rows[0].n : 0,
        moderador: Boolean(req.usuario.admin)
      });
    } catch (erro) {
      console.error('Erro ao abrir sala:', erro.message);
      res.status(500).json({ error: 'Não consegui abrir a sala agora.' });
    }
  });

  // O chat só abre na pausa: no foco, todo mundo estuda.
  app.post('/api/salas/:sala/mensagens', exigirLogin, freioChat, async (req, res) => {
    const sala = SALA_POR_ID.get(req.params.sala);
    if (!sala) return res.status(404).json({ error: 'Sala não encontrada.' });
    if (!sala.chat) return res.status(400).json({ error: 'Essa sala é silenciosa: sem chat.' });
    if (faseDoPomodoro().foco) return res.status(400).json({ error: 'O chat abre na pausa. Agora é foco! 💪' });
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto || texto.length > 300) return res.status(400).json({ error: 'A mensagem precisa ter de 1 a 300 caracteres.' });
    try {
      const aqui = await pool.query(`SELECT 1 FROM presenca WHERE usuario_id = $1 AND sala = $2 AND visto_em > NOW() - ${ONLINE}`, [req.usuario.id, sala.id]);
      if (!aqui.rowCount) return res.status(400).json({ error: 'Entre na sala para conversar.' });
      const r = await pool.query('INSERT INTO sala_mensagens (sala, usuario_id, texto) VALUES ($1, $2, $3) RETURNING id', [sala.id, req.usuario.id, texto]);
      res.status(201).json({ id: r.rows[0].id });
    } catch (erro) {
      console.error('Erro ao mandar mensagem:', erro.message);
      res.status(500).json({ error: 'Não consegui mandar agora.' });
    }
  });

  app.delete('/api/salas/mensagens/:id', exigirLogin, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Mensagem não encontrada.' });
    try {
      const r = await pool.query('DELETE FROM sala_mensagens WHERE id = $1 AND (usuario_id = $2 OR $3)', [id, req.usuario.id, Boolean(req.usuario.admin)]);
      if (!r.rowCount) return res.status(404).json({ error: 'Mensagem não encontrada ou não é sua.' });
      res.json({ message: 'Apagada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.post('/api/salas/mensagens/:id/denunciar', exigirLogin, freioDenunciar, async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ error: 'Mensagem não encontrada.' });
    try {
      const m = await pool.query('SELECT usuario_id FROM sala_mensagens WHERE id = $1', [id]);
      if (!m.rows[0]) return res.status(404).json({ error: 'Mensagem não encontrada.' });
      if (m.rows[0].usuario_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar a própria mensagem.' });
      await pool.query('INSERT INTO sala_mensagens_denuncias (mensagem_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.usuario.id]);
      await pool.query(
        `UPDATE sala_mensagens SET oculto = TRUE WHERE id = $1 AND (SELECT COUNT(*) FROM sala_mensagens_denuncias WHERE mensagem_id = $1) >= $2`,
        [id, DENUNCIAS_PARA_ESCONDER]);
      res.json({ message: 'Obrigado! A denúncia foi registrada.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
    }
  });

  // Pomodoro completo: vale se a pessoa estava na sala desde o começo do
  // foco (com 3 minutos de folga) e ainda está nela agora, na pausa.
  app.post('/api/salas/:sala/pomodoro', exigirLogin, async (req, res) => {
    const sala = SALA_POR_ID.get(req.params.sala);
    if (!sala) return res.status(404).json({ error: 'Sala não encontrada.' });
    const fase = faseDoPomodoro();
    if (fase.foco) return res.status(400).json({ error: 'O pomodoro ainda não acabou.' });
    try {
      const r = await pool.query(
        `UPDATE presenca SET ultimo_ciclo = $3
          WHERE usuario_id = $1 AND sala = $2 AND visto_em > NOW() - ${ONLINE}
            AND desde <= NOW() - make_interval(secs => $4) + INTERVAL '3 minutes'
            AND ultimo_ciclo IS DISTINCT FROM $3
          RETURNING usuario_id`, [req.usuario.id, sala.id, fase.ciclo, (Date.now() - Date.parse(fase.inicio)) / 1000]);
      if (!r.rowCount) return res.status(400).json({ error: 'Esse pomodoro não conta: você precisa ficar na sala o foco inteiro.' });
      const { rows } = await pool.query(
        `INSERT INTO pomodoros (usuario_id, dia, n) VALUES ($1, (NOW() - INTERVAL '3 hours')::date, 1)
         ON CONFLICT (usuario_id, dia) DO UPDATE SET n = pomodoros.n + 1 RETURNING n`, [req.usuario.id]);
      const n = rows[0].n;
      if (n === 4 || n === 8) await registrarAtividade(pool, { usuarioId: req.usuario.id, tipo: 'pomodoros', alvoId: n, texto: sala.nome });
      res.json({ pomodoros_hoje: n, xp: XP.pomodoro });
    } catch (erro) {
      console.error('Erro ao contar pomodoro:', erro.message);
      res.status(500).json({ error: 'Não consegui contar o pomodoro agora.' });
    }
  });
}

module.exports = registrarComunidade;
Object.assign(module.exports, {
  registrarAtividade, faseDoPomodoro, contarSequencia, sequenciaDe, nivelDoXp, hojeEmBrasilia, SALAS, XP
});
