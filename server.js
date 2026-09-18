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
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
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
       AND created_at > NOW() - INTERVAL '7 days'
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
app.post('/api/atualizar-cache', async (req, res) => {
  const areas = ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica'];
  const anosDisponiveis = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2022, 2023];

  try {
    console.log('🔄 Iniciando atualização de cache...');
    let totalInserts = 0;

    for (const area of areas) {
      const ano = anosDisponiveis[Math.floor(Math.random() * anosDisponiveis.length)];
      try {
        const response = await axios.get(
          `${process.env.ENEM_API_BASE}/questoes`,
          { params: { disciplina: area, ano, limit: 20 } }
        );

        if (response.data && response.data.results) {
          for (const q of response.data.results.slice(0, 5)) {
            const indiceCorreta = q.alternatives.findIndex(a => a.isCorrect);
            if (indiceCorreta === -1) continue;

            await pool.query(
              `INSERT INTO questoes (disciplina, titulo, contexto, alternativas, correta, ano, imagem_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (titulo) DO NOTHING`,
              [
                area,
                q.title || 'Sem título',
                q.context || '',
                JSON.stringify(q.alternatives.map(a => a.text)),
                indiceCorreta,
                ano,
                q.files?.[0] || null
              ]
            );
            totalInserts++;
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar ${area}:`, err.message);
      }
    }

    res.json({ message: `Cache atualizado com ${totalInserts} questões` });
  } catch (error) {
    console.error('Erro na atualização:', error);
    res.status(500).json({ error: 'Erro ao atualizar cache' });
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
