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
const imagens = require('./imagens');
const { numeroDaQuestao, ehDeLingua, completarLinguas, pastasQueFaltam, semRepetir } = require('./provas');

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
  "script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://accounts.google.com/gsi/",
  "frame-src https://accounts.google.com/gsi/ https://www.youtube-nocookie.com https://www.tiktok.com",
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
    // allow-popups: a janelinha do "Entrar com Google" precisa responder à página.
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
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
// Perfil e publicações levam uma foto (até ~450 KB, em base64); o resto da
// API continua com o limite pequeno.
app.use(['/api/perfil', '/api/publicacoes', '/api/admin/questoes-imagens'], express.json({ limit: '700kb' }));
app.use(express.json({ limit: '20kb' }));

// Só as páginas do site. Servir a pasta inteira entregava o código do
// servidor (e o .env, se existisse) para quem pedisse.
for (const pagina of ['index.html', 'privacidade.html', 'termos.html', 'sw.js', 'manifest.webmanifest', 'textos-motivadores.json']) {
  app.get(pagina === 'index.html' ? ['/', '/index.html'] : `/${pagina}`, (req, res) => {
    res.sendFile(path.join(__dirname, pagina));
  });
}

// Imagens do site (só a pasta img/, sem listar o conteúdo).
app.use('/img', express.static(path.join(__dirname, 'img'), { index: false, dotfiles: 'ignore', maxAge: '7d' }));

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
// Entrar com Google também é login: uma sala inteira entra pelo mesmo IP.
const freioGoogle = limitar(auth.criarFreio(100, 60 * 60 * 1000), 'Muitas tentativas daqui. Tente mais tarde.');
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
                COALESCE(u.email_verificado, FALSE) AS email_verificado,
                COALESCE(u.admin, FALSE) AS admin,
                (u.senha_hash IS NOT NULL) AS tem_senha, u.foto_id
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

function exigirModerador(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Faça login para continuar.' });
  if (!req.usuario.admin) return res.status(403).json({ error: 'Só administradores podem fazer isso.' });
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
       RETURNING id, username, email, FALSE AS email_verificado, TRUE AS tem_senha`,
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
      'SELECT id, username, email, senha_hash, foto_id, COALESCE(email_verificado, FALSE) AS email_verificado FROM usuarios WHERE email = $1',
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
      usuario: { id: usuario.id, username: usuario.username, email: usuario.email, email_verificado: usuario.email_verificado, tem_senha: true, foto: imagens.urlAssinada(usuario.foto_id) },
      dias_de_sessao: auth.DIAS_DE_SESSAO
    });
  } catch (erro) {
    console.error('Erro no login:', erro.message);
    res.status(500).json({ error: 'Não consegui entrar agora.' });
  }
});

// Entrar com Google. Se o e-mail ainda não tem conta, ela é criada na hora,
// sem senha (dá para criar uma depois em "Esqueci minha senha"). O e-mail já
// vem verificado pelo Google. Fica desligado sem GOOGLE_CLIENT_ID.
app.post('/api/auth/google', freioGoogle, async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'O login com Google ainda não está ativado.' });

  const google = await auth.conferirTokenGoogle(req.body?.credencial, clientId);
  if (!google) return res.status(401).json({ error: 'Não consegui confirmar sua conta Google. Tente de novo.' });

  try {
    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [google.email]);
    let id = existente.rows[0]?.id;
    if (id) {
      await pool.query('UPDATE usuarios SET email_verificado = TRUE WHERE id = $1', [id]);
    } else {
      // Quem cria a conta pelo botão vê, logo abaixo dele, que está aceitando
      // os Termos e a Política de Privacidade.
      const { rows } = await pool.query(
        `INSERT INTO usuarios (username, email, email_verificado, termos_aceitos_em)
         VALUES ($1, $2, TRUE, NOW()) RETURNING id`,
        [google.nome, google.email]
      );
      id = rows[0].id;
    }

    const { rows } = await pool.query(
      `SELECT id, username, email, TRUE AS email_verificado, (senha_hash IS NOT NULL) AS tem_senha, foto_id
         FROM usuarios WHERE id = $1`, [id]
    );
    const { foto_id, ...dadosDoUsuario } = rows[0];
    const token = await abrirSessao(id);
    res.status(existente.rowCount ? 200 : 201).json({
      token, usuario: { ...dadosDoUsuario, foto: imagens.urlAssinada(foto_id) }, nova: !existente.rowCount, dias_de_sessao: auth.DIAS_DE_SESSAO
    });
  } catch (erro) {
    console.error('Erro no login com Google:', erro.message);
    res.status(500).json({ error: 'Não consegui entrar agora.' });
  }
});

// O site chama esta rota ao abrir: se o token guardado ainda vale, a pessoa
// volta já logada.
app.get('/api/auth/eu', (req, res) => {
  if (!req.usuario) return res.status(401).json({ error: 'Sessão expirada ou inexistente.' });
  const { foto_id, ...usuario } = req.usuario;
  res.json({ usuario: { ...usuario, foto: imagens.urlAssinada(foto_id) } });
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
    if (!rows[0]) return res.status(404).json({ error: 'Conta não encontrada.' });
    // Conta criada pelo Google não tem senha: a confirmação é digitar o e-mail.
    const confirmou = rows[0].senha_hash
      ? await auth.senhaConfere(String(req.body?.senha || ''), rows[0].senha_hash)
      : String(req.body?.senha || '').trim().toLowerCase() === req.usuario.email;
    if (!confirmou) {
      auth.freioDeSenha.registrar(chaveDoFreio);
      return res.status(401).json({ error: rows[0].senha_hash ? 'Senha incorreta.' : 'O e-mail não confere.' });
    }

    // Sessões e posts vão junto pelo ON DELETE CASCADE.
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.json({ message: 'Sua conta e seus dados foram apagados.' });
  } catch (erro) {
    console.error('Erro ao excluir conta:', erro.message);
    res.status(500).json({ error: 'Não consegui excluir a conta agora.' });
  }
});

// Configurações públicas que o site precisa saber ao abrir. O client ID do
// Google não é segredo: ele aparece na página de qualquer site com o botão.
app.get('/api/config', (req, res) => {
  res.json({ google_client_id: process.env.GOOGLE_CLIENT_ID || null });
});

// ================== HEALTH CHECK ==================
// Responde 200 mesmo sem banco: o Render usa esta rota para saber se o
// servico esta de pe, e derrubar o site inteiro por causa do banco e pior.
// Só consulta o banco com ?banco=1 (o site pede isso ao abrir). O Render e o
// UptimeRobot chamam sem o parâmetro: se consultassem, o Neon nunca hibernaria
// e a cota mensal de computação do plano grátis acabaria.
app.get('/api/health', async (req, res) => {
  if (req.query.banco !== '1') return res.json({ status: 'ok' });
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
    // O simulado pede a nota só das questões dele, mesmo com login.
    if (req.usuario && !req.body?.so_estas) {
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

// ================== SIMULADO ==================
// Prova completa no formato do ENEM desde 2017: dia 1 com Linguagens e
// Humanas, dia 2 com Natureza e Matemática, 45 questões de cada área.
// Linguagens começa pelas 5 de língua estrangeira escolhida.
const DIAS_DO_SIMULADO = {
  1: ['linguagens', 'ciencias-humanas'],
  2: ['ciencias-natureza', 'matematica']
};
const POR_AREA = 45;
const QUESTOES_DE_LINGUA = 5;

// Questões de uma área na ordem da prova (número da questão). Questão de
// inglês ou espanhol só entra se for da língua escolhida.
function montarArea(linhas, disciplina, lingua) {
  const daArea = linhas.filter(q => q.disciplina === disciplina && (!q.lingua || q.lingua === lingua));
  const ordem = (a, b) => (a.numero ?? 9999) - (b.numero ?? 9999) || a.id - b.id;
  if (disciplina !== 'linguagens') return daArea.sort(ordem).slice(0, POR_AREA);
  const deLingua = daArea.filter(q => q.lingua).sort(ordem).slice(0, QUESTOES_DE_LINGUA);
  const resto = daArea.filter(q => !q.lingua).sort(ordem).slice(0, POR_AREA - deLingua.length);
  return [...deLingua, ...resto];
}

const limparQuestao = q => {
  for (const campo of ['tri_item', 'tri_a', 'tri_b', 'tri_c', 'disciplina_api', 'created_at', 'updated_at', 'dificuldade']) delete q[campo];
  return q;
};

app.get('/api/simulado', async (req, res) => {
  const dia = Number(req.query.dia);
  const disciplinas = DIAS_DO_SIMULADO[dia];
  if (!disciplinas) return res.status(400).json({ error: 'Escolha o dia 1 ou o dia 2.' });
  const lingua = req.query.lingua === 'espanhol' ? 'espanhol' : 'ingles';
  const ano = req.query.ano === 'misto' ? 'misto' : Number(req.query.ano);
  if (ano !== 'misto' && !ANOS_DISPONIVEIS.includes(ano)) return res.status(400).json({ error: 'Ano inválido.' });

  try {
    let linhas;
    if (ano === 'misto') {
      // Questões sorteadas de todos os anos: 45 por área (5 da língua escolhida).
      ({ rows: linhas } = await pool.query(
        `(SELECT * FROM questoes WHERE disciplina = $1 AND lingua = $3 ORDER BY RANDOM() LIMIT ${QUESTOES_DE_LINGUA})
         UNION ALL
         (SELECT * FROM questoes WHERE disciplina = $1 AND lingua IS NULL ORDER BY RANDOM() LIMIT ${POR_AREA})
         UNION ALL
         (SELECT * FROM questoes WHERE disciplina = $2 ORDER BY RANDOM() LIMIT ${POR_AREA})`,
        [disciplinas[0], disciplinas[1], lingua]
      ));
      // No sorteio a ordem não existe: numera na sequência para a prova ficar organizada.
      linhas.forEach((q, i) => { q.numero = i; });
    } else {
      ({ rows: linhas } = await pool.query(
        'SELECT * FROM questoes WHERE ano = $1 AND disciplina = ANY($2::text[])', [ano, disciplinas]
      ));
    }
    const questoes = disciplinas.flatMap(d => montarArea(linhas, d, lingua)).map(limparQuestao);
    if (questoes.length === 0) return res.status(404).json({ error: 'Não há questões para esse simulado ainda.' });
    res.json({ dia, ano, lingua, questoes });
  } catch (erro) {
    console.error('Erro ao montar simulado:', erro.message);
    res.status(500).json({ error: 'Não consegui montar o simulado agora.' });
  }
});

// Quantas questões cada ano tem em cada dia, para o site mostrar quais
// provas estão completas.
// Quantas questões de cada ENEM o banco tem, por dia de prova.
async function contarProvas() {
  // Conta do mesmo jeito que o simulado monta a prova (com inglês), para o
  // número mostrado ser o número de questões que o aluno vai ver.
  const { rows } = await pool.query('SELECT id, ano, disciplina, lingua, numero FROM questoes WHERE ano IS NOT NULL');
  const anos = ANOS_DISPONIVEIS.map(ano => {
    const doAno = rows.filter(r => r.ano === ano);
    const dia = n => DIAS_DO_SIMULADO[n].reduce((t, d) => t + montarArea(doAno, d, 'ingles').length, 0);
    return { ano, dia1: dia(1), dia2: dia(2) };
  }).reverse();
  return { anos, por_dia: POR_AREA * 2 };
}

app.get('/api/simulado/anos', async (req, res) => {
  try {
    res.json(await contarProvas());
  } catch (erro) {
    console.error('Erro ao contar provas:', erro.message);
    res.status(500).json({ error: 'Não consegui ver as provas agora.' });
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
// A área de cada questão sai da posição dela na prova, que é fixa. A
// api.enem.dev erra a área de várias questões (em 2023, 11 de Natureza vêm
// como Humanas ou Matemática), e a contagem por área ficava incompleta.
// 2009: Natureza, Humanas | Linguagens, Matemática
// 2010 a 2016: Humanas, Natureza | Linguagens, Matemática
// 2017 em diante: Linguagens, Humanas | Natureza, Matemática
const ORDEM_DAS_AREAS = {
  antiga2009: ['ciencias-natureza', 'ciencias-humanas', 'linguagens', 'matematica'],
  antiga: ['ciencias-humanas', 'ciencias-natureza', 'linguagens', 'matematica'],
  atual: ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica']
};
function areaPeloNumero(ano, numero) {
  if (!Number.isInteger(numero) || numero < 1 || numero > 180) return null;
  const ordem = ano >= 2017 ? ORDEM_DAS_AREAS.atual : ano === 2009 ? ORDEM_DAS_AREAS.antiga2009 : ORDEM_DAS_AREAS.antiga;
  return ordem[Math.floor((numero - 1) / 45)];
}

const NOME_DA_LINGUA = { ingles: 'Inglês', espanhol: 'Espanhol' };

// Converte uma questão da api.enem.dev para as colunas da tabela questoes.
// O enunciado vem em alternativesIntroduction e o texto de apoio em context,
// que pode ser null — juntar os dois evita gravar questão sem enunciado.
// Questões de inglês e espanhol têm o mesmo título na fonte ("Questão 1 -
// ENEM 2023"); sem o idioma no título, uma das duas era descartada.
// Alternativa que é só imagem vira a imagem em markdown (antes ficava vazia).
function prepararQuestao(q) {
  const alternativas = q.alternatives || [];
  const correta = alternativas.findIndex(a => a.isCorrect);
  if (correta === -1 || !q.title) return null;
  const numero = numeroDaQuestao(q);
  const lingua = q.language || null;
  return {
    disciplina: areaPeloNumero(q.year, numero) || q.discipline,
    disciplina_api: q.discipline,
    titulo_original: q.title,
    titulo: lingua ? `${q.title} (${NOME_DA_LINGUA[lingua] || lingua})` : q.title,
    contexto: [q.context, q.alternativesIntroduction].filter(Boolean).join('\n\n'),
    alternativas: JSON.stringify(alternativas.map(a => [a.text, a.file ? `![](${a.file})` : null].filter(Boolean).join('\n'))),
    correta,
    ano: q.year,
    imagem_url: q.files?.[0] || null,
    numero,
    lingua
  };
}

const ANOS_DISPONIVEIS = [
  2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022, 2023
];

// Grava ou corrige cada questão. A que já existe é atualizada no lugar (o id
// não muda, então respostas, comentários e TRI continuam valendo); antes de
// inserir, procura pelo título novo e pelo antigo, sem o idioma.
async function gravarQuestoes(questoes) {
  let inseridas = 0, atualizadas = 0;
  for (const q of completarLinguas(questoes)) {
    const v = prepararQuestao(q);
    if (!v) continue;
    const campos = [v.disciplina, v.titulo, v.contexto, v.alternativas, v.correta, v.ano, v.imagem_url, v.numero, v.lingua,
      v.disciplina !== v.disciplina_api ? v.disciplina_api : null];
    const atualizar = (onde, extra = []) => pool.query(
      `UPDATE questoes SET disciplina = $1, titulo = $2, contexto = $3, alternativas = $4, correta = $5, ano = $6,
              imagem_url = $7, numero = $8, lingua = $9, disciplina_api = $10, updated_at = NOW()
        WHERE ${onde}`, [...campos, ...extra]);
    let r = await atualizar('titulo = $2');
    if (!r.rowCount && v.titulo_original !== v.titulo) {
      // Questão de língua gravada no formato antigo: a primeira das duas
      // (inglês ou espanhol) fica com a linha que já existia.
      r = await atualizar('titulo = $11 AND (lingua IS NULL OR lingua = $9)', [v.titulo_original]);
    }
    if (r.rowCount) { atualizadas++; continue; }
    const ins = await pool.query(
      `INSERT INTO questoes (disciplina, titulo, contexto, alternativas, correta, ano, imagem_url, numero, lingua, disciplina_api)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (titulo) DO NOTHING`, campos);
    inseridas += ins.rowCount;
  }
  return { inseridas, atualizadas };
}

// Questões já no banco: a área pela posição na prova, sem precisar da fonte.
async function corrigirAreas() {
  const casos = [
    ['ano >= 2017', ORDEM_DAS_AREAS.atual],
    ['ano = 2009', ORDEM_DAS_AREAS.antiga2009],
    ['ano BETWEEN 2010 AND 2016', ORDEM_DAS_AREAS.antiga]
  ];
  let total = 0;
  for (const [onde, ordem] of casos) {
    const r = await pool.query(
      `UPDATE questoes SET disciplina_api = COALESCE(disciplina_api, disciplina),
              disciplina = (ARRAY[$1, $2, $3, $4])[((numero - 1) / 45) + 1]
        WHERE ${onde} AND numero BETWEEN 1 AND 180
          AND disciplina <> (ARRAY[$1, $2, $3, $4])[((numero - 1) / 45) + 1]`, ordem);
    total += r.rowCount;
  }
  if (total) console.log(`🧭 ${total} questões mudaram para a área certa (pela posição na prova)`);
  return total;
}

// Uma vez por ano de prova: busca a prova inteira de novo e corrige o que
// foi gravado do jeito antigo (língua estrangeira faltando, alternativas que
// eram só imagem). Um ano a cada 20 s, para a api.enem.dev não bloquear.
const VERSAO_DA_CORRECAO = 'questoes_v3';
async function corrigirProvasUmaVez() {
  const feitos = new Set((await pool.query(
    `SELECT chave FROM configuracoes WHERE chave LIKE $1`, [`${VERSAO_DA_CORRECAO}:%`])).rows.map(r => r.chave));
  let mexeu = false;
  for (const ano of ANOS_DISPONIVEIS) {
    const chave = `${VERSAO_DA_CORRECAO}:${ano}`;
    if (feitos.has(chave)) continue;
    try {
      const { inseridas, atualizadas } = await gravarQuestoes(await buscarProvaInteira(ano));
      await pool.query(`INSERT INTO configuracoes (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING`,
        [chave, JSON.stringify({ inseridas, atualizadas, em: new Date().toISOString() })]);
      console.log(`🛠️ ENEM ${ano} corrigido: ${inseridas} novas, ${atualizadas} atualizadas`);
      mexeu = mexeu || inseridas > 0 || atualizadas > 0;
    } catch (erro) {
      console.error(`❌ Não consegui corrigir o ENEM ${ano} agora (tenta no próximo reinício):`, erro.message);
    }
    await new Promise(r => setTimeout(r, 20000));
  }
  if (mexeu) await prepararTri();
}

async function buscarNaApi(ano, language) {
  const todas = [];
  let offset = 0;
  while (true) {
    const { data } = await axios.get(
      `${ENEM_API}/v1/exams/${ano}/questions`,
      { params: { limit: 50, offset, language }, timeout: 30000 }
    );
    const questoes = data?.questions || [];
    if (questoes.length === 0) break;
    todas.push(...questoes);
    if (!data?.metadata?.hasMore) break;
    offset += questoes.length;
  }
  return todas;
}

// O repositório da api.enem.dev no GitHub tem um arquivo por questão, numa
// pasta "91", "1-ingles" ou "1-espanhol".
const FONTE_GITHUB = 'https://raw.githubusercontent.com/yunger7/enem-api/main/public';
async function arquivoDoGithub(caminho, tentativas = 3) {
  try {
    return (await axios.get(`${FONTE_GITHUB}/${caminho}`, { timeout: 20000 })).data;
  } catch (erro) {
    if (erro.response?.status === 404) return null;
    if (tentativas <= 1) throw erro;
    await new Promise(r => setTimeout(r, 2000));
    return arquivoDoGithub(caminho, tentativas - 1);
  }
}
async function buscarNoGithub(ano, pastas) {
  const achadas = [];
  for (let i = 0; i < pastas.length; i += 8) {
    const lote = await Promise.all(pastas.slice(i, i + 8).map(pasta => arquivoDoGithub(`${ano}/questions/${pasta}/details.json`)));
    achadas.push(...lote.filter(Boolean));
  }
  return achadas;
}

// A api.enem.dev é a fonte principal, pedida uma vez por idioma. O que ela
// não mandar, ou tudo se ela estiver fora do ar, vem do GitHub.
async function buscarProvaInteira(ano) {
  const daApi = [];
  for (const language of ['ingles', 'espanhol']) {
    try { daApi.push(...await buscarNaApi(ano, language)); }
    catch (erro) { console.error(`⚠️ api.enem.dev não respondeu para ${ano} (${language}): ${erro.message}`); }
  }
  let todas = semRepetir(completarLinguas(daApi));
  const faltam = pastasQueFaltam(ano, todas);
  if (faltam.length) todas = semRepetir(completarLinguas([...todas, ...await buscarNoGithub(ano, faltam)]));
  return todas;
}

// Questões gravadas antes de existir a coluna numero: busca de novo na
// api.enem.dev só para descobrir número e idioma. Roda uma vez por ano que
// ainda tenha questão sem número; depois disso não faz nada.
// O que aconteceu na última preparação da TRI, para conferir pelo navegador
// em /api/estatisticas sem precisar abrir o log do Render.
const diagnosticoTri = { etapa: 'aguardando', numeros: {}, relatorio: null, erro: null };

// O número da questão já está no título ("Questão 101 - ENEM 2015"). Ler
// dali evita buscar a prova de novo na api.enem.dev, que bloqueia (erro 429)
// quando recebe muitos pedidos seguidos.
async function preencherNumeros() {
  diagnosticoTri.etapa = 'lendo números dos títulos';
  const r = await pool.query(
    `UPDATE questoes
        SET numero = substring(titulo from '[Qq]uest[ãa]o[[:space:]]+([0-9]+)')::int,
            lingua = COALESCE(lingua, CASE WHEN titulo ~* 'ingl[eê]s' THEN 'ingles'
                                           WHEN titulo ~* 'espanhol' THEN 'espanhol' END)
      WHERE numero IS NULL AND titulo ~* 'quest[ãa]o[[:space:]]+[0-9]+'`
  );
  const sobra = await pool.query(
    'SELECT COUNT(*)::int AS total, MIN(titulo) AS exemplo FROM questoes WHERE numero IS NULL'
  );
  diagnosticoTri.numeros = {
    preenchidas_agora: r.rowCount,
    sem_numero: sobra.rows[0].total,
    exemplo_sem_numero: sobra.rows[0].exemplo ? sobra.rows[0].exemplo.slice(0, 80) : null
  };
  console.log(`🔢 Número lido do título em ${r.rowCount} questões; ${sobra.rows[0].total} ainda sem número`);
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

  // A api.enem.dev às vezes põe a questão na área errada (em 2010, dezenas
  // de questões de Linguagens aparecem como Humanas). O caderno do INEP diz
  // a área certa; a original fica em disciplina_api, para dar para desfazer.
  const atual = new Map(rows.map(q => [q.id, q.disciplina]));
  const trocar = casadas.filter(c => c.disciplina && c.disciplina !== atual.get(c.id));
  if (trocar.length > 0) {
    await pool.query(
      `UPDATE questoes q SET disciplina_api = COALESCE(q.disciplina_api, q.disciplina), disciplina = v.disciplina
         FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::text[]) AS disciplina) v
        WHERE q.id = v.id`,
      [trocar.map(c => c.id), trocar.map(c => c.disciplina)]
    );
  }

  console.log(`📐 TRI: ${casadas.length} de ${rows.length} questões numeradas receberam a dificuldade oficial do INEP; ${trocar.length} mudaram de área`);
  for (const l of relatorio) {
    console.log(`   ${l.ano}: ${l.casadas}/${l.questoes} casadas | ${l.cadernos.join(' | ')}`);
  }
  diagnosticoTri.reclassificadas = trocar.length;
  diagnosticoTri.relatorio = relatorio.map(l => `${l.ano}: ${l.casadas}/${l.questoes} | ${l.cadernos.join(' | ')}`);
  return { casadas: casadas.length, numeradas: rows.length, reclassificadas: trocar.length, relatorio };
}

async function prepararTri() {
  try {
    await preencherNumeros();
    diagnosticoTri.etapa = 'casando com o INEP';
    await aplicarTri();
    await corrigirAreas();
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
// Também pelo site, para quem é administrador (Conta → Administração).
app.post(['/api/carregar-ano/:ano', '/api/admin/carregar-ano/:ano'], (req, res, next) =>
  (req.path.startsWith('/api/admin/') ? exigirModerador : exigirAdmin)(req, res, next), async (req, res) => {
  const ano = Number(req.params.ano);
  if (!ANOS_DISPONIVEIS.includes(ano)) {
    return res.status(400).json({ error: `Ano invalido. Disponiveis: ${ANOS_DISPONIVEIS.join(', ')}` });
  }

  try {
    console.log(`🔄 Carregando ENEM ${ano} por completo...`);
    const questoes = await buscarProvaInteira(ano);
    const recebidas = questoes.length;
    const { inseridas, atualizadas } = await gravarQuestoes(questoes);
    await aplicarTri();
    await corrigirAreas();
    const prova = (await contarProvas()).anos.find(a => a.ano === ano);
    // Números que a fonte não tem: não adianta buscar de novo.
    const faltam_na_fonte = [...new Set(pastasQueFaltam(ano, questoes).map(p => parseInt(p, 10)))];

    const msg = `ENEM ${ano}: ${recebidas} questoes lidas, ${inseridas} novas, ${atualizadas} corrigidas`;
    console.log(`✅ ${msg}`);
    res.json({ message: msg, ano, recebidas, inseridas, atualizadas, dia1: prova.dia1, dia2: prova.dia2, faltam_na_fonte });
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
      tri_etapa: diagnosticoTri.etapa,
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
  const { inseridas } = await gravarQuestoes(questoes);
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
  // Post de grupo: só quem é membro publica no feed do grupo.
  const grupoId = req.body.grupo_id ? Number(req.body.grupo_id) : null;

  try {
    if (grupoId) {
      const acesso = await require('./grupos').acessoAoGrupo(pool, grupoId, req.usuario);
      if (!acesso.postar) return res.status(403).json({ error: 'Entre no grupo para publicar nele.' });
    }
    // O autor vem da sessão, nunca do que o navegador mandou: senão qualquer
    // um poderia publicar no nome de outra pessoa. usuario_id guarda o nome
    // exibido; autor_id liga o post à conta, para ele sumir junto com ela.
    const result = await pool.query(
      `INSERT INTO posts (usuario_id, autor_id, conteudo, grupo_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, usuario_id, conteudo, created_at`,
      [req.usuario.username, req.usuario.id, String(conteudo).trim().slice(0, 2000), grupoId]
    );
    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar post:', error);
    res.status(500).json({ error: 'Erro ao salvar post' });
  }
});

// ================== BUSCAR POSTS ==================
// Quem lê não recebe autor_id: só fica sabendo se pode apagar ou denunciar.
// Administradores veem também os posts escondidos por denúncia.
app.get('/api/posts', async (req, res) => {
  const eu = req.usuario;
  // Sem ?grupo= é o feed geral; com ele, o feed daquele grupo.
  const grupoId = req.query.grupo ? Number(req.query.grupo) : null;
  try {
    if (grupoId) {
      const acesso = await require('./grupos').acessoAoGrupo(pool, grupoId, eu);
      if (!acesso.existe) return res.status(404).json({ error: 'Grupo não encontrado.' });
      if (!acesso.ler) return res.status(403).json({ error: eu ? 'Essa turma é só para quem tem o convite.' : 'Entre na sua conta para ver os grupos.' });
    }
    const result = await pool.query(
      `SELECT p.id, p.usuario_id, p.conteudo, p.created_at, p.autor_id,
              COALESCE(p.oculto, FALSE) AS oculto,
              (SELECT COUNT(*)::int FROM denuncias d WHERE d.post_id = p.id) AS denuncias,
              EXISTS (SELECT 1 FROM denuncias d WHERE d.post_id = p.id AND d.usuario_id = $1) AS denunciei
         FROM posts p
        WHERE (NOT COALESCE(p.oculto, FALSE) OR $2) AND p.grupo_id IS NOT DISTINCT FROM $3
        ORDER BY p.created_at DESC
        LIMIT 50`,
      [eu ? eu.id : null, Boolean(eu && eu.admin), grupoId]
    );
    res.json({
      posts: result.rows.map(p => {
        const meu = Boolean(eu && p.autor_id === eu.id);
        const post = {
          id: p.id, usuario_id: p.usuario_id, autor_id: p.autor_id, conteudo: p.conteudo, created_at: p.created_at,
          meu, pode_apagar: meu || Boolean(eu && eu.admin), denunciei: p.denunciei
        };
        if (eu && eu.admin) Object.assign(post, { oculto: p.oculto, denuncias: p.denuncias });
        return post;
      }),
      moderador: Boolean(eu && eu.admin)
    });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
});

// ================== PERFIL E GALERIA ==================
require('./perfis')(app, { pool, auth, limitar, exigirLogin, exigirModerador });
require('./simulados')(app, { pool, auth, limitar, exigirLogin });
require('./reels')(app, { pool, auth, limitar, exigirLogin, exigirModerador });
require('./social')(app, { pool, auth, limitar, exigirLogin });
require('./discussao')(app, { pool, auth, limitar, exigirLogin, exigirModerador });
require('./desafio')(app, { pool, auth, limitar, exigirLogin });
require('./grupos')(app, { pool, auth, limitar, exigirLogin });
require('./comunidade')(app, { pool, auth, limitar, exigirLogin });
require('./perguntas')(app, { pool, auth, limitar, exigirLogin, exigirModerador });
require('./avisos')(app, { pool, auth, limitar, exigirLogin });
require('./redacoes')(app, { pool, auth, limitar, exigirLogin });

// ================== ADMINISTRAÇÃO ==================
// Os números que dizem se o site está funcionando, o que espera moderação e
// quantas questões cada ENEM tem no banco.
app.get('/api/admin/resumo', exigirModerador, async (req, res) => {
  try {
    const n = (await pool.query(`
      SELECT (SELECT COUNT(*)::int FROM usuarios) AS contas,
             (SELECT COUNT(*)::int FROM usuarios WHERE created_at > NOW() - INTERVAL '7 days') AS contas_semana,
             (SELECT COUNT(DISTINCT usuario_id)::int FROM respostas WHERE created_at > NOW() - INTERVAL '1 day' AND usuario_id IS NOT NULL) AS ativos_dia,
             (SELECT COUNT(DISTINCT usuario_id)::int FROM respostas WHERE created_at > NOW() - INTERVAL '7 days' AND usuario_id IS NOT NULL) AS ativos_semana,
             (SELECT COUNT(*)::int FROM (SELECT usuario_id FROM respostas WHERE created_at > NOW() - INTERVAL '7 days' AND usuario_id IS NOT NULL
                GROUP BY usuario_id HAVING COUNT(DISTINCT (created_at - INTERVAL '3 hours')::date) >= 2) v) AS voltaram_semana,
             (SELECT COUNT(*)::int FROM respostas WHERE created_at > NOW() - INTERVAL '7 days') AS questoes_semana,
             (SELECT COUNT(*)::int FROM push_inscricoes) AS aparelhos_com_avisos,
             (SELECT COUNT(*)::int FROM posts WHERE oculto) AS posts_ocultos,
             (SELECT COUNT(*)::int FROM perguntas WHERE oculto) AS perguntas_ocultas,
             (SELECT COUNT(*)::int FROM perguntas_respostas WHERE oculto) AS respostas_ocultas,
             (SELECT COUNT(*)::int FROM questoes_comentarios WHERE oculto) AS comentarios_ocultos,
             (SELECT COUNT(*)::int FROM redacoes WHERE oculto) AS redacoes_ocultas,
             (SELECT COUNT(*)::int FROM redacoes_correcoes WHERE oculto) AS correcoes_denunciadas,
             (SELECT COUNT(*)::int FROM reels WHERE status = 'pendente') AS reels_pendentes`)).rows[0];
    res.json({ numeros: n, provas: await contarProvas() });
  } catch (erro) {
    console.error('Erro no resumo de administração:', erro.message);
    res.status(500).json({ error: 'Não consegui carregar os números agora.' });
  }
});

// ---------- questões que a fonte não tem ----------
// Números de questão (e línguas) de cada prova que ainda não estão no banco.
// Questão de língua estrangeira precisa das duas versões; sem marcação de
// língua, a gravada conta como a de inglês.
async function questoesFaltando() {
  const { rows } = await pool.query('SELECT ano, numero, lingua FROM questoes WHERE ano IS NOT NULL AND numero BETWEEN 1 AND 180');
  const tem = new Set(rows.map(r => `${r.ano}:${r.numero}:${r.lingua || ''}`));
  const faltam = [];
  for (const ano of ANOS_DISPONIVEIS) {
    for (let n = 1; n <= 180; n++) {
      const area = areaPeloNumero(ano, n);
      if (!ehDeLingua(ano, n)) { if (!tem.has(`${ano}:${n}:`)) faltam.push({ ano, numero: n, lingua: null, area }); continue; }
      if (!tem.has(`${ano}:${n}:ingles`) && !tem.has(`${ano}:${n}:`)) faltam.push({ ano, numero: n, lingua: 'ingles', area });
      if (!tem.has(`${ano}:${n}:espanhol`)) faltam.push({ ano, numero: n, lingua: 'espanhol', area });
    }
  }
  return faltam;
}

app.get('/api/admin/faltando', exigirModerador, async (req, res) => {
  try {
    res.json({ faltam: await questoesFaltando() });
  } catch (erro) {
    console.error('Erro ao listar questões faltando:', erro.message);
    res.status(500).json({ error: 'Não consegui listar agora.' });
  }
});

// Imagem de questão: o navegador já manda em JPEG; o servidor confere.
app.post('/api/admin/questoes-imagens', exigirModerador, async (req, res) => {
  const { dados, erro } = imagens.lerImagem(req.body?.imagem);
  if (erro) return res.status(400).json({ error: erro });
  try {
    const { rows } = await pool.query('INSERT INTO imagens_questoes (dados, enviada_por) VALUES ($1, $2) RETURNING id', [dados, req.usuario.id]);
    res.status(201).json({ caminho: `/api/questoes-imagens/${rows[0].id}` });
  } catch (e) {
    console.error('Erro ao guardar imagem de questão:', e.message);
    res.status(500).json({ error: 'Não consegui guardar a imagem agora.' });
  }
});

app.get('/api/questoes-imagens/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(404).end();
  try {
    const { rows } = await pool.query('SELECT dados FROM imagens_questoes WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).end();
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable', // a imagem de um id nunca muda
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Content-Security-Policy': "default-src 'none'"
    });
    res.send(rows[0].dados);
  } catch (e) {
    res.status(500).end();
  }
});

// Cadastra (ou corrige) uma questão copiada do caderno do INEP. Fica com o
// mesmo título que a api.enem.dev usaria: se um dia a fonte tiver a questão,
// a busca atualiza esta mesma linha em vez de duplicar.
async function salvarQuestaoManual({ ano, numero, lingua, contexto, alternativas, correta }) {
  const titulo = `Questão ${numero} - ENEM ${ano}${lingua ? ` (${NOME_DA_LINGUA[lingua]})` : ''}`;
  await pool.query(
    `INSERT INTO questoes (disciplina, titulo, contexto, alternativas, correta, ano, numero, lingua)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (titulo) DO UPDATE SET disciplina = EXCLUDED.disciplina, contexto = EXCLUDED.contexto,
       alternativas = EXCLUDED.alternativas, correta = EXCLUDED.correta, ano = EXCLUDED.ano, numero = EXCLUDED.numero,
       lingua = EXCLUDED.lingua, updated_at = NOW()`,
    [areaPeloNumero(ano, numero), titulo, contexto, JSON.stringify(alternativas), correta, ano, numero, lingua]);
  return titulo;
}

// Questões que nenhuma fonte tem, transcritas dos cadernos do INEP para
// questoes-manuais.json (as figuras ficam em img/questoes, no GitHub Pages).
async function gravarQuestoesManuais() {
  const lista = require('./questoes-manuais.json');
  for (const q of lista) await salvarQuestaoManual(q);
  if (lista.length) {
    await aplicarTri();
    await corrigirAreas();
  }
  console.log(`📝 ${lista.length} questões transcritas do INEP gravadas`);
}

app.post('/api/admin/questoes', exigirModerador, async (req, res) => {
  const c = req.body || {};
  const ano = Number(c.ano), numero = Number(c.numero);
  const lingua = ['ingles', 'espanhol'].includes(c.lingua) ? c.lingua : null;
  const contexto = typeof c.contexto === 'string' ? c.contexto.trim() : '';
  const alternativas = Array.isArray(c.alternativas) ? c.alternativas.map(a => (typeof a === 'string' ? a.trim() : '')) : [];
  const correta = Number(c.correta);
  if (!ANOS_DISPONIVEIS.includes(ano) || !Number.isInteger(numero) || numero < 1 || numero > 180) return res.status(400).json({ error: 'Ano ou número inválido.' });
  if (Boolean(lingua) !== ehDeLingua(ano, numero)) return res.status(400).json({ error: 'Essa questão não é (ou é) de língua estrangeira: confira o número.' });
  if (contexto.length < 10 || contexto.length > 20000) return res.status(400).json({ error: 'Copie o texto da questão (enunciado e o que vier antes das alternativas).' });
  if (alternativas.length !== 5 || alternativas.some(a => !a || a.length > 3000)) return res.status(400).json({ error: 'Preencha as 5 alternativas (texto ou imagem).' });
  if (![0, 1, 2, 3, 4].includes(correta)) return res.status(400).json({ error: 'Marque a alternativa correta (veja o gabarito oficial).' });
  try {
    const titulo = await salvarQuestaoManual({ ano, numero, lingua, contexto, alternativas, correta });
    console.log(`📝 ${titulo} cadastrada pela Administração (usuário ${req.usuario.id})`);
    await aplicarTri();
    await corrigirAreas();
    const prova = (await contarProvas()).anos.find(a => a.ano === ano);
    res.status(201).json({ titulo, dia1: prova.dia1, dia2: prova.dia2 });
  } catch (erro) {
    console.error('Erro ao cadastrar questão:', erro.message);
    res.status(500).json({ error: 'Não consegui salvar a questão agora.' });
  }
});

// ================== MODERAÇÃO DO FEED ==================
const DENUNCIAS_PARA_ESCONDER = 3;
const freioDenuncias = limitar(auth.criarFreio(20, 60 * 60 * 1000), 'Você fez muitas denúncias. Espere um pouco.',
  req => `u${req.usuario.id}`);

// O autor apaga o próprio post; administradores apagam qualquer um.
app.delete('/api/posts/:id', exigirLogin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Post inválido.' });
  try {
    const r = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND (autor_id = $2 OR $3) RETURNING id',
      [id, req.usuario.id, Boolean(req.usuario.admin)]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Post não encontrado ou não é seu.' });
    if (req.usuario.admin) console.log(`🛡️ Post ${id} apagado pelo administrador ${req.usuario.id}`);
    res.json({ message: 'Post apagado.' });
  } catch (erro) {
    console.error('Erro ao apagar post:', erro.message);
    res.status(500).json({ error: 'Não consegui apagar o post agora.' });
  }
});

// Com DENUNCIAS_PARA_ESCONDER pessoas diferentes, o post sai do ar até um
// administrador revisar. Não dá para denunciar o próprio post.
app.post('/api/posts/:id/denunciar', exigirLogin, freioDenuncias, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Post inválido.' });
  const motivo = String(req.body?.motivo || '').trim().slice(0, 200) || null;
  try {
    const post = await pool.query('SELECT autor_id FROM posts WHERE id = $1', [id]);
    if (!post.rows[0]) return res.status(404).json({ error: 'Post não encontrado.' });
    if (post.rows[0].autor_id === req.usuario.id) return res.status(400).json({ error: 'Você não pode denunciar o próprio post.' });

    await pool.query(
      'INSERT INTO denuncias (post_id, usuario_id, motivo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [id, req.usuario.id, motivo]
    );
    const { rows } = await pool.query(
      `UPDATE posts SET oculto = TRUE
        WHERE id = $1 AND (SELECT COUNT(*) FROM denuncias WHERE post_id = $1) >= $2
        RETURNING id`,
      [id, DENUNCIAS_PARA_ESCONDER]
    );
    if (rows[0]) console.log(`🛡️ Post ${id} escondido por denúncias`);
    res.json({ message: 'Obrigado! A denúncia foi registrada e vai ser revisada.' });
  } catch (erro) {
    console.error('Erro ao denunciar post:', erro.message);
    res.status(500).json({ error: 'Não consegui registrar a denúncia agora.' });
  }
});

// Administrador revisou e o post está ok: volta ao ar e as denúncias somem.
app.post('/api/posts/:id/restaurar', exigirModerador, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Post inválido.' });
  try {
    await pool.query('DELETE FROM denuncias WHERE post_id = $1', [id]);
    const r = await pool.query('UPDATE posts SET oculto = FALSE WHERE id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Post não encontrado.' });
    res.json({ message: 'Post restaurado.' });
  } catch (erro) {
    console.error('Erro ao restaurar post:', erro.message);
    res.status(500).json({ error: 'Não consegui restaurar o post agora.' });
  }
});

// ================== CRON JOBS ==================
// Todas as provas de 2009 a 2023 já estão no banco; uma busca por dia basta
// para pegar alguma questão que tenha faltado, sem acordar o Neon toda hora.
cron.schedule('0 5 * * *', async () => {
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
    // Notificação lida e velha não serve para ninguém.
    await pool.query(`DELETE FROM notificacoes WHERE created_at < NOW() - INTERVAL '60 days'`);
    // Comunidade: atividade de mais de 30 dias, chat das salas e presença velha.
    await pool.query(`DELETE FROM atividades WHERE created_at < NOW() - INTERVAL '30 days'`);
    await pool.query(`DELETE FROM sala_mensagens WHERE created_at < NOW() - INTERVAL '1 day'`);
    await pool.query(`DELETE FROM presenca WHERE visto_em < NOW() - INTERVAL '2 days'`);
  } catch (erro) {
    console.error('❌ Erro ao limpar sessões:', erro.message);
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
  // Cada etapa com o seu catch: um erro numa não pode impedir as seguintes.
  setTimeout(async () => {
    await atualizarCache().catch(err => console.error('❌ Erro ao atualizar cache:', err.message));
    await prepararTri().catch(err => console.error('❌ Erro ao preparar a TRI:', err.message));
    await require('./reels').publicarReelsIniciais(pool).catch(err => console.error('❌ Erro ao publicar reels iniciais:', err.message));
    await gravarQuestoesManuais().catch(err => console.error('❌ Erro ao gravar as questões transcritas:', err.message));
    await corrigirProvasUmaVez().catch(err => console.error('❌ Erro ao corrigir as provas:', err.message));
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

module.exports = { app, pool, prepararQuestao, areaPeloNumero, gravarQuestoes, corrigirAreas };
