# 🚀 Setup Neon Console para API ENEM Always-Running

## O que é Neon?
**Neon** é um PostgreSQL serverless na nuvem que oferece:
- ✅ Banco de dados PostgreSQL gerenciado
- ✅ Scales automático conforme uso
- ✅ Backups automáticos
- ✅ Console web intuitivo
- ✅ Plano free robusto para startups

## Passo 1: Criar projeto no Neon

### 1.1 Acessar console.neon.tech
- Ir para https://console.neon.tech
- Fazer signup com GitHub ou email
- Confirmar email

### 1.2 Criar novo projeto
```
1. Clique em "New Project"
2. Dê um nome: "enem-study-platform"
3. Escolha região: "us-east-1" (melhor latência para Brasil)
4. Selecione a versão PostgreSQL: 15 (mais recente)
5. Clique em "Create Project"
```

### 1.3 Copiar connection string
```
Console Neon → Project → Connection String

Você verá algo como:
postgresql://user:password@ep-aged-glance-12345.us-east-1.neon.tech/neondb?sslmode=require

Copie e guarde este link!
```

## Passo 2: Configurar variáveis de ambiente

### 2.1 No seu projeto local
```bash
cp .env.example .env
```

### 2.2 Editar .env
```bash
# Colar a connection string do Neon
DATABASE_URL=postgresql://user:password@ep-aged-glance-12345.us-east-1.neon.tech/neondb?sslmode=require

PORT=3000
NODE_ENV=development
KEEP_ALIVE_INTERVAL=5
CACHE_WARMING_INTERVAL=60
```

## Passo 3: Criar tabelas no Neon

### 3.1 Rodar migrations
```bash
npm install
npm run migrate
```

### 3.2 Verificar no console Neon
```
Console → SQL Editor → Execute query:
SELECT * FROM questoes;
```

## Passo 4: Deploy no Render (Grátis com keep-alive)

### 4.1 Preparar GitHub
```bash
git add .
git commit -m "Setup Neon + API com keep-alive"
git push origin claude/eager-wozniak-8858kl
```

### 4.2 Conectar ao Render
1. Ir para https://render.com
2. Sign in com GitHub
3. Clicar "New +" → "Web Service"
4. Conectar repositório
5. Preencher:
   - **Name**: `enem-api`
   - **Branch**: `claude/eager-wozniak-8858kl`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (permite 750 horas/mês = sempre rodando)

### 4.3 Adicionar variáveis de ambiente
No Render Dashboard:
```
DATABASE_URL = (colar da Neon)
NODE_ENV = production
PORT = 10000 (Render atribui automaticamente)
KEEP_ALIVE_INTERVAL = 5
CACHE_WARMING_INTERVAL = 60
```

### 4.4 Deploy automático
- Render deploy automático quando você faz push
- Acesse em: `https://enem-api-cbo6.onrender.com`

## Passo 5: Configurar keep-alive no Render

### 5.1 Usar UptimeRobot (grátis)
1. Ir para https://uptimerobot.com
2. Fazer signup
3. Criar novo monitor:
   - URL: `https://enem-api-cbo6.onrender.com/api/health`
   - Intervalo: `5 minutos`
   - Tipo: HTTP(s) GET

Isso faz o ping a cada 5 min e evita que o Render coloque a app em sleep.

### 5.2 Alternativa: Usar GitHub Actions (Workflow)
Criar arquivo `.github/workflows/keep-alive.yml`:
```yaml
name: Keep-Alive API

on:
  schedule:
    - cron: '*/5 * * * *'  # A cada 5 minutos

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Ping API
        run: |
          curl -f https://enem-api-cbo6.onrender.com/api/health || exit 1
```

## Passo 6: Integrar no frontend (scripts.js)

### 6.1 Trocar base URL
No seu `scripts.js`, adicione:

```javascript
// No início do arquivo, após as imports
const API_BASE = 'https://enem-api-cbo6.onrender.com';  // Mudar para sua URL

// Modificar função de atualizar cache
async function verificarEAtualizarCache(forcaAtualizacao = false) {
  try {
    const response = await fetch(`${API_BASE}/api/atualizar-cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('✅ Cache atualizado:', data.message);
  } catch (error) {
    console.error('Erro ao atualizar:', error);
  }
}

// Buscar questões da API em vez do localStorage
async function obterQuestoes(area) {
  try {
    const response = await fetch(`${API_BASE}/api/questoes/${area}`);
    const data = await response.json();
    return data.questoes.map(q => ({
      enunciado: q.titulo,
      alternativas: JSON.parse(q.alternativas),
      correta: q.correta,
      dificuldade: q.dificuldade,
      explicacao: 'Veja mais detalhes na plataforma'
    }));
  } catch (error) {
    console.error('Erro ao buscar questões:', error);
    return []; // Fallback para local
  }
}
```

## Passo 7: Monitorar saúde da API

### 7.1 Dashboard Neon
- Console → Database Name → "Monitoring"
- Veja: conexões, queries, performance

### 7.2 Logs do Render
- Ir para Render Dashboard
- Selecionar serviço → "Logs"
- Ver em tempo real todos os pings e updates

### 7.3 Status page (opcional)
Criar status page pública:
```
Render → Service → Environment → Add Status Page
```

## Troubleshooting

### ❌ "Connexão recusada"
```
Problema: DATABASE_URL incorreta
Solução: Copiar exatamente da Neon Console
```

### ❌ "Timeout na primeira requisição"
```
Problema: Neon está acordando a app (cold start)
Solução: Criar table com `CREATE INDEX` para aquecimento
```

### ❌ "Too many connections"
```
Problema: Pool de conexões cheio
Solução: Reduzir max connections em server.js (de 20 para 10)
```

### ❌ "API vai para sleep no Render"
```
Problema: Não há monitor de keep-alive ativo
Solução: Ativar UptimeRobot + GitHub Actions
```

## Checklist Final ✅

- [ ] Projeto criado no Neon Console
- [ ] Connection string guardada no .env
- [ ] Migrations rodadas com sucesso
- [ ] Projeto deployado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Keep-alive ativo (UptimeRobot ou GitHub Actions)
- [ ] Testado endpoint `/api/health`
- [ ] Frontend apontando para nova API
- [ ] Cache sendo atualizado automaticamente

## Custos (Free Tier)
- **Neon**: Grátis até 3GB data (suficiente para ENEM)
- **Render**: Grátis até 750h/mês (= 24/7 se só 1 serviço)
- **UptimeRobot**: Grátis (50 monitores)
- **GitHub Actions**: Grátis (2000 min/mês)

**Total: R$ 0,00** 🎉

---

📚 Documentação oficial:
- Neon: https://neon.tech/docs
- Render: https://render.com/docs
- PostgreSQL: https://www.postgresql.org/docs/
