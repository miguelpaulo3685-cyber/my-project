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
| `BREVO_API_KEY` | Envio dos e-mails de confirmação e de "Esqueci minha senha" pela API do Brevo (HTTPS). Tem prioridade sobre o SMTP, que o plano grátis do Render bloqueia |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Alternativa ao Brevo: envio por SMTP (Gmail com senha de app, Resend etc.) |
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

## Dificuldade das questões (TRI)

A pasta `TRI/` tem os arquivos `ITENS_PROVA_<ano>.csv` dos microdados do ENEM (INEP), com os
parâmetros da TRI de cada item. A cada início do servidor, `tri.js` casa cada questão do banco
com o item do INEP: para cada ano e área, escolhe o caderno cuja sequência de gabaritos mais
concorda com a nossa (mínimo de 70%) e confere o gabarito questão por questão. O nível
(1 a 4) sai da dificuldade B, comparada às outras questões do ENEM na mesma área. Questão sem
casamento usa o nível medido pelas respostas dos alunos.

O relatório fica no log do Render (linhas com 📐) e o total em `GET /api/estatisticas` (`com_tri`).
Para refazer na hora: `POST /api/admin/tri` com o cabeçalho `X-Admin-Key`.

A nota do aluno (`POST /api/tri`) usa o modelo de 3 parâmetros e a estimativa EAP do ENEM
(nota = 500 + 100 × theta, referência normal(0,1)), com a primeira resposta de cada questão que
tenha TRI. Aparece a partir de 5 questões na área. Com conta, lê as respostas do banco; sem conta,
o navegador manda a lista que guardou.

## Proteções

- Senhas e tokens de sessão guardados só como hash
- Limites por IP: 300 pedidos/min na API, 20 cadastros/hora, 120 respostas/min, 10 posts a cada 10 min por conta e 5 tentativas de senha a cada 15 min
- CORS restrito às origens permitidas
- O servidor só entrega as páginas do site, nunca os arquivos do código
