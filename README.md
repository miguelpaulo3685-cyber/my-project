# M&M Estudos

Plataforma gratuita para treinar com questões reais do ENEM (2009–2023), com contas,
progresso salvo na conta, nível de dificuldade medido pelas respostas e um feed de estudos.

- **Site:** `index.html`, publicado pelo GitHub Pages a partir da branch `master`
- **API:** `server.js` (Node/Express), no Render: https://enem-api-cbo6.onrender.com
- **Banco:** PostgreSQL no Neon
- **Questões:** api.enem.dev

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL (e ADMIN_KEY, se for carregar questões)
npm start              # roda as migrações e sobe o servidor em http://localhost:3000
```

`npm start` sempre roda `migrations/init.js` antes do servidor. As migrações só criam o que
falta (`IF NOT EXISTS`), então rodar de novo é seguro, e o banco de produção nunca fica sem
uma tabela ou coluna que o código espera.

## Variáveis de ambiente

| Nome | Para quê |
|---|---|
| `DATABASE_URL` | Conexão com o Neon |
| `ENEM_API_BASE` | `https://api.enem.dev` |
| `ADMIN_KEY` | Libera as rotas de administração. Sem ela, essas rotas ficam desligadas |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envio dos e-mails de confirmação e de "Esqueci minha senha". Hoje é o Gmail, com senha de app |
| `EMAIL_REMETENTE` | Opcional. Nome e endereço que aparecem como remetente |
| `SITE_URL` | Endereço do site, usado nos links dos e-mails |
| `ORIGENS_PERMITIDAS` | Sites que podem chamar a API pelo navegador, separados por vírgula. Padrão: GitHub Pages do projeto e localhost |

## Rotas da API

| Rota | Acesso |
|---|---|
| `GET /api/health` | livre |
| `GET /api/questoes/:area` (`linguagens`, `humanas`, `natureza`, `matematica`) | livre |
| `GET /api/estatisticas` | livre |
| `POST /api/responder` | livre (com login, conta no progresso) |
| `POST /api/auth/registrar`, `POST /api/auth/login`, `POST /api/auth/sair`, `GET /api/auth/eu` | livre |
| `POST /api/auth/esqueci`, `POST /api/auth/redefinir`, `POST /api/auth/confirmar` | livre |
| `POST /api/auth/reenviar-confirmacao` | login |
| `GET /api/meu-progresso` | login |
| `DELETE /api/conta` (pede a senha) | login |
| `GET /api/posts` / `POST /api/posts` | livre / login |
| `POST /api/carregar-ano/:ano`, `POST /api/atualizar-cache` | cabeçalho `X-Admin-Key` |

Exemplo de carga de um ano inteiro:

```bash
curl -X POST -H "X-Admin-Key: $ADMIN_KEY" https://enem-api-cbo6.onrender.com/api/carregar-ano/2023
```

## Proteções

- Senhas e tokens de sessão guardados só como hash
- Limites por IP: 300 pedidos/min na API, 20 cadastros/hora, 120 respostas/min, 10 posts a cada 10 min por conta e 5 tentativas de senha a cada 15 min
- CORS restrito às origens permitidas
- O servidor só entrega as páginas do site, nunca os arquivos do código
