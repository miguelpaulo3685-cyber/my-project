aulasMM.aulas['figuras-de-linguagem'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const FIGURAS = [
    { nome: 'Metáfora', literal: 'Meu irmão é muito rápido.', figurada: 'Meu irmão é <mark>um foguete</mark>.',
      pista: 'Troca uma coisa por outra parecida, sem usar "como". O irmão não é um foguete: ele tem a rapidez de um.' },
    { nome: 'Comparação', literal: 'Meu irmão é muito rápido.', figurada: 'Meu irmão é rápido <mark>como um foguete</mark>.',
      pista: 'Aproxima duas coisas usando uma palavra de comparação: "como", "feito", "igual a", "que nem".' },
    { nome: 'Metonímia', literal: 'Li um livro de Machado de Assis.', figurada: 'Li <mark>Machado de Assis</mark>.',
      pista: 'Troca uma palavra por outra ligada a ela: o autor pela obra, a marca pelo produto, a parte pelo todo.' },
    { nome: 'Hipérbole', literal: 'Esperei muito tempo na fila.', figurada: 'Esperei <mark>uma eternidade</mark> na fila.',
      pista: 'Exagera de propósito para dar força à ideia.' },
    { nome: 'Eufemismo', literal: 'O cachorro dela morreu.', figurada: 'O cachorro dela <mark>virou estrelinha</mark>.',
      pista: 'Suaviza uma ideia dura ou desagradável.' },
    { nome: 'Ironia', literal: 'Você chegou muito atrasado.', figurada: '<mark>Que pontualidade</mark>, hein?',
      pista: 'Diz o contrário do que se quer dizer. Só se percebe pelo contexto ou pelo tom.' },
    { nome: 'Antítese', literal: 'A vida tem momentos bons e ruins.', figurada: 'A vida é feita de <mark>risos</mark> e <mark>lágrimas</mark>.',
      pista: 'Coloca lado a lado palavras de sentidos opostos.' },
    { nome: 'Personificação', literal: 'Ventava forte lá fora.', figurada: 'O vento <mark>gritava</mark> lá fora.',
      pista: 'Dá ação, fala ou sentimento de gente a um bicho, objeto ou ideia.' }
  ];
  const FRASES = [
    ['Estou morrendo de fome.', 'Hipérbole', 'É um exagero: ninguém está morrendo de verdade.'],
    ['Comi dois pratos no almoço.', 'Metonímia', 'O prato aparece no lugar da comida que estava nele.'],
    ['As estrelas piscavam para nós, curiosas.', 'Personificação', 'Piscar para alguém e ser curioso são coisas de gente.'],
    ['Ela é forte como uma rocha.', 'Comparação', 'A palavra "como" liga as duas coisas.'],
    ['Depois de uma longa doença, meu avô descansou.', 'Eufemismo', '"Descansou" suaviza a ideia de morrer.'],
    ['Tirei zero na prova. Que dia maravilhoso!', 'Ironia', 'A pessoa diz o contrário do que sente.'],
    ['Aquela sala de aula é um forno.', 'Metáfora', 'A sala é chamada de forno por ser muito quente, sem usar "como".'],
    ['Uns riem, outros choram; uns chegam, outros partem.', 'Antítese', 'Rir e chorar, chegar e partir: ideias opostas lado a lado.']
  ];

  // ---------- laboratório ----------
  const lista = $('figuras');
  lista.innerHTML = FIGURAS.map((f, i) => `<button type="button" data-i="${i}" aria-pressed="false">${f.nome}</button>`).join('');
  function mostrar(i) {
    const f = FIGURAS[i];
    [...lista.children].forEach((b, n) => b.setAttribute('aria-pressed', n === i));
    $('literal').textContent = f.literal;
    $('figurada').innerHTML = f.figurada;
    $('recado').textContent = `${f.nome}: ${f.pista}`;
  }
  lista.addEventListener('click', e => { const b = e.target.closest('button'); if (b) mostrar(Number(b.dataset.i)); });

  // ---------- jogo ----------
  let atual = 0, acertos = 0, respondida = false;
  const opcoes = $('opcoes');
  opcoes.innerHTML = FIGURAS.map(f => `<button type="button" class="au-alt">${f.nome}</button>`).join('');
  const botoes = [...opcoes.children];
  function pergunta() {
    respondida = false;
    botoes.forEach(b => { b.classList.remove('au-certa', 'au-errada'); b.disabled = false; });
    if (atual >= FRASES.length) {
      $('frase-jogo').textContent = acertos === FRASES.length ? 'Gabaritou!' : `Você acertou ${acertos} de ${FRASES.length}.`;
      $('placar').textContent = 'Fim das frases';
      $('recado-jogo').textContent = acertos >= 6 ? 'Muito bem. Agora teste nas questões de Linguagens.' : 'Volte ao laboratório lá em cima, reveja as pistas e jogue de novo.';
      opcoes.hidden = true; $('proxima').textContent = '↺ Jogar de novo'; $('proxima').hidden = false;
      return;
    }
    opcoes.hidden = false; $('proxima').hidden = true; $('proxima').textContent = 'Próxima frase →';
    $('placar').textContent = `Frase ${atual + 1} de ${FRASES.length} · ${acertos} certa(s)`;
    $('frase-jogo').textContent = `“${FRASES[atual][0]}”`;
    $('recado-jogo').textContent = 'Toque na figura que aparece na frase.';
  }
  opcoes.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || respondida) return;
    respondida = true;
    const [, certa, porque] = FRASES[atual], acertou = b.textContent === certa;
    if (acertou) acertos++;
    b.classList.add(acertou ? 'au-certa' : 'au-errada');
    botoes.forEach(x => { if (x.textContent === certa) x.classList.add('au-certa'); x.disabled = true; });
    $('recado-jogo').textContent = `${acertou ? 'Isso!' : 'É ' + certa.toLowerCase() + '.'} ${porque}`;
    $('proxima').hidden = false;
  });
  $('proxima').addEventListener('click', () => {
    if (atual >= FRASES.length) { atual = 0; acertos = 0; } else atual++;
    pergunta();
  });

  mostrar(0); pergunta();
  return () => {};
};
