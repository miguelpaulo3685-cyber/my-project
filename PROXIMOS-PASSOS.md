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
      10 já escritas (2024-93, 95, 97, 99, 114, 116, 139, 150, 152 e 153) em `resolucoes.json`.
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
