/**
 * Script de teste da API
 * Valida todos os endpoints antes do deploy
 *
 * Uso: node test-api.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, icon, message) {
  console.log(`${COLORS[color]}${icon} ${message}${COLORS.reset}`);
}

async function testEndpoint(method, path, data = null, expectedStatus = 200) {
  const url = `${API_URL}${path}`;
  const testName = `${method} ${path}`;

  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(url, { timeout: 5000 });
    } else if (method === 'POST') {
      response = await axios.post(url, data || {}, { timeout: 10000 });
    }

    if (response.status === expectedStatus) {
      log('green', '✅', `${testName} → ${response.status}`);
      return { passed: true, response };
    } else {
      log('yellow', '⚠️', `${testName} → ${response.status} (esperado ${expectedStatus})`);
      return { passed: false, response };
    }
  } catch (error) {
    if (error.response) {
      log('red', '❌', `${testName} → ${error.response.status} (${error.message})`);
    } else if (error.code === 'ECONNREFUSED') {
      log('red', '❌', `${testName} → Connection refused (server não rodando)`);
    } else {
      log('red', '❌', `${testName} → ${error.message}`);
    }
    return { passed: false, error };
  }
}

async function runTests() {
  console.log('\n');
  log('cyan', '🧪', `Testando API em ${API_URL}\n`);

  const results = [];

  // 1. Health Check
  log('blue', '📋', 'Teste 1: Health Check');
  results.push(await testEndpoint('GET', '/api/health', null, 200));

  // 2. Buscar questões
  log('blue', '📋', 'Teste 2: Buscar Questões (linguagens)');
  const questoesResult = await testEndpoint('GET', '/api/questoes/linguagens', null, 200);
  results.push(questoesResult);

  // 3. Atualizar cache
  log('blue', '📋', 'Teste 3: Atualizar Cache');
  results.push(await testEndpoint('POST', '/api/atualizar-cache', {}, 200));

  // 4. Criar post
  log('blue', '📋', 'Teste 4: Criar Post');
  results.push(await testEndpoint('POST', '/api/posts', {
    usuario_id: 'teste_user',
    conteudo: 'Este é um post de teste da API'
  }, 200));

  // 5. Listar posts
  log('blue', '📋', 'Teste 5: Listar Posts');
  results.push(await testEndpoint('GET', '/api/posts', null, 200));

  // Resultado final
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log('\n');
  log('cyan', '📊', `Resultado: ${passedTests}/${totalTests} testes passaram`);

  if (passedTests === totalTests) {
    log('green', '🎉', 'Todos os testes passaram! A API está pronta para deploy.');
    process.exit(0);
  } else {
    log('red', '⚠️', `${totalTests - passedTests} testes falharam.`);
    process.exit(1);
  }
}

// Aguardar 1s antes de iniciar (dar tempo para server)
setTimeout(runTests, 1000);
