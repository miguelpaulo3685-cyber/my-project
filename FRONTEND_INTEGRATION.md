# 🎨 Integração Frontend com Backend Neon

Guia passo-a-passo para conectar seu `scripts.js` ao novo backend com Neon.

## 1. Adicionar Base URL da API

No início do `scripts.js`, adicione:

```javascript
// 🌐 API Configuration
const API_CONFIG = {
  // Desenvolvimento local
  // BASE_URL: 'http://localhost:3000',
  
  // Produção (Render)
  BASE_URL: 'https://enem-api-cbo6.onrender.com',
  
  // Timeout para requisições
  TIMEOUT: 10000
};

// Função helper para fazer requisições
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const defaultOptions = {
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
}
```

## 2. Atualizar `verificarEAtualizarCache`

Substitua a função existente por:

```javascript
async function verificarEAtualizarCache(forcaAtualizacao = false) {
  try {
    // Verificar status da API
    const health = await fetchAPI('/api/health');
    document.getElementById('statusApi').innerHTML = 
      `<span style="color: var(--cor-destaque);">✅ API Online</span>`;
    
    // Se forçar atualização, chamar endpoint
    if (forcaAtualizacao) {
      console.log('🔄 Atualizando cache da API...');
      const result = await fetchAPI('/api/atualizar-cache', { method: 'POST' });
      alert(`✅ ${result.message}`);
    }
  } catch (error) {
    console.warn('⚠️ API offline, usando cache local');
    document.getElementById('statusApi').innerHTML = 
      `<span style="color: var(--cor-aviso);">📡 Usando cache local</span>`;
  }
}
```

## 3. Integrar Questões da API

Substitua a função `atualizarAreasGrid`:

```javascript
async function atualizarAreasGrid() {
  const areas = ['linguagens', 'humanas', 'natureza', 'matematica'];
  const areasContainer = document.getElementById('areasGrid');
  areasContainer.innerHTML = '';
  
  for (const area of areas) {
    const nomeArea = nomesAreas[area];
    
    const div = document.createElement('div');
    div.className = 'area-card';
    div.innerHTML = `
      <div class="area-icon">
        ${getAreaIcon(area)}
      </div>
      <h3>${nomeArea}</h3>
      <p class="area-questoes">Carregando...</p>
    `;
    div.onclick = () => iniciarQuizArea(area);
    
    // Carregar quantidade de questões disponíveis
    try {
      const data = await fetchAPI(`/api/questoes/${area}`);
      const count = data.questoes ? data.questoes.length : 0;
      div.querySelector('.area-questoes').textContent = 
        `${count} questões em cache`;
    } catch (err) {
      div.querySelector('.area-questoes').textContent = 
        `Offline (cache local)`;
    }
    
    areasContainer.appendChild(div);
  }
}

function getAreaIcon(area) {
  const icons = {
    linguagens: '📚',
    humanas: '🏛️',
    natureza: '🔬',
    matematica: '🔢'
  };
  return icons[area] || '⭐';
}
```

## 4. Buscar Questões do Backend

Adicione esta função:

```javascript
let questoesAtualAula = [];
let respostasAtuais = [];

async function obterQuestoesArea(area, quantidade = 5) {
  try {
    // Tentar buscar do servidor Neon
    const data = await fetchAPI(`/api/questoes/${area}`);
    
    if (data.questoes && data.questoes.length > 0) {
      // Converter formato do banco para o esperado pelo quiz
      return data.questoes.slice(0, quantidade).map(q => ({
        enunciado: q.titulo,
        imagem: q.imagem_url,
        alternativas: JSON.parse(typeof q.alternativas === 'string' 
          ? q.alternativas 
          : JSON.stringify(q.alternativas)),
        correta: q.correta,
        dificuldade: q.dificuldade || 1,
        explicacao: `Questão do ENEM ${q.ano}` // Melhorar depois
      }));
    }
  } catch (error) {
    console.warn(`Erro ao buscar ${area} do servidor:`, error);
  }
  
  // Fallback: usar banco de reserva local
  return bancoReserva[area]?.slice(0, quantidade) || [];
}

async function iniciarQuizArea(area) {
  questoesAtualAula = await obterQuestoesArea(area, 5);
  
  if (questoesAtualAula.length === 0) {
    alert('⚠️ Nenhuma questão disponível para esta área');
    return;
  }
  
  respostasAtuais = [];
  document.getElementById('telaAreas').classList.add('escondido');
  document.getElementById('telaQuiz').classList.remove('escondido');
  
  document.getElementById('quizAreaLabel').textContent = nomesAreas[area];
  document.getElementById('quizProgresso').textContent = `1/${questoesAtualAula.length}`;
  
  exibirQuestao(0);
}
```

## 5. Salvar Posts no Banco

Substitua `criarPost`:

```javascript
async function criarPost() {
  const texto = document.getElementById('textoPost').value.trim();
  if (!texto) {
    alert('Escreva algo antes de postar!');
    return;
  }
  
  try {
    // Enviar para servidor
    const resultado = await fetchAPI('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: 'miguel_lopes', // Pegar do perfil depois
        conteudo: texto
      })
    });
    
    console.log('✅ Post salvo:', resultado);
    document.getElementById('textoPost').value = '';
    
    // Recarregar feed
    carregarFeedDoBanco();
  } catch (error) {
    console.error('❌ Erro ao salvar post:', error);
    alert('Erro ao postar. Tente novamente.');
  }
}

async function carregarFeedDoBanco() {
  try {
    const data = await fetchAPI('/api/posts');
    const feedContainer = document.getElementById('feedContainer');
    feedContainer.innerHTML = '';
    
    if (data.posts && data.posts.length > 0) {
      data.posts.forEach(post => {
        const cardPost = document.createElement('div');
        cardPost.className = 'card-base card-post';
        cardPost.innerHTML = `
          <div class="post-header">
            <strong>${post.usuario_id}</strong>
            <small>${new Date(post.created_at).toLocaleDateString('pt-BR')}</small>
          </div>
          <p>${post.conteudo}</p>
          <div class="post-actions">
            <button class="btn-acao btn-pequeno">❤️ ${post.likes || 0}</button>
            <button class="btn-acao btn-pequeno">💬 Comentar</button>
          </div>
        `;
        feedContainer.appendChild(cardPost);
      });
    } else {
      feedContainer.innerHTML = '<p style="text-align: center; opacity: 0.6;">Nenhum post ainda</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar feed:', error);
    // Usar dados locais se falhar
    carregarPostsSalvos();
  }
}
```

## 6. Atualizar `window.onload`

```javascript
window.onload = async function() {
  console.log('🚀 Inicializando plataforma...');
  
  // Carregar dados locais primeiro
  carregarDadosPerfil();
  carregarCapasSalvas();
  
  // Tentar carregar do servidor
  verificarEAtualizarCache();
  atualizarAreasGrid();
  await carregarFeedDoBanco();
  
  console.log('✅ Plataforma carregada');
};
```

## 7. Tratamento de Erros

Adicione fallback para quando servidor estiver offline:

```javascript
async function fetchAPIComFallback(endpoint, localData, options = {}) {
  try {
    return await fetchAPI(endpoint, options);
  } catch (error) {
    console.warn(`⚠️ Usando dados locais para ${endpoint}`);
    return localData;
  }
}
```

## 8. Adicionar CSS para Status

No `styles.css`, adicione:

```css
.status-api-online {
  color: var(--cor-sucesso, #4caf50);
  font-weight: bold;
}

.status-api-offline {
  color: var(--cor-aviso, #ff9800);
  font-weight: bold;
}

.loading {
  opacity: 0.6;
  pointer-events: none;
}

.sync-indicator {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## 9. Testing

Adicione ao console do browser para testar:

```javascript
// Testar conexão
await fetchAPI('/api/health')

// Testar questões
await fetchAPI('/api/questoes/linguagens')

// Testar criar post
await fetchAPI('/api/posts', {
  method: 'POST',
  body: JSON.stringify({
    usuario_id: 'teste',
    conteudo: 'teste'
  })
})
```

## 10. Checklist

- [ ] Adicionar `API_CONFIG` no início de `scripts.js`
- [ ] Criar função `fetchAPI` helper
- [ ] Atualizar `verificarEAtualizarCache`
- [ ] Atualizar `atualizarAreasGrid`
- [ ] Criar `obterQuestoesArea`
- [ ] Criar `iniciarQuizArea`
- [ ] Atualizar `criarPost`
- [ ] Criar `carregarFeedDoBanco`
- [ ] Atualizar `window.onload`
- [ ] Testar no console do browser
- [ ] Deploy e verificar em produção

---

Após essas mudanças, seu frontend estará totalmente integrado com o backend Neon! 🎉

**Próximo passo**: Fazer commit e fazer deploy para Render.
