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
npm run dev            # o mesmo, reiniciando sozinho a cada mudança no código
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
| `GOOGLE_CLIENT_ID` | Opcional. Liga o botão "Continuar com o Google" na tela de entrada. Sem ela, o botão não aparece |
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
| `POST /api/auth/google` (cria a conta na primeira vez) | livre |
| `GET /api/config` (client ID do Google, que é público) | livre |
| `POST /api/auth/reenviar-confirmacao` | login |
| `GET /api/meu-progresso` | login |
| `DELETE /api/conta` (pede a senha; conta do Google sem senha pede o e-mail) | login |
| `GET /api/posts` / `POST /api/posts` | livre / login |
| `DELETE /api/posts/:id` | autor do post ou administrador |
| `POST /api/posts/:id/denunciar` | login (com 3 pessoas diferentes, o post sai do ar) |
| `POST /api/posts/:id/restaurar` | administrador |
| `GET /api/perfil/:id` | livre (perfil, números e publicações) |
| `PUT /api/perfil` (bio e foto) | login |
| `POST /api/publicacoes`, `PUT` e `DELETE /api/publicacoes/:id` | login (só o autor edita; autor ou administrador apaga) |
| `POST /api/publicacoes/:id/denunciar` / `restaurar` | login / administrador |
| `GET /api/imagens/:id` | livre (fotos do perfil e capas) |
| `POST /api/carregar-ano/:ano`, `POST /api/atualizar-cache` | cabeçalho `X-Admin-Key` |

Exemplo de carga de um ano inteiro:

```bash
curl -X POST -H "X-Admin-Key: $ADMIN_KEY" https://enem-api-cbo6.onrender.com/api/carregar-ano/2023
```

## Dificuldade das questões (TRI)

A pasta `TRI/` tem os arquivos `ITENS_PROVA_<ano>.csv` dos microdados do ENEM (INEP), com os
parâmetros da TRI de cada item. A cada início do servidor, o número de cada questão é lido do
título ("Questão 101 - ENEM 2015") e `tri.js` casa as questões com os itens do INEP. Como cada ano
numera de um jeito (ordem das áreas, numeração por área em 2017, espanhol em posições próprias) e
a api.enem.dev às vezes põe a questão na área errada, o casamento testa cada caderno do INEP com
cada deslocamento de numeração e fica com os pares em que os gabaritos concordam (mínimo de 70% e
5 acertos), conferindo questão por questão. A área passa a ser a do caderno do INEP; a original
fica em `disciplina_api`. O nível (1 a 4) sai da dificuldade B, comparada às outras questões do
ENEM na mesma área. Questão sem casamento usa o nível medido pelas respostas dos alunos.

O relatório fica no log do Render (linhas com 📐) e o total em `GET /api/estatisticas` (`com_tri`).
Para refazer na hora: `POST /api/admin/tri` com o cabeçalho `X-Admin-Key`.

A nota do aluno (`POST /api/tri`) usa o modelo de 3 parâmetros e a estimativa EAP do ENEM
(nota = 500 + 100 × theta, referência normal(0,1)), com a primeira resposta de cada questão que
tenha TRI. Aparece a partir de 5 questões na área. Com conta, lê as respostas do banco; sem conta,
o navegador manda a lista que guardou.

## Entrar com Google

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto e configure a
   "Tela de consentimento OAuth" (tipo Externo, nome M&M Estudos, e-mail de contato).
2. Em Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web, coloque em
   "Origens JavaScript autorizadas": `https://miguelpaulo3685-cyber.github.io` (e
   `http://localhost:3000` para testar).
3. Copie o ID do cliente (termina em `.apps.googleusercontent.com`) para a variável
   `GOOGLE_CLIENT_ID` no Render. Não é preciso a "chave secreta do cliente".

O servidor confere cada login com o Google (assinatura, site de destino, validade e e-mail
verificado). Conta criada pelo Google não tem senha; se a pessoa quiser uma, usa "Esqueci minha senha".

## Moderação do feed

Administradores veem os posts escondidos por denúncia e podem apagar ou restaurar qualquer post.
Para tornar alguém administrador, no SQL Editor do Neon:

```sql
UPDATE usuarios SET admin = TRUE WHERE email = 'email@da.pessoa';
```

## Perfil e galeria

Cada aluno tem um perfil com foto, bio, números de estudo e publicações em galeria (cartões com
capa opcional, que dá para arrastar para escolher a parte que aparece, como no Notion). As fotos
ficam na tabela `imagens` (até 450 KB cada, só JPEG): o navegador reduz a foto antes de enviar e o
servidor (`imagens.js`) confere o formato e tira os metadados EXIF, que podem ter a localização.
Cada pessoa pode ter até 60 publicações, para caber no plano grátis do Neon. Publicações seguem as
mesmas regras de denúncia do feed.

## Proteções

- Senhas guardadas só como hash scrypt com sal; tokens de sessão e de e-mail guardados só como hash
- Login com tempo de resposta igual para e-mail existente ou não (não revela quem tem conta)
- Limites por IP: 300 pedidos/min na API, 20 cadastros/hora, 120 respostas/min, 10 posts a cada 10 min por conta e 5 tentativas de senha a cada 15 min
- Tamanho máximo de e-mail (254), senha (128) e corpo de requisição (20 KB)
- CORS restrito às origens permitidas; rotas de administração exigem `X-Admin-Key`
- Cabeçalhos de segurança no servidor (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy) e CSP nas páginas do GitHub Pages
- Respostas da API com `Cache-Control: no-store`
- O servidor só entrega as páginas do site, nunca os arquivos do código
- Consultas ao banco sempre parametrizadas; texto vindo de usuários sempre escapado antes de ir para a tela

## Testes

```bash
npm test
```

Testam senhas, limites, validação de e-mail, casamento com o INEP, a nota TRI e a limpeza das fotos. Rodam também no
GitHub a cada push (`.github/workflows/testes.yml`), junto com `npm audit` nas dependências.
O `package-lock.json` fica no repositório para o Render instalar sempre as mesmas versões.
