require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migrações no Neon...');

    // Tabela de questões
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questoes (
        id SERIAL PRIMARY KEY,
        disciplina VARCHAR(50) NOT NULL,
        titulo TEXT NOT NULL UNIQUE,
        contexto TEXT,
        alternativas JSONB NOT NULL,
        correta INT NOT NULL,
        dificuldade INT DEFAULT 1,
        ano INT,
        imagem_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_questoes_disciplina ON questoes(disciplina);
      CREATE INDEX IF NOT EXISTS idx_questoes_created_at ON questoes(created_at DESC);
    `);
    console.log('✅ Tabela questoes criada');

    // Tabela de posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        likes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    `);
    console.log('✅ Tabela posts criada');

    // Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
    `);
    console.log('✅ Tabela usuarios criada');

    // Tabela de histórico de cache
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cache_log (
        id SERIAL PRIMARY KEY,
        area VARCHAR(50),
        questoes_count INT,
        success BOOLEAN,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cache_log_created_at ON cache_log(created_at DESC);
    `);
    console.log('✅ Tabela cache_log criada');

    console.log('✅ Todas as tabelas criadas com sucesso!');

    // Verificar dados
    const check = await pool.query('SELECT COUNT(*) FROM questoes');
    console.log(`📊 Total de questões em cache: ${check.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
