# Próximos passos — M&M Estudos

Arquivo de passagem entre conversas com o Claude. Numa conversa nova, comece com:
"leia o PROXIMOS-PASSOS.md e vamos continuar".

## O projeto

- Site de estudos para o ENEM, de Miguel e Matheus (os dois maiores de idade: podem criar contas, assinar
  contratos, pedir INPI e CNPJ no próprio nome). **Lançamento leve: segunda, 16/11/2026** (amigos, antigo
  colégio, redes); divulgação forte de janeiro a março de 2027, para a turma do ENEM 2027.
- Site: **https://mmestudos.com.br** (domínio no registro.br, GitHub Pages com HTTPS, arquivo `index.html`).
  O endereço antigo (github.io) redireciona. Google Search Console verificado e sitemap enviado (11/11).
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
- **Divulgação (Miguel, 18/11):** nunca falar de quem criou o site ("dois estudantes/amigos que criaram..."),
  nem em legenda, bio ou vídeo. O foco é o site e a comunidade.

## ONDE PARAMOS (18/11/2026) — leia primeiro
- **Conversa anterior:** "M&M Estudos — pós-lançamento". Ramo de trabalho: `claude/gracious-babbage-tp7kds` (em dia com o master).
- **Combinado do Miguel (17/11):** parar de criar funções novas no site e focar em **anunciar**; só aulas e consertos.
  As aulas da trilha continuam: "continue com as aulas e publique" vale como "sim" para publicar aulas.
- **Próximas aulas:** Biologia Módulo 3 (genética), depois Matemática 5, 6 e 7, Biologia 4 a 7 e Química 2 a 6.
  Cada módulo pronto ganha `trilhas/teste-<id>.js` (10 questões) e `teste: true` no índice.
- **Publicado em 17-18/11:** Matemática Módulo 3 (6 aulas + teste mat3, 47 aulas no total); estilo Serra sai sozinho
  quando o aluno escolhe tema/cor/imagem; escolher Claro/Escuro/tema pronto/cor de fundo tira a imagem de fundo
  (era o bug do "tema claro não funciona"); "Aulas soltas" saiu da tela Treinar (as 3 aulas seguem em `aulas/`);
  **administradores veem a trilha toda sem cadeado** (`moduloAberto` em `index.html`).
- **Publicado em 19/11 (pedido do Miguel):** o padrão do site virou **Preto & Verde** (estilo clássico, fundo preto,
  verde #22c55e/#86efac). A Serra só para quem a escolheu; sem escolha salva, o tema é o escuro. "Preto & Bege" segue como opção.
- **Ideias anotadas, não começadas:** plano PRO (seção abaixo; TRI fica grátis) e um "Anki" (cartões das aulas grátis;
  cartões dos erros e cartões próprios no PRO). Painel de admin: falta a conta "voltou em até 3 dias".
- **Relatório de dados pedido pelo Miguel (18/11) ficou pendente:** o painel `/api/admin/crescimento` e `/api/admin/resumo`
  pede login de admin. A chave de sessão salva no ambiente do Claude foi recusada (401). Para tentar de novo: a chave é o
  `localStorage.mm_token` de uma conta admin, colada no formulário seguro (nunca no chat).
- **Vídeo "Estude para o ENEM" (deitado, 1920x1080, 19,3 s):** cópia da edição do template do CapCut "Explore the City"
  (@kazukiii_22). Começo e fim são da referência (0-5 s e 17-19,3 s), com o título trocado para "ESTUDE para o ENEM"
  em vermelho e o parágrafo em português; no meio: médica recortada com as fotos do Miguel, site em preto e verde,
  nota TRI e de redação subindo (números de exemplo), homem olhando o mar, formatura. Cores vivas puxadas para o azul.
  Os arquivos ficaram só na sessão antiga do Claude (temporários): baixar do chat se ainda precisar. Postar a versão
  sem música e pôr o som pelo TikTok/Instagram; o começo e o fim ainda são do criador do template.

## OS DOIS DIFERENCIAIS (Miguel, 16/11, dia do lançamento)

1. **A comunidade (o maior, o site nasceu dela).** "Não é apenas um site de questões, vai além disso." A conexão
   entre as pessoas tem de ser a maior potência do site e nunca ficar esquecida. Toda função nova deve, se
   possível, aproximar os alunos.
2. **Ensino com figuras que dá para mexer** ("O que cai no ENEM", em `aulas/`). Miguel não viu isso em nenhum
   outro site de ENEM. Mais aulas e mais dinamismo no aprendizado.
Quando der, juntar os dois (ex.: aula feita com a turma ou a dupla).
   Concorrência (16/11): o site Resposta Certa tem ilustrações, mas são só imagens paradas. O nosso diferencial é a
   **simulação**: o aluno muda a situação (luz, água, seca, noite...) e vê o resultado. Manter isso em toda aula nova.

## O DIFERENCIAL (decidido em 28/10)

Nas palavras do Miguel (29/10): "Esse é o maior diferencial do site: a conexão, e os milhares de estudantes que
podem se apoiar, criar amizades, ter os mesmos sonhos, os laços que podem fazer dentro desse site. Isso não é apenas
um site, é um modo que as pessoas têm de se incentivar e buscar apoio onde podem." Toda decisão nova passa por aqui.

Página inicial (29/10): quem chega (sem conta ou com menos de 5 questões) abre no Treinar; quem já tem conta e já
estudou abre na Comunidade, no meio da sua turma. Links de Arena, e-mail e aviso continuam mandando.

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
As mudanças de 27 a 30/10 (teste 1, acolhimento, dupla, turma, busca de pessoas, Comunidade como início, vídeos,
entrada no celular, revisão das questões, TRI 2024/2025, redação 2024/2025, marca-texto) foram pedidas e decididas pelo **Miguel**.

Explicação em vídeo (29/10): depois de responder, toda questão mostra "▶ Ver explicação em vídeo no YouTube", que abre a
busca "ENEM ANO questão N resolução" (sem custo, vale para as ~3.000). A resolução comentada escrita continua por cima.

**Combinado em 29/10 (créditos em 52%): depois de terça**, escrever resoluções comentadas das questões de "Mais erradas" (10 a 20 por vez).

Entrada com partículas também no celular (30/10): formas menores na tela em pé, textos em cima e embaixo, metade das
partículas. A história com as montanhas ficou só para aparelho sem WebGL.

Revisão de questões (30/10): conferidas as 3.193 questões e as 2.069 imagens (nenhuma quebrada, nenhuma faltando,
só as 5 anuladas de fora); corrigidas 7 de 2021 a 2023 pela prova oficial. Parâmetros TRI de 2024 e 2025 baixados dos
microdados do INEP (só a tabela ITENS_PROVA, lida direto do ZIP pela internet): 364 de 366 questões ganharam nível e
passam a contar na nota TRI. Para 2026: o mesmo, quando o INEP publicar os microdados (em geral no ano seguinte).

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
4b. [x] (feito em 12/11 com o UptimeRobot) **Manter o servidor acordado de verdade:** o robô do GitHub (`manter-acordado.yml`) deveria rodar a cada
   10 minutos, mas o GitHub atrasa esses horários e ele roda só a cada 4 a 6 horas. Até o Render pago, criem um
   monitor grátis no UptimeRobot (uptimerobot.com → New monitor → HTTP(s) →
   `https://enem-api-cbo6.onrender.com/api/health`, a cada 5 minutos).
5. **Compras, 1 a 2 semanas antes do lançamento:** Render pago, domínio, autenticar o domínio no Brevo,
   pesquisa no INPI (itens 2 e 3 abaixo).
6. **Lançamento** depois do ENEM 2026; divulgação de janeiro a março de 2027, com links `?origem=...`.
7. **Prova do ENEM 2026:** quando o INEP publicar cadernos e gabaritos, usar `ferramentas-inep/` para incluir.

## LANÇAMENTO (atualizado em 11/11/2026)

Testes de ponta a ponta feitos em 11/11: entrada (e-mail e Google), barra, comunidade, treinar, arena,
redação, esqueci a senha e prévia no WhatsApp. Tudo passou.

### Até domingo (15/11)
- [ ] Marcar os erros do painel como resolvidos.
- [x] UptimeRobot (12/11): monitores do site e da API criados, os dois "Up".
- [x] **Cópia de segurança do banco** (`.github/workflows/copia-do-banco.yml`): segredos criados e primeira
      cópia feita em 12/11 (1,4 MB, conferida). Roda sozinha todo dia; cada cópia fica 30 dias em Actions >
      Artifacts. A `COPIA_SENHA` tem de estar guardada fora do GitHub: sem ela a cópia não abre.

### No dia (16/11)
- [x] **Gemini** ("Por que errei?" no Treinar): ligado em 12/11 (`GEMINI_API_KEY` no Render; as chaves novas
      do Google começam com `AQ.`). O servidor escolhe sozinho o modelo "flash" mais novo que a chave aceita,
      com o "flash-lite" de reserva (`explicacao-ia.js`). Uma **trava de qualidade** recusa a explicação se uma
      conta escrita não fecha, se a IA se corrige no meio do texto ou se a resposta final não é a do gabarito;
      aí o aluno vê um aviso e o link do vídeo. Explicação guardada que não passa na trava é apagada e refeita.
      Em Administração, a linha "Por que errei? (IA)" mostra o modelo, o motivo do último erro e as questões
      barradas (costuma indicar enunciado ou gabarito errado: foi assim que achamos a 2021-165, corrigida).
      Administradores têm o botão "Está errada: apagar e gerar outra". Opcionais: `GEMINI_MODELO`,
      `EXPLICACAO_LIMITE_DIARIO` (400).
      **Fechado em 13/11 (no ramo `claude/great-pascal-rrk8vh`, esperando o "sim" para ir ao master):**
      (1) o aluno espera no máximo 20 s: passou disso, o servidor responde "demorando", continua gerando e o
      site pergunta de novo sozinho (até 4 vezes), sem gastar o freio; (2) teste com 20 questões de Matemática
      sorteadas, no site de verdade: 17 explicações certas (conferidas uma a uma), 3 barradas pela trava (todas
      dependem de figura: 2017-171, 2016-153, 2016-139) e nenhuma errada no ar. Duas falharam na primeira
      tentativa e saíram na segunda. 6 das 20 passaram de 20 s. **Decisão sugerida: a IA fica ligada em
      Matemática.** Pontos fracos: as linhas das alternativas erradas às vezes são vagas ("errou a conta") e a
      2012-147 tem uma frase confusa ("353485 metros cúbicos"; o certo é 3 534,85 m³): apagar pelo botão
      "Está errada: apagar e gerar outra"; (3) resolução da 2017-160 escrita à mão em `resolucoes.json`.
- [x] Render pago (plano Starter, US$ 7/mês): feito em 17/11; API respondendo em ~0,3 s e questões carregando.
- [ ] Acompanhar o painel de erros e o Feedback.

### Navegação (16/11)
- **Tablet (publicado):** barra lateral fixa com ícone e nome (`@media (min-width: 701px) and (hover: none)`).
- **Celular (publicado em 16/11):** embaixo Treinar | Comunidade (meio) | Simulado; no menu
  de 3 barras Arena, Redação, Aparência, Feedback e Configurações. Decisão provisória: revisar com os dados de uso
  (Miguel acha que a Arena será pouco usada nos primeiros dias).
- Corrigido: ao abrir, a aba acesa era Comunidade mesmo caindo no Treinar.
- **Quem usa cada parte** (16/11, publicado): Administração → crescimento mostra quantas pessoas abriram cada
  parte nos últimos 7 dias (com conta / hoje). Tabela `uso_partes` (dia, parte, quem), uma linha por pessoa/parte/dia,
  apagada depois de 90 dias. Contas viram `u<id>`; sem conta, um código sorteado no aparelho que o servidor guarda
  embaralhado (hash). Treinar conta quem fez questões, não quem só viu a tela. Está na Política de Privacidade.
  Usar estes números para decidir o que fica à vista no celular.

### Vídeo de divulgação no estilo da referência (16/11, em andamento)
- Feito na conversa de 16/11: vídeo de teste de 21 s (16:9, música da referência, cortes na batida), versão 5
  entregue no chat. Começo: olho, mãos, livro, celular, notebook, montanha viva com "SEJA O QUE VOCÊ QUISER";
  texto "O QUE VOCÊ PRETENDE FAZER DA VIDA / SE TODO ESSE SONHO SEU NÃO DER CERTO? / ISSO NEM PASSA PELA MINHA
  CABEÇA" sobre médico, engenheiro e direito (em cor); site no meio (login com partículas, Aparência com os 12
  temas, aula); final com professor e gráfico cortados na batida.
- **Crítica do Matheus:** parece vídeo de site de investimento. **Sugestão do Claude (esperando o Matheus decidir):**
  (1) trocar o gráfico de velas por a nota TRI subindo no estilo do site (ex.: 512 → 780) ou "APROVADO";
  (2) tirar as cenas da mesa de operador e usar mais professor e plateia estudando; (3) pôr "ENEM 2027" no texto
  depois de "CABEÇA"; (4) fechar com "NINGUÉM PASSA NO ENEM SOZINHO." + logo M&M + mmestudos.com.br.
- Para publicar: trocar os trechos que ainda são da referência (outro criador), conferir licença dos vídeos de
  banco de imagens e pôr a música pelo próprio TikTok/Instagram. Os arquivos de edição ficam só na sessão do
  Claude (temporários); se sumirem, é preciso mandar os vídeos de novo.

### Divulgação (17/11, em andamento)
- Perfis @mmestudos no TikTok e no Instagram; foto de perfil 1080x1080 pronta. TikTok fica **pessoal** (a conta
  comercial pede CNPJ e limita as músicas). Link clicável no Instagram com `?origem=instagram`; no TikTok,
  escrever "mmestudos.com.br" na bio e num comentário fixado.
- Vídeo **"23h47"** (Fotossíntese, 37 s, em pé): 100% material nosso, pode postar. Hashtags sugeridas:
  #enem #enem2027 #estudos #biologia #fotossintese.
- Vídeo no estilo da referência (deitado 17,5 s e em pé 1080x1920): **só teste**. Já tem o cartão da nota TRI no
  lugar do gráfico de bolsa (o "780" é exemplo), "ENEM 2027" e o fecho "Ninguém passa no ENEM sozinho.". Ainda
  tem trechos de outro criador (rosto, esqueleto, câmera, fumaça): trocar por gravações nossas antes de publicar.

- Vídeo **"Estude para o ENEM"** (17/11, 21 s, em pé 1080x1920): estilo do template "Explore the City" (capa de revista +
  cortes rápidos na batida), só com telas do nosso site gravadas quadro a quadro + "Ninguém passa no ENEM sozinho.".
  Material 100% nosso; a música da referência é só para teste: postar a versão sem música e pôr o som pelo TikTok/Instagram.

### Plano do Miguel (17/11)
- Até janeiro: 4 a 5 vídeos por semana, testando formatos. Começo de fevereiro: propor um **piloto grátis** à
  antiga escola pública, já com números. Escola pública quase não paga (licitação); o dinheiro vem de escolas
  particulares, cursinhos, plano pago e editais.
- Abril: plano grátis (o que já existe) + **Pro a R$ 15** (questões de outros vestibulares, como UECE e UERJ, e
  extras). Sugestões: comunidade e aulas continuam grátis; no Pro o que custa por uso (mais correções de redação
  por IA, "Por que errei?" sem limite, relatório por assunto). Antes de construir, medir o interesse com um botão
  "Quero o Pro". Antes de cobrar: CNPJ e contador, pagamento pelo responsável (menores) e direito de arrependimento.
- Concorrente: Plataforma Assaad (ciclos de estudo e créditos de redação). Falta comparar planos e preços.
- **Trilha de estudo guiada** (ideia nova): mapa de estações com aulas que se mexem. Começar por Matemática:
  Porcentagem → Proporção → Regra de três → Gráficos. Cada estação: "uau" nos 10 primeiros segundos, mexer,
  mini-desafio, 3 questões reais. Recompensa só visual; comunidade dentro da trilha. **Pedido: tela do mapa
  numa prévia.**

### Pedidos do Miguel de 17/11 (publicados em 17/11 com o "faça e publique" dele)
- **Metas no topo da Comunidade** (como stories, com outro visual): cartões de papel com a bolinha da pessoa no canto,
  ✓ quando cumprida, contorno quando não vista (`mm_metas_vistas` no aparelho). Tocar abre em tela cheia (passa sozinho
  em 6 s, toque na esquerda volta, segurar pausa, 👏🔥💡 para apoiar). Último cartão: "Chamar amigos" (WhatsApp).
  Sem conta: cartões de exemplo com "Criar conta". Saiu o título "Hoje na comunidade".
- **"Da comunidade"** no lugar de "O que está rolando": as publicações do perfil (foto ou texto), com curtida ♥
  (tabela `publicacoes_curtidas`, avisa o autor), filtro Todos/Quem eu sigo, sem nenhuma nota. Rota `GET /api/comunidade/fotos`
  e `POST /api/publicacoes/:id/curtir` (`perfis.js`). Na Política de Privacidade.
- **Celular sem menu de 3 barras**: embaixo só ícones (Treinar, Simulado, Comunidade no meio em destaque, Arena, Redação);
  🎨 no topo; Configurações e Feedback no próprio perfil.
- **Serra (vidro) é o padrão** para quem nunca escolheu estilo nem mexeu em cores/fundo (`estiloGuardado`).
- **Simulado**: aviso das anuladas pelo INEP (2009-101, 2024-129, 2025-123/132/174; `ANULADAS_SIM` igual a `provas.js`).
- **O site cai ao atualizar?** Não: GitHub Pages troca na hora e o Render pago só desliga a versão antiga depois que a
  nova responde. Só as salas da Arena abertas naquele minuto se perdem (ficam na memória).
- **Lista de conteúdos do Miguel (17/11) aplicada** (publicada em 17/11): Matemática, Biologia e Química, 7 módulos
  cada. O índice fica em `trilhas/indice.js` (baixado só quando o cartão da trilha aparece), o teste de cada módulo em
  `trilhas/teste-<id>.js` (baixado só ao começar o teste) e cada aula em `aulas/` (baixada só ao abrir): o site continua
  leve. Para uma aula nova ficar disponível: os dois arquivos em `aulas/` e o id em `prontas` no índice. Módulo sem
  teste não trava o seguinte. Prontas: 47 aulas (Matemática: Módulos 1 a 4; Biologia: Módulos 1 e 2; Química: Módulos 1 e 7). Testes: mat1, mat2, mat3, mat4, bio1, bio2, qui1, qui7 (os nomes
  antigos m1/m3/m5 continuam valendo para quem já passou). **Faltam ~65 aulas** ("Em produção" na própria trilha).
- **Trilha "O que cai no ENEM"** (feita em 17/11): cartão no topo do Treinar → tela `trilha` com o mapa dos módulos
  (`TRILHAS` no index.html). O teste de cada módulo (10 questões, passa com 7, alternativas embaralhadas a cada tentativa)
  abre o próximo; dá para fazer o teste e pular. **Matemática completa, 18 aulas em 5 módulos:**
  1. Operações básicas e potência: soma, subtração, multiplicação, divisão, potência (com ordem das operações).
  2. Frações e decimais: frações, números decimais, contas com frações.
  3. Razão, proporção e regra de três: razão e escala, proporção, regra de três.
  4. Porcentagem e juros: porcentagem (a aula antiga, agora com filminhos), juros simples e compostos.
  5. Gráficos, tabelas e médias: gráficos e tabelas, média/moda/mediana.
  Cada aula: figura de mexer + "filminhos" que tocam sozinhos com legenda (motor `aulasMM.filme` em `aulas/base.js`,
  roteiros no `.js` de cada aula) + "Onde o ENEM pega" + teste rápido + "✓ Terminei a aula". Linguagem simples com
  profundidade de cursinho (pedido do Miguel). Progresso na conta: tabela `trilha_progresso`, rotas `GET/PUT /api/trilha`
  (`trilha.js`, junta sem perder nada); sem conta, fica no aparelho e vai para a conta ao entrar. Na Política de Privacidade.
  **Falta:** a lista de conteúdos do Miguel (a ordem dos módulos pode mudar), um professor revisar os textos, e as
  trilhas de Natureza, Humanas e Linguagens ("em breve" no cartão). Ideia guardada: animar com transform em vez de
  left/top se algum celular fraco engasgar (Miguel preferiu deixar como está).

### Celular: toque e tamanhos (16/11, publicado)
- Auditoria em 8 tamanhos (320 a 1366 px) e 8 telas: nada rola de lado, viewport/lang/zoom corretos, sem botão sem
  nome nem imagem sem alt. Rolar a tela nunca responde a questão (testado em iPhone 13, SE e Pixel 7); a resposta só
  vale em "Confirmar resposta". A Arena responde direto ao toque (é contra o relógio).
- Mudanças: touchstart/touchmove das alternativas passivos (por delegação em `#lista-alts`), alvos de 44 px no toque
  (✕ da dica, botões da aula e "Voltar"), e folga embaixo do botão Confirmar (`scroll-margin-bottom`).
- Fica para depois: avatar do topo com 34 px; `onclick` inline e `index.html` de ~700 KB (dividir é trabalho grande).

### Depois do lançamento
0. **Cloudflare (grátis)** na frente do domínio: cache mais longo, proteção e contador de visitas sem cookies.
   Passos no fim da conversa de 12/11. Fazer com calma, fora da semana do lançamento.
1. **Ferramenta do professor** — versão simples feita em 11/11 (rotas em `redacoes.js`). A equipe marca o
   professor em Administração → Professores (pelo e-mail da conta). Ele abre Redação → Correção → "Fila da
   minha escola": redações de quem pôs a mesma escola no perfil, sem o nome do aluno, urgentes primeiro
   (comunidade discordou ou espera há mais de 3 dias). As notas já vêm marcadas (média da comunidade ou IA),
   há comentários prontos de um toque, e a correção dele fecha a nota e leva o selo "professor".
   Só o professor vê o nome do aluno (decidido em 12/11; está na tela de envio e na Política de Privacidade).
   Falta decidir com a professora: metas e divisão entre monitores.
2. **Correção de redação por IA** (já pronta em `correcao-ia.js`, em "Em breve" até ter chave): pôr
   `ANTHROPIC_API_KEY` no Render com limite de gasto no console.anthropic.com. Hoje usa Claude Opus 5.5
   (~US$ 0,06 por redação); para gastar menos, trocar para Claude Haiku 5.5 (~US$ 0,002). Limite: 3 por
   aluno por dia e `IA_LIMITE_DIARIO` (200) no site. Não usar IA gratuita para redação (textos de menores).
3. **Registro da marca no INPI** (classe 41, mista). Busca feita em 11/11: ninguém tem "M&M Estudos"; os
   "M&M"/"MM" da classe 41 são de fotografia, música e jornalismo (ramos diferentes).
4. **Estatísticas da redação** — feito em 12/11 (`estatisticas-redacao.js`): os temas de 1998 a 2026 em 8 eixos,
   chance de cada eixo para o próximo ENEM e teste nos últimos 10 anos (o eixo certo ficou entre os 3 primeiros
   em 5 de 10; ao acaso seriam uns 4, e o site diz isso). Quando sair um tema novo, é só acrescentar a linha
   em `TEMAS`. "Nas notícias" (`noticias-redacao.js`, 12/11): de hora em hora o servidor lê o feed
   da Agência Brasil (agência do governo federal; sem chave), classifica os títulos por palavras-chave e mostra
   a parte de cada eixo nos últimos 30 dias (só aparece com 40 notícias classificadas, uns 4 a 5 dias). Não
   entra na conta das chances. Instagram e gov.br bloqueiam robôs, por isso a Agência Brasil. As palavras-chave
   ficam em `PALAVRAS`. O tema de 2026 (SUS) já está em "Anos anteriores", sem os textos motivadores.
4b. **Temas para treinar esta semana** (combinado em 13/11, fazer depois do dia 16): uma vez por semana o
   servidor pega as notícias dos eixos mais fortes e pede ao Gemini uns 3 temas no formato do ENEM (só títulos
   de notícia vão para a IA). Os temas entram numa **fila de aprovação** na Administração (publicar/descartar),
   como os Reels automáticos, e aparecem em Redação → Estatísticas como treino, não como previsão. Junto:
   testar mais fontes oficiais com feed aberto (Agência Senado, Agência Câmara, IBGE). Instagram e gov.br não
   dão (bloqueiam robôs).
4c. **Em aberto (perguntado em 13/11, sem resposta):** campo "Abrir questão" (ano e número) na Administração,
   só para a equipe. Hoje não há como abrir uma questão específica; para apagar uma explicação da IA foi
   preciso usar o console do navegador.
4d. **Aprender mexendo (aulas interativas)** — ideia do Miguel (14/11). Feito e publicado em 14/11
   (Miguel pediu antes do lançamento). A aula de Porcentagem é um mercadinho (carrinho, desconto, acréscimo, nota).
   Cartão "Aprender mexendo" no Treinar, logo abaixo do "Bora treinar?" (sem botão novo na barra). Cinco aulas,
   uma por área: Fotossíntese, Cinemática, Porcentagem, Pirâmide etária e Figuras de linguagem. Cada aula tem
   uma figura que o aluno controla, texto curto, "Onde o ENEM pega", teste rápido e o botão "Treinar questões".
   Como é feito: cada aula são dois arquivos em `aulas/` (`<id>.html` e `<id>.js`), baixados só quando o aluno
   abre; `aulas/base.css` e `aulas/base.js` são comuns. Tudo começa com `au-` para não bater com o resto do
   site (`test/aulas.test.js` confere). Para acrescentar uma aula: os dois arquivos e uma linha em `AULAS` no
   `index.html`. Os números das simulações são ilustrativos (está escrito nas aulas). **Falta:** vocês (ou um
   professor) lerem os textos; depois, mais assuntos e medir se quem abre a aula acerta mais.
   **Nome (15/11):** o cartão agora se chama "O que cai no ENEM" (antes "Aprender mexendo").
   **Lado a lado (15/11, publicado):** em tela de 900 px ou mais, a ilustração fica à esquerda e o texto à direita
   (`.au-texto`, montada pelo `abrirAula`). A ilustração só fica parada enquanto o texto rola se couber inteira
   na tela (`aulaFixa`); senão rola junto. No celular continua empilhado.
4e. **Temas prontos na Aparência** (14/11, publicado): 12 temas de
   um toque na aba Estilo (Oceano, Floresta, Pôr do sol, Aurora, Meia-noite, Neon roxo, Matrix, Cyber rosa,
   Sakura, Lavanda, Menta, Papel). Cada um é só fundo + cor principal + secundária (`TEMAS_PRONTOS` no
   `index.html`); o texto se ajusta sozinho. Pedido depois: um estilo novo "como o Serra" ficou para depois
   do lançamento, se quiserem.
4f. **Imagem de fundo** (14/11): tentamos deixar a foto mais nítida (menos véu; depois realce de contornos e
   mais qualidade ao guardar). O Miguel não gostou e pediu para voltar: **está tudo como era antes** (véu 70%,
   barra até 70%, JPEG 0,8 até 1,8 MB). Se voltarem ao assunto, perguntar primeiro o que exatamente incomoda.
4g. **Resposta sem querer no celular** (14/11, publicado): alunos do teste perdiam questões no Treinar porque o
   dedo que rolava a página respondia a alternativa. Agora, só no toque (celular e tablet): se o dedo andou
   mais de 10 px, era rolagem e nada acontece; um toque parado só **escolhe** a alternativa e aparece o botão
   "Confirmar resposta". Com mouse e teclado continua direto. Vale só para o Treinar (a Arena é contra o
   relógio e ficou como era).
4h. **"Por que errei?" mais rápido** (14/11, publicado): ao entregar um bloco do Treinar, o servidor já vai
   escrevendo, uma de cada vez, as explicações que ainda não existem (`adiantar` em `explicacao-ia.js`). Quando o
   aluno toca no botão, ela costuma estar guardada e aparece na hora. Usa até 70% do limite diário
   (`EXPLICACAO_LIMITE_DIARIO`, 400); o resto fica para quem pedir na hora. Sem cota no Google, para e descansa
   10 minutos. Desliga com `EXPLICACAO_ADIANTAR=0` no Render. Cada questão só é explicada uma vez na vida, então
   com o uso o banco inteiro (~3.200) fica coberto.
4i. **Mais ênfase na comunidade** (14/11, publicado). (1) Administração → crescimento ganhou "Comunidade na 1ª
   semana" (das contas novas em 30 dias, quantas seguiram alguém, entraram num grupo, deram/receberam
   boas-vindas, formaram dupla, mandaram mensagem ou comentaram) e "Quem cria laço volta mais?" (retorno em 7
   dias com laço × sem laço). Conta em `SQL_COMUNIDADE` (`crescimento.js`), testada num Postgres local.
   (2) No fim de cada bloco do Treinar aparece sempre um cartão que leva à comunidade (`htmlTurmaNoFim`): turma
   que treinou hoje → "Ver a turma"; turma parada → "Chamar no WhatsApp"; sem turma → "Encontrar pessoas";
   sem conta → "Criar conta grátis". Ideias guardadas para depois de ver os números: convite para dupla depois
   do primeiro bloco e primeiros passos com um passo social.
5. **Piloto no colégio**: 1-2 turmas do 3º ano por 1-2 meses, medir "voltou em 2+ dias".
6. **Confiança na nota da IA**: calibrar com as redações nota 1000 da Cartilha do Participante do INEP.

### Feito em 12/11
- Ferramenta do professor, Estatísticas da redação, "Nas notícias" (Agência Brasil), tema de 2026, mais 14
  resoluções comentadas (30 no total), cópia diária do banco, UptimeRobot e Gemini ligado com trava de qualidade.
- Ambiente `my-project` no Claude Code com acesso liberado a gov.br, Agência Brasil, à API e ao site: as
  próximas conversas conseguem testar o site de verdade.
- Dependabot (correções de segurança das bibliotecas, toda segunda).
- Velocidade (Lighthouse no celular): fontes sem travar a tela, imagens das áreas em WebP (metade do peso),
  links legíveis pelo Google. Primeiro desenho da tela de 2,4 s para 1,5 s; SEO de 92 para 100. O que resta é
  o tamanho do `index.html` (690 KB num arquivo só): dividir é trabalho grande, para depois.

### Feito em 11/11
- Domínio mmestudos.com.br; prévia do link (og:*); robots.txt, sitemap.xml, canônico.
- Barra: Comunidade, Arena, Treinar, Simulado, Redação + bolinha do perfil no computador.
- Vídeo da Comunidade toca sozinho, sem som ("Ativar som").
- Aba Redação: menu 2x2 (Anos anteriores, Correção, Estatísticas, Minhas redações), ícones de linha;
  Redações saíram da Comunidade.
- Mensagens diretas na hora (fluxo de eventos) e aparecendo como "enviando…"; fim do foco nas salas espalha
  os pedidos ao servidor.
- "Por que errei?" (Gemini), "Quem vê minhas notas" (todos / só amigos / só eu; padrão só amigos; vale para a
  nota TRI na comunidade e o ranking do Desafio) e prova de corretor (2 redações com nota fechada antes de
  corrigir; desligada enquanto houver menos de 3 redações com nota fechada).
- Simulado: todas as provas completas no banco (menos as anuladas pelo INEP).

## PLANO PRO (ideia de 17/11/2026, ainda não começado)
- Continua GRÁTIS: aulas da trilha, comunidade, simulado e a nota estimada pela TRI (decisão do Miguel).
- PRO (ordem de força): 1) correção de redação (limite por mês, custa por correção); 2) relatório do simulado
  (o que derruba a nota, o que estudar primeiro); 3) revisão dos erros / cartões tipo Anki com revisão espaçada;
  4) plano de estudos até o ENEM; 5) questões sem limite com explicação; 6) selo e estilo no perfil.
- Quem paga é adulto responsável (menores, LGPD). Preço pensado: R$ 9,90 a 19,90/mês + plano "até o ENEM".
- Antes de construir: lista de espera para medir interesse.
- **Decisões do Miguel (18/11):**
  - Redação: grátis = correção da comunidade + IA leve (Haiku 5.5, ~1 centavo por correção; antes, comparar
    ~10 redações Haiku × Opus); PRO = IA forte (Opus 5.5) + **correção por professor** (~2 por mês, até 72 h;
    o professor vê só o texto, nunca contato com o aluno). A parte do professor já existe em `redacoes.js`.
  - **Trilhas continuam grátis** (diferencial nº 2).
  - PRO também: cartões com revisão espaçada (dos erros e próprios), relatório do simulado, plano de estudos, selo.
  - **Outros vestibulares no PRO (UECE, UERJ...):** só a parte de múltipla escolha, sem TRI. Risco de direitos
    autorais (sobretudo os textos de terceiros dentro das questões), maior por ser pago. Ideia do Miguel: adaptar
    alternativas e textos. Mais seguro: questões novas "no estilo" do vestibular, ou resolução comentada com link
    para a prova oficial; ou pedir autorização por e-mail à CEV/UECE e ao vestibular da UERJ.
  - **IDEIA (Miguel, 18/11) — aulas em vídeo animado no plano de estudos do PRO.** Referências que ele mandou
    (TikTok): **@fragmentosdarazao** ("E se um buraco negro do tamanho de uma moeda aparecesse na sua mesa?":
    cena 3D de almoço de domingo, números grandes na tela — "1,1 TERRAS", "46 TRILHÕES g" —, legenda curta
    embaixo, contagem regressiva, o fenômeno acontecendo na frente do aluno) e **@frutasocultas.ai** (desenho
    animado 2D com personagens simples, uma palavra grande por vez na tela no ritmo da narração, história do
    dia a dia). Ou seja: pergunta "e se...?" que prende, situação do cotidiano brasileiro, número de impacto,
    1 a 2 minutos, vertical. Casa com o diferencial das simulações: cada aula do plano poderia ter um vídeo
    assim + a simulação para mexer. Os vídeos servem também de divulgação no TikTok (com o endereço no fim).
  - **Preço e vídeo de lançamento (Miguel, 19/11):** Miguel acha R$ 15 barato para tudo que o PRO terá. Sugestão:
    preço cheio R$ 24,90 a 29,90, com "preço de fundador" (ex.: R$ 14,90 para sempre) para quem estiver na lista de
    espera, e plano "até o ENEM" com desconto. Taxa de assinatura sobe mais com valor percebido do que com preço baixo:
    amostra grátis do PRO (ex.: 1 correção por professor), 7 dias grátis, lista de espera aquecida, falar também com
    os pais (quem paga). **IDEIA: vídeo animado de lançamento** — "custa menos que uma pizza por mês" (só vale se for
    verdade no preço escolhido; pizza média ~R$ 40-60), mostrando tudo que vem no PRO. Cuidado com publicidade para
    menores: sem pressão do tipo "compre já" ou "peça aos seus pais"; falar com o aluno e com a família.
  - **Provas próprias "no estilo" e a confiança do aluno (18/11):** o medo é o aluno desconfiar e não pagar R$ 15.
    Como passar confiança: (1) simulado "estilo UECE" curto grátis para provar a qualidade; (2) mostrar a base de
    cada questão ("assunto mais cobrado pela UECE nos últimos 5 anos: Genética, 12%"); (3) "revisada por
    professor(a) de X" com nome (os mesmos professores da redação); (4) % de acerto e comentários da comunidade
    em cada questão; (5) nome honesto: "no estilo UECE", nunca "prova da UECE"; (6) anunciar a devolução em
    7 dias (o Código de Defesa do Consumidor já obriga nas compras pela internet). E o PRO não se vende pelas
    questões: vende o pacote que ninguém tem junto (redação com professor, plano com aulas animadas, cartões
    dos erros, treino do vestibular da sua cidade). As questões "no estilo" são bônus.

## Pendências antigas (de outubro)

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
- [x] Pesquisar o nome "M&M" no INPI (11/11: liberado para usar; falta pedir o registro).

### 3. Infraestrutura (Miguel e Matheus)
- [ ] Conferir as variáveis do Render: BREVO_API_KEY, SITE_URL, SEGREDO_IMAGENS, ADMIN_KEY.
- [ ] Rodar no Neon o UPDATE que deixa a conta de vocês como admin.
- [x] Render pago (Starter, 17/11): o grátis reiniciava e as salas da Arena ficam na memória.
- [x] Domínio mmestudos.com.br (registro.br) apontado para o GitHub Pages (11/11); SITE_URL e CORS no código.
- [x] Autenticar o domínio no Brevo (11/11): domínio autenticado, remetente `nao-responda@mmestudos.com.br`.
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
