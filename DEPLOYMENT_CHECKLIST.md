# ✅ Checklist de Deployment - API ENEM Sempre Rodando

## Fase 1: Preparação Local (15 min) ⚡

- [ ] **Clonar/configurar repo**
  ```bash
  git clone <repo-url>
  cd my-project
  ```

- [ ] **Instalar dependências**
  ```bash
  npm install
  ```

- [ ] **Copiar variáveis de ambiente**
  ```bash
  cp .env.example .env
  ```

- [ ] **Criar projeto Neon** (console.neon.tech)
  - Nome: `enem-study-platform`
  - Região: `us-east-1`
  - PostgreSQL: `15`

- [ ] **Pegar connection string do Neon**
  ```
  postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
  ```

- [ ] **Colar em `.env`**
  ```
  DATABASE_URL=<sua connection string>
  PORT=3000
  NODE_ENV=development
  ```

- [ ] **Testar localmente**
  ```bash
  npm run dev
  ```
  Acessar: `http://localhost:3000`

- [ ] **Rodar migrations**
  ```bash
  npm run migrate
  ```
  ✅ Verificar: tabelas criadas no Neon Console

- [ ] **Testar endpoints**
  ```bash
  # Em outro terminal
  npm test test-api.js
  ```
  ✅ Todos os 5 testes devem passar

## Fase 2: Setup Neon (10 min) 🗄️

- [ ] **Acessar Neon Console**
  - Link: https://console.neon.tech

- [ ] **Verificar tabelas criadas**
  - SQL Editor → SELECT * FROM questoes;
  - Deve haver 0 linhas (preenchidas após primeiro load)

- [ ] **Verificar connection limits**
  - Branch Settings → Max Connections: 20 (OK para free tier)

- [ ] **Ativar auto-suspend**
  - Project Settings → Auto-suspend: OFF
  - (Manter sempre rodando)

- [ ] **Backup automático**
  - Deve estar ativo por padrão
  - Verificar em: Project Settings → Backups

## Fase 3: Deploy Render (10 min) 🚀

- [ ] **Preparar GitHub**
  ```bash
  git add .
  git commit -m "feat: setup backend com Neon + keep-alive"
  git push origin claude/eager-wozniak-8858kl
  ```

- [ ] **Criar repo público** (se necessário)

- [ ] **Acessar render.com**
  - Login com GitHub
  - New → Web Service

- [ ] **Conectar GitHub**
  - Selecionar repo
  - Branch: `claude/eager-wozniak-8858kl`

- [ ] **Configurar build**
  - Runtime: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Plan: `Free`

- [ ] **Adicionar Environment Variables** (do Neon)
  ```
  DATABASE_URL = postgresql://...neon.tech/...
  NODE_ENV = production
  PORT = 10000
  KEEP_ALIVE_INTERVAL = 5
  CACHE_WARMING_INTERVAL = 60
  ```

- [ ] **Deploy**
  - Clicar em "Create Web Service"
  - Aguardar build (2-3 min)

- [ ] **Verificar URL**
  - Deve aparecer: `https://enem-api.onrender.com`
  - Acessar: `https://enem-api.onrender.com/api/health`
  - Deve retornar: `{"status":"ok","timestamp":"..."}`

## Fase 4: Keep-Alive Setup (15 min) 💓

### Opção A: UptimeRobot (Simples ⭐)

- [ ] **Criar conta UptimeRobot**
  - Link: https://uptimerobot.com
  - Sign up com email

- [ ] **Criar novo monitor**
  - Monitor Type: `HTTP(s)`
  - URL: `https://enem-api.onrender.com/api/health`
  - Monitoring Interval: `5 minutes`
  - Alert Contacts: seu email (opcional)

- [ ] **Ativar**
  - Status deve aparecer como: `Up`
  - Aguardar primeiro ping (até 5 min)

### Opção B: GitHub Actions (Automático)

- [ ] **Verificar workflow**
  - Arquivo: `.github/workflows/keep-alive.yml`
  - Deve estar no repo

- [ ] **Ativar GitHub Actions**
  - Settings → Actions → Allow all actions

- [ ] **Testar manualmente**
  - Actions tab → "Keep-Alive API" → Run workflow

- [ ] **Verificar execução**
  - Logs devem mostrar `✅ API está saudável`

### Opção C: Both (Recomendado) ⭐⭐

- [ ] **Ativar UptimeRobot** (keep-alive principal)
- [ ] **Ativar GitHub Actions** (backup)

## Fase 5: Integração Frontend (20 min) 🎨

- [ ] **Atualizar `scripts.js`**
  - Seguir guia em: `FRONTEND_INTEGRATION.md`
  - Adicionar `API_CONFIG`
  - Adicionar `fetchAPI` helper
  - Atualizar 4 funções principais

- [ ] **Testar localmente**
  ```bash
  npm run dev
  # Acessar http://localhost:3000
  # Testar: Posts, Questões, Perfil
  ```

- [ ] **Commit mudanças**
  ```bash
  git add scripts.js
  git commit -m "feat: integrar frontend com API Neon"
  git push
  ```

- [ ] **Verificar deploy no Render**
  - Render deve fazer auto-deploy
  - Aguardar build completo

- [ ] **Testar em produção**
  - Abrir: `https://enem-api.onrender.com`
  - Testar: Feed, Questões, Cache

## Fase 6: Monitoring (5 min) 📊

- [ ] **Dashboard Neon**
  - Console → Project → Monitoring
  - Verificar: Conexões ativas, queries

- [ ] **Dashboard Render**
  - https://dashboard.render.com
  - Logs → Verificar: Keep-alive pings, cache updates

- [ ] **UptimeRobot Dashboard** (se usou)
  - Verificar: Status `Up`, últimos pings OK

- [ ] **Status Page** (opcional)
  - Criar status page pública em Render
  - Compartilhar com amigos que testam

## Fase 7: Validação Final (10 min) 🎯

### Health Checks

- [ ] **API Online**
  ```bash
  curl https://enem-api.onrender.com/api/health
  # {"status":"ok",...}
  ```

- [ ] **Banco conectado**
  - Neon Console → SQL Editor
  - SELECT COUNT(*) FROM questoes;

- [ ] **Cache warming**
  - POST `https://enem-api.onrender.com/api/atualizar-cache`
  - Deve retornar: `"message":"Cache atualizado com X questões"`

- [ ] **Feed funcionando**
  - GET `https://enem-api.onrender.com/api/posts`
  - Deve retornar array de posts

- [ ] **Questões disponíveis**
  - GET `https://enem-api.onrender.com/api/questoes/linguagens`
  - Deve retornar questões em cache

### Browser Tests

- [ ] **Abrir app no browser**
  - URL: `https://enem-api.onrender.com`

- [ ] **Aba Feed**
  - [ ] Posts carregam do banco
  - [ ] Criar novo post funciona
  - [ ] Dados salvam no Neon

- [ ] **Aba Questões**
  - [ ] Áreas aparecem
  - [ ] Questões aparecem
  - [ ] Quiz funciona
  - [ ] Botão "Atualizar cache" funciona

- [ ] **Aba Perfil**
  - [ ] Dados carreg do storage local
  - [ ] Editar perfil funciona
  - [ ] Avatar salva

- [ ] **Offline mode**
  - F12 → Network → Offline
  - App deve usar fallback local
  - Feed offline

## Fase 8: Documentação (5 min) 📚

- [ ] **README.md**
  - [ ] Link para produção
  - [ ] Como rodar localmente

- [ ] **NEON_SETUP.md**
  - [ ] Seu connection string (já salvo?)
  - [ ] Passos completados

- [ ] **.env**
  - [ ] Nunca fazer commit!
  - [ ] Verificar: `.env` em `.gitignore`

- [ ] **Seção de Troubleshooting**
  - [ ] Adicionar problemas encontrados

## Fase 9: Performance Tuning (Opcional) ⚡

- [ ] **Índices no Neon**
  - Já criados em migrations
  - Verificar em: Schema → Indexes

- [ ] **Connection pooling**
  - Atual: max: 20 (OK)
  - Se tiver muitos users: reduzir para 10

- [ ] **Cache TTL**
  - Atual: 7 dias
  - Ajustar em `.env`: `CACHE_VALIDITY_DAYS`

- [ ] **Cron schedule**
  - Atual: a cada 1 hora
  - Modificar em `server.js` se necessário

## Fase 10: Troubleshooting 🔧

### Se API cair do Render

1. [ ] Verificar Render Logs
2. [ ] Verificar Neon status
3. [ ] Aumentar keep-alive interval
4. [ ] Verificar DATABASE_URL em Render

### Se questões não aparecem

1. [ ] Rodar: POST `/api/atualizar-cache`
2. [ ] Verificar: `SELECT * FROM questoes;` no Neon
3. [ ] Verificar API do ENEM: https://api.enem.dev

### Se posts não salvam

1. [ ] Verificar connection em Neon
2. [ ] Verificar erro em Render Logs
3. [ ] Testar diretamente: POST `/api/posts`

### Se keep-alive falha

1. [ ] Verificar UptimeRobot logs
2. [ ] Verificar GitHub Actions logs
3. [ ] URL deve estar acessível publicamente

## Resumo Final ✨

| Etapa | Status | Tempo |
|-------|--------|-------|
| Fase 1: Prep Local | ⏳ | 15 min |
| Fase 2: Setup Neon | ⏳ | 10 min |
| Fase 3: Deploy Render | ⏳ | 10 min |
| Fase 4: Keep-Alive | ⏳ | 15 min |
| Fase 5: Frontend | ⏳ | 20 min |
| Fase 6: Monitoring | ⏳ | 5 min |
| Fase 7: Validação | ⏳ | 10 min |
| Fase 8: Docs | ⏳ | 5 min |
| **TOTAL** | **⏳** | **~90 min** |

## 🎉 Pronto!

Quando todos os itens estiverem marcados:
- ✅ API rodando 24/7
- ✅ Banco de dados sempre acessível
- ✅ Cache automático atualizado
- ✅ Keep-alive ativo
- ✅ Frontend integrado
- ✅ Monitoramento em tempo real

**Sua plataforma ENEM está ao vivo!** 🚀

---

**Dúvidas?** Consulte:
- `README.md` - Overview
- `NEON_SETUP.md` - Detalhes Neon
- `FRONTEND_INTEGRATION.md` - Integração JS
- Issues do GitHub

**Suporte 24/7:**
- Neon Status: https://status.neon.tech
- Render Status: https://status.render.com
