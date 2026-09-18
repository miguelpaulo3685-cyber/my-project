/**
 * Serviço de Keep-Alive para manter a API rodando
 * Executa pings periódicos e atualiza cache
 * Ideal para rodar em serviços como Render/Railway com sleep de 15 min
 */

require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const API_URL = `http://localhost:${process.env.PORT || 3000}`;
const KEEP_ALIVE_INTERVAL = (process.env.KEEP_ALIVE_INTERVAL || 5) * 60 * 1000; // Convert minutos para ms
const CACHE_WARMING_INTERVAL = (process.env.CACHE_WARMING_INTERVAL || 60) * 60 * 1000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ping() {
  try {
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    console.log(`✅ [${new Date().toISOString()}] Keep-alive ping OK - DB: ${response.data.status}`);
    return true;
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Keep-alive ping FALHOU:`, error.message);
    return false;
  }
}

async function warmCache() {
  try {
    const response = await axios.post(`${API_URL}/api/atualizar-cache`, {}, { timeout: 30000 });
    console.log(`🔄 [${new Date().toISOString()}] Cache warming: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Cache warming FALHOU:`, error.message);
    return false;
  }
}

async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`💾 [${new Date().toISOString()}] Database OK - ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Database ERROR:`, error.message);
    return false;
  }
}

async function runHealthCheck() {
  console.log('\n📋 ========== HEALTH CHECK ==========');
  const dbOk = await checkDatabaseConnection();
  const pingOk = await ping();

  if (pingOk) {
    console.log('✅ API Status: HEALTHY');
  } else {
    console.log('⚠️ API Status: UNREACHABLE (verifique se server.js está rodando)');
  }
  console.log('=====================================\n');
}

// Iniciar keep-alive
console.log('🚀 Keep-Alive Service iniciado');
console.log(`⏱️  Ping a cada ${KEEP_ALIVE_INTERVAL / 1000 / 60} minutos`);
console.log(`🔄 Cache warming a cada ${CACHE_WARMING_INTERVAL / 1000 / 60} minutos`);

// Ping a cada 5 minutos
setInterval(ping, KEEP_ALIVE_INTERVAL);

// Cache warming a cada hora
setInterval(warmCache, CACHE_WARMING_INTERVAL);

// Health check ao iniciar
setTimeout(() => {
  runHealthCheck();
}, 1000);

// Health check periódica (a cada 30 min)
setInterval(runHealthCheck, 30 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Keep-Alive Service encerrando...');
  pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⛔ Keep-Alive Service interrompido');
  pool.end();
  process.exit(0);
});

// Manter processo vivo
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});
