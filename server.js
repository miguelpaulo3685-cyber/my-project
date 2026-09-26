require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection Pool (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
        `SELECT u.id, u.username, u.email, u.bio, u.avatar_url
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

app.post('/api/auth/registrar', async (req, res) => {
  const { nome, email, senha } = req.body || {};

  if (!nome || String(nome).trim().length < 2) {
    return res.status(400).json({ error: 'Diga seu nome (ao menos 2 letras).' });
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
      `INSERT INTO usuarios (username, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [String(nome).trim(), emailLimpo, await auth.criarHashDeSenha(senha)]
    );

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

  if (auth.bloqueado(chaveDoFreio)) {
    return res.status(429).json({ error: 'Muitas tentativas. Espere 15 minutos e tente de novo.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, senha_hash FROM usuarios WHERE email = $1',
      [emailLimpo]
    );
    const usuario = rows[0];

    // Mesma resposta para e-mail inexistente e senha errada: dizer qual dos
    // dois falhou entregaria para um estranho quais e-mails tem conta aqui.
    const ok = usuario && await auth.senhaConfere(String(senha || ''), usuario.senha_hash);
    if (!ok) {
      auth.registrarFalha(chaveDoFreio);
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    auth.limparFalhas(chaveDoFreio);
    const token = await abrirSessao(usuario.id);
    res.json({
      token,
      usuario: { id: usuario.id, username: usuario.username, email: usuario.email },
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

// ================== HEALTH CHECK ==================
// Responde 200 mesmo sem banco: o Render usa esta rota para saber se o
// servico esta de pe, e derrubar o site inteiro por causa do banco e pior.
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', banco: 'conectado', timestamp: result.rows[0].now });
  } catch (error) {
    res.json({ status: 'ok', banco: 'sem conexao', detalhe: error.message });
  }
});

// ================== QUESTÕES - GET CACHE ==================
app.get('/api/questoes/:area', async (req, res) => {
  const { area } = req.params;
  const areaMap = {
    'linguagens': 'linguagens',
    'humanas': 'ciencias-humanas',
    'natureza': 'ciencias-natureza',
    'matematica': 'matematica'
  };

  const disciplina = areaMap[area];
  if (!disciplina) return res.status(400).json({ error: 'Área inválida' });

  try {
    // Busca 5 questões do cache do Neon
    const result = await pool.query(
      `SELECT * FROM questoes
       WHERE disciplina = $1
       ORDER BY RANDOM()
       LIMIT 5`,
      [disciplina]
    );

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
    q.files?.[0] || null
  ];
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
      `INSERT INTO questoes (disciplina, titulo, contexto, alternativas, correta, ano, imagem_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (titulo) DO NOTHING`,
      valores
    );
    inseridas += result.rowCount;
  }
  return inseridas;
}

// Baixa a prova inteira de um ano, pagina por pagina, ate a API dizer que
// acabou (hasMore). Diferente do sorteio, aqui da para saber que terminou.
app.post('/api/carregar-ano/:ano', async (req, res) => {
  const ano = Number(req.params.ano);
  if (!ANOS_DISPONIVEIS.includes(ano)) {
    return res.status(400).json({ error: `Ano invalido. Disponiveis: ${ANOS_DISPONIVEIS.join(', ')}` });
  }

  try {
    console.log(`🔄 Carregando ENEM ${ano} por completo...`);
    let offset = 0;
    let recebidas = 0;
    let inseridas = 0;

    while (true) {
      const { data } = await axios.get(
        `${process.env.ENEM_API_BASE}/v1/exams/${ano}/questions`,
        { params: { limit: 50, offset }, timeout: 30000 }
      );

      const questoes = data?.questions || [];
      if (questoes.length === 0) break;

      recebidas += questoes.length;
      inseridas += await gravarQuestoes(questoes);

      if (!data?.metadata?.hasMore) break;
      offset += questoes.length;
    }

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
      pool.query('SELECT COUNT(*)::int AS total FROM questoes'),
      pool.query('SELECT disciplina, COUNT(*)::int AS total FROM questoes GROUP BY disciplina ORDER BY total DESC'),
      pool.query('SELECT ano, COUNT(*)::int AS total FROM questoes GROUP BY ano ORDER BY ano')
    ]);

    res.json({
      total: total.rows[0].total,
      por_materia: porArea.rows,
      por_ano: porAno.rows,
      anos_faltando: ANOS_DISPONIVEIS.filter(a => !porAno.rows.some(r => r.ano === a))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler estatisticas', detalhe: error.message });
  }
});

app.post('/api/atualizar-cache', async (req, res) => {
  const ano = ANOS_DISPONIVEIS[Math.floor(Math.random() * ANOS_DISPONIVEIS.length)];

  try {
    console.log(`🔄 Buscando questões do ENEM ${ano}...`);

    const response = await axios.get(
      `${process.env.ENEM_API_BASE}/v1/exams/${ano}/questions`,
      { params: { limit: 50, offset: Math.floor(Math.random() * 120) }, timeout: 30000 }
    );

    const questoes = response.data?.questions || [];
    const inseridas = await gravarQuestoes(questoes);

    const msg = `ENEM ${ano}: ${questoes.length} questões recebidas, ${inseridas} novas gravadas`;
    console.log(`✅ ${msg}`);
    res.json({ message: msg, ano, recebidas: questoes.length, inseridas });
  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar cache', detalhe: error.message });
  }
});

// ================== SALVAR POST DO FEED ==================
app.post('/api/posts', exigirLogin, async (req, res) => {
  const { conteudo } = req.body;
  if (!conteudo || !String(conteudo).trim()) {
    return res.status(400).json({ error: 'Escreva alguma coisa antes de publicar.' });
  }

  try {
    // O autor vem da sessão, nunca do que o navegador mandou: senão qualquer
    // um poderia publicar no nome de outra pessoa.
    const result = await pool.query(
      `INSERT INTO posts (usuario_id, conteudo, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [req.usuario.username, String(conteudo).trim().slice(0, 2000)]
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
      `SELECT * FROM posts
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
    const response = await axios.post(`http://localhost:${PORT}/api/atualizar-cache`);
    console.log('✅ Cache atualizado:', response.data.message);
  } catch (error) {
    console.error('❌ Erro no cron:', error.message);
  }
});

// Sessoes vencidas nao servem para nada e so ocupam espaco.
cron.schedule('0 4 * * *', async () => {
  try {
    const r = await pool.query('DELETE FROM sessoes WHERE expira_em < NOW()');
    if (r.rowCount > 0) console.log(`🧹 ${r.rowCount} sessões expiradas removidas`);
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

  // Atualizar cache ao iniciar
  setTimeout(() => {
    axios.post(`http://localhost:${PORT}/api/atualizar-cache`)
      .then(() => console.log('✅ Cache atualizado na inicialização'))
      .catch(err => console.error('❌ Erro ao atualizar cache:', err.message));
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
