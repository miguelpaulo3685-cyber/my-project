---
name: video-lancamento
description: Fazer vídeos curtos de lançamento/divulgação do M&M Estudos no estilo "edição de lançamento de feature" (cartões brancos em fundo preto, preto e branco, cortes rápidos). Use quando pedirem vídeo de lançamento, vídeo do site em uso, vídeo de feature ou "vídeo no estilo da referência 2".
---

# Vídeo de lançamento (estilo referência 2)

A referência é um vídeo de "lançamento de feature de um app" que passa na tela de um notebook e foi filmado com o celular.
O arquivo da referência fica no repositório privado `mm-videos` (`referencias/edicao-lancamento.mp4`), porque não é nosso
e este repositório é público. As regras abaixo descrevem a edição.

## Regras de edição (seguir sempre)

1. **Prender nos 3 primeiros segundos.** Nada de tela preta parada no começo. Do quadro 0 até 1 s, palavras e números
   grandes passando a cada 0,2 s, em preto e branco, com borrão de movimento ("00:09", "ENEM", "612", "TRI", "5/5").
2. **Nenhuma cena parada mais de ~2,5 s.** Cada cena tem 1 a 2,6 s. Vídeo inteiro de 15 a 22 s.
3. **Tudo sempre se mexe:** empurrão lento (zoom de 1,00 para 1,06) em toda cena; os itens entram um por um.
4. **Transições curtas (0,2 s), com borrão:** zoom (entra grande e borrado) ou chicote (desliza de lado borrado). Alternar.
5. **"Introduzindo" digitado** letra por letra com um ponto branco no fim, e a câmera atravessa a palavra (zoom até 9x).
6. **Palavra-chave escrita à mão** (fonte Caveat, branca), revelada da esquerda para a direita, sobre um fundo
   preto e branco borrado andando devagar (no lugar de filmagem, usar texto real da questão bem grande e borrado).
7. **Cartões claros** (#f4f4f2, cantos de 34 px, sombra forte) sobre fundo preto. Texto preto, cinza #8b8b88.
   Verde #22c55e só para acerto e para a marca.
8. **O botão muda de estado no lugar** em vez de cortar: "Começar treino" → "Separando questões…" (girando) → "✓ Bloco pronto".
9. **Itens se completam um por um:** lista com ✓ (um ✕ cinza para parecer real), barra enchendo, grade de dias enchendo.
10. **Número subindo em cartões empilhados** (nota TRI 480 → 612), com "EXEMPLO" escrito embaixo.
11. **Fim:** frase curta grande ("Grátis. De verdade."), depois a marca M&M Estudos + mmestudos.com.br.
12. **Sem música embutida** (entra pelo TikTok/Instagram). O texto do gancho fixo no topo também entra pelo app.

## Regras do conteúdo (do PROXIMOS-PASSOS.md)

- Só telas e textos que existem no site (Treinar, nota TRI, trilhas, sequência de dias). Nada inventado.
- Número de exemplo sempre marcado "EXEMPLO". Nunca falar de quem criou o site. Nunca fingir ser aluno.
- Dizer "aulas interativas" ou "com simulação", nunca "aulas que você mexe".

## Como fazer

1. Copiar `modelo.html` para uma pasta de trabalho (scratchpad) e trocar as cenas. Cada cena é um `<div class="cena" id="X">`,
   com a janela de tempo em `const C = {...}` e a animação dentro de `render(t)`. Tudo depende só de `t` (sem timers).
2. Conferir quadros soltos: `node render.js <caminho>/index.html <pasta> snap 0.3 1.5 3.4 ...` (salva `snap-<t>.jpg`).
3. Gerar o MP4: `node render.js <caminho>/index.html <saida>.mp4` (1920x1080, 30 fps; usa o Playwright e o FFmpeg da sessão).
4. Mandar o MP4 para o Miguel/Matheus. Para ficar igual à referência: tocar em tela cheia no notebook, numa mesa com luz
   de janela, e filmar com o celular na vertical.

## Ferramentas do vídeo 1 (tutorial)

- **FFmpeg** (cortes): já está na sessão.
- **HyperFrames** (animações; `npx skills add heygen-com/hyperframes`): instalar no computador do Miguel, dentro do `mm-videos`.
  Na nuvem a instalação foi bloqueada; este modelo faz o mesmo tipo de animação sem ele.
- **Whisper** (legenda automática): só para vídeo com narração; instalar quando precisar.
- **yt-dlp** (baixar referências): não precisa; as referências são enviadas direto no chat.
