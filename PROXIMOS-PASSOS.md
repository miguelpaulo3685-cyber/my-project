# Próximos passos — M&M Estudos

Arquivo de passagem entre conversas com o Claude. Numa conversa nova, comece com:
"leia o PROXIMOS-PASSOS.md e vamos continuar".

## O projeto

- Site de estudos para o ENEM, de Miguel e Matheus. Lançamento previsto para depois do ENEM 2026
  (divulgação forte de janeiro a março de 2027, para a turma do ENEM 2027).
- Site: https://miguelpaulo3685-cyber.github.io/my-project/ (GitHub Pages, arquivo `index.html`).
- API: Render (`server.js` e módulos: arena, provas, comunidade, avisos, desafio, tri, mensagens...).
  Banco: Neon (Postgres). As migrações (`migrations/init.js`) rodam sozinhas a cada início do servidor.
- Testes: `npm test`. O GitHub roda os testes a cada envio para o master.

## Regras combinadas

- Desenvolver num branch e **publicar no master só com o "sim" explícito** de Miguel ou Matheus.
- **Nunca** escrever segredos (chaves do Brevo/Resend, ADMIN_KEY, SEGREDO_IMAGENS, senhas) no
  repositório nem nas respostas: o repositório é público.
- Muitos usuários são **menores de idade**: recompensas só visuais; mensagens privadas com freios
  (padrão "só quem eu sigo", bloquear, denunciar, sem links, limites por dia); site a partir de 13 anos.
- Respostas em português, simples e diretas.

## O DIFERENCIAL (decidido em 28/10)

A conexão entre os alunos é o maior trunfo do site: "Instagram + ENEM com TRI". As pessoas devem se sentir
acolhidas e fazer amigos. Feito em 28/10 (acolhimento.js): escola no perfil e "colegas da sua escola",
"👋 Chegou agora" com boas-vindas de um toque (vira notificação), e "quem da sua escola/grupo estudou hoje"
no Treinar e no fim do bloco. Também (duplas.js): **dupla de estudo** (convidar pela Comunidade ou pelo perfil,
aceitar, painel com a meta/sequência/questões de hoje dos dois, "👊 Chamar pra estudar"; ao aceitar, os dois
passam a se seguir) e **🎉 Para comemorar** (conquistas de 48 h de quem você segue, da escola e da dupla:
sequência, primeira nota TRI ou recorde +15, Arena, desafio, dupla nova), com 👏/🔥 que avisa quem conquistou.
Em 28/10 também: "Ache a sua turma" logo depois de criar a conta (escola e curso, uma vez só), a entrada (PC e celular)
fala do diferencial ("Ninguém passa no ENEM sozinho") e a Comunidade ficou em duas partes: **Minha turma** (primeiros
passos, dupla, colegas com 🤝 para convidar) e **Hoje na comunidade** (metas, comemorar, quem chegou, feed); Reels no fim.
Saiu o quadro "Pessoas para seguir" (repetia colegas e quem chegou). Cuidado combinado: não encher o site de função.
A conexão não se limita à escola: 🔍 "Encontrar pessoas" no topo da Comunidade (busca pelo nome; sem nome, sugere
quem quer o mesmo curso e mora na mesma cidade/estado, de qualquer escola), cidade e estado opcionais no perfil, e o
"Para comemorar" inclui o grupo do curso. Três níveis: escola (quem você conhece), curso (quem quer o mesmo) e todos.

Os Reels voltaram para logo abaixo dos atalhos da Comunidade (mais à vista), sem tocar sozinhos ali.
As mudanças de 27 e 28/10 (teste 1, acolhimento, dupla, turma, busca de pessoas) foram pedidas e decididas pelo **Miguel**.

**Parada em 28/10.** Próximo passo combinado: lançar na escola antiga (todos no mesmo dia, com o mesmo nome de
escola) e medir quem volta em 7 dias e quem cria laço (dupla, seguir, boas-vindas). Antes de divulgar: Render pago.
Medir: quantos seguem alguém, entram num grupo ou dão/recebem boas-vindas na 1ª semana, e se esses voltam mais.

## FASE FINAL (decidido em 27/10): nada de função nova (exceção: o diferencial acima)

Só correção de erro, conteúdo e o que os testadores pedirem. Ordem:

1. **Teste com amigos (7 dias).** 5 a 10 pessoas, de preferência quem vai fazer o ENEM.
   Mandar o link com `?origem=teste` (aparece separado no painel de crescimento).
   Pedir que usem no celular e anotem tudo que der errado ou confundir. No fim, perguntar:
   - O que você mais usou? O que nunca abriu?
   - Teve alguma questão com texto, imagem ou gabarito errado? Qual (ano e número)?
   - Alguma coisa travou, demorou ou não funcionou? Em qual celular ou navegador?
   - Você usaria até o ENEM? Indicaria para um amigo? Por quê?
2. **Corrigir** o que aparecer. Mandar para o Claude os prints e os números das questões
   (o "Avisar erro" de cada questão e a lista de erros da Administração ajudam).
3. **Resoluções:** pegar Administração → Mais erradas e pedir ao Claude as resoluções dessas questões.
4. [x] **Revisão das alternativas em recorte de 2024 e 2025** (27/10): 92 questões passaram a ter alternativas em
   texto (tiradas do PDF pelo `extrair.py` ou digitadas das fórmulas); os recortes cortados foram corrigidos.
   Ficaram como imagem só as alternativas que são desenho (gráficos, circuitos, heredogramas): 2024-112, 121, 131;
   2025-106, 107, 108, 119, 127, 135 e 172.
4b. **Manter o servidor acordado de verdade:** o robô do GitHub (`manter-acordado.yml`) deveria rodar a cada
   10 minutos, mas o GitHub atrasa esses horários e ele roda só a cada 4 a 6 horas. Até o Render pago, criem um
   monitor grátis no UptimeRobot (uptimerobot.com → New monitor → HTTP(s) →
   `https://enem-api-cbo6.onrender.com/api/health`, a cada 5 minutos).
5. **Compras, 1 a 2 semanas antes do lançamento:** Render pago, domínio, autenticar o domínio no Brevo,
   pesquisa no INPI (itens 2 e 3 abaixo).
6. **Lançamento** depois do ENEM 2026; divulgação de janeiro a março de 2027, com links `?origem=...`.
7. **Prova do ENEM 2026:** quando o INEP publicar cadernos e gabaritos, usar `ferramentas-inep/` para incluir.

## Pendências para lançar (em ordem)

### 1. Conteúdo
- [x] **48 questões incompletas** transcritas dos cadernos AZUIS do INEP (27/10), conferidas uma a uma
      pela imagem da página. Agora são 93 em `questoes-manuais.json`; figuras em `img/questoes/`.
      Como baixar os PDFs do INEP: o servidor deles não manda o certificado intermediário, então é
      preciso juntar o da RNP (`secure.globalsign.com/cacert/rnpicpedugr46ovtlsca2025.crt`) ao `--cacert`.
- [x] **Provas de 2024 e 2025 completas** (27/10), tiradas dos cadernos do INEP: 184 questões de 2024 e
      182 de 2025 (todas, menos as anuladas 2024-129 e 2025-123, 132 e 174). As de fórmula difícil usam o
      recorte do caderno no enunciado e nas alternativas; 8 com alternativas em desenho fora do padrão
      (2024-127, 161, 168, 172 e 174; 2025-130, 138 e 169) aparecem inteiras como imagem, e os botões dizem
      "Alternativa A (na imagem acima)". Ferramentas em `ferramentas-inep/` (também para a prova de 2026).
- [~] **Resolução comentada** (27/10): o aluno vê "📘 Ver resolução comentada" depois de responder.
      Administradores escrevem no próprio site: no botão "✏️ Escrever resolução" que aparece na questão
      respondida, ou em Administração → **Mais erradas** (as 40 com menor % de acerto, com ✅ nas que já têm).
      16 já escritas em `resolucoes.json` (2024-93, 95, 97, 99, 114, 116, 139, 150, 152, 153;
      2025-140, 146, 152, 155, 177 e 180).
      Para o Claude escrever mais: copie a lista "Mais erradas" (ano e número) e peça "escreva as resoluções
      destas questões em resolucoes.json". O arquivo nunca apaga o que foi escrito pelo site.

### 2. Segurança e LGPD
- [x] Mensagens só de quem a pessoa segue, por padrão.
- [x] Cadastro confirma 13 anos ou mais.
- [x] Revisar a Política de Privacidade (mensagens diretas, Arena, 13 anos) — publicado em 27/10/2026.
- [ ] Pesquisar o nome "M&M" no INPI (risco de conflito com a marca do chocolate).

### 3. Infraestrutura (Miguel e Matheus)
- [ ] Conferir as variáveis do Render: BREVO_API_KEY, SITE_URL, SEGREDO_IMAGENS, ADMIN_KEY.
- [ ] Rodar no Neon o UPDATE que deixa a conta de vocês como admin.
- [ ] Render pago (~US$ 7/mês) antes de divulgar: o grátis reinicia e as salas da Arena ficam na memória.
- [ ] Domínio (Hostinger, .com.br): apontar para o GitHub Pages, atualizar SITE_URL e autenticar
      o domínio no Brevo (para o e-mail não cair no spam).
- [x] Aviso automático de erros do site (e-mail e celular para os administradores; lista na Administração).
      No primeiro deploy deve chegar um alerta com os erros da api.enem.dev: é esperado, é só limpar a lista.

### 4. Crescimento
- [x] Painel de números (Configurações → Administração): cadastros por dia, quem voltou em 7 dias,
      de onde veio. Contas criadas antes disso aparecem como "Antes do registro de origem".
      Na divulgação, usar links com `?origem=tiktok`, `?origem=instagram` etc.
- [x] Botão "Chamar amigos no WhatsApp" na sala da Arena e emblemas de convite (🤝 1 amigo, 📣 5 amigos).
- [x] Primeira visita guiada: 5 questões com dicas e a nota TRI no fim.
- [x] Reels em série: episódios numerados, "continuar assistindo", selo "Original M&M".
      Falta vocês criarem as primeiras séries (Reels → 📺 Séries → ＋ Nova série; 📺 em cada vídeo).
- [x] Reels automáticos (27/10): Reels → 📺 Séries → 📡 Canais automáticos. Cola o link de um canal do YouTube
      e o servidor confere de 3 em 3 horas (feed público, sem chave); Shorts novos vão para a fila de aprovação,
      ou direto no ar se marcar o canal como de confiança. TikTok não tem feed público: esses continuam à mão.
- [ ] Teste de 7 dias com amigos (anotar tudo que der errado ou confundir).

### 5. Por último (combinado em 27/10: depois do conteúdo das questões)
- [x] Página de entrada com rolagem (27/10), inspirada em ingrassiadaniel.it: um livro se abre e, rolando,
      saem as áreas (parábolas, sistema solar, castelo com cavaleiros, vulcão em erupção, pena escrevendo
      "Redação nota mil"), até o formulário. Sem biblioteca externa (a CSP do site não deixa); "Pular para
      entrar"; quem usa "reduzir movimento" vê tudo parado. Aberta de dentro do site, vai direto ao formulário.
- [x] Entrada no computador igual à referência (27/10): fundo escuro e 26 mil partículas (WebGL, sem biblioteca)
      que viram livro, esfera em fatias, globo, mapa do Brasil, fita, sela (Matemática), sistema solar, cavalo
      do xadrez (História), vulcão (Geografia), "Aa" (Linguagens), arcos, galáxia e, no fim, a moldura do
      cartão de entrar. O mouse gira a forma, empurra e acende os pontos; o cursor é um ponto de luz com rastro.
      Aparece em computador com mouse e tela de 820px ou mais (`?entrada=pc` força); no celular continua
      a versão com as montanhas.
- [-] Novo estilo visual: cancelado (fase final, sem função nova).

## Já feito recentemente

Arena (estilo Kahoot) · Comunidade com Reels no topo e Grupos · perfil na bolinha do topo e
Configurações em página própria · mensagens diretas com notificação · paleta de aparência no topo ·
contadores "no site agora"/"estudaram hoje" só a partir de 10 pessoas · 65 das 113 questões
problemáticas resolvidas.
