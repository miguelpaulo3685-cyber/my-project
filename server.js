require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const auth = require('./auth');
const correio = require('./email');
const tri = require('./tri');

// Sem a variável no Render a URL virava "undefined/v1/..." e toda busca falhava.
const ENEM_API = (process.env.ENEM_API_BASE || 'https://api.enem.dev').replace(/\/$/, '');

const ITENS_INEP = tri.carregar();
const CORTES_TRI = tri.calcularCortes(ITENS_INEP);

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection Pool (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  // No plano gratuito o Neon hiberna e leva alguns segundos para acordar.
  // Com 2s a primeira consulta depois de um tempo parado sempre falhava.
  connectionTimeoutMillis: 20000,
});

// O Render fica na frente do servidor como proxy: sem isto, req.ip seria o
// IP do proxy e todos os freios tratariam o site inteiro como uma pessoa só.
app.set('trust proxy', 1);
app.disable('x-powered-by'); // não anuncia que é Express

// Cabeçalhos que pedem ao navegador para bloquear ataques comuns: o site
// dentro de um iframe alheio (clickjacking), adivinhação de tipo de arquivo,
// acesso por HTTP sem criptografia e recursos de fora que a página não usa.
const POLITICA_DE_CONTEUDO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': POLITICA_DE_CONTEUDO,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin'
  });
  // Respostas da API podem ter token de sessão ou dados da conta: nada de
  // guardar em cache do navegador ou de proxies no caminho.
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});

const ORIGENS_PERMITIDAS = (process.env.ORIGENS_PERMITIDAS ||
  'https://miguelpaulo3685-cyber.github.io,http://localhost:3000,http://127.0.0.1:3000'
).split(',').map(o => o.trim()).filter(Boolean);

// Pedidos sem Origin (curl, o próprio servidor) não passam pelo navegador,
// e CORS não se aplica a eles.
app.use(cors({ origin: (origem, ok) => ok(null, !origem || ORIGENS_PERMITIDAS.includes(origem)) }));
app.use(morgan('combined'));
app.use(express.json({ limit: '20kb' }));

// Só as páginas do site. Servir a pasta inteira entregava o código do
// servidor (e o .env, se existisse) para quem pedisse.
for (const pagina of ['index.html', 'privacidade.html', 'termos.html']) {
  app.get(pagina === 'index.html' ? ['/', '/index.html'] : `/${pagina}`, (req, res) => {
    res.sendFile(path.join(__dirname, pagina));
  });
}

function limitar(freio, mensagem, chaveDe = req => req.ip) {
  return (req, res, next) => {
    const chave = chaveDe(req);
    if (freio.bloqueado(chave)) return res.status(429).json({ error: mensagem });
    freio.registrar(chave);
    next();
  };
}

// Limites folgados de propósito: numa escola, uma sala inteira sai pelo
// mesmo IP.
app.use('/api', limitar(auth.criarFreio(300, 60 * 1000), 'Muitos pedidos seguidos. Espere um minuto.'));
const freioCadastro = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Muitas contas criadas daqui. Tente mais tarde.');
const freioRespostas = limitar(auth.criarFreio(120, 60 * 1000), 'Calma! Respostas demais em pouco tempo.');
const freioPosts = limitar(auth.criarFreio(10, 10 * 60 * 1000), 'Você publicou muito em pouco tempo. Espere uns minutos.',
  req => `u${req.usuario.id}`);

// Rotas que buscam questões na api.enem.dev e gravam no banco. Ficam
// fechadas por chave: abertas, qualquer um poderia dispará-las sem parar.
function exigirAdmin(req, res, next) {
  const esperada = process.env.ADMIN_KEY;
  if (!esperada) return res.status(503).json({ error: 'Rota de administração desativada (ADMIN_KEY não configurada).' });
  const recebida = String(req.headers['x-admin-key'] || '');
  const a = crypto.createHash('sha256').update(recebida).digest();
  const b = crypto.createHash('sha256').update(esperada).digest();
  if (!crypto.timingSafeEqual(a, b)) return res.status(403).json({ error: 'Chave de administração inválida.' });
  next();
}

// ================== CONTAS E LOGIN ==================

// Le o token do cabecalho e descobre quem esta falando. Nao bloqueia:
// as rotas que exigem login usam exigirLogin.
async function identificar(req, res, next) {
  req.usuario = null;
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

  if (token) {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.username, u.email, u.bio, u.avatar_url,
                COALESCE(u.email_verificado, FALSE) AS email_verificado
           FROM sessoes s
           JOIN usuarios u ON u.id = s.usuario_id
          WHERE s.token_hash = $1 AND s.expira_em > NOW()`,
        [auth.hashDeToken(token)]
      );
      if (rows[0]) req.usuario = rows[0];
    } catch (erro) {
      console.error('Erro ao identificar sessao:', erro.message);
    }
  }
  next();
}

function exigirLogin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Faça login para continuar.' });
  next();
}

app.use(identificar);

async function abrirSessao(usuarioId) {
  const { token, hash } = auth.criarToken();
  await pool.query(
    'INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES ($1, $2, $3)',
    [hash, usuarioId, auth.validadeDaSessao()]
  );
  await pool.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuarioId]);
  return token;
}

app.post('/api/auth/registrar', freioCadastro, async (req, res) => {
  const { nome, email, senha, aceite } = req.body || {};

  if (!nome || String(nome).trim().length < 2) {
    return res.status(400).json({ error: 'Diga seu nome (ao menos 2 letras).' });
  }
  if (aceite !== true) {
    return res.status(400).json({ error: 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.' });
  }
  const problemaEmail = await auth.problemaNoEmail(email);
  if (problemaEmail) return res.status(400).json({ error: problemaEmail });

  const problemaSenha = auth.problemaNaSenha(senha);
  if (problemaSenha) return res.status(400).json({ error: problemaSenha });

  try {
    const emailLimpo = String(email).trim().toLowerCase();
    const jaExiste = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [emailLimpo]);
    if (jaExiste.rowCount > 0) {
      return res.status(409).json({ error: 'Já existe uma conta com esse e-mail. Tente entrar.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, email, senha_hash, termos_aceitos_em)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, username, email, FALSE AS email_verificado`,
      [String(nome).trim().slice(0, 60), emailLimpo, await auth.criarHashDeSenha(senha)]
    );

    // A conta funciona mesmo se o e-mail de confirmação não sair: dá para
    // pedir de novo depois, em Minha conta.
    criarTokenEmail(rows[0].id, 'confirmar', 7 * 24)
      .then(t => correio.enviarConfirmacao(rows[0].email, rows[0].username, t))
      .catch(erro => console.error('Erro ao enviar confirmação:', erro.message));

    const token = await abrirSessao(rows[0].id);
    res.status(201).json({ token, usuario: rows[0], dias_de_sessao: auth.DIAS_DE_SESSAO });
  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
    }
    console.error('Erro ao registrar:', erro.message);
    res.status(500).json({ error: 'Não consegui criar a conta agora.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body || {};
  const emailLimpo = String(email || '').trim().toLowerCase();
  const chaveDoFreio = `${req.ip}:${emailLimpo}`;

  if (auth.freioDeSenha.bloqueado(chaveDoFreio)) {
    return res.status(429).json({ error: 'Muitas tentativas. Espere 15 minutos e tente de novo.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, senha_hash, COALESCE(email_verificado, FALSE) AS email_verificado FROM usuarios WHERE email = $1',
      [emailLimpo]
    );
    const usuario = rows[0];

    // Mesma resposta para e-mail inexistente e senha errada: dizer qual dos
    // dois falhou entregaria para um estranho quais e-mails tem conta aqui.
    const ok = usuario
      ? await auth.senhaConfere(String(senha || ''), usuario.senha_hash)
      : await auth.gastarTempoDeConferencia(String(senha || ''));
    if (!ok) {
      auth.freioDeSenha.registrar(chaveDoFreio);
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    auth.freioDeSenha.limpar(chaveDoFreio);
    const token = await abrirSessao(usuario.id);
    res.json({
      token,
      usuario: { id: usuario.id, username: usuario.username, email: usuario.email, email_verificado: usuario.email_verificado },
      dias_de_sessao: auth.DIAS_DE_SESSAO
    });
  } catch (erro) {
    console.error('Erro no login:', erro.message);
    res.status(500).json({ error: 'Não consegui entrar agora.' });
  }
});

// O site chama esta rota ao abrir: se o token guardado ainda vale, a pessoa
// volta já logada.
app.get('/api/auth/eu', (req, res) => {
  if (!req.usuario) return res.status(401).json({ error: 'Sessão expirada ou inexistente.' });
  res.json({ usuario: req.usuario });
});

app.post('/api/auth/sair', async (req, res) => {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (token) {
    await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [auth.hashDeToken(token)]);
  }
  res.json({ message: 'Você saiu da conta.' });
});

// ================== LINKS POR E-MAIL ==================

// Um link novo invalida os anteriores do mesmo tipo: só o último e-mail vale.
async function criarTokenEmail(usuarioId, tipo, horas) {
  const { token, hash } = auth.criarToken();
  await pool.query('DELETE FROM tokens_email WHERE usuario_id = $1 AND tipo = $2', [usuarioId, tipo]);
  await pool.query(
    `INSERT INTO tokens_email (token_hash, usuario_id, tipo, expira_em)
     VALUES ($1, $2, $3, NOW() + make_interval(hours => $4))`,
    [hash, usuarioId, tipo, horas]
  );
  return token;
}

// Gasta o token numa única operação: dois cliques no mesmo link não
// conseguem usá-lo duas vezes.
async function gastarTokenEmail(token, tipo) {
  const { rows } = await pool.query(
    `UPDATE tokens_email SET usado_em = NOW()
      WHERE token_hash = $1 AND tipo = $2 AND usado_em IS NULL AND expira_em > NOW()
      RETURNING usuario_id`,
    [auth.hashDeToken(String(token || '')), tipo]
  );
  return rows[0] ? rows[0].usuario_id : null;
}

const freioEsqueciIp = limitar(auth.criarFreio(30, 60 * 60 * 1000), 'Muitos pedidos daqui. Tente de novo mais tarde.');
// O token tem 256 bits: não dá para adivinhar, então o limite só segura abuso.
const freioLinkIp = limitar(auth.criarFreio(100, 60 * 60 * 1000), 'Muitos pedidos daqui. Tente de novo mais tarde.');
const freioEsqueciEmail = auth.criarFreio(3, 60 * 60 * 1000);
const freioReenvio = limitar(auth.criarFreio(3, 60 * 60 * 1000), 'Você já pediu vários e-mails. Espere um pouco.',
  req => `u${req.usuario.id}`);

const RESPOSTA_ESQUECI = 'Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também a caixa de spam.';

app.post('/api/auth/esqueci', freioEsqueciIp, async (req, res) => {
  if (!correio.configurado && correio.emProducao) {
    return res.status(503).json({ error: 'A recuperação de senha ainda não está disponível.' });
  }

  const emailLimpo = String(req.body?.email || '').trim().toLowerCase();
  // A resposta é sempre a mesma, exista a conta ou não: senão daria para
  // descobrir quem tem conta aqui. Pelo mesmo motivo o envio não é esperado.
  res.json({ message: RESPOSTA_ESQUECI });

  if (!emailLimpo || freioEsqueciEmail.bloqueado(emailLimpo)) return;
  freioEsqueciEmail.registrar(emailLimpo);

  try {
    const { rows } = await pool.query('SELECT id, username, email FROM usuarios WHERE email = $1', [emailLimpo]);
    if (!rows[0]) return;
    const token = await criarTokenEmail(rows[0].id, 'redefinir', 1);
    await correio.enviarRedefinicao(rows[0].email, rows[0].username, token);
  } catch (erro) {
    console.error('Erro ao enviar redefinição:', erro.message);
  }
});

app.post('/api/auth/redefinir', freioLinkIp, async (req, res) => {
  const { token, senha } = req.body || {};
  const problemaSenha = auth.problemaNaSenha(senha);
  if (problemaSenha) return res.status(400).json({ error: problemaSenha });

  try {
    const usuarioId = await gastarTokenEmail(token, 'redefinir');
    if (!usuarioId) {
      return res.status(400).json({ error: 'Esse link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".' });
    }

    // Quem chegou aqui provou que lê esse e-mail, então ele fica confirmado.
    // As outras sessões caem: se alguém tinha a senha antiga, perde o acesso.
    const { rows } = await pool.query(
      `UPDATE usuarios SET senha_hash = $1, email_verificado = TRUE WHERE id = $2
       RETURNING id, username, email, email_verificado`,
      [await auth.criarHashDeSenha(senha), usuarioId]
    );
    await pool.query('DELETE FROM sessoes WHERE usuario_id = $1', [usuarioId]);
    auth.freioDeSenha.limpar(`${req.ip}:${rows[0].email}`);

    const novoToken = await abrirSessao(usuarioId);
    res.json({ token: novoToken, usuario: rows[0], dias_de_sessao: auth.DIAS_DE_SESSAO });
  } catch (erro) {
    console.error('Erro ao redefinir senha:', erro.message);
    res.status(500).json({ error: 'Não consegui trocar a senha agora.' });
  }
});

app.post('/api/auth/confirmar', freioLinkIp, async (req, res) => {
  try {
    const usuarioId = await gastarTokenEmail(req.body?.token, 'confirmar');
    if (!usuarioId) {
      return res.status(400).json({ error: 'Esse link de confirmação expirou ou já foi usado. Peça outro em Minha conta.' });
    }
    await pool.query('UPDATE usuarios SET email_verificado = TRUE WHERE id = $1', [usuarioId]);
    res.json({ message: 'E-mail confirmado!' });
  } catch (erro) {
    console.error('Erro ao confirmar e-mail:', erro.message);
    res.status(500).json({ error: 'Não consegui confirmar agora.' });
  }
});

app.post('/api/auth/reenviar-confirmacao', exigirLogin, freioReenvio, async (req, res) => {
  if (req.usuario.email_verificado) return res.json({ message: 'Seu e-mail já está confirmado.' });
  try {
    const token = await criarTokenEmail(req.usuario.id, 'confirmar', 7 * 24);
    await correio.enviarConfirmacao(req.usuario.email, req.usuario.username, token);
    res.json({ message: `Enviamos um novo link para ${req.usuario.email}. Confira também a caixa de spam.` });
  } catch (erro) {
    console.error('Erro ao reenviar confirmação:', erro.message);
    res.status(500).json({ error: 'Não consegui enviar o e-mail agora.' });
  }
});

// Exclusão pedida pela própria pessoa (direito garantido pela LGPD). Pede a
// senha de novo: um celular esquecido aberto não pode apagar a conta de alguém.
// As respostas ficam, mas sem dono (usuario_id vira NULL): anônimas, seguem
// servindo para medir a dificuldade das questões.
app.delete('/api/conta', exigirLogin, async (req, res) => {
  const chaveDoFreio = `${req.ip}:${req.usuario.email}`;
  if (auth.freioDeSenha.bloqueado(chaveDoFreio)) {
    return res.status(429).json({ error: 'Muitas tentativas. Espere 15 minutos e tente de novo.' });
  }

  try {
    const { rows } = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (!rows[0] || !await auth.senhaConfere(String(req.body?.senha || ''), rows[0].senha_hash)) {
      auth.freioDeSenha.registrar(chaveDoFreio);
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    // Sessões e posts vão junto pelo ON DELETE CASCADE.
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.json({ message: 'Sua conta e seus dados foram apagados.' });
  } catch (erro) {
    console.error('Erro ao excluir conta:', erro.message);
    res.status(500).json({ error: 'Não consegui excluir a conta agora.' });
  }
});

// ================== HEALTH CHECK ==================
// Responde 200 mesmo sem banco: o Render usa esta rota para saber se o
// servico esta de pe, e derrubar o site inteiro por causa do banco e pior.
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', banco: 'conectado', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Health check sem banco:', error.message);
    res.json({ status: 'ok', banco: 'sem conexao' });
  }
});

// ================== NÍVEL DE DIFICULDADE ==================
// A fonte das questões não informa dificuldade, então ela é medida aqui:
// quanto menor a proporção de acertos, mais difícil. Abaixo de RESPOSTAS_MINIMAS
// a amostra é pequena demais para afirmar qualquer coisa, e o nível fica nulo.
const RESPOSTAS_MINIMAS = 5;

// O site usa nomes curtos nas rotas; o banco guarda a disciplina como a
// api.enem.dev a nomeia.
const AREA_PARA_DISCIPLINA = {
  'linguagens': 'linguagens',
  'humanas': 'ciencias-humanas',
  'natureza': 'ciencias-natureza',
  'matematica': 'matematica'
};
const DISCIPLINA_PARA_AREA = Object.fromEntries(
  Object.entries(AREA_PARA_DISCIPLINA).map(([area, disc]) => [disc, area])
);

function calcularNivel(totalRespostas, taxaAcerto) {
  if (totalRespostas < RESPOSTAS_MINIMAS) return null;
  if (taxaAcerto >= 0.75) return 1; // Fácil
  if (taxaAcerto >= 0.50) return 2; // Médio
  if (taxaAcerto >= 0.25) return 3; // Difícil
  return 4;                         // Desafio
}

// A dificuldade oficial do INEP (TRI) vale mais que a medida pelos nossos
// alunos, que ainda são poucos. Esta só entra quando a questão não tem TRI.
function nivelDaQuestao(q, totalRespostas, taxaAcerto) {
  const pelaTri = tri.nivelPelaTri(CORTES_TRI, q.disciplina, q.tri_b);
  if (pelaTri) return { nivel: pelaTri, nivel_fonte: 'tri' };
  const pelosAlunos = calcularNivel(totalRespostas, taxaAcerto);
  return { nivel: pelosAlunos, nivel_fonte: pelosAlunos ? 'alunos' : null };
}

app.post('/api/responder', freioRespostas, async (req, res) => {
  const { questao_id, acertou, segundos } = req.body || {};
  if (!Number.isInteger(questao_id) || typeof acertou !== 'boolean') {
    return res.status(400).json({ error: 'Informe questao_id e acertou.' });
  }

  try {
    await pool.query(
      'INSERT INTO respostas (questao_id, usuario_id, acertou, segundos) VALUES ($1, $2, $3, $4)',
      [questao_id, req.usuario ? req.usuario.id : null, acertou,
       Number.isInteger(segundos) ? Math.min(segundos, 3600) : null]
    );

    const { rows } = await pool.query(
      `SELECT q.disciplina, q.tri_b,
              COUNT(r.id)::int AS total,
              AVG(CASE WHEN r.acertou THEN 1.0 ELSE 0 END)::float AS taxa
         FROM questoes q LEFT JOIN respostas r ON r.questao_id = q.id
        WHERE q.id = $1
        GROUP BY q.id`,
      [questao_id]
    );

    res.json({
      registrado: true,
      total_respostas: rows[0].total,
      ...nivelDaQuestao(rows[0], rows[0].total, rows[0].taxa)
    });
  } catch (erro) {
    if (erro.code === '23503') return res.status(404).json({ error: 'Questão não encontrada.' });
    console.error('Erro ao registrar resposta:', erro.message);
    res.status(500).json({ error: 'Não consegui registrar a resposta.' });
  }
});

// Progresso da conta, somado das respostas gravadas. É o que faz o treino
// continuar de onde parou em qualquer aparelho.
app.get('/api/meu-progresso', exigirLogin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.disciplina,
              COUNT(*)::int AS feitas,
              COUNT(*) FILTER (WHERE r.acertou)::int AS acertos
         FROM respostas r
         JOIN questoes q ON q.id = r.questao_id
        WHERE r.usuario_id = $1
        GROUP BY q.disciplina`,
      [req.usuario.id]
    );

    const progresso = {};
    for (const linha of rows) {
      const area = DISCIPLINA_PARA_AREA[linha.disciplina];
      if (area) progresso[area] = { feitas: linha.feitas, acertos: linha.acertos };
    }
    res.json({ progresso });
  } catch (erro) {
    console.error('Erro ao ler progresso:', erro.message);
    res.status(500).json({ error: 'Não consegui ler seu progresso.' });
  }
});

// ================== NOTA TRI DO ALUNO ==================
// Com conta, usa as respostas gravadas no banco; sem conta, o navegador manda
// a lista que guardou. Vale só a primeira resposta de cada questão: refazer
// depois de ver o gabarito inflaria a nota.
app.post('/api/tri', async (req, res) => {
  try {
    let linhas;
    if (req.usuario) {
      ({ rows: linhas } = await pool.query(
        `SELECT DISTINCT ON (r.questao_id) q.disciplina, q.tri_a AS a, q.tri_b AS b, q.tri_c AS c, r.acertou
           FROM respostas r JOIN questoes q ON q.id = r.questao_id
          WHERE r.usuario_id = $1 AND q.tri_b IS NOT NULL
          ORDER BY r.questao_id, r.created_at ASC`,
        [req.usuario.id]
      ));
    } else {
      const primeira = new Map();
      for (const r of (Array.isArray(req.body?.respostas) ? req.body.respostas : []).slice(0, 2000)) {
        if (Number.isInteger(r?.questao_id) && typeof r.acertou === 'boolean' && !primeira.has(r.questao_id)) {
          primeira.set(r.questao_id, r.acertou);
        }
      }
      const { rows } = primeira.size === 0 ? { rows: [] } : await pool.query(
        `SELECT id, disciplina, tri_a AS a, tri_b AS b, tri_c AS c
           FROM questoes WHERE id = ANY($1::int[]) AND tri_b IS NOT NULL`,
        [[...primeira.keys()]]
      );
      linhas = rows.map(q => ({ ...q, acertou: primeira.get(q.id) }));
    }
    res.json({ notas: tri.notasPorArea(linhas, DISCIPLINA_PARA_AREA), minimo: tri.MINIMO_PARA_NOTA });
  } catch (erro) {
    console.error('Erro ao calcular nota TRI:', erro.message);
    res.status(500).json({ error: 'Não consegui calcular a nota TRI agora.' });
  }
});

// ================== QUESTÕES - GET CACHE ==================
app.get('/api/questoes/:area', async (req, res) => {
  const { area } = req.params;
  const disciplina = AREA_PARA_DISCIPLINA[area];
  if (!disciplina) return res.status(400).json({ error: 'Área inválida' });

  try {
    // Junta as respostas já dadas para calcular o nível de cada questão.
    const result = await pool.query(
      `SELECT q.*,
              COUNT(r.id)::int AS total_respostas,
              COALESCE(AVG(CASE WHEN r.acertou THEN 1.0 ELSE 0 END), 0)::float AS taxa_acerto
         FROM questoes q
         LEFT JOIN respostas r ON r.questao_id = q.id
        WHERE q.disciplina = $1
        GROUP BY q.id
        ORDER BY RANDOM()
        LIMIT 5`,
      [disciplina]
    );

    result.rows.forEach(q => {
      Object.assign(q, nivelDaQuestao(q, q.total_respostas, q.taxa_acerto));
      delete q.taxa_acerto; // não expõe o gabarito indireto de quem acerta
      for (const campo of ['tri_item', 'tri_a', 'tri_b', 'tri_c']) delete q[campo];
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhuma questão em cache. Atualizando...' });
    }

    res.json({ questoes: result.rows, fonte: 'cache_neon' });
  } catch (error) {
    console.error('Erro ao buscar questões:', error);
    res.status(500).json({ error: 'Erro ao buscar questões' });
  }
});

// ================== ATUALIZAR CACHE DA API ==================
// Converte uma questão da api.enem.dev para as colunas da tabela questoes.
// O enunciado vem em alternativesIntroduction e o texto de apoio em context,
// que pode ser null — juntar os dois evita gravar questão sem enunciado.
function prepararQuestao(q) {
  const alternativas = q.alternatives || [];
  const correta = alternativas.findIndex(a => a.isCorrect);
  if (correta === -1 || !q.title) return null;

  return [
    q.discipline,
    q.title,
    [q.context, q.alternativesIntroduction].filter(Boolean).join('\n\n'),
    JSON.stringify(alternativas.map(a => a.text)),
    correta,
    q.year,
    q.files?.[0] || null,
    numeroDaQuestao(q),
    q.language || null
  ];
}

function numeroDaQuestao(q) {
  if (Number.isInteger(q.index)) return q.index;
  const m = String(q.title || '').match(/quest[aã]o\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

const ANOS_DISPONIVEIS = [
  2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022, 2023
];

async function gravarQuestoes(questoes) {
  let inseridas = 0;
  for (const q of questoes) {
    const valores = prepararQuestao(q);
    if (!valores) continue;

    const result = await pool.query(
      `INSERT INTO questoes (disciplina, titulo, contexto, alternativas, correta, ano, imagem_url, numero, lingua)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (titulo) DO NOTHING`,
      valores
    );
    inseridas += result.rowCount;
  }
  return inseridas;
}

async function buscarProvaInteira(ano) {
  const todas = [];
  let offset = 0;
  while (true) {
    const { data } = await axios.get(
      `${ENEM_API}/v1/exams/${ano}/questions`,
      { params: { limit: 50, offset }, timeout: 30000 }
    );
    const questoes = data?.questions || [];
    if (questoes.length === 0) break;
    todas.push(...questoes);
    if (!data?.metadata?.hasMore) break;
    offset += questoes.length;
  }
  return todas;
}

// Questões gravadas antes de existir a coluna numero: busca de novo na
// api.enem.dev só para descobrir número e idioma. Roda uma vez por ano que
// ainda tenha questão sem número; depois disso não faz nada.
// O que aconteceu na última preparação da TRI, para conferir pelo navegador
// em /api/estatisticas sem precisar abrir o log do Render.
const diagnosticoTri = { etapa: 'aguardando', numeros: {}, relatorio: null, erro: null };

async function preencherNumeros() {
  const { rows } = await pool.query('SELECT DISTINCT ano FROM questoes WHERE numero IS NULL ORDER BY ano');
  for (const { ano } of rows) {
    diagnosticoTri.etapa = `buscando números de ${ano}`;
    try {
      const daApi = await buscarProvaInteira(ano);
      // Se inglês e espanhol tiverem o mesmo título, não dá para saber qual
      // das duas foi gravada: o número serve, o idioma fica em branco.
      const porTitulo = new Map();
      for (const q of daApi) {
        if (!q.title) continue;
        if (!porTitulo.has(q.title)) porTitulo.set(q.title, []);
        porTitulo.get(q.title).push(q);
      }
      const titulos = [], numeros = [], linguas = [];
      for (const [titulo, versoes] of porTitulo) {
        const idiomas = new Set(versoes.map(v => v.language || null));
        titulos.push(titulo);
        numeros.push(numeroDaQuestao(versoes[0]));
        linguas.push(idiomas.size === 1 ? [...idiomas][0] : null);
      }
      // Um UPDATE por ano: um por questão eram milhares de idas ao banco.
      const r = await pool.query(
        `UPDATE questoes q SET numero = v.numero, lingua = v.lingua
           FROM (SELECT UNNEST($1::text[]) AS titulo, UNNEST($2::int[]) AS numero,
                        UNNEST($3::text[]) AS lingua) v
          WHERE q.titulo = v.titulo AND q.numero IS NULL`,
        [titulos, numeros, linguas]
      );
      console.log(`🔢 ENEM ${ano}: número preenchido em ${r.rowCount} questões`);

      // Exemplos para comparar, caso os títulos da API e do banco não batam.
      const sobra = await pool.query('SELECT titulo FROM questoes WHERE ano = $1 AND numero IS NULL LIMIT 1', [ano]);
      const exemplo = daApi[0] || {};
      diagnosticoTri.numeros[ano] = {
        da_api: daApi.length, preenchidas: r.rowCount,
        exemplo_api: { title: exemplo.title, index: exemplo.index, language: exemplo.language },
        exemplo_banco_sem_numero: sobra.rows[0] ? sobra.rows[0].titulo.slice(0, 80) : null
      };
    } catch (erro) {
      console.error(`❌ Não consegui preencher números de ${ano}:`, erro.message);
      diagnosticoTri.numeros[ano] = { erro: erro.message };
    }
  }
}

// Casa as questões do banco com os itens do INEP e grava os parâmetros da TRI.
// Refaz tudo a cada vez: é rápido e corrige qualquer casamento antigo.
async function aplicarTri() {
  const { rows } = await pool.query(
    'SELECT id, ano, disciplina, numero, lingua, correta FROM questoes WHERE numero IS NOT NULL'
  );
  const { casadas, relatorio } = tri.casar(rows, ITENS_INEP);

  const ids = casadas.map(c => c.id);
  await pool.query(
    'UPDATE questoes SET tri_item = NULL, tri_a = NULL, tri_b = NULL, tri_c = NULL WHERE tri_item IS NOT NULL AND NOT (id = ANY($1::int[]))',
    [ids]
  );
  await pool.query(
    `UPDATE questoes q SET tri_item = v.item, tri_a = v.a, tri_b = v.b, tri_c = v.c
       FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS item, UNNEST($3::real[]) AS a,
                    UNNEST($4::real[]) AS b, UNNEST($5::real[]) AS c) v
      WHERE q.id = v.id`,
    [ids, casadas.map(c => c.item), casadas.map(c => c.a), casadas.map(c => c.b), casadas.map(c => c.c)]
  );

  console.log(`📐 TRI: ${casadas.length} de ${rows.length} questões numeradas receberam a dificuldade oficial do INEP`);
  for (const l of relatorio) {
    console.log(`   ${l.ano} ${l.area}: ${l.casadas}/${l.questoes} casadas | caderno ${l.caderno} | gabaritos iguais em ${l.concordancia}%`);
  }
  diagnosticoTri.relatorio = relatorio.map(l => `${l.ano} ${l.area}: ${l.casadas}/${l.questoes} | ${l.caderno} | ${l.concordancia}%`);
  return { casadas: casadas.length, numeradas: rows.length, relatorio };
}

async function prepararTri() {
  try {
    await preencherNumeros();
    diagnosticoTri.etapa = 'casando com o INEP';
    await aplicarTri();
    diagnosticoTri.etapa = 'concluída';
  } catch (erro) {
    console.error('❌ Erro ao aplicar TRI:', erro.message);
    diagnosticoTri.erro = erro.message;
  }
}

app.post('/api/admin/tri', exigirAdmin, async (req, res) => {
  try {
    await preencherNumeros();
    res.json(await aplicarTri());
  } catch (erro) {
    res.status(500).json({ error: 'Erro ao aplicar TRI', detalhe: erro.message });
  }
});

// Baixa a prova inteira de um ano, pagina por pagina, ate a API dizer que
// acabou (hasMore). Diferente do sorteio, aqui da para saber que terminou.
app.post('/api/carregar-ano/:ano', exigirAdmin, async (req, res) => {
  const ano = Number(req.params.ano);
  if (!ANOS_DISPONIVEIS.includes(ano)) {
    return res.status(400).json({ error: `Ano invalido. Disponiveis: ${ANOS_DISPONIVEIS.join(', ')}` });
  }

  try {
    console.log(`🔄 Carregando ENEM ${ano} por completo...`);
    const questoes = await buscarProvaInteira(ano);
    const recebidas = questoes.length;
    const inseridas = await gravarQuestoes(questoes);
    if (inseridas > 0) await aplicarTri();

    const msg = `ENEM ${ano} completo: ${recebidas} questoes lidas, ${inseridas} novas gravadas`;
    console.log(`✅ ${msg}`);
    res.json({ message: msg, ano, recebidas, inseridas });
  } catch (error) {
    console.error(`❌ Erro ao carregar ${ano}:`, error.message);
    res.status(500).json({ error: `Erro ao carregar ENEM ${ano}`, detalhe: error.message });
  }
});

// Quanto ja existe no banco, por materia e por ano.
app.get('/api/estatisticas', async (req, res) => {
  try {
    const [total, porArea, porAno] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total, COUNT(tri_b)::int AS com_tri, COUNT(numero)::int AS com_numero FROM questoes'),
      pool.query('SELECT disciplina, COUNT(*)::int AS total, COUNT(tri_b)::int AS com_tri FROM questoes GROUP BY disciplina ORDER BY total DESC'),
      pool.query('SELECT ano, COUNT(*)::int AS total, COUNT(tri_b)::int AS com_tri FROM questoes GROUP BY ano ORDER BY ano')
    ]);

    res.json({
      total: total.rows[0].total,
      com_tri: total.rows[0].com_tri,
      com_numero: total.rows[0].com_numero,
      tri_diagnostico: diagnosticoTri,
      por_materia: porArea.rows,
      por_ano: porAno.rows,
      anos_faltando: ANOS_DISPONIVEIS.filter(a => !porAno.rows.some(r => r.ano === a))
    });
  } catch (error) {
    console.error('Erro ao ler estatisticas:', error.message);
    res.status(500).json({ error: 'Erro ao ler estatisticas' });
  }
});

// Sorteia um ano e um trecho da prova e grava o que for novo. Chamada direto
// pelo cron, sem passar por HTTP, para não precisar da chave de admin.
async function atualizarCache() {
  const ano = ANOS_DISPONIVEIS[Math.floor(Math.random() * ANOS_DISPONIVEIS.length)];
  console.log(`🔄 Buscando questões do ENEM ${ano}...`);

  const response = await axios.get(
    `${ENEM_API}/v1/exams/${ano}/questions`,
    { params: { limit: 50, offset: Math.floor(Math.random() * 120) }, timeout: 30000 }
  );

  const questoes = response.data?.questions || [];
  const inseridas = await gravarQuestoes(questoes);
  if (inseridas > 0) await aplicarTri();

  const msg = `ENEM ${ano}: ${questoes.length} questões recebidas, ${inseridas} novas gravadas`;
  console.log(`✅ ${msg}`);
  return { message: msg, ano, recebidas: questoes.length, inseridas };
}

app.post('/api/atualizar-cache', exigirAdmin, async (req, res) => {
  try {
    res.json(await atualizarCache());
  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar cache', detalhe: error.message });
  }
});

// ================== SALVAR POST DO FEED ==================
app.post('/api/posts', exigirLogin, freioPosts, async (req, res) => {
  const { conteudo } = req.body;
  if (!conteudo || !String(conteudo).trim()) {
    return res.status(400).json({ error: 'Escreva alguma coisa antes de publicar.' });
  }

  try {
    // O autor vem da sessão, nunca do que o navegador mandou: senão qualquer
    // um poderia publicar no nome de outra pessoa. usuario_id guarda o nome
    // exibido; autor_id liga o post à conta, para ele sumir junto com ela.
    const result = await pool.query(
      `INSERT INTO posts (usuario_id, autor_id, conteudo, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, usuario_id, conteudo, created_at`,
      [req.usuario.username, req.usuario.id, String(conteudo).trim().slice(0, 2000)]
    );
    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar post:', error);
    res.status(500).json({ error: 'Erro ao salvar post' });
  }
});

// ================== BUSCAR POSTS ==================
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, usuario_id, conteudo, created_at FROM posts
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
});

// ================== CRON JOBS ==================
// Atualizar cache a cada hora
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Cron: Atualizando cache automático...');
  try {
    await atualizarCache();
  } catch (error) {
    console.error('❌ Erro no cron:', error.message);
  }
});

// Sessoes vencidas nao servem para nada e so ocupam espaco.
cron.schedule('0 4 * * *', async () => {
  try {
    const r = await pool.query('DELETE FROM sessoes WHERE expira_em < NOW()');
    if (r.rowCount > 0) console.log(`🧹 ${r.rowCount} sessões expiradas removidas`);
    await pool.query('DELETE FROM tokens_email WHERE expira_em < NOW() OR usado_em IS NOT NULL');
  } catch (erro) {
    console.error('❌ Erro ao limpar sessões:', erro.message);
  }
});

// Keep-alive: ping a cada 5 minutos (evita que a API durma)
cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('💓 Keep-alive ping OK -', result.rows[0].now);
  } catch (error) {
    console.error('❌ Keep-alive falhou:', error.message);
  }
});

// ================== INICIALIZAÇÃO ==================
pool.on('error', (err) => {
  console.error('Erro na conexão com Neon:', err);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'config pendente'}`);

  // Atualizar cache ao iniciar; depois, numerar o que faltar e aplicar a TRI.
  setTimeout(() => {
    atualizarCache()
      .catch(err => console.error('❌ Erro ao atualizar cache:', err.message))
      .then(prepararTri);
  }, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor gracefully...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

module.exports = { app, pool };
