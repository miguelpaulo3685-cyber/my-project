// Avisos fora do site: notificação no celular ou no computador (Web Push)
// e o resumo semanal por e-mail. É o que traz o aluno de volta.
//
// - Cada notificação do sino também vira aviso no aparelho, para quem ativou.
// - 19h: "sua sequência acaba hoje", para quem estudou ontem e ainda não hoje.
// - 19h55: "a sessão das 20h vai começar", só para quem pediu.
// - Segunda de manhã: resumo da semana por e-mail (dá para sair com 1 clique).
//
// As chaves dos avisos (VAPID) podem vir de VAPID_PUBLICO e VAPID_PRIVADO;
// sem elas, o servidor cria um par na primeira vez e guarda no banco.

const crypto = require('crypto');
const cron = require('node-cron');
const webpush = require('web-push');
const correio = require('./email');

const FUSO = { timezone: 'America/Sao_Paulo' };
const MAXIMO_POR_HORA = 8;          // ninguém quer o celular apitando sem parar
const EMAILS_POR_SEMANA = 250;      // o plano grátis do Brevo manda 300 por dia
const SEGREDO = process.env.SEGREDO_IMAGENS || null;

let chavePublica = null;
const enviadosPorPessoa = new Map(); // usuario_id -> horários dos últimos avisos

async function prepararChaves(pool) {
  let publica = process.env.VAPID_PUBLICO, privada = process.env.VAPID_PRIVADO;
  if (!publica || !privada) {
    const { rows } = await pool.query(`SELECT chave, valor FROM configuracoes WHERE chave IN ('vapid_publico', 'vapid_privado')`);
    const guardadas = Object.fromEntries(rows.map(r => [r.chave, r.valor]));
    if (guardadas.vapid_publico && guardadas.vapid_privado) {
      publica = guardadas.vapid_publico; privada = guardadas.vapid_privado;
    } else {
      ({ publicKey: publica, privateKey: privada } = webpush.generateVAPIDKeys());
      await pool.query(
        `INSERT INTO configuracoes (chave, valor) VALUES ('vapid_publico', $1), ('vapid_privado', $2)
         ON CONFLICT (chave) DO NOTHING`, [publica, privada]);
      // Se outro processo gravou primeiro, vale o que está no banco.
      const { rows: agora } = await pool.query(`SELECT chave, valor FROM configuracoes WHERE chave IN ('vapid_publico', 'vapid_privado')`);
      const v = Object.fromEntries(agora.map(r => [r.chave, r.valor]));
      publica = v.vapid_publico; privada = v.vapid_privado;
    }
  }
  webpush.setVapidDetails(`mailto:${process.env.VAPID_CONTATO || 'contato@mmestudos.com.br'}`, publica, privada);
  chavePublica = publica;
}

// Endereço do site com um pedido do que abrir (?abrir=pergunta:12).
const linkPara = abrir => `${correio.SITE_URL}${abrir ? `?abrir=${encodeURIComponent(abrir)}` : ''}`;

function podeAvisar(usuarioId) {
  const agora = Date.now();
  const recentes = (enviadosPorPessoa.get(usuarioId) || []).filter(t => agora - t < 3600000);
  if (recentes.length >= MAXIMO_POR_HORA) return false;
  recentes.push(agora);
  enviadosPorPessoa.set(usuarioId, recentes);
  return true;
}

// Manda para todos os aparelhos da pessoa. Inscrição vencida (404/410) sai do banco.
async function enviarPush(pool, usuarioId, { titulo, corpo, abrir, tag }) {
  if (!chavePublica || !podeAvisar(usuarioId)) return 0;
  const { rows } = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_inscricoes WHERE usuario_id = $1', [usuarioId]);
  const carga = JSON.stringify({ titulo, corpo: corpo ? String(corpo).slice(0, 180) : '', url: linkPara(abrir), tag: tag || 'mm' });
  let enviados = 0;
  for (const i of rows) {
    try {
      await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, carga, { TTL: 6 * 3600, urgency: 'normal' });
      enviados++;
    } catch (erro) {
      if (erro.statusCode === 404 || erro.statusCode === 410) await pool.query('DELETE FROM push_inscricoes WHERE id = $1', [i.id]);
      else console.error('Aviso não enviado:', erro.statusCode || erro.message);
    }
  }
  return enviados;
}

// O que cada notificação do sino diz no celular. Tipos que não estão aqui
// (reação, publicação de quem você segue) ficam só no sino: seria barulho demais.
const AVISO_DA_NOTIFICACAO = {
  seguidor: (ator) => ({ titulo: `${ator} começou a seguir você`, abrir: 'comunidade' }),
  boas_vindas: (ator) => ({ titulo: `${ator} te deu boas-vindas 👋`, abrir: 'comunidade' }),
  convite: (ator) => ({ titulo: `${ator} entrou no site pelo seu convite 🤝`, abrir: 'arena' }),
  resposta: (ator, n) => ({ titulo: `${ator} respondeu seu comentário`, corpo: n.texto, abrir: `questao:${n.alvoId}` }),
  util: (ator, n) => ({ titulo: `${ator} achou sua explicação útil 👍`, abrir: n.alvoTipo === 'pergunta' ? `pergunta:${n.alvoId}` : `questao:${n.alvoId}` }),
  fixado: (ator, n) => ({ titulo: 'Sua explicação foi fixada como a melhor 📌', abrir: `questao:${n.alvoId}` }),
  reel_aprovado: (ator, n) => ({ titulo: 'Seu reel foi aprovado 🎬', corpo: n.texto, abrir: 'reels' }),
  apoio: (ator, n) => ({ titulo: `${ator} apoiou a sua meta de hoje ${n.texto || ''}`.trim(), corpo: 'Agora é cumprir! 💪', abrir: 'comunidade' }),
  meta_cumprida: (ator, n) => ({ titulo: `${ator} cumpriu a meta que você apoiou 🎉`, corpo: n.texto, abrir: 'comunidade' }),
  resposta_pergunta: (ator, n) => ({ titulo: `${ator} respondeu a sua pergunta`, corpo: n.texto, abrir: `pergunta:${n.alvoId}` }),
  correcao: (ator, n) => ({ titulo: 'Sua redação recebeu uma correção ✍️', corpo: `${n.texto} pontos nesta correção. Veja os comentários!`, abrir: `redacao:${n.alvoId}` }),
  redacao_corrigida: (ator, n) => ({ titulo: `Sua redação foi corrigida: nota ${n.texto} ✍️`, corpo: 'Veja o que melhorar em cada competência.', abrir: `redacao:${n.alvoId}` }),
  correcao_util: (ator, n) => ({ titulo: `${ator} achou sua correção útil ✍️ +5 XP`, abrir: 'redacoes' }),
  melhor_resposta: (ator, n) => ({ titulo: 'Sua resposta foi escolhida a melhor 🏅 +25 XP', corpo: n.texto, abrir: `pergunta:${n.alvoId}` }),
  mensagem: (ator, n) => ({ titulo: `${ator} mandou uma mensagem 💬`, corpo: n.texto, abrir: `conversa:${n.alvoId}` })
};

// Chamado por notificar(); nunca espera nem falha a ação principal.
function avisarNotificacao(pool, n) {
  const montar = AVISO_DA_NOTIFICACAO[n.tipo];
  if (!montar || !chavePublica) return;
  (async () => {
    const tem = await pool.query('SELECT 1 FROM push_inscricoes WHERE usuario_id = $1 LIMIT 1', [n.usuarioId]);
    if (!tem.rowCount) return;
    const ator = n.atorId ? (await pool.query('SELECT username FROM usuarios WHERE id = $1', [n.atorId])).rows[0]?.username || 'Alguém' : 'M&M Estudos';
    await enviarPush(pool, n.usuarioId, { ...montar(ator, n), tag: `${n.tipo}-${n.alvoId || ''}` });
  })().catch(erro => console.error('Erro ao avisar notificação:', erro.message));
}

// Link de "não quero mais o e-mail semanal": funciona sem entrar na conta.
const assinarDescadastro = id => SEGREDO && crypto.createHmac('sha256', SEGREDO).update(`descadastrar:${id}`).digest('base64url').slice(0, 32);

// ---------- avisos agendados ----------
async function lembrarSequencias(pool) {
  const { sequenciaDe } = require('./comunidade');
  // Estudou ontem e ainda não hoje (dias de Brasília), com aviso ligado.
  const { rows } = await pool.query(
    `SELECT DISTINCT u.id FROM usuarios u JOIN push_inscricoes p ON p.usuario_id = u.id
      WHERE u.aviso_sequencia
        AND EXISTS (SELECT 1 FROM respostas r WHERE r.usuario_id = u.id
                     AND (r.created_at - INTERVAL '3 hours')::date = (NOW() - INTERVAL '27 hours')::date)
        AND NOT EXISTS (SELECT 1 FROM respostas r WHERE r.usuario_id = u.id
                         AND (r.created_at - INTERVAL '3 hours')::date = (NOW() - INTERVAL '3 hours')::date)
        AND NOT EXISTS (SELECT 1 FROM pomodoros m WHERE m.usuario_id = u.id AND m.dia = (NOW() - INTERVAL '3 hours')::date)
      LIMIT 2000`);
  let n = 0;
  for (const { id } of rows) {
    const s = await sequenciaDe(pool, id);
    if (s.hoje || s.dias < 2) continue;
    n += await enviarPush(pool, id, {
      titulo: `Sua sequência de ${s.dias} dias acaba hoje 🔥`,
      corpo: 'Um bloco de 5 questões já garante. Leva uns 10 minutos!',
      abrir: 'treinar', tag: 'sequencia'
    }) ? 1 : 0;
  }
  if (n) console.log(`🔥 Lembrete de sequência enviado para ${n} pessoas`);
}

async function lembrarSessao(pool) {
  const { rows } = await pool.query(
    `SELECT DISTINCT u.id FROM usuarios u JOIN push_inscricoes p ON p.usuario_id = u.id WHERE u.aviso_sessao LIMIT 5000`);
  for (const { id } of rows) {
    await enviarPush(pool, id, { titulo: 'A sessão das 20h vai começar 🌙', corpo: 'A comunidade estuda junto na Sala geral. Bora?', abrir: 'sala:geral', tag: 'sessao' });
  }
}

async function enviarResumosSemanais(pool) {
  if (!correio.configurado || !SEGREDO) {
    console.log('📧 Resumo semanal não enviado: falta o envio de e-mail ou SEGREDO_IMAGENS (para o link de sair da lista).');
    return;
  }
  const { sequenciaDe } = require('./comunidade');
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email,
            (SELECT COUNT(*)::int FROM respostas r WHERE r.usuario_id = u.id AND r.created_at > NOW() - INTERVAL '7 days') AS questoes,
            (SELECT COUNT(*)::int FROM respostas r WHERE r.usuario_id = u.id AND r.acertou AND r.created_at > NOW() - INTERVAL '7 days') AS acertos
       FROM usuarios u
      WHERE u.email_semanal AND COALESCE(u.email_verificado, FALSE) AND u.email IS NOT NULL
        AND (u.ultimo_acesso > NOW() - INTERVAL '45 days'
             OR EXISTS (SELECT 1 FROM respostas r WHERE r.usuario_id = u.id AND r.created_at > NOW() - INTERVAL '45 days'))
      ORDER BY u.ultimo_acesso DESC NULLS LAST LIMIT ${EMAILS_POR_SEMANA}`);
  const comunidade = (await pool.query(
    `SELECT (SELECT COUNT(DISTINCT usuario_id)::int FROM respostas WHERE created_at > NOW() - INTERVAL '7 days' AND usuario_id IS NOT NULL) AS pessoas,
            (SELECT COUNT(*)::int FROM respostas WHERE created_at > NOW() - INTERVAL '7 days') AS questoes,
            (SELECT COUNT(*)::int FROM perguntas p WHERE NOT p.oculto
               AND NOT EXISTS (SELECT 1 FROM perguntas_respostas r WHERE r.pergunta_id = p.id AND NOT r.oculto)) AS sem_resposta`)).rows[0];
  let enviados = 0;
  for (const u of rows) {
    try {
      const s = await sequenciaDe(pool, u.id);
      await correio.enviar(u.email, resumoSemanal(u, s, comunidade));
      enviados++;
    } catch (erro) {
      console.error(`Resumo semanal não foi para ${u.id}:`, erro.message);
    }
  }
  console.log(`📧 Resumo semanal enviado para ${enviados} pessoas`);
}

function resumoSemanal(u, sequencia, comunidade) {
  const esc = correio.escaparHtml;
  const sair = `${correio.SITE_URL}?descadastrar=${u.id}.${assinarDescadastro(u.id)}`;
  const linhas = [
    u.questoes
      ? `Na semana passada você fez <b>${u.questoes} ${u.questoes === 1 ? 'questão' : 'questões'}</b> e acertou <b>${u.acertos}</b> (${Math.round(100 * u.acertos / u.questoes)}%).`
      : 'Na semana passada você não treinou. Que tal voltar com um bloco de 5 questões hoje?',
    sequencia.dias ? `Sua sequência está em <b>${sequencia.dias} dias seguidos</b> 🔥 Não deixe acabar!` : null,
    '🏆 O <b>desafio da semana</b> novo já está no ar: 10 questões iguais para todo mundo, com ranking.',
    comunidade.pessoas > 1 ? `👥 ${comunidade.pessoas} pessoas estudaram no site e responderam ${comunidade.questoes} questões.` : null,
    comunidade.sem_resposta ? `🙋 ${comunidade.sem_resposta} ${comunidade.sem_resposta === 1 ? 'pergunta está' : 'perguntas estão'} esperando ajuda na comunidade (responder vale XP).` : null
  ].filter(Boolean);
  const m = correio.montar({
    nome: u.username,
    titulo: sequencia.dias ? `Sua semana no M&M Estudos 🔥 ${sequencia.dias} dias seguidos` : 'Sua semana no M&M Estudos',
    texto: linhas.map(l => l).join('<br><br>'),
    botao: 'Estudar agora',
    link: linkPara('treinar'),
    rodape: `Você recebe este resumo uma vez por semana. <a href="${esc(sair)}">Não quero mais receber</a>.`
  });
  m.text += `\n\nPara não receber mais: ${sair}`;
  return m;
}

function registrarAvisos(app, { pool, auth, limitar, exigirLogin }) {
  const porConta = req => `u${req.usuario.id}`;
  const freio = limitar(auth.criarFreio(30, 60 * 60 * 1000), 'Muitas tentativas. Espere um pouco.', porConta);

  prepararChaves(pool).catch(erro => console.error('❌ Avisos desligados: não consegui preparar as chaves:', erro.message));

  app.get('/api/avisos/chave', (req, res) => {
    if (!chavePublica) return res.status(503).json({ error: 'Os avisos ainda não estão prontos. Tente daqui a pouco.' });
    res.json({ chave: chavePublica });
  });

  // O navegador manda a inscrição que criou; ela fica ligada à conta.
  app.post('/api/avisos/inscrever', exigirLogin, freio, async (req, res) => {
    const i = req.body?.inscricao || {};
    const endpoint = typeof i.endpoint === 'string' ? i.endpoint : '';
    const p256dh = typeof i.keys?.p256dh === 'string' ? i.keys.p256dh : '';
    const chaveAuth = typeof i.keys?.auth === 'string' ? i.keys.auth : '';
    // Só endereços https dos serviços de aviso dos navegadores, nada de URL qualquer.
    if (!/^https:\/\/[a-z0-9.-]+(:\d+)?\//i.test(endpoint) || endpoint.length > 1000 || !p256dh || !chaveAuth || p256dh.length > 200 || chaveAuth.length > 100) {
      return res.status(400).json({ error: 'Inscrição inválida.' });
    }
    try {
      await pool.query(
        `INSERT INTO push_inscricoes (usuario_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE SET usuario_id = EXCLUDED.usuario_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
        [req.usuario.id, endpoint, p256dh, chaveAuth]);
      // Limite de aparelhos por conta: fica com os 5 mais recentes.
      await pool.query(
        `DELETE FROM push_inscricoes WHERE usuario_id = $1 AND id NOT IN (
           SELECT id FROM push_inscricoes WHERE usuario_id = $1 ORDER BY id DESC LIMIT 5)`, [req.usuario.id]);
      res.json({ ok: true });
    } catch (erro) {
      console.error('Erro ao inscrever avisos:', erro.message);
      res.status(500).json({ error: 'Não consegui ativar os avisos agora.' });
    }
  });

  app.post('/api/avisos/cancelar', exigirLogin, async (req, res) => {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
    try {
      await pool.query('DELETE FROM push_inscricoes WHERE usuario_id = $1 AND endpoint = $2', [req.usuario.id, endpoint]);
      res.json({ ok: true });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  app.get('/api/avisos/preferencias', exigirLogin, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT aviso_sequencia, aviso_sessao, COALESCE(aviso_arena, TRUE) AS aviso_arena, email_semanal, COALESCE(email_verificado, FALSE) AS email_verificado,
                (SELECT COUNT(*)::int FROM push_inscricoes WHERE usuario_id = $1) AS aparelhos
           FROM usuarios WHERE id = $1`, [req.usuario.id]);
      res.json(rows[0]);
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui carregar suas preferências.' });
    }
  });

  app.post('/api/avisos/preferencias', exigirLogin, async (req, res) => {
    const campos = ['aviso_sequencia', 'aviso_sessao', 'aviso_arena', 'email_semanal'].filter(c => typeof req.body?.[c] === 'boolean');
    if (!campos.length) return res.status(400).json({ error: 'Nada para mudar.' });
    try {
      await pool.query(`UPDATE usuarios SET ${campos.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1`,
        [req.usuario.id, ...campos.map(c => req.body[c])]);
      res.json({ ok: true });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui salvar agora.' });
    }
  });

  // Aviso de teste, para a pessoa ver que funcionou.
  app.post('/api/avisos/teste', exigirLogin, freio, async (req, res) => {
    try {
      const n = await enviarPush(pool, req.usuario.id, { titulo: 'Avisos ligados ✅', corpo: 'É assim que o M&M Estudos vai te chamar quando algo acontecer.', abrir: 'comunidade', tag: 'teste' });
      res.json({ enviados: n });
    } catch (erro) {
      res.status(500).json({ error: 'Não consegui mandar o aviso de teste.' });
    }
  });

  // "Não quero mais o e-mail semanal", pelo link do próprio e-mail.
  app.post('/api/avisos/descadastrar', async (req, res) => {
    const [id, assinatura] = String(req.body?.token || '').split('.');
    const esperado = assinarDescadastro(Number(id));
    if (!esperado || !assinatura || assinatura.length !== esperado.length
        || !crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperado))) {
      return res.status(400).json({ error: 'Link inválido.' });
    }
    try {
      await pool.query('UPDATE usuarios SET email_semanal = FALSE WHERE id = $1', [Number(id)]);
      res.json({ message: 'Pronto! Você não vai mais receber o resumo semanal.' });
    } catch (erro) {
      res.status(500).json({ error: 'Não deu certo agora.' });
    }
  });

  const tarefa = (nome, fn) => () => fn(pool).catch(erro => console.error(`❌ ${nome}:`, erro.message));
  cron.schedule('0 19 * * *', tarefa('Lembrete de sequência', lembrarSequencias), FUSO);
  cron.schedule('55 19 * * *', tarefa('Lembrete da sessão das 20h', lembrarSessao), FUSO);
  cron.schedule('40 8 * * 1', tarefa('Resumo semanal', enviarResumosSemanais), FUSO);
}

module.exports = registrarAvisos;
Object.assign(module.exports, { avisarNotificacao, enviarPush, lembrarSequencias, lembrarSessao, enviarResumosSemanais, resumoSemanal, assinarDescadastro });
