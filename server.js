require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');

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
app.post('/api/posts', async (req, res) => {
  const { usuario_id, conteudo } = req.body;
  if (!conteudo) return res.status(400).json({ error: 'Conteúdo vazio' });

  try {
    const result = await pool.query(
      `INSERT INTO posts (usuario_id, conteudo, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [usuario_id || 'anonimo', conteudo]
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
