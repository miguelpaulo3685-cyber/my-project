# 📚 Plataforma de Estudos ENEM com Neon + Render

Uma plataforma web para estudar ENEM com questões reais, feed social, perfil e cache inteligente via **Neon PostgreSQL**.

## 🎯 Objetivo

Manter a API sempre rodando (24/7) sem deixar cair, utilizando:
- **Neon Console**: PostgreSQL serverless para cache de questões
- **Render**: Deploy grátis com keep-alive automático
- **GitHub Actions**: Monitoramento e warm-up periódico
- **UptimeRobot**: Ping externo (evita sleep do Render)

## 🚀 Quick Start

### 1. Clone e configure localmente

```bash
# Clonar repo
git clone <seu-repo>
cd my-project

# Instalar dependências
npm install

# Copiar env
cp .env.example .env

# Editar .env com credentials do Neon
# DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
```

### 2. Rodar migrations

```bash
npm run migrate
```

### 3. Iniciar servidor local

```bash
npm run dev
```

Acesse em `http://localhost:3000`

## 📊 Endpoints da API

```bash
# Health check
GET /api/health

# Buscar questões em cache (por área)
GET /api/questoes/:area
# areas: linguagens, humanas, natureza, matematica

# Atualizar cache da API do ENEM
POST /api/atualizar-cache

# Salvar novo post do feed
POST /api/posts
# { usuario_id: "xyz", conteudo: "texto" }

# Listar posts
GET /api/posts
```

## 🌐 Deploy no Render (Grátis!)

### Pré-requisitos
- ✅ Projeto no GitHub
- ✅ Banco Neon criado (veja `NEON_SETUP.md`)
- ✅ Connection string do Neon

### Deploy

1. Ir para https://render.com
2. Sign in com GitHub
3. New Web Service
4. Conectar este repositório
5. Configurar:
   ```
   Build Command: npm install
   Start Command: npm start
   Environment Variables:
     DATABASE_URL=<de Neon>
     NODE_ENV=production
   ```
6. Deploy! 🎉

### Acesso
```
https://enem-api-cbo6.onrender.com/api/health
```

## 💓 Keep-Alive Automático

Sem isso, Render coloca a app em sleep após 15 min de inatividade.

### Opção 1: UptimeRobot (Recomendado)
1. Ir para https://uptimerobot.com
2. New Monitor
3. URL: `https://enem-api-cbo6.onrender.com/api/health`
4. Intervalo: 5 minutos
5. Ativo! ✅

### Opção 2: GitHub Actions
- Já incluído em `.github/workflows/keep-alive.yml`
- Executa a cada 5 minutos automaticamente

## 📁 Estrutura

```
my-project/
├── server.js              # Servidor Express
├── scripts.js             # Frontend JavaScript
├── index.html             # HTML da app
├── styles.css             # CSS
├── package.json
├── .env.example
├── Dockerfile
├── render.yaml
├── NEON_SETUP.md          # Guia Neon em detalhes
├── migrations/
│   └── init.js            # Script de setup do banco
├── services/
│   └── keep-alive.js      # Serviço de keep-alive
└── .github/workflows/
    └── keep-alive.yml     # Workflow GitHub Actions
```

## 🔧 Configuração Neon

Veja [NEON_SETUP.md](./NEON_SETUP.md) para guia passo-a-passo:
1. Criar projeto em console.neon.tech
2. Copiar connection string
3. Colar em `.env`
4. Rodar `npm run migrate`

## 🔄 Dados & Cache

- **Banco de dados**: Questões reais do ENEM (2009-2023) via API pública
- **Cache**: Armazenado no Neon por 7 dias
- **Atualização**: Automática a cada hora (via cron job)
- **Fallback**: Banco local de reserva se API cair

## 📈 Monitoramento

### Logs em tempo real
```bash
# Local
npm run dev

# Render Dashboard
https://dashboard.render.com → Service Logs

# GitHub Actions
https://github.com/user/repo/actions
```

### Health Check
```bash
curl https://enem-api-cbo6.onrender.com/api/health
# {"status": "ok", "timestamp": "2024-09-16T..."}
```

## 🛠️ Troubleshooting

| Erro | Causa | Solução |
|------|-------|--------|
| `Connection refused` | DATABASE_URL inválida | Copiar novamente de neon.tech |
| `Timeout no health check` | API em sleep | Ativar UptimeRobot |
| `Too many connections` | Pool cheio | Reduzir max (20 → 10) |
| Questões não aparecem | Cache vazio | Manual: `POST /api/atualizar-cache` |

## 📚 Tecnologias

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon)
- **Deploy**: Render, GitHub Actions
- **Monitoring**: UptimeRobot, Neon Console
- **API**: api.enem.dev (questões reais)

## 💰 Custos

| Serviço | Plano | Custo |
|---------|-------|-------|
| Neon | Free (3GB) | **R$ 0** |
| Render | Free (750h/mês) | **R$ 0** |
| GitHub Actions | Free (2000 min/mês) | **R$ 0** |
| UptimeRobot | Free (50 monitores) | **R$ 0** |
| **Total** | | **R$ 0** 🎉 |

## 📖 Documentação

- [Neon Docs](https://neon.tech/docs)
- [Render Docs](https://render.com/docs)
- [Express.js](https://expressjs.com)
- [PostgreSQL](https://www.postgresql.org/docs/)

## 🤝 Contribuindo

Sugestões? Issues? Pull requests são bem-vindos!

## 📄 Licença

MIT

---

**Feito com ❤️ para estudar ENEM**

Dúvidas? Abra uma issue! 🚀
