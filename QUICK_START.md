# ⚡ Quick Start - Deploy em 10 Minutos

Seu projeto está **100% pronto**. Agora é só fazer 3 passos:

## Passo 1️⃣ : Push para GitHub (3 min)

```bash
# Se ainda não fez push do commit anterior
cd /home/user/my-project
git push -u origin claude/eager-wozniak-8858kl
```

**Nota:** Se der erro de acesso GitHub, reconecte em:
https://claude.ai/customize/connectors?auth_start=github&auth_start_force=1

## Passo 2️⃣ : Deploy no Render (4 min)

1. Acesse: https://render.com
2. Sign in com GitHub
3. Clique: **New +** → **Web Service**
4. Selecione seu repo: `my-project`
5. Branch: `claude/eager-wozniak-8858kl`
6. Preencha:
   ```
   Name: enem-api
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
7. Clique: **Add Environment Variable**
   ```
   DATABASE_URL = (copie sua connection string do Neon)
   NODE_ENV = production
   ```
8. Clique: **Create Web Service**

Render vai fazer auto-deploy. Aguarde 3-5 min até aparecer: `https://enem-api.onrender.com`

## Passo 3️⃣ : Ativar Keep-Alive (3 min)

### Opção A: UptimeRobot (simples)
1. Acesse: https://uptimerobot.com
2. Sign up
3. New Monitor:
   - URL: `https://enem-api.onrender.com/api/health`
   - Interval: 5 minutes
4. Save

### Opção B: GitHub Actions (automático)
Já está no seu repo em `.github/workflows/keep-alive.yml`. Só precisa:
1. Settings → Actions → Allow all actions
2. Pronto! Vai fazer ping automático.

---

## ✅ Pronto!

Quando completar os 3 passos:
- ✅ API rodando em https://enem-api.onrender.com
- ✅ Database Neon conectado
- ✅ Keep-alive ativo
- ✅ Cache automático

Teste:
```bash
curl https://enem-api.onrender.com/api/health
# {"status":"ok","timestamp":"..."}
```

---

## 📚 Próximos Passos Opcionais

- [ ] Integrar frontend (`FRONTEND_INTEGRATION.md`)
- [ ] Monitorar logs em tempo real (Render Dashboard)
- [ ] Verificar cache: `POST /api/atualizar-cache`

---

**Dúvidas?** Consulte os 4 guias:
- `README.md` - Overview
- `NEON_SETUP.md` - Detalhes Neon
- `DEPLOYMENT_CHECKLIST.md` - Checklist completo
- `FRONTEND_INTEGRATION.md` - Integrar JS

🚀 **Boa sorte!**
