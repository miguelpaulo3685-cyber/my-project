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

## Pendências para lançar (em ordem)

### 1. Conteúdo
- [ ] **48 questões incompletas** (vieram da fonte sem texto de apoio ou figura). Faltam os PDFs do
      INEP, caderno AZUL:
      2014 dia 1 (65, 70, 75, 77) · 2014 dia 2 (107, 139, 144-146, 149, 152, 154, 156, 159, 163, 164,
      167, 171, 173, 175, 178-180) · 2016 dia 2 (137, 146, 147, 150, 156, 159, 160, 163, 165, 167, 174,
      175, 179) · 2013 dia 2 (138, 139, 166, 171) · 2017 dia 2 (175, 179, 180) · 2012 dia 2 (138, 156) ·
      2010 dia 2 (100) · 2019 dia 2 (146) · 2020 dia 2, prova IMPRESSA (160) · 2021 dia 2 (108).
      Como foi feito com as outras 33: texto tirado do PDF (`pdftotext -bbox-layout`), figuras
      recortadas com `pdftoppm` para `img/questoes/ANO-NUM.jpg`, entrada em `questoes-manuais.json`
      (gabarito e alternativas vêm do banco). Questões transcritas contam como completas
      (`provas.js`, lista CONFERIDAS).
- [ ] **Provas de 2024 e 2025** (e a de 2026 quando o INEP publicar). Ver se a api.enem.dev já tem;
      senão, pelos PDFs.
- [ ] **Resolução comentada**, ao menos das questões mais erradas.

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
- [ ] Teste de 7 dias com amigos (anotar tudo que der errado ou confundir).

### 5. Por último (combinado em 27/10: depois do conteúdo das questões)
- [ ] Tela de login com animações estilo Awwwards (GSAP): abertura animada, fundo com
      profundidade, botões magnéticos, transição ao entrar. Leve no celular, respeitando
      "reduzir movimento", no máximo 1-2 s e dá para pular.
- [ ] Novo estilo visual (se ainda quiserem): um só, testado em todas as telas.

## Já feito recentemente

Arena (estilo Kahoot) · Comunidade com Reels no topo e Grupos · perfil na bolinha do topo e
Configurações em página própria · mensagens diretas com notificação · paleta de aparência no topo ·
contadores "no site agora"/"estudaram hoje" só a partir de 10 pessoas · 65 das 113 questões
problemáticas resolvidas.
